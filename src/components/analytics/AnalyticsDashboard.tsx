/** @format */

"use client";

import React, { useState } from "react";
import { motion } from "framer-motion";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
	Select,
	SelectContent,
	SelectItem,
	SelectTrigger,
	SelectValue,
} from "@/components/ui/select";
import {
	Database,
	Users,
	Server,
	Gauge,
	Calendar,
	Filter,
	RefreshCw,
	Download,
	Settings,
	HardDrive,
	MemoryStick,
	Cpu,
	Network,
	Clock,
	Target,
	DollarSign,
	TrendingUp,
	AlertTriangle,
	BarChart3,
	PieChart,
	Activity,
	Shield,
	FileText,
	CheckCircle,
} from "lucide-react";

import {
	KPICard,
	OverviewChart,
	ResourceUsageChart,
	DistributionChart,
	TrendChart,
	PerformanceChart,
	TopItemsList,
	BusinessMetricsCard,
	RevenueChart,
	ErrorTrackingChart,
	RealDataStatus,
	InvoiceAnalytics,
	PremiumChartDemo,
} from "./index";
import { RealSizeInfo } from "./RealSizeInfo";
import { useProcessedAnalyticsData } from "@/hooks/useProcessedAnalyticsData";

type TimeFilter = "7d" | "30d" | "90d" | "1y";

export const AnalyticsDashboard: React.FC = () => {
	const { data, loading, error, realTimeData, businessData } =
		useProcessedAnalyticsData();
	const [timeFilter, setTimeFilter] = useState<TimeFilter>("30d");
	const [activeTab, setActiveTab] = useState("overview");

	// Debug logging
	console.log('[AnalyticsDashboard] Render state:', {
		loading,
		error,
		hasData: !!data,
		dataKeys: data ? Object.keys(data) : null,
		hasRealTimeData: !!realTimeData,
		hasBusinessData: !!businessData
	});

	if (loading) {
		return (
			<div className='h-full bg-background'>
				<div className='animate-pulse space-y-4 sm:space-y-6 p-3 sm:p-4 md:p-6'>
					{/* Header skeleton */}
					<div className='flex flex-col sm:flex-row sm:justify-between sm:items-center gap-3 sm:gap-4'>
						<div>
							<div className='h-6 sm:h-8 bg-muted rounded w-48 sm:w-64 mb-2'></div>
							<div className='h-3 sm:h-4 bg-muted rounded w-72 sm:w-96'></div>
						</div>
						<div className='flex gap-2 flex-wrap'>
							<div className='h-8 sm:h-10 bg-muted rounded w-24 sm:w-32'></div>
							<div className='h-8 sm:h-10 bg-muted rounded w-16 sm:w-24'></div>
							<div className='h-8 sm:h-10 bg-muted rounded w-16 sm:w-24'></div>
						</div>
					</div>

					{/* KPI Cards skeleton */}
					<div className='grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-3 sm:gap-4'>
						{(Array.from({ length: 6 }) ?? []).map((_, i) => (
							<div key={i} className='h-24 sm:h-32 bg-muted rounded-lg'></div>
						))}
					</div>

					{/* Charts skeleton */}
					<div className='grid grid-cols-1 md:grid-cols-2 gap-4 sm:gap-6'>
						{(Array.from({ length: 4 }) ?? []).map((_, i) => (
							<div
								key={i}
								className='h-64 sm:h-80 md:h-96 bg-muted rounded-lg'></div>
						))}
					</div>
				</div>
			</div>
		);
	}

	if (error) {
		return (
			<div className='h-full bg-background flex items-center justify-center p-4'>
				<div className='text-center max-w-md'>
					<div className='text-red-500 mb-3 sm:mb-4'>
						<Activity className='w-10 h-10 sm:w-12 sm:h-12 mx-auto' />
					</div>
					<h3 className='text-base sm:text-lg font-semibold text-foreground mb-2 sm:mb-3'>
						Error Loading Analytics
					</h3>
					<p className='text-sm sm:text-base text-muted-foreground mb-4 sm:mb-6'>
						{error}
					</p>
					<Button
						onClick={() => window.location.reload()}
						variant='outline'
						className='text-sm sm:text-base'>
						<RefreshCw className='w-3 h-3 sm:w-4 sm:h-4 mr-2' />
						Retry
					</Button>
				</div>
			</div>
		);
	}

	if (!data) {
		return (
			<div className='h-full bg-background flex items-center justify-center p-4'>
				<div className='text-center max-w-md'>
					<div className='text-muted-foreground mb-3 sm:mb-4'>
						<BarChart3 className='w-10 h-10 sm:w-12 sm:h-12 mx-auto' />
					</div>
					<h3 className='text-base sm:text-lg font-semibold text-foreground mb-2 sm:mb-3'>
						No Data Available
					</h3>
					<p className='text-sm sm:text-base text-muted-foreground'>
						Analytics data is not available at the moment.
					</p>
				</div>
			</div>
		);
	}

	const { kpis, distributions, rankings, timeSeriesData, performance, health } =
		data || {};

	const handleExportData = () => {
		const dataStr = JSON.stringify(data, null, 2);
		const dataBlob = new Blob([dataStr], { type: "application/json" });
		const url = URL.createObjectURL(dataBlob);
		const link = document.createElement("a");
		link.href = url;
		link.download = `analytics-export-${
			new Date().toISOString().split("T")[0]
		}.json`;
		link.click();
		URL.revokeObjectURL(url);
	};

	return (
		<motion.div
			initial={{ opacity: 0 }}
			animate={{ opacity: 1 }}
			transition={{ duration: 0.5 }}
			className='h-full bg-background'>
			{/* Header */}
			<div className='border-b border-border bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 sticky top-0 z-50'>
				<div className='flex flex-col sm:flex-row sm:items-center sm:justify-between px-3 sm:px-4 md:px-6 py-3 sm:py-4 gap-3 sm:gap-4'>
					<div data-tour-id="dashboard-stats">
						<h1 className='text-xl sm:text-2xl font-bold text-foreground'>
							Analytics Dashboard
						</h1>
						<p className='text-sm sm:text-base text-muted-foreground'>
							Comprehensive insights and performance metrics for your platform
						</p>
					</div>

					<div className='flex items-center gap-2 sm:gap-3 flex-wrap' data-tour-id="quick-actions">
						<Select
							value={timeFilter}
							onValueChange={(value) => setTimeFilter(value as TimeFilter)}>
							<SelectTrigger className='w-28 sm:w-32'>
								<Calendar className='w-3 h-3 sm:w-4 sm:h-4 mr-1 sm:mr-2' />
								<SelectValue />
							</SelectTrigger>
							<SelectContent>
								<SelectItem value='7d'>Last 7 days</SelectItem>
								<SelectItem value='30d'>Last 30 days</SelectItem>
								<SelectItem value='90d'>Last 90 days</SelectItem>
								<SelectItem value='1y'>Last year</SelectItem>
							</SelectContent>
						</Select>

						<Button
							variant='outline'
							size='sm'
							onClick={handleExportData}
							className='text-xs sm:text-sm'>
							<Download className='w-3 h-3 sm:w-4 sm:h-4 mr-1 sm:mr-2' />
							<span className='hidden sm:inline'>Export</span>
						</Button>

						<Button
							variant='outline'
							size='sm'
							onClick={() => window.location.reload()}
							className='text-xs sm:text-sm'>
							<RefreshCw className='w-3 h-3 sm:w-4 sm:h-4 mr-1 sm:mr-2' />
							<span className='hidden sm:inline'>Refresh</span>
						</Button>
					</div>
				</div>
			</div>

			{/* Main Content */}
			<div className='p-3 sm:p-4 md:p-6 max-w-[1400px] mx-auto space-y-4 sm:space-y-6 md:space-y-8'>
				{/* KPI Cards */}
				<motion.div
					initial={{ opacity: 0, y: 20 }}
					animate={{ opacity: 1, y: 0 }}
					transition={{ duration: 0.6, delay: 0.1 }}>
					<div className='grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-3 sm:gap-4 md:gap-6'>
						<KPICard
							title='Total Databases'
							value={kpis?.totalDatabases || 0}
							icon={Database}
							change={Math.abs(data?.growth?.weeklyDatabaseGrowth || 0)}
							changeType={(data?.growth?.weeklyDatabaseGrowth || 0) >= 0 ? 'increase' : 'decrease'}
							color='blue'
							delay={0}
						/>
						<KPICard
							title='Total Tables'
							value={kpis?.totalTables || 0}
							icon={Server}
							change={Math.abs(data?.growth?.weeklyTableGrowth || 0)}
							changeType={(data?.growth?.weeklyTableGrowth || 0) >= 0 ? 'increase' : 'decrease'}
							color='green'
							delay={0.1}
						/>
						<KPICard
							title='Total Rows'
							value={kpis?.totalRows || 0}
							icon={BarChart3}
							change={Math.abs(data?.growth?.weeklyRowGrowth || 0)}
							changeType={(data?.growth?.weeklyRowGrowth || 0) >= 0 ? 'increase' : 'decrease'}
							color='purple'
							delay={0.2}
						/>
						<KPICard
							title='Active Users'
							value={kpis?.activeUsers || 0}
							icon={Users}
							change={Math.abs(data?.growth?.weeklyUserGrowth || 0)}
							changeType={(data?.growth?.weeklyUserGrowth || 0) >= 0 ? 'increase' : 'decrease'}
							color='orange'
							delay={0.3}
						/>
						<KPICard
							title='Engagement Rate'
							value={kpis?.engagementRate || 0}
							unit='%'
							icon={Activity}
							color='green'
							delay={0.4}
						/>
						<KPICard
							title='Health Score'
							value={health?.overall || 0}
							unit='/100'
							icon={Target}
							color={
								(health?.overall || 0) >= 80
									? "green"
									: (health?.overall || 0) >= 60
									? "orange"
									: "red"
							}
							delay={0.5}
						/>
					</div>
				</motion.div>

				{/* Analytics Tabs */}
				<Tabs
					value={activeTab}
					onValueChange={setActiveTab}
					className='space-y-4 sm:space-y-6'>
					<TabsList className='grid w-full grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-9 h-auto'>
						<TabsTrigger
							value='overview'
							className='text-xs sm:text-sm py-2 sm:py-3'>
							Overview
						</TabsTrigger>
						<TabsTrigger
							value='resources'
							className='text-xs sm:text-sm py-2 sm:py-3'>
							Resources
						</TabsTrigger>
						<TabsTrigger
							value='users'
							className='text-xs sm:text-sm py-2 sm:py-3'>
							Users
						</TabsTrigger>
						<TabsTrigger
							value='performance'
							className='text-xs sm:text-sm py-2 sm:py-3'>
							Performance
						</TabsTrigger>
						<TabsTrigger
							value='business'
							className='text-xs sm:text-sm py-2 sm:py-3'>
							Business
						</TabsTrigger>
						<TabsTrigger
							value='invoices'
							className='text-xs sm:text-sm py-2 sm:py-3'>
							Invoices
						</TabsTrigger>
						<TabsTrigger
							value='premium'
							className='text-xs sm:text-sm py-2 sm:py-3'>
							Premium
						</TabsTrigger>
						<TabsTrigger
							value='errors'
							className='text-xs sm:text-sm py-2 sm:py-3'>
							Errors
						</TabsTrigger>
						<TabsTrigger
							value='status'
							className='text-xs sm:text-sm py-2 sm:py-3'>
							Data Status
						</TabsTrigger>
					</TabsList>

					{/* Overview Tab */}
					<TabsContent value='overview' className='space-y-4 sm:space-y-6'>
						<div className='grid grid-cols-1 md:grid-cols-2 gap-4 sm:gap-6'>
							<OverviewChart
								title='User Activity Trend'
								icon={Activity}
								data={timeSeriesData?.userActivity || []}
								dataKeys={[
									{
										key: "active",
										name: "Active Users",
										color: "#10b981",
										type: "area",
									},
									{ key: "percentage", name: "Engagement %", color: "#3b82f6" },
								]}
								xAxisKey='date'
								delay={0.2}
							/>

							<DistributionChart
								title='Database Size Distribution'
								icon={PieChart}
								data={distributions?.databaseSizes || []}
								delay={0.3}
							/>

							<TrendChart
								title='Database Growth'
								icon={TrendingUp}
								data={timeSeriesData?.databaseGrowth || []}
								metrics={[
									{
										key: "databases",
										name: "Databases",
										type: "bar",
										color: "#3b82f6",
									},
									{
										key: "tables",
										name: "Tables",
										type: "line",
										color: "#10b981",
									},
								]}
								xAxisKey='date'
								trend={data?.growth?.monthlyGrowthTrend || "stable"}
								trendValue={data?.growth?.weeklyDatabaseGrowth || 0}
								delay={0.4}
							/>

							<TopItemsList
								title='Top Databases'
								icon={Database}
								items={(rankings?.topDatabases ?? []).map((db) => ({
									name: db?.name || "Unknown",
									value: db?.realSize || `${((db?.size || 0) / 1024).toFixed(2)} MB`,
									subtitle: `${
										db?.tables || 0
									} tables, ${(db?.rows || 0).toLocaleString()} rows`,
								}))}
								delay={0.5}
							/>
						</div>
					</TabsContent>

					{/* Resources Tab */}
					<TabsContent value='resources' className='space-y-4 sm:space-y-6'>
						<div className='grid grid-cols-1 md:grid-cols-2 gap-4 sm:gap-6'>
							<ResourceUsageChart
								title='Resource Utilization'
								icon={Gauge}
								data={distributions?.resourceUsage || []}
								delay={0.2}
							/>

							<OverviewChart
								title='Storage Usage Over Time'
								icon={HardDrive}
								data={timeSeriesData?.storageUsage || []}
								dataKeys={[
									{
										key: "percentage",
										name: "Storage Usage %",
										color: "#000000",
										type: "area",
									},
								]}
								xAxisKey='date'
								delay={0.3}
							/>

							<OverviewChart
								title='Storage Usage Trend'
								icon={HardDrive}
								data={timeSeriesData?.storageUsage || []}
								dataKeys={[
									{
										key: "used",
										name: "Used Storage",
										color: "#ef4444",
										type: "area",
									},
									{ key: "percentage", name: "Usage %", color: "#8b5cf6" },
								]}
								xAxisKey='date'
								delay={0.4}
							/>

							<div className='space-y-4'>
								<KPICard
									title='Storage Usage'
									value={kpis?.storageUsagePercentage || 0}
									unit='%'
									icon={HardDrive}
									color={
										(kpis?.storageUsagePercentage || 0) > 80
											? "red"
											: (kpis?.storageUsagePercentage || 0) > 60
											? "orange"
											: "green"
									}
								/>
								<KPICard
									title='Resource Score'
									value={kpis?.resourceUtilizationScore || 0}
									unit='/100'
									icon={Target}
									color={
										(kpis?.resourceUtilizationScore || 0) >= 80
											? "green"
											: (kpis?.resourceUtilizationScore || 0) >= 60
											? "orange"
											: "red"
									}
								/>
								<KPICard
									title='Engagement Rate'
									value={kpis?.engagementRate || 0}
									unit='%'
									icon={Users}
									color={
										(kpis?.engagementRate || 0) >= 80
											? "green"
											: (kpis?.engagementRate || 0) >= 60
											? "orange"
											: "red"
									}
								/>
							</div>
						</div>

						{/* Real Database Sizes */}
						<div className="mt-6">
							<RealSizeInfo
								databases={(rankings?.topDatabases ?? []).map((db) => ({
									name: db?.name || "Unknown",
									realSizeMB: ((db?.size || 0) / 1024), // Convert KB to MB
									realSizeKB: db?.size || 0,
									realSizeFormatted: db?.realSize || `${((db?.size || 0) / 1024).toFixed(2)} MB`,
									tables: db?.tables || 0,
									rows: db?.rows || 0,
									cells: (db?.rows || 0) * 5 // Estimate cells per row
								}))}
								totalMemoryUsed={(kpis?.storageUsagePercentage || 0) * 100} // Convert percentage to MB
								totalRows={kpis?.totalRows || 0}
								totalTables={kpis?.totalTables || 0}
								loading={false}
							/>
						</div>
					</TabsContent>

					{/* Users Tab */}
					<TabsContent value='users' className='space-y-4 sm:space-y-6'>
						<div className='grid grid-cols-1 md:grid-cols-2 gap-4 sm:gap-6'>
							<DistributionChart
								title='User Roles Distribution'
								icon={Users}
								data={(distributions?.userRoles ?? []).map((role) => ({
									name: role?.role || "Unknown",
									value: role?.count || 0,
								}))}
								delay={0.2}
							/>

							<TopItemsList
								title='Most Active Users'
								icon={Activity}
								items={(rankings?.mostActiveUsers ?? []).map((user) => ({
									name: user?.name || "Unknown",
									value: "Active",
									subtitle: user?.email || "",
									status: user?.status || "offline",
								}))}
								delay={0.3}
							/>

							<OverviewChart
								title='User Engagement Trend'
								icon={TrendingUp}
								data={timeSeriesData?.userActivity || []}
								dataKeys={[
									{ key: "active", name: "Active Users", color: "#10b981" },
									{ key: "total", name: "Total Users", color: "#6b7280" },
								]}
								xAxisKey='date'
								delay={0.4}
							/>

							<div className='space-y-4'>
								<KPICard
									title='Total Users'
									value={kpis?.totalUsers || 0}
									icon={Users}
									color='blue'
								/>
								<KPICard
									title='Active Users'
									value={kpis?.activeUsers || 0}
									icon={Activity}
									change={Math.abs(data?.growth?.weeklyUserGrowth || 0)}
									changeType={(data?.growth?.weeklyUserGrowth || 0) >= 0 ? 'increase' : 'decrease'}
									color='green'
								/>
								<KPICard
									title='User Health'
									value={health?.users || 0}
									unit='/100'
									icon={Target}
									color={
										(health?.users || 0) >= 80
											? "green"
											: (health?.users || 0) >= 60
											? "orange"
											: "red"
									}
								/>
							</div>
						</div>
					</TabsContent>

					{/* Performance Tab */}
					<TabsContent value='performance' className='space-y-4 sm:space-y-6'>
						<div className='grid grid-cols-1 md:grid-cols-2 gap-4 sm:gap-6'>
							<PerformanceChart
								title='System Health Radar'
								icon={Gauge}
								data={[
									{
										subject: "Database",
										score: health?.database || 0,
										fullMark: 100,
									},
									{ subject: "Memory", score: health?.memory || 0, fullMark: 100 },
									{ subject: "Storage", score: health?.storage || 0, fullMark: 100 },
									{ subject: "Users", score: health?.users || 0, fullMark: 100 },
									{ subject: "Overall", score: health?.overall || 0, fullMark: 100 },
								]}
								delay={0.2}
							/>

							<OverviewChart
								title='Peak Usage Hours'
								icon={Clock}
								data={performance?.peakUsageHours || []}
								dataKeys={[
									{
										key: "usage",
										name: "Usage %",
										color: "#3b82f6",
										type: "area",
									},
								]}
								xAxisKey='hour'
								delay={0.3}
							/>

							<div className='md:col-span-2 grid grid-cols-2 sm:grid-cols-2 md:grid-cols-4 gap-3 sm:gap-4'>
								<KPICard
									title='Response Time'
									value={performance?.averageResponseTime || 0}
									unit='ms'
									icon={Clock}
									color={
										(performance?.averageResponseTime || 0) < 100
											? "green"
											: (performance?.averageResponseTime || 0) < 200
											? "orange"
											: "red"
									}
								/>
								<KPICard
									title='Uptime'
									value={(performance?.uptime || 0).toFixed(2)}
									unit='%'
									icon={Server}
									color={
										(performance?.uptime || 0) >= 99.5
											? "green"
											: (performance?.uptime || 0) >= 99
											? "orange"
											: "red"
									}
								/>
								<KPICard
									title='Error Rate'
									value={(performance?.errorRate || 0).toFixed(2)}
									unit='%'
									icon={Activity}
									color={
										(performance?.errorRate || 0) < 1
											? "green"
											: (performance?.errorRate || 0) < 2
											? "orange"
											: "red"
									}
								/>
								<KPICard
									title='Throughput'
									value={performance?.throughput || 0}
									unit='req/min'
									icon={Network}
									color='blue'
								/>
							</div>
						</div>
					</TabsContent>

					{/* Business Tab */}
					<TabsContent value='business' className='space-y-4 sm:space-y-6'>
						<div className='grid grid-cols-1 md:grid-cols-2 gap-4 sm:gap-6'>
							{/* Invoice Revenue Chart */}
							<RevenueChart
								title='Invoice Revenue Trends'
								icon={DollarSign}
								data={(businessData?.invoices?.monthlyData ?? []).map((item: any) => ({
									date: item?.month || "",
									revenue: item?.revenue || 0,
									arpu: (item?.invoices || 0) > 0 ? (item?.revenue || 0) / (item?.invoices || 1) : 0,
								})) || []}
								chartType='area'
								delay={0.2}
							/>

							{/* Total Revenue from Invoices */}
							<BusinessMetricsCard
								title='Total Invoice Revenue'
								value={businessData?.invoices?.totalRevenue || 0}
								icon={DollarSign}
								change={Math.abs(businessData?.invoices?.revenueGrowth || 0)}
								changeType={
									(businessData?.invoices?.revenueGrowth || 0) >= 0
										? "increase"
										: "decrease"
								}
								color='green'
								delay={0.3}
								unit=""
							/>

							{/* Total Invoices */}
							<BusinessMetricsCard
								title='Total Invoices'
								value={businessData?.invoices?.totalInvoices || 0}
								icon={FileText}
								change={12}
								changeType="increase"
								color='blue'
								delay={0.4}
								unit="invoices"
							/>

							{/* Average Invoice Value */}
							<BusinessMetricsCard
								title='Average Invoice Value'
								value={businessData?.invoices?.averageInvoiceValue || 0}
								icon={TrendingUp}
								change={8}
								changeType="increase"
								color='purple'
								delay={0.5}
								unit=""
							/>

							{/* Paid vs Pending Invoices */}
							<DistributionChart
								title='Invoice Status Distribution'
								icon={PieChart}
								data={[
									{
										name: 'Paid',
										value: businessData?.invoices?.paidInvoices || 0,
									},
									{
										name: 'Pending',
										value: businessData?.invoices?.pendingInvoices || 0,
									},
									{
										name: 'Overdue',
										value: businessData?.invoices?.overdueInvoices || 0,
									},
								].filter(item => (item?.value ?? 0) > 0)}
								delay={0.6}
							/>

							{/* Top Customers by Invoice Value */}
							<TopItemsList
								title='Top Customers by Revenue'
								icon={BarChart3}
								items={
									(businessData?.invoices?.topCustomers ?? []).map((customer: any) => ({
										name: customer?.name || "Unknown",
										value: customer?.totalSpent || 0,
										subtitle: `${customer?.invoiceCount || 0} invoices`,
									})) || []
								}
								delay={0.7}
							/>
						</div>

						{/* Additional Invoice Metrics */}
						<div className='grid grid-cols-1 md:grid-cols-3 gap-4 sm:gap-6'>
							<BusinessMetricsCard
								title='Paid Invoices'
								value={businessData?.invoices?.paidInvoices || 0}
								icon={CheckCircle}
								change={15}
								changeType="increase"
								color='green'
								delay={0.8}
								unit="invoices"
							/>

							<BusinessMetricsCard
								title='Pending Invoices'
								value={businessData?.invoices?.pendingInvoices || 0}
								icon={Clock}
								change={5}
								changeType="increase"
								color='green'
								delay={0.9}
								unit="invoices"
							/>

							<BusinessMetricsCard
								title='Overdue Invoices'
								value={businessData?.invoices?.overdueInvoices || 0}
								icon={AlertTriangle}
								change={-10}
								changeType="decrease"
								color='red'
								delay={1.0}
								unit="invoices"
							/>
						</div>
					</TabsContent>

					{/* Invoices Tab */}
					<TabsContent value='invoices' className='space-y-4 sm:space-y-6'>
						<InvoiceAnalytics />
					</TabsContent>

					{/* Premium Tab */}
					<TabsContent value='premium' className='space-y-4 sm:space-y-6'>
						<PremiumChartDemo />
					</TabsContent>

					{/* Errors Tab */}
					<TabsContent value='errors' className='space-y-4 sm:space-y-6'>
						<div className='grid grid-cols-1 md:grid-cols-2 gap-4 sm:gap-6'>
							<ErrorTrackingChart
								title='Error Tracking & Resolution'
								icon={AlertTriangle}
								data={realTimeData?.errorData || []}
								delay={0.2}
							/>

							<BusinessMetricsCard
								title='System Uptime'
								value={businessData?.performance?.uptime || 99.9}
								unit='%'
								icon={Shield}
								change={Math.abs(businessData?.performance?.errorRate || 0)}
								changeType={
									(businessData?.performance?.errorRate || 0) < 1
										? "increase"
										: "decrease"
								}
								color={
									(businessData?.performance?.uptime || 99.9) > 99.5 ? "green" : "orange"
								}
								delay={0.3}
							/>

							<BusinessMetricsCard
								title='Average Response Time'
								value={businessData?.performance?.avgResponseTime || 0}
								unit='ms'
								icon={Clock}
								change={Math.abs(businessData?.performance?.p95ResponseTime || 0)}
								changeType={
									(businessData?.performance?.avgResponseTime || 0) < 200
										? "increase"
										: "decrease"
								}
								color={
									(businessData?.performance?.avgResponseTime || 0) < 100
										? "green"
										: "orange"
								}
								delay={0.4}
							/>

							<BusinessMetricsCard
								title='Error Rate'
								value={businessData?.performance?.errorRate || 0}
								unit='%'
								icon={AlertTriangle}
								change={Math.abs(businessData?.performance?.successRate || 0)}
								changeType={
									(businessData?.performance?.errorRate || 0) < 1
										? "increase"
										: "decrease"
								}
								color={
									(businessData?.performance?.errorRate || 0) < 1 ? "green" : "red"
								}
								delay={0.5}
							/>

							<OverviewChart
								title='API Performance Over Time'
								icon={Activity}
								data={businessData?.usage?.apiUsageByPeriod || []}
								dataKeys={[
									{
										key: "avgResponseTime",
										name: "Response Time (ms)",
										color: "#3b82f6",
									},
									{ key: "errorRate", name: "Error Rate %", color: "#ef4444" },
								]}
								xAxisKey='date'
								delay={0.6}
							/>

							<TopItemsList
								title='Recent Critical Errors'
								icon={AlertTriangle}
								items={realTimeData?.criticalErrors || []}
								delay={0.7}
							/>
						</div>
					</TabsContent>

					{/* Data Status Tab */}
					<TabsContent value='status' className='space-y-4 sm:space-y-6'>
						<div className='grid grid-cols-1 gap-4 sm:gap-6'>
							<RealDataStatus />
						</div>
					</TabsContent>
				</Tabs>
			</div>
		</motion.div>
	);
};
