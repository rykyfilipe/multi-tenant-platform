/** @format */

import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { requireAuthResponse, requireTenantAccess, getUserId } from "@/lib/session";
import { InvoiceSystemService } from "@/lib/invoice-system";
import { PuppeteerPDFGenerator } from "@/lib/pdf-puppeteer-generator";
import { InvoiceCalculationService } from "@/lib/invoice-calculations";

const formatPrice = (price: any): string => {
	if (price == null || price === undefined) return "0.00";
	const numPrice =
		typeof price === "string" ? parseFloat(price) : Number(price);
	return isNaN(numPrice) ? "0.00" : numPrice.toFixed(2);
};

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
						value: {
							equals: Number(invoiceId),
						},
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

		// Transform invoice items with full product details
		const items = [];
		for (const item of invoiceItems) {
			const itemData: any = { id: item.id };

			// Get basic invoice item data
			item.cells.forEach((cell: any) => {
				itemData[cell.column.name] = cell.value;
			});

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
							// Only override product_vat if it doesn't exist in invoice_items
							if (!itemData.product_vat) {
								itemData.product_vat =
									productData.vat || productData.product_vat || 0;
							}

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

		// Get tenant information for PDF generation
		const tenantInfo = await prisma.tenant.findUnique({
			where: { id: Number(tenantId) },
			select: {
				name: true,
				companyEmail: true,
				phone: true,
				address: true,
				website: true,
				defaultCurrency: true,
				companyTaxId: true,
				registrationNumber: true,
				companyCity: true,
				companyCountry: true,
				companyPostalCode: true,
				companyIban: true,
				companyBank: true,
				language: true,
			},
		});

		// Calculate totals using unified service
		const totals = await InvoiceCalculationService.calculateInvoiceTotals(
			items,
			{
				baseCurrency:
					invoiceData.base_currency || tenantInfo?.defaultCurrency || "USD", // Use actual invoice currency
				exchangeRates: {}, // Empty for now, will be populated with real rates
			},
		);

		// Get additional query parameters
		const url = new URL(request.url);
		const isPreview = url.searchParams.get('preview') === 'true';

		// Prepare data for enhanced PDF generation
		const pdfOptions = {
			tenantId: tenantId,
			databaseId: database.id,
			invoiceId: Number(invoiceId),
			includeWatermark: url.searchParams.get('watermark') === 'true',
			includeQRCode: url.searchParams.get('qrcode') === 'true',
			includeBarcode: url.searchParams.get('barcode') === 'true',
			language: url.searchParams.get('language') || tenantInfo?.language || 'en',
		};

		console.log('PDF Generation Parameters:', {
			tenantId,
			invoiceId,
			language: pdfOptions.language,
			isPreview,
			includeWatermark: pdfOptions.includeWatermark,
			includeQRCode: pdfOptions.includeQRCode,
			includeBarcode: pdfOptions.includeBarcode
		});

		// Generate PDF using Puppeteer generator
		try {
			console.log('Using PuppeteerPDFGenerator for PDF generation...');
			const pdfBuffer = await PuppeteerPDFGenerator.generateInvoicePDF(pdfOptions);
			console.log('Puppeteer PDF generated successfully, size:', pdfBuffer.length, 'bytes');

			// Log PDF generation
			await prisma.invoiceAuditLog.create({
				data: {
					tenantId: Number(tenantId),
					databaseId: database.id,
					invoiceId: Number(invoiceId),
					action: 'pdf_generated',
					metadata: {
						useEnhanced: true,
						includeWatermark: pdfOptions.includeWatermark,
						includeQRCode: pdfOptions.includeQRCode,
						includeBarcode: pdfOptions.includeBarcode,
					},
				},
			});

			// Get language-specific filename
			const getInvoiceFilename = (lang: string) => {
				const filenameMap: Record<string, string> = {
					'en': 'invoice',
					'ro': 'factura',
					'es': 'factura',
					'fr': 'facture',
					'de': 'rechnung',
					'zh': 'fapiao'
				};
				return filenameMap[lang] || 'invoice';
			};

			const filename = getInvoiceFilename(pdfOptions.language);
			const contentDisposition = isPreview 
				? `inline; filename="${filename}-${invoiceData.invoice_number}.pdf"`
				: `attachment; filename="${filename}-${invoiceData.invoice_number}.pdf"`;
				
			return new NextResponse(pdfBuffer, {
				headers: {
					"Content-Type": "application/pdf",
					"Content-Disposition": contentDisposition,
					"Content-Length": pdfBuffer.length.toString(),
					"Cache-Control": isPreview ? "no-cache, no-store, must-revalidate" : "public, max-age=3600",
				},
			});
		} catch (error) {
			console.error("Error generating PDF:", error);
			return NextResponse.json(
				{ error: "Failed to generate PDF invoice" },
				{ status: 500 },
			);
		}
	} catch (error) {
		console.error("Error generating invoice download:", error);
		return NextResponse.json(
			{ error: "Failed to generate invoice download" },
			{ status: 500 },
		);
	}
}
