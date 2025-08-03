/** @format */

import { NextResponse } from "next/server";
import { verifyLogin, getUserFromRequest } from "@/lib/auth";
import { getCurrentCounts } from "@/lib/planLimits";

export async function GET(request: Request) {
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
		console.log("Current counts for user", userId, ":", currentCounts);
		return NextResponse.json(currentCounts);
	} catch (error) {
		console.error("Error fetching user limits:", error);
		return NextResponse.json(
			{ error: "Failed to fetch limits" },
			{ status: 500 },
		);
	}
}
