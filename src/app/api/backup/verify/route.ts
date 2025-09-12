/** @format */

import { NextRequest, NextResponse } from "next/server";
import { backupSystem } from "@/lib/backup-system";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";

export async function POST(request: NextRequest) {
	try {
		const session = await getServerSession(authOptions);
		if (!session?.user?.tenantId) {
			return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
		}

		const body = await request.json();
		const { backupId } = body;

		const verification = await backupSystem.verifyBackup(backupId);
		return NextResponse.json({ verification });
	} catch (error) {
		console.error("Error verifying backup:", error);
		return NextResponse.json(
			{ error: "Failed to verify backup" },
			{ status: 500 }
		);
	}
}
