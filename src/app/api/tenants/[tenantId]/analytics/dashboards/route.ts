/** @format */

import { NextRequest, NextResponse } from "next/server";
import { requireAuthAPI, requireTenantAccessAPI } from "@/lib/session";
import { advancedAnalytics, DashboardType } from "@/lib/advanced-analytics";
import { logger } from "@/lib/error-logger";
import { z } from "zod";

const createDashboardSchema = z.object({
	name: z.string().min(1).max(100),
	description: z.string().optional(),
	type: z.nativeEnum(DashboardType),
	isPublic: z.boolean().optional().default(false),
	theme: z.object({
		primaryColor: z.string().optional(),
		backgroundColor: z.string().optional(),
		textColor: z.string().optional(),
		accentColor: z.string().optional(),
	}).optional(),
	layout: z.object({
		columns: z.number().min(1).max(24).optional(),
		rows: z.number().min(1).max(20).optional(),
		gap: z.number().min(0).max(50).optional(),
	}).optional(),
});

/**
 * GET /api/tenants/[tenantId]/analytics/dashboards
 * Get all dashboards for a tenant
 */
export async function GET(
	request: NextRequest,
	{ params }: { params: { tenantId: string } }
) {
	try {
		const sessionResult = await requireAuthAPI();
	if (sessionResult instanceof NextResponse) {
		return sessionResult;
	}
	const { user } = sessionResult;
	const userId = user.id;
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
		const hasAccess = await checkUserTenantAccess(userId, tenantId);
		if (!hasAccess) {
			return NextResponse.json(
				{ error: "Access denied" },
				{ status: 403 }
			);
		}

		const dashboards = await advancedAnalytics.getDashboards(tenantId.toString());

		return NextResponse.json({
			success: true,
			data: dashboards,
		});

	} catch (error) {
		logger.error("Failed to get dashboards", error as Error, {
			component: "DashboardsAPI",
			tenantId: params.tenantId,
		});

		return NextResponse.json(
			{ error: "Failed to get dashboards" },
			{ status: 500 }
		);
	}
}

/**
 * POST /api/tenants/[tenantId]/analytics/dashboards
 * Create a new dashboard
 */
export async function POST(
	request: NextRequest,
	{ params }: { params: { tenantId: string } }
) {
	try {
		const sessionResult = await requireAuthAPI();
	if (sessionResult instanceof NextResponse) {
		return sessionResult;
	}
	const { user } = sessionResult;
	const userId = user.id;
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
		    const hasAccess = await checkUserTenantAccess(userId, tenantId);
		if (!hasAccess) {
			return NextResponse.json(
				{ error: "Access denied" },
				{ status: 403 }
			);
		}

		const body = await request.json();
		const validatedData = createDashboardSchema.parse(body);

		const dashboard = await advancedAnalytics.createDashboard(
			tenantId.toString(),
			validatedData.name,
			validatedData.description || "",
			validatedData.type,
			userId.toString(),
			{
				isPublic: validatedData.isPublic,
				theme: validatedData.theme,
				layout: validatedData.layout,
			}
		);

		logger.info("Dashboard created", {
			component: "DashboardsAPI",
			userId: userId.toString(),
			tenantId: tenantId.toString(),
			dashboardId: dashboard.id,
			name: dashboard.name,
		});

		return NextResponse.json({
			success: true,
			data: dashboard,
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

		logger.error("Failed to create dashboard", error as Error, {
			component: "DashboardsAPI",
			tenantId: params.tenantId,
		});

		return NextResponse.json(
			{ error: "Failed to create dashboard" },
			{ status: 500 }
		);
	}
}
