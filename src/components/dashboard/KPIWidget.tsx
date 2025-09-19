'use client';

import { useState, useEffect, useMemo } from 'react';
import { TrendingUp, TrendingDown, Minus, AlertCircle, BarChart3, Calculator } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import BaseWidget from './BaseWidget';
import { api } from '@/lib/api-client';
import { 
  calculateAggregation, 
  calculateMultipleAggregations,
  getAvailableAggregations,
  getAggregationLabel,
  getAggregationDescription,
  getTrendDirection,
  calculatePercentageChange,
  type AggregationType,
  type AggregationResult
} from '@/lib/aggregation-utils';
import type { EnhancedDataSource } from './EnhancedTableSelector';
import type { AggregationConfig } from './AggregationSelector';

export interface KPIDataPoint {
  label: string;
  value: number;
  previousValue?: number;
  change?: number;
  changePercent?: number;
}

export interface KPIDataSource extends EnhancedDataSource {
  type: 'table' | 'manual';
  tableId?: number;
  column?: string; // Legacy support
  aggregation?: AggregationType; // Legacy support
  aggregationConfig?: AggregationConfig; // New aggregation configuration
  filters?: any[];
  // Advanced aggregation options (legacy)
  showMultipleAggregations?: boolean;
  selectedAggregations?: AggregationType[];
  compareWithPrevious?: boolean;
  previousPeriodData?: any[];
}

export interface KPIConfig {
  title?: string;
  dataSource: KPIDataSource;
  options?: {
    format?: 'number' | 'currency' | 'percentage' | 'decimal';
    decimals?: number;
    prefix?: string;
    suffix?: string;
    showChange?: boolean;
    showTrend?: boolean;
    showMultipleValues?: boolean;
    showAggregationType?: boolean;
    showDataCount?: boolean;
    layout?: 'single' | 'grid' | 'list';
    thresholds?: {
      warning?: number;
      danger?: number;
      success?: number;
    };
    colors?: {
      positive?: string;
      negative?: string;
      neutral?: string;
      primary?: string;
      secondary?: string;
    };
    // Enhanced styling options
    backgroundColor?: string;
    borderRadius?: 'none' | 'sm' | 'md' | 'lg' | 'xl' | '2xl' | '3xl';
    shadow?: 'none' | 'sm' | 'md' | 'lg' | 'xl' | '2xl';
    padding?: 'none' | 'sm' | 'md' | 'lg' | 'xl';
    hoverEffect?: 'none' | 'lift' | 'glow' | 'scale' | 'rotate';
  };
}

export interface Widget {
  id: number | string;
  type: string;
  title: string | null;
  position: { x: number; y: number; width: number; height: number };
  config: KPIConfig;
}

interface KPIWidgetProps {
  widget: Widget;
  isEditMode: boolean;
  onEdit: () => void;
  onDelete?: () => void;
  tenantId?: number;
  databaseId?: number;
}

export function KPIWidget({ widget, isEditMode, onEdit, onDelete, tenantId, databaseId }: KPIWidgetProps) {
  const [rawData, setRawData] = useState<any[]>([]);
  const [previousData, setPreviousData] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const config = (widget.config || {}) as KPIConfig;
  const dataSource = config.dataSource || {};
  const options = config.options || {};

  // Calculate aggregations using the new utility functions
  const aggregations = useMemo(() => {
    if (!rawData.length) return {};

    // Support both new and legacy data source formats
    const column = dataSource.yAxis?.columns?.[0] || dataSource.column;
    const aggregationConfig = dataSource.aggregationConfig;
    
    if (!column) return {};

    // Determine aggregation functions to calculate
    let aggregationsToCalculate: AggregationType[];
    
    if (aggregationConfig) {
      // New format: use aggregation config
      aggregationsToCalculate = aggregationConfig.showMultiple && aggregationConfig.selected
        ? aggregationConfig.selected
        : [aggregationConfig.primary];
    } else {
      // Legacy format: use old aggregation system
      const primaryAggregation = dataSource.aggregation || 'sum';
      aggregationsToCalculate = dataSource.showMultipleAggregations && dataSource.selectedAggregations
        ? dataSource.selectedAggregations
        : [primaryAggregation];
    }

    return calculateMultipleAggregations(rawData, column, aggregationsToCalculate);
  }, [rawData, dataSource, dataSource.column, dataSource.aggregation, dataSource.aggregationConfig, dataSource.showMultipleAggregations, dataSource.selectedAggregations]);

  // Calculate previous period aggregations for comparison
  const previousAggregations = useMemo(() => {
    if (!previousData.length) return {};

    // Support both new and legacy data source formats
    const column = dataSource.yAxis?.columns?.[0] || dataSource.column;
    const aggregationConfig = dataSource.aggregationConfig;
    
    if (!column) return {};

    // Determine aggregation functions to calculate
    let aggregationsToCalculate: AggregationType[];
    
    if (aggregationConfig) {
      // New format: use aggregation config
      aggregationsToCalculate = aggregationConfig.showMultiple && aggregationConfig.selected
        ? aggregationConfig.selected
        : [aggregationConfig.primary];
    } else {
      // Legacy format: use old aggregation system
      const primaryAggregation = dataSource.aggregation || 'sum';
      aggregationsToCalculate = dataSource.showMultipleAggregations && dataSource.selectedAggregations
        ? dataSource.selectedAggregations
        : [primaryAggregation];
    }

    return calculateMultipleAggregations(previousData, column, aggregationsToCalculate);
  }, [previousData, dataSource, dataSource.column, dataSource.aggregation, dataSource.aggregationConfig, dataSource.showMultipleAggregations, dataSource.selectedAggregations]);

  useEffect(() => {
    // Support both new and legacy data source formats
    const hasValidTableConfig = dataSource.type === 'table' && 
      tenantId && 
      databaseId && 
      dataSource.tableId && 
      (dataSource.yAxis?.columns?.[0] || dataSource.column) && 
      (dataSource.aggregationConfig?.primary || dataSource.aggregation);

    if (hasValidTableConfig) {
      fetchTableData();
    } else if (dataSource.type === 'manual') {
      // For manual data, we'll use mock data for now
      const mockData = [
        { id: 1, revenue: 125000, users: 2847, conversion: 3.2 },
        { id: 2, revenue: 110000, users: 2650, conversion: 2.8 },
        { id: 3, revenue: 135000, users: 3100, conversion: 3.5 },
      ];
      setRawData(mockData);
    }
  }, [dataSource, tenantId, databaseId]);

  const fetchTableData = async () => {
    // Support both new and legacy data source formats
    const column = dataSource.yAxis?.columns?.[0] || dataSource.column;
    const aggregation = dataSource.aggregationConfig?.primary || dataSource.aggregation;
    
    if (!tenantId || !databaseId || !dataSource.tableId || !column || !aggregation) return;

    setIsLoading(true);
    setError(null);

    try {
      const queryData = {
        filters: dataSource.filters || [],
        search: '',
        sortBy: column,
        sortOrder: 'desc' as const,
        page: 1,
        pageSize: 1000, // Get all data for aggregation
      };

      const response = await api.tables.rows(tenantId, databaseId, dataSource.tableId, queryData);
      
      if (response.success && response.data) {
        // Store raw data for aggregation calculations
        const rawData = (response.data ?? []).map((row: any) => {
          const processedRow: any = { id: row.id };
          
          // Process all cells to create a flat object
          if (row.cells) {
            row.cells.forEach((cell: any) => {
              if (cell?.column?.name) {
                processedRow[cell.column.name] = cell.value;
              }
            });
          }
          
          return processedRow;
        });

        setRawData(rawData);

        // If we need to compare with previous period, fetch that data too
        const shouldCompare = dataSource.aggregationConfig?.compareWithPrevious || dataSource.compareWithPrevious;
        if (shouldCompare) {
          // For now, we'll simulate previous period data
          // In a real implementation, you'd fetch data from a previous time period
          const previousData = rawData.map((row: any) => ({
            ...row,
            [column!]: (parseFloat(row[column!]) || 0) * 0.9 // Simulate 10% decrease
          }));
          setPreviousData(previousData);
        }
      }
    } catch (err) {
      console.error('Error fetching KPI data:', err);
      setError(err instanceof Error ? err.message : 'Failed to fetch data');
    } finally {
      setIsLoading(false);
    }
  };

  const aggregateValues = (values: number[], aggregation: string): number => {
    switch (aggregation) {
      case 'sum':
        return values.reduce((sum, val) => sum + val, 0);
      case 'count':
        return values.length;
      case 'average':
        return values.length > 0 ? values.reduce((sum, val) => sum + val, 0) / values.length : 0;
      case 'min':
        return Math.min(...values);
      case 'max':
        return Math.max(...values);
      default:
        return values.reduce((sum, val) => sum + val, 0);
    }
  };

  const formatValue = (value: number): string => {
    const decimals = options.decimals ?? 0;
    const prefix = options.prefix || '';
    const suffix = options.suffix || '';

    switch (options.format) {
      case 'currency':
        return `${prefix}${value.toLocaleString('en-US', { 
          minimumFractionDigits: decimals, 
          maximumFractionDigits: decimals 
        })}${suffix}`;
      case 'percentage':
        return `${prefix}${(value * 100).toFixed(decimals)}%${suffix}`;
      default:
        return `${prefix}${value.toLocaleString('en-US', { 
          minimumFractionDigits: decimals, 
          maximumFractionDigits: decimals 
        })}${suffix}`;
    }
  };

  const getTrendIcon = (changePercent?: number) => {
    if (!changePercent) return <Minus className="h-4 w-4 text-gray-400" />;
    if (changePercent > 0) return <TrendingUp className="h-4 w-4 text-green-500" />;
    if (changePercent < 0) return <TrendingDown className="h-4 w-4 text-red-500" />;
    return <Minus className="h-4 w-4 text-gray-400" />;
  };

  const getTrendColor = (changePercent?: number) => {
    if (!changePercent) return 'text-gray-500';
    if (changePercent > 0) return 'text-green-600';
    if (changePercent < 0) return 'text-red-600';
    return 'text-gray-500';
  };

  const getThresholdColor = (value: number) => {
    const thresholds = options.thresholds;
    if (!thresholds) return 'text-gray-900';

    if (thresholds.danger && value <= thresholds.danger) return 'text-red-600';
    if (thresholds.warning && value <= thresholds.warning) return 'text-yellow-600';
    if (thresholds.success && value >= thresholds.success) return 'text-green-600';
    return 'text-gray-900';
  };

  const handleRefresh = () => {
    if (dataSource.type === 'table') {
      fetchTableData();
    }
  };

  // Enhanced styling configuration
  const widgetStyle = {
    backgroundColor: options.backgroundColor || 'transparent',
    borderRadius: options.borderRadius || 'lg',
    shadow: options.shadow || 'sm',
    padding: options.padding || 'md',
    hoverEffect: options.hoverEffect || 'lift',
    ...(widget as any).style
  };

  if (isLoading) {
    return (
      <BaseWidget
        widget={widget}
        isEditMode={isEditMode}
        onEdit={onEdit}
        onDelete={onDelete}
        isLoading={true}
        error={null}
        onRefresh={dataSource.type === 'table' ? handleRefresh : undefined}
        showRefresh={dataSource.type === 'table'}
        style={widgetStyle}
      >
        <div className="space-y-4">
          <Skeleton className="h-8 w-3/4" />
          <Skeleton className="h-12 w-1/2" />
          <Skeleton className="h-4 w-1/3" />
        </div>
      </BaseWidget>
    );
  }

  if (error) {
    return (
      <BaseWidget
        widget={widget}
        isEditMode={isEditMode}
        onEdit={onEdit}
        onDelete={onDelete}
        isLoading={false}
        error={error}
        onRefresh={dataSource.type === 'table' ? handleRefresh : undefined}
        showRefresh={dataSource.type === 'table'}
        style={widgetStyle}
      >
        <div className="flex items-center justify-center h-32">
          <div className="text-center">
            <AlertCircle className="h-8 w-8 text-red-500 mx-auto mb-2" />
            <p className="text-sm text-red-600">{error}</p>
          </div>
        </div>
      </BaseWidget>
    );
  }

  // Render KPI values based on configuration
  const renderKPIContent = () => {
    // Check if both table and column are selected
    if (!dataSource.tableId || dataSource.tableId === 0) {
      return (
        <div className="flex items-center justify-center h-full text-muted-foreground min-h-[150px]">
          <div className="text-center p-4 sm:p-6">
            <BarChart3 className="w-6 h-6 sm:w-8 sm:h-8 mx-auto mb-2" />
            <p className="text-xs sm:text-sm font-medium">No table selected</p>
            <p className="text-xs text-muted-foreground mt-1">
              Please select a table to configure this KPI widget
            </p>
          </div>
        </div>
      );
    }

    // Check if column is selected (support both new and legacy formats)
    const column = dataSource.yAxis?.columns?.[0] || dataSource.column;
    if (!column || column === '') {
      return (
        <div className="flex items-center justify-center h-full text-muted-foreground min-h-[150px]">
          <div className="text-center p-4 sm:p-6">
            <Calculator className="w-6 h-6 sm:w-8 sm:h-8 mx-auto mb-2" />
            <p className="text-xs sm:text-sm font-medium">No column selected</p>
            <p className="text-xs text-muted-foreground mt-1">
              Please select a column from the table to calculate KPI values
            </p>
          </div>
        </div>
      );
    }

    // Check if aggregation function is selected (support both new and legacy formats)
    const aggregation = dataSource.aggregationConfig?.primary || dataSource.aggregation;
    if (!aggregation) {
      return (
        <div className="flex items-center justify-center h-full text-muted-foreground min-h-[150px]">
          <div className="text-center p-4 sm:p-6">
            <Calculator className="w-6 h-6 sm:w-8 sm:h-8 mx-auto mb-2" />
            <p className="text-xs sm:text-sm font-medium">No aggregation function selected</p>
            <p className="text-xs text-muted-foreground mt-1">
              Please select an aggregation function (sum, count, avg, etc.) to calculate KPI values
            </p>
          </div>
        </div>
      );
    }

    // Check if we have data and aggregations
    if (Object.keys(aggregations).length === 0) {
      return (
        <div className="flex items-center justify-center h-full text-muted-foreground min-h-[150px]">
          <div className="text-center p-4 sm:p-6">
            <AlertCircle className="w-6 h-6 sm:w-8 sm:h-8 mx-auto mb-2" />
            <p className="text-xs sm:text-sm font-medium">No data available</p>
            <p className="text-xs text-muted-foreground mt-1">
              No data found for the selected column and aggregation function
            </p>
          </div>
        </div>
      );
    }

    const layout = options.layout || 'single';
    const showMultiple = options.showMultipleValues || 
      (dataSource.aggregationConfig?.showMultiple || dataSource.showMultipleAggregations);

    if (showMultiple && Object.keys(aggregations).length > 1) {
      // Render multiple aggregations
      return (
        <div className={`space-y-2 sm:space-y-3 ${layout === 'grid' ? 'grid grid-cols-1 sm:grid-cols-2 gap-2 sm:gap-3' : ''}`}>
          {Object.entries(aggregations).map(([type, result]: [string, any]) => {
            const previousResult = (previousAggregations as any)[type as AggregationType];
            const changePercent = previousResult 
              ? calculatePercentageChange((result as any).value, (previousResult as any).value)
              : undefined;
            const trend = previousResult 
              ? getTrendDirection((result as any).value, (previousResult as any).value)
              : 'stable';

            return (
              <div key={type} className="p-3 bg-muted/30 rounded-lg">
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center space-x-2">
                    <BarChart3 className="h-4 w-4 text-muted-foreground" />
                    <span className="text-sm font-medium text-muted-foreground">
                      {getAggregationLabel(type as AggregationType)}
                    </span>
                  </div>
                  {options.showTrend && previousResult && (
                    <div className={`flex items-center space-x-1 ${
                      trend === 'up' ? 'text-green-600' : 
                      trend === 'down' ? 'text-red-600' : 'text-gray-500'
                    }`}>
                      {trend === 'up' ? <TrendingUp className="h-3 w-3" /> :
                       trend === 'down' ? <TrendingDown className="h-3 w-3" /> :
                       <Minus className="h-3 w-3" />}
                    </div>
                  )}
                </div>
                
                <div className="flex items-baseline space-x-2">
                  <span className="text-xl font-bold text-foreground">
                    {(result as any).formatted}
                  </span>
                  {options.showChange && changePercent !== undefined && (
                    <span className={`text-xs ${
                      changePercent > 0 ? 'text-green-600' : 
                      changePercent < 0 ? 'text-red-600' : 'text-gray-500'
                    }`}>
                      {changePercent > 0 ? '+' : ''}{changePercent.toFixed(1)}%
                    </span>
                  )}
                </div>
                
                {options.showDataCount && (
                  <div className="text-xs text-muted-foreground mt-1">
                    Based on {(result as any).count} data points
                  </div>
                )}
              </div>
            );
          })}
        </div>
      );
    } else {
      // Render single aggregation
      const primaryType = dataSource.aggregationConfig?.primary || dataSource.aggregation || 'sum';
      const result = (aggregations as any)[primaryType];
      const previousResult = (previousAggregations as any)[primaryType];
      const changePercent = previousResult 
        ? calculatePercentageChange((result as any).value, (previousResult as any).value)
        : undefined;
      const trend = previousResult 
        ? getTrendDirection((result as any).value, (previousResult as any).value)
        : 'stable';

      return (
        <div className="text-center space-y-2 sm:space-y-4 h-full flex flex-col justify-center">
          <div className="space-y-1 sm:space-y-2">
            <div className="flex items-center justify-center space-x-2">
              <BarChart3 className="h-4 w-4 sm:h-5 sm:w-5 text-muted-foreground" />
              {options.showAggregationType && (
                <span className="text-sm text-muted-foreground">
                  {getAggregationLabel(primaryType)}
                </span>
              )}
            </div>
            
            <div className="text-2xl sm:text-3xl lg:text-4xl font-bold text-foreground">
              {result.formatted}
            </div>
            
            {options.showTrend && previousResult && (
              <div className={`flex items-center justify-center space-x-2 ${
                trend === 'up' ? 'text-green-600' : 
                trend === 'down' ? 'text-red-600' : 'text-gray-500'
              }`}>
                {trend === 'up' ? <TrendingUp className="h-5 w-5" /> :
                 trend === 'down' ? <TrendingDown className="h-5 w-5" /> :
                 <Minus className="h-5 w-5" />}
                {options.showChange && changePercent !== undefined && (
                  <span className="text-sm font-medium">
                    {changePercent > 0 ? '+' : ''}{changePercent.toFixed(1)}%
                  </span>
                )}
              </div>
            )}
            
            {options.showDataCount && (
              <div className="text-sm text-muted-foreground">
                Based on {result.count} data points
              </div>
            )}
          </div>
        </div>
      );
    }
  };

  return (
    <BaseWidget
      widget={widget}
      isEditMode={isEditMode}
      onEdit={onEdit}
      onDelete={onDelete}
      isLoading={false}
      error={null}
      onRefresh={dataSource.type === 'table' ? handleRefresh : undefined}
      showRefresh={dataSource.type === 'table'}
      style={widgetStyle}
    >
      {renderKPIContent()}
    </BaseWidget>
  );
}

export default KPIWidget;
