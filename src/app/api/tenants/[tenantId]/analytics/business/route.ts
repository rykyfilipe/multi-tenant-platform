/** @format */

import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import prisma from "@/lib/prisma";

export async function GET(
	request: NextRequest,
	{ params }: { params: { tenantId: string } },
) {
	try {
		const session = await getServerSession(authOptions);
		if (!session?.user?.id) {
			return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
		}

		const { tenantId } = params;
		const { searchParams } = new URL(request.url);
		const period = searchParams.get("period") || "30d";

		// Calculate date range
		const now = new Date();
		const startDate = new Date();

		switch (period) {
			case "7d":
				startDate.setDate(now.getDate() - 7);
				break;
			case "30d":
				startDate.setDate(now.getDate() - 30);
				break;
			case "90d":
				startDate.setDate(now.getDate() - 90);
				break;
			case "1y":
				startDate.setFullYear(now.getFullYear() - 1);
				break;
			default:
				startDate.setDate(now.getDate() - 30);
		}

		// Get subscription data
		const subscription = await prisma.subscription.findFirst({
			where: {
				tenantId: parseInt(tenantId),
			},
			include: {
				plan: true,
			},
		});

		// Get usage data for billing calculations
		const usageData = await prisma.tenantUsage.findMany({
			where: {
				tenantId: parseInt(tenantId),
				createdAt: {
					gte: startDate,
					lte: now,
				},
			},
			orderBy: {
				createdAt: "asc",
			},
		});

		// Get user growth data
		const userGrowth = await prisma.user.findMany({
			where: {
				tenantId: parseInt(tenantId),
				createdAt: {
					gte: startDate,
					lte: now,
				},
			},
			select: {
				createdAt: true,
				role: true,
			},
		});

		// Get database growth data
		const databaseGrowth = await prisma.database.findMany({
			where: {
				tenantId: parseInt(tenantId),
				createdAt: {
					gte: startDate,
					lte: now,
				},
			},
			select: {
				createdAt: true,
				name: true,
			},
		});

		// Get API usage data
		const apiUsage = await prisma.apiUsage.findMany({
			where: {
				tenantId: parseInt(tenantId),
				createdAt: {
					gte: startDate,
					lte: now,
				},
			},
			select: {
				createdAt: true,
				endpoint: true,
				responseTime: true,
				statusCode: true,
			},
		});

		// Process business metrics
		const businessMetrics = {
			revenue: calculateRevenueMetrics(subscription, usageData, period),
			growth: calculateGrowthMetrics(userGrowth, databaseGrowth, period),
			usage: calculateUsageMetrics(usageData, apiUsage, period),
			performance: calculatePerformanceMetrics(apiUsage, period),
			conversion: calculateConversionMetrics(userGrowth, subscription, period),
		};

		return NextResponse.json(businessMetrics);
	} catch (error) {
		console.error("Business analytics API error:", error);
		return NextResponse.json(
			{ error: "Internal server error" },
			{ status: 500 },
		);
	}
}

function calculateRevenueMetrics(
	subscription: any,
	usageData: any[],
	period: string,
) {
	const currentPlan = subscription?.plan;
	const monthlyRevenue = currentPlan?.price || 0;

	// Calculate overage charges
	const overageCharges = usageData.reduce((total, usage) => {
		if (usage.overageAmount > 0) {
			return total + usage.overageAmount;
		}
		return total;
	}, 0);

	// Calculate revenue growth
	const revenueGrowth = calculateGrowthRate(usageData, "revenue", period);

	return {
		monthlyRecurringRevenue: monthlyRevenue,
		overageCharges,
		totalRevenue: monthlyRevenue + overageCharges,
		revenueGrowth,
		averageRevenuePerUser: subscription
			? monthlyRevenue / (subscription.userCount || 1)
			: 0,
		churnRate: calculateChurnRate(usageData, period),
		lifetimeValue: calculateLTV(monthlyRevenue, subscription?.userCount || 1),
	};
}

function calculateGrowthMetrics(
	userGrowth: any[],
	databaseGrowth: any[],
	period: string,
) {
	const timeGrouping = getTimeGrouping(period);

	// User growth
	const userGrowthByPeriod = groupByTimePeriod(
		userGrowth,
		timeGrouping,
		"createdAt",
	);
	const userGrowthRate = calculateGrowthRate(userGrowth, "count", period);

	// Database growth
	const databaseGrowthByPeriod = groupByTimePeriod(
		databaseGrowth,
		timeGrouping,
		"createdAt",
	);
	const databaseGrowthRate = calculateGrowthRate(
		databaseGrowth,
		"count",
		period,
	);

	// User role distribution
	const roleDistribution = userGrowth.reduce((acc, user) => {
		acc[user.role] = (acc[user.role] || 0) + 1;
		return acc;
	}, {} as Record<string, number>);

	return {
		userGrowth: userGrowthByPeriod,
		userGrowthRate,
		databaseGrowth: databaseGrowthByPeriod,
		databaseGrowthRate,
		roleDistribution,
		totalUsers: userGrowth.length,
		totalDatabases: databaseGrowth.length,
		avgUsersPerDay: userGrowth.length / getDaysInPeriod(period),
		avgDatabasesPerDay: databaseGrowth.length / getDaysInPeriod(period),
	};
}

function calculateUsageMetrics(
	usageData: any[],
	apiUsage: any[],
	period: string,
) {
	const timeGrouping = getTimeGrouping(period);

	// API usage by endpoint
	const endpointUsage = apiUsage.reduce((acc, usage) => {
		acc[usage.endpoint] = (acc[usage.endpoint] || 0) + 1;
		return acc;
	}, {} as Record<string, number>);

	// Usage trends
	const usageByPeriod = groupByTimePeriod(usageData, timeGrouping, "createdAt");
	const apiUsageByPeriod = groupByTimePeriod(
		apiUsage,
		timeGrouping,
		"createdAt",
	);

	// Resource utilization
	const avgCpuUsage =
		usageData.length > 0
			? usageData.reduce((sum, u) => sum + (u.cpuUsage || 0), 0) /
			  usageData.length
			: 0;

	const avgMemoryUsage =
		usageData.length > 0
			? usageData.reduce((sum, u) => sum + (u.memoryUsage || 0), 0) /
			  usageData.length
			: 0;

	const avgStorageUsage =
		usageData.length > 0
			? usageData.reduce((sum, u) => sum + (u.storageUsage || 0), 0) /
			  usageData.length
			: 0;

	return {
		usageByPeriod,
		apiUsageByPeriod,
		endpointUsage,
		avgCpuUsage: Math.round(avgCpuUsage * 100) / 100,
		avgMemoryUsage: Math.round(avgMemoryUsage * 100) / 100,
		avgStorageUsage: Math.round(avgStorageUsage * 100) / 100,
		totalApiCalls: apiUsage.length,
		avgApiCallsPerDay: apiUsage.length / getDaysInPeriod(period),
		peakUsageHour: getPeakUsageHour(apiUsage),
	};
}

function calculatePerformanceMetrics(apiUsage: any[], period: string) {
	const successfulRequests = apiUsage.filter(
		(u) => u.statusCode >= 200 && u.statusCode < 300,
	);
	const errorRequests = apiUsage.filter((u) => u.statusCode >= 400);

	const avgResponseTime =
		apiUsage.length > 0
			? apiUsage.reduce((sum, u) => sum + (u.responseTime || 0), 0) /
			  apiUsage.length
			: 0;

	const p95ResponseTime = calculatePercentile(
		apiUsage.map((u) => u.responseTime || 0),
		95,
	);
	const p99ResponseTime = calculatePercentile(
		apiUsage.map((u) => u.responseTime || 0),
		99,
	);

	return {
		successRate:
			apiUsage.length > 0
				? (successfulRequests.length / apiUsage.length) * 100
				: 100,
		errorRate:
			apiUsage.length > 0 ? (errorRequests.length / apiUsage.length) * 100 : 0,
		avgResponseTime: Math.round(avgResponseTime),
		p95ResponseTime: Math.round(p95ResponseTime),
		p99ResponseTime: Math.round(p99ResponseTime),
		totalRequests: apiUsage.length,
		successfulRequests: successfulRequests.length,
		errorRequests: errorRequests.length,
		uptime:
			apiUsage.length > 0
				? ((apiUsage.length - errorRequests.length) / apiUsage.length) * 100
				: 100,
	};
}

function calculateConversionMetrics(
	userGrowth: any[],
	subscription: any,
	period: string,
) {
	const totalUsers = userGrowth.length;
	const paidUsers = subscription ? subscription.userCount : 0;
	const conversionRate = totalUsers > 0 ? (paidUsers / totalUsers) * 100 : 0;

	// Calculate user acquisition cost (simplified)
	const acquisitionCost = totalUsers > 0 ? 50 : 0; // Placeholder - would come from marketing data

	return {
		conversionRate: Math.round(conversionRate * 100) / 100,
		paidUsers,
		freeUsers: totalUsers - paidUsers,
		acquisitionCost,
		customerAcquisitionCost: acquisitionCost,
		paybackPeriod:
			acquisitionCost > 0
				? acquisitionCost / (subscription?.plan?.price || 1)
				: 0,
		monthlyActiveUsers: totalUsers,
		userRetentionRate: calculateRetentionRate(userGrowth, period),
	};
}

// Helper functions
function groupByTimePeriod(data: any[], grouping: string, dateField: string) {
	const grouped = new Map();

	data.forEach((item) => {
		const date = new Date(item[dateField]);
		const key = getTimeKey(date, grouping);

		if (!grouped.has(key)) {
			grouped.set(key, []);
		}
		grouped.get(key).push(item);
	});

	return Array.from(grouped.entries()).map(([date, items]) => ({
		date,
		count: items.length,
		items,
	}));
}

function calculateGrowthRate(data: any[], field: string, period: string) {
	if (data.length < 2) return 0;

	const days = getDaysInPeriod(period);
	const firstHalf = data.slice(0, Math.floor(data.length / 2));
	const secondHalf = data.slice(Math.floor(data.length / 2));

	const firstHalfAvg = firstHalf.length > 0 ? firstHalf.length / (days / 2) : 0;
	const secondHalfAvg =
		secondHalf.length > 0 ? secondHalf.length / (days / 2) : 0;

	return firstHalfAvg > 0
		? ((secondHalfAvg - firstHalfAvg) / firstHalfAvg) * 100
		: 0;
}

function calculateChurnRate(usageData: any[], period: string) {
	// Simplified churn calculation - would need more sophisticated logic
	const totalUsers = usageData.length;
	const inactiveUsers = usageData.filter(
		(u) =>
			u.lastActivity &&
			new Date(u.lastActivity) <
				new Date(Date.now() - 30 * 24 * 60 * 60 * 1000),
	).length;

	return totalUsers > 0 ? (inactiveUsers / totalUsers) * 100 : 0;
}

function calculateLTV(monthlyRevenue: number, userCount: number) {
	const avgMonthlyRevenue = userCount > 0 ? monthlyRevenue / userCount : 0;
	const avgLifespanMonths = 24; // Industry average
	return avgMonthlyRevenue * avgLifespanMonths;
}

function calculateRetentionRate(userGrowth: any[], period: string) {
	// Simplified retention calculation
	const totalUsers = userGrowth.length;
	const activeUsers = userGrowth.filter(
		(u) =>
			new Date(u.createdAt) > new Date(Date.now() - 30 * 24 * 60 * 60 * 1000),
	).length;

	return totalUsers > 0 ? (activeUsers / totalUsers) * 100 : 0;
}

function calculatePercentile(values: number[], percentile: number) {
	const sorted = values.sort((a, b) => a - b);
	const index = Math.ceil((percentile / 100) * sorted.length) - 1;
	return sorted[index] || 0;
}

function getPeakUsageHour(apiUsage: any[]) {
	const hourCounts = new Array(24).fill(0);

	apiUsage.forEach((usage) => {
		const hour = new Date(usage.createdAt).getHours();
		hourCounts[hour]++;
	});

	return hourCounts.indexOf(Math.max(...hourCounts));
}

function getTimeGrouping(period: string): string {
	switch (period) {
		case "7d":
			return "day";
		case "30d":
			return "day";
		case "90d":
			return "week";
		case "1y":
			return "month";
		default:
			return "day";
	}
}

function getTimeKey(date: Date, grouping: string): string {
	const d = new Date(date);

	switch (grouping) {
		case "day":
			return d.toISOString().slice(0, 10);
		case "week":
			const weekStart = new Date(d);
			weekStart.setDate(d.getDate() - d.getDay());
			return weekStart.toISOString().slice(0, 10);
		case "month":
			return d.toISOString().slice(0, 7);
		default:
			return d.toISOString().slice(0, 10);
	}
}

function getDaysInPeriod(period: string): number {
	switch (period) {
		case "7d":
			return 7;
		case "30d":
			return 30;
		case "90d":
			return 90;
		case "1y":
			return 365;
		default:
			return 30;
	}
}
