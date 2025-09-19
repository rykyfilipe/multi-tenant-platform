'use client';

import { useCallback, useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { Database, Table, Columns, Check, X, ChevronDown } from 'lucide-react';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Checkbox } from '@/components/ui/checkbox';
import { DropdownMenu, DropdownMenuContent, DropdownMenuTrigger, DropdownMenuCheckboxItem } from '@/components/ui/dropdown-menu';
import { useApp } from '@/contexts/AppContext';
import { FilterBuilder } from './FilterBuilder';
import { FilterConfig } from '@/types/filtering-enhanced';

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

interface ColumnMeta {
	id: number;
	name: string;
	type: string;
	isRequired?: boolean;
	tableId?: number;
}

export interface ChartAxisConfig {
	key: string;
	label: string;
	type: 'text' | 'number' | 'date' | 'boolean';
	columns: string[]; // Support multiple columns for this axis
}

export interface EnhancedDataSource {
	type: 'table' | 'manual';
	tableId?: number;
	// For charts: X and Y axis configuration
	xAxis?: ChartAxisConfig;
	yAxis?: ChartAxisConfig;
	// For tables: selected columns
	columns?: string[];
	// Filters
	filters?: FilterConfig[];
}

interface EnhancedTableSelectorProps {
	// Data source configuration
	dataSource: EnhancedDataSource;
	onDataSourceChange: (dataSource: EnhancedDataSource) => void;
	
	// Widget type specific configuration
	widgetType: 'chart' | 'table' | 'kpi';
	
	// Chart specific: which axes are supported
	supportedAxes?: ('x' | 'y')[];
	
	// Multi-column support for axes
	allowMultiColumn?: boolean;
	
	// Type validation for widget compatibility
	expectedXType?: 'text' | 'number' | 'date' | 'boolean';
	expectedYType?: 'text' | 'number' | 'date' | 'boolean';
	
	tenantId: number;
}

export function EnhancedTableSelector({
	dataSource,
	onDataSourceChange,
	widgetType,
	supportedAxes = ['x', 'y'],
	allowMultiColumn = false,
	expectedXType,
	expectedYType,
	tenantId
}: EnhancedTableSelectorProps) {
	console.log('[EnhancedTableSelector] Component initialized with:', {
		dataSource,
		widgetType,
		supportedAxes,
		allowMultiColumn,
		expectedXType,
		expectedYType
	});
	const { tenant, token } = useApp();
	
	// State for all tables from all databases
	const [allTables, setAllTables] = useState<TableMeta[]>([]);
	const [allTablesLoading, setAllTablesLoading] = useState(false);
	const [allTablesError, setAllTablesError] = useState<string | null>(null);
	
	const [columns, setColumns] = useState<ColumnMeta[]>([]);
	const [isLoadingColumns, setIsLoadingColumns] = useState(false);
	const [columnsError, setColumnsError] = useState<string | null>(null);

	// Function to load all tables from all databases
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
				console.log('[EnhancedTableSelector] Loaded all tables', tables);
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
			console.log('[EnhancedTableSelector] Auto-loading all tables on mount');
			loadAllTables();
		}
	}, []);

	// Auto-load columns when a table is selected
	useEffect(() => {
		if (dataSource.tableId && allTables.length > 0 && !isLoadingColumns && !columnsError && columns.length === 0) {
			console.log('[EnhancedTableSelector] Auto-loading columns for selected table:', dataSource.tableId);
			loadColumns(dataSource.tableId);
		}
	}, [dataSource.tableId, allTables.length, columns.length]);

	// Load columns for selected table
	const loadColumns = async (tableId: number) => {
		// Find the selected table to get its databaseId
		const selectedTable = allTables.find(table => table.id === tableId);
		const tableDatabaseId = selectedTable?.databaseId;
		
		console.log('[EnhancedTableSelector] loadColumns called:', {
			tableId,
			databaseId: tableDatabaseId,
			tenantId: tenant?.id,
			hasToken: !!token,
			selectedTable: selectedTable ? { id: selectedTable.id, name: selectedTable.name, databaseId: selectedTable.databaseId } : null
		});
		
		if (!tableDatabaseId) {
			console.error('[EnhancedTableSelector] No databaseId found for selected table');
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
				console.log('[EnhancedTableSelector] Loaded columns', cols);
				setColumns(cols);
			} else {
				throw new Error(`Failed to fetch columns: ${response.statusText}`);
			}
		} catch (e) {
			console.error('[EnhancedTableSelector] Error loading columns:', e);
			setColumnsError(e instanceof Error ? e.message : 'Failed to load columns');
		} finally {
			setIsLoadingColumns(false);
		}
	};

	const handleTableChange = async (tableId: string) => {
		const id = parseInt(tableId);
		const newDataSource: EnhancedDataSource = {
			...dataSource,
			type: 'table',
			tableId: id,
			// Reset axis configurations when table changes
			xAxis: undefined,
			yAxis: undefined,
			columns: []
		};
		onDataSourceChange(newDataSource);
		// Reset columns state when table changes
		setColumns([]);
		setColumnsError(null);
	};

	// Simplified column selection handlers
	const handleColumnSelect = (axis: 'x' | 'y', columnName: string) => {
		console.log('[EnhancedTableSelector] Column select:', { axis, columnName });
		const newDataSource = {
			...dataSource,
			[axis === 'x' ? 'columnX' : 'columnY']: columnName
		};
		onDataSourceChange(newDataSource);
	};

	const handleColumnToggle = (axis: 'x' | 'y', columnName: string, isSelected: boolean) => {
		console.log('[EnhancedTableSelector] Column toggle:', { axis, columnName, isSelected });
		const currentColumns = axis === 'x' ? (dataSource.xColumns || []) : (dataSource.yColumns || []);
		
		const newColumns = isSelected
			? [...currentColumns, columnName]
			: currentColumns.filter(col => col !== columnName);

		const newDataSource = {
			...dataSource,
			[axis === 'x' ? 'xColumns' : 'yColumns']: newColumns
		};
		onDataSourceChange(newDataSource);
	};

	const handleTableColumnsChange = (selectedColumns: string[]) => {
		const newDataSource: EnhancedDataSource = {
			...dataSource,
			columns: selectedColumns
		};
		onDataSourceChange(newDataSource);
	};

	const handleFiltersChange = (filters: FilterConfig[]) => {
		const newDataSource: EnhancedDataSource = {
			...dataSource,
			filters
		};
		onDataSourceChange(newDataSource);
	};

	// Get compatible columns for an axis
	const getCompatibleColumns = (expectedType?: 'text' | 'number' | 'date' | 'boolean') => {
		return columns.filter(column => 
			!expectedType || isColumnTypeCompatible(column.type, expectedType)
		);
	};

	const renderAxisSelector = (axis: 'x' | 'y', label: string, expectedType?: 'text' | 'number' | 'date' | 'boolean') => {
		// Get current selection from dataSource
		const currentColumn = axis === 'x' ? dataSource.columnX : dataSource.columnY;
		const currentColumns = axis === 'x' ? (dataSource.xColumns || []) : (dataSource.yColumns || []);
		
		console.log('[EnhancedTableSelector] renderAxisSelector:', {
			axis,
			label,
			expectedType,
			dataSource,
			currentColumn,
			currentColumns,
			columnX: dataSource.columnX,
			columnY: dataSource.columnY,
			xColumns: dataSource.xColumns,
			yColumns: dataSource.yColumns
		});
		
		const compatibleColumns = getCompatibleColumns(expectedType);

		return (
			<div className="space-y-2">
				<label className="text-xs font-medium text-gray-700 block">
					{label} {expectedType && `(${expectedType})`}
				</label>
				{isLoadingColumns ? (
					<Skeleton className="h-8 w-full" />
				) : columnsError ? (
					<div className="flex flex-col items-center justify-center py-4 px-3 text-center border border-red-200 rounded-lg bg-red-50">
						<Columns className="h-6 w-6 text-red-400 mb-2" />
						<p className="text-xs text-red-600 font-medium mb-1">Failed to load columns</p>
						<p className="text-xs text-red-500">{columnsError}</p>
					</div>
				) : compatibleColumns.length === 0 ? (
					<div className="flex flex-col items-center justify-center py-4 px-3 text-center border border-gray-200 rounded-lg bg-gray-50">
						<Columns className="h-6 w-6 text-gray-400 mb-2" />
						<p className="text-xs text-gray-500 font-medium mb-1">No compatible columns</p>
						<p className="text-xs text-gray-400">No columns of type {expectedType || 'any'} found</p>
					</div>
				) : allowMultiColumn ? (
					// Multi-column selection with dropdown checkboxes
					<DropdownMenu>
						<DropdownMenuTrigger asChild>
							<Button variant="outline" className="w-full justify-between h-8">
								<span className="text-xs">
									{currentColumns.length > 0 
										? `${currentColumns.length} column(s) selected`
										: 'Select columns'
									}
								</span>
								<ChevronDown className="h-3 w-3" />
							</Button>
						</DropdownMenuTrigger>
						<DropdownMenuContent className="w-full min-w-[200px] max-h-60 overflow-auto">
							{compatibleColumns.map((column) => {
								const isSelected = currentColumns.includes(column.name);
								console.log('[EnhancedTableSelector] Column checkbox:', { 
									columnName: column.name, 
									isSelected, 
									currentColumns,
									axis
								});
								return (
									<DropdownMenuCheckboxItem
										key={column.id}
										checked={isSelected}
										onCheckedChange={(checked) => handleColumnToggle(axis, column.name, checked)}
										className="text-sm"
									>
										<div className="flex items-center justify-between w-full">
											<span className="flex-1 truncate">{column.name}</span>
											<span className="text-xs text-gray-500 ml-2">{column.type}</span>
										</div>
									</DropdownMenuCheckboxItem>
								);
							})}
						</DropdownMenuContent>
					</DropdownMenu>
				) : (
					// Single column selection
					<Select
						value={currentColumn || ''}
						onValueChange={(value) => handleColumnSelect(axis, value)}
					>
						<SelectTrigger className="h-8">
							<SelectValue placeholder={`Select ${label.toLowerCase()} column`} />
						</SelectTrigger>
						<SelectContent>
							{compatibleColumns.map((column) => (
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
				
				{/* Show selected columns for multi-column mode */}
				{allowMultiColumn && currentColumns.length > 0 && (
					<div className="flex flex-wrap gap-1">
						{currentColumns.map((column) => (
							<Badge key={column} variant="secondary" className="text-xs">
								{column}
								<Button
									variant="ghost"
									size="sm"
									className="h-3 w-3 p-0 ml-1 hover:bg-destructive hover:text-destructive-foreground"
									onClick={() => handleColumnToggle(axis, column, false)}
								>
									<X className="h-2 w-2" />
								</Button>
							</Badge>
						))}
					</div>
				)}
			</div>
		);
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
							value={dataSource.tableId?.toString() || ''}
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

				{/* Column Selections based on widget type */}
				{dataSource.tableId && (
					<motion.div
						initial={{ opacity: 0, y: 10 }}
						animate={{ opacity: 1, y: 0 }}
						transition={{ duration: 0.2 }}
						className="space-y-4"
					>
						{widgetType === 'chart' && (
							<>
								{/* X-Axis Column Selection */}
								{supportedAxes.includes('x') && renderAxisSelector('x', 'X-Axis Column', expectedXType)}
								
								{/* Y-Axis Column Selection */}
								{supportedAxes.includes('y') && renderAxisSelector('y', 'Y-Axis Column', expectedYType)}
							</>
						)}

						{widgetType === 'table' && (
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
											const checked = (dataSource.columns ?? []).includes(column?.name || '')
											return (
												<label key={column?.id || ''} className="flex items-center gap-2 text-sm">
													<input
														type="checkbox"
														checked={checked}
														onChange={(e) => {
															const next = new Set(dataSource.columns ?? [])
															if (e.target.checked) next.add(column?.name || ''); else next.delete(column?.name || '')
															handleTableColumnsChange(Array.from(next))
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
							</div>
						)}

						{widgetType === 'kpi' && (
							renderAxisSelector('y', 'Value Column', 'number')
						)}
					</motion.div>
				)}

				{/* Filters */}
				{dataSource.tableId && (
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
								filters={dataSource.filters || []}
								availableColumns={columns}
								onFiltersChange={handleFiltersChange}
							/>
						)}
					</div>
				)}

				{/* Summary */}
				{dataSource.tableId && columns.length > 0 && (
					<div className="text-xs text-gray-500 space-y-1 pt-2 border-t">
						<p>Selected table: {(allTables || []).find(t => t.id === dataSource.tableId)?.name}</p>
						<p>Available columns: {columns.length}</p>
						{widgetType === 'chart' && (
							<>
								{dataSource.xAxis?.columns && dataSource.xAxis.columns.length > 0 && (
									<p>X-axis: {dataSource.xAxis.columns.join(', ')}</p>
								)}
								{dataSource.yAxis?.columns && dataSource.yAxis.columns.length > 0 && (
									<p>Y-axis: {dataSource.yAxis.columns.join(', ')}</p>
								)}
							</>
						)}
						{widgetType === 'table' && (
							<p>Selected columns: {dataSource.columns?.length || 0}</p>
						)}
						{widgetType === 'kpi' && dataSource.yAxis?.columns && dataSource.yAxis.columns.length > 0 && (
							<p>Value column: {dataSource.yAxis.columns[0]}</p>
						)}
					</div>
				)}
			</CardContent>
		</Card>
	);
}
