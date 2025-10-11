/** @format */

import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { requireAuthResponse, requireTenantAccess, getUserId } from "@/lib/session";
import { InvoiceSystemService } from "@/lib/invoice-system";
import { z } from "zod";

const CreateCustomerSchema = z.object({
	customer_name: z.string().min(1, "Customer name is required"),
	customer_type: z.enum(["Persoană fizică", "Persoană juridică"]).optional(),
	customer_email: z.string().email("Valid email is required"),
	customer_phone: z.string().optional(),
	customer_cnp: z.string().optional(),
	customer_cui: z.string().optional(),
	customer_company_registration_number: z.string().optional(),
	customer_vat_number: z.string().optional(),
	customer_street: z.string().optional(),
	customer_street_number: z.string().optional(),
	customer_city: z.string().optional(),
	customer_country: z.string().optional(),
	customer_postal_code: z.string().optional(),
	customer_address: z.string().optional(),
	customer_bank_account: z.string().optional(),
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

		// Create customer cells with all fields
		const customerCells = [];
		
		// Helper function to add cell if column exists and value is provided
		const addCell = (columnName: string, value: any) => {
			if (value !== undefined && value !== null && value !== '') {
				const column = invoiceTables.customers!.columns!.find(
					(c: any) => c.name === columnName,
				);
				if (column) {
					customerCells.push({
						rowId: customerRow.id,
						columnId: column.id,
						value: value,
					});
				}
			}
		};

		// Add all customer fields
		addCell("customer_name", parsedData.customer_name);
		addCell("customer_type", parsedData.customer_type);
		addCell("customer_email", parsedData.customer_email);
		addCell("customer_phone", parsedData.customer_phone);
		addCell("customer_cnp", parsedData.customer_cnp);
		addCell("customer_cui", parsedData.customer_cui);
		addCell("customer_company_registration_number", parsedData.customer_company_registration_number);
		addCell("customer_vat_number", parsedData.customer_vat_number);
		addCell("customer_street", parsedData.customer_street);
		addCell("customer_street_number", parsedData.customer_street_number);
		addCell("customer_city", parsedData.customer_city);
		addCell("customer_country", parsedData.customer_country);
		addCell("customer_postal_code", parsedData.customer_postal_code);
		addCell("customer_address", parsedData.customer_address);
		addCell("customer_bank_account", parsedData.customer_bank_account);

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
				customer_type: parsedData.customer_type,
				customer_email: parsedData.customer_email,
				customer_phone: parsedData.customer_phone,
				customer_cnp: parsedData.customer_cnp,
				customer_cui: parsedData.customer_cui,
				customer_company_registration_number: parsedData.customer_company_registration_number,
				customer_vat_number: parsedData.customer_vat_number,
				customer_street: parsedData.customer_street,
				customer_street_number: parsedData.customer_street_number,
				customer_city: parsedData.customer_city,
				customer_country: parsedData.customer_country,
				customer_postal_code: parsedData.customer_postal_code,
				customer_address: parsedData.customer_address,
				customer_bank_account: parsedData.customer_bank_account,
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
