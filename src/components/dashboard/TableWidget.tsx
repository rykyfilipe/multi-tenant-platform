'use client';

import { useState, useEffect, useMemo } from 'react';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { ChevronLeft, ChevronRight, Search } from 'lucide-react';
import BaseWidget from './BaseWidget';
import { useSchemaCache } from '@/hooks/useSchemaCache';
import { api } from '@/lib/api-client';
import { WidgetProps, BaseWidget as BaseWidgetType } from '@/types/widgets';
import { WidgetDataProvider } from './WidgetDataProvider';

export interface TableWidgetConfig {
  title?: string;
  dataSource: {
    type: 'table';
    tableId: number | null;
    columns: string[];
    filters?: any[];
    sortBy?: string | null;
    sortOrder?: 'asc' | 'desc';
  };
  options?: {
    pageSize?: number;
    showPagination?: boolean;
    showSearch?: boolean;
  };
}

interface TableWidgetProps extends WidgetProps {
  widget: BaseWidgetType;
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
  const dataSource = config.dataSource || { tableId: null, columns: [] };
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

  // Fetch data when table or columns change
  useEffect(() => {
    if (dataSource.tableId && dataSource.columns.length > 0) {
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

      const response = await api.tables.rows(tenantId || 1, databaseId || 1, dataSource.tableId || 1, {
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

  return (
    <WidgetDataProvider widget={widget}>
      {({ data, isLoading, error, refetch }) => {
        // For table widgets, data should be in format: { columns: [], rows: [], totalCount: number }
        const tableData = data && typeof data === 'object' && 'columns' in data ? data as unknown as { columns: any[]; rows: any[]; totalCount: number } : { columns: [], rows: [], totalCount: 0 };
        const tableRows = tableData.rows || [];
        const tableColumns = tableData.columns || [];
        
        const totalPages = Math.ceil(tableRows.length / pageSize);
        const startIndex = (currentPage - 1) * pageSize;
        const endIndex = startIndex + pageSize;
        
        const paginatedData = tableRows.slice(startIndex, endIndex);

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
          onRefresh={refetch}
          showRefresh={true}
        >
      <div className="space-y-4">
        {/* Search and Controls */}
        {options.showSearch !== false && (
          <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-2 sm:gap-4 mb-4">
            {options.showSearch && (
              <div className="relative flex-1 max-w-sm">
                <Search className="absolute left-2 top-1/2 transform -translate-y-1/2 h-3 w-3 sm:h-4 sm:w-4 text-muted-foreground" />
                <Input
                  placeholder="Search..."
                  value={searchTerm}
                  onChange={(e) => handleSearch(e.target.value)}
                  className="pl-8 sm:pl-10 text-sm"
                />
              </div>
            )}
          </div>
        )}


        {/* Table */}
        <div className="border rounded-lg overflow-hidden">
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  {(dataSource.columns ?? []).map((columnName) => {
                    const column = (availableColumns ?? []).find((c: any) => c?.name === columnName);
                    return (
                      <TableHead 
                        key={columnName}
                        className="cursor-pointer hover:bg-muted/50 text-xs sm:text-sm whitespace-nowrap"
                        onClick={() => handleSort(columnName)}
                      >
                        <div className="flex items-center space-x-1">
                          <span className="truncate">{(column as any)?.name || columnName}</span>
                          {sortBy === columnName && (
                            <span className="text-xs flex-shrink-0">
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
                  <TableCell colSpan={tableColumns.length} className="text-center py-8 text-muted-foreground">
                    {isLoading ? 'Loading...' : 'No data available'}
                  </TableCell>
                </TableRow>
              ) : (
                paginatedData.map((row, index) => (
                  <TableRow key={row?.id || index}>
                    {tableColumns.map((column: any) => (
                      <TableCell key={column.key} className="text-xs sm:text-sm whitespace-nowrap">
                        <div className="truncate max-w-[150px] sm:max-w-none">
                          {renderCellValue(row?.[column.key].value)}
                        </div>
                      </TableCell>
                    ))}
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </div>

        {/* Pagination */}
        {options.showPagination !== false && totalPages > 1 && (
          <div className="flex flex-col sm:flex-row items-center justify-between gap-2 sm:gap-4">
            <div className="text-xs sm:text-sm text-muted-foreground text-center sm:text-left">
              Showing {startIndex + 1} to {Math.min(endIndex, tableRows.length)} of {tableRows.length} entries
            </div>
            <div className="flex items-center space-x-1 sm:space-x-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
                disabled={currentPage === 1}
                className="text-xs px-2 py-1"
              >
                <ChevronLeft className="h-3 w-3 sm:h-4 sm:w-4" />
                <span className="hidden sm:inline ml-1">Previous</span>
              </Button>
              
              <div className="flex items-center space-x-1">
                {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                  const page = i + 1;
                  return (
                    <Button
                      key={page}
                      variant={currentPage === page ? "default" : "outline"}
                      size="sm"
                      onClick={() => setCurrentPage(page)}
                    >
                      {page}
                    </Button>
                  );
                })}
              </div>
              
              <Button
                variant="outline"
                size="sm"
                onClick={() => setCurrentPage(prev => Math.min(totalPages, prev + 1))}
                disabled={currentPage === totalPages}
                className="text-xs px-2 py-1"
              >
                <span className="hidden sm:inline mr-1">Next</span>
                <ChevronRight className="h-3 w-3 sm:h-4 sm:w-4" />
              </Button>
            </div>
          </div>
        )}
      </div>
      </div>
    </BaseWidget>
        );
      }}
    </WidgetDataProvider>
  );
}
