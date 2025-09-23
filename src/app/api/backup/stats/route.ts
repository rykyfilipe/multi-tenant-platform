/** @format */

import { NextRequest, NextResponse } from "next/server";
import { backupSystem } from "@/lib/backup-system";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { requireTenantAccess } from "@/lib/session";

export async function GET(request: NextRequest) {
	try {
		const session = await getServerSession(authOptions);
		if (!session?.user?.tenantId) {
			return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
		}

		const { searchParams } = new URL(request.url);
		const tenantId = searchParams.get("tenantId") || session.user.tenantId;

		// Validate tenant access
		const tenantAccessError = requireTenantAccess(session, tenantId);
		if (tenantAccessError) {
			return tenantAccessError;
		}

		const stats = await backupSystem.getBackupStats(tenantId);
		return NextResponse.json({ stats });
	} catch (error) {
		console.error("Error fetching backup stats:", error);
		return NextResponse.json(
			{ error: "Failed to fetch backup stats" },
			{ status: 500 }
		);
	}
}
