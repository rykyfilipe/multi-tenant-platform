/** @format */

import { render, screen, waitFor } from '@testing-library/react';
import { AnalyticsDashboard } from '@/components/analytics/AnalyticsDashboard';
import { useProcessedAnalyticsData } from '@/hooks/useProcessedAnalyticsData';
import { useDashboardData } from '@/hooks/useDashboardData';
import { useApp } from '@/contexts/AppContext';

// Mock all dependencies
jest.mock('@/hooks/useProcessedAnalyticsData');
jest.mock('@/hooks/useDashboardData');
jest.mock('@/contexts/AppContext');

// Mock framer-motion
jest.mock('framer-motion', () => ({
  motion: {
    div: ({ children, ...props }: any) => <div {...props}>{children}</div>,
  },
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

const mockUseProcessedAnalyticsData = useProcessedAnalyticsData as jest.MockedFunction<typeof useProcessedAnalyticsData>;
const mockUseDashboardData = useDashboardData as jest.MockedFunction<typeof useDashboardData>;
const mockUseApp = useApp as jest.MockedFunction<typeof useApp>;

describe('Analytics System Integration', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('Complete Analytics Flow', () => {
    it('renders complete analytics dashboard with all data', async () => {
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

      const mockRealTimeData = {
        userActivity: {
          totalUsers: 50,
          activeUsers: 35,
          newUsers: 5,
          userGrowth: 12.5,
          last7Days: [
            { date: '2024-01-01', users: 30 },
            { date: '2024-01-02', users: 35 },
          ],
        },
        databaseActivity: {
          totalQueries: 1000,
          avgResponseTime: 120,
          errorRate: 0.01,
          last30Days: [
            { date: '2024-01-01', queries: 100, avgResponseTime: 120 },
          ],
        },
        systemPerformance: {
          cpuUsage: 45,
          memoryUsage: 60,
          diskUsage: 30,
          networkLatency: 50,
          last24Hours: [
            { hour: 0, cpuUsage: 40, memoryUsage: 55 },
            { hour: 1, cpuUsage: 45, memoryUsage: 60 },
          ],
        },
        apiUsage: {
          totalRequests: 5000,
          successRate: 98.5,
          avgResponseTime: 150,
          last7Days: [
            { date: '2024-01-01', requests: 500, successRate: 98 },
          ],
        },
        errorData: {
          totalErrors: 25,
          errorRate: 0.005,
          criticalErrors: 2,
          last7Days: [
            { date: '2024-01-01', errors: 3, criticalErrors: 0 },
          ],
        },
      };

      const mockBusinessData = {
        revenue: {
          totalRevenue: 5000,
          monthlyRevenue: 500,
          revenueGrowth: 15.5,
          last12Months: [
            { month: '2024-01', revenue: 500 },
          ],
        },
        growth: {
          userGrowth: 12.5,
          revenueGrowth: 15.5,
          usageGrowth: 20.0,
          conversionGrowth: 8.5,
          last6Months: [
            { month: '2024-01', userGrowth: 10, revenueGrowth: 500 },
          ],
        },
        usage: {
          totalUsers: 50,
          activeUsers: 35,
          usageRate: 70,
          avgSessionTime: 24.5,
          last30Days: [
            { date: '2024-01-01', activeUsers: 30, sessions: 45 },
          ],
        },
        performance: {
          avgResponseTime: 120,
          uptime: 99.5,
          errorRate: 0.1,
          throughput: 500,
          last7Days: [
            { date: '2024-01-01', avgResponseTime: 120, uptime: 99.5 },
          ],
        },
        conversion: {
          conversionRate: 8.5,
          totalConversions: 25,
          conversionValue: 1250,
          last30Days: [
            { date: '2024-01-01', conversions: 2, conversionRate: 8.5 },
          ],
        },
      };

      mockUseProcessedAnalyticsData.mockReturnValue({
        data: mockAnalyticsData,
        loading: false,
        error: null,
        realTimeData: mockRealTimeData,
        businessData: mockBusinessData,
      });

      mockUseDashboardData.mockReturnValue({
        data: {
          stats: { totalDatabases: 5, totalTables: 25, totalRows: 10000, totalUsers: 50, activeUsers: 35, memoryPercentage: 45 },
          usageData: { storage: { used: 500, total: 1000 }, databases: { used: 5, total: 10 }, tables: { used: 25, total: 50 }, users: { used: 50, total: 100 }, memory: { total: 1000 } },
          databaseData: { databases: [{ name: 'DB1', tables: 10, rows: 5000, size: '5MB' }] },
          userData: { recentUsers: [{ name: 'John Doe', email: 'john@example.com', role: 'Admin', status: 'online' }] },
        },
        loading: false,
        error: null,
      });

      mockUseApp.mockReturnValue({
        token: 'test-token',
        tenant: { id: 1 },
      } as any);

      render(<AnalyticsDashboard />);

      await waitFor(() => {
        expect(screen.getByText('Analytics Dashboard')).toBeInTheDocument();
      });

      // Check if all KPI cards are rendered
      expect(screen.getAllByTestId('kpi-card')).toHaveLength(6);

      // Check if all charts are rendered
      expect(screen.getByTestId('overview-chart')).toBeInTheDocument();
      expect(screen.getByTestId('resource-usage-chart')).toBeInTheDocument();
      expect(screen.getByTestId('distribution-chart')).toBeInTheDocument();
      expect(screen.getByTestId('trend-chart')).toBeInTheDocument();
      expect(screen.getByTestId('performance-chart')).toBeInTheDocument();

      // Check if business metrics are rendered
      expect(screen.getByTestId('business-metrics-card')).toBeInTheDocument();
      expect(screen.getByTestId('revenue-chart')).toBeInTheDocument();
      expect(screen.getByTestId('error-tracking-chart')).toBeInTheDocument();

      // Check if real-time data status is rendered
      expect(screen.getByTestId('real-data-status')).toBeInTheDocument();
    });

    it('handles loading states correctly', async () => {
      mockUseProcessedAnalyticsData.mockReturnValue({
        data: null,
        loading: true,
        error: null,
      });

      mockUseDashboardData.mockReturnValue({
        data: null,
        loading: true,
        error: null,
      });

      mockUseApp.mockReturnValue({
        token: 'test-token',
        tenant: { id: 1 },
      } as any);

      render(<AnalyticsDashboard />);

      expect(screen.getByTestId('loading-skeleton')).toBeInTheDocument();
    });

    it('handles error states correctly', async () => {
      mockUseProcessedAnalyticsData.mockReturnValue({
        data: null,
        loading: false,
        error: 'Failed to load analytics data',
      });

      mockUseDashboardData.mockReturnValue({
        data: null,
        loading: false,
        error: 'Failed to load dashboard data',
      });

      mockUseApp.mockReturnValue({
        token: 'test-token',
        tenant: { id: 1 },
      } as any);

      render(<AnalyticsDashboard />);

      expect(screen.getByText('Failed to load analytics data')).toBeInTheDocument();
      expect(screen.getByText('Failed to load dashboard data')).toBeInTheDocument();
    });

    it('handles empty data gracefully', async () => {
      const emptyData = {
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
        growth: {
          weeklyDatabaseGrowth: 0,
          weeklyUserGrowth: 0,
          weeklyTableGrowth: 0,
          weeklyRowGrowth: 0,
          monthlyGrowthTrend: 'stable' as const,
        },
        distributions: {
          databaseSizes: [],
          userRoles: [],
          tablesByDatabase: [],
          resourceUsage: [],
        },
        rankings: {
          topDatabases: [],
          mostActiveUsers: [],
          largestTables: [],
        },
        timeSeriesData: {
          userActivity: [],
          databaseGrowth: [],
          memoryUsage: [],
          storageUsage: [],
        },
        performance: {
          averageResponseTime: 0,
          uptime: 0,
          errorRate: 0,
          throughput: 0,
          peakUsageHours: [],
        },
        health: {
          overall: 0,
          database: 0,
          memory: 0,
          storage: 0,
          users: 0,
        },
      };

      mockUseProcessedAnalyticsData.mockReturnValue({
        data: emptyData,
        loading: false,
        error: null,
      });

      mockUseDashboardData.mockReturnValue({
        data: {
          stats: { totalDatabases: 0, totalTables: 0, totalRows: 0, totalUsers: 0, activeUsers: 0, memoryPercentage: 0 },
          usageData: { storage: { used: 0, total: 0 }, databases: { used: 0, total: 0 }, tables: { used: 0, total: 0 }, users: { used: 0, total: 0 }, memory: { total: 0 } },
          databaseData: { databases: [] },
          userData: { recentUsers: [] },
        },
        loading: false,
        error: null,
      });

      mockUseApp.mockReturnValue({
        token: 'test-token',
        tenant: { id: 1 },
      } as any);

      render(<AnalyticsDashboard />);

      await waitFor(() => {
        expect(screen.getByText('Analytics Dashboard')).toBeInTheDocument();
      });

      // Check if KPI cards are rendered with zero values
      expect(screen.getAllByTestId('kpi-card')).toHaveLength(6);
      
      // Check if charts are rendered (they should handle empty data gracefully)
      expect(screen.getByTestId('overview-chart')).toBeInTheDocument();
      expect(screen.getByTestId('resource-usage-chart')).toBeInTheDocument();
      expect(screen.getByTestId('distribution-chart')).toBeInTheDocument();
    });
  });

  describe('Data Flow Integration', () => {
    it('processes data through the complete pipeline', async () => {
      const mockRawData = {
        stats: {
          totalDatabases: 5,
          totalTables: 25,
          totalRows: 10000,
          totalUsers: 50,
          activeUsers: 35,
          memoryPercentage: 45,
        },
        usageData: {
          storage: { used: 500, total: 1000 },
          databases: { used: 5, total: 10 },
          tables: { used: 25, total: 50 },
          users: { used: 50, total: 100 },
          memory: { total: 1000 },
        },
        databaseData: {
          databases: [
            { name: 'DB1', tables: 10, rows: 5000, size: '5MB', sizeKB: 5120, realSizeKB: 5120, realSizeFormatted: '5.0 MB' },
            { name: 'DB2', tables: 8, rows: 3000, size: '3MB', sizeKB: 3072, realSizeKB: 3072, realSizeFormatted: '3.0 MB' },
          ],
        },
        userData: {
          recentUsers: [
            { name: 'John Doe', email: 'john@example.com', role: 'Admin', status: 'online' },
            { name: 'Jane Smith', email: 'jane@example.com', role: 'Editor', status: 'offline' },
            { name: 'Bob Wilson', email: 'bob@example.com', role: 'Viewer', status: 'online' },
          ],
        },
      };

      const mockRealTimeData = {
        userActivity: {
          userGrowth: 12.5,
          last7Days: [
            { date: '2024-01-01', users: 30 },
            { date: '2024-01-02', users: 35 },
          ],
        },
        databaseActivity: {
          avgResponseTime: 120,
          errorRate: 0.01,
        },
        systemPerformance: {
          last24Hours: [
            { hour: 0, cpuUsage: 40, memoryUsage: 55 },
            { hour: 1, cpuUsage: 45, memoryUsage: 60 },
          ],
        },
      };

      const mockBusinessData = {
        growth: {
          usageGrowth: 20.0,
        },
        performance: {
          avgResponseTime: 120,
          uptime: 99.5,
          errorRate: 0.1,
          throughput: 500,
        },
      };

      mockUseDashboardData.mockReturnValue({
        data: mockRawData,
        loading: false,
        error: null,
      });

      mockUseProcessedAnalyticsData.mockReturnValue({
        data: {
          raw: mockRawData,
          kpis: {
            totalDatabases: 5,
            totalTables: 25,
            totalRows: 10000,
            totalUsers: 50,
            activeUsers: 35,
            engagementRate: 70,
            memoryUsagePercentage: 45,
            storageUsagePercentage: 50,
            databaseGrowthRate: 12.5,
            averageTablesPerDatabase: 5,
            averageRowsPerTable: 400,
            resourceUtilizationScore: 57,
          },
          growth: {
            weeklyDatabaseGrowth: 12.5,
            weeklyUserGrowth: 12.5,
            weeklyTableGrowth: 20.0,
            weeklyRowGrowth: 20.0,
            monthlyGrowthTrend: 'up',
          },
          distributions: {
            databaseSizes: [
              { name: 'DB1', value: 5120, percentage: 62.5 },
              { name: 'DB2', value: 3072, percentage: 37.5 },
            ],
            userRoles: [
              { role: 'Admin', count: 1, percentage: 33.33 },
              { role: 'Editor', count: 1, percentage: 33.33 },
              { role: 'Viewer', count: 1, percentage: 33.33 },
            ],
            tablesByDatabase: [
              { database: 'DB1', tables: 10 },
              { database: 'DB2', tables: 8 },
            ],
            resourceUsage: [
              { resource: 'Storage', used: 500, total: 1000, percentage: 50 },
              { resource: 'Databases', used: 5, total: 10, percentage: 50 },
            ],
          },
          rankings: {
            topDatabases: [
              { name: 'DB1', tables: 10, rows: 5000, size: 5120, realSize: '5.0 MB' },
              { name: 'DB2', tables: 8, rows: 3000, size: 3072, realSize: '3.0 MB' },
            ],
            mostActiveUsers: [
              { name: 'John Doe', email: 'john@example.com', lastActive: '2024-01-01', status: 'online' },
              { name: 'Bob Wilson', email: 'bob@example.com', lastActive: '2024-01-01', status: 'online' },
            ],
            largestTables: [],
          },
          timeSeriesData: {
            userActivity: [
              { date: '2024-01-01', active: 30, total: 50, percentage: 60 },
              { date: '2024-01-02', active: 35, total: 50, percentage: 70 },
            ],
            databaseGrowth: [],
            memoryUsage: [],
            storageUsage: [],
          },
          performance: {
            averageResponseTime: 120,
            uptime: 99.5,
            errorRate: 0.01,
            throughput: 500,
            peakUsageHours: [
              { hour: 0, usage: 40 },
              { hour: 1, usage: 45 },
            ],
          },
          health: {
            overall: 85,
            database: 100,
            memory: 55,
            storage: 50,
            users: 84,
          },
        },
        loading: false,
        error: null,
        realTimeData: mockRealTimeData,
        businessData: mockBusinessData,
      });

      mockUseApp.mockReturnValue({
        token: 'test-token',
        tenant: { id: 1 },
      } as any);

      render(<AnalyticsDashboard />);

      await waitFor(() => {
        expect(screen.getByText('Analytics Dashboard')).toBeInTheDocument();
      });

      // Verify that data flows through the complete pipeline
      expect(screen.getAllByTestId('kpi-card')).toHaveLength(6);
      expect(screen.getByTestId('overview-chart')).toBeInTheDocument();
      expect(screen.getByTestId('resource-usage-chart')).toBeInTheDocument();
      expect(screen.getByTestId('distribution-chart')).toBeInTheDocument();
      expect(screen.getByTestId('trend-chart')).toBeInTheDocument();
      expect(screen.getByTestId('performance-chart')).toBeInTheDocument();
      expect(screen.getByTestId('business-metrics-card')).toBeInTheDocument();
      expect(screen.getByTestId('revenue-chart')).toBeInTheDocument();
      expect(screen.getByTestId('error-tracking-chart')).toBeInTheDocument();
      expect(screen.getByTestId('real-data-status')).toBeInTheDocument();
    });
  });
});
