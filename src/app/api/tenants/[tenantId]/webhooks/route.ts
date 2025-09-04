/** @format */

import { NextRequest, NextResponse } from "next/server";
import { requireAuthResponse, requireTenantAccess, getUserId } from "@/lib/session";
import { webhookSystem, WebhookEventType } from "@/lib/webhook-system";
import { logger } from "@/lib/error-logger";
import { z } from "zod";

const createWebhookSchema = z.object({
	name: z.string().min(1).max(100),
	url: z.string().url(),
	description: z.string().optional(),
	events: z.array(z.nativeEnum(WebhookEventType)).min(1),
	headers: z.record(z.string()).optional(),
	retryPolicy: z.object({
		maxRetries: z.number().min(0).max(10).optional(),
		retryDelay: z.number().min(100).max(60000).optional(),
		backoffMultiplier: z.number().min(1).max(5).optional(),
	}).optional(),
});

const updateWebhookSchema = z.object({
	name: z.string().min(1).max(100).optional(),
	url: z.string().url().optional(),
	description: z.string().optional(),
	events: z.array(z.nativeEnum(WebhookEventType)).optional(),
	status: z.enum(["active", "inactive", "disabled"]).optional(),
	headers: z.record(z.string()).optional(),
	retryPolicy: z.object({
		maxRetries: z.number().min(0).max(10).optional(),
		retryDelay: z.number().min(100).max(60000).optional(),
		backoffMultiplier: z.number().min(1).max(5).optional(),
	}).optional(),
});

/**
 * GET /api/tenants/[tenantId]/webhooks
 * List all webhook endpoints for a tenant
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
		const userId = getUserId(sessionResult);

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

		const webhooks = await webhookSystem.getEndpoints(tenantId.toString());

		// Remove sensitive information
		const sanitizedWebhooks = webhooks.map(webhook => ({
			...webhook,
			secret: webhook.secret.substring(0, 8) + "...", // Only show first 8 characters
		}));

		return NextResponse.json({
			success: true,
			data: sanitizedWebhooks,
		});

	} catch (error) {
		logger.error("Failed to list webhooks", error as Error, {
			component: "WebhooksAPI",
			tenantId: params.tenantId,
		});

		return NextResponse.json(
			{ error: "Failed to list webhooks" },
			{ status: 500 }
		);
	}
}

/**
 * POST /api/tenants/[tenantId]/webhooks
 * Create a new webhook endpoint
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
			const userId = getUserId(sessionResult);

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

		const body = await request.json();
		const validatedData = createWebhookSchema.parse(body);

		const webhook = await webhookSystem.createEndpoint(
			tenantId.toString(),
			validatedData.name,
			validatedData.url,
			validatedData.events,
			{
				description: validatedData.description,
				headers: validatedData.headers,
				retryPolicy: validatedData.retryPolicy,
			}
		);

		logger.info("Webhook endpoint created", {
			component: "WebhooksAPI",
			userId: userId.toString(),
			tenantId: tenantId.toString(),
			webhookId: webhook.id,
			url: webhook.url,
			events: webhook.events,
		});

		return NextResponse.json({
			success: true,
			data: webhook,
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

		logger.error("Failed to create webhook", error as Error, {
			component: "WebhooksAPI",
			tenantId: params.tenantId.toString(),
		});

		return NextResponse.json(
			{ error: "Failed to create webhook" },
			{ status: 500 }
		);
	}
}
