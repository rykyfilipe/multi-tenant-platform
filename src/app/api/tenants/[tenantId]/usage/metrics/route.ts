/** @format */

import { NextRequest, NextResponse } from "next/server";
import { requireAuthResponse, requireTenantAccess, getUserId } from "@/lib/session";
import { getCurrentCounts } from "@/lib/planLimits";
import prisma from "@/lib/prisma";

export async function GET(
	request: NextRequest,
	{ params }: { params: { tenantId: string } }
) {
	try {
		const sessionResult = await requireAuthResponse();
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

		// Get current usage counts
		const currentCounts = await getCurrentCounts(userId);

		// Get additional usage metrics
		const tenant = await prisma.tenant.findUnique({
			where: { id: tenantId },
			select: {
				memoryUsedGB: true,
				memoryLimitGB: true,
				lastMemoryUpdate: true,
			}
		});

		// Get row count from all tables in tenant's databases
		const databases = await prisma.database.findMany({
			where: { tenantId },
			select: { id: true }
		});

		let totalRows = 0;
		if (databases.length > 0) {
			const tables = await prisma.table.findMany({
				where: { 
					databaseId: { in: databases.map(db => db.id) }
				},
				select: { id: true }
			});

			if (tables.length > 0) {
				const rowCount = await prisma.row.count({
					where: {
						tableId: { in: tables.map(table => table.id) }
					}
				});
				totalRows = rowCount;
			}
		}

		// Calculate storage usage
		const storageUsedMB = tenant?.memoryUsedGB || 0;
		const storageLimitMB = tenant?.memoryLimitGB || 0;

		const usageMetrics = {
			databases: currentCounts.databases,
			tables: currentCounts.tables,
			users: currentCounts.users,
			rows: totalRows,
			storage: Math.round(storageUsedMB),
			storageLimit: Math.round(storageLimitMB),
			lastUpdated: tenant?.lastMemoryUpdate || new Date(),
		};

		return NextResponse.json(usageMetrics);
	} catch (error) {
		console.error("Error fetching usage metrics:", error);
		return NextResponse.json(
			{ error: "Failed to fetch usage metrics" },
			{ status: 500 }
		);
	}
}
