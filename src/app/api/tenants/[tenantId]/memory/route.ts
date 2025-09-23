/** @format */
// Storage usage API endpoint for tenant data tracking

import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { requireTenantAccess } from "@/lib/session";
import {
	getTenantMemoryUsage,
	updateTenantMemoryUsage,
	checkMemoryLimit,
} from "@/lib/memory-tracking";

export async function GET(
	request: NextRequest,
	{ params }: { params: Promise<{ tenantId: string }> },
) {
	try {
		const session = await getServerSession(authOptions);
		if (!session?.user?.tenantId) {
			return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
		}

		const { tenantId } = await params;

		// Validate tenant access
		const tenantAccessError = requireTenantAccess(session, tenantId);
		if (tenantAccessError) {
			return tenantAccessError;
		}

		const tenantIdInt = parseInt(tenantId);
		if (isNaN(tenantIdInt)) {
			return NextResponse.json({ error: "Invalid tenant ID" }, { status: 400 });
		}

		// Get current storage usage
		const memoryUsage = await getTenantMemoryUsage(tenantIdInt);
		const limitCheck = await checkMemoryLimit(tenantIdInt);

		return NextResponse.json({
			success: true,
			data: {
				...memoryUsage,
				...limitCheck,
			},
		});
	} catch (error) {
		console.error("Error getting storage usage:", error);
		return NextResponse.json(
			{ error: "Failed to get storage usage" },
			{ status: 500 },
		);
	}
}

export async function POST(
	request: NextRequest,
	{ params }: { params: Promise<{ tenantId: string }> },
) {
	try {
		const session = await getServerSession(authOptions);
		if (!session?.user?.tenantId) {
			return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
		}

		const { tenantId } = await params;

		// Validate tenant access
		const tenantAccessError = requireTenantAccess(session, tenantId);
		if (tenantAccessError) {
			return tenantAccessError;
		}

		const tenantIdInt = parseInt(tenantId);
		if (isNaN(tenantIdInt)) {
			return NextResponse.json({ error: "Invalid tenant ID" }, { status: 400 });
		}

		// Update storage usage
		const memoryUsage = await updateTenantMemoryUsage(tenantIdInt);
		const limitCheck = await checkMemoryLimit(tenantIdInt);

		return NextResponse.json({
			success: true,
			data: {
				...memoryUsage,
				...limitCheck,
			},
		});
	} catch (error) {
		console.error("Error updating storage usage:", error);
		return NextResponse.json(
			{ error: "Failed to update storage usage" },
			{ status: 500 },
		);
	}
}
