/** @format */
"use client";

import { useState } from "react";
import { Column, Row, Table } from "@/types/database";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import {
	Search,
	Filter,
	Upload,
	Download,
	Plus,
	SortAsc,
	SortDesc,
	RefreshCw,
	FileDown,
	FileUp,
} from "lucide-react";
import { FilterConfig } from "@/types/filtering";
import { TableFilters } from "../rows/TableFilters";
import { RowGrid } from "./RowGrid";
import { Pagination } from "../../ui/pagination";
import { NoDataEmptyState, NoResultsEmptyState } from "./EmptyStates";
import { cn } from "@/lib/utils";
import { Badge } from "@/components/ui/badge";

interface Props {
	table: Table;
	columns: Column[];
	rows: Row[];
	pendingNewRows: any[];
	loading: boolean;
	pagination: any;
	filters: FilterConfig[];
	globalSearch: string;
	sortColumn: string | null;
	sortDirection: "asc" | "desc";
	activeFiltersCount: number;
	searchQuery: string;
	
	// Row editing
	editingCell: any;
	onEditCell: (rowId: string, columnId: string, cellId: string) => void;
	onSaveCell: (columnId: string, rowId: string, cellId: string, value: any) => Promise<void>;
	onCancelEdit: () => void;
	hasPendingChange: (rowId: string, columnId: string) => boolean;
	getPendingValue: (rowId: string, columnId: string) => any;
	
	// Row management
	onDeleteRow: (rowId: string) => void;
	onDeleteMultipleRows: (rowIds: string[]) => void;
	onAddRow: (rowData: any) => void;
	
	// Filtering & sorting
	onSearch: (query: string) => void;
	onSort: (columnId: string) => void;
	onApplyFilters: (filters: FilterConfig[], globalSearch: string, sortBy?: string, sortOrder?: "asc" | "desc") => Promise<void>;
	onClearFilters: () => void;
	
	// Import/Export
	onExport: () => void;
	onImport: () => void;
	onFileSelect: (event: React.ChangeEvent<HTMLInputElement>) => void;
	importFile: File | null;
	isExporting: boolean;
	isImporting: boolean;
	
	// Pagination
	onPageChange: (page: number) => void;
	onPageSizeChange: (pageSize: number) => void;
	
	// Permissions
	canEdit: boolean;
	canDelete: boolean;
	canRead: boolean;
	
	// Other
	tables: Table[];
	onRefreshReferenceData: () => void;
	isSavingNewRow: boolean;
}

export function DataMode({
	table,
	columns,
	rows,
	pendingNewRows,
	loading,
	pagination,
	filters,
	globalSearch,
	sortColumn,
	sortDirection,
	activeFiltersCount,
	searchQuery,
	editingCell,
	onEditCell,
	onSaveCell,
	onCancelEdit,
	hasPendingChange,
	getPendingValue,
	onDeleteRow,
	onDeleteMultipleRows,
	onAddRow,
	onSearch,
	onSort,
	onApplyFilters,
	onClearFilters,
	onExport,
	onImport,
	onFileSelect,
	importFile,
	isExporting,
	isImporting,
	onPageChange,
	onPageSizeChange,
	canEdit,
	canDelete,
	canRead,
	tables,
	onRefreshReferenceData,
	isSavingNewRow,
}: Props) {
	const [showFilters, setShowFilters] = useState(false);
	const [activeFiltersCountLocal, setActiveFiltersCountLocal] = useState(0);

	// Show empty state if no data and no filters
	if (rows.length === 0 && activeFiltersCount === 0 && !loading) {
		return (
			<div className='w-full mx-auto px-4 sm:px-6 lg:px-8 py-8'>
				<NoDataEmptyState
					onAddRow={() => {
						// Scroll to inline row creator
						const gridElement = document.querySelector('.data-grid');
						if (gridElement) {
							gridElement.scrollIntoView({ behavior: 'smooth' });
						}
					}}
					onImport={onImport}
				/>
			</div>
		);
	}

	// Show no results state if filtering but no results
	if (rows.length === 0 && activeFiltersCount > 0 && !loading) {
		return (
			<div className='w-full mx-auto px-4 sm:px-6 lg:px-8 py-8'>
				<NoResultsEmptyState onClearFilters={onClearFilters} />
			</div>
		);
	}

	return (
		<div className='w-full mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-6'>
			{/* Data Toolbar */}
			<Card className='p-4'>
				<div className='flex flex-col sm:flex-row items-start sm:items-center gap-4'>
					{/* Search */}
					<div className='flex-1 w-full sm:w-auto'>
						<div className='relative'>
							<Search className='absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground' />
							<Input
								placeholder='Search in all columns...'
								value={searchQuery}
								onChange={(e) => onSearch(e.target.value)}
								className='pl-9'
							/>
						</div>
					</div>

					{/* Actions */}
					<div className='flex items-center gap-2 w-full sm:w-auto'>
						<Button
							variant='outline'
							size='sm'
							onClick={() => setShowFilters(!showFilters)}
							className='gap-2'>
							<Filter className='w-4 h-4' />
							Filters
							{activeFiltersCount > 0 && (
								<Badge variant='secondary' className='ml-1'>
									{activeFiltersCount}
								</Badge>
							)}
						</Button>

						<Button
							variant='outline'
							size='sm'
							onClick={() => onSort(columns[0]?.id?.toString() || "")}
							className='gap-2'>
							{sortDirection === "asc" ? (
								<SortAsc className='w-4 h-4' />
							) : (
								<SortDesc className='w-4 h-4' />
							)}
							Sort
						</Button>

						<Button
							variant='outline'
							size='sm'
							onClick={onExport}
							disabled={isExporting || !canRead}
							className='gap-2'>
							{isExporting ? (
								<RefreshCw className='w-4 h-4 animate-spin' />
							) : (
								<FileDown className='w-4 h-4' />
							)}
							Export
						</Button>

						<div className='relative'>
							<input
								id='import-file-input'
								type='file'
								accept='.csv'
								onChange={onFileSelect}
								className='hidden'
							/>
							<Button
								variant='outline'
								size='sm'
								onClick={() => document.getElementById('import-file-input')?.click()}
								disabled={isImporting || !canEdit}
								className='gap-2'>
								<FileUp className='w-4 h-4' />
								Import
							</Button>
						</div>

						{canEdit && (
							<Button onClick={() => {
								// Trigger add row
								const gridElement = document.querySelector('.data-grid');
								if (gridElement) {
									gridElement.scrollIntoView({ behavior: 'smooth' });
								}
							}} className='gap-2'>
								<Plus className='w-4 h-4' />
								Add Row
							</Button>
						)}
					</div>
				</div>

				{/* Import confirmation */}
				{importFile && (
					<div className='flex items-center gap-2 mt-4 p-2 bg-blue-50 dark:bg-blue-900/20 rounded-lg border border-blue-200 dark:border-blue-800'>
						<span className='text-sm text-blue-700 dark:text-blue-300 flex-1 truncate'>
							{importFile.name}
						</span>
						<Button
							variant='default'
							size='sm'
							onClick={onImport}
							disabled={isImporting}
							className='bg-green-600 hover:bg-green-700'>
							{isImporting ? (
								<RefreshCw className='w-4 h-4 mr-1 animate-spin' />
							) : null}
							{isImporting ? 'Importing...' : 'Import'}
						</Button>
					</div>
				)}
			</Card>

			{/* Filters Section */}
			{showFilters && (
				<TableFilters
					columns={columns}
					rows={rows}
					tables={tables}
					onFilterChange={() => {}}
					onApplyFilters={onApplyFilters}
					showToggleButton={false}
					showSidebar={showFilters}
					setShowSidebar={setShowFilters}
					onActiveFiltersChange={setActiveFiltersCountLocal}
					loading={loading}
					currentFilters={filters}
					currentGlobalSearch={globalSearch}
				/>
			)}

			{/* Data Grid */}
			<Card className='overflow-x-auto'>
				<div className='data-grid bg-white dark:bg-card min-w-full'>
					<RowGrid
						columns={columns}
						rows={[...(pendingNewRows || []), ...(rows || [])]}
						editingCell={editingCell}
						onEditCell={onEditCell}
						onSaveCell={async (columnId, rowId, cellId, value) => {
							await onSaveCell(columnId, rowId, cellId, value);
						}}
						onCancelEdit={onCancelEdit}
						onDeleteRow={onDeleteRow}
						onDeleteMultipleRows={onDeleteMultipleRows}
						deletingRows={new Set()}
						hasPendingChange={hasPendingChange}
						getPendingValue={getPendingValue}
						canEdit={canEdit}
						canDelete={canDelete}
						tables={tables}
						onRefreshReferenceData={onRefreshReferenceData}
						showInlineRowCreator={canEdit}
						onSaveNewRow={onAddRow}
						onCancelNewRow={() => {}}
						isSavingNewRow={isSavingNewRow}
					/>
				</div>
			</Card>

			{/* Pagination */}
			{pagination && pagination.totalPages > 1 && (
				<Pagination
					currentPage={pagination.page}
					totalPages={pagination.totalPages}
					onPageChange={onPageChange}
					pageSize={pagination.pageSize}
					totalItems={pagination.totalRows}
					onPageSizeChange={onPageSizeChange}
					pageSizeOptions={[10, 25, 50, 100]}
				/>
			)}
		</div>
	);
}

