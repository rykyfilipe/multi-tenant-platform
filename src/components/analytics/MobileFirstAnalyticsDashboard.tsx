/** @format */

"use client";

import React, { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useApp } from "@/contexts/AppContext";
import { useLanguage } from "@/contexts/LanguageContext";
import { useSession } from "next-auth/react";
import {
	Database,
	Server,
	BarChart3,
	Users,
	Activity,
	Target,
	TrendingUp,
	TrendingDown,
	ArrowUp,
	ArrowDown,
	MoreHorizontal,
	Filter,
	Download,
	RefreshCw,
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
	DropdownMenu,
	DropdownMenuContent,
	DropdownMenuItem,
	DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
	ResponsiveGrid,
	ResponsiveCard,
	ResponsiveContainer,
	ResponsiveStack,
} from "@/components/layout/ResponsiveGrid";
import {
	MobileButton,
	MobileCard,
	MobileSearchBar,
	MobileAccordion,
	MobileList,
} from "@/components/layout/MobileOptimizedComponents";

interface KPICardProps {
	title: string;
	value: string | number;
	icon: React.ComponentType<{ className?: string }>;
	change?: number;
	changeType?: "increase" | "decrease" | "neutral";
	unit?: string;
	color?: "blue" | "green" | "purple" | "orange" | "red";
	delay?: number;
}

function KPICard({
	title,
	value,
	icon: Icon,
	change,
	changeType = "neutral",
	unit = "",
	color = "blue",
	delay = 0,
}: KPICardProps) {
	const colorClasses = {
		blue: "text-blue-600 bg-blue-50 dark:text-blue-400 dark:bg-blue-900/20",
		green: "text-green-600 bg-green-50 dark:text-green-400 dark:bg-green-900/20",
		purple: "text-purple-600 bg-purple-50 dark:text-purple-400 dark:bg-purple-900/20",
		orange: "text-orange-600 bg-orange-50 dark:text-orange-400 dark:bg-orange-900/20",
		red: "text-red-600 bg-red-50 dark:text-red-400 dark:bg-red-900/20",
	};

	return (
		<motion.div
			initial={{ opacity: 0, y: 20 }}
			animate={{ opacity: 1, y: 0 }}
			transition={{ duration: 0.5, delay }}
		>
			<MobileCard
				className="p-4 sm:p-6 hover:shadow-lg transition-all duration-300"
				hover={true}
			>
				<div className="flex items-center justify-between mb-3">
					<div className={`p-2 rounded-lg ${colorClasses[color]}`}>
						<Icon className="h-5 w-5" />
					</div>
					{change !== undefined && (
						<div className="flex items-center space-x-1">
							{changeType === "increase" ? (
								<ArrowUp className="h-4 w-4 text-green-600" />
							) : changeType === "decrease" ? (
								<ArrowDown className="h-4 w-4 text-red-600" />
							) : null}
							<span
								className={`text-sm font-medium ${
									changeType === "increase"
										? "text-green-600"
										: changeType === "decrease"
										? "text-red-600"
										: "text-muted-foreground"
								}`}
							>
								{change}%
							</span>
						</div>
					)}
				</div>
				<div className="space-y-1">
					<p className="text-2xl sm:text-3xl font-bold text-foreground">
						{value}
						{unit && <span className="text-lg text-muted-foreground">{unit}</span>}
					</p>
					<p className="text-sm text-muted-foreground">{title}</p>
				</div>
			</MobileCard>
		</motion.div>
	);
}

interface ChartCardProps {
	title: string;
	children: React.ReactNode;
	className?: string;
	actions?: React.ReactNode;
}

function ChartCard({ title, children, className, actions }: ChartCardProps) {
	return (
		<MobileCard className={className}>
			<CardHeader className="pb-4">
				<div className="flex items-center justify-between">
					<CardTitle className="text-lg font-semibold">{title}</CardTitle>
					{actions}
				</div>
			</CardHeader>
			<CardContent className="p-0">
				{children}
			</CardContent>
		</MobileCard>
	);
}

export function MobileFirstAnalyticsDashboard() {
	const { tenant, user } = useApp();
	const { t } = useLanguage();
	const { data: session } = useSession();
	const [searchQuery, setSearchQuery] = useState("");
	const [selectedTimeRange, setSelectedTimeRange] = useState("7d");
	const [isLoading, setIsLoading] = useState(false);

	// Mock data - replace with real data from your API
	const mockData = {
		kpis: {
			totalDatabases: 12,
			totalTables: 48,
			totalRows: 125000,
			activeUsers: 8,
			engagementRate: 87,
			healthScore: 92,
		},
		growth: {
			weeklyDatabaseGrowth: 12,
			weeklyTableGrowth: 8,
			weeklyRowGrowth: 15,
			weeklyUserGrowth: 5,
		},
		recentActivity: [
			{
				id: "1",
				title: "New database created",
				subtitle: "Customer data",
				icon: <Database className="h-4 w-4" />,
				badge: "2m ago",
			},
			{
				id: "2",
				title: "Table updated",
				subtitle: "Products table",
				icon: <Server className="h-4 w-4" />,
				badge: "5m ago",
			},
			{
				id: "3",
				title: "User joined",
				subtitle: "John Doe",
				icon: <Users className="h-4 w-4" />,
				badge: "1h ago",
			},
		],
	};

	const handleRefresh = async () => {
		setIsLoading(true);
		// Simulate API call
		await new Promise((resolve) => setTimeout(resolve, 1000));
		setIsLoading(false);
	};

	const handleExport = () => {
		// Implement export functionality
		console.log("Exporting data...");
	};

	const timeRanges = [
		{ value: "7d", label: "7 Days" },
		{ value: "30d", label: "30 Days" },
		{ value: "90d", label: "90 Days" },
		{ value: "1y", label: "1 Year" },
	];

	return (
		<ResponsiveContainer maxWidth="full" padding="lg">
			<div className="space-y-6">
				{/* Header */}
				<div className="flex flex-col sm:flex-row sm:items-center sm:justify-between space-y-4 sm:space-y-0">
					<div>
						<h1 className="text-2xl sm:text-3xl font-bold text-foreground">
							Analytics Dashboard
						</h1>
						<p className="text-muted-foreground">
							Monitor your data platform performance
						</p>
					</div>
					<div className="flex items-center space-x-2">
						<Badge variant="secondary" className="text-sm">
							{tenant?.name || "Organization"}
						</Badge>
						<DropdownMenu>
							<DropdownMenuTrigger asChild>
								<Button variant="outline" size="sm">
									<MoreHorizontal className="h-4 w-4" />
								</Button>
							</DropdownMenuTrigger>
							<DropdownMenuContent align="end">
								<DropdownMenuItem onClick={handleRefresh}>
									<RefreshCw className="mr-2 h-4 w-4" />
									Refresh
								</DropdownMenuItem>
								<DropdownMenuItem onClick={handleExport}>
									<Download className="mr-2 h-4 w-4" />
									Export Data
								</DropdownMenuItem>
							</DropdownMenuContent>
						</DropdownMenu>
					</div>
				</div>

				{/* Search and Filters */}
				<div className="flex flex-col sm:flex-row space-y-3 sm:space-y-0 sm:space-x-4">
					<div className="flex-1">
						<MobileSearchBar
							value={searchQuery}
							onChange={setSearchQuery}
							placeholder="Search databases, tables, users..."
							showFilters={true}
							onFilterClick={() => console.log("Filter clicked")}
							showSort={true}
							onSortClick={() => console.log("Sort clicked")}
						/>
					</div>
					<div className="flex space-x-2">
						{timeRanges.map((range) => (
							<Button
								key={range.value}
								variant={selectedTimeRange === range.value ? "default" : "outline"}
								size="sm"
								onClick={() => setSelectedTimeRange(range.value)}
								className="mobile-touch-feedback"
							>
								{range.label}
							</Button>
						))}
					</div>
				</div>

				{/* KPI Cards */}
				<ResponsiveGrid
					variant="dashboard"
					columns={{ mobile: 2, tablet: 3, desktop: 6 }}
					gap="md"
				>
					<KPICard
						title="Total Databases"
						value={mockData.kpis.totalDatabases}
						icon={Database}
						change={mockData.growth.weeklyDatabaseGrowth}
						changeType="increase"
						color="blue"
						delay={0}
					/>
					<KPICard
						title="Total Tables"
						value={mockData.kpis.totalTables}
						icon={Server}
						change={mockData.growth.weeklyTableGrowth}
						changeType="increase"
						color="green"
						delay={0.1}
					/>
					<KPICard
						title="Total Rows"
						value={mockData.kpis.totalRows.toLocaleString()}
						icon={BarChart3}
						change={mockData.growth.weeklyRowGrowth}
						changeType="increase"
						color="purple"
						delay={0.2}
					/>
					<KPICard
						title="Active Users"
						value={mockData.kpis.activeUsers}
						icon={Users}
						change={mockData.growth.weeklyUserGrowth}
						changeType="increase"
						color="orange"
						delay={0.3}
					/>
					<KPICard
						title="Engagement Rate"
						value={mockData.kpis.engagementRate}
						unit="%"
						icon={Activity}
						color="green"
						delay={0.4}
					/>
					<KPICard
						title="Health Score"
						value={mockData.kpis.healthScore}
						unit="/100"
						icon={Target}
						color={mockData.kpis.healthScore >= 80 ? "green" : "orange"}
						delay={0.5}
					/>
				</ResponsiveGrid>

				{/* Main Content Tabs */}
				<Tabs defaultValue="overview" className="w-full">
					<TabsList className="grid w-full grid-cols-2 sm:grid-cols-4 lg:grid-cols-6">
						<TabsTrigger value="overview" className="text-xs sm:text-sm">
							Overview
						</TabsTrigger>
						<TabsTrigger value="databases" className="text-xs sm:text-sm">
							Databases
						</TabsTrigger>
						<TabsTrigger value="users" className="text-xs sm:text-sm">
							Users
						</TabsTrigger>
						<TabsTrigger value="performance" className="text-xs sm:text-sm">
							Performance
						</TabsTrigger>
						<TabsTrigger value="trends" className="text-xs sm:text-sm">
							Trends
						</TabsTrigger>
						<TabsTrigger value="reports" className="text-xs sm:text-sm">
							Reports
						</TabsTrigger>
					</TabsList>

					<TabsContent value="overview" className="space-y-6">
						{/* Charts Grid */}
						<ResponsiveGrid
							variant="cards"
							columns={{ mobile: 1, tablet: 2, desktop: 3 }}
							gap="lg"
						>
							<ChartCard
								title="Database Growth"
								actions={
									<Button variant="ghost" size="sm">
										<MoreHorizontal className="h-4 w-4" />
									</Button>
								}
							>
								<div className="h-64 bg-muted/20 rounded-lg flex items-center justify-center">
									<div className="text-center">
										<TrendingUp className="h-12 w-12 mx-auto text-muted-foreground mb-2" />
										<p className="text-sm text-muted-foreground">Growth Chart</p>
									</div>
								</div>
							</ChartCard>

							<ChartCard
								title="User Activity"
								actions={
									<Button variant="ghost" size="sm">
										<MoreHorizontal className="h-4 w-4" />
									</Button>
								}
							>
								<div className="h-64 bg-muted/20 rounded-lg flex items-center justify-center">
									<div className="text-center">
										<Activity className="h-12 w-12 mx-auto text-muted-foreground mb-2" />
										<p className="text-sm text-muted-foreground">Activity Chart</p>
									</div>
								</div>
							</ChartCard>

							<ChartCard
								title="System Health"
								actions={
									<Button variant="ghost" size="sm">
										<MoreHorizontal className="h-4 w-4" />
									</Button>
								}
							>
								<div className="h-64 bg-muted/20 rounded-lg flex items-center justify-center">
									<div className="text-center">
										<Target className="h-12 w-12 mx-auto text-muted-foreground mb-2" />
										<p className="text-sm text-muted-foreground">Health Chart</p>
									</div>
								</div>
							</ChartCard>
						</ResponsiveGrid>

						{/* Recent Activity */}
						<MobileAccordion
							title="Recent Activity"
							icon={<Activity className="h-4 w-4" />}
							defaultOpen={true}
						>
							<MobileList
								items={mockData.recentActivity}
								emptyMessage="No recent activity"
							/>
						</MobileAccordion>
					</TabsContent>

					<TabsContent value="databases" className="space-y-6">
						<div className="text-center py-12">
							<Database className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
							<h3 className="text-lg font-semibold mb-2">Database Management</h3>
							<p className="text-muted-foreground">
								Manage your databases and tables
							</p>
						</div>
					</TabsContent>

					<TabsContent value="users" className="space-y-6">
						<div className="text-center py-12">
							<Users className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
							<h3 className="text-lg font-semibold mb-2">User Management</h3>
							<p className="text-muted-foreground">
								Monitor user activity and permissions
							</p>
						</div>
					</TabsContent>

					<TabsContent value="performance" className="space-y-6">
						<div className="text-center py-12">
							<BarChart3 className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
							<h3 className="text-lg font-semibold mb-2">Performance Metrics</h3>
							<p className="text-muted-foreground">
								Track system performance and optimization
							</p>
						</div>
					</TabsContent>

					<TabsContent value="trends" className="space-y-6">
						<div className="text-center py-12">
							<TrendingUp className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
							<h3 className="text-lg font-semibold mb-2">Trend Analysis</h3>
							<p className="text-muted-foreground">
								Analyze trends and patterns in your data
							</p>
						</div>
					</TabsContent>

					<TabsContent value="reports" className="space-y-6">
						<div className="text-center py-12">
							<Download className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
							<h3 className="text-lg font-semibold mb-2">Reports & Exports</h3>
							<p className="text-muted-foreground">
								Generate and download detailed reports
							</p>
						</div>
					</TabsContent>
				</Tabs>
			</div>
		</ResponsiveContainer>
	);
}
