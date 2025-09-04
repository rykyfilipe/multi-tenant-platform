/** @format */

import { NextRequest, NextResponse } from "next/server";
import {
	activityTracker,
	trackDatabaseOperation,
} from "@/lib/activity-tracker";
import { requireAuthAPI } from "@/lib/session";

export interface ApiTrackingOptions {
	trackUserActivity?: boolean;
	trackDatabaseActivity?: boolean;
	activityAction?: string;
	activityResource?: string;
	requireAuth?: boolean;
}

export function withApiTracking(
	handler: (request: NextRequest, context: any) => Promise<NextResponse>,
	options: ApiTrackingOptions = {},
) {
	return async (request: NextRequest, context: any): Promise<NextResponse> => {
		const startTime = Date.now();
		let response: NextResponse;
		let userId: number | undefined;
		let tenantId: number | undefined;

		try {
			// Extract user info if authentication is required
			if (options.requireAuth !== false) {
				const sessionResult = await requireAuthAPI();
				if (sessionResult instanceof NextResponse) {
					return sessionResult; // Return error response
				}
				userId = parseInt(sessionResult.user.id);
				tenantId = sessionResult.user.tenantId ? parseInt(sessionResult.user.tenantId) : undefined;
			}

			// Execute the original handler
			response = await handler(request, context);

			// Track user activity if enabled
			if (
				options.trackUserActivity &&
				userId &&
				tenantId &&
				options.activityAction
			) {
				const userInfo = activityTracker.extractUserInfo(request);

				activityTracker.trackUserActivity({
					userId,
					tenantId,
					action: options.activityAction,
					resource: options.activityResource || "api",
					metadata: {
						endpoint: request.nextUrl.pathname,
						method: request.method,
						statusCode: response.status,
						responseTime: Date.now() - startTime,
						timestamp: new Date().toISOString(),
					},
					ipAddress: userInfo.ipAddress,
					userAgent: userInfo.userAgent,
				});
			}

			return response;
		} catch (error) {
			// Track errors
			if (tenantId) {
				activityTracker.trackError({
					tenantId,
					userId,
					errorType: "API_ERROR",
					errorMessage:
						error instanceof Error ? error.message : "Unknown error",
					stackTrace: error instanceof Error ? error.stack : undefined,
					endpoint: request.nextUrl.pathname,
					metadata: {
						method: request.method,
						responseTime: Date.now() - startTime,
					},
				});
			}

			throw error;
		}
	};
}

export function withDatabaseTracking(
	handler: (request: NextRequest, context: any) => Promise<NextResponse>,
	options: {
		databaseId: number;
		operation: string;
		tableName?: string;
		requireAuth?: boolean;
	} = { databaseId: 0, operation: "unknown" },
) {
	return async (request: NextRequest, context: any): Promise<NextResponse> => {
		const startTime = Date.now();
		let response: NextResponse;
		let tenantId: number | undefined;

		try {
			// Extract tenant info
			if (options.requireAuth !== false) {
				const sessionResult = await requireAuthAPI();
				if (sessionResult instanceof NextResponse) {
					return sessionResult;
				}
				tenantId = sessionResult.user.tenantId ? parseInt(sessionResult.user.tenantId) : undefined;
			}

			// Execute the original handler
			response = await handler(request, context);

			// Track database operation
			if (tenantId && options.databaseId) {
				const responseTime = Date.now() - startTime;

				trackDatabaseOperation(
					tenantId,
					options.databaseId,
					options.operation,
					options.tableName,
					undefined, // query - would need to be extracted from request
					responseTime,
					undefined, // rowsAffected - would need to be extracted from response
					{
						endpoint: request.nextUrl.pathname,
						method: request.method,
						statusCode: response.status,
						timestamp: new Date().toISOString(),
					},
				);
			}

			return response;
		} catch (error) {
			// Track database errors
			if (tenantId) {
				activityTracker.trackError({
					tenantId,
					errorType: "DATABASE_ERROR",
					errorMessage:
						error instanceof Error
							? error.message
							: "Database operation failed",
					stackTrace: error instanceof Error ? error.stack : undefined,
					endpoint: request.nextUrl.pathname,
					metadata: {
						databaseId: options.databaseId,
						operation: options.operation,
						tableName: options.tableName,
						method: request.method,
						responseTime: Date.now() - startTime,
					},
				});
			}

			throw error;
		}
	};
}

// Helper function to track specific database operations
export function trackDatabaseOperationFromResponse(
	tenantId: number,
	databaseId: number,
	operation: string,
	tableName: string,
	response: any,
	startTime: number,
) {
	const responseTime = Date.now() - startTime;
	let rowsAffected = 0;

	// Extract rows affected from response
	if (response && typeof response === "object") {
		if (Array.isArray(response)) {
			rowsAffected = response.length;
		} else if (response.rowsAffected !== undefined) {
			rowsAffected = response.rowsAffected;
		} else if (response.count !== undefined) {
			rowsAffected = response.count;
		} else if (response.data && Array.isArray(response.data)) {
			rowsAffected = response.data.length;
		}
	}

	trackDatabaseOperation(
		tenantId,
		databaseId,
		operation,
		tableName,
		undefined,
		responseTime,
		rowsAffected,
		{
			timestamp: new Date().toISOString(),
			responseType: typeof response,
		},
	);
}

// Helper function to track user actions
export function trackUserAction(
	userId: number,
	tenantId: number,
	action: string,
	resource: string,
	resourceId?: number,
	request?: NextRequest,
	metadata?: Record<string, any>,
) {
	const userInfo = request ? activityTracker.extractUserInfo(request) : {};

	activityTracker.trackUserActivity({
		userId,
		tenantId,
		action,
		resource,
		resourceId,
		metadata: {
			...metadata,
			timestamp: new Date().toISOString(),
		},
		ipAddress: userInfo.ipAddress,
		userAgent: userInfo.userAgent,
	});
}

// Helper function to track system performance
export function trackSystemPerformance(
	tenantId: number,
	cpuUsage: number,
	memoryUsage: number,
	diskUsage: number,
	networkLatency?: number,
	errorRate: number = 0,
) {
	activityTracker.trackSystemMetrics({
		tenantId,
		cpuUsage,
		memoryUsage,
		diskUsage,
		networkLatency,
		errorRate,
		metadata: {
			timestamp: new Date().toISOString(),
			serverLoad: Math.round((cpuUsage + memoryUsage) / 2),
		},
	});
}

// Helper function to track tenant usage
export function trackTenantUsage(
	tenantId: number,
	cpuUsage: number,
	memoryUsage: number,
	storageUsage: number,
	apiCalls: number,
	databaseQueries: number,
	overageAmount?: number,
) {
	activityTracker.trackTenantUsage({
		tenantId,
		cpuUsage,
		memoryUsage,
		storageUsage,
		apiCalls,
		databaseQueries,
		overageAmount,
		lastActivity: new Date(),
	});
}
