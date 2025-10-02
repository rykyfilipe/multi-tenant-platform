"use client";

import React, { useState } from "react";
import { z } from "zod";
import { tableWidgetConfigSchema } from "@/widgets/schemas/table";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Plus, X, ArrowUp, ArrowDown, Group, TrendingUp } from "lucide-react";
import { DatabaseSelector } from "../components/DatabaseSelector";
import { Column } from "../components/types";
import { WidgetFilters } from "../components/WidgetFilters";

type TableWidgetConfig = z.infer<typeof tableWidgetConfigSchema>;

interface TableWidgetEditorProps {
  value: TableWidgetConfig;
  onChange: (value: TableWidgetConfig) => void;
  tenantId: number;
}

export const TableWidgetEditor: React.FC<TableWidgetEditorProps> = ({ value, onChange, tenantId }) => {
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

  const addColumn = () => {
    const newColumns = [...value.settings.columns, { 
      id: `column_${Date.now()}`, 
      label: "New Column", 
      sortable: true, 
      format: "text" as const,
      showStatistics: false
    }];
    updateSettings({ columns: newColumns });
  };

  const updateColumn = (index: number, updates: Partial<typeof value.settings.columns[0]>) => {
    const newColumns = [...value.settings.columns];
    newColumns[index] = { ...newColumns[index], ...updates };
    updateSettings({ columns: newColumns });
  };

  const removeColumn = (index: number) => {
    const newColumns = value.settings.columns.filter((_, i) => i !== index);
    updateSettings({ columns: newColumns });
  };

  const moveColumn = (index: number, direction: 'up' | 'down') => {
    const newColumns = [...value.settings.columns];
    const targetIndex = direction === 'up' ? index - 1 : index + 1;
    
    if (targetIndex >= 0 && targetIndex < newColumns.length) {
      [newColumns[index], newColumns[targetIndex]] = [newColumns[targetIndex], newColumns[index]];
      updateSettings({ columns: newColumns });
    }
  };

  const handleFiltersChange = (filters: any[]) => {
    updateData({ filters });
  };

  const addSort = () => {
    const newSort = [...(value.data?.sort || []), { column: "", direction: "asc" as const }];
    updateData({ sort: newSort });
  };

  const updateSort = (index: number, updates: Partial<typeof value.data?.sort?.[0]>) => {
    const newSort = [...(value.data?.sort || [])];
    newSort[index] = { ...newSort[index], ...updates };
    updateData({ sort: newSort });
  };

  const removeSort = (index: number) => {
    const newSort = (value.data?.sort || []).filter((_, i) => i !== index);
    updateData({ sort: newSort });
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
          <div className="space-y-4">
            <div>
              <Label htmlFor="pageSize" className="text-xs font-medium uppercase tracking-wide">
                Page Size
              </Label>
              <Input
                id="pageSize"
                type="number"
                min="10"
                max="200"
                value={value.settings.pageSize}
                onChange={(e) => updateSettings({ pageSize: parseInt(e.target.value) || 25 })}
                className="mt-1"
              />
            </div>

            <div className="flex items-center justify-between">
              <Label htmlFor="stickyHeader" className="text-xs font-medium uppercase tracking-wide">
                Sticky Header
              </Label>
              <Switch
                id="stickyHeader"
                checked={value.settings.stickyHeader}
                onCheckedChange={(checked) => updateSettings({ stickyHeader: checked })}
              />
            </div>

            <div className="flex items-center justify-between">
              <Label htmlFor="enableExport" className="text-xs font-medium uppercase tracking-wide">
                Enable Export
              </Label>
              <Switch
                id="enableExport"
                checked={value.settings.enableExport}
                onCheckedChange={(checked) => updateSettings({ enableExport: checked })}
              />
            </div>

            <div className="flex items-center justify-between">
              <Label htmlFor="showFooterStatistics" className="text-xs font-medium uppercase tracking-wide">
                Show Footer Statistics
              </Label>
              <Switch
                id="showFooterStatistics"
                checked={value.settings.showFooterStatistics || false}
                onCheckedChange={(checked) => updateSettings({ showFooterStatistics: checked })}
              />
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
                  <Label className="text-xs">Text</Label>
                  <Input
                    type="color"
                    value={value.style.textColor || "#000000"}
                    onChange={(e) => updateStyle({ textColor: e.target.value })}
                    className="h-10 mt-1"
                  />
                </div>
                <div>
                  <Label className="text-xs">Header BG</Label>
                  <Input
                    type="color"
                    value={value.style.headerBgColor || "#F5F5F5"}
                    onChange={(e) => updateStyle({ headerBgColor: e.target.value })}
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
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <Label className="text-xs">Font Size</Label>
                  <Select
                    value={value.style.fontSize || "xs"}
                    onValueChange={(val) => updateStyle({ fontSize: val as any })}
                  >
                    <SelectTrigger className="mt-1">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="xs">Extra Small</SelectItem>
                      <SelectItem value="sm">Small</SelectItem>
                      <SelectItem value="base">Base</SelectItem>
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
                      <SelectItem value="light">Light</SelectItem>
                      <SelectItem value="normal">Normal</SelectItem>
                      <SelectItem value="medium">Medium</SelectItem>
                      <SelectItem value="semibold">Semibold</SelectItem>
                      <SelectItem value="bold">Bold</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </div>

            {/* Layout */}
            <div className="border-t pt-4">
              <h3 className="text-sm font-semibold mb-3">Layout</h3>
              <div className="space-y-3">
                <div>
                  <Label className="text-xs">Density</Label>
                  <Select
                    value={value.style.density}
                    onValueChange={(val) => updateStyle({ density: val as any })}
                  >
                    <SelectTrigger className="mt-1">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="compact">Compact</SelectItem>
                      <SelectItem value="comfortable">Comfortable</SelectItem>
                      <SelectItem value="expanded">Expanded</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div>
                  <Label className="text-xs">Header Style</Label>
                  <Select
                    value={value.style.headerStyle || "bold"}
                    onValueChange={(val) => updateStyle({ headerStyle: val as any })}
                  >
                    <SelectTrigger className="mt-1">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="default">Default</SelectItem>
                      <SelectItem value="bold">Bold</SelectItem>
                      <SelectItem value="accent">Accent</SelectItem>
                      <SelectItem value="gradient">Gradient</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </div>

            {/* Row Effects */}
            <div className="border-t pt-4">
              <h3 className="text-sm font-semibold mb-3">Row Effects</h3>
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <Label className="text-xs">Zebra Stripes</Label>
                  <Switch
                    checked={value.style.zebraStripes}
                    onCheckedChange={(checked) => updateStyle({ zebraStripes: checked })}
                  />
                </div>

                <div className="flex items-center justify-between">
                  <Label className="text-xs">Row Borders</Label>
                  <Switch
                    checked={value.style.showRowBorders}
                    onCheckedChange={(checked) => updateStyle({ showRowBorders: checked })}
                  />
                </div>

                <div>
                  <Label className="text-xs">Hover Effect</Label>
                  <Select
                    value={value.style.rowHoverEffect || "highlight"}
                    onValueChange={(val) => updateStyle({ rowHoverEffect: val as any })}
                  >
                    <SelectTrigger className="mt-1">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="none">None</SelectItem>
                      <SelectItem value="highlight">Highlight</SelectItem>
                      <SelectItem value="lift">Lift</SelectItem>
                      <SelectItem value="glow">Glow</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </div>

            {/* Premium Effects */}
            <div className="border-t pt-4">
              <h3 className="text-sm font-semibold mb-3">Premium Effects</h3>
              <div className="space-y-3">
                <div>
                  <Label className="text-xs">Shadow</Label>
                  <Select
                    value={value.style.shadow || "subtle"}
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
                    </SelectContent>
                  </Select>
                </div>

                <div className="grid grid-cols-2 gap-2">
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
                selectedDatabaseId={value.data?.databaseId}
                selectedTableId={Number(value.data?.tableId)}
                onDatabaseChange={(databaseId) => updateData({ databaseId, tableId: "", filters: [], sort: [] })}
                onTableChange={(tableId) => updateData({ tableId: tableId.toString(), filters: [], sort: [] })}
                onColumnsChange={setAvailableColumns}
              />
            </div>

            {/* Columns Configuration */}
            {availableColumns.length > 0 && (
              <>
                <div>
                  <h3 className="text-sm font-semibold text-foreground mb-3">Columns</h3>
                  <div className="space-y-2 max-h-96 overflow-y-auto">
                    {value.settings.columns.map((column, index) => (
                      <div key={column.id} className="flex items-start gap-2 p-3 border rounded-lg bg-muted/20">
                        <div className="flex-1 space-y-2">
                          <div className="grid grid-cols-2 gap-2">
                            <div>
                              <Label className="text-xs">Column ID</Label>
                              <Select
                                value={column.id}
                                onValueChange={(val) => updateColumn(index, { id: val })}
                              >
                                <SelectTrigger className="h-8 text-xs">
                                  <SelectValue />
                                </SelectTrigger>
                                <SelectContent>
                                  {availableColumns.map((col) => (
                                    <SelectItem key={col.id} value={col.name}>
                                      {col.name}
                                    </SelectItem>
                                  ))}
                                </SelectContent>
                              </Select>
                            </div>
                            <div>
                              <Label className="text-xs">Label</Label>
                              <Input
                                value={column.label}
                                onChange={(e) => updateColumn(index, { label: e.target.value })}
                                className="h-8 text-xs"
                              />
                            </div>
                          </div>

                          <div className="grid grid-cols-2 gap-2">
                            <div>
                              <Label className="text-xs">Format</Label>
                              <Select
                                value={column.format}
                                onValueChange={(val) => updateColumn(index, { format: val as any })}
                              >
                                <SelectTrigger className="h-8 text-xs">
                                  <SelectValue />
                                </SelectTrigger>
                                <SelectContent>
                                  <SelectItem value="text">Text</SelectItem>
                                  <SelectItem value="number">Number</SelectItem>
                                  <SelectItem value="currency">Currency</SelectItem>
                                  <SelectItem value="date">Date</SelectItem>
                                  <SelectItem value="percentage">Percentage</SelectItem>
                                  <SelectItem value="badge">Badge</SelectItem>
                                  <SelectItem value="link">Link</SelectItem>
                                </SelectContent>
                              </Select>
                            </div>

                            {column.showStatistics && (
                              <div>
                                <Label className="text-xs">Statistic</Label>
                                <Select
                                  value={column.statisticFunction || "sum"}
                                  onValueChange={(val) => updateColumn(index, { statisticFunction: val as any })}
                                >
                                  <SelectTrigger className="h-8 text-xs">
                                    <SelectValue />
                                  </SelectTrigger>
                                  <SelectContent>
                                    <SelectItem value="sum">Sum</SelectItem>
                                    <SelectItem value="avg">Average</SelectItem>
                                    <SelectItem value="count">Count</SelectItem>
                                    <SelectItem value="min">Min</SelectItem>
                                    <SelectItem value="max">Max</SelectItem>
                                  </SelectContent>
                                </Select>
                              </div>
                            )}
                          </div>

                          <div className="flex items-center gap-3">
                            <div className="flex items-center gap-1">
                              <Switch
                                id={`sortable-${index}`}
                                checked={column.sortable}
                                onCheckedChange={(checked) => updateColumn(index, { sortable: checked })}
                                className="scale-75"
                              />
                              <Label htmlFor={`sortable-${index}`} className="text-xs">Sortable</Label>
                            </div>
                            <div className="flex items-center gap-1">
                              <Switch
                                id={`stats-${index}`}
                                checked={column.showStatistics || false}
                                onCheckedChange={(checked) => updateColumn(index, { 
                                  showStatistics: checked,
                                  statisticFunction: checked ? 'sum' : undefined
                                })}
                                className="scale-75"
                              />
                              <Label htmlFor={`stats-${index}`} className="text-xs">Statistics</Label>
                            </div>
                          </div>
                        </div>

                        <div className="flex flex-col gap-1">
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => moveColumn(index, 'up')}
                            disabled={index === 0}
                            className="h-6 w-6 p-0"
                          >
                            <ArrowUp className="h-3 w-3" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => moveColumn(index, 'down')}
                            disabled={index === value.settings.columns.length - 1}
                            className="h-6 w-6 p-0"
                          >
                            <ArrowDown className="h-3 w-3" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => removeColumn(index)}
                            className="h-6 w-6 p-0 text-destructive"
                          >
                            <X className="h-3 w-3" />
                          </Button>
                        </div>
                      </div>
                    ))}
                  </div>

                  <Button onClick={addColumn} variant="outline" size="sm" className="w-full mt-2">
                    <Plus className="h-3 w-3 mr-1" />
                    Add Column
                  </Button>
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

                {/* Grouping Section */}
                <div className="border-t pt-4">
                  <h3 className="text-sm font-semibold text-foreground mb-3 flex items-center gap-2">
                    <Group className="h-4 w-4" />
                    Data Grouping
                  </h3>
                  <div className="space-y-3">
                    <div className="p-3 bg-muted/50 rounded-md">
                      <p className="text-xs text-muted-foreground">
                        <strong>Grouping:</strong> Group rows by category with optional group summaries.
                      </p>
                    </div>

                    <div>
                      <Label className="text-xs font-medium uppercase tracking-wide">
                        Processing Mode
                      </Label>
                      <Select
                        value={value.settings.processingMode || "raw"}
                        onValueChange={(val) => updateSettings({ processingMode: val as "raw" | "grouped" })}
                      >
                        <SelectTrigger className="mt-1">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="raw">Raw Data (No Grouping)</SelectItem>
                          <SelectItem value="grouped">Grouped Data</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>

                    {value.settings.processingMode === "grouped" && (
                      <>
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

                        <div className="flex items-center justify-between">
                          <Label htmlFor="showGroupSummary" className="text-xs font-medium uppercase tracking-wide">
                            Show Group Summaries
                          </Label>
                          <Switch
                            id="showGroupSummary"
                            checked={value.settings.showGroupSummary || false}
                            onCheckedChange={(checked) => updateSettings({ showGroupSummary: checked })}
                          />
                        </div>
                      </>
                    )}
                  </div>
                </div>

                {/* Sorting */}
                <div className="border-t pt-4">
                  <h3 className="text-sm font-semibold text-foreground mb-3">Sorting</h3>
                  <div className="space-y-2">
                    {(value.data?.sort || []).map((sortItem, index) => (
                      <div key={index} className="flex items-center gap-2">
                        <Select
                          value={sortItem.column}
                          onValueChange={(val) => updateSort(index, { column: val })}
                        >
                          <SelectTrigger className="flex-1 h-8 text-xs">
                            <SelectValue placeholder="Column" />
                          </SelectTrigger>
                          <SelectContent>
                            {value.settings.columns.map((col) => (
                              <SelectItem key={col.id} value={col.id}>
                                {col.label}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                        <Select
                          value={sortItem.direction}
                          onValueChange={(val) => updateSort(index, { direction: val as "asc" | "desc" })}
                        >
                          <SelectTrigger className="w-24 h-8 text-xs">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="asc">Asc</SelectItem>
                            <SelectItem value="desc">Desc</SelectItem>
                          </SelectContent>
                        </Select>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => removeSort(index)}
                          className="h-8 w-8 p-0"
                        >
                          <X className="h-3 w-3" />
                        </Button>
                      </div>
                    ))}
                    <Button onClick={addSort} variant="outline" size="sm" className="w-full">
                      <Plus className="h-3 w-3 mr-1" />
                      Add Sort Rule
                    </Button>
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
