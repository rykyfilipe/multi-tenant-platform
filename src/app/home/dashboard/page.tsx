/** @format */

"use client";

import React from "react";
import { useSession } from "next-auth/react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { Alert, AlertDescription } from "@/components/ui/alert";
import {
	BarChart3,
	Database,
	Users,
	Activity,
	AlertCircle,
	RefreshCw,
	Settings,
	FileText,
	ExternalLink,
} from "lucide-react";
import { useDashboardData } from "@/hooks/useDashboardData";
import DashboardStats from "@/components/dashboard/DashboardStats";
import DatabaseChart from "@/components/dashboard/DatabaseChart";
import UserActivityChart from "@/components/dashboard/UserActivityChart";
import DataUsageChart from "@/components/dashboard/DataUsageChart";
import { Button } from "@/components/ui/button";
import Link from "next/link";
import { useApp } from "@/contexts/AppContext";

function DashboardPage() {
	const { data: session } = useSession();
	const { data, loading, error } = useDashboardData();
	const { user } = useApp();
	console.log(data);
	if (!session) return null;

	if (loading) {
		return (
			<div className='h-full bg-background'>
				{/* Header */}
				<div className='border-b border-border/20 bg-background/80 backdrop-blur-sm sticky top-0 z-50'>
					<div className='flex flex-col sm:flex-row sm:items-center sm:justify-between px-4 sm:px-6 py-4 gap-3'>
						<div className='flex items-center space-x-3 sm:space-x-4'>
							<div className='min-w-0 flex-1'>
								<h1 className='text-lg sm:text-xl font-semibold text-foreground truncate'>
									Dashboard
								</h1>
								<p className='text-xs sm:text-sm text-muted-foreground truncate'>
									Overview of your data and usage statistics
								</p>
							</div>
						</div>
						<div className='flex items-center space-x-2 sm:space-x-3'>
							<RefreshCw className='w-4 h-4 animate-spin text-muted-foreground' />
							<span className='text-xs sm:text-sm text-muted-foreground'>
								Loading...
							</span>
						</div>
					</div>
				</div>

				{/* Loading Content */}
				<div className='p-4 sm:p-6 max-w-7xl mx-auto'>
					<div className='space-y-4 sm:space-y-6'>
						{/* Stats Loading */}
						<div className='grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6'>
							{[1, 2, 3, 4].map((i) => (
								<Card key={i} className='dashboard-card'>
									<CardHeader className='flex flex-row items-center justify-between space-y-0 pb-2'>
										<Skeleton className='h-4 w-24 sm:w-32' />
										<Skeleton className='h-4 w-4' />
									</CardHeader>
									<CardContent>
										<Skeleton className='h-6 sm:h-8 w-12 sm:w-16 mb-2' />
										<Skeleton className='h-3 w-20 sm:w-24' />
									</CardContent>
								</Card>
							))}
						</div>

						{/* Charts Loading */}
						<div className='grid grid-cols-1 lg:grid-cols-2 gap-4 sm:gap-6'>
							{[1, 2].map((i) => (
								<Card key={i} className='dashboard-card'>
									<CardHeader>
										<Skeleton className='h-5 sm:h-6 w-32 sm:w-40' />
									</CardHeader>
									<CardContent className='space-y-3 sm:space-y-4'>
										<Skeleton className='h-4 w-full' />
										<Skeleton className='h-4 w-3/4' />
										<Skeleton className='h-4 w-1/2' />
									</CardContent>
								</Card>
							))}
						</div>
					</div>
				</div>
			</div>
		);
	}

	if (error) {
		return (
			<div className='h-full bg-background'>
				{/* Header */}
				<div className='border-b border-border/20 bg-background/80 backdrop-blur-sm sticky top-0 z-50'>
					<div className='flex flex-col sm:flex-row sm:items-center sm:justify-between px-4 sm:px-6 py-4 gap-3'>
						<div className='flex items-center space-x-3 sm:space-x-4'>
							<div className='min-w-0 flex-1'>
								<h1 className='text-lg sm:text-xl font-semibold text-foreground truncate'>
									Dashboard
								</h1>
								<p className='text-xs sm:text-sm text-muted-foreground truncate'>
									Overview of your data and usage statistics
								</p>
							</div>
						</div>
					</div>
				</div>

				{/* Error Content */}
				<div className='p-4 sm:p-6 max-w-7xl mx-auto'>
					<Alert variant='destructive'>
						<AlertCircle className='h-4 w-4' />
						<AlertDescription>{error}</AlertDescription>
					</Alert>
				</div>
			</div>
		);
	}

	if (!data) {
		return (
			<div className='h-full bg-background'>
				<div className='border-b border-border/20 bg-background/80 backdrop-blur-sm sticky top-0 z-50'>
					<div className='flex flex-col sm:flex-row sm:items-center sm:justify-between px-4 sm:px-6 py-4 gap-3'>
						<div className='flex items-center space-x-3 sm:space-x-4'>
							<div className='min-w-0 flex-1'>
								<h1 className='text-lg sm:text-xl font-semibold text-foreground truncate'>
									Dashboard
								</h1>
								<p className='text-xs sm:text-sm text-muted-foreground truncate'>
									Overview of your data and usage statistics
								</p>
							</div>
						</div>
					</div>
				</div>

				<div className='p-4 sm:p-6 max-w-7xl mx-auto'>
					<Alert>
						<AlertCircle className='h-4 w-4' />
						<AlertDescription>
							No data available. Please create some databases and tables to see
							your dashboard.
						</AlertDescription>
					</Alert>
				</div>
			</div>
		);
	}

	return (
		<div className='h-full bg-background'>
			{/* Header */}
			<div className='border-b border-border/20 bg-background/80 backdrop-blur-sm sticky top-0 z-50'>
				<div className='flex flex-col sm:flex-row sm:items-center sm:justify-between px-4 sm:px-6 py-4 gap-3'>
					<div className='flex items-center space-x-3 sm:space-x-4'>
						<div className='min-w-0 flex-1'>
							<h1 className='text-lg sm:text-xl font-semibold text-foreground truncate'>
								Dashboard
							</h1>
							<p className='text-xs sm:text-sm text-muted-foreground truncate'>
								Overview of your data and usage statistics
							</p>
						</div>
					</div>
					<div className='flex items-center space-x-2 sm:space-x-3'>
						<div className='w-2 h-2 rounded-full bg-green-500 animate-pulse'></div>
						<span className='text-xs sm:text-sm text-muted-foreground'>
							Live Data
						</span>
					</div>
				</div>
			</div>

			{/* Main Content */}
			<div className='p-4 sm:p-6 max-w-7xl mx-auto'>
				<div className='space-y-4 sm:space-y-6'>
					{/* Stats Overview */}
					<DashboardStats stats={data.stats} />

					{/* Charts Grid */}
					<div className='grid grid-cols-1 lg:grid-cols-2 gap-4 sm:gap-6'>
						{/* Database Usage Chart */}
						<DatabaseChart data={data.databaseData} />

						{/* User Activity Chart */}
						<UserActivityChart data={data.userData} />
					</div>

					{/* Data Usage Chart */}
					<DataUsageChart data={data.usageData} />

					{/* Quick Actions */}
					<Card className='dashboard-card'>
						<CardHeader>
							<CardTitle className='flex items-center gap-2 text-base sm:text-lg'>
								<Activity className='h-4 w-4 sm:h-5 sm:w-5' />
								Quick Actions
							</CardTitle>
						</CardHeader>
						<CardContent>
							<div className='grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3 sm:gap-4'>
								<Link href='/home/database'>
									<Button
										variant='outline'
										className='h-auto p-4 flex flex-col items-center gap-2 w-full'>
										<Database className='w-5 h-5' />
										<span>View Database</span>
										<span className='text-xs text-muted-foreground'>
											Access your organization's data
										</span>
									</Button>
								</Link>
								<Link href='/home/users'>
									<Button
										variant='outline'
										className='h-auto p-4 flex flex-col items-center gap-2 w-full'>
										<Users className='w-5 h-5' />
										<span>
											{user?.role === "ADMIN" ? "Manage Users" : "View Team"}
										</span>
										<span className='text-xs text-muted-foreground'>
											{user?.role === "ADMIN"
												? "Add, remove, or edit team members"
												: "View your team members and their roles"}
										</span>
									</Button>
								</Link>
								<Link href='/home/public-api'>
									<Button
										variant='outline'
										className='h-auto p-4 flex flex-col items-center gap-2 w-full'>
										<FileText className='w-5 h-5' />
										<span>API Documentation</span>
										<span className='text-xs text-muted-foreground'>
											View and manage API tokens
										</span>
									</Button>
								</Link>
								<Link href='/home/settings'>
									<Button
										variant='outline'
										className='h-auto p-4 flex flex-col items-center gap-2 w-full'>
										<Settings className='w-5 h-5' />
										<span>Settings</span>
										<span className='text-xs text-muted-foreground'>
											Configure account preferences
										</span>
									</Button>
								</Link>
								{user?.role === "ADMIN" && (
									<Link href='/home/tenant'>
										<Button
											variant='outline'
											className='h-auto p-4 flex flex-col items-center gap-2 w-full'>
											<ExternalLink className='w-5 h-5' />
											<span>Organization</span>
											<span className='text-xs text-muted-foreground'>
												Manage organization settings
											</span>
										</Button>
									</Link>
								)}
							</div>
						</CardContent>
					</Card>
				</div>
			</div>
		</div>
	);
}

export default DashboardPage;
