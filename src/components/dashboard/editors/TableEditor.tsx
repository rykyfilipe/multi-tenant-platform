/**
 * Table Widget Editor
 * Configuration editor for table widgets
 */

import React, { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import { Trash2, Plus } from 'lucide-react';
import { WidgetEditorProps, TableConfig, WidgetEntity } from '@/types/widget';
import { FilterConfig, ColumnType, FilterOperator, OPERATOR_COMPATIBILITY } from '@/types/filtering';
import { useSchemaCache } from '@/hooks/useSchemaCache';
import StyleOptions from './StyleOptions';

interface TableEditorProps extends WidgetEditorProps {
  widget: Partial<WidgetEntity> & { config?: TableConfig };
  tenantId?: number;
  databaseId?: number;
}

export default function TableEditor({ 
  widget, 
  onSave, 
  onCancel, 
  isOpen,
  tenantId,
  databaseId
}: TableEditorProps) {
  const { getColumns } = useSchemaCache(tenantId || 1, databaseId || 1);

  const [config, setConfig] = useState<TableConfig>({
    columns: [],
    showHeader: true,
    showFooter: false,
    pageSize: 10,
    sortable: true,
    filterable: true,
    style: {
      theme: 'default',
      headerStyle: 'default',
      rowHover: false,
      cellPadding: 'comfortable',
      fontSize: 'medium',
      borderStyle: 'thin',
      headerBackground: '#f8fafc',
      headerTextColor: '#1f2937',
      rowBackground: '#ffffff',
      alternateRowColor: '#f9fafb',
      borderColor: '#e5e7eb'
    },
    ...widget.config
  });

  const [availableColumns, setAvailableColumns] = useState<Array<{name: string, type: string}>>([]);
  const [newColumn, setNewColumn] = useState('');
  const [filters, setFilters] = useState<FilterConfig[]>(config.filters || []);
  const [showFilters, setShowFilters] = useState(false);

  // Load available columns from data source
  useEffect(() => {
    const loadColumns = async () => {
      if (widget.dataSource?.type === 'table' && widget.dataSource?.tableId && tenantId && databaseId) {
        try {
          const columns = await getColumns(widget.dataSource.tableId);
          setAvailableColumns(columns || []);
        } catch (error) {
          console.error('Failed to load table columns:', error);
          setAvailableColumns([]);
        }
      } else {
        setAvailableColumns([]);
      }
    };

    loadColumns();
  }, [widget.dataSource, tenantId, databaseId, getColumns]);

  const handleSave = () => {
    if (!config.columns || config.columns.length === 0) {
      alert('Please add at least one column');
      return;
    }

    onSave({
      ...widget,
      config: {
        ...config,
        filters
      },
      type: 'table'
    });
  };

  const handleConfigChange = (key: keyof TableConfig, value: any) => {
    setConfig(prev => ({
      ...prev,
      [key]: value
    }));
  };

  const handleStyleChange = (key: string, value: any) => {
    setConfig(prev => ({
      ...prev,
      style: {
        ...prev.style,
        [key]: value
      }
    }));
  };

  const addColumn = () => {
    if (newColumn && !config.columns.includes(newColumn)) {
      setConfig(prev => ({
        ...prev,
        columns: [...prev.columns, newColumn]
      }));
      setNewColumn('');
    }
  };

  const removeColumn = (index: number) => {
    setConfig(prev => ({
      ...prev,
      columns: prev.columns.filter((_, i) => i !== index)
    }));
  };

  // Filter management functions
  const addFilter = () => {
    const newFilter: FilterConfig = {
      id: `filter-${Date.now()}`,
      columnId: 0,
      columnName: '',
      columnType: 'string',
      operator: 'equals',
      value: null
    };
    setFilters(prev => [...prev, newFilter]);
  };

  const removeFilter = (index: number) => {
    setFilters(prev => prev.filter((_, i) => i !== index));
  };

  const updateFilter = (index: number, updates: Partial<FilterConfig>) => {
    setFilters(prev => prev.map((filter, i) => 
      i === index ? { ...filter, ...updates } : filter
    ));
  };

  const getAvailableOperators = (columnType: ColumnType) => {
    return OPERATOR_COMPATIBILITY[columnType] || [];
  };

  const getColumnType = (columnName: string): ColumnType => {
    // Find the column in availableColumns to get its real type
    const column = availableColumns.find(col => col.name === columnName);
    if (!column) return 'string';
    
    // Map database types to our ColumnType enum
    const typeMap: Record<string, ColumnType> = {
      'text': 'string',
      'string': 'string',
      'varchar': 'string',
      'char': 'string',
      'email': 'email',
      'url': 'url',
      'integer': 'integer',
      'int': 'integer',
      'number': 'number',
      'decimal': 'decimal',
      'float': 'decimal',
      'double': 'decimal',
      'boolean': 'boolean',
      'bool': 'boolean',
      'date': 'date',
      'datetime': 'datetime',
      'timestamp': 'datetime',
      'time': 'time'
    };
    
    return typeMap[column.type.toLowerCase()] || 'string';
  };

  return (
    <Dialog open={isOpen} onOpenChange={onCancel}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle>Configure Table</DialogTitle>
        </DialogHeader>

        <div className="space-y-6 py-4">
          {/* Column Configuration */}
          <div className="space-y-4">
            <h3 className="text-lg font-medium">Column Configuration</h3>
            
            <div className="space-y-2">
              <Label htmlFor="newColumn">Add Column</Label>
              <div className="flex gap-2">
                <Select value={newColumn} onValueChange={setNewColumn}>
                  <SelectTrigger className="flex-1">
                    <SelectValue placeholder="Select column to add" />
                  </SelectTrigger>
                  <SelectContent>
                    {availableColumns
                      .filter(col => !config.columns.includes(col.name))
                      .map(column => (
                        <SelectItem key={column.name} value={column.name}>
                          <div className="flex items-center justify-between w-full">
                            <span>{column.name}</span>
                            <span className="text-xs text-gray-500 ml-2">{column.type}</span>
                          </div>
                        </SelectItem>
                      ))}
                  </SelectContent>
                </Select>
                <Button onClick={addColumn} disabled={!newColumn}>
                  Add
                </Button>
              </div>
            </div>

            <div className="space-y-2">
              <Label>Selected Columns</Label>
              <div className="space-y-1">
                {config.columns.map((column, index) => {
                  const columnInfo = availableColumns.find(col => col.name === column);
                  return (
                    <div key={index} className="flex items-center justify-between p-2 border rounded">
                      <div className="flex flex-col">
                        <span className="font-medium">{column}</span>
                        {columnInfo && (
                          <span className="text-xs text-gray-500">{columnInfo.type}</span>
                        )}
                      </div>
                      <Button
                        onClick={() => removeColumn(index)}
                        variant="outline"
                        size="sm"
                      >
                        Remove
                      </Button>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>

          {/* Filter Configuration */}
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-lg font-medium">Filter Configuration</h3>
              <Button
                onClick={() => setShowFilters(!showFilters)}
                variant="outline"
                size="sm"
              >
                {showFilters ? 'Hide Filters' : 'Show Filters'}
              </Button>
            </div>
            
            {showFilters && (
              <div className="space-y-3 border rounded-lg p-4 bg-gray-50">
                <div className="flex items-center justify-between">
                  <Label className="text-sm font-medium">Filters</Label>
                  <Button onClick={addFilter} size="sm" variant="outline">
                    <Plus className="h-4 w-4 mr-1" />
                    Add Filter
                  </Button>
                </div>
                
                {filters.length === 0 ? (
                  <p className="text-sm text-gray-500 text-center py-4">
                    No filters configured. Click "Add Filter" to create one.
                  </p>
                ) : (
                  <div className="space-y-3">
                    {filters.map((filter, index) => (
                      <div key={filter.id} className="flex items-center space-x-2 p-3 bg-white rounded border">
                        {/* Column Selection */}
                        <Select
                          value={filter.columnName}
                          onValueChange={(value) => {
                            const columnType = getColumnType(value);
                            updateFilter(index, {
                              columnName: value,
                              columnType,
                              operator: 'equals', // Reset to default operator
                              value: null
                            });
                          }}
                        >
                          <SelectTrigger className="w-32">
                            <SelectValue placeholder="Column" />
                          </SelectTrigger>
                          <SelectContent>
                            {availableColumns.map(column => (
                              <SelectItem key={column.name} value={column.name}>
                                <div className="flex items-center justify-between w-full">
                                  <span>{column.name}</span>
                                  <span className="text-xs text-gray-500 ml-2">{column.type}</span>
                                </div>
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>

                        {/* Operator Selection */}
                        <Select
                          value={filter.operator}
                          onValueChange={(value) => updateFilter(index, { operator: value as FilterOperator, value: null })}
                        >
                          <SelectTrigger className="w-32">
                            <SelectValue placeholder="Operator" />
                          </SelectTrigger>
                          <SelectContent>
                            {getAvailableOperators(filter.columnType).map(operator => (
                              <SelectItem key={operator} value={operator}>
                                {operator.replace(/_/g, ' ')}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>

                        {/* Value Input */}
                        {!['is_empty', 'is_not_empty', 'today', 'yesterday', 'this_week', 'last_week', 'this_month', 'last_month', 'this_year', 'last_year'].includes(filter.operator) && (
                          <Input
                            placeholder="Value"
                            value={String(filter.value || '')}
                            onChange={(e) => updateFilter(index, { value: e.target.value })}
                            className="w-32"
                          />
                        )}

                        {/* Second Value for range operators */}
                        {['between', 'not_between'].includes(filter.operator) && (
                          <Input
                            placeholder="To"
                            value={String(filter.secondValue || '')}
                            onChange={(e) => updateFilter(index, { secondValue: e.target.value })}
                            className="w-32"
                          />
                        )}

                        {/* Remove Filter Button */}
                        <Button
                          onClick={() => removeFilter(index)}
                          variant="outline"
                          size="sm"
                          className="text-red-600 hover:text-red-700"
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Display Configuration */}
          <div className="space-y-4">
            <h3 className="text-lg font-medium">Display Configuration</h3>
            
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="pageSize">Page Size</Label>
                <Input
                  type="number"
                  min="1"
                  max="100"
                  value={config.pageSize}
                  onChange={(e) => handleConfigChange('pageSize', parseInt(e.target.value) || 10)}
                />
              </div>
            </div>

            <div className="space-y-3">
              <div className="flex items-center space-x-2">
                <Switch
                  id="showHeader"
                  checked={config.showHeader}
                  onCheckedChange={(checked) => handleConfigChange('showHeader', checked)}
                />
                <Label htmlFor="showHeader">Show Header</Label>
              </div>

              <div className="flex items-center space-x-2">
                <Switch
                  id="showFooter"
                  checked={config.showFooter}
                  onCheckedChange={(checked) => handleConfigChange('showFooter', checked)}
                />
                <Label htmlFor="showFooter">Show Footer</Label>
              </div>

              <div className="flex items-center space-x-2">
                <Switch
                  id="sortable"
                  checked={config.sortable}
                  onCheckedChange={(checked) => handleConfigChange('sortable', checked)}
                />
                <Label htmlFor="sortable">Sortable</Label>
              </div>

              <div className="flex items-center space-x-2">
                <Switch
                  id="filterable"
                  checked={config.filterable}
                  onCheckedChange={(checked) => handleConfigChange('filterable', checked)}
                />
                <Label htmlFor="filterable">Filterable</Label>
              </div>
            </div>
          </div>
        </div>

        {/* Style Options */}
        <div className="space-y-4">
          <StyleOptions
            style={config.style || {}}
            onStyleChange={handleStyleChange}
            widgetType="table"
          />
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={onCancel}>
            Cancel
          </Button>
          <Button onClick={handleSave}>
            Save Configuration
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}