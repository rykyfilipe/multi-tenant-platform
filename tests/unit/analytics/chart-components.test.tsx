/** @format */

import React from 'react';
import { render, screen } from '@testing-library/react';
import { OverviewChart } from '@/components/analytics/OverviewChart';
import { ResourceUsageChart } from '@/components/analytics/ResourceUsageChart';
import { DistributionChart } from '@/components/analytics/DistributionChart';
import { TrendChart } from '@/components/analytics/TrendChart';
import { PerformanceChart } from '@/components/analytics/PerformanceChart';
import { Activity } from 'lucide-react';

// Mock Recharts components
jest.mock('recharts', () => ({
  ResponsiveContainer: ({ children }: any) => <div data-testid="responsive-container">{children}</div>,
  LineChart: ({ children, data }: any) => <div data-testid="line-chart" data-chart-data={JSON.stringify(data)}>{children}</div>,
  AreaChart: ({ children, data }: any) => <div data-testid="area-chart" data-chart-data={JSON.stringify(data)}>{children}</div>,
  BarChart: ({ children, data }: any) => <div data-testid="bar-chart" data-chart-data={JSON.stringify(data)}>{children}</div>,
  PieChart: ({ children, data }: any) => <div data-testid="pie-chart" data-chart-data={JSON.stringify(data)}>{children}</div>,
  Line: ({ dataKey, stroke }: any) => <div data-testid="line" data-key={dataKey} data-stroke={stroke} />,
  Area: ({ dataKey, fill }: any) => <div data-testid="area" data-key={dataKey} data-fill={fill} />,
  Bar: ({ dataKey, fill }: any) => <div data-testid="bar" data-key={dataKey} data-fill={fill} />,
  Pie: ({ dataKey, fill }: any) => <div data-testid="pie" data-key={dataKey} data-fill={fill} />,
  XAxis: ({ dataKey }: any) => <div data-testid="x-axis" data-key={dataKey} />,
  YAxis: ({ dataKey }: any) => <div data-testid="y-axis" data-key={dataKey} />,
  CartesianGrid: () => <div data-testid="cartesian-grid" />,
  Tooltip: () => <div data-testid="tooltip" />,
  Legend: () => <div data-testid="legend" />,
  Cell: ({ fill }: any) => <div data-testid="cell" data-fill={fill} />,
}));

const mockData = [
  { date: '2024-01-01', value: 100, users: 50 },
  { date: '2024-01-02', value: 120, users: 60 },
  { date: '2024-01-03', value: 90, users: 45 },
];

const mockDataKeys = [
  { key: 'value', name: 'Value', color: '#3b82f6', type: 'line' as const },
  { key: 'users', name: 'Users', color: '#10b981', type: 'area' as const },
];

const mockResourceData = [
  { resource: 'CPU', used: 45, total: 100, percentage: 45 },
  { resource: 'Memory', used: 60, total: 100, percentage: 60 },
  { resource: 'Storage', used: 30, total: 100, percentage: 30 },
];

const mockDistributionData = [
  { name: 'Database 1', value: 1000, percentage: 40 },
  { name: 'Database 2', value: 600, percentage: 24 },
  { name: 'Database 3', value: 400, percentage: 16 },
];

const mockTrendMetrics = [
  { key: 'value', name: 'Value', type: 'line' as const },
  { key: 'users', name: 'Users', type: 'bar' as const },
];

const mockPerformanceData = [
  { subject: 'Response Time', score: 85, fullMark: 100 },
  { subject: 'Uptime', score: 95, fullMark: 100 },
  { subject: 'Error Rate', score: 90, fullMark: 100 },
];

describe('Chart Components', () => {
  describe('OverviewChart', () => {
    it('renders with data correctly', () => {
      render(
        <OverviewChart 
          data={mockData} 
          title="Test Chart" 
          icon={Activity}
          dataKeys={mockDataKeys}
          xAxisKey="date"
        />
      );
      
      expect(screen.getByText('Test Chart')).toBeInTheDocument();
      expect(screen.getByTestId('responsive-container')).toBeInTheDocument();
      expect(screen.getByTestId('area-chart')).toBeInTheDocument();
    });

    it('renders without data gracefully', () => {
      render(
        <OverviewChart 
          data={[]} 
          title="Empty Chart" 
          icon={Activity}
          dataKeys={mockDataKeys}
          xAxisKey="date"
        />
      );
      
      expect(screen.getByText('Empty Chart')).toBeInTheDocument();
      expect(screen.getByText('No data available')).toBeInTheDocument();
    });

    it('applies custom colors correctly', () => {
      const customDataKeys = [
        { key: 'value', name: 'Value', color: '#ff0000', type: 'line' as const },
      ];
      
      render(
        <OverviewChart 
          data={mockData} 
          title="Custom Colors" 
          icon={Activity}
          dataKeys={customDataKeys}
          xAxisKey="date"
        />
      );
      
      expect(screen.getByTestId('line')).toHaveAttribute('data-stroke', '#ff0000');
    });
  });

  describe('ResourceUsageChart', () => {
    it('renders resource usage data correctly', () => {
      render(
        <ResourceUsageChart 
          data={mockResourceData} 
          title="Resource Usage" 
          icon={Activity}
        />
      );
      
      expect(screen.getByText('Resource Usage')).toBeInTheDocument();
      expect(screen.getByTestId('bar-chart')).toBeInTheDocument();
      expect(screen.getByTestId('bar')).toBeInTheDocument();
    });

    it('calculates percentages correctly', () => {
      render(
        <ResourceUsageChart 
          data={mockResourceData} 
          title="Resource Usage" 
          icon={Activity}
        />
      );
      
      const chartData = JSON.parse(screen.getByTestId('bar-chart').getAttribute('data-chart-data') || '[]');
      expect(chartData[0].percentage).toBe(45);
      expect(chartData[1].percentage).toBe(60);
      expect(chartData[2].percentage).toBe(30);
    });

    it('handles empty data gracefully', () => {
      render(
        <ResourceUsageChart 
          data={[]} 
          title="Empty Resource Chart" 
          icon={Activity}
        />
      );
      
      expect(screen.getByText('Empty Resource Chart')).toBeInTheDocument();
      expect(screen.getByText('No data available')).toBeInTheDocument();
    });
  });

  describe('DistributionChart', () => {
    it('renders distribution data correctly', () => {
      render(
        <DistributionChart 
          data={mockDistributionData} 
          title="Distribution" 
          icon={Activity}
        />
      );
      
      expect(screen.getByText('Distribution')).toBeInTheDocument();
      expect(screen.getByTestId('pie-chart')).toBeInTheDocument();
      expect(screen.getByTestId('pie')).toBeInTheDocument();
    });

    it('displays percentages correctly', () => {
      render(
        <DistributionChart 
          data={mockDistributionData} 
          title="Distribution" 
          icon={Activity}
        />
      );
      
      expect(screen.getByText('40%')).toBeInTheDocument();
      expect(screen.getByText('24%')).toBeInTheDocument();
      expect(screen.getByText('16%')).toBeInTheDocument();
    });

    it('handles empty data gracefully', () => {
      render(
        <DistributionChart 
          data={[]} 
          title="Empty Distribution" 
          icon={Activity}
        />
      );
      
      expect(screen.getByText('Empty Distribution')).toBeInTheDocument();
      expect(screen.getByText('No data available')).toBeInTheDocument();
    });
  });

  describe('TrendChart', () => {
    it('renders trend data correctly', () => {
      render(
        <TrendChart 
          data={mockData} 
          title="Trend Analysis" 
          icon={Activity}
          metrics={mockTrendMetrics}
        />
      );
      
      expect(screen.getByText('Trend Analysis')).toBeInTheDocument();
      expect(screen.getByTestId('responsive-container')).toBeInTheDocument();
    });

    it('shows trend indicators correctly', () => {
      render(
        <TrendChart 
          data={mockData} 
          title="Trend Analysis" 
          icon={Activity}
          metrics={mockTrendMetrics}
          showTrend={true}
        />
      );
      
      expect(screen.getByText('Trend Analysis')).toBeInTheDocument();
    });

    it('handles empty data gracefully', () => {
      render(
        <TrendChart 
          data={[]} 
          title="Empty Trend" 
          icon={Activity}
          metrics={mockTrendMetrics}
        />
      );
      
      expect(screen.getByText('Empty Trend')).toBeInTheDocument();
      expect(screen.getByText('No data available')).toBeInTheDocument();
    });
  });

  describe('PerformanceChart', () => {
    it('renders performance metrics correctly', () => {
      render(
        <PerformanceChart 
          data={mockPerformanceData} 
          title="Performance Metrics" 
          icon={Activity}
        />
      );
      
      expect(screen.getByText('Performance Metrics')).toBeInTheDocument();
      expect(screen.getByTestId('responsive-container')).toBeInTheDocument();
    });

    it('shows performance indicators correctly', () => {
      render(
        <PerformanceChart 
          data={mockPerformanceData} 
          title="Performance Metrics" 
          icon={Activity}
        />
      );
      
      expect(screen.getByText('Performance Metrics')).toBeInTheDocument();
    });

    it('handles empty data gracefully', () => {
      render(
        <PerformanceChart 
          data={[]} 
          title="Empty Performance" 
          icon={Activity}
        />
      );
      
      expect(screen.getByText('Empty Performance')).toBeInTheDocument();
      expect(screen.getByText('No data available')).toBeInTheDocument();
    });
  });

  describe('Chart Error Handling', () => {
    it('handles malformed data gracefully', () => {
      const malformedData = [
        { date: '2024-01-01', value: null },
        { date: '2024-01-02', value: undefined },
        { date: '2024-01-03', value: 'invalid' },
      ];

      render(
        <OverviewChart 
          data={malformedData} 
          title="Malformed Data" 
          icon={Activity}
          dataKeys={mockDataKeys}
          xAxisKey="date"
        />
      );
      
      expect(screen.getByText('Malformed Data')).toBeInTheDocument();
    });

    it('handles missing required props gracefully', () => {
      // @ts-ignore - Intentionally passing invalid props for testing
      render(
        <OverviewChart 
          data={mockData} 
          icon={Activity}
          dataKeys={mockDataKeys}
          xAxisKey="date"
        />
      );
      
      expect(screen.getByTestId('responsive-container')).toBeInTheDocument();
    });
  });

  describe('Chart Responsiveness', () => {
    it('applies responsive container correctly', () => {
      render(
        <OverviewChart 
          data={mockData} 
          title="Responsive Chart" 
          icon={Activity}
          dataKeys={mockDataKeys}
          xAxisKey="date"
        />
      );
      
      const container = screen.getByTestId('responsive-container');
      expect(container).toBeInTheDocument();
    });

    it('handles different chart types responsively', () => {
      render(
        <ResourceUsageChart 
          data={mockResourceData} 
          title="Responsive Resource Chart" 
          icon={Activity}
        />
      );
      
      expect(screen.getByTestId('responsive-container')).toBeInTheDocument();
      expect(screen.getByTestId('bar-chart')).toBeInTheDocument();
    });
  });
});
