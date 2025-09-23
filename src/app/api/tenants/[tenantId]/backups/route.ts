/** @format */

import { NextRequest, NextResponse } from "next/server";
import { requireAuthFlexible, requireTenantAccess, getUserId } from "@/lib/session";
import { backupSystem } from "@/lib/backup-system";
import { BackupType } from "@/types/backup";
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
		console.log('🚀 [BACKUP_DEBUG] Starting backup creation process');
		
		const sessionResult = await requireAuthFlexible(request);
		if (sessionResult instanceof NextResponse) {
			console.log('❌ [BACKUP_DEBUG] Authentication failed');
			return sessionResult;
		}
		const userId = getUserId(sessionResult);
		console.log('✅ [BACKUP_DEBUG] User authenticated:', userId);

		const tenantId = parseInt(params.tenantId);
		if (isNaN(tenantId)) {
			console.log('❌ [BACKUP_DEBUG] Invalid tenant ID:', params.tenantId);
			return NextResponse.json(
				{ error: "Invalid tenant ID" },
				{ status: 400 }
			);
		}
		console.log('✅ [BACKUP_DEBUG] Tenant ID parsed:', tenantId);

		// Check user access to tenant
		const tenantAccessError = requireTenantAccess(sessionResult, tenantId.toString());
		if (tenantAccessError) {
			console.log('❌ [BACKUP_DEBUG] Tenant access denied');
			return tenantAccessError;
		}
		console.log('✅ [BACKUP_DEBUG] Tenant access granted');

		const body = await request.json();
		console.log('📝 [BACKUP_DEBUG] Request body received:', body);
		
		const validatedData = createBackupSchema.parse(body);
		console.log('✅ [BACKUP_DEBUG] Data validated:', validatedData);

		// Check environment variables
		console.log('🔍 [BACKUP_DEBUG] Environment check:');
		console.log('  - DIRECT_URL exists:', !!process.env.DIRECT_URL);
		console.log('  - DATABASE_URL exists:', !!process.env.DATABASE_URL);
		console.log('  - NODE_ENV:', process.env.NODE_ENV);
		console.log('  - VERCEL:', !!process.env.VERCEL);

		console.log('🔄 [BACKUP_DEBUG] Calling backupSystem.createBackup...');
		const backup = await backupSystem.createBackup(
			tenantId.toString(),
			validatedData.type,
			validatedData.description,
			userId.toString()
		);
		console.log('✅ [BACKUP_DEBUG] Backup created successfully:', backup.id);

		logger.info("Backup created", {
			component: "BackupsAPI",
			userId: userId.toString(),
			tenantId: tenantId.toString(),
			backupId: backup.id,
			type: backup.type,
		});

		return NextResponse.json({
			success: true,
			data: backup,
		}, { status: 201 });

	} catch (error) {
		console.log('💥 [BACKUP_DEBUG] Error caught:', error);
		console.log('💥 [BACKUP_DEBUG] Error type:', typeof error);
		console.log('💥 [BACKUP_DEBUG] Error message:', error instanceof Error ? error.message : 'Unknown error');
		console.log('💥 [BACKUP_DEBUG] Error stack:', error instanceof Error ? error.stack : 'No stack trace');
		
		if (error instanceof z.ZodError) {
			console.log('❌ [BACKUP_DEBUG] Zod validation error:', error.errors);
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
			tenantId: params.tenantId,
		});

		return NextResponse.json(
			{ error: "Failed to create backup" },
			{ status: 500 }
		);
	}
}
