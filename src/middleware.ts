/** @format */

import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { performanceMonitor } from "@/lib/performance-monitor";

// Security headers
const securityHeaders = {
	"X-Frame-Options": "DENY",
	"X-Content-Type-Options": "nosniff",
	"Referrer-Policy": "strict-origin-when-cross-origin",
	"X-XSS-Protection": "1; mode=block",
	"Strict-Transport-Security": "max-age=31536000; includeSubDomains",
	"Content-Security-Policy":
		"default-src 'self'; script-src 'self' 'unsafe-eval' 'unsafe-inline' https://js.stripe.com https://va.vercel-scripts.com; style-src 'self' 'unsafe-inline'; img-src 'self' data: https:; font-src 'self' data:; connect-src 'self' https://api.stripe.com https://va.vercel-scripts.com https://vercel.live; frame-src https://js.stripe.com; object-src 'none'; base-uri 'self'; form-action 'self';",
};

export async function middleware(request: NextRequest) {
	// Start timing the request
	const startTime = Date.now();
	
	// Add security headers to all responses
	const response = NextResponse.next();
	Object.entries(securityHeaders).forEach(([key, value]) => {
		response.headers.set(key, value);
	});

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

	return response;
}

export const config = {
	matcher: [
		// Match all routes except static files and images
		"/((?!_next/static|_next/image|favicon.ico|.*\\..*).*)",
	],
};
