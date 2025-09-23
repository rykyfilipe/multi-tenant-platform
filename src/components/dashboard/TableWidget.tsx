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
import { 
  mapRawRowsToProcessedData,
  validateTableWidgetConfig,
  type AggregationFunction,
  type ColumnMeta 
} from '@/lib/widget-aggregation';

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
  const [allData, setAllData] = useState<any[]>([]); // Store all data for local filtering
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [searchTerm, setSearchTerm] = useState('');
  const [sortBy, setSortBy] = useState(dataSource.sortBy || 'id');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>(dataSource.sortOrder || 'asc');
  const [pagination, setPagination] = useState<{
    page: number;
    pageSize: number;
    totalRows: number;
    totalPages: number;
    hasNext: boolean;
    hasPrev: boolean;
  } | null>(null);

  const { tables, columns, tablesLoading: schemaLoading } = useSchemaCache(tenantId || 1, databaseId || 1);
  const currentTable = tables?.find(t => t.id === dataSource.tableId);
  const availableColumns = (columns ?? []).filter((c: any) => c?.tableId === dataSource.tableId) || [];

  const pageSize = options.pageSize || 10;
  const totalPages = pagination?.totalPages || Math.ceil(data.length / pageSize);
  const startIndex = (currentPage - 1) * pageSize;
  const endIndex = startIndex + pageSize;

  // Fetch data when table or columns change (but not for search - that's handled locally)
  useEffect(() => {
    if (dataSource.tableId && dataSource.tableId > 0 && dataSource.columns.length > 0) {
      fetchData();
    }
  }, [dataSource.tableId, dataSource.columns, currentPage, sortBy, sortOrder]);

  // Handle local filtering when search term changes
  useEffect(() => {
    if (allData.length > 0) {
      handleSearch(searchTerm);
    }
  }, [searchTerm, allData]);

  const fetchData = async () => {
    if (!tenantId || !databaseId) return;
    
    setIsLoading(true);
    setError(null);
    
    try {
      // Convert filters to the format expected by the API
      // Check both config.filters and dataSource.filters for compatibility
      const filters = (config as any).filters || dataSource.filters || [];
      const apiFilters = filters.map((filter: any) => {
        // Map FilterOperator to backend operator format
        const operatorMap: Record<string, string> = {
          'equals': 'equals',
          'not_equals': 'not_equals',
          'contains': 'contains',
          'not_contains': 'not_contains',
          'starts_with': 'starts_with',
          'ends_with': 'ends_with',
          'regex': 'regex',
          'greater_than': 'greater_than',
          'greater_than_or_equal': 'greater_than_or_equal',
          'less_than': 'less_than',
          'less_than_or_equal': 'less_than_or_equal',
          'between': 'between',
          'not_between': 'not_between',
          'before': 'before',
          'after': 'after',
          'today': 'today',
          'yesterday': 'yesterday',
          'this_week': 'this_week',
          'last_week': 'last_week',
          'this_month': 'this_month',
          'last_month': 'last_month',
          'this_year': 'this_year',
          'last_year': 'last_year',
          'is_empty': 'is_empty',
          'is_not_empty': 'is_not_empty'
        };
        
        return {
          id: filter.id || `${filter.columnId}-${filter.operator}-${Date.now()}`,
          columnId: filter.columnId || 0,
          columnName: filter.columnName,
          columnType: filter.columnType,
          operator: operatorMap[filter.operator] || filter.operator,
          value: filter.operator === 'is_empty' ? null : filter.operator === 'is_not_empty' ? null : filter.value,
          secondValue: filter.secondValue || null
        };
      }) || [];

      const response = await api.tables.rows(tenantId, databaseId, dataSource.tableId, {
        page: currentPage,
        limit: pageSize,
        // search: searchTerm || undefined, // Removed - search is now handled locally
        sortBy: sortBy,
        sortOrder: sortOrder,
        filters: apiFilters.length > 0 ? apiFilters : undefined,
        // columns: dataSource.columns // Removed as it's not part of QueryData interface
      });

      if (response.success && response.data) {
        // Use common data mapping utility
        const transformedData = mapRawRowsToProcessedData(response.data || []);
        
        // Store all data for local filtering
        setAllData(transformedData);
        setData(transformedData);
        
        // Since getAllRows fetches all data, we need to calculate pagination locally
        const totalRows = transformedData.length;
        const totalPages = Math.ceil(totalRows / pageSize);
        setPagination({
          page: currentPage,
          pageSize,
          totalRows,
          totalPages,
          hasNext: currentPage < totalPages,
          hasPrev: currentPage > 1
        });
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
    
    // Filter data locally
    if (value.trim() === '') {
      // If search is empty, show all data
      setData(allData);
    } else {
      // Filter allData based on search term
      const filteredData = allData.filter((row) => {
        return Object.values(row).some((cellValue) => {
          if (cellValue === null || cellValue === undefined) return false;
          return String(cellValue).toLowerCase().includes(value.toLowerCase());
        });
      });
      setData(filteredData);
    }
    
    // Recalculate pagination for filtered data
    const filteredRows = value.trim() === '' ? allData.length : data.filter((row) => {
      return Object.values(row).some((cellValue) => {
        if (cellValue === null || cellValue === undefined) return false;
        return String(cellValue).toLowerCase().includes(value.toLowerCase());
      });
    }).length;
    
    const totalPages = Math.ceil(filteredRows / pageSize);
    setPagination({
      page: 1,
      pageSize,
      totalRows: filteredRows,
      totalPages,
      hasNext: 1 < totalPages,
      hasPrev: false
    });
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

  const renderCellValue = (value: any, columnName: string) => {
    if (value === null || value === undefined) {
      return <span className="text-black/40">-</span>;
    }
    
    if (typeof value === 'boolean') {
      return value ? 'Yes' : 'No';
    }
    
    if (typeof value === 'object') {
      return JSON.stringify(value);
    }
    
    // Check if this is a reference column
    const column = availableColumns.find((c: any) => c?.name === columnName);
    if (column?.type === 'reference' || column?.type === 'link') {
      // For reference columns, we'll display the full row data with truncation
      // The actual reference data will be fetched and displayed by EditableCell
      return <span className="text-blue-600 font-medium">Reference Data</span>;
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
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-black/40" />
                <Input
                  placeholder="Search table..."
                  value={searchTerm}
                  onChange={(e) => handleSearch(e.target.value)}
                  className="pl-10 h-9 text-sm bg-black/5 border-black/20 focus:bg-white focus:border-black/40 transition-colors duration-200"
                />
              </div>
            )}
          </div>
        )}

        {/* Table */}
        <div className="border border-black/10 rounded-xl overflow-hidden flex-1 min-h-0 bg-white">
          {!dataSource.tableId || dataSource.tableId === 0 ? (
            <div className="flex flex-col items-center justify-center py-12 px-4 text-center h-full">
              <div className="w-16 h-16 bg-black/5 rounded-2xl flex items-center justify-center mb-4">
                <Database className="h-8 w-8 text-black/40" />
              </div>
              <p className="text-sm font-medium text-black/70 mb-1">No table selected</p>
              <p className="text-xs text-black/50">Please select a table to view data</p>
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
                          className="cursor-pointer hover:bg-gray-100 text-xs sm:text-sm font-semibold text-gray-700 py-3 px-4 transition-colors duration-200"
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
                      <TableCell colSpan={(dataSource.columns ?? []).length} className="text-center py-12 text-gray-500">
                        <div className="flex flex-col items-center space-y-2">
                          <div className="w-8 h-8 bg-gray-100 rounded-full flex items-center justify-center">
                            <Database className="h-4 w-4 text-gray-400" />
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
                        className="hover:bg-gray-50 transition-colors duration-150 border-b border-gray-100"
                      >
                        {(dataSource.columns ?? []).map((columnName) => (
                          <TableCell key={columnName} className="text-xs sm:text-sm py-3 px-4">
                            <div className="truncate max-w-[200px] sm:max-w-none text-gray-700">
                              {renderCellValue(row?.[columnName], columnName)}
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
              Showing {startIndex + 1} to {Math.min(endIndex, pagination?.totalRows || data.length)} of {pagination?.totalRows || data.length} entries
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
                  <span className="text-xs text-gray-400 px-2">...</span>
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
