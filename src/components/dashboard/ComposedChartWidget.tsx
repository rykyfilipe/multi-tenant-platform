'use client';

import React, { useState, useMemo } from 'react';
import { 
  ResponsiveContainer, 
  ComposedChart, 
  Bar, 
  Line, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  Legend,
  ReferenceLine,
  Brush
} from 'recharts';
import BaseWidget from './BaseWidget';
import type { Widget } from './LineChartWidget';
import type { DataSource, ChartAxisConfig } from './TableSelector';
import { useChartData } from './BaseChartWidget';
import { generateChartColors, type ColorPalette } from '@/lib/chart-colors';

// ComposedChart configuration interface
export interface ComposedChartConfig {
  title?: string;
  dataSource?: DataSource;
  xAxis?: ChartAxisConfig;
  yAxis?: ChartAxisConfig;
  options?: {
    colors?: string[];
    columnColors?: Record<string, string>;
    colorPalette?: ColorPalette;
    strokeWidth?: number;
    dotSize?: number;
    curveType?: 'monotone' | 'linear' | 'step' | 'stepBefore' | 'stepAfter';
    showGrid?: boolean;
    showLegend?: boolean;
    showDataSummary?: boolean;
    animation?: boolean;
    backgroundColor?: string;
    borderRadius?: string;
    style?: any;
    // Composed-specific options
    barColumns?: string[]; // Which columns should be bars
    lineColumns?: string[]; // Which columns should be lines
    barOpacity?: number;
    barRadius?: number;
    showBrush?: boolean;
    showReferenceLine?: boolean;
    referenceValue?: number;
    stackedBars?: boolean;
  };
}

// Aggregation functions
const applyAggregation = (data: any[], key: string, aggregation?: string): any[] => {
  if (!aggregation || aggregation === 'none') {
    return data;
  }

  const grouped = data.reduce((acc: Record<string, any[]>, item: any) => {
    const groupKey = item[key];
    if (!acc[groupKey]) {
      acc[groupKey] = [];
    }
    acc[groupKey].push(item);
    return acc;
  }, {} as Record<string, any[]>);

  return Object.entries(grouped).map(([groupKey, items]: [string, any[]]) => {
    const aggregatedItem: any = { [key]: groupKey };
    
    items.forEach((item: any) => {
      Object.keys(item).forEach(colKey => {
        if (colKey !== key && typeof item[colKey] === 'number') {
          const values = items.map((i: any) => i[colKey]).filter((v: any) => !isNaN(v));
          if (values.length > 0) {
            switch (aggregation) {
              case 'sum':
                aggregatedItem[colKey] = values.reduce((a: number, b: number) => a + b, 0);
                break;
              case 'count':
                aggregatedItem[colKey] = values.length;
                break;
              case 'avg':
                aggregatedItem[colKey] = values.reduce((a: number, b: number) => a + b, 0) / values.length;
                break;
              case 'min':
                aggregatedItem[colKey] = Math.min(...values);
                break;
              case 'max':
                aggregatedItem[colKey] = Math.max(...values);
                break;
              case 'median':
                const sorted = values.sort((a: number, b: number) => a - b);
                const mid = Math.floor(sorted.length / 2);
                aggregatedItem[colKey] = sorted.length % 2 === 0 
                  ? (sorted[mid - 1] + sorted[mid]) / 2 
                  : sorted[mid];
                break;
              case 'stddev':
                const mean = values.reduce((a: number, b: number) => a + b, 0) / values.length;
                const variance = values.reduce((a: number, b: number) => a + Math.pow(b - mean, 2), 0) / values.length;
                aggregatedItem[colKey] = Math.sqrt(variance);
                break;
              default:
                aggregatedItem[colKey] = item[colKey];
            }
          }
        }
      });
    });
    
    return aggregatedItem;
  });
};

interface ComposedChartWidgetProps {
  widget: Widget;
  isEditMode?: boolean;
  onEdit?: () => void;
  onDelete?: () => void;
  tenantId?: number;
  databaseId?: number;
}

export default function ComposedChartWidget({ widget, isEditMode, onEdit, onDelete, tenantId, databaseId }: ComposedChartWidgetProps) {
  const [hoveredElement, setHoveredElement] = useState<string | null>(null);
  
  // Safely extract config with comprehensive fallbacks
  const config = (widget.config || {}) as ComposedChartConfig;
  const dataSource = config.dataSource || { type: 'table', tableId: 0 };
  const options = config.options || {};
  
  // Support both old and new data source formats
  const enhancedDataSource = dataSource as DataSource;
  const legacyDataSource = dataSource as any;
  
  // Determine axis configuration
  const safeXAxis = enhancedDataSource.xAxis || config.xAxis || { key: 'name', label: 'Name', type: 'category' as const, columns: ['name'] };
  const safeYAxis = enhancedDataSource.yAxis || config.yAxis || { key: 'value', label: 'Value', type: 'number' as const, columns: ['value'] };
  
  const { data, isLoading, error, handleRefresh } = useChartData(widget, tenantId, databaseId);

  const processedData = useMemo(() => {
    const rawData = Array.isArray(data) ? data : [];
    
    const xColumn = enhancedDataSource.xAxis?.columns?.[0] || safeXAxis.key;
    const yColumns = enhancedDataSource.yAxis?.columns || [safeYAxis.key];
    
    console.log('[ComposedChart] Processing data:', {
      rawDataCount: rawData.length,
      xColumn,
      yColumns,
      sampleData: rawData.slice(0, 2)
    });
    
    // Validate and clean data
    const filteredData = rawData.filter(item => {
      if (!item || typeof item !== 'object') return false;
      
      const nameValue = item?.[xColumn];
      const hasValidYValue = yColumns.some(yCol => {
        const value = item?.[yCol];
        return value !== undefined && value !== null && !isNaN(Number(value));
      });
      
      return nameValue !== undefined && nameValue !== null && nameValue !== '' && hasValidYValue;
    }).map(item => {
      const processedItem: any = { [xColumn]: item[xColumn] };
      yColumns.forEach(yCol => {
        processedItem[yCol] = item[yCol];
      });
      return processedItem;
    });

    // Apply aggregation if specified
    const xAggregation = enhancedDataSource.xAxis?.aggregation;
    const yAggregation = enhancedDataSource.yAxis?.aggregation;
    
    if (xAggregation && xAggregation !== 'none') {
      console.log('[ComposedChart] Applying X-axis aggregation:', xAggregation);
      return applyAggregation(filteredData, xColumn, xAggregation);
    } else if (yAggregation && yAggregation !== 'none') {
      console.log('[ComposedChart] Applying Y-axis aggregation:', yAggregation);
      return applyAggregation(filteredData, yColumns[0], yAggregation);
    }
    
    return filteredData;
  }, [data, enhancedDataSource, safeXAxis, safeYAxis]);

  // Generate colors for chart elements
  const colors = useMemo(() => {
    if (options.colors && Array.isArray(options.colors) && options.colors.length > 0) {
      return options.colors;
    }
    
    const yColumns = enhancedDataSource.yAxis?.columns || [safeYAxis.key];
    const colorsNeeded = Math.max(yColumns.length, 1);
    const selectedPalette = (options as any).colorPalette || 'luxury';
    
    return generateChartColors(colorsNeeded, selectedPalette);
  }, [options, enhancedDataSource, safeYAxis]);

  // Determine which columns are bars vs lines
  const barColumns = options.barColumns || [];
  const lineColumns = options.lineColumns || [];
  const yColumns = enhancedDataSource.yAxis?.columns || [safeYAxis.key];

  // Enhanced styling configuration
  const widgetStyle = {
    backgroundColor: options.backgroundColor || 'transparent',
    borderRadius: (options.borderRadius as any) || 'lg',
  };

  const CustomTooltip = ({ active, payload, label }: any) => {
    if (active && payload && payload.length) {
      return (
        <div className="bg-white border border-gray-200 rounded-lg shadow-lg p-3">
          <p className="font-semibold text-gray-800 mb-2">{label}</p>
          {payload.map((entry: any, index: number) => (
            <div key={index} className="flex items-center space-x-2 mb-1">
              <div 
                className={`w-3 h-3 rounded-full ${entry.dataKey.includes('line') ? 'rounded-none' : ''}`}
                style={{ backgroundColor: entry.color }}
              />
              <span className="text-sm text-gray-600">{entry.dataKey}:</span>
              <span className="text-sm font-medium text-gray-800">{entry.value}</span>
            </div>
          ))}
        </div>
      );
    }
    return null;
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
      style={widgetStyle}
    >
      {processedData && processedData.length > 0 ? (
        <div className="h-full flex flex-col min-h-0">
          <ResponsiveContainer width="100%" height="100%" minHeight={200}>
            <ComposedChart
              data={processedData}
              margin={{ top: 20, right: 30, left: 20, bottom: 20 }}
            >
              <CartesianGrid 
                strokeDasharray="3 3" 
                stroke="#e5e7eb" 
                strokeOpacity={0.5}
              />
              
              <XAxis 
                dataKey={enhancedDataSource.xAxis?.columns?.[0] || safeXAxis.key}
                stroke="#6b7280"
                fontSize={12}
                tickLine={false}
                axisLine={false}
              />
              
              <YAxis 
                stroke="#6b7280"
                fontSize={12}
                tickLine={false}
                axisLine={false}
              />
              
              <Tooltip content={<CustomTooltip />} />
              
              {options.showLegend !== false && (
                <Legend 
                  wrapperStyle={{
                    fontSize: '12px',
                    paddingTop: '10px',
                    maxHeight: '100px',
                    overflow: 'hidden'
                  }}
                  verticalAlign="top"
                  height={36}
                />
              )}
              
              {options.showReferenceLine && options.referenceValue && (
                <ReferenceLine 
                  y={options.referenceValue} 
                  stroke="#ef4444" 
                  strokeDasharray="5 5"
                  strokeWidth={2}
                />
              )}
              
              {/* Render Bar elements */}
              {yColumns.map((column, index) => {
                if (barColumns.length > 0 && !barColumns.includes(column)) return null;
                
                return (
                  <Bar
                    key={`bar-${column}`}
                    dataKey={column}
                    fill={colors[index % colors.length]}
                    fillOpacity={options.barOpacity || 0.8}
                    radius={options.barRadius ? [options.barRadius, options.barRadius, 0, 0] : [4, 4, 0, 0]}
                    onMouseEnter={() => setHoveredElement(`bar-${column}`)}
                    onMouseLeave={() => setHoveredElement(null)}
                    style={{
                      filter: hoveredElement === `bar-${column}` ? 'brightness(1.1)' : 'brightness(1)',
                      transition: 'filter 0.2s ease-in-out'
                    }}
                  />
                );
              })}
              
              {/* Render Line elements */}
              {yColumns.map((column, index) => {
                if (lineColumns.length > 0 && !lineColumns.includes(column)) return null;
                
                return (
                  <Line
                    key={`line-${column}`}
                    type={options.curveType || "monotone"}
                    dataKey={column}
                    stroke={colors[index % colors.length]}
                    strokeWidth={options.strokeWidth || 2}
                    dot={{ 
                      fill: colors[index % colors.length], 
                      strokeWidth: 2, 
                      r: options.dotSize || 4 
                    }}
                    activeDot={{ 
                      r: (options.dotSize || 4) + 2, 
                      stroke: colors[index % colors.length], 
                      strokeWidth: 2 
                    }}
                    onMouseEnter={() => setHoveredElement(`line-${column}`)}
                    onMouseLeave={() => setHoveredElement(null)}
                    style={{
                      filter: hoveredElement === `line-${column}` ? 'brightness(1.1)' : 'brightness(1)',
                      transition: 'filter 0.2s ease-in-out'
                    }}
                  />
                );
              })}
              
              {options.showBrush && (
                <Brush 
                  dataKey={enhancedDataSource.xAxis?.columns?.[0] || safeXAxis.key}
                  height={30}
                  stroke="#3b82f6"
                  fill="#3b82f6"
                  fillOpacity={0.1}
                />
              )}
            </ComposedChart>
          </ResponsiveContainer>
          
          {/* Data summary */}
          {options.showDataSummary && (
            <div className="mt-4 p-3 bg-muted/30 rounded-lg">
              <div className="text-sm font-medium text-muted-foreground mb-2">Summary</div>
              <div className="grid grid-cols-2 gap-2 text-xs">
                <div>Total Points: {processedData.length}</div>
                <div>Data Range: {processedData.length > 0 ? 
                  `${processedData[0][safeXAxis.key]} - ${processedData[processedData.length - 1][safeXAxis.key]}` : 
                  'N/A'
                }</div>
              </div>
            </div>
          )}
        </div>
      ) : (
        <div className="flex items-center justify-center h-full text-muted-foreground">
          <div className="text-center p-6">
            <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-muted/20 flex items-center justify-center">
              <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
              </svg>
            </div>
            <p className="text-sm font-medium">No data available</p>
            <p className="text-xs text-muted-foreground mt-1">
              Select a table and columns to load data
            </p>
          </div>
        </div>
      )}
    </BaseWidget>
  );
}
