'use client';

import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { 
  Database, 
  Users, 
  Server, 
  HardDrive, 
  Activity, 
  TrendingUp,
  TrendingDown,
  Clock,
  Target,
  BarChart3,
  RefreshCw,
  Download,
  AlertCircle,
  Sparkles,
  Zap,
  CheckCircle2
} from 'lucide-react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, AreaChart, Area, PieChart as RechartsPieChart, Pie, Cell, BarChart, Bar } from 'recharts';
import { usePlanLimits } from '@/hooks/usePlanLimits';

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

interface MetricCardProps {
  title: string;
  value: number | string;
  unit?: string;
  icon: React.ComponentType<{ className?: string }>;
  progress?: number;
  variant?: 'default' | 'primary' | 'success' | 'warning' | 'danger';
  trend?: {
    value: number;
    type: 'increase' | 'decrease';
  };
  size?: 'default' | 'large';
  className?: string;
}

const MetricCard: React.FC<MetricCardProps> = ({ 
  title, 
  value, 
  unit = '', 
  icon: Icon, 
  progress, 
  variant = 'default',
  trend,
  size = 'default',
  className = ''
}) => {
  const variantStyles = {
    default: 'bg-card border-border hover:border-border',
    primary: 'bg-card border-primary/20 hover:border-primary/30',
    success: 'bg-card border-green-500/20 hover:border-green-500/30',
    warning: 'bg-card border-amber-500/20 hover:border-amber-500/30',
    danger: 'bg-card border-destructive/20 hover:border-destructive/30'
  };

  const iconBgStyles = {
    default: 'bg-muted',
    primary: 'bg-primary/10',
    success: 'bg-green-500/10',
    warning: 'bg-amber-500/10',
    danger: 'bg-destructive/10'
  };

  const iconColorStyles = {
    default: 'text-muted-foreground',
    primary: 'text-primary',
    success: 'text-green-600 dark:text-green-400',
    warning: 'text-amber-600 dark:text-amber-400',
    danger: 'text-destructive'
  };

  const trendColor = trend?.type === 'increase' ? 'text-green-600 dark:text-green-400' : 'text-red-600 dark:text-red-400';

  return (
    <Card className={`${variantStyles[variant]} border-2 shadow-sm hover:shadow-md transition-all duration-300 ${className}`}>
      <CardContent className={size === 'large' ? 'p-6' : 'p-5'}>
        <div className="flex items-start justify-between gap-3">
          <div className="flex-1 min-w-0">
            {/* Icon and Title */}
            <div className="flex items-center gap-3 mb-4">
              <div className={`p-2.5 rounded-xl ${iconBgStyles[variant]} ${iconColorStyles[variant]}`}>
                <Icon className={size === 'large' ? 'h-6 w-6' : 'h-5 w-5'} />
              </div>
              <p className="text-xs font-bold uppercase tracking-wider text-muted-foreground">{title}</p>
            </div>

            {/* Value */}
            <div className="flex items-baseline gap-2 mb-3">
              <span className={`${size === 'large' ? 'text-3xl' : 'text-2xl'} font-bold text-foreground tabular-nums`}>
                {value}
              </span>
              {unit && <span className="text-sm font-medium text-muted-foreground">{unit}</span>}
            </div>

            {/* Trend */}
            {trend && (
              <div className="flex items-center gap-1.5">
                {trend.type === 'increase' ? (
                  <TrendingUp className={`h-3.5 w-3.5 ${trendColor}`} />
                ) : (
                  <TrendingDown className={`h-3.5 w-3.5 ${trendColor}`} />
                )}
                <span className={`text-xs font-semibold ${trendColor} tabular-nums`}>
                  {Math.abs(trend.value)}%
                </span>
                <span className="text-xs text-muted-foreground">vs last period</span>
              </div>
            )}
          </div>

          {/* Progress Circle */}
          {progress !== undefined && (
            <div className="flex flex-col items-center gap-1 flex-shrink-0">
              <div className="relative w-14 h-14">
                <svg className="w-14 h-14 transform -rotate-90">
                  <circle
                    cx="28"
                    cy="28"
                    r="24"
                    stroke="currentColor"
                    strokeWidth="3"
                    fill="none"
                    className="text-muted/20"
                  />
                  <circle
                    cx="28"
                    cy="28"
                    r="24"
                    stroke="currentColor"
                    strokeWidth="3"
                    fill="none"
                    strokeDasharray={`${2 * Math.PI * 24}`}
                    strokeDashoffset={`${2 * Math.PI * 24 * (1 - progress / 100)}`}
                    className={
                      variant === 'danger' ? 'text-destructive' : 
                      variant === 'warning' ? 'text-amber-500' : 
                      variant === 'success' ? 'text-green-500' :
                      'text-primary'
                    }
                    strokeLinecap="round"
                  />
                </svg>
                <div className="absolute inset-0 flex items-center justify-center">
                  <span className="text-xs font-bold text-foreground tabular-nums">{Math.round(progress)}%</span>
                </div>
              </div>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
};

interface ChartCardProps {
  title: string;
  subtitle?: string;
  icon: React.ComponentType<{ className?: string }>;
  children: React.ReactNode;
  action?: React.ReactNode;
}

const ChartCard: React.FC<ChartCardProps> = ({ title, subtitle, icon: Icon, children, action }) => (
  <Card className="bg-card border-border shadow-sm hover:shadow-md transition-shadow duration-300">
    <CardHeader className='border-b border-border/50 pb-4'>
      <div className="flex items-center justify-between gap-4">
        <div className="flex items-center gap-3 flex-1 min-w-0">
          <div className="p-2 rounded-xl bg-primary/10 flex-shrink-0">
            <Icon className="h-5 w-5 text-primary" />
          </div>
          <div className="min-w-0">
            <CardTitle className="text-base font-bold text-foreground truncate">{title}</CardTitle>
            {subtitle && <p className="text-xs text-muted-foreground mt-0.5 truncate">{subtitle}</p>}
          </div>
        </div>
        {action}
      </div>
    </CardHeader>
    <CardContent className="p-6">
      {children}
    </CardContent>
  </Card>
);

const LoadingSkeleton = () => (
  <div className="min-h-screen bg-gradient-to-br from-background via-background to-muted/20 p-4 md:p-6">
    <div className="max-w-[1600px] mx-auto space-y-6">
      <div className="flex items-center justify-between">
        <div className="space-y-2">
          <Skeleton className="h-9 w-72" />
          <Skeleton className="h-4 w-96" />
        </div>
        <Skeleton className="h-10 w-32" />
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {Array.from({ length: 8 }).map((_, i) => (
          <Skeleton key={i} className="h-36 rounded-xl" />
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {Array.from({ length: 4 }).map((_, i) => (
          <Skeleton key={i} className="h-96 rounded-xl" />
        ))}
      </div>
    </div>
  </div>
);

export const SimplifiedAnalyticsDashboard: React.FC = () => {
  const [data, setData] = useState<SimplifiedAnalyticsData | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [error, setError] = useState<Error | null>(null);
  const [timePeriod, setTimePeriod] = useState<'7d' | '30d' | '90d'>('30d');
  const { getUsagePercentage } = usePlanLimits();

  const fetchAnalytics = async (showRefreshing = false) => {
    try {
      if (showRefreshing) setIsRefreshing(true);
      else setIsLoading(true);
      
      setError(null);
      
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
      setIsRefreshing(false);
    }
  };

  useEffect(() => {
    fetchAnalytics();
    const interval = setInterval(() => fetchAnalytics(true), 60000);
    return () => clearInterval(interval);
  }, []);

  const handleRefresh = () => {
    fetchAnalytics(true);
  };

  if (isLoading) {
    return <LoadingSkeleton />;
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-background via-background to-muted/20 p-4 md:p-6">
        <div className="max-w-[1600px] mx-auto">
          <Card className="border-destructive/20 bg-destructive/5">
            <CardContent className="p-12 text-center">
              <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-destructive/10 mb-6">
                <AlertCircle className="h-8 w-8 text-destructive" />
              </div>
              <h3 className="text-xl font-bold text-foreground mb-2">Failed to Load Analytics</h3>
              <p className="text-muted-foreground mb-6">{error?.message || 'An unexpected error occurred'}</p>
              <Button onClick={handleRefresh} variant="outline" size="lg" className="gap-2">
                <RefreshCw className="h-4 w-4" />
                Try Again
              </Button>
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  if (!data) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-background via-background to-muted/20 p-4 md:p-6">
        <div className="max-w-[1600px] mx-auto">
          <Card>
            <CardContent className="p-12 text-center">
              <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-muted mb-6">
                <BarChart3 className="h-8 w-8 text-muted-foreground" />
              </div>
              <h3 className="text-xl font-bold text-foreground mb-2">No Analytics Data</h3>
              <p className="text-muted-foreground">Analytics data is not available at the moment.</p>
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  const { summary, userActivity, databaseActivity, systemPerformance } = data;
  const correctStorageUsagePercentage = getUsagePercentage('storage');

  // Calculate insights
  const insights = [
    {
      icon: Sparkles,
      label: summary.userGrowth >= 0 ? 'Growing User Base' : 'User Base Declining',
      value: `${Math.abs(summary.userGrowth)}% ${summary.userGrowth >= 0 ? 'growth' : 'decline'}`,
      variant: summary.userGrowth >= 0 ? 'success' : 'warning' as const
    },
    {
      icon: Zap,
      label: systemPerformance.healthScore >= 80 ? 'Excellent Health' : 'Needs Attention',
      value: `${systemPerformance.healthScore}/100`,
      variant: systemPerformance.healthScore >= 80 ? 'success' : 'warning' as const
    },
    {
      icon: CheckCircle2,
      label: 'System Uptime',
      value: `${systemPerformance.uptime.toFixed(2)}%`,
      variant: systemPerformance.uptime >= 99.5 ? 'success' : 'warning' as const
    },
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-background to-muted/20">
      <div className="max-w-[1600px] mx-auto p-4 md:p-6 space-y-6">
        {/* Header */}
        <div className="flex flex-col gap-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div>
              <h1 className="text-2xl md:text-3xl font-bold text-foreground tracking-tight">Analytics Dashboard</h1>
              <p className="text-sm text-muted-foreground mt-1">Real-time insights and performance metrics for your platform</p>
            </div>
            <div className="flex items-center gap-2 flex-wrap">
              <Badge variant="outline" className="bg-green-500/10 text-green-700 dark:text-green-400 border-green-500/20 font-semibold">
                <div className="w-2 h-2 rounded-full bg-green-500 mr-2 animate-pulse" />
                Live Data
              </Badge>
              <Button
                variant="outline"
                size="sm"
                onClick={handleRefresh}
                disabled={isRefreshing}
                className="gap-2"
              >
                <RefreshCw className={`h-4 w-4 ${isRefreshing ? 'animate-spin' : ''}`} />
                Refresh
              </Button>
              <Button variant="outline" size="sm" className="gap-2">
                <Download className="h-4 w-4" />
                Export
              </Button>
            </div>
          </div>

          {/* Quick Insights */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            {insights.map((insight, index) => (
              <div
                key={index}
                className={`flex items-center gap-3 p-4 rounded-xl border-2 ${
                  insight.variant === 'success'
                    ? 'bg-green-500/5 border-green-500/20'
                    : 'bg-amber-500/5 border-amber-500/20'
                } transition-all hover:shadow-sm`}
              >
                <div className={`p-2 rounded-lg ${
                  insight.variant === 'success' ? 'bg-green-500/10' : 'bg-amber-500/10'
                }`}>
                  <insight.icon className={`h-4 w-4 ${
                    insight.variant === 'success'
                      ? 'text-green-600 dark:text-green-400'
                      : 'text-amber-600 dark:text-amber-400'
                  }`} />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-xs text-muted-foreground truncate">{insight.label}</p>
                  <p className={`text-sm font-bold ${
                    insight.variant === 'success'
                      ? 'text-green-700 dark:text-green-400'
                      : 'text-amber-700 dark:text-amber-400'
                  }`}>{insight.value}</p>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Primary Metrics */}
        <div>
          <h2 className="text-lg font-bold text-foreground mb-4 flex items-center gap-2">
            <div className="w-1 h-5 bg-primary rounded-full" />
            Key Metrics
          </h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <MetricCard
              title="Total Users"
              value={summary.totalUsers}
              icon={Users}
              variant="primary"
              size="large"
              trend={{ value: summary.userGrowth, type: summary.userGrowth >= 0 ? 'increase' : 'decrease' }}
            />
            <MetricCard
              title="Active Users"
              value={summary.activeUsers}
              icon={Activity}
              variant="success"
              size="large"
              progress={summary.activeUserPercentage}
            />
            <MetricCard
              title="Databases"
              value={summary.totalDatabases}
              icon={Database}
              variant="primary"
              size="large"
              trend={{ value: summary.databaseGrowth, type: summary.databaseGrowth >= 0 ? 'increase' : 'decrease' }}
            />
            <MetricCard
              title="Tables"
              value={summary.totalTables}
              icon={Server}
              variant="default"
              size="large"
              trend={{ value: summary.tableGrowth, type: summary.tableGrowth >= 0 ? 'increase' : 'decrease' }}
            />
          </div>
        </div>

        {/* System Health */}
        <div>
          <h2 className="text-lg font-bold text-foreground mb-4 flex items-center gap-2">
            <div className="w-1 h-5 bg-green-500 rounded-full" />
            System Health
          </h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <MetricCard
              title="Storage Usage"
              value={`${summary.storageUsed.toFixed(1)}`}
              unit={summary.storageUnit}
              icon={HardDrive}
              variant={correctStorageUsagePercentage > 80 ? 'danger' : correctStorageUsagePercentage > 60 ? 'warning' : 'success'}
              progress={correctStorageUsagePercentage}
            />
            <MetricCard
              title="Response Time"
              value={systemPerformance.avgResponseTime}
              unit="ms"
              icon={Clock}
              variant={systemPerformance.avgResponseTime < 100 ? 'success' : systemPerformance.avgResponseTime < 200 ? 'warning' : 'danger'}
            />
            <MetricCard
              title="Health Score"
              value={systemPerformance.healthScore}
              unit="/100"
              icon={Target}
              variant={systemPerformance.healthScore >= 80 ? 'success' : systemPerformance.healthScore >= 60 ? 'warning' : 'danger'}
              progress={systemPerformance.healthScore}
            />
            <MetricCard
              title="Uptime"
              value={systemPerformance.uptime.toFixed(2)}
              unit="%"
              icon={Server}
              variant={systemPerformance.uptime >= 99.5 ? 'success' : systemPerformance.uptime >= 99 ? 'warning' : 'danger'}
              progress={systemPerformance.uptime}
            />
          </div>
        </div>

        {/* Charts */}
        <div>
          <h2 className="text-lg font-bold text-foreground mb-4 flex items-center gap-2">
            <div className="w-1 h-5 bg-blue-500 rounded-full" />
            Activity & Performance
          </h2>
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 md:gap-6">
            <ChartCard 
              title="User Activity" 
              subtitle="Active users over time"
              icon={Activity}
            >
              <div className="h-72 md:h-80">
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart data={userActivity} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
                    <defs>
                      <linearGradient id="colorUsers" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="hsl(var(--primary))" stopOpacity={0.3}/>
                        <stop offset="95%" stopColor="hsl(var(--primary))" stopOpacity={0}/>
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" strokeOpacity={0.3} vertical={false} />
                    <XAxis 
                      dataKey="date" 
                      tick={{ fontSize: 11, fill: 'hsl(var(--muted-foreground))' }}
                      tickLine={false}
                      axisLine={{ stroke: 'hsl(var(--border))' }}
                    />
                    <YAxis 
                      tick={{ fontSize: 11, fill: 'hsl(var(--muted-foreground))' }}
                      tickLine={false}
                      axisLine={{ stroke: 'hsl(var(--border))' }}
                    />
                    <Tooltip 
                      contentStyle={{
                        backgroundColor: 'hsl(var(--card))',
                        border: '1px solid hsl(var(--border))',
                        borderRadius: '8px',
                        boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)',
                      }}
                      labelStyle={{ color: 'hsl(var(--foreground))', fontWeight: 600 }}
                    />
                    <Area
                      type="monotone"
                      dataKey="activeUsers"
                      stroke="hsl(var(--primary))"
                      fill="url(#colorUsers)"
                      strokeWidth={2}
                    />
                  </AreaChart>
                </ResponsiveContainer>
              </div>
            </ChartCard>

            <ChartCard 
              title="Database Distribution" 
              subtitle="Data distribution across databases"
              icon={Database}
            >
              <div className="h-72 md:h-80">
                <ResponsiveContainer width="100%" height="100%">
                  <RechartsPieChart>
                    <Pie
                      data={databaseActivity.map(db => ({ name: db.name, value: db.rows }))}
                      cx="50%"
                      cy="50%"
                      labelLine={false}
                      label={(props: any) => {
                        const { name, percent } = props;
                        return `${name} (${(percent * 100).toFixed(0)}%)`;
                      }}
                      outerRadius={100}
                      fill="hsl(var(--primary))"
                      dataKey="value"
                    >
                      {databaseActivity.map((entry, index) => (
                        <Cell 
                          key={`cell-${index}`} 
                          fill={`hsl(var(--primary) / ${1 - (index * 0.15)})`}
                        />
                      ))}
                    </Pie>
                    <Tooltip 
                      contentStyle={{
                        backgroundColor: 'hsl(var(--card))',
                        border: '1px solid hsl(var(--border))',
                        borderRadius: '8px',
                      }}
                    />
                  </RechartsPieChart>
                </ResponsiveContainer>
              </div>
            </ChartCard>

            <ChartCard 
              title="Performance Metrics" 
              subtitle="System performance indicators"
              icon={TrendingUp}
            >
              <div className="h-72 md:h-80">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart 
                    data={[
                      { name: "Response", value: systemPerformance.avgResponseTime, fill: "hsl(var(--primary))" },
                      { name: "Health", value: systemPerformance.healthScore, fill: "hsl(142 76% 36%)" },
                      { name: "Uptime", value: systemPerformance.uptime, fill: "hsl(221 83% 53%)" },
                    ]} 
                    margin={{ top: 10, right: 10, left: 0, bottom: 20 }}
                  >
                    <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" strokeOpacity={0.3} />
                    <XAxis 
                      dataKey="name" 
                      tick={{ fontSize: 11, fill: 'hsl(var(--muted-foreground))' }}
                      tickLine={false}
                      axisLine={{ stroke: 'hsl(var(--border))' }}
                    />
                    <YAxis 
                      tick={{ fontSize: 11, fill: 'hsl(var(--muted-foreground))' }}
                      tickLine={false}
                      axisLine={{ stroke: 'hsl(var(--border))' }}
                    />
                    <Tooltip 
                      contentStyle={{
                        backgroundColor: 'hsl(var(--card))',
                        border: '1px solid hsl(var(--border))',
                        borderRadius: '8px',
                      }}
                    />
                    <Bar
                      dataKey="value"
                      radius={[8, 8, 0, 0]}
                    />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </ChartCard>

            <ChartCard 
              title="Storage Overview" 
              subtitle="Current storage allocation"
              icon={HardDrive}
            >
              <div className="h-72 md:h-80 flex items-center justify-center">
                <div className="text-center space-y-6">
                  <div className="relative inline-flex">
                    <svg className="w-40 h-40">
                      <circle
                        cx="80"
                        cy="80"
                        r="72"
                        stroke="currentColor"
                        strokeWidth="10"
                        fill="none"
                        className="text-muted/20"
                      />
                      <circle
                        cx="80"
                        cy="80"
                        r="72"
                        stroke="currentColor"
                        strokeWidth="10"
                        fill="none"
                        strokeDasharray={`${2 * Math.PI * 72}`}
                        strokeDashoffset={`${2 * Math.PI * 72 * (1 - correctStorageUsagePercentage / 100)}`}
                        className={correctStorageUsagePercentage > 80 ? 'text-destructive' : correctStorageUsagePercentage > 60 ? 'text-amber-500' : 'text-primary'}
                        strokeLinecap="round"
                        transform="rotate(-90 80 80)"
                      />
                    </svg>
                    <div className="absolute inset-0 flex flex-col items-center justify-center">
                      <span className="text-3xl font-bold text-foreground tabular-nums">{Math.round(correctStorageUsagePercentage)}%</span>
                      <span className="text-xs text-muted-foreground mt-1">Used</span>
                    </div>
                  </div>
                  <div className="space-y-2 px-4">
                    <div className="flex items-center justify-between gap-6 text-sm">
                      <span className="text-muted-foreground">Used:</span>
                      <span className="font-bold text-foreground tabular-nums">{summary.storageUsed.toFixed(2)} {summary.storageUnit}</span>
                    </div>
                    <div className="flex items-center justify-between gap-6 text-sm">
                      <span className="text-muted-foreground">Free:</span>
                      <span className="font-bold text-foreground tabular-nums">{(100 - correctStorageUsagePercentage).toFixed(1)}%</span>
                    </div>
                  </div>
                </div>
              </div>
            </ChartCard>
          </div>
        </div>

        {/* Data Overview */}
        <Card className="bg-card border-border shadow-sm">
          <CardHeader className='border-b border-border/50 pb-4'>
            <CardTitle className="text-base font-bold text-foreground">Data Overview</CardTitle>
          </CardHeader>
          <CardContent className="p-6">
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
              <div className="text-center p-5 rounded-xl bg-gradient-to-br from-muted/50 to-muted/30 border border-border">
                <div className="text-3xl font-bold text-foreground mb-2 tabular-nums">{summary.totalRows.toLocaleString()}</div>
                <div className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">Total Rows</div>
              </div>
              <div className="text-center p-5 rounded-xl bg-gradient-to-br from-muted/50 to-muted/30 border border-border">
                <div className="text-3xl font-bold text-foreground mb-2 tabular-nums">{summary.totalCells.toLocaleString()}</div>
                <div className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">Total Cells</div>
              </div>
              <div className="text-center p-5 rounded-xl bg-gradient-to-br from-muted/50 to-muted/30 border border-border">
                <div className="text-3xl font-bold text-foreground mb-2">{summary.lastUpdated}</div>
                <div className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">Last Updated</div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};
