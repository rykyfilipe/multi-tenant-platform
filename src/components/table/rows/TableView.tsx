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
	ChevronUp,
	ChevronDown,
	Search,
	Plus,
	Upload,
	Download,
	Filter,
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

	// New functionality props
	onAddRow?: () => void;
	onImport?: () => void;
	onExport?: () => void;
	onFilter?: () => void;
	onRefresh?: () => void;
	filters?: any[];
	globalSearch?: string;
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
	onAddRow,
	onImport,
	onExport,
	onFilter,
	onRefresh,
	filters = [],
	globalSearch = "",
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
							className='text-start px-6 py-5 text-sm font-semibold text-foreground/80 uppercase tracking-wide border-b border-border/20 bg-gradient-to-r from-muted/50 via-muted/40 to-muted/50'
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

	// Calculate table width based on number of columns - optimized for many columns
	const tableWidth = useMemo(() => {
		const baseWidth = 40; // Selection column (w-10 = 40px)
		const dataColumnsWidth = safeColumns.length * 140; // 140px per data column (further reduced)
		const totalWidth = baseWidth + dataColumnsWidth;
		// Use a more reasonable minimum width and cap the maximum
		return Math.min(Math.max(totalWidth, 800), 2000);
	}, [safeColumns.length]);

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
		<div className='w-full h-full bg-gradient-to-br from-slate-50 via-white to-slate-50 flex flex-col'>
			{/* Mobile-First Header Section */}
			<div className='px-4 sm:px-6 lg:px-8 py-4 sm:py-6 bg-gradient-to-r from-white via-slate-50 to-white border-b border-slate-200/60'>
				{/* Mobile Layout */}
				<div className='space-y-4'>
					{/* Title and Stats */}
					<div className='flex items-start justify-between'>
						<div className='flex items-center gap-3 flex-1 min-w-0'>
							<div className='p-2 sm:p-3 bg-gradient-to-br from-slate-800 to-slate-900 rounded-xl shadow-lg'>
								<TableIcon className='w-5 h-5 sm:w-6 sm:h-6 text-white' />
							</div>
							<div className='flex-1 min-w-0'>
								<h1 className='text-lg sm:text-xl lg:text-2xl font-bold text-slate-900 tracking-tight truncate'>
									{table.name || 'Table Data'}
								</h1>
								<p className='text-slate-600 text-xs sm:text-sm font-medium'>
									{validatedRows.length} row{validatedRows.length !== 1 ? 's' : ''} • {safeColumns.length} column{safeColumns.length !== 1 ? 's' : ''}
								</p>
							</div>
						</div>
					</div>
					
					{/* Mobile Action Buttons */}
					<div className='flex flex-col sm:flex-row gap-2 sm:gap-3'>
						<div className='flex gap-2 flex-1'>
							{/* Filter Button */}
							{onFilter && (
								<Button
									onClick={onFilter}
									variant='outline'
									size='sm'
									className='flex-1 h-10 mobile-touch-feedback border-slate-300 text-slate-700 hover:bg-slate-50 hover:border-slate-400 transition-all duration-200 shadow-sm'
									title='Add filter'>
									<Filter className='w-4 h-4 mr-1.5' />
									<span className='text-xs font-medium'>Filter</span>
								</Button>
							)}

							{/* Import Button */}
							{onImport && (
								<Button
									onClick={onImport}
									variant='outline'
									size='sm'
									className='h-10 mobile-touch-feedback border-slate-300 text-slate-700 hover:bg-slate-50 hover:border-slate-400 transition-all duration-200 shadow-sm'
									title='Import data'>
									<Upload className='w-4 h-4' />
								</Button>
							)}

							{/* Export Button */}
							{onExport && (
								<Button
									onClick={onExport}
									variant='outline'
									size='sm'
									className='h-10 mobile-touch-feedback border-slate-300 text-slate-700 hover:bg-slate-50 hover:border-slate-400 transition-all duration-200 shadow-sm'
									title='Export data'>
									<Download className='w-4 h-4' />
								</Button>
							)}
						</div>

						{/* Add Row Button - Mobile Optimized */}
						{onAddRow && (
							<Button
								onClick={onAddRow}
								variant='default'
								size='sm'
								className='w-full sm:w-auto h-10 mobile-touch-feedback bg-gradient-to-r from-slate-800 to-slate-900 hover:from-slate-700 hover:to-slate-800 text-white shadow-lg hover:shadow-xl transition-all duration-200'
								title='Add new row'>
								<Plus className='w-4 h-4 mr-2' />
								<span className='text-sm font-medium'>Add Row</span>
							</Button>
						)}
					</div>

					{/* Bulk Actions - Mobile Row */}
					{selectedRows.size > 0 && onBulkDelete && (
						<Button
							onClick={handleBulkDeleteClick}
							variant='destructive'
							size='sm'
							disabled={!tablePermissions.canEditTable()}
							className='w-full h-10 mobile-touch-feedback'
							title='Delete selected rows'>
							<Trash2 className='w-4 h-4 mr-2' />
							<span className='text-sm font-medium'>Delete Selected ({selectedRows.size})</span>
						</Button>
					)}
				</div>
			</div>

			{/* Premium Table Container */}
			<div className='flex-1 bg-white border border-slate-200/60 rounded-xl overflow-hidden flex flex-col shadow-sm'>
				<div className='flex-1 overflow-auto scrollbar-thin scrollbar-thumb-slate-300 scrollbar-track-slate-100'>
					<div className='min-w-full'>
						<table 
							className='w-full table-fixed'
							style={{ 
								minWidth: `${tableWidth}px`,
								width: safeColumns.length > 8 ? '100%' : 'auto'
							}}>
						{/* Premium Table Header - Sticky */}
						<thead className='sticky top-0 z-30 bg-gradient-to-r from-slate-50 via-slate-100 to-slate-50 border-b border-slate-200/60'>
							<tr>
								{/* Selection Column */}
								<th className='sticky left-0 z-40 bg-gradient-to-r from-slate-50 to-slate-100 border-r border-slate-200/60 px-2 py-3 text-left w-10'>
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
											className='data-[state=checked]:bg-slate-800 data-[state=checked]:border-slate-800 w-4 h-4'
										/>
									</div>
								</th>

								{/* Data Columns - Optimized for many columns */}
								{safeColumns.map((col) => (
									<th
										key={col.id}
										className='px-3 py-3 text-left text-xs font-semibold text-slate-700 min-w-[120px] max-w-[180px] bg-gradient-to-r from-slate-50 to-slate-100'
										style={{ width: `${Math.min(140, Math.max(120, 140 - (safeColumns.length - 5) * 2))}px` }}>
										<div className='flex items-center gap-1'>
											<span className='truncate font-medium text-slate-800'>{col.name}</span>
											{col.type && (
												<span className='inline-flex items-center px-1 py-0.5 text-xs font-medium bg-slate-100 text-slate-700 rounded flex-shrink-0'>
													{col.type}
												</span>
											)}
										</div>
									</th>
								))}

							</tr>
						</thead>

						{/* Premium Table Body */}
						<tbody className='divide-y divide-slate-200/40'>
							{validatedRows.length === 0 ? (
								<tr>
									<td
										colSpan={
											1 + // Selection column (always visible)
											safeColumns.length // Data columns
										}
										className='px-8 py-20 text-center'>
										<div className='flex flex-col items-center gap-6'>
											<div className='w-20 h-20 bg-gradient-to-br from-slate-100 to-slate-200 rounded-2xl flex items-center justify-center shadow-sm'>
												<Database className='w-10 h-10 text-slate-400' />
											</div>
											<div className='text-center max-w-md'>
												<h3 className='text-xl font-semibold text-slate-900 mb-2'>
													No data available
												</h3>
												<p className='text-slate-600 text-sm leading-relaxed'>
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
												initial={{ opacity: 0, y: 10 }}
												animate={{ opacity: 1, y: 0 }}
												exit={{ opacity: 0, y: -10 }}
												transition={{ duration: 0.2, delay: index * 0.02 }}
												className={cn(
													"hover:bg-slate-50/50 transition-all duration-200 group border-b border-slate-100/60",
													rowHasPendingChanges &&
														"bg-amber-50/80 border-l-4 border-l-amber-400 shadow-sm",
													selectedRows.has(String(row.id)) &&
														"bg-slate-50/80 border-l-4 border-l-slate-500 shadow-sm",
													row.isOptimistic &&
														"bg-slate-50/80 border-l-4 border-l-slate-400 shadow-sm",
													deletingRows.has(String(row.id)) &&
														"opacity-60 bg-red-50/80",
												)}>
												{/* Selection Cell */}
												<td className='sticky left-0 z-20 bg-white group-hover:bg-slate-50/50 border-r border-slate-200/60 px-2 py-3 w-10'>
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
															className='data-[state=checked]:bg-slate-800 data-[state=checked]:border-slate-800 w-4 h-4'
														/>
													</div>
												</td>

												{/* Data Cells - Optimized for many columns */}
												{safeColumns.map((col) => {
													if (!row.cells || !Array.isArray(row.cells)) {
														return (
															<td
																key={`${row.id}-${col.id}-virtual`}
																className='px-4 py-3 group-hover:bg-slate-50/50 transition-colors duration-200 min-w-[140px] max-w-[200px]'>
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
																className='px-4 py-3 group-hover:bg-slate-50/50 transition-colors duration-200 min-w-[140px] max-w-[200px]'>
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
															className='px-4 py-3 group-hover:bg-slate-50/50 transition-colors duration-200 min-w-[140px] max-w-[200px]'>
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


											</motion.tr>
										);
									})}
								</AnimatePresence>
							)}
						</tbody>
					</table>
					</div>
				</div>
			</div>

			{/* Premium Pagination */}
			{showPagination && (
				<div className='bg-gradient-to-r from-slate-50 via-white to-slate-50 border-t border-slate-200/60 px-8 py-4 flex-shrink-0'>
					<div className='flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4'>
						{/* Left Section - Results Info */}
						<div className='flex items-center gap-4 text-sm text-slate-600'>
							<span className='font-medium'>
								{(currentPage - 1) * pageSize + 1}-{Math.min(currentPage * pageSize, totalItems)} of {totalItems} results
							</span>
							{onPageSizeChange && (
								<div className='flex items-center gap-2'>
									<span className='text-xs text-slate-500'>Per page:</span>
									<select
										value={pageSize}
										onChange={(e) => onPageSizeChange(Number(e.target.value))}
										className='border border-slate-300 rounded-md px-2 py-1 text-xs font-medium bg-white hover:border-slate-400 transition-colors duration-200'>
										<option value={10}>10</option>
										<option value={25}>25</option>
										<option value={50}>50</option>
										<option value={100}>100</option>
									</select>
								</div>
							)}
						</div>

						{/* Right Section - Navigation */}
						<div className='flex items-center gap-1'>
							<Button
								variant='outline'
								size='sm'
								onClick={() => onPageChange(currentPage - 1)}
								disabled={currentPage <= 1}
								className='h-8 w-8 p-0 border-slate-300 text-slate-700 hover:bg-slate-50 hover:border-slate-400 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200 rounded-md'>
								<ChevronLeft className='w-4 h-4' />
							</Button>

							{/* Page Numbers */}
							<div className='flex items-center gap-1'>
								<span className='text-sm text-slate-600 px-3 py-1 bg-slate-100 rounded-md font-medium'>
									{currentPage}/{totalPages}
								</span>
							</div>

							<Button
								variant='outline'
								size='sm'
								onClick={() => onPageChange(currentPage + 1)}
								disabled={currentPage >= totalPages}
								className='h-8 w-8 p-0 border-slate-300 text-slate-700 hover:bg-slate-50 hover:border-slate-400 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200 rounded-md'>
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
