/** @format */

import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { NextResponse } from "next/server";
import { Role } from "@/types/next-auth";

/**
 * Centralized session management for NextAuth
 * Provides helper functions for authentication and authorization
 */

export interface SessionUser {
	id: string;
	email: string;
	firstName: string;
	lastName: string;
	role: Role;
	name: string;
	image?: string;
	profileImage?: string;
	tenantId?: string | null;
}

export interface SessionData {
	user: SessionUser;
	accessToken?: string;
	customJWT?: string;
	subscription?: {
		status: string | null;
		plan: string | null;
		currentPeriodEnd: Date | null;
	};
}

/**
 * Get the current session with proper error handling
 */
export async function getSession(): Promise<SessionData | null> {
	try {
		const session = await getServerSession(authOptions);
		return session as SessionData | null;
	} catch (error) {
		console.error("Error getting session:", error);
		return null;
	}
}

/**
 * Require authentication - throws error if not authenticated
 */
export async function requireAuth(): Promise<SessionData> {
	const session = await getSession();
	if (!session) {
		throw new Error("Unauthorized");
	}
	return session;
}

/**
 * Require specific role - throws error if not authenticated or wrong role
 */
export async function requireRole(role: Role): Promise<SessionData> {
	const session = await requireAuth();
	if (session.user.role !== role) {
		throw new Error("Forbidden");
	}
	return session;
}

/**
 * Require admin role - throws error if not admin
 */
export async function requireAdmin(): Promise<SessionData> {
	return requireRole("ADMIN");
}

/**
 * Check if user has specific role
 */
export async function hasRole(role: Role): Promise<boolean> {
	try {
		const session = await getSession();
		return session?.user.role === role;
	} catch {
		return false;
	}
}

/**
 * Check if user is admin
 */
export async function isAdmin(): Promise<boolean> {
	return hasRole("ADMIN");
}

/**
 * Check if user can edit (ADMIN or EDITOR)
 */
export async function canEdit(): Promise<boolean> {
	try {
		const session = await getSession();
		return session?.user.role === "ADMIN" || session?.user.role === "EDITOR";
	} catch {
		return false;
	}
}

/**
 * Check if user can read (any authenticated user)
 */
export async function canRead(): Promise<boolean> {
	try {
		const session = await getSession();
		return !!session;
	} catch {
		return false;
	}
}

/**
 * Get user ID from session
 */
export async function getUserId(): Promise<string | null> {
	try {
		const session = await getSession();
		return session?.user.id || null;
	} catch {
		return null;
	}
}

/**
 * Get tenant ID from session
 */
export async function getTenantId(): Promise<string | null> {
	try {
		const session = await getSession();
		return session?.user.tenantId || null;
	} catch {
		return null;
	}
}

/**
 * API route helper - returns NextResponse for unauthorized/forbidden
 */
export async function requireAuthAPI(role?: Role): Promise<SessionData | NextResponse> {
	try {
		if (role) {
			return await requireRole(role);
		}
		return await requireAuth();
	} catch (error) {
		if (error instanceof Error) {
			if (error.message === "Unauthorized") {
				return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
			}
			if (error.message === "Forbidden") {
				return NextResponse.json({ error: "Forbidden" }, { status: 403 });
			}
		}
		return NextResponse.json({ error: "Authentication failed" }, { status: 500 });
	}
}

/**
 * Check tenant access for a specific tenant ID
 */
export async function checkTenantAccess(tenantId: string): Promise<boolean> {
	try {
		const session = await getSession();
		if (!session) return false;
		
		// Admins can access any tenant
		if (session.user.role === "ADMIN") return true;
		
		// Check if user belongs to this tenant
		return session.user.tenantId === tenantId;
	} catch {
		return false;
	}
}

/**
 * Require tenant access - throws error if user doesn't have access
 */
export async function requireTenantAccess(tenantId: string): Promise<SessionData> {
	const session = await requireAuth();
	
	// Admins can access any tenant
	if (session.user.role === "ADMIN") return session;
	
	// Check if user belongs to this tenant
	if (session.user.tenantId !== tenantId) {
		throw new Error("Forbidden");
	}
	
	return session;
}

/**
 * API route helper for tenant access
 */
export async function requireTenantAccessAPI(tenantId: string): Promise<SessionData | NextResponse> {
	try {
		return await requireTenantAccess(tenantId);
	} catch (error) {
		if (error instanceof Error) {
			if (error.message === "Unauthorized") {
				return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
			}
			if (error.message === "Forbidden") {
				return NextResponse.json({ error: "Forbidden" }, { status: 403 });
			}
		}
		return NextResponse.json({ error: "Authentication failed" }, { status: 500 });
	}
}
