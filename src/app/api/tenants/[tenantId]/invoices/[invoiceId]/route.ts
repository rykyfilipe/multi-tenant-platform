/** @format */

import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { requireAuthResponse, requireTenantAccess, getUserId } from "@/lib/session";
import { InvoiceSystemService } from "@/lib/invoice-system";
import { InvoiceCalculationService } from "@/lib/invoice-calculations";

export async function GET(
	request: NextRequest,
	{ params }: { params: Promise<{ tenantId: string; invoiceId: string }> },
) {
	const sessionResult = await requireAuthResponse();
	if (sessionResult instanceof NextResponse) {
		return sessionResult;
	}

	const { tenantId, invoiceId } = await params;
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

		// Get invoice tables
		const invoiceTables = await InvoiceSystemService.getInvoiceTables(
			Number(tenantId),
			database.id,
		);

		if (
			!invoiceTables.invoices ||
			!invoiceTables.invoice_items ||
			!invoiceTables.customers
		) {
			return NextResponse.json(
				{ error: "Invoice system not initialized" },
				{ status: 404 },
			);
		}

		// Get invoice details
		const invoice = await prisma.row.findUnique({
			where: { id: Number(invoiceId) },
			include: {
				cells: {
					include: {
						column: true,
					},
				},
			},
		});

		if (!invoice) {
			return NextResponse.json({ error: "Invoice not found" }, { status: 404 });
		}

		// Verify this is an invoice row
		const invoiceNumberCell = invoice.cells.find(
			(c: any) => c.column.name === "invoice_number",
		);
		if (!invoiceNumberCell) {
			return NextResponse.json(
				{ error: "Invalid invoice row" },
				{ status: 400 },
			);
		}

		// Get customer ID from invoice
		const customerIdCell = invoice.cells.find(
			(c: any) => c.column.name === "customer_id",
		);
		if (!customerIdCell) {
			return NextResponse.json(
				{ error: "Invoice missing customer ID" },
				{ status: 400 },
			);
		}

		const customerId = customerIdCell.value;

		// Get customer details
		const customer = await prisma.row.findFirst({
			where: {
				id: customerId,
				tableId: invoiceTables.customers.id,
			},
			include: {
				cells: {
					include: {
						column: true,
					},
				},
			},
		});

		if (!customer) {
			return NextResponse.json(
				{ error: "Customer not found" },
				{ status: 404 },
			);
		}

		// Get invoice items
		const invoiceItems = await prisma.row.findMany({
			where: {
				tableId: invoiceTables.invoice_items.id,
				cells: {
					some: {
						column: {
							name: "invoice_id",
						},
						value: { equals: Number(invoiceId) },
					},
				},
			},
			include: {
				cells: {
					include: {
						column: true,
					},
				},
			},
		});

		// Transform invoice data
		const invoiceData: any = { id: invoice.id };
		invoice.cells.forEach((cell: any) => {
			invoiceData[cell.column.name] = cell.value;
		});

		// Transform customer data
		const customerData: any = { id: customer.id };
		customer.cells.forEach((cell: any) => {
			customerData[cell.column.name] = cell.value;
		});

		// Transform and enrich invoice items
		const items = [];
		for (const item of invoiceItems) {
			const itemData: any = { id: item.id };

			item.cells.forEach((cell: any) => {
				itemData[cell.column.name] = cell.value;
			});

			// Convert numeric fields to proper types for calculation
			if (itemData.quantity !== undefined) {
				itemData.quantity = Number(itemData.quantity) || 0;
			}
			if (itemData.unit_price !== undefined) {
				itemData.unit_price = Number(itemData.unit_price) || 0;
			}
			if (itemData.total_price !== undefined) {
				itemData.total_price = Number(itemData.total_price) || 0;
			}
			if (itemData.price !== undefined) {
				itemData.price = Number(itemData.price) || 0;
			}
			if (itemData.product_vat !== undefined) {
				itemData.product_vat = Number(itemData.product_vat) || 0;
			}

			// Get complete product details from the referenced table
			if (itemData.product_ref_table && itemData.product_ref_id) {
				try {
					// Find the referenced table
					const productTable = await prisma.table.findFirst({
						where: {
							name: itemData.product_ref_table,
							databaseId: database.id,
						},
					});

					if (productTable) {
						const productRow = await prisma.row.findUnique({
							where: { id: itemData.product_ref_id },
							include: {
								cells: {
									include: {
										column: true,
									},
								},
							},
						});

						if (productRow) {
							// Extract all product information
							const productData: any = { id: productRow.id };
							productRow.cells.forEach((cell: any) => {
								productData[cell.column.name] = cell.value;
							});

							// Merge product details into item data for easy access
							itemData.product_name =
								productData.name ||
								productData.product_name ||
								productData.title ||
								"Product";
							itemData.product_description =
								productData.description ||
								productData.product_description ||
								"";
							itemData.product_category =
								productData.category || productData.product_category || "";
							itemData.product_sku =
								productData.sku || productData.product_sku || "";
							itemData.product_brand =
								productData.brand || productData.product_brand || "";
							itemData.product_weight =
								productData.weight || productData.product_weight || null;
							itemData.product_dimensions =
								productData.dimensions || productData.product_dimensions || "";

							// Keep the full product data for reference
							itemData.product_details = productData;
						}
					}
				} catch (error) {
					console.warn(
						`Failed to fetch product details for ${itemData.product_ref_table}:${itemData.product_ref_id}`,
						error,
					);
					itemData.product_details = null;
				}
			}

			items.push(itemData);
		}

		// Get base currency from invoice
		const baseCurrency = invoiceData.base_currency || "USD";

		// Debug: Log the data being passed to calculation service
		console.log("=== INVOICE DETAILS DEBUG ===");
		console.log("Items from database:", JSON.stringify(items, null, 2));
		console.log("Base currency:", baseCurrency);
		console.log("Data types check:");
		items.forEach((item, index) => {
			console.log(`Item ${index + 1}:`, {
				quantity: { value: item.quantity, type: typeof item.quantity },
				price: { value: item.price, type: typeof item.price },
				product_vat: { value: item.product_vat, type: typeof item.product_vat },
				currency: { value: item.currency, type: typeof item.currency },
			});
		});

		// Calculate totals using unified service
		const totals = await InvoiceCalculationService.calculateInvoiceTotals(
			items,
			{
				baseCurrency,
				exchangeRates: {}, // Empty for now, will be populated with real rates
			},
		);

		// Debug: Log the calculated totals
		console.log("Calculated totals:", JSON.stringify(totals, null, 2));

		return NextResponse.json({
			invoice: invoiceData,
			customer: customerData,
			items,
			totals: {
				subtotal: totals.subtotal,
				vat_total: totals.vatTotal,
				grand_total: totals.grandTotal,
				subtotal_in_base_currency: totals.subtotalInBaseCurrency,
				base_currency: totals.baseCurrency,
				totals_by_currency: totals.totalsByCurrency,
				vat_totals_by_currency: totals.vatTotalsByCurrency,
				items_count: totals.itemsCount,
			},
		});
	} catch (error) {
		console.error("Error fetching invoice details:", error);
		return NextResponse.json(
			{ error: "Failed to fetch invoice details" },
			{ status: 500 },
		);
	}
}

export async function PATCH(
	request: NextRequest,
	{ params }: { params: Promise<{ tenantId: string; invoiceId: string }> },
) {
	const sessionResult = await requireAuthResponse();
	if (sessionResult instanceof NextResponse) {
		return sessionResult;
	}

	const { tenantId, invoiceId } = await params;
	const userId = getUserId(sessionResult);

	// Check tenant access
	const tenantAccessError = requireTenantAccess(sessionResult, tenantId);
	if (tenantAccessError) {
		return tenantAccessError;
	}

	try {
		const body = await request.json();
		const {
			customer_id,
			base_currency,
			products,
			payment_terms,
			payment_method,
			notes,
			due_date,
			status,
		} = body;

		// If only status is being updated, allow partial updates
		if (status && !customer_id && !products) {
			// Status-only update - validate status value
			const validStatuses = ['draft', 'issued', 'paid', 'overdue', 'cancelled'];
			if (!validStatuses.includes(status)) {
				return NextResponse.json(
					{ error: "Invalid status. Must be one of: " + validStatuses.join(', ') },
					{ status: 400 },
				);
			}
		} else if (!customer_id || !products || !Array.isArray(products)) {
			return NextResponse.json(
				{ error: "Missing required fields: customer_id, products" },
				{ status: 400 },
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

		// Get invoice tables
		const invoiceTables = await InvoiceSystemService.getInvoiceTables(
			Number(tenantId),
			database.id,
		);

		if (!invoiceTables.invoices || !invoiceTables.invoice_items) {
			return NextResponse.json(
				{ error: "Invoice system not initialized" },
				{ status: 404 },
			);
		}

		// Verify invoice exists
		const existingInvoice = await prisma.row.findUnique({
			where: { id: Number(invoiceId) },
			include: {
				cells: {
					include: {
						column: true,
					},
				},
			},
		});

		if (!existingInvoice) {
			return NextResponse.json({ error: "Invoice not found" }, { status: 404 });
		}

		// Verify this is an invoice row
		const invoiceNumberCell = existingInvoice.cells.find(
			(c: any) => c.column.name === "invoice_number",
		);
		if (!invoiceNumberCell) {
			return NextResponse.json(
				{ error: "Invalid invoice row" },
				{ status: 400 },
			);
		}

		// Update invoice data using the InvoiceSystemService
		const updateData: any = {
			customer_id,
			base_currency: base_currency || "USD",
			products,
			payment_terms,
			payment_method,
			notes,
			due_date,
		};

		// Add status if provided
		if (status) {
			updateData.status = status;
		}

		const updatedInvoice = await InvoiceSystemService.updateInvoice(
			Number(tenantId),
			database.id,
			Number(invoiceId),
			updateData,
		);

		return NextResponse.json({
			message: "Invoice updated successfully",
			invoice: updatedInvoice,
		});
	} catch (error) {
		console.error("Error updating invoice:", error);
		return NextResponse.json(
			{ error: "Failed to update invoice" },
			{ status: 500 },
		);
	}
}

export async function DELETE(
	request: NextRequest,
	{ params }: { params: Promise<{ tenantId: string; invoiceId: string }> },
) {
	const sessionResult = await requireAuthResponse();
	if (sessionResult instanceof NextResponse) {
		return sessionResult;
	}

	const { tenantId, invoiceId } = await params;
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

		// Get invoice tables
		const invoiceTables = await InvoiceSystemService.getInvoiceTables(
			Number(tenantId),
			database.id,
		);

		if (!invoiceTables.invoices || !invoiceTables.invoice_items) {
			return NextResponse.json(
				{ error: "Invoice system not initialized" },
				{ status: 404 },
			);
		}

		// Get invoice details to verify it exists
		const invoice = await prisma.row.findUnique({
			where: { id: Number(invoiceId) },
			include: {
				cells: {
					include: {
						column: true,
					},
				},
			},
		});

		if (!invoice) {
			return NextResponse.json({ error: "Invoice not found" }, { status: 404 });
		}

		// Debug logging for invoice structure
		console.log(`DELETE Invoice ${invoiceId} - Found ${invoice.cells.length} cells:`, 
			invoice.cells.map((c: any) => ({ 
				columnName: c.column.name, 
				value: c.value,
				semanticType: c.column.semanticType 
			}))
		);

		// Verify this is an invoice row by checking for invoice_number cell
		const invoiceNumberCell = invoice.cells.find(
			(c: any) => c.column.name === "invoice_number",
		);
		
		// If no invoice_number cell found, check if this is actually an invoice row
		// by looking for other invoice-specific columns
		if (!invoiceNumberCell) {
			const hasInvoiceColumns = invoice.cells.some((c: any) => 
				c.column.name === "customer_id" || 
				c.column.name === "date" || 
				c.column.name === "status"
			);
			
			if (!hasInvoiceColumns) {
				return NextResponse.json(
					{ error: "Invalid invoice row - not an invoice" },
					{ status: 400 },
				);
			}
			
			// If it has invoice columns but no invoice_number, it might be a corrupted invoice
			// Log this for debugging but allow deletion
			console.warn(`Invoice ${invoiceId} missing invoice_number cell but has other invoice columns. Proceeding with deletion.`);
		}

		// Get invoice items to delete
		const invoiceItems = await prisma.row.findMany({
			where: {
				tableId: invoiceTables.invoice_items.id,
				cells: {
					some: {
						column: {
							name: "invoice_id",
						},
						value: { equals: Number(invoiceId) },
					},
				},
			},
		});

		// Delete invoice items first (cascade delete)
		for (const item of invoiceItems) {
			// Verify the row still exists before attempting to delete
			const rowExists = await prisma.row.findUnique({
				where: { id: item.id },
				select: { id: true }
			});
			
			if (rowExists) {
				// Delete cells for this item
				await prisma.cell.deleteMany({
					where: { rowId: item.id },
				});
				// Delete the item row
				await prisma.row.delete({
					where: { id: item.id },
				});
			} else {
				console.warn(`Invoice item row with ID ${item.id} no longer exists, skipping deletion`);
			}
		}

		// Verify invoice row exists before deleting
		const invoiceExists = await prisma.row.findUnique({
			where: { id: Number(invoiceId) },
			select: { id: true }
		});

		if (invoiceExists) {
			// Delete invoice cells
			await prisma.cell.deleteMany({
				where: { rowId: Number(invoiceId) },
			});

			// Delete invoice row
			await prisma.row.delete({
				where: { id: Number(invoiceId) },
			});
		} else {
			console.warn(`Invoice row with ID ${invoiceId} no longer exists, skipping deletion`);
		}

		return NextResponse.json({
			message: "Invoice deleted successfully",
		});
	} catch (error) {
		console.error("Error deleting invoice:", error);
		return NextResponse.json(
			{ error: "Failed to delete invoice" },
			{ status: 500 },
		);
	}
}
