'use client';

import { useState, useEffect, useMemo } from 'react';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { ChevronLeft, ChevronRight, Database, Search } from 'lucide-react';
import BaseWidget from './BaseWidget';
import { useSchemaCache } from '@/hooks/useSchemaCache';
import { api } from '@/lib/api-client';
import { FilterConfig } from '@/types/filtering';

export interface TableWidgetConfig {
  title?: string;
  dataSource: {
    type: 'table';
    tableId: number;
    columns: string[];
    filters?: FilterConfig[];
    sortBy?: string;
    sortOrder?: 'asc' | 'desc';
  };
  options?: {
    pageSize?: number;
    showPagination?: boolean;
    showSearch?: boolean;
  };
}


export interface Widget {
  id: number | string;
  title?: string | null;
  type: string;
  config?: TableWidgetConfig;
}

interface TableWidgetProps {
  widget: Widget;
  isEditMode?: boolean;
  onEdit?: () => void;
  onDelete?: () => void;
  tenantId?: number;
  databaseId?: number;
}

export default function TableWidget({ 
  widget, 
  isEditMode, 
  onEdit, 
  onDelete,
  tenantId, 
  databaseId 
}: TableWidgetProps) {
  const config = (widget.config || {}) as TableWidgetConfig;
  const dataSource = config.dataSource || { tableId: 0, columns: [] };
  const options = config.options || {};
  
  const [data, setData] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [searchTerm, setSearchTerm] = useState('');
  const [sortBy, setSortBy] = useState(dataSource.sortBy || 'id');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>(dataSource.sortOrder || 'asc');

  const { tables, columns, tablesLoading: schemaLoading } = useSchemaCache(tenantId || 1, databaseId || 1);
  const currentTable = tables?.find(t => t.id === dataSource.tableId);
  const availableColumns = (columns ?? []).filter((c: any) => c?.tableId === dataSource.tableId) || [];

  const pageSize = options.pageSize || 10;
  const totalPages = Math.ceil(data.length / pageSize);
  const startIndex = (currentPage - 1) * pageSize;
  const endIndex = startIndex + pageSize;

  // Fetch data when table or columns change
  useEffect(() => {
    if (dataSource.tableId && dataSource.tableId > 0 && dataSource.columns.length > 0) {
      fetchData();
    }
  }, [dataSource.tableId, dataSource.columns, currentPage, searchTerm, sortBy, sortOrder]);

  const fetchData = async () => {
    if (!tenantId || !databaseId) return;
    
    setIsLoading(true);
    setError(null);
    
    try {
      // Convert filters to the format expected by the API
      const apiFilters = dataSource.filters?.map(filter => {
        // Map FilterOperator to FilterData operator
        const operatorMap: Record<string, string> = {
          'equals': 'equals',
          'not_equals': 'not_equals',
          'contains': 'contains',
          'not_contains': 'not_contains',
          'greater_than': 'gt',
          'greater_than_or_equal': 'gte',
          'less_than': 'lt',
          'less_than_or_equal': 'lte',
          'is_empty': 'equals',
          'is_not_empty': 'not_equals'
        };
        
        return {
          column: filter.columnName,
          operator: (operatorMap[filter.operator] || 'equals') as 'equals' | 'not_equals' | 'contains' | 'not_contains' | 'gt' | 'gte' | 'lt' | 'lte' | 'in' | 'not_in',
          value: filter.operator === 'is_empty' ? null : filter.operator === 'is_not_empty' ? null : filter.value
        };
      }) || [];

      const response = await api.tables.rows(tenantId, databaseId, dataSource.tableId, {
        page: currentPage,
        limit: pageSize,
        search: searchTerm || undefined,
        sortBy: sortBy,
        sortOrder: sortOrder,
        filters: apiFilters.length > 0 ? apiFilters : undefined,
        // columns: dataSource.columns // Removed as it's not part of QueryData interface
      });

      if (response.success && response.data) {
        // Transform data from API format { id, cells: [...] } to { columnName: value }
        const transformedData = (response.data || []).map((row: any) => {
          if (row.cells && Array.isArray(row.cells)) {
            // Transform cells array to object with column names as keys
            const rowData: any = { id: row.id };
            row.cells.forEach((cell: any) => {
              if (cell.column && cell.column.name) {
                rowData[cell.column.name] = cell.value;
              }
            });
            return rowData;
          }
          return row; // Fallback if no cells structure
        });
        setData(transformedData);
      } else {
        setError(response.message || 'Failed to fetch data');
      }
    } catch (err) {
      console.error('Error fetching table data:', err);
      setError(err instanceof Error ? err.message : 'Failed to fetch data');
    } finally {
      setIsLoading(false);
    }
  };

  const handleRefresh = () => {
    fetchData();
  };

  const handleSearch = (value: string) => {
    setSearchTerm(value);
    setCurrentPage(1); // Reset to first page when searching
  };

  const handleSort = (column: string) => {
    if (sortBy === column) {
      setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc');
    } else {
      setSortBy(column);
      setSortOrder('asc');
    }
  };


  const paginatedData = useMemo(() => {
    return data.slice(startIndex, endIndex);
  }, [data, startIndex, endIndex]);

  const renderCellValue = (value: any) => {
    if (value === null || value === undefined) {
      return <span className="text-muted-foreground">-</span>;
    }
    
    if (typeof value === 'boolean') {
      return value ? 'Yes' : 'No';
    }
    
    if (typeof value === 'object') {
      return JSON.stringify(value);
    }
    
    return String(value);
  };

  return (
    <BaseWidget
      widget={widget}
      isEditMode={isEditMode}
      onEdit={onEdit}
      onDelete={onDelete}
      isLoading={isLoading}
      error={error}
      onRefresh={handleRefresh}
      showRefresh={true}
      className="table-widget-responsive"
    >
      <div className="space-y-3 sm:space-y-4 h-full flex flex-col">
        {/* Search and Controls */}
        {options.showSearch !== false && (
          <div className="flex items-center justify-between space-x-3 flex-shrink-0">
            {options.showSearch && (
              <div className="relative flex-1 max-w-xs sm:max-w-sm">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-slate-400" />
                <Input
                  placeholder="Search table..."
                  value={searchTerm}
                  onChange={(e) => handleSearch(e.target.value)}
                  className="pl-10 h-9 text-sm bg-slate-50/50 border-slate-200 focus:bg-white focus:border-blue-300 transition-colors duration-200"
                />
              </div>
            )}
          </div>
        )}

        {/* Table */}
        <div className="border border-slate-200/60 rounded-xl overflow-hidden flex-1 min-h-0 bg-white/50">
          {!dataSource.tableId || dataSource.tableId === 0 ? (
            <div className="flex flex-col items-center justify-center py-12 px-4 text-center h-full">
              <div className="w-16 h-16 bg-slate-100 rounded-2xl flex items-center justify-center mb-4">
                <Database className="h-8 w-8 text-slate-400" />
              </div>
              <p className="text-sm font-medium text-slate-600 mb-1">No table selected</p>
              <p className="text-xs text-slate-400">Please select a table to view data</p>
            </div>
          ) : (
            <div className="h-full overflow-auto">
              <Table>
                <TableHeader className="sticky top-0 bg-slate-50/80 backdrop-blur-sm z-10 border-b border-slate-200/60">
                  <TableRow className="hover:bg-transparent">
                    {(dataSource.columns ?? []).map((columnName) => {
                      const column = (availableColumns ?? []).find((c: any) => c?.name === columnName);
                      return (
                        <TableHead 
                          key={columnName}
                          className="cursor-pointer hover:bg-slate-100/60 text-xs sm:text-sm font-semibold text-slate-700 py-3 px-4 transition-colors duration-200"
                          onClick={() => handleSort(columnName)}
                        >
                          <div className="flex items-center space-x-2">
                            <span className="truncate">{(column as any)?.name || columnName}</span>
                            {sortBy === columnName && (
                              <span className="text-xs flex-shrink-0 text-blue-600">
                                {sortOrder === 'asc' ? '↑' : '↓'}
                              </span>
                            )}
                          </div>
                        </TableHead>
                      );
                    })}
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {paginatedData.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={(dataSource.columns ?? []).length} className="text-center py-12 text-slate-500">
                        <div className="flex flex-col items-center space-y-2">
                          <div className="w-8 h-8 bg-slate-100 rounded-full flex items-center justify-center">
                            <Database className="h-4 w-4 text-slate-400" />
                          </div>
                          <p className="text-sm font-medium">
                            {isLoading ? 'Loading...' : 'No data available'}
                          </p>
                        </div>
                      </TableCell>
                    </TableRow>
                  ) : (
                    paginatedData.map((row, index) => (
                      <TableRow 
                        key={row?.id || index} 
                        className="hover:bg-slate-50/60 transition-colors duration-150 border-b border-slate-100/60"
                      >
                        {(dataSource.columns ?? []).map((columnName) => (
                          <TableCell key={columnName} className="text-xs sm:text-sm py-3 px-4">
                            <div className="truncate max-w-[200px] sm:max-w-none text-slate-700">
                              {renderCellValue(row?.[columnName])}
                            </div>
                          </TableCell>
                        ))}
                      </TableRow>
                    ))
                  )}
                </TableBody>
              </Table>
            </div>
          )}
        </div>

        {/* Pagination */}
        {options.showPagination !== false && totalPages > 1 && (
          <div className="flex flex-col sm:flex-row items-center justify-between space-y-3 sm:space-y-0 flex-shrink-0 bg-slate-50/50 rounded-lg p-3 sm:p-4">
            <div className="text-xs sm:text-sm text-slate-600 font-medium">
              Showing {startIndex + 1} to {Math.min(endIndex, data.length)} of {data.length} entries
            </div>
            <div className="flex items-center space-x-1 sm:space-x-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
                disabled={currentPage === 1}
                className="h-8 px-3 text-xs sm:text-sm border-slate-300 hover:bg-slate-50 disabled:opacity-50"
              >
                <ChevronLeft className="h-3 w-3 sm:h-4 sm:w-4" />
                <span className="hidden sm:inline ml-1">Previous</span>
              </Button>
              
              <div className="flex items-center space-x-1">
                {Array.from({ length: Math.min(3, totalPages) }, (_, i) => {
                  const page = i + 1;
                  return (
                    <Button
                      key={page}
                      variant={currentPage === page ? "default" : "outline"}
                      size="sm"
                      onClick={() => setCurrentPage(page)}
                      className={`h-8 w-8 p-0 text-xs sm:text-sm ${
                        currentPage === page 
                          ? 'bg-blue-600 hover:bg-blue-700 text-white' 
                          : 'border-slate-300 hover:bg-slate-50'
                      }`}
                    >
                      {page}
                    </Button>
                  );
                })}
                {totalPages > 3 && (
                  <span className="text-xs text-slate-400 px-2">...</span>
                )}
              </div>
              
              <Button
                variant="outline"
                size="sm"
                onClick={() => setCurrentPage(prev => Math.min(totalPages, prev + 1))}
                disabled={currentPage === totalPages}
                className="h-8 px-3 text-xs sm:text-sm border-slate-300 hover:bg-slate-50 disabled:opacity-50"
              >
                <span className="hidden sm:inline mr-1">Next</span>
                <ChevronRight className="h-3 w-3 sm:h-4 sm:w-4" />
              </Button>
            </div>
          </div>
        )}
      </div>
    </BaseWidget>
  );
}
