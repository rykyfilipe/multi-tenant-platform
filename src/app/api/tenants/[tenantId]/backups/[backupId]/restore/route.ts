/** @format */

import { NextRequest, NextResponse } from "next/server";
import { getUserFromRequest, checkUserTenantAccess } from "@/lib/auth";
import { backupSystem } from "@/lib/backup-system";
import { logger } from "@/lib/error-logger";

/**
 * POST /api/tenants/[tenantId]/backups/[backupId]/restore
 * Restore from a backup
 */
export async function POST(
	request: NextRequest,
	{ params }: { params: { tenantId: string; backupId: string } }
) {
	try {
		const user = await getUserFromRequest(request);
		if (!user) {
			return NextResponse.json(
				{ error: "Authentication required" },
				{ status: 401 }
			);
		}

		const tenantId = parseInt(params.tenantId);
		if (isNaN(tenantId)) {
			return NextResponse.json(
				{ error: "Invalid tenant ID" },
				{ status: 400 }
			);
		}

		// Check user access to tenant
		const hasAccess = await checkUserTenantAccess(user.id, tenantId);
		if (!hasAccess) {
			return NextResponse.json(
				{ error: "Access denied" },
				{ status: 403 }
			);
		}

		const backup = await backupSystem.getBackup(params.backupId);
		if (!backup) {
			return NextResponse.json(
				{ error: "Backup not found" },
				{ status: 404 }
			);
		}

		// Verify backup belongs to tenant
		if (backup.tenantId !== tenantId.toString()) {
			return NextResponse.json(
				{ error: "Backup not found" },
				{ status: 404 }
			);
		}

		// Verify backup is completed
		if (backup.status !== "completed") {
			return NextResponse.json(
				{ error: "Backup is not completed" },
				{ status: 400 }
			);
		}

		// Start restore process
		const restoreJob = await backupSystem.restoreFromBackup(
			params.backupId,
			tenantId.toString(),
			user.id
		);

		logger.info("Restore process started", {
			component: "BackupRestoreAPI",
			userId: user.id,
			tenantId,
			backupId: params.backupId,
			restoreId: restoreJob.id,
		});

		return NextResponse.json({
			success: true,
			data: restoreJob,
		}, { status: 202 }); // 202 Accepted for async operation

	} catch (error) {
		logger.error("Failed to start restore", error as Error, {
			component: "BackupRestoreAPI",
			userId: user.id,
			tenantId: params.tenantId,
			backupId: params.backupId,
		});

		return NextResponse.json(
			{ error: "Failed to start restore" },
			{ status: 500 }
		);
	}
}
