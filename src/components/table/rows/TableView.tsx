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

	// Calculate table width based on number of columns
	const tableWidth = useMemo(() => {
		const baseWidth = 60; // Selection column
		const dataColumnsWidth = safeColumns.length * 200; // 200px per data column
		const actionsWidth = 80; // Actions column
		const totalWidth = baseWidth + dataColumnsWidth + actionsWidth;
		return Math.max(totalWidth, 800); // Minimum 800px width
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
		<div className='w-full h-full bg-white flex flex-col'>
			{/* Clean Header Section - Title Only */}
			<div className='px-6 py-6 border-b border-gray-200'>
				<div className='flex flex-col'>
					<h1 className='text-3xl font-bold text-gray-900 mb-1'>
						{table.name || 'Table Data'}
					</h1>
					<p className='text-gray-600 text-lg'>
						Manage your data
					</p>
				</div>
			</div>

			{/* Enhanced Filter Bar - With Action Buttons */}
			<div className='px-6 py-4 bg-gray-50 border-b border-gray-200'>
				<div className='flex flex-col lg:flex-row lg:items-center gap-4'>
					{/* Top Row - Filters and Search */}
					<div className='flex flex-wrap items-center gap-3 flex-1'>
						{/* Active Filters Display */}
						<div className='flex flex-wrap items-center gap-2'>
							{selectedRows.size > 0 && (
								<div className='inline-flex items-center gap-2 px-3 py-1 bg-blue-100 text-blue-800 rounded-full text-sm font-medium'>
									<span>Selected: {selectedRows.size}</span>
									<button 
										onClick={() => setSelectedRows(new Set())}
										className='ml-1 hover:bg-blue-200 rounded-full p-0.5 transition-colors'
										title='Clear selection'
									>
										×
									</button>
								</div>
							)}
							{totalItems > 0 && (
								<div className='inline-flex items-center gap-2 px-3 py-1 bg-gray-100 text-gray-700 rounded-full text-sm font-medium'>
									<span>Total: {totalItems} rows</span>
									<button className='ml-1 hover:bg-gray-200 rounded-full p-0.5 transition-colors'>
										×
									</button>
								</div>
							)}
						</div>

						{/* Clear All Button */}
						{selectedRows.size > 0 && (
							<Button
								variant='ghost'
								size='sm'
								onClick={() => setSelectedRows(new Set())}
								className='text-gray-600 hover:text-gray-800 px-3 py-1 transition-colors'
								title='Clear all selections'>
								Clear all
							</Button>
						)}

						{/* Search Input */}
						<div className='flex-1 max-w-md min-w-[200px]'>
							<div className='relative'>
								<Search className='absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4' />
								<input
									type='text'
									placeholder='Search...'
									className='w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all'
								/>
							</div>
						</div>
					</div>

					{/* Bottom Row - Action Buttons */}
					<div className='flex flex-wrap items-center gap-2'>
						{/* Sort Button */}
						<Button
							variant='outline'
							size='sm'
							className='border-gray-300 text-gray-700 hover:bg-gray-50 px-3 py-2 transition-all'
							title='Sort data'>
							<ChevronUp className='w-4 h-4 mr-1' />
							<ChevronDown className='w-4 h-4' />
						</Button>

						{/* Add Filter Button */}
						<Button
							variant='outline'
							size='sm'
							className='border-gray-300 text-gray-700 hover:bg-gray-50 px-3 py-2 transition-all'
							title='Add filter'>
							<Filter className='w-4 h-4 mr-2' />
							<span className='hidden sm:inline'>Add filter</span>
						</Button>

						{/* Import Button */}
						<Button
							variant='outline'
							size='sm'
							className='border-gray-300 text-gray-700 hover:bg-gray-50 px-3 py-2 transition-all'
							title='Import data'>
							<Upload className='w-4 h-4 mr-2' />
							<span className='hidden sm:inline'>Import</span>
						</Button>

						{/* Export Button */}
						<Button
							variant='outline'
							size='sm'
							className='border-gray-300 text-gray-700 hover:bg-gray-50 px-3 py-2 transition-all'
							title='Export data'>
							<Download className='w-4 h-4 mr-2' />
							<span className='hidden sm:inline'>Export</span>
						</Button>

						{/* Bulk Actions */}
						{selectedRows.size > 0 && onBulkDelete && (
							<Button
								onClick={handleBulkDeleteClick}
								variant='outline'
								size='sm'
								disabled={!tablePermissions.canEditTable()}
								className='border-red-300 text-red-700 hover:bg-red-50 px-3 py-2 transition-all'
								title='Delete selected rows'>
								<Trash2 className='w-4 h-4 mr-2' />
								Delete ({selectedRows.size})
							</Button>
						)}

						{/* Add Row Button */}
						<Button
							variant='default'
							size='sm'
							className='bg-gray-900 hover:bg-gray-800 text-white px-4 py-2 font-medium transition-all'
							title='Add new row'>
							<Plus className='w-4 h-4 mr-2' />
							Add Row
						</Button>
					</div>
				</div>
			</div>

			{/* Clean Table Container - Full Width */}
			<div className='flex-1 bg-white border border-gray-200 rounded-lg overflow-hidden flex flex-col'>
				<div className='flex-1 overflow-auto'>
					<table 
						className='w-full'
						style={{ minWidth: `${tableWidth}px` }}>
						{/* Clean Table Header - Sticky */}
						<thead className='sticky top-0 z-30 bg-gray-50 border-b border-gray-200'>
							<tr>
								{/* Selection Column */}
								<th className='sticky left-0 z-40 bg-gray-50 border-r border-gray-200 px-6 py-4 text-left min-w-[60px]'>
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
											className='data-[state=checked]:bg-blue-600 data-[state=checked]:border-blue-600'
										/>
									</div>
								</th>

								{/* Data Columns */}
								{safeColumns.map((col) => (
									<th
										key={col.id}
										className='px-6 py-4 text-left text-sm font-semibold text-gray-900 min-w-[150px] max-w-[300px]'>
										<div className='flex items-center gap-2'>
											<span className='truncate'>{col.name}</span>
											{col.type && (
												<span className='inline-flex items-center px-2 py-1 text-xs font-medium bg-gray-100 text-gray-600 rounded-md'>
													{col.type}
												</span>
											)}
										</div>
									</th>
								))}

								{/* Actions Column */}
								<th className='sticky right-0 z-40 bg-gray-50 border-l border-gray-200 px-6 py-4 text-center text-sm font-semibold text-gray-900 min-w-[80px]'>
									Actions
								</th>
							</tr>
						</thead>

						{/* Clean Table Body */}
						<tbody className='divide-y divide-gray-200'>
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
											<div className='w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center'>
												<Database className='w-8 h-8 text-gray-400' />
											</div>
											<div className='text-center'>
												<h3 className='text-lg font-semibold text-gray-900 mb-2'>
													No data available
												</h3>
												<p className='text-gray-600 max-w-md'>
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
													"hover:bg-gray-50 transition-colors duration-200 group",
													rowHasPendingChanges &&
														"bg-amber-50 border-l-4 border-l-amber-400",
													selectedRows.has(String(row.id)) &&
														"bg-blue-50 border-l-4 border-l-blue-500",
													row.isOptimistic &&
														"bg-blue-50 border-l-4 border-l-blue-400",
													deletingRows.has(String(row.id)) &&
														"opacity-60 bg-red-50",
												)}>
												{/* Selection Cell */}
												<td className='sticky left-0 z-20 bg-white group-hover:bg-gray-50 border-r border-gray-200 px-6 py-4 min-w-[60px]'>
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
															className='data-[state=checked]:bg-blue-600 data-[state=checked]:border-blue-600'
														/>
													</div>
												</td>

												{/* Data Cells */}
												{safeColumns.map((col) => {
													if (!row.cells || !Array.isArray(row.cells)) {
														return (
															<td
																key={`${row.id}-${col.id}-virtual`}
																className='px-6 py-4 group-hover:bg-gray-50 transition-colors duration-200 min-w-[150px] max-w-[300px]'>
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
																className='px-6 py-4 group-hover:bg-gray-50 transition-colors duration-200 min-w-[150px] max-w-[300px]'>
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
															className='px-6 py-4 group-hover:bg-gray-50 transition-colors duration-200 min-w-[150px] max-w-[300px]'>
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
												<td className='sticky right-0 z-20 bg-white group-hover:bg-gray-50 border-l border-gray-200 px-6 py-4 text-center min-w-[80px]'>
													<Button
														onClick={() => onDeleteRow(String(row.id))}
														variant='ghost'
														size='sm'
														disabled={deletingRows.has(String(row.id)) || !tablePermissions.canEditTable()}
														className='h-8 w-8 p-0 text-red-600 hover:text-red-700 hover:bg-red-50 transition-all duration-200 rounded-lg'>
														{deletingRows.has(String(row.id)) ? (
															<div className='w-4 h-4 border-2 border-red-600 border-t-transparent rounded-full animate-spin' />
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

			{/* Modern Pagination - Like in Image */}
			{showPagination && (
				<div className='bg-white border-t border-gray-200 px-6 py-4 flex-shrink-0'>
					<div className='flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4'>
						{/* Left Section - Results Info */}
						<div className='flex items-center gap-4 text-sm text-gray-600'>
							<span>
								{(currentPage - 1) * pageSize + 1}-{Math.min(currentPage * pageSize, totalItems)} of {totalItems} Results per page
							</span>
							{onPageSizeChange && (
								<select
									value={pageSize}
									onChange={(e) => onPageSizeChange(Number(e.target.value))}
									className='border border-gray-300 rounded px-2 py-1 text-sm'>
									<option value={10}>10</option>
									<option value={25}>25</option>
									<option value={50}>50</option>
									<option value={100}>100</option>
								</select>
							)}
						</div>

						{/* Right Section - Navigation */}
						<div className='flex items-center gap-2'>
							<Button
								variant='outline'
								size='sm'
								onClick={() => onPageChange(currentPage - 1)}
								disabled={currentPage <= 1}
								className='h-8 w-8 p-0 border-gray-300 text-gray-700 hover:bg-gray-50'>
								<ChevronLeft className='w-4 h-4' />
							</Button>

							{/* Page Numbers */}
							<div className='flex items-center gap-1'>
								<span className='text-sm text-gray-600 px-2'>
									{currentPage}/{totalPages}
								</span>
							</div>

							<Button
								variant='outline'
								size='sm'
								onClick={() => onPageChange(currentPage + 1)}
								disabled={currentPage >= totalPages}
								className='h-8 w-8 p-0 border-gray-300 text-gray-700 hover:bg-gray-50'>
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
