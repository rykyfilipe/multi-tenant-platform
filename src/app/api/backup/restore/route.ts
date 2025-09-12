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
		const { backupId, tenantId } = body;

		const restore = await backupSystem.restoreFromBackup(
			backupId,
			tenantId || session.user.tenantId,
			session.user.id
		);

		return NextResponse.json({ restore });
	} catch (error) {
		console.error("Error creating restore:", error);
		return NextResponse.json(
			{ error: "Failed to create restore" },
			{ status: 500 }
		);
	}
}
