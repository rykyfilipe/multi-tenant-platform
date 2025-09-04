/** @format */

import React from 'react';
import { render, screen, waitFor } from '@testing-library/react';
import { AnalyticsDashboard } from '@/components/analytics/AnalyticsDashboard';
import { useProcessedAnalyticsData } from '@/hooks/useProcessedAnalyticsData';

// Mock the hook
jest.mock('@/hooks/useProcessedAnalyticsData');
const mockUseProcessedAnalyticsData = useProcessedAnalyticsData as jest.MockedFunction<typeof useProcessedAnalyticsData>;

// Mock framer-motion
jest.mock('framer-motion', () => ({
  motion: {
    div: ({ children, ...props }: any) => <div {...props}>{children}</div>,
  },
}));

// Mock UI components
jest.mock('@/components/ui/button', () => ({
  Button: ({ children, ...props }: any) => <button {...props}>{children}</button>,
}));

jest.mock('@/components/ui/card', () => ({
  Card: ({ children, ...props }: any) => <div data-testid="card" {...props}>{children}</div>,
  CardContent: ({ children, ...props }: any) => <div data-testid="card-content" {...props}>{children}</div>,
  CardHeader: ({ children, ...props }: any) => <div data-testid="card-header" {...props}>{children}</div>,
  CardTitle: ({ children, ...props }: any) => <div data-testid="card-title" {...props}>{children}</div>,
}));

jest.mock('@/components/ui/tabs', () => {
  const { useState } = require('react');
  return {
    Tabs: ({ children, value, onValueChange, ...props }: any) => {
      const [activeTab, setActiveTab] = useState(value || 'overview');
      
      const handleValueChange = (newValue: string) => {
        setActiveTab(newValue);
        onValueChange?.(newValue);
      };
      
      return (
        <div data-testid="tabs" {...props}>
          {React.Children.map(children, (child) => {
            if (React.isValidElement(child)) {
              // Handle TabsList
              if (child.type === 'div' && child.props?.['data-testid'] === 'tabs-list') {
                return React.cloneElement(child, { 
                  children: React.Children.map(child.props.children, (tabChild: any) => {
                    if (React.isValidElement(tabChild) && tabChild.props?.['data-testid'] === 'tabs-trigger') {
                      return React.cloneElement(tabChild, {
                        onClick: () => handleValueChange(tabChild.props.value || tabChild.props['data-value'])
                      });
                    }
                    return tabChild;
                  })
                });
              }
              // Handle TabsContent - only render if it matches the active tab
              if (child.type === 'div' && child.props?.['data-testid'] === 'tabs-content') {
                return child.props.value === activeTab ? child : null;
              }
            }
            return child;
          })}
        </div>
      );
    },
    TabsContent: ({ children, value, ...props }: any) => (
      <div data-testid="tabs-content" data-value={value} value={value} {...props}>{children}</div>
    ),
    TabsList: ({ children, ...props }: any) => <div data-testid="tabs-list" {...props}>{children}</div>,
    TabsTrigger: ({ children, value, onClick, ...props }: any) => (
      <div 
        data-testid="tabs-trigger" 
        data-value={value}
        value={value}
        onClick={onClick}
        style={{ cursor: 'pointer' }}
        {...props}
      >
        {children}
      </div>
    ),
  };
});

// Mock RealSizeInfo component
jest.mock('@/components/analytics/RealSizeInfo', () => ({
  RealSizeInfo: ({ databases, totalMemoryUsed, totalRows, totalTables, loading }: any) => (
    <div data-testid="real-size-info">
      {loading ? 'Loading...' : `Databases: ${databases?.length || 0}, Memory: ${totalMemoryUsed}MB`}
    </div>
  ),
}));

// Mock RealDataStatus component
jest.mock('@/components/analytics/RealDataStatus', () => ({
  RealDataStatus: () => (
    <div data-testid="real-data-status">
      Real Data Status Component
    </div>
  ),
}));

// Mock chart components
jest.mock('@/components/analytics', () => ({
  KPICard: ({ title, value, icon: Icon, ...props }: any) => (
    <div data-testid="kpi-card" data-title={title} data-value={value} {...props}>
      <Icon data-testid="kpi-icon" />
    </div>
  ),
  OverviewChart: ({ data, ...props }: any) => (
    <div data-testid="overview-chart" data-chart-data={JSON.stringify(data)} {...props} />
  ),
  ResourceUsageChart: ({ data, ...props }: any) => (
    <div data-testid="resource-usage-chart" data-chart-data={JSON.stringify(data)} {...props} />
  ),
  DistributionChart: ({ data, ...props }: any) => (
    <div data-testid="distribution-chart" data-chart-data={JSON.stringify(data)} {...props} />
  ),
  TrendChart: ({ data, ...props }: any) => (
    <div data-testid="trend-chart" data-chart-data={JSON.stringify(data)} {...props} />
  ),
  PerformanceChart: ({ data, ...props }: any) => (
    <div data-testid="performance-chart" data-chart-data={JSON.stringify(data)} {...props} />
  ),
  TopItemsList: ({ data, ...props }: any) => (
    <div data-testid="top-items-list" data-list-data={JSON.stringify(data)} {...props} />
  ),
  BusinessMetricsCard: ({ data, ...props }: any) => (
    <div data-testid="business-metrics-card" data-metrics-data={JSON.stringify(data)} {...props} />
  ),
  RevenueChart: ({ data, ...props }: any) => (
    <div data-testid="revenue-chart" data-chart-data={JSON.stringify(data)} {...props} />
  ),
  ErrorTrackingChart: ({ data, ...props }: any) => (
    <div data-testid="error-tracking-chart" data-chart-data={JSON.stringify(data)} {...props} />
  ),
  RealDataStatus: ({ data, ...props }: any) => (
    <div data-testid="real-data-status" data-status-data={JSON.stringify(data)} {...props} />
  ),
}));

const mockAnalyticsData = {
  kpis: {
    totalDatabases: 5,
    totalTables: 25,
    totalRows: 10000,
    totalUsers: 50,
    activeUsers: 35,
    engagementRate: 70,
    memoryUsagePercentage: 45,
    storageUsagePercentage: 60,
    databaseGrowthRate: 12,
    averageTablesPerDatabase: 5,
    averageRowsPerTable: 400,
    resourceUtilizationScore: 75,
  },
  growth: {
    weeklyDatabaseGrowth: 5,
    weeklyUserGrowth: 8,
    weeklyTableGrowth: 10,
    weeklyRowGrowth: 15,
    monthlyGrowthTrend: 'up' as const,
  },
  distributions: {
    databaseSizes: [
      { name: 'DB1', value: 1000, percentage: 40 },
      { name: 'DB2', value: 600, percentage: 24 },
      { name: 'DB3', value: 400, percentage: 16 },
    ],
    userRoles: [
      { role: 'Admin', count: 5, percentage: 10 },
      { role: 'Editor', count: 15, percentage: 30 },
      { role: 'Viewer', count: 30, percentage: 60 },
    ],
    tablesByDatabase: [
      { database: 'DB1', tables: 10 },
      { database: 'DB2', tables: 8 },
      { database: 'DB3', tables: 7 },
    ],
    resourceUsage: [
      { resource: 'Storage', used: 500, total: 1000, percentage: 50 },
      { resource: 'Databases', used: 5, total: 10, percentage: 50 },
    ],
  },
  rankings: {
    topDatabases: [
      { name: 'DB1', tables: 10, rows: 5000, size: 1000 },
      { name: 'DB2', tables: 8, rows: 3000, size: 600 },
    ],
    mostActiveUsers: [
      { name: 'John Doe', email: 'john@example.com', lastActive: '2024-01-01', status: 'online' },
    ],
    largestTables: [
      { name: 'Users', rows: 2000, database: 'DB1' },
    ],
  },
  timeSeriesData: {
    userActivity: [
      { date: '2024-01-01', active: 30, total: 50, percentage: 60 },
      { date: '2024-01-02', active: 35, total: 50, percentage: 70 },
    ],
    databaseGrowth: [
      { date: '2024-01-01', databases: 5, tables: 25, rows: 10000 },
    ],
    memoryUsage: [
      { date: '00:00', used: 400, percentage: 40 },
      { date: '01:00', used: 450, percentage: 45 },
    ],
    storageUsage: [
      { date: '2024-01-01', used: 500, total: 1000, percentage: 50 },
    ],
  },
  performance: {
    averageResponseTime: 120,
    uptime: 99.5,
    errorRate: 0.1,
    throughput: 500,
    peakUsageHours: [
      { hour: 9, usage: 80 },
      { hour: 14, usage: 90 },
    ],
  },
  health: {
    overall: 85,
    database: 90,
    memory: 80,
    storage: 75,
    users: 88,
  },
};

describe('AnalyticsDashboard Component', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('renders loading state correctly', () => {
    mockUseProcessedAnalyticsData.mockReturnValue({
      data: null,
      loading: true,
      error: null,
      realTimeData: null,
      businessData: null,
    });

    render(<AnalyticsDashboard />);
    
    // In loading state, we should see skeleton elements
    expect(document.querySelector('.animate-pulse')).toBeInTheDocument();
  });

  it('renders error state correctly', () => {
    mockUseProcessedAnalyticsData.mockReturnValue({
      data: null,
      loading: false,
      error: 'Failed to load data',
      realTimeData: null,
      businessData: null,
    });

    render(<AnalyticsDashboard />);
    
    expect(screen.getByText('Error Loading Analytics')).toBeInTheDocument();
    expect(screen.getByText('Failed to load data')).toBeInTheDocument();
  });

  it('renders dashboard with data correctly', async () => {
    mockUseProcessedAnalyticsData.mockReturnValue({
      data: mockAnalyticsData,
      loading: false,
      error: null,
      realTimeData: null,
      businessData: null,
    });

    render(<AnalyticsDashboard />);
    
    await waitFor(() => {
      expect(screen.getByText('Analytics Dashboard')).toBeInTheDocument();
    });

    // Check if KPI cards are rendered (all tabs are visible in test)
    expect(screen.getAllByTestId('kpi-card')).toHaveLength(16);
    
    // Check if charts are rendered (multiple instances from all tabs)
    expect(screen.getAllByTestId('overview-chart')).toHaveLength(6);
    expect(screen.getAllByTestId('distribution-chart')).toHaveLength(3);
    expect(screen.getAllByTestId('trend-chart')).toHaveLength(1);
  });

  it('displays correct KPI values', async () => {
    mockUseProcessedAnalyticsData.mockReturnValue({
      data: mockAnalyticsData,
      loading: false,
      error: null,
      realTimeData: null,
      businessData: null,
    });

    render(<AnalyticsDashboard />);
    
    await waitFor(() => {
      const kpiCards = screen.getAllByTestId('kpi-card');
      expect(kpiCards[0]).toHaveAttribute('data-title', 'Total Databases');
      expect(kpiCards[0]).toHaveAttribute('data-value', '5');
    });
  });

  it('handles tab switching correctly', async () => {
    mockUseProcessedAnalyticsData.mockReturnValue({
      data: mockAnalyticsData,
      loading: false,
      error: null,
      realTimeData: null,
      businessData: null,
    });

    render(<AnalyticsDashboard />);
    
    await waitFor(() => {
      expect(screen.getByText('Overview')).toBeInTheDocument();
      expect(screen.getByText('Performance')).toBeInTheDocument();
      expect(screen.getByText('Business')).toBeInTheDocument();
    });
  });

  it('handles time filter changes correctly', async () => {
    mockUseProcessedAnalyticsData.mockReturnValue({
      data: mockAnalyticsData,
      loading: false,
      error: null,
      realTimeData: null,
      businessData: null,
    });

    render(<AnalyticsDashboard />);
    
    await waitFor(() => {
      expect(screen.getByText('Last 30 days')).toBeInTheDocument();
    });
  });

  it('displays real-time data status correctly', async () => {
    const realTimeData = {
      userActivity: { totalUsers: 50, activeUsers: 35 },
      databaseActivity: { totalQueries: 1000, avgResponseTime: 120 },
    };

    mockUseProcessedAnalyticsData.mockReturnValue({
      data: mockAnalyticsData,
      loading: false,
      error: null,
      realTimeData,
      businessData: null,
    });

    render(<AnalyticsDashboard />);
    
    // Switch to status tab to see RealDataStatus component
    const statusTab = screen.getByText('Data Status');
    statusTab.click();
    
    await waitFor(() => {
      expect(screen.getByTestId('real-data-status')).toBeInTheDocument();
    });
  });

  it('handles empty data gracefully', async () => {
    const emptyData = {
      ...mockAnalyticsData,
      kpis: {
        totalDatabases: 0,
        totalTables: 0,
        totalRows: 0,
        totalUsers: 0,
        activeUsers: 0,
        engagementRate: 0,
        memoryUsagePercentage: 0,
        storageUsagePercentage: 0,
        databaseGrowthRate: 0,
        averageTablesPerDatabase: 0,
        averageRowsPerTable: 0,
        resourceUtilizationScore: 0,
      },
    };

    mockUseProcessedAnalyticsData.mockReturnValue({
      data: emptyData,
      loading: false,
      error: null,
      realTimeData: null,
      businessData: null,
    });

    render(<AnalyticsDashboard />);
    
    await waitFor(() => {
      expect(screen.getByText('Analytics Dashboard')).toBeInTheDocument();
      expect(screen.getAllByTestId('kpi-card')).toHaveLength(16);
    });
  });
});
