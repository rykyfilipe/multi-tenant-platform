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
import { DatabaseSelector } from "../components/DatabaseSelector";
import { Column } from "../components/types";
import { WidgetFilters } from "../components/WidgetFilters";
import { TrendingUp, Filter } from "lucide-react";

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

  const handleFiltersChange = (filters: any[]) => {
    updateData({ filters });
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
          </div>
        </TabsContent>

        {/* Style Tab */}
        <TabsContent value="style" className="space-y-4 max-h-[600px] overflow-y-auto">
          <div className="space-y-6">
            {/* Premium Theme */}
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
                    value={value.style.backgroundColor || "#FFFFFF"}
                    onChange={(e) => updateStyle({ backgroundColor: e.target.value })}
                    className="h-10 mt-1"
                  />
                </div>
                <div>
                  <Label className="text-xs">Value</Label>
                  <Input
                    type="color"
                    value={value.style.valueColor || "#000000"}
                    onChange={(e) => updateStyle({ valueColor: e.target.value })}
                    className="h-10 mt-1"
                  />
                </div>
                <div>
                  <Label className="text-xs">Label</Label>
                  <Input
                    type="color"
                    value={value.style.labelColor || "#666666"}
                    onChange={(e) => updateStyle({ labelColor: e.target.value })}
                    className="h-10 mt-1"
                  />
                </div>
                <div>
                  <Label className="text-xs">Trend</Label>
                  <Input
                    type="color"
                    value={value.style.trendColor || "#22c55e"}
                    onChange={(e) => updateStyle({ trendColor: e.target.value })}
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
                  <Label className="text-xs">Value Size</Label>
                  <Select
                    value={value.style.valueFontSize || "4xl"}
                    onValueChange={(val) => updateStyle({ valueFontSize: val as any })}
                  >
                    <SelectTrigger className="mt-1">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="xl">Extra Large</SelectItem>
                      <SelectItem value="2xl">2XL</SelectItem>
                      <SelectItem value="3xl">3XL</SelectItem>
                      <SelectItem value="4xl">4XL (Default)</SelectItem>
                      <SelectItem value="5xl">5XL</SelectItem>
                      <SelectItem value="6xl">6XL</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div>
                  <Label className="text-xs">Value Weight</Label>
                  <Select
                    value={value.style.valueFontWeight || "bold"}
                    onValueChange={(val) => updateStyle({ valueFontWeight: val as any })}
                  >
                    <SelectTrigger className="mt-1">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="light">Light</SelectItem>
                      <SelectItem value="normal">Normal</SelectItem>
                      <SelectItem value="medium">Medium</SelectItem>
                      <SelectItem value="semibold">Semibold</SelectItem>
                      <SelectItem value="bold">Bold</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div>
                  <Label className="text-xs">Letter Spacing</Label>
                  <Select
                    value={value.style.letterSpacing || "normal"}
                    onValueChange={(val) => updateStyle({ letterSpacing: val as any })}
                  >
                    <SelectTrigger className="mt-1">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="tighter">Tighter</SelectItem>
                      <SelectItem value="tight">Tight</SelectItem>
                      <SelectItem value="normal">Normal</SelectItem>
                      <SelectItem value="wide">Wide</SelectItem>
                      <SelectItem value="wider">Wider</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </div>

            {/* Shadows & Effects */}
            <div className="border-t pt-4">
              <h3 className="text-sm font-semibold mb-3">Premium Effects</h3>
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

                <div className="grid grid-cols-3 gap-2">
                  <div className="flex items-center gap-1">
                    <Switch
                      id="glassEffect"
                      checked={value.style.glassEffect || false}
                      onCheckedChange={(checked) => updateStyle({ glassEffect: checked })}
                      className="scale-75"
                    />
                    <Label htmlFor="glassEffect" className="text-xs">Glass</Label>
                  </div>
                  <div className="flex items-center gap-1">
                    <Switch
                      id="shine"
                      checked={value.style.shine || false}
                      onCheckedChange={(checked) => updateStyle({ shine: checked })}
                      className="scale-75"
                    />
                    <Label htmlFor="shine" className="text-xs">Shine</Label>
                  </div>
                  <div className="flex items-center gap-1">
                    <Switch
                      id="glow"
                      checked={value.style.glow || false}
                      onCheckedChange={(checked) => updateStyle({ glow: checked })}
                      className="scale-75"
                    />
                    <Label htmlFor="glow" className="text-xs">Glow</Label>
                  </div>
                  <div className="flex items-center gap-1">
                    <Switch
                      id="pulse"
                      checked={value.style.pulse || false}
                      onCheckedChange={(checked) => updateStyle({ pulse: checked })}
                      className="scale-75"
                    />
                    <Label htmlFor="pulse" className="text-xs">Pulse</Label>
                  </div>
                </div>
              </div>
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
                onDatabaseChange={(databaseId) => updateData({ databaseId, tableId: "", filters: [] })}
                onTableChange={(tableId) => updateData({ tableId: tableId.toString(), filters: [] })}
                onColumnsChange={setAvailableColumns}
              />
            </div>

            {/* Column Configuration */}
            {availableColumns.length > 0 && (
              <>
                <div>
                  <h3 className="text-sm font-semibold text-foreground mb-3">Column Configuration</h3>
                  <div className="space-y-3">
                    <div>
                      <Label htmlFor="valueField" className="text-xs font-medium uppercase tracking-wide">
                        Value Column (for calculations)
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
                                {column.name}
                              </SelectItem>
                            ))}
                        </SelectContent>
                      </Select>
                      <p className="text-xs text-muted-foreground mt-1">
                        Column used for aggregation calculations
                      </p>
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

                {/* Aggregation Functions */}
                <div className="border-t pt-4">
                  <h3 className="text-sm font-semibold text-foreground mb-3 flex items-center gap-2">
                    <TrendingUp className="h-4 w-4" />
                    Aggregation Functions
                  </h3>
                  <div className="space-y-3">
                    <div className="p-3 bg-muted/50 rounded-md">
                      <p className="text-xs text-muted-foreground">
                        <strong>Select aggregation functions:</strong> Choose one or more functions to calculate. Multiple selections will display all metrics.
                      </p>
                    </div>

                    <div className="space-y-2">
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
                      <p className="text-xs text-amber-600 p-2 bg-amber-50 rounded">
                        ⚠️ Please select at least one aggregation function.
                      </p>
                    )}
                  </div>
                </div>

                {/* Extreme Value Details */}
                <div className="border-t pt-4">
                  <h3 className="text-sm font-semibold text-foreground mb-3 flex items-center gap-2">
                    <Filter className="h-4 w-4" />
                    Extreme Value Details
                  </h3>
                  <div className="space-y-3">
                    <div className="p-3 bg-muted/50 rounded-md">
                      <p className="text-xs text-muted-foreground">
                        <strong>For MIN/MAX:</strong> Display additional information from the row with the extreme value.
                      </p>
                    </div>

                    <div className="flex items-center justify-between">
                      <Label htmlFor="showExtremeValueDetails" className="text-xs font-medium uppercase tracking-wide">
                        Show Details
                      </Label>
                      <Switch
                        id="showExtremeValueDetails"
                        checked={value.settings.showExtremeValueDetails || false}
                        onCheckedChange={(checked) => updateSettings({ showExtremeValueDetails: checked })}
                      />
                    </div>

                    {value.settings.showExtremeValueDetails && (
                      <>
                        <div>
                          <Label className="text-xs font-medium uppercase tracking-wide">
                            Extreme Value Mode
                          </Label>
                          <Select
                            value={value.settings.extremeValueMode || "max"}
                            onValueChange={(val) => updateSettings({ extremeValueMode: val as "max" | "min" })}
                          >
                            <SelectTrigger className="mt-1">
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="max">Maximum Value</SelectItem>
                              <SelectItem value="min">Minimum Value</SelectItem>
                            </SelectContent>
                          </Select>
                        </div>

                        <div>
                          <Label className="text-xs font-medium uppercase tracking-wide">
                            Display Columns (from extreme row)
                          </Label>
                          <div className="mt-2 space-y-2 max-h-48 overflow-y-auto border rounded-md p-2">
                            {availableColumns.map((column) => {
                              const selectedFields = value.settings.displayFields || [];
                              const isSelected = selectedFields.includes(column.name);
                              return (
                                <div key={column.id} className="flex items-center space-x-2">
                                  <Checkbox
                                    id={`display-${column.name}`}
                                    checked={isSelected}
                                    onCheckedChange={(checked) => {
                                      const current = value.settings.displayFields || [];
                                      const updated = checked
                                        ? [...current, column.name]
                                        : current.filter(c => c !== column.name);
                                      updateSettings({ displayFields: updated });
                                    }}
                                  />
                                  <Label htmlFor={`display-${column.name}`} className="text-sm">
                                    {column.name}
                                  </Label>
                                </div>
                              );
                            })}
                          </div>
                        </div>
                      </>
                    )}
                  </div>
                </div>

                {/* Comparison Section */}
                <div className="border-t pt-4">
                  <h3 className="text-sm font-semibold text-foreground mb-3">Comparison & Trend</h3>
                  <div className="space-y-3">
                    <div className="p-3 bg-muted/50 rounded-md">
                      <p className="text-xs text-muted-foreground">
                        <strong>Trend Analysis:</strong> Compare with another column to show trend percentage.
                      </p>
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
                        Enable Comparison
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
                          Comparison Column
                        </Label>
                        <Select
                          value={value.settings.comparisonField || ""}
                          onValueChange={(val) => updateSettings({ comparisonField: val || undefined })}
                        >
                          <SelectTrigger className="mt-1">
                            <SelectValue placeholder="Select comparison column" />
                          </SelectTrigger>
                          <SelectContent>
                            {availableColumns
                              .filter(col => ["number"].includes(col.type))
                              .map((column) => (
                                <SelectItem key={column.id} value={column.name}>
                                  {column.name}
                                </SelectItem>
                              ))}
                          </SelectContent>
                        </Select>
                        <p className="text-xs text-muted-foreground mt-1">
                          Column to compare against (e.g., previous period data)
                        </p>
                      </div>
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
