/** @format */

import { NextRequest, NextResponse } from "next/server";
import { randomBytes, createHmac } from "crypto";

// CSRF token configuration
const CSRF_SECRET =
	process.env.CSRF_SECRET ||
	process.env.NEXTAUTH_SECRET ||
	"fallback-csrf-secret";
const CSRF_TOKEN_LENGTH = 32;
const CSRF_TOKEN_EXPIRY = 24 * 60 * 60 * 1000; // 24 hours

interface CSRFToken {
	token: string;
	expires: number;
}

// In-memory store for CSRF tokens (use Redis in production)
const csrfTokens = new Map<string, CSRFToken>();

// Clean up expired tokens every hour
setInterval(() => {
	const now = Date.now();
	for (const [key, token] of csrfTokens.entries()) {
		if (token.expires < now) {
			csrfTokens.delete(key);
		}
	}
}, 60 * 60 * 1000);

/**
 * Generate a new CSRF token
 */
export function generateCSRFToken(sessionId: string): string {
	const randomToken = randomBytes(CSRF_TOKEN_LENGTH).toString("hex");
	const expires = Date.now() + CSRF_TOKEN_EXPIRY;

	// Hash the token with the session ID for additional security
	const hashedToken = createHmac("sha256", CSRF_SECRET)
		.update(`${randomToken}:${sessionId}:${expires}`)
		.digest("hex");

	const fullToken = `${randomToken}.${hashedToken}`;

	csrfTokens.set(sessionId, {
		token: fullToken,
		expires,
	});

	return fullToken;
}

/**
 * Validate a CSRF token
 */
export function validateCSRFToken(token: string, sessionId: string): boolean {
	const storedToken = csrfTokens.get(sessionId);
	if (!storedToken || storedToken.expires < Date.now()) {
		return false;
	}

	if (token !== storedToken.token) {
		return false;
	}

	return true;
}

/**
 * Get CSRF token for a session
 */
export function getCSRFToken(sessionId: string): string | null {
	const storedToken = csrfTokens.get(sessionId);
	if (!storedToken || storedToken.expires < Date.now()) {
		return null;
	}

	return storedToken.token;
}

/**
 * CSRF protection middleware
 */
export function csrfProtection(request: NextRequest): NextResponse | null {
	// Only protect POST, PUT, DELETE, PATCH requests
	if (!["POST", "PUT", "DELETE", "PATCH"].includes(request.method)) {
		return null;
	}

	// Skip CSRF protection for API routes that use JWT tokens
	if (
		request.nextUrl.pathname.startsWith("/api/") &&
		request.headers.get("authorization")?.startsWith("Bearer ")
	) {
		return null;
	}

	// Get session ID from cookies
	const sessionToken =
		request.cookies.get("__Secure-next-auth.session-token")?.value ||
		request.cookies.get("next-auth.session-token")?.value;

	if (!sessionToken) {
		return NextResponse.json(
			{ error: "CSRF protection: No session found" },
			{ status: 403 },
		);
	}

	// Extract session ID from token (simplified - in production use proper JWT decoding)
	const sessionId = sessionToken.substring(0, 20);

	// Get CSRF token from request
	const csrfToken =
		request.headers.get("x-csrf-token") ||
		request.headers.get("csrf-token") ||
		request.nextUrl.searchParams.get("csrf_token");

	if (!csrfToken) {
		return NextResponse.json(
			{ error: "CSRF protection: Token missing" },
			{ status: 403 },
		);
	}

	// Validate CSRF token
	if (!validateCSRFToken(csrfToken, sessionId)) {
		return NextResponse.json(
			{ error: "CSRF protection: Invalid token" },
			{ status: 403 },
		);
	}

	return null; // Continue with the request
}

/**
 * Generate CSRF token for forms
 */
export function generateFormCSRFToken(sessionId: string): string {
	return generateCSRFToken(sessionId);
}

/**
 * Verify CSRF token for forms
 */
export function verifyFormCSRFToken(token: string, sessionId: string): boolean {
	return validateCSRFToken(token, sessionId);
}
