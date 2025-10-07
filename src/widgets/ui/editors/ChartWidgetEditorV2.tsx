"use client";

import React, { useState, useEffect } from "react";
import { z } from "zod";
import { chartWidgetConfigSchema } from "@/widgets/schemas/chart-v2";
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
  Lightbulb,
  Plus,
  Trash2
} from "lucide-react";
import { DatabaseSelector } from "../components/DatabaseSelector";
import { Column } from "../components/types";
import { WidgetFilters } from "../components/WidgetFilters";
import { ChartDataProcessor, ValidationResult } from "@/widgets/processors/ChartDataProcessor";
import { cn } from "@/lib/utils";

interface ChartWidgetEditorV2Props {
  value: z.infer<typeof chartWidgetConfigSchema>;
  onChange: (value: z.infer<typeof chartWidgetConfigSchema>) => void;
  tenantId: number;
}

interface WizardStep {
  id: string;
  title: string;
  description: string;
  completed: boolean;
  required: boolean;
}

export const ChartWidgetEditorV2: React.FC<ChartWidgetEditorV2Props> = ({ 
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
      id: "columns",
      title: "Select Columns",
      description: "Map X and Y axis columns",
      completed: !!(value.data.mappings?.x && value.data.mappings?.y?.length),
      required: true,
    },
    {
      id: "aggregations",
      title: "Configure Pipelines",
      description: "Optional: Add aggregation pipelines",
      completed: true,
      required: false,
    },
    {
      id: "filters",
      title: "Configure Filters",
      description: "Add data filters (optional)",
      completed: true,
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
      mappings: {
        x: value.data.mappings?.x || "",
        y: Array.isArray(value.data.mappings?.y) ? value.data.mappings.y : [],
      },
      processing: {
        yColumnAggregations: value.settings.yColumnAggregations,
      },
      filters: (value.data.filters || []).filter((f: any) => f.column && f.operator && f.value !== undefined) as any,
      topN: value.settings.enableTopN ? {
        enabled: true,
        count: value.settings.topNCount || 10,
        autoSort: true,
      } : undefined,
    };

    const result = ChartDataProcessor.validate(config);
    setValidationResult(result);
  }, [value]);

  // Smart defaults when columns change
  useEffect(() => {
    if (availableColumns.length > 0 && !value.data.mappings?.x && !value.data.mappings?.y?.length) {
      const suggestion = ChartDataProcessor.getSuggestedConfig(availableColumns);
      
      if (suggestion.mappings?.x || suggestion.mappings?.y?.length) {
        updateData({
          mappings: {
            x: suggestion.mappings?.x || "",
            y: suggestion.mappings?.y || [],
          },
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

  const updateData = (updates: Partial<typeof value.data> & { settings?: Partial<typeof value.settings> }) => {
    const { settings, ...dataUpdates } = updates;
    onChange({
      ...value,
      data: { ...value.data, ...dataUpdates },
      ...(settings && { settings: { ...value.settings, ...settings } }),
    });
  };

  const handleFiltersChange = (filters: any[]) => {
    updateData({ filters });
  };

  const toggleYColumn = (columnName: string) => {
    const currentY = value.data.mappings?.y || [];
    const updated = currentY.includes(columnName)
      ? currentY.filter((c: string) => c !== columnName)
      : [...currentY, columnName];
    updateData({ 
      mappings: { 
        ...value.data.mappings, 
        y: updated 
      } 
    });
  };

  const getTooltipContent = (field: string): string => {
    const tooltips: Record<string, string> = {
      xAxis: "Column used for category labels on the X-axis (e.g., month, region, product)",
      yAxis: "Numeric columns used for values on the Y-axis (e.g., sales, revenue, count)",
      processingMode: "Raw: Display data as-is. Aggregated: Group and calculate summary values",
      groupBy: "Column to group data by when using aggregated mode",
      aggregationFunction: "How to combine values within each group",
      topN: "Show only the top N results, sorted by the first Y-axis column",
    };
    return tooltips[field] || "";
  };

  const renderWizardSteps = () => (
    <div className="mb-6">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-semibold">Configuration Wizard</h3>
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
                if (step.id === "columns") setActiveTab("data");
                if (step.id === "aggregations") setActiveTab("data");
                if (step.id === "filters") setActiveTab("data");
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
                  onDatabaseChange={(databaseId) => {
                    onChange({
                      ...value,
                      data: {
                        ...value.data,
                        databaseId,
                        tableId: "",
                        mappings: { y: [] }
                      }
                    });
                  }}
                  onTableChange={(tableId) => {
                    onChange({
                      ...value,
                      data: {
                        ...value.data,
                        tableId: tableId.toString(),
                        mappings: { y: [] }
                      }
                    });
                  }}
                  onColumnsChange={setAvailableColumns}
                />
              </CardContent>
            </Card>

            {/* Column Mappings */}
            {availableColumns.length > 0 && (
              <>
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <TrendingUp className="h-5 w-5" />
                      Column Mappings
                    </CardTitle>
                    <CardDescription>
                      Map your data columns to chart axes
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    {/* X Axis */}
                    <div>
                      <Label className="text-sm font-medium flex items-center gap-2">
                        X Axis (Category)
                        <div className="group relative">
                          <Info className="h-4 w-4 text-gray-400 cursor-help" />
                          <div className="absolute bottom-full left-1/2 transform -translate-x-1/2 mb-2 px-3 py-2 bg-gray-900 text-white text-xs rounded-lg opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap z-10">
                            {getTooltipContent("xAxis")}
                          </div>
                        </div>
                      </Label>
                      <Select
                        value={value.data.mappings?.x || undefined}
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
                                {column.name} ({column.type})
                              </SelectItem>
                            ))}
                        </SelectContent>
                      </Select>
                    </div>

                    {/* Y Axis - Multi-select */}
                    <div>
                      <Label className="text-sm font-medium flex items-center gap-2">
                        Y Axis (Values)
                        <div className="group relative">
                          <Info className="h-4 w-4 text-gray-400 cursor-help" />
                          <div className="absolute bottom-full left-1/2 transform -translate-x-1/2 mb-2 px-3 py-2 bg-gray-900 text-white text-xs rounded-lg opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap z-10">
                            {getTooltipContent("yAxis")}
                          </div>
                        </div>
                      </Label>
                      <div className="mt-2 space-y-2 max-h-40 overflow-y-auto border rounded-md p-3">
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
                                  {column.name} ({column.type})
                                </Label>
                              </div>
                            );
                          })}
                      </div>
                      {(!value.data.mappings?.y || value.data.mappings.y.length === 0) && (
                        <p className="text-xs text-amber-600 mt-2 flex items-center gap-1">
                          <AlertCircle className="h-3 w-3" />
                          Please select at least one Y axis column.
                        </p>
                      )}
                      {value.data.mappings?.y && value.data.mappings.y.length > 0 && (
                        <p className="text-xs text-green-600 mt-2 flex items-center gap-1">
                          <CheckCircle className="h-3 w-3" />
                          {value.data.mappings.y.length} column(s) selected
                        </p>
                      )}
                    </div>
                  </CardContent>
                </Card>

                {/* Chained Aggregations per Y Column */}
                {value.data.mappings?.y && value.data.mappings.y.length > 0 && (
                  <Card>
                    <CardHeader>
                      <CardTitle className="flex items-center gap-2">
                        <TrendingUp className="h-5 w-5" />
                        Y Column Aggregation Pipelines
                      </CardTitle>
                      <CardDescription>
                        Configure chained aggregation pipeline for each Y column. 
                        Data will be automatically grouped by X axis ({value.data.mappings.x}).
                      </CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-4">
                      {value.data.mappings.y.map((yColumn, yIndex) => {
                        const currentAggregations = value.settings.yColumnAggregations?.[yColumn] || [];
                        
                        const addYColumnAggregation = (column: string) => {
                          const current = value.settings.yColumnAggregations || {};
                          updateSettings({
                            yColumnAggregations: {
                              ...current,
                              [column]: [
                                ...(current[column] || []),
                                { function: "avg" as const, label: "Average" }
                              ]
                            }
                          });
                        };

                        const removeYColumnAggregation = (column: string, aggIndex: number) => {
                          const current = value.settings.yColumnAggregations || {};
                          const columnAggs = current[column] || [];
                          if (columnAggs.length > 1) {
                            updateSettings({
                              yColumnAggregations: {
                                ...current,
                                [column]: columnAggs.filter((_, i) => i !== aggIndex)
                              }
                            });
                          }
                        };

                        const updateYColumnAggregation = (column: string, aggIndex: number, updates: any) => {
                          const current = value.settings.yColumnAggregations || {};
                          const columnAggs = [...(current[column] || [])];
                          columnAggs[aggIndex] = { ...columnAggs[aggIndex], ...updates };
                          updateSettings({
                            yColumnAggregations: {
                              ...current,
                              [column]: columnAggs
                            }
                          });
                        };

                        return (
                          <Card key={yColumn} className="border-2 border-blue-100">
                            <CardHeader className="pb-3">
                              <div className="flex items-center justify-between">
                                <Badge variant="outline">{yColumn}</Badge>
                                <Button
                                  variant="outline"
                                  size="sm"
                                  onClick={() => addYColumnAggregation(yColumn)}
                                  className="flex items-center gap-1"
                                >
                                  <Plus className="h-3 w-3" />
                                  Add Step
                                </Button>
                              </div>
                            </CardHeader>
                            <CardContent className="space-y-2">
                              {currentAggregations.length > 0 ? (
                                currentAggregations.map((agg, aggIndex) => (
                                  <div key={aggIndex} className="flex items-center gap-2">
                                    <Badge variant="secondary" className="min-w-[60px] justify-center">
                                      Step {aggIndex + 1}
                                    </Badge>
                                    {aggIndex > 0 && <span className="text-muted-foreground">→</span>}
                                    <Select
                                      value={agg.function}
                                      onValueChange={(val) => updateYColumnAggregation(yColumn, aggIndex, { function: val })}
                                    >
                                      <SelectTrigger className="w-32">
                                        <SelectValue />
                                      </SelectTrigger>
                                      <SelectContent>
                                        <SelectItem value="sum">SUM</SelectItem>
                                        <SelectItem value="avg">AVG</SelectItem>
                                        <SelectItem value="count">COUNT</SelectItem>
                                        <SelectItem value="min">MIN</SelectItem>
                                        <SelectItem value="max">MAX</SelectItem>
                                      </SelectContent>
                                    </Select>
                                    <Input
                                      value={agg.label}
                                      onChange={(e) => updateYColumnAggregation(yColumn, aggIndex, { label: e.target.value })}
                                      placeholder="Label"
                                      className="flex-1"
                                    />
                                    {currentAggregations.length > 1 && (
                                      <Button
                                        variant="ghost"
                                        size="sm"
                                        onClick={() => removeYColumnAggregation(yColumn, aggIndex)}
                                        className="text-red-600 hover:text-red-700"
                                      >
                                        <Trash2 className="h-4 w-4" />
                                      </Button>
                                    )}
                                  </div>
                                ))
                              ) : (
                                <p className="text-xs text-muted-foreground text-center py-2">
                                  No pipeline configured. Using default aggregation.
                                </p>
                              )}
                            </CardContent>
                          </Card>
                        );
                      })}
                    </CardContent>
                  </Card>
                )}

                {/* Info Card - Auto Grouping */}
                {value.data.mappings?.y && value.data.mappings.y.length > 0 && (
                  <Alert>
                    <Info className="h-4 w-4" />
                    <AlertDescription className="text-xs">
                      <strong>Auto-Grouping:</strong> When you configure aggregation pipelines below, 
                      data will automatically be grouped by the X axis column ({value.data.mappings.x || 'not selected'}).
                    </AlertDescription>
                  </Alert>
                )}

                {/* Filters */}
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <Filter className="h-5 w-5" />
                      Data Filters
                    </CardTitle>
                    <CardDescription>
                      Filter your data before processing (optional)
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

                {/* Top N */}
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <Filter className="h-5 w-5" />
                      Top N Filtering
                    </CardTitle>
                    <CardDescription>
                      Show only the top N results (optional)
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="flex items-center justify-between">
                      <Label className="text-sm font-medium flex items-center gap-2">
                        Enable Top N
                        <div className="group relative">
                          <Info className="h-4 w-4 text-gray-400 cursor-help" />
                          <div className="absolute bottom-full left-1/2 transform -translate-x-1/2 mb-2 px-3 py-2 bg-gray-900 text-white text-xs rounded-lg opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap z-10">
                            {getTooltipContent("topN")}
                          </div>
                        </div>
                      </Label>
                      <Switch
                        checked={value.settings.enableTopN || false}
                        onCheckedChange={(checked) => updateSettings({ enableTopN: checked })}
                      />
                    </div>

                    {value.settings.enableTopN && (
                      <div>
                        <Label className="text-sm font-medium">Number of Results</Label>
                        <Input
                          type="number"
                          min="1"
                          max="100"
                          value={value.settings.topNCount || 10}
                          onChange={(e) => updateSettings({ topNCount: parseInt(e.target.value) || 10 })}
                          className="mt-1"
                        />
                        <p className="text-xs text-muted-foreground mt-1">
                          Results will be automatically sorted by the first Y-axis column in descending order.
                        </p>
                      </div>
                    )}
                  </CardContent>
                </Card>
              </>
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

            {/* Layout */}
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

            {/* Chart Options */}
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

        {/* Tab 3: Settings */}
        <TabsContent value="settings" className="space-y-4">
          <div className="space-y-4">
            <div>
              <Label htmlFor="chartType" className="text-sm font-medium">
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
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
};
