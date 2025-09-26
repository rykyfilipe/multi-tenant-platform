'use client';

import React from 'react';
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
import { useSimplifiedAnalytics } from '../../hooks/useSimplifiedAnalytics';

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
    green: 'text-green-600 bg-green-50 border-green-200',
    blue: 'text-blue-600 bg-blue-50 border-blue-200',
    orange: 'text-orange-600 bg-orange-50 border-orange-200',
    red: 'text-red-600 bg-red-50 border-red-200',
    purple: 'text-purple-600 bg-purple-50 border-purple-200'
  };

  return (
    <Card className={`border ${colorClasses[color]}`}>
      <CardContent className="p-6">
        <div className="flex items-center justify-between">
          <div className="flex-1">
            <div className="flex items-center gap-2 mb-2">
              <Icon className="h-4 w-4" />
              <p className="text-sm font-medium text-muted-foreground">{title}</p>
            </div>
            <div className="flex items-baseline gap-1">
              <span className="text-2xl font-bold">{value}</span>
              {unit && <span className="text-sm text-muted-foreground">{unit}</span>}
            </div>
            {trend && (
              <div className="flex items-center gap-1 mt-1">
                <TrendingUp className={`h-3 w-3 ${trend.type === 'increase' ? 'text-green-500' : 'text-red-500'}`} />
                <span className={`text-xs ${trend.type === 'increase' ? 'text-green-600' : 'text-red-600'}`}>
                  {trend.value}%
                </span>
              </div>
            )}
          </div>
          {progress !== undefined && (
            <div className="w-16">
              <Progress value={progress} className="h-2" />
              <span className="text-xs text-muted-foreground mt-1 block text-center">
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
  <Card className="border border-gray-200">
    <CardHeader className="pb-3">
      <CardTitle className="flex items-center gap-2 text-lg">
        <Icon className="h-5 w-5 text-gray-600" />
        {title}
      </CardTitle>
    </CardHeader>
    <CardContent>
      {children}
    </CardContent>
  </Card>
);

export const SimplifiedAnalyticsDashboard: React.FC = () => {
  const { data, isLoading, error } = useSimplifiedAnalytics();

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

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Analytics Dashboard</h1>
          <p className="text-gray-600 mt-1">Real-time insights and performance metrics</p>
        </div>
        <Badge variant="outline" className="bg-green-50 text-green-700 border-green-200">
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
          value={`${summary.storageUsedGB.toFixed(1)}GB`}
          icon={HardDrive}
          color={summary.storageUsagePercentage > 80 ? 'red' : summary.storageUsagePercentage > 60 ? 'orange' : 'green'}
          progress={summary.storageUsagePercentage}
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
          <div className="h-80 flex items-center justify-center bg-gray-50 rounded-lg">
            <div className="text-center">
              <BarChart3 className="h-12 w-12 text-gray-400 mx-auto mb-2" />
              <p className="text-gray-600">User activity chart would be rendered here</p>
              <p className="text-sm text-gray-500 mt-1">
                {userActivity.length} data points available
              </p>
            </div>
          </div>
        </ChartCard>

        <ChartCard title="Database Activity" icon={Database}>
          <div className="h-80 flex items-center justify-center bg-gray-50 rounded-lg">
            <div className="text-center">
              <PieChart className="h-12 w-12 text-gray-400 mx-auto mb-2" />
              <p className="text-gray-600">Database activity chart would be rendered here</p>
              <p className="text-sm text-gray-500 mt-1">
                {databaseActivity.length} databases tracked
              </p>
            </div>
          </div>
        </ChartCard>

        <ChartCard title="System Performance" icon={TrendingUp}>
          <div className="h-80 flex items-center justify-center bg-gray-50 rounded-lg">
            <div className="text-center">
              <Activity className="h-12 w-12 text-gray-400 mx-auto mb-2" />
              <p className="text-gray-600">Performance metrics chart would be rendered here</p>
              <p className="text-sm text-gray-500 mt-1">
                Avg response: {systemPerformance.avgResponseTime}ms
              </p>
            </div>
          </div>
        </ChartCard>

        <ChartCard title="Resource Usage" icon={HardDrive}>
          <div className="h-80 flex items-center justify-center bg-gray-50 rounded-lg">
            <div className="text-center">
              <Server className="h-12 w-12 text-gray-400 mx-auto mb-2" />
              <p className="text-gray-600">Resource usage chart would be rendered here</p>
              <p className="text-sm text-gray-500 mt-1">
                Storage: {summary.storageUsagePercentage}% used
              </p>
            </div>
          </div>
        </ChartCard>
      </div>

      {/* Additional Info */}
      <Card className="border-gray-200">
        <CardContent className="p-6">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="text-center">
              <div className="text-2xl font-bold text-gray-900">{summary.totalRows.toLocaleString()}</div>
              <div className="text-sm text-gray-600">Total Rows</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-gray-900">{summary.totalCells.toLocaleString()}</div>
              <div className="text-sm text-gray-600">Total Cells</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-gray-900">{summary.lastUpdated}</div>
              <div className="text-sm text-gray-600">Last Updated</div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};
