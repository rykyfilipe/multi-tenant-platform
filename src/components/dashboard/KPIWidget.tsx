'use client';

import { useState, useEffect } from 'react';
import { TrendingUp, TrendingDown, Minus, AlertCircle } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import BaseWidget from './BaseWidget';
import { api } from '@/lib/api-client';

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
  aggregation?: 'sum' | 'count' | 'avg' | 'min' | 'max';
  filters?: any[];
}

export interface KPIConfig {
  title?: string;
  dataSource: KPIDataSource;
  options?: {
    format?: 'number' | 'currency' | 'percentage';
    decimals?: number;
    prefix?: string;
    suffix?: string;
    showChange?: boolean;
    showTrend?: boolean;
    thresholds?: {
      warning?: number;
      danger?: number;
      success?: number;
    };
    colors?: {
      positive?: string;
      negative?: string;
      neutral?: string;
    };
  };
}

export interface Widget {
  id: number;
  type: string;
  title: string | null;
  position: { x: number; y: number; width: number; height: number };
  config: KPIConfig;
}

interface KPIWidgetProps {
  widget: Widget;
  isEditMode: boolean;
  onEdit: () => void;
  tenantId?: number;
  databaseId?: number;
}

export function KPIWidget({ widget, isEditMode, onEdit, tenantId, databaseId }: KPIWidgetProps) {
  const [data, setData] = useState<KPIDataPoint[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const config = widget.config as KPIConfig;
  const dataSource = config.dataSource;
  const options = config.options || {};

  useEffect(() => {
    if (dataSource.type === 'table' && tenantId && databaseId && dataSource.tableId && dataSource.column) {
      fetchTableData();
    } else if (dataSource.type === 'manual') {
      // For manual data, we'll use mock data for now
      setData([
        { label: 'Total Revenue', value: 125000, previousValue: 110000, change: 15000, changePercent: 13.6 },
        { label: 'Active Users', value: 2847, previousValue: 2650, change: 197, changePercent: 7.4 },
        { label: 'Conversion Rate', value: 3.2, previousValue: 2.8, change: 0.4, changePercent: 14.3 },
      ]);
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
        const values = (response.data.rows ?? []).map((row: any) => {
          const cell = row?.cells?.find((c: any) => c?.column?.name === dataSource.column);
          return cell ? parseFloat(cell.value) || 0 : 0;
        });

        const aggregatedValue = aggregateValues(values, dataSource.aggregation || 'sum');
        
        setData([{
          label: dataSource.column,
          value: aggregatedValue,
          previousValue: aggregatedValue * 0.9, // Mock previous value
          change: aggregatedValue * 0.1,
          changePercent: 10
        }]);
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

  if (isLoading) {
    return (
      <BaseWidget
        widget={widget}
        isEditMode={isEditMode}
        onEdit={onEdit}
        isLoading={true}
        error={null}
        onRefresh={dataSource.type === 'table' ? handleRefresh : undefined}
        showRefresh={dataSource.type === 'table'}
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
        isLoading={false}
        error={error}
        onRefresh={dataSource.type === 'table' ? handleRefresh : undefined}
        showRefresh={dataSource.type === 'table'}
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

  return (
    <BaseWidget
      widget={widget}
      isEditMode={isEditMode}
      onEdit={onEdit}
      isLoading={false}
      error={null}
      onRefresh={dataSource.type === 'table' ? handleRefresh : undefined}
      showRefresh={dataSource.type === 'table'}
    >
      <div className="space-y-4">
        {(data ?? []).map((kpi, index) => (
          <div key={index} className="text-center">
            <div className="text-sm text-gray-600 mb-1">{kpi?.label || ''}</div>
            <div className={`text-3xl font-bold ${getThresholdColor(kpi?.value || 0)}`}>
              {formatValue(kpi?.value || 0)}
            </div>
            {options.showChange && kpi?.changePercent !== undefined && (
              <div className={`flex items-center justify-center space-x-1 text-sm ${getTrendColor(kpi.changePercent)}`}>
                {options.showTrend && getTrendIcon(kpi.changePercent)}
                <span>
                  {kpi.changePercent > 0 ? '+' : ''}{kpi.changePercent.toFixed(1)}%
                </span>
              </div>
            )}
          </div>
        ))}
      </div>
    </BaseWidget>
  );
}

export default KPIWidget;
