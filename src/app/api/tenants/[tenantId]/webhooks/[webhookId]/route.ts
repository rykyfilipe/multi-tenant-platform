/** @format */

import { NextRequest, NextResponse } from "next/server";
import { requireAuthResponse, requireTenantAccess, getUserId } from "@/lib/session";
import { webhookSystem, WebhookStatus } from "@/lib/webhook-system";
import { logger } from "@/lib/error-logger";
import { z } from "zod";

const updateWebhookSchema = z.object({
	name: z.string().min(1).max(100).optional(),
	url: z.string().url().optional(),
	description: z.string().optional(),
	events: z.array(z.string()).optional(),
	status: z.enum(["active", "inactive", "disabled"]).optional(),
	headers: z.record(z.string()).optional(),
	retryPolicy: z.object({
		maxRetries: z.number().min(0).max(10).optional(),
		retryDelay: z.number().min(100).max(60000).optional(),
		backoffMultiplier: z.number().min(1).max(5).optional(),
	}).optional(),
});

/**
 * GET /api/tenants/[tenantId]/webhooks/[webhookId]
 * Get a specific webhook endpoint
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

		// Remove sensitive information
		const sanitizedWebhook = {
			...webhook,
			secret: webhook.secret.substring(0, 8) + "...", // Only show first 8 characters
		};

		return NextResponse.json({
			success: true,
			data: sanitizedWebhook,
		});

	} catch (error) {
		logger.error("Failed to get webhook", error as Error, {
			component: "WebhookAPI",
			userId: user.id,
			tenantId: params.tenantId,
			webhookId: params.webhookId,
		});

		return NextResponse.json(
			{ error: "Failed to get webhook" },
			{ status: 500 }
		);
	}
}

/**
 * PUT /api/tenants/[tenantId]/webhooks/[webhookId]
 * Update a webhook endpoint
 */
export async function PUT(
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

		const body = await request.json();
		const validatedData = updateWebhookSchema.parse(body);

		// Convert status string to enum
		const updates: any = { ...validatedData };
		if (validatedData.status) {
			updates.status = validatedData.status.toUpperCase() as WebhookStatus;
		}

		const updatedWebhook = await webhookSystem.updateEndpoint(
			params.webhookId,
			updates
		);

		if (!updatedWebhook) {
			return NextResponse.json(
				{ error: "Failed to update webhook" },
				{ status: 500 }
			);
		}

		logger.info("Webhook endpoint updated", {
			component: "WebhookAPI",
			userId: user.id,
			tenantId,
			webhookId: params.webhookId,
			updates: validatedData,
		});

		// Remove sensitive information
		const sanitizedWebhook = {
			...updatedWebhook,
			secret: updatedWebhook.secret.substring(0, 8) + "...",
		};

		return NextResponse.json({
			success: true,
			data: sanitizedWebhook,
		});

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

		logger.error("Failed to update webhook", error as Error, {
			component: "WebhookAPI",
			userId: user.id,
			tenantId: params.tenantId,
			webhookId: params.webhookId,
		});

		return NextResponse.json(
			{ error: "Failed to update webhook" },
			{ status: 500 }
		);
	}
}

/**
 * DELETE /api/tenants/[tenantId]/webhooks/[webhookId]
 * Delete a webhook endpoint
 */
export async function DELETE(
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

		const deleted = await webhookSystem.deleteEndpoint(params.webhookId);
		if (!deleted) {
			return NextResponse.json(
				{ error: "Failed to delete webhook" },
				{ status: 500 }
			);
		}

		logger.info("Webhook endpoint deleted", {
			component: "WebhookAPI",
			userId: user.id,
			tenantId,
			webhookId: params.webhookId,
		});

		return NextResponse.json({
			success: true,
			message: "Webhook deleted successfully",
		});

	} catch (error) {
		logger.error("Failed to delete webhook", error as Error, {
			component: "WebhookAPI",
			userId: user.id,
			tenantId: params.tenantId,
			webhookId: params.webhookId,
		});

		return NextResponse.json(
			{ error: "Failed to delete webhook" },
			{ status: 500 }
		);
	}
}
