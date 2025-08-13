/** @format */

import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";

// Enhanced API security configurations
export const API_SECURITY_CONFIG = {
	// Request size limits
	MAX_REQUEST_SIZE: 10 * 1024 * 1024, // 10MB
	MAX_JSON_DEPTH: 10,
	MAX_ARRAY_LENGTH: 1000,

	// Rate limiting for public API
	PUBLIC_API_RATE_LIMIT: {
		windowMs: 60 * 1000, // 1 minute
		maxRequests: 100, // 100 requests per minute per token
		blockDuration: 5 * 60 * 1000, // Block for 5 minutes
	},

	// Caching configuration
	CACHE_TTL: {
		public_tables: 5 * 60, // 5 minutes
		table_schema: 15 * 60, // 15 minutes
		user_permissions: 2 * 60, // 2 minutes
	},

	// Security headers for API responses
	SECURITY_HEADERS: {
		"X-Content-Type-Options": "nosniff",
		"X-Frame-Options": "DENY",
		"X-XSS-Protection": "1; mode=block",
		"Referrer-Policy": "strict-origin-when-cross-origin",
		"Strict-Transport-Security": "max-age=31536000; includeSubDomains",
	},
};

// Input validation schemas
export const API_VALIDATION_SCHEMAS = {
	pagination: z.object({
		page: z.coerce.number().int().min(1).max(1000).default(1),
		pageSize: z.coerce.number().int().min(1).max(100).default(25),
	}),

	tableId: z.coerce.number().int().positive(),
	rowId: z.coerce.number().int().positive(),

	// Enhanced data validation for different column types
	columnValue: z.union([
		z.string().max(10000), // Max 10KB for text fields
		z.number().finite(),
		z.boolean(),
		z.string().datetime(), // ISO date string
		z.array(z.string()).max(100), // Max 100 items for arrays
	]),
};

// Enhanced API token validation
export async function validateApiToken(token: string): Promise<{
	isValid: boolean;
	userId?: number;
	scopes?: string[];
	error?: string;
}> {
	try {
		const { PrismaClient } = require("@/lib/prisma");
		const prisma = new PrismaClient();

		const apiToken = await prisma.apiToken.findFirst({
			where: {
				tokenHash: token,
				revoked: false,
			},
			select: {
				userId: true,
				scopes: true,
				expiresAt: true,
			},
		});

		if (!apiToken) {
			return { isValid: false, error: "Invalid or revoked token" };
		}

		if (apiToken.expiresAt && apiToken.expiresAt < new Date()) {
			return { isValid: false, error: "Token expired" };
		}

		return {
			isValid: true,
			userId: apiToken.userId,
			scopes: apiToken.scopes,
		};
	} catch (error) {
		return { isValid: false, error: "Token validation failed" };
	}
}

// Enhanced permission checking
export async function checkApiPermissions(
	userId: number,
	tableId: number,
	requiredScopes: string[],
): Promise<{
	hasAccess: boolean;
	error?: string;
	permissions?: {
		canRead: boolean;
		canWrite: boolean;
		canDelete: boolean;
	};
}> {
	try {
		const { PrismaClient } = require("@/lib/prisma");
		const prisma = new PrismaClient();

		// Check API token scopes
		const token = await prisma.apiToken.findFirst({
			where: { userId, revoked: false },
			select: { scopes: true },
		});

		if (!token) {
			return { hasAccess: false, error: "No valid API token found" };
		}

		// Check if token has required scopes
		const hasRequiredScopes = requiredScopes.every((scope) =>
			token.scopes.includes(scope),
		);

		if (!hasRequiredScopes) {
			return { hasAccess: false, error: "Insufficient token scopes" };
		}

		// Check table permissions
		const tablePermission = await prisma.tablePermission.findUnique({
			where: { userId_tableId: { userId, tableId } },
			select: {
				canRead: true,
				canEdit: true,
				canDelete: true,
			},
		});

		if (!tablePermission) {
			return { hasAccess: false, error: "No table permissions found" };
		}

		return {
			hasAccess: true,
			permissions: {
				canRead: tablePermission.canRead,
				canWrite: tablePermission.canEdit,
				canDelete: tablePermission.canDelete,
			},
		};
	} catch (error) {
		return { hasAccess: false, error: "Permission check failed" };
	}
}

// Enhanced input sanitization
export function sanitizeApiInput(input: any, maxDepth: number = 0): any {
	if (maxDepth > API_SECURITY_CONFIG.MAX_JSON_DEPTH) {
		throw new Error("Input too deep");
	}

	if (Array.isArray(input)) {
		if (input.length > API_SECURITY_CONFIG.MAX_ARRAY_LENGTH) {
			throw new Error("Array too long");
		}
		return input.map((item) => sanitizeApiInput(item, maxDepth + 1));
	}

	if (typeof input === "object" && input !== null) {
		const sanitized: any = {};
		for (const [key, value] of Object.entries(input)) {
			// Sanitize key names
			const sanitizedKey = key.replace(/[^a-zA-Z0-9_]/g, "");
			if (sanitizedKey) {
				sanitized[sanitizedKey] = sanitizeApiInput(value, maxDepth + 1);
			}
		}
		return sanitized;
	}

	// Sanitize primitive values
	if (typeof input === "string") {
		return input.trim().substring(0, 10000); // Max 10KB
	}

	return input;
}

// Enhanced error handling for API responses
export function createApiErrorResponse(
	error: string,
	statusCode: number = 400,
	details?: any,
): NextResponse {
	const errorResponse = {
		error,
		timestamp: new Date().toISOString(),
		...(details && { details }),
	};

	const response = NextResponse.json(errorResponse, { status: statusCode });

	// Add security headers
	Object.entries(API_SECURITY_CONFIG.SECURITY_HEADERS).forEach(
		([key, value]) => {
			response.headers.set(key, value);
		},
	);

	return response;
}

// Enhanced success response with security headers
export function createApiSuccessResponse(
	data: any,
	statusCode: number = 200,
	metadata?: any,
): NextResponse {
	const response = NextResponse.json(
		{
			data,
			timestamp: new Date().toISOString(),
			...(metadata && { metadata }),
		},
		{ status: statusCode },
	);

	// Add security headers
	Object.entries(API_SECURITY_CONFIG.SECURITY_HEADERS).forEach(
		([key, value]) => {
			response.headers.set(key, value);
		},
	);

	return response;
}

// Request size validation
export function validateRequestSize(request: NextRequest): boolean {
	const contentLength = request.headers.get("content-length");
	if (contentLength) {
		const size = parseInt(contentLength);
		if (size > API_SECURITY_CONFIG.MAX_REQUEST_SIZE) {
			return false;
		}
	}
	return true;
}

// Enhanced logging for security monitoring
export function logApiSecurityEvent(
	event: string,
	details: {
		userId?: number;
		tableId?: number;
		action?: string;
		ip?: string;
		userAgent?: string;
		error?: string;
		requiredScopes?: string[];
		userScopes?: string[];
		duration?: number;
		path?: string;
	},
): void {
	const logEntry = {
		timestamp: new Date().toISOString(),
		event,
		...details,
	};

	// Log to console for development, use proper logging service in production
	console.log("[API Security]", logEntry);

	// In production, send to security monitoring service
	// await securityMonitoringService.log(logEntry);
}
