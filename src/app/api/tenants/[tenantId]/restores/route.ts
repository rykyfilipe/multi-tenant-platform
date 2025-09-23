/** @format */

import { NextRequest, NextResponse } from "next/server";
import { requireAuthFlexible, requireTenantAccess } from "@/lib/session";
import { backupSystem } from "@/lib/backup-system";
import { logger } from "@/lib/error-logger";

/**
 * GET /api/tenants/[tenantId]/restores
 * List all restore jobs for a tenant
 */
export async function GET(
	request: NextRequest,
	{ params }: { params: { tenantId: string } }
) {
	try {
		console.log('🚀 [RESTORES_DEBUG] Starting restores list process');
		
		const sessionResult = await requireAuthFlexible(request);
		if (sessionResult instanceof NextResponse) {
			console.log('❌ [RESTORES_DEBUG] Authentication failed');
			return sessionResult;
		}
		console.log('✅ [RESTORES_DEBUG] User authenticated:', sessionResult.user?.id);

		const tenantId = parseInt(params.tenantId);
		if (isNaN(tenantId)) {
			console.log('❌ [RESTORES_DEBUG] Invalid tenant ID:', params.tenantId);
			return NextResponse.json(
				{ error: "Invalid tenant ID" },
				{ status: 400 }
			);
		}
		console.log('✅ [RESTORES_DEBUG] Tenant ID parsed:', tenantId);

		// Check user access to tenant
		console.log('🔍 [RESTORES_DEBUG] Checking tenant access...');
		console.log('  - User tenant ID:', sessionResult.user?.tenantId);
		console.log('  - Requested tenant ID:', tenantId.toString());
		console.log('  - Types:', typeof sessionResult.user?.tenantId, typeof tenantId.toString());
		
		const tenantAccessError = requireTenantAccess(sessionResult, tenantId.toString());
		if (tenantAccessError) {
			console.log('❌ [RESTORES_DEBUG] Tenant access denied');
			return tenantAccessError;
		}
		console.log('✅ [RESTORES_DEBUG] Tenant access granted');

		// Get all restore jobs for this tenant
		console.log('🔄 [RESTORES_DEBUG] Getting restore jobs...');
		const restores = await backupSystem.listRestores(tenantId.toString());
		console.log('✅ [RESTORES_DEBUG] Restore jobs retrieved:', restores.length);

		return NextResponse.json({
			success: true,
			data: restores,
		});

	} catch (error) {
		console.log('💥 [RESTORES_DEBUG] Error caught:', error);
		console.log('💥 [RESTORES_DEBUG] Error message:', error instanceof Error ? error.message : 'Unknown error');
		
		logger.error("Failed to list restores", error as Error, {
			component: "RestoresAPI",
			tenantId: params.tenantId,
		});

		return NextResponse.json(
			{ error: "Failed to list restores" },
			{ status: 500 }
		);
	}
}
