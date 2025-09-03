/** @format */

import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import prisma from "@/lib/prisma";

export async function GET(
	request: NextRequest,
	{ params }: { params: Promise<{ tenantId: string }> },
) {
	try {
		const session = await getServerSession(authOptions);
		if (!session?.user?.id) {
			return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
		}

		const { tenantId } = await params;
		const { searchParams } = new URL(request.url);
		const period = searchParams.get("period") || "7d";
		const metric = searchParams.get("metric") || "all";

		// Calculate date range based on period
		const now = new Date();
		const startDate = new Date();

		switch (period) {
			case "1d":
				startDate.setDate(now.getDate() - 1);
				break;
			case "7d":
				startDate.setDate(now.getDate() - 7);
				break;
			case "30d":
				startDate.setDate(now.getDate() - 30);
				break;
			case "90d":
				startDate.setDate(now.getDate() - 90);
				break;
			default:
				startDate.setDate(now.getDate() - 7);
		}

		// Get user activity data
		const userActivity = await prisma.userActivity.findMany({
			where: {
				tenantId: parseInt(tenantId),
				createdAt: {
					gte: startDate,
					lte: now,
				},
			},
			select: {
				createdAt: true,
				action: true,
				userId: true,
				metadata: true,
			},
			orderBy: {
				createdAt: "asc",
			},
		});

		// Get database activity data
		const databaseActivity = await prisma.databaseActivity.findMany({
			where: {
				tenantId: parseInt(tenantId),
				createdAt: {
					gte: startDate,
					lte: now,
				},
			},
			select: {
				createdAt: true,
				action: true,
				databaseId: true,
				metadata: true,
			},
			orderBy: {
				createdAt: "asc",
			},
		});

		// Get system performance data
		const systemMetrics = await prisma.systemMetrics.findMany({
			where: {
				tenantId: parseInt(tenantId),
				createdAt: {
					gte: startDate,
					lte: now,
				},
			},
			select: {
				createdAt: true,
				cpuUsage: true,
				memoryUsage: true,
				diskUsage: true,
				networkLatency: true,
				errorRate: true,
			},
			orderBy: {
				createdAt: "asc",
			},
		});

		// Process data based on requested metric
		let processedData = {};

		switch (metric) {
			case "user_activity":
				processedData = processUserActivityData(userActivity, period);
				break;
			case "database_activity":
				processedData = processDatabaseActivityData(databaseActivity, period);
				break;
			case "system_performance":
				processedData = processSystemPerformanceData(systemMetrics, period);
				break;
			case "all":
			default:
				processedData = {
					userActivity: processUserActivityData(userActivity, period),
					databaseActivity: processDatabaseActivityData(
						databaseActivity,
						period,
					),
					systemPerformance: processSystemPerformanceData(
						systemMetrics,
						period,
					),
					summary: generateSummaryStats(
						userActivity,
						databaseActivity,
						systemMetrics,
					),
				};
		}

		return NextResponse.json(processedData);
	} catch (error) {
		console.error("Analytics API error:", error);
		return NextResponse.json(
			{ error: "Internal server error" },
			{ status: 500 },
		);
	}
}

function processUserActivityData(activities: any[], period: string) {
	const timeGrouping = getTimeGrouping(period);
	const groupedData = new Map();

	// Group activities by time period
	activities.forEach((activity) => {
		const timeKey = getTimeKey(activity.createdAt, timeGrouping);
		if (!groupedData.has(timeKey)) {
			groupedData.set(timeKey, {
				date: timeKey,
				activeUsers: new Set(),
				totalActions: 0,
				loginCount: 0,
				createCount: 0,
				updateCount: 0,
				deleteCount: 0,
				viewCount: 0,
			});
		}

		const data = groupedData.get(timeKey);
		data.activeUsers.add(activity.userId);
		data.totalActions++;

		// Count different action types
		switch (activity.action) {
			case "login":
				data.loginCount++;
				break;
			case "create":
				data.createCount++;
				break;
			case "update":
				data.updateCount++;
				break;
			case "delete":
				data.deleteCount++;
				break;
			case "view":
				data.viewCount++;
				break;
		}
	});

	// Convert to array and calculate percentages
	return Array.from(groupedData.values()).map((data) => ({
		date: data.date,
		activeUsers: data.activeUsers.size,
		totalActions: data.totalActions,
		loginCount: data.loginCount,
		createCount: data.createCount,
		updateCount: data.updateCount,
		deleteCount: data.deleteCount,
		viewCount: data.viewCount,
		engagementRate:
			data.totalActions > 0
				? (data.activeUsers.size / data.totalActions) * 100
				: 0,
	}));
}

function processDatabaseActivityData(activities: any[], period: string) {
	const timeGrouping = getTimeGrouping(period);
	const groupedData = new Map();

	activities.forEach((activity) => {
		const timeKey = getTimeKey(activity.createdAt, timeGrouping);
		if (!groupedData.has(timeKey)) {
			groupedData.set(timeKey, {
				date: timeKey,
				queries: 0,
				inserts: 0,
				updates: 0,
				deletes: 0,
				selects: 0,
				avgResponseTime: 0,
				errorCount: 0,
			});
		}

		const data = groupedData.get(timeKey);

		switch (activity.action) {
			case "query":
				data.queries++;
				break;
			case "insert":
				data.inserts++;
				break;
			case "update":
				data.updates++;
				break;
			case "delete":
				data.deletes++;
				break;
			case "select":
				data.selects++;
				break;
		}

		// Extract response time from metadata
		if (activity.metadata?.responseTime) {
			data.avgResponseTime =
				(data.avgResponseTime + activity.metadata.responseTime) / 2;
		}

		if (activity.metadata?.error) {
			data.errorCount++;
		}
	});

	return Array.from(groupedData.values());
}

function processSystemPerformanceData(metrics: any[], period: string) {
	const timeGrouping = getTimeGrouping(period);
	const groupedData = new Map();

	metrics.forEach((metric) => {
		const timeKey = getTimeKey(metric.createdAt, timeGrouping);
		if (!groupedData.has(timeKey)) {
			groupedData.set(timeKey, {
				date: timeKey,
				cpuUsage: [],
				memoryUsage: [],
				diskUsage: [],
				networkLatency: [],
				errorRate: [],
			});
		}

		const data = groupedData.get(timeKey);
		data.cpuUsage.push(metric.cpuUsage);
		data.memoryUsage.push(metric.memoryUsage);
		data.diskUsage.push(metric.diskUsage);
		data.networkLatency.push(metric.networkLatency);
		data.errorRate.push(metric.errorRate);
	});

	// Calculate averages for each time period
	return Array.from(groupedData.entries()).map(([date, data]) => ({
		date,
		avgCpuUsage:
			data.cpuUsage.reduce((a: any, b: any) => a + b, 0) / data.cpuUsage.length,
		avgMemoryUsage:
			data.memoryUsage.reduce((a: any, b: any) => a + b, 0) /
			data.memoryUsage.length,
		avgDiskUsage:
			data.diskUsage.reduce((a: any, b: any) => a + b, 0) /
			data.diskUsage.length,
		avgNetworkLatency:
			data.networkLatency.reduce((a: any, b: any) => a + b, 0) /
			data.networkLatency.length,
		avgErrorRate:
			data.errorRate.reduce((a: any, b: any) => a + b, 0) /
			data.errorRate.length,
		maxCpuUsage: Math.max(...data.cpuUsage),
		maxMemoryUsage: Math.max(...data.memoryUsage),
	}));
}

function generateSummaryStats(
	userActivity: any[],
	databaseActivity: any[],
	systemMetrics: any[],
) {
	const totalUsers = new Set(userActivity.map((a) => a.userId)).size;
	const totalActions = userActivity.length;
	const totalQueries = databaseActivity.length;

	const avgCpuUsage =
		systemMetrics.length > 0
			? systemMetrics.reduce((sum: any, m: any) => sum + m.cpuUsage, 0) /
			  systemMetrics.length
			: 0;

	const avgMemoryUsage =
		systemMetrics.length > 0
			? systemMetrics.reduce((sum: any, m: any) => sum + m.memoryUsage, 0) /
			  systemMetrics.length
			: 0;

	const errorCount = systemMetrics.filter((m: any) => m.errorRate > 0).length;
	const uptime =
		systemMetrics.length > 0
			? ((systemMetrics.length - errorCount) / systemMetrics.length) * 100
			: 100;

	return {
		totalActiveUsers: totalUsers,
		totalUserActions: totalActions,
		totalDatabaseQueries: totalQueries,
		avgCpuUsage: Math.round(avgCpuUsage * 100) / 100,
		avgMemoryUsage: Math.round(avgMemoryUsage * 100) / 100,
		systemUptime: Math.round(uptime * 100) / 100,
		errorCount,
		avgResponseTime:
			systemMetrics.length > 0
				? Math.round(
						systemMetrics.reduce((sum, m) => sum + (m.networkLatency || 0), 0) /
							systemMetrics.length,
				  )
				: 0,
	};
}

function getTimeGrouping(period: string): string {
	switch (period) {
		case "1d":
			return "hour";
		case "7d":
			return "day";
		case "30d":
			return "day";
		case "90d":
			return "week";
		default:
			return "day";
	}
}

function getTimeKey(date: Date, grouping: string): string {
	const d = new Date(date);

	switch (grouping) {
		case "hour":
			return d.toISOString().slice(0, 13) + ":00:00";
		case "day":
			return d.toISOString().slice(0, 10);
		case "week":
			const weekStart = new Date(d);
			weekStart.setDate(d.getDate() - d.getDay());
			return weekStart.toISOString().slice(0, 10);
		default:
			return d.toISOString().slice(0, 10);
	}
}
