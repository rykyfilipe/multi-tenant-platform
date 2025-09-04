/** @format */

import { NextRequest, NextResponse } from "next/server";
import { requireAuthAPI, requireTenantAccessAPI } from "@/lib/session";
import { backupSystem } from "@/lib/backup-system";
import { logger } from "@/lib/error-logger";

/**
 * GET /api/tenants/[tenantId]/backups/[backupId]
 * Get a specific backup
 */
export async function GET(
	request: NextRequest,
	{ params }: { params: { tenantId: string; backupId: string } }
) {
	try {
		const sessionResult = await requireAuthAPI();
		if (sessionResult instanceof NextResponse) {
			return sessionResult;
		}
		const { user } = sessionResult;

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

		return NextResponse.json({
			success: true,
			data: backup,
		});

	} catch (error) {
		logger.error("Failed to get backup", error as Error, {
			component: "BackupAPI",
			userId: user.id,
			tenantId: params.tenantId,
			backupId: params.backupId,
		});

		return NextResponse.json(
			{ error: "Failed to get backup" },
			{ status: 500 }
		);
	}
}

/**
 * DELETE /api/tenants/[tenantId]/backups/[backupId]
 * Delete a backup
 */
export async function DELETE(
	request: NextRequest,
	{ params }: { params: { tenantId: string; backupId: string } }
) {
	try {
		const sessionResult = await requireAuthAPI();
		if (sessionResult instanceof NextResponse) {
			return sessionResult;
		}
		const { user } = sessionResult;

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

		const deleted = await backupSystem.deleteBackup(params.backupId);
		if (!deleted) {
			return NextResponse.json(
				{ error: "Failed to delete backup" },
				{ status: 500 }
			);
		}

		logger.info("Backup deleted", {
			component: "BackupAPI",
			userId: user.id,
			tenantId,
			backupId: params.backupId,
		});

		return NextResponse.json({
			success: true,
			message: "Backup deleted successfully",
		});

	} catch (error) {
		logger.error("Failed to delete backup", error as Error, {
			component: "BackupAPI",
			userId: user.id,
			tenantId: params.tenantId,
			backupId: params.backupId,
		});

		return NextResponse.json(
			{ error: "Failed to delete backup" },
			{ status: 500 }
		);
	}
}
