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
import { AddRowForm } from "./AddRowForm";
import { TableView } from "./TableView";
import { TableFilters, FilterToggleButton } from "./TableFilters";
import useRowsTableEditor from "@/hooks/useRowsTableEditor";
import useTableRows from "@/hooks/useTableRows";
import { Button } from "@/components/ui/button";
import { X } from "lucide-react";
import ImportExportControls from "./ImportExportControls";
import { cn } from "@/lib/utils";
import Link from "next/link";
import { useCurrentUserPermissions } from "@/hooks/useCurrentUserPermissions";
import { useTablePermissions } from "@/hooks/useTablePermissions";

interface Props {
	table: Table;
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
	// Columns loaded
	if (!columns) return null;

	const { showAlert, token, user, tenant } = useApp();
	const { selectedDatabase, tables } = useDatabase();
	const tenantId = tenant?.id;
	const [showForm, setShowForm] = useState(false);
	const [serverError, setServerError] = useState<string | null>(null);
	if (!token || !user) return null;

	const [cells, setCells] = useState<any[]>([]);

	// Verificăm permisiunile utilizatorului
	const { permissions: userPermissions } = useCurrentUserPermissions();
	const tablePermissions = useTablePermissions(
		table.id,
		userPermissions?.tablePermissions || [],
		userPermissions?.columnsPermissions || [],
	);

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
	} = useTableRows(table.id.toString(), 25);

	const { editingCell, handleCancelEdit, handleEditCell, handleSaveCell } =
		useRowsTableEditor();

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
		async (e: FormEvent) => {
			e.preventDefault();

			if (!token) return console.error("No token available");

			// Verificăm dacă utilizatorul poate edita tabelul
			if (!tablePermissions.canEditTable()) {
				showAlert(
					"You don't have permission to add rows to this table",
					"error",
				);
				return;
			}

			// Clear any previous server errors
			setServerError(null);

			try {
				const response = await fetch(
					`/api/tenants/${tenantId}/databases/${table.databaseId}/tables/${table.id}/rows`,
					{
						method: "POST",
						headers: {
							"Content-Type": "application/json",
							Authorization: `Bearer ${token}`,
						},
						body: JSON.stringify({ cells }),
					},
				);

				if (response.ok) {
					const newRow = await response.json();
					showAlert("Row added successfully!", "success");
					setShowForm(false);
					setCells([]);

					// Use silent refresh to update data without showing loading state
					// This provides better UX by avoiding the "loading tables" message
					await silentRefresh();
				} else {
					const errorData = await response.json();
					throw new Error(errorData.error || "Failed to add row");
				}
			} catch (error: any) {
				console.error("Error adding row:", error);
				setServerError(error.message || "Failed to add row");
				showAlert(
					error.message || "Failed to add row. Please try again.",
					"error",
				);
			}
		},
		[
			token,
			tenantId,
			table.databaseId,
			table.id,
			cells,
			setRows,
			showAlert,
			tablePermissions,
			silentRefresh,
		],
	);

	const handleDelete = useCallback(
		async (rowId: string) => {
			if (!token || !tenantId) return;

			// Verificăm dacă utilizatorul poate șterge rânduri
			if (!tablePermissions.canDeleteTable()) {
				showAlert(
					"You don't have permission to delete rows from this table",
					"error",
				);
				return;
			}

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
					const errorMessage = errorData.error || "Failed to remove data row";
					throw new Error(errorMessage);
				}

				// Update local state immediately for better UX
				setRows((prevRows: any[]) =>
					prevRows.filter((row) => row.id.toString() !== rowId),
				);

				// Check if we need to adjust pagination after deletion
				if (pagination && pagination.totalRows > 1) {
					const newTotalRows = pagination.totalRows - 1;
					const newTotalPages = Math.ceil(newTotalRows / pagination.pageSize);

					// If current page is now beyond total pages, go to last page
					if (pagination.page > newTotalPages && newTotalPages > 0) {
						await fetchRows(newTotalPages, pagination.pageSize);
					}
					// No need to refetch - local state is already updated
				}

				// Use silent refresh to update data without showing loading state
				// This provides better UX by avoiding the "loading tables" message
				await silentRefresh();

				showAlert("Data row removed successfully", "success");
			} catch (error: any) {
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
			}
		},
		[
			tenantId,
			table.databaseId,
			table.id,
			token,
			// refreshAfterChange, // This line is removed as per the edit hint
			showAlert,
			setRows,
			pagination,
			fetchRows,
			tablePermissions,
			silentRefresh,
		],
	);

	const handleSaveCellWrapper = useCallback(
		async (columnId: string, rowId: string, cellId: string, value: any) => {
			await handleSaveCell(
				columnId,
				rowId,
				cellId,
				paginatedRows,
				async () => {
					// Use silent refresh to update data without showing loading state
					// This provides better UX by avoiding the "loading tables" message
					await silentRefresh();
				},
				value,
				table,
				token,
				user,
				showAlert,
			);
		},
		[
			handleSaveCell,
			paginatedRows,
			silentRefresh,
			table,
			token,
			user,
			showAlert,
		],
	);

	// Verificăm dacă utilizatorul are acces la tabel
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

	return (
		<div className='space-y-6'>
			{/* Header Actions */}
			<div className='flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4'>
				<div className='flex items-center  w-full space-x-3'>
					{/* Butonul Add Row - doar dacă utilizatorul poate edita */}
					{tablePermissions.canEditTable() && (
						<Button
							onClick={() => {
								setShowForm((prev) => !prev);
								// Clear server error when toggling form
								setServerError(null);
							}}
							className={
								user.role === "VIEWER" ? "opacity-0 pointer-events-none" : ""
							}>
							{showForm ? <X className='w-4 h-4' /> : "Add Row"}
						</Button>
					)}
					{showForm && (
						<span className='text-sm text-muted-foreground'>
							Fill in the form below to add a new row
						</span>
					)}
					<Link
						href={`/home/database/table/${table.id}/columns`}
						className='rows-button'>
						<Button variant='outline' size='sm'>
							Manage Columns
						</Button>
					</Link>
				</div>
				<div className='flex items-center space-x-3'>
					<FilterToggleButton
						showSidebar={showSidebar}
						setShowSidebar={setShowSidebar}
						activeFiltersCount={activeFiltersCount}
					/>
					<ImportExportControls
						rows={paginatedRows || []}
						columns={columns || []}
						table={table}
						globalSearch={globalSearch}
						filters={filters}
						onRefresh={refetchRows}
					/>
				</div>
			</div>

			{/* Add Row Form - doar dacă utilizatorul poate edita */}
			{showForm && tablePermissions.canEditTable() && (
				<div className='border border-border/20 bg-card/50 backdrop-blur-sm rounded-lg p-6'>
					<AddRowForm
						columns={columns || []}
						cells={cells}
						setCells={setCells}
						onAdd={handleAdd}
						tables={tables || []}
						serverError={serverError}
					/>
				</div>
			)}

			{/* Filters */}
			<TableFilters
				columns={columns || []}
				rows={paginatedRows || []}
				tables={tables || []}
				onFilterChange={() => {}} // Required prop but not used for server-side filtering
				onApplyFilters={applyFilters}
				showToggleButton={false}
				showSidebar={showSidebar}
				setShowSidebar={setShowSidebar}
				onActiveFiltersChange={setActiveFiltersCount}
				loading={rowsLoading}
			/>

			{/* Rows Table */}
			<div className='table-content'>
				{rowsLoading ? (
					<div className='flex items-center justify-center py-12'>
						<div className='flex items-center gap-2'>
							<div className='animate-spin rounded-full h-6 w-6 border-b-2 border-primary'></div>
							<span className='text-muted-foreground'>
								Loading table data...
							</span>
						</div>
					</div>
				) : (
					<TableView
						tables={tables || []}
						table={table}
						columns={columns || []}
						rows={paginatedRows || []}
						loading={false}
						editingCell={editingCell}
						onEditCell={handleEditCell}
						onSaveCell={handleSaveCellWrapper}
						onCancelEdit={handleCancelEdit}
						onDeleteRow={handleDelete}
						currentPage={pagination?.page || 1}
						pageSize={pagination?.pageSize || 25}
						totalPages={pagination?.totalPages || 1}
						totalItems={pagination?.totalRows || 0}
						onPageChange={(page) => fetchRows(page, pagination?.pageSize || 25)}
						onPageSizeChange={(pageSize) => fetchRows(1, pageSize)}
						showPagination={true}
					/>
				)}
			</div>
		</div>
	);
});

export default TableEditor;
