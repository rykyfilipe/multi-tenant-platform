'use client';

import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';
import { 
  Database, 
  Users, 
  Server, 
  HardDrive, 
  Activity, 
  TrendingUp,
  Clock,
  Target,
  BarChart3,
  PieChart
} from 'lucide-react';
import { OverviewChart } from './OverviewChart';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, AreaChart, Area, PieChart as RechartsPieChart, Pie, Cell } from 'recharts';
import { usePlanLimits } from '@/hooks/usePlanLimits';
import { PLAN_LIMITS } from '@/lib/planConstants';

interface AnalyticsSummary {
  totalUsers: number;
  activeUsers: number;
  activeUserPercentage: number;
  totalDatabases: number;
  totalTables: number;
  totalRows: number;
  totalCells: number;
  storageUsed: number;
  storageUnit: string;
  storageUsedGB: number; // Keep for backward compatibility
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

interface MetricCardProps {
  title: string;
  value: number | string;
  unit?: string;
  icon: React.ComponentType<{ className?: string }>;
  progress?: number;
  color?: 'green' | 'blue' | 'orange' | 'red' | 'purple';
  trend?: {
    value: number;
    type: 'increase' | 'decrease';
  };
}

const MetricCard: React.FC<MetricCardProps> = ({ 
  title, 
  value, 
  unit = '', 
  icon: Icon, 
  progress, 
  color = 'blue',
  trend 
}) => {
  const colorClasses = {
    green: 'text-gray-800 bg-gradient-to-br from-gray-50 to-gray-100/50 border-gray-200/50',
    blue: 'text-gray-700 bg-gradient-to-br from-gray-50 to-gray-100/50 border-gray-200/50',
    orange: 'text-gray-600 bg-gradient-to-br from-gray-50 to-gray-100/50 border-gray-200/50',
    red: 'text-gray-900 bg-gradient-to-br from-gray-50 to-gray-100/50 border-gray-200/50',
    purple: 'text-gray-800 bg-gradient-to-br from-gray-50 to-gray-100/50 border-gray-200/50'
  };

  return (
    <Card className={`bg-white border-0 shadow-lg shadow-gray-100/50 rounded-xl overflow-hidden ${colorClasses[color]}`}>
      <CardContent className="p-6">
        <div className="flex items-center justify-between">
          <div className="flex-1">
            <div className="flex items-center gap-2 mb-3">
              <div className="p-2 rounded-lg bg-white/80 shadow-sm">
                <Icon className="h-4 w-4" />
              </div>
              <p className="text-sm font-semibold text-gray-700">{title}</p>
            </div>
            <div className="flex items-baseline gap-1 mb-2">
              <span className="text-3xl font-bold text-gray-900">{value}</span>
              {unit && <span className="text-sm font-medium text-gray-600">{unit}</span>}
            </div>
            {trend && (
              <div className="flex items-center gap-1">
                <TrendingUp className={`h-3 w-3 ${trend.type === 'increase' ? 'text-gray-600' : 'text-gray-400'}`} />
                <span className={`text-xs font-semibold ${trend.type === 'increase' ? 'text-gray-700' : 'text-gray-500'}`}>
                  {trend.value}%
                </span>
              </div>
            )}
          </div>
          {progress !== undefined && (
            <div className="w-20">
              <div className="bg-white/80 rounded-full p-1 shadow-sm">
                <Progress value={progress} className="h-2" />
              </div>
              <span className="text-xs font-semibold text-gray-600 mt-2 block text-center">
                {progress}%
              </span>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
};

interface ChartCardProps {
  title: string;
  icon: React.ComponentType<{ className?: string }>;
  children: React.ReactNode;
}

const ChartCard: React.FC<ChartCardProps> = ({ title, icon: Icon, children }) => (
  <Card className="bg-white border-0 shadow-xl shadow-gray-100/50 rounded-2xl overflow-hidden">
    <CardHeader className="bg-gradient-to-r from-gray-50 to-white border-b border-gray-100/50 pb-4">
      <CardTitle className="text-xl font-bold text-gray-900 tracking-tight flex items-center gap-2">
        <Icon className="h-5 w-5 text-gray-600" />
        {title}
      </CardTitle>
    </CardHeader>
    <CardContent className="p-6 bg-white">
      {children}
    </CardContent>
  </Card>
);

export const SimplifiedAnalyticsDashboard: React.FC = () => {
  const [data, setData] = useState<SimplifiedAnalyticsData | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);
  const { getUsagePercentage } = usePlanLimits();

  useEffect(() => {
    const fetchAnalytics = async () => {
      try {
        setIsLoading(true);
        setError(null);
        
        // Get tenant ID from session
        const sessionResponse = await fetch('/api/auth/session');
        if (!sessionResponse.ok) {
          throw new Error('Failed to fetch session');
        }
        
        const session = await sessionResponse.json();
        if (!session?.user?.tenantId) {
          throw new Error('No tenant ID found in session');
        }
        
        const tenantId = session.user.tenantId;
        const response = await fetch(`/api/tenants/${tenantId}/analytics/summary`);
        
        if (!response.ok) {
          throw new Error('Failed to fetch analytics data');
        }
        
        const analyticsData = await response.json();
        setData(analyticsData);
      } catch (err) {
        setError(err instanceof Error ? err : new Error('Unknown error'));
      } finally {
        setIsLoading(false);
      }
    };

    fetchAnalytics();

    // Set up interval to refetch data every 30 seconds
    const interval = setInterval(fetchAnalytics, 30000);

    return () => clearInterval(interval);
  }, []);

  if (isLoading) {
    return (
      <div className="p-6 space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {Array.from({ length: 8 }).map((_, i) => (
            <div key={i} className="h-32 bg-gray-100 rounded-lg animate-pulse" />
          ))}
        </div>
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {Array.from({ length: 4 }).map((_, i) => (
            <div key={i} className="h-80 bg-gray-100 rounded-lg animate-pulse" />
          ))}
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-6">
        <Card className="border-red-200 bg-red-50">
          <CardContent className="p-6 text-center">
            <Activity className="h-12 w-12 text-red-500 mx-auto mb-4" />
            <h3 className="text-lg font-semibold text-red-800 mb-2">Error Loading Analytics</h3>
            <p className="text-red-600">{error?.message || 'Unknown error'}</p>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (!data) {
    return (
      <div className="p-6">
        <Card>
          <CardContent className="p-6 text-center">
            <BarChart3 className="h-12 w-12 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-semibold text-gray-800 mb-2">No Data Available</h3>
            <p className="text-gray-600">Analytics data is not available at the moment.</p>
          </CardContent>
        </Card>
      </div>
    );
  }

  const { summary, userActivity, databaseActivity, systemPerformance } = data;

  // Calculate correct storage usage percentage based on plan limits
  const correctStorageUsagePercentage = getUsagePercentage('storage');

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-4xl font-bold text-gray-900 tracking-tight">Analytics Dashboard</h1>
          <p className="text-gray-600 mt-2 font-medium">Real-time insights and performance metrics</p>
        </div>
        <Badge variant="outline" className="bg-gradient-to-r from-emerald-50 to-emerald-100 text-emerald-700 border-emerald-200/50 px-4 py-2 text-sm font-semibold shadow-sm">
          Live Data
        </Badge>
      </div>

      {/* Key Metrics Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <MetricCard
          title="Total Users"
          value={summary.totalUsers}
          icon={Users}
          color="blue"
          trend={{ value: summary.userGrowth, type: summary.userGrowth >= 0 ? 'increase' : 'decrease' }}
        />
        <MetricCard
          title="Active Users"
          value={summary.activeUsers}
          icon={Activity}
          color="green"
          progress={summary.activeUserPercentage}
        />
        <MetricCard
          title="Total Databases"
          value={summary.totalDatabases}
          icon={Database}
          color="purple"
          trend={{ value: summary.databaseGrowth, type: summary.databaseGrowth >= 0 ? 'increase' : 'decrease' }}
        />
        <MetricCard
          title="Total Tables"
          value={summary.totalTables}
          icon={Server}
          color="orange"
          trend={{ value: summary.tableGrowth, type: summary.tableGrowth >= 0 ? 'increase' : 'decrease' }}
        />
        <MetricCard
          title="Storage Usage"
          value={`${summary.storageUsed.toFixed(1)}${summary.storageUnit}`}
          icon={HardDrive}
          color={correctStorageUsagePercentage > 80 ? 'red' : correctStorageUsagePercentage > 60 ? 'orange' : 'green'}
          progress={correctStorageUsagePercentage}
        />
        <MetricCard
          title="Response Time"
          value={systemPerformance.avgResponseTime}
          unit="ms"
          icon={Clock}
          color={systemPerformance.avgResponseTime < 100 ? 'green' : systemPerformance.avgResponseTime < 200 ? 'orange' : 'red'}
        />
        <MetricCard
          title="System Health"
          value={systemPerformance.healthScore}
          unit="/100"
          icon={Target}
          color={systemPerformance.healthScore >= 80 ? 'green' : systemPerformance.healthScore >= 60 ? 'orange' : 'red'}
          progress={systemPerformance.healthScore}
        />
        <MetricCard
          title="Uptime"
          value={systemPerformance.uptime}
          unit="%"
          icon={Server}
          color={systemPerformance.uptime >= 99.5 ? 'green' : systemPerformance.uptime >= 99 ? 'orange' : 'red'}
          progress={systemPerformance.uptime}
        />
      </div>

      {/* Charts Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <ChartCard title="User Activity Over Time" icon={Activity}>
          <div className="h-80">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={userActivity} margin={{ top: 20, right: 30, left: 20, bottom: 20 }}>
                <CartesianGrid strokeDasharray="1 1" stroke="#e5e7eb" strokeOpacity={0.3} vertical={false} />
                <XAxis 
                  dataKey="date" 
                  tick={{ fontSize: 12, fill: "#6b7280", fontWeight: 500, fontFamily: "Inter, system-ui, sans-serif" }}
                  tickLine={{ stroke: "#e5e7eb", strokeWidth: 1 }}
                  axisLine={{ stroke: "#e5e7eb", strokeWidth: 1 }}
                  tickMargin={8}
                />
                <YAxis 
                  tick={{ fontSize: 12, fill: "#6b7280", fontWeight: 500, fontFamily: "Inter, system-ui, sans-serif" }}
                  tickLine={{ stroke: "#e5e7eb", strokeWidth: 1 }}
                  axisLine={{ stroke: "#e5e7eb", strokeWidth: 1 }}
                  tickMargin={8}
                />
                <Tooltip 
                  contentStyle={{
                    backgroundColor: "rgba(255, 255, 255, 0.95)",
                    border: "1px solid rgba(229, 231, 235, 0.8)",
                    borderRadius: "12px",
                    boxShadow: "0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04)",
                    backdropFilter: "blur(8px)",
                    fontFamily: "Inter, system-ui, sans-serif",
                    fontSize: "13px",
                    fontWeight: "500",
                    color: "#374151",
                    padding: "12px 16px"
                  }}
                />
                <Area
                  type="monotone"
                  dataKey="activeUsers"
                  stroke="#1f2937"
                  fill="#1f2937"
                  fillOpacity={0.15}
                  strokeWidth={3}
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </ChartCard>

        <ChartCard title="Database Activity" icon={Database}>
          <div className="h-80">
            <ResponsiveContainer width="100%" height="100%">
              <RechartsPieChart margin={{ top: 20, right: 30, left: 20, bottom: 20 }}>
                <Pie
                  data={databaseActivity.map(db => ({ name: db.name, value: db.rows }))}
                  cx="50%"
                  cy="50%"
                  outerRadius={100}
                  fill="#8884d8"
                  dataKey="value"
                  label={({ name, percent }: any) => `${name} ${(percent * 100).toFixed(0)}%`}
                >
                  {databaseActivity.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={["#1f2937", "#374151", "#4b5563", "#6b7280", "#9ca3af"][index % 5]} />
                  ))}
                </Pie>
                <Tooltip 
                  contentStyle={{
                    backgroundColor: "rgba(255, 255, 255, 0.95)",
                    border: "1px solid rgba(229, 231, 235, 0.8)",
                    borderRadius: "12px",
                    boxShadow: "0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04)",
                    backdropFilter: "blur(8px)",
                    fontFamily: "Inter, system-ui, sans-serif",
                    fontSize: "13px",
                    fontWeight: "500",
                    color: "#374151",
                    padding: "12px 16px"
                  }}
                />
              </RechartsPieChart>
            </ResponsiveContainer>
          </div>
        </ChartCard>

        <ChartCard title="System Performance" icon={TrendingUp}>
          <div className="h-80">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={[
                { name: "Response Time", value: systemPerformance.avgResponseTime },
                { name: "Health Score", value: systemPerformance.healthScore },
                { name: "Uptime", value: systemPerformance.uptime },
                { name: "Error Rate", value: systemPerformance.errorRate * 100 }
              ]} margin={{ top: 20, right: 30, left: 20, bottom: 20 }}>
                <CartesianGrid strokeDasharray="1 1" stroke="#e5e7eb" strokeOpacity={0.3} vertical={false} />
                <XAxis 
                  dataKey="name" 
                  tick={{ fontSize: 12, fill: "#6b7280", fontWeight: 500, fontFamily: "Inter, system-ui, sans-serif" }}
                  tickLine={{ stroke: "#e5e7eb", strokeWidth: 1 }}
                  axisLine={{ stroke: "#e5e7eb", strokeWidth: 1 }}
                  tickMargin={8}
                />
                <YAxis 
                  tick={{ fontSize: 12, fill: "#6b7280", fontWeight: 500, fontFamily: "Inter, system-ui, sans-serif" }}
                  tickLine={{ stroke: "#e5e7eb", strokeWidth: 1 }}
                  axisLine={{ stroke: "#e5e7eb", strokeWidth: 1 }}
                  tickMargin={8}
                />
                <Tooltip 
                  contentStyle={{
                    backgroundColor: "rgba(255, 255, 255, 0.95)",
                    border: "1px solid rgba(229, 231, 235, 0.8)",
                    borderRadius: "12px",
                    boxShadow: "0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04)",
                    backdropFilter: "blur(8px)",
                    fontFamily: "Inter, system-ui, sans-serif",
                    fontSize: "13px",
                    fontWeight: "500",
                    color: "#374151",
                    padding: "12px 16px"
                  }}
                />
                <Line
                  type="monotone"
                  dataKey="value"
                  stroke="#374151"
                  strokeWidth={3}
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  dot={{ fill: "#374151", strokeWidth: 0, r: 0, opacity: 0 }}
                  activeDot={{ r: 6, stroke: "#374151", strokeWidth: 3, fill: "white", strokeOpacity: 1, filter: "drop-shadow(0 4px 6px rgba(0, 0, 0, 0.1))" }}
                />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </ChartCard>

        <ChartCard title="Resource Usage" icon={HardDrive}>
          <div className="h-80">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={[
                { name: "Storage Used", value: correctStorageUsagePercentage },
                { name: "Storage Free", value: 100 - correctStorageUsagePercentage }
              ]} margin={{ top: 20, right: 30, left: 20, bottom: 20 }}>
                <CartesianGrid strokeDasharray="1 1" stroke="#e5e7eb" strokeOpacity={0.3} vertical={false} />
                <XAxis 
                  dataKey="name" 
                  tick={{ fontSize: 12, fill: "#6b7280", fontWeight: 500, fontFamily: "Inter, system-ui, sans-serif" }}
                  tickLine={{ stroke: "#e5e7eb", strokeWidth: 1 }}
                  axisLine={{ stroke: "#e5e7eb", strokeWidth: 1 }}
                  tickMargin={8}
                />
                <YAxis 
                  tick={{ fontSize: 12, fill: "#6b7280", fontWeight: 500, fontFamily: "Inter, system-ui, sans-serif" }}
                  tickLine={{ stroke: "#e5e7eb", strokeWidth: 1 }}
                  axisLine={{ stroke: "#e5e7eb", strokeWidth: 1 }}
                  tickMargin={8}
                  tickFormatter={(value) => `${value}%`}
                />
                <Tooltip 
                  contentStyle={{
                    backgroundColor: "rgba(255, 255, 255, 0.95)",
                    border: "1px solid rgba(229, 231, 235, 0.8)",
                    borderRadius: "12px",
                    boxShadow: "0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04)",
                    backdropFilter: "blur(8px)",
                    fontFamily: "Inter, system-ui, sans-serif",
                    fontSize: "13px",
                    fontWeight: "500",
                    color: "#374151",
                    padding: "12px 16px"
                  }}
                />
                <Area
                  type="monotone"
                  dataKey="value"
                  stroke="#4b5563"
                  fill="#4b5563"
                  fillOpacity={0.15}
                  strokeWidth={3}
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </ChartCard>
      </div>

      {/* Additional Info */}
      <Card className="bg-white border-0 shadow-xl shadow-gray-100/50 rounded-2xl overflow-hidden">
        <CardHeader className="bg-gradient-to-r from-gray-50 to-white border-b border-gray-100/50 pb-4">
          <CardTitle className="text-xl font-bold text-gray-900 tracking-tight">System Overview</CardTitle>
        </CardHeader>
        <CardContent className="p-6 bg-white">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <div className="text-center">
              <div className="text-4xl font-bold text-gray-900 mb-2">{summary.totalRows.toLocaleString()}</div>
              <div className="text-sm font-semibold text-gray-600 uppercase tracking-wide">Total Rows</div>
            </div>
            <div className="text-center">
              <div className="text-4xl font-bold text-gray-900 mb-2">{summary.totalCells.toLocaleString()}</div>
              <div className="text-sm font-semibold text-gray-600 uppercase tracking-wide">Total Cells</div>
            </div>
            <div className="text-center">
              <div className="text-4xl font-bold text-gray-900 mb-2">{summary.lastUpdated}</div>
              <div className="text-sm font-semibold text-gray-600 uppercase tracking-wide">Last Updated</div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};
