'use client';

import { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { Database, Table, Columns, RefreshCw } from 'lucide-react';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { Button } from '@/components/ui/button';
import { useSchemaCache, CachedColumnMeta } from '@/hooks/useSchemaCache';
import { FilterBuilder } from './FilterBuilder';
import { Filter } from './LineChartWidget';

// Type validation helpers
const getColumnTypeCategory = (type: string): 'text' | 'number' | 'date' | 'boolean' | 'other' => {
	const normalizedType = type.toLowerCase();
	if (['text', 'string', 'varchar', 'char', 'email', 'url'].includes(normalizedType)) return 'text';
	if (['number', 'integer', 'decimal', 'float', 'double', 'numeric'].includes(normalizedType)) return 'number';
	if (['date', 'datetime', 'timestamp', 'time'].includes(normalizedType)) return 'date';
	if (['boolean', 'bool'].includes(normalizedType)) return 'boolean';
	return 'other';
};

const isColumnTypeCompatible = (columnType: string, expectedType: 'text' | 'number' | 'date' | 'boolean'): boolean => {
	const category = getColumnTypeCategory(columnType);
	return category === expectedType || category === 'other';
};

interface TableMeta {
	id: number;
	name: string;
	description?: string;
	_count?: {
		columns: number;
		rows: number;
	};
}

interface TableSelectorProps {
	selectedTableId?: number;
	// Single-axis use (charts): provide X/Y to render two single selects
	selectedColumnX?: string;
	selectedColumnY?: string;
	// Multi-column use (tables, KPI, etc.): provide these to render multi-select
	selectedColumns?: string[];
	onColumnsChange?: (columns: string[]) => void;
	columnLimit?: number; // optional soft limit for multi-select
	// Filters support
	filters?: Filter[];
	onFiltersChange?: (filters: Filter[]) => void;
	onTableChange: (tableId: number) => void;
	onColumnXChange: (column: string) => void;
	onColumnYChange: (column: string) => void;
	tenantId: number;
	databaseId: number;
	// Type validation for widget compatibility
	expectedXType?: 'text' | 'number' | 'date' | 'boolean';
	expectedYType?: 'text' | 'number' | 'date' | 'boolean';
	// Load tables function
	loadTables?: () => Promise<void>;
}

export function TableSelector({
	selectedTableId,
	selectedColumnX,
	selectedColumnY,
	selectedColumns,
	onColumnsChange,
	columnLimit,
	filters,
	onFiltersChange,
	onTableChange,
	onColumnXChange,
	onColumnYChange,
	tenantId,
	databaseId,
	expectedXType,
	expectedYType,
	loadTables: externalLoadTables,
}: TableSelectorProps) {
	const { tables, tablesLoading, tablesError, loadTables, getColumns, invalidate } = useSchemaCache(tenantId, databaseId);
	const [columns, setColumns] = useState<CachedColumnMeta[]>([]);
	const [isLoadingColumns, setIsLoadingColumns] = useState(false);
	const [columnsError, setColumnsError] = useState<string | null>(null);

  // Load columns only when explicitly requested by user
  const loadColumns = async (tableId: number) => {
    setIsLoadingColumns(true);
    setColumnsError(null);
    try {
      const cols = await getColumns(tableId);
      console.info('[TableSelector] Loaded columns from cache', {
        tableId,
        count: cols.length,
      });
      setColumns(cols);
    } catch (e) {
      console.error('[TableSelector] Error loading columns:', e);
      setColumnsError(e instanceof Error ? e.message : 'Failed to load columns');
    } finally {
      setIsLoadingColumns(false);
    }
  };

	const handleTableChange = async (tableId: string) => {
		const id = parseInt(tableId);
		onTableChange(id);
		// Reset columns when table changes
		onColumnXChange('');
		onColumnYChange('');
		// Load columns for the selected table
		await loadColumns(id);
	};

	return (
		<Card className="h-full">
			<CardHeader className="pb-3">
				<div className="flex items-center justify-between">
					<CardTitle className="text-sm font-medium flex items-center">
						<Database className="h-4 w-4 mr-2" />
						Data Source
					</CardTitle>
					<div className="flex items-center gap-2">
						<Button
							variant="ghost"
							size="sm"
							onClick={() => { invalidate(); loadTables(); }}
							title="Refresh tables"
						>
							<RefreshCw className={`h-4 w-4 ${tablesLoading ? 'animate-spin' : ''}`} />
						</Button>
					</div>
				</div>
			</CardHeader>
			<CardContent className="pt-0 space-y-4">
				{/* Table Selection */}
				<div>
					<label className="text-xs font-medium text-gray-700 mb-2 block">
						Table
					</label>
					{!tables ? (
						<Button
							variant="outline"
							onClick={externalLoadTables || loadTables}
							disabled={tablesLoading}
							className="w-full h-8"
						>
							{tablesLoading ? (
								<RefreshCw className="h-4 w-4 animate-spin mr-2" />
							) : (
								<Database className="h-4 w-4 mr-2" />
							)}
							{tablesLoading ? 'Loading tables...' : 'Load Tables'}
						</Button>
					) : tablesLoading ? (
						<Skeleton className="h-8 w-full" />
					) : tablesError ? (
						<div className="text-sm text-red-600">{tablesError}</div>
					) : (
						<Select
							value={selectedTableId?.toString() || ''}
							onValueChange={handleTableChange}
						>
							<SelectTrigger className="h-8">
								<SelectValue placeholder="Select a table" />
							</SelectTrigger>
							<SelectContent>
								{(tables || []).map((table) => (
									<SelectItem key={table.id} value={table.id.toString()}>
										<div className="flex items-center space-x-2">
											<Table className="h-4 w-4" />
											<div>
												<div className="font-medium">{table.name}</div>
												{(table as any)._count && (
													<div className="text-xs text-gray-500">
														{(table as any)._count.columns ?? 0} columns • {(table as any)._count.rows ?? 0} rows
													</div>
												)}
											</div>
										</div>
									</SelectItem>
								))}
							</SelectContent>
						</Select>
					)}
				</div>

				{/* Column Selections - single X/Y if provided */}
				{selectedTableId && (selectedColumnX !== undefined || selectedColumnY !== undefined) && (
					<motion.div
						initial={{ opacity: 0, y: 10 }}
						animate={{ opacity: 1, y: 0 }}
						transition={{ duration: 0.2 }}
						className="space-y-4"
					>
						{/* X-Axis Column - only show if selectedColumnX is provided */}
						{selectedColumnX !== undefined && (
							<div>
								<label className="text-xs font-medium text-gray-700 mb-2 block">
									X-Axis Column {expectedXType && `(${expectedXType})`}
								</label>
							{columns.length === 0 && !isLoadingColumns && !columnsError ? (
								<Button
									variant="outline"
									onClick={() => loadColumns(selectedTableId)}
									disabled={isLoadingColumns}
									className="w-full h-8"
								>
									{isLoadingColumns ? (
										<RefreshCw className="h-4 w-4 animate-spin mr-2" />
									) : (
										<Columns className="h-4 w-4 mr-2" />
									)}
									{isLoadingColumns ? 'Loading columns...' : 'Load Columns'}
								</Button>
							) : isLoadingColumns ? (
								<Skeleton className="h-8 w-full" />
							) : columnsError ? (
								<div className="text-sm text-red-600">{columnsError}</div>
							) : (
								<Select
									value={selectedColumnX || ''}
									onValueChange={onColumnXChange}
								>
									<SelectTrigger className="h-8">
										<SelectValue placeholder="Select X-axis column" />
									</SelectTrigger>
									<SelectContent>
										{columns
											.filter(column => !expectedXType || isColumnTypeCompatible(column.type, expectedXType))
											.map((column) => (
											<SelectItem key={column.id} value={column.name}>
												<div className="flex items-center space-x-2">
													<Columns className="h-4 w-4" />
													<div>
														<div className="font-medium">{column.name}</div>
														<div className="text-xs text-gray-500">
															{column.type} {column.isRequired && '• Required'}
														</div>
													</div>
												</div>
											</SelectItem>
										))}
									</SelectContent>
								</Select>
							)}
							</div>
						)}

						{/* Y-Axis Column - only show if selectedColumnY is provided */}
						{selectedColumnY !== undefined && (
						<div>
							<label className="text-xs font-medium text-gray-700 mb-2 block">
								{selectedColumnX === undefined ? 'Value Column' : 'Y-Axis Column'} {expectedYType && `(${expectedYType})`}
							</label>
							{columns.length === 0 && !isLoadingColumns && !columnsError ? (
								<Button
									variant="outline"
									onClick={() => loadColumns(selectedTableId)}
									disabled={isLoadingColumns}
									className="w-full h-8"
								>
									{isLoadingColumns ? (
										<RefreshCw className="h-4 w-4 animate-spin mr-2" />
									) : (
										<Columns className="h-4 w-4 mr-2" />
									)}
									{isLoadingColumns ? 'Loading columns...' : 'Load Columns'}
								</Button>
							) : isLoadingColumns ? (
								<Skeleton className="h-8 w-full" />
							) : columnsError ? (
								<div className="text-sm text-red-600">{columnsError}</div>
							) : (
								<Select
									value={selectedColumnY || ''}
									onValueChange={onColumnYChange}
								>
									<SelectTrigger className="h-8">
										<SelectValue placeholder={selectedColumnX === undefined ? "Select value column" : "Select Y-axis column"} />
									</SelectTrigger>
									<SelectContent>
										{columns
											.filter(column => !expectedYType || isColumnTypeCompatible(column.type, expectedYType))
											.map((column) => (
											<SelectItem key={column.id} value={column.name}>
												<div className="flex items-center space-x-2">
													<Columns className="h-4 w-4" />
													<div>
														<div className="font-medium">{column.name}</div>
														<div className="text-xs text-gray-500">
															{column.type} {column.isRequired && '• Required'}
														</div>
													</div>
												</div>
											</SelectItem>
										))}
									</SelectContent>
								</Select>
							)}
						</div>
						)}
					</motion.div>
				)}

				{/* Multi-column Selection - render only if handler provided */}
				{selectedTableId && onColumnsChange && (
					<div className="space-y-2">
						<label className="text-xs font-medium text-gray-700 mb-2 block">
							Columns
						</label>
						{columns.length === 0 && !isLoadingColumns && !columnsError ? (
							<Button
								variant="outline"
								onClick={() => loadColumns(selectedTableId)}
								disabled={isLoadingColumns}
								className="w-full h-24"
							>
								<div className="flex flex-col items-center space-y-2">
									{isLoadingColumns ? (
										<RefreshCw className="h-6 w-6 animate-spin" />
									) : (
										<Columns className="h-6 w-6" />
									)}
									<span className="text-sm">
										{isLoadingColumns ? 'Loading columns...' : 'Load Columns'}
									</span>
								</div>
							</Button>
						) : isLoadingColumns ? (
							<Skeleton className="h-24 w-full" />
						) : columnsError ? (
							<div className="text-sm text-red-600">{columnsError}</div>
						) : (
							<div className="max-h-52 overflow-auto border rounded p-2 space-y-1">
								{columns.map((column) => {
									const checked = (selectedColumns || []).includes(column.name)
									const disabled = !!columnLimit && !checked && (selectedColumns?.length || 0) >= columnLimit
									return (
										<label key={column.id} className={`flex items-center gap-2 text-sm ${disabled ? 'opacity-50' : ''}`}>
											<input
												type="checkbox"
												checked={checked}
												disabled={disabled}
												onChange={(e) => {
													const next = new Set(selectedColumns || [])
													if (e.target.checked) next.add(column.name); else next.delete(column.name)
													onColumnsChange(Array.from(next))
												}}
												className="h-3.5 w-3.5"
											/>
											<span className="flex-1 truncate">{column.name}</span>
											<span className="text-xs text-gray-500">{column.type}</span>
										</label>
									)
								})}
							</div>
						)}
						{columnLimit ? (
							<p className="text-[11px] text-gray-500">Limit: {selectedColumns?.length || 0}/{columnLimit}</p>
						) : null}
					</div>
				)}

				{/* Filters - only show if onFiltersChange is provided */}
				{selectedTableId && onFiltersChange && (
					<div className="space-y-2">
						<label className="text-xs font-medium text-gray-700 mb-2 block">
							Filters
						</label>
						{columns.length === 0 && !isLoadingColumns && !columnsError ? (
							<Button
								variant="outline"
								onClick={() => loadColumns(selectedTableId)}
								disabled={isLoadingColumns}
								className="w-full h-24"
							>
								<div className="flex flex-col items-center space-y-2">
									{isLoadingColumns ? (
										<RefreshCw className="h-6 w-6 animate-spin" />
									) : (
										<Columns className="h-6 w-6" />
									)}
									<span className="text-sm">
										{isLoadingColumns ? 'Loading columns...' : 'Load Columns'}
									</span>
								</div>
							</Button>
						) : isLoadingColumns ? (
							<Skeleton className="h-24 w-full" />
						) : columnsError ? (
							<div className="text-sm text-red-600">{columnsError}</div>
						) : (
							<FilterBuilder
								filters={filters || []}
								availableColumns={columns}
								onFiltersChange={onFiltersChange}
							/>
						)}
					</div>
				)}

				{/* Summary */}
				{selectedTableId && columns.length > 0 && (
					<div className="text-xs text-gray-500 space-y-1 pt-2 border-t">
						<p>Selected table: {(tables || []).find(t => t.id === selectedTableId)?.name}</p>
						<p>Available columns: {columns.length}</p>
						{onColumnsChange && (
							<p>Selected: {selectedColumns?.length || 0}{columnLimit ? ` / ${columnLimit}` : ''}</p>
						)}
						{selectedColumnX && selectedColumnY && (
							<p className="text-green-600 font-medium">Ready to create chart</p>
						)}
					</div>
				)}
			</CardContent>
		</Card>
	);
}
