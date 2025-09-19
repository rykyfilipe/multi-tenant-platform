'use client';

import { useState, useEffect, useMemo } from 'react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend } from 'recharts';
import BaseWidget from './BaseWidget';
import { WidgetDataProvider } from './WidgetDataProvider';
import { generateChartColors, type ColorPalette } from '@/lib/chart-colors';
import { WidgetProps, BaseWidget as BaseWidgetType } from '@/types/widgets';
import { FilterConfig } from '@/types/filtering-enhanced';

export interface ChartDataPoint {
  [key: string]: any;
}

export interface DataSource {
  type: 'manual' | 'table';
  tableId?: number;
  columnX?: string;
  columnY?: string;
  filters?: FilterConfig[];
  manualData?: ChartDataPoint[];
  aggregation?: string;
  groupBy?: string;
}


export interface Filter {
  id: string;
  column: string;
  operator: 'equals' | 'not_equals' | 'contains' | 'not_contains' | 'greater_than' | 'less_than' | 'is_empty' | 'is_not_empty';
  value: string | number;
}

export interface LineChartConfig {
  title?: string;
  dataSource: DataSource;
  xAxis: {
    key: string;
    label?: string;
    type?: 'category' | 'number' | 'time';
    aggregation?: string;
  };
  yAxis: {
    key: string;
    label?: string;
    type?: 'number';
    aggregation?: string;
  };
  options?: {
    colors?: string[];
    colorPalette?: ColorPalette;
    showLegend?: boolean;
    showGrid?: boolean;
    strokeWidth?: number;
    dotSize?: number;
    curveType?: 'monotone' | 'linear' | 'step' | 'stepBefore' | 'stepAfter';
    // Enhanced styling options
    backgroundColor?: string;
    borderRadius?: 'none' | 'sm' | 'md' | 'lg' | 'xl' | '2xl' | '3xl';
    shadow?: 'none' | 'sm' | 'md' | 'lg' | 'xl' | '2xl';
    padding?: 'none' | 'sm' | 'md' | 'lg' | 'xl';
    hoverEffect?: 'none' | 'lift' | 'glow' | 'scale' | 'rotate';
    showDataSummary?: boolean;
    gradientFill?: boolean;
    areaFill?: boolean;
    animation?: boolean;
  };
}

interface LineChartWidgetProps extends WidgetProps {
  widget: BaseWidgetType;
}

// Mock data generator for demonstration
const generateMockData = (count: number = 10): ChartDataPoint[] => {
  const data: ChartDataPoint[] = [];
  const now = new Date();
  
  for (let i = count - 1; i >= 0; i--) {
    const date = new Date(now);
    date.setDate(date.getDate() - i);
    
    data.push({
      date: date.toISOString().split('T')[0],
      value: Math.floor(Math.random() * 1000) + 100,
      sales: Math.floor(Math.random() * 500) + 50,
      users: Math.floor(Math.random() * 200) + 20,
    });
  }
  
  return data;
};

// Fetch data from table API
// Helper function to convert FilterConfig to API format
const convertFiltersToApiFormat = (filters: FilterConfig[]): any[] => {
  return filters.map(filter => ({
    column: filter.columnName,
    operator: filter.operator,
    value: filter.value
  }));
};

const fetchTableData = async (dataSource: DataSource): Promise<ChartDataPoint[]> => {
  if (dataSource.type !== 'table' || !dataSource.tableId) {
    throw new Error('Invalid table data source');
  }

  try {
    // Fetch all data with pagination support
    let allRows: any[] = [];
    let page = 1;
    const pageSize = 1000; // Reasonable page size
    let hasMoreData = true;

    while (hasMoreData) {
      const params = new URLSearchParams();
      params.set('page', page.toString());
      params.set('pageSize', pageSize.toString());
      params.set('includeCells', 'true');
      
      if (dataSource.filters && dataSource.filters.length > 0) {
        const apiFilters = convertFiltersToApiFormat(dataSource.filters);
        if (apiFilters.length > 0) {
          params.set('filters', encodeURIComponent(JSON.stringify(apiFilters)));
        }
      }
      
      const response = await fetch(`/api/tenants/1/databases/1/tables/${dataSource.tableId}/rows?` + params.toString());

      if (!response.ok) {
        throw new Error(`Failed to fetch table data: ${response.statusText}`);
      }

      const result = await response.json();
      const rows = result.data || [];
      
      allRows = [...allRows, ...rows];
      
      // Check if we have more data
      hasMoreData = rows.length === pageSize;
      page++;
      
      // Safety limit to prevent infinite loops
      if (page > 100) {
        console.warn('Reached maximum page limit (100) for chart data');
        break;
      }
    }

    const rows = allRows;
    
    // Transform rows with cells to chart data
    const xKey = dataSource.columnX || 'x';
    const yKey = dataSource.columnY || 'y';
    
    return (rows ?? []).map((row: any) => {
      const dataPoint: any = {};
      if (row?.cells && Array.isArray(row.cells)) {
        // Find X and Y column values from cells
        const xCell = row.cells.find((cell: any) => cell?.column?.name === xKey);
        const yCell = row.cells.find((cell: any) => cell?.column?.name === yKey);
        
        // Safely assign values with fallbacks
        dataPoint[xKey] = xCell?.value || '';
        dataPoint[yKey] = parseFloat(yCell?.value) || 0;
      }
      return dataPoint;
    }).filter((point: any) => {
      // Ensure both x and y values exist and are valid
      const xValue = point?.[xKey];
      const yValue = point?.[yKey];
      return xValue !== undefined && xValue !== null && xValue !== '' && 
             yValue !== undefined && yValue !== null && !isNaN(yValue);
    });
  } catch (error) {
    console.error('Error fetching table data:', error);
    throw error;
  }
};

export function LineChartWidget({ widget, isEditMode = false, onEdit, onDelete }: LineChartWidgetProps) {
  // Safely extract config with comprehensive fallbacks
  const config = (widget.config as LineChartConfig) || {};
  const options = config.options || {};
  const dataSource = config.dataSource || { type: 'manual', manualData: [] };
  
  // Ensure xAxis and yAxis have proper fallbacks
  const safeXAxis = config.xAxis || { key: 'x', label: 'X Axis', type: 'category' as const };
  const safeYAxis = config.yAxis || { key: 'y', label: 'Y Axis', type: 'number' as const };

  // Early return if widget is malformed
  if (!widget || typeof widget !== 'object') {
    return (
      <BaseWidget
        widget={widget}
        isEditMode={isEditMode}
        onEdit={onEdit}
        isLoading={false}
        error="Invalid widget configuration"
      >
        <div className="flex items-center justify-center h-full text-red-500">
          <div className="text-center">
            <p className="text-sm">Invalid widget configuration</p>
          </div>
        </div>
      </BaseWidget>
    );
  }

  return (
    <WidgetDataProvider widget={widget}>
      {({ data, isLoading, error, refetch }) => {
        return (
          <LineChartWidgetContent
            widget={widget}
            isEditMode={isEditMode}
            onEdit={onEdit}
            onDelete={onDelete}
            data={data}
            isLoading={isLoading}
            error={error}
            onRefresh={refetch}
            config={config}
            safeXAxis={safeXAxis}
            safeYAxis={safeYAxis}
            options={options}
          />
        );
      }}
    </WidgetDataProvider>
  );
}

interface LineChartWidgetContentProps {
  widget: BaseWidgetType;
  isEditMode: boolean;
  onEdit?: () => void;
  onDelete?: () => void;
  data: any;
  isLoading: boolean;
  error: string | null;
  onRefresh: () => void;
  config: LineChartConfig;
  safeXAxis: any;
  safeYAxis: any;
  options: any;
}

function LineChartWidgetContent({ 
  widget, 
  isEditMode, 
  onEdit, 
  onDelete, 
  data, 
  isLoading, 
  error, 
  onRefresh,
  config,
  safeXAxis,
  safeYAxis,
  options
}: LineChartWidgetContentProps) {

  // Process data from WidgetDataProvider
  const processedData = useMemo(() => {
    // Data is already mapped by WidgetDataProvider and ChartDataMapper
    if (data && typeof data === 'object' && 'labels' in data && 'datasets' in data) {
      // Chart data is already in the correct format
      const labels = data.labels || [];
      const datasets = data.datasets || [];
      
      if (datasets.length > 0) {
        return labels.map((label: string, index: number) => ({
          [safeXAxis.key]: label,
          [safeYAxis.key]: datasets[0].data[index] || 0
        }));
      }
    }
    
    // Fallback: process raw data if it's not in chart format
    const rawData = Array.isArray(data) ? data : [];
    return rawData.filter(item => {
      if (!item || typeof item !== 'object') return false;
      
      const xValue = item?.[safeXAxis.key];
      const yValue = item?.[safeYAxis.key];
      
      return xValue !== undefined && xValue !== null && xValue !== '' &&
             yValue !== undefined && yValue !== null && !isNaN(Number(yValue));
    });
  }, [data, safeXAxis.key, safeYAxis.key]);

  // Generate automatic colors based on data length
  const colors = useMemo(() => {
    if (options.colors && Array.isArray(options.colors) && options.colors.length > 0) {
      return options.colors;
    }
    const colorPalette = options.colorPalette || 'business';
    return generateChartColors(processedData.length > 0 ? 1 : 4, colorPalette);
  }, [options.colors, options.colorPalette, processedData.length]);

  const strokeWidth = options.strokeWidth || 2;
  const dotSize = options.dotSize || 4;
  const curveType = options.curveType || 'monotone';

  // Enhanced styling configuration
  const widgetStyle = {
    backgroundColor: options.backgroundColor || 'transparent',
    borderRadius: options.borderRadius || 'lg',
    shadow: options.shadow || 'sm',
    padding: options.padding || 'md',
    hoverEffect: options.hoverEffect || 'lift',
    ...(widget as any).style
  };

  const handleRefresh = async () => {
    if (dataSource.type === 'table' && dataSource.tableId) {
      try {
        setIsLoading(true);
        setError(null);
        const tableData = await fetchTableData(dataSource);
        setData(tableData);
        setLastFetchTime(new Date());
      } catch (err) {
        console.error('Error refreshing data:', err);
        setError(err instanceof Error ? err.message : 'Failed to refresh data');
      } finally {
        setIsLoading(false);
      }
    }
  };

  // Loading state is now handled by BaseWidget

  // Error state is now handled by BaseWidget

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
        <div className="h-full flex flex-col">
          <ResponsiveContainer width="100%" height="100%">
            <LineChart 
              data={processedData} 
              margin={{ top: 20, right: 30, left: 20, bottom: 20 }}
            >
              {options.showGrid !== false && (
                <CartesianGrid 
                  strokeDasharray="3 3" 
                  stroke="hsl(var(--muted-foreground) / 0.2)" 
                  strokeWidth={1}
                />
              )}
              <XAxis 
                dataKey={safeXAxis.key}
                stroke="hsl(var(--muted-foreground))"
                fontSize={12}
                tickLine={false}
                axisLine={false}
                tick={{ fill: 'hsl(var(--muted-foreground))' }}
                label={safeXAxis.label ? { 
                  value: safeXAxis.label, 
                  position: 'insideBottom', 
                  offset: -10,
                  style: { textAnchor: 'middle', fill: 'hsl(var(--muted-foreground))' }
                } : undefined}
              />
              <YAxis 
                stroke="hsl(var(--muted-foreground))"
                fontSize={12}
                tickLine={false}
                axisLine={false}
                tick={{ fill: 'hsl(var(--muted-foreground))' }}
                label={safeYAxis.label ? { 
                  value: safeYAxis.label, 
                  angle: -90, 
                  position: 'insideLeft',
                  style: { textAnchor: 'middle', fill: 'hsl(var(--muted-foreground))' }
                } : undefined}
              />
              <Tooltip
                contentStyle={{
                  backgroundColor: 'hsl(var(--background))',
                  border: '1px solid hsl(var(--border))',
                  borderRadius: '8px',
                  boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)',
                  fontSize: '14px'
                }}
                labelStyle={{ color: 'hsl(var(--foreground))', fontWeight: '500' }}
                formatter={(value, name) => [value, name]}
              />
              {options.showLegend !== false && (
                <Legend 
                  wrapperStyle={{
                    fontSize: '12px',
                    paddingTop: '10px'
                  }}
                />
              )}
              <Line
                type={curveType}
                dataKey={safeYAxis.key}
                stroke={colors[0]}
                strokeWidth={strokeWidth}
                dot={{ fill: colors[0], strokeWidth: 2, r: dotSize, stroke: '#ffffff' }}
                activeDot={{ 
                  r: dotSize + 2, 
                  stroke: colors[0], 
                  strokeWidth: 2,
                  fill: '#ffffff'
                }}
                animationDuration={options.animation !== false ? 1000 : 0}
              />
            </LineChart>
          </ResponsiveContainer>
          
          {/* Data summary */}
          {options.showDataSummary && (
            <div className="mt-4 p-3 bg-muted/30 rounded-lg">
              <div className="text-sm font-medium text-muted-foreground mb-2">Summary</div>
              <div className="grid grid-cols-2 gap-2 text-xs">
                <div>Data Points: {processedData.length}</div>
                <div>Max Value: {Math.max(...processedData.map((d : any)=> Number(d[safeYAxis.key] || 0)))}</div>
                <div>Min Value: {Math.min(...processedData.map((d : any)=> Number(d[safeYAxis.key] || 0)))}</div>
                <div>Avg Value: {(processedData.reduce((sum : any, d : any) => sum + Number(d[safeYAxis.key] || 0), 0) / processedData.length).toFixed(2)}</div>
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
              {dataSource.type === 'manual' 
                ? 'Add some data points to see the chart' 
                : 'Select a table and columns to load data'
              }
            </p>
          </div>
        </div>
      )}
    </BaseWidget>
  );
}
