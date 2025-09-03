/** @format */

import { NextResponse, NextRequest } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { getToken } from "next-auth/jwt";

export async function GET(request: NextRequest) {
	try {
		const session = await getServerSession(authOptions);
		const token = await getToken({
			req: request,
			secret: process.env.NEXTAUTH_SECRET,
		});

		// Get request headers for mobile detection
		const userAgent = request.headers.get("user-agent") || "";
		const isMobile = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(userAgent);
		const isIOS = /iPad|iPhone|iPod/.test(userAgent);
		const isInApp = /wv|WebView/.test(userAgent);

		// Get cookies
		const cookies = request.cookies.getAll();
		const nextAuthCookies = cookies.filter(
			(cookie) =>
				cookie.name.includes("next-auth") || 
				cookie.name.includes("authjs") ||
				cookie.name.includes("__Secure-next-auth")
		);

		// Get environment info
		const envInfo = {
			NODE_ENV: process.env.NODE_ENV,
			NEXTAUTH_URL: process.env.NEXTAUTH_URL,
			NEXTAUTH_SECRET: process.env.NEXTAUTH_SECRET ? "Set" : "Not set",
			GOOGLE_CLIENT_ID: process.env.GOOGLE_CLIENT_ID ? "Set" : "Not set",
			GOOGLE_CLIENT_SECRET: process.env.GOOGLE_CLIENT_SECRET ? "Set" : "Not set",
		};

		// Mobile-specific recommendations
		const mobileRecommendations = [];
		
		if (isMobile) {
			mobileRecommendations.push("Mobile device detected - using mobile-optimized OAuth flow");
			
			if (isIOS) {
				mobileRecommendations.push("iOS device detected - check Safari cookie settings");
				mobileRecommendations.push("Ensure popup blockers are disabled");
			}
			
			if (isInApp) {
				mobileRecommendations.push("In-app browser detected - may have limited OAuth support");
				mobileRecommendations.push("Consider opening in external browser");
			}
		}

		// Check for common mobile OAuth issues
		const issues = [];
		
		if (isMobile && nextAuthCookies.length === 0) {
			issues.push("No NextAuth cookies found on mobile - check SameSite settings");
		}
		
		if (isIOS && process.env.NODE_ENV === "production") {
			issues.push("iOS in production - ensure __Secure- cookie prefix is used");
		}
		
		if (isInApp) {
			issues.push("In-app browser detected - OAuth may not work properly");
		}

		return NextResponse.json({
			message: "Mobile OAuth Debug Information",
			timestamp: new Date().toISOString(),
			device: {
				userAgent,
				isMobile,
				isIOS,
				isInApp,
				platform: isIOS ? "iOS" : isMobile ? "Android" : "Desktop",
			},
			environment: envInfo,
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
						iat: token.iat,
						exp: token.exp,
				  }
				: null,
			cookies: {
				total: cookies.length,
				nextAuthCookies: nextAuthCookies.map((cookie) => ({
					name: cookie.name,
					value: cookie.value ? "Set" : "Not set",
					secure: cookie.name.includes("__Secure-"),
				})),
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
				},
			},
			issues,
			recommendations: [
				...mobileRecommendations,
				"Check browser console for JavaScript errors",
				"Verify OAuth redirect URIs in Google Console",
				"Test with different mobile browsers",
				"Check if popup blockers are enabled",
				"Verify HTTPS is working correctly",
			],
		});
	} catch (error) {
		console.error("Mobile OAuth debug error:", error);
		return NextResponse.json(
			{
				message: "Mobile OAuth Debug Failed",
				error: error instanceof Error ? error.message : "Unknown error",
				timestamp: new Date().toISOString(),
			},
			{ status: 500 },
		);
	}
}
