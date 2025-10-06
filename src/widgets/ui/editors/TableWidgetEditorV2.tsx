"use client";

import React, { useState, useEffect } from "react";
import { z } from "zod";
import { tableWidgetConfigSchemaV2 } from "@/widgets/schemas/table-v2";
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
  Table,
  BarChart3,
  Target,
  TrendingDown,
  Grid3X3,
  List,
  Hash,
  ArrowUpDown
} from "lucide-react";
import { DatabaseSelector } from "../components/DatabaseSelector";
import { Column } from "../components/types";
import { WidgetFilters } from "../components/WidgetFilters";
import { TableWidgetProcessor, ValidationResult } from "@/widgets/processors/TableWidgetProcessor";
import { cn } from "@/lib/utils";

interface TableWidgetEditorV2Props {
  value: z.infer<typeof tableWidgetConfigSchemaV2>;
  onChange: (value: z.infer<typeof tableWidgetConfigSchemaV2>) => void;
  tenantId: number;
}

interface WizardStep {
  id: string;
  title: string;
  description: string;
  completed: boolean;
  required: boolean;
}

export const TableWidgetEditorV2: React.FC<TableWidgetEditorV2Props> = ({ 
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
      title: "Configure Columns",
      description: "Select and configure table columns",
      completed: value.data.columns.length > 0,
      required: true,
    },
    {
      id: "aggregation",
      title: "Set Aggregation",
      description: "Configure column aggregations",
      completed: !value.settings.aggregation.enabled || value.settings.aggregation.columns.length > 0,
      required: false,
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
      aggregation: value.settings.aggregation,
      filters: (value.data.filters || []).filter(f => f.column && f.operator && f.value !== undefined) as any,
    };

    const result = TableWidgetProcessor.validate(config);
    setValidationResult(result);
  }, [value]);

  // Smart defaults when columns change
  useEffect(() => {
    if (availableColumns.length > 0 && value.data.columns.length === 0) {
      const suggestion = TableWidgetProcessor.getSuggestedConfig(availableColumns);
      
      // Auto-configure visible columns
      const visibleColumns = availableColumns.slice(0, 8).map(col => ({
        name: col.name,
        label: col.name.charAt(0).toUpperCase() + col.name.slice(1),
        visible: true,
        sortable: true,
        filterable: true,
        format: ['number', 'integer', 'decimal', 'float', 'double'].includes(col.type) ? 'number' as const : 'text' as const,
      }));

      updateData({
        columns: visibleColumns,
      });

      // Auto-suggest aggregation if numeric columns exist
      if (suggestion.aggregation?.columns) {
        updateSettings({
          aggregation: {
            ...value.settings.aggregation,
            ...suggestion.aggregation,
          }
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

  const addColumnAggregation = () => {
    const newAggregation = {
      column: "",
      aggregations: [{ function: "sum" as const, label: "Total" }],
    };
    updateSettings({
      aggregation: {
        ...value.settings.aggregation,
        columns: [...value.settings.aggregation.columns, newAggregation],
      }
    });
  };

  const removeColumnAggregation = (index: number) => {
    const updatedColumns = value.settings.aggregation.columns.filter((_, i) => i !== index);
    updateSettings({
      aggregation: {
        ...value.settings.aggregation,
        columns: updatedColumns,
      }
    });
  };

  const updateColumnAggregation = (index: number, updates: Partial<typeof value.settings.aggregation.columns[0]>) => {
    const updatedColumns = [...value.settings.aggregation.columns];
    updatedColumns[index] = { ...updatedColumns[index], ...updates };
    updateSettings({
      aggregation: {
        ...value.settings.aggregation,
        columns: updatedColumns,
      }
    });
  };

  const addAggregationFunction = (columnIndex: number) => {
    const updatedColumns = [...value.settings.aggregation.columns];
    updatedColumns[columnIndex].aggregations.push({
      function: "avg",
      label: "Average",
    });
    updateSettings({
      aggregation: {
        ...value.settings.aggregation,
        columns: updatedColumns,
      }
    });
  };

  const removeAggregationFunction = (columnIndex: number, functionIndex: number) => {
    const updatedColumns = [...value.settings.aggregation.columns];
    if (updatedColumns[columnIndex].aggregations.length > 1) {
      updatedColumns[columnIndex].aggregations.splice(functionIndex, 1);
      updateSettings({
        aggregation: {
          ...value.settings.aggregation,
          columns: updatedColumns,
        }
      });
    }
  };

  const updateAggregationFunction = (
    columnIndex: number, 
    functionIndex: number, 
    updates: Partial<typeof value.settings.aggregation.columns[0]['aggregations'][0]>
  ) => {
    const updatedColumns = [...value.settings.aggregation.columns];
    updatedColumns[columnIndex].aggregations[functionIndex] = {
      ...updatedColumns[columnIndex].aggregations[functionIndex],
      ...updates,
    };
    updateSettings({
      aggregation: {
        ...value.settings.aggregation,
        columns: updatedColumns,
      }
    });
  };

  const toggleColumnVisibility = (columnIndex: number) => {
    const updatedColumns = [...value.data.columns];
    updatedColumns[columnIndex].visible = !updatedColumns[columnIndex].visible;
    updateData({ columns: updatedColumns });
  };

  const getTooltipContent = (field: string): string => {
    const tooltips: Record<string, string> = {
      aggregation: "Enable aggregation to show summary rows and group totals",
      groupBy: "Group data by a specific column before aggregating",
      summaryRow: "Show a summary row with totals at the bottom",
      groupTotals: "Show totals for each group when using group by",
      columnAggregations: "Configure different aggregation functions for each column",
    };
    return tooltips[field] || "";
  };

  const renderWizardSteps = () => (
    <div className="mb-6">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-semibold">Table Configuration Wizard</h3>
        <Button
          variant="outline"
          size="sm"
          onClick={() => setShowWizard(!showWizard)}
        >
          {showWizard ? "Hide" : "Show"} Steps
        </Button>
      </div>
      
      {showWizard && (
        <div className="grid grid-cols-1 md:grid-cols-6 gap-3">
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
                if (step.id === "aggregation") setActiveTab("data");
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
                    columns: [] 
                  })}
                  onTableChange={(tableId) => updateData({ 
                    tableId: tableId.toString(), 
                    columns: [] 
                  })}
                  onColumnsChange={setAvailableColumns}
                />
              </CardContent>
            </Card>

            {/* Column Configuration */}
            {availableColumns.length > 0 && (
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Table className="h-5 w-5" />
                    Table Columns
                  </CardTitle>
                  <CardDescription>
                    Configure which columns to display and their properties
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    {availableColumns.map((column, index) => {
                      const configIndex = value.data.columns.findIndex(col => col.name === column.name);
                      const isConfigured = configIndex !== -1;
                      const columnConfig = isConfigured ? value.data.columns[configIndex] : null;

                      return (
                        <div key={column.id} className="flex items-center gap-4 p-3 border rounded-lg">
                          <div className="flex items-center gap-3 flex-1">
                            <Checkbox
                              checked={isConfigured && columnConfig?.visible !== false}
                              onCheckedChange={(checked) => {
                                if (checked && !isConfigured) {
                                  // Add new column
                                  const newColumn = {
                                    name: column.name,
                                    label: column.name.charAt(0).toUpperCase() + column.name.slice(1),
                                    visible: true,
                                    sortable: true,
                                    filterable: true,
                                    format: ['number', 'integer', 'decimal', 'float', 'double'].includes(column.type) ? 'number' as const : 'text' as const,
                                  };
                                  updateData({
                                    columns: [...value.data.columns, newColumn]
                                  });
                                } else if (!checked && isConfigured) {
                                  // Remove column
                                  updateData({
                                    columns: value.data.columns.filter((_, i) => i !== configIndex)
                                  });
                                }
                              }}
                            />
                            <div className="flex-1">
                              <div className="flex items-center gap-2">
                                <span className="font-medium">{column.name}</span>
                                <Badge variant="outline" className="text-xs">
                                  {column.type}
                                </Badge>
                              </div>
                              {columnConfig && (
                                <div className="mt-2 grid grid-cols-3 gap-2">
                                  <div>
                                    <Label className="text-xs">Display Label</Label>
                                    <Input
                                      value={columnConfig.label || column.name}
                                      onChange={(e) => {
                                        const updatedColumns = [...value.data.columns];
                                        updatedColumns[configIndex].label = e.target.value;
                                        updateData({ columns: updatedColumns });
                                      }}
                                      className="h-8 text-xs"
                                    />
                                  </div>
                                  <div>
                                    <Label className="text-xs">Format</Label>
                                    <Select
                                      value={columnConfig.format}
                                      onValueChange={(val) => {
                                        const updatedColumns = [...value.data.columns];
                                        updatedColumns[configIndex].format = val as any;
                                        updateData({ columns: updatedColumns });
                                      }}
                                    >
                                      <SelectTrigger className="h-8 text-xs">
                                        <SelectValue />
                                      </SelectTrigger>
                                      <SelectContent>
                                        <SelectItem value="text">Text</SelectItem>
                                        <SelectItem value="number">Number</SelectItem>
                                        <SelectItem value="currency">Currency</SelectItem>
                                        <SelectItem value="percentage">Percentage</SelectItem>
                                        <SelectItem value="date">Date</SelectItem>
                                        <SelectItem value="boolean">Boolean</SelectItem>
                                      </SelectContent>
                                    </Select>
                                  </div>
                                  <div className="flex items-center gap-2">
                                    <div className="flex items-center space-x-1">
                                      <Switch
                                        id={`sortable-${index}`}
                                        checked={columnConfig.sortable}
                                        onCheckedChange={(checked) => {
                                          const updatedColumns = [...value.data.columns];
                                          updatedColumns[configIndex].sortable = checked;
                                          updateData({ columns: updatedColumns });
                                        }}
                                        className="scale-75"
                                      />
                                      <Label htmlFor={`sortable-${index}`} className="text-xs">
                                        <ArrowUpDown className="h-3 w-3" />
                                      </Label>
                                    </div>
                                    <div className="flex items-center space-x-1">
                                      <Switch
                                        id={`filterable-${index}`}
                                        checked={columnConfig.filterable}
                                        onCheckedChange={(checked) => {
                                          const updatedColumns = [...value.data.columns];
                                          updatedColumns[configIndex].filterable = checked;
                                          updateData({ columns: updatedColumns });
                                        }}
                                        className="scale-75"
                                      />
                                      <Label htmlFor={`filterable-${index}`} className="text-xs">
                                        <Filter className="h-3 w-3" />
                                      </Label>
                                    </div>
                                  </div>
                                </div>
                              )}
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Aggregation Configuration */}
            {availableColumns.length > 0 && value.data.columns.length > 0 && (
              <Card>
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <div>
                      <CardTitle className="flex items-center gap-2">
                        <BarChart3 className="h-5 w-5" />
                        Column Aggregations
                      </CardTitle>
                      <CardDescription>
                        Configure aggregation functions for summary rows and group totals
                      </CardDescription>
                    </div>
                    <div className="flex items-center gap-2">
                      <Switch
                        checked={value.settings.aggregation.enabled}
                        onCheckedChange={(checked) => updateSettings({
                          aggregation: { ...value.settings.aggregation, enabled: checked }
                        })}
                      />
                      <Label className="text-sm">Enable Aggregation</Label>
                    </div>
                  </div>
                </CardHeader>
                
                {value.settings.aggregation.enabled && (
                  <CardContent className="space-y-4">
                    {/* Group By */}
                    <div>
                      <Label className="text-sm font-medium flex items-center gap-2">
                        Group By Column (Optional)
                        <div className="group relative">
                          <Info className="h-4 w-4 text-gray-400 cursor-help" />
                          <div className="absolute bottom-full left-1/2 transform -translate-x-1/2 mb-2 px-3 py-2 bg-gray-900 text-white text-xs rounded-lg opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap z-10">
                            {getTooltipContent("groupBy")}
                          </div>
                        </div>
                      </Label>
                      <Select
                        value={value.settings.aggregation.groupBy || "__none__"}
                        onValueChange={(val) => updateSettings({
                          aggregation: { ...value.settings.aggregation, groupBy: val === "__none__" ? undefined : val }
                        })}
                      >
                        <SelectTrigger className="mt-1">
                          <SelectValue placeholder="Select column to group by" />
                        </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="__none__">No grouping</SelectItem>
                        {availableColumns.map((column) => (
                          <SelectItem key={column.id} value={column.name}>
                            {column.name} ({column.type})
                          </SelectItem>
                        ))}
                        </SelectContent>
                      </Select>
                    </div>

                    {/* Column Aggregations */}
                    <div>
                      <div className="flex items-center justify-between mb-2">
                        <Label className="text-sm font-medium flex items-center gap-2">
                          Column Aggregations
                          <div className="group relative">
                            <Info className="h-4 w-4 text-gray-400 cursor-help" />
                            <div className="absolute bottom-full left-1/2 transform -translate-x-1/2 mb-2 px-3 py-2 bg-gray-900 text-white text-xs rounded-lg opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap z-10">
                              {getTooltipContent("columnAggregations")}
                            </div>
                          </div>
                        </Label>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={addColumnAggregation}
                          className="flex items-center gap-1"
                        >
                          <Plus className="h-3 w-3" />
                          Add Column
                        </Button>
                      </div>
                      
                      <div className="space-y-3">
                        {value.settings.aggregation.columns.map((columnAgg, columnIndex) => (
                          <Card key={columnIndex} className="border-2">
                            <CardHeader className="pb-3">
                              <div className="flex items-center justify-between">
                                <div className="flex items-center gap-2">
                                  <Badge variant="outline">Column {columnIndex + 1}</Badge>
                                  <BarChart3 className="h-4 w-4 text-blue-600" />
                                </div>
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  onClick={() => removeColumnAggregation(columnIndex)}
                                  className="text-red-600 hover:text-red-700"
                                >
                                  <Trash2 className="h-4 w-4" />
                                </Button>
                              </div>
                            </CardHeader>
                            <CardContent className="space-y-3">
                              {/* Column Selection */}
                              <div>
                                <Label className="text-sm font-medium">Column</Label>
                                <Select
                                  value={columnAgg.column}
                                  onValueChange={(val) => updateColumnAggregation(columnIndex, { column: val })}
                                >
                                  <SelectTrigger className="mt-1">
                                    <SelectValue placeholder="Select column to aggregate" />
                                  </SelectTrigger>
                                  <SelectContent>
                                    {availableColumns
                                      .filter(col => value.data.columns.some(configCol => configCol.name === col.name))
                                      .map((column) => (
                                        <SelectItem key={column.id} value={column.name}>
                                          {column.name} ({column.type})
                                        </SelectItem>
                                      ))}
                                  </SelectContent>
                                </Select>
                              </div>

                              {/* Aggregation Pipeline (Chained) */}
                              <div>
                                <div className="flex items-center justify-between mb-3">
                                  <div>
                                    <Label className="text-sm font-medium flex items-center gap-2">
                                      Aggregation Pipeline (Chained)
                                      <div className="group relative">
                                        <Info className="h-4 w-4 text-gray-400 cursor-help" />
                                        <div className="absolute bottom-full left-1/2 transform -translate-x-1/2 mb-2 px-3 py-2 bg-gray-900 text-white text-xs rounded-lg opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap z-10 max-w-xs">
                                          Functions are applied in sequence: Column → Step 1 → Step 2 → Result
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
                                    onClick={() => addAggregationFunction(columnIndex)}
                                    className="flex items-center gap-2"
                                  >
                                    <Plus className="h-4 w-4" />
                                    Add Step
                                  </Button>
                                </div>
                                <div className="space-y-3">
                                  {columnAgg.aggregations.map((aggregation, aggIndex) => (
                                    <div key={aggIndex} className="flex items-center gap-3">
                                      <Badge variant="secondary" className="min-w-[60px] justify-center">
                                        Step {aggIndex + 1}
                                      </Badge>
                                      {aggIndex > 0 && (
                                        <TrendingDown className="h-4 w-4 text-muted-foreground rotate-90" />
                                      )}
                                      <Select
                                        value={aggregation.function}
                                        onValueChange={(val) => updateAggregationFunction(columnIndex, aggIndex, { function: val as any })}
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
                                          <SelectItem value="first">First</SelectItem>
                                          <SelectItem value="last">Last</SelectItem>
                                        </SelectContent>
                                      </Select>
                                      <Input
                                        value={aggregation.label}
                                        onChange={(e) => updateAggregationFunction(columnIndex, aggIndex, { label: e.target.value })}
                                        placeholder="e.g., Total"
                                        className="flex-1"
                                      />
                                      {columnAgg.aggregations.length > 1 && (
                                        <Button
                                          variant="ghost"
                                          size="sm"
                                          onClick={() => removeAggregationFunction(columnIndex, aggIndex)}
                                          className="text-red-600 hover:text-red-700"
                                        >
                                          <Trash2 className="h-4 w-4" />
                                        </Button>
                                      )}
                                    </div>
                                  ))}
                                </div>

                                {/* Pipeline explanation */}
                                {columnAgg.aggregations.length > 1 && (
                                  <Alert className="mt-3">
                                    <Info className="h-4 w-4" />
                                    <AlertDescription className="text-xs">
                                      <strong>Pipeline flow:</strong> {columnAgg.column} → {' '}
                                      {columnAgg.aggregations.map((agg, idx) => (
                                        <React.Fragment key={idx}>
                                          {idx > 0 && ' → '}
                                          <span className="font-semibold">{agg.function.toUpperCase()}</span>
                                        </React.Fragment>
                                      ))} → Final result
                                    </AlertDescription>
                                  </Alert>
                                )}
                              </div>
                            </CardContent>
                          </Card>
                        ))}

                        {value.settings.aggregation.columns.length === 0 && (
                          <div className="text-center py-8 text-gray-500">
                            <BarChart3 className="h-12 w-12 mx-auto mb-4 opacity-50" />
                            <p>No column aggregations configured yet.</p>
                            <p className="text-sm">Click "Add Column" to get started.</p>
                          </div>
                        )}
                      </div>
                    </div>

                    {/* Aggregation Options */}
                    <div className="grid grid-cols-2 gap-4">
                      <div className="flex items-center space-x-2">
                        <Switch
                          id="showSummaryRow"
                          checked={value.settings.aggregation.showSummaryRow}
                          onCheckedChange={(checked) => updateSettings({
                            aggregation: { ...value.settings.aggregation, showSummaryRow: checked }
                          })}
                        />
                        <Label htmlFor="showSummaryRow" className="text-sm flex items-center gap-1">
                          <Table className="h-3 w-3" />
                          Show Summary Row
                        </Label>
                      </div>

                      <div className="flex items-center space-x-2">
                        <Switch
                          id="showGroupTotals"
                          checked={value.settings.aggregation.showGroupTotals}
                          onCheckedChange={(checked) => updateSettings({
                            aggregation: { ...value.settings.aggregation, showGroupTotals: checked }
                          })}
                        />
                        <Label htmlFor="showGroupTotals" className="text-sm flex items-center gap-1">
                          <Grid3X3 className="h-3 w-3" />
                          Show Group Totals
                        </Label>
                      </div>
                    </div>
                  </CardContent>
                )}
              </Card>
            )}

            {/* Filters */}
            {availableColumns.length > 0 && value.data.columns.length > 0 && (
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Filter className="h-5 w-5" />
                    Data Filters
                  </CardTitle>
                  <CardDescription>
                    Filter your data before displaying in the table (optional)
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
                  <Label className="text-xs">Border</Label>
                  <Input
                    type="color"
                    value={value.style.borderColor}
                    onChange={(e) => updateStyle({ borderColor: e.target.value })}
                    className="h-10 mt-1"
                  />
                </div>
                <div>
                  <Label className="text-xs">Header Background</Label>
                  <Input
                    type="color"
                    value={value.style.headerBackgroundColor}
                    onChange={(e) => updateStyle({ headerBackgroundColor: e.target.value })}
                    className="h-10 mt-1"
                  />
                </div>
              </div>
            </div>

            {/* Row Colors */}
            <div className="border-t pt-4">
              <h3 className="text-sm font-semibold mb-3">Row Colors</h3>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <Label className="text-xs">Even Rows</Label>
                  <Input
                    type="color"
                    value={value.style.evenRowColor}
                    onChange={(e) => updateStyle({ evenRowColor: e.target.value })}
                    className="h-10 mt-1"
                  />
                </div>
                <div>
                  <Label className="text-xs">Odd Rows</Label>
                  <Input
                    type="color"
                    value={value.style.oddRowColor}
                    onChange={(e) => updateStyle({ oddRowColor: e.target.value })}
                    className="h-10 mt-1"
                  />
                </div>
                <div>
                  <Label className="text-xs">Hover</Label>
                  <Input
                    type="color"
                    value={value.style.hoverRowColor}
                    onChange={(e) => updateStyle({ hoverRowColor: e.target.value })}
                    className="h-10 mt-1"
                  />
                </div>
                <div>
                  <Label className="text-xs">Selected</Label>
                  <Input
                    type="color"
                    value={value.style.selectedRowColor}
                    onChange={(e) => updateStyle({ selectedRowColor: e.target.value })}
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
                    value={value.style.fontSize}
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
                      <SelectItem value="xl">Extra Large</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div>
                  <Label className="text-xs">Header Font Size</Label>
                  <Select
                    value={value.style.headerFontSize}
                    onValueChange={(val) => updateStyle({ headerFontSize: val as any })}
                  >
                    <SelectTrigger className="mt-1">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="xs">Extra Small</SelectItem>
                      <SelectItem value="sm">Small</SelectItem>
                      <SelectItem value="base">Base</SelectItem>
                      <SelectItem value="lg">Large</SelectItem>
                      <SelectItem value="xl">Extra Large</SelectItem>
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
                    </SelectContent>
                  </Select>
                </div>

                <div className="flex items-center justify-between">
                  <Label className="text-xs">Striped Rows</Label>
                  <Switch
                    checked={value.style.stripedRows}
                    onCheckedChange={(checked) => updateStyle({ stripedRows: checked })}
                  />
                </div>

                <div className="flex items-center justify-between">
                  <Label className="text-xs">Hover Effects</Label>
                  <Switch
                    checked={value.style.hoverEffects}
                    onCheckedChange={(checked) => updateStyle({ hoverEffects: checked })}
                  />
                </div>
              </div>
            </div>
          </div>
        </TabsContent>

        {/* Tab 3: Settings */}
        <TabsContent value="settings" className="space-y-4">
          <div className="space-y-4">
            {/* Pagination */}
            <div className="border-b pb-4">
              <h3 className="text-sm font-semibold mb-3">Pagination</h3>
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <Label className="text-sm font-medium">Enable Pagination</Label>
                  <Switch
                    checked={value.settings.pagination.enabled}
                    onCheckedChange={(checked) => updateSettings({
                      pagination: { ...value.settings.pagination, enabled: checked }
                    })}
                  />
                </div>
                
                {value.settings.pagination.enabled && (
                  <div>
                    <Label htmlFor="pageSize" className="text-sm font-medium">
                      Page Size
                    </Label>
                    <Input
                      id="pageSize"
                      type="number"
                      min="1"
                      max="1000"
                      value={value.settings.pagination.pageSize}
                      onChange={(e) => updateSettings({
                        pagination: { ...value.settings.pagination, pageSize: Number(e.target.value) }
                      })}
                      className="mt-1"
                    />
                  </div>
                )}
              </div>
            </div>

            {/* Sorting */}
            <div className="border-b pb-4">
              <h3 className="text-sm font-semibold mb-3">Sorting</h3>
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <Label className="text-sm font-medium">Enable Sorting</Label>
                  <Switch
                    checked={value.settings.sorting.enabled}
                    onCheckedChange={(checked) => updateSettings({
                      sorting: { ...value.settings.sorting, enabled: checked }
                    })}
                  />
                </div>
                
                {value.settings.sorting.enabled && (
                  <div>
                    <Label className="text-sm font-medium">Default Sort Column</Label>
                    <Select
                      value={value.settings.sorting.defaultColumn || undefined}
                      onValueChange={(val) => updateSettings({
                        sorting: { ...value.settings.sorting, defaultColumn: val || undefined }
                      })}
                    >
                      <SelectTrigger className="mt-1">
                        <SelectValue placeholder="Select default sort column" />
                      </SelectTrigger>
                      <SelectContent>
                        {value.data.columns.map((column) => (
                          <SelectItem key={column.name} value={column.name}>
                            {column.label || column.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                )}
              </div>
            </div>

            {/* Display Options */}
            <div className="border-b pb-4">
              <h3 className="text-sm font-semibold mb-3">Display Options</h3>
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <Label className="text-sm font-medium">Show Row Numbers</Label>
                  <Switch
                    checked={value.settings.showRowNumbers}
                    onCheckedChange={(checked) => updateSettings({ showRowNumbers: checked })}
                  />
                </div>

                <div className="flex items-center justify-between">
                  <Label className="text-sm font-medium">Show Column Headers</Label>
                  <Switch
                    checked={value.settings.showColumnHeaders}
                    onCheckedChange={(checked) => updateSettings({ showColumnHeaders: checked })}
                  />
                </div>

                <div className="flex items-center justify-between">
                  <Label className="text-sm font-medium">Alternate Row Colors</Label>
                  <Switch
                    checked={value.settings.alternateRowColors}
                    onCheckedChange={(checked) => updateSettings({ alternateRowColors: checked })}
                  />
                </div>
              </div>
            </div>

            {/* Refresh */}
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
