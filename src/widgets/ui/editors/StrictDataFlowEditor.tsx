"use client";

import React, { useState, useEffect } from "react";
import { z } from "zod";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { Checkbox } from "@/components/ui/checkbox";
import { Badge } from "@/components/ui/badge";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Progress } from "@/components/ui/progress";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { 
  Database, 
  Table, 
  Columns, 
  Calculator, 
  Filter, 
  Eye, 
  CheckCircle, 
  AlertCircle,
  ArrowRight,
  Info
} from "lucide-react";
import { DatabaseSelector } from "../components/DatabaseSelector";
import { Column } from "../components/types";
import { WidgetFilters } from "../components/WidgetFilters";
import { 
  strictDataFlowSchema, 
  StrictDataFlowConfig, 
  createDefaultDataFlowConfig,
  updateFlowState,
  validateDataFlow 
} from "@/widgets/schemas/strictDataFlow";

interface StrictDataFlowEditorProps {
  value: StrictDataFlowConfig;
  onChange: (value: StrictDataFlowConfig) => void;
  tenantId: number;
  widgetType: "chart" | "kpi" | "table";
}

// Step configuration components
interface StepProps {
  step: number;
  title: string;
  description: string;
  icon: React.ReactNode;
  isCompleted: boolean;
  isActive: boolean;
  canAccess: boolean;
  onActivate: () => void;
}

const StepIndicator: React.FC<StepProps> = ({
  step,
  title,
  description,
  icon,
  isCompleted,
  isActive,
  canAccess,
  onActivate
}) => {
  return (
    <div 
      className={`relative flex items-center space-x-4 p-4 rounded-lg border transition-all cursor-pointer ${
        isActive ? 'border-blue-500 bg-blue-50' : 
        isCompleted ? 'border-green-500 bg-green-50' :
        canAccess ? 'border-gray-200 hover:border-gray-300' : 'border-gray-100 bg-gray-50'
      }`}
      onClick={canAccess ? onActivate : undefined}
    >
      <div className={`flex-shrink-0 w-10 h-10 rounded-full flex items-center justify-center ${
        isCompleted ? 'bg-green-500 text-white' :
        isActive ? 'bg-blue-500 text-white' :
        canAccess ? 'bg-gray-200 text-gray-600' : 'bg-gray-100 text-gray-400'
      }`}>
        {isCompleted ? <CheckCircle className="w-5 h-5" /> : icon}
      </div>
      <div className="flex-1 min-w-0">
        <div className="flex items-center space-x-2">
          <h3 className="text-sm font-medium text-gray-900">{title}</h3>
          {isCompleted && <CheckCircle className="w-4 h-4 text-green-500" />}
        </div>
        <p className="text-sm text-gray-500">{description}</p>
      </div>
      {canAccess && !isActive && (
        <ArrowRight className="w-4 h-4 text-gray-400" />
      )}
    </div>
  );
};

export const StrictDataFlowEditor: React.FC<StrictDataFlowEditorProps> = ({
  value,
  onChange,
  tenantId,
  widgetType
}) => {
  const [activeStep, setActiveStep] = useState(1);
  const [availableColumns, setAvailableColumns] = useState<Column[]>([]);
  const [validationResult, setValidationResult] = useState<{
    isValid: boolean;
    errors: string[];
    warnings: string[];
  }>({ isValid: true, errors: [], warnings: [] });

  // Update validation when configuration changes
  useEffect(() => {
    const result = validateDataFlow(value);
    setValidationResult(result);
  }, [value]);

  // Update flow state when configuration changes
  const updateConfig = (updates: Partial<StrictDataFlowConfig>) => {
    const updatedConfig = updateFlowState(value, updates);
    onChange(updatedConfig as StrictDataFlowConfig);
  };

  // Step definitions
  const steps = [
    {
      number: 1,
      title: "Data Source",
      description: "Select database and table",
      icon: <Database className="w-5 h-5" />,
      isCompleted: value.flowState.dataSourceConfigured,
      canAccess: true
    },
    {
      number: 2,
      title: "Column Selection",
      description: "Choose columns to work with",
      icon: <Columns className="w-5 h-5" />,
      isCompleted: value.flowState.columnsConfigured,
      canAccess: value.flowState.dataSourceConfigured
    },
    {
      number: 3,
      title: "Aggregation",
      description: "Apply aggregation functions",
      icon: <Calculator className="w-5 h-5" />,
      isCompleted: value.flowState.aggregationConfigured,
      canAccess: value.flowState.columnsConfigured
    },
    {
      number: 4,
      title: "Secondary Functions",
      description: "Apply post-aggregation functions",
      icon: <Calculator className="w-5 h-5" />,
      isCompleted: value.flowState.secondaryFunctionsConfigured || false,
      canAccess: value.flowState.aggregationConfigured
    },
    {
      number: 5,
      title: "Filtering",
      description: "Apply WHERE, HAVING, and post-processing filters",
      icon: <Filter className="w-5 h-5" />,
      isCompleted: value.flowState.filteringConfigured || false,
      canAccess: value.flowState.aggregationConfigured
    },
    {
      number: 6,
      title: "Output Configuration",
      description: "Configure final output format",
      icon: <Eye className="w-5 h-5" />,
      isCompleted: value.flowState.outputConfigured,
      canAccess: value.flowState.aggregationConfigured
    }
  ];

  // Calculate progress
  const completedSteps = steps.filter(step => step.isCompleted).length;
  const progress = (completedSteps / steps.length) * 100;

  return (
    <div className="space-y-6">
      {/* Header with progress */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <Database className="w-5 h-5" />
            <span>Strict Data Flow Configuration</span>
          </CardTitle>
          <CardDescription>
            Configure your widget data processing pipeline step by step. Each step must be completed before proceeding to the next.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <span className="text-sm font-medium">Progress</span>
              <span className="text-sm text-gray-500">{completedSteps} of {steps.length} steps completed</span>
            </div>
            <Progress value={progress} className="w-full" />
          </div>
        </CardContent>
      </Card>

      {/* Validation alerts */}
      {validationResult.errors.length > 0 && (
        <Alert className="border-red-200 bg-red-50">
          <AlertCircle className="h-4 w-4 text-red-600" />
          <AlertDescription>
            <div className="space-y-1">
              <p className="font-medium text-red-800">Configuration Errors:</p>
              {validationResult.errors.map((error, index) => (
                <p key={index} className="text-sm text-red-700">• {error}</p>
              ))}
            </div>
          </AlertDescription>
        </Alert>
      )}

      {validationResult.warnings.length > 0 && (
        <Alert className="border-yellow-200 bg-yellow-50">
          <Info className="h-4 w-4 text-yellow-600" />
          <AlertDescription>
            <div className="space-y-1">
              <p className="font-medium text-yellow-800">Warnings:</p>
              {validationResult.warnings.map((warning, index) => (
                <p key={index} className="text-sm text-yellow-700">• {warning}</p>
              ))}
            </div>
          </AlertDescription>
        </Alert>
      )}

      {/* Step indicators */}
      <div className="space-y-3">
        {steps.map((step) => (
          <StepIndicator
            key={step.number}
            step={step.number}
            title={step.title}
            description={step.description}
            icon={step.icon}
            isCompleted={step.isCompleted}
            isActive={activeStep === step.number}
            canAccess={step.canAccess}
            onActivate={() => setActiveStep(step.number)}
          />
        ))}
      </div>

      {/* Step content */}
      <Card>
        <CardContent className="pt-6">
          {activeStep === 1 && (
            <div className="space-y-4">
              <h3 className="text-lg font-semibold">Step 1: Data Source</h3>
              <p className="text-sm text-gray-600">
                Select the database and table that contains your data. This is the foundation for all subsequent processing steps.
              </p>
              
              <DatabaseSelector
                tenantId={tenantId}
                selectedDatabaseId={value.dataSource.databaseId}
                selectedTableId={Number(value.dataSource.tableId)}
                onDatabaseChange={(databaseId) => updateConfig({
                  dataSource: { ...value.dataSource, databaseId, tableId: "" }
                })}
                onTableChange={(tableId) => updateConfig({
                  dataSource: { ...value.dataSource, tableId: tableId.toString() }
                })}
                onColumnsChange={setAvailableColumns}
              />

              {value.dataSource.databaseId && value.dataSource.tableId && (
                <div className="flex items-center space-x-2 text-green-600">
                  <CheckCircle className="w-4 h-4" />
                  <span className="text-sm font-medium">Data source configured successfully</span>
                </div>
              )}
            </div>
          )}

          {activeStep === 2 && (
            <div className="space-y-4">
              <h3 className="text-lg font-semibold">Step 2: Column Selection</h3>
              <p className="text-sm text-gray-600">
                Choose the columns you want to work with. Select at least one primary column for processing.
              </p>

              {availableColumns.length > 0 ? (
                <div className="space-y-4">
                  <div>
                    <Label className="text-sm font-medium">Primary Columns (Required)</Label>
                    <p className="text-xs text-gray-500 mb-2">Select the main columns for data processing</p>
                    <div className="grid grid-cols-2 gap-2 max-h-32 overflow-y-auto border rounded-md p-2">
                      {availableColumns.map((column) => (
                        <div key={column.id} className="flex items-center space-x-2">
                          <Checkbox
                            id={`primary-${column.name}`}
                            checked={value.columnSelection.primaryColumns.includes(column.name)}
                            onCheckedChange={(checked) => {
                              const current = value.columnSelection.primaryColumns;
                              const updated = checked
                                ? [...current, column.name]
                                : current.filter(c => c !== column.name);
                              updateConfig({
                                columnSelection: { ...value.columnSelection, primaryColumns: updated }
                              });
                            }}
                          />
                          <Label htmlFor={`primary-${column.name}`} className="text-sm">
                            {column.name} <Badge variant="secondary" className="ml-1 text-xs">{column.type}</Badge>
                          </Label>
                        </div>
                      ))}
                    </div>
                  </div>

                  <div>
                    <Label className="text-sm font-medium">Grouping Column (Optional)</Label>
                    <p className="text-xs text-gray-500 mb-2">Column to group data by for aggregation</p>
                    <Select
                      value={value.columnSelection.groupingColumn || ""}
                      onValueChange={(val) => updateConfig({
                        columnSelection: { ...value.columnSelection, groupingColumn: val || undefined }
                      })}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Select grouping column" />
                      </SelectTrigger>
                      <SelectContent>
                        {availableColumns
                          .filter(col => ["string", "text", "date", "datetime", "boolean"].includes(col.type))
                          .map((column) => (
                            <SelectItem key={column.id} value={column.name}>
                              {column.name} <Badge variant="secondary" className="ml-1 text-xs">{column.type}</Badge>
                            </SelectItem>
                          ))}
                      </SelectContent>
                    </Select>
                  </div>

                  <div>
                    <Label className="text-sm font-medium">Display Columns (Optional)</Label>
                    <p className="text-xs text-gray-500 mb-2">Additional columns to display in results</p>
                    <div className="grid grid-cols-2 gap-2 max-h-24 overflow-y-auto border rounded-md p-2">
                      {availableColumns.map((column) => (
                        <div key={column.id} className="flex items-center space-x-2">
                          <Checkbox
                            id={`display-${column.name}`}
                            checked={value.columnSelection.displayColumns.includes(column.name)}
                            onCheckedChange={(checked) => {
                              const current = value.columnSelection.displayColumns;
                              const updated = checked
                                ? [...current, column.name]
                                : current.filter(c => c !== column.name);
                              updateConfig({
                                columnSelection: { ...value.columnSelection, displayColumns: updated }
                              });
                            }}
                          />
                          <Label htmlFor={`display-${column.name}`} className="text-sm">
                            {column.name}
                          </Label>
                        </div>
                      ))}
                    </div>
                  </div>

                  {value.columnSelection.primaryColumns.length > 0 && (
                    <div className="flex items-center space-x-2 text-green-600">
                      <CheckCircle className="w-4 h-4" />
                      <span className="text-sm font-medium">Column selection completed</span>
                    </div>
                  )}
                </div>
              ) : (
                <Alert>
                  <AlertCircle className="h-4 w-4" />
                  <AlertDescription>
                    Please complete Step 1 (Data Source) to see available columns.
                  </AlertDescription>
                </Alert>
              )}
            </div>
          )}

          {activeStep === 3 && (
            <div className="space-y-4">
              <h3 className="text-lg font-semibold">Step 3: Aggregation Functions</h3>
              <p className="text-sm text-gray-600">
                Choose aggregation functions to apply to your selected columns. These functions will process your data.
              </p>

              {value.columnSelection.primaryColumns.length > 0 ? (
                <div className="space-y-4">
                  <div>
                    <Label className="text-sm font-medium">Aggregation Functions</Label>
                    <p className="text-xs text-gray-500 mb-2">Select one or more functions to apply</p>
                    <div className="grid grid-cols-2 gap-2">
                      {(["sum", "avg", "count", "min", "max"] as const).map((func) => (
                        <div key={func} className="flex items-center space-x-2">
                          <Checkbox
                            id={func}
                            checked={value.aggregation.functions.includes(func)}
                            onCheckedChange={(checked) => {
                              const current = value.aggregation.functions;
                              const updated = checked
                                ? [...current, func]
                                : current.filter(f => f !== func);
                              updateConfig({
                                aggregation: { ...value.aggregation, functions: updated }
                              });
                            }}
                          />
                          <Label htmlFor={func} className="text-sm font-normal capitalize">
                            {func === "avg" ? "Average" : 
                             func === "count" ? "Count" :
                             func === "min" ? "Minimum" :
                             func === "max" ? "Maximum" :
                             func === "sum" ? "Sum" : func}
                          </Label>
                        </div>
                      ))}
                    </div>
                  </div>

                  <div>
                    <Label className="text-sm font-medium">Columns to Aggregate</Label>
                    <p className="text-xs text-gray-500 mb-2">Select numeric columns for aggregation</p>
                    <div className="grid grid-cols-2 gap-2 max-h-24 overflow-y-auto border rounded-md p-2">
                      {availableColumns
                        .filter(col => ["number", "integer", "decimal", "float", "double"].includes(col.type))
                        .map((column) => (
                          <div key={column.id} className="flex items-center space-x-2">
                            <Checkbox
                              id={`agg-${column.name}`}
                              checked={value.aggregation.aggregationColumns.includes(column.name)}
                              onCheckedChange={(checked) => {
                                const current = value.aggregation.aggregationColumns;
                                const updated = checked
                                  ? [...current, column.name]
                                  : current.filter(c => c !== column.name);
                                updateConfig({
                                  aggregation: { ...value.aggregation, aggregationColumns: updated }
                                });
                              }}
                            />
                            <Label htmlFor={`agg-${column.name}`} className="text-sm">
                              {column.name} <Badge variant="secondary" className="ml-1 text-xs">{column.type}</Badge>
                            </Label>
                          </div>
                        ))}
                    </div>
                  </div>

                  {value.aggregation.functions.length > 0 && value.aggregation.aggregationColumns.length > 0 && (
                    <div className="flex items-center space-x-2 text-green-600">
                      <CheckCircle className="w-4 h-4" />
                      <span className="text-sm font-medium">Aggregation configuration completed</span>
                    </div>
                  )}
                </div>
              ) : (
                <Alert>
                  <AlertCircle className="h-4 w-4" />
                  <AlertDescription>
                    Please complete Step 2 (Column Selection) to configure aggregation.
                  </AlertDescription>
                </Alert>
              )}
            </div>
          )}

          {activeStep === 4 && (
            <div className="space-y-4">
              <h3 className="text-lg font-semibold">Step 4: Secondary Functions</h3>
              <p className="text-sm text-gray-600">
                Apply additional functions to your aggregated data. These operate on the results from Step 3.
              </p>

              {value.aggregation.functions.length > 0 ? (
                <div className="space-y-4">
                  <Alert>
                    <Info className="h-4 w-4" />
                    <AlertDescription>
                      Secondary functions are applied AFTER aggregation. They can find maximum values, sort results, or rank data.
                    </AlertDescription>
                  </Alert>

                  <div>
                    <Label className="text-sm font-medium">Secondary Functions</Label>
                    <p className="text-xs text-gray-500 mb-2">Select functions to apply to aggregated results</p>
                    <div className="grid grid-cols-2 gap-2">
                      {(["max", "min", "sort", "rank"] as const).map((func) => (
                        <div key={func} className="flex items-center space-x-2">
                          <Checkbox
                            id={`secondary-${func}`}
                            checked={value.secondaryFunctions?.functions.includes(func) || false}
                            onCheckedChange={(checked) => {
                              const current = value.secondaryFunctions?.functions || [];
                              const updated = checked
                                ? [...current, func]
                                : current.filter(f => f !== func);
                              updateConfig({
                                secondaryFunctions: { 
                                  ...value.secondaryFunctions, 
                                  functions: updated 
                                }
                              });
                            }}
                          />
                          <Label htmlFor={`secondary-${func}`} className="text-sm font-normal capitalize">
                            {func === "sort" ? "Sort Results" :
                             func === "rank" ? "Rank Data" :
                             func === "min" ? "Find Minimum" :
                             func === "max" ? "Find Maximum" : func}
                          </Label>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Configuration for selected secondary functions */}
                  {value.secondaryFunctions?.functions.includes("sort") && (
                    <div className="space-y-2 p-3 border rounded-md bg-gray-50">
                      <Label className="text-sm font-medium">Sort Configuration</Label>
                      <div className="grid grid-cols-2 gap-2">
                        <Select
                          value={value.secondaryFunctions?.sortConfig?.sortByColumn || ""}
                          onValueChange={(val) => updateConfig({
                            secondaryFunctions: {
                              ...value.secondaryFunctions,
                              sortConfig: {
                                ...value.secondaryFunctions?.sortConfig,
                                enabled: true,
                                sortByColumn: val || undefined
                              }
                            }
                          })}
                        >
                          <SelectTrigger>
                            <SelectValue placeholder="Sort by column" />
                          </SelectTrigger>
                          <SelectContent>
                            {value.aggregation.aggregationColumns.map((column) => (
                              <SelectItem key={column} value={column}>{column}</SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                        <Select
                          value={value.secondaryFunctions?.sortConfig?.direction || "desc"}
                          onValueChange={(val) => updateConfig({
                            secondaryFunctions: {
                              ...value.secondaryFunctions,
                              sortConfig: {
                                ...value.secondaryFunctions?.sortConfig,
                                enabled: true,
                                direction: val as "asc" | "desc"
                              }
                            }
                          })}
                        >
                          <SelectTrigger>
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="desc">Descending</SelectItem>
                            <SelectItem value="asc">Ascending</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                    </div>
                  )}
                </div>
              ) : (
                <Alert>
                  <AlertCircle className="h-4 w-4" />
                  <AlertDescription>
                    Please complete Step 3 (Aggregation) to configure secondary functions.
                  </AlertDescription>
                </Alert>
              )}
            </div>
          )}

          {activeStep === 5 && (
            <div className="space-y-4">
              <h3 className="text-lg font-semibold">Step 5: Filtering</h3>
              <p className="text-sm text-gray-600">
                Apply filters at different levels: WHERE (raw data), HAVING (aggregated data), and post-processing.
              </p>

              {value.aggregation.functions.length > 0 ? (
                <Tabs defaultValue="where" className="space-y-4">
                  <TabsList className="grid w-full grid-cols-3">
                    <TabsTrigger value="where">WHERE Filters</TabsTrigger>
                    <TabsTrigger value="having">HAVING Filters</TabsTrigger>
                    <TabsTrigger value="post">Post-Processing</TabsTrigger>
                  </TabsList>

                  <TabsContent value="where" className="space-y-4">
                    <div>
                      <Label className="text-sm font-medium">WHERE Filters (Raw Data)</Label>
                      <p className="text-xs text-gray-500 mb-2">Filters applied before aggregation</p>
                      <WidgetFilters
                        filters={value.filtering?.whereFilters || []}
                        availableColumns={availableColumns}
                        onChange={(filters) => updateConfig({
                          filtering: { ...value.filtering, whereFilters: filters }
                        })}
                      />
                    </div>
                  </TabsContent>

                  <TabsContent value="having" className="space-y-4">
                    <div>
                      <Label className="text-sm font-medium">HAVING Filters (Aggregated Data)</Label>
                      <p className="text-xs text-gray-500 mb-2">Filters applied after aggregation</p>
                      <div className="space-y-2">
                        {/* HAVING filters would be implemented here */}
                        <p className="text-sm text-gray-500">HAVING filter configuration coming soon...</p>
                      </div>
                    </div>
                  </TabsContent>

                  <TabsContent value="post" className="space-y-4">
                    <div>
                      <Label className="text-sm font-medium">Post-Processing Filters</Label>
                      <p className="text-xs text-gray-500 mb-2">Final filters applied to results</p>
                      <div className="space-y-2">
                        {/* Post-processing filters would be implemented here */}
                        <p className="text-sm text-gray-500">Post-processing filter configuration coming soon...</p>
                      </div>
                    </div>
                  </TabsContent>
                </Tabs>
              ) : (
                <Alert>
                  <AlertCircle className="h-4 w-4" />
                  <AlertDescription>
                    Please complete Step 3 (Aggregation) to configure filtering.
                  </AlertDescription>
                </Alert>
              )}
            </div>
          )}

          {activeStep === 6 && (
            <div className="space-y-4">
              <h3 className="text-lg font-semibold">Step 6: Output Configuration</h3>
              <p className="text-sm text-gray-600">
                Configure how the processed data will be displayed in your widget.
              </p>

              {value.aggregation.functions.length > 0 ? (
                <div className="space-y-4">
                  {widgetType === "chart" && (
                    <div className="space-y-3">
                      <Label className="text-sm font-medium">Chart Configuration</Label>
                      <div className="grid grid-cols-2 gap-3">
                        <div>
                          <Label className="text-xs">X-Axis Column</Label>
                          <Select
                            value={value.output.chartConfig?.xAxisColumn || ""}
                            onValueChange={(val) => updateConfig({
                              output: {
                                ...value.output,
                                chartConfig: {
                                  ...value.output.chartConfig,
                                  xAxisColumn: val
                                }
                              }
                            })}
                          >
                            <SelectTrigger>
                              <SelectValue placeholder="Select X-axis column" />
                            </SelectTrigger>
                            <SelectContent>
                              {value.columnSelection.primaryColumns.map((column) => (
                                <SelectItem key={column} value={column}>{column}</SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        </div>
                        <div>
                          <Label className="text-xs">Y-Axis Columns</Label>
                          <div className="space-y-1 max-h-20 overflow-y-auto border rounded-md p-2">
                            {value.aggregation.aggregationColumns.map((column) => (
                              <div key={column} className="flex items-center space-x-2">
                                <Checkbox
                                  id={`y-axis-${column}`}
                                  checked={value.output.chartConfig?.yAxisColumns.includes(column) || false}
                                  onCheckedChange={(checked) => {
                                    const current = value.output.chartConfig?.yAxisColumns || [];
                                    const updated = checked
                                      ? [...current, column]
                                      : current.filter(c => c !== column);
                                    updateConfig({
                                      output: {
                                        ...value.output,
                                        chartConfig: {
                                          ...value.output.chartConfig,
                                          yAxisColumns: updated
                                        }
                                      }
                                    });
                                  }}
                                />
                                <Label htmlFor={`y-axis-${column}`} className="text-sm">{column}</Label>
                              </div>
                            ))}
                          </div>
                        </div>
                      </div>
                    </div>
                  )}

                  {widgetType === "kpi" && (
                    <div className="space-y-3">
                      <Label className="text-sm font-medium">KPI Configuration</Label>
                      <div className="grid grid-cols-2 gap-3">
                        <div>
                          <Label className="text-xs">Display Format</Label>
                          <Select
                            value={value.output.kpiConfig?.displayFormat || "number"}
                            onValueChange={(val) => updateConfig({
                              output: {
                                ...value.output,
                                kpiConfig: {
                                  ...value.output.kpiConfig,
                                  displayFormat: val as any
                                }
                              }
                            })}
                          >
                            <SelectTrigger>
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
                        <div className="flex items-center space-x-2">
                          <Switch
                            id="showTrend"
                            checked={value.output.kpiConfig?.showTrend || false}
                            onCheckedChange={(checked) => updateConfig({
                              output: {
                                ...value.output,
                                kpiConfig: {
                                  ...value.output.kpiConfig,
                                  showTrend: checked
                                }
                              }
                            })}
                          />
                          <Label htmlFor="showTrend" className="text-sm">Show Trend</Label>
                        </div>
                      </div>
                    </div>
                  )}

                  {value.output.chartConfig?.xAxisColumn || value.output.kpiConfig?.displayFormat ? (
                    <div className="flex items-center space-x-2 text-green-600">
                      <CheckCircle className="w-4 h-4" />
                      <span className="text-sm font-medium">Output configuration completed</span>
                    </div>
                  ) : null}
                </div>
              ) : (
                <Alert>
                  <AlertCircle className="h-4 w-4" />
                  <AlertDescription>
                    Please complete Step 3 (Aggregation) to configure output.
                  </AlertDescription>
                </Alert>
              )}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Navigation buttons */}
      <div className="flex justify-between">
        <Button
          variant="outline"
          onClick={() => setActiveStep(Math.max(1, activeStep - 1))}
          disabled={activeStep === 1}
        >
          Previous
        </Button>
        <Button
          onClick={() => setActiveStep(Math.min(6, activeStep + 1))}
          disabled={activeStep === 6}
        >
          Next
        </Button>
      </div>
    </div>
  );
};
