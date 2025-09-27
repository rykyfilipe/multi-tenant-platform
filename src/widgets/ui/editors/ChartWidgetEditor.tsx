"use client";

import React, { useState } from "react";
import { z } from "zod";
import { chartWidgetConfigSchema } from "@/widgets/schemas/chart";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Plus, X } from "lucide-react";
import { DatabaseSelector } from "../components/DatabaseSelector";
import { Column } from "../components/types";

interface ChartWidgetEditorProps {
  value: z.infer<typeof chartWidgetConfigSchema>;
  onChange: (value: z.infer<typeof chartWidgetConfigSchema>) => void;
  tenantId: number;
}

export const ChartWidgetEditor: React.FC<ChartWidgetEditorProps> = ({ value, onChange, tenantId }) => {
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

  const updateMapping = (key: string, mappingValue: string) => {
    const newMappings = { ...value.data.mappings };
    if (mappingValue) {
      newMappings[key as keyof typeof newMappings] = mappingValue;
    } else {
      delete newMappings[key as keyof typeof newMappings];
    }
    updateData({ mappings: newMappings });
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
              <Label htmlFor="chartType" className="text-xs font-medium uppercase tracking-wide">
                Chart Type
              </Label>
              <Select
          value={value.settings.chartType}
                onValueChange={(val) => updateSettings({ chartType: val as typeof value.settings.chartType })}
              >
                <SelectTrigger className="mt-1">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="line">Line Chart</SelectItem>
                  <SelectItem value="bar">Bar Chart</SelectItem>
                  <SelectItem value="area">Area Chart</SelectItem>
                  <SelectItem value="pie">Pie Chart</SelectItem>
                  <SelectItem value="radar">Radar Chart</SelectItem>
                  <SelectItem value="scatter">Scatter Plot</SelectItem>
                </SelectContent>
              </Select>
            </div>


            <div>
              <Label htmlFor="valueFormat" className="text-xs font-medium uppercase tracking-wide">
                Value Format
              </Label>
              <Select
                value={value.settings.valueFormat}
                onValueChange={(val) => updateSettings({ valueFormat: val as typeof value.settings.valueFormat })}
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

      <div>
              <Label htmlFor="refreshInterval" className="text-xs font-medium uppercase tracking-wide">
                Refresh Interval (seconds)
              </Label>
              <Input
                id="refreshInterval"
          type="number"
                min="1"
                max="3600"
          value={value.settings.refreshInterval}
                onChange={(e) => updateSettings({ refreshInterval: Number(e.target.value) })}
                className="mt-1"
              />
            </div>
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
              <Label htmlFor="backgroundColor" className="text-xs font-medium uppercase tracking-wide">
                Background Color
              </Label>
              <Input
                id="backgroundColor"
                type="color"
                value={value.style.backgroundColor}
                onChange={(e) => updateStyle({ backgroundColor: e.target.value })}
                className="mt-1 h-10"
              />
            </div>

            <div>
              <Label htmlFor="textColor" className="text-xs font-medium uppercase tracking-wide">
                Text Color
              </Label>
              <Input
                id="textColor"
                type="color"
                value={value.style.textColor}
                onChange={(e) => updateStyle({ textColor: e.target.value })}
                className="mt-1 h-10"
              />
            </div>

            <div className="flex items-center justify-between">
              <Label htmlFor="showLegend" className="text-xs font-medium uppercase tracking-wide">
                Show Legend
              </Label>
              <Switch
                id="showLegend"
                checked={value.style.showLegend}
                onCheckedChange={(checked) => updateStyle({ showLegend: checked })}
              />
            </div>

            <div className="flex items-center justify-between">
              <Label htmlFor="showGrid" className="text-xs font-medium uppercase tracking-wide">
                Show Grid
              </Label>
              <Switch
                id="showGrid"
                checked={value.style.showGrid}
                onCheckedChange={(checked) => updateStyle({ showGrid: checked })}
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
              onDatabaseChange={(databaseId) => updateData({ databaseId, tableId: "", mappings: {} })}
              onTableChange={(tableId) => updateData({ tableId: tableId.toString(), mappings: {} })}
              onColumnsChange={setAvailableColumns}
            />

            {/* Data Mappings - Dynamic based on available columns */}
            {availableColumns.length > 0 && (
              <div>
                <Label className="text-xs font-medium uppercase tracking-wide">Data Mappings</Label>
                <div className="mt-2 space-y-2">
                  {/* X Axis - Required for most chart types */}
                  <div className="flex items-center space-x-2">
                    <Label className="w-16 text-xs">X Axis:</Label>
                    <Select
                      value={value.data.mappings.x || ""}
                      onValueChange={(val) => updateMapping("x", val)}
                    >
                      <SelectTrigger className="flex-1">
                        <SelectValue placeholder="Select X axis column" />
                      </SelectTrigger>
                      <SelectContent>
                        {availableColumns
                          .filter(col => ["string", "text", "date"].includes(col.type))
                          .map((column) => (
                            <SelectItem key={column.id} value={column.name}>
                              {column.name} ({column.type})
                            </SelectItem>
                          ))}
                      </SelectContent>
                    </Select>
                  </div>

                  {/* Y Axis - Multi-column for some chart types */}
                  <div className="flex items-center space-x-2">
                    <Label className="w-16 text-xs">Y Axis:</Label>
                    {["line", "area", "bar"].includes(value.settings.chartType) ? (
                      // Multi-select for line, area, bar charts
                      <Select
                        value={value.data.mappings.y || ""}
                        onValueChange={(val) => updateMapping("y", val)}
                      >
                        <SelectTrigger className="flex-1">
                          <SelectValue placeholder="Select Y axis column(s)" />
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
                    ) : (
                      // Single select for other chart types
                      <Select
                        value={value.data.mappings.y || ""}
                        onValueChange={(val) => updateMapping("y", val)}
                      >
                        <SelectTrigger className="flex-1">
                          <SelectValue placeholder="Select Y axis column" />
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
                    )}
                  </div>

                  {/* Group - For grouped charts */}
                  {["bar", "line", "area"].includes(value.settings.chartType) && (
                    <div className="flex items-center space-x-2">
                      <Label className="w-16 text-xs">Group:</Label>
                      <Select
                        value={value.data.mappings.group || ""}
                        onValueChange={(val) => updateMapping("group", val)}
                      >
                        <SelectTrigger className="flex-1">
                          <SelectValue placeholder="Select group column (optional)" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="none">None</SelectItem>
                          {availableColumns
                            .filter(col => ["string", "text"].includes(col.type))
                            .map((column) => (
                              <SelectItem key={column.id} value={column.name}>
                                {column.name} ({column.type})
                              </SelectItem>
                            ))}
                        </SelectContent>
                      </Select>
                    </div>
                  )}

                  {/* Series - For multi-series charts */}
                  {["line", "bar", "area"].includes(value.settings.chartType) && (
                    <div className="flex items-center space-x-2">
                      <Label className="w-16 text-xs">Series:</Label>
                      <Select
                        value={value.data.mappings.series || ""}
                        onValueChange={(val) => updateMapping("series", val)}
                      >
                        <SelectTrigger className="flex-1">
                          <SelectValue placeholder="Select series column (optional)" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="none">None</SelectItem>
                          {availableColumns
                            .filter(col => ["string", "text"].includes(col.type))
                            .map((column) => (
                              <SelectItem key={column.id} value={column.name}>
                                {column.name} ({column.type})
                              </SelectItem>
                            ))}
                        </SelectContent>
                      </Select>
                    </div>
                  )}

                  {/* Color - For charts with color mapping */}
                  <div className="flex items-center space-x-2">
                    <Label className="w-16 text-xs">Color:</Label>
                    <Select
                      value={value.data.mappings.color || ""}
                      onValueChange={(val) => updateMapping("color", val)}
                    >
                      <SelectTrigger className="flex-1">
                        <SelectValue placeholder="Select color column (optional)" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="none">None</SelectItem>
                        {availableColumns
                          .filter(col => ["string", "text"].includes(col.type))
                          .map((column) => (
                            <SelectItem key={column.id} value={column.name}>
                              {column.name} ({column.type})
                            </SelectItem>
                          ))}
                      </SelectContent>
                    </Select>
                  </div>
                </div>
              </div>
            )}

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
