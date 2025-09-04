/** @format */

import { NextRequest, NextResponse } from "next/server";
import { requireAuthAPI, requireTenantAccessAPI } from "@/lib/session";
import { backupSystem } from "@/lib/backup-system";
import { logger } from "@/lib/error-logger";

/**
 * POST /api/tenants/[tenantId]/backups/[backupId]/verify
 * Verify backup integrity
 */
export async function POST(
	request: NextRequest,
	{ params }: { params: { tenantId: string; backupId: string } }
) {
	try {
		const sessionResult = await requireAuthAPI();
		if (sessionResult instanceof NextResponse) {
			return sessionResult;
		}
		const { user } = sessionResult;,
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

		// Verify backup integrity
		const verification = await backupSystem.verifyBackup(params.backupId);

		logger.info("Backup verification completed", {
			component: "BackupVerifyAPI",
			userId: user.id,
			tenantId,
			backupId: params.backupId,
			valid: verification.valid,
		});

		return NextResponse.json({
			success: true,
			data: verification,
		});

	} catch (error) {
		logger.error("Failed to verify backup", error as Error, {
			component: "BackupVerifyAPI",
			userId: user.id,
			tenantId: params.tenantId,
			backupId: params.backupId,
		});

		return NextResponse.json(
			{ error: "Failed to verify backup" },
			{ status: 500 }
		);
	}
}
