/** @format */

import puppeteer from 'puppeteer-core';
import chromium from '@sparticuz/chromium';
import { InvoiceSystemService } from './invoice-system';
import prisma from './prisma';

export interface PDFGenerationOptions {
	tenantId: string;
	databaseId: number;
	invoiceId: number;
	includeWatermark?: boolean;
	includeQRCode?: boolean;
	includeBarcode?: boolean;
	customTemplate?: string;
	language?: string;
}

export interface InvoiceData {
	invoice: {
		invoice_number: string;
		invoice_series?: string;
		date: string;
		due_date?: string;
		status: string;
		total_amount: number;
		payment_terms?: string;
		base_currency?: string;
	};
	customer: {
		customer_name: string;
		customer_address?: string;
		customer_email?: string;
		customer_phone?: string;
	};
	items: Array<{
		product_name: string;
		description?: string;
		quantity: number;
		unit_price: number;
		total: number;
		vat_rate?: number;
		currency?: string;
		unit?: string;
		product_unit?: string;
		product_sku?: string;
		product_dimensions?: string;
		product_vat?: number;
	}>;
	totals: {
		subtotal: number;
		vatTotal: number;
		grandTotal: number;
		discountAmount?: number;
		discountRate?: number;
		vatRate?: number;
	};
}

export interface TenantBranding {
	name: string;
	companyEmail?: string;
	address?: string;
	logoUrl?: string;
	website?: string;
	phone?: string;
	companyTaxId?: string;
	registrationNumber?: string;
	companyCity?: string;
	companyCountry?: string;
	companyPostalCode?: string;
	companyIban?: string;
	companyBank?: string;
	companyStreet?: string;
	companyStreetNumber?: string;
}

export class PuppeteerPDFGenerator {
	/**
	 * Generate PDF from HTML using puppeteer-core + @sparticuz/chromium
	 */
	private static async generatePDF(html: string): Promise<Buffer> {
		let browser;
		try {
			console.log('PuppeteerPDFGenerator: Starting PDF generation with puppeteer-core + @sparticuz/chromium...');
			
			// Launch browser with chromium configuration
			browser = await puppeteer.launch({
				args: chromium.args,
				defaultViewport: { width: 1920, height: 1080 },
				executablePath: await chromium.executablePath(),
				headless: true,
			});

			const page = await browser.newPage();
			console.log('PuppeteerPDFGenerator: Browser launched, setting content...');

			// Set content and wait for it to load
			await page.setContent(html, { waitUntil: 'networkidle0' });
			console.log('PuppeteerPDFGenerator: Content loaded, generating PDF...');

			// Generate PDF with proper settings
			const pdfBuffer = await page.pdf({
				format: 'A4',
				printBackground: true,
				margin: {
					top: '0.5in',
					right: '0.5in',
					bottom: '0.5in',
					left: '0.5in'
				},
				preferCSSPageSize: true
			});

			console.log('PuppeteerPDFGenerator: PDF generated successfully, size:', pdfBuffer.length, 'bytes');
			return Buffer.from(pdfBuffer);
		} catch (error) {
			console.error('Error generating PDF with puppeteer-core + chromium:', error);
			throw error;
		} finally {
			if (browser) {
				await browser.close();
			}
		}
	}

	/**
	 * Generate PDF from HTML template using puppeteer-core + @sparticuz/chromium
	 */
	static async generateInvoicePDF(options: PDFGenerationOptions): Promise<Buffer> {
		try {
			console.log('PuppeteerPDFGenerator: Starting PDF generation...');
			
			// Get invoice data
			const invoiceData = await this.getInvoiceData(options);
			if (!invoiceData) {
				throw new Error('Invoice not found');
			}
			console.log('PuppeteerPDFGenerator: Invoice data retrieved successfully');

			// Get tenant branding
			const tenantBranding = await this.getTenantBranding(options.tenantId);

			// Get translations for the selected language
			const translations = await this.getTranslations(options.language || 'en');

			// Generate HTML content
			const htmlContent = this.generateHTMLContent(invoiceData, tenantBranding, translations);
			console.log('PuppeteerPDFGenerator: HTML content generated, length:', htmlContent.length);

			// Generate PDF using the new helper method
			const pdfBuffer = await this.generatePDF(htmlContent);
			
			console.log('PuppeteerPDFGenerator: PDF generated successfully, size:', pdfBuffer.length, 'bytes');
			return pdfBuffer;
		} catch (error) {
			console.error('Error generating PDF with puppeteer-core + chromium:', error);
			throw error;
		}
	}

	/**
	 * Generate HTML content for the invoice - EXACT COPY from InvoiceHTMLPreview.tsx
	 */
	private static generateHTMLContent(
		invoiceData: InvoiceData,
		tenantBranding: TenantBranding,
		translations: Record<string, string>
	): string {
		const formatCurrency = (amount: number, currency = 'USD') => {
			// Handle NaN and invalid amounts
			if (isNaN(amount) || amount === null || amount === undefined) {
				console.log('🔍 PDF DEBUG: Invalid amount for currency formatting:', { amount, currency });
				return '$0.00';
			}
			
			const formatted = new Intl.NumberFormat('en-US', {
				style: 'currency',
				currency: currency,
			}).format(amount);
			
			console.log('🔍 PDF DEBUG: Currency formatting:', { amount, currency, formatted });
			return formatted;
		};

		const formatDate = (dateString: string) => {
			return new Date(dateString).toLocaleDateString('en-US', {
				year: 'numeric',
				month: 'long',
				day: 'numeric',
			});
		};

		const currency = invoiceData.invoice?.base_currency || 'USD';

		console.log('🔍 PDF DEBUG: Generating HTML with data:', {
			invoice: invoiceData.invoice,
			items: invoiceData.items.map(item => ({
				product_name: item.product_name,
				unit_price: item.unit_price,
				quantity: item.quantity,
				total: item.total,
				vat_rate: item.vat_rate
			})),
			totals: invoiceData.totals,
			currency
		});

		return `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0"/>
  <title>Invoice ${invoiceData.invoice.invoice_number}</title>
  <script src="https://cdn.tailwindcss.com"></script>
  <style>
    body { font-family: Arial, sans-serif; }
    @media print {
      body { -webkit-print-color-adjust: exact; print-color-adjust: exact; }
    }
  </style>
</head>
<body class="bg-gray-100 p-6">
  <div class="bg-white shadow-lg border border-gray-300 mx-auto p-8" style="max-width: 800px; min-height: 1123px; aspect-ratio: 210/297;">
    
    <!-- Header -->
    <div class="flex justify-between items-start border-b pb-6 mb-6">
      <div>
        <h1 class="text-2xl font-bold text-gray-900">
          ${tenantBranding.name || 'Company Name'}
        </h1>
        <p class="text-sm text-gray-600">${tenantBranding.companyStreet || ''} ${tenantBranding.companyStreetNumber || ''}</p>
        <p class="text-sm text-gray-600">${tenantBranding.companyCity || ''}, ${tenantBranding.companyCountry || ''}</p>
        ${tenantBranding.companyTaxId ? `<p class="text-sm text-gray-600">Tax ID: ${tenantBranding.companyTaxId}</p>` : ''}
      </div>
      <div class="text-right">
        <h2 class="text-3xl font-bold text-gray-900">${translations.invoice || 'INVOICE'}</h2>
        <p class="text-sm text-gray-600">
          ${translations.invoiceNumber || 'Invoice #'}: 
          ${invoiceData.invoice.invoice_series ? `${invoiceData.invoice.invoice_series}-` : ''}${invoiceData.invoice.invoice_number}
        </p>
        <p class="text-sm text-gray-600">${translations.date || 'Date'}: ${formatDate(invoiceData.invoice.date)}</p>
        ${invoiceData.invoice.due_date ? `<p class="text-sm text-gray-600">${translations.dueDate || 'Due Date'}: ${formatDate(invoiceData.invoice.due_date)}</p>` : ''}
      </div>
    </div>

    <!-- Billing Info -->
    <div class="grid grid-cols-2 gap-8 mb-6">
      <div>
        <h3 class="text-sm font-semibold text-gray-700 mb-2">${translations.company || 'From'}:</h3>
        <p class="font-semibold text-gray-900">${tenantBranding.name}</p>
        ${tenantBranding.companyEmail ? `<p class="text-gray-600 text-sm">${tenantBranding.companyEmail}</p>` : ''}
        ${tenantBranding.phone ? `<p class="text-gray-600 text-sm">${tenantBranding.phone}</p>` : ''}
      </div>
      <div>
        <h3 class="text-sm font-semibold text-gray-700 mb-2">${translations.customer || 'Bill To'}:</h3>
        <p class="font-semibold text-gray-900">${invoiceData.customer.customer_name}</p>
        ${invoiceData.customer.customer_address ? `<p class="text-gray-600 text-sm">${invoiceData.customer.customer_address}</p>` : ''}
        ${invoiceData.customer.customer_email ? `<p class="text-gray-600 text-sm">${invoiceData.customer.customer_email}</p>` : ''}
        ${invoiceData.customer.customer_phone ? `<p class="text-gray-600 text-sm">${invoiceData.customer.customer_phone}</p>` : ''}
      </div>
    </div>

    <!-- Items Table -->
    <div class="overflow-x-auto mb-6">
      <table class="w-full border-collapse text-sm">
        <thead>
          <tr class="bg-gray-100 text-gray-700 border-b">
            <th class="py-3 px-2 text-left font-semibold">${translations.item || 'Item'}</th>
            <th class="py-3 px-2 text-left font-semibold">${translations.unit || 'Unit'}</th>
            <th class="py-3 px-2 text-right font-semibold">${translations.unitPrice || 'Unit Price'}</th>
            <th class="py-3 px-2 text-right font-semibold">${translations.quantity || 'Quantity'}</th>
            <th class="py-3 px-2 text-right font-semibold">${translations.vat || 'VAT %'}</th>
            <th class="py-3 px-2 text-right font-semibold">${translations.total || 'Total'}</th>
          </tr>
        </thead>
        <tbody>
          ${invoiceData.items.map(item => `
            <tr class="border-b">
              <td class="py-2 px-2">${item.product_name || ''}</td>
              <td class="py-2 px-2">${item.unit || item.product_unit || 'pcs'}</td>
              <td class="py-2 px-2 text-right">${formatCurrency(item.unit_price, item.currency || currency)}</td>
              <td class="py-2 px-2 text-right">${item.quantity}</td>
              <td class="py-2 px-2 text-right">${item.vat_rate || 0}%</td>
              <td class="py-2 px-2 text-right font-semibold">${formatCurrency(item.total, item.currency || currency)}</td>
            </tr>
          `).join('')}
        </tbody>
      </table>
    </div>

    <!-- Totals -->
    <div class="flex justify-end mb-12">
      <div class="w-64">
        <div class="flex justify-between py-1">
          <span class="text-gray-700">${translations.subtotal || 'Subtotal'}:</span>
          <span class="font-medium">${formatCurrency(invoiceData.totals.subtotal, currency)}</span>
        </div>
        ${invoiceData.totals.vatTotal > 0 ? `
        <div class="flex justify-between py-1">
          <span class="text-gray-700">${translations.tax || 'VAT'}:</span>
          <span class="font-medium">${formatCurrency(invoiceData.totals.vatTotal, currency)}</span>
        </div>` : ''}
        ${(invoiceData.totals.discountAmount || 0) > 0 ? `
        <div class="flex justify-between py-1">
          <span class="text-gray-700">${translations.discount || 'Discount'}:</span>
          <span class="font-medium text-red-600">-${formatCurrency(invoiceData.totals.discountAmount || 0, currency)}</span>
        </div>` : ''}
        <div class="flex justify-between py-2 border-t mt-2">
          <span class="font-bold text-gray-900">${translations.grandTotal || 'Grand Total'}:</span>
          <span class="font-bold text-gray-900">${formatCurrency(invoiceData.totals.grandTotal, currency)}</span>
        </div>
      </div>
    </div>

    <!-- Footer -->
    <div class="text-center text-xs text-gray-500 border-t pt-4">
      Thank you for your business.<br/>
      ${tenantBranding.website || ''} | ${tenantBranding.companyEmail || ''}
    </div>
  </div>
</body>
</html>
`
	}

	/**
	 * Get invoice data for PDF generation
	 */
	private static async getInvoiceData(options: PDFGenerationOptions): Promise<InvoiceData | null> {
		try {
			const invoiceTables = await InvoiceSystemService.getInvoiceTables(
				Number(options.tenantId),
				options.databaseId
			);

			if (!invoiceTables.invoices || !invoiceTables.invoice_items) {
				throw new Error('Invoice system not initialized');
			}

			// Get invoice row
			const invoiceRow = await prisma.row.findFirst({
				where: {
					id: options.invoiceId,
					tableId: invoiceTables.invoices.id,
				},
				include: {
					cells: {
						include: {
							column: true,
						},
					},
				},
			});

			if (!invoiceRow) {
				throw new Error('Invoice not found');
			}

			// Get invoice items
			const invoiceItems = await prisma.row.findMany({
				where: {
					tableId: invoiceTables.invoice_items.id,
					cells: {
						some: {
							column: {
								name: 'invoice_id',
							},
							value: {
								equals: options.invoiceId,
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

			// Get customer data
			const customerId = invoiceRow.cells.find((c: any) => c.column.name === 'customer_id')?.value;
			let customer = null;
			if (customerId) {
				customer = await this.getCustomerData(options.tenantId, options.databaseId, parseInt(customerId));
			}

			// Transform data
			const invoice = this.transformRowToObject(invoiceRow);
			const items = invoiceItems.map((item: any) => this.transformRowToObject(item));

			console.log('🔍 PDF DEBUG: Final invoice data before PDF generation:', {
				invoice,
				items,
				customer,
				itemsCount: items.length
			});

			const totals = this.calculateTotals(items);
			
			console.log('🔍 PDF DEBUG: Calculated totals:', totals);

			return {
				invoice,
				items,
				customer,
				totals,
			};
		} catch (error) {
			console.error('Error getting invoice data:', error);
			return null;
		}
	}

	/**
	 * Get tenant branding information
	 */
	private static async getTenantBranding(tenantId: string): Promise<TenantBranding> {
		try {
			const tenant = await prisma.tenant.findUnique({
				where: { id: parseInt(tenantId) },
				select: {
					name: true,
					companyEmail: true,
					address: true,
					logoUrl: true,
					website: true,
					phone: true,
					companyTaxId: true,
					registrationNumber: true,
					companyCity: true,
					companyCountry: true,
					companyPostalCode: true,
					companyIban: true,
					companyBank: true,
					companyStreet: true,
					companyStreetNumber: true,
				},
			});

			return tenant || { name: 'Company Name' };
		} catch (error) {
			console.error('Error getting tenant branding:', error);
			return { name: 'Company Name' };
		}
	}

	/**
	 * Get customer data
	 */
	private static async getCustomerData(tenantId: string, databaseId: number, customerId: number): Promise<any> {
		try {
			const customerTables = await InvoiceSystemService.getInvoiceTables(Number(tenantId), databaseId);
			
			if (!customerTables.customers) {
				return null;
			}

			const customerRow = await prisma.row.findFirst({
				where: {
					id: customerId,
					tableId: customerTables.customers.id,
				},
				include: {
					cells: {
						include: {
							column: true,
						},
					},
				},
			});

			return customerRow ? this.transformRowToObject(customerRow) : null;
		} catch (error) {
			console.error('Error getting customer data:', error);
			return null;
		}
	}

	/**
	 * Transform row data to object
	 */
	private static transformRowToObject(row: any): any {
		const obj: any = {};
		row.cells.forEach((cell: any) => {
			obj[cell.column.name] = cell.value;
		});
		
		console.log('🔍 PDF DEBUG: Transforming row to object:', {
			rowId: row.id,
			tableId: row.tableId,
			originalCells: row.cells.map((c: any) => ({ name: c.column.name, value: c.value })),
			transformedObj: obj
		});
		
		// For invoice items, ensure we have all necessary product fields
		if (obj.product_name || obj.name) {
			obj.product_name = obj.product_name || obj.name || 'Product';
			obj.description = obj.description || obj.product_description || '';
			obj.unit = obj.unit || obj.product_unit || 'pcs';
			obj.product_sku = obj.product_sku || obj.sku || '';
			obj.product_dimensions = obj.product_dimensions || obj.dimensions || '';
			obj.product_vat = obj.product_vat || obj.vat_rate || obj.vat || 0;
			obj.currency = obj.currency || 'USD';
			
			console.log('🔍 PDF DEBUG: Product fields normalized:', {
				product_name: obj.product_name,
				unit: obj.unit,
				product_vat: obj.product_vat,
				currency: obj.currency
			});
		}
		
		return obj;
	}

	/**
	 * Calculate invoice totals
	 */
	private static calculateTotals(items: any[]): any {
		let subtotal = 0;
		let vatTotal = 0;
		let discountAmount = 0;
		let discountRate = 0;
		let vatRate = 0;

		items.forEach(item => {
			console.log('🔍 PDF DEBUG: Processing item for totals calculation:', {
				item,
				quantity: item.quantity,
				price: item.price,
				unit_price: item.unit_price,
				product_vat: item.product_vat,
				total: item.total
			});

			const quantity = parseFloat(item.quantity || '0');
			// Fix: Use unit_price instead of price for consistency with preview
			const price = parseFloat(item.unit_price || item.price || '0');
			const itemVatRate = parseFloat(item.product_vat || item.vat_rate || '0');
			const itemDiscountRate = parseFloat(item.discount_rate || '0');
			const itemDiscountAmount = parseFloat(item.discount_amount || '0');
			
			// If item.total is already calculated and valid, use it instead of calculating
			const calculatedTotal = quantity * price;
			const itemTotal = (item.total && !isNaN(parseFloat(item.total))) ? parseFloat(item.total) : calculatedTotal;
			const itemVat = (itemTotal * itemVatRate) / 100;
			const itemDiscount = itemDiscountAmount > 0 ? itemDiscountAmount : (itemTotal * itemDiscountRate) / 100;
			
			console.log('🔍 PDF DEBUG: Item totals calculated:', {
				quantity,
				price,
				calculatedTotal,
				itemTotal,
				itemVat,
				itemDiscount,
				itemVatRate
			});
			
			subtotal += itemTotal;
			vatTotal += itemVat;
			discountAmount += itemDiscount;
			
			// Use the highest VAT rate found
			if (itemVatRate > vatRate) {
				vatRate = itemVatRate;
			}
			
			// Use the highest discount rate found
			if (itemDiscountRate > discountRate) {
				discountRate = itemDiscountRate;
			}
		});

		const grandTotal = subtotal + vatTotal - discountAmount;

		return {
			subtotal,
			vatTotal,
			grandTotal,
			discountAmount,
			discountRate: discountAmount > 0 && discountRate === 0 ? (discountAmount / subtotal) * 100 : discountRate,
			vatRate,
		};
	}

	/**
	 * Get translations for PDF content
	 */
	private static async getTranslations(language: string): Promise<Record<string, string>> {
		const translations: Record<string, string> = {
			// Default English translations
			invoice: 'INVOICE',
			invoiceNumber: 'Invoice#',
			date: 'Date',
			dueDate: 'Due Date',
			customer: 'Bill To',
			company: 'From',
			description: 'Description',
			quantity: 'QTY',
			unitPrice: 'PRICE',
			total: 'TOTAL',
			subtotal: 'SUB TOTAL',
			tax: 'Tax VAT',
			grandTotal: 'GRAND TOTAL',
			paymentTerms: 'Payment Terms',
			discount: 'Discount',
		};

		// Language-specific translations
		const languageTranslations: Record<string, Record<string, string>> = {
			ro: {
				invoice: 'FACTURA',
				invoiceNumber: 'Factura#',
				date: 'Data',
				dueDate: 'Data Scadentei',
				customer: 'Facturat catre',
				company: 'De la',
				description: 'Descriere',
				quantity: 'CANTITATE',
				unitPrice: 'PRET',
				total: 'TOTAL',
				subtotal: 'SUBTOTAL',
				tax: 'TVA 18%',
				grandTotal: 'TOTAL GENERAL',
				paymentTerms: 'Termeni de Plata',
				discount: 'Reducere',
			},
			es: {
				invoice: 'FACTURA',
				invoiceNumber: 'Factura#',
				date: 'Fecha',
				dueDate: 'Fecha de Vencimiento',
				customer: 'Facturar a',
				company: 'De',
				description: 'Descripcion',
				quantity: 'CANTIDAD',
				unitPrice: 'PRECIO',
				total: 'TOTAL',
				subtotal: 'SUBTOTAL',
				tax: 'IVA 18%',
				grandTotal: 'TOTAL GENERAL',
				paymentTerms: 'Terminos de Pago',
				discount: 'Descuento',
			},
		};

		// Return translations for the specified language or default to English
		return { ...translations, ...(languageTranslations[language] || {}) };
	}
}
