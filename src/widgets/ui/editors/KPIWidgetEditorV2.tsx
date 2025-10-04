"use client";

import React, { useState, useEffect } from "react";
import { z } from "zod";
import { kpiWidgetConfigSchemaV2 } from "@/widgets/schemas/kpi-v2";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Checkbox } from "@/components/ui/checkbox";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { 
  TrendingUp, 
  Database, 
  Filter, 
  Settings, 
  Palette, 
  Info,
  CheckCircle,
  AlertCircle,
  Plus,
  Trash2,
  BarChart3,
  Target,
  TrendingDown
} from "lucide-react";
import { DatabaseSelector } from "../components/DatabaseSelector";
import { Column } from "../components/types";
import { WidgetFilters } from "../components/WidgetFilters";
import { KPIWidgetProcessor, ValidationResult } from "@/widgets/processors/KPIWidgetProcessor";
import { cn } from "@/lib/utils";

interface KPIWidgetEditorV2Props {
  value: z.infer<typeof kpiWidgetConfigSchemaV2>;
  onChange: (value: z.infer<typeof kpiWidgetConfigSchemaV2>) => void;
  tenantId: number;
}

interface WizardStep {
  id: string;
  title: string;
  description: string;
  completed: boolean;
  required: boolean;
}

export const KPIWidgetEditorV2: React.FC<KPIWidgetEditorV2Props> = ({ 
  value, 
  onChange, 
  tenantId 
}) => {
  const [activeTab, setActiveTab] = useState("data");
  const [availableColumns, setAvailableColumns] = useState<Column[]>([]);
  const [validationResult, setValidationResult] = useState<ValidationResult | null>(null);
  const [showWizard, setShowWizard] = useState(false);

  // Wizard steps configuration
  const wizardSteps: WizardStep[] = [
    {
      id: "datasource",
      title: "Choose Data Source",
      description: "Select database and table",
      completed: !!(value.data.databaseId && value.data.tableId),
      required: true,
    },
    {
      id: "metrics",
      title: "Configure Metrics",
      description: "Add KPI metrics with aggregations",
      completed: value.data.metrics.length > 0,
      required: true,
    },
    {
      id: "filters",
      title: "Configure Filters",
      description: "Add data filters (optional)",
      completed: true, // Optional step
      required: false,
    },
    {
      id: "style",
      title: "Customize Style",
      description: "Choose theme and layout",
      completed: true, // Always completed as it has defaults
      required: false,
    },
    {
      id: "preview",
      title: "Preview & Finish",
      description: "Review configuration",
      completed: validationResult?.isValid || false,
      required: true,
    },
  ];

  // Validate configuration whenever it changes
  useEffect(() => {
    const config = {
      dataSource: {
        databaseId: value.data.databaseId || 0,
        tableId: value.data.tableId || "",
      },
      metrics: value.data.metrics,
      filters: (value.data.filters || []).filter(f => f.column && f.operator && f.value !== undefined) as any,
    };

    const result = KPIWidgetProcessor.validate(config);
    setValidationResult(result);
  }, [value]);

  // Smart defaults when columns change
  useEffect(() => {
    if (availableColumns.length > 0 && value.data.metrics.length === 0) {
      const suggestion = KPIWidgetProcessor.getSuggestedConfig(availableColumns);
      
      if (suggestion.metrics && suggestion.metrics.length > 0) {
        updateData({
          metrics: suggestion.metrics.map(metric => ({
            ...metric,
            showTrend: metric.showTrend ?? true,
            showComparison: metric.showComparison ?? false,
            format: metric.format ?? "number",
          })),
        });
      }
    }
  }, [availableColumns]);

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

  const addMetric = () => {
    const newMetric = {
      field: "",
      label: "",
      aggregations: [{ function: "sum" as const, label: "Total" }],
      format: "number" as const,
      showTrend: true,
      showComparison: false,
    };
    updateData({
      metrics: [...value.data.metrics, newMetric],
    });
  };

  const removeMetric = (index: number) => {
    updateData({
      metrics: value.data.metrics.filter((_, i) => i !== index),
    });
  };

  const updateMetric = (index: number, updates: Partial<typeof value.data.metrics[0]>) => {
    const updatedMetrics = [...value.data.metrics];
    updatedMetrics[index] = { ...updatedMetrics[index], ...updates };
    updateData({ metrics: updatedMetrics });
  };

  const addAggregation = (metricIndex: number) => {
    const updatedMetrics = [...value.data.metrics];
    updatedMetrics[metricIndex].aggregations.push({
      function: "avg",
      label: "Average",
    });
    updateData({ metrics: updatedMetrics });
  };

  const removeAggregation = (metricIndex: number, aggregationIndex: number) => {
    const updatedMetrics = [...value.data.metrics];
    if (updatedMetrics[metricIndex].aggregations.length > 1) {
      updatedMetrics[metricIndex].aggregations.splice(aggregationIndex, 1);
      updateData({ metrics: updatedMetrics });
    }
  };

  const updateAggregation = (
    metricIndex: number, 
    aggregationIndex: number, 
    updates: Partial<typeof value.data.metrics[0]['aggregations'][0]>
  ) => {
    const updatedMetrics = [...value.data.metrics];
    updatedMetrics[metricIndex].aggregations[aggregationIndex] = {
      ...updatedMetrics[metricIndex].aggregations[aggregationIndex],
      ...updates,
    };
    updateData({ metrics: updatedMetrics });
  };

  const getTooltipContent = (field: string): string => {
    const tooltips: Record<string, string> = {
      field: "Select the numeric column to calculate metrics from",
      aggregations: "Add multiple aggregation functions (sum, avg, count, min, max) for the same field",
      format: "Choose how to display the numbers (currency, percentage, etc.)",
      trend: "Show trend comparison between first and second half of data",
      comparison: "Compare against target values with status indicators",
      target: "Set a target value to compare against",
    };
    return tooltips[field] || "";
  };

  const renderWizardSteps = () => (
    <div className="mb-6">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-semibold">KPI Configuration Wizard</h3>
        <Button
          variant="outline"
          size="sm"
          onClick={() => setShowWizard(!showWizard)}
        >
          {showWizard ? "Hide" : "Show"} Steps
        </Button>
      </div>
      
      {showWizard && (
        <div className="grid grid-cols-1 md:grid-cols-5 gap-3">
          {wizardSteps.map((step, index) => (
            <Card 
              key={step.id} 
              className={cn(
                "cursor-pointer transition-all",
                step.completed 
                  ? "border-green-200 bg-green-50" 
                  : "border-gray-200",
                step.required && !step.completed && "border-amber-200 bg-amber-50"
              )}
              onClick={() => {
                if (step.id === "datasource") setActiveTab("data");
                if (step.id === "metrics") setActiveTab("data");
                if (step.id === "filters") setActiveTab("data");
                if (step.id === "style") setActiveTab("style");
                if (step.id === "preview") setActiveTab("settings");
              }}
            >
              <CardContent className="p-3">
                <div className="flex items-center gap-2 mb-2">
                  <div className={cn(
                    "w-6 h-6 rounded-full flex items-center justify-center text-xs font-semibold",
                    step.completed 
                      ? "bg-green-500 text-white" 
                      : step.required 
                        ? "bg-amber-500 text-white" 
                        : "bg-gray-200 text-gray-600"
                  )}>
                    {step.completed ? <CheckCircle className="w-3 h-3" /> : index + 1}
                  </div>
                  <Badge variant={step.completed ? "default" : step.required ? "secondary" : "outline"}>
                    {step.required ? "Required" : "Optional"}
                  </Badge>
                </div>
                <h4 className="font-medium text-sm">{step.title}</h4>
                <p className="text-xs text-gray-600 mt-1">{step.description}</p>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );

  const renderValidationAlerts = () => {
    if (!validationResult) return null;

    return (
      <div className="space-y-2">
        {validationResult.errors.length > 0 && (
          <Alert variant="destructive">
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>
              <div className="font-medium mb-1">Configuration Errors:</div>
              <ul className="list-disc list-inside space-y-1">
                {validationResult.errors.map((error, index) => (
                  <li key={index} className="text-sm">{error}</li>
                ))}
              </ul>
            </AlertDescription>
          </Alert>
        )}
        
        {validationResult.warnings.length > 0 && (
          <Alert>
            <Info className="h-4 w-4" />
            <AlertDescription>
              <div className="font-medium mb-1">Warnings:</div>
              <ul className="list-disc list-inside space-y-1">
                {validationResult.warnings.map((warning, index) => (
                  <li key={index} className="text-sm">{warning}</li>
                ))}
              </ul>
            </AlertDescription>
          </Alert>
        )}

        {validationResult.isValid && (
          <Alert className="border-green-200 bg-green-50">
            <CheckCircle className="h-4 w-4 text-green-600" />
            <AlertDescription className="text-green-800">
              Configuration is valid and ready to use!
            </AlertDescription>
          </Alert>
        )}
      </div>
    );
  };

  return (
    <div className="space-y-6">
      {renderWizardSteps()}
      {renderValidationAlerts()}

      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="data" className="flex items-center gap-2">
            <Database className="h-4 w-4" />
            Data
          </TabsTrigger>
          <TabsTrigger value="style" className="flex items-center gap-2">
            <Palette className="h-4 w-4" />
            Style
          </TabsTrigger>
          <TabsTrigger value="settings" className="flex items-center gap-2">
            <Settings className="h-4 w-4" />
            Settings
          </TabsTrigger>
        </TabsList>

        {/* Tab 1: Data */}
        <TabsContent value="data" className="space-y-6">
          <div className="space-y-6">
            {/* Data Source */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Database className="h-5 w-5" />
                  Data Source
                </CardTitle>
                <CardDescription>
                  Select the database and table containing your data
                </CardDescription>
              </CardHeader>
              <CardContent>
                <DatabaseSelector
                  tenantId={tenantId}
                  selectedDatabaseId={value.data.databaseId}
                  selectedTableId={Number(value.data.tableId)}
                  onDatabaseChange={(databaseId) => updateData({ 
                    databaseId, 
                    tableId: "", 
                    metrics: [] 
                  })}
                  onTableChange={(tableId) => updateData({ 
                    tableId: tableId.toString(), 
                    metrics: [] 
                  })}
                  onColumnsChange={setAvailableColumns}
                />
              </CardContent>
            </Card>

            {/* Metrics Configuration */}
            {availableColumns.length > 0 && (
              <Card>
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <div>
                      <CardTitle className="flex items-center gap-2">
                        <BarChart3 className="h-5 w-5" />
                        KPI Metrics
                      </CardTitle>
                      <CardDescription>
                        Configure metrics with multiple aggregation functions
                      </CardDescription>
                    </div>
                    <Button onClick={addMetric} size="sm" className="flex items-center gap-2">
                      <Plus className="h-4 w-4" />
                      Add Metric
                    </Button>
                  </div>
                </CardHeader>
                <CardContent className="space-y-4">
                  {value.data.metrics.map((metric, metricIndex) => (
                    <Card key={metricIndex} className="border-2">
                      <CardHeader className="pb-3">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-2">
                            <Badge variant="outline">Metric {metricIndex + 1}</Badge>
                            <TrendingUp className="h-4 w-4 text-green-600" />
                          </div>
                          {value.data.metrics.length > 1 && (
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => removeMetric(metricIndex)}
                              className="text-red-600 hover:text-red-700"
                            >
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          )}
                        </div>
                      </CardHeader>
                      <CardContent className="space-y-4">
                        {/* Field Selection */}
                        <div className="grid grid-cols-2 gap-3">
                          <div>
                            <Label className="text-sm font-medium flex items-center gap-2">
                              Value Field
                              <div className="group relative">
                                <Info className="h-4 w-4 text-gray-400 cursor-help" />
                                <div className="absolute bottom-full left-1/2 transform -translate-x-1/2 mb-2 px-3 py-2 bg-gray-900 text-white text-xs rounded-lg opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap z-10">
                                  {getTooltipContent("field")}
                                </div>
                              </div>
                            </Label>
                            <Select
                              value={metric.field}
                              onValueChange={(val) => updateMetric(metricIndex, { field: val })}
                            >
                              <SelectTrigger className="mt-1">
                                <SelectValue placeholder="Select value field" />
                              </SelectTrigger>
                              <SelectContent>
                                {availableColumns
                                  .filter(col => ['number', 'integer', 'decimal', 'float', 'double'].includes(col.type))
                                  .map((column) => (
                                    <SelectItem key={column.id} value={column.name}>
                                      {column.name} ({column.type})
                                    </SelectItem>
                                  ))}
                              </SelectContent>
                            </Select>
                          </div>

                          <div>
                            <Label className="text-sm font-medium flex items-center gap-2">
                              Group By (Optional)
                              <div className="group relative">
                                <Info className="h-4 w-4 text-gray-400 cursor-help" />
                                <div className="absolute bottom-full left-1/2 transform -translate-x-1/2 mb-2 px-3 py-2 bg-gray-900 text-white text-xs rounded-lg opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap z-10">
                                  Group data before aggregating (e.g., group by product, then sum quantity)
                                </div>
                              </div>
                            </Label>
                            <Select
                              value={metric.groupBy || ""}
                              onValueChange={(val) => updateMetric(metricIndex, { groupBy: val || undefined })}
                            >
                              <SelectTrigger className="mt-1">
                                <SelectValue placeholder="Select group field" />
                              </SelectTrigger>
                              <SelectContent>
                                <SelectItem value="">No grouping</SelectItem>
                                {availableColumns.map((column) => (
                                  <SelectItem key={column.id} value={column.name}>
                                    {column.name} ({column.type})
                                  </SelectItem>
                                ))}
                              </SelectContent>
                            </Select>
                          </div>
                        </div>

                        {/* Label */}
                        <div>
                          <Label className="text-sm font-medium">Display Label</Label>
                          <Input
                            value={metric.label}
                            onChange={(e) => updateMetric(metricIndex, { label: e.target.value })}
                            placeholder="e.g., Total Revenue"
                            className="mt-1"
                          />
                        </div>

                        {/* Aggregations */}
                        <div>
                          <div className="flex items-center justify-between mb-2">
                            <Label className="text-sm font-medium flex items-center gap-2">
                              Aggregations
                              <div className="group relative">
                                <Info className="h-4 w-4 text-gray-400 cursor-help" />
                                <div className="absolute bottom-full left-1/2 transform -translate-x-1/2 mb-2 px-3 py-2 bg-gray-900 text-white text-xs rounded-lg opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap z-10">
                                  {getTooltipContent("aggregations")}
                                </div>
                              </div>
                            </Label>
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => addAggregation(metricIndex)}
                              className="flex items-center gap-1"
                            >
                              <Plus className="h-3 w-3" />
                              Add
                            </Button>
                          </div>
                          <div className="space-y-2">
                            {metric.aggregations.map((aggregation, aggIndex) => (
                              <div key={aggIndex} className="flex items-center gap-2 p-2 border rounded-md">
                                <Select
                                  value={aggregation.function}
                                  onValueChange={(val) => updateAggregation(metricIndex, aggIndex, { function: val as any })}
                                >
                                  <SelectTrigger className="w-32">
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
                                <Input
                                  value={aggregation.label}
                                  onChange={(e) => updateAggregation(metricIndex, aggIndex, { label: e.target.value })}
                                  placeholder="e.g., Total"
                                  className="flex-1"
                                />
                                {metric.aggregations.length > 1 && (
                                  <Button
                                    variant="ghost"
                                    size="sm"
                                    onClick={() => removeAggregation(metricIndex, aggIndex)}
                                    className="text-red-600 hover:text-red-700"
                                  >
                                    <Trash2 className="h-4 w-4" />
                                  </Button>
                                )}
                              </div>
                            ))}
                          </div>
                        </div>

                        {/* Format and Options */}
                        <div className="grid grid-cols-2 gap-4">
                          <div>
                            <Label className="text-sm font-medium flex items-center gap-2">
                              Format
                              <div className="group relative">
                                <Info className="h-4 w-4 text-gray-400 cursor-help" />
                                <div className="absolute bottom-full left-1/2 transform -translate-x-1/2 mb-2 px-3 py-2 bg-gray-900 text-white text-xs rounded-lg opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap z-10">
                                  {getTooltipContent("format")}
                                </div>
                              </div>
                            </Label>
                            <Select
                              value={metric.format}
                              onValueChange={(val) => updateMetric(metricIndex, { format: val as any })}
                            >
                              <SelectTrigger className="mt-1">
                                <SelectValue />
                              </SelectTrigger>
                              <SelectContent>
                                <SelectItem value="number">Number</SelectItem>
                                <SelectItem value="currency">Currency</SelectItem>
                                <SelectItem value="percentage">Percentage</SelectItem>
                                <SelectItem value="decimal">Decimal</SelectItem>
                              </SelectContent>
                            </Select>
                          </div>

                          <div>
                            <Label className="text-sm font-medium">Target Value (Optional)</Label>
                            <Input
                              type="number"
                              value={metric.target || ""}
                              onChange={(e) => updateMetric(metricIndex, { 
                                target: e.target.value ? parseFloat(e.target.value) : undefined 
                              })}
                              placeholder="e.g., 1000000"
                              className="mt-1"
                            />
                          </div>
                        </div>

                        {/* Options */}
                        <div className="flex items-center gap-6">
                          <div className="flex items-center space-x-2">
                            <Switch
                              id={`trend-${metricIndex}`}
                              checked={metric.showTrend}
                              onCheckedChange={(checked) => updateMetric(metricIndex, { showTrend: checked })}
                            />
                            <Label htmlFor={`trend-${metricIndex}`} className="text-sm flex items-center gap-1">
                              <TrendingUp className="h-3 w-3" />
                              Show Trend
                            </Label>
                          </div>

                          <div className="flex items-center space-x-2">
                            <Switch
                              id={`comparison-${metricIndex}`}
                              checked={metric.showComparison}
                              onCheckedChange={(checked) => updateMetric(metricIndex, { showComparison: checked })}
                            />
                            <Label htmlFor={`comparison-${metricIndex}`} className="text-sm flex items-center gap-1">
                              <Target className="h-3 w-3" />
                              Show Comparison
                            </Label>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  ))}

                  {value.data.metrics.length === 0 && (
                    <div className="text-center py-8 text-gray-500">
                      <BarChart3 className="h-12 w-12 mx-auto mb-4 opacity-50" />
                      <p>No metrics configured yet.</p>
                      <p className="text-sm">Click "Add Metric" to get started.</p>
                    </div>
                  )}
                </CardContent>
              </Card>
            )}

            {/* Filters */}
            {availableColumns.length > 0 && value.data.metrics.length > 0 && (
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Filter className="h-5 w-5" />
                    Data Filters
                  </CardTitle>
                  <CardDescription>
                    Filter your data before calculating KPIs (optional)
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <WidgetFilters
                    filters={value.data.filters}
                    availableColumns={availableColumns}
                    onChange={handleFiltersChange}
                  />
                </CardContent>
              </Card>
            )}
          </div>
        </TabsContent>

        {/* Tab 2: Style */}
        <TabsContent value="style" className="space-y-4 max-h-[600px] overflow-y-auto">
          <div className="space-y-6">
            {/* Theme Selection */}
            <div>
              <h3 className="text-sm font-semibold mb-3 flex items-center gap-2">
                <Palette className="h-4 w-4" />
                Premium Theme
              </h3>
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

            {/* Layout */}
            <div className="border-t pt-4">
              <h3 className="text-sm font-semibold mb-3">Layout</h3>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <Label className="text-xs">Layout Style</Label>
                  <Select
                    value={value.settings.layout}
                    onValueChange={(val) => updateSettings({ layout: val as any })}
                  >
                    <SelectTrigger className="mt-1">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="grid">Grid</SelectItem>
                      <SelectItem value="list">List</SelectItem>
                      <SelectItem value="cards">Cards</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div>
                  <Label className="text-xs">Columns</Label>
                  <Select
                    value={value.settings.columns.toString()}
                    onValueChange={(val) => updateSettings({ columns: parseInt(val) })}
                  >
                    <SelectTrigger className="mt-1">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="1">1 Column</SelectItem>
                      <SelectItem value="2">2 Columns</SelectItem>
                      <SelectItem value="3">3 Columns</SelectItem>
                      <SelectItem value="4">4 Columns</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
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
                  <Label className="text-xs">Positive</Label>
                  <Input
                    type="color"
                    value={value.style.positiveColor}
                    onChange={(e) => updateStyle({ positiveColor: e.target.value })}
                    className="h-10 mt-1"
                  />
                </div>
                <div>
                  <Label className="text-xs">Negative</Label>
                  <Input
                    type="color"
                    value={value.style.negativeColor}
                    onChange={(e) => updateStyle({ negativeColor: e.target.value })}
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
                  <Label className="text-xs">Value Size</Label>
                  <Select
                    value={value.style.valueSize}
                    onValueChange={(val) => updateStyle({ valueSize: val as any })}
                  >
                    <SelectTrigger className="mt-1">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="sm">Small</SelectItem>
                      <SelectItem value="md">Medium</SelectItem>
                      <SelectItem value="lg">Large</SelectItem>
                      <SelectItem value="xl">XL</SelectItem>
                      <SelectItem value="2xl">2XL</SelectItem>
                      <SelectItem value="3xl">3XL</SelectItem>
                      <SelectItem value="4xl">4XL</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div>
                  <Label className="text-xs">Label Size</Label>
                  <Select
                    value={value.style.labelSize}
                    onValueChange={(val) => updateStyle({ labelSize: val as any })}
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
              </div>
            </div>

            {/* Effects */}
            <div className="border-t pt-4">
              <h3 className="text-sm font-semibold mb-3">Effects</h3>
              <div className="space-y-3">
                <div>
                  <Label className="text-xs">Shadow</Label>
                  <Select
                    value={value.style.shadow}
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
                    checked={value.style.glassEffect}
                    onCheckedChange={(checked) => updateStyle({ glassEffect: checked })}
                  />
                </div>

                <div className="flex items-center justify-between">
                  <Label className="text-xs">Shine Effect</Label>
                  <Switch
                    checked={value.style.shine}
                    onCheckedChange={(checked) => updateStyle({ shine: checked })}
                  />
                </div>

                <div className="flex items-center justify-between">
                  <Label className="text-xs">Glow Effect</Label>
                  <Switch
                    checked={value.style.glow}
                    onCheckedChange={(checked) => updateStyle({ glow: checked })}
                  />
                </div>
              </div>
            </div>
          </div>
        </TabsContent>

        {/* Tab 3: Settings */}
        <TabsContent value="settings" className="space-y-4">
          <div className="space-y-4">
            <div>
              <Label htmlFor="refreshInterval" className="text-sm font-medium">
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

            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <Label className="text-sm font-medium">Show Trends</Label>
                <Switch
                  checked={value.settings.showTrend}
                  onCheckedChange={(checked) => updateSettings({ showTrend: checked })}
                />
              </div>

              <div className="flex items-center justify-between">
                <Label className="text-sm font-medium">Show Comparisons</Label>
                <Switch
                  checked={value.settings.showComparison}
                  onCheckedChange={(checked) => updateSettings({ showComparison: checked })}
                />
              </div>

              <div className="flex items-center justify-between">
                <Label className="text-sm font-medium">Show Targets</Label>
                <Switch
                  checked={value.settings.showTargets}
                  onCheckedChange={(checked) => updateSettings({ showTargets: checked })}
                />
              </div>
            </div>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
};
