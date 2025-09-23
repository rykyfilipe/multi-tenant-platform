'use client';

import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Plus, Trash2, Filter } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Filter as FilterIcon } from 'lucide-react';
import { ColumnType, FilterConfig } from '@/types/filtering';

interface ColumnMeta {
  id: number;
  name: string;
  type: string;
  required?: boolean;
  unique?: boolean;
}

interface FilterBuilderProps {
  filters: FilterConfig[];
  availableColumns: ColumnMeta[];
  onFiltersChange: (filters: FilterConfig[]) => void;
}

const OPERATORS = [
  { value: 'equals', label: 'Equals' },
  { value: 'not_equals', label: 'Not Equals' },
  { value: 'contains', label: 'Contains' },
  { value: 'not_contains', label: 'Not Contains' },
  { value: 'greater_than', label: 'Greater Than' },
  { value: 'greater_than_or_equal', label: 'Greater Than or Equal' },
  { value: 'less_than', label: 'Less Than' },
  { value: 'less_than_or_equal', label: 'Less Than or Equal' },
  { value: 'between', label: 'Between' },
  { value: 'not_between', label: 'Not Between' },
  { value: 'starts_with', label: 'Starts With' },
  { value: 'ends_with', label: 'Ends With' },
  { value: 'regex', label: 'Regex' },
  { value: 'before', label: 'Before' },
  { value: 'after', label: 'After' },
  { value: 'today', label: 'Today' },
  { value: 'yesterday', label: 'Yesterday' },
  { value: 'this_week', label: 'This Week' },
  { value: 'last_week', label: 'Last Week' },
  { value: 'this_month', label: 'This Month' },
  { value: 'last_month', label: 'Last Month' },
  { value: 'this_year', label: 'This Year' },
  { value: 'last_year', label: 'Last Year' },
  { value: 'is_empty', label: 'Is Empty' },
  { value: 'is_not_empty', label: 'Is Not Empty' },
];

export function FilterBuilder({ filters, availableColumns, onFiltersChange }: FilterBuilderProps) {
  const [editingFilters, setEditingFilters] = useState<FilterConfig[]>(filters);

  useEffect(() => {
    setEditingFilters(filters);
  }, [filters]);

  const handleFilterChange = (index: number, field: keyof FilterConfig, value: string | number | null) => {
    const newFilters = [...editingFilters];
    const filter = newFilters[index];
    
    // Convert value to appropriate type based on column type
    let convertedValue = value;
    if (field === 'value' && filter.columnType) {
      convertedValue = convertValueToType(value, filter.columnType);
    }
    if (field === 'secondValue' && filter.columnType) {
      convertedValue = convertValueToType(value, filter.columnType);
    }
    
    newFilters[index] = { ...filter, [field]: convertedValue };
    setEditingFilters(newFilters);
    onFiltersChange(newFilters);
  };

  const convertValueToType = (value: string | number | null, columnType: string): any => {
    if (value === null || value === '') return null;
    
    const stringValue = String(value);
    
    switch (columnType.toLowerCase()) {
      case 'integer':
      case 'number':
      case 'decimal':
      case 'float':
        return isNaN(Number(stringValue)) ? null : Number(stringValue);
      case 'boolean':
        return stringValue.toLowerCase() === 'true' || stringValue === '1';
      case 'date':
      case 'datetime':
      case 'timestamp':
        return new Date(stringValue).toISOString();
      default:
        return stringValue;
    }
  };

  const handleAddFilter = () => {
    const newFilter: FilterConfig = {
      id: `filter_${Date.now()}`,
      columnId: availableColumns[0]?.id || 0,
      columnName: availableColumns[0]?.name || '',
      columnType: availableColumns[0]?.type as any || 'text',
      operator: 'equals' as any,
      value: '',
    };
    const newFilters = [...editingFilters, newFilter];
    setEditingFilters(newFilters);
    onFiltersChange(newFilters);
  };

  const handleRemoveFilter = (index: number) => {
    const newFilters = (editingFilters ?? []).filter((_, i) => i !== index);
    setEditingFilters(newFilters);
    onFiltersChange(newFilters);
  };

  const getValueInputType = (operator: string, columnType?: string) => {
    if (['is_empty', 'is_not_empty', 'today', 'yesterday', 'this_week', 'last_week', 'this_month', 'last_month', 'this_year', 'last_year'].includes(operator)) {
      return 'hidden';
    }
    
    // Use column type to determine input type
    if (columnType) {
      const lowerType = columnType.toLowerCase();
      if (['integer', 'number', 'decimal', 'float'].includes(lowerType)) {
        return 'number';
      }
      if (['date', 'datetime', 'timestamp'].includes(lowerType)) {
        return 'date';
      }
      if (['boolean'].includes(lowerType)) {
        return 'checkbox';
      }
    }
    
    // Fallback to operator-based logic
    if (['greater_than', 'greater_than_or_equal', 'less_than', 'less_than_or_equal', 'between', 'not_between'].includes(operator)) {
      return 'number';
    }
    if (['before', 'after'].includes(operator)) {
      return 'date';
    }
    
    return 'text';
  };

  const needsSecondValue = (operator: string) => {
    return ['between', 'not_between'].includes(operator);
  };

  const isValueRequired = (operator: string) => {
    return !['is_empty', 'is_not_empty'].includes(operator);
  };

  return (
    <Card className="h-full">
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <CardTitle className="text-sm font-medium flex items-center">
            <Filter className="h-4 w-4 mr-2" />
            Filters
          </CardTitle>
          <Button
            variant="outline"
            size="sm"
            onClick={handleAddFilter}
            disabled={availableColumns.length === 0}
          >
            <Plus className="h-4 w-4 mr-2" />
            Add Filter
          </Button>
        </div>
      </CardHeader>
      <CardContent className="pt-0 h-full overflow-auto">
        <div className="space-y-4">
          {editingFilters.length === 0 ? (
            <div className="text-center py-8 text-gray-500">
              <Filter className="h-8 w-8 mx-auto mb-2 text-gray-400" />
              <p className="text-sm">No filters applied</p>
              <p className="text-xs">Add filters to refine your data</p>
            </div>
          ) : (
            <AnimatePresence>
              {(editingFilters ?? []).map((filter, index) => (
                <motion.div
                  key={filter.id}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -10 }}
                  transition={{ duration: 0.2 }}
                  className="border rounded-lg p-4 space-y-3"
                >
                  <div className="flex items-center justify-between">
                    <h4 className="text-sm font-medium text-gray-700">
                      Filter {index + 1}
                    </h4>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handleRemoveFilter(index)}
                      className="h-8 w-8 p-0 text-red-600 hover:text-red-700 hover:bg-red-50"
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>

                  <div className="grid grid-cols-1 gap-3">
                    {/* Column Selection */}
                    <div>
                      <Label htmlFor={`column-${index}`} className="text-xs">
                        Column
                      </Label>
                      <Select
                        value={filter.columnId && filter.columnId > 0 ? filter.columnId.toString() : ''}
                        onValueChange={(value) => {
                          const column = availableColumns.find(col => col.id.toString() === value);
                          if (column) {
                            const newFilter = { ...filter };
                            newFilter.columnId = parseInt(value);
                            newFilter.columnName = column.name;
                            newFilter.columnType = column.type as ColumnType;
                            // Reset operator and value when column changes
                            newFilter.operator = 'equals';
                            newFilter.value = null;
                            newFilter.secondValue = null;
                            
                            const newFilters = [...editingFilters];
                            newFilters[index] = newFilter;
                            setEditingFilters(newFilters);
                            onFiltersChange(newFilters);
                          }
                        }}
                      >
                        <SelectTrigger className="h-8">
                          <SelectValue placeholder="Select column" />
                        </SelectTrigger>
                        <SelectContent>
                          {(availableColumns ?? []).map((column) => (
                            <SelectItem key={column.id} value={column.id.toString()}>
                              <div className="flex items-center space-x-2">
                                <span>{column.name}</span>
                                <span className="text-xs text-gray-500">({column.type})</span>
                              </div>
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>

                    {/* Operator Selection */}
                    <div>
                      <Label htmlFor={`operator-${index}`} className="text-xs">
                        Operator
                      </Label>
                      <Select
                        value={filter.operator}
                        onValueChange={(value) => handleFilterChange(index, 'operator', value)}
                      >
                        <SelectTrigger className="h-8">
                          <SelectValue placeholder="Select operator" />
                        </SelectTrigger>
                        <SelectContent>
                          {(OPERATORS ?? []).map((op) => (
                            <SelectItem key={op.value} value={op.value}>
                              {op.label}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>

                    {/* Value Input */}
                    {isValueRequired(filter.operator) && (
                      <div>
                        <Label htmlFor={`value-${index}`} className="text-xs">
                          Value
                        </Label>
                        <Input
                          id={`value-${index}`}
                          type={getValueInputType(filter.operator, filter.columnType)}
                          value={String(filter.value || '')}
                          onChange={(e) => handleFilterChange(index, 'value', e.target.value)}
                          placeholder="Enter value"
                          className="h-8"
                        />
                      </div>
                    )}

                    {/* Second Value Input for range operators */}
                    {needsSecondValue(filter.operator) && (
                      <div>
                        <Label htmlFor={`secondValue-${index}`} className="text-xs">
                          To Value
                        </Label>
                        <Input
                          id={`secondValue-${index}`}
                          type={getValueInputType(filter.operator, filter.columnType)}
                          value={String(filter.secondValue || '')}
                          onChange={(e) => handleFilterChange(index, 'secondValue', e.target.value)}
                          placeholder="Enter second value"
                          className="h-8"
                        />
                      </div>
                    )}

                    {/* Operator Info */}
                    {!isValueRequired(filter.operator) && (
                      <div className="text-xs text-gray-500 bg-gray-50 p-2 rounded">
                        This operator doesn't require a value
                      </div>
                    )}
                  </div>
                </motion.div>
              ))}
            </AnimatePresence>
          )}

          {/* Summary */}
          {editingFilters.length > 0 && (
            <div className="text-xs text-gray-500 space-y-1 pt-2 border-t">
              <p>Active filters: {editingFilters.length}</p>
              <p>Available columns: {availableColumns.length}</p>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
