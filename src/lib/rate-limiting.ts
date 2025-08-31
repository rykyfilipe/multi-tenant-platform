/** @format */

import { NextRequest, NextResponse } from "next/server";

interface RateLimitConfig {
	windowMs: number; // Time window in milliseconds
	maxRequests: number; // Maximum requests per window
	blockDuration?: number; // Duration to block after limit exceeded (optional)
}

interface RateLimitStore {
	[key: string]: {
		count: number;
		resetTime: number;
		blockedUntil?: number; // When the IP is blocked until
		attempts: number; // Track failed attempts for progressive delays
	};
}

// In-memory store (in production, use Redis or similar)
const rateLimitStore: RateLimitStore = {};

// Clean up old entries every 5 minutes
setInterval(() => {
	const now = Date.now();
	Object.keys(rateLimitStore).forEach((key) => {
		const entry = rateLimitStore[key];
		if (
			entry.resetTime < now &&
			(!entry.blockedUntil || entry.blockedUntil < now)
		) {
			delete rateLimitStore[key];
		}
	});
}, 5 * 60 * 1000);

export function getClientIdentifier(request: NextRequest): string {
	// Use IP address as primary identifier
	const ip =
		request.headers.get("x-forwarded-for") ||
		request.headers.get("x-real-ip") ||
		request.headers.get("cf-connecting-ip") ||
		request.headers.get("x-client-ip") ||
		"unknown";

	// For authenticated users, also include user ID for better tracking
	const authHeader = request.headers.get("authorization");
	if (authHeader) {
		try {
			const token = authHeader.replace("Bearer ", "");
			// In a real implementation, you'd decode the JWT to get user ID
			// For now, we'll use a hash of the token
			return `${ip}-${token.substring(0, 10)}`;
		} catch {
			// Fallback to IP only
		}
	}

	return ip;
}

export function checkRateLimit(
	identifier: string,
	config: RateLimitConfig,
): {
	allowed: boolean;
	remaining: number;
	resetTime: number;
	blocked?: boolean;
	retryAfter?: number;
} {
	const now = Date.now();
	const entry = rateLimitStore[identifier];

	// Check if IP is currently blocked
	if (entry?.blockedUntil && entry.blockedUntil > now) {
		return {
			allowed: false,
			remaining: 0,
			resetTime: entry.blockedUntil,
			blocked: true,
			retryAfter: Math.ceil((entry.blockedUntil - now) / 1000),
		};
	}

	// Get or create rate limit entry
	if (!entry || entry.resetTime < now) {
		rateLimitStore[identifier] = {
			count: 0,
			resetTime: now + config.windowMs,
			attempts: 0,
		};
	}

	const currentEntry = rateLimitStore[identifier];

	// Check if limit exceeded
	if (currentEntry.count >= config.maxRequests) {
		// Increment failed attempts and apply progressive delays
		currentEntry.attempts++;

		// Calculate block duration based on attempts (progressive delays)
		const blockDuration =
			config.blockDuration ||
			Math.min(
				60 * 1000 * Math.pow(2, currentEntry.attempts - 1),
				24 * 60 * 60 * 1000,
			); // Max 24 hours

		currentEntry.blockedUntil = now + blockDuration;

		return {
			allowed: false,
			remaining: 0,
			resetTime: currentEntry.resetTime,
			blocked: true,
			retryAfter: Math.ceil(blockDuration / 1000),
		};
	}

	// Increment counter
	currentEntry.count++;

	return {
		allowed: true,
		remaining: config.maxRequests - currentEntry.count,
		resetTime: currentEntry.resetTime,
	};
}

// Enhanced rate limit configurations
export const RATE_LIMITS = {
	// Authentication endpoints - very strict limits
	auth: {
		windowMs: 15 * 60 * 1000, // 15 minutes
		maxRequests: 5, // 5 attempts per 15 minutes
		blockDuration: 30 * 60 * 1000, // Block for 30 minutes after limit exceeded
	},

	// Login attempts - extremely strict
	login: {
		windowMs: 60 * 60 * 1000, // 1 hour
		maxRequests: 3, // 3 attempts per hour
		blockDuration: 60 * 60 * 1000, // Block for 1 hour after limit exceeded
	},

	// Password reset - moderate limits
	passwordReset: {
		windowMs: 60 * 60 * 1000, // 1 hour
		maxRequests: 3, // 3 attempts per hour
		blockDuration: 60 * 60 * 1000, // Block for 1 hour after limit exceeded
	},

	// API endpoints - moderate limits
	api: {
		windowMs: 60 * 1000, // 1 minute
		maxRequests: 100, // 100 requests per minute
		blockDuration: 5 * 60 * 1000, // Block for 5 minutes after limit exceeded
	},

	// Public endpoints - more lenient
	public: {
		windowMs: 60 * 1000, // 1 minute
		maxRequests: 1000, // 1000 requests per minute
		blockDuration: 2 * 60 * 1000, // Block for 2 minutes after limit exceeded
	},

	// Contact form - prevent spam
	contact: {
		windowMs: 60 * 60 * 1000, // 1 hour
		maxRequests: 3, // 3 submissions per hour
		blockDuration: 24 * 60 * 60 * 1000, // Block for 24 hours after limit exceeded
	},

	// File uploads - prevent abuse
	upload: {
		windowMs: 60 * 1000, // 1 minute
		maxRequests: 10, // 10 uploads per minute
		blockDuration: 10 * 60 * 1000, // Block for 10 minutes after limit exceeded
	},
} as const;

export function createRateLimitMiddleware(config: RateLimitConfig) {
	return function rateLimitMiddleware(request: NextRequest) {
		const identifier = getClientIdentifier(request);
		const result = checkRateLimit(identifier, config);

		return result;
	};
}

// Rate limiting middleware for API routes
export function withRateLimit(config: RateLimitConfig) {
	return function (handler: Function) {
		return async function (request: NextRequest, ...args: any[]) {
			const identifier = getClientIdentifier(request);
			const result = checkRateLimit(identifier, config);

			if (!result.allowed) {
				const headers: Record<string, string> = {
					"X-RateLimit-Limit": config.maxRequests.toString(),
					"X-RateLimit-Remaining": "0",
					"X-RateLimit-Reset": new Date(result.resetTime).toISOString(),
				};

				if (result.retryAfter) {
					headers["Retry-After"] = result.retryAfter.toString();
				}

				return NextResponse.json(
					{
						error: result.blocked
							? "Too many requests. Please try again later."
							: "Rate limit exceeded. Please try again later.",
						retryAfter: result.retryAfter,
					},
					{
						status: 429,
						headers,
					},
				);
			}

			// Add rate limit headers to successful responses
			const response = await handler(request, ...args);
			if (response instanceof NextResponse) {
				response.headers.set(
					"X-RateLimit-Limit",
					config.maxRequests.toString(),
				);
				response.headers.set(
					"X-RateLimit-Remaining",
					result.remaining.toString(),
				);
				response.headers.set(
					"X-RateLimit-Reset",
					new Date(result.resetTime).toISOString(),
				);
			}

			return response;
		};
	};
}
