'use client';

import { useCallback, useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { Database, Table, Columns } from 'lucide-react';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { useSchemaCache, CachedColumnMeta } from '@/hooks/useSchemaCache';
import { useApp } from '@/contexts/AppContext';
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
	databaseId?: number;
	databaseName?: string;
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
	expectedXType,
	expectedYType,
	loadTables: externalLoadTables,
}: TableSelectorProps) {
	const { tenant, token } = useApp();
	
	// State for all tables from all databases (like invoice form)
	const [allTables, setAllTables] = useState<TableMeta[]>([]);
	const [allTablesLoading, setAllTablesLoading] = useState(false);
	const [allTablesError, setAllTablesError] = useState<string | null>(null);
	
	const [columns, setColumns] = useState<CachedColumnMeta[]>([]);
	const [isLoadingColumns, setIsLoadingColumns] = useState(false);
	const [columnsError, setColumnsError] = useState<string | null>(null);

	// Function to load all tables from all databases (like invoice form)
	const loadAllTables = useCallback(async () => {
		if (!tenant?.id) return;
		
		setAllTablesLoading(true);
		setAllTablesError(null);
		
		try {
			const response = await fetch(`/api/tenants/${tenant.id}/databases/tables`, {
				headers: {
					'Authorization': `Bearer ${token}`
				}
			});
			
			if (response.ok) {
				const tables = await response.json();
				console.log('[TableSelector] Loaded all tables', tables);
				setAllTables(tables);
			} else {
				throw new Error(`Failed to fetch tables: ${response.statusText}`);
			}
		} catch (error) {
			console.error('Error fetching all tables:', error);
			setAllTablesError(error instanceof Error ? error.message : 'Failed to load tables');
		} finally {
			setAllTablesLoading(false);
		}
	}, [tenant?.id, token]);

	// Auto-load all tables when component mounts
	useEffect(() => {
		if (tenant?.id && token) {
			console.log('[TableSelector] Auto-loading all tables on mount');
			loadAllTables();
		}
	}, []);

	

	// Auto-load columns when a table is selected (only if columns are not already loaded)
	useEffect(() => {
		if (selectedTableId && allTables.length > 0 && !isLoadingColumns && !columnsError && columns.length === 0) {
			console.log('[TableSelector] Auto-loading columns for selected table:', selectedTableId);
			loadColumns(selectedTableId);
		}
	}, [selectedTableId, allTables.length, columns.length]);

  // Load columns only when explicitly requested by user
  const loadColumns = async (tableId: number) => {
    // Find the selected table to get its databaseId
    const selectedTable = allTables.find(table => table.id === tableId);
    const tableDatabaseId = selectedTable?.databaseId;
    
    console.log('[TableSelector] loadColumns called:', {
      tableId,
      databaseId: tableDatabaseId,
      tenantId: tenant?.id,
      hasToken: !!token,
      selectedTable: selectedTable ? { id: selectedTable.id, name: selectedTable.name, databaseId: selectedTable.databaseId } : null
    });
    
    if (!tableDatabaseId) {
      console.error('[TableSelector] No databaseId found for selected table');
      setColumnsError('No database found for selected table');
      setIsLoadingColumns(false);
      return;
    }
    
    setIsLoadingColumns(true);
    setColumnsError(null);
    try {
      	const response = await fetch(`/api/tenants/${tenant?.id}/databases/${tableDatabaseId}/tables/${tableId}/columns`, {
				headers: {
					'Authorization': `Bearer ${token}`
				}
			});
			if (response.ok) {
				const cols = await response.json();
				console.log('[TableSelector] Loaded columns', cols);
				setColumns(cols);
			} else {
				throw new Error(`Failed to fetch columns: ${response.statusText}`);
			}
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
		// Reset columns state when table changes
		setColumns([]);
		setColumnsError(null);
	};

	return (
		<Card className="h-full">
			<CardHeader className="pb-3">
				<div className="flex items-center justify-between">
					<CardTitle className="text-sm font-medium flex items-center">
						<Database className="h-4 w-4 mr-2" />
						Data Source
					</CardTitle>
					
				</div>
			</CardHeader>
			<CardContent className="pt-0 space-y-4">
				{/* Table Selection */}
				<div>
					<label className="text-xs font-medium text-gray-700 mb-2 block">
						Table
					</label>
					{(!allTables || allTables.length === 0) && !allTablesLoading && !allTablesError && (
						<div className="flex flex-col items-center justify-center py-8 px-4 text-center">
							<Database className="h-12 w-12 text-gray-300 mb-3" />
							<p className="text-sm text-gray-500 mb-1">No tables available</p>
							<p className="text-xs text-gray-400">Please check your database connection</p>
						</div>
					)}
					{allTablesLoading ? (
						<Skeleton className="h-8 w-full" />
					) : allTablesError ? (
						<div className="flex flex-col items-center justify-center py-6 px-4 text-center border border-red-200 rounded-lg bg-red-50">
							<Database className="h-8 w-8 text-red-400 mb-2" />
							<p className="text-sm text-red-600 font-medium mb-1">Failed to load tables</p>
							<p className="text-xs text-red-500">{allTablesError}</p>
						</div>
					) : (
						<Select
							value={selectedTableId?.toString() || ''}
							onValueChange={handleTableChange}
						>
							<SelectTrigger className="h-8">
								<SelectValue placeholder="Select a table" />
							</SelectTrigger>
							<SelectContent>
								{allTables.map((table) => (
									<SelectItem key={table.id} value={table.id.toString()}>
										<div className="flex items-center space-x-2">
											<Table className="h-4 w-4" />
											<div className="flex-1">
												<div className="font-medium">{table.name}</div>
												<div className="text-xs text-gray-500 flex items-center gap-2">
													{table.databaseName && (
														<span className="bg-blue-100 text-blue-800 px-1.5 py-0.5 rounded text-xs">
															{table.databaseName}
														</span>
													)}
													{(table as any)._count && (
														<span>
															{(table as any)._count.columns ?? 0} columns • {(table as any)._count.rows ?? 0} rows
														</span>
													)}
												</div>
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
								{isLoadingColumns ? (
									<Skeleton className="h-8 w-full" />
								) : columnsError ? (
									<div className="flex flex-col items-center justify-center py-4 px-3 text-center border border-red-200 rounded-lg bg-red-50">
										<Columns className="h-6 w-6 text-red-400 mb-2" />
										<p className="text-xs text-red-600 font-medium mb-1">Failed to load columns</p>
										<p className="text-xs text-red-500">{columnsError}</p>
									</div>
								) : columns.length === 0 ? (
									<div className="flex flex-col items-center justify-center py-4 px-3 text-center border border-gray-200 rounded-lg bg-gray-50">
										<Columns className="h-6 w-6 text-gray-400 mb-2" />
										<p className="text-xs text-gray-500 font-medium mb-1">No columns available</p>
										<p className="text-xs text-gray-400">This table has no columns</p>
									</div>
								) : (
									<Select
										value={selectedColumnX || ''}
										onValueChange={onColumnXChange}
									>
										<SelectTrigger className="h-8">
											<SelectValue placeholder="Select X-axis column" />
										</SelectTrigger>
										<SelectContent>
											{(columns ?? [])
												.filter(column => !expectedXType || isColumnTypeCompatible(column?.type, expectedXType))
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
							{isLoadingColumns ? (
								<Skeleton className="h-8 w-full" />
							) : columnsError ? (
								<div className="flex flex-col items-center justify-center py-4 px-3 text-center border border-red-200 rounded-lg bg-red-50">
									<Columns className="h-6 w-6 text-red-400 mb-2" />
									<p className="text-xs text-red-600 font-medium mb-1">Failed to load columns</p>
									<p className="text-xs text-red-500">{columnsError}</p>
								</div>
							) : columns.length === 0 ? (
								<div className="flex flex-col items-center justify-center py-4 px-3 text-center border border-gray-200 rounded-lg bg-gray-50">
									<Columns className="h-6 w-6 text-gray-400 mb-2" />
									<p className="text-xs text-gray-500 font-medium mb-1">No columns available</p>
									<p className="text-xs text-gray-400">This table has no columns</p>
								</div>
							) : (
								<Select
									value={selectedColumnY || ''}
									onValueChange={onColumnYChange}
								>
									<SelectTrigger className="h-8">
										<SelectValue placeholder={selectedColumnX === undefined ? "Select value column" : "Select Y-axis column"} />
									</SelectTrigger>
									<SelectContent>
										{(columns ?? [])
											.filter(column => !expectedYType || isColumnTypeCompatible(column?.type, expectedYType))
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
						{isLoadingColumns ? (
							<Skeleton className="h-24 w-full" />
						) : columnsError ? (
							<div className="flex flex-col items-center justify-center py-6 px-4 text-center border border-red-200 rounded-lg bg-red-50">
								<Columns className="h-8 w-8 text-red-400 mb-2" />
								<p className="text-sm text-red-600 font-medium mb-1">Failed to load columns</p>
								<p className="text-xs text-red-500">{columnsError}</p>
							</div>
						) : columns.length === 0 ? (
							<div className="flex flex-col items-center justify-center py-6 px-4 text-center border border-gray-200 rounded-lg bg-gray-50">
								<Columns className="h-8 w-8 text-gray-400 mb-2" />
								<p className="text-sm text-gray-500 font-medium mb-1">No columns available</p>
								<p className="text-xs text-gray-400">This table has no columns to display</p>
							</div>
						) : (
							<div className="max-h-52 overflow-auto border rounded p-2 space-y-1">
								{(columns ?? []).map((column) => {
									const checked = (selectedColumns ?? []).includes(column?.name || '')
									const disabled = !!columnLimit && !checked && (selectedColumns?.length || 0) >= columnLimit
									return (
										<label key={column?.id || ''} className={`flex items-center gap-2 text-sm ${disabled ? 'opacity-50' : ''}`}>
											<input
												type="checkbox"
												checked={checked}
												disabled={disabled}
												onChange={(e) => {
													const next = new Set(selectedColumns ?? [])
													if (e.target.checked) next.add(column?.name || ''); else next.delete(column?.name || '')
													onColumnsChange(Array.from(next))
												}}
												className="h-3.5 w-3.5"
											/>
											<span className="flex-1 truncate">{column?.name || ''}</span>
											<span className="text-xs text-gray-500">{column?.type || ''}</span>
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
						{isLoadingColumns ? (
							<Skeleton className="h-24 w-full" />
						) : columnsError ? (
							<div className="flex flex-col items-center justify-center py-6 px-4 text-center border border-red-200 rounded-lg bg-red-50">
								<Columns className="h-8 w-8 text-red-400 mb-2" />
								<p className="text-sm text-red-600 font-medium mb-1">Failed to load columns</p>
								<p className="text-xs text-red-500">{columnsError}</p>
							</div>
						) : columns.length === 0 ? (
							<div className="flex flex-col items-center justify-center py-6 px-4 text-center border border-gray-200 rounded-lg bg-gray-50">
								<Columns className="h-8 w-8 text-gray-400 mb-2" />
								<p className="text-sm text-gray-500 font-medium mb-1">No columns available</p>
								<p className="text-xs text-gray-400">This table has no columns for filtering</p>
							</div>
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
						<p>Selected table: {(allTables || []).find(t => t.id === selectedTableId)?.name}</p>
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
