/** @format */

import React, { useMemo } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { useLanguage } from "@/contexts/LanguageContext";
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
	const { t } = useLanguage();

	// Memoize status calculations to prevent unnecessary re-computations
	const statusConfig = useMemo(() => {
		const getStatusColor = (status: string) => {
			switch (status) {
				case "active":
					return "bg-green-500/20 text-green-400 border-green-500/30";
				case "canceled":
					return "bg-red-500/20 text-red-400 border-green-500/30";
				case "past_due":
					return "bg-yellow-500/20 text-yellow-400 border-yellow-500/30";
				default:
					return "bg-gray-500/20 text-gray-400 border-gray-500/30";
			}
		};

		const getStatusText = (status: string) => {
			switch (status) {
				case "active":
					return t("dashboard.stats.status.active");
				case "canceled":
					return t("dashboard.stats.status.canceled");
				case "past_due":
					return t("dashboard.stats.status.pastDue");
				default:
					return t("dashboard.stats.status.noSubscription");
			}
		};

		return {
			color: getStatusColor(stats.subscriptionStatus),
			text: getStatusText(stats.subscriptionStatus),
		};
	}, [stats.subscriptionStatus, t]);

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
			<Card className='dashboard-card professional-card premium-hover'>
				<CardHeader className='flex flex-row items-center justify-between space-y-0 pb-2 premium-padding-md'>
					<CardTitle className='text-sm font-medium'>
						{t("dashboard.stats.totalDatabases")}
					</CardTitle>
					<Database className='h-4 w-4 text-muted-foreground' />
				</CardHeader>
				<CardContent className='premium-padding-md pt-0'>
					<div className='text-2xl font-bold'>{stats.totalDatabases}</div>
					<p className='text-xs text-muted-foreground'>
						{t("dashboard.stats.totalDatabasesDesc")}
					</p>
				</CardContent>
			</Card>

			{/* Total Tables */}
			<Card className='dashboard-card professional-card premium-hover'>
				<CardHeader className='flex flex-row items-center justify-between space-y-0 pb-2 premium-padding-md'>
					<CardTitle className='text-sm font-medium'>
						{t("dashboard.stats.totalTables")}
					</CardTitle>
					<Table className='h-4 w-4 text-muted-foreground' />
				</CardHeader>
				<CardContent className='premium-padding-md pt-0'>
					<div className='text-2xl font-bold'>{stats.totalTables}</div>
					<p className='text-xs text-muted-foreground'>
						{t("dashboard.stats.totalTablesDesc")}
					</p>
				</CardContent>
			</Card>

			{/* Total Users */}
			<Card className='dashboard-card professional-card premium-hover'>
				<CardHeader className='flex flex-row items-center justify-between space-y-0 pb-2 premium-padding-md'>
					<CardTitle className='text-sm font-medium'>
						{t("dashboard.stats.totalUsers")}
					</CardTitle>
					<Users className='h-4 w-4 text-muted-foreground' />
				</CardHeader>
				<CardContent className='premium-padding-md pt-0'>
					<div className='text-2xl font-bold'>{stats.totalUsers}</div>
					<p className='text-xs text-muted-foreground'>
						{stats.activeUsers} {t("dashboard.stats.activeUsers")}
					</p>
				</CardContent>
			</Card>

			{/* Memory Usage */}
			<Card
				className={`dashboard-card professional-card premium-hover ${memoryCardBorderClass}`}>
				<CardHeader className='flex flex-row items-center justify-between space-y-0 pb-2 premium-padding-md'>
					<CardTitle className='text-sm font-medium'>
						{t("dashboard.stats.storageUsage")}
					</CardTitle>
					{stats.isOverMemoryLimit ? (
						<AlertTriangle className='h-4 w-4 text-red-500' />
					) : stats.isNearMemoryLimit ? (
						<AlertTriangle className='h-4 w-4 text-yellow-500' />
					) : (
						<HardDrive className='h-4 w-4 text-muted-foreground' />
					)}
				</CardHeader>
				<CardContent className='premium-padding-md pt-0'>
					<div className='text-2xl font-bold'>{memoryDisplay.used}</div>
					<p className='text-xs text-muted-foreground'>
						{memoryDisplay.percentage}% of {memoryDisplay.limit} limit
					</p>
					{stats.isOverMemoryLimit && (
						<p className='text-xs text-red-500 mt-1 font-medium'>
							{t("dashboard.stats.storageLimitExceeded")}
						</p>
					)}
					{stats.isNearMemoryLimit && !stats.isOverMemoryLimit && (
						<p className='text-xs text-yellow-500 mt-1 font-medium'>
							{t("dashboard.stats.approachingLimit")}
						</p>
					)}
				</CardContent>
			</Card>

			{/* Total Rows */}
			<Card className='dashboard-card professional-card premium-hover'>
				<CardHeader className='flex flex-row items-center justify-between space-y-0 pb-2 premium-padding-md'>
					<CardTitle className='text-sm font-medium'>
						{t("dashboard.stats.totalDataRows")}
					</CardTitle>
					<BarChart3 className='h-4 w-4 text-muted-foreground' />
				</CardHeader>
				<CardContent className='premium-padding-md pt-0'>
					<div className='text-2xl font-bold'>
						{stats.totalRows.toLocaleString()}
					</div>
					<p className='text-xs text-muted-foreground'>
						{t("dashboard.stats.totalDataRowsDesc")}
					</p>
				</CardContent>
			</Card>

			{/* Subscription Status */}
			<Card className='dashboard-card professional-card premium-hover'>
				<CardHeader className='flex flex-row items-center justify-between space-y-0 pb-2 premium-padding-md'>
					<CardTitle className='text-sm font-medium'>
						{t("dashboard.stats.subscription")}
					</CardTitle>
					<Activity className='h-4 w-4 text-muted-foreground' />
				</CardHeader>
				<CardContent className='premium-padding-md pt-0'>
					<div className='flex items-center space-x-2'>
						<Badge className={`${statusConfig.color} premium-hover-subtle`}>
							{statusConfig.text}
						</Badge>
					</div>
					<p className='text-xs text-muted-foreground mt-2'>
						{stats.planName} {t("dashboard.stats.plan")}
					</p>
				</CardContent>
			</Card>
		</>
	);
};

export default React.memo(DashboardStats);
