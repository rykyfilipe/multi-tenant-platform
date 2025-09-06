/** @format */
"use client";

import { Table, Row, Column, Cell } from "@/types/database";
import { Card, CardContent, CardHeader, CardTitle } from "../../ui/card";
import {
	Database,
	Trash2,
	Table as TableIcon,
	CheckCircle,
	AlertTriangle,
	Clock,
	ChevronLeft,
	ChevronRight,
} from "lucide-react";
import { Button } from "../../ui/button";
import { EditableCell } from "./EditableCell";
import { useApp } from "@/contexts/AppContext";
import { Pagination } from "../../ui/pagination";
import { memo, useMemo, useState, useCallback } from "react";
import { useCurrentUserPermissions } from "@/hooks/useCurrentUserPermissions";
import { useTablePermissions } from "@/hooks/useTablePermissions";
import { Checkbox } from "../../ui/checkbox";
import {
	AlertDialog,
	AlertDialogAction,
	AlertDialogCancel,
	AlertDialogContent,
	AlertDialogDescription,
	AlertDialogFooter,
	AlertDialogHeader,
	AlertDialogTitle,
} from "../../ui/alert-dialog";
import { cn } from "@/lib/utils";
import { motion, AnimatePresence } from "framer-motion";

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
	onBulkDelete?: (rowIds: string[]) => void;
	deletingRows?: Set<string>;

	// Pagination props
	currentPage: number;
	pageSize: number;
	totalPages: number;
	totalItems: number;
	onPageChange: (page: number) => void;
	onPageSizeChange?: (pageSize: number) => void;
	showPagination?: boolean;

	// Batch editing props
	hasPendingChange?: (rowId: string, columnId: string) => boolean;
	getPendingValue?: (rowId: string, columnId: string) => any;
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
	onBulkDelete,
	deletingRows = new Set(),
	currentPage,
	pageSize,
	totalPages,
	totalItems,
	onPageChange,
	onPageSizeChange,
	showPagination = true,
	hasPendingChange,
	getPendingValue,
}: Props) {
	// Early return if table is null or undefined
	if (!table) {
		return null;
	}
	
	const { user } = useApp();
	const { permissions: userPermissions } = useCurrentUserPermissions();

	// Row selection state
	const [selectedRows, setSelectedRows] = useState<Set<string>>(new Set());
	const [showBulkDeleteConfirm, setShowBulkDeleteConfirm] = useState(false);

	// Ensure tables and columns are arrays
	const safeTables = Array.isArray(tables) ? tables : [];
	const safeColumns = Array.isArray(columns) ? columns : [];
	const safeRows = Array.isArray(rows) ? rows : [];

	// Additional safety check for rows - filter out any rows with null/undefined cells
	const validatedRows = safeRows.filter(
		(row) => {
			const isValid = row && row.id && row.cells && Array.isArray(row.cells);
			if (!isValid) {
				
			}
			return isValid;
		}
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
		const visible = tablePermissions.getVisibleColumns(safeColumns);
		
		return visible;
	}, [safeColumns, tablePermissions]);

	// Handle row selection
	const handleRowSelection = useCallback((rowId: string, checked: boolean) => {
		setSelectedRows((prev) => {
			const newSet = new Set(prev);
			if (checked) {
				newSet.add(rowId);
			} else {
				newSet.delete(rowId);
			}
			return newSet;
		});
	}, []);

	// Handle select all rows
	const handleSelectAll = useCallback(
		(checked: boolean) => {
			if (checked) {
				setSelectedRows(new Set(validatedRows.map((row) => String(row.id))));
			} else {
				setSelectedRows(new Set());
			}
		},
		[validatedRows],
	);

	// Handle bulk delete confirmation
	const handleBulkDeleteClick = useCallback(() => {
		if (selectedRows.size === 0) return;
		setShowBulkDeleteConfirm(true);
	}, [selectedRows.size]);

	// Handle bulk delete execution
	const handleBulkDeleteConfirm = useCallback(() => {
		if (selectedRows.size === 0 || !onBulkDelete) return;
		onBulkDelete(Array.from(selectedRows));
		setSelectedRows(new Set()); // Clear selection after bulk delete
		setShowBulkDeleteConfirm(false);
	}, [selectedRows, onBulkDelete]);

	// Check if all rows are selected
	const allRowsSelected =
		validatedRows.length > 0 && selectedRows.size === validatedRows.length;
	const someRowsSelected =
		selectedRows.size > 0 && selectedRows.size < validatedRows.length;

	// Memoize table header pentru a evita re-render-uri inutile
	const tableHeader = useMemo(
		() => (
			<thead>
				<tr className='bg-muted/20'>
					<th className='text-center p-3 sm:p-4 text-xs sm:text-sm font-medium text-muted-foreground uppercase tracking-wider border-b border-border/20 w-12'>
						<Checkbox
							checked={allRowsSelected}
							indeterminate={someRowsSelected}
							onCheckedChange={handleSelectAll}
							disabled={!tablePermissions.canEditTable()}
							className='data-[state=checked]:bg-primary data-[state=checked]:border-primary'
						/>
					</th>
					{visibleColumns.map((col) => (
						<th
							className='text-start p-3 sm:p-4 text-xs sm:text-sm font-medium text-muted-foreground uppercase tracking-wider border-b border-border/20'
							key={col.id}>
							{col.name}
						</th>
					))}
				</tr>
			</thead>
		),
		[
			visibleColumns,
			tablePermissions,
			allRowsSelected,
			someRowsSelected,
			handleSelectAll,
		],
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

	// Nu mai afișăm skeleton la nivelul TableView - se ocupă TableEditor

	// TableEditor gestionează skeleton și "Access Denied" - aici doar filtrăm datele

	return (
		<div className='w-full'>
			{/* Enhanced Table Header with Modern Design */}
			<div className='bg-gradient-to-r from-muted/30 via-muted/20 to-muted/30 border-b border-border/20 px-6 py-4'>
				<div className='flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4'>
					{/* Left Section - Table Info & Selection Status */}
					<div className='flex items-center gap-4'>
						<div className='flex items-center gap-3'>
							<div className='flex items-center justify-center w-8 h-8 bg-primary/10 rounded-lg'>
								<TableIcon className='w-4 h-4 text-primary' />
							</div>
							<div>
								<h2 className='text-lg font-semibold text-foreground'>
									Table Data
								</h2>
								<div className='flex items-center gap-4 text-sm text-muted-foreground'>
									{paginationInfo}
									{selectedRows.size > 0 && (
										<span className='inline-flex items-center gap-2 px-3 py-1 bg-primary/10 text-primary rounded-full font-medium'>
											<CheckCircle className='w-3 h-3' />
											{selectedRows.size} selected
										</span>
									)}
								</div>
							</div>
						</div>
					</div>

					{/* Right Section - Bulk Actions */}
					<div className='flex items-center gap-3'>
					{selectedRows.size > 0 && onBulkDelete && (
						<Button
							onClick={handleBulkDeleteClick}
							variant='destructive'
							size='sm'
							disabled={!tablePermissions.canEditTable()}
							className='bg-destructive hover:bg-destructive/90 text-destructive-foreground shadow-lg hover:shadow-xl transition-all duration-200 transform hover:scale-105'>
							<Trash2 className='w-4 h-4 mr-2' />
							Delete Selected ({selectedRows.size})
						</Button>
					)}
					</div>
				</div>
			</div>

			{/* Modern Table Container */}
			<div className='overflow-hidden'>
				<div className='overflow-x-auto'>
					<table className='w-full min-w-full'>
						{/* Enhanced Table Header */}
						<thead className='bg-muted/30 border-b border-border/20'>
							<tr>
								{/* Selection Column */}
								<th className='sticky left-0 z-20 bg-muted/30 backdrop-blur-sm border-r border-border/20 px-2 sm:px-4 py-2 sm:py-3 text-left'>
									<div className='flex items-center justify-center'>
										<Checkbox
											checked={
												selectedRows.size === validatedRows.length &&
												validatedRows.length > 0
											}
											indeterminate={
												selectedRows.size > 0 &&
												selectedRows.size < validatedRows.length
											}
											onCheckedChange={handleSelectAll}
											disabled={!tablePermissions.canEditTable()}
											className='data-[state=checked]:bg-primary data-[state=checked]:border-primary data-[state=indeterminate]:bg-primary/50 data-[state=indeterminate]:border-primary/50'
										/>
									</div>
								</th>

								{/* Data Columns */}
								{safeColumns.map((col) => (
									<th
										key={col.id}
										className='px-2 sm:px-4 py-2 sm:py-3 text-left text-xs sm:text-sm font-semibold text-foreground bg-muted/30 backdrop-blur-sm border-r border-border/20 min-w-[120px]'>
										<div className='flex items-center gap-1 sm:gap-2'>
											<span className='truncate'>{col.name}</span>
											{col.type && (
												<span className='hidden sm:inline-flex items-center px-1.5 sm:px-2 py-0.5 sm:py-1 text-xs font-medium bg-muted/50 text-muted-foreground rounded-md'>
													{col.type}
												</span>
											)}
										</div>
									</th>
								))}

								{/* Actions Column */}
								<th className='px-2 sm:px-4 py-2 sm:py-3 text-center text-xs sm:text-sm font-semibold text-foreground bg-muted/30 backdrop-blur-sm border-r border-border/20 last:border-r-0 w-16 sm:w-20'>
									Actions
								</th>
							</tr>
						</thead>

						{/* Enhanced Table Body */}
						<tbody className='divide-y divide-border/10'>
							{validatedRows.length === 0 ? (
								<tr>
									<td
										colSpan={
											1 + // Selection column (always visible)
											safeColumns.length + // Data columns
											1 // Actions column (always visible)
										}
										className='px-6 py-16 text-center'>
										<div className='flex flex-col items-center gap-4'>
											<div className='w-16 h-16 bg-muted/30 rounded-full flex items-center justify-center'>
												<Database className='w-8 h-8 text-muted-foreground' />
											</div>
											<div className='text-center'>
												<h3 className='text-lg font-semibold text-foreground mb-2'>
													No data available
												</h3>
												<p className='text-muted-foreground max-w-md'>
													This table doesn't have any rows yet. Start by adding
													your first row using the "Add Row" button above.
												</p>
											</div>
										</div>
									</td>
								</tr>
							) : (
								<AnimatePresence>
									{validatedRows.map((row, index) => {
										const rowHasPendingChanges = visibleColumns.some((col) =>
											hasPendingChange?.(String(row.id), String(col.id)),
										);

										return (
											<motion.tr
												key={row.id}
												initial={{ opacity: 0, y: 20 }}
												animate={{ opacity: 1, y: 0 }}
												exit={{ opacity: 0, y: -20 }}
												transition={{ duration: 0.3, delay: index * 0.05 }}
												className={cn(
													"hover:bg-muted/20 transition-all duration-200 group",
													rowHasPendingChanges &&
														"bg-amber-50/20 border-l-4 border-l-amber-400",
													selectedRows.has(String(row.id)) &&
														"bg-primary/5 border-l-4 border-l-primary",
													row.isOptimistic &&
														"bg-blue-50/30 border-l-4 border-l-blue-400",
													deletingRows.has(String(row.id)) &&
														"opacity-50 bg-destructive/5",
												)}>
												{/* Selection Cell */}
												<td className='sticky left-0 z-10 bg-background group-hover:bg-muted/20 border-r border-border/20 px-4 py-4'>
													<div className='flex items-center justify-center'>
														<Checkbox
															checked={selectedRows.has(String(row.id))}
															onCheckedChange={(checked) =>
																handleRowSelection(
																	String(row.id),
																	checked as boolean,
																)
															}
															disabled={!tablePermissions.canEditTable()}
															className='data-[state=checked]:bg-primary data-[state=checked]:border-primary'
														/>
													</div>
												</td>

												{/* Data Cells */}
												{safeColumns.map((col) => {
													if (!row.cells || !Array.isArray(row.cells)) {
														return (
															<td
																key={`${row.id}-${col.id}-virtual`}
																className='px-4 py-4 border-r border-border/20 last:border-r-0'>
																<EditableCell
																	columns={safeColumns}
																	cell={{
																		id: 0,
																		rowId: row.id,
																		columnId: col.id,
																		value: "",
																		column: col,
																	}}
																	isEditing={editingCell?.rowId === String(row.id) && editingCell?.columnId === String(col.id)}
																	onStartEdit={() => onEditCell(String(row.id), String(col.id), "0")}
																	onSave={(value) => onSaveCell(String(row.id), String(col.id), "0", value)}
																	onCancel={onCancelEdit}
																	tables={tables}
																	hasPendingChange={hasPendingChange?.(String(row.id), String(col.id))}
																	pendingValue={getPendingValue?.(String(row.id), String(col.id))}
																/>
															</td>
														);
													}

													const cell = row.cells.find(
														(c: any) => c.columnId === col.id,
													);
													if (!cell) {
														return (
															<td
																key={`${row.id}-${col.id}-missing`}
																className='px-4 py-4 border-r border-border/20 last:border-r-0'>
																<EditableCell
																	columns={safeColumns}
																	cell={{
																		id: 0,
																		rowId: row.id,
																		columnId: col.id,
																		value: "",
																		column: col,
																	}}
																	isEditing={editingCell?.rowId === String(row.id) && editingCell?.columnId === String(col.id)}
																	onStartEdit={() => onEditCell(String(row.id), String(col.id), "0")}
																	onSave={(value) => onSaveCell(String(row.id), String(col.id), "0", value)}
																	onCancel={onCancelEdit}
																	tables={tables}
																	hasPendingChange={hasPendingChange?.(String(row.id), String(col.id))}
																	pendingValue={getPendingValue?.(String(row.id), String(col.id))}
																/>
															</td>
														);
													}

													return (
														<td
															key={`${row.id}-${col.id}-${cell.id}`}
															className='px-4 py-4 border-r border-border/20'>
															<EditableCell
																columns={safeColumns}
																cell={cell}
																isEditing={editingCell?.rowId === String(row.id) && editingCell?.columnId === String(col.id)}
																onStartEdit={() => onEditCell(String(row.id), String(col.id), String(cell.id))}
																onSave={(value) => onSaveCell(String(row.id), String(col.id), String(cell.id), value)}
																onCancel={onCancelEdit}
																tables={tables}
																hasPendingChange={hasPendingChange?.(String(row.id), String(col.id))}
																pendingValue={getPendingValue?.(String(row.id), String(col.id))}
															/>
														</td>
													);
												})}

												{/* Actions Cell */}
												<td className='px-4 py-4 text-center border-r border-border/20 last:border-r-0'>
													<Button
														onClick={() => onDeleteRow(String(row.id))}
														variant='ghost'
														size='sm'
														disabled={deletingRows.has(String(row.id)) || !tablePermissions.canEditTable()}
														className='h-8 w-8 p-0 text-destructive hover:text-destructive-foreground hover:bg-destructive/10 transition-all duration-200'>
														{deletingRows.has(String(row.id)) ? (
															<div className='w-4 h-4 border-2 border-destructive border-t-transparent rounded-full animate-spin' />
														) : (
															<Trash2 className='w-4 h-4' />
														)}
													</Button>
												</td>

											</motion.tr>
										);
									})}
								</AnimatePresence>
							)}
						</tbody>
					</table>
				</div>
			</div>

			{/* Enhanced Pagination */}
			{showPagination && (
				<div className='bg-muted/20 border-t border-border/20 px-6 py-4'>
					<div className='flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4'>
						<div className='flex items-center gap-4 text-sm text-muted-foreground'>
							<span>
								Showing {(currentPage - 1) * pageSize + 1} to{" "}
								{Math.min(currentPage * pageSize, totalItems)} of {totalItems}{" "}
								results
							</span>
						</div>

						<div className='flex items-center gap-2'>
							<Button
								variant='outline'
								size='sm'
								onClick={() => onPageChange(currentPage - 1)}
								disabled={currentPage <= 1}
								className='h-8 px-3'>
								<ChevronLeft className='w-4 h-4' />
								Previous
							</Button>

							<div className='flex items-center gap-1'>
								{Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
									const page = i + 1;
									return (
										<Button
											key={page}
											variant={page === currentPage ? "default" : "outline"}
											size='sm'
											onClick={() => onPageChange(page)}
											className='h-8 w-8 p-0'>
											{page}
										</Button>
									);
								})}
							</div>

							<Button
								variant='outline'
								size='sm'
								onClick={() => onPageChange(currentPage + 1)}
								disabled={currentPage >= totalPages}
								className='h-8 px-3'>
								Next
								<ChevronRight className='w-4 h-4' />
							</Button>
						</div>
					</div>
				</div>
			)}

			{/* Bulk Delete Confirmation Dialog */}
			<AlertDialog
				open={showBulkDeleteConfirm}
				onOpenChange={setShowBulkDeleteConfirm}>
				<AlertDialogContent className='max-w-md'>
					<AlertDialogHeader>
						<AlertDialogTitle className='flex items-center gap-2'>
							<AlertTriangle className='w-5 h-5 text-destructive' />
							Confirm Bulk Delete
						</AlertDialogTitle>
						<AlertDialogDescription>
							Are you sure you want to delete {selectedRows.size} selected row
							{selectedRows.size !== 1 ? "s" : ""}? This action cannot be
							undone.
						</AlertDialogDescription>
					</AlertDialogHeader>
					<AlertDialogFooter>
						<AlertDialogCancel>Cancel</AlertDialogCancel>
						<AlertDialogAction
							onClick={handleBulkDeleteConfirm}
							className='bg-destructive hover:bg-destructive/90'>
							Delete {selectedRows.size} Row{selectedRows.size !== 1 ? "s" : ""}
						</AlertDialogAction>
					</AlertDialogFooter>
				</AlertDialogContent>
			</AlertDialog>
		</div>
	);
});
