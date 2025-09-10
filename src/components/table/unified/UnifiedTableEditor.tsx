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
import { useDatabaseRefresh } from "@/hooks/useDatabaseRefresh";
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
	ChevronRight
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
import { InlineRowCreator } from "./InlineRowCreator";
import { TableFilters } from "../rows/TableFilters";
import { SaveChangesButton } from "../rows/SaveChangesButton";
import AddRowForm from "../rows/AddRowForm";
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
	const [showAddRowForm, setShowAddRowForm] = useState(false);
	const [editingColumn, setEditingColumn] = useState<Column | null>(null);
	const [activeFiltersCount, setActiveFiltersCount] = useState(0);
	const [serverError, setServerError] = useState<string | null>(null);
	const [cells, setCells] = useState<any[]>([]);
	const [isAddingRow, setIsAddingRow] = useState(false);
	const [deletingRows, setDeletingRows] = useState<Set<string>>(new Set());
	const [pendingNewRows, setPendingNewRows] = useState<any[]>([]);
	const [isSavingNewRows, setIsSavingNewRows] = useState(false);
	const [newColumn, setNewColumn] = useState<CreateColumnRequest | null>(null);
	const [isAddingColumn, setIsAddingColumn] = useState(false);
	const [isUpdatingColumn, setIsUpdatingColumn] = useState(false);
	const [showInlineRowCreator, setShowInlineRowCreator] = useState(false);
	const [showColumnToolbar, setShowColumnToolbar] = useState(false);
	const [selectedColumn, setSelectedColumn] = useState<Column | null>(null);
	const [searchQuery, setSearchQuery] = useState("");
	const [sortColumn, setSortColumn] = useState<string | null>(null);
	const [sortDirection, setSortDirection] = useState<"asc" | "desc">("asc");
	const [columnWidths, setColumnWidths] = useState<Record<string, number>>({});
	const [activeCell, setActiveCell] = useState<{ rowId: string; columnId: string } | null>(null);

	// Permissions
	const { permissions: userPermissions, loading: permissionsLoading } = useCurrentUserPermissions();
	const tablePermissions = useTablePermissions(
		table.id,
		userPermissions?.tablePermissions || [],
		userPermissions?.columnsPermissions || [],
	);

	const { refreshAfterChange } = useDatabaseRefresh();
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
		pendingChangesCount,
		isSaving,
		hasPendingChange,
		getPendingValue,
		savePendingChanges,
		discardPendingChanges,
	} = useRowsTableEditor({
		table,
		onCellsUpdated: (updatedCells) => {
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

				await refreshAfterChange();
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

				await refreshAfterChange();
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
				await refreshAfterChange();
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

	// Row management functions
	const handleAddRow = useCallback(() => {
		setShowAddRowForm(true);
	}, []);

	const handleInlineAddRow = useCallback(() => {
		setShowInlineRowCreator(true);
	}, []);

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
			handleEditCell(rowId, columnId, "virtual");
		}
	}, [handleEditCell, tablePermissions]);

	const handleCellBlur = useCallback(() => {
		setActiveCell(null);
	}, []);

	const handleInlineRowSave = useCallback(async (rowData: Record<string, any>) => {
		if (!token || !tenantId) {
			showAlert("Missing required information", "error");
			return;
		}

		if (!tablePermissions.canEditTable()) {
			showAlert("You don't have permission to add rows to this table", "error");
			return;
		}

		setIsAddingRow(true);

		try {
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
					body: JSON.stringify({ 
						rows: [{
							cells: Object.entries(rowData).map(([columnId, value]) => ({
								columnId: parseInt(columnId),
								value: value,
							}))
						}]
					}),
				},
			);

			if (response.ok) {
				const result = await response.json();
				const savedRows = result.rows || [];

				setRows((currentRows) => [...savedRows, ...currentRows]);
				showAlert("Row added successfully!", "success");
				setShowInlineRowCreator(false);

				if (pagination) {
					const newTotalRows = pagination.totalRows + savedRows.length;
					await fetchRows(1, pagination.pageSize);
				}
			} else {
				const errorData = await response.json();
				throw new Error(errorData.error || "Failed to add row");
			}
		} catch (error: any) {
			console.error("Error adding row:", error);
			showAlert(error.message || "Failed to add row. Please try again.", "error");
		} finally {
			setIsAddingRow(false);
		}
	}, [token, tenantId, table?.databaseId, table?.id, tablePermissions, showAlert, setRows, pagination, fetchRows]);

	const handleInlineRowCancel = useCallback(() => {
		setShowInlineRowCreator(false);
	}, []);

	const handleAdd = useCallback(
		async (e: FormEvent) => {
			e.preventDefault();

			if (!tablePermissions.canEditTable()) {
				showAlert("You don't have permission to add rows to this table", "error");
				return;
			}

			if (isAddingRow) return;

			setServerError(null);
			setIsAddingRow(true);

			const tempRowId = `temp_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;

			// Create optimistic row
			const optimisticRow = {
				id: tempRowId,
				tableId: table?.id || 0,
				createdAt: new Date().toISOString(),
				cells: cells.map((cell) => ({
					id: `temp_cell_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
					rowId: tempRowId,
					columnId: cell.columnId,
					value: cell.value,
					column: columns?.find((col) => col.id === cell.columnId) || null,
				})),
				isOptimistic: true,
			};

			// Add optimistic row immediately to UI
			setRows((currentRows) => [optimisticRow, ...currentRows]);

			// Close form and reset
			setShowAddRowForm(false);
			setCells([]);
			setIsAddingRow(false);

			// Make API call in background
			try {
				const response = await fetch(
					`/api/tenants/${tenantId}/databases/${table?.databaseId}/tables/${table?.id}/rows`,
					{
						method: "POST",
						headers: {
							"Content-Type": "application/json",
							Authorization: `Bearer ${token}`,
						},
						body: JSON.stringify({
							cells: cells.map((cell) => ({
								columnId: cell.columnId,
								value: cell.value,
							})),
						}),
					},
				);

				if (!response.ok) {
					throw new Error(`HTTP error! status: ${response.status}`);
				}

				const createdRow = await response.json();

				// Replace optimistic row with real row
				setRows((currentRows) =>
					currentRows.map((row) =>
						row.id === tempRowId ? { ...createdRow, isOptimistic: false } : row
					)
				);

				showAlert("Row added successfully!", "success");
			} catch (error: any) {
				// Remove optimistic row on failure
				setRows((currentRows) => currentRows.filter((row) => row.id !== tempRowId));
				showAlert(error.message || "Failed to add row. Please try again.", "error");
			}
		},
		[cells, setRows, isAddingRow, showAlert, tablePermissions, columns, table?.id, token, tenantId],
	);

	const handleSaveNewRows = useCallback(async () => {
		if (!token || !tenantId || pendingNewRows.length === 0) return;

		setIsSavingNewRows(true);

		try {
			const validationErrors: string[] = [];
			
			pendingNewRows.forEach((row, rowIndex) => {
				if (!row.cells || !Array.isArray(row.cells)) {
					validationErrors.push(`Row ${rowIndex + 1}: Invalid cell data`);
					return;
				}

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
				showAlert(`Validation errors found:\n${validationErrors.join('\n')}`, "error");
				return;
			}

			const batchData = pendingNewRows.map((row) => ({
				cells: row.cells.map((cell: any) => ({
					columnId: cell.columnId,
					value: cell.value,
				})),
			}));

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

				setRows((currentRows) => {
					const updatedRows = [...currentRows];
					const filteredRows = updatedRows.filter((row) => !row.isLocalOnly);
					return [...savedRows, ...filteredRows];
				});

				setPendingNewRows([]);
				showAlert(`Successfully saved ${savedRows.length} row(s) to server!`, "success");

				if (pagination) {
					const newTotalRows = pagination.totalRows + savedRows.length;
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

	const handleDiscardNewRows = useCallback(() => {
		if (pendingNewRows.length === 0) return;

		setRows((currentRows) => currentRows.filter((row) => !row.isLocalOnly));
		setPendingNewRows([]);
		showAlert(`Discarded ${pendingNewRows.length} unsaved row(s).`, "info");
	}, [pendingNewRows, setRows, showAlert]);

	const handleDeleteRow = async (rowId: string) => {
		if (!token || !tenantId) {
			showAlert("Missing required information", "error");
			return;
		}

		if (!tablePermissions.canDeleteTable()) {
			showAlert("You don't have permission to delete rows in this table", "error");
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
				await refreshAfterChange();
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
		if (!token || !tenantId) {
			showAlert("Missing required information", "error");
			return;
		}

		if (!tablePermissions.canDeleteTable()) {
			showAlert("You don't have permission to delete rows in this table", "error");
			return;
		}

		if (rowIds.length === 0) return;

		// OPTIMISTIC UPDATE: Remove rows immediately from UI
		const rowsToDelete = paginatedRows?.filter(row => rowIds.includes(row.id.toString())) || [];
		
		setRows((currentRows) => currentRows.filter(row => !rowIds.includes(row.id.toString())));
		showAlert(`${rowIds.length} rows deleted!`, "success");

		// Background API call
		try {
			// Delete rows in parallel
			const deletePromises = rowIds.map(rowId =>
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
				await refreshAfterChange();
			} else {
				// Revert optimistic update for failed deletes
				const failedRowIds = rowIds.filter((_, index) => !responses[index].ok);
				const failedRows = rowsToDelete.filter(row => failedRowIds.includes(row.id.toString()));
				
				if (failedRows.length > 0) {
					setRows((currentRows) => [...failedRows, ...currentRows]);
				}
				
				showAlert(`Failed to delete ${failedDeletes.length} out of ${rowIds.length} rows`, "error");
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
			if (!token) return;

			await handleSaveCell(
				columnId,
				rowId,
				cellId,
				paginatedRows,
				async (updatedCell?: any) => {
					if (updatedCell) {
						setRows((currentRows: any[]) =>
							currentRows.map((row) => {
								if (row.id.toString() === rowId) {
									const existingCellIndex = row.cells.findIndex(
										(cell: any) =>
											cell.id === updatedCell.id ||
											(cell.columnId.toString() === columnId && cell.id === "virtual"),
									);

									let updatedCells = [...row.cells];

									if (existingCellIndex >= 0) {
										updatedCells[existingCellIndex] = updatedCell;
									} else {
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
								<Button
									onClick={handleInlineAddRow}
									disabled={!tablePermissions.canEditTable() || showInlineRowCreator}
									className='bg-primary hover:bg-primary/90 text-primary-foreground shadow-lg hover:shadow-xl transition-all duration-200 transform hover:scale-105'
									size='lg'>
									<Plus className='w-4 h-4 mr-2' />
									Add Row
								</Button>

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
							</div>
						</div>

						{/* Right Section - Tools & Filters */}
						<div className='flex items-center gap-3'>
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

			{/* Modern Toolbar */}
			<div className="w-full mx-auto px-4 sm:px-6 lg:px-8 py-4">
				<div className="bg-white border border-neutral-200 rounded-xl shadow-sm p-4">
					<div className="flex items-center gap-4 flex-wrap">
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

			{/* Main Content */}
			<div className='w-full mx-auto px-4 sm:px-6 lg:px-8 py-8 overflow-x-auto'>
				{/* Add Row Form */}
				{showAddRowForm && (
					<div className='mb-8'>
						<div className='bg-card border border-border/20 rounded-2xl shadow-2xl backdrop-blur-sm bg-gradient-to-br from-card to-card/80'>
							<div className='p-8'>
								<div className='flex items-center gap-3 mb-6'>
									<div className='w-10 h-10 bg-primary/10 rounded-full flex items-center justify-center'>
										<Plus className='w-5 h-5 text-primary' />
									</div>
									<div>
										<h2 className='text-xl font-semibold text-foreground'>Add New Row</h2>
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

				{/* Modern Table Grid */}
				<div className='bg-white rounded-xl border border-neutral-200 shadow-sm overflow-hidden'>
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
					) : (
						<div className='overflow-x-auto'>
							{/* Modern Column Headers */}
							<div className='flex border-b border-neutral-200 bg-neutral-50'>
								{/* Row number column */}
								<div className='w-16 flex-shrink-0 border-r border-neutral-200 bg-neutral-100 flex items-center justify-center px-4 py-2'>
									<span className='text-xs font-semibold text-neutral-700'>#</span>
								</div>
								
								{/* Data columns */}
								{columns?.map((column) => (
									<div
										key={column.id}
										className="flex items-center group relative"
										style={{ width: columnWidths[column.id] || 200 }}
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
									<div className='w-16 flex-shrink-0 border-l border-neutral-200 bg-neutral-100 flex items-center justify-center px-4 py-2'>
										<Button
											variant='ghost'
											size='sm'
											onClick={() => {
												setSelectedColumn(null);
												setShowColumnToolbar(true);
											}}
											className='h-8 w-8 p-0 hover:bg-blue-100 hover:text-blue-600 transition-all duration-200'
											title="Add new column">
											<Plus className='w-4 h-4' />
										</Button>
									</div>
								)}
							</div>

							{/* Inline Row Creator */}
							{showInlineRowCreator && (
								<InlineRowCreator
									columns={columns || []}
									onSave={handleInlineRowSave}
									onCancel={handleInlineRowCancel}
									isSaving={isAddingRow}
								/>
							)}

							{/* Data Rows */}
							<div className="data-grid">
								<RowGrid
								columns={columns || []}
								rows={paginatedRows || []}
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
							/>
							</div>
						</div>
					)}
				</div>
			</div>

			{/* Pagination Controls */}
			{pagination && pagination.totalPages > 1 && (
				<div className="w-full mx-auto px-4 sm:px-6 lg:px-8 py-4">
					<div className="bg-white border border-neutral-200 rounded-xl shadow-sm p-4">
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
