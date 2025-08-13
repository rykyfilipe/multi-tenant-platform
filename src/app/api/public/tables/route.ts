/** @format */

import { 
  validateApiToken, 
  checkApiPermissions, 
  createApiSuccessResponse, 
  createApiErrorResponse,
  validateRequestSize,
  logApiSecurityEvent
} from "@/lib/api-security";
import { enhancedCachedOperations } from "@/lib/api-cache";
import { NextRequest } from "next/server";

export async function GET(request: NextRequest) {
	const startTime = Date.now();
	
	try {
		// Validate request size
		if (!validateRequestSize(request)) {
			return createApiErrorResponse(
				"Request too large",
				413,
				{ maxSize: "10MB" }
			);
		}

		// Extract and validate token
		const token = request.headers.get("Authorization")?.split(" ")[1];
		if (!token) {
			return createApiErrorResponse("Missing authorization token", 401);
		}

		const tokenValidation = await validateApiToken(token);
		if (!tokenValidation.isValid) {
			logApiSecurityEvent("invalid_token", { error: tokenValidation.error });
			return createApiErrorResponse(
				tokenValidation.error || "Invalid token",
				401
			);
		}

		const { userId, scopes } = tokenValidation;

		// Validate required scopes
		if (!scopes?.includes("tables:read")) {
			logApiSecurityEvent("insufficient_scopes", { 
				userId, 
				requiredScopes: ["tables:read"],
				userScopes: scopes 
			});
			return createApiErrorResponse(
				"Forbidden: Insufficient permissions",
				403,
				{ requiredScopes: ["tables:read"] }
			);
		}

		// Get user information to determine tenant
		const user = await enhancedCachedOperations.getUser(userId!);
		if (!user) {
			return createApiErrorResponse("User not found", 404);
		}

		if (!user.tenantId) {
			return createApiErrorResponse("User not associated with any tenant", 400);
		}

		// Get public tables from cache
		const tables = await enhancedCachedOperations.getPublicTables(user.tenantId);
		
		// Log successful access
		logApiSecurityEvent("tables_list_access", { 
			userId, 
			tenantId: user.tenantId,
			action: "read",
			duration: Date.now() - startTime,
			tablesCount: tables.length
		});

		// Return success response with security headers
		return createApiSuccessResponse(tables, 200, {
			cacheControl: "public, max-age=300", // 5 minutes cache
			requestId: request.headers.get("X-Request-ID"),
			metadata: {
				totalTables: tables.length,
				tenantId: user.tenantId,
			}
		});

	} catch (error) {
		console.error("Error fetching public tables:", error);
		
		// Log error for security monitoring
		logApiSecurityEvent("api_error", { 
			error: error instanceof Error ? error.message : "Unknown error",
			path: request.nextUrl.pathname
		});

		return createApiErrorResponse(
			"Internal server error",
			500
		);
	}
}
