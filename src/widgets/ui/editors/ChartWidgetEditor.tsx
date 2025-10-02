"use client";

import React, { useState } from "react";
import { z } from "zod";
import { chartWidgetConfigSchema } from "@/widgets/schemas/chart";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Checkbox } from "@/components/ui/checkbox";
import { TrendingUp, Group, Filter } from "lucide-react";
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

  const handleFiltersChange = (filters: any[]) => {
    updateData({ filters });
  };

  const toggleYColumn = (columnName: string) => {
    const currentY = value.data.mappings?.y || [];
    const updated = currentY.includes(columnName)
      ? currentY.filter(c => c !== columnName)
      : [...currentY, columnName];
    updateData({ 
      mappings: { 
        ...value.data.mappings, 
        y: updated 
      } 
    });
  };

  return (
    <div className="space-y-4">
      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="settings">Settings</TabsTrigger>
          <TabsTrigger value="style">Style</TabsTrigger>
          <TabsTrigger value="data">Data</TabsTrigger>
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
          <div className="space-y-6">
            {/* Database and Table Selection */}
            <div>
              <h3 className="text-sm font-semibold text-foreground mb-3">Data Source</h3>
              <DatabaseSelector
                tenantId={tenantId}
                selectedDatabaseId={value.data.databaseId}
                selectedTableId={Number(value.data.tableId)}
                onDatabaseChange={(databaseId) => updateData({ databaseId, tableId: "", mappings: { y: [] } })}
                onTableChange={(tableId) => updateData({ tableId: tableId.toString(), mappings: { y: [] } })}
                onColumnsChange={setAvailableColumns}
              />
            </div>

            {/* Column Mappings */}
            {availableColumns.length > 0 && (
              <>
                <div>
                  <h3 className="text-sm font-semibold text-foreground mb-3">Column Mappings</h3>
                  <div className="space-y-3">
                    {/* X Axis */}
                    <div>
                      <Label className="text-xs font-medium uppercase tracking-wide">
                        X Axis (Category/Label)
                      </Label>
                      <Select
                        value={value.data.mappings?.x || ""}
                        onValueChange={(val) => updateData({ 
                          mappings: { ...value.data.mappings, x: val } 
                        })}
                      >
                        <SelectTrigger className="mt-1">
                          <SelectValue placeholder="Select X axis column" />
                        </SelectTrigger>
                        <SelectContent>
                          {availableColumns
                            .filter(col => ["string", "text", "date"].includes(col.type))
                            .map((column) => (
                              <SelectItem key={column.id} value={column.name}>
                                {column.name}
                              </SelectItem>
                            ))}
                        </SelectContent>
                      </Select>
                    </div>

                    {/* Y Axis - Multi-select */}
                    <div>
                      <Label className="text-xs font-medium uppercase tracking-wide">
                        Y Axis (Values) - Multi-select
                      </Label>
                      <div className="mt-2 space-y-2 max-h-40 overflow-y-auto border rounded-md p-2">
                        {availableColumns
                          .filter(col => ["number"].includes(col.type))
                          .map((column) => {
                            const isSelected = (value.data.mappings?.y || []).includes(column.name);
                            return (
                              <div key={column.id} className="flex items-center space-x-2">
                                <Checkbox
                                  id={`y-${column.name}`}
                                  checked={isSelected}
                                  onCheckedChange={() => toggleYColumn(column.name)}
                                />
                                <Label htmlFor={`y-${column.name}`} className="text-sm">
                                  {column.name}
                                </Label>
                              </div>
                            );
                          })}
                      </div>
                      {(!value.data.mappings?.y || value.data.mappings.y.length === 0) && (
                        <p className="text-xs text-amber-600 mt-1">
                          ⚠️ Please select at least one Y axis column.
                        </p>
                      )}
                      {value.data.mappings?.y && value.data.mappings.y.length > 0 && (
                        <p className="text-xs text-green-600 mt-1">
                          ✅ {value.data.mappings.y.length} column(s) selected
                        </p>
                      )}
                    </div>
                  </div>
                </div>

                {/* Filters Section */}
                <div>
                  <h3 className="text-sm font-semibold text-foreground mb-3">Data Filters</h3>
                  <WidgetFilters
                    filters={value.data.filters}
                    availableColumns={availableColumns}
                    onChange={handleFiltersChange}
                  />
                </div>

                {/* Processing Mode */}
                <div className="border-t pt-4">
                  <h3 className="text-sm font-semibold text-foreground mb-3">Data Processing</h3>
                  <div className="space-y-3">
                    <div>
                      <Label className="text-xs font-medium uppercase tracking-wide">
                        Processing Mode
                      </Label>
                      <Select
                        value={value.settings.processingMode || "raw"}
                        onValueChange={(val) => updateSettings({ 
                          processingMode: val as "raw" | "aggregated" | "grouped" 
                        })}
                      >
                        <SelectTrigger className="mt-1">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="raw">Raw Data (No Processing)</SelectItem>
                          <SelectItem value="aggregated">Aggregated (Summary)</SelectItem>
                          <SelectItem value="grouped">Grouped (Per Category)</SelectItem>
                        </SelectContent>
                      </Select>
                      <p className="text-xs text-muted-foreground mt-1">
                        {value.settings.processingMode === "raw" && "Display data as-is from the table"}
                        {value.settings.processingMode === "aggregated" && "Calculate single summary values (e.g., Total Sales)"}
                        {value.settings.processingMode === "grouped" && "Calculate values per group (e.g., Sales per Region)"}
                      </p>
                    </div>
                  </div>
                </div>

                {/* Aggregation Settings (for aggregated or grouped mode) */}
                {(value.settings.processingMode === "aggregated" || value.settings.processingMode === "grouped") && (
                  <div className="border-t pt-4">
                    <h3 className="text-sm font-semibold text-foreground mb-3 flex items-center gap-2">
                      <TrendingUp className="h-4 w-4" />
                      Aggregation
                    </h3>
                    <div className="space-y-3">
                      <div>
                        <Label className="text-xs font-medium uppercase tracking-wide">
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
                            <SelectItem value="sum">Sum</SelectItem>
                            <SelectItem value="avg">Average</SelectItem>
                            <SelectItem value="count">Count</SelectItem>
                            <SelectItem value="min">Minimum</SelectItem>
                            <SelectItem value="max">Maximum</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>

                      <div>
                        <Label className="text-xs font-medium uppercase tracking-wide">
                          Columns to Aggregate
                        </Label>
                        <div className="mt-2 space-y-2 max-h-32 overflow-y-auto border rounded-md p-2">
                          {availableColumns
                            .filter(col => ["number", "integer", "decimal", "float", "double"].includes(col.type))
                            .map((column) => (
                              <div key={column.id} className="flex items-center space-x-2">
                                <Checkbox
                                  id={`agg-${column.name}`}
                                  checked={value.settings.aggregationColumns?.includes(column.name) || false}
                                  onCheckedChange={(checked) => {
                                    const current = value.settings.aggregationColumns || [];
                                    const updated = checked
                                      ? [...current, column.name]
                                      : current.filter(c => c !== column.name);
                                    updateSettings({ aggregationColumns: updated });
                                  }}
                                />
                                <Label htmlFor={`agg-${column.name}`} className="text-sm">
                                  {column.name}
                                </Label>
                              </div>
                            ))}
                        </div>
                      </div>
                    </div>
                  </div>
                )}

                {/* Grouping Column (only for grouped mode) */}
                {value.settings.processingMode === "grouped" && (
                  <div className="border-t pt-4">
                    <h3 className="text-sm font-semibold text-foreground mb-3 flex items-center gap-2">
                      <Group className="h-4 w-4" />
                      Grouping
                    </h3>
                    <div className="space-y-3">
                      <div>
                        <Label className="text-xs font-medium uppercase tracking-wide">
                          Group By Column
                        </Label>
                        <Select
                          value={value.settings.groupByColumn || ""}
                          onValueChange={(val) => updateSettings({ groupByColumn: val || undefined })}
                        >
                          <SelectTrigger className="mt-1">
                            <SelectValue placeholder="Select column" />
                          </SelectTrigger>
                          <SelectContent>
                            {availableColumns
                              .filter(col => ["string", "text", "date", "datetime", "boolean"].includes(col.type))
                              .map((column) => (
                                <SelectItem key={column.id} value={column.name}>
                                  {column.name}
                                </SelectItem>
                              ))}
                          </SelectContent>
                        </Select>
                      </div>
                    </div>
                  </div>
                )}

                {/* Top N Section */}
                <div className="border-t pt-4">
                  <h3 className="text-sm font-semibold text-foreground mb-3 flex items-center gap-2">
                    <Filter className="h-4 w-4" />
                    Top N Filtering
                  </h3>
                  <div className="space-y-3">
                    <div className="flex items-center justify-between">
                      <Label htmlFor="enableTopN" className="text-xs font-medium uppercase tracking-wide">
                        Enable Top N
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
                            Number of Results
                          </Label>
                          <Input
                            id="topNCount"
                            type="number"
                            min="1"
                            max="100"
                            value={value.settings.topNCount || 10}
                            onChange={(e) => updateSettings({ topNCount: parseInt(e.target.value) || 10 })}
                            className="mt-1"
                          />
                        </div>

                        <div>
                          <Label htmlFor="sortByColumn" className="text-xs font-medium uppercase tracking-wide">
                            Sort By
                          </Label>
                          <Select
                            value={value.settings.sortByColumn || ""}
                            onValueChange={(val) => updateSettings({ sortByColumn: val || undefined })}
                          >
                            <SelectTrigger className="mt-1">
                              <SelectValue placeholder="Select column" />
                            </SelectTrigger>
                            <SelectContent>
                              {availableColumns.map((column) => (
                                <SelectItem key={column.id} value={column.name}>
                                  {column.name}
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        </div>

                        <div>
                          <Label htmlFor="sortDirection" className="text-xs font-medium uppercase tracking-wide">
                            Direction
                          </Label>
                          <Select
                            value={value.settings.sortDirection || "desc"}
                            onValueChange={(val) => updateSettings({ sortDirection: val as "asc" | "desc" })}
                          >
                            <SelectTrigger className="mt-1">
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="desc">Descending (Highest First)</SelectItem>
                              <SelectItem value="asc">Ascending (Lowest First)</SelectItem>
                            </SelectContent>
                          </Select>
                        </div>
                      </>
                    )}
                  </div>
                </div>
              </>
            )}
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
};
