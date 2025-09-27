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
import { Plus, X, ArrowUp, ArrowDown } from "lucide-react";
import { DatabaseSelector } from "../components/DatabaseSelector";
import { Column } from "../components/types";

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

  const addColumn = () => {
    const newColumns = [...value.settings.columns, { 
      id: `column_${Date.now()}`, 
      label: "New Column", 
      sortable: true, 
      format: "text" as const 
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

  const addSort = () => {
    const newSort = [...value.data.sort, { column: "", direction: "asc" as const }];
    updateData({ sort: newSort });
  };

  const updateSort = (index: number, updates: Partial<typeof value.data.sort[0]>) => {
    const newSort = [...value.data.sort];
    newSort[index] = { ...newSort[index], ...updates };
    updateData({ sort: newSort });
  };

  const removeSort = (index: number) => {
    const newSort = value.data.sort.filter((_, i) => i !== index);
    updateData({ sort: newSort });
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
            {/* Columns Management */}
            <div>
              <div className="flex items-center justify-between">
                <Label className="text-xs font-medium uppercase tracking-wide">Columns</Label>
                <Button size="sm" variant="outline" onClick={addColumn} className="h-6 px-2">
                  <Plus className="h-3 w-3 mr-1" />
                  Add Column
                </Button>
              </div>
              <div className="mt-2 space-y-2">
                {value.settings.columns.map((column, index) => (
                  <div key={index} className="flex items-center space-x-2 p-2 border rounded">
                    <Button
                      size="sm"
                      variant="ghost"
                      onClick={() => moveColumn(index, 'up')}
                      disabled={index === 0}
                      className="h-6 w-6 p-0"
                    >
                      <ArrowUp className="h-3 w-3" />
                    </Button>
                    <Button
                      size="sm"
                      variant="ghost"
                      onClick={() => moveColumn(index, 'down')}
                      disabled={index === value.settings.columns.length - 1}
                      className="h-6 w-6 p-0"
                    >
                      <ArrowDown className="h-3 w-3" />
                    </Button>
                    <Input
                      value={column.id}
                      onChange={(e) => updateColumn(index, { id: e.target.value })}
                      placeholder="Column ID"
                      className="flex-1"
                    />
                    <Input
                      value={column.label}
                      onChange={(e) => updateColumn(index, { label: e.target.value })}
                      placeholder="Column Label"
                      className="flex-1"
                    />
                    <Input
                      type="number"
                      value={column.width || ""}
                      onChange={(e) => updateColumn(index, { width: e.target.value ? Number(e.target.value) : undefined })}
                      placeholder="Width"
                      className="w-20"
                    />
                    <Select
                      value={column.format}
                      onValueChange={(val) => updateColumn(index, { format: val as typeof column.format })}
                    >
                      <SelectTrigger className="w-24">
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
                    <Switch
                      checked={column.sortable}
                      onCheckedChange={(checked) => updateColumn(index, { sortable: checked })}
                    />
                    <Button
                      size="sm"
                      variant="ghost"
                      onClick={() => removeColumn(index)}
                      className="h-6 w-6 p-0 text-red-500 hover:text-red-700"
                    >
                      <X className="h-3 w-3" />
                    </Button>
                  </div>
                ))}
              </div>
            </div>

            <div>
              <Label htmlFor="pageSize" className="text-xs font-medium uppercase tracking-wide">
                Page Size
              </Label>
              <Input
                id="pageSize"
                type="number"
                min="1"
                max="200"
                value={value.settings.pageSize}
                onChange={(e) => updateSettings({ pageSize: Number(e.target.value) })}
                className="mt-1"
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
              <Label htmlFor="stickyHeader" className="text-xs font-medium uppercase tracking-wide">
                Sticky Header
              </Label>
              <Switch
                id="stickyHeader"
                checked={value.settings.stickyHeader}
                onCheckedChange={(checked) => updateSettings({ stickyHeader: checked })}
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
              <Label htmlFor="density" className="text-xs font-medium uppercase tracking-wide">
                Density
              </Label>
              <Select
                value={value.style.density}
                onValueChange={(val) => updateStyle({ density: val as typeof value.style.density })}
              >
                <SelectTrigger className="mt-1">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="comfortable">Comfortable</SelectItem>
                  <SelectItem value="compact">Compact</SelectItem>
                  <SelectItem value="expanded">Expanded</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="flex items-center justify-between">
              <Label htmlFor="showRowBorders" className="text-xs font-medium uppercase tracking-wide">
                Show Row Borders
              </Label>
              <Switch
                id="showRowBorders"
                checked={value.style.showRowBorders}
                onCheckedChange={(checked) => updateStyle({ showRowBorders: checked })}
              />
            </div>

            <div className="flex items-center justify-between">
              <Label htmlFor="zebraStripes" className="text-xs font-medium uppercase tracking-wide">
                Zebra Stripes
              </Label>
              <Switch
                id="zebraStripes"
                checked={value.style.zebraStripes}
                onCheckedChange={(checked) => updateStyle({ zebraStripes: checked })}
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
              selectedTableId={ Number(value.data.tableId) }
              onDatabaseChange={(databaseId) => updateData({ databaseId, tableId: "", sort: [] })}
              onTableChange={(tableId) => updateData({ tableId: tableId.toString(), sort: [] })}
              onColumnsChange={setAvailableColumns}
            />

            {/* Column Selection for Table Display */}
            {availableColumns.length > 0 && (
              <div>
                <Label className="text-xs font-medium uppercase tracking-wide">Display Columns</Label>
                <div className="mt-2 space-y-2">
                  {availableColumns.map((column) => (
                    <div key={column.id} className="flex items-center space-x-2">
                      <input
                        type="checkbox"
                        id={`column-${column.id}`}
                        checked={value.settings.columns.some(col => col.id === column.name)}
                        onChange={(e) => {
                          if (e.target.checked) {
                            // Add column to display
                            const newColumns = [...value.settings.columns, {
                              id: column.name,
                              label: column.name,
                              sortable: true,
                              format: column.type === "number" ? "number" as const : 
                                      column.type === "date" ? "date" as const :
                                      column.type === "boolean" ? "badge" as const : "text" as const
                            }];
                            updateSettings({ columns: newColumns });
                          } else {
                            // Remove column from display
                            const newColumns = value.settings.columns.filter(col => col.id !== column.name);
                            updateSettings({ columns: newColumns });
                          }
                        }}
                        className="rounded"
                      />
                      <Label htmlFor={`column-${column.id}`} className="text-sm">
                        {column.name} ({column.type})
                      </Label>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Filters */}
            <div>
              <div className="flex items-center justify-between">
                <Label className="text-xs font-medium uppercase tracking-wide">Filters</Label>
                <Button size="sm" variant="outline" onClick={addFilter} className="h-6 px-2">
                  <Plus className="h-3 w-3 mr-1" />
                  Add Filter
                </Button>
              </div>
              <div className="mt-2 space-y-2">
                {value.data.filters.map((filter, index) => (
                  <div key={index} className="flex items-center space-x-2 p-2 border rounded">
                    <Input
                      value={filter.column}
                      onChange={(e) => updateFilter(index, { column: e.target.value })}
                      placeholder="Column"
                      className="flex-1"
                    />
                    <Select
                      value={filter.operator}
                      onValueChange={(val) => updateFilter(index, { operator: val as typeof filter.operator })}
                    >
                      <SelectTrigger className="w-24">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="=">=</SelectItem>
                        <SelectItem value="!=">!=</SelectItem>
                        <SelectItem value=">">&gt;</SelectItem>
                        <SelectItem value="<">&lt;</SelectItem>
                        <SelectItem value=">=">&gt;=</SelectItem>
                        <SelectItem value="<=">&lt;=</SelectItem>
                        <SelectItem value="contains">contains</SelectItem>
                        <SelectItem value="startsWith">starts with</SelectItem>
                        <SelectItem value="endsWith">ends with</SelectItem>
                      </SelectContent>
                    </Select>
                    <Input
                      value={String(filter.value)}
                      onChange={(e) => updateFilter(index, { value: e.target.value })}
                      placeholder="Value"
                      className="flex-1"
                    />
                    <Button
                      size="sm"
                      variant="ghost"
                      onClick={() => removeFilter(index)}
                      className="h-6 w-6 p-0 text-red-500 hover:text-red-700"
                    >
                      <X className="h-3 w-3" />
                    </Button>
                  </div>
                ))}
              </div>
            </div>

            {/* Sort */}
            <div>
              <div className="flex items-center justify-between">
                <Label className="text-xs font-medium uppercase tracking-wide">Sort</Label>
                <Button size="sm" variant="outline" onClick={addSort} className="h-6 px-2">
                  <Plus className="h-3 w-3 mr-1" />
                  Add Sort
                </Button>
              </div>
              <div className="mt-2 space-y-2">
                {value.data.sort.map((sort, index) => (
                  <div key={index} className="flex items-center space-x-2 p-2 border rounded">
                    <Input
                      value={sort.column}
                      onChange={(e) => updateSort(index, { column: e.target.value })}
                      placeholder="Column"
                      className="flex-1"
                    />
                    <Select
                      value={sort.direction}
                      onValueChange={(val) => updateSort(index, { direction: val as typeof sort.direction })}
                    >
                      <SelectTrigger className="w-24">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="asc">Ascending</SelectItem>
                        <SelectItem value="desc">Descending</SelectItem>
                      </SelectContent>
                    </Select>
                    <Button
                      size="sm"
                      variant="ghost"
                      onClick={() => removeSort(index)}
                      className="h-6 w-6 p-0 text-red-500 hover:text-red-700"
                    >
                      <X className="h-3 w-3" />
                    </Button>
                  </div>
                ))}
              </div>
            </div>
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
