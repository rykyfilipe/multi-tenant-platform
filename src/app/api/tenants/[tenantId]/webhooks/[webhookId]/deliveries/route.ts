/** @format */

import { NextRequest, NextResponse } from "next/server";
import { requireAuthResponse, requireTenantAccess, getUserId } from "@/lib/session";
import { webhookSystem } from "@/lib/webhook-system";
import { logger } from "@/lib/error-logger";

/**
 * GET /api/tenants/[tenantId]/webhooks/[webhookId]/deliveries
 * Get delivery history for a webhook
 */
export async function GET(
	request: NextRequest,
	{ params }: { params: { tenantId: string; webhookId: string } }
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
		const hasAccess = requireTenantAccess(sessionResult, tenantId.toString());
		if (!hasAccess) {
			return NextResponse.json(
				{ error: "Access denied" },
				{ status: 403 }
			);
		}

		const webhook = await webhookSystem.getEndpoint(params.webhookId);
		if (!webhook) {
			return NextResponse.json(
				{ error: "Webhook not found" },
				{ status: 404 }
			);
		}

		// Verify webhook belongs to tenant
		if (webhook.tenantId !== tenantId.toString()) {
			return NextResponse.json(
				{ error: "Webhook not found" },
				{ status: 404 }
			);
		}

		// Get limit from query parameters
		const url = new URL(request.url);
		const limit = parseInt(url.searchParams.get("limit") || "50");
		const validLimit = Math.min(Math.max(limit, 1), 100); // Between 1 and 100

		const deliveries = await webhookSystem.getDeliveryHistory(params.webhookId, validLimit);

		return NextResponse.json({
			success: true,
			data: deliveries,
			pagination: {
				limit: validLimit,
				count: deliveries.length,
			},
		});

	} catch (error) {
		logger.error("Failed to get webhook deliveries", error as Error, {
			component: "WebhookDeliveriesAPI",
			tenantId: params.tenantId,
			webhookId: params.webhookId,
		});

		return NextResponse.json(
			{ error: "Failed to get webhook deliveries" },
			{ status: 500 }
		);
	}
}
