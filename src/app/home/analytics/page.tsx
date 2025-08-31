/** @format */

"use client";

import React, { Suspense, lazy } from "react";
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
} from "lucide-react";
import { useDashboardData } from "@/hooks/useDashboardData";
import { Button } from "@/components/ui/button";
import Link from "next/link";
import { useApp } from "@/contexts/AppContext";
import { useLanguage } from "@/contexts/LanguageContext";
import TourProv from "@/contexts/TourProvider";
import { useTour } from "@reactour/tour";
import { useEffect } from "react";
import { tourUtils } from "@/lib/tour-config";
import PerformanceOptimizer from "@/components/PerformanceOptimizer";

// Lazy load heavy components to improve initial FCP
const DashboardStats = lazy(() => import("@/components/dashboard/DashboardStats"));
const DatabaseChart = lazy(() => import("@/components/dashboard/DatabaseChart"));
const UserActivityChart = lazy(() => import("@/components/dashboard/UserActivityChart"));
const DataUsageChart = lazy(() => import("@/components/dashboard/DataUsageChart"));

// Optimized loading skeleton component
const DashboardSkeleton = () => (
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
				{/* Stats Loading - Optimized grid */}
				<div className='grid grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-4 sm:gap-6'>
					{[1, 2, 3, 4, 5, 6].map((i) => (
						<Card key={i} className='dashboard-card'>
							<CardHeader className='flex flex-row items-center justify-between space-y-0 pb-2'>
								<Skeleton className='h-4 w-20 sm:w-24' />
								<Skeleton className='h-4 w-4' />
							</CardHeader>
							<CardContent>
								<Skeleton className='h-6 sm:h-8 w-12 sm:w-16 mb-2' />
								<Skeleton className='h-3 w-16 sm:w-20' />
							</CardContent>
						</Card>
					))}
				</div>

				{/* Charts Loading - Simplified */}
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

				{/* Quick Actions Loading */}
				<div className='grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6 lg:gap-8'>
					{[1, 2, 3, 4].map((i) => (
						<Card key={i} className='hover:shadow-md transition-shadow'>
							<CardContent className='p-4'>
								<div className='flex items-center gap-3'>
									<Skeleton className='w-8 h-8 rounded' />
									<div className='flex-1'>
										<Skeleton className='h-4 w-24 mb-2' />
										<Skeleton className='h-3 w-32' />
									</div>
								</div>
							</CardContent>
						</Card>
					))}
				</div>
			</div>
		</div>
	</div>
);

// Quick Actions component - extracted for better performance
const QuickActions = ({ t }: { t: any }) => (
	<div className='grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6 lg:gap-8'>
		<Card className='hover:shadow-md transition-shadow cursor-pointer'>
			<CardContent className='p-4'>
				<Link href='/home/database' className='flex items-center gap-3'>
					<div className='w-12 h-12 bg-green-500/10 rounded-xl flex items-center justify-center'>
						<Database className='w-6 h-6 text-green-600' />
					</div>
					<div>
						<h3 className='font-semibold text-foreground'>Database Management</h3>
						<p className='text-sm text-muted-foreground'>Create and manage your data tables</p>
					</div>
				</Link>
			</CardContent>
		</Card>

		<Card className='hover:shadow-md transition-shadow cursor-pointer'>
			<CardContent className='p-4'>
				<Link href='/home/users' className='flex items-center gap-3'>
					<Users className='w-8 h-8 text-green-600' />
					<div>
						<h3 className='font-semibold text-foreground'>
							{t("dashboard.quickActions.users")}
						</h3>
						<p className='text-sm text-muted-foreground'>
							{t("dashboard.quickActions.usersDesc")}
						</p>
					</div>
				</Link>
			</CardContent>
		</Card>

		<Card className='hover:shadow-md transition-shadow cursor-pointer'>
			<CardContent className='p-4'>
				<Link href='/home/settings' className='flex items-center gap-3'>
					<Settings className='w-8 h-8 text-orange-600' />
					<div>
						<h3 className='font-semibold text-foreground'>
							{t("dashboard.quickActions.settings")}
						</h3>
						<p className='text-sm text-muted-foreground'>
							{t("dashboard.quickActions.settingsDesc")}
						</p>
					</div>
				</Link>
			</CardContent>
		</Card>
	</div>
);

function DashboardPage() {
	const { data: session } = useSession();
	const { data, loading, error } = useDashboardData();
	const { user } = useApp();
	const { t } = useLanguage();
	const { setIsOpen, setCurrentStep } = useTour();

	const startTour = () => {
		setCurrentStep(0);
		setIsOpen(true);
	};

	useEffect(() => {
		const hasSeenTour = tourUtils.isTourSeen("dashboard");
		if (!hasSeenTour && !loading && data) {
			// Start tour after data is loaded with reduced delay
			const timer = setTimeout(() => {
				startTour();
			}, 1000); // Reduced from 1500ms

			return () => clearTimeout(timer);
		}
	}, [loading, data]);

	if (!session) return null;

	if (loading) {
		return <DashboardSkeleton />;
	}

	if (error) {
		return (
			<div className='h-full bg-background'>
				<div className='max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8'>
					<Alert variant='destructive'>
						<AlertCircle className='h-4 w-4' />
						<AlertDescription>{t("dashboard.error")}</AlertDescription>
					</Alert>
				</div>
			</div>
		);
	}

	return (
		<PerformanceOptimizer preloadFonts={true} preloadCriticalCSS={true}>
			<TourProv
				steps={tourUtils.getDashboardTourSteps(true)}
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
										{t("dashboard.title")}
									</h1>
									<p className='text-xs sm:text-sm text-muted-foreground truncate'>
										{t("dashboard.subtitle")}
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
									{t("dashboard.refresh")}
								</Button>
							</div>
						</div>
					</div>

					{/* Main Content */}
					<div className='p-4 sm:p-6 max-w-[1400px] mx-auto'>
						<div className='space-y-6 sm:space-y-8'>
							{/* Stats Cards - Lazy loaded */}
							{data?.stats && (
								<div className='dashboard-stats grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-4 sm:gap-6 lg:gap-8'>
									<Suspense fallback={
										<div className='col-span-full grid grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-4 sm:gap-6'>
											{[1, 2, 3, 4, 5, 6].map((i) => (
												<Card key={i} className='dashboard-card'>
													<CardHeader className='flex flex-row items-center justify-between space-y-0 pb-2'>
														<Skeleton className='h-4 w-20 sm:w-24' />
														<Skeleton className='h-4 w-4' />
													</CardHeader>
													<CardContent>
														<Skeleton className='h-6 sm:h-8 w-12 sm:w-16 mb-2' />
														<Skeleton className='h-3 w-16 sm:w-20' />
													</CardContent>
												</Card>
											))}
										</div>
									}>
										<DashboardStats stats={data.stats} />
									</Suspense>
								</div>
							)}

							{/* Charts - Lazy loaded with Suspense */}
							<div className='grid grid-cols-1 lg:grid-cols-2 gap-4 sm:gap-6 lg:gap-8'>
								{data?.usageData && (
									<Card className='usage-chart'>
										<CardHeader>
											<CardTitle className='flex items-center gap-2'>
												<BarChart3 className='w-5 h-5' />
												{t("dashboard.dataUsage")}
											</CardTitle>
										</CardHeader>
										<CardContent>
											<Suspense fallback={<Skeleton className='h-64 w-full' />}>
												<DataUsageChart data={data.usageData} />
											</Suspense>
										</CardContent>
									</Card>
								)}

								{data?.userData && (
									<Card className='activity-chart'>
										<CardHeader>
											<CardTitle className='flex items-center gap-2'>
												<Activity className='w-5 h-5' />
												{t("dashboard.userActivity")}
											</CardTitle>
										</CardHeader>
										<CardContent>
											<Suspense fallback={<Skeleton className='h-64 w-full' />}>
												<UserActivityChart data={data.userData} />
											</Suspense>
										</CardContent>
									</Card>
								)}
							</div>

							{/* Quick Actions - Inline component for better performance */}
							<QuickActions t={t} />
						</div>
					</div>
				</div>
			</TourProv>
		</PerformanceOptimizer>
	);
}

export default DashboardPage;
