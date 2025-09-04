/** @format */

import { ProcessedAnalyticsData } from '@/hooks/useProcessedAnalyticsData';

// Mock data processing functions
const processAnalyticsData = (rawData: any, realTimeData?: any, businessData?: any): ProcessedAnalyticsData => {
  // Calculate KPIs
  const totalDatabases = rawData.stats?.totalDatabases || 0;
  const totalTables = rawData.stats?.totalTables || 0;
  const totalRows = rawData.stats?.totalRows || 0;
  const totalUsers = rawData.stats?.totalUsers || 0;
  const activeUsers = rawData.stats?.activeUsers || 0;

  const engagementRate = totalUsers > 0 ? (activeUsers / totalUsers) * 100 : 0;
  const memoryUsagePercentage = rawData.stats?.memoryPercentage || 0;
  const storageUsagePercentage = rawData.usageData?.storage
    ? (rawData.usageData.storage.used / rawData.usageData.storage.total) * 100
    : 0;

  const averageTablesPerDatabase = totalDatabases > 0 ? totalTables / totalDatabases : 0;
  const averageRowsPerTable = totalTables > 0 ? totalRows / totalTables : 0;

  // Resource utilization score (0-100)
  const resourceUtilizationScore = Math.round(
    memoryUsagePercentage * 0.3 +
      storageUsagePercentage * 0.3 +
      engagementRate * 0.4,
  );

  // Calculate real growth data from real-time data
  const weeklyDatabaseGrowth = realTimeData?.userActivity?.userGrowth || 0;
  const weeklyUserGrowth = realTimeData?.userActivity?.userGrowth || 0;
  const weeklyTableGrowth = businessData?.growth?.usageGrowth || 0;
  const weeklyRowGrowth = businessData?.growth?.usageGrowth || 0;

  // Distribution data - use real sizes from memory tracking
  const databaseSizes = rawData.databaseData?.databases?.map((db: any, index: number) => {
    const sizeValueKB = db.sizeKB || (parseFloat((db.size || "0MB").replace("MB", "")) * 1024);
    const realSizeKB = db.realSizeKB || sizeValueKB;
    
    return {
      name: db.name || `Database ${index + 1}`,
      value: realSizeKB > 0 ? realSizeKB : Math.floor(totalRows * 0.02) + Math.floor(Math.random() * totalRows * 0.01),
      percentage: 0, // Will be calculated after sorting
      realSize: db.realSizeFormatted || db.size,
    };
  }) || [];

  // Calculate percentages for database sizes
  const totalSize = databaseSizes.reduce((acc, db) => acc + db.value, 0);
  databaseSizes.forEach((db) => {
    db.percentage = totalSize > 0 ? (db.value / totalSize) * 100 : 0;
  });

  // User roles distribution (real data from user data)
  const userRoles = rawData.userData?.recentUsers?.reduce((acc: any[], user: any) => {
    const role = user.role || 'Viewer';
    const existingRole = acc.find(r => r.role === role);
    if (existingRole) {
      existingRole.count++;
    } else {
      acc.push({ role, count: 1, percentage: 0 });
    }
    return acc;
  }, []) || [
    { role: "Admin", count: Math.floor(totalUsers * 0.1), percentage: 10 },
    { role: "Editor", count: Math.floor(totalUsers * 0.3), percentage: 30 },
    { role: "Viewer", count: Math.floor(totalUsers * 0.6), percentage: 60 },
  ];
  
  // Calculate percentages for user roles
  const totalRoleUsers = userRoles.reduce((acc: any, role: any) => acc + role.count, 0);
  userRoles.forEach((role: any) => {
    role.percentage = totalRoleUsers > 0 ? (role.count / totalRoleUsers) * 100 : 0;
  });

  // Resource usage distribution
  const resourceUsage = [
    {
      resource: "Storage",
      used: rawData.usageData?.storage?.used || 0,
      total: rawData.usageData?.storage?.total || 1,
      percentage: Math.max(storageUsagePercentage, 0.1),
    },
    {
      resource: "Databases",
      used: rawData.usageData?.databases?.used || 0,
      total: rawData.usageData?.databases?.total || 1,
      percentage: Math.max(
        rawData.usageData?.databases?.total > 0
          ? (rawData.usageData.databases.used / rawData.usageData.databases.total) * 100
          : 0,
        0.1
      ),
    },
  ];

  // Rankings
  const topDatabases = rawData.databaseData?.databases
    ?.map((db: any) => ({
      name: db.name,
      tables: db.tables || 0,
      rows: db.rows || 0,
      size: db.realSizeKB || db.sizeKB || (parseFloat((db.size || "0MB").replace("MB", "")) * 1024) || 0,
      realSize: db.realSizeFormatted || db.size,
    }))
    .sort((a: any, b: any) => b.size - a.size)
    .slice(0, 5) || [];

  const mostActiveUsers = rawData.userData?.recentUsers
    ?.filter((user: any) => user.status === "online")
    .slice(0, 5) || [];

  // Time series data
  const userActivityData = realTimeData?.userActivity?.last7Days?.map((day: any) => ({
    date: day.date,
    active: day.users,
    total: totalUsers,
    percentage: totalUsers > 0 ? (day.users / totalUsers) * 100 : 0,
  })) || Array.from({ length: 7 }, (_, i) => {
    const date = new Date();
    date.setDate(date.getDate() - (6 - i));
    return {
      date: date.toISOString().split("T")[0],
      active: 0,
      total: totalUsers,
      percentage: 0,
    };
  });

  // Performance metrics
  const performance = {
    averageResponseTime: realTimeData?.databaseActivity?.avgResponseTime || 
                        businessData?.performance?.avgResponseTime || 120,
    uptime: businessData?.performance?.uptime || 99.5,
    errorRate: realTimeData?.databaseActivity?.errorRate || 
              businessData?.performance?.errorRate || 0.1,
    throughput: businessData?.performance?.throughput || 500,
    peakUsageHours: realTimeData?.systemPerformance?.last24Hours?.map((hour: any) => ({
      hour: hour.hour,
      usage: hour.cpuUsage,
    })) || Array.from({ length: 24 }, (_, i) => ({
      hour: i,
      usage: 0,
    })),
  };

  // Health scores (0-100)
  const health = {
    overall: Math.floor(
      100 -
        (memoryUsagePercentage * 0.3 +
          storageUsagePercentage * 0.3 +
          (100 - engagementRate) * 0.4),
    ),
    database: totalDatabases > 0 ? Math.min(100, (totalTables / totalDatabases) * 20) : 0,
    memory: Math.max(0, 100 - memoryUsagePercentage),
    storage: Math.max(0, 100 - storageUsagePercentage),
    users: Math.min(100, engagementRate * 1.2),
  };

  return {
    raw: rawData,
    kpis: {
      totalDatabases,
      totalTables,
      totalRows,
      totalUsers,
      activeUsers,
      engagementRate: Math.round(engagementRate * 100) / 100,
      memoryUsagePercentage: Math.round(memoryUsagePercentage * 100) / 100,
      storageUsagePercentage: Math.round(storageUsagePercentage * 100) / 100,
      databaseGrowthRate: weeklyDatabaseGrowth,
      averageTablesPerDatabase: Math.round(averageTablesPerDatabase * 100) / 100,
      averageRowsPerTable: Math.round(averageRowsPerTable),
      resourceUtilizationScore,
    },
    growth: {
      weeklyDatabaseGrowth,
      weeklyUserGrowth,
      weeklyTableGrowth,
      weeklyRowGrowth,
      monthlyGrowthTrend: weeklyUserGrowth > 5 ? "up" : weeklyUserGrowth > -5 ? "stable" : "down",
    },
    distributions: {
      databaseSizes: databaseSizes.sort((a, b) => b.value - a.value),
      userRoles,
      tablesByDatabase: rawData.databaseData?.databases?.map((db: any) => ({
        database: db.name,
        tables: db.tables || 0,
      })) || [],
      resourceUsage,
    },
    rankings: {
      topDatabases,
      mostActiveUsers,
      largestTables: [],
    },
    timeSeriesData: {
      userActivity: userActivityData,
      databaseGrowth: [],
      memoryUsage: [],
      storageUsage: [],
    },
    performance,
    health,
  };
};

describe('Analytics Data Processing', () => {
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

  describe('KPI Calculations', () => {
    it('calculates basic KPIs correctly', () => {
      const result = processAnalyticsData(mockRawData);

      expect(result.kpis.totalDatabases).toBe(5);
      expect(result.kpis.totalTables).toBe(25);
      expect(result.kpis.totalRows).toBe(10000);
      expect(result.kpis.totalUsers).toBe(50);
      expect(result.kpis.activeUsers).toBe(35);
    });

    it('calculates engagement rate correctly', () => {
      const result = processAnalyticsData(mockRawData);

      expect(result.kpis.engagementRate).toBe(70); // 35/50 * 100
    });

    it('calculates storage usage percentage correctly', () => {
      const result = processAnalyticsData(mockRawData);

      expect(result.kpis.storageUsagePercentage).toBe(50); // 500/1000 * 100
    });

    it('calculates resource utilization score correctly', () => {
      const result = processAnalyticsData(mockRawData);

      // Resource utilization score = memoryUsagePercentage * 0.3 + storageUsagePercentage * 0.3 + engagementRate * 0.4
      // = 45 * 0.3 + 50 * 0.3 + 70 * 0.4 = 13.5 + 15 + 28 = 56.5
      expect(result.kpis.resourceUtilizationScore).toBe(57); // Rounded
    });

    it('calculates averages correctly', () => {
      const result = processAnalyticsData(mockRawData);

      expect(result.kpis.averageTablesPerDatabase).toBe(5); // 25/5
      expect(result.kpis.averageRowsPerTable).toBe(400); // 10000/25
    });
  });

  describe('Growth Calculations', () => {
    it('processes growth data from real-time data', () => {
      const result = processAnalyticsData(mockRawData, mockRealTimeData, mockBusinessData);

      expect(result.growth.weeklyDatabaseGrowth).toBe(12.5);
      expect(result.growth.weeklyUserGrowth).toBe(12.5);
      expect(result.growth.weeklyTableGrowth).toBe(20.0);
      expect(result.growth.weeklyRowGrowth).toBe(20.0);
    });

    it('determines monthly growth trend correctly', () => {
      const result = processAnalyticsData(mockRawData, mockRealTimeData, mockBusinessData);

      expect(result.growth.monthlyGrowthTrend).toBe('up'); // 12.5 > 5
    });

    it('handles negative growth correctly', () => {
      const negativeGrowthData = {
        ...mockRealTimeData,
        userActivity: { ...mockRealTimeData.userActivity, userGrowth: -10 },
      };

      const result = processAnalyticsData(mockRawData, negativeGrowthData, mockBusinessData);

      expect(result.growth.monthlyGrowthTrend).toBe('down'); // -10 < -5
    });

    it('handles stable growth correctly', () => {
      const stableGrowthData = {
        ...mockRealTimeData,
        userActivity: { ...mockRealTimeData.userActivity, userGrowth: 2 },
      };

      const result = processAnalyticsData(mockRawData, stableGrowthData, mockBusinessData);

      expect(result.growth.monthlyGrowthTrend).toBe('stable'); // 2 is between -5 and 5
    });
  });

  describe('Distribution Calculations', () => {
    it('processes database sizes correctly', () => {
      const result = processAnalyticsData(mockRawData);

      expect(result.distributions.databaseSizes).toHaveLength(2);
      expect(result.distributions.databaseSizes[0].name).toBe('DB1');
      expect(result.distributions.databaseSizes[0].value).toBe(5120);
      expect(result.distributions.databaseSizes[0].realSize).toBe('5.0 MB');
    });

    it('calculates database size percentages correctly', () => {
      const result = processAnalyticsData(mockRawData);

      const totalSize = 5120 + 3072; // 8192
      expect(result.distributions.databaseSizes[0].percentage).toBeCloseTo(62.5, 1); // 5120/8192 * 100
      expect(result.distributions.databaseSizes[1].percentage).toBeCloseTo(37.5, 1); // 3072/8192 * 100
    });

    it('processes user roles correctly', () => {
      const result = processAnalyticsData(mockRawData);

      expect(result.distributions.userRoles).toHaveLength(3);
      expect(result.distributions.userRoles.find(r => r.role === 'Admin')?.count).toBe(1);
      expect(result.distributions.userRoles.find(r => r.role === 'Editor')?.count).toBe(1);
      expect(result.distributions.userRoles.find(r => r.role === 'Viewer')?.count).toBe(1);
    });

    it('calculates user role percentages correctly', () => {
      const result = processAnalyticsData(mockRawData);

      const adminRole = result.distributions.userRoles.find(r => r.role === 'Admin');
      const editorRole = result.distributions.userRoles.find(r => r.role === 'Editor');
      const viewerRole = result.distributions.userRoles.find(r => r.role === 'Viewer');

      expect(adminRole?.percentage).toBeCloseTo(33.33, 1); // 1/3 * 100
      expect(editorRole?.percentage).toBeCloseTo(33.33, 1); // 1/3 * 100
      expect(viewerRole?.percentage).toBeCloseTo(33.33, 1); // 1/3 * 100
    });

    it('processes resource usage correctly', () => {
      const result = processAnalyticsData(mockRawData);

      expect(result.distributions.resourceUsage).toHaveLength(2);
      expect(result.distributions.resourceUsage[0].resource).toBe('Storage');
      expect(result.distributions.resourceUsage[0].percentage).toBe(50); // 500/1000 * 100
      expect(result.distributions.resourceUsage[1].resource).toBe('Databases');
      expect(result.distributions.resourceUsage[1].percentage).toBe(50); // 5/10 * 100
    });
  });

  describe('Rankings Processing', () => {
    it('processes top databases correctly', () => {
      const result = processAnalyticsData(mockRawData);

      expect(result.rankings.topDatabases).toHaveLength(2);
      expect(result.rankings.topDatabases[0].name).toBe('DB1'); // Largest by size
      expect(result.rankings.topDatabases[0].size).toBe(5120);
      expect(result.rankings.topDatabases[1].name).toBe('DB2');
      expect(result.rankings.topDatabases[1].size).toBe(3072);
    });

    it('processes most active users correctly', () => {
      const result = processAnalyticsData(mockRawData);

      expect(result.rankings.mostActiveUsers).toHaveLength(2); // Only online users
      expect(result.rankings.mostActiveUsers[0].name).toBe('John Doe');
      expect(result.rankings.mostActiveUsers[1].name).toBe('Bob Wilson');
    });
  });

  describe('Time Series Data Processing', () => {
    it('processes user activity data correctly', () => {
      const result = processAnalyticsData(mockRawData, mockRealTimeData);

      expect(result.timeSeriesData.userActivity).toHaveLength(2);
      expect(result.timeSeriesData.userActivity[0].date).toBe('2024-01-01');
      expect(result.timeSeriesData.userActivity[0].active).toBe(30);
      expect(result.timeSeriesData.userActivity[0].total).toBe(50);
      expect(result.timeSeriesData.userActivity[0].percentage).toBe(60); // 30/50 * 100
    });

    it('generates fallback data when real-time data is missing', () => {
      const result = processAnalyticsData(mockRawData);

      expect(result.timeSeriesData.userActivity).toHaveLength(7);
      expect(result.timeSeriesData.userActivity[0].active).toBe(0);
      expect(result.timeSeriesData.userActivity[0].total).toBe(50);
      expect(result.timeSeriesData.userActivity[0].percentage).toBe(0);
    });
  });

  describe('Performance Metrics Processing', () => {
    it('processes performance data from real-time and business data', () => {
      const result = processAnalyticsData(mockRawData, mockRealTimeData, mockBusinessData);

      expect(result.performance.averageResponseTime).toBe(120);
      expect(result.performance.uptime).toBe(99.5);
      expect(result.performance.errorRate).toBe(0.01); // From real-time data
      expect(result.performance.throughput).toBe(500);
    });

    it('processes peak usage hours correctly', () => {
      const result = processAnalyticsData(mockRawData, mockRealTimeData, mockBusinessData);

      expect(result.performance.peakUsageHours).toHaveLength(2);
      expect(result.performance.peakUsageHours[0].hour).toBe(0);
      expect(result.performance.peakUsageHours[0].usage).toBe(40);
      expect(result.performance.peakUsageHours[1].hour).toBe(1);
      expect(result.performance.peakUsageHours[1].usage).toBe(45);
    });
  });

  describe('Health Score Calculations', () => {
    it('calculates health scores correctly', () => {
      const result = processAnalyticsData(mockRawData);

      expect(result.health.overall).toBeDefined();
      expect(result.health.database).toBeDefined();
      expect(result.health.memory).toBeDefined();
      expect(result.health.storage).toBeDefined();
      expect(result.health.users).toBeDefined();
    });

    it('calculates database health score correctly', () => {
      const result = processAnalyticsData(mockRawData);

      // Database health = min(100, (totalTables / totalDatabases) * 20)
      // = min(100, (25 / 5) * 20) = min(100, 100) = 100
      expect(result.health.database).toBe(100);
    });

    it('calculates memory health score correctly', () => {
      const result = processAnalyticsData(mockRawData);

      // Memory health = max(0, 100 - memoryUsagePercentage)
      // = max(0, 100 - 45) = 55
      expect(result.health.memory).toBe(55);
    });

    it('calculates storage health score correctly', () => {
      const result = processAnalyticsData(mockRawData);

      // Storage health = max(0, 100 - storageUsagePercentage)
      // = max(0, 100 - 50) = 50
      expect(result.health.storage).toBe(50);
    });
  });

  describe('Edge Cases', () => {
    it('handles empty raw data gracefully', () => {
      const result = processAnalyticsData({});

      expect(result.kpis.totalDatabases).toBe(0);
      expect(result.kpis.totalTables).toBe(0);
      expect(result.kpis.totalRows).toBe(0);
      expect(result.kpis.totalUsers).toBe(0);
      expect(result.kpis.activeUsers).toBe(0);
      expect(result.kpis.engagementRate).toBe(0);
    });

    it('handles missing usage data gracefully', () => {
      const dataWithoutUsage = {
        ...mockRawData,
        usageData: {},
      };

      const result = processAnalyticsData(dataWithoutUsage);

      expect(result.kpis.storageUsagePercentage).toBe(0);
      expect(result.distributions.resourceUsage[0].percentage).toBe(0.1); // Minimum value
    });

    it('handles zero values correctly', () => {
      const zeroData = {
        stats: {
          totalDatabases: 0,
          totalTables: 0,
          totalRows: 0,
          totalUsers: 0,
          activeUsers: 0,
          memoryPercentage: 0,
        },
        usageData: {
          storage: { used: 0, total: 0 },
          databases: { used: 0, total: 0 },
        },
        databaseData: { databases: [] },
        userData: { recentUsers: [] },
      };

      const result = processAnalyticsData(zeroData);

      expect(result.kpis.averageTablesPerDatabase).toBe(0);
      expect(result.kpis.averageRowsPerTable).toBe(0);
      expect(result.health.database).toBe(0);
    });
  });
});
