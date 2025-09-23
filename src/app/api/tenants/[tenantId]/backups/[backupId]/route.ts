/** @format */

import { NextRequest, NextResponse } from "next/server";
import { requireAuthFlexible, requireTenantAccess, getUserId } from "@/lib/session";
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
		const sessionResult = await requireAuthFlexible(request);
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

		return NextResponse.json({
			success: true,
			data: backup,
		});

	} catch (error) {
		

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

		const deleted = await backupSystem.deleteBackup(params.backupId);
		if (!deleted) {
			return NextResponse.json(
				{ error: "Failed to delete backup" },
				{ status: 500 }
			);
		}

		logger.info("Backup deleted", {
			component: "BackupAPI",
			userId: userId.toString(),
			tenantId: tenantId.toString(),
			backupId: params.backupId,
		});

		return NextResponse.json({
			success: true,
			message: "Backup deleted successfully",
		});

	} catch (error) {
		
		return NextResponse.json(
			{ error: "Failed to delete backup" },
			{ status: 500 }
		);
	}
}
