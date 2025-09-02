/** @format */

import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { getToken } from "next-auth/jwt";
import { NextRequest } from "next/server";

export async function GET(request: NextRequest) {
	try {
		// Get session using getServerSession
		const session = await getServerSession(authOptions);

		// Get token using getToken (same as middleware)
		const token = await getToken({
			req: request,
			secret: process.env.NEXTAUTH_SECRET,
		});

		// Get cookies
		const cookies = request.cookies.getAll();
		const nextAuthCookies = cookies.filter(
			(cookie) =>
				cookie.name.includes("next-auth") || cookie.name.includes("authjs"),
		);

		return NextResponse.json({
			message: "Middleware Debug Information",
			timestamp: new Date().toISOString(),
			session: session
				? {
						user: {
							id: session.user?.id,
							email: session.user?.email,
							name: session.user?.name,
						},
						expires: session.expires,
				  }
				: null,
			token: token
				? {
						id: token.id,
						email: token.email,
						name: token.name,
						firstName: token.firstName,
						lastName: token.lastName,
						role: token.role,
						tenantId: token.tenantId,
						iat: token.iat,
						exp: token.exp,
				  }
				: null,
			cookies: {
				total: cookies.length,
				nextAuthCookies: nextAuthCookies.map((cookie) => ({
					name: cookie.name,
					value: cookie.value ? "Set" : "Not set",
				})),
			},
			headers: {
				userAgent: request.headers.get("user-agent"),
				host: request.headers.get("host"),
				referer: request.headers.get("referer"),
			},
			recommendations: [
				"Check if token is being generated correctly",
				"Verify cookies are being set with correct domain",
				"Check if NEXTAUTH_SECRET matches between client and server",
				"Verify token expiration time",
			],
		});
	} catch (error) {
		console.error("Middleware debug error:", error);
		return NextResponse.json(
			{
				message: "Middleware Debug Failed",
				error: error instanceof Error ? error.message : "Unknown error",
				timestamp: new Date().toISOString(),
			},
			{ status: 500 },
		);
	}
}
