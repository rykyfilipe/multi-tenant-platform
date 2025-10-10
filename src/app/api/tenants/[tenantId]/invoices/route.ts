/** @format */

import { NextRequest, NextResponse } from "next/server";
import { requireAuthResponse, requireTenantAccess, getUserId } from "@/lib/session";
import { InvoiceSystemService, CreateInvoiceRequest } from "@/lib/invoice-system";
import { z } from "zod";
import prisma, { withRetry } from "@/lib/prisma";
import { InvoiceCalculationService } from "@/lib/invoice-calculations";
import {
	validateTableForInvoices,
	extractProductDetails,
	getValidationMessage,
	createSemanticExtractor,
} from "@/lib/semantic-helpers";
import { SemanticColumnType } from "@/lib/semantic-types";

const CreateInvoiceSchema = z.object({
	customer_id: z.number().min(1, "Customer is required"),
	base_currency: z.string().min(1, "Base currency is required").regex(/^[A-Z]{3}$/, "Base currency must be a valid 3-letter currency code"),
	due_date: z.string().min(1, "Due date is required"),
	payment_terms: z.string().optional(),
	payment_method: z.string().min(1, "Payment method is required"),
	notes: z.string().optional(),
	status: z.string().optional().default("draft"),
	invoice_series: z.string().optional(),
	additional_data: z.record(z.unknown()).optional(),
	products: z.array(
		z.object({
			product_ref_table: z.string().min(1, "Product table is required"),
			product_ref_id: z.number().min(1, "Product ID is required"),
			quantity: z.number().min(0.01, "Quantity must be greater than 0").finite("Quantity must be a valid number"),
			unit_of_measure: z.string().optional(),
			description: z.string().optional(),
			currency: z.string().min(1, "Currency is required").regex(/^[A-Z]{3}$/, "Currency must be a valid 3-letter currency code"),
			original_price: z.number().min(0, "Price must be non-negative").finite("Price must be a valid number"),
			converted_price: z.number().min(0, "Converted price must be non-negative").finite("Converted price must be a valid number"),
			price: z.number().min(0, "Price must be non-negative").finite("Price must be a valid number"),
		}),
	).min(1, "At least one product is required"),
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

	const userResult = await withRetry(() => 
		prisma.user.findFirst({
			where: { email: sessionResult.user.email },
		})
	);

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
		
		console.log('🔍 POST /invoices - Request body received:', JSON.stringify(body, null, 2));
		
		// Validate request body structure
		if (!body || typeof body !== 'object') {
			return NextResponse.json(
				{ 
					error: "Invalid request body", 
					message: "Request body must be a valid JSON object" 
				}, 
				{ status: 400 }
			);
		}

		// Validate using Zod schema with detailed error messages
		const parseResult = CreateInvoiceSchema.safeParse(body);
		if (!parseResult.success) {
			const errors = parseResult.error.errors.map(err => ({
				field: err.path.join('.'),
				message: err.message
			}));
			
			return NextResponse.json(
				{ 
					error: "Validation failed", 
					details: errors
				}, 
				{ status: 400 }
			);
		}
		
		const parsedData = parseResult.data;

		// Additional validation for due date
		const dueDate = new Date(parsedData.due_date);
		const today = new Date();
		today.setHours(0, 0, 0, 0);
		
		if (isNaN(dueDate.getTime())) {
			return NextResponse.json(
				{ 
					error: "Invalid due date", 
					message: "Due date must be a valid date" 
				}, 
				{ status: 400 }
			);
		}
		
		if (dueDate < today) {
			return NextResponse.json(
				{ 
					error: "Invalid due date", 
					message: "Due date cannot be in the past" 
				}, 
				{ status: 400 }
			);
		}

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

		// Get or initialize invoice tables (simplified approach)
		let invoiceTables = await InvoiceSystemService.getInvoiceTables(
			Number(tenantId),
			database.id,
		);
		
		console.log("=== INVOICE TABLES CHECK ===");
		console.log("Tables found:", {
			customers: !!invoiceTables.customers,
			invoices: !!invoiceTables.invoices,
			invoice_items: !!invoiceTables.invoice_items
		});
		
		// If tables don't exist, create them
		if (!invoiceTables.customers || !invoiceTables.invoices || !invoiceTables.invoice_items) {
			console.log("=== CREATING INVOICE TABLES ===");
			invoiceTables = await InvoiceSystemService.initializeInvoiceTables(
				Number(tenantId),
				database.id,
			);
		}

	// Ensure we have the latest table structure
			invoiceTables = await InvoiceSystemService.getInvoiceTables(
				Number(tenantId),
				database.id,
			);
			
	// Validate that all required tables exist
	if (!invoiceTables.invoices?.columns || !invoiceTables.invoice_items?.columns) {
		console.error("Invoice system tables not properly initialized");
		return NextResponse.json(
			{ error: "Invoice system tables not properly initialized" },
			{ status: 500 },
		);
	}

	// Fix: Ensure customer_id column has correct semanticType and referenceTableId
	const customerIdColumn = invoiceTables.invoices.columns.find(
		(col: any) => col.name === "customer_id"
	);
	if (customerIdColumn) {
		let needsUpdate = false;
		const updates: any = {};
		
		if (customerIdColumn.semanticType !== 'invoice_customer_id') {
			console.log('🔧 Fixing customer_id column - setting semanticType to invoice_customer_id');
			updates.semanticType = 'invoice_customer_id';
			needsUpdate = true;
		}
		
		if (!customerIdColumn.referenceTableId && invoiceTables.customers) {
			console.log('🔧 Fixing customer_id column - adding referenceTableId');
			updates.referenceTableId = invoiceTables.customers.id;
			needsUpdate = true;
		}
		
		if (needsUpdate) {
			await prisma.column.update({
				where: { id: customerIdColumn.id },
				data: updates
			});
		}
	}
	
	// Fix: Batch update all invoice columns with correct semanticTypes
	const columnFixes = [
		{ name: 'total_amount', semanticType: 'invoice_total_amount' },
		{ name: 'invoice_series', semanticType: 'invoice_series' },
		{ name: 'payment_terms', semanticType: 'invoice_payment_terms' },
		{ name: 'payment_method', semanticType: 'invoice_payment_method' },
		{ name: 'notes', semanticType: 'invoice_notes' },
		{ name: 'base_currency', semanticType: 'invoice_base_currency' },
		{ name: 'subtotal', semanticType: 'invoice_subtotal' },
		{ name: 'tax_total', semanticType: 'invoice_tax_total' },
		{ name: 'late_fee', semanticType: 'invoice_late_fee' },
		{ name: 'discount_amount', semanticType: 'invoice_discount_amount' },
		{ name: 'discount_rate', semanticType: 'invoice_discount_rate' },
	];
	
	for (const fix of columnFixes) {
		const column = invoiceTables.invoices.columns.find((col: any) => col.name === fix.name);
		if (column && column.semanticType !== fix.semanticType) {
			console.log(`🔧 Fixing ${fix.name} column - setting semanticType to ${fix.semanticType}`);
			await prisma.column.update({
				where: { id: column.id },
				data: { semanticType: fix.semanticType }
			});
		}
	}
	
	// Refresh tables after all fixes
	if (columnFixes.some(fix => 
		invoiceTables.invoices.columns.find((col: any) => col.name === fix.name && col.semanticType !== fix.semanticType)
	) || (customerIdColumn && (customerIdColumn.semanticType !== 'invoice_customer_id' || !customerIdColumn.referenceTableId))) {
		invoiceTables = await InvoiceSystemService.getInvoiceTables(
			Number(tenantId),
			database.id,
		);
		console.log('✅ Invoice columns fixed and refreshed');
	}

		// Get tenant settings for invoice numbering
		const tenant = await prisma.tenant.findUnique({
			where: { id: Number(tenantId) },
		});

		// Generate invoice number with series using tenant settings
		const tenantConfig = {
			series: (tenant as any)?.invoiceSeriesPrefix || "INV",
			includeYear: (tenant as any)?.invoiceIncludeYear !== false, // default true
			startNumber: (tenant as any)?.invoiceStartNumber || 1,
			separator: "-",
		};

		console.log("🔍 DEBUG: Tenant invoice config", {
			tenantId: Number(tenantId),
			tenantConfig,
			rawTenant: {
				invoiceSeriesPrefix: (tenant as any)?.invoiceSeriesPrefix,
				invoiceIncludeYear: (tenant as any)?.invoiceIncludeYear,
				invoiceStartNumber: (tenant as any)?.invoiceStartNumber,
			}
		});

		const invoiceData =
			await InvoiceSystemService.generateInvoiceNumberWithConfig(
				Number(tenantId),
				database.id,
				tenantConfig,
			);

		// Extract invoice number and series from generated data
		const invoiceNumber = invoiceData.number;
		const invoiceSeries = invoiceData.series;

		console.log("🔍 DEBUG: Generated invoice data", {
			invoiceNumber,
			invoiceSeries,
			fullData: invoiceData
		});

		// Use database transaction to ensure atomicity
		const result = await prisma.$transaction(async (tx: any) => {
			// Create invoice row
			const invoiceRow = await tx.row.create({
				data: {
					tableId: invoiceTables.invoices!.id,
				},
			});

			console.log("✅ Invoice row created with ID:", invoiceRow.id);
			
			// Create invoice cells using all available columns
		const invoiceCells: Array<{
			rowId: number;
			columnId: number;
			value: string | number;
		}> = [];

		// Map payload data to invoice columns using semantic types
		console.log('📋 Processing invoice columns:', invoiceTables.invoices!.columns!.map((c: any) => ({
			id: c.id,
			name: c.name,
			type: c.type,
			semanticType: c.semanticType,
			referenceTableId: c.referenceTableId
		})));
		
		for (const column of invoiceTables.invoices!.columns!) {
			let value: any = null;
			
			if (column.semanticType === SemanticColumnType.INVOICE_CUSTOMER_ID) {
				console.log('🔍 Processing INVOICE_CUSTOMER_ID column BEFORE switch:', {
					columnId: column.id,
					columnName: column.name,
					columnType: column.type,
					semanticType: column.semanticType,
					referenceTableId: column.referenceTableId,
					customerId: parsedData.customer_id
				});
			}

			switch (column.semanticType) {
				case SemanticColumnType.INVOICE_NUMBER:
						value = invoiceNumber;
						break;
					case SemanticColumnType.INVOICE_SERIES:
						value = parsedData.invoice_series || invoiceSeries;
						break;
					case SemanticColumnType.INVOICE_DATE:
						value = new Date().toISOString();
						break;
				case SemanticColumnType.INVOICE_DUE_DATE:
					value = parsedData.due_date;
					break;
			case SemanticColumnType.INVOICE_CUSTOMER_ID:
				// Reference columns require array values
				value = [parsedData.customer_id];
				console.log('🔍 Setting customer_id cell INSIDE switch case:', {
					columnId: column.id,
					columnName: column.name,
					columnType: column.type,
					semanticType: column.semanticType,
					rawCustomerId: parsedData.customer_id,
					arrayValue: value,
					isArray: Array.isArray(value),
					arrayLength: value.length,
					firstElement: value[0],
					willPassLengthCheck: value.length > 0
				});
				break;
				case SemanticColumnType.INVOICE_STATUS:
						value = parsedData.status || "draft";
						break;
					case SemanticColumnType.INVOICE_PAYMENT_TERMS:
						value = parsedData.payment_terms;
						break;
					case SemanticColumnType.INVOICE_PAYMENT_METHOD:
						value = parsedData.payment_method;
						break;
					case SemanticColumnType.INVOICE_NOTES:
						value = parsedData.notes;
						break;
					case SemanticColumnType.INVOICE_BASE_CURRENCY:
						value = parsedData.base_currency;
						break;
					case SemanticColumnType.INVOICE_TOTAL_AMOUNT:
						// Skip - will be added after calculation
						continue;
					case SemanticColumnType.INVOICE_SUBTOTAL:
						// Skip - will be added after calculation
						continue;
					case SemanticColumnType.INVOICE_TAX_TOTAL:
						// Skip - will be added after calculation
						continue;
					case SemanticColumnType.INVOICE_DISCOUNT_AMOUNT:
						value = (parsedData as any).discount_amount || 0;
						break;
					case SemanticColumnType.INVOICE_DISCOUNT_RATE:
						value = (parsedData as any).discount_rate || 0;
						break;
					case SemanticColumnType.INVOICE_LATE_FEE:
						value = (parsedData as any).late_fee || 0;
						break;
					case SemanticColumnType.INVOICE_EXCHANGE_RATE:
						value = (parsedData as any).exchange_rate || 1;
						break;
					case SemanticColumnType.INVOICE_REFERENCE_CURRENCY:
						value = (parsedData as any).reference_currency;
						break;
					case SemanticColumnType.INVOICE_SHIPPING_COST:
						value = (parsedData as any).shipping_cost || 0;
						break;
					case SemanticColumnType.INVOICE_LANGUAGE:
						value = (parsedData as any).language || "en";
						break;
					case SemanticColumnType.INVOICE_BANK_DETAILS:
						value = (parsedData as any).bank_details;
						break;
					case SemanticColumnType.INVOICE_SWIFT_CODE:
						value = (parsedData as any).swift_code;
						break;
					case SemanticColumnType.INVOICE_IBAN:
						value = (parsedData as any).iban;
						break;
					default:
						// Try to get from additional_data if available
						if (parsedData.additional_data && (parsedData.additional_data as any)[column.name] !== undefined) {
							value = (parsedData.additional_data as any)[column.name];
						}
						break;
				}

			// Only add if we have a meaningful value
			// For arrays (reference columns), check if array has at least one element
			// For other values, check if not null/undefined/empty string
			const shouldAddCell = Array.isArray(value) 
				? value.length > 0 
				: (value !== null && value !== undefined && value !== "");
			
			if (column.semanticType === SemanticColumnType.INVOICE_CUSTOMER_ID) {
				console.log('🔍 INVOICE_CUSTOMER_ID shouldAddCell check:', {
					value,
					isArray: Array.isArray(value),
					arrayLength: Array.isArray(value) ? value.length : 'N/A',
					shouldAddCell,
					columnId: column.id,
					columnName: column.name
				});
			}
			
			if (shouldAddCell) {
				invoiceCells.push({
					rowId: invoiceRow.id,
					columnId: column.id,
					value,
				});
				
				console.log(`✅ Adding cell for ${column.name} (${column.semanticType}):`, value);
			} else {
				if (column.semanticType === SemanticColumnType.INVOICE_CUSTOMER_ID) {
					console.log(`❌ NOT adding cell for ${column.name} - shouldAddCell is false`);
				}
			}
		}

		// Remove duplicate cells before creating
		const uniqueInvoiceCells = invoiceCells.filter((cell: any, index: any, self: any) => 
			index === self.findIndex((c: any) => c.rowId === cell.rowId && c.columnId === cell.columnId)
		);

		console.log('📋 Invoice cells to be created:', uniqueInvoiceCells.length);
		const customerIdCells = uniqueInvoiceCells.filter((c: any) => 
			invoiceTables.invoices!.columns!.find((col:any) => col.id === c.columnId && col.semanticType === SemanticColumnType.INVOICE_CUSTOMER_ID)
		);
		console.log('📋 Invoice cells with customer_id:', customerIdCells);
		console.log('📋 All invoice cells detail:', uniqueInvoiceCells.map((c: any) => ({
		columnId: c.columnId,
		value: c.value,
		columnName: invoiceTables.invoices!.columns!.find((col:any) => col.id === c.columnId)?.name,
		semanticType: invoiceTables.invoices!.columns!.find((col:any) => col.id === c.columnId)?.semanticType
	})));

		// Create all invoice cells
		const createdCells = await tx.cell.createMany({
			data: uniqueInvoiceCells,
		});
		
		console.log(`✅ Created ${createdCells.count} invoice cells`);

			// Create invoice items
			const invoiceItemRows: any[] = [];
			
			for (const product of parsedData.products) {
				// Create invoice item row
				const itemRow = await tx.row.create({
					data: {
						tableId: invoiceTables.invoice_items!.id,
					},
				});

				console.log("📝 Creating invoice_item with invoice_id:", invoiceRow.id, "for item row", itemRow.id);

				// Get product details from the product table
				let productDetails = {
					name: null,
					description: null,
					price: null,
					currency: null,
					sku: null,
					category: null,
					brand: null,
					vat: 0,
					weight: null,
					dimensions: null,
					image: null,
					status: null,
				};

				try {
					const productTable = await tx.table.findFirst({
					where: {
						name: product.product_ref_table,
						databaseId: database.id,
					},
					include: {
						columns: true,
					},
				});

				if (productTable) {
					const productRow = await tx.row.findUnique({
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
						productDetails = extractProductDetails(
							productTable.columns,
							productRow.cells,
						);
					}
				}
			} catch (error) {
					console.warn(`Failed to fetch details for product ${product.product_ref_table}:${product.product_ref_id}`, error);
				}

				// Create invoice item cells using all available columns
				const itemCells: Array<{ rowId: number; columnId: number; value: any }> = [];

				for (const column of invoiceTables.invoice_items!.columns!) {
					let value: any = null;

					// Handle invoice_id as special case for reference type
					if (column.name === "invoice_id") {
						if (invoiceRow.id) {
							value = [invoiceRow.id]; // Ensure it's an array for reference type
						} else {
							console.warn("Invoice ID is missing for invoice_id column.");
							continue; // Skip if invoice ID is not available
						}
			} else {
						// Map product data to invoice item columns using semantic types
						switch (column.semanticType) {
							case SemanticColumnType.PRODUCT_REF_TABLE:
								value = product.product_ref_table;
								break;
							case SemanticColumnType.ID:
								value = product.product_ref_id;
								break;
							case SemanticColumnType.QUANTITY:
								value = product.quantity || 1;
								break;
							case SemanticColumnType.UNIT_PRICE:
								value = product.price || 0;
								break;
							case SemanticColumnType.TOTAL_PRICE:
								// Calculate total price: quantity * unit_price
								const unitPrice = product.price || 0;
								const quantity = product.quantity || 1;
								value = unitPrice * quantity;
								break;
							case SemanticColumnType.CURRENCY:
								value = product.currency || productDetails.currency || "USD";
								break;
							case SemanticColumnType.UNIT_OF_MEASURE:
								value = product.unit_of_measure || "pcs";
								break;
							case SemanticColumnType.PRODUCT_NAME:
								value = productDetails.name;
								break;
							case SemanticColumnType.PRODUCT_DESCRIPTION:
								value = productDetails.description;
								break;
							case SemanticColumnType.PRODUCT_CATEGORY:
								value = productDetails.category;
								break;
							case SemanticColumnType.PRODUCT_SKU:
								value = productDetails.sku;
								break;
							case SemanticColumnType.PRODUCT_BRAND:
								value = productDetails.brand;
								break;
							case SemanticColumnType.PRODUCT_WEIGHT:
								value = productDetails.weight;
								break;
							case SemanticColumnType.PRODUCT_DIMENSIONS:
								value = productDetails.dimensions;
								break;
							case SemanticColumnType.PRODUCT_VAT:
								value = productDetails.vat || 0;
								break;
							case SemanticColumnType.TAX_RATE:
								value = productDetails.vat || 0;
								break;
							case SemanticColumnType.TAX_AMOUNT:
								// Calculate tax amount: total_price * (tax_rate / 100)
								const totalPrice = (product.price || 0) * (product.quantity || 1);
								const taxRate = productDetails.vat || 0;
								value = totalPrice * (taxRate / 100);
								break;
							case SemanticColumnType.DISCOUNT_RATE:
								value = (product as any).discount_rate || 0;
								break;
							case SemanticColumnType.DISCOUNT_AMOUNT:
								value = (product as any).discount_amount || 0;
								break;
							case SemanticColumnType.DESCRIPTION:
								value = product.description;
								break;
							default:
								// Try to get from product data directly
								if ((product as any)[column.name] !== undefined) {
									value = (product as any)[column.name];
								}
								break;
						}
					}

					// Only add if we have a value
					if (value !== null && value !== undefined && value !== "") {
				itemCells.push({
					rowId: itemRow.id,
							columnId: column.id,
							value,
						});
					}
			}

			// Remove duplicate cells before creating
			const uniqueItemCells = itemCells.filter((cell, index, self) => 
				index === self.findIndex(c => c.rowId === cell.rowId && c.columnId === cell.columnId)
			);

				await tx.cell.createMany({
					data: uniqueItemCells,
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
					const productTable = await tx.table.findFirst({
						where: {
							name: product.product_ref_table,
							databaseId: database.id,
						},
						include: {
							columns: true,
						},
					});

					if (productTable) {
						const productRow = await tx.row.findUnique({
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
			console.log("Items for calculation:", JSON.stringify(itemsForCalculation, null, 2));
			console.log("Base currency:", parsedData.base_currency);

			// Calculate totals
		const totals = await InvoiceCalculationService.calculateInvoiceTotals(
			itemsForCalculation,
			{
					baseCurrency: parsedData.base_currency,
					exchangeRates: {}, // Will be populated by the service
			},
		);

		// Debug: Log the calculated totals
		console.log("Calculated totals:", JSON.stringify(totals, null, 2));

			// Create total amount cells after calculation
			const totalAmountColumn = invoiceTables.invoices!.columns!.find(
				(c: any) => c.semanticType === SemanticColumnType.INVOICE_TOTAL_AMOUNT,
			);

			if (totalAmountColumn) {
				await tx.cell.create({
					data: {
						rowId: invoiceRow.id,
						columnId: totalAmountColumn.id,
						value: totals.grandTotal,
					},
				});
				console.log('✅ Created total_amount cell:', totals.grandTotal);
			}

			// Create subtotal cell
			const subtotalColumn = invoiceTables.invoices!.columns!.find(
				(c: any) => c.semanticType === SemanticColumnType.INVOICE_SUBTOTAL,
			);

			if (subtotalColumn) {
				await tx.cell.create({
					data: {
						rowId: invoiceRow.id,
						columnId: subtotalColumn.id,
						value: totals.subtotal,
					},
				});
				console.log('✅ Created subtotal cell:', totals.subtotal);
			}

			// Create tax_total cell
			const taxTotalColumn = invoiceTables.invoices!.columns!.find(
				(c: any) => c.semanticType === SemanticColumnType.INVOICE_TAX_TOTAL,
			);

			if (taxTotalColumn) {
				await tx.cell.create({
					data: {
						rowId: invoiceRow.id,
						columnId: taxTotalColumn.id,
						value: totals.vatTotal,
					},
				});
				console.log('✅ Created tax_total cell:', totals.vatTotal);
			}

			console.log("✅ Invoice creation completed:");
			console.log("   - Invoice Row ID:", invoiceRow.id);
			console.log("   - Invoice Number:", invoiceNumber);
			console.log("   - Invoice Items created:", invoiceItemRows.length);
			console.log("   - Total amount:", totals.grandTotal);

			return {
				invoice: {
					id: invoiceRow.id,
					invoice_number: invoiceNumber,
					invoice_series: invoiceSeries,
					customer_id: parsedData.customer_id,
					date: new Date().toISOString(),
					due_date: parsedData.due_date,
					status: parsedData.status || "draft",
					base_currency: parsedData.base_currency,
					payment_terms: parsedData.payment_terms,
					payment_method: parsedData.payment_method,
					notes: parsedData.notes,
					total_amount: totals.grandTotal,
					subtotal: totals.subtotal,
					tax_total: totals.vatTotal,
					vat_total: totals.vatTotal,
					items_count: invoiceItemRows.length,
				},
				items: invoiceItemRows,
			};
		});

		return NextResponse.json({
			success: true,
			data: result,
		});

	} catch (error: any) {
		console.error("Error creating invoice:", error);

		// Handle specific error types
		if (error.code === 'P2002') {
				return NextResponse.json(
					{ 
					error: "Duplicate entry", 
					message: "A record with this information already exists" 
					},
				{ status: 409 }
				);
			}

		if (error instanceof z.ZodError) {
				return NextResponse.json(
					{ 
					error: "Validation failed",
					details: error.errors 
					},
				{ status: 400 }
				);
			}

				return NextResponse.json(
					{ 
				error: "Internal server error",
				message: error.message || "Failed to create invoice"
			}, 
			{ status: 500 }
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

	 const tenantAccessError = requireTenantAccess(sessionResult, tenantId.toString());
	if (tenantAccessError) {
		return tenantAccessError;
	}

	try {
		console.log('🔍 GET invoices - Starting request for tenant:', tenantId);
		
		// Get the database for this tenant
		const database = await prisma.database.findFirst({
			where: { tenantId: Number(tenantId) },
		});

		console.log('💾 GET invoices - Database found:', database ? `ID: ${database.id}` : 'NOT FOUND');

		if (!database) {
			console.log('❌ GET invoices - Database not found for tenant:', tenantId);
			return NextResponse.json(
				{ error: "Database not found for this tenant" },
				{ status: 404 },
			);
		}

		// Get invoice tables
		const invoiceTables = await InvoiceSystemService.getInvoiceTables(
			Number(tenantId),
			database.id,
		);

		console.log('📊 GET invoices - Invoice tables found:', {
			customers: !!invoiceTables.customers,
			invoices: !!invoiceTables.invoices,
			invoice_items: !!invoiceTables.invoice_items
		});

		if (!invoiceTables.invoices) {
			console.log('❌ GET invoices - Invoice system not initialized');
			return NextResponse.json(
				{ error: "Invoice system not initialized" },
				{ status: 404 },
			);
		}

		// Get all invoices with their data
		console.log('🔍 GET invoices - Fetching invoices from table ID:', invoiceTables.invoices.id);
		
		const invoices = await prisma.row.findMany({
			where: {
				tableId: invoiceTables.invoices.id,
			},
				include: {
					cells: {
						include: {
							column: true,
						},
					},
				},
			orderBy: {
				createdAt: 'desc',
					},
				});

		console.log(`📄 GET invoices - Found ${invoices.length} invoices in database`);

		// Transform invoices to include readable data
		console.log('🔄 GET invoices - Starting transformation of invoices...');
		
		const transformedInvoices = invoices.map((invoice: any, index: number) => {
			const invoiceData: any = {
				id: invoice.id,
				createdAt: invoice.createdAt,
				updatedAt: invoice.updatedAt,
			};

			console.log(`📝 GET invoices - Transforming invoice ${index + 1} (ID: ${invoice.id}) with ${invoice.cells.length} cells`);

		// Map cells to readable format
			invoice.cells.forEach((cell: any) => {
			const columnName = cell.column.name;
			const semanticType = cell.column.semanticType;
			let value = cell.value;
			
			// Extract value from array if it's a reference type (customer_id, etc.)
			if (Array.isArray(value) && value.length > 0) {
				value = value[0];
			}
			
			// Use semantic type as key for better API structure
			if (semanticType) {
				invoiceData[semanticType] = value;
			}
			
			// Also keep column name for backward compatibility
			invoiceData[columnName] = value;
		});

			console.log(`✅ GET invoices - Transformed invoice ${index + 1}:`, {
				id: invoiceData.id,
				invoice_number: invoiceData.invoice_number,
				total_amount: invoiceData.total_amount,
				status: invoiceData.status
			});

			return invoiceData;
		});

		const response = {
			success: true,
			data: transformedInvoices,
			count: transformedInvoices.length,
		};

		console.log('📤 GET invoices - Returning response:', {
			success: response.success,
			count: response.count,
			firstInvoiceId: transformedInvoices.length > 0 ? transformedInvoices[0].id : null
		});

		return NextResponse.json(response);

	} catch (error: any) {
		console.error("❌ GET invoices - Error fetching invoices:", error);
		console.error("❌ GET invoices - Error details:", {
			message: error.message,
			stack: error.stack,
			code: error.code
		});
		return NextResponse.json(
			{ 
				error: "Internal server error",
				message: error.message || "Failed to fetch invoices"
			}, 
			{ status: 500 }
		);
	}
}
