'use client';

import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';

interface Widget {
  id: number;
  type: string;
  title: string | null;
  position: { x: number; y: number; width: number; height: number };
  config: {
    chartType?: string;
    dataSource?: {
      tableId: number;
      columnX: string;
      columnY: string;
      filters?: any[];
    };
    options?: {
      title?: string;
      xAxisLabel?: string;
      yAxisLabel?: string;
      colors?: string[];
      showLegend?: boolean;
      showGrid?: boolean;
    };
  };
  isVisible: boolean;
  order: number;
}

interface LineChartWidgetProps {
  widget: Widget;
}

// Mock data generator for demonstration
const generateMockData = (count: number = 10) => {
  const data = [];
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

export function LineChartWidget({ widget }: LineChartWidgetProps) {
  const [data, setData] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const config = widget.config || {};
  const options = config.options || {};
  const dataSource = config.dataSource;

  useEffect(() => {
    const fetchData = async () => {
      try {
        setIsLoading(true);
        setError(null);

        if (dataSource?.tableId) {
          // In a real implementation, you would fetch data from the API
          // based on the dataSource configuration
          await new Promise(resolve => setTimeout(resolve, 1000)); // Simulate API call
        }

        // For now, use mock data
        const mockData = generateMockData(20);
        setData(mockData);
      } catch (err) {
        console.error('Error fetching chart data:', err);
        setError('Failed to load chart data');
      } finally {
        setIsLoading(false);
      }
    };

    fetchData();
  }, [dataSource]);

  const colors = options.colors || ['#3B82F6', '#EF4444', '#10B981', '#F59E0B'];

  if (isLoading) {
    return (
      <Card className="h-full">
        <CardHeader className="pb-2">
          <CardTitle className="text-sm font-medium">
            {widget.title || 'Line Chart'}
          </CardTitle>
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
          <CardTitle className="text-sm font-medium text-red-600">
            {widget.title || 'Line Chart'}
          </CardTitle>
        </CardHeader>
        <CardContent className="pt-0 h-full flex items-center justify-center">
          <div className="text-center text-red-600">
            <p className="text-sm">{error}</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <motion.div
      className="h-full"
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
    >
      <Card className="h-full">
        <CardHeader className="pb-2">
          <CardTitle className="text-sm font-medium">
            {widget.title || 'Line Chart'}
          </CardTitle>
          {options.title && (
            <p className="text-xs text-gray-500">{options.title}</p>
          )}
        </CardHeader>
        <CardContent className="pt-0 h-full">
          <div className="h-full min-h-[200px]">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={data} margin={{ top: 5, right: 30, left: 20, bottom: 5 }}>
                {options.showGrid !== false && (
                  <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                )}
                <XAxis 
                  dataKey="date" 
                  stroke="#666"
                  fontSize={12}
                  tickLine={false}
                  axisLine={false}
                />
                <YAxis 
                  stroke="#666"
                  fontSize={12}
                  tickLine={false}
                  axisLine={false}
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
                <Line
                  type="monotone"
                  dataKey="value"
                  stroke={colors[0]}
                  strokeWidth={2}
                  dot={{ fill: colors[0], strokeWidth: 2, r: 4 }}
                  activeDot={{ r: 6, stroke: colors[0], strokeWidth: 2 }}
                />
                <Line
                  type="monotone"
                  dataKey="sales"
                  stroke={colors[1]}
                  strokeWidth={2}
                  dot={{ fill: colors[1], strokeWidth: 2, r: 4 }}
                  activeDot={{ r: 6, stroke: colors[1], strokeWidth: 2 }}
                />
              </LineChart>
            </ResponsiveContainer>
          </div>
          
          {options.showLegend !== false && (
            <div className="flex items-center justify-center space-x-4 mt-2 text-xs">
              <div className="flex items-center space-x-1">
                <div 
                  className="w-3 h-3 rounded-full" 
                  style={{ backgroundColor: colors[0] }}
                />
                <span className="text-gray-600">Value</span>
              </div>
              <div className="flex items-center space-x-1">
                <div 
                  className="w-3 h-3 rounded-full" 
                  style={{ backgroundColor: colors[1] }}
                />
                <span className="text-gray-600">Sales</span>
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    </motion.div>
  );
}
