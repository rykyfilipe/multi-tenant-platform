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
import { Checkbox } from "@/components/ui/checkbox";
import { Plus, X, TrendingUp, Group, Filter } from "lucide-react";
import { DatabaseSelector } from "../components/DatabaseSelector";
import { Column } from "../components/types";
import { WidgetFilters } from "../components/WidgetFilters";

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

  const handleFiltersChange = (filters: any[]) => {
    updateData({ filters });
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
        <TabsList className="grid w-full grid-cols-6">
          <TabsTrigger value="settings">Settings</TabsTrigger>
          <TabsTrigger value="style">Style</TabsTrigger>
          <TabsTrigger value="data">Data</TabsTrigger>
          <TabsTrigger value="aggregation">
            <TrendingUp className="h-3 w-3 mr-1" />
            Aggregation
          </TabsTrigger>
          <TabsTrigger value="grouping">
            <Group className="h-3 w-3 mr-1" />
            Grouping
          </TabsTrigger>
          <TabsTrigger value="topn">
            <Filter className="h-3 w-3 mr-1" />
            Top N
          </TabsTrigger>
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

                </div>
              </div>
            )}

            {/* Filters */}
            {availableColumns.length > 0 && (
              <WidgetFilters
                filters={value.data.filters}
                availableColumns={availableColumns}
                onChange={handleFiltersChange}
              />
            )}
          </div>
        </TabsContent>

        {/* Aggregation Tab */}
        <TabsContent value="aggregation" className="space-y-4">
          <div className="space-y-4">
            <div className="p-3 bg-muted/50 rounded-md mb-4">
              <p className="text-xs text-muted-foreground">
                <strong>Data Aggregation:</strong> Apply mathematical functions to numeric columns to create a single aggregated data point. This creates one summary value for the entire dataset.
              </p>
              <p className="text-xs text-amber-600 mt-1">
                ⚠️ <strong>Note:</strong> Aggregation is mutually exclusive with Grouping. Enabling aggregation will disable grouping.
              </p>
            </div>
            
            <div className="flex items-center justify-between">
              <Label htmlFor="enableAggregation" className="text-xs font-medium uppercase tracking-wide">
                Enable Data Aggregation
              </Label>
              <Switch
                id="enableAggregation"
                checked={value.settings.enableAggregation || false}
                onCheckedChange={(checked) => {
                  if (checked && value.settings.enableGrouping) {
                    // Disable grouping when enabling aggregation
                    updateSettings({ 
                      enableAggregation: true, 
                      enableGrouping: false,
                      groupByColumn: undefined 
                    });
                  } else {
                    updateSettings({ enableAggregation: checked });
                  }
                }}
                disabled={value.settings.enableGrouping}
              />
            </div>

            {value.settings.enableGrouping && (
              <div className="p-3 bg-amber-50 border border-amber-200 rounded-md">
                <p className="text-xs text-amber-700">
                  <strong>Conflict:</strong> Grouping is currently enabled. Disable grouping first to use aggregation.
                </p>
              </div>
            )}

            {value.settings.enableAggregation && (
              <>
                <div>
                  <Label htmlFor="aggregationFunction" className="text-xs font-medium uppercase tracking-wide">
                    Aggregation Function
                  </Label>
                  <Select
                    value={value.settings.aggregationFunction || "sum"}
                    onValueChange={(val) => updateSettings({ aggregationFunction: val as any })}
                  >
                    <SelectTrigger className="mt-1">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="sum">Sum - Add all values</SelectItem>
                      <SelectItem value="avg">Average - Calculate mean</SelectItem>
                      <SelectItem value="count">Count - Count non-null values</SelectItem>
                      <SelectItem value="min">Minimum - Find smallest value</SelectItem>
                      <SelectItem value="max">Maximum - Find largest value</SelectItem>
                    </SelectContent>
                  </Select>
                  <p className="text-xs text-muted-foreground mt-1">
                    This function will be applied to each selected numeric column independently
                  </p>
                </div>

                <div>
                  <Label className="text-xs font-medium uppercase tracking-wide">
                    Numeric Columns to Aggregate
                  </Label>
                  <p className="text-xs text-muted-foreground mb-2">
                    Select one or more numeric columns. Each will be aggregated separately.
                  </p>
                  <div className="mt-2 space-y-2 max-h-40 overflow-y-auto border rounded-md p-2">
                    {availableColumns
                      .filter(col => ["number", "integer", "decimal", "float", "double"].includes(col.type))
                      .map((column) => {
                        const isSelected = value.settings.aggregationColumns?.includes(column.name) || false;
                        return (
                          <div key={column.id} className="flex items-center space-x-2">
                            <Checkbox
                              id={`agg-${column.name}`}
                              checked={isSelected}
                              onCheckedChange={(checked) => {
                                const current = value.settings.aggregationColumns || [];
                                const updated = checked
                                  ? [...current, column.name]
                                  : current.filter(c => c !== column.name);
                                updateSettings({ aggregationColumns: updated });
                              }}
                            />
                            <Label htmlFor={`agg-${column.name}`} className="text-sm">
                              {column.name} ({column.type})
                            </Label>
                          </div>
                        );
                      })}
                    {availableColumns.filter(col => ["number", "integer", "decimal", "float", "double"].includes(col.type)).length === 0 && (
                      <p className="text-xs text-muted-foreground italic">
                        No numeric columns available in the selected table
                      </p>
                    )}
                  </div>
                  {(!value.settings.aggregationColumns || value.settings.aggregationColumns.length === 0) && (
                    <p className="text-xs text-red-600 mt-1">
                      ⚠️ Please select at least one numeric column to aggregate.
                    </p>
                  )}
                  {value.settings.aggregationColumns && value.settings.aggregationColumns.length > 0 && (
                    <p className="text-xs text-green-600 mt-1">
                      ✅ {value.settings.aggregationColumns.length} column(s) selected for aggregation
                    </p>
                  )}
                </div>
              </>
            )}
          </div>
        </TabsContent>

        {/* Grouping Tab */}
        <TabsContent value="grouping" className="space-y-4">
          <div className="space-y-4">
            <div className="p-3 bg-muted/50 rounded-md mb-4">
              <p className="text-xs text-muted-foreground">
                <strong>Data Grouping:</strong> Group rows by categorical columns and aggregate numeric values within each group. Each unique group value becomes a separate data point in the chart.
              </p>
              <p className="text-xs text-amber-600 mt-1">
                ⚠️ <strong>Note:</strong> Grouping is mutually exclusive with Aggregation. Enabling grouping will disable aggregation.
              </p>
            </div>
            
            <div className="flex items-center justify-between">
              <Label htmlFor="enableGrouping" className="text-xs font-medium uppercase tracking-wide">
                Enable Data Grouping
              </Label>
              <Switch
                id="enableGrouping"
                checked={value.settings.enableGrouping || false}
                onCheckedChange={(checked) => {
                  if (checked && value.settings.enableAggregation) {
                    // Disable aggregation when enabling grouping
                    updateSettings({ 
                      enableGrouping: true, 
                      enableAggregation: false,
                      aggregationColumns: []
                    });
                  } else {
                    updateSettings({ enableGrouping: checked });
                  }
                }}
                disabled={value.settings.enableAggregation}
              />
            </div>

            {value.settings.enableAggregation && (
              <div className="p-3 bg-amber-50 border border-amber-200 rounded-md">
                <p className="text-xs text-amber-700">
                  <strong>Conflict:</strong> Aggregation is currently enabled. Disable aggregation first to use grouping.
                </p>
              </div>
            )}

            {value.settings.enableGrouping && (
              <>
                <div>
                  <Label htmlFor="groupByColumn" className="text-xs font-medium uppercase tracking-wide">
                    Group By Column
                  </Label>
                  <Select
                    value={value.settings.groupByColumn || ""}
                    onValueChange={(val) => updateSettings({ groupByColumn: val || undefined })}
                  >
                    <SelectTrigger className="mt-1">
                      <SelectValue placeholder="Select column to group by" />
                    </SelectTrigger>
                    <SelectContent>
                      {availableColumns
                        .filter(col => ["string", "text", "date", "datetime", "boolean"].includes(col.type))
                        .map((column) => (
                          <SelectItem key={column.id} value={column.name}>
                            {column.name} ({column.type})
                          </SelectItem>
                        ))}
                    </SelectContent>
                  </Select>
                  <p className="text-xs text-muted-foreground mt-1">
                    Rows will be grouped by unique values in this column. Each group becomes a data point in the chart.
                  </p>
                  {!value.settings.groupByColumn && (
                    <p className="text-xs text-red-600 mt-1">
                      ⚠️ Please select a column to group by.
                    </p>
                  )}
                  {value.settings.groupByColumn && (
                    <p className="text-xs text-green-600 mt-1">
                      ✅ Grouping by: {value.settings.groupByColumn}
                    </p>
                  )}
                </div>

                <div>
                  <Label htmlFor="groupingAggregationFunction" className="text-xs font-medium uppercase tracking-wide">
                    Aggregation Function for Groups
                  </Label>
                  <Select
                    value={value.settings.aggregationFunction || "sum"}
                    onValueChange={(val) => updateSettings({ aggregationFunction: val as any })}
                  >
                    <SelectTrigger className="mt-1">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="sum">Sum - Add all values in group</SelectItem>
                      <SelectItem value="avg">Average - Calculate mean in group</SelectItem>
                      <SelectItem value="count">Count - Count rows in group</SelectItem>
                      <SelectItem value="min">Minimum - Find smallest value in group</SelectItem>
                      <SelectItem value="max">Maximum - Find largest value in group</SelectItem>
                    </SelectContent>
                  </Select>
                  <p className="text-xs text-muted-foreground mt-1">
                    This function will be applied to numeric values within each group
                  </p>
                </div>

                <div>
                  <Label className="text-xs font-medium uppercase tracking-wide">
                    Numeric Columns to Aggregate in Groups
                  </Label>
                  <p className="text-xs text-muted-foreground mb-2">
                    Select one or more numeric columns. Each will be aggregated within each group separately.
                  </p>
                  <div className="mt-2 space-y-2 max-h-40 overflow-y-auto border rounded-md p-2">
                    {availableColumns
                      .filter(col => ["number", "integer", "decimal", "float", "double"].includes(col.type))
                      .map((column) => {
                        const isSelected = value.settings.aggregationColumns?.includes(column.name) || false;
                        return (
                          <div key={column.id} className="flex items-center space-x-2">
                            <Checkbox
                              id={`group-agg-${column.name}`}
                              checked={isSelected}
                              onCheckedChange={(checked) => {
                                const current = value.settings.aggregationColumns || [];
                                const updated = checked
                                  ? [...current, column.name]
                                  : current.filter(c => c !== column.name);
                                updateSettings({ aggregationColumns: updated });
                              }}
                            />
                            <Label htmlFor={`group-agg-${column.name}`} className="text-sm">
                              {column.name} ({column.type})
                            </Label>
                          </div>
                        );
                      })}
                    {availableColumns.filter(col => ["number", "integer", "decimal", "float", "double"].includes(col.type)).length === 0 && (
                      <p className="text-xs text-muted-foreground italic">
                        No numeric columns available in the selected table
                      </p>
                    )}
                  </div>
                  {(!value.settings.aggregationColumns || value.settings.aggregationColumns.length === 0) && (
                    <p className="text-xs text-red-600 mt-1">
                      ⚠️ Please select at least one numeric column to aggregate within groups.
                    </p>
                  )}
                  {value.settings.aggregationColumns && value.settings.aggregationColumns.length > 0 && (
                    <p className="text-xs text-green-600 mt-1">
                      ✅ {value.settings.aggregationColumns.length} column(s) selected for group aggregation
                    </p>
                  )}
                </div>
              </>
            )}
          </div>
        </TabsContent>

        {/* Top N Tab */}
        <TabsContent value="topn" className="space-y-4">
          <div className="space-y-4">
            <div className="p-3 bg-muted/50 rounded-md mb-4">
              <p className="text-xs text-muted-foreground">
                <strong>Top N Filtering:</strong> Show only the top or bottom N results based on a sortable column (e.g., top 10 best selling products, bottom 5 departments by performance)
              </p>
            </div>
            
            <div className="flex items-center justify-between">
              <Label htmlFor="enableTopN" className="text-xs font-medium uppercase tracking-wide">
                Enable Top N Filtering
              </Label>
              <Switch
                id="enableTopN"
                checked={value.settings.enableTopN || false}
                onCheckedChange={(checked) => updateSettings({ enableTopN: checked })}
              />
            </div>

            {value.settings.enableTopN && (
              <>
                <div>
                  <Label htmlFor="topNCount" className="text-xs font-medium uppercase tracking-wide">
                    Number of Results to Show
                  </Label>
                  <Input
                    id="topNCount"
                    type="number"
                    min="1"
                    max="100"
                    value={value.settings.topNCount || 10}
                    onChange={(e) => updateSettings({ topNCount: parseInt(e.target.value) || 10 })}
                    className="mt-1"
                    placeholder="10"
                  />
                  <p className="text-xs text-muted-foreground mt-1">
                    Maximum number of data points to display in the chart
                  </p>
                </div>

                <div>
                  <Label htmlFor="sortByColumn" className="text-xs font-medium uppercase tracking-wide">
                    Sort By Column
                  </Label>
                  <Select
                    value={value.settings.sortByColumn || ""}
                    onValueChange={(val) => updateSettings({ sortByColumn: val || undefined })}
                  >
                    <SelectTrigger className="mt-1">
                      <SelectValue placeholder="Select column to sort by" />
                    </SelectTrigger>
                    <SelectContent>
                      {availableColumns.map((column) => (
                        <SelectItem key={column.id} value={column.name}>
                          {column.name} ({column.type})
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <p className="text-xs text-muted-foreground mt-1">
                    Column used to determine the ranking order
                  </p>
                </div>

                <div>
                  <Label htmlFor="sortDirection" className="text-xs font-medium uppercase tracking-wide">
                    Sort Direction
                  </Label>
                  <Select
                    value={value.settings.sortDirection || "desc"}
                    onValueChange={(val) => updateSettings({ sortDirection: val as "asc" | "desc" })}
                  >
                    <SelectTrigger className="mt-1">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="desc">Descending (Highest Values First)</SelectItem>
                      <SelectItem value="asc">Ascending (Lowest Values First)</SelectItem>
                    </SelectContent>
                  </Select>
                  <p className="text-xs text-muted-foreground mt-1">
                    Choose whether to show the highest or lowest values
                  </p>
                </div>
              </>
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
