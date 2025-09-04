/** @format */

import { NextResponse } from "next/server";
import { requireAuthAPI, requireTenantAccessAPI } from "@/lib/session";
import { getCurrentCounts } from "@/lib/planLimits";

export async function GET(request: Request) {
	try {
		const sessionResult = await requireAuthAPI();
	if (sessionResult instanceof NextResponse) {
		return sessionResult;
	}

		const sessionResult = await requireAuthAPI();
	if (sessionResult instanceof NextResponse) {
		return sessionResult;
	}
	const { user } = sessionResult;
	const userId = parseInt(user.id);

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
