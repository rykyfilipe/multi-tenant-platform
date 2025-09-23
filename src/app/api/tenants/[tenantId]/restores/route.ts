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
		const sessionResult = await requireAuthFlexible(request);
		if (sessionResult instanceof NextResponse) {
			return sessionResult;
		}

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

		// Get all restore jobs for this tenant
		const restores = await backupSystem.listRestores(tenantId.toString());

		return NextResponse.json({
			success: true,
			data: restores,
		});

	} catch (error) {
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
