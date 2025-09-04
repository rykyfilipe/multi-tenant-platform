/** @format */

import { NextRequest, NextResponse } from "next/server";
import { requireAuthResponse, requireTenantAccess, getUserId } from "@/lib/session";
import { integrationsMarketplace, IntegrationCategory } from "@/lib/integrations-marketplace";
import { logger } from "@/lib/error-logger";
import { z } from "zod";

const createIntegrationSchema = z.object({
	providerId: z.string().min(1),
	templateId: z.string().min(1),
	name: z.string().min(1).max(100),
	description: z.string().optional(),
	config: z.record(z.any()),
	credentials: z.record(z.string()),
});

/**
 * GET /api/tenants/[tenantId]/integrations
 * Get all integrations for a tenant
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

		const integrations = await integrationsMarketplace.getIntegrations(tenantId.toString());

		return NextResponse.json({
			success: true,
			data: integrations,
		});

	} catch (error) {
		logger.error("Failed to get integrations", error as Error, {
			component: "IntegrationsAPI",
			tenantId: params.tenantId,
		});

		return NextResponse.json(
			{ error: "Failed to get integrations" },
			{ status: 500 }
		);
	}
}

/**
 * POST /api/tenants/[tenantId]/integrations
 * Create a new integration
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

		const body = await request.json();
		const validatedData = createIntegrationSchema.parse(body);

		const integration = await integrationsMarketplace.createIntegration(
			tenantId.toString(),
			validatedData.providerId,
			validatedData.templateId,
			validatedData.name,
			validatedData.config,
			validatedData.credentials,
			user.id
		);

		logger.info("Integration created", {
			component: "IntegrationsAPI",
			userId: user.id,
			tenantId,
			integrationId: integration.id,
			providerId: integration.providerId,
		});

		return NextResponse.json({
			success: true,
			data: integration,
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

		logger.error("Failed to create integration", error as Error, {
			component: "IntegrationsAPI",
			userId: user.id,
			tenantId: params.tenantId,
		});

		return NextResponse.json(
			{ error: "Failed to create integration" },
			{ status: 500 }
		);
	}
}
