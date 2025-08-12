/** @format */

import { NextResponse } from "next/server";
import { z } from "zod";

export interface AppError extends Error {
	statusCode?: number;
	code?: string;
	isOperational?: boolean;
}

export class ValidationError extends Error implements AppError {
	statusCode = 400;
	code = "VALIDATION_ERROR";
	isOperational = true;

	constructor(message: string) {
		super(message);
		this.name = "ValidationError";
	}
}

export class AuthenticationError extends Error implements AppError {
	statusCode = 401;
	code = "AUTHENTICATION_ERROR";
	isOperational = true;

	constructor(message: string = "Authentication required") {
		super(message);
		this.name = "AuthenticationError";
	}
}

export class AuthorizationError extends Error implements AppError {
	statusCode = 403;
	code = "AUTHORIZATION_ERROR";
	isOperational = true;

	constructor(message: string = "Insufficient permissions") {
		super(message);
		this.name = "AuthorizationError";
	}
}

export class NotFoundError extends Error implements AppError {
	statusCode = 404;
	code = "NOT_FOUND";
	isOperational = true;

	constructor(resource: string = "Resource") {
		super(`${resource} not found`);
		this.name = "NotFoundError";
	}
}

export class ConflictError extends Error implements AppError {
	statusCode = 409;
	code = "CONFLICT";
	isOperational = true;

	constructor(message: string) {
		super(message);
		this.name = "ConflictError";
	}
}

export class RateLimitError extends Error implements AppError {
	statusCode = 429;
	code = "RATE_LIMIT_EXCEEDED";
	isOperational = true;

	constructor(message: string = "Rate limit exceeded") {
		super(message);
		this.name = "RateLimitError";
	}
}

export class InternalServerError extends Error implements AppError {
	statusCode = 500;
	code = "INTERNAL_SERVER_ERROR";
	isOperational = false;

	constructor(message: string = "Internal server error") {
		super(message);
		this.name = "InternalServerError";
	}
}

// Error handler for API routes
export function handleApiError(error: unknown): NextResponse {
	if (error instanceof Error && "statusCode" in error) {
		const appError = error as AppError;
		return NextResponse.json(
			{
				error: appError.message,
				code: appError.code,
				statusCode: appError.statusCode,
			},
			{ status: appError.statusCode }
		);
	}

	// Log unexpected errors in development
	if (process.env.NODE_ENV === "development") {
		// Unexpected error logged
	}

	// Return generic error for production
	return NextResponse.json(
		{
			error: "An unexpected error occurred",
			code: "INTERNAL_SERVER_ERROR",
		},
		{ status: 500 }
	);
}

// Client-side error handler
export function handleClientError(error: unknown): string {
	if (error instanceof Error) {
		return error.message;
	}
	return "An unexpected error occurred";
}

// Enhanced error handling for production
export function sanitizeError(error: any, isProduction: boolean = process.env.NODE_ENV === 'production'): string {
	if (isProduction) {
		// In production, don't expose internal errors
		if (error instanceof Error) {
			// Log the full error for debugging
			console.error('Internal error:', error);
			
			// Return generic message
			return 'An internal error occurred. Please try again later.';
		}
		
		// For non-Error objects, return generic message
		return 'An unexpected error occurred. Please try again later.';
	}
	
	// In development, return the actual error message
	return error instanceof Error ? error.message : String(error);
}

// Enhanced validation with better error messages
export function validatePassword(password: string): void {
	if (password.length < 12) {
		throw new Error("Password must be at least 12 characters long");
	}
	
	if (!/(?=.*[a-z])/.test(password)) {
		throw new Error("Password must contain at least one lowercase letter");
	}
	
	if (!/(?=.*[A-Z])/.test(password)) {
		throw new Error("Password must contain at least one uppercase letter");
	}
	
	if (!/(?=.*\d)/.test(password)) {
		throw new Error("Password must contain at least one number");
	}
	
	if (!/(?=.*[@$!%*?&])/.test(password)) {
		throw new Error("Password must contain at least one special character (@$!%*?&)");
	}
	
	// Check for repeated characters
	if (/(.)\1{2,}/.test(password)) {
		throw new Error("Password cannot contain repeated characters (e.g., 'aaa', '111')");
	}
	
	// Check for repeated patterns
	if (/(.)(.)\1\2/.test(password)) {
		throw new Error("Password cannot contain repeated patterns (e.g., 'abab')");
	}
	
	// Check for common weak passwords
	const commonPasswords = [
		'password', '123456', 'qwerty', 'admin', 'letmein',
		'welcome', 'monkey', 'dragon', 'master', 'hello'
	];
	
	if (commonPasswords.includes(password.toLowerCase())) {
		throw new Error("Password is too common. Please choose a more unique password");
	}
}

// Enhanced input sanitization
export function sanitizeInput(input: string): string {
	return input
		.replace(/[<>]/g, '') // Remove < and >
		.replace(/javascript:/gi, '') // Remove javascript: protocol
		.replace(/on\w+\s*=/gi, '') // Remove event handlers
		.trim();
}

// Enhanced SQL injection prevention
export function containsSqlInjection(input: string): boolean {
	const sqlPatterns = [
		/\b(SELECT|INSERT|UPDATE|DELETE|DROP|CREATE|ALTER|EXEC|EXECUTE|TRUNCATE|MERGE|UNION|JOIN|WHERE|FROM|INTO|VALUES|SET|HAVING|GROUP BY|ORDER BY)\b/i,
		/['";]/, // Single quotes, double quotes, semicolons
		/--/, // SQL comments
		/\b(OR|AND)\s+\d+\s*=\s*\d+/i, // OR 1=1, AND 1=1 patterns
		/\b(OR|AND)\s+['"]\w+['"]\s*=\s*['"]\w+['"]/i, // OR 'a'='a' patterns
		/\b(OR|AND)\s+\w+\s*=\s*\w+/i, // OR column=value patterns
		/\b(INFORMATION_SCHEMA|sys\.|pg_|mysql\.|sqlite_)\b/i, // Database system tables
		/\b(WAITFOR|DELAY|SLEEP|BENCHMARK)\b/i, // Time-based attacks
		/\b(LOAD_FILE|INTO OUTFILE|DUMPFILE)\b/i, // File operations
		/\b(USER|VERSION|DATABASE|SCHEMA)\b/i, // System functions
	];

	return sqlPatterns.some((pattern) => pattern.test(input));
}

// Enhanced XSS prevention
export function containsXSS(input: string): boolean {
	const xssPatterns = [
		/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi,
		/javascript:/gi,
		/on\w+\s*=/gi,
		/<iframe\b[^<]*(?:(?!<\/iframe>)<[^<]*)*<\/iframe>/gi,
		/<object\b[^<]*(?:(?!<\/object>)<[^<]*)*<\/object>/gi,
		/<embed\b[^<]*(?:(?!<\/embed>)<[^<]*)*<\/embed>/gi,
		/<form\b[^<]*(?:(?!<\/form>)<[^<]*)*<\/form>/gi,
		/<input\b[^<]*(?:(?!\/>)<[^<]*)*\/?>/gi,
		/<textarea\b[^<]*(?:(?!<\/textarea>)<[^<]*)*<\/textarea>/gi,
		/<select\b[^<]*(?:(?!<\/select>)<[^<]*)*<\/select>/gi,
		/<button\b[^<]*(?:(?!<\/button>)<[^<]*)*<\/button>/gi,
		/<link\b[^<]*(?:(?!\/>)<[^<]*)*\/?>/gi,
		/<meta\b[^<]*(?:(?!\/>)<[^<]*)*\/?>/gi,
		/<style\b[^<]*(?:(?!<\/style>)<[^<]*)*<\/style>/gi,
		/expression\s*\(/gi,
		/url\s*\(/gi,
		/eval\s*\(/gi,
		/setTimeout\s*\(/gi,
		/setInterval\s*\(/gi,
		/Function\s*\(/gi,
		/constructor\s*\(/gi,
		/prototype\s*\./gi,
		/__proto__/gi,
		/constructor\.constructor/gi,
	];

	return xssPatterns.some((pattern) => pattern.test(input));
}

// Enhanced input validation with comprehensive checks
export function validateInput(
	input: any,
	type: string,
): { isValid: boolean; error?: string; sanitized?: any } {
	try {
		let schema: z.ZodSchema;
		let sanitized: any;

		switch (type) {
			case "email":
				schema = emailSchema;
				break;
			case "password":
				schema = passwordSchema;
				break;
			case "name":
				schema = nameSchema;
				break;
			case "database_name":
				schema = databaseNameSchema;
				break;
			case "table_name":
				schema = tableNameSchema;
				break;
			case "column_name":
				schema = columnNameSchema;
				break;
			case "token_name":
				schema = tokenNameSchema;
				break;
			case "tenant_name":
				schema = tenantNameSchema;
				break;
			default:
				return { isValid: false, error: "Unknown validation type" };
		}

		// Additional security checks
		if (typeof input === 'string') {
			// Check for SQL injection
			if (containsSqlInjection(input)) {
				return { isValid: false, error: "Input contains potentially dangerous content" };
			}

			// Check for XSS
			if (containsXSS(input)) {
				return { isValid: false, error: "Input contains potentially dangerous content" };
			}

			// Sanitize input
			sanitized = sanitizeInput(input);
		}

		const validated = schema.parse(sanitized || input);
		return { isValid: true, sanitized: validated };
	} catch (error) {
		if (error instanceof z.ZodError) {
			return { isValid: false, error: error.errors[0].message };
		}
		return { isValid: false, error: "Validation failed" };
	}
}

// Enhanced rate limiting helper with better security
export function createRateLimiter(maxRequests: number, windowMs: number) {
	const requests = new Map<string, { count: number; resetTime: number; blockedUntil?: number }>();

	return function checkRateLimit(identifier: string): boolean {
		const now = Date.now();
		const userRequests = requests.get(identifier);

		// Check if blocked
		if (userRequests?.blockedUntil && userRequests.blockedUntil > now) {
			return false;
		}

		if (!userRequests || now > userRequests.resetTime) {
			requests.set(identifier, { count: 1, resetTime: now + windowMs });
			return true;
		}

		if (userRequests.count >= maxRequests) {
			// Block for progressive duration
			const blockDuration = Math.min(windowMs * 2, 24 * 60 * 60 * 1000); // Max 24 hours
			userRequests.blockedUntil = now + blockDuration;
			return false;
		}

		userRequests.count++;
		return true;
	};
}

// Security logging
export function logSecurityEvent(event: string, details: any, level: 'info' | 'warn' | 'error' = 'info') {
	const logEntry = {
		timestamp: new Date().toISOString(),
		event,
		details,
		level,
		ip: details.ip || 'unknown',
		userAgent: details.userAgent || 'unknown',
		userId: details.userId || 'anonymous',
	};

	switch (level) {
		case 'error':
			console.error('SECURITY ERROR:', logEntry);
			break;
		case 'warn':
			console.warn('SECURITY WARNING:', logEntry);
			break;
		default:
			console.log('SECURITY INFO:', logEntry);
	}

	// In production, you might want to send this to a security monitoring service
	if (process.env.NODE_ENV === 'production') {
		// TODO: Send to security monitoring service
	}
} 