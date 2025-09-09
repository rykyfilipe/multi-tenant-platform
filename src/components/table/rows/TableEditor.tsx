/** @format */
"use client";

import {
	FormEvent,
	useEffect,
	useState,
	useCallback,
	useMemo,
	memo,
} from "react";
import { Table, Row, Column } from "@/types/database";
import { useApp } from "@/contexts/AppContext";
import { useDatabase } from "@/contexts/DatabaseContext";
import AddRowForm from "./AddRowForm";
import { TableView } from "./TableView";
import { TableFilters, FilterToggleButton } from "./TableFilters";
import SaveChangesButton from "./SaveChangesButton";
import useRowsTableEditor from "@/hooks/useRowsTableEditor";
import useTableRows from "@/hooks/useTableRows";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { X } from "lucide-react";
import { cn } from "@/lib/utils";
import Link from "next/link";
import { useCurrentUserPermissions } from "@/hooks/useCurrentUserPermissions";
import { useTablePermissions } from "@/hooks/useTablePermissions";
import { Database, Plus, Settings, CheckCircle } from "lucide-react";
import { motion } from "framer-motion";
import { fadeInUp, spinAnimation } from "@/lib/animations";

interface Props {
	table: Table | null;
	columns: Column[] | null;
	setColumns: (cols: Column[] | null) => void;
}

const TableEditor = memo(function TableEditor({
	table,
	columns,
	setColumns,
}: Props) {
	const [showSidebar, setShowSidebar] = useState(false);
	const [activeFiltersCount, setActiveFiltersCount] = useState(0);

	const { showAlert, token, user, tenant } = useApp();
	const { selectedDatabase, tables } = useDatabase();
	const tenantId = tenant?.id;
	const [showForm, setShowForm] = useState(false);
	const [serverError, setServerError] = useState<string | null>(null);
	const [cells, setCells] = useState<any[]>([]);
	const [isAddingRow, setIsAddingRow] = useState(false);
	const [deletingRows, setDeletingRows] = useState<Set<string>>(new Set());

	// State for local-only new rows (not saved to server yet)
	const [pendingNewRows, setPendingNewRows] = useState<any[]>([]);
	const [isSavingNewRows, setIsSavingNewRows] = useState(false);

	// Verificăm permisiunile utilizatorului
	const { permissions: userPermissions, loading: permissionsLoading } =
		useCurrentUserPermissions();
	const tablePermissions = useTablePermissions(
		table?.id || 0,
		userPermissions?.tablePermissions || [],
		userPermissions?.columnsPermissions || [],
	);

	// Use server-side pagination hook - only initialize when table is available
	const {
		rows: paginatedRows,
		loading: rowsLoading,
		error: rowsError,
		pagination,
		fetchRows,
		refetch: refetchRows,
		silentRefresh,
		applyFilters,
		globalSearch,
		filters,
		setRows,
	} = useTableRows(table?.id?.toString() || "", 25);

	// Debug logging pentru rows
	useEffect(() => {
		console.log("🔍 TableEditor - Rows state:", {
			paginatedRows,
			rowsLength: paginatedRows?.length,
			rowsLoading,
			rowsError,
			pagination,
			tableId: table?.id,
			table: table,
			hasToken: !!token,
			hasUser: !!user,
			hasTenant: !!tenant,
			hasSelectedDatabase: !!selectedDatabase
		});
	}, [paginatedRows, rowsLoading, rowsError, pagination, table?.id, table, token, user, tenant, selectedDatabase]);

	// Handler functions for TableView buttons
	const handleAddRow = useCallback(() => {
		setShowForm(true);
	}, []);

	const handleImport = useCallback(async (e: React.ChangeEvent<HTMLInputElement>) => {
		const file = e.target.files?.[0];
		if (!file) return;

		// Verifică tipul de fișier
		if (!file.name.toLowerCase().endsWith('.csv')) {
			showAlert("Please select a CSV file.", "error");
			return;
		}

		if (!tenantId || !token || !table) {
			showAlert("Missing authentication information", "error");
			return;
		}

		try {
			const text = await file.text();
			
			// Verifică dacă fișierul nu este gol
			if (!text.trim()) {
				showAlert("The CSV file is empty.", "error");
				return;
			}

			const lines = text.split("\n").filter(line => line.trim() !== "");
			
			if (lines.length < 2) {
				showAlert("The CSV file must contain at least a header and one data row.", "error");
				return;
			}

			// Detectează delimiterul automat
			const detectDelimiter = (text: string): string => {
				const lines = text.split('\n').slice(0, 5);
				const delimiters = [',', ';', '\t', '|'];
				let bestDelimiter = ',';
				let maxCount = 0;

				for (const delimiter of delimiters) {
					const counts = lines.map(line => (line.match(new RegExp(`\\${delimiter}`, 'g')) || []).length);
					const avgCount = counts.reduce((a, b) => a + b, 0) / counts.length;
					
					if (avgCount > maxCount && avgCount > 0) {
						maxCount = avgCount;
						bestDelimiter = delimiter;
					}
				}

				return bestDelimiter;
			};

			const delimiter = detectDelimiter(text);

			// Parsează header-ul
			const parseCSVLine = (line: string, delimiter: string): string[] => {
				const result: string[] = [];
				let current = '';
				let inQuotes = false;
				let i = 0;

				while (i < line.length) {
					const char = line[i];
					const nextChar = line[i + 1];

					if (char === '"') {
						if (inQuotes && nextChar === '"') {
							current += '"';
							i += 2;
						} else {
							inQuotes = !inQuotes;
							i++;
						}
					} else if (char === delimiter && !inQuotes) {
						result.push(current.trim());
						current = '';
						i++;
					} else {
						current += char;
						i++;
					}
				}

				result.push(current.trim());
				return result;
			};

			const header = parseCSVLine(lines[0], delimiter).map((h) => h.trim());

			// Verifică dacă header-ul nu este gol
			if (header.length === 0) {
				showAlert("The CSV file header is empty.", "error");
				return;
			}

			// Verificăm ca toate coloanele din header să existe
			const missingColumns = header.filter(h => !columns?.some(c => c.name === h));
			if (missingColumns.length > 0) {
				showAlert(
					`The CSV file contains unknown columns: ${missingColumns.join(', ')}. Please check the file format.`,
					"error",
				);
				return;
			}

			// Verifică dacă toate coloanele din tabel sunt prezente în CSV
			const csvColumns = header;
			const missingTableColumns = columns?.filter(c => !csvColumns.includes(c.name)) || [];
			if (missingTableColumns.length > 0) {
				showAlert(
					`The CSV file is missing these table columns: ${missingTableColumns.map(c => c.name).join(', ')}. Please add them to your CSV file.`,
					"error",
				);
				return;
			}

			const safeParse = (val: string): any => {
				let cleanVal = val.trim();
				cleanVal = cleanVal.replace(/\r?\n/g, "");

				if (cleanVal.startsWith('"') && cleanVal.endsWith('"')) {
					cleanVal = cleanVal.slice(1, -1);
				}

				if (cleanVal === "" || cleanVal === "null" || cleanVal === "undefined") {
					return null;
				}

				try {
					const parsed = JSON.parse(cleanVal);
					return parsed;
				} catch {
					return cleanVal;
				}
			};

			const parsedRows = lines.slice(1).map((line, index) => {
				try {
					const values = parseCSVLine(line, delimiter).map((v) => safeParse(v));

					if (values.length !== header.length) {
						console.warn(`Row ${index + 2}: Expected ${header.length} columns, got ${values.length}`);
						return null;
					}

					const cells = values.map((value, i) => {
						const col = columns?.find((c) => c.name === header[i]);
						if (!col) return null;

						return {
							columnId: col.id,
							value,
						};
					});

					if (cells.includes(null)) return null;

					return { cells: cells as { columnId: number; value: any }[] };
				} catch (error) {
					console.warn(`Error parsing row ${index + 2}:`, error);
					return null;
				}
			});

			const validRows = parsedRows.filter((r) => r !== null);

			if (validRows.length === 0) {
				const totalRows = lines.length - 1;
				showAlert(
					`No valid rows found for import. ${totalRows} rows were processed but none were valid. Please check your CSV file format and data.`,
					"error",
				);
				return;
			}

			const totalRows = lines.length - 1;
			const skippedRows = totalRows - validRows.length;
			if (skippedRows > 0) {
				showAlert(
					`Found ${validRows.length} valid rows out of ${totalRows} total rows. ${skippedRows} rows will be skipped.`,
					"info",
				);
			}

			const res = await fetch(
				`/api/tenants/${tenantId}/databases/${table.databaseId}/tables/${table.id}/rows/import`,
				{
					method: "POST",
					headers: {
						"Content-Type": "application/json",
						Authorization: `Bearer ${token}`,
					},
					body: JSON.stringify({ rows: validRows }),
				},
			);

			if (!res.ok) {
				const errorData = await res.json();
				if (res.status === 400) {
					let errorMessage = errorData.error || "Import failed";

					if (errorData.summary) {
						const summary = errorData.summary;
						errorMessage = `Import failed: ${summary.totalRows} rows processed, ${summary.validRows} valid, ${summary.invalidRows} invalid`;

						if (errorData.details && errorData.details.length > 0) {
							errorMessage += `\n\nFirst few errors:\n${errorData.details
								.slice(0, 3)
								.join("\n")}`;
						}
					} else if (errorData.details) {
						errorMessage = `Validation failed:\n${errorData.details
							.slice(0, 5)
							.join("\n")}`;
					}

					showAlert(errorMessage, "error");
				} else {
					showAlert(
						"Import failed: " + (errorData.error || "Unknown error"),
						"error",
					);
				}
			} else {
				const data = await res.json();

				if (res.status === 207) {
					const warningMessage = data.warnings
						? `Import completed with warnings: ${data.warnings.join("; ")}`
						: data.message || "Import completed with warnings";
					showAlert(warningMessage, "warning");
				} else {
					showAlert(
						`Successfully imported ${data.importedRows || 0} rows!`,
						"success",
					);
				}

				refetchRows();
			}
		} catch (err: any) {
			showAlert("Failed to import data. Please try again.", "error");
		} finally {
			// Reset input-ul de fișier
			const fileInput = document.getElementById('import-csv') as HTMLInputElement;
			if (fileInput) {
				fileInput.value = "";
			}
		}
	}, [tenantId, token, table, columns, showAlert, refetchRows]);

	const handleExport = useCallback(async () => {
		if (!tenantId || !token || !table) return;

		try {
			// Build query parameters for export
			const params = new URLSearchParams({
				format: "csv",
				limit: "10000",
			});

			if (globalSearch && globalSearch.trim()) {
				params.append("globalSearch", globalSearch.trim());
			}

			if (filters && filters.length > 0) {
				params.append("filters", JSON.stringify(filters));
			}

			const exportUrl = new URL(
				`/api/tenants/${tenantId}/databases/${table.databaseId}/tables/${table.id}/rows/export`,
				window.location.origin,
			);

			// Add query parameters
			exportUrl.search = params.toString();

			// Fetch CSV data with timeout
			const controller = new AbortController();
			const timeoutId = setTimeout(() => controller.abort(), 30000); // 30 second timeout

			const response = await fetch(exportUrl, {
				headers: {
					Authorization: `Bearer ${token}`,
				},
				signal: controller.signal,
			});

			clearTimeout(timeoutId);

			if (!response.ok) {
				throw new Error(`Export failed: ${response.status}`);
			}

			// Get CSV content and create download
			const csvContent = await response.text();

			// Validate CSV content
			if (!csvContent || csvContent.trim().length === 0) {
				throw new Error("Export returned empty content");
			}

			const blob = new Blob([csvContent], {
				type: "text/csv;charset=utf-8;",
			});
			const url = window.URL.createObjectURL(blob);
			const a = document.createElement("a");
			a.href = url;
			a.download = `table_${table.id}_export_${
				new Date().toISOString().split("T")[0]
			}.csv`;
			a.click();
			window.URL.revokeObjectURL(url);

			showAlert("Export completed successfully!", "success");
		} catch (error: any) {
			console.error("Export error:", error);
			if (error.name === "AbortError") {
				showAlert(
					"Export timed out. Please try again with fewer filters.",
					"error",
				);
			} else {
				showAlert("Export failed. Please try again.", "error");
			}
		}
	}, [tenantId, token, table, globalSearch, filters, showAlert]);

	const handleFilter = useCallback(() => {
		setShowSidebar(!showSidebar);
	}, [showSidebar]);

	const handleImportClick = useCallback(() => {
		const fileInput = document.getElementById('import-csv') as HTMLInputElement;
		if (fileInput) {
			fileInput.click();
		}
	}, []);

	const {
		editingCell,
		handleCancelEdit,
		handleEditCell,
		handleSaveCell,
		pendingChanges,
		pendingChangesCount,
		isSaving,
		hasPendingChange,
		getPendingValue,
		savePendingChanges,
		discardPendingChanges,
	} = useRowsTableEditor({
		table,
		onCellsUpdated: (updatedCells) => {
			// Actualizează state-ul local cu celulele updatate
			setRows((currentRows: any[]) =>
				currentRows.map((row) => {
					const updatedRow = { ...row };
					updatedCells.forEach((updatedCell) => {
						if (updatedRow.id.toString() === updatedCell.rowId.toString()) {
							const cellIndex = updatedRow.cells.findIndex(
								(cell: any) => cell.id === updatedCell.id,
							);
							if (cellIndex >= 0) {
								updatedRow.cells[cellIndex] = updatedCell;
							}
						}
					});
					return updatedRow;
				}),
			);
		},
	});

	// Clear server error when cells change (user starts typing)
	useEffect(() => {
		if (serverError && cells.length > 0) {
			// Only clear error if user is actively typing (not on initial load)
			// Add a small delay to allow user to see the error first
			const timer = setTimeout(() => {
				setServerError(null);
			}, 2000); // 2 seconds delay

			return () => clearTimeout(timer);
		}
	}, [cells, serverError]);

	const handleAdd = useCallback(
		(e: FormEvent) => {
			e.preventDefault();

			// Verificăm dacă utilizatorul poate edita tabelul
			if (!tablePermissions.canEditTable()) {
				showAlert(
					"You don't have permission to add rows to this table",
					"error",
				);
				return;
			}

			// Prevent multiple submissions
			if (isAddingRow) return;

			// Clear any previous server errors
			setServerError(null);
			setIsAddingRow(true);

			// Create a temporary row ID for local-only row
			const tempRowId = `temp_${Date.now()}_${Math.random()
				.toString(36)
				.substr(2, 9)}`;

			// Create local-only row data
			const localRow = {
				id: tempRowId,
				tableId: table?.id || 0,
				createdAt: new Date().toISOString(),
				cells: cells.map((cell) => ({
					id: `temp_cell_${Date.now()}_${Math.random()
						.toString(36)
						.substr(2, 9)}`,
					rowId: tempRowId,
					columnId: cell.columnId,
					value: cell.value,
					column: columns?.find((col) => col.id === cell.columnId) || null,
				})),
				isLocalOnly: true, // Flag to identify local-only rows
				isPending: true, // Flag to show it's pending save
			};

			// Add row to local state only (both to main rows and pending rows)
			setRows((currentRows) => [localRow, ...currentRows]);
			setPendingNewRows((currentPending) => [...currentPending, localRow]);

			showAlert(
				"Row added locally. Click 'Save Changes' to persist to server.",
				"info",
			);
			setShowForm(false);
			setCells([]);
			setIsAddingRow(false);
		},
		[
			cells,
			setRows,
			isAddingRow,
			showAlert,
			tablePermissions,
			columns,
			table?.id,
		],
	);

	// Function to save all pending new rows to server
	const handleSaveNewRows = useCallback(async () => {
		if (!token || !tenantId || pendingNewRows.length === 0) return;

		setIsSavingNewRows(true);

		try {
			// Validate pending rows before sending
			const validationErrors: string[] = [];
			
			pendingNewRows.forEach((row, rowIndex) => {
				if (!row.cells || !Array.isArray(row.cells)) {
					validationErrors.push(`Row ${rowIndex + 1}: Invalid cell data`);
					return;
				}

				// Check required columns
				columns?.forEach((column) => {
					if (column.required) {
						const cell = row.cells.find((c: any) => c.columnId === column.id);
						if (!cell || cell.value === null || cell.value === undefined || cell.value === '') {
							validationErrors.push(`Row ${rowIndex + 1}: ${column.name} is required`);
						}
					}
				});
			});

			if (validationErrors.length > 0) {
				showAlert(
					`Validation errors found:\n${validationErrors.join('\n')}`,
					"error",
				);
				return;
			}

			// Prepare batch data for all pending rows
			const batchData = pendingNewRows.map((row) => ({
				cells: row.cells.map((cell: any) => ({
					columnId: cell.columnId,
					value: cell.value,
				})),
			}));

			console.log("Saving batch data:", batchData);

			const response = await fetch(
				`/api/tenants/${tenantId}/databases/${table?.databaseId || 0}/tables/${
					table?.id || 0
				}/rows/batch`,
				{
					method: "POST",
					headers: {
						"Content-Type": "application/json",
						Authorization: `Bearer ${token}`,
					},
					body: JSON.stringify({ rows: batchData }),
				},
			);

			if (response.ok) {
				const result = await response.json();
				const savedRows = result.rows || [];

				// Replace local rows with server rows
				setRows((currentRows) => {
					const updatedRows = [...currentRows];

					// Remove all pending rows
					const filteredRows = updatedRows.filter((row) => !row.isLocalOnly);

					// Add saved rows at the beginning
					return [...savedRows, ...filteredRows];
				});

				// Clear pending rows
				setPendingNewRows([]);

				showAlert(
					`Successfully saved ${savedRows.length} row(s) to server!`,
					"success",
				);

				// Update pagination if needed
				if (pagination) {
					const newTotalRows = pagination.totalRows + savedRows.length;
					// Refresh to get updated data
					await fetchRows(1, pagination.pageSize);
				}
			} else {
				let errorMessage = "Failed to save rows";
				try {
					const errorData = await response.json();
					errorMessage = errorData.error || errorData.message || errorMessage;
				} catch (parseError) {
					errorMessage = `HTTP ${response.status}: ${response.statusText}`;
				}
				
				console.error("Server error:", errorMessage);
				showAlert(errorMessage, "error");
			}
		} catch (error: any) {
			console.error("Error saving new rows:", error);
			const errorMessage = error.message || "Network error. Please check your connection and try again.";
			showAlert(errorMessage, "error");
		} finally {
			setIsSavingNewRows(false);
		}
	}, [
		token,
		tenantId,
		table?.databaseId,
		table?.id,
		pendingNewRows,
		setRows,
		showAlert,
		pagination,
		fetchRows,
		columns,
	]);

	// Function to discard all pending new rows
	const handleDiscardNewRows = useCallback(() => {
		if (pendingNewRows.length === 0) return;

		// Remove all local-only rows from main rows
		setRows((currentRows) => currentRows.filter((row) => !row.isLocalOnly));

		// Clear pending rows
		setPendingNewRows([]);

		showAlert(`Discarded ${pendingNewRows.length} unsaved row(s).`, "info");
	}, [pendingNewRows, setRows, showAlert]);

	const handleDelete = useCallback(
		async (rowId: string) => {
			// Verificăm dacă utilizatorul poate șterge rânduri
			if (!tablePermissions.canDeleteTable()) {
				showAlert(
					"You don't have permission to delete rows from this table",
					"error",
				);
				return;
			}

			// Prevent multiple deletions for the same row
			if (deletingRows.has(rowId)) return;

			// Check if it's a local-only row
			const rowToDelete = paginatedRows.find(
				(row) => row.id.toString() === rowId,
			);
			const isLocalRow = rowToDelete?.isLocalOnly;

			if (isLocalRow) {
				// For local rows, just remove them from state
				setRows((prevRows: any[]) =>
					prevRows.filter((row) => row.id.toString() !== rowId),
				);
				setPendingNewRows((prevPending) =>
					prevPending.filter((row) => row.id.toString() !== rowId),
				);
				showAlert("Local row removed.", "info");
				return;
			}

			// For server rows, proceed with normal deletion
			if (!token || !tenantId) return;

			let deletedRow: any = null;

			try {
				// Mark row as being deleted
				setDeletingRows((prev) => new Set(prev).add(rowId));

				// Store the row for potential rollback
				deletedRow = paginatedRows.find((row) => row.id.toString() === rowId);

				// Optimistic update: remove row immediately from local state
				setRows((prevRows: any[]) =>
					prevRows.filter((row) => row.id.toString() !== rowId),
				);

				const response = await fetch(
					`/api/tenants/${tenantId}/databases/${
						table?.databaseId || 0
					}/tables/${table?.id || 0}/rows/${rowId}`,
					{
						method: "DELETE",
						headers: {
							Authorization: `Bearer ${token}`,
						},
					},
				);

				if (!response.ok) {
					const errorData = await response.json();
					const errorMessage = errorData.error || "Failed to remove data row";
					throw new Error(errorMessage);
				}

				// Check if we need to adjust pagination after deletion
				if (pagination && pagination.totalRows > 1) {
					const newTotalRows = pagination.totalRows - 1;
					const newTotalPages = Math.ceil(newTotalRows / pagination.pageSize);

					// If current page is now beyond total pages, go to last page
					if (pagination.page > newTotalPages && newTotalPages > 0) {
						await fetchRows(newTotalPages, pagination.pageSize);
					}
					// No need to refetch - local state is already updated optimistically
				}

				// Nu mai facem silentRefresh(), folosim actualizarea optimistă
				// await silentRefresh();

				showAlert("Data row removed successfully", "success");
			} catch (error: any) {
				// Rollback: restore the deleted row in case of error
				if (deletedRow) {
					setRows((prevRows: any[]) => [deletedRow, ...prevRows]);
				}

				// Gestionează diferite tipuri de erori
				let errorMessage = "Failed to remove data row. Please try again.";

				if (error instanceof Error) {
					errorMessage = error.message;
				} else if (typeof error === "string") {
					errorMessage = error;
				} else if (error?.message) {
					errorMessage = error.message;
				}

				showAlert(errorMessage, "error");
			} finally {
				// Remove row from deleting set
				setDeletingRows((prev) => {
					const newSet = new Set(prev);
					newSet.delete(rowId);
					return newSet;
				});
			}
		},
		[
			tenantId,
			table?.databaseId || 0,
			table?.id || 0,
			token,
			showAlert,
			setRows,
			paginatedRows,
			pagination,
			fetchRows,
			tablePermissions,
		],
	);

	// Handle bulk delete operations
	const handleBulkDelete = useCallback(
		async (rowIds: string[]) => {
			if (!token || !tenantId || rowIds.length === 0) return;

			// Verificăm dacă utilizatorul poate șterge rânduri
			if (!tablePermissions.canDeleteTable()) {
				showAlert(
					"You don't have permission to delete rows from this table",
					"error",
				);
				return;
			}

			// Prevent multiple bulk deletions
			if (deletingRows.size > 0) return;

			let deletedRows: any[] = [];

			try {
				// Mark all rows as being deleted
				setDeletingRows(new Set(rowIds));

				// Store the rows for potential rollback
				deletedRows = paginatedRows.filter((row) =>
					rowIds.includes(row.id.toString()),
				);

				// Optimistic update: remove rows immediately from local state
				setRows((prevRows: any[]) =>
					prevRows.filter((row) => !rowIds.includes(row.id.toString())),
				);

				// Use the batch API endpoint for bulk deletion
				const response = await fetch(
					`/api/tenants/${tenantId}/databases/${
						table?.databaseId || 0
					}/tables/${table?.id || 0}/batch`,
					{
						method: "POST",
						headers: {
							"Content-Type": "application/json",
							Authorization: `Bearer ${token}`,
						},
						body: JSON.stringify({
							operations: rowIds.map((rowId) => ({
								operation: "delete",
								data: { rowId },
							})),
						}),
					},
				);

				if (!response.ok) {
					const errorData = await response.json();
					const errorMessage =
						errorData.error || "Failed to delete selected rows";
					throw new Error(errorMessage);
				}

				// Check if we need to adjust pagination after bulk deletion
				if (pagination && pagination.totalRows > rowIds.length) {
					const newTotalRows = pagination.totalRows - rowIds.length;
					const newTotalPages = Math.ceil(newTotalRows / pagination.pageSize);

					// If current page is now beyond total pages, go to last page
					if (pagination.page > newTotalPages && newTotalPages > 0) {
						await fetchRows(newTotalPages, pagination.pageSize);
					}
				}

				showAlert(
					`${rowIds.length} row${
						rowIds.length !== 1 ? "s" : ""
					} deleted successfully`,
					"success",
				);
			} catch (error: any) {
				// Rollback: restore the deleted rows in case of error
				if (deletedRows.length > 0) {
					setRows((prevRows: any[]) => [...deletedRows, ...prevRows]);
				}

				// Handle different types of errors
				let errorMessage = "Failed to delete selected rows. Please try again.";

				if (error instanceof Error) {
					errorMessage = error.message;
				} else if (typeof error === "string") {
					errorMessage = error;
				} else if (error?.message) {
					errorMessage = error.message;
				}

				showAlert(errorMessage, "error");
			} finally {
				// Clear deleting rows set
				setDeletingRows(new Set());
			}
		},
		[
			tenantId,
			table?.databaseId || 0,
			table?.id || 0,
			token,
			showAlert,
			setRows,
			paginatedRows,
			pagination,
			fetchRows,
			tablePermissions,
			deletingRows,
		],
	);

	const handleSaveCellWrapper = useCallback(
		async (columnId: string, rowId: string, cellId: string, value: any) => {
			console.log("🎯 handleSaveCellWrapper called:", {
				columnId,
				rowId,
				cellId,
				value,
			});

			if (!token) return;

			await handleSaveCell(
				columnId,
				rowId,
				cellId,
				paginatedRows,
				async (updatedCell?: any) => {
					console.log("✨ Optimistic update with cell:", updatedCell);

					// Optimistic update: actualizăm local state cu noua celulă
					if (updatedCell) {
						setRows((currentRows: any[]) =>
							currentRows.map((row) => {
								if (row.id.toString() === rowId) {
									// Căutăm dacă celula există deja
									const existingCellIndex = row.cells.findIndex(
										(cell: any) =>
											cell.id === updatedCell.id ||
											(cell.columnId.toString() === columnId &&
												cell.id === "virtual"),
									);

									let updatedCells = [...row.cells];

									if (existingCellIndex >= 0) {
										// Actualizăm celula existentă
										updatedCells[existingCellIndex] = updatedCell;
									} else {
										// Adăugăm celula nouă
										updatedCells.push(updatedCell);
									}

									return {
										...row,
										cells: updatedCells,
									};
								}
								return row;
							}),
						);
					}
				},
				value,
				table,
				token,
				user,
				showAlert,
			);
		},
		[handleSaveCell, paginatedRows, table, token, user, showAlert, setRows],
	);

	// Loading state - skeleton simplu și clean
	if (rowsLoading || permissionsLoading) {
		return (
			<div className='space-y-6'>
				{/* Header skeleton simplu */}
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

				{/* Table skeleton simplu - doar câteva rânduri */}
				<Card className='shadow-lg'>
					<CardContent className='p-6'>
						{/* Header row */}
						<div className='flex gap-4 mb-4 pb-4 border-b border-border/20'>
							{Array.from({ length: Math.min(columns?.length || 4, 4) }).map(
								(_, i) => (
									<Skeleton key={i} className='h-4 w-20' />
								),
							)}
							<Skeleton className='h-4 w-16 ml-auto' />
						</div>

						{/* Skeleton rows - doar 3 rânduri simple */}
						<div className='space-y-3'>
							{Array.from({ length: 3 }).map((_, rowIndex) => (
								<div key={rowIndex} className='flex gap-4 items-center py-2'>
									{Array.from({
										length: Math.min(columns?.length || 4, 4),
									}).map((_, colIndex) => (
										<Skeleton key={colIndex} className='h-8 w-24' />
									))}
									<Skeleton className='h-8 w-8 ml-auto' />
								</div>
							))}
						</div>
					</CardContent>
				</Card>
			</div>
		);
	}

	// Verificăm dacă utilizatorul are acces la tabel (după loading)
	if (!tablePermissions.canReadTable()) {
		return (
			<div className='space-y-6'>
				<div className='text-center py-12'>
					<div className='text-muted-foreground'>
						<p className='text-lg font-medium mb-2'>Access Denied</p>
						<p className='text-sm'>
							You don't have permission to view this table.
						</p>
					</div>
				</div>
			</div>
		);
	}

	// Verificăm dacă avem table și columns înainte de a renderiza
	if (!table || !columns) {
		return null;
	}

	if (!token || !user) return null;

	return (
		<div className='min-h-screen bg-gradient-to-br from-background via-background to-muted/20 overflow-x-hidden'>
			{/* Sticky Header with Modern Design */}
			<div className='sticky top-0 z-40 bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 border-b border-border/20 shadow-sm'>
				<div className='w-full mx-auto px-4 sm:px-6 lg:px-8'>
					<div className='flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4 py-6'>
						{/* Left Section - Table Info & Actions */}
						<div className='flex flex-col sm:flex-row sm:items-center gap-4'>
							{/* Table Title & Info */}
							<div className='flex items-center gap-3'>
								<div className='flex items-center justify-center w-12 h-12 bg-primary/10 rounded-xl'>
									<Database className='w-6 h-6 text-primary' />
								</div>
								<div>
									<h1 className='text-2xl font-bold text-foreground'>
										{table?.name || "Table"}
									</h1>
									<p className='text-sm text-muted-foreground'>
										{columns?.length || 0} columns •{" "}
										{pagination?.totalRows || 0} rows
									</p>
								</div>
							</div>

							{/* Action Buttons */}
							<div className='flex items-center gap-3'>
								<Button
									onClick={() => {
										setShowForm((prev) => !prev);
										setServerError(null);
									}}
									disabled={!tablePermissions.canEditTable()}
									className='bg-primary hover:bg-primary/90 text-primary-foreground shadow-lg hover:shadow-xl transition-all duration-200 transform hover:scale-105'
									size='lg'>
									{showForm ? (
										<>
											<X className='w-4 h-4 mr-2' />
											Cancel
										</>
									) : (
										<>
											<Plus className='w-4 h-4 mr-2' />
											Add Row
										</>
									)}
								</Button>

								{/* Unified Save Changes Button */}
								<SaveChangesButton
									pendingNewRows={pendingNewRows}
									isSavingNewRows={isSavingNewRows}
									onSaveNewRows={handleSaveNewRows}
									onDiscardNewRows={handleDiscardNewRows}
									pendingChanges={pendingChanges}
									isSavingChanges={isSaving}
									onSaveChanges={savePendingChanges}
									onDiscardChanges={discardPendingChanges}
								/>

								<Link
									href={`/home/database/table/${table?.id}/columns`}
									className='inline-flex'>
									<Button
										variant='outline'
										size='lg'
										className='border-2 hover:border-primary/50 hover:bg-primary/5 transition-all duration-200'>
										<Settings className='w-4 h-4 mr-2' />
										Manage Columns
									</Button>
								</Link>
							</div>
						</div>

						{/* Right Section - Tools & Filters */}
						<div className='flex items-center gap-3'>
							<FilterToggleButton
								showSidebar={showSidebar}
								setShowSidebar={setShowSidebar}
								activeFiltersCount={activeFiltersCount}
							/>
						</div>
					</div>
				</div>
			</div>

			{/* Main Content */}
			<div className='w-full mx-auto px-4 sm:px-6 lg:px-8 py-8 overflow-x-auto'>
				{/* Add Row Form - Modern Floating Design */}
				{showForm && (
					<div className='mb-8'>
						<div className='bg-card border border-border/20 rounded-2xl shadow-2xl backdrop-blur-sm bg-gradient-to-br from-card to-card/80'>
							<div className='p-8'>
								<div className='flex items-center gap-3 mb-6'>
									<div className='w-10 h-10 bg-primary/10 rounded-full flex items-center justify-center'>
										<Plus className='w-5 h-5 text-primary' />
									</div>
									<div>
										<h2 className='text-xl font-semibold text-foreground'>
											Add New Row
										</h2>
										<p className='text-sm text-muted-foreground'>
											Fill in the form below to create a new row
										</p>
									</div>
								</div>

								<AddRowForm
									columns={columns}
									cells={cells}
									setCells={setCells}
									onAdd={handleAdd}
									tables={tables || []}
									serverError={serverError}
									isSubmitting={isAddingRow}
								/>
							</div>
						</div>
					</div>
				)}

				{/* Hidden import input */}
				<input
					type='file'
					id='import-csv'
					accept='.csv'
					className='hidden'
					onChange={(e) => handleImport(e)}
				/>

				{/* Filters Section */}
				<div className='mb-6'>
					<TableFilters
						columns={columns}
						rows={paginatedRows || []}
						tables={tables || []}
						onFilterChange={() => {}}
						onApplyFilters={applyFilters}
						showToggleButton={false}
						showSidebar={showSidebar}
						setShowSidebar={setShowSidebar}
						onActiveFiltersChange={setActiveFiltersCount}
						loading={rowsLoading}
						currentFilters={filters}
						currentGlobalSearch={globalSearch}
					/>
				</div>

				{/* Table Content with Modern Loading */}
				<div className='bg-card rounded-2xl border border-border/20 shadow-lg overflow-hidden'>
					{rowsLoading ? (
						<motion.div
							className='flex flex-col items-center justify-center py-16 px-8'
							{...fadeInUp}>
							<div className='relative'>
								<div className='w-16 h-16 border-4 border-primary/20 rounded-full'></div>
								<motion.div
									className='absolute top-0 left-0 w-16 h-16 border-4 border-primary border-t-transparent rounded-full'
									{...spinAnimation}></motion.div>
							</div>
							<motion.div
								className='mt-6 text-center'
								initial={{ opacity: 0, y: 10 }}
								animate={{ opacity: 1, y: 0 }}
								transition={{ delay: 0.2 }}>
								<h3 className='text-lg font-semibold text-foreground mb-2'>
									Loading Table Data
								</h3>
								<p className='text-muted-foreground'>
									Please wait while we fetch your data...
								</p>
							</motion.div>
						</motion.div>
					) : table ? (
						<TableView
							tables={tables || []}
							table={table}
							columns={columns}
							rows={paginatedRows || []}
							loading={false}
							editingCell={editingCell}
							onEditCell={handleEditCell}
							onSaveCell={handleSaveCellWrapper}
							onCancelEdit={handleCancelEdit}
							onBulkDelete={handleBulkDelete}
							deletingRows={deletingRows}
							currentPage={pagination?.page || 1}
							pageSize={pagination?.pageSize || 25}
							totalPages={pagination?.totalPages || 1}
							totalItems={pagination?.totalRows || 0}
							onPageChange={(page) =>
								fetchRows(page, pagination?.pageSize || 25)
							}
							onPageSizeChange={(pageSize) => fetchRows(1, pageSize)}
							showPagination={true}
							hasPendingChange={hasPendingChange}
							getPendingValue={getPendingValue}
							onAddRow={handleAddRow}
							onImport={handleImportClick}
							onExport={handleExport}
							onFilter={handleFilter}
							onRefresh={refetchRows}
							filters={filters}
							globalSearch={globalSearch}
						/>
					) : (
						<motion.div
							className='flex flex-col items-center justify-center py-16 px-8'
							{...fadeInUp}>
							<div className='text-center'>
								<h3 className='text-lg font-semibold text-foreground mb-2'>
									Table Not Found
								</h3>
								<p className='text-muted-foreground'>
									The requested table could not be loaded.
								</p>
							</div>
						</motion.div>
					)}
				</div>

			</div>
		</div>
	);
});

export default TableEditor;
