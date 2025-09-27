"use client";

import React, { useState } from "react";
import { z } from "zod";
import { kpiWidgetConfigSchema } from "@/widgets/schemas/kpi";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Checkbox } from "@/components/ui/checkbox";
import { Plus, X } from "lucide-react";
import { DatabaseSelector } from "../components/DatabaseSelector";
import { Column } from "../components/types";

interface KPIWidgetEditorProps {
  value: z.infer<typeof kpiWidgetConfigSchema>;
  onChange: (value: z.infer<typeof kpiWidgetConfigSchema>) => void;
  tenantId: number;
}

export const KPIWidgetEditor: React.FC<KPIWidgetEditorProps> = ({ value, onChange, tenantId }) => {
  const [activeTab, setActiveTab] = useState("settings");
  const [availableColumns, setAvailableColumns] = useState<Column[]>([]);

  const updateSettings = (updates: Partial<typeof value.settings>) => {
    onChange({
      ...value,
      settings: { ...value.settings, ...updates },
    });
  };

  const updateStyle = (updates: Partial<typeof value.style>) => {
    onChange({
      ...value,
      style: { ...value.style, ...updates },
    });
  };

  const updateData = (updates: Partial<typeof value.data>) => {
    onChange({
      ...value,
      data: { ...value.data, ...updates },
    });
  };

  const updateRefresh = (updates: Partial<typeof value.refresh>) => {
    onChange({
      ...value,
      refresh: { 
        enabled: false, 
        interval: 30000, 
        ...value.refresh, 
        ...updates 
      },
    });
  };

  const addFilter = () => {
    const newFilters = [...value.data.filters, { column: "", operator: "=" as const, value: "" }];
    updateData({ filters: newFilters });
  };

  const updateFilter = (index: number, updates: Partial<typeof value.data.filters[0]>) => {
    const newFilters = [...value.data.filters];
    newFilters[index] = { ...newFilters[index], ...updates };
    updateData({ filters: newFilters });
  };

  const removeFilter = (index: number) => {
    const newFilters = value.data.filters.filter((_, i) => i !== index);
    updateData({ filters: newFilters });
  };

  return (
    <div className="space-y-4">
      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="settings">Settings</TabsTrigger>
          <TabsTrigger value="style">Style</TabsTrigger>
          <TabsTrigger value="data">Data</TabsTrigger>
          <TabsTrigger value="refresh">Refresh</TabsTrigger>
        </TabsList>

        {/* Settings Tab */}
        <TabsContent value="settings" className="space-y-4">
          <div className="space-y-3">
            <div>
              <Label htmlFor="label" className="text-xs font-medium uppercase tracking-wide">
                KPI Label
              </Label>
              <Input
                id="label"
                value={value.settings.label}
                onChange={(e) => updateSettings({ label: e.target.value })}
                placeholder="Enter KPI label"
                className="mt-1"
              />
            </div>


            <div>
              <Label htmlFor="format" className="text-xs font-medium uppercase tracking-wide">
                Value Format
              </Label>
              <Select
                value={value.settings.format}
                onValueChange={(val) => updateSettings({ format: val as typeof value.settings.format })}
              >
                <SelectTrigger className="mt-1">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="number">Number</SelectItem>
                  <SelectItem value="currency">Currency</SelectItem>
                  <SelectItem value="percentage">Percentage</SelectItem>
                  <SelectItem value="duration">Duration</SelectItem>
                </SelectContent>
              </Select>
            </div>


            <div className="flex items-center justify-between">
              <Label htmlFor="showTrend" className="text-xs font-medium uppercase tracking-wide">
                Show Trend
              </Label>
              <Switch
                id="showTrend"
                checked={value.settings.showTrend}
                onCheckedChange={(checked) => updateSettings({ showTrend: checked })}
              />
            </div>

            <div className="flex items-center justify-between">
              <Label htmlFor="showComparison" className="text-xs font-medium uppercase tracking-wide">
                Show Comparison
              </Label>
              <Switch
                id="showComparison"
                checked={value.settings.showComparison}
                onCheckedChange={(checked) => updateSettings({ showComparison: checked })}
              />
            </div>

            {value.settings.showComparison && (
              <div>
                <Label htmlFor="comparisonField" className="text-xs font-medium uppercase tracking-wide">
                  Comparison Field
                </Label>
                <Select
                  value={value.settings.comparisonField || ""}
                  onValueChange={(val) => updateSettings({ comparisonField: val || undefined })}
                >
                  <SelectTrigger className="mt-1">
                    <SelectValue placeholder="Select comparison field" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="none">None</SelectItem>
                    {availableColumns
                      .filter(col => ["number"].includes(col.type))
                      .map((column) => (
                        <SelectItem key={column.id} value={column.name}>
                          {column.name} ({column.type})
                        </SelectItem>
                      ))}
                  </SelectContent>
                </Select>
              </div>
            )}
          </div>
        </TabsContent>

        {/* Style Tab */}
        <TabsContent value="style" className="space-y-4">
          <div className="space-y-3">
            <div>
              <Label htmlFor="theme" className="text-xs font-medium uppercase tracking-wide">
                Theme
              </Label>
              <Select
                value={value.style.theme}
                onValueChange={(val) => updateStyle({ theme: val as typeof value.style.theme })}
              >
                <SelectTrigger className="mt-1">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="premium-light">Premium Light</SelectItem>
                  <SelectItem value="premium-dark">Premium Dark</SelectItem>
                  <SelectItem value="auto">Auto</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div>
              <Label htmlFor="size" className="text-xs font-medium uppercase tracking-wide">
                Size
              </Label>
              <Select
                value={value.style.size}
                onValueChange={(val) => updateStyle({ size: val as typeof value.style.size })}
              >
                <SelectTrigger className="mt-1">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="small">Small</SelectItem>
                  <SelectItem value="medium">Medium</SelectItem>
                  <SelectItem value="large">Large</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div>
              <Label htmlFor="alignment" className="text-xs font-medium uppercase tracking-wide">
                Alignment
              </Label>
              <Select
                value={value.style.alignment}
                onValueChange={(val) => updateStyle({ alignment: val as typeof value.style.alignment })}
              >
                <SelectTrigger className="mt-1">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="left">Left</SelectItem>
                  <SelectItem value="center">Center</SelectItem>
                  <SelectItem value="right">Right</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div>
              <Label htmlFor="backgroundColor" className="text-xs font-medium uppercase tracking-wide">
                Background Color
              </Label>
              <Input
                id="backgroundColor"
                type="color"
                value={value.style.backgroundColor || "#ffffff"}
                onChange={(e) => updateStyle({ backgroundColor: e.target.value })}
                className="mt-1 h-10"
              />
            </div>

            <div>
              <Label htmlFor="valueColor" className="text-xs font-medium uppercase tracking-wide">
                Value Color
              </Label>
              <Input
                id="valueColor"
                type="color"
                value={value.style.valueColor || "#000000"}
                onChange={(e) => updateStyle({ valueColor: e.target.value })}
                className="mt-1 h-10"
              />
            </div>

            <div>
              <Label htmlFor="labelColor" className="text-xs font-medium uppercase tracking-wide">
                Label Color
              </Label>
              <Input
                id="labelColor"
                type="color"
                value={value.style.labelColor || "#666666"}
                onChange={(e) => updateStyle({ labelColor: e.target.value })}
                className="mt-1 h-10"
              />
            </div>

            <div>
              <Label htmlFor="trendColor" className="text-xs font-medium uppercase tracking-wide">
                Trend Color
              </Label>
              <Input
                id="trendColor"
                type="color"
                value={value.style.trendColor || "#22c55e"}
                onChange={(e) => updateStyle({ trendColor: e.target.value })}
                className="mt-1 h-10"
              />
            </div>
          </div>
        </TabsContent>

        {/* Data Tab */}
        <TabsContent value="data" className="space-y-4">
          <div className="space-y-3">
            {/* Database and Table Selection */}
            <DatabaseSelector
              tenantId={tenantId}
              selectedDatabaseId={value.data.databaseId}
              selectedTableId={Number(value.data.tableId)}
              onDatabaseChange={(databaseId) => updateData({ databaseId, tableId: "", filters: [] })}
              onTableChange={(tableId) => updateData({ tableId: tableId.toString(), filters: [] })}
              onColumnsChange={setAvailableColumns}
            />

            {/* Column Selection */}
            <div>
              <Label htmlFor="valueField" className="text-xs font-medium uppercase tracking-wide">
                Numeric Column
              </Label>
              <Select
                value={value.settings.valueField}
                onValueChange={(val) => updateSettings({ valueField: val })}
              >
                <SelectTrigger className="mt-1">
                  <SelectValue placeholder="Select numeric column" />
                </SelectTrigger>
                <SelectContent>
                  {availableColumns
                    .filter(col => ["number"].includes(col.type))
                    .map((column) => (
                      <SelectItem key={column.id} value={column.name}>
                        {column.name} ({column.type})
                      </SelectItem>
                    ))}
                </SelectContent>
              </Select>
              {availableColumns.filter(col => ["number"].includes(col.type)).length === 0 && (
                <p className="text-xs text-muted-foreground mt-1">
                  No numeric columns available. Please select a table first.
                </p>
              )}
            </div>

            {/* Aggregate Functions Selection */}
            <div>
              <Label className="text-xs font-medium uppercase tracking-wide">
                Aggregate Functions
              </Label>
              <div className="mt-2 space-y-2">
                {(["sum", "avg", "count", "min", "max"] as const).map((aggregation) => (
                  <div key={aggregation} className="flex items-center space-x-2">
                    <Checkbox
                      id={aggregation}
                      checked={value.settings.selectedAggregations?.includes(aggregation) || false}
                      onCheckedChange={(checked) => {
                        const current = value.settings.selectedAggregations || [];
                        const updated = checked
                          ? [...current, aggregation]
                          : current.filter(a => a !== aggregation);
                        updateSettings({ 
                          selectedAggregations: updated,
                          // Keep backward compatibility
                          aggregation: updated.length > 0 ? updated[0] : "sum"
                        });
                      }}
                    />
                    <Label htmlFor={aggregation} className="text-sm font-normal capitalize">
                      {aggregation === "avg" ? "Average" : 
                       aggregation === "count" ? "Count" :
                       aggregation === "min" ? "Minimum" :
                       aggregation === "max" ? "Maximum" :
                       aggregation === "sum" ? "Sum" : aggregation}
                    </Label>
                  </div>
                ))}
              </div>
              {(!value.settings.selectedAggregations || value.settings.selectedAggregations.length === 0) && (
                <p className="text-xs text-amber-600 mt-1">
                  Please select at least one aggregate function.
                </p>
              )}
            </div>

            {/* Filters */}
            {availableColumns.length > 0 && (
              <div>
                <div className="flex items-center justify-between">
                  <Label className="text-xs font-medium uppercase tracking-wide">Filters</Label>
                  <Button size="sm" variant="outline" onClick={addFilter} className="h-6 px-2">
                    <Plus className="h-3 w-3 mr-1" />
                    Add Filter
                  </Button>
                </div>
                <div className="mt-2 space-y-2">
                  {value.data.filters.map((filter, index) => {
                    const selectedColumn = availableColumns.find(col => col.name === filter.column);
                    const columnType = selectedColumn?.type || 'text';
                    
                    // Get operators based on column type
                    const getOperatorsForType = (type: string) => {
                      switch (type) {
                        case 'number':
                        case 'integer':
                        case 'decimal':
                          return [
                            { value: '=', label: '=' },
                            { value: '!=', label: '!=' },
                            { value: '>', label: '>' },
                            { value: '<', label: '<' },
                            { value: '>=', label: '>=' },
                            { value: '<=', label: '<=' },
                            { value: 'contains', label: 'contains' }
                          ];
                        case 'date':
                        case 'datetime':
                          return [
                            { value: '=', label: '=' },
                            { value: '!=', label: '!=' },
                            { value: '>', label: 'after' },
                            { value: '<', label: 'before' },
                            { value: '>=', label: 'after or equal' },
                            { value: '<=', label: 'before or equal' }
                          ];
                        case 'boolean':
                          return [
                            { value: '=', label: '=' },
                            { value: '!=', label: '!=' }
                          ];
                        default: // text, string, etc.
                          return [
                            { value: '=', label: '=' },
                            { value: '!=', label: '!=' },
                            { value: 'contains', label: 'contains' },
                            { value: 'startsWith', label: 'starts with' },
                            { value: 'endsWith', label: 'ends with' }
                          ];
                      }
                    };

                    const availableOperators = getOperatorsForType(columnType);

                    return (
                      <div key={index} className="flex items-center space-x-2 p-2 border rounded">
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
                          onValueChange={(val) => updateFilter(index, { operator: val as any })}
                        >
                          <SelectTrigger className="w-32">
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
                        {columnType === 'boolean' ? (
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
                        ) : columnType === 'date' ? (
                          <Input
                            type="date"
                            value={String(filter.value)}
                            onChange={(e) => updateFilter(index, { value: e.target.value })}
                            placeholder="Value"
                            className="flex-1"
                          />
                        ) : ['number', 'integer', 'decimal'].includes(columnType) ? (
                          <Input
                            type="number"
                            value={String(filter.value)}
                            onChange={(e) => updateFilter(index, { value: parseFloat(e.target.value) || 0 })}
                            placeholder="Value"
                            className="flex-1"
                          />
                        ) : (
                          <Input
                            value={String(filter.value)}
                            onChange={(e) => updateFilter(index, { value: e.target.value })}
                            placeholder="Value"
                            className="flex-1"
                          />
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
                </div>
              </div>
            )}
          </div>
        </TabsContent>

        {/* Refresh Tab */}
        <TabsContent value="refresh" className="space-y-4">
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <Label htmlFor="refreshEnabled" className="text-xs font-medium uppercase tracking-wide">
                Auto Refresh
              </Label>
              <Switch
                id="refreshEnabled"
                checked={value.refresh?.enabled || false}
                onCheckedChange={(checked) => updateRefresh({ enabled: checked })}
              />
            </div>
            
            {value.refresh?.enabled && (
              <div>
                <Label htmlFor="refreshInterval" className="text-xs font-medium uppercase tracking-wide">
                  Refresh Interval (seconds)
                </Label>
                <Input
                  id="refreshInterval"
                  type="number"
                  min="10"
                  max="3600"
                  value={value.refresh?.interval ? Math.floor(value.refresh.interval / 1000) : 30}
                  onChange={(e) => updateRefresh({ interval: parseInt(e.target.value) * 1000 })}
                  placeholder="30"
                  className="mt-1"
                />
                <p className="text-xs text-muted-foreground mt-1">
                  Data will refresh automatically every {Math.floor((value.refresh?.interval || 30000) / 1000)} seconds
                </p>
              </div>
            )}
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
};
