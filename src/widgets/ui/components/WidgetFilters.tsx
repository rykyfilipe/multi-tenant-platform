"use client";

import React, { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Plus, X, Save, Trash2 } from "lucide-react";
import { Column } from "./types";
import { ColumnType, FilterOperator, OPERATOR_COMPATIBILITY } from "@/types/filtering";

interface WidgetFilter {
  id?: string;
  column?: string;
  operator?: string;
  value?: any;
  secondValue?: any;
}

interface WidgetFiltersProps {
  filters: WidgetFilter[];
  availableColumns: Column[];
  onChange: (filters: WidgetFilter[]) => void;
}

export const WidgetFilters: React.FC<WidgetFiltersProps> = ({
  filters,
  availableColumns,
  onChange
}) => {
  // Ensure all filters have IDs
  const normalizedFilters = filters.map((filter, index) => ({
    ...filter,
    id: filter.id || `filter-${index}-${Date.now()}`
  }));
  
  const [pendingFilters, setPendingFilters] = useState<WidgetFilter[]>(normalizedFilters);
  const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false);

  // Get operators based on column type using backend operators
  const getOperatorsForType = (type: string): { value: FilterOperator; label: string }[] => {
    const columnType = type as ColumnType;
    const operators = OPERATOR_COMPATIBILITY[columnType] || [];
    
    const operatorLabels: Record<FilterOperator, string> = {
      // Text operators
      contains: "Contains",
      not_contains: "Does not contain",
      equals: "Equals",
      not_equals: "Does not equal",
      starts_with: "Starts with",
      ends_with: "Ends with",
      regex: "Matches regex",
      is_empty: "Is empty",
      is_not_empty: "Is not empty",
      
      // Number operators
      greater_than: "Greater than",
      greater_than_or_equal: "Greater than or equal",
      less_than: "Less than",
      less_than_or_equal: "Less than or equal",
      between: "Between",
      not_between: "Not between",
      
      // Date operators
      before: "Before",
      after: "After",
      today: "Today",
      yesterday: "Yesterday",
      this_week: "This week",
      last_week: "Last week",
      this_month: "This month",
      last_month: "Last month",
      this_year: "This year",
      last_year: "Last year",
    };

    return operators.map(op => ({
      value: op,
      label: operatorLabels[op] || op.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase())
    }));
  };

  // Check if operator requires value input
  const operatorRequiresValue = (operator: string): boolean => {
    return !['is_empty', 'is_not_empty', 'today', 'yesterday', 'this_week', 'last_week', 'this_month', 'last_month', 'this_year', 'last_year'].includes(operator);
  };

  // Check if operator requires second value (for between operations)
  const operatorRequiresSecondValue = (operator: string): boolean => {
    return ['between', 'not_between'].includes(operator);
  };

  const addFilter = () => {
    const newFilter: WidgetFilter = {
      id: `filter-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      column: "",
      operator: "",
      value: "",
      secondValue: ""
    };
    
    const updated = [...pendingFilters, newFilter];
    setPendingFilters(updated);
    setHasUnsavedChanges(true);
  };

  const updateFilter = (index: number, updates: Partial<WidgetFilter>) => {
    const updated = [...pendingFilters];
    updated[index] = { ...updated[index], ...updates };
    
    // If column changed, reset operator and value
    if (updates.column) {
      const column = availableColumns.find(col => col.name === updates.column);
      if (column) {
        const operators = getOperatorsForType(column.type);
        updated[index].operator = operators[0]?.value || "";
        updated[index].value = operatorRequiresValue(updated[index].operator) ? "" : undefined;
        updated[index].secondValue = operatorRequiresSecondValue(updated[index].operator) ? "" : undefined;
      }
    }
    
    // If operator changed, reset value if needed
    if (updates.operator) {
      updated[index].value = operatorRequiresValue(updates.operator) ? "" : undefined;
      updated[index].secondValue = operatorRequiresSecondValue(updates.operator) ? "" : undefined;
    }
    
    setPendingFilters(updated);
    setHasUnsavedChanges(true);
  };

  const removeFilter = (index: number) => {
    const updated = pendingFilters.filter((_, i) => i !== index);
    setPendingFilters(updated);
    setHasUnsavedChanges(true);
  };

  const saveFilters = () => {
    // Validate filters before saving
    const validFilters = pendingFilters.filter(filter => 
      filter.column && filter.operator && 
      (!operatorRequiresValue(filter.operator || "") || filter.value !== undefined)
    );
    
    onChange(validFilters);
    setHasUnsavedChanges(false);
  };

  const resetFilters = () => {
    setPendingFilters(filters);
    setHasUnsavedChanges(false);
  };

  const clearAllFilters = () => {
    setPendingFilters([]);
    setHasUnsavedChanges(true);
  };

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <Label className="text-xs font-medium uppercase tracking-wide">Filters</Label>
        <div className="flex items-center space-x-2">
          <Button size="sm" variant="outline" onClick={addFilter} className="h-6 px-2">
            <Plus className="h-3 w-3 mr-1" />
            Add Filter
          </Button>
          {pendingFilters.length > 0 && (
            <Button size="sm" variant="ghost" onClick={clearAllFilters} className="h-6 px-2 text-red-500 hover:text-red-700">
              <Trash2 className="h-3 w-3 mr-1" />
              Clear All
            </Button>
          )}
        </div>
      </div>

      {pendingFilters.length > 0 && (
        <div className="space-y-2">
          {pendingFilters.map((filter, index) => {
            const selectedColumn = availableColumns.find(col => col.name === filter.column);
            const columnType = selectedColumn?.type || 'text';
            const availableOperators = getOperatorsForType(columnType);
            
            return (
              <div key={filter.id} className="flex items-center space-x-2 p-2 border rounded">
                {/* Column Selection */}
                <Select
                  value={filter.column || ""}
                  onValueChange={(val) => updateFilter(index, { column: val })}
                >
                  <SelectTrigger className="w-32">
                    <SelectValue placeholder="Column" />
                  </SelectTrigger>
                  <SelectContent>
                    {availableColumns.map((column) => (
                      <SelectItem key={column.id} value={column.name}>
                        {column.name} ({column.type})
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>

                {/* Operator Selection */}
                <Select
                  value={filter.operator || ""}
                  onValueChange={(val) => updateFilter(index, { operator: val })}
                  disabled={!filter.column}
                >
                  <SelectTrigger className="w-40">
                    <SelectValue placeholder="Operator" />
                  </SelectTrigger>
                  <SelectContent>
                    {availableOperators.map((op) => (
                      <SelectItem key={op.value} value={op.value}>
                        {op.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>

                {/* Value Input */}
                {filter.column && filter.operator && (
                  <>
                    {!operatorRequiresValue(filter.operator) ? (
                      <div className="flex-1 text-sm text-muted-foreground p-2 bg-muted/20 rounded border">
                        No input required for this filter
                      </div>
                    ) : columnType === 'boolean' ? (
                      <Select
                        value={String(filter.value)}
                        onValueChange={(val) => updateFilter(index, { value: val === 'true' })}
                      >
                        <SelectTrigger className="flex-1">
                          <SelectValue placeholder="Value" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="true">True</SelectItem>
                          <SelectItem value="false">False</SelectItem>
                        </SelectContent>
                      </Select>
                    ) : operatorRequiresSecondValue(filter.operator) ? (
                      <div className="flex-1 flex space-x-1">
                        <Input
                          placeholder="Min"
                          value={String(filter.value || "")}
                          onChange={(e) => updateFilter(index, { value: e.target.value })}
                          className="flex-1"
                          type={['number', 'integer', 'decimal'].includes(columnType) ? 'number' : columnType === 'date' ? 'date' : 'text'}
                        />
                        <Input
                          placeholder="Max"
                          value={String(filter.secondValue || "")}
                          onChange={(e) => updateFilter(index, { secondValue: e.target.value })}
                          className="flex-1"
                          type={['number', 'integer', 'decimal'].includes(columnType) ? 'number' : columnType === 'date' ? 'date' : 'text'}
                        />
                      </div>
                    ) : (
                      <Input
                        value={String(filter.value || "")}
                        onChange={(e) => updateFilter(index, { value: e.target.value })}
                        placeholder="Value"
                        className="flex-1"
                        type={['number', 'integer', 'decimal'].includes(columnType) ? 'number' : columnType === 'date' ? 'date' : 'text'}
                      />
                    )}
                  </>
                )}

                {/* Remove Button */}
                <Button
                  size="sm"
                  variant="ghost"
                  onClick={() => removeFilter(index)}
                  className="h-6 w-6 p-0 text-red-500 hover:text-red-700"
                >
                  <X className="h-3 w-3" />
                </Button>
              </div>
            );
          })}

          {/* Save/Reset Buttons */}
          <div className="flex items-center justify-end space-x-2 pt-2 border-t">
            {hasUnsavedChanges && (
              <Button size="sm" variant="outline" onClick={resetFilters} className="h-6 px-2">
                Reset
              </Button>
            )}
            <Button 
              size="sm" 
              onClick={saveFilters} 
              className="h-6 px-2"
              disabled={!hasUnsavedChanges}
            >
              <Save className="h-3 w-3 mr-1" />
              {hasUnsavedChanges ? 'Save Filters' : 'Saved'}
            </Button>
          </div>
        </div>
      )}

      {pendingFilters.length === 0 && (
        <div className="text-center text-muted-foreground py-4">
          <p className="text-sm">No filters applied</p>
          <p className="text-xs">Click "Add Filter" to start filtering</p>
        </div>
      )}
    </div>
  );
};
