/** @format */

import { NextRequest } from "next/server";

interface RateLimitConfig {
	windowMs: number; // Time window in milliseconds
	maxRequests: number; // Maximum requests per window
}

interface RateLimitStore {
	[key: string]: {
		count: number;
		resetTime: number;
	};
}

// In-memory store (in production, use Redis or similar)
const rateLimitStore: RateLimitStore = {};

// Clean up old entries every 5 minutes
setInterval(() => {
	const now = Date.now();
	Object.keys(rateLimitStore).forEach((key) => {
		if (rateLimitStore[key].resetTime < now) {
			delete rateLimitStore[key];
		}
	});
}, 5 * 60 * 1000);

export function getClientIdentifier(request: NextRequest): string {
	// Use IP address as primary identifier
	const ip = request.ip || request.headers.get("x-forwarded-for") || "unknown";

	// For authenticated users, also include user ID for better tracking
	const authHeader = request.headers.get("authorization");
	if (authHeader) {
		// Extract user ID from JWT token if possible
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
): { allowed: boolean; remaining: number; resetTime: number } {
	const now = Date.now();
	const windowStart = now - config.windowMs;

	// Get or create rate limit entry
	if (!rateLimitStore[identifier]) {
		rateLimitStore[identifier] = {
			count: 0,
			resetTime: now + config.windowMs,
		};
	}

	const entry = rateLimitStore[identifier];

	// Reset if window has passed
	if (entry.resetTime < now) {
		entry.count = 0;
		entry.resetTime = now + config.windowMs;
	}

	// Check if limit exceeded
	if (entry.count >= config.maxRequests) {
		return {
			allowed: false,
			remaining: 0,
			resetTime: entry.resetTime,
		};
	}

	// Increment counter
	entry.count++;

	return {
		allowed: true,
		remaining: config.maxRequests - entry.count,
		resetTime: entry.resetTime,
	};
}

// Predefined rate limit configurations
export const RATE_LIMITS = {
	// Authentication endpoints - stricter limits
	auth: {
		windowMs: 15 * 60 * 1000, // 15 minutes
		maxRequests: 5, // 5 attempts per 15 minutes
	},

	// API endpoints - moderate limits
	api: {
		windowMs: 60 * 1000, // 1 minute
		maxRequests: 100, // 100 requests per minute
	},

	// Public endpoints - more lenient
	public: {
		windowMs: 60 * 1000, // 1 minute
		maxRequests: 1000, // 1000 requests per minute
	},

	// Contact form - prevent spam
	contact: {
		windowMs: 60 * 60 * 1000, // 1 hour
		maxRequests: 3, // 3 submissions per hour
	},
} as const;

export function createRateLimitMiddleware(config: RateLimitConfig) {
	return function rateLimitMiddleware(request: NextRequest) {
		const identifier = getClientIdentifier(request);
		const result = checkRateLimit(identifier, config);

		return result;
	};
}
