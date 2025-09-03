/** @format */

import { NextRequest, NextResponse } from "next/server";
import { integrationsMarketplace, IntegrationCategory } from "@/lib/integrations-marketplace";
import { logger } from "@/lib/error-logger";

/**
 * GET /api/marketplace/integrations
 * Get all available integration providers in the marketplace
 */
export async function GET(request: NextRequest) {
	try {
		const url = new URL(request.url);
		const category = url.searchParams.get("category") as IntegrationCategory;
		const search = url.searchParams.get("search");
		const limit = url.searchParams.get("limit");

		let providers;

		if (search) {
			providers = await integrationsMarketplace.searchIntegrations(search, category);
		} else if (category) {
			providers = await integrationsMarketplace.getIntegrationsByCategory(category);
		} else {
			providers = await integrationsMarketplace.getProviders();
		}

		// Apply limit if specified
		if (limit) {
			const limitNum = parseInt(limit);
			if (!isNaN(limitNum)) {
				providers = providers.slice(0, limitNum);
			}
		}

		return NextResponse.json({
			success: true,
			data: providers,
			pagination: {
				total: providers.length,
				limit: limit ? parseInt(limit) : undefined,
			},
		});

	} catch (error) {
		logger.error("Failed to get marketplace integrations", error as Error, {
			component: "MarketplaceAPI",
		});

		return NextResponse.json(
			{ error: "Failed to get marketplace integrations" },
			{ status: 500 }
		);
	}
}
