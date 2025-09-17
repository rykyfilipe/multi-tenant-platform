'use client';

import { useState, useEffect, useMemo } from 'react';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { ChevronLeft, ChevronRight, Search, Download, Settings } from 'lucide-react';
import BaseWidget from './BaseWidget';
import { useSchemaCache } from '@/hooks/useSchemaCache';
import { api } from '@/lib/api-client';

export interface TableWidgetConfig {
  title?: string;
  dataSource: {
    type: 'table';
    tableId: number;
    columns: string[];
    filters?: any[];
    sortBy?: string;
    sortOrder?: 'asc' | 'desc';
  };
  options?: {
    pageSize?: number;
    showPagination?: boolean;
    showSearch?: boolean;
    showExport?: boolean;
    showColumnSelector?: boolean;
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
  const dataSource = config.dataSource || { tableId: 1, columns: [] };
  const options = config.options || {};
  
  const [data, setData] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [searchTerm, setSearchTerm] = useState('');
  const [sortBy, setSortBy] = useState(dataSource.sortBy || 'id');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>(dataSource.sortOrder || 'asc');
  const [showColumnSelector, setShowColumnSelector] = useState(false);

  const { tables, columns, isLoading: schemaLoading } = useSchemaCache(tenantId, databaseId);
  const currentTable = tables?.find(t => t.id === dataSource.tableId);
  const availableColumns = (columns ?? []).filter(c => c?.tableId === dataSource.tableId) || [];

  const pageSize = options.pageSize || 10;
  const totalPages = Math.ceil(data.length / pageSize);
  const startIndex = (currentPage - 1) * pageSize;
  const endIndex = startIndex + pageSize;

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
      const response = await api.tables.rows(tenantId, databaseId, dataSource.tableId, {
        page: currentPage,
        limit: pageSize,
        search: searchTerm || undefined,
        sortBy: sortBy,
        sortOrder: sortOrder,
        columns: dataSource.columns
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

  const handleColumnToggle = (columnName: string) => {
    const newColumns = (dataSource.columns ?? []).includes(columnName)
      ? (dataSource.columns ?? []).filter(c => c !== columnName)
      : [...(dataSource.columns ?? []), columnName];
    
    // This would need to be handled by the parent component
    // For now, we'll just log it
    console.log('Column toggle:', columnName, newColumns);
  };

  const handleExport = () => {
    // Export functionality would go here
    console.log('Export data:', data);
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
    >
      <div className="space-y-4">
        {/* Search and Controls */}
        {(options.showSearch !== false || options.showColumnSelector !== false) && (
          <div className="flex items-center justify-between space-x-2">
            {options.showSearch !== false && (
              <div className="relative flex-1 max-w-sm">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Search..."
                  value={searchTerm}
                  onChange={(e) => handleSearch(e.target.value)}
                  className="pl-10"
                />
              </div>
            )}
            
            <div className="flex items-center space-x-2">
              {options.showColumnSelector !== false && (
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setShowColumnSelector(!showColumnSelector)}
                >
                  <Settings className="h-4 w-4 mr-2" />
                  Columns
                </Button>
              )}
              
              {options.showExport !== false && (
                <Button
                  variant="outline"
                  size="sm"
                  onClick={handleExport}
                >
                  <Download className="h-4 w-4 mr-2" />
                  Export
                </Button>
              )}
            </div>
          </div>
        )}

        {/* Column Selector */}
        {showColumnSelector && (
          <div className="p-4 border rounded-lg bg-muted/50">
            <h4 className="text-sm font-medium mb-3">Select Columns to Display</h4>
            <div className="grid grid-cols-2 gap-2">
              {(availableColumns ?? []).map((column) => (
                <label key={column?.id || ''} className="flex items-center space-x-2">
                  <input
                    type="checkbox"
                    checked={(dataSource.columns ?? []).includes(column?.name || '')}
                    onChange={() => handleColumnToggle(column?.name || '')}
                    className="rounded"
                  />
                  <span className="text-sm">{column?.name || ''}</span>
                  <span className="text-xs text-muted-foreground">({column?.type || ''})</span>
                </label>
              ))}
            </div>
          </div>
        )}

        {/* Table */}
        <div className="border rounded-lg overflow-hidden">
          <Table>
            <TableHeader>
              <TableRow>
                {(dataSource.columns ?? []).map((columnName) => {
                  const column = (availableColumns ?? []).find(c => c?.name === columnName);
                  return (
                    <TableHead 
                      key={columnName}
                      className="cursor-pointer hover:bg-muted/50"
                      onClick={() => handleSort(columnName)}
                    >
                      <div className="flex items-center space-x-1">
                        <span>{column?.name || columnName}</span>
                        {sortBy === columnName && (
                          <span className="text-xs">
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
                  <TableCell colSpan={(dataSource.columns ?? []).length} className="text-center py-8 text-muted-foreground">
                    {isLoading ? 'Loading...' : 'No data available'}
                  </TableCell>
                </TableRow>
              ) : (
                paginatedData.map((row, index) => (
                  <TableRow key={row?.id || index}>
                    {(dataSource.columns ?? []).map((columnName) => (
                      <TableCell key={columnName}>
                        {renderCellValue(row?.[columnName])}
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
          <div className="flex items-center justify-between">
            <div className="text-sm text-muted-foreground">
              Showing {startIndex + 1} to {Math.min(endIndex, data.length)} of {data.length} entries
            </div>
            <div className="flex items-center space-x-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
                disabled={currentPage === 1}
              >
                <ChevronLeft className="h-4 w-4" />
                Previous
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
              >
                Next
                <ChevronRight className="h-4 w-4" />
              </Button>
            </div>
          </div>
        )}
      </div>
    </BaseWidget>
  );
}
