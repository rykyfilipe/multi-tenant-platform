/** @format */

import { NextResponse } from "next/server";

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
		console.error("Unexpected error:", error);
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

// Validation utilities
export function validateRequired(value: any, fieldName: string): void {
	if (value === null || value === undefined || value === "") {
		throw new ValidationError(`${fieldName} is required`);
	}
}

export function validateEmail(email: string): void {
	const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
	if (!emailRegex.test(email)) {
		throw new ValidationError("Invalid email format");
	}
}

export function validatePassword(password: string): void {
	if (password.length < 8) {
		throw new ValidationError("Password must be at least 8 characters long");
	}
	if (!/(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/.test(password)) {
		throw new ValidationError("Password must contain at least one uppercase letter, one lowercase letter, and one number");
	}
}

// Rate limiting helper
export function createRateLimiter(maxRequests: number, windowMs: number) {
	const requests = new Map<string, { count: number; resetTime: number }>();

	return function checkRateLimit(identifier: string): boolean {
		const now = Date.now();
		const userRequests = requests.get(identifier);

		if (!userRequests || now > userRequests.resetTime) {
			requests.set(identifier, { count: 1, resetTime: now + windowMs });
			return true;
		}

		if (userRequests.count >= maxRequests) {
			return false;
		}

		userRequests.count++;
		return true;
	};
} 