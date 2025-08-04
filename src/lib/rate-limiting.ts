/** @format */

import { NextRequest, NextResponse } from "next/server";

interface RateLimitConfig {
	maxRequests: number;
	windowMs: number;
	message?: string;
}

interface RateLimitStore {
	[key: string]: {
		count: number;
		resetTime: number;
	};
}

// In-memory store for rate limiting (use Redis in production)
const rateLimitStore: RateLimitStore = {};

export function createRateLimiter(config: RateLimitConfig) {
	const { maxRequests, windowMs, message = "Too many requests" } = config;

	return function rateLimitMiddleware(request: NextRequest): NextResponse | null {
		const identifier = getClientIdentifier(request);
		const now = Date.now();

		// Clean up expired entries
		Object.keys(rateLimitStore).forEach(key => {
			if (rateLimitStore[key].resetTime < now) {
				delete rateLimitStore[key];
			}
		});

		const clientData = rateLimitStore[identifier];

		if (!clientData || now > clientData.resetTime) {
			// First request or window expired
			rateLimitStore[identifier] = {
				count: 1,
				resetTime: now + windowMs,
			};
			return null; // Allow request
		}

		if (clientData.count >= maxRequests) {
			// Rate limit exceeded
			return NextResponse.json(
				{
					error: message,
					code: "RATE_LIMIT_EXCEEDED",
					retryAfter: Math.ceil((clientData.resetTime - now) / 1000),
				},
				{
					status: 429,
					headers: {
						"Retry-After": Math.ceil((clientData.resetTime - now) / 1000).toString(),
						"X-RateLimit-Limit": maxRequests.toString(),
						"X-RateLimit-Remaining": "0",
						"X-RateLimit-Reset": new Date(clientData.resetTime).toISOString(),
					},
				}
			);
		}

		// Increment count
		clientData.count++;
		return null; // Allow request
	};
}

function getClientIdentifier(request: NextRequest): string {
	// Use IP address as primary identifier
	const ip = request.headers.get("x-forwarded-for") || 
	           request.headers.get("x-real-ip") || 
	           request.headers.get("cf-connecting-ip") || 
	           "unknown";
	
	// Add user agent for additional uniqueness
	const userAgent = request.headers.get("user-agent") || "";
	
	// Add path for per-endpoint rate limiting
	const path = request.nextUrl.pathname;
	
	return `${ip}:${userAgent}:${path}`;
}

// Predefined rate limiters
export const authRateLimiter = createRateLimiter({
	maxRequests: 5,
	windowMs: 15 * 60 * 1000, // 15 minutes
	message: "Too many authentication attempts",
});

export const apiRateLimiter = createRateLimiter({
	maxRequests: 100,
	windowMs: 60 * 1000, // 1 minute
	message: "API rate limit exceeded",
});

export const publicApiRateLimiter = createRateLimiter({
	maxRequests: 50,
	windowMs: 60 * 1000, // 1 minute
	message: "Public API rate limit exceeded",
});

// Rate limiting middleware for specific routes
export function withRateLimit(
	handler: (request: NextRequest) => Promise<NextResponse>,
	rateLimiter: ReturnType<typeof createRateLimiter>
) {
	return async function (request: NextRequest): Promise<NextResponse> {
		const rateLimitResult = rateLimiter(request);
		if (rateLimitResult) {
			return rateLimitResult;
		}
		return handler(request);
	};
} 