/** @format */
"use client";

import { useState, useCallback } from "react";
import { Table, CreateColumnRequest, Column } from "@/types/database";
import { useApp } from "@/contexts/AppContext";
import { useDatabase } from "@/contexts/DatabaseContext";
import { useCurrentUserPermissions } from "@/hooks/useCurrentUserPermissions";
import { useTablePermissions } from "@/hooks/useTablePermissions";
import useTableRows from "@/hooks/useTableRows";
import useRowsTableEditor from "@/hooks/useRowsTableEditor";
import { useTableEditorShortcuts } from "@/hooks/useTableEditorShortcuts";
import { TableEditorHeader } from "./TableEditorHeader";
import { SchemaMode } from "./SchemaMode";
import { DataMode } from "./DataMode";
import { UnsavedChangesFooter } from "./UnsavedChangesFooter";
import { Skeleton } from "@/components/ui/skeleton";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { motion, AnimatePresence } from "framer-motion";
import { arrayMove } from "@dnd-kit/sortable";

interface Props {
	columns: Column[] | null;
	setColumns: (cols: Column[] | null | ((prev: Column[] | null) => Column[] | null)) => void;
	table: Table;
	refreshTable?: () => void;
}

export function TableEditorRedesigned({ table, columns, setColumns, refreshTable }: Props) {
	const { showAlert, token, user, tenant } = useApp();
	const { selectedDatabase, tables, setTables, setSelectedDatabase, databases, setDatabases } = useDatabase();
	const [mode, setMode] = useState<"schema" | "data">("data"); // Default to data mode
	const [selectedColumn, setSelectedColumn] = useState<Column | null>(null);
	const [searchQuery, setSearchQuery] = useState("");
	const [sortColumn, setSortColumn] = useState<string | null>(null);
	const [sortDirection, setSortDirection] = useState<"asc" | "desc">("asc");
	const [isAddingColumn, setIsAddingColumn] = useState(false);
	const [isUpdatingColumn, setIsUpdatingColumn] = useState(false);
	const [isExporting, setIsExporting] = useState(false);
	const [isImporting, setIsImporting] = useState(false);
	const [importFile, setImportFile] = useState<File | null>(null);
	const [activeFiltersCount, setActiveFiltersCount] = useState(0);
	const [importProgress, setImportProgress] = useState({
		show: false,
		status: 'idle' as 'idle' | 'parsing' | 'importing' | 'success' | 'error',
		message: '',
		current: 0,
		total: 0,
		percentage: 0,
		warnings: [] as string[],
		errors: [] as string[],
	});

	// Permissions
	const { permissions: userPermissions, loading: permissionsLoading } = useCurrentUserPermissions();
	const tablePermissions = useTablePermissions(
		table.id,
		userPermissions?.tablePermissions || [],
		userPermissions?.columnsPermissions || [],
	);

	const tenantId = tenant?.id;

	// Server-side pagination hook
	const {
		rows: paginatedRows,
		loading: rowsLoading,
		error: rowsError,
		pagination,
		fetchRows,
		refetch: refetchRows,
		applyFilters,
		globalSearch,
		filters,
		setRows,
		updateGlobalSearch,
		updateSorting,
		clearFilters,
	} = useTableRows(table.id?.toString() || "", 25);

	// Row editing hook
	const {
		editingCell,
		handleCancelEdit,
		handleEditCell,
		handleSaveCell,
		pendingChanges,
		pendingNewRows,
		pendingChangesCount,
		pendingNewRowsCount,
		isSaving,
		hasPendingChange,
		getPendingValue,
		savePendingChanges,
		discardPendingChanges,
		addNewRow,
		removeLocalRow,
	} = useRowsTableEditor({
		table,
		onCellsUpdated: (updatedData) => {
			// Handle updated cells/rows
			const isNewRow = (item: any) => item.cells && Array.isArray(item.cells) && item.id && item.tableId;
			const newRows = updatedData.filter(isNewRow);
			const cellUpdates = updatedData.filter((item: any) => !isNewRow(item));

			if (newRows.length > 0) {
				setRows((currentRows: any[]) => {
					const filteredRows = currentRows.filter((row) => !row.id.toString().startsWith("temp_"));
					return [...newRows, ...filteredRows];
				});
			}

			if (cellUpdates.length > 0) {
				setRows((currentRows: any[]) =>
					currentRows.map((row) => {
						const updatedRow = { ...row, cells: [...row.cells] };
						cellUpdates.forEach((updatedCell) => {
							const normalizedCell = {
								...updatedCell,
								columnId: updatedCell.columnId || updatedCell.column?.id,
								rowId: updatedCell.rowId,
								value: updatedCell.value,
								id: updatedCell.id,
							};

							if (updatedRow.id.toString() === normalizedCell.rowId.toString()) {
								const cellIndex = updatedRow.cells.findIndex(
									(cell: any) => cell.columnId.toString() === normalizedCell.columnId.toString(),
								);

								if (cellIndex >= 0) {
									updatedRow.cells[cellIndex] = {
										...updatedRow.cells[cellIndex],
										value: normalizedCell.value,
										id: updatedRow.cells[cellIndex].id,
										columnId: updatedRow.cells[cellIndex].columnId,
										rowId: updatedRow.cells[cellIndex].rowId,
									};
								}
							}
						});
						return updatedRow;
					}),
				);
			}
		},
		onError: (error: string) => {
			console.error("❌ Batch save error:", error);
			refetchRows();
		},
	});

	// Keyboard shortcuts - MUST be called before any conditional returns
	useTableEditorShortcuts({
		onSave: pendingChangesCount > 0 ? savePendingChanges : undefined,
		onNewColumn: mode === "schema" && tablePermissions.canEditTable() ? () => setSelectedColumn(null) : undefined,
		onNewRow: mode === "data" && tablePermissions.canEditTable() ? () => {
			// Trigger add row in data mode
		} : undefined,
		onUndo: pendingChangesCount > 0 ? discardPendingChanges : undefined,
		onToggleMode: () => setMode(mode === "schema" ? "data" : "schema"),
		enabled: true,
	});

	// Column management functions
	const handleAddColumn = async (columnData: CreateColumnRequest) => {
		if (!token || !tenantId) {
			showAlert("Missing required information", "error");
			return;
		}

		if (!tablePermissions.canEditTable()) {
			showAlert("You don't have permission to add columns to this table", "error");
			return;
		}

		setIsAddingColumn(true);

		// Optimistic update
		const tempColumn = {
			id: Date.now(),
			...columnData,
			tableId: table.id,
			createdAt: new Date().toISOString(),
			isOptimistic: true,
		} as Column;

		if (setColumns && columns) {
			setColumns([...columns, tempColumn]);
		}

		showAlert("Column added!", "success");

		try {
			const response = await fetch(
				`/api/tenants/${tenantId}/databases/${table.databaseId}/tables/${table.id}/columns`,
				{
					method: "POST",
					headers: {
						"Content-Type": "application/json",
						Authorization: `Bearer ${token}`,
					},
					body: JSON.stringify({ columns: [columnData] }),
				},
			);

			if (response.ok) {
				const createdColumns = await response.json();

				if (setColumns && columns) {
					setColumns((prev: Column[] | null) =>
						prev
							? prev.map((col: Column) =>
									col.id === tempColumn.id
										? ({ ...createdColumns[0], isOptimistic: false } as Column)
										: col,
							  )
							: null,
					);
				}
			} else {
				const errorData = await response.json();
				throw new Error(errorData.error || "Failed to add column");
			}
		} catch (error: any) {
			console.error("Error adding column:", error);

			// Revert optimistic update
			if (setColumns && columns) {
				setColumns((prev: Column[] | null) => (prev ? prev.filter((col: Column) => col.id !== tempColumn.id) : null));
			}

			showAlert(error.message || "Failed to add column. Please try again.", "error");
		} finally {
			setIsAddingColumn(false);
		}
	};

	const handleDuplicateColumn = async (columnToDuplicate: Column) => {
		if (!token || !tenantId) {
			showAlert("Missing required information", "error");
			return;
		}

		if (!tablePermissions.canEditTable()) {
			showAlert("You don't have permission to duplicate columns", "error");
			return;
		}

		// Create column data from the duplicate
		const duplicateColumnData: CreateColumnRequest = {
			name: `${columnToDuplicate.name} (copy)`,
			type: columnToDuplicate.type,
			required: columnToDuplicate.required || false,
			unique: columnToDuplicate.unique || false,
			defaultValue: columnToDuplicate.defaultValue,
			referenceTableId: columnToDuplicate.referenceTableId,
			customOptions: columnToDuplicate.customOptions,
			order: (columns?.length || 0) + 1,
		};

		await handleAddColumn(duplicateColumnData);
		showAlert(`Column "${columnToDuplicate.name}" duplicated successfully!`, "success");
	};

	const handleUpdateColumn = async (updatedColumn: Partial<Column>) => {
		if (!token || !tenantId || !selectedColumn) {
			showAlert("Missing required information", "error");
			return;
		}

		if (!tablePermissions.canEditTable()) {
			showAlert("You don't have permission to edit columns in this table", "error");
			return;
		}

		setIsUpdatingColumn(true);

		// Optimistic update
		const originalColumn = { ...selectedColumn };
		const optimisticColumn = { ...selectedColumn, ...updatedColumn, isOptimistic: true };

		if (setColumns && columns) {
			setColumns(columns.map((col) => (col.id === selectedColumn.id ? optimisticColumn : col)));
		}

		showAlert("Column updated!", "success");
		setSelectedColumn(null);

		try {
			const response = await fetch(
				`/api/tenants/${tenantId}/databases/${table.databaseId}/tables/${table.id}/columns/${selectedColumn.id}`,
				{
					method: "PATCH",
					headers: {
						"Content-Type": "application/json",
						Authorization: `Bearer ${token}`,
					},
					body: JSON.stringify(updatedColumn),
				},
			);

			if (response.ok) {
				const updatedColumnData = await response.json();

				if (setColumns && columns) {
					setColumns(
						columns.map((col) =>
							col.id === selectedColumn.id ? { ...updatedColumnData, isOptimistic: false } : col,
						),
					);
				}
			} else {
				const errorData = await response.json();
				throw new Error(errorData.error || "Failed to update column");
			}
		} catch (error: any) {
			console.error("Error updating column:", error);

			// Revert optimistic update
			if (setColumns && columns) {
				setColumns(columns.map((col) => (col.id === selectedColumn.id ? originalColumn : col)));
			}

			showAlert(error.message || "Failed to update column. Please try again.", "error");
		} finally {
			setIsUpdatingColumn(false);
		}
	};

	const handleDeleteColumn = async (columnId: string) => {
		if (!token || !tenantId) {
			showAlert("Missing required information", "error");
			return;
		}

		if (!tablePermissions.canEditTable()) {
			showAlert("You don't have permission to delete columns from this table", "error");
			return;
		}

		// Optimistic update
		const columnToDelete = columns?.find((col) => col.id.toString() === columnId);

		if (setColumns && columns) {
			setColumns(columns.filter((col) => col.id.toString() !== columnId));
		}

		showAlert("Column deleted!", "success");
		setSelectedColumn(null);

		try {
			const response = await fetch(
				`/api/tenants/${tenantId}/databases/${table.databaseId}/tables/${table.id}/columns/${columnId}`,
				{
					method: "DELETE",
					headers: {
						Authorization: `Bearer ${token}`,
					},
				},
			);

			if (!response.ok) {
				const errorData = await response.json();
				throw new Error(errorData.error || "Failed to delete column");
			}
		} catch (error: any) {
			console.error("Error deleting column:", error);

			// Revert optimistic update
			if (setColumns && columns && columnToDelete) {
				setColumns([...columns, columnToDelete]);
			}

			showAlert(error.message || "Failed to delete column. Please try again.", "error");
		}
	};

	// Column reordering handler
	const handleReorderColumns = async (fromIndex: number, toIndex: number) => {
		if (!token || !tenantId || !columns) {
			showAlert("Missing required information", "error");
			return;
		}

		if (!tablePermissions.canEditTable()) {
			showAlert("You don't have permission to reorder columns", "error");
			return;
		}

		console.log("🔄 Reordering columns:", { fromIndex, toIndex });

		// Optimistic update: Reorder columns locally
		const reorderedColumns = arrayMove(columns, fromIndex, toIndex);
		
		// Update order field for each column
		const columnsWithNewOrder = reorderedColumns.map((col, index) => ({
			...col,
			order: index + 1,
		}));

		setColumns(columnsWithNewOrder);
		showAlert("Columns reordered!", "success");

		// Persist to backend - batch update all column orders
		try {
			const updates = columnsWithNewOrder.map((col) => ({
				id: col.id,
				order: col.order,
			}));

			const response = await fetch(
				`/api/tenants/${tenantId}/databases/${table.databaseId}/tables/${table.id}/columns/batch-update`,
				{
					method: "PATCH",
					headers: {
						"Content-Type": "application/json",
						Authorization: `Bearer ${token}`,
					},
					body: JSON.stringify({ updates }),
				},
			);

			if (!response.ok) {
				// If endpoint doesn't exist, update each column individually
				if (response.status === 404) {
					console.log("Batch endpoint not found, updating individually...");
					
					// Update each column individually
					for (const col of columnsWithNewOrder) {
						await fetch(
							`/api/tenants/${tenantId}/databases/${table.databaseId}/tables/${table.id}/columns/${col.id}`,
							{
								method: "PATCH",
								headers: {
									"Content-Type": "application/json",
									Authorization: `Bearer ${token}`,
								},
								body: JSON.stringify({ order: col.order }),
							},
						);
					}
					showAlert("Column order saved successfully!", "success");
				} else {
					throw new Error("Failed to update column order");
				}
			} else {
				showAlert("Column order saved successfully!", "success");
			}

			// Refresh table to ensure consistency
			if (refreshTable) {
				refreshTable();
			}
		} catch (error: any) {
			console.error("Error reordering columns:", error);

			// Revert optimistic update
			setColumns(columns);
			showAlert("Failed to save column order. Changes reverted.", "error");
		}
	};

	// Row management
	const handleDeleteRow = async (rowId: string) => {
		if (!tablePermissions.canDeleteTable()) {
			showAlert("You don't have permission to delete rows in this table", "error");
			return;
		}

		if (rowId.startsWith("temp_")) {
			removeLocalRow(rowId);
			showAlert("Local row removed from batch", "info");
			return;
		}

		if (!token || !tenantId) {
			showAlert("Missing required information", "error");
			return;
		}

		const rowToDelete = paginatedRows?.find((row) => row.id.toString() === rowId);

		setRows((currentRows) => currentRows.filter((row) => row.id.toString() !== rowId));
		showAlert("Row deleted!", "success");

		try {
			const response = await fetch(
				`/api/tenants/${tenantId}/databases/${table.databaseId}/tables/${table.id}/rows/${rowId}`,
				{
					method: "DELETE",
					headers: {
						Authorization: `Bearer ${token}`,
					},
				},
			);

			if (!response.ok) {
				const errorData = await response.json();
				throw new Error(errorData.error || "Failed to delete row");
			}
		} catch (error: any) {
			console.error("Error deleting row:", error);

			if (rowToDelete) {
				setRows((currentRows) => [rowToDelete, ...currentRows]);
			}

			showAlert(error.message || "Failed to delete row. Please try again.", "error");
		}
	};

	const handleDeleteMultipleRows = async (rowIds: string[]) => {
		if (!tablePermissions.canDeleteTable()) {
			showAlert("You don't have permission to delete rows in this table", "error");
			return;
		}

		const localRowIds = rowIds.filter((id) => id.startsWith("temp_"));
		const existingRowIds = rowIds.filter((id) => !id.startsWith("temp_"));

		if (localRowIds.length > 0) {
			localRowIds.forEach((id) => removeLocalRow(id));
			showAlert(`${localRowIds.length} local rows removed from batch`, "info");
		}

		if (existingRowIds.length === 0) return;

		if (!token || !tenantId) {
			showAlert("Missing required information", "error");
			return;
		}

		const rowsToDelete = paginatedRows?.filter((row) => existingRowIds.includes(row.id.toString())) || [];

		setRows((currentRows) => currentRows.filter((row) => !existingRowIds.includes(row.id.toString())));
		showAlert(`${existingRowIds.length} rows deleted!`, "success");

		try {
			const deletePromises = existingRowIds.map((rowId) =>
				fetch(`/api/tenants/${tenantId}/databases/${table.databaseId}/tables/${table.id}/rows/${rowId}`, {
					method: "DELETE",
					headers: {
						Authorization: `Bearer ${token}`,
					},
				}),
			);

			const responses = await Promise.all(deletePromises);
			const failedDeletes = responses.filter((response) => !response.ok);

			if (failedDeletes.length > 0) {
				const failedRowIds = existingRowIds.filter((_, index) => !responses[index].ok);
				const failedRows = rowsToDelete.filter((row) => failedRowIds.includes(row.id.toString()));

				if (failedRows.length > 0) {
					setRows((currentRows) => [...failedRows, ...currentRows]);
				}

				showAlert(`Failed to delete ${failedDeletes.length} out of ${existingRowIds.length} rows`, "error");
			}
		} catch (error: any) {
			console.error("Error deleting multiple rows:", error);

			if (rowsToDelete.length > 0) {
				setRows((currentRows) => [...rowsToDelete, ...currentRows]);
			}

			showAlert(error.message || "Failed to delete rows. Please try again.", "error");
		}
	};

	// Search & Sort handlers
	const handleSearch = useCallback(
		(query: string) => {
			setSearchQuery(query);
			updateGlobalSearch(query);
		},
		[updateGlobalSearch],
	);

	const handleSort = useCallback(
		(columnId: string) => {
			const newDirection = sortColumn === columnId && sortDirection === "asc" ? "desc" : "asc";
			setSortColumn(columnId);
			setSortDirection(newDirection);
			updateSorting(columnId, newDirection);
		},
		[sortColumn, sortDirection, updateSorting],
	);

	// Import/Export handlers
	const handleExportData = useCallback(async () => {
		if (!token || !tenantId) {
			showAlert("Missing authentication", "error");
			return;
		}

		if (!tablePermissions.canReadTable()) {
			showAlert("You don't have permission to export data from this table", "error");
			return;
		}

		setIsExporting(true);
		try {
			const queryParams = new URLSearchParams({
				format: "csv",
				limit: "10000",
			});

			// Add global search if present
			if (globalSearch) {
				queryParams.append("globalSearch", globalSearch);
			}

			// Add filters if present
			if (filters && filters.length > 0) {
				queryParams.append("filters", JSON.stringify(filters));
			}

			const url = `/api/tenants/${tenantId}/databases/${table.databaseId}/tables/${table.id}/rows/export?${queryParams.toString()}`;

			const response = await fetch(url, {
				method: "GET",
				headers: {
					Authorization: `Bearer ${token}`,
				},
			});

			if (!response.ok) {
				const errorData = await response.json();
				throw new Error(errorData.error || "Failed to export data");
			}

			// Get the CSV content and download it
			const blob = await response.blob();
			const downloadUrl = window.URL.createObjectURL(blob);
			const link = document.createElement("a");
			link.href = downloadUrl;
			link.download = `${table.name}_export_${new Date().toISOString().split("T")[0]}.csv`;
			document.body.appendChild(link);
			link.click();
			document.body.removeChild(link);
			window.URL.revokeObjectURL(downloadUrl);

			showAlert("Data exported successfully!", "success");
		} catch (error: any) {
			console.error("Export error:", error);
			showAlert(error.message || "Failed to export data", "error");
		} finally {
			setIsExporting(false);
		}
	}, [token, tenantId, table, tablePermissions, showAlert, globalSearch, filters]);

	const processImportFile = useCallback(async (file: File) => {
		if (!token || !tenantId || !columns) {
			showAlert("Missing required information", "error");
			return;
		}

		if (!tablePermissions.canEditTable()) {
			showAlert("You don't have permission to import data into this table", "error");
			return;
		}

		setIsImporting(true);
		setImportProgress({
			show: true,
			status: 'parsing',
			message: 'Reading CSV file...',
			current: 0,
			total: 0,
			percentage: 0,
			warnings: [],
			errors: [],
		});

		let progressInterval: NodeJS.Timeout | null = null;

		try {
			// Parse CSV file
			const text = await file.text();
			const lines = text.split("\n").filter((line) => line.trim());

			if (lines.length < 2) {
				throw new Error("CSV file must contain at least a header row and one data row");
			}

			// Auto-detect separator (try common separators)
			const detectSeparator = (headerLine: string): string => {
				const separators = [';', ',', '\t', '|'];
				let bestSeparator = ';';
				let maxColumns = 0;

				for (const sep of separators) {
					const count = headerLine.split(sep).length;
					if (count > maxColumns) {
						maxColumns = count;
						bestSeparator = sep;
					}
				}

				console.log('🔍 CSV Separator detected:', bestSeparator, 'Columns found:', maxColumns);
				return bestSeparator;
			};

			const separator = detectSeparator(lines[0]);

			// Parse header
			const headers = lines[0].split(separator).map((h) => h.trim().replace(/^"|"$/g, ""));

			console.log('📋 CSV Headers found:', headers);
			console.log('📋 Table Columns:', columns.map(c => c.name));

			// Map headers to column IDs
			const columnMapping = headers.map((header) => {
				// Handle reference column headers (e.g., "Product_Name")
				const refMatch = header.match(/^(.+?)_(.+)$/);
				if (refMatch) {
					const [, baseName] = refMatch;
					const column = columns.find((col) => col.name === baseName);
					return column ? { columnId: column.id, header, isReference: true } : null;
				}

				const column = columns.find((col) => col.name === header);
				return column ? { columnId: column.id, header, isReference: false } : null;
			});

			// Check for unmapped columns
			const unmappedHeaders = headers.filter((_, index) => !columnMapping[index]);
			if (unmappedHeaders.length > 0) {
				console.warn('⚠️ Unmapped headers:', unmappedHeaders);
			}

			const mappedHeaders = headers.filter((_, index) => columnMapping[index]);
			console.log('✅ Mapped headers:', mappedHeaders);

			// Parse data rows
			const rows = [];
			for (let i = 1; i < lines.length; i++) {
				const line = lines[i];
				if (!line.trim()) continue;

				// Parse CSV line with detected separator (handle quoted values)
				const values: string[] = [];
				let currentValue = "";
				let insideQuotes = false;

				for (let j = 0; j < line.length; j++) {
					const char = line[j];
					if (char === '"') {
						insideQuotes = !insideQuotes;
					} else if (char === separator && !insideQuotes) {
						values.push(currentValue.trim().replace(/^"|"$/g, ""));
						currentValue = "";
					} else {
						currentValue += char;
					}
				}
				values.push(currentValue.trim().replace(/^"|"$/g, ""));

				const cells = [];
				for (let j = 0; j < values.length; j++) {
					const mapping = columnMapping[j];
					if (!mapping) continue;

					const value = values[j];
					
					// Allow empty values for non-required columns
					// Skip reference column details
					if (mapping.isReference) {
						continue;
					}

					const column = columns.find((col) => col.id === mapping.columnId);
					if (!column) continue;

					// Convert value based on column type (even if empty, for defaults)
					let processedValue: any = value;

					if (!value || value === "") {
						// Use null for empty values, backend will handle defaults
						processedValue = null;
					} else if (column.type === "number" || column.type === "integer" || column.type === "decimal") {
						processedValue = value ? parseFloat(value.replace(",", ".")) : null;
					} else if (column.type === "boolean") {
						processedValue = value === "✓" || value === "true" || value === "1";
					} else if (column.type === "date" || column.type === "datetime") {
						processedValue = value ? new Date(value).toISOString() : null;
					}

					cells.push({
						columnId: mapping.columnId,
						value: processedValue,
					});
				}

				// Add row even if some cells are empty (backend validation will handle required fields)
				if (cells.length > 0) {
					rows.push({ cells });
				}
			}

			if (rows.length === 0) {
				throw new Error(
					`No valid data rows found in CSV file.\n\n` +
					`Detected separator: "${separator}"\n` +
					`CSV headers: ${headers.join(', ')}\n` +
					`Table columns: ${columns.map(c => c.name).join(', ')}\n\n` +
					`Make sure your CSV headers match your table column names exactly.`
				);
			}

			console.log(`✅ Parsed ${rows.length} rows for import`);

			// Update progress: Parsed successfully
			setImportProgress(prev => ({
				...prev,
				status: 'importing',
				message: `Importing ${rows.length} rows...`,
				total: rows.length,
				current: 0,
				percentage: 0,
			}));

			// Simulate progress updates during import (for better UX)
			progressInterval = setInterval(() => {
				setImportProgress(prev => {
					if (prev.percentage >= 90) {
						if (progressInterval) clearInterval(progressInterval);
						return prev;
					}
					const increment = Math.random() * 15 + 5; // Random increment between 5-20%
					const newPercentage = Math.min(prev.percentage + increment, 90);
					const estimatedCurrent = Math.floor((newPercentage / 100) * prev.total);
					return {
						...prev,
						percentage: newPercentage,
						current: estimatedCurrent,
					};
				});
			}, 500); // Update every 500ms

			// Send import request
			const response = await fetch(
				`/api/tenants/${tenantId}/databases/${table.databaseId}/tables/${table.id}/rows/import`,
				{
					method: "POST",
					headers: {
						"Content-Type": "application/json",
						Authorization: `Bearer ${token}`,
					},
					body: JSON.stringify({ rows }),
				},
			);

			const result = await response.json();

			// Stop progress simulation
			if (progressInterval) clearInterval(progressInterval);

			if (!response.ok) {
				setImportProgress(prev => ({
					...prev,
					status: 'error',
					message: result.error || "Failed to import data",
					percentage: 0,
					errors: result.details || [result.error || "Unknown error"],
				}));
				return;
			}

			// Update progress: Import completed
			setImportProgress(prev => ({
				...prev,
				status: 'success',
				message: `Successfully imported ${result.importedRows || 0} rows!`,
				current: result.importedRows || 0,
				total: result.importedRows || 0,
				percentage: 100,
				warnings: result.warnings || [],
				errors: result.errors || [],
			}));

			// Update local state with imported rows (optimistic update only)
			if (result.importedRowsData && result.importedRowsData.length > 0) {
				setRows((currentRows) => [...result.importedRowsData, ...currentRows]);
			}

			// Clear import file
			setImportFile(null);
			
			// Reset file input
			const fileInput = document.getElementById("import-data-file-input") as HTMLInputElement;
			if (fileInput) {
				fileInput.value = "";
			}

			// Auto-close success dialog after 3 seconds
			setTimeout(() => {
				setImportProgress(prev => ({ ...prev, show: false }));
			}, 3000);

		} catch (error: any) {
			console.error("Import error:", error);
			// Make sure to clear progress interval on error
			if (progressInterval) clearInterval(progressInterval);
			
			setImportProgress(prev => ({
				...prev,
				status: 'error',
				message: error.message || "Failed to import data",
				percentage: 0,
				errors: [error.message || "Unknown error"],
			}));
		} finally {
			setIsImporting(false);
		}
	}, [token, tenantId, table, tablePermissions, showAlert, columns, setRows]);

	const handleImportData = useCallback(async () => {
		if (!importFile) {
			showAlert("Please select a file to import", "error");
			return;
		}
		await processImportFile(importFile);
	}, [importFile, processImportFile, showAlert]);

	const handleFileSelect = useCallback(
		async (event: React.ChangeEvent<HTMLInputElement>) => {
			const file = event.target.files?.[0];
			if (file) {
				if (file.type !== "text/csv" && !file.name.endsWith(".csv")) {
					showAlert("Please select a CSV file", "error");
					return;
				}
				setImportFile(file);
				
				// Process import immediately after file selection
				await processImportFile(file);
			}
		},
		[showAlert, processImportFile],
	);

	const handleSaveCellWrapper = useCallback(
		async (columnId: string, rowId: string, cellId: string, value: any) => {
			await handleSaveCell(
				columnId,
				rowId,
				cellId,
				paginatedRows,
				() => {},
				value,
				table,
				token || "",
				user,
				showAlert,
				{ keepEditing: false },
			);
		},
		[handleSaveCell, paginatedRows, table, token, user, showAlert],
	);

	// Calculate unsaved changes
	const unsavedChangesCount = pendingChangesCount + pendingNewRowsCount;
	const hasUnsavedChanges = unsavedChangesCount > 0;

	// Loading state
	if (rowsLoading || permissionsLoading) {
		return (
			<div className='min-h-screen bg-background'>
				<div className='max-w-[1600px] mx-auto px-4 sm:px-6 lg:px-8 py-8'>
					{/* Header Skeleton */}
					<div className='mb-8'>
						<div className='flex flex-col sm:flex-row justify-between items-start sm:items-center gap-6'>
							<div className='flex items-center gap-4'>
								<Skeleton className='h-12 w-12 rounded-xl' />
								<div className='space-y-2'>
									<Skeleton className='h-7 w-48' />
									<Skeleton className='h-4 w-32' />
								</div>
							</div>
							<div className='flex items-center gap-3'>
								<Skeleton className='h-10 w-24 rounded-lg' />
								<Skeleton className='h-10 w-24 rounded-lg' />
							</div>
						</div>
					</div>

					{/* Mode Toggle Skeleton */}
					<div className='mb-6 flex justify-center'>
						<Skeleton className='h-11 w-64 rounded-xl' />
					</div>

					{/* Content Skeleton */}
					<Card className='bg-card border-border shadow-lg overflow-hidden'>
						<CardContent className='p-6 sm:p-8'>
							<div className='space-y-6'>
								{/* Table Header */}
								<div className='flex items-center gap-4 pb-4 border-b border-border'>
									{Array.from({ length: 5 }).map((_, colIndex) => (
										<Skeleton key={colIndex} className='h-5 w-24' />
									))}
								</div>
								{/* Table Rows */}
								{Array.from({ length: 8 }).map((_, rowIndex) => (
									<div key={rowIndex} className='flex items-center gap-4 py-3'>
										{Array.from({ length: 5 }).map((_, colIndex) => (
											<Skeleton key={colIndex} className='h-9 w-24 rounded-md' />
										))}
									</div>
								))}
							</div>
						</CardContent>
					</Card>
				</div>
			</div>
		);
	}

	// Access check
	if (!tablePermissions.canReadTable()) {
		return (
			<div className='min-h-screen bg-background flex items-center justify-center'>
				<div className='max-w-md w-full mx-4'>
					<Card className='bg-card border-border shadow-xl'>
						<CardContent className='p-8 sm:p-12 text-center'>
							<div className='w-20 h-20 bg-gradient-to-br from-destructive/10 to-destructive/5 rounded-3xl flex items-center justify-center mx-auto mb-6'>
								<svg
									className='w-10 h-10 text-destructive'
									fill='none'
									viewBox='0 0 24 24'
									stroke='currentColor'>
									<path
										strokeLinecap='round'
										strokeLinejoin='round'
										strokeWidth={2}
										d='M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z'
									/>
								</svg>
							</div>
							<h2 className='text-2xl font-bold text-foreground mb-3'>Access Denied</h2>
							<p className='text-base text-muted-foreground mb-8'>
								You don't have permission to view this table. Please contact your administrator to request access.
							</p>
							<Button
								variant='outline'
								onClick={() => window.history.back()}
								className='w-full sm:w-auto'>
								Go Back
							</Button>
						</CardContent>
					</Card>
				</div>
			</div>
		);
	}

	if (!table || !columns || !token || !user) return null;

	return (
		<div className='min-h-screen bg-background relative'>
			{/* Hidden file input for import */}
			<input
				id='import-data-file-input'
				type='file'
				accept='.csv'
				onChange={handleFileSelect}
				className='hidden'
				aria-label='Import CSV file'
			/>

			{/* Header */}
			<TableEditorHeader
				table={table}
				mode={mode}
				setMode={setMode}
				columnsCount={columns?.length || 0}
				rowsCount={pagination?.totalRows || 0}
				hasUnsavedChanges={hasUnsavedChanges}
				unsavedChangesCount={unsavedChangesCount}
				onSaveAll={savePendingChanges}
				onExportData={handleExportData}
				onImportData={() => document.getElementById('import-data-file-input')?.click()}
				isSaving={isSaving}
				isExporting={isExporting}
				isImporting={isImporting}
				canEdit={tablePermissions.tablePermissions.canEdit}
			/>

			{/* Mode Content Container */}
			<div className='relative'>
				<AnimatePresence mode='wait'>
					{mode === "schema" ? (
						<motion.div
							key='schema'
							initial={{ opacity: 0, y: 10 }}
							animate={{ opacity: 1, y: 0 }}
							exit={{ opacity: 0, y: -10 }}
							transition={{ duration: 0.3, ease: "easeInOut" }}
							className='will-change-transform'>
							<SchemaMode
								table={table}
								columns={columns}
								selectedColumn={selectedColumn}
								onSelectColumn={setSelectedColumn}
								onAddColumn={handleAddColumn}
								onUpdateColumn={handleUpdateColumn}
								onDeleteColumn={handleDeleteColumn}
								onDuplicateColumn={handleDuplicateColumn}
								onReorderColumns={handleReorderColumns}
								tables={tables || []}
								canEdit={tablePermissions.canEditTable()}
								isSubmitting={isAddingColumn || isUpdatingColumn}
							/>
						</motion.div>
					) : (
						<motion.div
							key='data'
							initial={{ opacity: 0, y: 10 }}
							animate={{ opacity: 1, y: 0 }}
							exit={{ opacity: 0, y: -10 }}
							transition={{ duration: 0.3, ease: "easeInOut" }}
							className='will-change-transform'>
							<DataMode
								table={table}
								columns={columns}
								rows={paginatedRows || []}
								pendingNewRows={pendingNewRows || []}
								loading={rowsLoading}
								pagination={pagination}
								filters={filters}
								globalSearch={globalSearch}
								sortColumn={sortColumn}
								sortDirection={sortDirection}
								activeFiltersCount={activeFiltersCount}
								searchQuery={searchQuery}
								editingCell={editingCell}
								onEditCell={handleEditCell}
								onSaveCell={handleSaveCellWrapper}
								onCancelEdit={handleCancelEdit}
								hasPendingChange={hasPendingChange}
								getPendingValue={getPendingValue}
								onDeleteRow={handleDeleteRow}
								onDeleteMultipleRows={handleDeleteMultipleRows}
								onAddRow={(rowData) => {
									addNewRow(rowData);
									showAlert("Row added to batch - will be saved when you click Save Changes", "info");
								}}
								onSearch={handleSearch}
								onSort={handleSort}
								onApplyFilters={applyFilters}
								onClearFilters={clearFilters}
								onExport={handleExportData}
								onImport={handleImportData}
								onFileSelect={handleFileSelect}
								importFile={importFile}
								isExporting={isExporting}
								isImporting={isImporting}
								onPageChange={(page) => fetchRows(page, pagination?.pageSize || 25)}
								onPageSizeChange={(pageSize) => fetchRows(1, pageSize)}
								canEdit={tablePermissions.canEditTable()}
								canDelete={tablePermissions.canDeleteTable()}
								canRead={tablePermissions.canReadTable()}
								tables={tables || []}
								onRefreshReferenceData={() => {}}
								isSavingNewRow={isSaving}
							/>
						</motion.div>
					)}
				</AnimatePresence>
			</div>

			{/* Unsaved Changes Footer */}
			<UnsavedChangesFooter
				unsavedChangesCount={unsavedChangesCount}
				changesDescription={`${pendingChangesCount} cell updates, ${pendingNewRowsCount} new rows`}
				onDiscard={discardPendingChanges}
				onSaveAll={savePendingChanges}
				isSaving={isSaving}
			/>

			{/* Import Progress Dialog */}
			<AnimatePresence>
				{importProgress.show && (
					<motion.div
						initial={{ opacity: 0 }}
						animate={{ opacity: 1 }}
						exit={{ opacity: 0 }}
						className='fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50'
						onClick={(e) => {
							if (importProgress.status === 'success' || importProgress.status === 'error') {
								if (e.target === e.currentTarget) {
									setImportProgress(prev => ({ ...prev, show: false }));
								}
							}
						}}>
						<motion.div
							initial={{ scale: 0.9, opacity: 0, y: 20 }}
							animate={{ scale: 1, opacity: 1, y: 0 }}
							exit={{ scale: 0.9, opacity: 0, y: 20 }}
							transition={{ type: "spring", duration: 0.5 }}
							className='bg-card border border-border rounded-2xl shadow-2xl p-8 max-w-md w-full mx-4'>
							
							{/* Status Icon */}
							<div className='flex flex-col items-center mb-6'>
								{importProgress.status === 'parsing' && (
									<div className='w-16 h-16 rounded-full bg-primary/20 flex items-center justify-center mb-4'>
										<svg className='w-8 h-8 text-primary animate-spin' fill='none' viewBox='0 0 24 24'>
											<circle className='opacity-25' cx='12' cy='12' r='10' stroke='currentColor' strokeWidth='4' />
											<path className='opacity-75' fill='currentColor' d='M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z' />
										</svg>
									</div>
								)}
								{importProgress.status === 'importing' && (
									<div className='w-16 h-16 rounded-full bg-blue-500/20 flex items-center justify-center mb-4'>
										<svg className='w-8 h-8 text-blue-600 dark:text-blue-500 animate-pulse' fill='none' viewBox='0 0 24 24' stroke='currentColor'>
											<path strokeLinecap='round' strokeLinejoin='round' strokeWidth={2} d='M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12' />
										</svg>
									</div>
								)}
								{importProgress.status === 'success' && (
									<div className='w-16 h-16 rounded-full bg-green-500/20 flex items-center justify-center mb-4'>
										<svg className='w-8 h-8 text-green-600 dark:text-green-500' fill='none' viewBox='0 0 24 24' stroke='currentColor'>
											<path strokeLinecap='round' strokeLinejoin='round' strokeWidth={2} d='M5 13l4 4L19 7' />
										</svg>
									</div>
								)}
								{importProgress.status === 'error' && (
									<div className='w-16 h-16 rounded-full bg-destructive/20 flex items-center justify-center mb-4'>
										<svg className='w-8 h-8 text-destructive' fill='none' viewBox='0 0 24 24' stroke='currentColor'>
											<path strokeLinecap='round' strokeLinejoin='round' strokeWidth={2} d='M6 18L18 6M6 6l12 12' />
										</svg>
									</div>
								)}

								<h3 className='text-xl font-bold text-foreground text-center'>
									{importProgress.status === 'parsing' && 'Parsing CSV File'}
									{importProgress.status === 'importing' && 'Importing Data'}
									{importProgress.status === 'success' && 'Import Successful!'}
									{importProgress.status === 'error' && 'Import Failed'}
								</h3>
								<p className='text-sm text-muted-foreground text-center mt-2'>
									{importProgress.message}
								</p>
							</div>

							{/* Progress Bar */}
							{(importProgress.status === 'parsing' || importProgress.status === 'importing') && (
								<div className='mb-6'>
									<div className='w-full h-2 bg-muted rounded-full overflow-hidden'>
										<motion.div
											className='h-full bg-primary'
											initial={{ width: 0 }}
											animate={{ width: `${importProgress.percentage}%` }}
											transition={{ duration: 0.3 }}
										/>
									</div>
									{importProgress.total > 0 && (
										<p className='text-xs text-muted-foreground text-center mt-2'>
											{importProgress.current} / {importProgress.total} rows
										</p>
									)}
								</div>
							)}

							{/* Warnings */}
							{importProgress.warnings.length > 0 && (
								<div className='mb-4 p-4 bg-yellow-500/10 border border-yellow-500/20 rounded-lg'>
									<h4 className='text-sm font-semibold text-yellow-600 dark:text-yellow-500 mb-2 flex items-center gap-2'>
										<svg className='w-4 h-4' fill='none' viewBox='0 0 24 24' stroke='currentColor'>
											<path strokeLinecap='round' strokeLinejoin='round' strokeWidth={2} d='M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z' />
										</svg>
										Warnings ({importProgress.warnings.length})
									</h4>
									<div className='max-h-32 overflow-y-auto space-y-1'>
										{importProgress.warnings.slice(0, 5).map((warning, idx) => (
											<p key={idx} className='text-xs text-yellow-600 dark:text-yellow-500/80'>
												• {warning}
											</p>
										))}
										{importProgress.warnings.length > 5 && (
											<p className='text-xs text-yellow-600 dark:text-yellow-500/60 italic'>
												... and {importProgress.warnings.length - 5} more
											</p>
										)}
									</div>
								</div>
							)}

							{/* Errors */}
							{importProgress.errors.length > 0 && (
								<div className='mb-4 p-4 bg-destructive/10 border border-destructive/20 rounded-lg'>
									<h4 className='text-sm font-semibold text-destructive mb-2 flex items-center gap-2'>
										<svg className='w-4 h-4' fill='none' viewBox='0 0 24 24' stroke='currentColor'>
											<path strokeLinecap='round' strokeLinejoin='round' strokeWidth={2} d='M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z' />
										</svg>
										Errors ({importProgress.errors.length})
									</h4>
									<div className='max-h-32 overflow-y-auto space-y-1'>
										{importProgress.errors.slice(0, 5).map((error, idx) => (
											<p key={idx} className='text-xs text-destructive/80'>
												• {error}
											</p>
										))}
										{importProgress.errors.length > 5 && (
											<p className='text-xs text-destructive/60 italic'>
												... and {importProgress.errors.length - 5} more
											</p>
										)}
									</div>
								</div>
							)}

							{/* Action Buttons */}
							{(importProgress.status === 'success' || importProgress.status === 'error') && (
								<div className='flex gap-3 justify-end'>
									<Button
										onClick={() => setImportProgress(prev => ({ ...prev, show: false }))}
										variant={importProgress.status === 'success' ? 'default' : 'destructive'}
										className='min-w-24'>
										{importProgress.status === 'success' ? 'Done' : 'Close'}
									</Button>
								</div>
							)}
						</motion.div>
					</motion.div>
				)}
			</AnimatePresence>
		</div>
	);
}

