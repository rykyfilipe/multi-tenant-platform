/** @format */

import prisma from "@/lib/prisma";
import { requireTenantAccessAPI } from "@/lib/session";
import { NextResponse } from "next/server";
import { z } from "zod";

const tenantSchema = z.object({
	tenantId: z.string().regex(/^\d+$/, "tenantId must be a numeric string"),
});

const updateTenantSchema = z.object({
	name: z.string().min(1).optional(),
	companyEmail: z.string().email().optional().or(z.literal("")),
	phone: z.string().optional(),
	website: z.string().url().optional().or(z.literal("")),
	address: z.string().optional(),
	logoUrl: z.string().url().optional().or(z.literal("")),
	theme: z.string().optional(),
	timezone: z.string().optional(),
	language: z.string().optional(),
	defaultCurrency: z.string().optional(),
	// Câmpuri obligatorii pentru facturi
	companyTaxId: z.string().optional(),
	registrationNumber: z.string().optional(),
	companyStreet: z.string().optional(),
	companyStreetNumber: z.string().optional(),
	companyCity: z.string().optional(),
	companyCountry: z.string().optional(),
	companyPostalCode: z.string().optional(),
	companyIban: z.string().optional(),
	companyBank: z.string().optional(),
	// Invoice numbering settings
	invoiceStartNumber: z.number().min(1).optional(),
	invoiceSeriesPrefix: z.string().optional(),
	invoiceIncludeYear: z.boolean().optional(),
});

export async function GET(
	request: Request,
	{ params }: { params: Promise<{ tenantId: string }> },
) {
	const { tenantId } = await params;
	const sessionResult = await requireTenantAccessAPI(tenantId);
	if (sessionResult instanceof NextResponse) {
		return sessionResult;
	}

	try {
		const validation = tenantSchema.safeParse({ tenantId });
		if (!validation.success) {
			return NextResponse.json(
				{ error: validation.error.errors[0].message },
				{ status: 400 },
			);
		}

		const tenant_id = parseInt(tenantId, 10);
		const tenant = await prisma.tenant.findUnique({
			where: { id: tenant_id },
			include: {
				users: true,
			},
		});

		if (!tenant) {
			return NextResponse.json({ error: "Tenant not found" }, { status: 404 });
		}

		return NextResponse.json(tenant);
	} catch (error) {
		console.error("Error fetching tenant:", error);
		return NextResponse.json(
			{ error: "Failed to fetch tenant" },
			{ status: 500 },
		);
	}
}

export async function PATCH(
	request: Request,
	{ params }: { params: Promise<{ tenantId: string }> },
) {
	const { tenantId } = await params;
	const sessionResult = await requireTenantAccessAPI(tenantId);
	if (sessionResult instanceof NextResponse) {
		return sessionResult;
	}

	// Only admin can update tenant settings
	if (sessionResult.user.role !== "ADMIN") {
		return NextResponse.json({ error: "Forbidden" }, { status: 403 });
	}

	try {
		const validation = tenantSchema.safeParse({ tenantId });
		if (!validation.success) {
			return NextResponse.json(
				{ error: validation.error.errors[0].message },
				{ status: 400 },
			);
		}

		const body = await request.json();

		const updateValidation = updateTenantSchema.safeParse(body);

		if (!updateValidation.success) {
			return NextResponse.json(
				{
					error: "Invalid update data",
					details: updateValidation.error.errors,
				},
				{ status: 400 },
			);
		}

		const tenant_id = parseInt(tenantId, 10);
		const updateData = updateValidation.data;

		// Remove empty strings and convert to null for optional fields
		const cleanUpdateData = Object.fromEntries(
			Object.entries(updateData).map(([key, value]) => [
				key,
				value === "" ? null : value,
			]),
		);

		// Get current tenant data for comparison
		const currentTenant = await prisma.tenant.findUnique({
			where: { id: tenant_id },
		});

		const updatedTenant = await prisma.tenant.update({
			where: { id: tenant_id },
			data: cleanUpdateData,
			include: {
				users: true,
			},
		});

		// If invoiceSeriesPrefix was updated, manage default invoice series
		if (cleanUpdateData.invoiceSeriesPrefix && cleanUpdateData.invoiceSeriesPrefix !== currentTenant?.invoiceSeriesPrefix) {
			try {
				// Find the default database for this tenant
				const defaultDatabase = await prisma.database.findFirst({
					where: {
						tenantId: tenant_id,
						isDefault: true,
					},
				});

				if (defaultDatabase) {
					// Check if a series with this prefix already exists
					const existingSeries = await prisma.invoiceSeries.findFirst({
						where: {
							tenantId: tenant_id,
							databaseId: defaultDatabase.id,
							series: cleanUpdateData.invoiceSeriesPrefix,
						},
					});

					if (existingSeries) {
						// Update existing series with new settings
						await prisma.invoiceSeries.update({
							where: { id: existingSeries.id },
							data: {
								currentNumber: cleanUpdateData.invoiceStartNumber ? cleanUpdateData.invoiceStartNumber - 1 : existingSeries.currentNumber,
								includeYear: cleanUpdateData.invoiceIncludeYear ?? existingSeries.includeYear,
							},
						});
					} else {
						// Check if any series exist for this tenant, if not, create a default one
						const allSeries = await prisma.invoiceSeries.findMany({
							where: { tenantId: tenant_id },
						});

						if (allSeries.length === 0) {
							await prisma.invoiceSeries.create({
								data: {
									tenantId: tenant_id,
									databaseId: defaultDatabase.id,
									series: cleanUpdateData.invoiceSeriesPrefix,
									prefix: cleanUpdateData.invoiceSeriesPrefix,
									currentNumber: cleanUpdateData.invoiceStartNumber ? cleanUpdateData.invoiceStartNumber - 1 : 0,
									includeYear: cleanUpdateData.invoiceIncludeYear ?? true,
								},
							});
						}
					}
				}
			} catch (seriesError) {
				console.error("Error managing invoice series:", seriesError);
				// Don't fail the tenant update if series management fails
			}
		}

		return NextResponse.json(updatedTenant);
	} catch (error) {
		console.error("Error updating tenant:", error);
		return NextResponse.json(
			{ error: "Failed to update tenant" },
			{ status: 500 },
		);
	}
}
