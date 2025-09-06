/** @format */

import { NextRequest, NextResponse } from "next/server";	
import { requireAuthResponse, requireTenantAccess, getUserId } from "@/lib/session";
import { InvoiceSystemService, CreateInvoiceRequest } from "@/lib/invoice-system";
import { z } from "zod";
import prisma from "@/lib/prisma";
import { InvoiceCalculationService } from "@/lib/invoice-calculations";
import {
	validateTableForInvoices,
	extractProductDetails,
	getValidationMessage,
} from "@/lib/semantic-helpers";

const CreateInvoiceSchema = z.object({
	customer_id: z.number(),
	base_currency: z.string(),
	due_date: z.string(),
	payment_terms: z.string().optional(),
	payment_method: z.string(),
	notes: z.string().optional(),
	status: z.string().optional().default("draft"),
	invoice_series: z.string().optional(),
	additional_data: z.record(z.unknown()).optional(),
	products: z.array(
		z.object({
			product_ref_table: z.string(),
			product_ref_id: z.number(),
			quantity: z.number(),
			unit_of_measure: z.string().optional(),
			description: z.string().optional(),
			currency: z.string(),
			original_price: z.number(),
			converted_price: z.number(),
			price: z.number(),
		}),
	),
});

export async function POST(
	request: NextRequest,
	{ params }: { params: Promise<{ tenantId: string }> },
) {
	const sessionResult = await requireAuthResponse();
	if (sessionResult instanceof NextResponse) {
		return sessionResult;
	}
	const userId = getUserId(sessionResult);
	if (!sessionResult.user.email) {
		return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
	}

	const userResult = await prisma.user.findFirst({
		where: { email: sessionResult.user.email },
	});

	if (!userResult) {
		return NextResponse.json({ error: "User not found" }, { status: 404 });
	}

	const { tenantId } = await params;

	 const tenantAccessError = requireTenantAccess(sessionResult, tenantId.toString());
	if (tenantAccessError) {
		return tenantAccessError;
	}

	try {
		const body = await request.json();
		const parsedData = CreateInvoiceSchema.parse(body);

		// Get the database for this tenant and tenant info
		const [database, tenantInfo] = await Promise.all([
			prisma.database.findFirst({
				where: { tenantId: Number(tenantId) },
			}),
			prisma.tenant.findUnique({
				where: { id: Number(tenantId) },
				select: { defaultCurrency: true },
			}),
		]);

		if (!database) {
			return NextResponse.json(
				{ error: "Database not found for this tenant" },
				{ status: 404 },
			);
		}

		// Get or initialize invoice tables
		let invoiceTables = await InvoiceSystemService.getInvoiceTables(
			Number(tenantId),
			database.id,
		);

		// Check if tables exist but have wrong schema
		const hasCorrectSchema = invoiceTables.invoice_items?.columns?.some(
			(c: any) => c.name === "product_ref_table",
		);

		// If tables don't exist OR have wrong schema, recreate them
		if (
			!invoiceTables.customers ||
			!invoiceTables.invoices ||
			!invoiceTables.invoice_items ||
			!hasCorrectSchema
		) {
			// Delete existing tables if they exist but have wrong schema
			if (invoiceTables.invoice_items && !hasCorrectSchema) {
				await prisma.row.deleteMany({
					where: { tableId: invoiceTables.invoice_items.id },
				});
				await prisma.column.deleteMany({
					where: { tableId: invoiceTables.invoice_items.id },
				});
				await prisma.table.delete({
					where: { id: invoiceTables.invoice_items.id },
				});
			}

			invoiceTables = await InvoiceSystemService.initializeInvoiceTables(
				Number(tenantId),
				database.id,
			);

			// Refetch the tables to get the columns
			invoiceTables = await InvoiceSystemService.getInvoiceTables(
				Number(tenantId),
				database.id,
			);
		} else {
			// Tables exist but might be missing new columns - try to update schema
			try {
				await InvoiceSystemService.updateInvoiceTablesSchema(
					Number(tenantId),
					database.id,
				);

				// Refetch tables to get updated schema
				invoiceTables = await InvoiceSystemService.getInvoiceTables(
					Number(tenantId),
					database.id,
				);
			} catch (error) {
				console.error("Failed to update invoice tables schema:", error);
				// Continue with existing schema - validation will catch missing columns
			}
		}

		// Validate that all required tables and columns exist
		if (!invoiceTables.invoice_items?.columns) {
			console.error(
				"invoice_items table or columns missing:",
				invoiceTables.invoice_items,
			);
			return NextResponse.json(
				{ error: "Invoice system tables not properly initialized" },
				{ status: 500 },
			);
		}

		// Check if required columns exist using semantic types
		const requiredSemanticTypes = [
			"invoice_number", // invoice_id
			"reference", // product_ref_table
			"id", // product_ref_id
			"quantity",
			"unit_price", // price
			"product_vat",
			"currency",
		];

		const missingSemanticTypes = requiredSemanticTypes.filter((semanticType) => {
			const found = invoiceTables.invoice_items!.columns!.find(
				(c: any) => c.semanticType === semanticType,
			);
			return !found;
		});

		if (missingSemanticTypes.length > 0) {
			console.error("Missing required semantic types:", missingSemanticTypes);
			console.error(
				"Available columns:",
				invoiceTables.invoice_items!.columns!.map((c: any) => ({
					name: c.name,
					semanticType: c.semanticType,
				})),
			);
			return NextResponse.json(
				{ error: `Missing required columns: ${missingSemanticTypes.join(", ")}` },
				{ status: 500 },
			);
		}

		// Get tenant settings for invoice numbering
		const tenant = await prisma.tenant.findUnique({
			where: { id: Number(tenantId) },
		});

		// Generate invoice number with series using tenant settings
		const invoiceData =
			await InvoiceSystemService.generateInvoiceNumberWithConfig(
				Number(tenantId),
				database.id,
				{
					series: (tenant as any)?.invoiceSeriesPrefix || "INV",
					includeYear: (tenant as any)?.invoiceIncludeYear !== false, // default true
					startNumber: (tenant as any)?.invoiceStartNumber || 1,
					separator: "-",
				},
			);

		// Extract invoice number and series from generated data
		const invoiceNumber = invoiceData.number;
		const invoiceSeries = invoiceData.series;

		// Create invoice row
		const invoiceRow = await prisma.row.create({
			data: {
				tableId: invoiceTables.invoices!.id,
			},
		});

		// Create invoice cells
		const invoiceCells: Array<{
			rowId: number;
			columnId: number;
			value: string | number;
		}> = [];

		// Find required columns safely using semantic types
		const invoiceNumberColumn = invoiceTables.invoices!.columns!.find(
			(c: any) => c.semanticType === "invoice_number",
		);
		const invoiceSeriesColumn = invoiceTables.invoices!.columns!.find(
			(c: any) => c.semanticType === "invoice_series",
		);
		const dateColumn = invoiceTables.invoices!.columns!.find(
			(c: any) => c.semanticType === "invoice_date",
		);
		const dueDateColumn = invoiceTables.invoices!.columns!.find(
			(c: any) => c.semanticType === "invoice_due_date",
		);
		const customerIdColumn = invoiceTables.invoices!.columns!.find(
			(c: any) => c.semanticType === "invoice_customer_id",
		);

		// Validate that all required columns exist
		if (
			!invoiceNumberColumn ||
			!dateColumn ||
			!dueDateColumn ||
			!customerIdColumn
		) {
			return NextResponse.json(
				{ error: "Required invoice columns not found" },
				{ status: 500 },
			);
		}

		// Add required cells
		invoiceCells.push({
			rowId: invoiceRow.id,
			columnId: invoiceNumberColumn.id,
			value: invoiceNumber,
		});

		// Add invoice series if column exists (optional for backward compatibility)
		if (invoiceSeriesColumn) {
			invoiceCells.push({
				rowId: invoiceRow.id,
				columnId: invoiceSeriesColumn.id,
				value: invoiceSeries,
			});
		}

		invoiceCells.push({
			rowId: invoiceRow.id,
			columnId: dateColumn.id,
			value: new Date().toISOString(),
		});

		invoiceCells.push({
			rowId: invoiceRow.id,
			columnId: dueDateColumn.id,
			value: parsedData.due_date,
		});

		invoiceCells.push({
			rowId: invoiceRow.id,
			columnId: customerIdColumn.id,
			value: parsedData.customer_id,
		});

		// Add payment details if columns exist
		const paymentTermsColumn = invoiceTables.invoices!.columns!.find(
			(c: any) => c.semanticType === "invoice_payment_terms",
		);
		if (paymentTermsColumn && parsedData.payment_terms) {
			invoiceCells.push({
				rowId: invoiceRow.id,
				columnId: paymentTermsColumn.id,
				value: parsedData.payment_terms,
			});
		}

		const paymentMethodColumn = invoiceTables.invoices!.columns!.find(
			(c: any) => c.semanticType === "invoice_payment_method",
		);
		if (paymentMethodColumn && parsedData.payment_method) {
			invoiceCells.push({
				rowId: invoiceRow.id,
				columnId: paymentMethodColumn.id,
				value: parsedData.payment_method,
			});
		}

		const notesColumn = invoiceTables.invoices!.columns!.find(
			(c: any) => c.semanticType === "invoice_notes",
		);
		if (notesColumn && parsedData.notes) {
			invoiceCells.push({
				rowId: invoiceRow.id,
				columnId: notesColumn.id,
				value: parsedData.notes,
			});
		}

		// Add status column
		const statusColumn = invoiceTables.invoices!.columns!.find(
			(c: any) => c.semanticType === "invoice_status",
		);
		if (statusColumn) {
			invoiceCells.push({
				rowId: invoiceRow.id,
				columnId: statusColumn.id,
				value: parsedData.status || "draft",
			});
		}

		// Add base currency column
		const baseCurrencyColumn = invoiceTables.invoices!.columns!.find(
			(c: any) => c.semanticType === "invoice_base_currency",
		);
		if (baseCurrencyColumn && parsedData.base_currency) {
			invoiceCells.push({
				rowId: invoiceRow.id,
				columnId: baseCurrencyColumn.id,
				value: parsedData.base_currency,
			});
		}

		// Override invoice series if provided by user
		if (parsedData.invoice_series && invoiceSeriesColumn) {
			// Remove the automatically generated series cell if it exists
			const existingSeriesIndex = invoiceCells.findIndex(
				cell => cell.columnId === invoiceSeriesColumn.id
			);
			if (existingSeriesIndex !== -1) {
				invoiceCells[existingSeriesIndex].value = parsedData.invoice_series;
			}
		}

		// Add additional data cells if any
		if (parsedData.additional_data) {
			// Get custom columns for invoices table
			const customColumns = invoiceTables.invoices!.columns!.filter(
				(c: any) => !c.isLocked,
			);

			for (const [key, value] of Object.entries(parsedData.additional_data)) {
				const column = customColumns.find((c: any) => c.name === key);
				if (
					column &&
					(typeof value === "string" || typeof value === "number")
				) {
					invoiceCells.push({
						rowId: invoiceRow.id,
						columnId: column.id,
						value,
					});
				}
			}
		}

		// Create all invoice cells
		await prisma.cell.createMany({
			data: invoiceCells,
		});

		// Create invoice items with full product details
		const invoiceItemRows = [];
		for (const product of parsedData.products) {
			const itemRow = await prisma.row.create({
				data: {
					tableId: invoiceTables.invoice_items!.id,
				},
			});

			// Find all columns safely using semantic types
			const columns = {
				invoice_id: invoiceTables.invoice_items!.columns!.find(
					(c: any) => c.semanticType === "invoice_number",
				),
				product_ref_table: invoiceTables.invoice_items!.columns!.find(
					(c: any) => c.semanticType === "reference",
				),
				product_ref_id: invoiceTables.invoice_items!.columns!.find(
					(c: any) => c.semanticType === "id",
				),
				quantity: invoiceTables.invoice_items!.columns!.find(
					(c: any) => c.semanticType === "quantity",
				),
				price: invoiceTables.invoice_items!.columns!.find(
					(c: any) => c.semanticType === "unit_price",
				),
				product_vat: invoiceTables.invoice_items!.columns!.find(
					(c: any) => c.semanticType === "product_vat",
				),
				currency: invoiceTables.invoice_items!.columns!.find(
					(c: any) => c.semanticType === "currency",
				),
				product_name: invoiceTables.invoice_items!.columns!.find(
					(c: any) => c.semanticType === "product_name",
				),
				product_description: invoiceTables.invoice_items!.columns!.find(
					(c: any) => c.semanticType === "product_description",
				),
				product_category: invoiceTables.invoice_items!.columns!.find(
					(c: any) => c.semanticType === "product_category",
				),
				product_sku: invoiceTables.invoice_items!.columns!.find(
					(c: any) => c.semanticType === "product_sku",
				),
				product_brand: invoiceTables.invoice_items!.columns!.find(
					(c: any) => c.semanticType === "product_brand",
				),
				product_weight: invoiceTables.invoice_items!.columns!.find(
					(c: any) => c.semanticType === "product_weight",
				),
				product_dimensions: invoiceTables.invoice_items!.columns!.find(
					(c: any) => c.semanticType === "product_dimensions",
				),
				description: invoiceTables.invoice_items!.columns!.find(
					(c: any) => c.semanticType === "description",
				),
			};

			// Get product details from the referenced table using semantic types
			let productDetails: any = {};
			try {
				const productTable = await prisma.table.findFirst({
					where: {
						name: product.product_ref_table,
						databaseId: database.id,
					},
					include: {
						columns: true,
					},
				});

				if (productTable) {
					// Validate if the table is suitable for invoices
					const validation = validateTableForInvoices(
						productTable.columns,
						productTable.name,
					);

					if (!validation.isValid) {
						console.warn(
							`Table ${
								productTable.name
							} is not suitable for invoices: ${getValidationMessage(
								validation,
								productTable.name,
							)}`,
						);
					}

					const productRow = await prisma.row.findUnique({
						where: { id: product.product_ref_id },
						include: {
							cells: {
								include: {
									column: true,
								},
							},
						},
					});

					if (productRow) {
						// Extract product details using semantic types
						productDetails = extractProductDetails(
							productTable.columns,
							productRow.cells,
						);
					}
				}
			} catch (error) {
				console.warn(
					`Failed to fetch product details for ${product.product_ref_table}:${product.product_ref_id}`,
					error,
				);
			}

			const itemCells = [
				{
					rowId: itemRow.id,
					columnId: columns.invoice_id!.id,
					value: invoiceRow.id,
				},
				{
					rowId: itemRow.id,
					columnId: columns.product_ref_table!.id,
					value: product.product_ref_table,
				},
				{
					rowId: itemRow.id,
					columnId: columns.product_ref_id!.id,
					value: product.product_ref_id,
				},
				{
					rowId: itemRow.id,
					columnId: columns.quantity!.id,
					value: product.quantity,
				},
				{
					rowId: itemRow.id,
					columnId: columns.price!.id,
					value: product.price || productDetails.price || 0, // Use provided price or extract from product
				},
				{
					rowId: itemRow.id,
					columnId: columns.product_vat!.id,
					value: productDetails.vat || 0, // Extract VAT from product details
				},
				{
					rowId: itemRow.id,
					columnId: columns.currency!.id,
					value: product.currency || productDetails.currency || "USD", // Use provided currency or extract from product
				},
			];

			// Add unit of measure if column exists
			const unitOfMeasureColumn = invoiceTables.invoice_items!.columns!.find(
				(c: any) => c.semanticType === "unit_of_measure",
			);
			if (unitOfMeasureColumn && product.unit_of_measure) {
				itemCells.push({
					rowId: itemRow.id,
					columnId: unitOfMeasureColumn.id,
					value: product.unit_of_measure,
				});
			}

			// Add product details if columns exist
			if (columns.product_name && productDetails.name) {
				itemCells.push({
					rowId: itemRow.id,
					columnId: columns.product_name.id,
					value: productDetails.name,
				});
			}
			if (columns.product_description && productDetails.description) {
				itemCells.push({
					rowId: itemRow.id,
					columnId: columns.product_description.id,
					value: productDetails.description,
				});
			}
			if (columns.product_category && productDetails.category) {
				itemCells.push({
					rowId: itemRow.id,
					columnId: columns.product_category.id,
					value: productDetails.category,
				});
			}
			if (columns.product_sku && productDetails.sku) {
				itemCells.push({
					rowId: itemRow.id,
					columnId: columns.product_sku.id,
					value: productDetails.sku,
				});
			}
			if (columns.product_brand && productDetails.brand) {
				itemCells.push({
					rowId: itemRow.id,
					columnId: columns.product_brand.id,
					value: productDetails.brand,
				});
			}
			if (columns.product_weight && productDetails.weight) {
				itemCells.push({
					rowId: itemRow.id,
					columnId: columns.product_weight.id,
					value: productDetails.weight,
				});
			}
			if (columns.product_dimensions && productDetails.dimensions) {
				itemCells.push({
					rowId: itemRow.id,
					columnId: columns.product_dimensions.id,
					value: productDetails.dimensions,
				});
			}

			// Add description if provided
			if (product.description && columns.description) {
				itemCells.push({
					rowId: itemRow.id,
					columnId: columns.description.id,
					value: product.description,
				});
			}

			await prisma.cell.createMany({
				data: itemCells,
			});

			invoiceItemRows.push(itemRow);
		}

		// Calculate totals using unified service
		const itemsForCalculation = parsedData.products.map((product) => ({
			id: 0, // Temporary ID for calculation
			product_ref_table: product.product_ref_table,
			product_ref_id: product.product_ref_id,
			quantity: product.quantity || 1,
			price: product.price || 0,
			currency: product.currency || "USD",
			product_vat: 0, // Will be populated from product details
			description: product.description,
			unit_of_measure: product.unit_of_measure,
		}));

		// Get VAT rates for products
		for (let i = 0; i < itemsForCalculation.length; i++) {
			const product = parsedData.products[i];
			try {
				const productTable = await prisma.table.findFirst({
					where: {
						name: product.product_ref_table,
						databaseId: database.id,
					},
					include: {
						columns: true,
					},
				});

				if (productTable) {
					const productRow = await prisma.row.findUnique({
						where: { id: product.product_ref_id },
						include: {
							cells: {
								include: {
									column: true,
								},
							},
						},
					});

					if (productRow) {
						const productDetails = extractProductDetails(
							productTable.columns,
							productRow.cells,
						);
						itemsForCalculation[i].product_vat = productDetails.vat || 0;
					}
				}
			} catch (error) {
				console.warn(
					`Failed to fetch VAT for product ${product.product_ref_table}:${product.product_ref_id}`,
					error,
				);
			}
		}

		// Debug: Log the data being passed to calculation service
		console.log("=== INVOICE CREATION DEBUG ===");
		console.log(
			"Items for calculation:",
			JSON.stringify(itemsForCalculation, null, 2),
		);
		console.log(
			"Base currency:",
			parsedData.base_currency || tenantInfo?.defaultCurrency || "USD",
		);

		const totals = await InvoiceCalculationService.calculateInvoiceTotals(
			itemsForCalculation,
			{
				baseCurrency:
					parsedData.base_currency || tenantInfo?.defaultCurrency || "USD",
				exchangeRates: {}, // Empty for now, will be populated with real rates
			},
		);

		// Debug: Log the calculated totals
		console.log("Calculated totals:", JSON.stringify(totals, null, 2));

		// Add total_amount and base_currency to invoice
		const totalAmountColumn = invoiceTables.invoices!.columns!.find(
			(c: any) => c.semanticType === "invoice_total_amount",
		);
		const baseCurrencyColumn2 = invoiceTables.invoices!.columns!.find(
			(c: any) => c.semanticType === "invoice_base_currency",
		);

		const defaultCurrency = tenantInfo?.defaultCurrency || "USD";

		if (totalAmountColumn) {
			await prisma.cell.create({
				data: {
					rowId: invoiceRow.id,
					columnId: totalAmountColumn.id,
					value: totals.grandTotal.toString(),
				},
			});
		}

		if (baseCurrencyColumn2) {
			await prisma.cell.create({
				data: {
					rowId: invoiceRow.id,
					columnId: baseCurrencyColumn2.id,
					value: parsedData.base_currency || defaultCurrency,
				},
			});
		}

		return NextResponse.json({
			message: "Invoice created successfully",
			invoice: {
				id: invoiceRow.id,
				invoice_number: invoiceNumber,
				customer_id: parsedData.customer_id,
				items_count: parsedData.products.length,
			},
		});
	} catch (error) {
		console.error("Error creating invoice:", error);
		if (error instanceof z.ZodError) {
			return NextResponse.json(
				{ error: "Validation error", details: error.errors },
				{ status: 400 },
			);
		}
		return NextResponse.json(
			{ error: "Failed to create invoice" },
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
	const userId = getUserId(sessionResult);
	if (!sessionResult.user.email) {
		return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
	}

	const userResult = await prisma.user.findFirst({
		where: { email: sessionResult.user.email },
	});

	if (!userResult) {
		return NextResponse.json({ error: "User not found" }, { status: 404 });
	}

	const { tenantId } = await params;

	 const tenantAccessError = requireTenantAccess(sessionResult, tenantId.toString());
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

		// Get invoice numbering statistics and next invoice number
		const stats = await InvoiceSystemService.getInvoiceNumberingStats(
			Number(tenantId),
			database.id,
		);

		// Get all invoices for this tenant
		const invoicesTable = await prisma.table.findFirst({
			where: {
				databaseId: database.id,
				database: { tenantId: Number(tenantId) },
				protectedType: "invoices",
			},
		});

		// Get customers table for customer data
		const customersTable = await prisma.table.findFirst({
			where: {
				databaseId: database.id,
				database: { tenantId: Number(tenantId) },
				protectedType: "customers",
			},
		});

		let invoices = [];
		if (invoicesTable) {
			const allInvoices = await prisma.row.findMany({
				where: { tableId: invoicesTable.id },
				include: {
					cells: {
						include: {
							column: true,
						},
					},
				},
				orderBy: { id: "desc" },
			});

			// Get all customers for lookup
			let customers = [];
			if (customersTable) {
				const allCustomers = await prisma.row.findMany({
					where: { tableId: customersTable.id },
					include: {
						cells: {
							include: {
								column: true,
							},
						},
					},
				});

				// Transform customers to readable format
				customers = allCustomers.map((customer: any) => {
					const customerData: any = { id: customer.id };
					customer.cells.forEach((cell: any) => {
						customerData[cell.column.name] = cell.value;
					});
					return customerData;
				});
			}

			// Transform invoices to readable format and include customer data
			invoices = allInvoices.map((invoice: any) => {
				const invoiceData: any = { id: invoice.id };

				invoice.cells.forEach((cell: any) => {
					invoiceData[cell.column.name] = cell.value;
				});

				// Add customer name if customer_id exists
				if (invoiceData.customer_id && customers.length > 0) {
					const customer = customers.find((c: any) => c.id === invoiceData.customer_id);
					if (customer) {
						invoiceData.customer_name = customer.customer_name;
						invoiceData.customer_email = customer.customer_email;
						invoiceData.customer_address = customer.customer_address;
					}
				}

				return invoiceData;
			});
		}

		console.log(invoices);

		return NextResponse.json({
			success: true,
			data: {
				invoices,
				nextInvoiceNumber: stats.nextInvoiceNumber,
				lastInvoiceNumber: stats.lastInvoiceNumber,
				totalInvoices: stats.totalInvoices,
				seriesBreakdown: stats.seriesBreakdown,
				yearlyStats: stats.yearlyStats,
				monthlyStats: stats.monthlyStats,
			},
		});
	} catch (error) {
		console.error("Error getting invoice statistics:", error);
		return NextResponse.json(
			{ error: "Failed to get invoice statistics" },
			{ status: 500 },
		);
	}
}
