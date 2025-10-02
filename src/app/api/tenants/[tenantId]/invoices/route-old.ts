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
					message: "Please check the following fields:",
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
			
			// Verify the invoice row was actually created
			if (!invoiceRow || !invoiceRow.id) {
				console.error("❌ Failed to create invoice row - no ID returned");
				throw new Error("Failed to create invoice row");
			}

		// Create invoice cells
		const invoiceCells: Array<{
			rowId: number;
			columnId: number;
			value: string | number;
		}> = [];

		// Find required columns safely using semantic types
		const invoiceNumberColumn = invoiceTables.invoices!.columns!.find(
			(c: any) => c.semanticType === SemanticColumnType.INVOICE_NUMBER,
		);
		const invoiceSeriesColumn = invoiceTables.invoices!.columns!.find(
			(c: any) => c.semanticType === SemanticColumnType.INVOICE_SERIES,
		);
		const dateColumn = invoiceTables.invoices!.columns!.find(
			(c: any) => c.semanticType === SemanticColumnType.INVOICE_DATE,
		);
		const dueDateColumn = invoiceTables.invoices!.columns!.find(
			(c: any) => c.semanticType === SemanticColumnType.INVOICE_DUE_DATE,
		);
		let customerIdColumn = invoiceTables.invoices!.columns!.find(
			(c: any) => c.semanticType === SemanticColumnType.INVOICE_CUSTOMER_ID,
		);
		
		// If not found by semantic type, look for customer_id column and fix it
		if (!customerIdColumn) {
			console.log("customer_id column not found by semantic type, looking for column by name...");
			const customerIdColumnByName = invoiceTables.invoices!.columns!.find(
				(c: any) => c.name === "customer_id",
			);
			
			if (customerIdColumnByName) {
				console.log("Found customer_id column by name, updating semantic type...");
				try {
					await prisma.column.update({
						where: { id: customerIdColumnByName.id },
						data: { semanticType: SemanticColumnType.INVOICE_CUSTOMER_ID }
					});
					customerIdColumn = { ...customerIdColumnByName, semanticType: SemanticColumnType.INVOICE_CUSTOMER_ID };
					console.log("✅ Successfully updated customer_id column semantic type");
				} catch (error) {
					console.error("❌ Failed to update customer_id column:", error);
				}
			}
		}

		// Validate that all required columns exist
		if (
			!invoiceNumberColumn ||
			!dateColumn ||
			!dueDateColumn ||
			!customerIdColumn
		) {
			console.error("=== MISSING INVOICE COLUMNS DEBUG ===");
			console.error("Available columns:", invoiceTables.invoices!.columns!.map((c: any) => ({
				name: c.name,
				semanticType: c.semanticType
			})));
			console.error("Missing columns:", {
				invoiceNumberColumn: invoiceNumberColumn ? "FOUND" : "MISSING",
				dateColumn: dateColumn ? "FOUND" : "MISSING", 
				dueDateColumn: dueDateColumn ? "FOUND" : "MISSING",
				customerIdColumn: customerIdColumn ? "FOUND" : "MISSING"
			});
			
			return NextResponse.json(
				{ 
					error: "Required invoice columns not found",
					details: {
						availableColumns: invoiceTables.invoices!.columns!.map((c: any) => ({
							name: c.name,
							semanticType: c.semanticType
						})),
						missingColumns: {
							invoiceNumberColumn: !invoiceNumberColumn,
							dateColumn: !dateColumn,
							dueDateColumn: !dueDateColumn,
							customerIdColumn: !customerIdColumn
						}
					}
				},
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
			(c: any) => c.semanticType === SemanticColumnType.INVOICE_PAYMENT_TERMS,
		);
		if (paymentTermsColumn && parsedData.payment_terms) {
			invoiceCells.push({
				rowId: invoiceRow.id,
				columnId: paymentTermsColumn.id,
				value: parsedData.payment_terms,
			});
		}

		const paymentMethodColumn = invoiceTables.invoices!.columns!.find(
			(c: any) => c.semanticType === SemanticColumnType.INVOICE_PAYMENT_METHOD,
		);
		if (paymentMethodColumn && parsedData.payment_method) {
			invoiceCells.push({
				rowId: invoiceRow.id,
				columnId: paymentMethodColumn.id,
				value: parsedData.payment_method,
			});
		}

		const notesColumn = invoiceTables.invoices!.columns!.find(
			(c: any) => c.semanticType === SemanticColumnType.INVOICE_NOTES,
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
			(c: any) => c.semanticType === SemanticColumnType.INVOICE_STATUS,
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
			(c: any) => c.semanticType === SemanticColumnType.INVOICE_BASE_CURRENCY,
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

		// Complete all available columns in invoices table with available data
		const allInvoiceColumns = invoiceTables.invoices!.columns!;
		
		// Get customer details to populate additional invoice fields
		let customerDetails: any = {};
		if (parsedData.customer_id) {
			try {
				// Find customer table
				const customerTable = await tx.table.findFirst({
					where: {
						name: "customers",
						databaseId: database.id,
					},
					include: {
						columns: true,
					},
				});

				if (customerTable) {
					const customerRow = await tx.row.findUnique({
						where: { id: parsedData.customer_id },
						include: {
							cells: {
								include: {
									column: true,
								},
							},
						},
					});

					if (customerRow) {
						// Extract customer details using semantic types
						const customerExtractor = createSemanticExtractor(customerTable.columns, customerRow.cells);
						customerDetails = {
							name: customerExtractor.getValue(SemanticColumnType.CUSTOMER_NAME) || customerExtractor.getValue(SemanticColumnType.NAME),
							email: customerExtractor.getValue(SemanticColumnType.CUSTOMER_EMAIL) || customerExtractor.getValue(SemanticColumnType.EMAIL),
							phone: customerExtractor.getValue(SemanticColumnType.CUSTOMER_PHONE) || customerExtractor.getValue(SemanticColumnType.PHONE),
							address: customerExtractor.getValue(SemanticColumnType.CUSTOMER_ADDRESS) || customerExtractor.getValue(SemanticColumnType.ADDRESS),
							city: customerExtractor.getValue(SemanticColumnType.CUSTOMER_CITY),
							country: customerExtractor.getValue(SemanticColumnType.CUSTOMER_COUNTRY),
							postalCode: customerExtractor.getValue(SemanticColumnType.CUSTOMER_POSTAL_CODE),
							taxId: customerExtractor.getValue(SemanticColumnType.CUSTOMER_TAX_ID),
						};
					}
				}
			} catch (error) {
				console.warn("Failed to fetch customer details:", error);
			}
		}

		// Add all available invoice columns with data
		for (const column of allInvoiceColumns) {
			// Skip if already added
			if (invoiceCells.some(cell => cell.columnId === column.id)) {
				continue;
			}

			let value: any = null;

			// Map semantic types to available data
			switch (column.semanticType) {
				case SemanticColumnType.CUSTOMER_NAME:
					value = customerDetails.name;
					break;
				case SemanticColumnType.CUSTOMER_EMAIL:
					value = customerDetails.email;
					break;
				case SemanticColumnType.CUSTOMER_PHONE:
					value = customerDetails.phone;
					break;
				case SemanticColumnType.CUSTOMER_ADDRESS:
					value = customerDetails.address;
					break;
				case SemanticColumnType.CUSTOMER_CITY:
					value = customerDetails.city;
					break;
				case SemanticColumnType.CUSTOMER_COUNTRY:
					value = customerDetails.country;
					break;
				case SemanticColumnType.CUSTOMER_POSTAL_CODE:
					value = customerDetails.postalCode;
					break;
				case SemanticColumnType.CUSTOMER_TAX_ID:
					value = customerDetails.taxId;
					break;
				case SemanticColumnType.INVOICE_TOTAL_AMOUNT:
					// Will be calculated later
					value = 0;
					break;
				case SemanticColumnType.INVOICE_SUBTOTAL:
					// Will be calculated later
					value = 0;
					break;
				case SemanticColumnType.INVOICE_TAX_TOTAL:
					// Will be calculated later
					value = 0;
					break;
				case SemanticColumnType.INVOICE_DISCOUNT_AMOUNT:
					value = (parsedData as any).discount_amount || 0;
					break;
				case SemanticColumnType.INVOICE_DISCOUNT_RATE:
					value = (parsedData as any).discount_rate || 0;
					break;
				case SemanticColumnType.INVOICE_LATE_FEE:
					value = (parsedData as any).late_fee || 0;
					break;
				default:
					// Try to get from additional_data
					if (parsedData.additional_data && parsedData.additional_data[column.name]) {
						value = parsedData.additional_data[column.name];
					}
					break;
			}

			// Only add if we have a value and column is not locked (unless it's a calculated field)
			if (value !== null && value !== undefined && value !== "" && (!column.isLocked || ["invoice_total_amount", "invoice_subtotal", "invoice_tax_total"].includes(column.semanticType))) {
				invoiceCells.push({
					rowId: invoiceRow.id,
					columnId: column.id,
					value,
				});
			}
		}

		// Remove duplicate cells before creating
		const uniqueInvoiceCells = invoiceCells.filter((cell, index, self) => 
			index === self.findIndex(c => c.rowId === cell.rowId && c.columnId === cell.columnId)
		);

			// Create all invoice cells
			await tx.cell.createMany({
				data: uniqueInvoiceCells,
			});

			// Create invoice items with full product details
			const invoiceItemRows = [];
			for (const product of parsedData.products) {
				const itemRow = await tx.row.create({
					data: {
						tableId: invoiceTables.invoice_items!.id,
					},
				});

			// Find all columns safely using semantic types (some may be missing if schema is not updated)
			const columns = {
				invoice_id: invoiceTables.invoice_items!.columns!.find(
					(c: any) => c.semanticType === SemanticColumnType.INVOICE_ID || 
							   (c.name === "invoice_id" && c.type === "reference"),
				),
				product_ref_table: invoiceTables.invoice_items!.columns!.find(
					(c: any) => c.semanticType === SemanticColumnType.PRODUCT_REF_TABLE,
				),
				product_ref_id: invoiceTables.invoice_items!.columns!.find(
					(c: any) => c.semanticType === SemanticColumnType.ID,
				),
				quantity: invoiceTables.invoice_items!.columns!.find(
					(c: any) => c.semanticType === SemanticColumnType.QUANTITY,
				),
				price: invoiceTables.invoice_items!.columns!.find(
					(c: any) => c.semanticType === SemanticColumnType.UNIT_PRICE,
				),
				product_vat: invoiceTables.invoice_items!.columns!.find(
					(c: any) => c.semanticType === SemanticColumnType.PRODUCT_VAT,
				),
				currency: invoiceTables.invoice_items!.columns!.find(
					(c: any) => c.semanticType === SemanticColumnType.CURRENCY,
				),
				product_name: invoiceTables.invoice_items!.columns!.find(
					(c: any) => c.semanticType === SemanticColumnType.PRODUCT_NAME,
				),
				product_description: invoiceTables.invoice_items!.columns!.find(
					(c: any) => c.semanticType === SemanticColumnType.PRODUCT_DESCRIPTION,
				),
				product_category: invoiceTables.invoice_items!.columns!.find(
					(c: any) => c.semanticType === SemanticColumnType.PRODUCT_CATEGORY,
				),
				product_sku: invoiceTables.invoice_items!.columns!.find(
					(c: any) => c.semanticType === SemanticColumnType.PRODUCT_SKU,
				),
				product_brand: invoiceTables.invoice_items!.columns!.find(
					(c: any) => c.semanticType === SemanticColumnType.PRODUCT_BRAND,
				),
				product_weight: invoiceTables.invoice_items!.columns!.find(
					(c: any) => c.semanticType === SemanticColumnType.PRODUCT_WEIGHT,
				),
				product_dimensions: invoiceTables.invoice_items!.columns!.find(
					(c: any) => c.semanticType === SemanticColumnType.PRODUCT_DIMENSIONS,
				),
				description: invoiceTables.invoice_items!.columns!.find(
					(c: any) => c.semanticType === SemanticColumnType.DESCRIPTION,
				),
			};

			// Get product details from the referenced table using semantic types
			let productDetails: any = {};
			let productTable: any = null;
			try {
				productTable = await tx.table.findFirst({
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

			const itemCells: Array<{ rowId: number; columnId: number; value: any }> = [];

			// Verify that invoiceRow.id is a valid number
			if (!invoiceRow.id || typeof invoiceRow.id !== 'number') {
				console.error("❌ Invalid invoice row ID:", invoiceRow.id);
				throw new Error(`Invalid invoice row ID: ${invoiceRow.id}`);
			}
			
			console.log(`📝 Creating invoice_item with invoice_id: ${invoiceRow.id} (invoice row ID) for item row ${itemRow.id}`);

			// Complete all available columns in invoice_items table with product data
			const allInvoiceItemColumns = invoiceTables.invoice_items!.columns!;
			
			for (const column of allInvoiceItemColumns) {
				// Skip if already added
				if (itemCells.some(cell => cell.columnId === column.id)) {
					continue;
				}

				let value: any = null;

				// Handle invoice_id as a special case for reference type
				if (column.name === "invoice_id") {
					if (invoiceRow.id) {
						value = [invoiceRow.id]; // Ensure it's an array for reference type
					} else {
						console.warn("Invoice ID is missing for invoice_id column.");
						continue; // Skip if invoice ID is not available
					}
				} else {
					// Map semantic types to available product data
					switch (column.semanticType) {
					case SemanticColumnType.PRODUCT_REF_TABLE:
						value = productTable ? productTable.id : null;
						break;
					case SemanticColumnType.ID: // product_ref_id
						value = product.product_ref_id;
						break;
					case SemanticColumnType.QUANTITY:
						value = product.quantity;
						break;
					case SemanticColumnType.UNIT_PRICE:
						value = product.price || productDetails.price || 0;
						break;
					case SemanticColumnType.PRODUCT_VAT:
						value = productDetails.vat || 0;
						break;
					case SemanticColumnType.CURRENCY:
						value = product.currency || productDetails.currency || "USD";
						break;
					case SemanticColumnType.UNIT_OF_MEASURE:
						value = product.unit_of_measure || productDetails.unitOfMeasure;
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
					case SemanticColumnType.PRODUCT_IMAGE:
						value = productDetails.image;
						break;
					case SemanticColumnType.PRODUCT_STATUS:
						value = productDetails.status;
						break;
					case SemanticColumnType.TOTAL_PRICE:
						// Calculate total price: quantity * unit_price
						const unitPrice = productDetails.price || product.price || 0;
						const quantity = product.quantity || 1;
						value = unitPrice * quantity;
						break;
					case SemanticColumnType.TAX_RATE:
						value = productDetails.vat || 0;
						break;
					case SemanticColumnType.TAX_AMOUNT:
						// Calculate tax amount: total_price * (tax_rate / 100)
						const totalPrice = (productDetails.price || product.price || 0) * (product.quantity || 1);
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

			// Update total_amount in invoice (cell was already created with value 0)
			const totalAmountColumn = invoiceTables.invoices!.columns!.find(
				(c: any) => c.semanticType === SemanticColumnType.INVOICE_TOTAL_AMOUNT,
			);

			if (totalAmountColumn) {
				await tx.cell.updateMany({
					where: {
						rowId: invoiceRow.id,
						columnId: totalAmountColumn.id,
					},
					data: {
						value: totals.grandTotal.toString(),
					},
				});
			}

			console.log("✅ Invoice creation completed:");
			console.log("   - Invoice Row ID:", invoiceRow.id);
			console.log("   - Invoice Number:", invoiceNumber);
			console.log("   - Invoice Items created:", invoiceItemRows.length);
			console.log("   - Total amount:", totals.grandTotal);

			// Verify invoice row still exists and has correct ID
			const verifyInvoice = await tx.row.findUnique({
				where: { id: invoiceRow.id },
				select: { id: true, tableId: true }
			});
			
			if (!verifyInvoice) {
				console.error("❌ CRITICAL: Invoice row disappeared after creation!");
			} else {
				console.log("✅ Invoice row verified in database:", verifyInvoice);
			}

			// Return the result from the transaction
			return {
				invoiceRow,
				invoiceNumber,
				invoiceItemRows,
				totals
			};
		});

		// Return the response after successful transaction
		return NextResponse.json({
			message: "Invoice created successfully",
			invoice: {
				id: result.invoiceRow.id,
				invoice_number: result.invoiceNumber,
				customer_id: parsedData.customer_id,
				date: new Date().toISOString(),
				due_date: parsedData.due_date,
				status: parsedData.status || "draft",
				base_currency: parsedData.base_currency,
				payment_terms: parsedData.payment_terms,
				payment_method: parsedData.payment_method,
				notes: parsedData.notes,
				items_count: parsedData.products.length,
				subtotal: result.totals.subtotal,
				vat_total: result.totals.vatTotal,
				total_amount: result.totals.grandTotal,
			},
		});
	} catch (error) {
		console.error("Error creating invoice:", error);
		
		// Handle Zod validation errors
		if (error instanceof z.ZodError) {
			return NextResponse.json(
				{ 
					error: "Validation error", 
					details: error.errors,
					message: "Please check the form data and try again"
				},
				{ status: 400 },
			);
		}

		// Handle database connection errors
		if (error instanceof Error && error.message.includes('connection')) {
			return NextResponse.json(
				{ 
					error: "Database connection error", 
					message: "Unable to connect to database. Please try again later."
				},
				{ status: 503 },
			);
		}

		// Handle Prisma errors
		if (error instanceof Error && error.message.includes('Prisma')) {
			return NextResponse.json(
				{ 
					error: "Database error", 
					message: "An error occurred while saving the invoice. Please try again."
				},
				{ status: 500 },
			);
		}

		// Handle specific error types
		if (error instanceof Error) {
			// Check for missing semantic types error
			if (error.message.includes("Missing required columns")) {
				return NextResponse.json(
					{ 
						error: "Database configuration error", 
						message: error.message,
						details: "The invoice system is not properly configured. Please contact support."
					},
					{ status: 500 },
				);
			}

			// Check for database connection errors
			if (error.message.includes("connection") || error.message.includes("database")) {
				return NextResponse.json(
					{ 
						error: "Database connection error", 
						message: "Unable to connect to database. Please try again in a moment.",
						details: "The database is temporarily unavailable"
					},
					{ status: 503 },
				);
			}

			// Check for product validation errors
			if (error.message.includes("product") || error.message.includes("Product")) {
				return NextResponse.json(
					{ 
						error: "Product validation error", 
						message: error.message,
						details: "Please check your product selections and try again"
					},
					{ status: 400 },
				);
			}
		}

		// Generic error response
		return NextResponse.json(
			{ 
				error: "Failed to create invoice",
				message: "An unexpected error occurred. Please try again.",
				details: process.env.NODE_ENV === 'development' ? error : undefined
			},
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
