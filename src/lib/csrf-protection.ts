/** @format */

import { NextRequest, NextResponse } from "next/server";

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
 * Generate random bytes using Web Crypto API
 */
async function generateRandomBytes(length: number): Promise<string> {
	const array = new Uint8Array(length);
	crypto.getRandomValues(array);
	return Array.from(array, (byte) => byte.toString(16).padStart(2, "0")).join(
		"",
	);
}

/**
 * Create HMAC using Web Crypto API
 */
async function createHMAC(message: string, secret: string): Promise<string> {
	const encoder = new TextEncoder();
	const keyData = encoder.encode(secret);
	const messageData = encoder.encode(message);

	const key = await crypto.subtle.importKey(
		"raw",
		keyData,
		{ name: "HMAC", hash: "SHA-256" },
		false,
		["sign"],
	);

	const signature = await crypto.subtle.sign("HMAC", key, messageData);
	return Array.from(new Uint8Array(signature), (byte) =>
		byte.toString(16).padStart(2, "0"),
	).join("");
}

/**
 * Generate a new CSRF token
 */
export async function generateCSRFToken(sessionId: string): Promise<string> {
	const randomToken = await generateRandomBytes(CSRF_TOKEN_LENGTH);
	const expires = Date.now() + CSRF_TOKEN_EXPIRY;

	// Hash the token with the session ID for additional security
	const hashedToken = await createHMAC(
		`${randomToken}:${sessionId}:${expires}`,
		CSRF_SECRET,
	);

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
export async function validateCSRFToken(
	token: string,
	sessionId: string,
): Promise<boolean> {
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
export async function csrfProtection(
	request: NextRequest,
): Promise<NextResponse | null> {
	// Only protect POST, PUT, DELETE, PATCH requests
	if (!["POST", "PUT", "DELETE", "PATCH"].includes(request.method)) {
		return null;
	}

	// Skip CSRF protection for authentication endpoints
	if (request.nextUrl.pathname.startsWith("/api/auth/")) {
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
	if (!(await validateCSRFToken(csrfToken, sessionId))) {
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
export async function generateFormCSRFToken(
	sessionId: string,
): Promise<string> {
	return generateCSRFToken(sessionId);
}

/**
 * Verify CSRF token for forms
 */
export async function verifyFormCSRFToken(
	token: string,
	sessionId: string,
): Promise<boolean> {
	return validateCSRFToken(token, sessionId);
}
