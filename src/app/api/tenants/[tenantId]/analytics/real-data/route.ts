/** @format */

import { NextRequest, NextResponse } from "next/server";
import { getUserFromRequest, checkUserTenantAccess } from "@/lib/auth";
import { ApiSuccess, ApiErrors } from "@/lib/api-error-handler";
import { handleApiError } from "@/lib/api-error-handler";
import { activityTracker } from "@/lib/activity-tracker";
import { systemMonitor } from "@/lib/system-monitor";
import { createTrackedApiRoute } from "@/lib/api-wrapper";

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
		// Get user activity data (mock data for now)
		const userActivity = {
			totalUsers: 25,
			activeUsers: 18,
			newUsers: 3,
			userGrowth: 12.5,
			last7Days: [
				{ date: "2024-01-01", users: 20 },
				{ date: "2024-01-02", users: 22 },
				{ date: "2024-01-03", users: 21 },
				{ date: "2024-01-04", users: 24 },
				{ date: "2024-01-05", users: 23 },
				{ date: "2024-01-06", users: 25 },
				{ date: "2024-01-07", users: 18 },
			],
		};

		// Get database activity data (mock data for now)
		const databaseActivity = {
			totalQueries: 1250,
			avgResponseTime: 45,
			errorRate: 0.02,
			last30Days: Array.from({ length: 30 }, (_, i) => ({
				date: new Date(Date.now() - (29 - i) * 24 * 60 * 60 * 1000)
					.toISOString()
					.split("T")[0],
				queries: Math.floor(Math.random() * 100) + 20,
				avgResponseTime: Math.floor(Math.random() * 50) + 20,
			})),
		};

		// Get system performance data (mock data for now)
		const systemPerformance = {
			cpuUsage: 65.2,
			memoryUsage: 78.5,
			diskUsage: 45.8,
			networkLatency: 12.3,
			last24Hours: Array.from({ length: 24 }, (_, i) => ({
				hour: i,
				cpuUsage: Math.floor(Math.random() * 40) + 40,
				memoryUsage: Math.floor(Math.random() * 30) + 60,
			})),
		};

		// Get API usage data (mock data for now)
		const apiUsage = {
			totalRequests: 5420,
			successRate: 98.5,
			avgResponseTime: 120,
			last7Days: Array.from({ length: 7 }, (_, i) => ({
				date: new Date(Date.now() - (6 - i) * 24 * 60 * 60 * 1000)
					.toISOString()
					.split("T")[0],
				requests: Math.floor(Math.random() * 1000) + 500,
				successRate: Math.floor(Math.random() * 5) + 95,
			})),
		};

		// Get error data (mock data for now)
		const errorData = {
			totalErrors: 15,
			errorRate: 0.28,
			criticalErrors: 2,
			last7Days: Array.from({ length: 7 }, (_, i) => ({
				date: new Date(Date.now() - (6 - i) * 24 * 60 * 60 * 1000)
					.toISOString()
					.split("T")[0],
				errors: Math.floor(Math.random() * 5),
				criticalErrors: Math.floor(Math.random() * 2),
			})),
		};

		return {
			userActivity,
			databaseActivity,
			systemPerformance,
			apiUsage,
			errorData,
		};
	} catch (error) {
		console.error("Failed to get real-time data:", error);
		return null;
	}
}

async function getBusinessData(tenantId: number) {
	try {
		// Get revenue data (mock data for now)
		const revenue = {
			totalRevenue: 125000,
			monthlyRevenue: 15000,
			revenueGrowth: 8.5,
			last12Months: Array.from({ length: 12 }, (_, i) => ({
				month: new Date(Date.now() - (11 - i) * 30 * 24 * 60 * 60 * 1000)
					.toISOString()
					.substring(0, 7),
				revenue: Math.floor(Math.random() * 20000) + 10000,
			})),
		};

		// Get growth data (mock data for now)
		const growth = {
			userGrowth: 15.2,
			revenueGrowth: 8.5,
			usageGrowth: 22.1,
			conversionGrowth: 5.8,
			last6Months: Array.from({ length: 6 }, (_, i) => ({
				month: new Date(Date.now() - (5 - i) * 30 * 24 * 60 * 60 * 1000)
					.toISOString()
					.substring(0, 7),
				userGrowth: Math.floor(Math.random() * 20) + 5,
				revenueGrowth: Math.floor(Math.random() * 15) + 2,
			})),
		};

		// Get usage data (mock data for now)
		const usage = {
			totalUsers: 1250,
			activeUsers: 890,
			usageRate: 71.2,
			avgSessionTime: 24.5,
			last30Days: Array.from({ length: 30 }, (_, i) => ({
				date: new Date(Date.now() - (29 - i) * 24 * 60 * 60 * 1000)
					.toISOString()
					.split("T")[0],
				activeUsers: Math.floor(Math.random() * 200) + 700,
				sessions: Math.floor(Math.random() * 500) + 1000,
			})),
		};

		// Get performance data (mock data for now)
		const performance = {
			avgResponseTime: 120,
			uptime: 99.9,
			errorRate: 0.1,
			throughput: 1250,
			last7Days: Array.from({ length: 7 }, (_, i) => ({
				date: new Date(Date.now() - (6 - i) * 24 * 60 * 60 * 1000)
					.toISOString()
					.split("T")[0],
				avgResponseTime: Math.floor(Math.random() * 50) + 100,
				uptime: Math.floor(Math.random() * 2) + 98,
			})),
		};

		// Get conversion data (mock data for now)
		const conversion = {
			conversionRate: 3.2,
			totalConversions: 45,
			conversionValue: 67500,
			last30Days: Array.from({ length: 30 }, (_, i) => ({
				date: new Date(Date.now() - (29 - i) * 24 * 60 * 60 * 1000)
					.toISOString()
					.split("T")[0],
				conversions: Math.floor(Math.random() * 5) + 1,
				conversionRate: Math.floor(Math.random() * 5) + 1,
			})),
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
