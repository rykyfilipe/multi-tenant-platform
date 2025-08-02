/** @format */

import jwt, { Secret, SignOptions } from "jsonwebtoken";
import prisma from "@/lib/prisma";
import { NextResponse } from "next/server";
import bcrypt from "bcryptjs";
export const JWT_SECRET: Secret = "super-secret";
export const PUBLIC_JWT_SECRET = "public-secret";

interface JwtPayload {
	userId: number;
	role: string;
	iat?: number;
	exp?: number;
}

export function generateToken(
	payload: Omit<JwtPayload, "iat" | "exp">,
	exp?: SignOptions["expiresIn"],
	JWT_KEY: Secret = JWT_SECRET,
): string {
	const options: SignOptions = {};
	if (exp) {
		options.expiresIn = exp;
	}

	return jwt.sign(payload, JWT_KEY, options);
}

export async function hashPassword(password: string): Promise<string> {
	const salt = await bcrypt.genSalt(10);
	return bcrypt.hash(password, salt);
}
export async function verifyPassword(
	inputPassword: string,
	hashedPassword: string,
): Promise<boolean> {
	return bcrypt.compare(inputPassword, hashedPassword);
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

export function getUserId(
	request: Request,
	JWT_KEY: Secret = JWT_SECRET,
): number | null {
	const token = request.headers.get("Authorization")?.split(" ")[1];
	if (!token) return null;

	try {
		const decoded = jwt.verify(token, JWT_KEY) as { userId: number };
		return decoded.userId;
	} catch (error) {
		return null;
	}
}
export function getUserRole(
	request: Request,
	JWT_KEY: Secret = JWT_SECRET,
): string | null {
	const token = request.headers.get("Authorization")?.split(" ")[1];
	if (!token) return null;

	try {
		const decoded = jwt.verify(token, JWT_KEY) as { role: string };
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

export async function verifyPublicToken(request: Request): Promise<any> {
	const token = request.headers.get("Authorization")?.split(" ")[1];
	if (!token) return false;

	try {
		const storedToken: any = await prisma.apiToken.findFirst({
			where: { tokenHash: token },
			select: { id: true, userId: true, scopes: true, expiresAt: true },
		});
		if (!storedToken) return false;
		return true;
	} catch (error) {
		return false;
	}
}

export async function getPublicUserFromRequest(
	request: Request,
): Promise<{ userId: number; role: string } | NextResponse> {
	const isValid = await verifyPublicToken(request);
	if (!isValid) {
		return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
	}

	const userId = getUserId(request, PUBLIC_JWT_SECRET);
	const role = getUserRole(request, PUBLIC_JWT_SECRET);

	if (!userId || !role) {
		return NextResponse.json({ error: "Invalid token" }, { status: 401 });
	}

	return { userId, role };
}
