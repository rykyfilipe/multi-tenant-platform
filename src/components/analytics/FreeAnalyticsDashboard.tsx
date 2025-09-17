/** @format */

"use client";

import React from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { 
	BarChart3, 
	Database, 
	Users, 
	FileText, 
	TrendingUp,
	Calendar,
	Activity
} from "lucide-react";
import { useApp } from "@/contexts/AppContext";
import { useDashboardData } from "@/hooks/useDashboardData";
import { formatFileSize, formatNumber } from "@/lib/utils";
import { RealSizeInfo } from "./RealSizeInfo";

/**
 * Basic Analytics Dashboard for Free Plan Users
 * Shows essential metrics without advanced features
 */
export function FreeAnalyticsDashboard() {
	const { tenant, user } = useApp();
	const { 
		data,
		loading 
	} = useDashboardData();

	if(!data) {
		return (
			<div className="space-y-6">
				<div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
					no data
				</div>
			</div>
		);
	}

	if (loading) {
		return (
			<div className="space-y-6">
				<div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
					{[...Array(4)].map((_, i) => (
						<Card key={i} className="animate-pulse">
							<CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
								<div className="h-4 bg-muted rounded w-20"></div>
								<div className="h-4 w-4 bg-muted rounded"></div>
							</CardHeader>
							<CardContent>
								<div className="h-8 bg-muted rounded w-16 mb-2"></div>
								<div className="h-3 bg-muted rounded w-24"></div>
							</CardContent>
						</Card>
					))}
				</div>
			</div>
		);
	}

	const stats = [
		{
			title: "Total Databases",
			value: data?.stats?.totalDatabases || 0,
			description: "of 1 allowed",
			icon: Database,
			color: "text-blue-600",
		},
		{
			title: "Total Tables",
			value: data?.stats?.totalTables || 0,
			description: "of 5 allowed",
			icon: FileText,
			color: "text-green-600",
		},
		{
			title: "Team Members",
			value: data?.stats?.totalUsers || 1,
			description: "of 3 allowed",
			icon: Users,
			color: "text-purple-600",
		},
		{
			title: "Storage Used",
			value: formatFileSize((data?.stats?.memoryUsedMB || 0) * 1024 * 1024),
			description: "of 100 MB allowed",
			icon: TrendingUp,
			color: "text-orange-600",
		},
	];

	const recentActivity = [
		{
			action: "Database created",
			timestamp: "2 hours ago",
			user: user ? `${user.firstName} ${user.lastName}` : "You",
		},
		{
			action: "Table updated",
			timestamp: "1 day ago", 
			user: user ? `${user.firstName} ${user.lastName}` : "You",
		},
		{
			action: "Data imported",
			timestamp: "3 days ago",
			user: user ? `${user.firstName} ${user.lastName}` : "You",
		},
	];

	return (
		<div className="space-y-6">
			{/* Free Plan Badge */}
			<div className="flex items-center justify-between">
				<div>
					<h1 className="text-3xl font-bold tracking-tight">Analytics</h1>
					<p className="text-muted-foreground">
						Basic analytics for your workspace
					</p>
				</div>
				<Badge variant="secondary" className="bg-blue-50 text-blue-700 dark:bg-blue-900 dark:text-blue-300">
					Free Plan
				</Badge>
			</div>

			{/* Key Metrics */}
			<div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
				{stats.map((stat, index) => (
					<Card key={index}>
						<CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
							<CardTitle className="text-sm font-medium">
								{stat.title}
							</CardTitle>
							<stat.icon className={`h-4 w-4 ${stat.color}`} />
						</CardHeader>
						<CardContent>
							<div className="text-2xl font-bold">{stat.value}</div>
							<p className="text-xs text-muted-foreground">
								{stat.description}
							</p>
						</CardContent>
					</Card>
				))}
			</div>

			{/* Storage Usage */}
			<Card>
				<CardHeader>
					<CardTitle className="flex items-center gap-2">
						<BarChart3 className="h-5 w-5" />
						Storage Usage
					</CardTitle>
					<CardDescription>
						Monitor your storage consumption
					</CardDescription>
				</CardHeader>
				<CardContent>
					<div className="space-y-4">
						<div className="flex items-center justify-between">
							<span className="text-sm">Used</span>
							<span className="font-medium">
								{formatFileSize((data?.stats?.memoryUsedMB || 0) * 1024 * 1024)}
							</span>
						</div>
						<div className="w-full bg-muted rounded-full h-2">
							<div 
								className="bg-primary h-2 rounded-full transition-all duration-300"
								style={{ 
									width: `${Math.min(((data?.stats?.memoryUsedMB || 0) / 100) * 100, 100)}%` 
								}}
							/>
						</div>
						<div className="flex items-center justify-between text-sm text-muted-foreground">
							<span>0 MB</span>
							<span>100 MB</span>
						</div>
					</div>
				</CardContent>
			</Card>

			{/* Recent Activity */}
			<Card>
				<CardHeader>
					<CardTitle className="flex items-center gap-2">
						<Activity className="h-5 w-5" />
						Recent Activity
					</CardTitle>
					<CardDescription>
						Latest actions in your workspace
					</CardDescription>
				</CardHeader>
				<CardContent>
					<div className="space-y-4">
						{recentActivity.map((activity, index) => (
							<div key={index} className="flex items-center justify-between">
								<div className="flex items-center gap-3">
									<div className="w-2 h-2 bg-primary rounded-full" />
									<div>
										<p className="text-sm font-medium">{activity.action}</p>
										<p className="text-xs text-muted-foreground">by {activity.user}</p>
									</div>
								</div>
								<span className="text-xs text-muted-foreground">{activity.timestamp}</span>
							</div>
						))}
					</div>
				</CardContent>
			</Card>

			{/* Real Size Information */}
			{data?.databaseData?.databases && (
				<RealSizeInfo
					databases={data.databaseData.databases.map((db: any) => ({
						name: db.name,
						realSizeMB: db.realSizeBytes ? db.realSizeBytes / (1024 * 1024) : 0,
						realSizeKB: db.realSizeKB || 0,
						realSizeFormatted: db.realSizeFormatted || db.size,
						tables: db.tables,
						rows: db.rows,
						cells: db.rows * 5 // Estimate cells per row
					}))}
					totalMemoryUsed={data?.stats?.memoryUsedMB || 0}
					totalRows={data?.stats?.totalRows || 0}
					totalTables={data?.stats?.totalTables || 0}
					loading={loading}
				/>
			)}

			{/* Upgrade Prompt */}
			<Card className="border-blue-200 bg-blue-50/50 dark:border-blue-800 dark:bg-blue-900/20">
				<CardHeader>
					<CardTitle className="text-blue-700 dark:text-blue-300">
						Unlock Advanced Analytics
					</CardTitle>
					<CardDescription className="text-blue-600 dark:text-blue-400">
						Upgrade to Pro for detailed insights, custom reports, and data export
					</CardDescription>
				</CardHeader>
				<CardContent>
					<ul className="space-y-2 text-sm text-blue-600 dark:text-blue-400 mb-4">
						<li>• Real-time charts and graphs</li>
						<li>• Custom date ranges</li>
						<li>• Data export to CSV/Excel</li>
						<li>• Usage trends and predictions</li>
					</ul>
					<button className="w-full bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-md text-sm font-medium transition-colors">
						Upgrade to Pro
					</button>
				</CardContent>
			</Card>
		</div>
	);
}
