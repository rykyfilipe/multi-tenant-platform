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

		const updatedTenant = await prisma.tenant.update({
			where: { id: tenant_id },
			data: cleanUpdateData,
			include: {
				users: true,
			},
		});

		return NextResponse.json(updatedTenant);
	} catch (error) {
		console.error("Error updating tenant:", error);
		return NextResponse.json(
			{ error: "Failed to update tenant" },
			{ status: 500 },
		);
	}
}
