/** @format */

import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { performanceMonitor } from "@/lib/performance-monitor";
import { csrfProtection } from "@/lib/csrf-protection";
import {
	getClientIdentifier,
	checkRateLimit,
	RATE_LIMITS,
} from "@/lib/rate-limiting";
import {
	validateSecurity,
	validateFileUpload,
} from "@/lib/security-validation";
// Note: We can't import Prisma directly in middleware due to Node.js compatibility issues
// The activity tracking will be handled by individual API routes instead

// Enhanced security headers
const securityHeaders = {
	"X-Frame-Options": "DENY",
	"X-Content-Type-Options": "nosniff",
	"Referrer-Policy": "strict-origin-when-cross-origin",
	"X-XSS-Protection": "1; mode=block",
	"Strict-Transport-Security": "max-age=31536000; includeSubDomains; preload",
	"Content-Security-Policy":
		"default-src 'self'; script-src 'self' 'unsafe-eval' 'unsafe-inline' https://js.stripe.com https://va.vercel-scripts.com; style-src 'self' 'unsafe-inline' https://fonts.googleapis.com; font-src 'self' https://fonts.gstatic.com; img-src 'self' data: https: blob:; connect-src 'self' https://api.stripe.com https://va.vercel-scripts.com https://vercel.live; frame-src https://js.stripe.com; object-src 'none'; base-uri 'self'; form-action 'self'; frame-ancestors 'none'; upgrade-insecure-requests;",
	"Permissions-Policy":
		"camera=(), microphone=(), geolocation=(), payment=(), usb=(), magnetometer=(), gyroscope=(), accelerometer=()",
	"X-Permitted-Cross-Domain-Policies": "none",
	"X-Download-Options": "noopen",
	"X-DNS-Prefetch-Control": "off",
	"Cross-Origin-Embedder-Policy": "unsafe-none",
	"Cross-Origin-Opener-Policy": "same-origin",
	"Cross-Origin-Resource-Policy": "same-origin",
};

export async function middleware(request: NextRequest) {
	// Start timing the request
	const startTime = Date.now();

	// Get pathname early for use in multiple places
	const pathname = request.nextUrl.pathname;

	// Temporary development endpoint to clear rate limits
	if (
		request.nextUrl.pathname === "/api/dev/clear-rate-limits" &&
		process.env.NODE_ENV === "development"
	) {
		// Import and clear rate limits
		try {
			const { clearAllApiRateLimits } = await import("@/lib/api-rate-limiting");
			clearAllApiRateLimits();
			return NextResponse.json({ message: "Rate limits cleared" });
		} catch (error) {
			return NextResponse.json(
				{ error: "Failed to clear rate limits" },
				{ status: 500 },
			);
		}
	}

	// Debug endpoint for development
	if (
		request.nextUrl.pathname === "/api/dev/debug" &&
		process.env.NODE_ENV === "development"
	) {
		return NextResponse.json({
			message: "Debug information",
			environment: {
				NODE_ENV: process.env.NODE_ENV,
				GOOGLE_CLIENT_ID: process.env.GOOGLE_CLIENT_ID ? "Set" : "Not set",
				GOOGLE_CLIENT_SECRET: process.env.GOOGLE_CLIENT_SECRET
					? "Set"
					: "Not set",
				NEXTAUTH_URL: process.env.NEXTAUTH_URL,
				NEXTAUTH_SECRET: process.env.NEXTAUTH_SECRET ? "Set" : "Not set",
			},
			pathname,
			method: request.method,
			userAgent: request.headers.get("user-agent"),
		});
	}

	// Add security headers to all responses
	const response = NextResponse.next();
	Object.entries(securityHeaders).forEach(([key, value]) => {
		response.headers.set(key, value);
	});

	// CSRF protection for state-changing requests
	if (["POST", "PUT", "DELETE", "PATCH"].includes(request.method)) {
		// Skip CSRF protection for authentication endpoints
		if (
			pathname.startsWith("/api/auth/") ||
			pathname.includes("login") ||
			pathname.includes("register") ||
			pathname.includes("forgot-password") ||
			pathname.includes("reset-password")
		) {
			// No CSRF protection for auth endpoints
		} else {
			// Only apply CSRF protection to non-auth endpoints
			const csrfResult = await csrfProtection(request);
			if (csrfResult) {
				return csrfResult;
			}
		}
	}

	// Skip rate limiting for authentication endpoints to prevent blocking login
	if (
		pathname.startsWith("/api/auth/") ||
		pathname.includes("login") ||
		pathname.includes("register") ||
		pathname.includes("forgot-password") ||
		pathname.includes("reset-password")
	) {
		// No rate limiting for auth endpoints
	} else {
		// Apply different rate limits based on endpoint type
		let rateLimitConfig: (typeof RATE_LIMITS)[keyof typeof RATE_LIMITS] =
			RATE_LIMITS.public;

		if (pathname.startsWith("/api/")) {
			rateLimitConfig = RATE_LIMITS.api;
		} else if (pathname.includes("contact")) {
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
				},
			);
		}

		// Add rate limit headers to successful responses
		response.headers.set(
			"X-RateLimit-Limit",
			rateLimitConfig.maxRequests.toString(),
		);
		response.headers.set(
			"X-RateLimit-Remaining",
			rateLimitResult.remaining.toString(),
		);
		response.headers.set(
			"X-RateLimit-Reset",
			new Date(rateLimitResult.resetTime).toISOString(),
		);
	}

	// Track API performance and activity for API routes
	if (request.nextUrl.pathname.startsWith("/api/")) {
		// Generate unique request ID for tracking
		const requestId = performanceMonitor.startAPIRequest(
			request.method,
			request.nextUrl.pathname,
			startTime,
		);

		// Add headers for tracking
		response.headers.set("X-Request-Start", startTime.toString());
		response.headers.set("X-Request-ID", requestId);

		// Note: API tracking is now handled by individual API routes
		// due to Prisma compatibility issues in middleware
	}

	// Security logging for suspicious activities
	const userAgent = request.headers.get("user-agent") || "";
	const ip = getClientIdentifier(request);

	// Log suspicious user agents
	if (
		userAgent.includes("curl") ||
		userAgent.includes("wget") ||
		userAgent.includes("python")
	) {
		console.warn("Suspicious User-Agent detected:", {
			ip,
			userAgent,
			pathname,
		});
	}

	// Enhanced security validation for URL path
	const securityCheck = validateSecurity(pathname);
	if (!securityCheck.isValid) {
		console.warn("Security threat detected in URL path:", {
			ip,
			pathname,
			threats: securityCheck.threats,
			userAgent,
		});

		// Block obvious attack attempts
		if (
			securityCheck.threats.includes("PATH_TRAVERSAL") ||
			securityCheck.threats.includes("COMMAND_INJECTION")
		) {
			return NextResponse.json(
				{ error: "Invalid request path" },
				{ status: 400 },
			);
		}
	}

	// Log potential attack patterns
	if (
		pathname.includes("..") ||
		pathname.includes("admin") ||
		pathname.includes("wp-admin") ||
		pathname.includes(".env") ||
		pathname.includes("config") ||
		pathname.includes("backup")
	) {
		console.warn("Potential attack attempt:", {
			ip,
			pathname,
			userAgent,
		});
	}

	// Block common attack patterns
	const suspiciousPatterns = [
		/\.(env|config|backup|sql|log)$/i,
		/\/(\.git|\.svn|\.hg)/i,
		/\/(wp-admin|phpmyadmin|adminer)/i,
		/\/(etc\/passwd|proc\/version)/i,
	];

	if (suspiciousPatterns.some((pattern) => pattern.test(pathname))) {
		console.warn("Blocked suspicious request:", {
			ip,
			pathname,
			userAgent,
		});
		return NextResponse.json({ error: "Access denied" }, { status: 403 });
	}

	return response;
}

export const config = {
	matcher: [
		// Match all routes except static files and images
		"/((?!_next/static|_next/image|favicon.ico|.*\\..*).*)",
	],
};
