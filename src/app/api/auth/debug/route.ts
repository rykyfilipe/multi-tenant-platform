/** @format */

import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { getToken } from "next-auth/jwt";
import { NextRequest } from "next/server";

export async function GET(request: NextRequest) {
	try {
		const session = await getServerSession(authOptions);

		// Get token using getToken (same as middleware)
		const token = await getToken({
			req: request,
			secret: process.env.NEXTAUTH_SECRET,
		});

		// Get environment variables (without exposing secrets)
		const envInfo = {
			NODE_ENV: process.env.NODE_ENV,
			NEXTAUTH_URL: process.env.NEXTAUTH_URL,
			NEXTAUTH_SECRET: process.env.NEXTAUTH_SECRET ? "Set" : "Not set",
			GOOGLE_CLIENT_ID: process.env.GOOGLE_CLIENT_ID ? "Set" : "Not set",
			GOOGLE_CLIENT_SECRET: process.env.GOOGLE_CLIENT_SECRET
				? "Set"
				: "Not set",
			JWT_SECRET: process.env.JWT_SECRET ? "Set" : "Not set",
			PUBLIC_JWT_SECRET: process.env.PUBLIC_JWT_SECRET ? "Set" : "Not set",
		};

		return NextResponse.json({
			message: "Authentication Debug Information",
			timestamp: new Date().toISOString(),
			environment: envInfo,
			session: session
				? {
						user: {
							id: session.user?.id,
							email: session.user?.email,
							name: session.user?.name,
							firstName: session.user?.firstName,
							lastName: session.user?.lastName,
							role: session.user?.role,
							tenantId: session.user?.tenantId,
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
			authWorking: true,
			recommendations: [
				"Check that NEXTAUTH_URL is set to https://ydv.digital in production",
				"Verify Google OAuth credentials are configured for ydv.digital domain",
				"Ensure all required environment variables are set",
				"Check browser console for any JavaScript errors",
				"Verify cookies are being set properly in browser dev tools",
			],
		});
	} catch (error) {
		console.error("Auth debug error:", error);
		return NextResponse.json(
			{
				message: "Authentication Debug Failed",
				error: error instanceof Error ? error.message : "Unknown error",
				authWorking: false,
				timestamp: new Date().toISOString(),
			},
			{ status: 500 },
		);
	}
}
