/** @format */

import { NextRequest, NextResponse } from "next/server";
import { requireAuthResponse, requireTenantAccess, getUserId } from "@/lib/session";
import { webhookSystem } from "@/lib/webhook-system";
import { logger } from "@/lib/error-logger";

/**
 * POST /api/tenants/[tenantId]/webhooks/[webhookId]/test
 * Test a webhook endpoint
 */
export async function POST(
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
		const hasAccess = requireTenantAccess(sessionResult, tenantId);
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

		// Test the webhook
		const testResult = await webhookSystem.testEndpoint(params.webhookId);

		logger.info("Webhook test executed", {
			component: "WebhookTestAPI",
			userId: user.id,
			tenantId,
			webhookId: params.webhookId,
			success: testResult.success,
		});

		return NextResponse.json({
			success: true,
			data: testResult,
		});

	} catch (error) {
		logger.error("Failed to test webhook", error as Error, {
			component: "WebhookTestAPI",
			userId: user.id,
			tenantId: params.tenantId,
			webhookId: params.webhookId,
		});

		return NextResponse.json(
			{ error: "Failed to test webhook" },
			{ status: 500 }
		);
	}
}
