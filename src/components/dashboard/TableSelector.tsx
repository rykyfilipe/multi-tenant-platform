'use client';

import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Database, Table, Column } from 'lucide-react';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';

interface Table {
  id: number;
  name: string;
  description?: string;
  _count: {
    columns: number;
    rows: number;
  };
}

interface Column {
  id: number;
  name: string;
  type: string;
  isRequired: boolean;
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
  const [tables, setTables] = useState<Table[]>([]);
  const [columns, setColumns] = useState<Column[]>([]);
  const [isLoadingTables, setIsLoadingTables] = useState(true);
  const [isLoadingColumns, setIsLoadingColumns] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Fetch tables
  useEffect(() => {
    const fetchTables = async () => {
      try {
        setIsLoadingTables(true);
        setError(null);
        
        const response = await fetch(`/api/tenants/${tenantId}/databases/${databaseId}/tables`);
        if (!response.ok) {
          throw new Error(`Failed to fetch tables: ${response.statusText}`);
        }
        
        const data = await response.json();
        setTables(data.tables || []);
      } catch (err) {
        console.error('Error fetching tables:', err);
        setError(err instanceof Error ? err.message : 'Failed to fetch tables');
      } finally {
        setIsLoadingTables(false);
      }
    };

    fetchTables();
  }, [tenantId, databaseId]);

  // Fetch columns when table changes
  useEffect(() => {
    if (!selectedTableId) {
      setColumns([]);
      return;
    }

    const fetchColumns = async () => {
      try {
        setIsLoadingColumns(true);
        setError(null);
        
        const response = await fetch(`/api/tenants/${tenantId}/databases/${databaseId}/tables/${selectedTableId}/columns`);
        if (!response.ok) {
          throw new Error(`Failed to fetch columns: ${response.statusText}`);
        }
        
        const data = await response.json();
        setColumns(data.columns || []);
      } catch (err) {
        console.error('Error fetching columns:', err);
        setError(err instanceof Error ? err.message : 'Failed to fetch columns');
      } finally {
        setIsLoadingColumns(false);
      }
    };

    fetchColumns();
  }, [selectedTableId, tenantId, databaseId]);

  const handleTableChange = (tableId: string) => {
    const id = parseInt(tableId);
    onTableChange(id);
    // Reset column selections when table changes
    onColumnXChange('');
    onColumnYChange('');
  };

  if (error) {
    return (
      <Card className="h-full">
        <CardContent className="flex items-center justify-center h-32">
          <div className="text-center text-red-600">
            <Database className="h-8 w-8 mx-auto mb-2" />
            <p className="text-sm">{error}</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="h-full">
      <CardHeader className="pb-3">
        <CardTitle className="text-sm font-medium flex items-center">
          <Database className="h-4 w-4 mr-2" />
          Data Source
        </CardTitle>
      </CardHeader>
      <CardContent className="pt-0 space-y-4">
        {/* Table Selection */}
        <div>
          <label className="text-xs font-medium text-gray-700 mb-2 block">
            Table
          </label>
          {isLoadingTables ? (
            <Skeleton className="h-8 w-full" />
          ) : (
            <Select
              value={selectedTableId?.toString() || ''}
              onValueChange={handleTableChange}
            >
              <SelectTrigger className="h-8">
                <SelectValue placeholder="Select a table" />
              </SelectTrigger>
              <SelectContent>
                {tables.map((table) => (
                  <SelectItem key={table.id} value={table.id.toString()}>
                    <div className="flex items-center space-x-2">
                      <Table className="h-4 w-4" />
                      <div>
                        <div className="font-medium">{table.name}</div>
                        <div className="text-xs text-gray-500">
                          {table._count.columns} columns • {table._count.rows} rows
                        </div>
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
                          <Column className="h-4 w-4" />
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
                          <Column className="h-4 w-4" />
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
            <p>Selected table: {tables.find(t => t.id === selectedTableId)?.name}</p>
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
