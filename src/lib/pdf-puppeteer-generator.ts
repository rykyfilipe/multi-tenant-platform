/** @format */

import puppeteer from 'puppeteer';
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
	 * Generate PDF from HTML template using Puppeteer
	 */
	static async generateInvoicePDF(options: PDFGenerationOptions): Promise<Buffer> {
		let browser;
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

			// Launch Puppeteer
			console.log('PuppeteerPDFGenerator: Launching browser...');
			browser = await puppeteer.launch({
				headless: true,
				args: ['--no-sandbox', '--disable-setuid-sandbox']
			});

			const page = await browser.newPage();
			console.log('PuppeteerPDFGenerator: Browser launched, setting content...');

			// Set content and wait for it to load
			await page.setContent(htmlContent, { waitUntil: 'networkidle0' });
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
			console.error('Error generating PDF with Puppeteer:', error);
			throw error;
		} finally {
			if (browser) {
				await browser.close();
			}
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
			return new Intl.NumberFormat('en-US', {
				style: 'currency',
				currency: currency,
			}).format(amount);
		};

		const formatDate = (dateString: string) => {
			return new Date(dateString).toLocaleDateString('en-US', {
				year: 'numeric',
				month: 'long',
				day: 'numeric',
			});
		};

		const currency = invoiceData.invoice?.base_currency || 'USD';

		return `
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Invoice ${invoiceData.invoice.invoice_number}</title>
    <script src="https://cdn.tailwindcss.com"></script>
    <style>
        @media print {
            body {
                -webkit-print-color-adjust: exact;
                print-color-adjust: exact;
            }
        }
    </style>
</head>
<body>
      <div class="bg-white shadow-2xl border border-gray-200 mx-auto" style="width: 100%; max-width: 100%; aspect-ratio: 210/297; min-height: 600px; font-family: Arial, sans-serif;">
        <!-- Invoice Header -->
        <div class="border-b-2 border-gray-300 p-6">
          <div class="flex justify-between items-start">
            <div class="flex-1">
              <div class="mb-3">
                <h1 class="text-xl font-bold text-gray-900">
                  ${tenantBranding.name || 'Company Name'}
                </h1>
              </div>
            </div>
            <div class="text-right">
              <h2 class="text-3xl font-bold text-gray-900 mb-2">${translations.invoice || 'INVOICE'}</h2>
              <div class="space-y-1 text-xs">
                <div class="font-semibold">
                  ${translations.invoiceNumber || 'Invoice#'} ${invoiceData.invoice.invoice_series ? `${invoiceData.invoice.invoice_series}-` : ''}${invoiceData.invoice.invoice_number}
                </div>
                <div>${translations.date || 'Date'}: ${formatDate(invoiceData.invoice.date)}</div>
                <div class="text-base font-bold text-gray-900 mt-1">
                  Total Due: ${formatCurrency(invoiceData.invoice.total_amount, currency)}
                </div>
              </div>
            </div>
          </div>
        </div>

      <!-- Bill To Section -->
      <div class="p-6 border-b border-gray-200">
        <div class="grid grid-cols-1 md:grid-cols-2 gap-6">
          <!-- Company Info - Left side -->
          <div>
            <h3 class="text-sm font-semibold text-gray-700 mb-3">${translations.company || 'From'}:</h3>
            <div class="space-y-1 text-sm">
              <div class="font-semibold text-gray-900">${tenantBranding.name}</div>
              ${(tenantBranding.companyStreet || tenantBranding.address) ? `
                <div class="text-gray-600">
                  ${tenantBranding.companyStreet && tenantBranding.companyStreetNumber
                    ? `${tenantBranding.companyStreet} ${tenantBranding.companyStreetNumber}`
                    : tenantBranding.address || tenantBranding.companyStreet}
                </div>
              ` : ''}
              ${(tenantBranding.companyCity || tenantBranding.companyPostalCode) ? `
                <div class="text-gray-600">
                  ${[tenantBranding.companyPostalCode, tenantBranding.companyCity, tenantBranding.companyCountry]
                    .filter(Boolean)
                    .join(', ')}
                </div>
              ` : ''}
              ${tenantBranding.companyEmail ? `<div class="text-gray-600">${tenantBranding.companyEmail}</div>` : ''}
              ${tenantBranding.phone ? `<div class="text-gray-600">${tenantBranding.phone}</div>` : ''}
              ${tenantBranding.website ? `<div class="text-gray-600">${tenantBranding.website}</div>` : ''}
              ${tenantBranding.companyTaxId ? `<div class="text-gray-600">Tax ID: ${tenantBranding.companyTaxId}</div>` : ''}
              ${tenantBranding.registrationNumber ? `<div class="text-gray-600">Reg. No: ${tenantBranding.registrationNumber}</div>` : ''}
            </div>
          </div>

          <!-- Customer Info - Right side -->
          <div>
            <h3 class="text-sm font-semibold text-gray-700 mb-3">${translations.customer || 'Bill To'}:</h3>
            <div class="space-y-1 text-sm">
              <div class="font-semibold text-gray-900">
                ${invoiceData.customer.customer_name}
              </div>
              ${invoiceData.customer.customer_address ? `<div class="text-gray-600">${invoiceData.customer.customer_address}</div>` : ''}
              ${invoiceData.customer.customer_email ? `<div class="text-gray-600">${invoiceData.customer.customer_email}</div>` : ''}
              ${invoiceData.customer.customer_phone ? `<div class="text-gray-600">${invoiceData.customer.customer_phone}</div>` : ''}
            </div>
          </div>
        </div>
      </div>

      <!-- Invoice Details -->
      <div class="p-6 border-b border-gray-200">
        <div class="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div>
            <div class="flex items-center gap-2 mb-2">
              <span class="text-sm font-medium text-gray-700">
                ${translations.date || 'Invoice Date'}
              </span>
            </div>
            <div class="text-gray-900">${formatDate(invoiceData.invoice.date)}</div>
          </div>
          
          ${invoiceData.invoice.due_date ? `
          <div>
            <div class="flex items-center gap-2 mb-2">
              <span class="text-sm font-medium text-gray-700">
                ${translations.dueDate || 'Due Date'}
              </span>
            </div>
            <div class="text-gray-900">${formatDate(invoiceData.invoice.due_date)}</div>
          </div>
          ` : ''}

          ${invoiceData.invoice.payment_terms ? `
          <div>
            <div class="flex items-center gap-2 mb-2">
              <span class="text-sm font-medium text-gray-700">
                ${translations.paymentTerms || 'Payment Terms'}
              </span>
            </div>
            <div class="text-gray-900">${invoiceData.invoice.payment_terms}</div>
          </div>
          ` : ''}
        </div>
      </div>

      <!-- Items Table -->
      <div class="p-6">
        <div class="overflow-x-auto">
          <table class="w-full border-collapse text-xs">
            <thead>
              <tr class="bg-gray-50">
                <th class="text-left py-3 px-3 font-semibold text-gray-700 uppercase tracking-wider border-b border-gray-300" style="width: 25%;">
                  ${translations.item || 'PRODUCT'}
                </th>
                <th class="text-left py-3 px-3 font-semibold text-gray-700 uppercase tracking-wider border-b border-gray-300" style="width: 15%;">
                  ${translations.unit || 'UNIT'}
                </th>
                <th class="text-right py-3 px-3 font-semibold text-gray-700 uppercase tracking-wider border-b border-gray-300" style="width: 12%;">
                  ${translations.unitPrice || 'PRICE'}
                </th>
                <th class="text-right py-3 px-3 font-semibold text-gray-700 uppercase tracking-wider border-b border-gray-300" style="width: 8%;">
                  ${translations.quantity || 'QTY'}
                </th>
                <th class="text-right py-3 px-3 font-semibold text-gray-700 uppercase tracking-wider border-b border-gray-300" style="width: 10%;">
                  ${translations.vat || 'VAT %'}
                </th>
                <th class="text-right py-3 px-3 font-semibold text-gray-700 uppercase tracking-wider border-b border-gray-300" style="width: 15%;">
                  ${translations.total || 'TOTAL'}
                </th>
              </tr>
            </thead>
            <tbody>
              ${invoiceData.items.map(item => `
                <tr class="border-b border-gray-200">
                  <td class="py-3 px-3">
                    <div class="font-medium text-gray-900">
                      ${item.product_name || 'Product'}
                    </div>
                    ${item.description ? `
                      <div class="text-gray-600 mt-1 text-xs">
                        ${item.description}
                      </div>
                    ` : ''}
                    ${item.product_sku ? `
                      <div class="text-gray-500 mt-1 text-xs">
                        SKU: ${item.product_sku}
                      </div>
                    ` : ''}
                    ${item.product_dimensions ? `
                      <div class="text-gray-500 mt-1 text-xs">
                        ${item.product_dimensions}
                      </div>
                    ` : ''}
                  </td>
                  <td class="py-3 px-3 text-gray-700">
                    ${item.unit || item.product_unit || 'pcs'}
                  </td>
                  <td class="py-3 px-3 text-right text-gray-900">
                    ${formatCurrency(item.unit_price, item.currency || currency)}
                  </td>
                  <td class="py-3 px-3 text-right text-gray-900">
                    ${item.quantity}
                  </td>
                  <td class="py-3 px-3 text-right text-gray-700">
                    ${item.vat_rate || item.product_vat || 0}%
                  </td>
                  <td class="py-3 px-3 text-right font-medium text-gray-900">
                    ${formatCurrency(item.total, item.currency || currency)}
                  </td>
                </tr>
              `).join('')}
            </tbody>
          </table>
        </div>

        <!-- Totals -->
        <div class="mt-6 flex justify-end">
          <div class="w-72 space-y-1">
            <div class="flex justify-between py-1 text-xs">
              <span class="text-gray-700 font-semibold">
                ${translations.subtotal || 'SUB TOTAL'}:
              </span>
              <span class="font-medium text-gray-900">
                ${formatCurrency(invoiceData.totals.subtotal, currency)}
              </span>
            </div>
            
            ${invoiceData.totals.vatTotal > 0 ? `
            <div class="flex justify-between py-1 text-xs">
              <span class="text-gray-700 font-semibold">
                ${translations.tax || 'Tax VAT'}:
              </span>
              <span class="font-medium text-gray-900">
                ${formatCurrency(invoiceData.totals.vatTotal, currency)}
              </span>
            </div>
            ` : ''}
            
            ${(invoiceData.totals.discountAmount || 0) > 0 ? `
            <div class="flex justify-between py-1 text-xs">
              <span class="text-gray-700 font-semibold">
                ${translations.discount || 'Discount'}:
              </span>
              <span class="font-medium text-red-600">
                -${formatCurrency(invoiceData.totals.discountAmount || 0, currency)}
              </span>
            </div>
            ` : ''}
            
            <div class="flex justify-between py-2 border-t-2 border-gray-300 mt-3">
              <span class="text-base font-bold text-gray-900">
                ${translations.grandTotal || 'GRAND TOTAL'}:
              </span>
              <span class="text-base font-bold text-gray-900">
                ${formatCurrency(invoiceData.totals.grandTotal, currency)}
              </span>
            </div>
          </div>
        </div>
      </div>
    </div>
</body>
</html>
		`;
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

			return {
				invoice,
				items,
				customer,
				totals: this.calculateTotals(items),
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
		
		// For invoice items, ensure we have all necessary product fields
		if (obj.product_name || obj.name) {
			obj.product_name = obj.product_name || obj.name || 'Product';
			obj.description = obj.description || obj.product_description || '';
			obj.unit = obj.unit || obj.product_unit || 'pcs';
			obj.product_sku = obj.product_sku || obj.sku || '';
			obj.product_dimensions = obj.product_dimensions || obj.dimensions || '';
			obj.product_vat = obj.product_vat || obj.vat_rate || obj.vat || 0;
			obj.currency = obj.currency || 'USD';
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
			const quantity = parseFloat(item.quantity || '0');
			const price = parseFloat(item.price || '0');
			const itemVatRate = parseFloat(item.product_vat || '0');
			const itemDiscountRate = parseFloat(item.discount_rate || '0');
			const itemDiscountAmount = parseFloat(item.discount_amount || '0');
			
			const itemTotal = quantity * price;
			const itemVat = (itemTotal * itemVatRate) / 100;
			const itemDiscount = itemDiscountAmount > 0 ? itemDiscountAmount : (itemTotal * itemDiscountRate) / 100;
			
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
