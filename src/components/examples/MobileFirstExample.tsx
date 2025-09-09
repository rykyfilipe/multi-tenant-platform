/** @format */

"use client";

import React, { useState } from "react";
import { motion } from "framer-motion";
import {
	ResponsiveGrid,
	ResponsiveCard,
	ResponsiveContainer,
	ResponsiveStack,
} from "@/components/layout/ResponsiveGrid";
import {
	MobileButton,
	MobileInput,
	MobileCard,
	MobileSearchBar,
	MobileAccordion,
	MobileList,
} from "@/components/layout/MobileOptimizedComponents";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
	Database,
	Users,
	Settings,
	BarChart3,
	Plus,
	Search,
	Filter,
	Download,
	RefreshCw,
	TrendingUp,
	Activity,
	Target,
} from "lucide-react";

export function MobileFirstExample() {
	const [searchQuery, setSearchQuery] = useState("");
	const [selectedTab, setSelectedTab] = useState("overview");
	const [isLoading, setIsLoading] = useState(false);

	const handleRefresh = async () => {
		setIsLoading(true);
		await new Promise((resolve) => setTimeout(resolve, 1000));
		setIsLoading(false);
	};

	const mockData = {
		stats: [
			{
				title: "Total Databases",
				value: "12",
				change: "+12%",
				changeType: "increase" as const,
				icon: Database,
				color: "blue" as const,
			},
			{
				title: "Active Users",
				value: "8",
				change: "+5%",
				changeType: "increase" as const,
				icon: Users,
				color: "green" as const,
			},
			{
				title: "Engagement Rate",
				value: "87%",
				change: "+3%",
				changeType: "increase" as const,
				icon: Activity,
				color: "purple" as const,
			},
			{
				title: "Health Score",
				value: "92/100",
				change: "+2%",
				changeType: "increase" as const,
				icon: Target,
				color: "green" as const,
			},
		],
		recentItems: [
			{
				id: "1",
				title: "Database Created",
				subtitle: "Customer data",
				icon: <Database className="h-4 w-4" />,
				badge: "2m ago",
			},
			{
				id: "2",
				title: "User Joined",
				subtitle: "John Doe",
				icon: <Users className="h-4 w-4" />,
				badge: "5m ago",
			},
			{
				id: "3",
				title: "Settings Updated",
				subtitle: "Security settings",
				icon: <Settings className="h-4 w-4" />,
				badge: "1h ago",
			},
		],
	};

	return (
		<ResponsiveContainer maxWidth="full" padding="lg">
			<div className="space-y-6">
				{/* Header Section */}
				<motion.div
					initial={{ opacity: 0, y: 20 }}
					animate={{ opacity: 1, y: 0 }}
					transition={{ duration: 0.5 }}
					className="space-y-4"
				>
					<div className="flex flex-col sm:flex-row sm:items-center sm:justify-between space-y-4 sm:space-y-0">
						<div>
							<h1 className="text-2xl sm:text-3xl font-bold text-foreground">
								Mobile-First Layout Example
							</h1>
							<p className="text-muted-foreground">
								Demonstrating responsive design patterns
							</p>
						</div>
						<div className="flex items-center space-x-2">
							<Badge variant="secondary">Mobile Optimized</Badge>
							<Badge variant="outline">Responsive</Badge>
						</div>
					</div>

					{/* Search and Actions */}
					<div className="flex flex-col sm:flex-row space-y-3 sm:space-y-0 sm:space-x-4">
						<div className="flex-1">
							<MobileSearchBar
								value={searchQuery}
								onChange={setSearchQuery}
								placeholder="Search databases, users, settings..."
								showFilters={true}
								onFilterClick={() => console.log("Filter clicked")}
								showSort={true}
								onSortClick={() => console.log("Sort clicked")}
							/>
						</div>
						<div className="flex space-x-2">
							<MobileButton
								variant="outline"
								size="sm"
								onClick={handleRefresh}
								loading={isLoading}
								className="mobile-touch-feedback"
							>
								<RefreshCw className="h-4 w-4 mr-2" />
								Refresh
							</MobileButton>
							<MobileButton
								variant="default"
								size="sm"
								onClick={() => console.log("Export clicked")}
								className="mobile-touch-feedback"
							>
								<Download className="h-4 w-4 mr-2" />
								Export
							</MobileButton>
						</div>
					</div>
				</motion.div>

				{/* Stats Grid */}
				<motion.div
					initial={{ opacity: 0, y: 20 }}
					animate={{ opacity: 1, y: 0 }}
					transition={{ duration: 0.5, delay: 0.1 }}
				>
					<ResponsiveGrid
						variant="dashboard"
						columns={{ mobile: 2, tablet: 4, desktop: 4 }}
						gap="md"
					>
						{mockData.stats.map((stat, index) => (
							<MobileCard
								key={stat.title}
								className="p-4 sm:p-6 hover:shadow-lg transition-all duration-300"
								hover={true}
							>
								<div className="flex items-center justify-between mb-3">
									<div className={`p-2 rounded-lg ${
										stat.color === "blue" ? "text-blue-600 bg-blue-50 dark:text-blue-400 dark:bg-blue-900/20" :
										stat.color === "green" ? "text-green-600 bg-green-50 dark:text-green-400 dark:bg-green-900/20" :
										stat.color === "purple" ? "text-purple-600 bg-purple-50 dark:text-purple-400 dark:bg-purple-900/20" :
										"text-orange-600 bg-orange-50 dark:text-orange-400 dark:bg-orange-900/20"
									}`}>
										<stat.icon className="h-5 w-5" />
									</div>
									<Badge variant="secondary" className="text-xs">
										{stat.change}
									</Badge>
								</div>
								<div className="space-y-1">
									<p className="text-2xl sm:text-3xl font-bold text-foreground">
										{stat.value}
									</p>
									<p className="text-sm text-muted-foreground">{stat.title}</p>
								</div>
							</MobileCard>
						))}
					</ResponsiveGrid>
				</motion.div>

				{/* Main Content Tabs */}
				<motion.div
					initial={{ opacity: 0, y: 20 }}
					animate={{ opacity: 1, y: 0 }}
					transition={{ duration: 0.5, delay: 0.2 }}
				>
					<Tabs value={selectedTab} onValueChange={setSelectedTab} className="w-full">
						<TabsList className="grid w-full grid-cols-2 sm:grid-cols-4">
							<TabsTrigger value="overview" className="text-xs sm:text-sm">
								Overview
							</TabsTrigger>
							<TabsTrigger value="databases" className="text-xs sm:text-sm">
								Databases
							</TabsTrigger>
							<TabsTrigger value="users" className="text-xs sm:text-sm">
								Users
							</TabsTrigger>
							<TabsTrigger value="settings" className="text-xs sm:text-sm">
								Settings
							</TabsTrigger>
						</TabsList>

						<TabsContent value="overview" className="space-y-6">
							{/* Charts Section */}
							<ResponsiveGrid
								variant="cards"
								columns={{ mobile: 1, tablet: 2, desktop: 3 }}
								gap="lg"
							>
								<MobileCard title="Database Growth" className="p-6">
									<div className="h-48 bg-muted/20 rounded-lg flex items-center justify-center">
										<div className="text-center">
											<TrendingUp className="h-12 w-12 mx-auto text-muted-foreground mb-2" />
											<p className="text-sm text-muted-foreground">Growth Chart</p>
										</div>
									</div>
								</MobileCard>

								<MobileCard title="User Activity" className="p-6">
									<div className="h-48 bg-muted/20 rounded-lg flex items-center justify-center">
										<div className="text-center">
											<Activity className="h-12 w-12 mx-auto text-muted-foreground mb-2" />
											<p className="text-sm text-muted-foreground">Activity Chart</p>
										</div>
									</div>
								</MobileCard>

								<MobileCard title="System Health" className="p-6">
									<div className="h-48 bg-muted/20 rounded-lg flex items-center justify-center">
										<div className="text-center">
											<Target className="h-12 w-12 mx-auto text-muted-foreground mb-2" />
											<p className="text-sm text-muted-foreground">Health Chart</p>
										</div>
									</div>
								</MobileCard>
							</ResponsiveGrid>

							{/* Recent Activity Accordion */}
							<MobileAccordion
								title="Recent Activity"
								icon={<Activity className="h-4 w-4" />}
								defaultOpen={true}
							>
								<MobileList
									items={mockData.recentItems}
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

						<TabsContent value="settings" className="space-y-6">
							<div className="text-center py-12">
								<Settings className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
								<h3 className="text-lg font-semibold mb-2">Settings</h3>
								<p className="text-muted-foreground">
									Configure your application settings
								</p>
							</div>
						</TabsContent>
					</Tabs>
				</motion.div>

				{/* Form Example */}
				<motion.div
					initial={{ opacity: 0, y: 20 }}
					animate={{ opacity: 1, y: 0 }}
					transition={{ duration: 0.5, delay: 0.3 }}
				>
					<MobileCard title="Form Example" className="p-6">
						<div className="space-y-4">
							<MobileInput
								value=""
								onChange={() => {}}
								placeholder="Enter your name"
								label="Full Name"
								required
							/>
							<MobileInput
								value=""
								onChange={() => {}}
								placeholder="Enter your email"
								label="Email Address"
								type="email"
								required
							/>
							<div className="flex space-x-3">
								<MobileButton
									variant="default"
									fullWidth
									onClick={() => console.log("Submit clicked")}
									className="mobile-touch-feedback"
								>
									Submit
								</MobileButton>
								<MobileButton
									variant="outline"
									fullWidth
									onClick={() => console.log("Cancel clicked")}
									className="mobile-touch-feedback"
								>
									Cancel
								</MobileButton>
							</div>
						</div>
					</MobileCard>
				</motion.div>
			</div>
		</ResponsiveContainer>
	);
}
