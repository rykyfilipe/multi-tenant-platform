/** @format */

import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { requireAuthResponse, requireTenantAccess, getUserId } from "@/lib/session";
import { z } from "zod";

// Schema for creating/updating invoice series
const invoiceSeriesSchema = z.object({
	series: z.string().min(1, "Series name is required"),
	prefix: z.string().default(""),
	suffix: z.string().default(""),
	separator: z.string().default("-"),
	includeYear: z.boolean().default(false),
	includeMonth: z.boolean().default(false),
	resetYearly: z.boolean().default(false),
	startNumber: z.number().int().min(1).default(1),
});

const updateSeriesSchema = invoiceSeriesSchema.extend({
	id: z.number().int().positive(),
});

const deleteSeriesSchema = z.object({
	id: z.number().int().positive(),
});

/**
 * GET /api/tenants/[tenantId]/invoices/series
 * List all invoice series for a tenant
 */
export async function GET(
	request: NextRequest,
	{ params }: { params: Promise<{ tenantId: string }> }
) {
	const sessionResult = await requireAuthResponse();
	if (sessionResult instanceof NextResponse) {
		return sessionResult;
	}

	const { tenantId } = await params;
	const userId = getUserId(sessionResult);

	const tenantAccessError = requireTenantAccess(sessionResult, tenantId);
	if (tenantAccessError) {
		return tenantAccessError;
	}

	try {
		// Get all invoice series for this tenant
		const series = await prisma.invoiceSeries.findMany({
			where: {
				tenantId: Number(tenantId),
			},
			orderBy: {
				createdAt: 'desc',
			},
		});

		return NextResponse.json({
			success: true,
			series,
		});
	} catch (error) {
		console.error("Error fetching invoice series:", error);
		return NextResponse.json(
			{ success: false, error: "Failed to fetch invoice series" },
			{ status: 500 }
		);
	}
}

/**
 * POST /api/tenants/[tenantId]/invoices/series
 * Create a new invoice series
 */
export async function POST(
	request: NextRequest,
	{ params }: { params: Promise<{ tenantId: string }> }
) {
	const sessionResult = await requireAuthResponse();
	if (sessionResult instanceof NextResponse) {
		return sessionResult;
	}

	const { tenantId } = await params;
	const userId = getUserId(sessionResult);

	// Only admins can create invoice series
	if (sessionResult.user.role !== "ADMIN") {
		return NextResponse.json(
			{ success: false, error: "Only administrators can create invoice series" },
			{ status: 403 }
		);
	}

	const tenantAccessError = requireTenantAccess(sessionResult, tenantId);
	if (tenantAccessError) {
		return tenantAccessError;
	}

	try {
		const body = await request.json();
		const validation = invoiceSeriesSchema.safeParse(body);

		if (!validation.success) {
			return NextResponse.json(
				{
					success: false,
					error: "Validation failed",
					details: validation.error.errors,
				},
				{ status: 400 }
			);
		}

		const data = validation.data;

		// Find default database for this tenant
		const database = await prisma.database.findFirst({
			where: {
				tenantId: Number(tenantId),
				isDefault: true,
			},
		});

		if (!database) {
			return NextResponse.json(
				{ success: false, error: "No default database found for this tenant" },
				{ status: 404 }
			);
		}

		// Check if series with this name already exists
		const existingSeries = await prisma.invoiceSeries.findFirst({
			where: {
				tenantId: Number(tenantId),
				databaseId: database.id,
				series: data.series,
			},
		});

		if (existingSeries) {
			return NextResponse.json(
				{ success: false, error: `Series "${data.series}" already exists` },
				{ status: 400 }
			);
		}

		// Create new series with ALL fields from form
		const newSeries = await prisma.invoiceSeries.create({
			data: {
				tenantId: Number(tenantId),
				databaseId: database.id,
				series: data.series,
				prefix: data.prefix,
				suffix: data.suffix,
				separator: data.separator,
				includeYear: data.includeYear,
				includeMonth: data.includeMonth,
				resetYearly: data.resetYearly,
				currentNumber: data.startNumber - 1, // Start from startNumber - 1 so next invoice gets startNumber
			},
		});

		return NextResponse.json({
			success: true,
			series: newSeries,
		});
	} catch (error) {
		console.error("Error creating invoice series:", error);
		return NextResponse.json(
			{ success: false, error: "Failed to create invoice series" },
			{ status: 500 }
		);
	}
}

/**
 * PUT /api/tenants/[tenantId]/invoices/series
 * Update an existing invoice series
 */
export async function PUT(
	request: NextRequest,
	{ params }: { params: Promise<{ tenantId: string }> }
) {
	const sessionResult = await requireAuthResponse();
	if (sessionResult instanceof NextResponse) {
		return sessionResult;
	}

	const { tenantId } = await params;
	const userId = getUserId(sessionResult);

	// Only admins can update invoice series
	if (sessionResult.user.role !== "ADMIN") {
		return NextResponse.json(
			{ success: false, error: "Only administrators can update invoice series" },
			{ status: 403 }
		);
	}

	const tenantAccessError = requireTenantAccess(sessionResult, tenantId);
	if (tenantAccessError) {
		return tenantAccessError;
	}

	try {
		const body = await request.json();
		const validation = updateSeriesSchema.safeParse(body);

		if (!validation.success) {
			return NextResponse.json(
				{
					success: false,
					error: "Validation failed",
					details: validation.error.errors,
				},
				{ status: 400 }
			);
		}

		const { id, ...data } = validation.data;

		// Verify series belongs to this tenant
		const existingSeries = await prisma.invoiceSeries.findFirst({
			where: {
				id,
				tenantId: Number(tenantId),
			},
		});

		if (!existingSeries) {
			return NextResponse.json(
				{ success: false, error: "Series not found" },
				{ status: 404 }
			);
		}

		// Update series with ALL fields from form
		const updatedSeries = await prisma.invoiceSeries.update({
			where: { id },
			data: {
				series: data.series,
				prefix: data.prefix,
				suffix: data.suffix,
				separator: data.separator,
				includeYear: data.includeYear,
				includeMonth: data.includeMonth,
				resetYearly: data.resetYearly,
				currentNumber: data.startNumber - 1, // Update to new start number
			},
		});

		return NextResponse.json({
			success: true,
			series: updatedSeries,
		});
	} catch (error) {
		console.error("Error updating invoice series:", error);
		return NextResponse.json(
			{ success: false, error: "Failed to update invoice series" },
			{ status: 500 }
		);
	}
}

/**
 * DELETE /api/tenants/[tenantId]/invoices/series
 * Delete an invoice series
 */
export async function DELETE(
	request: NextRequest,
	{ params }: { params: Promise<{ tenantId: string }> }
) {
	const sessionResult = await requireAuthResponse();
	if (sessionResult instanceof NextResponse) {
		return sessionResult;
	}

	const { tenantId } = await params;
	const userId = getUserId(sessionResult);

	// Only admins can delete invoice series
	if (sessionResult.user.role !== "ADMIN") {
		return NextResponse.json(
			{ success: false, error: "Only administrators can delete invoice series" },
			{ status: 403 }
		);
	}

	const tenantAccessError = requireTenantAccess(sessionResult, tenantId);
	if (tenantAccessError) {
		return tenantAccessError;
	}

	try {
		const body = await request.json();
		const validation = deleteSeriesSchema.safeParse(body);

		if (!validation.success) {
			return NextResponse.json(
				{
					success: false,
					error: "Validation failed",
					details: validation.error.errors,
				},
				{ status: 400 }
			);
		}

		const { id } = validation.data;

		// Verify series belongs to this tenant
		const existingSeries = await prisma.invoiceSeries.findFirst({
			where: {
				id,
				tenantId: Number(tenantId),
			},
		});

		if (!existingSeries) {
			return NextResponse.json(
				{ success: false, error: "Series not found" },
				{ status: 404 }
			);
		}

		// Delete the series
		await prisma.invoiceSeries.delete({
			where: { id },
		});

		return NextResponse.json({
			success: true,
			message: "Series deleted successfully",
		});
	} catch (error) {
		console.error("Error deleting invoice series:", error);
		return NextResponse.json(
			{ success: false, error: "Failed to delete invoice series" },
			{ status: 500 }
		);
	}
}
