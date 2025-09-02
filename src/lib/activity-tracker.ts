/** @format */

import prisma from "@/lib/prisma";
import { NextRequest } from "next/server";

export interface ActivityData {
	userId?: number;
	tenantId?: number;
	action: string;
	resource?: string;
	resourceId?: number;
	metadata?: Record<string, any>;
	ipAddress?: string;
	userAgent?: string;
}

export interface DatabaseActivityData {
	tenantId: number;
	databaseId: number;
	action: string;
	tableName?: string;
	query?: string;
	responseTime?: number;
	rowsAffected?: number;
	metadata?: Record<string, any>;
}

export interface SystemMetricsData {
	tenantId: number;
	cpuUsage: number;
	memoryUsage: number;
	diskUsage: number;
	networkLatency?: number;
	errorRate: number;
	activeConnections?: number;
	metadata?: Record<string, any>;
}

export interface ApiUsageData {
	tenantId: number;
	endpoint: string;
	method: string;
	statusCode: number;
	responseTime: number;
	requestSize?: number;
	responseSize?: number;
	userId?: number;
	ipAddress?: string;
	userAgent?: string;
}

class ActivityTracker {
	private static instance: ActivityTracker;
	private batchSize = 10;
	private batchTimeout = 5000; // 5 seconds
	private userActivityBatch: ActivityData[] = [];
	private databaseActivityBatch: DatabaseActivityData[] = [];
	private apiUsageBatch: ApiUsageData[] = [];
	private batchTimer: NodeJS.Timeout | null = null;

	private constructor() {
		this.startBatchTimer();
	}

	public static getInstance(): ActivityTracker {
		if (!ActivityTracker.instance) {
			ActivityTracker.instance = new ActivityTracker();
		}
		return ActivityTracker.instance;
	}

	private startBatchTimer() {
		if (this.batchTimer) {
			clearTimeout(this.batchTimer);
		}

		this.batchTimer = setTimeout(() => {
			this.flushBatches();
		}, this.batchTimeout);
	}

	private async flushBatches() {
		const promises = [];

		if (this.userActivityBatch.length > 0) {
			promises.push(this.flushUserActivityBatch());
		}

		if (this.databaseActivityBatch.length > 0) {
			promises.push(this.flushDatabaseActivityBatch());
		}

		if (this.apiUsageBatch.length > 0) {
			promises.push(this.flushApiUsageBatch());
		}

		await Promise.allSettled(promises);
		this.startBatchTimer();
	}

	private async flushUserActivityBatch() {
		if (this.userActivityBatch.length === 0) return;

		try {
			await prisma.userActivity.createMany({
				data: this.userActivityBatch.map((activity) => ({
					tenantId: activity.tenantId!,
					userId: activity.userId!,
					action: activity.action,
					resource: activity.resource,
					resourceId: activity.resourceId,
					metadata: activity.metadata,
					ipAddress: activity.ipAddress,
					userAgent: activity.userAgent,
					createdAt: new Date(),
				})),
			});

			this.userActivityBatch = [];
		} catch (error) {
			console.error("Failed to flush user activity batch:", error);
		}
	}

	private async flushDatabaseActivityBatch() {
		if (this.databaseActivityBatch.length === 0) return;

		try {
			await prisma.databaseActivity.createMany({
				data: this.databaseActivityBatch.map((activity) => ({
					tenantId: activity.tenantId,
					databaseId: activity.databaseId,
					action: activity.action,
					tableName: activity.tableName,
					query: activity.query,
					responseTime: activity.responseTime,
					rowsAffected: activity.rowsAffected,
					metadata: activity.metadata,
					createdAt: new Date(),
				})),
			});

			this.databaseActivityBatch = [];
		} catch (error) {
			console.error("Failed to flush database activity batch:", error);
		}
	}

	private async flushApiUsageBatch() {
		if (this.apiUsageBatch.length === 0) return;

		try {
			await prisma.apiUsage.createMany({
				data: this.apiUsageBatch.map((usage) => ({
					tenantId: usage.tenantId,
					endpoint: usage.endpoint,
					method: usage.method,
					statusCode: usage.statusCode,
					responseTime: usage.responseTime,
					requestSize: usage.requestSize,
					responseSize: usage.responseSize,
					userId: usage.userId,
					ipAddress: usage.ipAddress,
					userAgent: usage.userAgent,
					createdAt: new Date(),
				})),
			});

			this.apiUsageBatch = [];
		} catch (error) {
			console.error("Failed to flush API usage batch:", error);
		}
	}

	public trackUserActivity(activity: ActivityData) {
		if (!activity.userId || !activity.tenantId) {
			console.warn("User activity tracking requires userId and tenantId");
			return;
		}

		this.userActivityBatch.push(activity);

		if (this.userActivityBatch.length >= this.batchSize) {
			this.flushUserActivityBatch();
		}
	}

	public trackDatabaseActivity(activity: DatabaseActivityData) {
		this.databaseActivityBatch.push(activity);

		if (this.databaseActivityBatch.length >= this.batchSize) {
			this.flushDatabaseActivityBatch();
		}
	}

	public trackApiUsage(usage: ApiUsageData) {
		this.apiUsageBatch.push(usage);

		if (this.apiUsageBatch.length >= this.batchSize) {
			this.flushApiUsageBatch();
		}
	}

	public async trackSystemMetrics(metrics: SystemMetricsData) {
		try {
			await prisma.systemMetrics.create({
				data: {
					tenantId: metrics.tenantId,
					cpuUsage: metrics.cpuUsage,
					memoryUsage: metrics.memoryUsage,
					diskUsage: metrics.diskUsage,
					networkLatency: metrics.networkLatency,
					errorRate: metrics.errorRate,
					activeConnections: metrics.activeConnections || 0,
					metadata: metrics.metadata,
					createdAt: new Date(),
				},
			});
		} catch (error) {
			console.error("Failed to track system metrics:", error);
		}
	}

	public async trackError(errorData: {
		tenantId: number;
		userId?: number;
		errorType: string;
		errorMessage: string;
		stackTrace?: string;
		endpoint?: string;
		metadata?: Record<string, any>;
	}) {
		try {
			await prisma.errorLog.create({
				data: {
					tenantId: errorData.tenantId,
					userId: errorData.userId,
					errorType: errorData.errorType,
					errorMessage: errorData.errorMessage,
					stackTrace: errorData.stackTrace,
					endpoint: errorData.endpoint,
					metadata: errorData.metadata,
					resolved: false,
					createdAt: new Date(),
				},
			});
		} catch (error) {
			console.error("Failed to track error:", error);
		}
	}

	public async trackPerformanceAlert(alertData: {
		tenantId: number;
		alertType: string;
		metric: string;
		threshold: number;
		currentValue: number;
		severity: string;
		message: string;
	}) {
		try {
			await prisma.performanceAlert.create({
				data: {
					tenantId: alertData.tenantId,
					alertType: alertData.alertType,
					metric: alertData.metric,
					threshold: alertData.threshold,
					currentValue: alertData.currentValue,
					severity: alertData.severity,
					message: alertData.message,
					resolved: false,
					createdAt: new Date(),
				},
			});
		} catch (error) {
			console.error("Failed to track performance alert:", error);
		}
	}

	public async trackTenantUsage(usageData: {
		tenantId: number;
		cpuUsage: number;
		memoryUsage: number;
		storageUsage: number;
		apiCalls: number;
		databaseQueries: number;
		overageAmount?: number;
		lastActivity?: Date;
	}) {
		try {
			await prisma.tenantUsage.create({
				data: {
					tenantId: usageData.tenantId,
					cpuUsage: usageData.cpuUsage,
					memoryUsage: usageData.memoryUsage,
					storageUsage: usageData.storageUsage,
					apiCalls: usageData.apiCalls,
					databaseQueries: usageData.databaseQueries,
					overageAmount: usageData.overageAmount || 0,
					lastActivity: usageData.lastActivity || new Date(),
					createdAt: new Date(),
				},
			});
		} catch (error) {
			console.error("Failed to track tenant usage:", error);
		}
	}

	// Helper method to extract user info from request
	public extractUserInfo(request: NextRequest): {
		userId?: number;
		tenantId?: number;
		ipAddress?: string;
		userAgent?: string;
	} {
		const ipAddress =
			request.ip ||
			request.headers.get("x-forwarded-for") ||
			request.headers.get("x-real-ip") ||
			"unknown";

		const userAgent = request.headers.get("user-agent") || "unknown";

		// Extract user info from headers (set by middleware)
		const userId = request.headers.get("x-user-id");
		const tenantId = request.headers.get("x-tenant-id");

		return {
			userId: userId ? parseInt(userId) : undefined,
			tenantId: tenantId ? parseInt(tenantId) : undefined,
			ipAddress,
			userAgent,
		};
	}

	// Cleanup method
	public async cleanup() {
		if (this.batchTimer) {
			clearTimeout(this.batchTimer);
		}
		await this.flushBatches();
	}
}

export const activityTracker = ActivityTracker.getInstance();

// Helper functions for common tracking scenarios
export function trackUserLogin(
	userId: number,
	tenantId: number,
	request: NextRequest,
) {
	const { ipAddress, userAgent } = activityTracker.extractUserInfo(request);

	activityTracker.trackUserActivity({
		userId,
		tenantId,
		action: "login",
		resource: "auth",
		metadata: {
			loginTime: new Date().toISOString(),
			sessionId: request.headers.get("x-session-id"),
		},
		ipAddress,
		userAgent,
	});
}

export function trackUserLogout(
	userId: number,
	tenantId: number,
	request: NextRequest,
) {
	const { ipAddress, userAgent } = activityTracker.extractUserInfo(request);

	activityTracker.trackUserActivity({
		userId,
		tenantId,
		action: "logout",
		resource: "auth",
		metadata: {
			logoutTime: new Date().toISOString(),
		},
		ipAddress,
		userAgent,
	});
}

export function trackDatabaseOperation(
	tenantId: number,
	databaseId: number,
	action: string,
	tableName?: string,
	query?: string,
	responseTime?: number,
	rowsAffected?: number,
	metadata?: Record<string, any>,
) {
	activityTracker.trackDatabaseActivity({
		tenantId,
		databaseId,
		action,
		tableName,
		query,
		responseTime,
		rowsAffected,
		metadata,
	});
}

export function trackApiCall(
	tenantId: number,
	endpoint: string,
	method: string,
	statusCode: number,
	responseTime: number,
	request: NextRequest,
	userId?: number,
	requestSize?: number,
	responseSize?: number,
) {
	const { ipAddress, userAgent } = activityTracker.extractUserInfo(request);

	activityTracker.trackApiUsage({
		tenantId,
		endpoint,
		method,
		statusCode,
		responseTime,
		requestSize,
		responseSize,
		userId,
		ipAddress,
		userAgent,
	});
}

export function trackSystemPerformance(
	tenantId: number,
	cpuUsage: number,
	memoryUsage: number,
	diskUsage: number,
	networkLatency?: number,
	errorRate: number = 0,
	activeConnections?: number,
) {
	activityTracker.trackSystemMetrics({
		tenantId,
		cpuUsage,
		memoryUsage,
		diskUsage,
		networkLatency,
		errorRate,
		activeConnections,
		metadata: {
			timestamp: new Date().toISOString(),
			serverLoad: Math.round((cpuUsage + memoryUsage) / 2),
		},
	});
}

export function trackError(
	tenantId: number,
	errorType: string,
	errorMessage: string,
	request: NextRequest,
	userId?: number,
	stackTrace?: string,
	metadata?: Record<string, any>,
) {
	const { ipAddress, userAgent } = activityTracker.extractUserInfo(request);

	activityTracker.trackError({
		tenantId,
		userId,
		errorType,
		errorMessage,
		stackTrace,
		endpoint: request.nextUrl.pathname,
		metadata: {
			...metadata,
			ipAddress,
			userAgent,
			timestamp: new Date().toISOString(),
		},
	});
}
