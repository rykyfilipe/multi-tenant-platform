'use client';

import React, { useState, useMemo } from 'react';
import { 
  ResponsiveContainer, 
  PieChart, 
  Pie, 
  Cell, 
  Tooltip, 
  Legend,
  Sector
} from 'recharts';
import BaseWidget from './BaseWidget';
import type { Widget } from './LineChartWidget';
import type { DataSource, ChartAxisConfig } from './TableSelector';
import { useChartData } from './BaseChartWidget';
import { generateChartColors, type ColorPalette } from '@/lib/chart-colors';

// InteractivePieChart configuration interface
export interface InteractivePieChartConfig {
  title?: string;
  dataSource?: DataSource;
  xAxis?: ChartAxisConfig;
  yAxis?: ChartAxisConfig;
  options?: {
    colors?: string[];
    columnColors?: Record<string, string>;
    colorPalette?: ColorPalette;
    showLegend?: boolean;
    showDataSummary?: boolean;
    animation?: boolean;
    backgroundColor?: string;
    borderRadius?: string;
    style?: any;
    // Interactive Pie-specific options
    innerRadius?: number;
    outerRadius?: number;
    paddingAngle?: number;
    strokeWidth?: number;
    stroke?: string;
    showActiveShape?: boolean;
    showPercentage?: boolean;
    showValue?: boolean;
    labelPosition?: 'inside' | 'outside' | 'center';
    animationDuration?: number;
    hoverScale?: number;
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

interface InteractivePieChartWidgetProps {
  widget: Widget;
  isEditMode?: boolean;
  onEdit?: () => void;
  onDelete?: () => void;
  tenantId?: number;
  databaseId?: number;
}

export default function InteractivePieChartWidget({ widget, isEditMode, onEdit, onDelete, tenantId, databaseId }: InteractivePieChartWidgetProps) {
  const [activeIndex, setActiveIndex] = useState<number | null>(null);
  
  // Safely extract config with comprehensive fallbacks
  const config = (widget.config || {}) as InteractivePieChartConfig;
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
    const yColumn = enhancedDataSource.yAxis?.columns?.[0] || safeYAxis.key;
    
    console.log('[InteractivePieChart] Processing data:', {
      rawDataCount: rawData.length,
      xColumn,
      yColumn,
      sampleData: rawData.slice(0, 2)
    });
    
    // Validate and clean data
    const filteredData = rawData.filter(item => {
      if (!item || typeof item !== 'object') return false;
      
      const nameValue = item?.[xColumn];
      const valueValue = item?.[yColumn];
      
      return nameValue !== undefined && nameValue !== null && nameValue !== '' &&
             valueValue !== undefined && valueValue !== null && !isNaN(Number(valueValue));
    }).map(item => ({
      [xColumn]: item[xColumn],
      [yColumn]: item[yColumn]
    }));

    // Apply aggregation if specified
    const xAggregation = enhancedDataSource.xAxis?.aggregation;
    const yAggregation = enhancedDataSource.yAxis?.aggregation;
    
    if (xAggregation && xAggregation !== 'none') {
      console.log('[InteractivePieChart] Applying X-axis aggregation:', xAggregation);
      return applyAggregation(filteredData, xColumn, xAggregation);
    } else if (yAggregation && yAggregation !== 'none') {
      console.log('[InteractivePieChart] Applying Y-axis aggregation:', yAggregation);
      return applyAggregation(filteredData, yColumn, yAggregation);
    }
    
    return filteredData;
  }, [data, enhancedDataSource, safeXAxis, safeYAxis]);

  // Generate colors for pie slices
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
      const total = processedData.reduce((sum, item) => sum + Number(item[safeYAxis.key] || 0), 0);
      const percentage = ((data.value / total) * 100).toFixed(1);
      
      return (
        <div className="bg-white border border-gray-200 rounded-lg shadow-lg p-3">
          <div className="flex items-center space-x-2 mb-2">
            <div 
              className="w-4 h-4 rounded-full" 
              style={{ backgroundColor: data.payload.fill }}
            />
            <span className="font-semibold text-gray-800">{data.name}</span>
          </div>
          <div className="space-y-1 text-sm">
            <div className="flex justify-between">
              <span className="text-gray-600">Value:</span>
              <span className="font-medium text-gray-800">{data.value}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-600">Percentage:</span>
              <span className="font-medium text-gray-800">{percentage}%</span>
            </div>
          </div>
        </div>
      );
    }
    return null;
  };

  const renderActiveShape = (props: any) => {
    const RADIAN = Math.PI / 180;
    const { cx, cy, midAngle, innerRadius, outerRadius, startAngle, endAngle, fill, payload, percent, value } = props;
    const sin = Math.sin(-RADIAN * midAngle);
    const cos = Math.cos(-RADIAN * midAngle);
    const sx = cx + (outerRadius + 10) * cos;
    const sy = cy + (outerRadius + 10) * sin;
    const mx = cx + (outerRadius + 30) * cos;
    const my = cy + (outerRadius + 30) * sin;
    const ex = mx + (cos >= 0 ? 1 : -1) * 22;
    const ey = my;
    const textAnchor = cos >= 0 ? 'start' : 'end';

    return (
      <g>
        <text x={cx} y={cy} dy={8} textAnchor="middle" fill={fill} className="text-sm font-semibold">
          {payload.name}
        </text>
        <Sector
          cx={cx}
          cy={cy}
          innerRadius={innerRadius}
          outerRadius={outerRadius * (options.hoverScale || 1.1)}
          startAngle={startAngle}
          endAngle={endAngle}
          fill={fill}
          stroke={options.stroke || '#ffffff'}
          strokeWidth={options.strokeWidth || 2}
        />
        <Sector
          cx={cx}
          cy={cy}
          startAngle={startAngle}
          endAngle={endAngle}
          innerRadius={outerRadius + 6}
          outerRadius={outerRadius + 10}
          fill={fill}
        />
        <path d={`M${sx},${sy}L${mx},${my}L${ex},${ey}`} stroke={fill} fill="none" />
        <circle cx={ex} cy={ey} r={2} fill={fill} stroke="none" />
        <text x={ex + (cos >= 0 ? 1 : -1) * 12} y={ey} textAnchor={textAnchor} fill="#333" className="text-xs">
          {`${value}`}
        </text>
        <text x={ex + (cos >= 0 ? 1 : -1) * 12} y={ey} dy={18} textAnchor={textAnchor} fill="#999" className="text-xs">
          {`(${(percent * 100).toFixed(1)}%)`}
        </text>
      </g>
    );
  };

  const renderLabel = (entry: any) => {
    if (options.labelPosition === 'center') return null;
    
    const total = processedData.reduce((sum, item) => sum + Number(item[safeYAxis.key] || 0), 0);
    const percentage = ((entry.value / total) * 100).toFixed(1);
    
    if (options.showPercentage && options.showValue) {
      return `${entry.name}: ${entry.value} (${percentage}%)`;
    } else if (options.showPercentage) {
      return `${percentage}%`;
    } else if (options.showValue) {
      return entry.value;
    }
    return entry.name;
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
            <PieChart>
              <Pie
                data={processedData}
                cx="50%"
                cy="50%"
                labelLine={options.labelPosition === 'outside'}
                label={renderLabel}
                outerRadius={(options.outerRadius || 80) * (activeIndex !== null ? (options.hoverScale || 1.1) : 1)}
                innerRadius={options.innerRadius || 0}
                paddingAngle={options.paddingAngle || 2}
                dataKey={enhancedDataSource.yAxis?.columns?.[0] || safeYAxis.key}
                nameKey={enhancedDataSource.xAxis?.columns?.[0] || safeXAxis.key}
                activeShape={options.showActiveShape ? renderActiveShape : undefined}
                onMouseEnter={(_, index) => setActiveIndex(index)}
                onMouseLeave={() => setActiveIndex(null)}
                animationDuration={options.animationDuration || 300}
              >
                {processedData.map((_, index) => (
                  <Cell 
                    key={`cell-${index}`} 
                    fill={colors[index % colors.length]}
                    stroke={options.stroke || '#ffffff'}
                    strokeWidth={options.strokeWidth || 2}
                    style={{
                      filter: activeIndex === index ? 'brightness(1.1)' : 'brightness(1)',
                      transition: 'filter 0.2s ease-in-out'
                    }}
                  />
                ))}
              </Pie>
              
              <Tooltip content={<CustomTooltip />} />
              
              {options.showLegend !== false && (
                <Legend 
                  wrapperStyle={{
                    fontSize: '12px',
                    paddingTop: '10px',
                    maxHeight: '100px',
                    overflow: 'hidden'
                  }}
                  verticalAlign="bottom"
                  height={36}
                  formatter={(value, entry) => {
                    return value.length > 15 ? value.substring(0, 15) + '...' : value;
                  }}
                />
              )}
            </PieChart>
          </ResponsiveContainer>
          
          {/* Data summary */}
          {options.showDataSummary && (
            <div className="mt-4 p-3 bg-muted/30 rounded-lg">
              <div className="text-sm font-medium text-muted-foreground mb-2">Summary</div>
              <div className="grid grid-cols-2 gap-2 text-xs">
                <div>Total Items: {processedData.length}</div>
                <div>Total Value: {processedData.reduce((sum, item) => sum + Number(item[safeYAxis.key] || 0), 0)}</div>
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
