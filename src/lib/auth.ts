/** @format */

import jwt, { Secret, SignOptions } from "jsonwebtoken";
import prisma from "@/lib/prisma";
import { NextResponse } from "next/server";

export const JWT_SECRET: Secret = "super-secret";

interface JwtPayload {
	userId: number;
	role: string;
	iat?: number;
	exp?: number;
}

export function generateToken(
	payload: Omit<JwtPayload, "iat" | "exp">,
	exp: string | number,
): string {
	return jwt.sign(payload, JWT_SECRET, exp as SignOptions);
}

export async function hashPassword(password: string): Promise<string> {
	const encoder = new TextEncoder();
	const data = encoder.encode(password);
	const hashBuffer = await crypto.subtle.digest("SHA-256", data);
	const hashArray = Array.from(new Uint8Array(hashBuffer));
	const hashHex = hashArray
		.map((b) => b.toString(16).padStart(2, "0"))
		.join("");
	return hashHex;
}

export async function verifyPassword(
	password: string,
	hashedPassword: string,
): Promise<boolean> {
	const hashedInput = await hashPassword(password);
	return hashedInput === hashedPassword;
}

export async function isAdmin(request: Request): Promise<boolean> {
	const token = request.headers.get("Authorization")?.split(" ")[1];
	if (!token) return false;

	try {
		const decoded = jwt.verify(token, JWT_SECRET) as { role: string };
		return decoded.role === "ADMIN";
	} catch (error) {
		return false;
	}
}

export function verifyLogin(request: Request): boolean {
	const token = request.headers.get("Authorization")?.split(" ")[1];
	if (!token) return false;

	try {
		const decoded = jwt.verify(token, JWT_SECRET);
		return !!decoded;
	} catch (error) {
		return false;
	}
}

export function getUserId(request: Request): number | null {
	const token = request.headers.get("Authorization")?.split(" ")[1];
	if (!token) return null;

	try {
		const decoded = jwt.verify(token, JWT_SECRET) as { userId: number };
		return decoded.userId;
	} catch (error) {
		return null;
	}
}
export function getUserRole(request: Request): string | null {
	const token = request.headers.get("Authorization")?.split(" ")[1];
	if (!token) return null;

	try {
		const decoded = jwt.verify(token, JWT_SECRET) as { role: string };
		return decoded.role;
	} catch (error) {
		return null;
	}
}
export async function getUserFromRequest(
	request: Request,
): Promise<{ userId: number; role: string } | NextResponse> {
	if (!verifyLogin(request)) {
		return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
	}

	const userId = getUserId(request);
	const role = getUserRole(request);

	if (!userId || !role) {
		return NextResponse.json({ error: "Invalid token" }, { status: 401 });
	}

	return { userId, role };
}

export async function checkUserTenantAccess(userId: number, tenantId: number) {
	const isMember = await prisma.user.findFirst({
		where: {
			id: userId,
			tenantId: tenantId,
		},
	});

	return !!isMember;
}

export function verifyToken(token: string): any {
	jwt.verify(token, JWT_SECRET, (err, verfied) => {
		if (err) {
			return false;
		}
		return true;
	});
}
