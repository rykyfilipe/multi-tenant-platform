/** @format */

import { NextResponse } from "next/server";
import { requireAuthResponse, requireTenantAccess, getUserId } from "@/lib/session";
import { getCurrentCounts } from "@/lib/planLimits";

export async function GET(request: Request) {
	try {
		const sessionResult = await requireAuthResponse();
	if (sessionResult instanceof NextResponse) {
		return sessionResult;
	}
	const userId = getUserId(sessionResult);

		try {
			const currentCounts = await getCurrentCounts(userId);
			return NextResponse.json(currentCounts);
		} catch (error) {
			console.error("Error fetching user limits:", error);
			// Return default counts instead of error
			return NextResponse.json({
				databases: 0,
				tables: 0,
				users: 0,
				rows: 0,
				storage: 0,
			});
		}
	} catch (error) {
		console.error("Error in limits API:", error);
		return NextResponse.json(
			{ error: "Internal server error" },
			{ status: 500 },
		);
	}
}
