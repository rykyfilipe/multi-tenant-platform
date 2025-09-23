import React, { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import { Separator } from '@/components/ui/separator';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { BarChart3, Settings, Palette, Filter, AlertCircle, CheckCircle } from 'lucide-react';
import { WidgetEditorProps, WidgetEntity } from '@/types/widget';
import { TableSelector } from '../TableSelector';
import { MetricConfig } from '../MetricWidget';
import StyleOptions from './StyleOptions';
import { FilterBuilder } from '../FilterBuilder';
import { 
  getAvailableAggregationsForColumnType,
  getDefaultAggregationForColumnType,
  validateMetricWidgetConfig,
  type ColumnType,
  type AggregationFunction,
  type ColumnMeta
} from '@/lib/widget-aggregation';
import { FilterConfig } from '@/types/filtering';

interface MetricEditorProps extends WidgetEditorProps {
  widget: Partial<WidgetEntity> & { config?: MetricConfig };
}

/**
 * Comprehensive Metric Widget Editor
 * 
 * Features:
 * - Flexible table and column selection
 * - Aggregation function selection with validation
 * - Advanced filtering options
 * - Value formatting configuration
 * - Display options (trend, comparison, labels)
 * - Professional styling options
 * - Real-time validation and error handling
 */
export default function MetricEditor({ 
  widget, 
  onSave, 
  onCancel, 
  isOpen 
}: MetricEditorProps) {
  const [config, setConfig] = useState<MetricConfig>({
    title: '',
    dataSource: {
      type: 'table',
      tableId: 0,
      yAxis: {
        key: 'value',
        label: 'Value',
        type: 'number',
        columns: []
      }
    },
    aggregation: 'sum',
    formatting: {
      type: 'number',
      decimals: 0,
      prefix: '',
      suffix: ''
    },
    display: {
      showTrend: false,
      showComparison: false,
      customLabel: '',
      secondaryMetric: ''
    },
    style: {
      backgroundColor: '#ffffff',
      textColor: '#1f2937',
      accentColor: '#3b82f6'
    },
    filters: [],
    ...widget.config
  });

  const [validationErrors, setValidationErrors] = useState<string[]>([]);
  const [availableAggregations, setAvailableAggregations] = useState<AggregationFunction[]>(['sum', 'avg', 'min', 'max', 'count']);
  const [columnMeta, setColumnMeta] = useState<ColumnMeta | null>(null);

  // Validate configuration whenever it changes
  useEffect(() => {
    const errors: string[] = [];
    
    // Check if table is selected
    if (!config.dataSource.tableId) {
      errors.push('Please select a table');
    }
    
    // Check if column is selected
    const targetColumn = config.dataSource.yAxis?.columns?.[0] || 
                        config.dataSource.columnY;
    
    if (!targetColumn) {
      errors.push('Please select a column for aggregation');
    }
    
    // Validate aggregation compatibility if we have column info
    if (targetColumn && columnMeta) {
      const validation = validateMetricWidgetConfig(columnMeta, config.aggregation);
      if (!validation.isValid && validation.error) {
        errors.push(validation.error);
      }
    }
    
    setValidationErrors(errors);
  }, [config, columnMeta]);

  // Update available aggregations when column changes
  useEffect(() => {
    if (columnMeta) {
      const aggregations = getAvailableAggregationsForColumnType(columnMeta.type);
      setAvailableAggregations(aggregations);
      
      // Set default aggregation if current one is not available
      if (!aggregations.includes(config.aggregation)) {
        const defaultAgg = getDefaultAggregationForColumnType(columnMeta.type);
        setConfig(prev => ({ ...prev, aggregation: defaultAgg }));
      }
    }
  }, [columnMeta]);

  const handleSave = () => {
    if (validationErrors.length > 0) {
      return;
    }

    onSave({
      ...widget,
      config,
      type: 'metric'
    });
  };

  const handleConfigChange = (key: keyof MetricConfig, value: any) => {
    setConfig(prev => ({
      ...prev,
      [key]: value
    }));
  };

  const handleDataSourceChange = (dataSource: any) => {
    setConfig(prev => ({
      ...prev,
      dataSource
    }));
    
    // Try to get column metadata for validation
    const targetColumn = dataSource.yAxis?.columns?.[0] || 
                        dataSource.columnY;
    
    if (targetColumn && dataSource.tableId) {
      // Create mock column meta - in real implementation, this would come from API
      setColumnMeta({
        id: 0,
        name: targetColumn,
        type: 'number', // Default to number, would be determined from actual column metadata
        tableId: dataSource.tableId
      });
    }
  };

  const handleFormattingChange = (key: keyof MetricConfig['formatting'], value: any) => {
    setConfig(prev => ({
      ...prev,
      formatting: {
        ...prev.formatting,
        [key]: value
      }
    }));
  };

  const handleDisplayChange = (key: keyof MetricConfig['display'], value: any) => {
    setConfig(prev => ({
      ...prev,
      display: {
        ...prev.display,
        [key]: value
      }
    }));
  };

  const handleStyleChange = (key: string, value: any) => {
    setConfig(prev => ({
      ...prev,
      style: {
        ...prev.style,
        [key]: value
      }
    }));
  };

  const handleFiltersChange = (filters: any[]) => {
    setConfig(prev => ({
      ...prev,
      filters
    }));
  };

  const getAggregationDescription = (agg: AggregationFunction): string => {
    const descriptions = {
      sum: 'Total of all values',
      avg: 'Average (mean) of all values',
      min: 'Smallest value',
      max: 'Largest value',
      count: 'Number of records'
    };
    return descriptions[agg];
  };

  const getAggregationIcon = (agg: AggregationFunction): string => {
    const icons = {
      sum: '∑',
      avg: 'μ',
      min: '↓',
      max: '↑',
      count: '#'
    };
    return icons[agg];
  };

  return (
    <Dialog open={isOpen} onOpenChange={onCancel}>
      <DialogContent className="max-w-5xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center space-x-2 text-gray-900">
            <BarChart3 className="h-5 w-5 text-gray-600" />
            <span>Configure Metric Widget</span>
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-6">
          {/* Validation Errors */}
          {validationErrors.length > 0 && (
            <Alert className="border-red-200 bg-red-50">
              <AlertCircle className="h-4 w-4 text-red-600" />
              <AlertDescription className="text-red-800">
                <div className="space-y-1">
                  {validationErrors.map((error, index) => (
                    <div key={index}>• {error}</div>
                  ))}
                </div>
              </AlertDescription>
            </Alert>
          )}

          {/* Basic Configuration */}
          <Card className="border-gray-200">
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-semibold flex items-center space-x-2 text-gray-900">
                <Settings className="h-4 w-4 text-gray-600" />
                <span>Basic Configuration</span>
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 gap-4">
                <div>
                  <Label htmlFor="title" className="text-sm font-medium text-gray-700">
                    Widget Title
                  </Label>
                  <Input
                    id="title"
                    value={config.title || ''}
                    onChange={(e) => handleConfigChange('title', e.target.value)}
                    placeholder="Enter widget title"
                    className="mt-1 border-gray-200 focus:border-gray-400"
                  />
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Data Source Configuration */}
          <Card className="border-gray-200">
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-semibold text-gray-900">
                Data Source
              </CardTitle>
            </CardHeader>
            <CardContent>
              <TableSelector
                dataSource={config.dataSource}
                onDataSourceChange={handleDataSourceChange}
                widgetType="kpi"
                supportedAxes={['y']}
                expectedYType="number"
              />
            </CardContent>
          </Card>

          {/* Aggregation Configuration */}
          <Card className="border-gray-200">
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-semibold text-gray-900">
                Aggregation Function
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <Label htmlFor="aggregation" className="text-sm font-medium text-gray-700">
                  Select Aggregation Function
                </Label>
                <Select
                  value={config.aggregation}
                  onValueChange={(value: AggregationFunction) => handleConfigChange('aggregation', value)}
                >
                  <SelectTrigger className="mt-1 border-gray-200 focus:border-gray-400">
                    <SelectValue placeholder="Select aggregation function" />
                  </SelectTrigger>
                  <SelectContent>
                    {availableAggregations.map((agg) => (
                      <SelectItem key={agg} value={agg}>
                        <div className="flex items-center space-x-3">
                          <span className="text-lg font-bold">{getAggregationIcon(agg)}</span>
                          <div className="flex flex-col">
                            <span className="font-medium capitalize">{agg}</span>
                            <span className="text-xs text-gray-500">{getAggregationDescription(agg)}</span>
                          </div>
                        </div>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              
              {/* Aggregation Info */}
              {columnMeta && (
                <div className="bg-blue-50 p-3 rounded-lg">
                  <div className="flex items-center space-x-2 text-blue-800">
                    <CheckCircle className="h-4 w-4" />
                    <span className="text-sm font-medium">Column Information</span>
                  </div>
                  <div className="mt-2 text-sm text-blue-700">
                    <div>Column: <span className="font-medium">{columnMeta.name}</span></div>
                    <div>Type: <span className="font-medium">{columnMeta.type}</span></div>
                    <div>Available Functions: {availableAggregations.join(', ')}</div>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Filter Configuration */}
          <Card className="border-gray-200">
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-semibold flex items-center space-x-2 text-gray-900">
                <Filter className="h-4 w-4 text-gray-600" />
                <span>Filters</span>
              </CardTitle>
            </CardHeader>
            <CardContent>
              <FilterBuilder
                filters={config.filters || []}
                onFiltersChange={handleFiltersChange}
                availableColumns={[]} // TODO: Load actual columns from table
              />
              <div className="mt-3 text-xs text-gray-500">
                Filters are applied before aggregation to ensure accurate metric calculations.
              </div>
            </CardContent>
          </Card>

          {/* Formatting Configuration */}
          <Card className="border-gray-200">
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-semibold text-gray-900">
                Value Formatting
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="formatType" className="text-sm font-medium text-gray-700">
                    Format Type
                  </Label>
                  <Select
                    value={config.formatting.type}
                    onValueChange={(value: any) => handleFormattingChange('type', value)}
                  >
                    <SelectTrigger className="mt-1 border-gray-200 focus:border-gray-400">
                      <SelectValue placeholder="Select format type" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="number">Number</SelectItem>
                      <SelectItem value="currency">Currency</SelectItem>
                      <SelectItem value="percentage">Percentage</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                
                <div>
                  <Label htmlFor="decimals" className="text-sm font-medium text-gray-700">
                    Decimal Places
                  </Label>
                  <Select
                    value={config.formatting.decimals.toString()}
                    onValueChange={(value) => handleFormattingChange('decimals', parseInt(value))}
                  >
                    <SelectTrigger className="mt-1 border-gray-200 focus:border-gray-400">
                      <SelectValue placeholder="Select decimal places" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="0">0</SelectItem>
                      <SelectItem value="1">1</SelectItem>
                      <SelectItem value="2">2</SelectItem>
                      <SelectItem value="3">3</SelectItem>
                      <SelectItem value="4">4</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="prefix" className="text-sm font-medium text-gray-700">
                    Prefix (optional)
                  </Label>
                  <Input
                    id="prefix"
                    value={config.formatting.prefix || ''}
                    onChange={(e) => handleFormattingChange('prefix', e.target.value)}
                    placeholder="e.g., $, €"
                    className="mt-1 border-gray-200 focus:border-gray-400"
                  />
                </div>
                
                <div>
                  <Label htmlFor="suffix" className="text-sm font-medium text-gray-700">
                    Suffix (optional)
                  </Label>
                  <Input
                    id="suffix"
                    value={config.formatting.suffix || ''}
                    onChange={(e) => handleFormattingChange('suffix', e.target.value)}
                    placeholder="e.g., %, units"
                    className="mt-1 border-gray-200 focus:border-gray-400"
                  />
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Display Options */}
          <Card className="border-gray-200">
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-semibold text-gray-900">
                Display Options
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <div>
                    <Label htmlFor="showTrend" className="text-sm font-medium text-gray-700">
                      Show Trend Indicator
                    </Label>
                    <p className="text-xs text-gray-500">Display trend arrow and percentage change</p>
                  </div>
                  <Switch
                    id="showTrend"
                    checked={config.display.showTrend}
                    onCheckedChange={(checked) => handleDisplayChange('showTrend', checked)}
                  />
                </div>

                <div className="flex items-center justify-between">
                  <div>
                    <Label htmlFor="showComparison" className="text-sm font-medium text-gray-700">
                      Show Comparison
                    </Label>
                    <p className="text-xs text-gray-500">Display comparison with previous period</p>
                  </div>
                  <Switch
                    id="showComparison"
                    checked={config.display.showComparison}
                    onCheckedChange={(checked) => handleDisplayChange('showComparison', checked)}
                  />
                </div>
              </div>

              <div>
                <Label htmlFor="customLabel" className="text-sm font-medium text-gray-700">
                  Custom Label (optional)
                </Label>
                <Input
                  id="customLabel"
                  value={config.display.customLabel || ''}
                  onChange={(e) => handleDisplayChange('customLabel', e.target.value)}
                  placeholder="e.g., Total Revenue, Active Users"
                  className="mt-1 border-gray-200 focus:border-gray-400"
                />
              </div>
            </CardContent>
          </Card>

          {/* Style Options */}
          <Card className="border-gray-200">
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-semibold flex items-center space-x-2 text-gray-900">
                <Palette className="h-4 w-4 text-gray-600" />
                <span>Style Options</span>
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <Label htmlFor="textColor" className="text-sm font-medium text-gray-700">
                    Text Color
                  </Label>
                  <Input
                    id="textColor"
                    type="color"
                    value={config.style?.textColor || '#1f2937'}
                    onChange={(e) => handleStyleChange('textColor', e.target.value)}
                    className="mt-1 h-10 border-gray-200 focus:border-gray-400"
                  />
                </div>
                
                <div>
                  <Label htmlFor="accentColor" className="text-sm font-medium text-gray-700">
                    Accent Color
                  </Label>
                  <Input
                    id="accentColor"
                    type="color"
                    value={config.style?.accentColor || '#3b82f6'}
                    onChange={(e) => handleStyleChange('accentColor', e.target.value)}
                    className="mt-1 h-10 border-gray-200 focus:border-gray-400"
                  />
                </div>
                
                <div>
                  <Label htmlFor="backgroundColor" className="text-sm font-medium text-gray-700">
                    Background Color
                  </Label>
                  <Input
                    id="backgroundColor"
                    type="color"
                    value={config.style?.backgroundColor || '#ffffff'}
                    onChange={(e) => handleStyleChange('backgroundColor', e.target.value)}
                    className="mt-1 h-10 border-gray-200 focus:border-gray-400"
                  />
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Advanced Style Options */}
          <StyleOptions
            style={config.style || {}}
            onStyleChange={(key, value) => handleStyleChange(key as any, value)}
            widgetType="metric"
          />
        </div>

        <DialogFooter className="flex justify-end space-x-2 pt-6">
          <Button
            variant="outline"
            onClick={onCancel}
            className="border-gray-200 text-gray-700 hover:bg-gray-50"
          >
            Cancel
          </Button>
          <Button
            onClick={handleSave}
            disabled={validationErrors.length > 0}
            className="bg-gray-900 hover:bg-gray-800 text-white disabled:opacity-50"
          >
            Save Widget
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
