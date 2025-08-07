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
import TourProv from "@/contexts/TourProvider";
import { useTour } from "@reactour/tour";
import { useEffect } from "react";
import { tourUtils } from "@/lib/tour-config";

function DashboardPage() {
	const { data: session } = useSession();
	const { data, loading, error } = useDashboardData();
	const { user } = useApp();
	const { setIsOpen, setCurrentStep } = useTour();

	const startTour = () => {
		setCurrentStep(0);
		setIsOpen(true);
	};

	useEffect(() => {
		const hasSeenTour = tourUtils.isTourSeen("dashboard");
		if (!hasSeenTour && !loading && data) {
			// Start tour after data is loaded
			const timer = setTimeout(() => {
				startTour();
			}, 1500);

			return () => clearTimeout(timer);
		}
	}, [loading, data]);

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
				<div className='max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8'>
					<Alert variant='destructive'>
						<AlertCircle className='h-4 w-4' />
						<AlertDescription>
							Failed to load dashboard data. Please refresh the page.
						</AlertDescription>
					</Alert>
				</div>
			</div>
		);
	}

	return (
		<TourProv
			steps={tourUtils.getDashboardTourSteps(true)} // Always show charts for now
			onTourComplete={() => {
				tourUtils.markTourSeen("dashboard");
			}}
			onTourSkip={() => {
				tourUtils.markTourSeen("dashboard");
			}}>
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
							<Button
								variant='outline'
								size='sm'
								onClick={() => window.location.reload()}
								className='text-xs sm:text-sm'>
								<RefreshCw className='w-3 h-3 sm:w-4 sm:h-4 mr-1 sm:mr-2' />
								Refresh
							</Button>
						</div>
					</div>
				</div>

				{/* Main Content */}
				<div className='p-4 sm:p-6 max-w-[1400px] mx-auto'>
					<div className='space-y-6 sm:space-y-8'>
						{/* Stats Cards */}
						{data?.stats && (
							<div className='dashboard-stats grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-4 sm:gap-6 lg:gap-8'>
								<DashboardStats stats={data.stats} />
							</div>
						)}

						{/* Charts */}
						<div className='grid grid-cols-1 lg:grid-cols-2 gap-4 sm:gap-6 lg:gap-8'>
							{data?.usageData && (
								<Card className='usage-chart'>
									<CardHeader>
										<CardTitle className='flex items-center gap-2'>
											<BarChart3 className='w-5 h-5' />
											Data Usage
										</CardTitle>
									</CardHeader>
									<CardContent>
										<DataUsageChart data={data.usageData} />
									</CardContent>
								</Card>
							)}

							{data?.userData && (
								<Card className='activity-chart'>
									<CardHeader>
										<CardTitle className='flex items-center gap-2'>
											<Activity className='w-5 h-5' />
											User Activity
										</CardTitle>
									</CardHeader>
									<CardContent>
										<UserActivityChart data={data.userData} />
									</CardContent>
								</Card>
							)}
						</div>

						{/* Quick Actions */}
						<div className='grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6 lg:gap-8'>
							<Card className='hover:shadow-md transition-shadow cursor-pointer'>
								<CardContent className='p-4'>
									<Link
										href='/home/database'
										className='flex items-center gap-3'>
										<Database className='w-8 h-8 text-blue-600' />
										<div>
											<h3 className='font-semibold text-foreground'>
												Database
											</h3>
											<p className='text-sm text-muted-foreground'>
												Manage tables & data
											</p>
										</div>
									</Link>
								</CardContent>
							</Card>

							<Card className='hover:shadow-md transition-shadow cursor-pointer'>
								<CardContent className='p-4'>
									<Link href='/home/users' className='flex items-center gap-3'>
										<Users className='w-8 h-8 text-green-600' />
										<div>
											<h3 className='font-semibold text-foreground'>Users</h3>
											<p className='text-sm text-muted-foreground'>
												Team management
											</p>
										</div>
									</Link>
								</CardContent>
							</Card>

							<Card className='hover:shadow-md transition-shadow cursor-pointer'>
								<CardContent className='p-4'>
									<Link
										href='/home/public-api'
										className='flex items-center gap-3'>
										<FileText className='w-8 h-8 text-purple-600' />
										<div>
											<h3 className='font-semibold text-foreground'>API</h3>
											<p className='text-sm text-muted-foreground'>
												Tokens & docs
											</p>
										</div>
									</Link>
								</CardContent>
							</Card>

							<Card className='hover:shadow-md transition-shadow cursor-pointer'>
								<CardContent className='p-4'>
									<Link
										href='/home/settings'
										className='flex items-center gap-3'>
										<Settings className='w-8 h-8 text-orange-600' />
										<div>
											<h3 className='font-semibold text-foreground'>
												Settings
											</h3>
											<p className='text-sm text-muted-foreground'>
												Account & billing
											</p>
										</div>
									</Link>
								</CardContent>
							</Card>
						</div>
					</div>
				</div>
			</div>
		</TourProv>
	);
}

export default DashboardPage;
