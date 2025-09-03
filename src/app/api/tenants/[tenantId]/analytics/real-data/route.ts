/** @format */

import { NextRequest, NextResponse } from "next/server";
import { getUserFromRequest, checkUserTenantAccess } from "@/lib/auth";
import { ApiSuccess, ApiErrors, handleApiError } from "@/lib/api-error-handler";
import { activityTracker } from "@/lib/activity-tracker";
import { systemMonitor } from "@/lib/system-monitor";
import { createTrackedApiRoute } from "@/lib/api-wrapper";
import prisma from "@/lib/prisma";

async function getRealDataHandler(
	request: NextRequest,
	{ params }: { params: Promise<{ tenantId: string }> },
) {
	const { tenantId } = await params;

	try {
		// Verify user authentication and permissions
		const userResult = await getUserFromRequest(request);
		if (userResult instanceof NextResponse) {
			return userResult;
		}

		// Type guard to ensure we have the correct type
		if (!("userId" in userResult) || !("role" in userResult)) {
			return ApiErrors.unauthorized("Invalid user data").toResponse();
		}

		const userId = userResult.userId;
		const role = userResult.role;

		// Check if user has access to this tenant
		const isMember = await checkUserTenantAccess(userId, Number(tenantId));
		if (!isMember) {
			return ApiErrors.forbidden("Access denied to this tenant").toResponse();
		}

		// Get real-time data from various sources
		const realTimeData = await getRealTimeData(Number(tenantId));
		const businessData = await getBusinessData(Number(tenantId));
		const systemData = await getSystemData(Number(tenantId));

		return ApiSuccess.ok(
			{
				realTimeData,
				businessData,
				systemData,
				lastUpdated: new Date().toISOString(),
			},
			"Real-time analytics data retrieved successfully",
		).toResponse();
	} catch (error) {
		const path = `/api/tenants/${tenantId}/analytics/real-data`;
		return handleApiError(error, path);
	}
}

// Export the wrapped handler
export const GET = createTrackedApiRoute(getRealDataHandler, {
	trackActivity: true,
	trackPerformance: true,
	requireAuth: true,
});

async function getRealTimeData(tenantId: number) {
	try {
		// Get real user activity data from database
		const userActivityData = await prisma.userActivity.findMany({
			where: {
				tenantId: tenantId,
				createdAt: {
					gte: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000), // Last 7 days
				},
			},
			select: {
				createdAt: true,
				userId: true,
				action: true,
			},
		});

		// Get total users for this tenant
		const totalUsers = await prisma.user.count({
			where: { tenantId: tenantId },
		});

		// Get unique active users in last 7 days
		const activeUsers = new Set(userActivityData.map((activity : any) => activity.userId)).size;

		// Get new users in last 7 days	
		const newUsers = await prisma.user.count({
			where: {
				tenantId: tenantId,
				createdAt: {
					gte: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000),
				},
			},
		});

		// Calculate user growth (compare with previous 7 days)
		const previousWeekUsers = await prisma.user.count({
			where: {
				tenantId: tenantId,
				createdAt: {
					gte: new Date(Date.now() - 14 * 24 * 60 * 60 * 1000),
					lt: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000),
				},
			},
		});

		const userGrowth = previousWeekUsers > 0 ? ((newUsers / previousWeekUsers) * 100) : 0;

		// Group activity by date
		const userActivityByDate = userActivityData.reduce((acc: Record<string, Set<number>>, activity: any) => {
			const date = activity.createdAt.toISOString().split('T')[0];
			if (!acc[date]) {
				acc[date] = new Set();
			}
			acc[date].add(activity.userId);
			return acc;
		}, {} as Record<string, Set<number>>);

		// Generate last 7 days data
		const userLast7Days = [];
		for (let i = 6; i >= 0; i--) {
			const date = new Date(Date.now() - i * 24 * 60 * 60 * 1000);
			const dateStr = date.toISOString().split('T')[0];
			const users = userActivityByDate[dateStr]?.size || 0;
			userLast7Days.push({ date: dateStr, users });
		}

		const userActivity = {
			totalUsers,
			activeUsers,
			newUsers,
			userGrowth: Math.round(userGrowth * 100) / 100,
			last7Days: userLast7Days,
		};

		// Get real database activity data
		const databaseActivityData = await prisma.databaseActivity.findMany({
			where: {
				tenantId: tenantId,
				createdAt: {
					gte: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000), // Last 30 days
				},
			},
			select: {
				createdAt: true,
				action: true,
				metadata: true,
			},
		});

		const totalQueries = databaseActivityData.length;
		
		// Calculate average response time from metadata
		const dbResponseTimes = databaseActivityData
			.map((activity: any) => {
				try {
					const metadata = typeof activity.metadata === 'string' 
						? JSON.parse(activity.metadata) 
						: activity.metadata;
					return metadata.responseTime || 0;
				} catch {
					return 0;
				}
			})
			.filter((time: number) => time > 0);
		
		const dbAvgResponseTime = dbResponseTimes.length > 0 
			? Math.round(dbResponseTimes.reduce((sum: number, time: number) => sum + time, 0) / dbResponseTimes.length)
			: 0;

		// Calculate error rate
		const dbErrorCount = databaseActivityData.filter((activity: any) => 
			activity.action.includes('error') || activity.action.includes('fail')
		).length;
		const dbErrorRate = totalQueries > 0 ? (dbErrorCount / totalQueries) : 0;

		// Group activity by date
		const dbActivityByDate = databaseActivityData.reduce((acc: Record<string, { queries: number; responseTimes: number[] }>, activity: any) => {
			const date = activity.createdAt.toISOString().split('T')[0];
			if (!acc[date]) {
				acc[date] = { queries: 0, responseTimes: [] };
			}
			acc[date].queries++;
			try {
				const metadata = typeof activity.metadata === 'string' 
					? JSON.parse(activity.metadata) 
					: activity.metadata;
				if (metadata.responseTime) {
					acc[date].responseTimes.push(metadata.responseTime);
				}
			} catch {
				// Ignore parsing errors
			}
			return acc;
		}, {} as Record<string, { queries: number; responseTimes: number[] }>);

		// Generate last 30 days data
		const dbLast30Days = [];
		for (let i = 29; i >= 0; i--) {
			const date = new Date(Date.now() - i * 24 * 60 * 60 * 1000);
			const dateStr = date.toISOString().split('T')[0];
			const dayData = dbActivityByDate[dateStr] || { queries: 0, responseTimes: [] };
			const avgDayResponseTime = dayData.responseTimes.length > 0
				? Math.round(dayData.responseTimes.reduce((sum: number, time: number) => sum + time, 0) / dayData.responseTimes.length)
				: 0;
			
			dbLast30Days.push({
				date: dateStr,
				queries: dayData.queries,
				avgResponseTime: avgDayResponseTime,
			});
		}

		const databaseActivity = {
			totalQueries,
			avgResponseTime: dbAvgResponseTime,
			errorRate: Math.round(dbErrorRate * 10000) / 10000, // Round to 4 decimal places
			last30Days: dbLast30Days,
		};

		// Get real system performance data
		const systemMetricsData = await prisma.systemMetrics.findMany({
			where: {
				tenantId: tenantId,
				createdAt: {
					gte: new Date(Date.now() - 24 * 60 * 60 * 1000), // Last 24 hours
				},
			},
			select: {
				createdAt: true,
				cpuUsage: true,
				memoryUsage: true,
				diskUsage: true,
				networkLatency: true,
			},
			orderBy: { createdAt: 'desc' },
		});

		// Calculate current averages
		const currentMetrics = systemMetricsData.length > 0 ? {
			cpuUsage: Math.round(systemMetricsData.reduce((sum: number, m: any) => sum + (m.cpuUsage || 0), 0) / systemMetricsData.length * 100) / 100,
			memoryUsage: Math.round(systemMetricsData.reduce((sum: number, m: any) => sum + (m.memoryUsage || 0), 0) / systemMetricsData.length * 100) / 100,
			diskUsage: Math.round(systemMetricsData.reduce((sum: number, m: any) => sum + (m.diskUsage || 0), 0) / systemMetricsData.length * 100) / 100,
			networkLatency: Math.round(systemMetricsData.reduce((sum: number, m: any) => sum + (m.networkLatency || 0), 0) / systemMetricsData.length * 100) / 100,
		} : {
			cpuUsage: 0,
			memoryUsage: 0,
			diskUsage: 0,
			networkLatency: 0,
		};

		// Group metrics by hour
		const metricsByHour = systemMetricsData.reduce((acc: Record<number, { cpuUsage: number[]; memoryUsage: number[] }>, metric: any) => {
			const hour = metric.createdAt.getHours();
			if (!acc[hour]) {
				acc[hour] = { cpuUsage: [], memoryUsage: [] };
			}
			if (metric.cpuUsage !== null) acc[hour].cpuUsage.push(metric.cpuUsage);
			if (metric.memoryUsage !== null) acc[hour].memoryUsage.push(metric.memoryUsage);
			return acc;
		}, {} as Record<number, { cpuUsage: number[]; memoryUsage: number[] }>);

		// Generate last 24 hours data
		const systemLast24Hours = [];
		for (let i = 0; i < 24; i++) {
			const hourData = metricsByHour[i] || { cpuUsage: [], memoryUsage: [] };
			const avgCpuUsage = hourData.cpuUsage.length > 0
				? Math.round(hourData.cpuUsage.reduce((sum: number, usage: number) => sum + usage, 0) / hourData.cpuUsage.length)
				: 0;
			const avgMemoryUsage = hourData.memoryUsage.length > 0
				? Math.round(hourData.memoryUsage.reduce((sum: number, usage: number) => sum + usage, 0) / hourData.memoryUsage.length)
				: 0;

			systemLast24Hours.push({
				hour: i,
				cpuUsage: avgCpuUsage,
				memoryUsage: avgMemoryUsage,
			});
		}

		const systemPerformance = {
			...currentMetrics,
			last24Hours: systemLast24Hours,
		};

		// Get real API usage data
		const apiUsageData = await prisma.apiUsage.findMany({
			where: {
				tenantId: tenantId,
				createdAt: {
					gte: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000), // Last 7 days
				},
			},
			select: {
				createdAt: true,
				statusCode: true,
				responseTime: true,
			},
		});

		const totalRequests = apiUsageData.length;
		const successfulRequests = apiUsageData.filter((usage: any)	 => 
			usage.statusCode >= 200 && usage.statusCode < 300
		).length;
		const successRate = totalRequests > 0 ? (successfulRequests / totalRequests) * 100 : 0;
		
		const apiResponseTimes = apiUsageData
			.map((usage: any) => usage.responseTime)
			.filter((time: number) => time > 0);
		const apiAvgResponseTime = apiResponseTimes.length > 0
			? Math.round(apiResponseTimes.reduce((sum: number, time: number) => sum + time, 0) / apiResponseTimes.length)
			: 0;

		// Group API usage by date
		const apiUsageByDate = apiUsageData.reduce((acc: Record<string, { total: number; successful: number }>, usage: any) => {
			const date = usage.createdAt.toISOString().split('T')[0];
			if (!acc[date]) {
				acc[date] = { total: 0, successful: 0 };
			}
			acc[date].total++;
			if (usage.statusCode >= 200 && usage.statusCode < 300) {
				acc[date].successful++;
			}
			return acc;
		}, {} as Record<string, { total: number; successful: number }>);

		// Generate last 7 days data
		const apiLast7Days = [];
		for (let i = 6; i >= 0; i--) {
			const date = new Date(Date.now() - i * 24 * 60 * 60 * 1000);
			const dateStr = date.toISOString().split('T')[0];
			const dayData = apiUsageByDate[dateStr] || { total: 0, successful: 0 };
			const daySuccessRate = dayData.total > 0 ? (dayData.successful / dayData.total) * 100 : 0;
			
			apiLast7Days.push({
				date: dateStr,
				requests: dayData.total,
				successRate: Math.round(daySuccessRate * 100) / 100,
			});
		}

		const apiUsage = {
			totalRequests,
			successRate: Math.round(successRate * 100) / 100,
			avgResponseTime: apiAvgResponseTime,
			last7Days: apiLast7Days,
		};

		// Get real error data
		const errorData = await prisma.errorLog.findMany({
			where: {
				tenantId: tenantId,
				createdAt: {
					gte: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000), // Last 7 days
				},
			},
			select: {
				createdAt: true,
				errorType: true,
				errorMessage: true,
			},
		});

		const totalErrors = errorData.length;
		const criticalErrors = errorData.filter((error: any) => 
			error.errorType === 'SYSTEM_ERROR' || 	
			error.errorType === 'DATABASE_ERROR' ||
			error.errorMessage.toLowerCase().includes('critical')
		).length;
		const errorRate = totalRequests > 0 ? (totalErrors / totalRequests) : 0;

		// Group errors by date
		const errorsByDate = errorData.reduce((acc: Record<string, { total: number; critical: number }>, error: any) => {
			const date = error.createdAt.toISOString().split('T')[0];
			if (!acc[date]) {
				acc[date] = { total: 0, critical: 0 };
			}
			acc[date].total++;
			if (error.errorType === 'SYSTEM_ERROR' || 
				error.errorType === 'DATABASE_ERROR' ||
				error.errorMessage.toLowerCase().includes('critical')) {
				acc[date].critical++;
			}
			return acc;
		}, {} as Record<string, { total: number; critical: number }>);

		// Generate last 7 days data
		const errorLast7Days = [];
		for (let i = 6; i >= 0; i--) {
			const date = new Date(Date.now() - i * 24 * 60 * 60 * 1000);
			const dateStr = date.toISOString().split('T')[0];
			const dayData = errorsByDate[dateStr] || { total: 0, critical: 0 };
			
			errorLast7Days.push({
				date: dateStr,
				errors: dayData.total,
				criticalErrors: dayData.critical,
			});
		}

		const errorDataResult = {
			totalErrors,
			errorRate: Math.round(errorRate * 10000) / 10000, // Round to 4 decimal places
			criticalErrors,
			last7Days: errorLast7Days,
		};

		return {
			userActivity,
			databaseActivity,
			systemPerformance,
			apiUsage,
			errorData: errorDataResult,
		};
	} catch (error) {
		console.error("Failed to get real-time data:", error);
		return null;
	}
}

async function getBusinessData(tenantId: number) {
	try {
		// Get real revenue data from tenant usage and subscriptions
		const tenant = await prisma.tenant.findUnique({
			where: { id: tenantId },
			select: {
				subscriptionPlan: true,
				subscriptionStatus: true,
				createdAt: true,
			},
		});

		// Get tenant usage data for revenue calculation
		const tenantUsage = await prisma.tenantUsage.findMany({
			where: { tenantId: tenantId },
			select: {
				createdAt: true,
				databasesUsed: true,
				tablesUsed: true,
				storageUsed: true,
			},
			orderBy: { createdAt: 'desc' },
		});

		// Calculate revenue based on subscription plan
		const planPrices: Record<string, number> = {
			'Free': 0,
			'Pro': 29,
			'Business': 99,
			'Enterprise': 299,
		};

		const monthlyRevenue = planPrices[tenant?.subscriptionPlan || 'Free'] || 0;
		const totalRevenue = monthlyRevenue * Math.max(1, Math.floor((Date.now() - (tenant?.createdAt?.getTime() || Date.now())) / (30 * 24 * 60 * 60 * 1000)));

		// Calculate revenue growth (compare current month with previous)
		const currentMonth = new Date().getMonth();
		const currentYear = new Date().getFullYear();
		const previousMonth = currentMonth === 0 ? 11 : currentMonth - 1;
		const previousYear = currentMonth === 0 ? currentYear - 1 : currentYear;

		const currentMonthUsage = tenantUsage.filter((usage: any) => {
			const usageDate = new Date(usage.createdAt);
			return usageDate.getMonth() === currentMonth && usageDate.getFullYear() === currentYear;
		});

		const previousMonthUsage = tenantUsage.filter((usage: any) => {
			const usageDate = new Date(usage.createdAt);
			return usageDate.getMonth() === previousMonth && usageDate.getFullYear() === previousYear;
		});

		const revenueGrowth = previousMonthUsage.length > 0 
			? ((currentMonthUsage.length - previousMonthUsage.length) / previousMonthUsage.length) * 100
			: 0;

		// Generate last 12 months data
		const last12Months = [];
		for (let i = 11; i >= 0; i--) {
			const date = new Date();
			date.setMonth(date.getMonth() - i);
			const monthStr = date.toISOString().substring(0, 7);
			
			// Count usage for this month
			const monthUsage = tenantUsage.filter((usage: any) => {
				const usageDate = new Date(usage.createdAt);
				return usageDate.getMonth() === date.getMonth() && usageDate.getFullYear() === date.getFullYear();
			});

			last12Months.push({
				month: monthStr,
				revenue: monthUsage.length > 0 ? monthlyRevenue : 0,
			});
		}

		const revenue = {
			totalRevenue,
			monthlyRevenue,
			revenueGrowth: Math.round(revenueGrowth * 100) / 100,
			last12Months,
		};

		// Get real growth data
		const userGrowthData = await prisma.user.findMany({
			where: { tenantId: tenantId },
			select: { createdAt: true },
		});

		// Calculate user growth (current month vs previous month)
		const currentMonthUsers = userGrowthData.filter((user: any) => {
			const userDate = new Date(user.createdAt);
			return userDate.getMonth() === currentMonth && userDate.getFullYear() === currentYear;
		}).length;

		const previousMonthUsers = userGrowthData.filter((user: any) => {
			const userDate = new Date(user.createdAt);
			return userDate.getMonth() === previousMonth && userDate.getFullYear() === previousYear;
		}).length;

		const userGrowth = previousMonthUsers > 0 
			? ((currentMonthUsers - previousMonthUsers) / previousMonthUsers) * 100
			: 0;

		// Calculate usage growth based on tenant usage
		const currentMonthUsageCount = currentMonthUsage.length;
		const previousMonthUsageCount = previousMonthUsage.length;
		const usageGrowth = previousMonthUsageCount > 0
			? ((currentMonthUsageCount - previousMonthUsageCount) / previousMonthUsageCount) * 100
			: 0;

		// Calculate conversion growth (simplified - based on user signups)
		const conversionGrowth = userGrowth; // Simplified for now

		// Generate last 6 months growth data
		const last6Months = [];
		for (let i = 5; i >= 0; i--) {
			const date = new Date();
			date.setMonth(date.getMonth() - i);
			const monthStr = date.toISOString().substring(0, 7);
			
			const monthUsers = userGrowthData.filter((user: any) => {
				const userDate = new Date(user.createdAt);
				return userDate.getMonth() === date.getMonth() && userDate.getFullYear() === date.getFullYear();
			}).length;

			const monthUsage = tenantUsage.filter((usage: any) => {
				const usageDate = new Date(usage.createdAt);
				return usageDate.getMonth() === date.getMonth() && usageDate.getFullYear() === date.getFullYear();
			}).length;

			last6Months.push({
				month: monthStr,
				userGrowth: monthUsers,
				revenueGrowth: monthUsage > 0 ? monthlyRevenue : 0,
			});
		}

		const growth = {
			userGrowth: Math.round(userGrowth * 100) / 100,
			revenueGrowth: Math.round(revenueGrowth * 100) / 100,
			usageGrowth: Math.round(usageGrowth * 100) / 100,
			conversionGrowth: Math.round(conversionGrowth * 100) / 100,
			last6Months,
		};

		// Get real usage data
		const totalUsers = userGrowthData.length;
		
		// Get active users (users with activity in last 30 days)
		const activeUsersData = await prisma.userActivity.findMany({
			where: {
				tenantId: tenantId,
				createdAt: {
					gte: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000),
				},
			},
			select: { userId: true },
		});
		
		const activeUsers = new Set(activeUsersData.map((activity: any) => activity.userId)).size;
		const usageRate = totalUsers > 0 ? (activeUsers / totalUsers) * 100 : 0;
		
		// Calculate average session time (simplified - based on activity duration)
		const avgSessionTime = 24.5; // This would need more complex calculation with session tracking

		// Group usage by date
		const usageByDate = activeUsersData.reduce((acc: Record<string, Set<number>>, activity: any) => {
			const date = activity.createdAt.toISOString().split('T')[0];
			if (!acc[date]) {
				acc[date] = new Set();
			}
			acc[date].add(activity.userId);
			return acc;
		}, {} as Record<string, Set<number>>);

		// Generate last 30 days data
		const last30Days = [];
		for (let i = 29; i >= 0; i--) {
			const date = new Date(Date.now() - i * 24 * 60 * 60 * 1000);
			const dateStr = date.toISOString().split('T')[0];
			const dayActiveUsers = usageByDate[dateStr]?.size || 0;
			const daySessions = activeUsersData.filter((activity: any) => 
				activity.createdAt.toISOString().split('T')[0] === dateStr
			).length;
			
			last30Days.push({
				date: dateStr,
				activeUsers: dayActiveUsers,
				sessions: daySessions,
			});
		}

		const usage = {
			totalUsers,
			activeUsers,
			usageRate: Math.round(usageRate * 100) / 100,
			avgSessionTime,
			last30Days,
		};

		// Get real performance data from API usage
		const apiUsageData = await prisma.apiUsage.findMany({
			where: {
				tenantId: tenantId,
				createdAt: {
					gte: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000), // Last 7 days
				},
			},
			select: {
				createdAt: true,
				responseTime: true,
				statusCode: true,
			},
		});

		const totalApiRequests = apiUsageData.length;
		const successfulRequests = apiUsageData.filter((usage: any) => 
			usage.statusCode >= 200 && usage.statusCode < 300
		).length;
		
		const avgResponseTime = apiUsageData.length > 0
			? Math.round(apiUsageData.reduce((sum: number, usage: any) => sum + usage.responseTime, 0) / apiUsageData.length)
			: 0;
		
		const uptime = totalApiRequests > 0 ? (successfulRequests / totalApiRequests) * 100 : 100;
		const errorRate = totalApiRequests > 0 ? ((totalApiRequests - successfulRequests) / totalApiRequests) * 100 : 0;
		const throughput = Math.round(totalApiRequests / 7); // Requests per day

		// Group performance by date
		const performanceByDate = apiUsageData.reduce((acc: Record<string, { total: number; successful: number; responseTimes: number[] }>, usage: any) => {
			const date = usage.createdAt.toISOString().split('T')[0];
			if (!acc[date]) {
				acc[date] = { total: 0, successful: 0, responseTimes: [] };
			}
			acc[date].total++;
			if (usage.statusCode >= 200 && usage.statusCode < 300) {
				acc[date].successful++;
			}
			acc[date].responseTimes.push(usage.responseTime);
			return acc;
		}, {} as Record<string, { total: number; successful: number; responseTimes: number[] }>);

		// Generate last 7 days performance data
		const last7Days = [];
		for (let i = 6; i >= 0; i--) {
			const date = new Date(Date.now() - i * 24 * 60 * 60 * 1000);
			const dateStr = date.toISOString().split('T')[0];
			const dayData = performanceByDate[dateStr] || { total: 0, successful: 0, responseTimes: [] };
			
			const dayAvgResponseTime = dayData.responseTimes.length > 0
				? Math.round(dayData.responseTimes.reduce((sum: number, time: number) => sum + time, 0) / dayData.responseTimes.length)
				: 0;
			
			const dayUptime = dayData.total > 0 ? (dayData.successful / dayData.total) * 100 : 100;
			
			last7Days.push({
				date: dateStr,
				avgResponseTime: dayAvgResponseTime,
				uptime: Math.round(dayUptime * 100) / 100,
			});
		}

		const performance = {
			avgResponseTime,
			uptime: Math.round(uptime * 100) / 100,
			errorRate: Math.round(errorRate * 100) / 100,
			throughput,
			last7Days,
		};

		// Get real conversion data (simplified - based on user signups and plan upgrades)
		const conversions = userGrowthData.length; // Total user signups as conversions
		const conversionRate = conversions > 0 ? (conversions / (conversions + 100)) * 100 : 0; // Simplified calculation
		const conversionValue = conversions * monthlyRevenue; // Value based on current plan

		// Group conversions by date
		const conversionsByDate = userGrowthData.reduce((acc: Record<string, number>, user: any) => {
			const date = user.createdAt.toISOString().split('T')[0];
			acc[date] = (acc[date] || 0) + 1;
			return acc;
		}, {} as Record<string, number>);

		// Generate last 30 days conversion data
		const last30DaysConversion = [];
		for (let i = 29; i >= 0; i--) {
			const date = new Date(Date.now() - i * 24 * 60 * 60 * 1000);
			const dateStr = date.toISOString().split('T')[0];
			const dayConversions = conversionsByDate[dateStr] || 0;
			const dayConversionRate = dayConversions > 0 ? (dayConversions / (dayConversions + 5)) * 100 : 0; // Simplified
			
			last30DaysConversion.push({
				date: dateStr,
				conversions: dayConversions,
				conversionRate: Math.round(dayConversionRate * 100) / 100,
			});
		}

		const conversion = {
			conversionRate: Math.round(conversionRate * 100) / 100,
			totalConversions: conversions,
			conversionValue,
			last30Days: last30DaysConversion,
		};

		return {
			revenue,
			growth,
			usage,
			performance,
			conversion,
		};
	} catch (error) {
		console.error("Failed to get business data:", error);
		return null;
	}
}

async function getSystemData(tenantId: number) {
	try {
		// Get current system metrics
		const currentMetrics = systemMonitor.getMetricsHistory();

		// Get all tenant metrics for comparison (public method)
		const allTenantMetrics = systemMonitor.getAllTenantMetrics();

		// Get tenant-specific metrics (using public method)
		const tenantMetrics = allTenantMetrics.get(tenantId);

		return {
			currentMetrics,
			tenantMetrics: tenantMetrics || {
				cpuUsage: 0,
				memoryUsage: 0,
				diskUsage: 0,
				networkLatency: 0,
				errorRate: 0,
				activeConnections: 0,
				lastUpdated: new Date().toISOString(),
			},
			allTenantMetrics: Object.fromEntries(allTenantMetrics),
			isMonitoring: systemMonitor.isRunning(),
		};
	} catch (error) {
		console.error("Failed to get system data:", error);
		return null;
	}
}
