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
import { Table, CreateColumnRequest, Column, Row } from "@/types/database";
import { useApp } from "@/contexts/AppContext";
import { useDatabase } from "@/contexts/DatabaseContext";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import {
	Plus, 
	Settings, 
	Database, 
	Filter, 
	Download, 
	Upload, 
	RefreshCw,
	MoreHorizontal,
	Edit,
	Trash2,
	Move,
	Eye,
	EyeOff,
	Search,
	SortAsc,
	SortDesc,
	GripVertical,
	ChevronLeft,
	ChevronRight,
	FileDown,
	FileUp
} from "lucide-react";
import { motion } from "framer-motion";
import { fadeInUp, spinAnimation } from "@/lib/animations";
import { useCurrentUserPermissions } from "@/hooks/useCurrentUserPermissions";
import { useTablePermissions } from "@/hooks/useTablePermissions";
import useTableRows from "@/hooks/useTableRows";
import useRowsTableEditor from "@/hooks/useRowsTableEditor";
import { USER_FRIENDLY_COLUMN_TYPES } from "@/lib/columnTypes";
import { ColumnHeader } from "./ColumnHeader";
import { RowGrid } from "./RowGrid";
import { ColumnPropertiesSidebar } from "./ColumnPropertiesSidebar";
import { AddColumnForm } from "./AddColumnForm";
import { ColumnToolbar } from "./ColumnToolbar";
import { TableFilters } from "../rows/TableFilters";
import { SaveChangesButton } from "../rows/SaveChangesButton";
import { Pagination } from "../../ui/pagination";
import { cn } from "@/lib/utils";

interface Props {
	columns: Column[] | null;
	setColumns: (cols: Column[] | null | ((prev: Column[] | null) => Column[] | null)) => void;
	table: Table;
	refreshTable?: () => void;
}

export const UnifiedTableEditor = memo(function UnifiedTableEditor({ 
	table, 
	columns, 
	setColumns, 
	refreshTable 
}: Props) {
	const { showAlert, token, user, tenant } = useApp();
	const { selectedDatabase, tables } = useDatabase();
	const [showColumnSidebar, setShowColumnSidebar] = useState(false);
	const [showFilters, setShowFilters] = useState(false);
	const [showAddColumnForm, setShowAddColumnForm] = useState(false);
	const [editingColumn, setEditingColumn] = useState<Column | null>(null);
	const [activeFiltersCount, setActiveFiltersCount] = useState(0);
	const [serverError, setServerError] = useState<string | null>(null);
	const [deletingRows, setDeletingRows] = useState<Set<string>>(new Set());
	// const [pendingNewRows, setPendingNewRows] = useState<any[]>([]); // Moved to useRowsTableEditor
	const [isSavingNewRows, setIsSavingNewRows] = useState(false);
	const [newColumn, setNewColumn] = useState<CreateColumnRequest | null>(null);
	const [isAddingColumn, setIsAddingColumn] = useState(false);
	const [isUpdatingColumn, setIsUpdatingColumn] = useState(false);
	const [showColumnToolbar, setShowColumnToolbar] = useState(false);
	const [selectedColumn, setSelectedColumn] = useState<Column | null>(null);
	const [searchQuery, setSearchQuery] = useState("");
	const [sortColumn, setSortColumn] = useState<string | null>(null);
	const [sortDirection, setSortDirection] = useState<"asc" | "desc">("asc");
	const [columnWidths, setColumnWidths] = useState<Record<string, number>>({});
	const [activeCell, setActiveCell] = useState<{ rowId: string; columnId: string } | null>(null);
	const [isExporting, setIsExporting] = useState(false);
	const [isImporting, setIsImporting] = useState(false);
	const [importFile, setImportFile] = useState<File | null>(null);
	
	// Always-on inline row state
	const [inlineRowData, setInlineRowData] = useState<Record<string, any>>({});
	const [isInlineRowDirty, setIsInlineRowDirty] = useState(false);

	// Permissions
	const { permissions: userPermissions, loading: permissionsLoading } = useCurrentUserPermissions();
	const tablePermissions = useTablePermissions(
		table.id,
		userPermissions?.tablePermissions || [],
		userPermissions?.columnsPermissions || [],
	);

	const tenantId = tenant?.id;

	// Use server-side pagination hook
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
		updateGlobalSearch,
		updateSorting,
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
		rollbackOptimisticUpdates,
		addNewRow,
		updateLocalRowCell,
		removeLocalRow,
	} = useRowsTableEditor({
		table,
		onCellsUpdated: (updatedData) => {
			
			// Verifică dacă sunt rânduri noi complete sau doar modificări de celule
			const isNewRow = (item: any) => item.cells && Array.isArray(item.cells) && item.id && item.tableId;
			const isCellUpdate = (item: any) => {
				// Check if it's a cell update by looking for columnId and rowId properties
				const hasColumnId = item.columnId !== undefined && item.columnId !== null;
				const hasRowId = item.rowId !== undefined && item.rowId !== null;
				const hasColumn = item.column !== undefined && item.column !== null;
				
				// It's a cell update if it has columnId and rowId, or column and rowId, but is not a new row
				return (hasColumnId && hasRowId && !isNewRow(item)) || (hasColumn && hasRowId && !isNewRow(item));
			};
			
			const newRows = updatedData.filter(isNewRow);
			const cellUpdates = updatedData.filter(isCellUpdate);
			
		
			// Gestionează rândurile noi salvate
			if (newRows.length > 0) {
				setRows((currentRows: any[]) => {
					// Elimină rândurile locale temporare și adaugă rândurile salvate
					const filteredRows = currentRows.filter(row => !row.id.toString().startsWith('temp_'));
					return [...newRows, ...filteredRows];
				});
			}
			
			// Gestionează modificările de celule
			if (cellUpdates.length > 0) {
				// 🔧 FIX: Handle rollback operations
				const rollbackCells = cellUpdates.filter((cell: any) => cell.isRollback);
				const normalCells = cellUpdates.filter((cell: any) => !cell.isRollback);
				
				if (rollbackCells.length > 0) {
					setRows((currentRows: any[]) =>
						currentRows.map((row) => {
							const updatedRow = { ...row };
							rollbackCells.forEach((rollbackCell: any) => {
								if (updatedRow.id.toString() === rollbackCell.rowId.toString()) {
									const cellIndex = updatedRow.cells.findIndex(
										(cell: any) => cell.columnId.toString() === rollbackCell.columnId.toString()
									);
									
									if (cellIndex >= 0 && updatedRow.cells[cellIndex].originalValue !== undefined) {
										// Rollback to original value
										updatedRow.cells[cellIndex] = {
											...updatedRow.cells[cellIndex],
											value: updatedRow.cells[cellIndex].originalValue,
											originalValue: undefined // Clear original value after rollback
										};
									}
								}
							});
							return updatedRow;
						}),
					);
				}
				
				if (normalCells.length > 0) {
					setRows((currentRows: any[]) => {
						const result = currentRows.map((row) => {
							const updatedRow = { ...row, cells: [...row.cells] };
							
							normalCells.forEach((updatedCell) => {
								// Normalize cell data - handle both formats (direct columnId or column.id)
								const normalizedCell = {
									...updatedCell,
									columnId: updatedCell.columnId || updatedCell.column?.id,
									rowId: updatedCell.rowId,
									value: updatedCell.value,
									id: updatedCell.id
								};

								
								// Check if this update applies to this row
								if (updatedRow.id.toString() === normalizedCell.rowId.toString()) {
									// Find the cell by columnId (most reliable method)
									const cellIndex = updatedRow.cells.findIndex(
										(cell: any) => cell.columnId.toString() === normalizedCell.columnId.toString()
									);
									
									
									if (cellIndex >= 0) {
										// Update existing cell with new value from server
										updatedRow.cells[cellIndex] = { 
											...updatedRow.cells[cellIndex],
											value: normalizedCell.value,
											// Keep the original cell ID and structure
											id: updatedRow.cells[cellIndex].id,
											columnId: updatedRow.cells[cellIndex].columnId,
											rowId: updatedRow.cells[cellIndex].rowId
										};
									} else {
										// Add new cell if it doesn't exist (shouldn't happen normally)
										const newCell = { 
											...normalizedCell, 
											id: normalizedCell.id || `cell_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
											columnId: normalizedCell.columnId,
											rowId: normalizedCell.rowId
										};
										updatedRow.cells.push(newCell);
									}
								}
							});
							return updatedRow;
						});
						
						
						return result;
					});
				}
			}
		},
		onError: (error: string) => {
			console.error("❌ Batch save error, reverting optimistic updates:", error);
			// Refresh the table data to revert optimistic updates
			refetchRows();
		},
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

		// Validate column
		const nameExists = columns?.find((col) => col.name === columnData?.name);
		const hasValidReference = columnData?.type === "reference" 
			? columnData.referenceTableId !== undefined && columnData.referenceTableId !== null
			: true;
		const hasValidPrimaryKey = !(columnData?.primary && columns?.some((col) => col.primary));

		if (nameExists || !hasValidReference || !hasValidPrimaryKey) {
			showAlert("Please fix validation errors", "error");
			return;
		}

		if (isAddingColumn) return;

		// OPTIMISTIC UPDATE: Add column immediately to UI
		const tempColumn = {
			id: Date.now(), // Use timestamp as temporary ID
			...columnData,
			tableId: table.id,
			createdAt: new Date().toISOString(),
			isOptimistic: true,
		} as Column;

		if (setColumns && columns) {
			setColumns([...columns, tempColumn]);
		}

		setNewColumn(null);
		setShowAddColumnForm(false);
		setShowColumnToolbar(false);
		setSelectedColumn(null);
		showAlert("Column added!", "success");

		setIsAddingColumn(true);

		// Background API call
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
				
				// Replace optimistic column with real one
				if (setColumns && columns) {
					setColumns((prev: Column[] | null) => 
						prev ? prev.map((col: Column) => 
							col.id === tempColumn.id ? { ...createdColumns[0], isOptimistic: false } as Column : col
						) : null
					);
				}

				// Cache refresh removed - using direct Prisma queries
			} else {
				const errorData = await response.json();
				throw new Error(errorData.error || "Failed to add column");
			}
		} catch (error: any) {
			console.error("Error adding column:", error);
			
			// Revert optimistic update
			if (setColumns && columns) {
				setColumns((prev: Column[] | null) => 
					prev ? prev.filter((col: Column) => col.id !== tempColumn.id) : null
				);
			}
			
			showAlert(error.message || "Failed to add column. Please try again.", "error");
		} finally {
			setIsAddingColumn(false);
		}
	};

	const handleEditColumn = (column: Column) => {
		setSelectedColumn(column);
		setShowColumnToolbar(true);
	};

	const handleSelectColumn = (column: Column | null) => {
		setSelectedColumn(column);
		setShowColumnToolbar(true); // Always show toolbar when selecting a column
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

		// OPTIMISTIC UPDATE: Update column immediately in UI
		const originalColumn = { ...selectedColumn };
		const optimisticColumn = { ...selectedColumn, ...updatedColumn, isOptimistic: true };

		if (setColumns && columns) {
			setColumns(
				columns.map((col) =>
					col.id === selectedColumn.id ? optimisticColumn : col,
				),
			);
		}

		showAlert("Column updated!", "success");
		setSelectedColumn(null);
		setShowColumnToolbar(false);

		setIsUpdatingColumn(true);

		// Background API call
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

				// Replace optimistic column with real one
				if (setColumns && columns) {
					setColumns(
						columns.map((col) =>
							col.id === selectedColumn.id ? { ...updatedColumnData, isOptimistic: false } : col,
						),
					);
				}

				// Cache refresh removed - using direct Prisma queries
			} else {
				const errorData = await response.json();
				throw new Error(errorData.error || "Failed to update column");
			}
		} catch (error: any) {
			console.error("Error updating column:", error);
			
			// Revert optimistic update
			if (setColumns && columns) {
				setColumns(
					columns.map((col) =>
						col.id === selectedColumn.id ? originalColumn : col,
					),
				);
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

		// OPTIMISTIC UPDATE: Remove column immediately from UI
		const columnToDelete = columns?.find(col => col.id.toString() === columnId);
		
		if (setColumns && columns) {
			setColumns(columns.filter((col) => col.id.toString() !== columnId));
		}
		
		showAlert("Column deleted!", "success");
		setSelectedColumn(null);
		setShowColumnToolbar(false);

		// Background API call
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

			if (response.ok) {
				// Cache refresh removed - using direct Prisma queries
			} else {
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

	// Row management functions - now handled by always-on inline row

	// Toolbar functions
	const handleSearch = useCallback((query: string) => {
		setSearchQuery(query);
		updateGlobalSearch(query);
	}, [updateGlobalSearch]);

	const handleSort = useCallback((columnId: string) => {
		const newDirection = sortColumn === columnId && sortDirection === "asc" ? "desc" : "asc";
		setSortColumn(columnId);
		setSortDirection(newDirection);
		updateSorting(columnId, newDirection);
	}, [sortColumn, sortDirection, updateSorting]);

	const handleColumnResize = useCallback((columnId: number, width: number) => {
		setColumnWidths(prev => ({
			...prev,
			[columnId.toString()]: Math.max(100, width) // Minimum width of 100px
		}));
	}, []);

	const handleCellClick = useCallback((rowId: string, columnId: string) => {
		setActiveCell({ rowId, columnId });
		if (tablePermissions.canEditTable()) {
			// Find the actual cell ID from the current rows
			const currentRow = paginatedRows?.find(row => row.id.toString() === rowId);
			const cell = currentRow?.cells?.find(cell => cell.columnId.toString() === columnId);
			const cellId = cell?.id?.toString() ?? "virtual";
			
			handleEditCell(rowId, columnId, cellId);
		}
	}, [handleEditCell, tablePermissions, paginatedRows]);

	const handleCellBlur = useCallback(() => {
		setActiveCell(null);
	}, []);

	// Import/Export handlers
	const handleExportData = useCallback(async () => {
		if (!token || !tenantId) {
			showAlert("Missing required information", "error");
			return;
		}

		if (!tablePermissions.canReadTable()) {
			showAlert("You don't have permission to export data from this table", "error");
			return;
		}

		setIsExporting(true);
		try {
			const exportUrl = `/api/tenants/${tenantId}/databases/${table.databaseId}/tables/${table.id}/rows/export?format=csv&limit=10000`;
			
			// Add current filters and search to export URL
			const params = new URLSearchParams();
			if (globalSearch) {
				params.append('globalSearch', globalSearch);
			}
			if (filters && filters.length > 0) {
				params.append('filters', JSON.stringify(filters));
			}
			
			const finalUrl = `${exportUrl}&${params.toString()}`;
			
			const response = await fetch(finalUrl, {
				headers: {
					Authorization: `Bearer ${token}`,
				},
			});

			if (response.ok) {
				const blob = await response.blob();
				const url = window.URL.createObjectURL(blob);
				const a = document.createElement('a');
				a.href = url;
				a.download = `${table.name}_export_${new Date().toISOString().split('T')[0]}.csv`;
				document.body.appendChild(a);
				a.click();
				window.URL.revokeObjectURL(url);
				document.body.removeChild(a);
				showAlert("Data exported successfully!", "success");
			} else {
				const errorData = await response.json();
				throw new Error(errorData.error || "Failed to export data");
			}
		} catch (error: any) {
			console.error("Error exporting data:", error);
			showAlert(error.message || "Failed to export data. Please try again.", "error");
		} finally {
			setIsExporting(false);
		}
	}, [token, tenantId, table.databaseId, table.id, table.name, tablePermissions, showAlert, globalSearch, filters]);

	const handleImportData = useCallback(async () => {
		if (!token || !tenantId) {
			showAlert("Missing required information", "error");
			return;
		}

		if (!tablePermissions.canEditTable()) {
			showAlert("You don't have permission to import data to this table", "error");
			return;
		}

		if (!importFile) {
			showAlert("Please select a file to import", "error");
			return;
		}

		setIsImporting(true);
		try {
			// Parse CSV file
			const text = await importFile.text();
			const lines = text.split('\n').filter(line => line.trim());
			
			if (lines.length < 2) {
				throw new Error("CSV file must have at least a header row and one data row");
			}

			// Improved CSV parsing function
			const parseCSVLine = (line: string): string[] => {
				const result: string[] = [];
				let current = '';
				let inQuotes = false;
				
				for (let i = 0; i < line.length; i++) {
					const char = line[i];
					
					if (char === '"') {
						if (inQuotes && line[i + 1] === '"') {
							// Escaped quote
							current += '"';
							i++; // Skip next quote
						} else {
							// Toggle quote state
							inQuotes = !inQuotes;
						}
					} else if (char === ',' && !inQuotes) {
						// Field separator
						result.push(current.trim());
						current = '';
					} else {
						current += char;
					}
				}
				
				// Add the last field
				result.push(current.trim());
				return result;
			};

			// Parse header - try both comma and semicolon separators
			let headers: string[];
			const firstLine = lines[0];
			
			// Detect separator by counting occurrences
			const commaCount = (firstLine.match(/,/g) || []).length;
			const semicolonCount = (firstLine.match(/;/g) || []).length;
			
			if (commaCount > semicolonCount) {
				// Use comma separator
				headers = parseCSVLine(firstLine);
			} else {
				// Use semicolon separator (fallback)
				headers = firstLine.split(';').map(h => h.trim().replace(/"/g, ''));
			}
			
			// Map headers to column IDs
			const columnMapping: Record<string, number> = {};
			columns?.forEach(col => {
				const matchingHeader = headers.find(h => h.toLowerCase() === col.name.toLowerCase());
				if (matchingHeader) {
					columnMapping[matchingHeader] = col.id;
				}
			});

			// Parse data rows
			const rows: Array<{ cells: Array<{ columnId: number; value: any }> }> = [];
			for (let i = 1; i < lines.length; i++) {
				let values: string[];
				
				// Use the same separator detection for data rows
				if (commaCount > semicolonCount) {
					values = parseCSVLine(lines[i]);
				} else {
					values = lines[i].split(';').map(v => v.trim().replace(/"/g, ''));
				}
				
				const cells: Array<{ columnId: number; value: any }> = [];
				
				headers.forEach((header, index) => {
					const columnId = columnMapping[header];
					if (columnId && values[index] !== undefined) {
						cells.push({
							columnId,
							value: values[index] || null
						});
					}
				});

				if (cells.length > 0) {
					rows.push({ cells });
				}
			}

			if (rows.length === 0) {
				throw new Error("No valid data rows found in CSV file");
			}

			// Send to import API
			const response = await fetch(
				`/api/tenants/${tenantId}/databases/${table.databaseId}/tables/${table.id}/rows/import`,
				{
					method: "POST",
					headers: {
						"Content-Type": "application/json",
						Authorization: `Bearer ${token}`,
					},
					body: JSON.stringify({ rows }),
				}
			);

			const result = await response.json();

			if (response.ok) {
				showAlert(`Successfully imported ${result.importedRows} rows!`, "success");
				setImportFile(null);
				// Reset file input
				const fileInput = document.getElementById('import-file-input') as HTMLInputElement;
				if (fileInput) fileInput.value = '';
				
				// Refresh table data
				await refetchRows();
			} else {
				throw new Error(result.error || "Failed to import data");
			}
		} catch (error: any) {
			console.error("Error importing data:", error);
			showAlert(error.message || "Failed to import data. Please check your file format.", "error");
		} finally {
			setIsImporting(false);
		}
	}, [token, tenantId, table.databaseId, table.id, tablePermissions, showAlert, importFile, columns, refetchRows]);

	const handleFileSelect = useCallback((event: React.ChangeEvent<HTMLInputElement>) => {
		const file = event.target.files?.[0];
		if (file) {
			if (file.type !== 'text/csv' && !file.name.endsWith('.csv')) {
				showAlert("Please select a CSV file", "error");
				return;
			}
			setImportFile(file);
		}
	}, [showAlert]);

	// Handle inline row input changes
	const handleInlineRowChange = useCallback((columnId: string, value: any) => {
		setInlineRowData(prev => ({
			...prev,
			[columnId]: value
		}));
		setIsInlineRowDirty(true);
	}, []);

	// Handle inline row save (Enter key or Save button)
	const handleInlineRowSave = useCallback(async () => {
		if (!tablePermissions.canEditTable()) {
			showAlert("You don't have permission to add rows to this table", "error");
			return;
		}

		// Check if there's any data to save
		const hasData = Object.values(inlineRowData).some(value => 
			value !== null && value !== undefined && value !== ""
		);

		if (!hasData) {
			showAlert("Please enter some data before saving", "warning");
			return;
		}

		// Convert inline row data to the format expected by addNewRow
		const rowData: Record<string, any> = {};
		columns?.forEach(col => {
			if (inlineRowData[col.id.toString()] !== undefined) {
				rowData[col.name] = inlineRowData[col.id.toString()];
			}
		});

		// Add the row to the batch
		addNewRow(rowData);
		
		// Clear the inline row
		setInlineRowData({});
		setIsInlineRowDirty(false);
		
		showAlert("Row added to batch - will be saved when you click Save Changes", "info");
	}, [tablePermissions, showAlert, addNewRow, inlineRowData, columns]);

	// Handle inline row clear
	const handleInlineRowClear = useCallback(() => {
		setInlineRowData({});
		setIsInlineRowDirty(false);
	}, []);

	// Handle Enter key press in inline row
	const handleInlineRowKeyPress = useCallback((e: React.KeyboardEvent) => {
		if (e.key === 'Enter' && !e.shiftKey) {
			e.preventDefault();
			handleInlineRowSave();
		}
	}, [handleInlineRowSave]);


	// handleSaveNewRows and handleDiscardNewRows are now handled by useRowsTableEditor

	const handleDeleteRow = async (rowId: string) => {
		if (!tablePermissions.canDeleteTable()) {
			showAlert("You don't have permission to delete rows in this table", "error");
			return;
		}

		// Verifică dacă este un rând local
		if (rowId.startsWith('temp_')) {
			removeLocalRow(rowId);
			showAlert("Local row removed from batch", "info");
			return;
		}

		// Pentru rândurile existente, face request la server
		if (!token || !tenantId) {
			showAlert("Missing required information", "error");
			return;
		}

		// OPTIMISTIC UPDATE: Remove row immediately from UI
		const rowToDelete = paginatedRows?.find(row => row.id.toString() === rowId);
		
		setRows((currentRows) => currentRows.filter(row => row.id.toString() !== rowId));
		showAlert("Row deleted!", "success");

		// Background API call
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

			if (response.ok) {
				// 🔧 FIX: Nu mai face refreshAfterChange() - optimistic update rămâne corect
			} else {
				const errorData = await response.json();
				throw new Error(errorData.error || "Failed to delete row");
			}
		} catch (error: any) {
			console.error("Error deleting row:", error);
			
			// Revert optimistic update
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

		if (rowIds.length === 0) return;

		// Separa rândurile locale de cele existente
		const localRowIds = rowIds.filter(id => id.startsWith('temp_'));
		const existingRowIds = rowIds.filter(id => !id.startsWith('temp_'));

		// Șterge rândurile locale
		if (localRowIds.length > 0) {
			localRowIds.forEach(id => removeLocalRow(id));
			showAlert(`${localRowIds.length} local rows removed from batch`, "info");
		}

		// Pentru rândurile existente, face request la server
		if (existingRowIds.length === 0) return;

		if (!token || !tenantId) {
			showAlert("Missing required information", "error");
			return;
		}

		// OPTIMISTIC UPDATE: Remove rows immediately from UI
		const rowsToDelete = paginatedRows?.filter(row => existingRowIds.includes(row.id.toString())) || [];
		
		setRows((currentRows) => currentRows.filter(row => !existingRowIds.includes(row.id.toString())));
		showAlert(`${existingRowIds.length} rows deleted!`, "success");

		// Background API call
		try {
			// Delete rows in parallel
			const deletePromises = existingRowIds.map(rowId =>
				fetch(
					`/api/tenants/${tenantId}/databases/${table.databaseId}/tables/${table.id}/rows/${rowId}`,
					{
						method: "DELETE",
						headers: {
							Authorization: `Bearer ${token}`,
						},
					},
				)
			);

			const responses = await Promise.all(deletePromises);
			const failedDeletes = responses.filter(response => !response.ok);

			if (failedDeletes.length === 0) {
				// 🔧 FIX: Nu mai face refreshAfterChange() - optimistic updates rămân corecte
			} else {
				// Revert optimistic update for failed deletes
				const failedRowIds = existingRowIds.filter((_, index) => !responses[index].ok);
				const failedRows = rowsToDelete.filter(row => failedRowIds.includes(row.id.toString()));
				
				if (failedRows.length > 0) {
					setRows((currentRows) => [...failedRows, ...currentRows]);
				}
				
				showAlert(`Failed to delete ${failedDeletes.length} out of ${existingRowIds.length} rows`, "error");
			}
		} catch (error: any) {
			console.error("Error deleting multiple rows:", error);
			
			// Revert optimistic update
			if (rowsToDelete.length > 0) {
				setRows((currentRows) => [...rowsToDelete, ...currentRows]);
			}
			
			showAlert(error.message || "Failed to delete rows. Please try again.", "error");
		}
	};

	const handleSaveCellWrapper = useCallback(
		async (columnId: string, rowId: string, cellId: string, value: any) => {
			// Simply delegate to the hook's handleSaveCell function
			// This function should only add to pending changes, not do immediate server saves
			await handleSaveCell(
				columnId,
				rowId,
				cellId,
				paginatedRows,
				() => {
					// No-op callback since we're not doing immediate server save
				},
				value,
				table,
				token || "",
				user,
				showAlert,
				{ keepEditing: false }, // Don't keep editing open - let EditableCell handle this
			);
		},
		[handleSaveCell, paginatedRows, table, token, user, showAlert],
	);

	// Loading state
	if (rowsLoading || permissionsLoading) {
		return (
			<div className='space-y-6'>
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
						<div className='flex gap-4 mb-4 pb-4 border-b border-border/20'>
							{Array.from({ length: Math.min(columns?.length || 4, 4) }).map((_, i) => (
								<Skeleton key={i} className='h-4 w-20' />
							))}
							<Skeleton className='h-4 w-16 ml-auto' />
						</div>

						<div className='space-y-3'>
							{Array.from({ length: 3 }).map((_, rowIndex) => (
								<div key={rowIndex} className='flex gap-4 items-center py-2'>
									{Array.from({ length: Math.min(columns?.length || 4, 4) }).map((_, colIndex) => (
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
		<div className='min-h-screen bg-gradient-to-br from-background via-background to-muted/20 overflow-x-hidden'>
			{/* Modern Sticky Header */}
			<div className='sticky top-0 z-40 bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 border-b border-border/20 shadow-sm'>
				<div className='w-full mx-auto px-4 sm:px-6 lg:px-8'>
					<div className='flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4 py-6'>
						{/* Left Section - Table Info & Actions */}
						<div className='flex flex-col sm:flex-row sm:items-center gap-4'>
							<div className='flex items-center gap-3'>
								<div className='flex items-center justify-center w-12 h-12 bg-primary/10 rounded-xl'>
									<Database className='w-6 h-6 text-primary' />
								</div>
								<div>
									<h1 className='text-2xl font-bold text-foreground'>
										{table?.name || "Table"}
									</h1>
									<p className='text-sm text-muted-foreground'>
										{columns?.length || 0} columns • {pagination?.totalRows || 0} rows
									</p>
								</div>
							</div>

							<div className='flex items-center gap-3'>
								{/* Always-on inline row for adding new rows */}
								{tablePermissions.canEditTable() && (
									<div className="flex-1 bg-card border border-border/20 rounded-lg p-4 shadow-sm">
										<div className="flex items-center gap-2 mb-2">
											<Plus className="w-4 h-4 text-primary" />
											<span className="text-sm font-medium text-foreground">Add New Row</span>
											{isInlineRowDirty && (
												<span className="text-xs text-muted-foreground">• Unsaved changes</span>
											)}
										</div>
										<div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-2">
											{columns?.map((column) => (
												<div key={column.id} className="flex flex-col">
													<label className="text-xs text-muted-foreground mb-1">
														{column.name}
														{column.required && <span className="text-red-500 ml-1">*</span>}
													</label>
													<input
														type={column.type === 'number' ? 'number' : 
															  column.type === 'date' ? 'date' : 
															  column.type === 'boolean' ? 'checkbox' : 'text'}
														value={inlineRowData[column.id.toString()] || ''}
														onChange={(e) => {
															const value = column.type === 'boolean' ? e.target.checked : e.target.value;
															handleInlineRowChange(column.id.toString(), value);
														}}
														onKeyPress={handleInlineRowKeyPress}
														placeholder={`Enter ${column.name.toLowerCase()}`}
														className="w-full px-2 py-1 text-sm border border-input rounded focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary"
													/>
												</div>
											))}
										</div>
										<div className="flex items-center gap-2 mt-3">
											<Button
												onClick={handleInlineRowSave}
												disabled={!isInlineRowDirty}
												size="sm"
												className="bg-primary hover:bg-primary/90 text-primary-foreground"
											>
												Save Row
											</Button>
											<Button
												onClick={handleInlineRowClear}
												disabled={!isInlineRowDirty}
												variant="outline"
												size="sm"
											>
												Clear
											</Button>
										</div>
									</div>
								)}

								<SaveChangesButton
									pendingNewRows={pendingNewRows}
									isSavingNewRows={isSaving}
									onSaveNewRows={savePendingChanges}
									onDiscardNewRows={discardPendingChanges}
									pendingChanges={pendingChanges}
									isSavingChanges={isSaving}
									onSaveChanges={savePendingChanges}
									onDiscardChanges={discardPendingChanges}
								/>
							</div>
						</div>

						{/* Right Section - Tools & Filters */}
						<div className='flex items-center gap-3'>
							{/* Import/Export Buttons */}
							<div className='flex items-center gap-2'>
								<Button
									variant='outline'
									size='lg'
									onClick={handleExportData}
									disabled={isExporting || !tablePermissions.canReadTable()}
									className='border-2 hover:border-green-500/50 hover:bg-green-50 transition-all duration-200'>
									{isExporting ? (
										<RefreshCw className='w-4 h-4 mr-2 animate-spin' />
									) : (
										<FileDown className='w-4 h-4 mr-2' />
									)}
									{isExporting ? 'Exporting...' : 'Export CSV'}
								</Button>

								<div className='relative'>
									<input
										id='import-file-input'
										type='file'
										accept='.csv'
										onChange={handleFileSelect}
										className='hidden'
									/>
									<Button
										variant='outline'
										size='lg'
										onClick={() => document.getElementById('import-file-input')?.click()}
										disabled={isImporting || !tablePermissions.canEditTable()}
										className='border-2 hover:border-blue-500/50 hover:bg-blue-50 transition-all duration-200'>
										<FileUp className='w-4 h-4 mr-2' />
										Import CSV
									</Button>
								</div>

								{importFile && (
									<div className='flex items-center gap-2'>
										<span className='text-sm text-muted-foreground'>
											{importFile.name}
										</span>
										<Button
											variant='default'
											size='sm'
											onClick={handleImportData}
											disabled={isImporting}
											className='bg-green-600 hover:bg-green-700'>
											{isImporting ? (
												<RefreshCw className='w-4 h-4 mr-1 animate-spin' />
											) : null}
											{isImporting ? 'Importing...' : 'Import'}
										</Button>
									</div>
								)}
							</div>

							<Button
								variant='outline'
								size='lg'
								onClick={() => setShowFilters(!showFilters)}
								className='border-2 hover:border-primary/50 hover:bg-primary/5 transition-all duration-200'>
								<Filter className='w-4 h-4 mr-2' />
								Filters
								{activeFiltersCount > 0 && (
									<span className='ml-2 px-2 py-1 bg-primary text-primary-foreground text-xs rounded-full'>
										{activeFiltersCount}
									</span>
								)}
							</Button>
						</div>
					</div>
				</div>
			</div>

			{/* Modern Toolbar - Mobile Optimized */}
			<div className="w-full mx-auto px-3 sm:px-6 lg:px-8 py-3 sm:py-4">
				<div className="bg-white border border-neutral-200 rounded-xl shadow-sm p-3 sm:p-4">
					{/* Mobile Layout */}
					<div className="block sm:hidden space-y-3">
						{/* Search - Full width on mobile */}
						<div className="flex items-center gap-2 bg-neutral-50 rounded-lg px-3 py-2">
							<Search className="w-4 h-4 text-neutral-500 flex-shrink-0" />
							<input
								type="text"
								placeholder="Search rows..."
								value={searchQuery}
								onChange={(e) => handleSearch(e.target.value)}
								className="flex-1 h-6 text-sm border-0 bg-transparent focus:ring-0 p-0"
							/>
						</div>

						{/* Action buttons - Horizontal on mobile */}
						<div className="flex items-center gap-2">
							<Button
								variant="outline"
								size="sm"
								onClick={handleExportData}
								disabled={isExporting || !tablePermissions.canReadTable()}
								className="flex-1 h-8 text-sm border-neutral-300 hover:border-green-500 hover:bg-green-50 transition-all duration-200"
							>
								{isExporting ? <RefreshCw className="w-4 h-4 mr-1 animate-spin" /> : <FileDown className="w-4 h-4 mr-1" />}
								{isExporting ? 'Exporting...' : 'Export'}
							</Button>

							<Button
								variant="outline"
								size="sm"
								onClick={() => document.getElementById('import-file-input-mobile')?.click()}
								disabled={isImporting || !tablePermissions.canEditTable()}
								className="flex-1 h-8 text-sm border-neutral-300 hover:border-blue-500 hover:bg-blue-50 transition-all duration-200"
							>
								<FileUp className="w-4 h-4 mr-1" />
								Import
							</Button>

							<Button
								variant="outline"
								size="sm"
								onClick={() => handleSort(columns?.[0]?.id?.toString() || "")}
								className="flex-1 h-8 text-sm border-neutral-300 hover:border-blue-500 hover:bg-blue-50 transition-all duration-200"
							>
								{sortDirection === "asc" ? <SortAsc className="w-4 h-4 mr-1" /> : <SortDesc className="w-4 h-4 mr-1" />}
								Sort
							</Button>

							<Button
								variant="outline"
								size="sm"
								onClick={() => setShowFilters(!showFilters)}
								className="flex-1 h-8 text-sm border-neutral-300 hover:border-blue-500 hover:bg-blue-50 transition-all duration-200 relative"
							>
								<Filter className="w-4 h-4 mr-1" />
								Filter
								{activeFiltersCount > 0 && (
									<span className="absolute -top-1 -right-1 w-4 h-4 bg-blue-500 text-white text-xs rounded-full flex items-center justify-center">
										{activeFiltersCount}
									</span>
								)}
							</Button>
						</div>

						{/* Mobile file input */}
						<input
							id='import-file-input-mobile'
							type='file'
							accept='.csv'
							onChange={handleFileSelect}
							className='hidden'
						/>

						{/* Mobile import confirmation */}
						{importFile && (
							<div className="flex items-center gap-2 p-2 bg-blue-50 rounded-lg border border-blue-200">
								<span className="text-sm text-blue-700 flex-1 truncate">
									{importFile.name}
								</span>
								<Button
									variant="default"
									size="sm"
									onClick={handleImportData}
									disabled={isImporting}
									className="bg-green-600 hover:bg-green-700 h-6 px-2 text-xs">
									{isImporting ? (
										<RefreshCw className="w-3 h-3 mr-1 animate-spin" />
									) : null}
									{isImporting ? 'Importing...' : 'Import'}
								</Button>
							</div>
						)}
					</div>

					{/* Desktop Layout */}
					<div className="hidden sm:flex items-center gap-4 flex-wrap">
						{/* Search */}
						<div className="flex items-center gap-2 min-w-0 flex-1">
							<Search className="w-4 h-4 text-neutral-500" />
							<input
								type="text"
								placeholder="Search rows..."
								value={searchQuery}
								onChange={(e) => handleSearch(e.target.value)}
								className="flex-1 h-8 px-3 text-sm border border-neutral-300 rounded-lg focus:border-blue-500 focus:ring-1 focus:ring-blue-500 transition-all duration-200"
							/>
						</div>

						{/* Sort Controls */}
						<div className="flex items-center gap-2">
							<Button
								variant="outline"
								size="sm"
								onClick={() => handleSort(columns?.[0]?.id?.toString() || "")}
								className="h-8 px-3 text-sm border-neutral-300 hover:border-blue-500 hover:bg-blue-50 transition-all duration-200"
							>
								{sortDirection === "asc" ? <SortAsc className="w-4 h-4 mr-1" /> : <SortDesc className="w-4 h-4 mr-1" />}
								Sort
							</Button>
						</div>

						{/* Import/Export Controls */}
						<div className="flex items-center gap-2">
							<Button
								variant="outline"
								size="sm"
								onClick={handleExportData}
								disabled={isExporting || !tablePermissions.canReadTable()}
								className="h-8 px-3 text-sm border-neutral-300 hover:border-green-500 hover:bg-green-50 transition-all duration-200"
							>
								{isExporting ? <RefreshCw className="w-4 h-4 mr-1 animate-spin" /> : <FileDown className="w-4 h-4 mr-1" />}
								{isExporting ? 'Exporting...' : 'Export CSV'}
							</Button>

							<Button
								variant="outline"
								size="sm"
								onClick={() => document.getElementById('import-file-input')?.click()}
								disabled={isImporting || !tablePermissions.canEditTable()}
								className="h-8 px-3 text-sm border-neutral-300 hover:border-blue-500 hover:bg-blue-50 transition-all duration-200"
							>
								<FileUp className="w-4 h-4 mr-1" />
								Import CSV
							</Button>
						</div>

						{/* View Controls */}
						<div className="flex items-center gap-2">
							<Button
								variant="outline"
								size="sm"
								onClick={() => setShowFilters(!showFilters)}
								className="h-8 px-3 text-sm border-neutral-300 hover:border-blue-500 hover:bg-blue-50 transition-all duration-200"
							>
								<Filter className="w-4 h-4 mr-1" />
								Filter
								{activeFiltersCount > 0 && (
									<span className="ml-1 px-1.5 py-0.5 bg-blue-500 text-white text-xs rounded-full">
										{activeFiltersCount}
									</span>
								)}
							</Button>
						</div>
					</div>
				</div>
			</div>

			{/* Column Toolbar - Always visible at top */}
			<div className="w-full mx-auto px-4 sm:px-6 lg:px-8 py-4">
				<ColumnToolbar
					columns={columns || []}
					selectedColumn={selectedColumn}
					onSelectColumn={handleSelectColumn}
					onSave={handleUpdateColumn}
					onDelete={handleDeleteColumn}
					onAdd={handleAddColumn}
					tables={tables || []}
					isSubmitting={isAddingColumn || isUpdatingColumn}
					isOpen={showColumnToolbar}
					onClose={() => {
						setShowColumnToolbar(false);
						setSelectedColumn(null);
					}}
				/>
			</div>

			{/* Main Content - Mobile Optimized */}
			<div className='w-full mx-auto px-3 sm:px-6 lg:px-8 py-4 sm:py-8'>

				{/* Filters Section */}
				{showFilters && (
					<div className='mb-6'>
						<TableFilters
							columns={columns}
							rows={paginatedRows || []}
							tables={tables || []}
							onFilterChange={() => {}}
							onApplyFilters={applyFilters}
							showToggleButton={false}
							showSidebar={showFilters}
							setShowSidebar={setShowFilters}
							onActiveFiltersChange={setActiveFiltersCount}
							loading={rowsLoading}
							currentFilters={filters}
							currentGlobalSearch={globalSearch}
						/>
					</div>
				)}

				{/* Modern Table Grid - Mobile Optimized */}
				<div className='bg-white rounded-xl border border-neutral-200 shadow-sm overflow-x-auto'>
					{/* Background extension for scrollable area */}
					<div className='bg-white min-w-full min-h-full'>
					{rowsLoading ? (
						<motion.div
							className='flex flex-col items-center justify-center py-12 sm:py-16 px-4 sm:px-8'
							{...fadeInUp}>
							<div className='relative'>
								<div className='w-12 h-12 sm:w-16 sm:h-16 border-4 border-primary/20 rounded-full'></div>
								<motion.div
									className='absolute top-0 left-0 w-12 h-12 sm:w-16 sm:h-16 border-4 border-primary border-t-transparent rounded-full'
									{...spinAnimation}></motion.div>
							</div>
							<motion.div
								className='mt-4 sm:mt-6 text-center'
								initial={{ opacity: 0, y: 10 }}
								animate={{ opacity: 1, y: 0 }}
								transition={{ delay: 0.2 }}>
								<h3 className='text-base sm:text-lg font-semibold text-foreground mb-2'>
									Loading Table Data
								</h3>
								<p className='text-sm sm:text-base text-muted-foreground'>
									Please wait while we fetch your data...
								</p>
							</motion.div>
						</motion.div>
					) : (
						<div>
							{/* Modern Column Headers - Mobile Optimized */}
							<div className='flex border-b border-neutral-200 min-w-max'>
								{/* Selection column */}
								<div className='w-12 sm:w-16 flex-shrink-0 border-r border-neutral-200 bg-neutral-100 flex items-center justify-center px-2 sm:px-4 py-2'>
									<span className='text-xs font-semibold text-neutral-700 hidden sm:inline'>Select</span>
									<span className='text-xs font-semibold text-neutral-700 sm:hidden'>✓</span>
								</div>
								
								{/* Data columns */}
								{columns?.map((column) => (
									<div
										key={column.id}
										className="flex items-center group relative"
										style={{ width: Math.max(columnWidths[column.id] || 200, 120) }}
									>
										<ColumnHeader
											column={column}
											onEdit={handleEditColumn}
											onDelete={handleDeleteColumn}
											canEdit={tablePermissions.canEditTable()}
										/>
										{/* Resize handle */}
										<div
											className="absolute right-0 top-0 w-1 h-full bg-transparent hover:bg-blue-500 cursor-col-resize opacity-0 group-hover:opacity-100 transition-opacity duration-200"
											onMouseDown={(e) => {
												const startX = e.clientX;
												const startWidth = columnWidths[column.id.toString()] || 200;
												
												const handleMouseMove = (e: MouseEvent) => {
													const newWidth = startWidth + (e.clientX - startX);
													handleColumnResize(column.id, newWidth);
												};
												
												const handleMouseUp = () => {
													document.removeEventListener('mousemove', handleMouseMove);
													document.removeEventListener('mouseup', handleMouseUp);
												};
												
												document.addEventListener('mousemove', handleMouseMove);
												document.addEventListener('mouseup', handleMouseUp);
											}}
										/>
									</div>
								))}
								
								{/* Add column button */}
								{tablePermissions.canEditTable() && (
									<div className='w-12 sm:w-16 flex-shrink-0 border-l border-neutral-200 bg-neutral-100 flex items-center justify-center px-2 sm:px-4 py-2'>
										<Button
											variant='ghost'
											size='sm'
											onClick={() => {
												setSelectedColumn(null);
												setShowColumnToolbar(true);
											}}
											className='h-6 w-6 sm:h-8 sm:w-8 p-0 hover:bg-blue-100 hover:text-blue-600 transition-all duration-200'
											title="Add new column">
											<Plus className='w-3 h-3 sm:w-4 sm:h-4' />
										</Button>
									</div>
								)}
							</div>


							{/* Data Rows */}
							<div className="data-grid">
								<RowGrid
								columns={columns || []}
								rows={[...(pendingNewRows || []), ...(paginatedRows || [])]}
								editingCell={editingCell}
								onEditCell={handleEditCell}
								onSaveCell={handleSaveCellWrapper}
								onCancelEdit={handleCancelEdit}
								onDeleteRow={handleDeleteRow}
								onDeleteMultipleRows={handleDeleteMultipleRows}
								deletingRows={deletingRows}
								hasPendingChange={hasPendingChange}
								getPendingValue={getPendingValue}
								canEdit={tablePermissions.canEditTable()}
								canDelete={tablePermissions.canDeleteTable()}
								tables={tables || []}
							/>
							</div>
						</div>
					)}
					</div>
				</div>
			</div>

			{/* Pagination Controls - Mobile Optimized */}
			{pagination && pagination.totalPages > 1 && (
				<div className="w-full mx-auto px-3 sm:px-6 lg:px-8 py-3 sm:py-4">
					<div className="bg-white border border-neutral-200 rounded-xl shadow-sm p-3 sm:p-4">
						<Pagination
							currentPage={pagination.page}
							totalPages={pagination.totalPages}
							onPageChange={(page) => fetchRows(page, pagination.pageSize)}
							pageSize={pagination.pageSize}
							totalItems={pagination.totalRows}
							onPageSizeChange={(newPageSize) => fetchRows(1, newPageSize)}
							pageSizeOptions={[10, 25, 50, 100]}
						/>
					</div>
				</div>
			)}

			{/* Add Column Form Modal */}
			{showAddColumnForm && (
				<div className='fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm'>
					<div className='bg-card border border-border/20 rounded-2xl shadow-2xl max-w-2xl w-full mx-4 max-h-[90vh] overflow-y-auto'>
						<div className='p-8'>
							<div className='flex items-center gap-3 mb-6'>
								<div className='w-10 h-10 bg-primary/10 rounded-full flex items-center justify-center'>
									<Plus className='w-5 h-5 text-primary' />
								</div>
								<div>
									<h2 className='text-xl font-semibold text-foreground'>Add New Column</h2>
									<p className='text-sm text-muted-foreground'>
										Configure the properties for your new column
									</p>
								</div>
							</div>

							<AddColumnForm
								setNewColumn={setNewColumn}
								newColumn={newColumn}
								onAdd={handleAddColumn}
								tables={tables || []}
								existingColumns={columns || []}
								isSubmitting={isAddingColumn}
							/>

							<div className='flex justify-end gap-3 mt-6'>
								<Button
									variant='outline'
									onClick={() => setShowAddColumnForm(false)}>
									Cancel
								</Button>
							</div>
						</div>
					</div>
				</div>
			)}
		</div>
	);
});
