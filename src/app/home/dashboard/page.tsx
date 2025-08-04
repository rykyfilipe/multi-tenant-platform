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
} from "lucide-react";
import { useDashboardData } from "@/hooks/useDashboardData";
import DashboardStats from "@/components/dashboard/DashboardStats";
import DatabaseChart from "@/components/dashboard/DatabaseChart";
import UserActivityChart from "@/components/dashboard/UserActivityChart";
import DataUsageChart from "@/components/dashboard/DataUsageChart";

function DashboardPage() {
	const { data: session } = useSession();
	const { data, loading, error } = useDashboardData();

	if (!session) return null;

	if (loading) {
		return (
			<div className='h-full bg-background'>
				{/* Header */}
				<div className='border-b border-border/20 bg-background/80 backdrop-blur-sm sticky top-0 z-50'>
					<div className='flex items-center justify-between px-6 py-4'>
						<div className='flex items-center space-x-4'>
							<div>
								<h1 className='text-xl font-semibold text-foreground'>
									Dashboard
								</h1>
								<p className='text-sm text-muted-foreground'>
									Overview of your data and usage statistics
								</p>
							</div>
						</div>
						<div className='flex items-center space-x-3'>
							<RefreshCw className='w-4 h-4 animate-spin text-muted-foreground' />
							<span className='text-sm text-muted-foreground'>Loading...</span>
						</div>
					</div>
				</div>

				{/* Loading Content */}
				<div className='p-6 max-w-7xl mx-auto'>
					<div className='space-y-6'>
						{/* Stats Loading */}
						<div className='grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6'>
							{[1, 2, 3, 4].map((i) => (
								<Card key={i} className='dashboard-card'>
									<CardHeader className='flex flex-row items-center justify-between space-y-0 pb-2'>
										<Skeleton className='h-4 w-32' />
										<Skeleton className='h-4 w-4' />
									</CardHeader>
									<CardContent>
										<Skeleton className='h-8 w-16 mb-2' />
										<Skeleton className='h-3 w-24' />
									</CardContent>
								</Card>
							))}
						</div>

						{/* Charts Loading */}
						<div className='grid grid-cols-1 lg:grid-cols-2 gap-6'>
							{[1, 2].map((i) => (
								<Card key={i} className='dashboard-card'>
									<CardHeader>
										<Skeleton className='h-6 w-40' />
									</CardHeader>
									<CardContent className='space-y-4'>
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
					<div className='flex items-center justify-between px-6 py-4'>
						<div className='flex items-center space-x-4'>
							<div>
								<h1 className='text-xl font-semibold text-foreground'>
									Dashboard
								</h1>
								<p className='text-sm text-muted-foreground'>
									Overview of your data and usage statistics
								</p>
							</div>
						</div>
					</div>
				</div>

				{/* Error Content */}
				<div className='p-6 max-w-7xl mx-auto'>
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
					<div className='flex items-center justify-between px-6 py-4'>
						<div className='flex items-center space-x-4'>
							<div>
								<h1 className='text-xl font-semibold text-foreground'>
									Dashboard
								</h1>
								<p className='text-sm text-muted-foreground'>
									Overview of your data and usage statistics
								</p>
							</div>
						</div>
					</div>
				</div>

				<div className='p-6 max-w-7xl mx-auto'>
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
				<div className='flex items-center justify-between px-6 py-4'>
					<div className='flex items-center space-x-4'>
						<div>
							<h1 className='text-xl font-semibold text-foreground'>
								Dashboard
							</h1>
							<p className='text-sm text-muted-foreground'>
								Overview of your data and usage statistics
							</p>
						</div>
					</div>
					<div className='flex items-center space-x-3'>
						<div className='w-2 h-2 rounded-full bg-green-500 animate-pulse'></div>
						<span className='text-sm text-muted-foreground'>Live Data</span>
					</div>
				</div>
			</div>

			{/* Main Content */}
			<div className='p-6 max-w-7xl mx-auto'>
				<div className='space-y-6'>
					{/* Stats Overview */}
					<DashboardStats stats={data.stats} />

					{/* Charts Grid */}
					<div className='grid grid-cols-1 lg:grid-cols-2 gap-6'>
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
							<CardTitle className='flex items-center gap-2'>
								<Activity className='h-5 w-5' />
								Quick Actions
							</CardTitle>
						</CardHeader>
						<CardContent>
							<div className='grid grid-cols-1 md:grid-cols-3 gap-4'>
								<a
									href='/home/database'
									className='p-4 rounded-lg bg-card/50 border border-border/20 hover:bg-card/70 transition-colors cursor-pointer'>
									<div className='flex items-center gap-3'>
										<Database className='h-5 w-5 text-primary' />
										<div>
											<p className='font-medium'>Manage Databases</p>
											<p className='text-sm text-muted-foreground'>
												Create and manage your databases
											</p>
										</div>
									</div>
								</a>

								<a
									href='/home/users'
									className='p-4 rounded-lg bg-card/50 border border-border/20 hover:bg-card/70 transition-colors cursor-pointer'>
									<div className='flex items-center gap-3'>
										<Users className='h-5 w-5 text-primary' />
										<div>
											<p className='font-medium'>Manage Users</p>
											<p className='text-sm text-muted-foreground'>
												Add and manage team members
											</p>
										</div>
									</div>
								</a>

								<a
									href='/home/settings'
									className='p-4 rounded-lg bg-card/50 border border-border/20 hover:bg-card/70 transition-colors cursor-pointer'>
									<div className='flex items-center gap-3'>
										<BarChart3 className='h-5 w-5 text-primary' />
										<div>
											<p className='font-medium'>View Analytics</p>
											<p className='text-sm text-muted-foreground'>
												Detailed usage analytics
											</p>
										</div>
									</div>
								</a>
							</div>
						</CardContent>
					</Card>
				</div>
			</div>
		</div>
	);
}

export default DashboardPage;
