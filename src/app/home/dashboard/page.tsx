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
	ExternalLink,
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
const DashboardStats = lazy(
	() => import("@/components/dashboard/DashboardStats"),
);
const DatabaseChart = lazy(
	() => import("@/components/dashboard/DatabaseChart"),
);
const UserActivityChart = lazy(
	() => import("@/components/dashboard/UserActivityChart"),
);
const DataUsageChart = lazy(
	() => import("@/components/dashboard/DataUsageChart"),
);

// Optimized loading skeleton component
const DashboardSkeleton = () => (
	<div className='h-full premium-gradient-bg'>
		{/* Header */}
		<div className='border-b border-border/20 bg-background/80 backdrop-blur-sm sticky top-0 z-50'>
			<div className='flex flex-col sm:flex-row sm:items-center sm:justify-between premium-padding-md gap-3'>
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
		<div className='premium-container'>
			<div className='premium-spacing-xl'>
				{/* Stats Loading - Optimized grid */}
				<div className='premium-grid-6'>
					{[1, 2, 3, 4, 5, 6].map((i) => (
						<Card key={i} className='dashboard-card professional-card'>
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
				<div className='premium-grid-2'>
					{[1, 2].map((i) => (
						<Card key={i} className='dashboard-card professional-card'>
							<CardHeader className='premium-padding-md'>
								<Skeleton className='h-5 sm:h-6 w-32 sm:w-40' />
							</CardHeader>
							<CardContent className='premium-padding-md pt-0 premium-spacing-md'>
								<Skeleton className='h-4 w-full' />
								<Skeleton className='h-4 w-3/4' />
								<Skeleton className='h-4 w-1/2' />
							</CardContent>
						</Card>
					))}
				</div>

				{/* Quick Actions Loading */}
				<div className='premium-grid-4'>
					{[1, 2, 3, 4].map((i) => (
						<Card key={i} className='professional-card premium-hover'>
							<CardContent className='premium-padding-md'>
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
	<div className='premium-grid-4'>
		<Card className='professional-card premium-hover cursor-pointer premium-interaction'>
			<CardContent className='premium-padding-md'>
				<Link href='/home/database' className='flex items-center gap-3'>
					<div className='w-12 h-12 bg-green-500/10 rounded-xl flex items-center justify-center premium-hover-subtle'>
						<Database className='w-6 h-6 text-green-600' />
					</div>
					<div>
						<h3 className='font-semibold text-foreground'>
							Database Management
						</h3>
						<p className='text-sm text-muted-foreground'>
							Create and manage your data tables
						</p>
					</div>
				</Link>
			</CardContent>
		</Card>

		<Card className='professional-card premium-hover cursor-pointer premium-interaction'>
			<CardContent className='premium-padding-md'>
				<Link href='/home/users' className='flex items-center gap-3'>
					<div className='w-12 h-12 bg-green-500/10 rounded-xl flex items-center justify-center premium-hover-subtle'>
						<Users className='w-6 h-6 text-green-600' />
					</div>
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

		<Card className='professional-card premium-hover cursor-pointer premium-interaction'>
			<CardContent className='premium-padding-md'>
				<Link href='/home/settings' className='flex items-center gap-3'>
					<div className='w-12 h-12 bg-orange-500/10 rounded-xl flex items-center justify-center premium-hover-subtle'>
						<Settings className='w-6 h-6 text-orange-600' />
					</div>
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

		<Card className='professional-card premium-hover cursor-pointer premium-interaction'>
			<CardContent className='premium-padding-md'>
				<Link href='/home/analytics' className='flex items-center gap-3'>
					<div className='w-12 h-12 bg-blue-500/10 rounded-xl flex items-center justify-center premium-hover-subtle'>
						<BarChart3 className='w-6 h-6 text-blue-600' />
					</div>
					<div>
						<h3 className='font-semibold text-foreground'>Analytics</h3>
						<p className='text-sm text-muted-foreground'>
							View detailed analytics and reports
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
			<div className='h-full premium-gradient-bg'>
				<div className='premium-container premium-padding-xl'>
					<Alert variant='destructive' className='professional-card'>
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
				<div className='h-full premium-gradient-bg'>
					{/* Header */}
					<div className='border-b border-border/20 bg-background/80 backdrop-blur-sm sticky top-0 z-50'>
						<div className='flex flex-col sm:flex-row sm:items-center sm:justify-between premium-padding-md gap-3'>
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
									className='text-xs sm:text-sm premium-hover-subtle'>
									<RefreshCw className='w-3 h-3 sm:w-4 sm:h-4 mr-1 sm:mr-2' />
									{t("dashboard.refresh")}
								</Button>
							</div>
						</div>
					</div>

					{/* Main Content */}
					<div className='premium-container'>
						<div className='premium-spacing-xl'>
							{/* Stats Cards - Lazy loaded */}
							{data?.stats && (
								<div className='dashboard-stats premium-grid-6'>
									<Suspense
										fallback={
											<div className='col-span-full premium-grid-6'>
												{[1, 2, 3, 4, 5, 6].map((i) => (
													<Card
														key={i}
														className='dashboard-card professional-card'>
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
							<div className='premium-grid-2'>
								{data?.usageData && (
									<Card className='usage-chart professional-card premium-hover'>
										<CardHeader className='premium-padding-md'>
											<CardTitle className='flex items-center gap-2'>
												<BarChart3 className='w-5 h-5' />
												{t("dashboard.dataUsage")}
											</CardTitle>
										</CardHeader>
										<CardContent className='premium-padding-md pt-0'>
											<Suspense fallback={<Skeleton className='h-64 w-full' />}>
												<DataUsageChart data={data.usageData} />
											</Suspense>
										</CardContent>
									</Card>
								)}

								{data?.userData && (
									<Card className='activity-chart professional-card premium-hover'>
										<CardHeader className='premium-padding-md'>
											<CardTitle className='flex items-center gap-2'>
												<Activity className='w-5 h-5' />
												{t("dashboard.userActivity")}
											</CardTitle>
										</CardHeader>
										<CardContent className='premium-padding-md pt-0'>
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
