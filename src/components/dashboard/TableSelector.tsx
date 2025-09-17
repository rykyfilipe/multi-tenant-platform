'use client';

import { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { Database, Table, Columns, RefreshCw } from 'lucide-react';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { Button } from '@/components/ui/button';
import { useSchemaCache, CachedColumnMeta } from '@/hooks/useSchemaCache';

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
	selectedColumnX?: string;
	selectedColumnY?: string;
	onTableChange: (tableId: number) => void;
	onColumnXChange: (column: string) => void;
	onColumnYChange: (column: string) => void;
	tenantId: number;
	databaseId: number;
}

export function TableSelector({
	selectedTableId,
	selectedColumnX,
	selectedColumnY,
	onTableChange,
	onColumnXChange,
	onColumnYChange,
	tenantId,
	databaseId,
}: TableSelectorProps) {
	const { tables, tablesLoading, tablesError, loadTables, getColumns, invalidate } = useSchemaCache(tenantId, databaseId);
	const [columns, setColumns] = useState<CachedColumnMeta[]>([]);
	const [isLoadingColumns, setIsLoadingColumns] = useState(false);
	const [columnsError, setColumnsError] = useState<string | null>(null);

  // Load columns on table change
  useEffect(() => {
    let mounted = true;
    async function load() {
      if (!selectedTableId) {
        setColumns([]);
        return;
      }
      setIsLoadingColumns(true);
      setColumnsError(null);
      try {
        // Use the API client to fetch columns
        const response = await fetch(`/api/tenants/${tenantId}/databases/${databaseId}/tables/${selectedTableId}/columns`);
        if (!response.ok) {
          throw new Error(`Failed to fetch columns: ${response.statusText}`);
        }
        const cols = await response.json();
        if (mounted) setColumns(cols);
      } catch (e) {
        if (mounted) setColumnsError(e instanceof Error ? e.message : 'Failed to load columns');
      } finally {
        if (mounted) setIsLoadingColumns(false);
      }
    }
    load();
    return () => {
      mounted = false;
    };
  }, [selectedTableId, tenantId, databaseId]);

	const handleTableChange = (tableId: string) => {
		const id = parseInt(tableId);
		onTableChange(id);
		// Reset columns when table changes
		onColumnXChange('');
		onColumnYChange('');
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
					{tablesLoading ? (
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

				{/* Column Selections */}
				{selectedTableId && (
					<motion.div
						initial={{ opacity: 0, y: 10 }}
						animate={{ opacity: 1, y: 0 }}
						transition={{ duration: 0.2 }}
						className="space-y-4"
					>
						{/* X-Axis Column */}
						<div>
							<label className="text-xs font-medium text-gray-700 mb-2 block">
								X-Axis Column
							</label>
							{isLoadingColumns ? (
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
										{columns.map((column) => (
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

						{/* Y-Axis Column */}
						<div>
							<label className="text-xs font-medium text-gray-700 mb-2 block">
								Y-Axis Column
							</label>
							{isLoadingColumns ? (
								<Skeleton className="h-8 w-full" />
							) : columnsError ? (
								<div className="text-sm text-red-600">{columnsError}</div>
							) : (
								<Select
									value={selectedColumnY || ''}
									onValueChange={onColumnYChange}
								>
									<SelectTrigger className="h-8">
										<SelectValue placeholder="Select Y-axis column" />
									</SelectTrigger>
									<SelectContent>
										{columns.map((column) => (
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
					</motion.div>
				)}

				{/* Summary */}
				{selectedTableId && columns.length > 0 && (
					<div className="text-xs text-gray-500 space-y-1 pt-2 border-t">
						<p>Selected table: {(tables || []).find(t => t.id === selectedTableId)?.name}</p>
						<p>Available columns: {columns.length}</p>
						{selectedColumnX && selectedColumnY && (
							<p className="text-green-600 font-medium">Ready to create chart</p>
						)}
					</div>
				)}
			</CardContent>
		</Card>
	);
}
