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
import { TrendingUp, Group, Filter, Database, Settings } from "lucide-react";
import { DatabaseSelector } from "../components/DatabaseSelector";
import { Column } from "../components/types";
import { WidgetFilters } from "../components/WidgetFilters";
import { StrictDataFlowEditor } from "./StrictDataFlowEditor";
import { createDefaultDataFlowConfig, StrictDataFlowConfig } from "@/widgets/schemas/strictDataFlow";

interface ChartWidgetEditorProps {
  value: z.infer<typeof chartWidgetConfigSchema>;
  onChange: (value: z.infer<typeof chartWidgetConfigSchema>) => void;
  tenantId: number;
}

export const ChartWidgetEditor: React.FC<ChartWidgetEditorProps> = ({ value, onChange, tenantId }) => {
  const [activeTab, setActiveTab] = useState("dataFlow");
  const [availableColumns, setAvailableColumns] = useState<Column[]>([]);
  const [useStrictFlow, setUseStrictFlow] = useState(!!value.dataFlow);

  // Initialize data flow if not present
  const dataFlow = value.dataFlow || createDefaultDataFlowConfig() as StrictDataFlowConfig;

  const updateSettings = (updates: Partial<typeof value.settings>) => {
    onChange({
      ...value,
      settings: { ...(value.settings || {}), ...updates },
    });
  };

  const updateStyle = (updates: Partial<typeof value.style>) => {
    onChange({
      ...value,
      style: { ...(value.style || {}), ...updates },
    });
  };

  const updateData = (updates: Partial<typeof value.data>) => {
    onChange({
      ...value,
      data: { 
        filters: [], 
        mappings: { y: [] }, 
        databaseId: undefined, 
        tableId: undefined, 
        ...(value.data || {}), 
        ...updates 
      },
    });
  };

  const updateDataFlow = (updates: StrictDataFlowConfig) => {
    onChange({
      ...value,
      dataFlow: updates,
    });
  };

  const handleFiltersChange = (filters: any[]) => {
    updateData({ filters });
  };

  const toggleYColumn = (columnName: string) => {
    const currentY = value.data?.mappings?.y || [];
    const updated = currentY.includes(columnName)
      ? currentY.filter(c => c !== columnName)
      : [...currentY, columnName];
    updateData({ 
      mappings: { 
        ...value.data?.mappings, 
        y: updated 
      } 
    });
  };

  // Legacy settings access for backward compatibility
  const legacySettings = {
    processingMode: "raw" as "raw" | "grouped",
    aggregationFunction: "sum" as "sum" | "avg" | "count" | "min" | "max",
    aggregationColumns: [] as string[],
    groupByColumn: undefined as string | undefined,
    enableTopN: false,
    topNCount: 10,
    sortByColumn: undefined as string | undefined,
    sortDirection: "desc" as "asc" | "desc"
  };

  return (
    <div className="space-y-4">
      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="dataFlow" className="flex items-center space-x-1">
            <Database className="w-3 h-3" />
            <span>Data Flow</span>
          </TabsTrigger>
          <TabsTrigger value="settings" className="flex items-center space-x-1">
            <Settings className="w-3 h-3" />
            <span>Settings</span>
          </TabsTrigger>
          <TabsTrigger value="style">Style</TabsTrigger>
          <TabsTrigger value="legacy" className="text-xs">Legacy</TabsTrigger>
        </TabsList>

        {/* Data Flow Tab - NEW STRICT FLOW */}
        <TabsContent value="dataFlow" className="space-y-4">
          <StrictDataFlowEditor
            value={dataFlow}
            onChange={updateDataFlow}
            tenantId={tenantId}
            widgetType="chart"
          />
        </TabsContent>

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
        <TabsContent value="style" className="space-y-4 max-h-[600px] overflow-y-auto">
          <div className="space-y-6">
            {/* Theme Selection */}
            <div>
              <h3 className="text-sm font-semibold mb-3">Premium Theme</h3>
              <Select
                value={value.style.theme}
                onValueChange={(val) => updateStyle({ theme: val as any })}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="platinum">💎 Platinum (Bright White)</SelectItem>
                  <SelectItem value="onyx">⬛ Onyx (Deep Black)</SelectItem>
                  <SelectItem value="pearl">🤍 Pearl (Warm White)</SelectItem>
                  <SelectItem value="obsidian">⚫ Obsidian (Cool Black)</SelectItem>
                  <SelectItem value="custom">🎨 Custom</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* Colors */}
            <div className="border-t pt-4">
              <h3 className="text-sm font-semibold mb-3">Colors</h3>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <Label className="text-xs">Background</Label>
                  <Input
                    type="color"
                    value={value.style.backgroundColor}
                    onChange={(e) => updateStyle({ backgroundColor: e.target.value })}
                    className="h-10 mt-1"
                  />
                </div>
                <div>
                  <Label className="text-xs">Text</Label>
                  <Input
                    type="color"
                    value={value.style.textColor}
                    onChange={(e) => updateStyle({ textColor: e.target.value })}
                    className="h-10 mt-1"
                  />
                </div>
                <div>
                  <Label className="text-xs">Grid</Label>
                  <Input
                    type="color"
                    value={value.style.gridColor || "#E5E5E5"}
                    onChange={(e) => updateStyle({ gridColor: e.target.value })}
                    className="h-10 mt-1"
                  />
                </div>
                <div>
                  <Label className="text-xs">Border</Label>
                  <Input
                    type="color"
                    value={value.style.borderColor || "#E5E5E5"}
                    onChange={(e) => updateStyle({ borderColor: e.target.value })}
                    className="h-10 mt-1"
                  />
                </div>
              </div>
            </div>

            {/* Typography */}
            <div className="border-t pt-4">
              <h3 className="text-sm font-semibold mb-3">Typography</h3>
              <div className="space-y-3">
                <div>
                  <Label className="text-xs">Font Size</Label>
                  <Select
                    value={value.style.fontSize || "sm"}
                    onValueChange={(val) => updateStyle({ fontSize: val as any })}
                  >
                    <SelectTrigger className="mt-1">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="xs">Extra Small</SelectItem>
                      <SelectItem value="sm">Small</SelectItem>
                      <SelectItem value="base">Base</SelectItem>
                      <SelectItem value="lg">Large</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div>
                  <Label className="text-xs">Font Weight</Label>
                  <Select
                    value={value.style.fontWeight || "normal"}
                    onValueChange={(val) => updateStyle({ fontWeight: val as any })}
                  >
                    <SelectTrigger className="mt-1">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="light">Light (300)</SelectItem>
                      <SelectItem value="normal">Normal (400)</SelectItem>
                      <SelectItem value="medium">Medium (500)</SelectItem>
                      <SelectItem value="semibold">Semibold (600)</SelectItem>
                      <SelectItem value="bold">Bold (700)</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </div>

            {/* Layout & Spacing */}
            <div className="border-t pt-4">
              <h3 className="text-sm font-semibold mb-3">Layout</h3>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <Label className="text-xs">Padding</Label>
                  <Select
                    value={value.style.padding || "md"}
                    onValueChange={(val) => updateStyle({ padding: val as any })}
                  >
                    <SelectTrigger className="mt-1">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="none">None</SelectItem>
                      <SelectItem value="xs">XS</SelectItem>
                      <SelectItem value="sm">Small</SelectItem>
                      <SelectItem value="md">Medium</SelectItem>
                      <SelectItem value="lg">Large</SelectItem>
                      <SelectItem value="xl">XL</SelectItem>
                      <SelectItem value="2xl">2XL</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div>
                  <Label className="text-xs">Border Radius</Label>
                  <Select
                    value={value.style.borderRadius || "xl"}
                    onValueChange={(val) => updateStyle({ borderRadius: val as any })}
                  >
                    <SelectTrigger className="mt-1">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="none">None (Square)</SelectItem>
                      <SelectItem value="sm">Small</SelectItem>
                      <SelectItem value="md">Medium</SelectItem>
                      <SelectItem value="lg">Large</SelectItem>
                      <SelectItem value="xl">XL</SelectItem>
                      <SelectItem value="2xl">2XL</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </div>

            {/* Borders */}
            <div className="border-t pt-4">
              <h3 className="text-sm font-semibold mb-3">Borders</h3>
              <div className="space-y-3">
                <div>
                  <Label className="text-xs">Border Width (px)</Label>
                  <Input
                    type="number"
                    min="0"
                    max="8"
                    value={value.style.borderWidth || 1}
                    onChange={(e) => updateStyle({ borderWidth: parseInt(e.target.value) })}
                    className="mt-1"
                  />
                </div>
              </div>
            </div>

            {/* Shadows & Effects */}
            <div className="border-t pt-4">
              <h3 className="text-sm font-semibold mb-3">Shadows & Effects</h3>
              <div className="space-y-3">
                <div>
                  <Label className="text-xs">Shadow</Label>
                  <Select
                    value={value.style.shadow || "medium"}
                    onValueChange={(val) => updateStyle({ shadow: val as any })}
                  >
                    <SelectTrigger className="mt-1">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="none">None</SelectItem>
                      <SelectItem value="subtle">Subtle</SelectItem>
                      <SelectItem value="medium">Medium</SelectItem>
                      <SelectItem value="bold">Bold</SelectItem>
                      <SelectItem value="glow">Glow</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="flex items-center justify-between">
                  <Label className="text-xs">Glass Effect</Label>
                  <Switch
                    checked={value.style.glassEffect || false}
                    onCheckedChange={(checked) => updateStyle({ glassEffect: checked })}
                  />
                </div>

                <div className="flex items-center justify-between">
                  <Label className="text-xs">Shine Effect</Label>
                  <Switch
                    checked={value.style.shine || false}
                    onCheckedChange={(checked) => updateStyle({ shine: checked })}
                  />
                </div>

                <div className="flex items-center justify-between">
                  <Label className="text-xs">Glow Effect</Label>
                  <Switch
                    checked={value.style.glow || false}
                    onCheckedChange={(checked) => updateStyle({ glow: checked })}
                  />
                </div>
              </div>
            </div>

            {/* Chart Specific */}
            <div className="border-t pt-4">
              <h3 className="text-sm font-semibold mb-3">Chart Options</h3>
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <Label className="text-xs">Show Legend</Label>
                  <Switch
                    checked={value.style.showLegend}
                    onCheckedChange={(checked) => updateStyle({ showLegend: checked })}
                  />
                </div>

                <div className="flex items-center justify-between">
                  <Label className="text-xs">Show Grid</Label>
                  <Switch
                    checked={value.style.showGrid}
                    onCheckedChange={(checked) => updateStyle({ showGrid: checked })}
                  />
                </div>

                <div>
                  <Label className="text-xs">Legend Position</Label>
                  <Select
                    value={value.style.legendPosition || "bottom"}
                    onValueChange={(val) => updateStyle({ legendPosition: val as any })}
                  >
                    <SelectTrigger className="mt-1">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="top">Top</SelectItem>
                      <SelectItem value="bottom">Bottom</SelectItem>
                      <SelectItem value="left">Left</SelectItem>
                      <SelectItem value="right">Right</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </div>
          </div>
        </TabsContent>

        {/* Legacy Data Tab */}
        <TabsContent value="legacy" className="space-y-4">
          <div className="space-y-6">
            <div className="p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
              <h3 className="text-sm font-semibold text-yellow-800 mb-2">⚠️ Legacy Configuration</h3>
              <p className="text-sm text-yellow-700">
                This is the legacy data configuration method. For better control and validation, 
                please use the "Data Flow" tab which enforces the proper processing order.
              </p>
            </div>

            {/* Database and Table Selection */}
            <div>
              <h3 className="text-sm font-semibold text-foreground mb-3">Data Source</h3>
              <DatabaseSelector
                tenantId={tenantId}
                selectedDatabaseId={value.data?.databaseId}
                selectedTableId={Number(value.data?.tableId)}
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
                        value={value.data?.mappings?.x || ""}
                        onValueChange={(val) => updateData({ 
                          mappings: { 
                            y: [], 
                            ...value.data?.mappings, 
                            x: val 
                          } 
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
                            const isSelected = (value.data?.mappings?.y || []).includes(column.name);
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
                      {(!value.data?.mappings?.y || value.data?.mappings?.y.length === 0) && (
                        <p className="text-xs text-amber-600 mt-1">
                          ⚠️ Please select at least one Y axis column.
                        </p>
                      )}
                      {value.data?.mappings?.y && value.data?.mappings?.y.length > 0 && (
                        <p className="text-xs text-green-600 mt-1">
                          ✅ {value.data?.mappings?.y.length} column(s) selected
                        </p>
                      )}
                    </div>
                  </div>
                </div>

                {/* Filters Section */}
                <div>
                  <h3 className="text-sm font-semibold text-foreground mb-3">Data Filters</h3>
              <WidgetFilters
                filters={value.data?.filters || []}
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
                        value={legacySettings.processingMode}
                        onValueChange={(val) => {
                          // Legacy mode - just show the selection but don't actually update
                          console.log("Legacy processing mode selected:", val);
                        }}
                      >
                        <SelectTrigger className="mt-1">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="raw">Raw Data (No Processing)</SelectItem>
                          <SelectItem value="grouped">Grouped (Aggregate per Category)</SelectItem>
                        </SelectContent>
                      </Select>
                      <p className="text-xs text-muted-foreground mt-1">
                        {legacySettings.processingMode === "raw" && "Display data as-is from the table"}
                        {legacySettings.processingMode === "grouped" && "Group data and calculate aggregated values per category (e.g., Sales per Region)"}
                      </p>
                    </div>
                  </div>
                </div>

                {/* Aggregation Settings (only for grouped mode) */}
                {legacySettings.processingMode === "grouped" && (
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
                          value={legacySettings.aggregationFunction}
                          onValueChange={(val) => {
                            console.log("Legacy aggregation function selected:", val);
                          }}
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
                                  checked={legacySettings.aggregationColumns.includes(column.name)}
                                  onCheckedChange={(checked) => {
                                    console.log("Legacy aggregation column selected:", column.name, checked);
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
                {legacySettings.processingMode === "grouped" && (
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
                          value={legacySettings.groupByColumn || ""}
                          onValueChange={(val) => {
                            console.log("Legacy group by column selected:", val);
                          }}
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
                        checked={legacySettings.enableTopN}
                        onCheckedChange={(checked) => {
                          console.log("Legacy enableTopN changed:", checked);
                        }}
                      />
                    </div>

                    {legacySettings.enableTopN && (
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
                            value={legacySettings.topNCount}
                            onChange={(e) => {
                              console.log("Legacy topNCount changed:", e.target.value);
                            }}
                            className="mt-1"
                          />
                        </div>

                        <div>
                          <Label htmlFor="sortByColumn" className="text-xs font-medium uppercase tracking-wide">
                            Sort By
                          </Label>
                          <Select
                            value={legacySettings.sortByColumn || ""}
                            onValueChange={(val) => {
                              console.log("Legacy sortByColumn changed:", val);
                            }}
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
                            value={legacySettings.sortDirection}
                            onValueChange={(val) => {
                              console.log("Legacy sortDirection changed:", val);
                            }}
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
