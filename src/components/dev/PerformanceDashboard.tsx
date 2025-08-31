/** @format */

"use client";

import { useState, useEffect, useCallback, memo } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { performanceMonitor } from "@/lib/performance-monitor";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Progress } from "@/components/ui/progress";

interface PerformanceStats {
	timeWindow: number;
	api: {
		totalRequests: number;
		averageResponseTime: number;
		slowRequests: number;
		cacheHitRate: number;
		errorRate: number;
		byPath: Record<
			string,
			{ count: number; averageTime: number; totalTime: number }
		>;
	};
	database: {
		totalQueries: number;
		averageQueryTime: number;
		slowQueries: number;
		byQuery: Record<
			string,
			{ count: number; averageTime: number; totalTime: number }
		>;
	};
	rendering: {
		totalRenders: number;
		averageRenderTime: number;
		slowRenders: number;
		byComponent: Record<
			string,
			{ count: number; averageTime: number; totalTime: number }
		>;
	};
	totalMetrics: number;
}

interface SlowOperations {
	slowAPIs: any[];
	slowQueries: any[];
	slowRenders: any[];
}

export const PerformanceDashboard = memo(function PerformanceDashboard() {
	const [stats, setStats] = useState<PerformanceStats | null>(null);
	const [slowOps, setSlowOps] = useState<SlowOperations | null>(null);
	const [isVisible, setIsVisible] = useState(false);
	const [refreshInterval, setRefreshInterval] = useState(5000);

	// Only show in development
	const isDev = process.env.NODE_ENV === "development";

	useEffect(() => {
		if (!isDev) return;

		const updateStats = () => {
			const currentStats = performanceMonitor.getStats();
			const currentSlowOps = performanceMonitor.getSlowOperations();
			setStats(currentStats);
			setSlowOps(currentSlowOps);
		};

		updateStats();
		const interval = setInterval(updateStats, refreshInterval);

		return () => clearInterval(interval);
	}, [isDev, refreshInterval]);

	// Generate test data for development
	const generateTestData = () => {
		// Simulate some API calls
		for (let i = 0; i < 5; i++) {
			performanceMonitor.trackAPIRequest(
				'GET',
				`/api/test/${i}`,
				Date.now() - Math.random() * 1000,
				200,
				Math.floor(Math.random() * 1000),
				Math.random() > 0.5,
				{ test: true }
			);
		}

		// Simulate some database queries
		for (let i = 0; i < 3; i++) {
			performanceMonitor.trackDatabaseQuery(
				`test_query_${i}`,
				Date.now() - Math.random() * 500,
				{ test: true }
			);
		}

		// Simulate some component renders
		for (let i = 0; i < 4; i++) {
			performanceMonitor.trackComponentRender(
				`TestComponent_${i}`,
				performance.now() - Math.random() * 100,
				{ test: true }
			);
		}

		// Update stats immediately
		setTimeout(() => {
			const currentStats = performanceMonitor.getStats();
			const currentSlowOps = performanceMonitor.getSlowOperations();
			setStats(currentStats);
			setSlowOps(currentSlowOps);
		}, 100);
	};

	if (!isDev || !isVisible || !stats) {
		return isDev ? (
			<div className='fixed bottom-4 right-4 z-50'>
				<Button
					onClick={() => setIsVisible(true)}
					variant='outline'
					size='sm'
					className='bg-background/80 backdrop-blur-sm'>
					📊 Performance
				</Button>
			</div>
		) : null;
	}

	const formatTime = (ms: number) => `${ms.toFixed(1)}ms`;
	const formatPercent = (ratio: number) => `${(ratio * 100).toFixed(1)}%`;

	return (
		<div className='fixed inset-0 z-50 bg-background/80 backdrop-blur-sm p-4 overflow-auto'>
			<div className='max-w-6xl mx-auto'>
				<div className='flex justify-between items-center mb-6'>
					<h2 className='text-2xl font-bold'>Performance Dashboard</h2>
					<div className='flex gap-2'>
						<Button
							variant='outline'
							size='sm'
							onClick={generateTestData}>
							🧪 Generate Test Data
						</Button>
						<Button
							variant='outline'
							size='sm'
							onClick={() => performanceMonitor.clear()}>
							Clear Metrics
						</Button>
						<Button
							variant='outline'
							size='sm'
							onClick={() => setIsVisible(false)}>
							Close
						</Button>
					</div>
				</div>

				{/* Debug Info */}
				<div className='mb-4 p-4 bg-muted rounded-lg'>
					<div className='text-sm text-muted-foreground'>
						<strong>Debug Info:</strong> Total Metrics: {stats.totalMetrics} | 
						Time Window: {stats.timeWindow / 1000}s | 
						Last Updated: {new Date().toLocaleTimeString()}
					</div>
				</div>

				<Tabs defaultValue='overview' className='space-y-4'>
					<TabsList className='grid w-full grid-cols-4'>
						<TabsTrigger value='overview'>Overview</TabsTrigger>
						<TabsTrigger value='api'>API Performance</TabsTrigger>
						<TabsTrigger value='database'>Database</TabsTrigger>
						<TabsTrigger value='rendering'>Rendering</TabsTrigger>
					</TabsList>

					<TabsContent value='overview' className='space-y-4'>
						<div className='grid grid-cols-1 md:grid-cols-3 gap-4'>
							<Card>
								<CardHeader className='pb-2'>
									<CardTitle className='text-sm'>API Performance</CardTitle>
								</CardHeader>
								<CardContent>
									<div className='space-y-2'>
										<div className='text-2xl font-bold'>
											{stats.api.totalRequests}
										</div>
										<div className='text-sm text-muted-foreground'>
											Total Requests
										</div>
										<div className='text-sm'>
											Avg: {formatTime(stats.api.averageResponseTime)}
										</div>
										<div className='flex items-center gap-2'>
											<Badge
												variant={
													stats.api.slowRequests > 0
														? "destructive"
														: "secondary"
												}>
												{stats.api.slowRequests} slow
											</Badge>
											<Badge variant='outline'>
												{formatPercent(stats.api.cacheHitRate)} cached
											</Badge>
										</div>
									</div>
								</CardContent>
							</Card>

							<Card>
								<CardHeader className='pb-2'>
									<CardTitle className='text-sm'>Database Queries</CardTitle>
								</CardHeader>
								<CardContent>
									<div className='space-y-2'>
										<div className='text-2xl font-bold'>
											{stats.database.totalQueries}
										</div>
										<div className='text-sm text-muted-foreground'>
											Total Queries
										</div>
										<div className='text-sm'>
											Avg: {formatTime(stats.database.averageQueryTime)}
										</div>
										<Badge
											variant={
												stats.database.slowQueries > 0
													? "destructive"
													: "secondary"
											}>
											{stats.database.slowQueries} slow
										</Badge>
									</div>
								</CardContent>
							</Card>

							<Card>
								<CardHeader className='pb-2'>
									<CardTitle className='text-sm'>Component Renders</CardTitle>
								</CardHeader>
								<CardContent>
									<div className='space-y-2'>
										<div className='text-2xl font-bold'>
											{stats.rendering.totalRenders}
										</div>
										<div className='text-sm text-muted-foreground'>
											Total Renders
										</div>
										<div className='text-sm'>
											Avg: {formatTime(stats.rendering.averageRenderTime)}
										</div>
										<Badge
											variant={
												stats.rendering.slowRenders > 0
													? "destructive"
													: "secondary"
											}>
											{stats.rendering.slowRenders} slow
										</Badge>
									</div>
								</CardContent>
							</Card>
						</div>

						{/* Cache Hit Rate Progress */}
						<Card>
							<CardHeader className='pb-2'>
								<CardTitle className='text-sm'>Cache Performance</CardTitle>
							</CardHeader>
							<CardContent>
								<div className='space-y-2'>
									<div className='flex justify-between text-sm'>
										<span>Hit Rate</span>
										<span>{formatPercent(stats.api.cacheHitRate)}</span>
									</div>
									<Progress
										value={stats.api.cacheHitRate * 100}
										className='w-full'
									/>
								</div>
							</CardContent>
						</Card>
					</TabsContent>

					<TabsContent value='api' className='space-y-4'>
						<Card>
							<CardHeader>
								<CardTitle>API Endpoints</CardTitle>
							</CardHeader>
							<CardContent>
								<div className='space-y-2'>
									{Object.entries(stats.api.byPath).map(([path, data]) => (
										<div
											key={path}
											className='flex items-center justify-between p-2 border rounded'>
											<div className='flex-1'>
												<div className='font-mono text-sm'>{path}</div>
												<div className='text-xs text-muted-foreground'>
													{data.count} requests
												</div>
											</div>
											<div className='text-right'>
												<div className='text-sm font-medium'>
													{formatTime(data.averageTime)}
												</div>
												<div className='text-xs text-muted-foreground'>avg</div>
											</div>
										</div>
									))}
								</div>
							</CardContent>
						</Card>

						{slowOps?.slowAPIs && slowOps.slowAPIs.length > 0 && (
							<Card>
								<CardHeader>
									<CardTitle>Slowest API Calls</CardTitle>
								</CardHeader>
								<CardContent>
									<div className='space-y-2'>
										{slowOps.slowAPIs.map((api, index) => (
											<div
												key={index}
												className='flex items-center justify-between p-2 border rounded'>
												<div>
													<div className='font-mono text-sm'>
														{api.method} {api.path}
													</div>
													<div className='text-xs text-muted-foreground'>
														{new Date(api.timestamp).toLocaleTimeString()}
													</div>
												</div>
												<Badge variant='destructive'>
													{formatTime(api.duration)}
												</Badge>
											</div>
										))}
									</div>
								</CardContent>
							</Card>
						)}
					</TabsContent>

					<TabsContent value='database' className='space-y-4'>
						<Card>
							<CardHeader>
								<CardTitle>Database Queries</CardTitle>
							</CardHeader>
							<CardContent>
								<div className='space-y-2'>
									{Object.entries(stats.database.byQuery).map(
										([query, data]) => (
											<div
												key={query}
												className='flex items-center justify-between p-2 border rounded'>
												<div className='flex-1'>
													<div className='font-mono text-sm'>
														{query.replace("DB_", "")}
													</div>
													<div className='text-xs text-muted-foreground'>
														{data.count} executions
													</div>
												</div>
												<div className='text-right'>
													<div className='text-sm font-medium'>
														{formatTime(data.averageTime)}
													</div>
													<div className='text-xs text-muted-foreground'>
														avg
													</div>
												</div>
											</div>
										),
									)}
								</div>
							</CardContent>
						</Card>
					</TabsContent>

					<TabsContent value='rendering' className='space-y-4'>
						<Card>
							<CardHeader>
								<CardTitle>Component Performance</CardTitle>
							</CardHeader>
							<CardContent>
								<div className='space-y-2'>
									{Object.entries(stats.rendering.byComponent).map(
										([component, data]) => (
											<div
												key={component}
												className='flex items-center justify-between p-2 border rounded'>
												<div className='flex-1'>
													<div className='text-sm'>
														{component.replace("RENDER_", "")}
													</div>
													<div className='text-xs text-muted-foreground'>
														{data.count} renders
													</div>
												</div>
												<div className='text-right'>
													<div className='text-sm font-medium'>
														{formatTime(data.averageTime)}
													</div>
													<div className='text-xs text-muted-foreground'>
														avg
													</div>
												</div>
											</div>
										),
									)}
								</div>
							</CardContent>
						</Card>
					</TabsContent>
				</Tabs>
			</div>
		</div>
	);
});
