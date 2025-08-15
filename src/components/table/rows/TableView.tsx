/** @format */
"use client";

import { Table, Row, Column, Cell } from "@/types/database";
import { Card, CardContent, CardHeader, CardTitle } from "../../ui/card";
import { Database, Trash2 } from "lucide-react";
import { Button } from "../../ui/button";
import { EditableCell } from "./EditableCell";
import { useApp } from "@/contexts/AppContext";
import { Pagination } from "../../ui/pagination";
import { memo, useMemo } from "react";
import { useCurrentUserPermissions } from "@/hooks/useCurrentUserPermissions";
import { useTablePermissions } from "@/hooks/useTablePermissions";

interface Props {
	tables: Table[] | null;
	table: Table;
	rows: Row[];
	columns: Column[];
	loading?: boolean;

	editingCell: { rowId: string; columnId: string } | null;
	onEditCell: (rowId: string, columnId: string, cellId: string) => void;
	onSaveCell: (
		rowId: string,
		columnId: string,
		cellId: string,
		value: any,
	) => void;
	onCancelEdit: () => void;
	onDeleteRow: (rowId: string) => void;

	// Pagination props
	currentPage: number;
	pageSize: number;
	totalPages: number;
	totalItems: number;
	onPageChange: (page: number) => void;
	onPageSizeChange?: (pageSize: number) => void;
	showPagination?: boolean;
}

export const TableView = memo(function TableView({
	tables,
	table,
	rows,
	columns,
	loading = false,
	editingCell,
	onEditCell,
	onSaveCell,
	onCancelEdit,
	onDeleteRow,
	currentPage,
	pageSize,
	totalPages,
	totalItems,
	onPageChange,
	onPageSizeChange,
	showPagination = true,
}: Props) {
	const { user } = useApp();
	const { permissions: userPermissions } = useCurrentUserPermissions();

	// Ensure tables and columns are arrays
	const safeTables = Array.isArray(tables) ? tables : [];
	const safeColumns = Array.isArray(columns) ? columns : [];
	const safeRows = Array.isArray(rows) ? rows : [];

	// Additional safety check for rows - filter out any rows with null/undefined cells
	const validatedRows = safeRows.filter(
		(row) => row && row.id && row.cells && Array.isArray(row.cells),
	);

	// If no valid rows after validation, show empty state
	const hasValidRows = validatedRows.length > 0;

	// Folosim permisiunile pentru a filtra coloanele vizibile
	const tablePermissions = useTablePermissions(
		table.id,
		userPermissions?.tablePermissions || [],
		userPermissions?.columnsPermissions || [],
	);

	// Filtrăm coloanele în funcție de permisiuni
	const visibleColumns = useMemo(() => {
		return tablePermissions.getVisibleColumns(safeColumns);
	}, [safeColumns, tablePermissions]);

	// Memoize table header pentru a evita re-render-uri inutile
	const tableHeader = useMemo(
		() => (
			<thead>
				<tr className='bg-muted/20'>
					{safeColumns.map((col) => (
						<th
							className='text-start p-3 sm:p-4 text-xs sm:text-sm font-medium text-muted-foreground uppercase tracking-wider border-b border-border/20'
							key={col.id}>
							{col.name}
						</th>
					))}
					{user?.role !== "VIEWER" && tablePermissions.canEditTable() && (
						<th className='text-center p-3 sm:p-4 text-xs sm:text-sm font-medium text-muted-foreground uppercase tracking-wider border-b border-border/20 w-16'>
							Actions
						</th>
					)}
				</tr>
			</thead>
		),
		[safeColumns, user?.role, tablePermissions],
	);

	// Memoize pagination info pentru a evita re-render-uri inutile
	const paginationInfo = useMemo(() => {
		return (
			<span className='text-sm text-muted-foreground bg-muted/50 px-2 py-1 rounded-md self-start sm:self-auto'>
				{totalItems} row{totalItems !== 1 && "s"}
				{showPagination && totalPages > 1 && (
					<span className='ml-2 text-xs'>
						(Page {currentPage} of {totalPages})
					</span>
				)}
			</span>
		);
	}, [totalItems, showPagination, totalPages, currentPage]);

	// Verificăm dacă utilizatorul are acces la tabel
	if (!tablePermissions.canReadTable()) {
		return (
			<Card className='shadow-lg'>
				<CardContent className='p-8 text-center'>
					<div className='text-muted-foreground'>
						<p className='text-lg font-medium mb-2'>Access Denied</p>
						<p className='text-sm'>
							You don't have permission to view this table.
						</p>
					</div>
				</CardContent>
			</Card>
		);
	}

	return (
		<Card className='shadow-lg'>
			<CardHeader className='pb-4'>
				<div className='flex flex-col sm:flex-row sm:items-center gap-2 sm:gap-4'>
					<div className='flex items-center gap-2'>
						<Database className='w-5 h-5 sm:w-6 sm:h-6' />
						<CardTitle className='text-lg sm:text-xl'>Table Data</CardTitle>
					</div>
					{paginationInfo}
				</div>
			</CardHeader>
			<CardContent className='p-0 sm:p-6'>
				<div
					className='overflow-auto w-full min-h-[400px]'
					style={{
						scrollbarWidth: "none",
						msOverflowStyle: "none",
					}}>
					<table className='w-full min-w-full '>
						{tableHeader}
						<tbody className='min-h-[400px]'>
							{loading ? (
								<tr className='min-h-[60px]'>
									<td
										colSpan={
											safeColumns.length +
											(user?.role !== "VIEWER" &&
											tablePermissions.canEditTable()
												? 1
												: 0)
										}
										className='text-center py-8 sm:py-12 text-sm sm:text-base text-muted-foreground min-h-[60px]'>
										<div className='flex items-center justify-center gap-2'>
											<div className='animate-spin rounded-full h-6 w-6 border-b-2 border-primary'></div>
											<span>Loading data...</span>
										</div>
									</td>
								</tr>
							) : validatedRows.length === 0 ? (
								<tr className='min-h-[60px]'>
									<td
										colSpan={
											safeColumns.length +
											(user?.role !== "VIEWER" &&
											tablePermissions.canEditTable()
												? 1
												: 0)
										}
										className='text-center py-8 sm:py-12 text-sm sm:text-base text-muted-foreground min-h-[60px]'>
										No data yet.
									</td>
								</tr>
							) : hasValidRows ? (
								validatedRows.map((row) => {
									return (
										<tr
											key={row.id}
											className='hover:bg-muted/30 transition-colors border-b border-border/10 min-h-[60px]'>
											{safeColumns.map((col) => {
												// Căutăm celula pentru această coloană
												// Verificăm că row.cells există și este un array
												if (!row.cells || !Array.isArray(row.cells)) {
													// Dacă nu există celule, o creăm virtual
													return (
														<td
															key={`${row.id}-${col.id}-virtual`}
															className='p-3 sm:p-4 min-h-[60px]'>
															<EditableCell
																columns={safeColumns}
																cell={{
																	id: 0,
																	rowId: row.id,
																	columnId: col.id,
																	value: null,
																}}
																tables={safeTables}
																isEditing={
																	editingCell?.rowId === String(row.id) &&
																	Number(editingCell.columnId) === col.id
																}
																onStartEdit={() => {
																	onEditCell(
																		String(row.id),
																		String(col.id),
																		"virtual",
																	);
																}}
																onSave={(val) => {
																	onSaveCell(
																		String(col.id),
																		String(row.id),
																		"virtual",
																		val,
																	);
																}}
																onCancel={onCancelEdit}
															/>
														</td>
													);
												}

												const cell = row.cells.find(
													(c: any) => c.columnId === col.id,
												);

												if (!cell) {
													// Dacă nu există celulă, o creăm virtual
													return (
														<td
															key={`${row.id}-${col.id}-virtual`}
															className='p-3 sm:p-4 min-h-[60px]'>
															<EditableCell
																columns={safeColumns}
																cell={{
																	id: 0,
																	rowId: row.id,
																	columnId: col.id,
																	value: null,
																}}
																tables={safeTables}
																isEditing={
																	editingCell?.rowId === String(row.id) &&
																	Number(editingCell.columnId) === col.id
																}
																onStartEdit={() => {
																	onEditCell(
																		String(row.id),
																		String(col.id),
																		"virtual",
																	);
																}}
																onSave={(val) => {
																	onSaveCell(
																		String(col.id),
																		String(row.id),
																		"virtual",
																		val,
																	);
																}}
																onCancel={onCancelEdit}
															/>
														</td>
													);
												}

												// Validate cell has required properties
												if (!cell.id || !cell.rowId || !cell.columnId) {
													return (
														<td
															key={`${row.id}-${col.id}-invalid`}
															className='text-red-400 italic p-3 sm:p-4 text-sm'>
															Invalid Cell
														</td>
													);
												}

												return (
													<td
														key={`${row.id}-${col.id}-${cell.id}`}
														className='p-3 sm:p-4 min-h-[60px]'>
														<EditableCell
															columns={safeColumns}
															cell={cell}
															tables={safeTables}
															isEditing={
																editingCell?.rowId === String(row.id) &&
																Number(editingCell.columnId) === col.id
															}
															onStartEdit={() => {
																onEditCell(
																	String(cell.rowId),
																	String(cell.columnId),
																	String(cell.id),
																);
															}}
															onSave={(val) => {
																onSaveCell(
																	String(cell.columnId),
																	String(cell.rowId),
																	String(cell.id),
																	val,
																);
															}}
															onCancel={onCancelEdit}
														/>
													</td>
												);
											})}
											{user?.role !== "VIEWER" &&
												tablePermissions.canEditTable() && (
													<td className='p-3 sm:p-4 text-center'>
														<Button
															variant='ghost'
															size='sm'
															onClick={() => onDeleteRow(String(row.id))}
															className='h-8 w-8 p-0 text-muted-foreground hover:text-red-600 hover:bg-red-50'>
															<Trash2 className='w-4 h-4' />
														</Button>
													</td>
												)}
										</tr>
									);
								})
							) : (
								<tr className='min-h-[60px]'>
									<td
										colSpan={
											safeColumns.length +
											(user?.role !== "VIEWER" &&
											tablePermissions.canEditTable()
												? 1
												: 0)
										}
										className='text-center py-8 sm:py-12 text-sm sm:text-base text-muted-foreground min-h-[60px]'>
										No data available.
									</td>
								</tr>
							)}
						</tbody>
					</table>
				</div>
			</CardContent>

			{/* Pagination */}
			{showPagination && (
				<div className='border-t border-border/20 bg-muted/10'>
					{totalPages > 1 ? (
						<Pagination
							currentPage={currentPage}
							totalPages={totalPages}
							onPageChange={onPageChange}
							pageSize={pageSize}
							totalItems={totalItems}
							onPageSizeChange={onPageSizeChange}
						/>
					) : (
						<div className='p-4 text-center text-sm text-muted-foreground'>
							{totalItems === 0 ? "No data available" : "Single page of data"}
						</div>
					)}
				</div>
			)}
		</Card>
	);
});
