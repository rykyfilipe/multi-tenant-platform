'use client';

import { useState, useEffect, useMemo } from 'react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend } from 'recharts';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { Button } from '@/components/ui/button';
import { Edit3, RefreshCw, AlertCircle } from 'lucide-react';

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
    const response = await fetch(`/api/tenants/1/databases/1/tables/${dataSource.tableId}/rows`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        filters: dataSource.filters || [],
        limit: 1000,
        offset: 0,
      }),
    });

    if (!response.ok) {
      throw new Error(`Failed to fetch table data: ${response.statusText}`);
    }

    const result = await response.json();
    return result.rows || [];
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

  if (isLoading) {
    return (
      <Card className="h-full">
        <CardHeader className="pb-2">
          <div className="flex items-center justify-between">
            <CardTitle className="text-sm font-medium">
              {widget.title || config.title || 'Line Chart'}
            </CardTitle>
            {isEditMode && onEdit && (
              <Button variant="ghost" size="sm" onClick={(e) => {
                  console.log('Edit button clicked for widget:', widget.id);
                  e.stopPropagation();
                  onEdit();
                }}>
                <Edit3 className="h-4 w-4" />
              </Button>
            )}
          </div>
        </CardHeader>
        <CardContent className="pt-0 h-full">
          <div className="space-y-2">
            <Skeleton className="h-4 w-3/4" />
            <Skeleton className="h-32 w-full" />
            <div className="flex space-x-2">
              <Skeleton className="h-4 w-16" />
              <Skeleton className="h-4 w-16" />
            </div>
          </div>
        </CardContent>
      </Card>
    );
  }

  if (error) {
    return (
      <Card className="h-full">
        <CardHeader className="pb-2">
          <div className="flex items-center justify-between">
            <CardTitle className="text-sm font-medium text-red-600">
              {widget.title || config.title || 'Line Chart'}
            </CardTitle>
            {isEditMode && onEdit && (
              <Button variant="ghost" size="sm" onClick={(e) => {
                  console.log('Edit button clicked for widget:', widget.id);
                  e.stopPropagation();
                  onEdit();
                }}>
                <Edit3 className="h-4 w-4" />
              </Button>
            )}
          </div>
        </CardHeader>
        <CardContent className="pt-0 h-full flex items-center justify-center">
          <div className="text-center text-red-600">
            <AlertCircle className="h-8 w-8 mx-auto mb-2" />
            <p className="text-sm">{error}</p>
            {dataSource.type === 'table' && (
              <Button 
                variant="outline" 
                size="sm" 
                onClick={handleRefresh}
                className="mt-2"
              >
                <RefreshCw className="h-4 w-4 mr-2" />
                Retry
              </Button>
            )}
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="h-full">
      <CardHeader className="pb-2">
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="text-sm font-medium">
              {widget.title || config.title || 'Line Chart'}
            </CardTitle>
            {dataSource.type === 'table' && lastFetchTime && (
              <p className="text-xs text-gray-500 mt-1">
                Last updated: {lastFetchTime.toLocaleTimeString()}
              </p>
            )}
          </div>
          <div className="flex items-center space-x-2">
            {dataSource.type === 'table' && (
              <Button 
                variant="ghost" 
                size="sm" 
                onClick={handleRefresh}
                disabled={isLoading}
              >
                <RefreshCw className={`h-4 w-4 ${isLoading ? 'animate-spin' : ''}`} />
              </Button>
            )}
            {isEditMode && onEdit && (
              <Button variant="ghost" size="sm" onClick={(e) => {
                  console.log('Edit button clicked for widget:', widget.id);
                  e.stopPropagation();
                  onEdit();
                }}>
                <Edit3 className="h-4 w-4" />
              </Button>
            )}
          </div>
        </div>
      </CardHeader>
      <CardContent className="pt-0 h-full">
        <div className="h-full min-h-[200px]">
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
        </div>
      </CardContent>
    </Card>
  );
}
