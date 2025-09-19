'use client';

import { useState, useEffect, useCallback } from 'react';
import { motion } from 'framer-motion';
import { Database, Table, Columns, Loader2, CheckCircle, AlertCircle, ArrowRight } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { useApp } from '@/contexts/AppContext';
import { WidgetType } from '@/types/widgets';
import { WidgetRegistry } from './WidgetRegistry';

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
  isNullable: boolean;
  isPrimaryKey?: boolean;
  description?: string;
}

interface DataMappingFlowProps {
  widgetType: WidgetType;
  selectedTableId?: number;
  currentMapping?: Record<string, string>;
  onTableSelect: (tableId: number) => void;
  onMappingComplete: (mapping: Record<string, string>) => void;
  onCancel: () => void;
  tenantId: number;
}

export function DataMappingFlow({
  widgetType,
  selectedTableId,
  currentMapping = {},
  onTableSelect,
  onMappingComplete,
  onCancel,
  tenantId,
}: DataMappingFlowProps) {
  const { tenant, token } = useApp();
  const [tables, setTables] = useState<TableMeta[]>([]);
  const [columns, setColumns] = useState<ColumnMeta[]>([]);
  const [isLoadingTables, setIsLoadingTables] = useState(false);
  const [isLoadingColumns, setIsLoadingColumns] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [mapping, setMapping] = useState<Record<string, string>>(currentMapping);
  const [isValid, setIsValid] = useState(false);

  // Get widget metadata for required fields
  const widgetMetadata = WidgetRegistry.getWidgetMetadata(widgetType);
  const requiredFields = widgetMetadata?.requiredFields || [];

  // Load tables on mount
  useEffect(() => {
    loadTables();
  }, [tenantId]);

  // Load columns when table is selected
  useEffect(() => {
    if (selectedTableId) {
      loadColumns(selectedTableId);
    }
  }, [selectedTableId]);

  // Validate mapping when it changes
  useEffect(() => {
    const isValidMapping = requiredFields.every(field => 
      mapping[field] && mapping[field].trim() !== ''
    );
    setIsValid(isValidMapping);
  }, [mapping, requiredFields]);

  const loadTables = async () => {
    if (!tenant?.id) return;
    
    setIsLoadingTables(true);
    setError(null);
    
    try {
      const response = await fetch(`/api/tenants/${tenant.id}/databases/tables`, {
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });
      
      if (!response.ok) {
        throw new Error('Failed to load tables');
      }
      
      const data = await response.json();
      setTables(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load tables');
    } finally {
      setIsLoadingTables(false);
    }
  };

  const loadColumns = async (tableId: number) => {
    setIsLoadingColumns(true);
    setError(null);
    
    try {
      const response = await fetch(`/api/tables/${tableId}/columns`, {
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });
      
      if (!response.ok) {
        throw new Error('Failed to load columns');
      }
      
      const data = await response.json();
      setColumns(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load columns');
    } finally {
      setIsLoadingColumns(false);
    }
  };

  const handleTableSelect = (tableId: number) => {
    onTableSelect(tableId);
    setMapping({}); // Reset mapping when table changes
  };

  const handleMappingChange = (field: string, columnName: string) => {
    setMapping(prev => ({
      ...prev,
      [field]: columnName
    }));
  };

  const handleComplete = () => {
    if (isValid) {
      onMappingComplete(mapping);
    }
  };

  const getColumnTypeColor = (type: string) => {
    const normalizedType = type.toLowerCase();
    if (['text', 'string', 'varchar', 'char'].includes(normalizedType)) return 'bg-blue-100 text-blue-800';
    if (['number', 'integer', 'decimal', 'float', 'double'].includes(normalizedType)) return 'bg-green-100 text-green-800';
    if (['date', 'datetime', 'timestamp'].includes(normalizedType)) return 'bg-purple-100 text-purple-800';
    if (['boolean', 'bool'].includes(normalizedType)) return 'bg-orange-100 text-orange-800';
    return 'bg-gray-100 text-gray-800';
  };

  const getFieldDescription = (field: string) => {
    const descriptions: Record<string, string> = {
      dateColumn: 'The column containing date/time information',
      titleColumn: 'The column containing the title or name',
      statusColumn: 'The column containing status information',
      valueColumn: 'The column containing numeric values',
      labelColumn: 'The column containing labels or categories',
      descriptionColumn: 'The column containing descriptions',
    };
    return descriptions[field] || `The column for ${field}`;
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-lg font-semibold">Data Source Mapping</h3>
          <p className="text-sm text-gray-600">
            Map table columns to widget fields for {widgetType} widget
          </p>
        </div>
        <Badge variant="outline" className="flex items-center gap-1">
          <Database className="h-3 w-3" />
          {tables.length} tables
        </Badge>
      </div>

      {/* Step 1: Table Selection */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="flex items-center gap-2 text-base">
            <Table className="h-4 w-4" />
            Step 1: Select Table
          </CardTitle>
        </CardHeader>
        <CardContent>
          {isLoadingTables ? (
            <div className="flex items-center gap-2 text-sm text-gray-600">
              <Loader2 className="h-4 w-4 animate-spin" />
              Loading tables...
            </div>
          ) : error ? (
            <div className="flex items-center gap-2 text-sm text-red-600">
              <AlertCircle className="h-4 w-4" />
              {error}
            </div>
          ) : (
            <Select
              value={selectedTableId?.toString() || ''}
              onValueChange={(value) => handleTableSelect(parseInt(value))}
            >
              <SelectTrigger>
                <SelectValue placeholder="Choose a table..." />
              </SelectTrigger>
              <SelectContent>
                {tables.map((table) => (
                  <SelectItem key={table.id} value={table.id.toString()}>
                    <div className="flex items-center justify-between w-full">
                      <span>{table.name}</span>
                      <Badge variant="secondary" className="ml-2">
                        {table._count?.columns || 0} columns
                      </Badge>
                    </div>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          )}
        </CardContent>
      </Card>

      {/* Step 2: Column Mapping */}
      {selectedTableId && (
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="flex items-center gap-2 text-base">
              <Columns className="h-4 w-4" />
              Step 2: Map Columns
              {isLoadingColumns && (
                <Loader2 className="h-4 w-4 animate-spin" />
              )}
            </CardTitle>
          </CardHeader>
          <CardContent>
            {isLoadingColumns ? (
              <div className="flex items-center gap-2 text-sm text-gray-600">
                <Loader2 className="h-4 w-4 animate-spin" />
                Loading columns...
              </div>
            ) : error ? (
              <div className="flex items-center gap-2 text-sm text-red-600">
                <AlertCircle className="h-4 w-4" />
                {error}
              </div>
            ) : (
              <div className="space-y-4">
                {requiredFields.map((field) => (
                  <div key={field} className="space-y-2">
                    <Label htmlFor={field} className="text-sm font-medium">
                      {field.replace(/([A-Z])/g, ' $1').replace(/^./, str => str.toUpperCase())}
                      <span className="text-red-500 ml-1">*</span>
                    </Label>
                    <p className="text-xs text-gray-600">
                      {getFieldDescription(field)}
                    </p>
                    <Select
                      value={mapping[field] || ''}
                      onValueChange={(value) => handleMappingChange(field, value)}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder={`Select column for ${field}...`} />
                      </SelectTrigger>
                      <SelectContent>
                        {columns.map((column) => (
                          <SelectItem key={column.id} value={column.name}>
                            <div className="flex items-center justify-between w-full">
                              <span>{column.name}</span>
                              <div className="flex items-center gap-2">
                                <Badge 
                                  variant="secondary" 
                                  className={`text-xs ${getColumnTypeColor(column.type)}`}
                                >
                                  {column.type}
                                </Badge>
                                {column.isPrimaryKey && (
                                  <Badge variant="outline" className="text-xs">
                                    PK
                                  </Badge>
                                )}
                              </div>
                            </div>
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      )}

      {/* Step 3: Validation & Actions */}
      {selectedTableId && columns.length > 0 && (
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                {isValid ? (
                  <>
                    <CheckCircle className="h-5 w-5 text-green-500" />
                    <span className="text-sm text-green-700">
                      All required fields mapped
                    </span>
                  </>
                ) : (
                  <>
                    <AlertCircle className="h-5 w-5 text-amber-500" />
                    <span className="text-sm text-amber-700">
                      {requiredFields.filter(field => !mapping[field]).length} required fields remaining
                    </span>
                  </>
                )}
              </div>
              
              <div className="flex items-center gap-2">
                <Button variant="outline" onClick={onCancel}>
                  Cancel
                </Button>
                <Button 
                  onClick={handleComplete}
                  disabled={!isValid}
                  className="flex items-center gap-2"
                >
                  Complete Mapping
                  <ArrowRight className="h-4 w-4" />
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
