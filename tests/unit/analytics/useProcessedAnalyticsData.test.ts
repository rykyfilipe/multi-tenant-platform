/** @format */

import { renderHook, waitFor } from '@testing-library/react';
import { useProcessedAnalyticsData } from '@/hooks/useProcessedAnalyticsData';
import { useDashboardData } from '@/hooks/useDashboardData';
import { useApp } from '@/contexts/AppContext';

// Mock dependencies
jest.mock('@/hooks/useDashboardData');
jest.mock('@/contexts/AppContext');

const mockUseDashboardData = useDashboardData as jest.MockedFunction<typeof useDashboardData>;
const mockUseApp = useApp as jest.MockedFunction<typeof useApp>;

// Mock fetch
global.fetch = jest.fn();

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

describe('useProcessedAnalyticsData Hook', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    (global.fetch as jest.Mock).mockClear();
  });

  it('returns loading state initially', () => {
    mockUseDashboardData.mockReturnValue({
      data: null,
      loading: true,
      error: null,
    });
    mockUseApp.mockReturnValue({
      token: 'test-token',
      tenant: { id: 1 },
    } as any);

    const { result } = renderHook(() => useProcessedAnalyticsData());

    expect(result.current.loading).toBe(true);
    expect(result.current.data).toBeNull();
    expect(result.current.error).toBeNull();
  });

  it('processes data correctly when raw data is available', async () => {
    mockUseDashboardData.mockReturnValue({
      data: mockRawData,
      loading: false,
      error: null,
    });
    mockUseApp.mockReturnValue({
      token: 'test-token',
      tenant: { id: 1 },
    } as any);

    (global.fetch as jest.Mock).mockResolvedValueOnce({
      ok: true,
      json: async () => ({
        realTimeData: mockRealTimeData,
        businessData: mockBusinessData,
      }),
    });

    const { result } = renderHook(() => useProcessedAnalyticsData());

    await waitFor(() => {
      expect(result.current.loading).toBe(false);
    });

    expect(result.current.data).toBeDefined();
    expect(result.current.data?.kpis.totalDatabases).toBe(5);
    expect(result.current.data?.kpis.totalTables).toBe(25);
    expect(result.current.data?.kpis.totalRows).toBe(10000);
    expect(result.current.data?.kpis.totalUsers).toBe(50);
    expect(result.current.data?.kpis.activeUsers).toBe(35);
  });

  it('calculates engagement rate correctly', async () => {
    mockUseDashboardData.mockReturnValue({
      data: mockRawData,
      loading: false,
      error: null,
    });
    mockUseApp.mockReturnValue({
      token: 'test-token',
      tenant: { id: 1 },
    } as any);

    (global.fetch as jest.Mock).mockResolvedValueOnce({
      ok: true,
      json: async () => ({
        realTimeData: mockRealTimeData,
        businessData: mockBusinessData,
      }),
    });

    const { result } = renderHook(() => useProcessedAnalyticsData());

    await waitFor(() => {
      expect(result.current.loading).toBe(false);
    });

    expect(result.current.data?.kpis.engagementRate).toBe(70); // 35/50 * 100
  });

  it('calculates resource utilization score correctly', async () => {
    mockUseDashboardData.mockReturnValue({
      data: mockRawData,
      loading: false,
      error: null,
    });
    mockUseApp.mockReturnValue({
      token: 'test-token',
      tenant: { id: 1 },
    } as any);

    (global.fetch as jest.Mock).mockResolvedValueOnce({
      ok: true,
      json: async () => ({
        realTimeData: mockRealTimeData,
        businessData: mockBusinessData,
      }),
    });

    const { result } = renderHook(() => useProcessedAnalyticsData());

    await waitFor(() => {
      expect(result.current.loading).toBe(false);
    });

    // Resource utilization score = memoryUsagePercentage * 0.3 + storageUsagePercentage * 0.3 + engagementRate * 0.4
    // = 45 * 0.3 + 50 * 0.3 + 70 * 0.4 = 13.5 + 15 + 28 = 56.5
    expect(result.current.data?.kpis.resourceUtilizationScore).toBe(57); // Rounded
  });

  it('processes distribution data correctly', async () => {
    mockUseDashboardData.mockReturnValue({
      data: mockRawData,
      loading: false,
      error: null,
    });
    mockUseApp.mockReturnValue({
      token: 'test-token',
      tenant: { id: 1 },
    } as any);

    (global.fetch as jest.Mock).mockResolvedValueOnce({
      ok: true,
      json: async () => ({
        realTimeData: mockRealTimeData,
        businessData: mockBusinessData,
      }),
    });

    const { result } = renderHook(() => useProcessedAnalyticsData());

    await waitFor(() => {
      expect(result.current.loading).toBe(false);
    });

    expect(result.current.data?.distributions.databaseSizes).toHaveLength(2);
    expect(result.current.data?.distributions.databaseSizes[0].name).toBe('DB1');
    expect(result.current.data?.distributions.databaseSizes[0].value).toBe(5120);
    expect(result.current.data?.distributions.userRoles).toHaveLength(3);
  });

  it('processes time series data correctly', async () => {
    mockUseDashboardData.mockReturnValue({
      data: mockRawData,
      loading: false,
      error: null,
    });
    mockUseApp.mockReturnValue({
      token: 'test-token',
      tenant: { id: 1 },
    } as any);

    (global.fetch as jest.Mock).mockResolvedValueOnce({
      ok: true,
      json: async () => ({
        realTimeData: mockRealTimeData,
        businessData: mockBusinessData,
      }),
    });

    const { result } = renderHook(() => useProcessedAnalyticsData());

    await waitFor(() => {
      expect(result.current.loading).toBe(false);
    });

    expect(result.current.data?.timeSeriesData.userActivity).toHaveLength(2);
    expect(result.current.data?.timeSeriesData.userActivity[0].date).toBe('2024-01-01');
    expect(result.current.data?.timeSeriesData.userActivity[0].active).toBe(30);
    expect(result.current.data?.timeSeriesData.userActivity[0].total).toBe(50);
    expect(result.current.data?.timeSeriesData.userActivity[0].percentage).toBe(60);
  });

  it('handles API errors gracefully', async () => {
    mockUseDashboardData.mockReturnValue({
      data: mockRawData,
      loading: false,
      error: null,
    });
    mockUseApp.mockReturnValue({
      token: 'test-token',
      tenant: { id: 1 },
    } as any);

    (global.fetch as jest.Mock).mockRejectedValueOnce(new Error('API Error'));

    const { result } = renderHook(() => useProcessedAnalyticsData());

    await waitFor(() => {
      expect(result.current.loading).toBe(false);
    });

    expect(result.current.data).toBeDefined();
    expect(result.current.realTimeData).toBeNull();
    expect(result.current.businessData).toBeNull();
  });

  it('handles empty raw data gracefully', async () => {
    mockUseDashboardData.mockReturnValue({
      data: null,
      loading: false,
      error: null,
    });
    mockUseApp.mockReturnValue({
      token: 'test-token',
      tenant: { id: 1 },
    } as any);

    const { result } = renderHook(() => useProcessedAnalyticsData());

    expect(result.current.data).toBeNull();
    expect(result.current.loading).toBe(false);
    expect(result.current.error).toBeNull();
  });

  it('fetches real-time data when token and tenant are available', async () => {
    mockUseDashboardData.mockReturnValue({
      data: mockRawData,
      loading: false,
      error: null,
    });
    mockUseApp.mockReturnValue({
      token: 'test-token',
      tenant: { id: 1 },
    } as any);

    (global.fetch as jest.Mock).mockResolvedValueOnce({
      ok: true,
      json: async () => ({
        realTimeData: mockRealTimeData,
        businessData: mockBusinessData,
      }),
    });

    renderHook(() => useProcessedAnalyticsData());

    await waitFor(() => {
      expect(global.fetch).toHaveBeenCalledWith(
        '/api/tenants/1/analytics/real-data',
        {
          headers: { Authorization: 'Bearer test-token' },
        }
      );
    });
  });

  it('does not fetch real-time data when token or tenant is missing', async () => {
    mockUseDashboardData.mockReturnValue({
      data: mockRawData,
      loading: false,
      error: null,
    });
    mockUseApp.mockReturnValue({
      token: null,
      tenant: null,
    } as any);

    renderHook(() => useProcessedAnalyticsData());

    await waitFor(() => {
      expect(global.fetch).not.toHaveBeenCalled();
    });
  });
});
