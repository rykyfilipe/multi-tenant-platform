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
import { withAuth } from "next-auth/middleware";

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

export default withAuth(
	async function middleware(request: NextRequest) {
		const startTime = Date.now();
		const pathname = request.nextUrl.pathname;

		// Development endpoint: clear rate limits
		if (
			pathname === "/api/dev/clear-rate-limits" &&
			process.env.NODE_ENV === "development"
		) {
			try {
				const { clearAllApiRateLimits } = await import(
					"@/lib/api-rate-limiting"
				);
				clearAllApiRateLimits();
				return NextResponse.json({ message: "Rate limits cleared" });
			} catch (error) {
				return NextResponse.json(
					{ error: "Failed to clear rate limits" },
					{ status: 500 },
				);
			}
		}

		// OAuth debugging endpoint
		if (
			pathname === "/api/dev/oauth-debug" &&
			process.env.NODE_ENV === "development"
		) {
			const cookies = request.headers.get("cookie") || "";
			const nextAuthCookies = cookies
				.split(";")
				.filter(cookie => cookie.includes("next-auth"))
				.map(cookie => cookie.trim());

			return NextResponse.json({
				message: "OAuth Debug Information",
				environment: {
					NEXTAUTH_URL: process.env.NEXTAUTH_URL,
					NODE_ENV: process.env.NODE_ENV,
					GOOGLE_CLIENT_ID: process.env.GOOGLE_CLIENT_ID ? "Set" : "Not set",
				},
				request: {
					url: request.url,
					origin: request.nextUrl.origin,
					pathname: request.nextUrl.pathname,
					search: request.nextUrl.search,
					headers: {
						host: request.headers.get("host"),
						origin: request.headers.get("origin"),
						referer: request.headers.get("referer"),
						userAgent: request.headers.get("user-agent"),
					},
				},
				cookies: {
					all: cookies ? "Present" : "Not present",
					nextAuth: nextAuthCookies,
				},
				expectedCallbacks: {
					google: `${request.nextUrl.origin}/api/auth/callback/google`,
					credentials: `${request.nextUrl.origin}/api/auth/callback/credentials`,
				},
			});
		}

		// General debug endpoint
		if (
			pathname === "/api/dev/debug" &&
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

		// Apply security headers
		const response = NextResponse.next();
		Object.entries(securityHeaders).forEach(([key, value]) => {
			response.headers.set(key, value);
		});

		// CSRF protection
		if (["POST", "PUT", "DELETE", "PATCH"].includes(request.method)) {
			if (
				!pathname.startsWith("/api/auth/") &&
				!pathname.includes("login") &&
				!pathname.includes("register") &&
				!pathname.includes("forgot-password") &&
				!pathname.includes("reset-password")
			) {
				const csrfResult = await csrfProtection(request);
				if (csrfResult) return csrfResult;
			}
		}

		// Rate limiting (skip auth endpoints)
		if (
			!pathname.startsWith("/api/auth/") &&
			!pathname.includes("login") &&
			!pathname.includes("register") &&
			!pathname.includes("forgot-password") &&
			!pathname.includes("reset-password")
		) {
			let rateLimitConfig = RATE_LIMITS.public;
			if (pathname.startsWith("/api/")) rateLimitConfig = RATE_LIMITS.api;
			else if (pathname.includes("contact")) rateLimitConfig = RATE_LIMITS.contact;

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
					{ status: 429, headers },
				);
			}

			// Add headers for successful requests
			response.headers.set("X-RateLimit-Limit", rateLimitConfig.maxRequests.toString());
			response.headers.set("X-RateLimit-Remaining", rateLimitResult.remaining.toString());
			response.headers.set("X-RateLimit-Reset", new Date(rateLimitResult.resetTime).toISOString());
		}

		// Track API performance for API routes
		if (pathname.startsWith("/api/")) {
			const requestId = performanceMonitor.startAPIRequest(
				request.method,
				pathname,
				startTime,
			);
			response.headers.set("X-Request-Start", startTime.toString());
			response.headers.set("X-Request-ID", requestId);
		}

		// Security logging
		const userAgent = request.headers.get("user-agent") || "";
		const ip = getClientIdentifier(request);

		if (userAgent.includes("curl") || userAgent.includes("wget") || userAgent.includes("python")) {
			console.warn("Suspicious User-Agent detected:", { ip, userAgent, pathname });
		}

		const securityCheck = validateSecurity(pathname);
		if (!securityCheck.isValid) {
			console.warn("Security threat detected in URL path:", { ip, pathname, threats: securityCheck.threats, userAgent });
			if (securityCheck.threats.includes("PATH_TRAVERSAL") || securityCheck.threats.includes("COMMAND_INJECTION")) {
				return NextResponse.json({ error: "Invalid request path" }, { status: 400 });
			}
		}

		const suspiciousPatterns = [
			/\.(env|config|backup|sql|log)$/i,
			/\/(\.git|\.svn|\.hg)/i,
			/\/(wp-admin|phpmyadmin|adminer)/i,
			/\/(etc\/passwd|proc\/version)/i,
		];
		if (suspiciousPatterns.some(pattern => pattern.test(pathname))) {
			console.warn("Blocked suspicious request:", { ip, pathname, userAgent });
			return NextResponse.json({ error: "Access denied" }, { status: 403 });
		}

		return response;
	},
	{
		callbacks: {
			authorized: ({ token, req }) => {
				const { pathname } = req.nextUrl;

				// Public routes
				if (
					pathname === "/" ||
					pathname.startsWith("/api/auth/") ||
					pathname.startsWith("/api/contact") ||
					pathname.startsWith("/api/invite") ||
					pathname.startsWith("/api/dev/") ||
					pathname.startsWith("/docs/") ||
					pathname.startsWith("/reset-password") ||
					pathname.startsWith("/invite") ||
					pathname.startsWith("/payment-success") ||
					pathname.startsWith("/auth-callback") ||
					pathname.includes("_next") ||
					pathname.includes("favicon") ||
					pathname.includes(".")
				) {
					return true;
				}

				// Protected routes
				if (pathname.startsWith("/home")) {
					if (!token || !token.id || !token.email) {
						console.log("Invalid or missing token for route:", pathname);
						return false;
					}
					return true;
				}

				// API routes: require token
				if (pathname.startsWith("/api/")) return !!token;

				return true;
			},
		},
	},
);

export const config = {
	matcher: ["/((?!_next/static|_next/image|favicon.ico|.*\\..*).*)"],
};
