/** @format */

import { NextRequest, NextResponse } from "next/server";
import { requireAuthFlexible, requireTenantAccess, getUserId } from "@/lib/session";
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
		const sessionResult = await requireAuthFlexible(request);
		if (sessionResult instanceof NextResponse) {
			return sessionResult;
		}
		const userId = getUserId(sessionResult);

		const tenantId = parseInt(params.tenantId);
		if (isNaN(tenantId)) {
			return NextResponse.json(
				{ error: "Invalid tenant ID" },
				{ status: 400 }
			);
		}

		// Check user access to tenant
		const tenantAccessError = requireTenantAccess(sessionResult, tenantId.toString());
		if (tenantAccessError) {
			return tenantAccessError;
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
			userId.toString()
		);

		logger.info("Restore process started", {
			component: "BackupRestoreAPI",
			userId: userId.toString(),
			tenantId: tenantId.toString(),
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
			tenantId: params.tenantId,
			backupId: params.backupId,
		});

		return NextResponse.json(
			{ error: "Failed to start restore" },
			{ status: 500 }
		);
	}
}
