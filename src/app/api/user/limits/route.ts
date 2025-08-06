/** @format */

import { NextResponse } from "next/server";
import { verifyLogin, getUserFromRequest } from "@/lib/auth";
import { getCurrentCounts } from "@/lib/planLimits";

export async function GET(request: Request) {
	try {
		const logged = verifyLogin(request);
		if (!logged) {
			return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
		}

		const userResult = await getUserFromRequest(request);

		if (userResult instanceof NextResponse) {
			return userResult;
		}

		const { userId } = userResult;

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
				apiTokens: 0,
				publicTables: 0,
				storage: 0,
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
