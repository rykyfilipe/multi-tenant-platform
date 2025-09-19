'use client';

import { useMemo } from 'react';
import { TrendingUp, TrendingDown, Minus, AlertCircle, BarChart3, Calculator } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import BaseWidget from './BaseWidget';
import { WidgetProps, BaseWidget as BaseWidgetType } from '@/types/widgets';
import { WidgetDataProvider } from './WidgetDataProvider';
import { 
  getAggregationLabel,
  type AggregationType,
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
    thresholds?: {
      success?: number;
      warning?: number;
      danger?: number;
    };
    backgroundColor?: string;
    borderRadius?: 'none' | 'sm' | 'md' | 'lg' | 'xl' | '2xl' | '3xl' | 'full';
    shadow?: 'none' | 'sm' | 'md' | 'lg' | 'xl' | '2xl' | 'inner';
    padding?: 'none' | 'sm' | 'md' | 'lg' | 'xl';
    hoverEffect?: 'none' | 'lift' | 'glow' | 'scale' | 'rotate';
  };
}

interface KPIWidgetProps extends WidgetProps {
  widget: BaseWidgetType;
  data?: any;
}

export function KPIWidget({ widget, isEditMode, onEdit, onDelete, tenantId, databaseId }: KPIWidgetProps) {
  const config = (widget.config || {}) as KPIConfig;
  const dataSource = config.dataSource || {};
  const options = config.options || {};

  return (
    <WidgetDataProvider widget={widget}>
      {({ data, isLoading, error, refetch }) => {
        // Calculate aggregations using the new utility functions
        const aggregations = useMemo(() => {
          // For metric widgets, data should be in format: { value: number, previousValue: number, change: number, changePercentage: number, trend: string }
          if (data && typeof data === 'object' && 'value' in data) {
            return {
              [dataSource.aggregation || 'sum']: data.value
            };
          }
          
          // Fallback to empty aggregations if no data
          return {};
        }, [data, dataSource.aggregation]);

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

        // Get the main aggregation value
        const mainAggregation = dataSource.aggregation || 'sum';
        const mainValue = (aggregations[mainAggregation] as number) || 0;

        return (
          <BaseWidget
            widget={widget}
            isEditMode={isEditMode}
            onEdit={onEdit}
            onDelete={onDelete}
            isLoading={isLoading}
            error={error}
            onRefresh={refetch}
            showRefresh={true}
          >
            <div className="space-y-4">
              {/* Main Value Display */}
              <div className="text-center">
                <div className="text-3xl font-bold text-gray-900">
                  {formatValue(mainValue)}
                </div>
                {dataSource.column && (
                  <div className="text-sm text-gray-500 mt-1">
                    {dataSource.column}
                  </div>
                )}
              </div>

              {/* Additional Aggregations */}
              {dataSource.showMultipleAggregations && dataSource.selectedAggregations && (
                <div className="grid grid-cols-2 gap-2 text-xs">
                  {dataSource.selectedAggregations.map((agg) => (
                    <div key={agg} className="text-center">
                      <div className="font-medium text-gray-600">
                        {getAggregationLabel(agg)}
                      </div>
                      <div className="text-gray-900">
                        {formatValue((aggregations[agg] as number) || 0)}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </BaseWidget>
        );
      }}
    </WidgetDataProvider>
  );
}