import { useQuery } from '@tanstack/react-query';

interface AnalyticsSummary {
  totalUsers: number;
  activeUsers: number;
  activeUserPercentage: number;
  totalDatabases: number;
  totalTables: number;
  totalRows: number;
  totalCells: number;
  storageUsedGB: number;
  storageUsagePercentage: number;
  userGrowth: number;
  databaseGrowth: number;
  tableGrowth: number;
  lastUpdated: string;
}

interface UserActivity {
  date: string;
  activeUsers: number;
  totalUsers: number;
  engagementRate: number;
}

interface DatabaseActivity {
  name: string;
  tables: number;
  rows: number;
  size: number;
  lastAccessed: string;
}

interface SystemPerformance {
  avgResponseTime: number;
  uptime: number;
  healthScore: number;
  errorRate: number;
  throughput: number;
}

interface SimplifiedAnalyticsData {
  summary: AnalyticsSummary;
  userActivity: UserActivity[];
  databaseActivity: DatabaseActivity[];
  systemPerformance: SystemPerformance;
}

export const useSimplifiedAnalytics = () => {
  return useQuery<SimplifiedAnalyticsData>({
    queryKey: ['simplified-analytics'],
    queryFn: async () => {
      const response = await fetch('/api/tenants/1/analytics/summary');
      if (!response.ok) {
        throw new Error('Failed to fetch analytics data');
      }
      return response.json();
    },
    refetchInterval: 30000, // Refetch every 30 seconds
    staleTime: 10000, // Consider data stale after 10 seconds
  });
};
