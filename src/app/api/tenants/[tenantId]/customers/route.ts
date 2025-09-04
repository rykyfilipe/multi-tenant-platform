/** @format */

import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { requireAuthResponse, requireTenantAccess, getUserId } from "@/lib/session";
import { InvoiceSystemService } from "@/lib/invoice-system";
import { z } from "zod";

const CreateCustomerSchema = z.object({
	customer_name: z.string().min(1, "Customer name is required"),
	customer_email: z.string().email("Valid email is required"),
	customer_address: z.string().optional(),
	additional_data: z.record(z.any()).optional(),
});

export async function POST(
	request: NextRequest,
	{ params }: { params: Promise<{ tenantId: string }> },
) {
	const sessionResult = await requireAuthResponse();
	if (sessionResult instanceof NextResponse) {
		return sessionResult;
	}

	const { tenantId } = await params;
	const userId = getUserId(sessionResult);

	// Check tenant access
	const tenantAccessError = requireTenantAccess(sessionResult, tenantId);
	if (tenantAccessError) {
		return tenantAccessError;
	}

	try {
		const body = await request.json();
		const parsedData = CreateCustomerSchema.parse(body);

		// Get the database for this tenant
		const database = await prisma.database.findFirst({
			where: { tenantId: Number(tenantId) },
		});

		if (!database) {
			return NextResponse.json(
				{ error: "Database not found for this tenant" },
				{ status: 404 },
			);
		}

		// Check if billing module is enabled
		const tenant = await prisma.tenant.findUnique({
			where: { id: Number(tenantId) },
			select: { enabledModules: true },
		});

		if (!tenant || !tenant.enabledModules.includes("billing")) {
			return NextResponse.json(
				{ error: "Billing module is not enabled for this tenant" },
				{ status: 403 },
			);
		}

		// Get or initialize invoice tables
		let invoiceTables = await InvoiceSystemService.getInvoiceTables(
			Number(tenantId),
			database.id,
		);

		// If tables don't exist, create them
		if (!invoiceTables.customers) {
			invoiceTables = await InvoiceSystemService.initializeInvoiceTables(
				Number(tenantId),
				database.id,
			);
		}

		// Check if customer with same email already exists
		const existingCustomer = await prisma.row.findFirst({
			where: {
				tableId: invoiceTables.customers!.id,
				cells: {
					some: {
						column: {
							name: "customer_email",
						},
						value: {
							equals: parsedData.customer_email,
						},
					},
				},
			},
		});

		if (existingCustomer) {
			return NextResponse.json(
				{ error: "Customer with this email already exists" },
				{ status: 409 },
			);
		}

		// Create customer row
		const customerRow = await prisma.row.create({
			data: {
				tableId: invoiceTables.customers!.id,
			},
		});

		// Create customer cells
		const customerCells = [
			{
				rowId: customerRow.id,
				columnId: invoiceTables.customers!.columns!.find(
					(c: any) => c.name === "customer_name",
				)!.id,
				value: parsedData.customer_name,
			},
			{
				rowId: customerRow.id,
				columnId: invoiceTables.customers!.columns!.find(
					(c: any) => c.name === "customer_email",
				)!.id,
				value: parsedData.customer_email,
			},
		];

		if (parsedData.customer_address) {
			customerCells.push({
				rowId: customerRow.id,
				columnId: invoiceTables.customers!.columns!.find(
					(c: any) => c.name === "customer_address",
				)!.id,
				value: parsedData.customer_address,
			});
		}

		// Add additional data cells if any
		if (parsedData.additional_data) {
			// Get custom columns for customers table
			const customColumns = invoiceTables.customers!.columns!.filter(
				(c: any) => !c.isLocked,
			);

			for (const [key, value] of Object.entries(parsedData.additional_data)) {
				const column = customColumns.find((c: any) => c.name === key);
				if (column) {
					customerCells.push({
						rowId: customerRow.id,
						columnId: column.id,
						value,
					});
				}
			}
		}

		// Create all customer cells
		await prisma.cell.createMany({
			data: customerCells,
		});

		return NextResponse.json({
			message: "Customer created successfully",
			customer: {
				id: customerRow.id,
				customer_name: parsedData.customer_name,
				customer_email: parsedData.customer_email,
				customer_address: parsedData.customer_address,
			},
		});
	} catch (error) {
		console.error("Error creating customer:", error);
		if (error instanceof z.ZodError) {
			return NextResponse.json(
				{ error: "Validation error", details: error.errors },
				{ status: 400 },
			);
		}
		return NextResponse.json(
			{ error: "Failed to create customer" },
			{ status: 500 },
		);
	}
}

export async function GET(
	request: NextRequest,
	{ params }: { params: Promise<{ tenantId: string }> },
) {
	const sessionResult = await requireAuthResponse();
	if (sessionResult instanceof NextResponse) {
		return sessionResult;
	}

	const { tenantId } = await params;
	const userId = getUserId(sessionResult);

	// Check tenant access
	const tenantAccessError = requireTenantAccess(sessionResult, tenantId);
	if (tenantAccessError) {
		return tenantAccessError;
	}

	try {
		// Get the database for this tenant
		const database = await prisma.database.findFirst({
			where: { tenantId: Number(tenantId) },
		});

		if (!database) {
			return NextResponse.json(
				{ error: "Database not found for this tenant" },
				{ status: 404 },
			);
		}

		// Check if billing module is enabled
		const tenant = await prisma.tenant.findUnique({
			where: { id: Number(tenantId) },
			select: { enabledModules: true },
		});

		if (!tenant || !tenant.enabledModules.includes("billing")) {
			return NextResponse.json({ customers: [] });
		}

		// Get invoice tables
		const invoiceTables = await InvoiceSystemService.getInvoiceTables(
			Number(tenantId),
			database.id,
		);

		if (!invoiceTables.customers) {
			return NextResponse.json({ customers: [] });
		}

		// Get all customers with basic info
		const customers = await prisma.row.findMany({
			where: { tableId: invoiceTables.customers.id },
			include: {
				cells: {
					include: {
						column: true,
					},
				},
			},
			orderBy: { id: "desc" },
		});

		// Transform to readable format
		const formattedCustomers = customers.map((customer: any) => {
			const customerData: any = { id: customer.id };

			customer.cells.forEach((cell: any) => {
				customerData[cell.column.name] = cell.value;
			});

			return customerData;
		});

		return NextResponse.json({ customers: formattedCustomers });
	} catch (error) {
		console.error("Error fetching customers:", error);
		return NextResponse.json(
			{ error: "Failed to fetch customers" },
			{ status: 500 },
		);
	}
}
