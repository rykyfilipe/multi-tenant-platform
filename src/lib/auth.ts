/** @format */

import jwt from "jsonwebtoken";

export const JWT_SECRET = "super-secret";
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

export function getUserId(request: Request): string | null {
	const token = request.headers.get("Authorization")?.split(" ")[1];
	if (!token) return null;

	try {
		const decoded = jwt.verify(token, JWT_SECRET) as { id: string };
		return decoded.id;
	} catch (error) {
		return null;
	}
}

export function verifyToken(token: string): any {
	jwt.verify(token, JWT_SECRET, (err, verfied) => {
		if (err) {
			return false;
		}
		return true;
	});
}
