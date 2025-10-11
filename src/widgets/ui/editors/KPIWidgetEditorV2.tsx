"use client";

import React, { useState, useEffect, useMemo, useCallback } from "react";
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
import { KPIStyleEditor } from "./KPIStyleEditor";
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
  
  // Temporary color states to avoid updating on every onChange
  const [tempColors, setTempColors] = useState<Partial<typeof value.style>>({});

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
      id: "metric",
      title: "Configure KPI Metric",
      description: "Single metric with chained aggregations",
      completed: !!(value.data.metric?.field && value.data.metric?.aggregations?.length > 0),
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

  // Validate configuration whenever it changes - specific dependencies to avoid infinite loops
  useEffect(() => {
    if (!value.data.metric) {
      setValidationResult({ isValid: false, errors: ['No metric configured'], warnings: [] });
      return;
    }

    const config = {
      dataSource: {
        databaseId: value.data.databaseId || 0,
        tableId: value.data.tableId || "",
      },
      metric: value.data.metric,
      filters: (value.data.filters || []).filter(f => f.column && f.operator && f.value !== undefined) as any,
    };

    const result = KPIWidgetProcessor.validate(config);
    setValidationResult(result);
  }, [
    value.data.databaseId,
    value.data.tableId,
    value.data.metric?.field,
    value.data.metric?.aggregations?.length,
    value.data.filters?.length,
  ]);

  // Smart defaults when columns change
  useEffect(() => {
    if (availableColumns.length > 0 && !value.data.metric?.field) {
      // Auto-select first numeric column
      const numericColumn = availableColumns.find(col => 
        ['number', 'integer', 'decimal', 'float', 'double'].includes(col.type)
      );
      
      if (numericColumn) {
        onChange({
          ...value,
          data: {
            ...value.data,
            metric: {
              field: numericColumn.name,
              label: numericColumn.name.charAt(0).toUpperCase() + numericColumn.name.slice(1).replace(/_/g, ' '),
              aggregations: [{ function: "sum" as const, label: "Total" }],
              format: "number" as const,
              showTrend: true,
              showComparison: false,
            },
          },
        });
      }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [availableColumns.length]);

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
    onChange({
      ...value,
      data: { ...value.data, filters },
    });
  };

  // Single metric management
  const updateMetric = (updates: Partial<typeof value.data.metric>) => {
    onChange({ 
      ...value,
      data: {
        ...value.data,
        metric: { ...value.data.metric, ...updates } as any
      }
    });
  };

  // Aggregation pipeline management (chained)
  const addAggregation = () => {
    const currentAggregations = value.data.metric?.aggregations || [];
    onChange({
      ...value,
      data: {
        ...value.data,
        metric: {
          ...value.data.metric,
          aggregations: [...currentAggregations, {
            function: "avg" as const,
            label: "Average",
          }],
        } as any
      }
    });
  };

  const removeAggregation = (aggregationIndex: number) => {
    const currentAggregations = value.data.metric?.aggregations || [];
    // Allow removing even if it's the last aggregation
    onChange({
      ...value,
      data: {
        ...value.data,
        metric: {
          ...value.data.metric,
          aggregations: currentAggregations.filter((_, i) => i !== aggregationIndex),
        } as any
      }
    });
  };

  const updateAggregation = (
    aggregationIndex: number, 
    updates: any
  ) => {
    const currentAggregations = [...(value.data.metric?.aggregations || [])];
    
    // If function is being updated, auto-update label to match
    if (updates.function) {
      const labelMap: Record<string, string> = {
        sum: 'Total',
        avg: 'Average',
        count: 'Count',
        min: 'Minimum',
        max: 'Maximum',
      };
      updates.label = updates.label || labelMap[updates.function] || updates.function.toUpperCase();
    }
    
    currentAggregations[aggregationIndex] = {
      ...currentAggregations[aggregationIndex],
      ...updates,
    };
    onChange({
      ...value,
      data: {
        ...value.data,
        metric: {
          ...value.data.metric,
          aggregations: currentAggregations as any
        } as any
      }
    });
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
                if (step.id === "metric") setActiveTab("data");
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
                  onDatabaseChange={(databaseId) => {
                    onChange({
                      ...value,
                      data: {
                        ...value.data,
                        databaseId,
                        tableId: "",
                        metric: undefined
                      }
                    });
                  }}
                  onTableChange={(tableId) => {
                    onChange({
                      ...value,
                      data: {
                        ...value.data,
                        tableId: tableId.toString(),
                        metric: undefined
                      }
                    });
                  }}
                  onColumnsChange={setAvailableColumns}
                />
              </CardContent>
            </Card>

            {/* Single KPI Metric Configuration */}
            {availableColumns.length > 0 && (
              <Card>
                <CardHeader>
                  <div>
                    <CardTitle className="flex items-center gap-2">
                      <Target className="h-5 w-5" />
                      KPI Metric Configuration
                    </CardTitle>
                    <CardDescription>
                      Configure a single metric with chained aggregation pipeline
                    </CardDescription>
                  </div>
                </CardHeader>
                <CardContent className="space-y-6">
                  {value.data.metric ? (
                    <Card className="border-2 border-primary/20">
                      <CardContent className="pt-6 space-y-6">
                      {/* Field Selection */}
                      <div className="grid grid-cols-2 gap-4">
                        <div>
                          <Label className="text-sm font-medium flex items-center gap-2">
                            Value Column
                            <div className="group relative">
                              <Info className="h-4 w-4 text-gray-400 cursor-help" />
                              <div className="absolute bottom-full left-1/2 transform -translate-x-1/2 mb-2 px-3 py-2 bg-gray-900 text-white text-xs rounded-lg opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap z-10">
                                {getTooltipContent("field")}
                              </div>
                            </div>
                          </Label>
                          <Select
                            value={value.data.metric?.field || ""}
                            onValueChange={(val) => updateMetric({ field: val })}
                          >
                            <SelectTrigger className="mt-1">
                              <SelectValue placeholder="Select numeric column" />
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
                        <Label className="text-sm font-medium">Display Label</Label>
                        <Input
                          value={value.data.metric?.label || ""}
                          onChange={(e) => updateMetric({ label: e.target.value })}
                          placeholder="e.g., Total Revenue"
                          className="mt-1"
                        />
                      </div>
                    </div>

                    {/* Group By Field (Optional) */}
                    <div className="p-4 bg-blue-50 dark:bg-blue-950/20 rounded-lg border border-blue-200 dark:border-blue-800">
                      <div className="flex items-center gap-2 mb-3">
                        <BarChart3 className="h-4 w-4 text-blue-600" />
                        <Label className="text-sm font-semibold text-blue-900 dark:text-blue-100">
                          Group By (Optional)
                        </Label>
                      </div>
                      <p className="text-xs text-blue-700 dark:text-blue-300 mb-3">
                        Group rows by a column before aggregating. Example: Group by "country" then SUM "deaths" per country.
                      </p>
                      <Select
                        value={value.data.metric?.groupBy || "none"}
                        onValueChange={(val) => updateMetric({ groupBy: val === "none" ? undefined : val })}
                      >
                        <SelectTrigger className="bg-white dark:bg-gray-900">
                          <SelectValue placeholder="No grouping (aggregate all rows)" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="none">
                            <span className="text-muted-foreground italic">No grouping - aggregate all rows</span>
                          </SelectItem>
                          {availableColumns
                            .filter(col => col.name !== value.data.metric?.field) // Exclude the metric field itself
                            .map((column) => (
                              <SelectItem key={column.id} value={column.name}>
                                {column.name} ({column.type})
                              </SelectItem>
                            ))}
                        </SelectContent>
                      </Select>
                      {value.data.metric?.groupBy && (
                        <Alert className="mt-3">
                          <Info className="h-4 w-4" />
                          <AlertDescription className="text-xs">
                            <strong>Flow:</strong> Group by "{value.data.metric.groupBy}" → 
                            Apply pipeline to each group → 
                            Final aggregation across groups
                          </AlertDescription>
                        </Alert>
                      )}
                    </div>

                    {/* Aggregation Pipeline - Chained Functions */}
                      <div>
                        <div className="flex items-center justify-between mb-3">
                          <div>
                            <Label className="text-sm font-medium flex items-center gap-2">
                              Aggregation Pipeline (Chained)
                              <div className="group relative">
                                <Info className="h-4 w-4 text-gray-400 cursor-help" />
                                <div className="absolute bottom-full left-1/2 transform -translate-x-1/2 mb-2 px-3 py-2 bg-gray-900 text-white text-xs rounded-lg opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap z-10 max-w-xs">
                                  Functions are applied in sequence: Column → Function 1 → Function 2 → Result
                                </div>
                              </div>
                            </Label>
                            <p className="text-xs text-muted-foreground mt-1">
                              Each function processes the result from the previous step
                            </p>
                          </div>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={addAggregation}
                            className="flex items-center gap-2"
                          >
                            <Plus className="h-4 w-4" />
                            Add Step
                          </Button>
                        </div>

                        {/* Pipeline visualization */}
                        <div className="space-y-3">
                          {value.data.metric?.aggregations?.map((aggregation, aggIndex) => (
                            <div key={aggIndex} className="relative">
                              {/* Step indicator */}
                              <div className="flex items-center gap-3">
                                <div className="flex items-center gap-2 flex-1">
                                  <Badge variant="secondary" className="min-w-[60px] justify-center">
                                    Step {aggIndex + 1}
                                  </Badge>
                                  {aggIndex > 0 && (
                                    <TrendingDown className="h-4 w-4 text-muted-foreground rotate-90" />
                                  )}
                                  <Select
                                    value={aggregation.function}
                                    onValueChange={(val) => updateAggregation(aggIndex, { function: val as any })}
                                  >
                                    <SelectTrigger className="w-36">
                                      <SelectValue />
                                    </SelectTrigger>
                                    <SelectContent>
                                      <SelectItem value="sum">SUM</SelectItem>
                                      <SelectItem value="avg">AVERAGE</SelectItem>
                                      <SelectItem value="count">COUNT</SelectItem>
                                      <SelectItem value="min">MIN</SelectItem>
                                      <SelectItem value="max">MAX</SelectItem>
                                      <SelectItem value="first">FIRST</SelectItem>
                                      <SelectItem value="last">LAST</SelectItem>
                                    </SelectContent>
                                  </Select>
                                  <Input
                                    value={aggregation.label}
                                    onChange={(e) => updateAggregation(aggIndex, { label: e.target.value })}
                                    placeholder="Step label"
                                    className="flex-1"
                                  />
                                  <Button
                                    variant="ghost"
                                    size="sm"
                                    onClick={() => removeAggregation(aggIndex)}
                                    className="text-red-600 hover:text-red-700"
                                  >
                                    <Trash2 className="h-4 w-4" />
                                  </Button>
                                </div>
                              </div>
                            </div>
                          ))}
                        </div>

                        {/* Pipeline explanation */}
                        {(value.data.metric?.aggregations?.length || 0) > 1 && (
                          <Alert className="mt-4">
                            <Info className="h-4 w-4" />
                            <AlertDescription className="text-xs">
                              <strong>Pipeline flow:</strong> {value.data.metric?.field} → {' '}
                              {value.data.metric?.aggregations?.map((agg, idx) => (
                                <React.Fragment key={idx}>
                                  {idx > 0 && ' → '}
                                  <span className="font-semibold">{agg.function.toUpperCase()}</span>
                                </React.Fragment>
                              ))} → Final result
                            </AlertDescription>
                          </Alert>
                        )}
                      </div>

                      {/* Display Column (for single-row aggregations: max/min/first/last) */}
                      {value.data.metric?.aggregations?.length === 1 && 
                       ['max', 'min', 'first', 'last'].includes(value.data.metric.aggregations[0].function) && (
                        <div className="p-4 bg-purple-50 dark:bg-purple-950/20 rounded-lg border border-purple-200 dark:border-purple-800">
                          <div className="flex items-center gap-2 mb-3">
                            <Info className="h-4 w-4 text-purple-600" />
                            <Label className="text-sm font-semibold text-purple-900 dark:text-purple-100">
                              Display Alternative Column (Optional)
                            </Label>
                          </div>
                          <p className="text-xs text-purple-700 dark:text-purple-300 mb-3">
                            Since your aggregation returns a single row ({value.data.metric.aggregations[0].function.toUpperCase()}), 
                            you can display a different column from that row instead of the aggregated value.
                          </p>
                          <div className="grid grid-cols-2 gap-4">
                            <div>
                              <Label className="text-sm font-medium">Display Column</Label>
                              <Select
                                value={value.data.metric?.displayColumn || "none"}
                                onValueChange={(val) => updateMetric({ 
                                  displayColumn: val === "none" ? undefined : val,
                                  format: val === "none" ? value.data.metric?.format : 'text'
                                })}
                              >
                                <SelectTrigger className="mt-1 bg-white dark:bg-gray-900">
                                  <SelectValue placeholder="Use aggregated value" />
                                </SelectTrigger>
                                <SelectContent>
                                  <SelectItem value="none">
                                    <span className="text-muted-foreground italic">Use aggregated value</span>
                                  </SelectItem>
                                  {availableColumns
                                    .filter(col => col.name !== value.data.metric?.field)
                                    .map((column) => (
                                      <SelectItem key={column.id} value={column.name}>
                                        {column.name} ({column.type})
                                      </SelectItem>
                                    ))}
                                </SelectContent>
                              </Select>
                            </div>

                            {value.data.metric?.displayColumn && (
                              <div>
                                <Label className="text-sm font-medium">Display Format</Label>
                                <Select
                                  value={value.data.metric?.displayFormat || "text"}
                                  onValueChange={(val) => updateMetric({ displayFormat: val as any })}
                                >
                                  <SelectTrigger className="mt-1 bg-white dark:bg-gray-900">
                                    <SelectValue />
                                  </SelectTrigger>
                                  <SelectContent>
                                    <SelectItem value="text">Text</SelectItem>
                                    <SelectItem value="number">Number</SelectItem>
                                    <SelectItem value="currency">Currency</SelectItem>
                                    <SelectItem value="date">Date</SelectItem>
                                  </SelectContent>
                                </Select>
                              </div>
                            )}
                          </div>

                          {value.data.metric?.displayColumn && (
                            <Alert className="mt-3">
                              <Info className="h-4 w-4" />
                              <AlertDescription className="text-xs">
                                <strong>Example:</strong> If MAX(quantity) returns the row with quantity=100, 
                                and you select "product_name" as display column, 
                                it will show the product name from that row instead of "100".
                              </AlertDescription>
                            </Alert>
                          )}
                        </div>
                      )}

                      {/* Format and Options */}
                      <div className="grid grid-cols-2 gap-4 pt-4 border-t">
                        <div>
                          <Label className="text-sm font-medium">Number Format</Label>
                          <Select
                            value={value.data.metric?.format || "number"}
                            onValueChange={(val) => updateMetric({ format: val as any })}
                            disabled={!!value.data.metric?.displayColumn}
                          >
                            <SelectTrigger className="mt-1">
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="number">Number</SelectItem>
                              <SelectItem value="currency">Currency</SelectItem>
                              <SelectItem value="percentage">Percentage</SelectItem>
                              <SelectItem value="decimal">Decimal</SelectItem>
                              <SelectItem value="text">Text</SelectItem>
                            </SelectContent>
                          </Select>
                        </div>

                        <div>
                          <Label className="text-sm font-medium">Target Value (Optional)</Label>
                          <Input
                            type="number"
                            value={value.data.metric?.target || ""}
                            onChange={(e) => updateMetric({ 
                              target: e.target.value ? parseFloat(e.target.value) : undefined 
                            })}
                            placeholder="e.g., 1000000"
                            className="mt-1"
                          />
                        </div>
                      </div>

                      {/* Display Options */}
                      <div className="flex items-center gap-6 pt-4 border-t">
                        <div className="flex items-center space-x-2">
                          <Switch
                            id="trend"
                            checked={value.data.metric?.showTrend || false}
                            onCheckedChange={(checked) => updateMetric({ showTrend: checked })}
                          />
                          <Label htmlFor="trend" className="text-sm flex items-center gap-1 cursor-pointer">
                            <TrendingUp className="h-3 w-3" />
                            Show Trend
                          </Label>
                        </div>

                        <div className="flex items-center space-x-2">
                          <Switch
                            id="comparison"
                            checked={value.data.metric?.showComparison || false}
                            onCheckedChange={(checked) => updateMetric({ showComparison: checked })}
                          />
                          <Label htmlFor="comparison" className="text-sm flex items-center gap-1 cursor-pointer">
                            <Target className="h-3 w-3" />
                            Show Comparison
                          </Label>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                  ) : (
                    <div className="text-center py-8 text-gray-500">
                      <Target className="h-12 w-12 mx-auto mb-4 opacity-50" />
                      <p className="font-medium">No KPI metric configured</p>
                      <p className="text-sm mt-1">Select a data source to begin</p>
                    </div>
                  )}
                </CardContent>
              </Card>
            )}

            {/* Filters */}
            {availableColumns.length > 0 && value.data.metric?.field && (
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Filter className="h-5 w-5" />
                    Data Filters
                  </CardTitle>
                  <CardDescription>
                    Filter your data before calculating KPI (optional)
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
        <TabsContent value="style" className="space-y-4">
          <KPIStyleEditor 
            value={value.style} 
            onChange={(style) => onChange({ ...value, style })}
          />
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
