/** @format */

import { NextRequest, NextResponse } from "next/server";
import { requireAuthResponse, requireTenantAccess, requireTenantAccessAPI, getUserId } from "@/lib/session";
import { advancedAnalytics, AnalyticsMetricType } from "@/lib/advanced-analytics";
import { logger } from "@/lib/error-logger";
import { z } from "zod";

const trackMetricSchema = z.object({
	type: z.nativeEnum(AnalyticsMetricType),
	name: z.string().min(1).max(100),
	value: z.number(),
	metadata: z.record(z.any()).optional(),
	dimensions: z.record(z.string()).optional(),
	tags: z.array(z.string()).optional(),
});

const queryMetricsSchema = z.object({
	metricTypes: z.array(z.nativeEnum(AnalyticsMetricType)).min(1),
	timeRange: z.object({
		start: z.string(),
		end: z.string(),
	}),
	groupBy: z.array(z.string()).optional(),
	filters: z.record(z.any()).optional(),
	aggregation: z.enum(["sum", "avg", "count", "min", "max"]).optional(),
	limit: z.number().min(1).max(10000).optional(),
	offset: z.number().min(0).optional(),
});

/**
 * POST /api/tenants/[tenantId]/analytics/advanced/track
 * Track a custom analytics metric
 */
export async function POST(
	request: NextRequest,
	{ params }: { params: Promise<{ tenantId: string }> }
) {
	try {
		const { tenantId } = await params;
		const sessionResult = await requireTenantAccessAPI(tenantId);
		if (sessionResult instanceof NextResponse) {
			return sessionResult;
		}

		const tenantIdNum = parseInt(tenantId);
		if (isNaN(tenantIdNum)) {
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
		const validatedData = trackMetricSchema.parse(body);

		const metric = await advancedAnalytics.trackMetric(
			tenantId.toString(),
			validatedData.type,
			validatedData.name,
			validatedData.value,
			validatedData.metadata || {},
			validatedData.dimensions || {},
			validatedData.tags || []
		);

		const userId = getUserId(sessionResult);
		logger.info("Analytics metric tracked", {
			component: "AdvancedAnalyticsAPI",
			userId: userId.toString(),
			tenantId: tenantId.toString(),
			metricId: metric.id,
			type: metric.type,
		});

		return NextResponse.json({
			success: true,
			data: metric,
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

		logger.error("Failed to track analytics metric", error as Error, {
			component: "AdvancedAnalyticsAPI",
			tenantId: (await params).tenantId,
		});

		return NextResponse.json(
			{ error: "Failed to track analytics metric" },
			{ status: 500 }
		);
	}
}

/**
 * GET /api/tenants/[tenantId]/analytics/advanced/query
 * Query analytics metrics
 */
export async function GET(
	request: NextRequest,
	{ params }: { params: Promise<{ tenantId: string }> }
) {
	try {
		const sessionResult = await requireAuthResponse();
		if (sessionResult instanceof NextResponse) {
			return sessionResult;
		}
		const userId = getUserId(sessionResult);
		if (!userId) {
			return NextResponse.json(
				{ error: "Authentication required" },
				{ status: 401 }
			);
		}

		const tenantId = parseInt((await params).tenantId);
		if (isNaN(tenantId)) {
			return NextResponse.json(
				{ error: "Invalid tenant ID" },
				{ status: 400 }
			);
		}

		// Check user access to tenant
		const hasAccess = requireTenantAccess(sessionResult, tenantId.toString());
		if (!hasAccess) {
			return NextResponse.json(
				{ error: "Access denied" },
				{ status: 403 }
			);
		}

		const url = new URL(request.url);
		const queryParams = {
			metricTypes: url.searchParams.get("metricTypes")?.split(",") || [],
			timeRange: {
				start: url.searchParams.get("start") || new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString(),
				end: url.searchParams.get("end") || new Date().toISOString(),
			},
			groupBy: url.searchParams.get("groupBy")?.split(","),
			filters: url.searchParams.get("filters") ? JSON.parse(url.searchParams.get("filters")!) : undefined,
			aggregation: url.searchParams.get("aggregation") as any,
			limit: url.searchParams.get("limit") ? parseInt(url.searchParams.get("limit")!) : undefined,
			offset: url.searchParams.get("offset") ? parseInt(url.searchParams.get("offset")!) : undefined,
		};

		const validatedQuery = queryMetricsSchema.parse(queryParams);

		const metrics = await advancedAnalytics.queryMetrics(validatedQuery, tenantId.toString());

		return NextResponse.json({
			success: true,
			data: metrics,
			pagination: {
				limit: validatedQuery.limit || 1000,
				offset: validatedQuery.offset || 0,
				count: metrics.length,
			},
		});

	} catch (error) {
		if (error instanceof z.ZodError) {
			return NextResponse.json(
				{ 
					error: "Invalid query parameters",
					details: error.errors,
				},
				{ status: 400 }
			);
		}

		logger.error("Failed to query analytics metrics", error as Error, {
			component: "AdvancedAnalyticsAPI",
			tenantId: (await params).tenantId,
		});

		return NextResponse.json(
			{ error: "Failed to query analytics metrics" },
			{ status: 500 }
		);
	}
}
