'use client';

import React, { useState, useMemo } from 'react';
import { 
  ResponsiveContainer, 
  ScatterChart, 
  Scatter, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  Legend,
  ReferenceLine,
  ReferenceDot,
  Cell
} from 'recharts';
import BaseWidget from './BaseWidget';
import type { Widget } from './LineChartWidget';
import type { DataSource, ChartAxisConfig } from './TableSelector';
import { useChartData } from './BaseChartWidget';
import { generateChartColors, type ColorPalette } from '@/lib/chart-colors';

// ScatterChart configuration interface
export interface ScatterChartConfig {
  title?: string;
  dataSource?: DataSource;
  xAxis?: ChartAxisConfig;
  yAxis?: ChartAxisConfig;
  options?: {
    colors?: string[];
    columnColors?: Record<string, string>;
    colorPalette?: ColorPalette;
    showGrid?: boolean;
    showLegend?: boolean;
    showDataSummary?: boolean;
    animation?: boolean;
    backgroundColor?: string;
    borderRadius?: string;
    style?: any;
    // Scatter-specific options
    dotSize?: number;
    dotOpacity?: number;
    strokeWidth?: number;
    stroke?: string;
    showReferenceLine?: boolean;
    referenceValue?: { x?: number; y?: number };
    showReferenceDot?: boolean;
    referenceDot?: { x: number; y: number; label?: string };
    fillOpacity?: number;
    hoverScale?: number;
    showTrendLine?: boolean;
    trendLineColor?: string;
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

interface ScatterChartWidgetProps {
  widget: Widget;
  isEditMode?: boolean;
  onEdit?: () => void;
  onDelete?: () => void;
  tenantId?: number;
  databaseId?: number;
}

export default function ScatterChartWidget({ widget, isEditMode, onEdit, onDelete, tenantId, databaseId }: ScatterChartWidgetProps) {
  const [hoveredPoint, setHoveredPoint] = useState<string | null>(null);
  
  // Safely extract config with comprehensive fallbacks
  const config = (widget.config || {}) as ScatterChartConfig;
  const dataSource = config.dataSource || { type: 'table', tableId: 0 };
  const options = config.options || {};
  
  // Support both old and new data source formats
  const enhancedDataSource = dataSource as DataSource;
  const legacyDataSource = dataSource as any;
  
  // Determine axis configuration
  const safeXAxis = enhancedDataSource.xAxis || config.xAxis || { key: 'x', label: 'X Axis', type: 'number' as const, columns: ['x'] };
  const safeYAxis = enhancedDataSource.yAxis || config.yAxis || { key: 'y', label: 'Y Axis', type: 'number' as const, columns: ['y'] };
  
  const { data, isLoading, error, handleRefresh } = useChartData(widget, tenantId, databaseId);

  const processedData = useMemo(() => {
    const rawData = Array.isArray(data) ? data : [];
    
    const xColumn = enhancedDataSource.xAxis?.columns?.[0] || safeXAxis.key;
    const yColumn = enhancedDataSource.yAxis?.columns?.[0] || safeYAxis.key;
    
    console.log('[ScatterChart] Processing data:', {
      rawDataCount: rawData.length,
      xColumn,
      yColumn,
      sampleData: rawData.slice(0, 2)
    });
    
    // Validate and clean data for scatter plot
    const filteredData = rawData.filter(item => {
      if (!item || typeof item !== 'object') return false;
      
      const xValue = item?.[xColumn];
      const yValue = item?.[yColumn];
      
      return xValue !== undefined && xValue !== null && !isNaN(Number(xValue)) &&
             yValue !== undefined && yValue !== null && !isNaN(Number(yValue));
    }).map(item => ({
      [xColumn]: Number(item[xColumn]),
      [yColumn]: Number(item[yColumn])
    }));

    // Apply aggregation if specified
    const xAggregation = enhancedDataSource.xAxis?.aggregation;
    const yAggregation = enhancedDataSource.yAxis?.aggregation;
    
    if (xAggregation && xAggregation !== 'none') {
      console.log('[ScatterChart] Applying X-axis aggregation:', xAggregation);
      return applyAggregation(filteredData, xColumn, xAggregation);
    } else if (yAggregation && yAggregation !== 'none') {
      console.log('[ScatterChart] Applying Y-axis aggregation:', yAggregation);
      return applyAggregation(filteredData, yColumn, yAggregation);
    }
    
    return filteredData;
  }, [data, enhancedDataSource, safeXAxis, safeYAxis]);

  // Generate colors for scatter points
  const colors = useMemo(() => {
    if (options.colors && Array.isArray(options.colors) && options.colors.length > 0) {
      return options.colors;
    }
    
    const colorsNeeded = Math.max(processedData.length, 1);
    const selectedPalette = (options as any).colorPalette || 'luxury';
    
    return generateChartColors(colorsNeeded, selectedPalette);
  }, [options, processedData]);

  // Enhanced styling configuration
  const widgetStyle = {
    backgroundColor: options.backgroundColor || 'transparent',
    borderRadius: (options.borderRadius as any) || 'lg',
  };

  const CustomTooltip = ({ active, payload }: any) => {
    if (active && payload && payload.length) {
      const data = payload[0];
      return (
        <div className="bg-white border border-gray-200 rounded-lg shadow-lg p-3">
          <div className="space-y-1 text-sm">
            <div className="flex justify-between">
              <span className="text-gray-600">X:</span>
              <span className="font-medium text-gray-800">{data.payload.x}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-600">Y:</span>
              <span className="font-medium text-gray-800">{data.payload.y}</span>
            </div>
          </div>
        </div>
      );
    }
    return null;
  };

  // Calculate trend line if enabled
  const calculateTrendLine = () => {
    if (!options.showTrendLine || processedData.length < 2) return null;
    
    const xValues = processedData.map(d => d[safeXAxis.key]);
    const yValues = processedData.map(d => d[safeYAxis.key]);
    
    const n = xValues.length;
    const sumX = xValues.reduce((a, b) => a + b, 0);
    const sumY = yValues.reduce((a, b) => a + b, 0);
    const sumXY = xValues.reduce((sum, x, i) => sum + x * yValues[i], 0);
    const sumXX = xValues.reduce((sum, x) => sum + x * x, 0);
    
    const slope = (n * sumXY - sumX * sumY) / (n * sumXX - sumX * sumX);
    const intercept = (sumY - slope * sumX) / n;
    
    const minX = Math.min(...xValues);
    const maxX = Math.max(...xValues);
    
    return {
      x1: minX,
      y1: slope * minX + intercept,
      x2: maxX,
      y2: slope * maxX + intercept
    };
  };

  const trendLine = calculateTrendLine();

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
            <ScatterChart
              data={processedData}
              margin={{ top: 20, right: 30, left: 20, bottom: 20 }}
            >
              <CartesianGrid 
                strokeDasharray="3 3" 
                stroke="#e5e7eb" 
                strokeOpacity={0.5}
              />
              
              <XAxis 
                type="number"
                dataKey={enhancedDataSource.xAxis?.columns?.[0] || safeXAxis.key}
                name={safeXAxis.label}
                stroke="#6b7280"
                fontSize={12}
                tickLine={false}
                axisLine={false}
              />
              
              <YAxis 
                type="number"
                dataKey={enhancedDataSource.yAxis?.columns?.[0] || safeYAxis.key}
                name={safeYAxis.label}
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
                <>
                  {options.referenceValue.x !== undefined && (
                    <ReferenceLine 
                      x={options.referenceValue.x} 
                      stroke="#ef4444" 
                      strokeDasharray="5 5"
                      strokeWidth={2}
                    />
                  )}
                  {options.referenceValue.y !== undefined && (
                    <ReferenceLine 
                      y={options.referenceValue.y} 
                      stroke="#ef4444" 
                      strokeDasharray="5 5"
                      strokeWidth={2}
                    />
                  )}
                </>
              )}
              
              {options.showReferenceDot && options.referenceDot && (
                <ReferenceDot 
                  x={options.referenceDot.x} 
                  y={options.referenceDot.y} 
                  r={8}
                  fill="#ef4444"
                  stroke="#ffffff"
                  strokeWidth={2}
                  label={options.referenceDot.label}
                />
              )}
              
              <Scatter
                dataKey={enhancedDataSource.yAxis?.columns?.[0] || safeYAxis.key}
                fill={colors[0]}
                fillOpacity={options.fillOpacity || 0.8}
                stroke={options.stroke || colors[0]}
                strokeWidth={options.strokeWidth || 1}
                onMouseEnter={() => setHoveredPoint('scatter')}
                onMouseLeave={() => setHoveredPoint(null)}
              >
                {processedData.map((entry, index) => (
                  <Cell 
                    key={`cell-${index}`}
                    fill={colors[index % colors.length]}
                    r={options.dotSize || 6}
                    style={{
                      transform: hoveredPoint === 'scatter' ? `scale(${options.hoverScale || 1.2})` : 'scale(1)',
                      transition: 'transform 0.2s ease-in-out'
                    }}
                  />
                ))}
              </Scatter>
              
              {/* Trend line */}
              {trendLine && (
                <line
                  x1={trendLine.x1}
                  y1={trendLine.y1}
                  x2={trendLine.x2}
                  y2={trendLine.y2}
                  stroke={options.trendLineColor || '#3b82f6'}
                  strokeWidth={2}
                  strokeDasharray="5 5"
                  opacity={0.7}
                />
              )}
            </ScatterChart>
          </ResponsiveContainer>
          
          {/* Data summary */}
          {options.showDataSummary && (
            <div className="mt-4 p-3 bg-muted/30 rounded-lg">
              <div className="text-sm font-medium text-muted-foreground mb-2">Summary</div>
              <div className="grid grid-cols-2 gap-2 text-xs">
                <div>Total Points: {processedData.length}</div>
                <div>Data Range: {processedData.length > 0 ? 
                  `X: ${Math.min(...processedData.map(d => d[safeXAxis.key]))} - ${Math.max(...processedData.map(d => d[safeXAxis.key]))}` : 
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
