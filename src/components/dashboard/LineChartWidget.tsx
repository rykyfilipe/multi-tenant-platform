'use client';

import { useState, useEffect, useMemo } from 'react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend } from 'recharts';
import BaseWidget from './BaseWidget';

export interface ChartDataPoint {
  [key: string]: any;
}

export interface DataSource {
  type: 'manual' | 'table';
  tableId?: number;
  columnX?: string;
  columnY?: string;
  filters?: Filter[];
  manualData?: ChartDataPoint[];
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
  };
  yAxis: {
    key: string;
    label?: string;
    type?: 'number';
  };
  options?: {
    colors?: string[];
    showLegend?: boolean;
    showGrid?: boolean;
    strokeWidth?: number;
    dotSize?: number;
    curveType?: 'monotone' | 'linear' | 'step' | 'stepBefore' | 'stepAfter';
  };
}

export interface Widget {
  id: number;
  type: string;
  title: string | null;
  position: { x: number; y: number; width: number; height: number };
  config: LineChartConfig;
  isVisible: boolean;
  order: number;
}

interface LineChartWidgetProps {
  widget: Widget;
  isEditMode?: boolean;
  onEdit?: () => void;
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
const fetchTableData = async (dataSource: DataSource): Promise<ChartDataPoint[]> => {
  if (dataSource.type !== 'table' || !dataSource.tableId) {
    throw new Error('Invalid table data source');
  }

  try {
    const params = new URLSearchParams();
    params.set('page', '1');
    params.set('pageSize', '1000');
    params.set('includeCells', 'true');
    if (dataSource.filters && dataSource.filters.length > 0) {
      params.set('filters', encodeURIComponent(JSON.stringify(dataSource.filters)));
    }
    
    const response = await fetch(`/api/tenants/1/databases/1/tables/${dataSource.tableId}/rows?` + params.toString());

    if (!response.ok) {
      throw new Error(`Failed to fetch table data: ${response.statusText}`);
    }

    const result = await response.json();
    const rows = result.data || [];
    
    // Transform rows with cells to chart data
    return rows.map((row: any) => {
      const dataPoint: any = {};
      if (row.cells) {
        // Find X and Y column values from cells
        const xCell = row.cells.find((cell: any) => cell.column.name === dataSource.columnX);
        const yCell = row.cells.find((cell: any) => cell.column.name === dataSource.columnY);
        
        dataPoint[dataSource.columnX || 'x'] = xCell?.value || '';
        dataPoint[dataSource.columnY || 'y'] = parseFloat(yCell?.value) || 0;
      }
      return dataPoint;
    }).filter((point: any) => point[dataSource.columnX || 'x'] && point[dataSource.columnY || 'y'] !== undefined);
  } catch (error) {
    console.error('Error fetching table data:', error);
    throw error;
  }
};

export function LineChartWidget({ widget, isEditMode = false, onEdit }: LineChartWidgetProps) {
  const [data, setData] = useState<ChartDataPoint[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [lastFetchTime, setLastFetchTime] = useState<Date | null>(null);

  const config = widget.config as LineChartConfig || {};
  const options = config.options || {};
  const dataSource = config.dataSource || { type: 'manual', manualData: [] };

  // Process data based on data source type
  const processedData = useMemo(() => {
    if (dataSource.type === 'manual' && dataSource.manualData) {
      return dataSource.manualData;
    }
    return data;
  }, [dataSource, data]);

  // Fetch data when dataSource changes
  useEffect(() => {
    const loadData = async () => {
      try {
        setIsLoading(true);
        setError(null);

        if (dataSource.type === 'manual' && dataSource.manualData) {
          // Use manual data directly
          setData(dataSource.manualData);
        } else if (dataSource.type === 'table' && dataSource.tableId) {
          // Fetch from table
          const tableData = await fetchTableData(dataSource);
          setData(tableData);
          setLastFetchTime(new Date());
        } else {
          // Fallback to mock data
          const mockData = generateMockData(20);
          setData(mockData);
        }
      } catch (err) {
        console.error('Error loading chart data:', err);
        setError(err instanceof Error ? err.message : 'Failed to load chart data');
        
        // Fallback to mock data on error
        const mockData = generateMockData(20);
        setData(mockData);
      } finally {
        setIsLoading(false);
      }
    };

    loadData();
  }, [dataSource]);

  const colors = options.colors || ['#3B82F6', '#EF4444', '#10B981', '#F59E0B'];
  const strokeWidth = options.strokeWidth || 2;
  const dotSize = options.dotSize || 4;
  const curveType = options.curveType || 'monotone';

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
      isLoading={isLoading}
      error={error}
      onRefresh={dataSource.type === 'table' ? handleRefresh : undefined}
      showRefresh={dataSource.type === 'table'}
    >
      <ResponsiveContainer width="100%" height="100%">
        <LineChart 
          data={processedData} 
          margin={{ top: 5, right: 30, left: 20, bottom: 5 }}
        >
          {options.showGrid !== false && (
            <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
          )}
          <XAxis 
            dataKey={config.xAxis?.key || 'x'}
            stroke="#666"
            fontSize={12}
            tickLine={false}
            axisLine={false}
            label={config.xAxis?.label ? { value: config.xAxis.label, position: 'insideBottom', offset: -5 } : undefined}
          />
          <YAxis 
            stroke="#666"
            fontSize={12}
            tickLine={false}
            axisLine={false}
            label={config.yAxis?.label ? { value: config.yAxis.label, angle: -90, position: 'insideLeft' } : undefined}
          />
          <Tooltip
            contentStyle={{
              backgroundColor: 'white',
              border: '1px solid #e5e7eb',
              borderRadius: '8px',
              boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)',
            }}
            labelStyle={{ color: '#374151', fontWeight: '500' }}
          />
          {options.showLegend !== false && <Legend />}
          <Line
            type={curveType}
            dataKey={config.yAxis?.key || 'y'}
            stroke={colors[0]}
            strokeWidth={strokeWidth}
            dot={{ fill: colors[0], strokeWidth: 2, r: dotSize }}
            activeDot={{ r: dotSize + 2, stroke: colors[0], strokeWidth: 2 }}
          />
        </LineChart>
      </ResponsiveContainer>
    </BaseWidget>
  );
}
