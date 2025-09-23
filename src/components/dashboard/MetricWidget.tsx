'use client';

import { useState, useEffect, useMemo } from 'react';
import { motion } from 'framer-motion';
import { TrendingUp, TrendingDown, Minus, AlertCircle, BarChart3, Calculator } from 'lucide-react';
import BaseWidget from './BaseWidget';
import { api } from '@/lib/api-client';
import type { DataSource } from './TableSelector';

export interface MetricConfig {
  title?: string;
  dataSource: DataSource;
  aggregation: 'sum' | 'avg' | 'min' | 'max' | 'count';
  formatting: {
    type: 'number' | 'currency' | 'percentage';
    decimals: number;
    prefix?: string;
    suffix?: string;
  };
  display: {
    showTrend?: boolean;
    showComparison?: boolean;
    customLabel?: string;
    secondaryMetric?: string;
  };
  style?: {
    backgroundColor?: string;
    textColor?: string;
    accentColor?: string;
  };
}

export interface Widget {
  id: number | string;
  type: string;
  title: string | null;
  position: { x: number; y: number; width: number; height: number };
  config: MetricConfig;
}

interface MetricWidgetProps {
  widget: Widget;
  isEditMode: boolean;
  onEdit: () => void;
  onDelete?: () => void;
  tenantId?: number;
  databaseId?: number;
}

export default function MetricWidget({ 
  widget, 
  isEditMode, 
  onEdit, 
  onDelete, 
  tenantId, 
  databaseId 
}: MetricWidgetProps) {
  const [rawData, setRawData] = useState<any[]>([]);
  const [previousData, setPreviousData] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const config = (widget.config || {}) as any;
  
  // Handle both KPI and Metric widget config structures
  const dataSource = config.dataSource || {};
  const aggregation = config.aggregation || dataSource.aggregation || 'sum';
  const formatting = config.formatting || {
    type: config.options?.format || 'number',
    decimals: config.options?.decimals || 0,
    prefix: config.options?.prefix || '',
    suffix: config.options?.suffix || ''
  };
  const display = config.display || {
    showTrend: config.options?.showTrend || false,
    showComparison: config.options?.showChange || false,
    customLabel: config.options?.customLabel || '',
    secondaryMetric: config.options?.secondaryMetric || ''
  };

  console.log('🔧 [METRIC_DEBUG] Widget Config Analysis:', {
    widgetId: widget.id,
    widgetType: widget.type,
    hasConfig: !!widget.config,
    config: widget.config,
    extractedConfig: {
      dataSource,
      aggregation,
      formatting,
      display
    }
  });

  // Calculate the main metric value
  const kpiValue = useMemo(() => {
    console.log('🧮 [METRIC_DEBUG] Calculating metric value:', {
      rawDataLength: rawData.length,
      rawData: rawData,
      dataSource,
      aggregation
    });

    if (!rawData.length) {
      console.log('❌ [METRIC_DEBUG] No raw data available');
      return null;
    }

    const column = dataSource.yAxis?.columns?.[0] || dataSource.columnY;
    console.log('🎯 [METRIC_DEBUG] Target column:', column);

    if (!column) {
      console.log('❌ [METRIC_DEBUG] No target column found');
      return null;
    }

    const values = rawData
      .map(row => parseFloat(row[column]))
      .filter(val => !isNaN(val));

    console.log('📈 [METRIC_DEBUG] Extracted values:', {
      column,
      values,
      valuesLength: values.length,
      rawColumnData: rawData.map(row => ({ [column]: row[column] }))
    });

    if (!values.length) {
      console.log('❌ [METRIC_DEBUG] No valid numeric values found');
      return null;
    }

    let result: number;
    switch (aggregation) {
      case 'sum':
        result = values.reduce((sum, val) => sum + val, 0);
        break;
      case 'avg':
        result = values.reduce((sum, val) => sum + val, 0) / values.length;
        break;
      case 'min':
        result = Math.min(...values);
        break;
      case 'max':
        result = Math.max(...values);
        break;
      case 'count':
        result = values.length;
        break;
      default:
        result = values.reduce((sum, val) => sum + val, 0);
    }

    console.log('✅ [METRIC_DEBUG] Calculated result:', {
      aggregation,
      result,
      values,
      calculation: `${aggregation}(${values.join(', ')}) = ${result}`
    });

    return result;
  }, [rawData, dataSource, aggregation]);

  // Calculate previous period value for trend
  const previousValue = useMemo(() => {
    if (!previousData.length) return null;

    const column = dataSource.yAxis?.columns?.[0] || dataSource.columnY;
    if (!column) return null;

    const values = previousData
      .map(row => parseFloat(row[column]))
      .filter(val => !isNaN(val));

    if (!values.length) return null;

    let result: number;
    switch (aggregation) {
      case 'sum':
        result = values.reduce((sum, val) => sum + val, 0);
        break;
      case 'avg':
        result = values.reduce((sum, val) => sum + val, 0) / values.length;
        break;
      case 'min':
        result = Math.min(...values);
        break;
      case 'max':
        result = Math.max(...values);
        break;
      case 'count':
        result = values.length;
        break;
      default:
        result = values.reduce((sum, val) => sum + val, 0);
    }

    return result;
  }, [previousData, dataSource, aggregation]);

  // Calculate trend
  const trend = useMemo(() => {
    if (!kpiValue || !previousValue) return null;
    
    const change = kpiValue - previousValue;
    const changePercent = (change / previousValue) * 100;
    
    return {
      change,
      changePercent,
      direction: change > 0 ? 'up' : change < 0 ? 'down' : 'stable'
    };
  }, [kpiValue, previousValue]);

  // Format the KPI value
  const formatValue = (value: number): string => {
    const { type, decimals, prefix = '', suffix = '' } = formatting;

    switch (type) {
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

  // Fetch data from table
  useEffect(() => {
    if (dataSource.type === 'table' && dataSource.tableId && tenantId && databaseId) {
      fetchData();
    } else if (dataSource.type === 'manual') {
      // Mock data for manual mode
      const mockData = [
        { id: 1, revenue: 125000, users: 2847, conversion: 3.2 },
        { id: 2, revenue: 110000, users: 2650, conversion: 2.8 },
        { id: 3, revenue: 135000, users: 3100, conversion: 3.5 },
      ];
      setRawData(mockData);
      
      // Mock previous data for trend
      const mockPreviousData = mockData.map(row => ({
        ...row,
        revenue: row.revenue * 0.9,
        users: Math.floor(row.users * 0.95),
        conversion: row.conversion * 0.98
      }));
      setPreviousData(mockPreviousData);
    }
  }, [dataSource, tenantId, databaseId]);

  const fetchData = async () => {
    if (!tenantId || !databaseId || !dataSource.tableId) return;

    console.log('🔍 [METRIC_DEBUG] Starting fetchData:', {
      tenantId,
      databaseId,
      tableId: dataSource.tableId,
      dataSource,
      aggregation,
      formatting
    });

    setIsLoading(true);
    setError(null);

    try {
      const allRows = await api.tables.getAllRows(tenantId, databaseId, dataSource.tableId, {
        filters: [], // Simplified for now - filters can be added later
        search: '',
        sortBy: 'id',
        sortOrder: 'desc' as const,
      });

      console.log('📊 [METRIC_DEBUG] API Response:', {
        success: allRows.success,
        dataLength: allRows.data?.length || 0,
        rawData: allRows.data,
        fullResponse: allRows
      });

      if (allRows.success && allRows.data) {
        const processedData = (allRows.data ?? []).map((row: any) => {
          const processedRow: any = { id: row.id };
          
          if (row.cells) {
            row.cells.forEach((cell: any) => {
              if (cell?.column?.name) {
                processedRow[cell.column.name] = cell.value;
              }
            });
          }
          
          return processedRow;
        });

        console.log('🔄 [METRIC_DEBUG] Processed Data:', {
          processedDataLength: processedData.length,
          sampleRow: processedData[0],
          allProcessedData: processedData
        });

        setRawData(processedData);

        // Generate previous period data for trend calculation
        if (display.showTrend) {
          const previousData = processedData.map((row: any) => {
            const column = dataSource.yAxis?.columns?.[0] || dataSource.columnY;
            if (column && row[column]) {
              return {
                ...row,
                [column]: parseFloat(row[column]) * 0.9 // Simulate 10% decrease
              };
            }
            return row;
          });
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

  const handleRefresh = () => {
    if (dataSource.type === 'table') {
      fetchData();
    }
  };

  // Render KPI content
  const renderKPIContent = () => {
    // No data source configured
    if (!dataSource.tableId && dataSource.type !== 'manual') {
      return (
        <div className="flex items-center justify-center h-full text-gray-500 min-h-[150px]">
          <div className="text-center p-6">
            <div className="w-12 h-12 bg-gray-100 rounded-2xl flex items-center justify-center mx-auto mb-3">
              <BarChart3 className="w-6 h-6 text-gray-400" />
            </div>
            <p className="text-sm font-medium text-gray-600 mb-1">No data source configured</p>
            <p className="text-xs text-gray-400">
              Please configure a data source to display KPI metrics
            </p>
          </div>
        </div>
      );
    }

    // No column selected
    const column = dataSource.yAxis?.columns?.[0] || dataSource.columnY;
    if (!column) {
      return (
        <div className="flex items-center justify-center h-full text-gray-500 min-h-[150px]">
          <div className="text-center p-6">
            <div className="w-12 h-12 bg-gray-100 rounded-2xl flex items-center justify-center mx-auto mb-3">
              <Calculator className="w-6 h-6 text-gray-400" />
            </div>
            <p className="text-sm font-medium text-gray-600 mb-1">No column selected</p>
            <p className="text-xs text-gray-400">
              Please select a column to calculate KPI values
            </p>
          </div>
        </div>
      );
    }

    // No data available
    if (!kpiValue) {
      console.log('❌ [METRIC_DEBUG] Rendering "No data available" because kpiValue is:', kpiValue);
      return (
        <div className="flex items-center justify-center h-full text-gray-500 min-h-[150px]">
          <div className="text-center p-6">
            <div className="w-12 h-12 bg-red-50 rounded-2xl flex items-center justify-center mx-auto mb-3">
              <AlertCircle className="w-6 h-6 text-red-500" />
            </div>
            <p className="text-sm font-medium text-gray-600 mb-1">No data available</p>
            <p className="text-xs text-gray-400">
              No data found for the selected column and aggregation
            </p>
            <div className="mt-4 text-xs text-gray-400 text-left">
              <p>Debug Info:</p>
              <p>• Raw data length: {rawData.length}</p>
              <p>• Data source: {JSON.stringify(dataSource, null, 2)}</p>
              <p>• Aggregation: {aggregation}</p>
            </div>
          </div>
        </div>
      );
    }

    // Main metric display
    console.log('✅ [METRIC_DEBUG] Rendering metric with data:', {
      kpiValue,
      column,
      aggregation,
      formattedValue: formatValue(kpiValue)
    });

    return (
      <div className="text-center space-y-4 h-full flex flex-col justify-center">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="space-y-3"
        >
          {/* Aggregation label */}
          <div className="flex items-center justify-center space-x-2">
            <BarChart3 className="h-4 w-4 text-gray-500" />
            <span className="text-sm text-gray-500 uppercase tracking-wide">
              {aggregation} of {column}
            </span>
          </div>
          
          {/* Main KPI value */}
          <motion.div
            initial={{ scale: 0.8 }}
            animate={{ scale: 1 }}
            transition={{ duration: 0.3, delay: 0.2 }}
            className="text-4xl sm:text-5xl lg:text-6xl font-bold text-gray-900"
            style={{ color: config.style?.textColor }}
          >
            {formatValue(kpiValue)}
          </motion.div>
          
          {/* Custom label */}
          {display.customLabel && (
            <div className="text-sm text-gray-600 font-medium">
              {display.customLabel}
            </div>
          )}
          
          {/* Trend indicator */}
          {display.showTrend && trend && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ duration: 0.3, delay: 0.4 }}
              className={`flex items-center justify-center space-x-2 ${
                trend.direction === 'up' ? 'text-green-600' : 
                trend.direction === 'down' ? 'text-red-600' : 'text-gray-500'
              }`}
            >
              {trend.direction === 'up' ? (
                <TrendingUp className="h-5 w-5" />
              ) : trend.direction === 'down' ? (
                <TrendingDown className="h-5 w-5" />
              ) : (
                <Minus className="h-5 w-5" />
              )}
              <span className="text-sm font-medium">
                {trend.changePercent > 0 ? '+' : ''}{trend.changePercent.toFixed(1)}%
              </span>
            </motion.div>
          )}
          
          {/* Data count */}
          <div className="text-xs text-gray-400">
            Based on {rawData.length} data points
          </div>
        </motion.div>
      </div>
    );
  };

  return (
    <BaseWidget
      widget={widget}
      isEditMode={isEditMode}
      onEdit={onEdit}
      onDelete={onDelete}
      isLoading={isLoading}
      error={error}
      onRefresh={dataSource.type === 'table' ? handleRefresh : undefined}
      showRefresh={dataSource.type === 'table'}
    >
      {renderKPIContent()}
    </BaseWidget>
  );
}
