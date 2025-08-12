/** @format */

import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { performanceMonitor } from "@/lib/performance-monitor";
import { csrfProtection } from "@/lib/csrf-protection";
import { getClientIdentifier, checkRateLimit, RATE_LIMITS } from "@/lib/rate-limiting";

// Enhanced security headers
const securityHeaders = {
	"X-Frame-Options": "DENY",
	"X-Content-Type-Options": "nosniff",
	"Referrer-Policy": "strict-origin-when-cross-origin",
	"X-XSS-Protection": "1; mode=block",
	"Strict-Transport-Security": "max-age=31536000; includeSubDomains; preload",
	"Content-Security-Policy":
		"default-src 'self'; script-src 'self' 'unsafe-eval' 'unsafe-inline' https://js.stripe.com https://va.vercel-scripts.com; style-src 'self' 'unsafe-inline' https://fonts.googleapis.com; font-src 'self' https://fonts.gstatic.com; img-src 'self' data: https: blob:; connect-src 'self' https://api.stripe.com https://va.vercel-scripts.com https://vercel.live; frame-src https://js.stripe.com; object-src 'none'; base-uri 'self'; form-action 'self'; frame-ancestors 'none'; upgrade-insecure-requests;",
	"Permissions-Policy": "camera=(), microphone=(), geolocation=(), payment=(), usb=(), magnetometer=(), gyroscope=(), accelerometer=()",
	"X-Permitted-Cross-Domain-Policies": "none",
	"X-Download-Options": "noopen",
	"X-DNS-Prefetch-Control": "off",
	"Cross-Origin-Embedder-Policy": "require-corp",
	"Cross-Origin-Opener-Policy": "same-origin",
	"Cross-Origin-Resource-Policy": "same-origin",
};

export async function middleware(request: NextRequest) {
	// Start timing the request
	const startTime = Date.now();
	
	// Add security headers to all responses
	const response = NextResponse.next();
	Object.entries(securityHeaders).forEach(([key, value]) => {
		response.headers.set(key, value);
	});

	// CSRF protection for state-changing requests
	if (['POST', 'PUT', 'DELETE', 'PATCH'].includes(request.method)) {
		const csrfResult = csrfProtection(request);
		if (csrfResult) {
			return csrfResult;
		}
	}

	// Rate limiting for sensitive endpoints
	const pathname = request.nextUrl.pathname;
	
	// Apply different rate limits based on endpoint type
	let rateLimitConfig = RATE_LIMITS.public;
	
	if (pathname.startsWith('/api/auth/') || pathname.includes('login') || pathname.includes('register')) {
		rateLimitConfig = RATE_LIMITS.auth;
	} else if (pathname.startsWith('/api/')) {
		rateLimitConfig = RATE_LIMITS.api;
	} else if (pathname.includes('contact')) {
		rateLimitConfig = RATE_LIMITS.contact;
	}

	const identifier = getClientIdentifier(request);
	const rateLimitResult = checkRateLimit(identifier, rateLimitConfig);

	if (!rateLimitResult.allowed) {
		const headers: Record<string, string> = {
			"X-RateLimit-Limit": rateLimitConfig.maxRequests.toString(),
			"X-RateLimit-Remaining": "0",
			"X-RateLimit-Reset": new Date(rateLimitResult.resetTime).toISOString(),
		};

		if (rateLimitResult.retryAfter) {
			headers["Retry-After"] = rateLimitResult.retryAfter.toString();
		}

		return NextResponse.json(
			{
				error: rateLimitResult.blocked 
					? "Too many requests. Please try again later." 
					: "Rate limit exceeded. Please try again later.",
				retryAfter: rateLimitResult.retryAfter,
			},
			{
				status: 429,
				headers,
			}
		);
	}

	// Add rate limit headers to successful responses
	response.headers.set("X-RateLimit-Limit", rateLimitConfig.maxRequests.toString());
	response.headers.set("X-RateLimit-Remaining", rateLimitResult.remaining.toString());
	response.headers.set("X-RateLimit-Reset", new Date(rateLimitResult.resetTime).toISOString());

	// Track API performance for API routes
	if (request.nextUrl.pathname.startsWith('/api/')) {
		// Generate unique request ID for tracking
		const requestId = performanceMonitor.startAPIRequest(
			request.method,
			request.nextUrl.pathname,
			startTime
		);
		
		// Add headers for tracking
		response.headers.set('X-Request-Start', startTime.toString());
		response.headers.set('X-Request-ID', requestId);
	}

	// Security logging for suspicious activities
	const userAgent = request.headers.get('user-agent') || '';
	const ip = getClientIdentifier(request);
	
	// Log suspicious user agents
	if (userAgent.includes('curl') || userAgent.includes('wget') || userAgent.includes('python')) {
		console.warn('Suspicious User-Agent detected:', { ip, userAgent, pathname });
	}

	// Log potential attack patterns
	if (pathname.includes('..') || pathname.includes('admin') || pathname.includes('wp-admin')) {
		console.warn('Potential path traversal attempt:', { ip, pathname, userAgent });
	}

	return response;
}

export const config = {
	matcher: [
		// Match all routes except static files and images
		"/((?!_next/static|_next/image|favicon.ico|.*\\..*).*)",
	],
};
