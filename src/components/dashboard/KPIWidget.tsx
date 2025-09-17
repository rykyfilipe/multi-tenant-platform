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

export interface KPIDataPoint {
  label: string;
  value: number;
  previousValue?: number;
  change?: number;
  changePercent?: number;
}

export interface KPIDataSource {
  type: 'table' | 'manual';
  tableId?: number;
  column?: string;
  aggregation?: AggregationType;
  filters?: any[];
  // Advanced aggregation options
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

  const config = widget.config as KPIConfig;
  const dataSource = config.dataSource;
  const options = config.options || {};

  // Calculate aggregations using the new utility functions
  const aggregations = useMemo(() => {
    if (!rawData.length || !dataSource.column) return {};

    const column = dataSource.column;
    const aggregationsToCalculate = dataSource.showMultipleAggregations && dataSource.selectedAggregations
      ? dataSource.selectedAggregations
      : [dataSource.aggregation || 'sum'];

    return calculateMultipleAggregations(rawData, column, aggregationsToCalculate);
  }, [rawData, dataSource.column, dataSource.aggregation, dataSource.showMultipleAggregations, dataSource.selectedAggregations]);

  // Calculate previous period aggregations for comparison
  const previousAggregations = useMemo(() => {
    if (!previousData.length || !dataSource.column) return {};

    const column = dataSource.column;
    const aggregationsToCalculate = dataSource.showMultipleAggregations && dataSource.selectedAggregations
      ? dataSource.selectedAggregations
      : [dataSource.aggregation || 'sum'];

    return calculateMultipleAggregations(previousData, column, aggregationsToCalculate);
  }, [previousData, dataSource.column, dataSource.aggregation, dataSource.showMultipleAggregations, dataSource.selectedAggregations]);

  useEffect(() => {
    if (dataSource.type === 'table' && tenantId && databaseId && dataSource.tableId && dataSource.column) {
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
    if (!tenantId || !databaseId || !dataSource.tableId || !dataSource.column) return;

    setIsLoading(true);
    setError(null);

    try {
      const queryData = {
        filters: dataSource.filters || [],
        search: '',
        sortBy: dataSource.column,
        sortOrder: 'desc' as const,
        page: 1,
        pageSize: 1000, // Get all data for aggregation
      };

      const response = await api.tables.rows(tenantId, databaseId, dataSource.tableId, queryData);
      
      if (response.success && response.data) {
        // Store raw data for aggregation calculations
        const rawData = (response.data.rows ?? []).map((row: any) => {
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
        if (dataSource.compareWithPrevious) {
          // For now, we'll simulate previous period data
          // In a real implementation, you'd fetch data from a previous time period
          const previousData = rawData.map(row => ({
            ...row,
            [dataSource.column!]: (parseFloat(row[dataSource.column!]) || 0) * 0.9 // Simulate 10% decrease
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
      case 'avg':
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
    ...widget.style
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
    if (!dataSource.column || Object.keys(aggregations).length === 0) {
      return (
        <div className="flex items-center justify-center h-full text-muted-foreground">
          <div className="text-center p-6">
            <Calculator className="w-8 h-8 mx-auto mb-2" />
            <p className="text-sm">No data available</p>
            <p className="text-xs text-muted-foreground mt-1">
              Select a table and column to see KPI values
            </p>
          </div>
        </div>
      );
    }

    const layout = options.layout || 'single';
    const showMultiple = options.showMultipleValues || dataSource.showMultipleAggregations;

    if (showMultiple && Object.keys(aggregations).length > 1) {
      // Render multiple aggregations
      return (
        <div className={`space-y-3 ${layout === 'grid' ? 'grid grid-cols-2 gap-3' : ''}`}>
          {Object.entries(aggregations).map(([type, result]) => {
            const previousResult = previousAggregations[type as AggregationType];
            const changePercent = previousResult 
              ? calculatePercentageChange(result.value, previousResult.value)
              : undefined;
            const trend = previousResult 
              ? getTrendDirection(result.value, previousResult.value)
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
                    {result.formatted}
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
                    Based on {result.count} data points
                  </div>
                )}
              </div>
            );
          })}
        </div>
      );
    } else {
      // Render single aggregation
      const primaryType = dataSource.aggregation || 'sum';
      const result = aggregations[primaryType];
      const previousResult = previousAggregations[primaryType];
      const changePercent = previousResult 
        ? calculatePercentageChange(result.value, previousResult.value)
        : undefined;
      const trend = previousResult 
        ? getTrendDirection(result.value, previousResult.value)
        : 'stable';

      return (
        <div className="text-center space-y-4">
          <div className="space-y-2">
            <div className="flex items-center justify-center space-x-2">
              <BarChart3 className="h-5 w-5 text-muted-foreground" />
              {options.showAggregationType && (
                <span className="text-sm text-muted-foreground">
                  {getAggregationLabel(primaryType)}
                </span>
              )}
            </div>
            
            <div className="text-4xl font-bold text-foreground">
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
