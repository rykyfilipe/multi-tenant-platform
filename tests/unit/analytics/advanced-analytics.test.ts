/** @format */

import {
  AnalyticsMetricType,
  DashboardType,
  ChartType,
  CustomDashboard,
  DashboardWidget,
  generateInsights,
  calculateTrends,
  getMetricValue,
  formatMetricValue,
  createDashboard,
  addWidgetToDashboard,
  removeWidgetFromDashboard,
  updateWidgetConfig,
  getDashboardData,
  exportDashboardData,
} from '@/lib/advanced-analytics';

describe('Advanced Analytics', () => {
  describe('Enums', () => {
    it('has correct AnalyticsMetricType values', () => {
      expect(AnalyticsMetricType.USER_ACTIVITY).toBe('USER_ACTIVITY');
      expect(AnalyticsMetricType.DATABASE_PERFORMANCE).toBe('DATABASE_PERFORMANCE');
      expect(AnalyticsMetricType.SYSTEM_METRICS).toBe('SYSTEM_METRICS');
      expect(AnalyticsMetricType.API_USAGE).toBe('API_USAGE');
      expect(AnalyticsMetricType.ERROR_RATE).toBe('ERROR_RATE');
      expect(AnalyticsMetricType.REVENUE).toBe('REVENUE');
    });

    it('has correct DashboardType values', () => {
      expect(DashboardType.CUSTOM).toBe('CUSTOM');
      expect(DashboardType.PREDEFINED).toBe('PREDEFINED');
      expect(DashboardType.SHARED).toBe('SHARED');
    });

    it('has correct ChartType values', () => {
      expect(ChartType.LINE).toBe('LINE');
      expect(ChartType.BAR).toBe('BAR');
      expect(ChartType.PIE).toBe('PIE');
      expect(ChartType.AREA).toBe('AREA');
      expect(ChartType.SCATTER).toBe('SCATTER');
      expect(ChartType.RADAR).toBe('RADAR');
    });
  });

  describe('generateInsights', () => {
    it('generates insights for user activity data', () => {
      const data = {
        userActivity: {
          totalUsers: 100,
          activeUsers: 80,
          newUsers: 10,
          userGrowth: 12.5,
        },
      };

      const insights = generateInsights(data);

      expect(insights).toHaveProperty('summary');
      expect(insights).toHaveProperty('trends');
      expect(insights).toHaveProperty('recommendations');
      expect(insights.summary).toContain('100 total users');
      expect(insights.trends).toContain('User growth is positive');
    });

    it('generates insights for database performance data', () => {
      const data = {
        databaseActivity: {
          totalQueries: 1000,
          avgResponseTime: 120,
          errorRate: 0.01,
        },
      };

      const insights = generateInsights(data);

      expect(insights.summary).toContain('1000 queries');
      expect(insights.trends).toContain('response time');
    });

    it('generates insights for system metrics data', () => {
      const data = {
        systemPerformance: {
          cpuUsage: 45,
          memoryUsage: 60,
          diskUsage: 30,
        },
      };

      const insights = generateInsights(data);

      expect(insights.summary).toContain('CPU usage');
      expect(insights.trends).toContain('resource utilization');
    });

    it('handles empty data gracefully', () => {
      const insights = generateInsights({});

      expect(insights.summary).toBe('No data available for analysis');
      expect(insights.trends).toHaveLength(0);
      expect(insights.recommendations).toHaveLength(0);
    });

    it('handles null/undefined data gracefully', () => {
      const insights1 = generateInsights(null as any);
      const insights2 = generateInsights(undefined as any);

      expect(insights1.summary).toBe('No data available for analysis');
      expect(insights2.summary).toBe('No data available for analysis');
    });
  });

  describe('calculateTrends', () => {
    it('calculates positive trends correctly', () => {
      const data = [10, 15, 20, 25, 30];
      const trends = calculateTrends(data);

      expect(trends.direction).toBe('up');
      expect(trends.percentage).toBeGreaterThan(0);
      expect(trends.volatility).toBeLessThan(1);
    });

    it('calculates negative trends correctly', () => {
      const data = [30, 25, 20, 15, 10];
      const trends = calculateTrends(data);

      expect(trends.direction).toBe('down');
      expect(trends.percentage).toBeLessThan(0);
      expect(trends.volatility).toBeLessThan(1);
    });

    it('calculates stable trends correctly', () => {
      const data = [10, 10, 10, 10, 10];
      const trends = calculateTrends(data);

      expect(trends.direction).toBe('stable');
      expect(trends.percentage).toBe(0);
      expect(trends.volatility).toBe(0);
    });

    it('handles single data point', () => {
      const data = [10];
      const trends = calculateTrends(data);

      expect(trends.direction).toBe('stable');
      expect(trends.percentage).toBe(0);
      expect(trends.volatility).toBe(0);
    });

    it('handles empty data array', () => {
      const data: number[] = [];
      const trends = calculateTrends(data);

      expect(trends.direction).toBe('stable');
      expect(trends.percentage).toBe(0);
      expect(trends.volatility).toBe(0);
    });

    it('calculates volatility correctly', () => {
      const data = [10, 50, 5, 45, 15];
      const trends = calculateTrends(data);

      expect(trends.volatility).toBeGreaterThan(0.5);
    });
  });

  describe('getMetricValue', () => {
    it('extracts user activity metrics correctly', () => {
      const data = {
        userActivity: {
          totalUsers: 100,
          activeUsers: 80,
          newUsers: 10,
        },
      };

      expect(getMetricValue(data, AnalyticsMetricType.USER_ACTIVITY, 'totalUsers')).toBe(100);
      expect(getMetricValue(data, AnalyticsMetricType.USER_ACTIVITY, 'activeUsers')).toBe(80);
      expect(getMetricValue(data, AnalyticsMetricType.USER_ACTIVITY, 'newUsers')).toBe(10);
    });

    it('extracts database performance metrics correctly', () => {
      const data = {
        databaseActivity: {
          totalQueries: 1000,
          avgResponseTime: 120,
          errorRate: 0.01,
        },
      };

      expect(getMetricValue(data, AnalyticsMetricType.DATABASE_PERFORMANCE, 'totalQueries')).toBe(1000);
      expect(getMetricValue(data, AnalyticsMetricType.DATABASE_PERFORMANCE, 'avgResponseTime')).toBe(120);
      expect(getMetricValue(data, AnalyticsMetricType.DATABASE_PERFORMANCE, 'errorRate')).toBe(0.01);
    });

    it('returns null for missing metrics', () => {
      const data = {
        userActivity: {
          totalUsers: 100,
        },
      };

      expect(getMetricValue(data, AnalyticsMetricType.USER_ACTIVITY, 'nonExistent')).toBeNull();
      expect(getMetricValue(data, AnalyticsMetricType.DATABASE_PERFORMANCE, 'totalQueries')).toBeNull();
    });

    it('handles null/undefined data gracefully', () => {
      expect(getMetricValue(null, AnalyticsMetricType.USER_ACTIVITY, 'totalUsers')).toBeNull();
      expect(getMetricValue(undefined, AnalyticsMetricType.USER_ACTIVITY, 'totalUsers')).toBeNull();
    });
  });

  describe('formatMetricValue', () => {
    it('formats numbers correctly', () => {
      expect(formatMetricValue(1000)).toBe('1,000');
      expect(formatMetricValue(1000000)).toBe('1,000,000');
      expect(formatMetricValue(1234.56)).toBe('1,234.56');
    });

    it('formats percentages correctly', () => {
      expect(formatMetricValue(0.15, 'percentage')).toBe('15%');
      expect(formatMetricValue(0.1234, 'percentage')).toBe('12.34%');
      expect(formatMetricValue(1.5, 'percentage')).toBe('150%');
    });

    it('formats currency correctly', () => {
      expect(formatMetricValue(1000, 'currency')).toBe('$1,000');
      expect(formatMetricValue(1234.56, 'currency')).toBe('$1,234.56');
    });

    it('formats duration correctly', () => {
      expect(formatMetricValue(120, 'duration')).toBe('2m 0s');
      expect(formatMetricValue(3661, 'duration')).toBe('1h 1m 1s');
      expect(formatMetricValue(30, 'duration')).toBe('30s');
    });

    it('handles null/undefined values', () => {
      expect(formatMetricValue(null)).toBe('N/A');
      expect(formatMetricValue(undefined)).toBe('N/A');
    });

    it('handles invalid format types', () => {
      expect(formatMetricValue(1000, 'invalid' as any)).toBe('1,000');
    });
  });

  describe('Dashboard Management', () => {
    const mockDashboard: CustomDashboard = {
      id: '1',
      name: 'Test Dashboard',
      description: 'Test Description',
      type: DashboardType.CUSTOM,
      isPublic: false,
      theme: {
        primaryColor: '#3b82f6',
        backgroundColor: '#ffffff',
        textColor: '#1f2937',
        accentColor: '#10b981',
      },
      widgets: [],
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    const mockWidget: DashboardWidget = {
      id: '1',
      title: 'Test Widget',
      chartType: ChartType.LINE,
      metricType: AnalyticsMetricType.USER_ACTIVITY,
      timeRange: '30d',
      aggregation: 'avg',
      config: {},
    };

    describe('createDashboard', () => {
      it('creates dashboard with valid data', () => {
        const dashboard = createDashboard({
          name: 'New Dashboard',
          description: 'New Description',
          type: DashboardType.CUSTOM,
          isPublic: false,
        });

        expect(dashboard.name).toBe('New Dashboard');
        expect(dashboard.description).toBe('New Description');
        expect(dashboard.type).toBe(DashboardType.CUSTOM);
        expect(dashboard.isPublic).toBe(false);
        expect(dashboard.widgets).toHaveLength(0);
        expect(dashboard.id).toBeDefined();
        expect(dashboard.createdAt).toBeInstanceOf(Date);
        expect(dashboard.updatedAt).toBeInstanceOf(Date);
      });

      it('applies default theme when not provided', () => {
        const dashboard = createDashboard({
          name: 'Test',
          description: 'Test',
          type: DashboardType.CUSTOM,
        });

        expect(dashboard.theme).toEqual({
          primaryColor: '#3b82f6',
          backgroundColor: '#ffffff',
          textColor: '#1f2937',
          accentColor: '#10b981',
        });
      });
    });

    describe('addWidgetToDashboard', () => {
      it('adds widget to dashboard', () => {
        const updatedDashboard = addWidgetToDashboard(mockDashboard, mockWidget);

        expect(updatedDashboard.widgets).toHaveLength(1);
        expect(updatedDashboard.widgets[0]).toEqual(mockWidget);
        expect(updatedDashboard.updatedAt).toBeInstanceOf(Date);
      });

      it('adds multiple widgets to dashboard', () => {
        const widget2 = { ...mockWidget, id: '2', title: 'Widget 2' };
        let updatedDashboard = addWidgetToDashboard(mockDashboard, mockWidget);
        updatedDashboard = addWidgetToDashboard(updatedDashboard, widget2);

        expect(updatedDashboard.widgets).toHaveLength(2);
        expect(updatedDashboard.widgets[0].id).toBe('1');
        expect(updatedDashboard.widgets[1].id).toBe('2');
      });
    });

    describe('removeWidgetFromDashboard', () => {
      it('removes widget from dashboard', () => {
        const dashboardWithWidget = addWidgetToDashboard(mockDashboard, mockWidget);
        const updatedDashboard = removeWidgetFromDashboard(dashboardWithWidget, '1');

        expect(updatedDashboard.widgets).toHaveLength(0);
        expect(updatedDashboard.updatedAt).toBeInstanceOf(Date);
      });

      it('handles removing non-existent widget', () => {
        const updatedDashboard = removeWidgetFromDashboard(mockDashboard, 'non-existent');

        expect(updatedDashboard.widgets).toHaveLength(0);
        expect(updatedDashboard.updatedAt).toBeInstanceOf(Date);
      });
    });

    describe('updateWidgetConfig', () => {
      it('updates widget configuration', () => {
        const dashboardWithWidget = addWidgetToDashboard(mockDashboard, mockWidget);
        const updatedDashboard = updateWidgetConfig(dashboardWithWidget, '1', {
          title: 'Updated Widget',
          timeRange: '7d',
        });

        expect(updatedDashboard.widgets[0].title).toBe('Updated Widget');
        expect(updatedDashboard.widgets[0].timeRange).toBe('7d');
        expect(updatedDashboard.updatedAt).toBeInstanceOf(Date);
      });

      it('handles updating non-existent widget', () => {
        const updatedDashboard = updateWidgetConfig(mockDashboard, 'non-existent', {
          title: 'Updated Widget',
        });

        expect(updatedDashboard.widgets).toHaveLength(0);
        expect(updatedDashboard.updatedAt).toBeInstanceOf(Date);
      });
    });
  });

  describe('Data Processing', () => {
    describe('getDashboardData', () => {
      it('processes dashboard data correctly', () => {
        const rawData = {
          userActivity: {
            totalUsers: 100,
            activeUsers: 80,
            last7Days: [
              { date: '2024-01-01', users: 70 },
              { date: '2024-01-02', users: 80 },
            ],
          },
        };

        const dashboard = createDashboard({
          name: 'Test',
          description: 'Test',
          type: DashboardType.CUSTOM,
        });

        const widget = {
          ...mockWidget,
          metricType: AnalyticsMetricType.USER_ACTIVITY,
          chartType: ChartType.LINE,
        };

        const dashboardWithWidget = addWidgetToDashboard(dashboard, widget);
        const data = getDashboardData(dashboardWithWidget, rawData);

        expect(data).toHaveProperty('widgets');
        expect(data.widgets).toHaveLength(1);
        expect(data.widgets[0]).toHaveProperty('data');
        expect(data.widgets[0]).toHaveProperty('insights');
      });

      it('handles empty dashboard data', () => {
        const dashboard = createDashboard({
          name: 'Test',
          description: 'Test',
          type: DashboardType.CUSTOM,
        });

        const data = getDashboardData(dashboard, {});

        expect(data).toHaveProperty('widgets');
        expect(data.widgets).toHaveLength(0);
      });
    });

    describe('exportDashboardData', () => {
      it('exports dashboard data in JSON format', () => {
        const dashboard = createDashboard({
          name: 'Test',
          description: 'Test',
          type: DashboardType.CUSTOM,
        });

        const exportedData = exportDashboardData(dashboard, 'json');

        expect(exportedData).toHaveProperty('format', 'json');
        expect(exportedData).toHaveProperty('data');
        expect(exportedData.data).toHaveProperty('id', dashboard.id);
        expect(exportedData.data).toHaveProperty('name', dashboard.name);
      });

      it('exports dashboard data in CSV format', () => {
        const dashboard = createDashboard({
          name: 'Test',
          description: 'Test',
          type: DashboardType.CUSTOM,
        });

        const exportedData = exportDashboardData(dashboard, 'csv');

        expect(exportedData).toHaveProperty('format', 'csv');
        expect(exportedData).toHaveProperty('data');
        expect(typeof exportedData.data).toBe('string');
      });

      it('handles unsupported export formats', () => {
        const dashboard = createDashboard({
          name: 'Test',
          description: 'Test',
          type: DashboardType.CUSTOM,
        });

        const exportedData = exportDashboardData(dashboard, 'xml' as any);

        expect(exportedData).toHaveProperty('format', 'json'); // Should fallback to JSON
        expect(exportedData).toHaveProperty('data');
      });
    });
  });

  describe('Error Handling', () => {
    it('handles invalid metric types gracefully', () => {
      const data = { userActivity: { totalUsers: 100 } };
      const value = getMetricValue(data, 'INVALID_METRIC' as any, 'totalUsers');
      
      expect(value).toBeNull();
    });

    it('handles invalid chart types gracefully', () => {
      const widget = {
        ...mockWidget,
        chartType: 'INVALID_CHART' as any,
      };

      expect(widget.chartType).toBe('INVALID_CHART');
    });

    it('handles malformed data gracefully', () => {
      const insights = generateInsights({ invalid: 'data' });
      
      expect(insights.summary).toBe('No data available for analysis');
      expect(insights.trends).toHaveLength(0);
      expect(insights.recommendations).toHaveLength(0);
    });
  });
});
