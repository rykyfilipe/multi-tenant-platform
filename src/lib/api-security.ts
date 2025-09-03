/** @format */

import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import prisma from "./prisma";
import { convertMBToBytes } from "./storage-utils";

// Enhanced API security configurations
export const API_SECURITY_CONFIG = {
	// Request size limits - using storage utilities for consistency
	MAX_REQUEST_SIZE: convertMBToBytes(10), // 10MB in bytes
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



// JWT token validation for public API routes
export async function validateJwtToken(token: string): Promise<{
	isValid: boolean;
	userId?: number;
	role?: string;
	error?: string;
}> {
	try {
		const jwt = await import("jsonwebtoken");
		const JWT_SECRET = process.env.PUBLIC_JWT_SECRET || "your-secret-key";

		const decoded = jwt.default.verify(token, JWT_SECRET) as {
			userId: number;
			role: string;
		};

		if (!decoded.userId || !decoded.role) {
			return { isValid: false, error: "Invalid token payload" };
		}

		return {
			isValid: true,
			userId: decoded.userId,
			role: decoded.role,
		};
	} catch (error) {
		return { isValid: false, error: "JWT validation failed" };
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
