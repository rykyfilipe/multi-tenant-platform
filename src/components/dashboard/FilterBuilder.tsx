'use client';

import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Plus, Trash2, Filter } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Filter as FilterType } from './LineChartWidget';

interface ColumnMeta {
  id: number;
  name: string;
  type: string;
  required?: boolean;
  unique?: boolean;
}

interface FilterBuilderProps {
  filters: FilterType[];
  availableColumns: ColumnMeta[];
  onFiltersChange: (filters: FilterType[]) => void;
}

const OPERATORS = [
  { value: 'equals', label: 'Equals' },
  { value: 'not_equals', label: 'Not Equals' },
  { value: 'contains', label: 'Contains' },
  { value: 'not_contains', label: 'Not Contains' },
  { value: 'greater_than', label: 'Greater Than' },
  { value: 'less_than', label: 'Less Than' },
  { value: 'is_empty', label: 'Is Empty' },
  { value: 'is_not_empty', label: 'Is Not Empty' },
];

export function FilterBuilder({ filters, availableColumns, onFiltersChange }: FilterBuilderProps) {
  const [editingFilters, setEditingFilters] = useState<FilterType[]>(filters);

  useEffect(() => {
    setEditingFilters(filters);
  }, [filters]);

  const handleFilterChange = (index: number, field: keyof FilterType, value: string | number) => {
    const newFilters = [...editingFilters];
    newFilters[index] = { ...newFilters[index], [field]: value };
    setEditingFilters(newFilters);
    onFiltersChange(newFilters);
  };

  const handleAddFilter = () => {
    const newFilter: FilterType = {
      id: `filter_${Date.now()}`,
      column: availableColumns[0]?.name || '',
      operator: 'equals',
      value: '',
    };
    const newFilters = [...editingFilters, newFilter];
    setEditingFilters(newFilters);
    onFiltersChange(newFilters);
  };

  const handleRemoveFilter = (index: number) => {
    const newFilters = editingFilters.filter((_, i) => i !== index);
    setEditingFilters(newFilters);
    onFiltersChange(newFilters);
  };

  const getValueInputType = (operator: string) => {
    if (['is_empty', 'is_not_empty'].includes(operator)) {
      return 'hidden';
    }
    if (['greater_than', 'less_than'].includes(operator)) {
      return 'number';
    }
    return 'text';
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
              {editingFilters.map((filter, index) => (
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
                        value={filter.column}
                        onValueChange={(value) => handleFilterChange(index, 'column', value)}
                      >
                        <SelectTrigger className="h-8">
                          <SelectValue placeholder="Select column" />
                        </SelectTrigger>
                        <SelectContent>
                          {availableColumns.map((column) => (
                            <SelectItem key={column.id} value={column.name}>
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
                          {OPERATORS.map((op) => (
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
                          type={getValueInputType(filter.operator)}
                          value={filter.value}
                          onChange={(e) => handleFilterChange(index, 'value', e.target.value)}
                          placeholder="Enter value"
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
