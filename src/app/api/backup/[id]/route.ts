/** @format */

import { NextRequest, NextResponse } from "next/server";
import { backupSystem } from "@/lib/backup-system";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { requireTenantAccess } from "@/lib/session";

export async function GET(
	request: NextRequest,
	{ params }: { params: { id: string } }
) {
	try {
		const session = await getServerSession(authOptions);
		if (!session?.user?.tenantId) {
			return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
		}

		const backup = await backupSystem.getBackup(params.id);
		if (!backup) {
			return NextResponse.json({ error: "Backup not found" }, { status: 404 });
		}

		// Validate tenant access to the backup
		const tenantAccessError = requireTenantAccess(session, backup.tenantId);
		if (tenantAccessError) {
			return tenantAccessError;
		}

		return NextResponse.json({ backup });
	} catch (error) {
		console.error("Error fetching backup:", error);
		return NextResponse.json(
			{ error: "Failed to fetch backup" },
			{ status: 500 }
		);
	}
}

export async function DELETE(
	request: NextRequest,
	{ params }: { params: { id: string } }
) {
	try {
		const session = await getServerSession(authOptions);
		if (!session?.user?.tenantId) {
			return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
		}

		// First get the backup to check tenant access
		const backup = await backupSystem.getBackup(params.id);
		if (!backup) {
			return NextResponse.json({ error: "Backup not found" }, { status: 404 });
		}

		// Validate tenant access to the backup
		const tenantAccessError = requireTenantAccess(session, backup.tenantId);
		if (tenantAccessError) {
			return tenantAccessError;
		}

		const success = await backupSystem.deleteBackup(params.id);
		if (!success) {
			return NextResponse.json({ error: "Failed to delete backup" }, { status: 404 });
		}

		return NextResponse.json({ success: true });
	} catch (error) {
		console.error("Error deleting backup:", error);
		return NextResponse.json(
			{ error: "Failed to delete backup" },
			{ status: 500 }
		);
	}
}
