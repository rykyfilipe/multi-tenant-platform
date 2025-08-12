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

	// Memoize table header pentru a evita re-render-uri inutile
	const tableHeader = useMemo(
		() => (
			<thead>
				<tr className='bg-muted/20'>
					{columns.map((col) => (
						<th
							className='text-start p-3 sm:p-4 text-xs sm:text-sm font-medium text-muted-foreground uppercase tracking-wider border-b border-border/20'
							key={col.id}>
							{col.name}
						</th>
					))}
					{user?.role !== "VIEWER" && (
						<th className='text-center p-3 sm:p-4 text-xs sm:text-sm font-medium text-muted-foreground uppercase tracking-wider border-b border-border/20 w-16'>
							Actions
						</th>
					)}
				</tr>
			</thead>
		),
		[columns, user?.role],
	);

	// Memoize pagination info pentru a evita re-render-uri inutile
	const paginationInfo = useMemo(
		() => (
			<span className='text-sm text-muted-foreground bg-muted/50 px-2 py-1 rounded-md self-start sm:self-auto'>
				{totalItems} row{totalItems !== 1 && "s"}
				{showPagination && totalPages > 1 && (
					<span className='ml-2 text-xs'>
						(Page {currentPage} of {totalPages})
					</span>
				)}
			</span>
		),
		[totalItems, showPagination, totalPages, currentPage],
	);

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
					className='overflow-auto w-full'
					style={{
						scrollbarWidth: "none",
						msOverflowStyle: "none",
					}}>
					<table className='w-full min-w-full'>
						{tableHeader}
						<tbody>
							{loading ? (
								<tr>
									<td
										colSpan={columns.length + (user?.role !== "VIEWER" ? 1 : 0)}
										className='text-center py-8 sm:py-12 text-sm sm:text-base text-muted-foreground'>
										<div className='flex items-center justify-center gap-2'>
											<div className='animate-spin rounded-full h-6 w-6 border-b-2 border-primary'></div>
											<span>Loading data...</span>
										</div>
									</td>
								</tr>
							) : rows.length === 0 ? (
								<tr>
									<td
										colSpan={columns.length + (user?.role !== "VIEWER" ? 1 : 0)}
										className='text-center py-8 sm:py-12 text-sm sm:text-base text-muted-foreground'>
										No data yet.
									</td>
								</tr>
							) : (
								rows.map((row) => {
									// Skip rows without valid ID
									if (!row || row.id === undefined || row.id === null) {
										return null;
									}

									return (
										<tr
											key={row.id}
											className='row-row hover:bg-muted/30 transition-colors border-b border-border/10'>
											{columns.map((col) => {
												// Skip columns without valid ID
												if (!col || col.id === undefined || col.id === null) {
													return null;
												}

												const cell = row.cells?.find(
													(cell) => cell && cell.columnId === col.id,
												);

												// If no cell exists for this column, create a virtual cell for editing
												if (!cell) {
													const virtualCell: Cell = {
														id: 0, // Virtual ID
														rowId: row.id,
														columnId: col.id,
														value: null,
													};

													return (
														<td
															key={`${row.id}-${col.id}-empty`}
															className='p-3 sm:p-4'>
															<EditableCell
																columns={columns}
																cell={virtualCell}
																tables={tables}
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
														className='p-3 sm:p-4'>
														<EditableCell
															columns={columns}
															cell={cell}
															tables={tables}
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
											{user?.role !== "VIEWER" && (
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
							)}
						</tbody>
					</table>
				</div>
			</CardContent>

			{/* Pagination */}
			{showPagination && totalPages > 1 && (
				<div className='border-t border-border/20'>
					<Pagination
						currentPage={currentPage}
						totalPages={totalPages}
						onPageChange={onPageChange}
						pageSize={pageSize}
						totalItems={totalItems}
						onPageSizeChange={onPageSizeChange}
					/>
				</div>
			)}
		</Card>
	);
});
