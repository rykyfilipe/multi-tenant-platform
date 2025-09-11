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
			// Get invoice data
			const invoiceData = await this.getInvoiceData(options);
			if (!invoiceData) {
				throw new Error('Invoice not found');
			}

			// Get tenant branding
			const tenantBranding = await this.getTenantBranding(options.tenantId);

			// Get translations for the selected language
			const translations = await this.getTranslations(options.language || 'en');

			// Generate HTML content
			const htmlContent = this.generateHTMLContent(invoiceData, tenantBranding, translations);

			// Launch Puppeteer
			browser = await puppeteer.launch({
				headless: true,
				args: ['--no-sandbox', '--disable-setuid-sandbox']
			});

			const page = await browser.newPage();

			// Set content and wait for it to load
			await page.setContent(htmlContent, { waitUntil: 'networkidle0' });

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
	 * Generate HTML content for the invoice
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
    <style>
        * {
            margin: 0;
            padding: 0;
            box-sizing: border-box;
        }
        
        body {
            font-family: Arial, sans-serif;
            line-height: 1.4;
            color: #333;
            background: white;
        }
        
        .invoice-container {
            max-width: 800px;
            margin: 0 auto;
            background: white;
            min-height: 100vh;
        }
        
        .header {
            border-bottom: 2px solid #ccc;
            padding: 32px;
        }
        
        .header-content {
            display: flex;
            justify-content: space-between;
            align-items: flex-start;
        }
        
        .company-info {
            flex: 1;
        }
        
        .company-name {
            font-size: 20px;
            font-weight: bold;
            color: #111;
            margin-bottom: 16px;
        }
        
        .invoice-title {
            text-align: right;
        }
        
        .invoice-title h1 {
            font-size: 32px;
            font-weight: bold;
            color: #111;
            margin-bottom: 8px;
        }
        
        .invoice-details {
            font-size: 12px;
        }
        
        .invoice-details div {
            margin-bottom: 4px;
        }
        
        .invoice-number {
            font-weight: bold;
        }
        
        .total-due {
            font-size: 14px;
            font-weight: bold;
            color: #111;
            margin-top: 8px;
        }
        
        .bill-to-section {
            padding: 32px;
            border-bottom: 1px solid #ddd;
        }
        
        .bill-to-grid {
            display: grid;
            grid-template-columns: 1fr 1fr;
            gap: 32px;
        }
        
        .section-title {
            font-size: 12px;
            font-weight: bold;
            color: #666;
            margin-bottom: 12px;
        }
        
        .company-details, .customer-details {
            font-size: 12px;
        }
        
        .company-details div, .customer-details div {
            margin-bottom: 4px;
        }
        
        .company-name-bold, .customer-name-bold {
            font-weight: bold;
            color: #111;
        }
        
        .invoice-details-section {
            padding: 32px;
            border-bottom: 1px solid #ddd;
        }
        
        .details-grid {
            display: grid;
            grid-template-columns: repeat(3, 1fr);
            gap: 24px;
        }
        
        .detail-item {
            font-size: 12px;
        }
        
        .detail-label {
            font-weight: bold;
            color: #666;
            margin-bottom: 8px;
        }
        
        .detail-value {
            color: #111;
        }
        
        .items-section {
            padding: 32px;
        }
        
        .items-table {
            width: 100%;
            border-collapse: collapse;
        }
        
        .items-table thead {
            background-color: #f5f5f5;
        }
        
        .items-table th {
            text-align: left;
            padding: 16px;
            font-weight: bold;
            color: #666;
            font-size: 10px;
            text-transform: uppercase;
            letter-spacing: 0.5px;
            border-bottom: 1px solid #ddd;
        }
        
        .items-table th:last-child {
            text-align: right;
        }
        
        .items-table td {
            padding: 16px;
            border-bottom: 1px solid #ddd;
            font-size: 9px;
        }
        
        .items-table td:last-child {
            text-align: right;
        }
        
        .item-name {
            font-weight: bold;
            color: #111;
        }
        
        .item-description {
            color: #666;
            margin-top: 4px;
        }
        
        .totals-section {
            margin-top: 32px;
            display: flex;
            justify-content: flex-end;
        }
        
        .totals-container {
            width: 320px;
        }
        
        .total-row {
            display: flex;
            justify-content: space-between;
            padding: 4px 0;
            font-size: 10px;
        }
        
        .total-label {
            color: #666;
            font-weight: bold;
        }
        
        .total-value {
            color: #111;
            font-weight: bold;
        }
        
        .grand-total {
            border-top: 2px solid #ccc;
            margin-top: 16px;
            padding-top: 16px;
            font-size: 14px;
        }
        
        .grand-total .total-label,
        .grand-total .total-value {
            font-size: 14px;
            font-weight: bold;
        }
        
        .discount-value {
            color: #dc2626;
        }
        
        @media print {
            body {
                -webkit-print-color-adjust: exact;
                print-color-adjust: exact;
            }
        }
    </style>
</head>
<body>
    <div class="invoice-container">
        <!-- Header -->
        <div class="header">
            <div class="header-content">
                <div class="company-info">
                    <div class="company-name">${tenantBranding.name || 'Company Name'}</div>
                </div>
                <div class="invoice-title">
                    <h1>${translations.invoice || 'INVOICE'}</h1>
                    <div class="invoice-details">
                        <div class="invoice-number">
                            ${translations.invoiceNumber || 'Invoice#'} ${invoiceData.invoice.invoice_series ? `${invoiceData.invoice.invoice_series}-` : ''}${invoiceData.invoice.invoice_number}
                        </div>
                        <div>${translations.date || 'Date'}: ${formatDate(invoiceData.invoice.date)}</div>
                        <div class="total-due">
                            Total Due: ${formatCurrency(invoiceData.invoice.total_amount, currency)}
                        </div>
                    </div>
                </div>
            </div>
        </div>

        <!-- Bill To Section -->
        <div class="bill-to-section">
            <div class="bill-to-grid">
                <div>
                    <div class="section-title">${translations.company || 'From'}:</div>
                    <div class="company-details">
                        <div class="company-name-bold">${tenantBranding.name}</div>
                        ${tenantBranding.address ? `<div>${tenantBranding.address}</div>` : ''}
                        ${tenantBranding.companyCity || tenantBranding.companyPostalCode ? 
                            `<div>${[tenantBranding.companyPostalCode, tenantBranding.companyCity, tenantBranding.companyCountry].filter(Boolean).join(', ')}</div>` : ''}
                        ${tenantBranding.companyEmail ? `<div>${tenantBranding.companyEmail}</div>` : ''}
                        ${tenantBranding.phone ? `<div>${tenantBranding.phone}</div>` : ''}
                        ${tenantBranding.website ? `<div>${tenantBranding.website}</div>` : ''}
                        ${tenantBranding.companyTaxId ? `<div>Tax ID: ${tenantBranding.companyTaxId}</div>` : ''}
                        ${tenantBranding.registrationNumber ? `<div>Reg. No: ${tenantBranding.registrationNumber}</div>` : ''}
                    </div>
                </div>
                <div>
                    <div class="section-title">${translations.customer || 'Bill To'}:</div>
                    <div class="customer-details">
                        <div class="customer-name-bold">${invoiceData.customer.customer_name}</div>
                        ${invoiceData.customer.customer_address ? `<div>${invoiceData.customer.customer_address}</div>` : ''}
                        ${invoiceData.customer.customer_email ? `<div>${invoiceData.customer.customer_email}</div>` : ''}
                        ${invoiceData.customer.customer_phone ? `<div>${invoiceData.customer.customer_phone}</div>` : ''}
                    </div>
                </div>
            </div>
        </div>

        <!-- Invoice Details -->
        <div class="invoice-details-section">
            <div class="details-grid">
                <div class="detail-item">
                    <div class="detail-label">${translations.date || 'Invoice Date'}</div>
                    <div class="detail-value">${formatDate(invoiceData.invoice.date)}</div>
                </div>
                ${invoiceData.invoice.due_date ? `
                <div class="detail-item">
                    <div class="detail-label">${translations.dueDate || 'Due Date'}</div>
                    <div class="detail-value">${formatDate(invoiceData.invoice.due_date)}</div>
                </div>
                ` : ''}
                ${invoiceData.invoice.payment_terms ? `
                <div class="detail-item">
                    <div class="detail-label">${translations.paymentTerms || 'Payment Terms'}</div>
                    <div class="detail-value">${invoiceData.invoice.payment_terms}</div>
                </div>
                ` : ''}
            </div>
        </div>

        <!-- Items Table -->
        <div class="items-section">
            <table class="items-table">
                <thead>
                    <tr>
                        <th>${translations.item || 'ITEM'} ${translations.description || 'DESCRIPTION'}</th>
                        <th style="text-align: right;">${translations.unitPrice || 'PRICE'}</th>
                        <th style="text-align: right;">${translations.quantity || 'QTY'}</th>
                        <th style="text-align: right;">${translations.total || 'TOTAL'}</th>
                    </tr>
                </thead>
                <tbody>
                    ${invoiceData.items.map(item => `
                        <tr>
                            <td>
                                <div class="item-name">${item.product_name}</div>
                                ${item.description ? `<div class="item-description">${item.description}</div>` : ''}
                            </td>
                            <td>${formatCurrency(item.unit_price, item.currency || currency)}</td>
                            <td>${item.quantity}</td>
                            <td>${formatCurrency(item.total, item.currency || currency)}</td>
                        </tr>
                    `).join('')}
                </tbody>
            </table>

            <!-- Totals -->
            <div class="totals-section">
                <div class="totals-container">
                    <div class="total-row">
                        <span class="total-label">${translations.subtotal || 'SUB TOTAL'}:</span>
                        <span class="total-value">${formatCurrency(invoiceData.totals.subtotal, currency)}</span>
                    </div>
                    
                    ${invoiceData.totals.vatTotal > 0 ? `
                    <div class="total-row">
                        <span class="total-label">${translations.tax || 'Tax VAT'}:</span>
                        <span class="total-value">${formatCurrency(invoiceData.totals.vatTotal, currency)}</span>
                    </div>
                    ` : ''}
                    
                    ${(invoiceData.totals.discountAmount || 0) > 0 ? `
                    <div class="total-row">
                        <span class="total-label">${translations.discount || 'Discount'}:</span>
                        <span class="total-value discount-value">-${formatCurrency(invoiceData.totals.discountAmount || 0, currency)}</span>
                    </div>
                    ` : ''}
                    
                    <div class="total-row grand-total">
                        <span class="total-label">${translations.grandTotal || 'GRAND TOTAL'}:</span>
                        <span class="total-value">${formatCurrency(invoiceData.totals.grandTotal, currency)}</span>
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
