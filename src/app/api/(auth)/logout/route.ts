/** @format */
import { NextResponse, NextRequest } from "next/server";
import { getUserFromRequest } from "@/lib/auth";
import { trackUserLogout } from "@/lib/activity-tracker";

export async function POST(request: NextRequest) {
	try {
		// Track logout activity
		try {
			const userResult = await getUserFromRequest(request);
			if (userResult && !(userResult instanceof NextResponse)) {
				const { userId, tenantId } = userResult;
				if (userId && tenantId) {
					trackUserLogout(userId, tenantId, request);
				}
			}
		} catch (error) {
			console.warn("Failed to track logout activity:", error);
		}

		return new NextResponse(JSON.stringify({ success: true }), {
			status: 200,
			headers: {
				"Set-Cookie":
					"token=; Path=/; Expires=Thu, 01 Jan 1970 00:00:00 GMT; HttpOnly; SameSite=Lax",
				"Content-Type": "application/json",
			},
		});
	} catch {
		return new NextResponse(
			JSON.stringify({ success: false, error: "Logout failed" }),
			{
				status: 500,
				headers: {
					"Content-Type": "application/json",
				},
			},
		);
	}
}
