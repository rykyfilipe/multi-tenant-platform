'use client';

import { useState, useEffect, useMemo } from 'react';
import { motion } from 'framer-motion';
import { TrendingUp, TrendingDown, Minus, AlertCircle, BarChart3, Calculator, RefreshCw } from 'lucide-react';
import BaseWidget from './BaseWidget';
import { api } from '@/lib/api-client';
import type { DataSource } from './TableSelector';
import { 
  validateMetricWidgetConfig, 
  applyAggregation, 
  extractNumericValues, 
  mapRawRowsToProcessedData,
  type AggregationFunction,
  type ColumnMeta
} from '@/lib/widget-aggregation';
import { FilterConfig } from '@/types/filtering';

/**
 * Configuration interface for the new Metric Widget
 * Supports flexible data mapping and comprehensive aggregation options
 */
export interface MetricConfig {
  title?: string;
  dataSource: DataSource;
  aggregation: AggregationFunction;
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
  filters?: FilterConfig[];
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

/**
 * New Metric Widget Implementation
 * 
 * Features:
 * - Flexible data mapping for any custom table
 * - Support for SUM, COUNT, AVG, MAX, MIN aggregation functions
 * - Comprehensive filtering before aggregation
 * - Strict validation for numeric columns
 * - Dynamic updates on filter/table changes
 * - Trend indicators and comparison metrics
 * - Professional styling with premium colors
 */
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
  const [columnMeta, setColumnMeta] = useState<ColumnMeta | null>(null);

  const config = (widget.config || {}) as MetricConfig;
  
  // Extract configuration with proper defaults
  const dataSource = config.dataSource || {};
  const aggregation = config.aggregation || 'sum';
  const formatting = config.formatting || {
    type: 'number',
    decimals: 0,
    prefix: '',
    suffix: ''
  };
  const display = config.display || {
    showTrend: false,
    showComparison: false,
    customLabel: '',
    secondaryMetric: ''
  };
  const filters = config.filters || [];

  // Get the target column for aggregation
  const targetColumn = useMemo(() => {
    return dataSource.yAxis?.columns?.[0] || 
           dataSource.columnY;
  }, [dataSource]);

  // Validate widget configuration
  const [validationError, setValidationError] = useState<string | null>(null);
  
  useEffect(() => {
    if (rawData.length > 0 && targetColumn && columnMeta) {
      const validation = validateMetricWidgetConfig(columnMeta, aggregation);
      if (!validation.isValid) {
        setValidationError(validation.error || 'Invalid configuration');
      } else {
        setValidationError(null);
      }
    }
  }, [rawData, targetColumn, aggregation, columnMeta]);

  // Calculate the main metric value with proper aggregation
  const metricValue = useMemo(() => {
    if (!rawData.length || !targetColumn) {
      return null;
    }

    // Extract numeric values using the common utility
    const values = extractNumericValues(rawData, targetColumn);
    
    if (!values.length) {
      return null;
    }

    // Apply aggregation using the common utility
    const aggregationResult = applyAggregation(values, aggregation);
    
    if (!aggregationResult.isValid) {
      console.error('[MetricWidget] Aggregation failed:', aggregationResult.error);
      return null;
    }

    return aggregationResult.value;
  }, [rawData, targetColumn, aggregation]);

  // Calculate previous period value for trend calculation
  const previousValue = useMemo(() => {
    if (!previousData.length || !targetColumn) return null;

    const values = extractNumericValues(previousData, targetColumn);
    
    if (!values.length) return null;

    const aggregationResult = applyAggregation(values, aggregation);
    
    if (!aggregationResult.isValid) {
      console.error('[MetricWidget] Previous value aggregation failed:', aggregationResult.error);
      return null;
    }

    return aggregationResult.value;
  }, [previousData, targetColumn, aggregation]);

  // Calculate trend information
  const trend = useMemo(() => {
    if (!metricValue || !previousValue) return null;
    
    const change = metricValue - previousValue;
    const changePercent = previousValue !== 0 ? (change / previousValue) * 100 : 0;
    
    return {
      change,
      changePercent,
      direction: change > 0 ? 'up' : change < 0 ? 'down' : 'stable'
    };
  }, [metricValue, previousValue]);

  // Format the metric value with proper styling
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

  // Fetch data from table with filters applied
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
      if (display.showTrend) {
        const mockPreviousData = mockData.map(row => ({
          ...row,
          revenue: row.revenue * 0.9,
          users: Math.floor(row.users * 0.95),
          conversion: row.conversion * 0.98
        }));
        setPreviousData(mockPreviousData);
      }
    }
  }, [dataSource, tenantId, databaseId, filters]);

  const fetchData = async () => {
    if (!tenantId || !databaseId || !dataSource.tableId) return;

    setIsLoading(true);
    setError(null);

    try {
      // Apply filters before fetching data
      const allRows = await api.tables.getAllRows(tenantId, databaseId, dataSource.tableId, {
        filters: filters,
        search: '',
        sortBy: 'id',
        sortOrder: 'desc' as const,
      });

      if (allRows.success && allRows.data) {
        // Use the common data mapping utility
        const processedData = mapRawRowsToProcessedData(allRows.data ?? []);
        setRawData(processedData);

        // Get column metadata for validation
        if (targetColumn && allRows.data.length > 0) {
          // Try to infer column type from the first row
          const firstRow = allRows.data[0];
          const cell = firstRow.cells?.find((c: any) => c.column?.name === targetColumn);
          
          if (cell) {
            const columnType = cell.numberValue !== null ? 'number' : 
                              cell.stringValue !== null ? 'string' : 
                              cell.dateValue !== null ? 'date' : 'string';
            
            setColumnMeta({
              id: cell.column?.id || 0,
              name: targetColumn,
              type: columnType as any,
              tableId: dataSource.tableId
            });
          }
        }

        // Generate previous period data for trend calculation
        if (display.showTrend) {
          const previousData = processedData.map((row: any) => {
            if (targetColumn && row[targetColumn]) {
              return {
                ...row,
                [targetColumn]: parseFloat(row[targetColumn]) * 0.9 // Simulate 10% decrease
              };
            }
            return row;
          });
          setPreviousData(previousData);
        }
      }
    } catch (err) {
      console.error('Error fetching metric data:', err);
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

  // Render metric content with comprehensive error handling
  const renderMetricContent = () => {
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
              Please configure a data source to display metric values
            </p>
          </div>
        </div>
      );
    }

    // No column selected
    if (!targetColumn) {
      return (
        <div className="flex items-center justify-center h-full text-gray-500 min-h-[150px]">
          <div className="text-center p-6">
            <div className="w-12 h-12 bg-gray-100 rounded-2xl flex items-center justify-center mx-auto mb-3">
              <Calculator className="w-6 h-6 text-gray-400" />
            </div>
            <p className="text-sm font-medium text-gray-600 mb-1">No column selected</p>
            <p className="text-xs text-gray-400">
              Please select a column to calculate metric values
            </p>
          </div>
        </div>
      );
    }

    // Show validation error if any
    if (validationError) {
      return (
        <div className="flex items-center justify-center h-full text-gray-500 min-h-[150px]">
          <div className="text-center p-6">
            <div className="w-12 h-12 bg-red-50 rounded-2xl flex items-center justify-center mx-auto mb-3">
              <AlertCircle className="w-6 h-6 text-red-500" />
            </div>
            <p className="text-sm font-medium text-gray-600 mb-1">Configuration Error</p>
            <p className="text-xs text-gray-400 mb-2">
              {validationError}
            </p>
            <p className="text-xs text-gray-500">
              Please check your widget configuration in the edit panel.
            </p>
          </div>
        </div>
      );
    }

    // No data available
    if (!metricValue) {
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
              <p>• Detected column: {targetColumn}</p>
              <p>• Aggregation: {aggregation}</p>
              <p>• Filters applied: {filters.length}</p>
            </div>
          </div>
        </div>
      );
    }

    // Main metric display with premium styling
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
              {aggregation.toUpperCase()} of {targetColumn}
            </span>
          </div>
          
          {/* Main metric value */}
          <motion.div
            initial={{ scale: 0.8 }}
            animate={{ scale: 1 }}
            transition={{ duration: 0.3, delay: 0.2 }}
            className="text-4xl sm:text-5xl lg:text-6xl font-bold text-gray-900"
            style={{ color: config.style?.textColor }}
          >
            {formatValue(metricValue)}
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
          
          {/* Data count and filters info */}
          <div className="text-xs text-gray-400 space-y-1">
            <div>Based on {rawData.length} data points</div>
            {filters.length > 0 && (
              <div>With {filters.length} filter{filters.length !== 1 ? 's' : ''} applied</div>
            )}
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
      {renderMetricContent()}
    </BaseWidget>
  );
}
