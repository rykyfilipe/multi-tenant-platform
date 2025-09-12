/** @format */

import { NextRequest, NextResponse } from "next/server";
import { trackApiCall } from "@/lib/activity-tracker";

interface ApiWrapperOptions {
	trackActivity?: boolean;
	trackPerformance?: boolean;
	requireAuth?: boolean;
}

export function withApiTracking(
	handler: (request: NextRequest, context: any) => Promise<NextResponse>,
	options: ApiWrapperOptions = {},
) {
	return async (request: NextRequest, context: any): Promise<NextResponse> => {
		const startTime = Date.now();
		const {
			trackActivity = true,
			trackPerformance = true,
			requireAuth = true,
		} = options;

		try {
			// Execute the original handler
			const response = await handler(request, context);

			// Track API call after successful execution
			if (trackActivity || trackPerformance) {
				setTimeout(async () => {
					try {
						// Extract tenant ID from URL
						const pathParts = request.nextUrl.pathname.split("/");
						const tenantIdIndex = pathParts.findIndex(
							(part) => part === "tenants",
						);
						const tenantId =
							tenantIdIndex !== -1 && pathParts[tenantIdIndex + 1]
								? parseInt(pathParts[tenantIdIndex + 1])
								: undefined;

						// Extract user ID from request (you might need to implement this based on your auth system)
						const userId = extractUserIdFromRequest(request);

						if (tenantId && userId) {
							const responseTime = Date.now() - startTime;
							const requestSize = request.headers.get("content-length")
								? parseInt(request.headers.get("content-length")!)
								: undefined;

							trackApiCall(
								tenantId,
								request.nextUrl.pathname,
								request.method,
								response.status,
								responseTime,
								request,
								userId,
								requestSize,
							);
						}
					} catch (error) {
						console.warn("Failed to track API call:", error);
					}
				}, 0);
			}

			return response;
		} catch (error) {
			// Track failed API calls
			if (trackActivity) {
				setTimeout(async () => {
					try {
						const pathParts = request.nextUrl.pathname.split("/");
						const tenantIdIndex = pathParts.findIndex(
							(part) => part === "tenants",
						);
						const tenantId =
							tenantIdIndex !== -1 && pathParts[tenantIdIndex + 1]
								? parseInt(pathParts[tenantIdIndex + 1])
								: undefined;

						const userId = extractUserIdFromRequest(request);

						if (tenantId && userId) {
							const responseTime = Date.now() - startTime;

							trackApiCall(
								tenantId,
								request.nextUrl.pathname,
								request.method,
								500, // Error status
								responseTime,
								request,
								userId,
								undefined,
							);
						}
					} catch (trackingError) {
						console.warn("Failed to track failed API call:", trackingError);
					}
				}, 0);
			}

			throw error;
		}
	};
}

function extractUserIdFromRequest(request: NextRequest): number | undefined {
	// This is a placeholder - you'll need to implement this based on your auth system
	// You might extract it from JWT tokens, session cookies, or other auth mechanisms

	// For now, return undefined - this should be implemented based on your auth system
	// Example implementations:

	// 1. From JWT token in Authorization header:
	// const authHeader = request.headers.get("authorization");
	// if (authHeader?.startsWith("Bearer ")) {
	//   const token = authHeader.substring(7);
	//   const decoded = jwt.verify(token, process.env.JWT_SECRET);
	//   return decoded.userId;
	// }

	// 2. From session cookie:
	// const sessionCookie = request.cookies.get("session");
	// if (sessionCookie) {
	//   const session = await getSession(sessionCookie.value);
	//   return session?.userId;
	// }

	return undefined;
}

// Helper function to wrap API routes with tracking
export function createTrackedApiRoute(
	handler: (request: NextRequest, context: any) => Promise<NextResponse>,
	options?: ApiWrapperOptions,
) {
	return withApiTracking(handler, options);
}
