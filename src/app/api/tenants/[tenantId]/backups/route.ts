/** @format */

import { NextRequest, NextResponse } from "next/server";
import { requireAuthResponse, requireTenantAccess, getUserId } from "@/lib/session";
import { backupSystem, BackupType } from "@/lib/backup-system";
import { logger } from "@/lib/error-logger";
import { z } from "zod";

const createBackupSchema = z.object({
	type: z.nativeEnum(BackupType).optional().default(BackupType.FULL),
	description: z.string().optional(),
});

/**
 * GET /api/tenants/[tenantId]/backups
 * List all backups for a tenant
 */
export async function GET(
	request: NextRequest,
	{ params }: { params: { tenantId: string } }
) {
	try {
		const sessionResult = await requireAuthResponse();
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
		const hasAccess = requireTenantAccess(sessionResult, tenantId);
		if (!hasAccess) {
			return NextResponse.json(
				{ error: "Access denied" },
				{ status: 403 }
			);
		}

		const backups = await backupSystem.listBackups(tenantId.toString());
		const stats = await backupSystem.getBackupStats(tenantId.toString());

		return NextResponse.json({
			success: true,
			data: {
				backups,
				stats,
			},
		});

	} catch (error) {
		logger.error("Failed to list backups", error as Error, {
			component: "BackupsAPI",
			tenantId: params.tenantId,
		});

		return NextResponse.json(
			{ error: "Failed to list backups" },
			{ status: 500 }
		);
	}
}

/**
 * POST /api/tenants/[tenantId]/backups
 * Create a new backup
 */
export async function POST(
	request: NextRequest,
	{ params }: { params: { tenantId: string } }
) {
	try {
		const sessionResult = await requireAuthResponse();
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
		const hasAccess = requireTenantAccess(sessionResult, tenantId);
		if (!hasAccess) {
			return NextResponse.json(
				{ error: "Access denied" },
				{ status: 403 }
			);
		}

		const body = await request.json();
		const validatedData = createBackupSchema.parse(body);

		const backup = await backupSystem.createBackup(
			tenantId.toString(),
			validatedData.type,
			validatedData.description,
			user.id
		);

		logger.info("Backup created", {
			component: "BackupsAPI",
			userId: user.id,
			tenantId,
			backupId: backup.id,
			type: backup.type,
		});

		return NextResponse.json({
			success: true,
			data: backup,
		}, { status: 201 });

	} catch (error) {
		if (error instanceof z.ZodError) {
			return NextResponse.json(
				{ 
					error: "Invalid request data",
					details: error.errors,
				},
				{ status: 400 }
			);
		}

		logger.error("Failed to create backup", error as Error, {
			component: "BackupsAPI",
			userId: user.id,
			tenantId: params.tenantId,
		});

		return NextResponse.json(
			{ error: "Failed to create backup" },
			{ status: 500 }
		);
	}
}
