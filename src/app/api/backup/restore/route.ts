/** @format */

import { NextRequest, NextResponse } from "next/server";
import { backupSystem } from "@/lib/backup-system";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { requireTenantAccess } from "@/lib/session";

export async function POST(request: NextRequest) {
	try {
		const session = await getServerSession(authOptions);
		if (!session?.user?.tenantId) {
			return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
		}

		const body = await request.json();
		const { backupId, tenantId } = body;
		const targetTenantId = tenantId || session.user.tenantId;

		// First get the backup to check tenant access
		const backup = await backupSystem.getBackup(backupId);
		if (!backup) {
			return NextResponse.json({ error: "Backup not found" }, { status: 404 });
		}

		// Validate tenant access to the backup
		const tenantAccessError = requireTenantAccess(session, backup.tenantId);
		if (tenantAccessError) {
			return tenantAccessError;
		}

		// Validate tenant access to the target tenant
		const targetTenantAccessError = requireTenantAccess(session, targetTenantId);
		if (targetTenantAccessError) {
			return targetTenantAccessError;
		}

		const restore = await backupSystem.restoreFromBackup(
			backupId,
			targetTenantId,
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
