/** @format */

import React, { useMemo } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { useAutoPerformanceTracking } from "@/hooks/usePerformanceTracking";
import {
	Database,
	Table,
	Users,
	BarChart3,
	TrendingUp,
	TrendingDown,
	Activity,
	HardDrive,
	AlertTriangle,
} from "lucide-react";

interface DashboardStatsProps {
	stats: {
		totalDatabases: number;
		totalTables: number;
		totalUsers: number;
		totalRows: number;
		activeUsers: number;
		subscriptionStatus: string;
		planName: string;
		memoryUsedMB: number;
		memoryLimitMB: number;
		memoryPercentage: number;
		isNearMemoryLimit: boolean;
		isOverMemoryLimit: boolean;
	};
}

const DashboardStats: React.FC<DashboardStatsProps> = ({ stats }) => {
	// Add automatic performance tracking
	useAutoPerformanceTracking("DashboardStats");

	// Memoize status calculations to prevent unnecessary re-computations
	const statusConfig = useMemo(() => {
		const getStatusColor = (status: string) => {
			switch (status) {
				case "active":
					return "bg-green-500/20 text-green-400 border-green-500/30";
				case "canceled":
					return "bg-red-500/20 text-red-400 border-red-500/30";
				case "past_due":
					return "bg-yellow-500/20 text-yellow-400 border-yellow-500/30";
				default:
					return "bg-gray-500/20 text-gray-400 border-gray-500/30";
			}
		};

		const getStatusText = (status: string) => {
			switch (status) {
				case "active":
					return "Active";
				case "canceled":
					return "Canceled";
				case "past_due":
					return "Past Due";
				default:
					return "No Subscription";
			}
		};

		return {
			color: getStatusColor(stats.subscriptionStatus),
			text: getStatusText(stats.subscriptionStatus),
		};
	}, [stats.subscriptionStatus]);

	// Memoize memory display values
	const memoryDisplay = useMemo(() => {
		const formatMemory = (mb: number) => {
			if (mb < 1) {
				return `${(mb * 1024).toFixed(1)} KB`;
			} else if (mb < 1024) {
				return `${mb.toFixed(1)} MB`;
			} else {
				return `${(mb / 1024).toFixed(2)} GB`;
			}
		};

		return {
			used: formatMemory(stats.memoryUsedMB || 0),
			limit: formatMemory(stats.memoryLimitMB || 0),
			percentage: (stats.memoryPercentage || 0).toFixed(1),
		};
	}, [stats.memoryUsedMB, stats.memoryLimitMB, stats.memoryPercentage]);

	// Memoize card border classes
	const memoryCardBorderClass = useMemo(() => {
		if (stats.isOverMemoryLimit) {
			return "border-red-500/50";
		} else if (stats.isNearMemoryLimit) {
			return "border-yellow-500/50";
		}
		return "";
	}, [stats.isOverMemoryLimit, stats.isNearMemoryLimit]);

	return (
		<>
			{/* Total Databases */}
			<Card className='dashboard-card'>
				<CardHeader className='flex flex-row items-center justify-between space-y-0 pb-2 px-4 sm:px-6'>
					<CardTitle className='text-sm font-medium'>Total Databases</CardTitle>
					<Database className='h-4 w-4 text-muted-foreground' />
				</CardHeader>
				<CardContent className='px-4 sm:px-6'>
					<div className='text-2xl font-bold'>{stats.totalDatabases}</div>
					<p className='text-xs text-muted-foreground'>
						Active database instances
					</p>
				</CardContent>
			</Card>

			{/* Total Tables */}
			<Card className='dashboard-card'>
				<CardHeader className='flex flex-row items-center justify-between space-y-0 pb-2 px-4 sm:px-6'>
					<CardTitle className='text-sm font-medium'>Total Tables</CardTitle>
					<Table className='h-4 w-4 text-muted-foreground' />
				</CardHeader>
				<CardContent className='px-4 sm:px-6'>
					<div className='text-2xl font-bold'>{stats.totalTables}</div>
					<p className='text-xs text-muted-foreground'>Data tables created</p>
				</CardContent>
			</Card>

			{/* Total Users */}
			<Card className='dashboard-card'>
				<CardHeader className='flex flex-row items-center justify-between space-y-0 pb-2 px-4 sm:px-6'>
					<CardTitle className='text-sm font-medium'>Total Users</CardTitle>
					<Users className='h-4 w-4 text-muted-foreground' />
				</CardHeader>
				<CardContent className='px-4 sm:px-6'>
					<div className='text-2xl font-bold'>{stats.totalUsers}</div>
					<p className='text-xs text-muted-foreground'>
						{stats.activeUsers} active users
					</p>
				</CardContent>
			</Card>

			{/* Memory Usage */}
			<Card className={`dashboard-card ${memoryCardBorderClass}`}>
				<CardHeader className='flex flex-row items-center justify-between space-y-0 pb-2 px-4 sm:px-6'>
					<CardTitle className='text-sm font-medium'>Storage Usage</CardTitle>
					{stats.isOverMemoryLimit ? (
						<AlertTriangle className='h-4 w-4 text-red-500' />
					) : stats.isNearMemoryLimit ? (
						<AlertTriangle className='h-4 w-4 text-yellow-500' />
					) : (
						<HardDrive className='h-4 w-4 text-muted-foreground' />
					)}
				</CardHeader>
				<CardContent className='px-4 sm:px-6'>
					<div className='text-2xl font-bold'>{memoryDisplay.used}</div>
					<p className='text-xs text-muted-foreground'>
						{memoryDisplay.percentage}% of {memoryDisplay.limit} limit
					</p>
					{stats.isOverMemoryLimit && (
						<p className='text-xs text-red-500 mt-1 font-medium'>
							⚠️ Storage limit exceeded
						</p>
					)}
					{stats.isNearMemoryLimit && !stats.isOverMemoryLimit && (
						<p className='text-xs text-yellow-500 mt-1 font-medium'>
							⚠️ Approaching limit
						</p>
					)}
				</CardContent>
			</Card>

			{/* Total Rows */}
			<Card className='dashboard-card'>
				<CardHeader className='flex flex-row items-center justify-between space-y-0 pb-2 px-4 sm:px-6'>
					<CardTitle className='text-sm font-medium'>Total Data Rows</CardTitle>
					<BarChart3 className='h-4 w-4 text-muted-foreground' />
				</CardHeader>
				<CardContent className='px-4 sm:px-6'>
					<div className='text-2xl font-bold'>
						{stats.totalRows.toLocaleString()}
					</div>
					<p className='text-xs text-muted-foreground'>
						Records across all tables
					</p>
				</CardContent>
			</Card>

			{/* Subscription Status */}
			<Card className='dashboard-card'>
				<CardHeader className='flex flex-row items-center justify-between space-y-0 pb-2 px-4 sm:px-6'>
					<CardTitle className='text-sm font-medium'>Subscription</CardTitle>
					<Activity className='h-4 w-4 text-muted-foreground' />
				</CardHeader>
				<CardContent className='px-4 sm:px-6'>
					<div className='flex items-center space-x-2'>
						<Badge className={statusConfig.color}>{statusConfig.text}</Badge>
					</div>
					<p className='text-xs text-muted-foreground mt-2'>
						{stats.planName} Plan
					</p>
				</CardContent>
			</Card>
		</>
	);
};

export default React.memo(DashboardStats);
