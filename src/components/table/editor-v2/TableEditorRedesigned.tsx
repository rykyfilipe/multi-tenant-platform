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
		try {
			// Parse CSV file
			const text = await file.text();
			const lines = text.split("\n").filter((line) => line.trim());

			if (lines.length < 2) {
				throw new Error("CSV file must contain at least a header row and one data row");
			}

			// Parse header
			const headers = lines[0].split(";").map((h) => h.trim().replace(/^"|"$/g, ""));

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

			// Parse data rows
			const rows = [];
			for (let i = 1; i < lines.length; i++) {
				const line = lines[i];
				if (!line.trim()) continue;

				// Simple CSV parsing (handle quoted values)
				const values: string[] = [];
				let currentValue = "";
				let insideQuotes = false;

				for (let j = 0; j < line.length; j++) {
					const char = line[j];
					if (char === '"') {
						insideQuotes = !insideQuotes;
					} else if (char === ";" && !insideQuotes) {
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
					if (!value || value === "") continue;

					// For reference columns, we need to group values by base column
					if (mapping.isReference) {
						// Skip reference column details, will be handled by base column
						continue;
					}

					const column = columns.find((col) => col.id === mapping.columnId);
					if (!column) continue;

					// Convert value based on column type
					let processedValue: any = value;

					if (column.type === "number" || column.type === "integer" || column.type === "decimal") {
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

				if (cells.length > 0) {
					rows.push({ cells });
				}
			}

			if (rows.length === 0) {
				throw new Error("No valid data rows found in CSV file");
			}

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

			if (!response.ok) {
				throw new Error(result.error || "Failed to import data");
			}

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

			showAlert(
				`Successfully imported ${result.importedRows || 0} rows!${
					result.warnings?.length > 0 ? ` (${result.warnings.length} warnings)` : ""
				}`,
				"success",
			);
		} catch (error: any) {
			console.error("Import error:", error);
			showAlert(error.message || "Failed to import data", "error");
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
			<div className='space-y-6 p-6'>
				<div className='flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4'>
					<div className='flex items-center gap-2'>
						<Skeleton className='h-6 w-6' />
						<Skeleton className='h-6 w-32' />
					</div>
					<div className='flex items-center gap-2'>
						<Skeleton className='h-9 w-24' />
						<Skeleton className='h-9 w-24' />
					</div>
				</div>

				<Card className='shadow-lg'>
					<CardContent className='p-6'>
						<div className='space-y-3'>
							{Array.from({ length: 3 }).map((_, rowIndex) => (
								<div key={rowIndex} className='flex gap-4 items-center py-2'>
									{Array.from({ length: 4 }).map((_, colIndex) => (
										<Skeleton key={colIndex} className='h-8 w-24' />
									))}
								</div>
							))}
						</div>
					</CardContent>
				</Card>
			</div>
		);
	}

	// Access check
	if (!tablePermissions.canReadTable()) {
		return (
			<div className='space-y-6'>
				<div className='text-center py-12'>
					<div className='text-muted-foreground'>
						<p className='text-lg font-medium mb-2'>Access Denied</p>
						<p className='text-sm'>You don't have permission to view this table.</p>
					</div>
				</div>
			</div>
		);
	}

	if (!table || !columns || !token || !user) return null;

	return (
		<div className='min-h-screen bg-gradient-to-br from-background via-background to-muted/20 relative'>
			{/* Hidden file input for import */}
			<input
				id='import-data-file-input'
				type='file'
				accept='.csv'
				onChange={handleFileSelect}
				className='hidden'
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

			{/* Mode Content */}
			<AnimatePresence mode='wait'>
				{mode === "schema" ? (
					<motion.div
						key='schema'
						initial={{ opacity: 0, x: -20 }}
						animate={{ opacity: 1, x: 0 }}
						exit={{ opacity: 0, x: 20 }}
						transition={{ duration: 0.2 }}>
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
						initial={{ opacity: 0, x: 20 }}
						animate={{ opacity: 1, x: 0 }}
						exit={{ opacity: 0, x: -20 }}
						transition={{ duration: 0.2 }}>
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

			{/* Unsaved Changes Footer */}
			<UnsavedChangesFooter
				unsavedChangesCount={unsavedChangesCount}
				changesDescription={`${pendingChangesCount} cell updates, ${pendingNewRowsCount} new rows`}
				onDiscard={discardPendingChanges}
				onSaveAll={savePendingChanges}
				isSaving={isSaving}
			/>
		</div>
	);
}

