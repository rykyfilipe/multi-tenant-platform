/** @format */

// Use dynamic import for pdf-lib to avoid SSR issues
import type { PDFDocument as PDFDocumentType, RGB, PageSizes as PageSizesType } from 'pdf-lib';
import { rgb } from 'pdf-lib';
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

export interface EmailOptions {
	to: string[];
	cc?: string[];
	bcc?: string[];
	subject: string;
	body: string;
	attachments?: Array<{
		filename: string;
		content: Buffer;
		mimeType: string;
	}>;
}

export class EnhancedPDFGenerator {
	/**
	 * Remove diacritics from text to prevent PDF encoding issues
	 */
	private static removeDiacritics(text: any): string {
		if (!text) return '';
		
		// Convert to string if not already
		const textStr = String(text);
		
		const diacriticsMap: Record<string, string> = {
			'ă': 'a', 'â': 'a', 'î': 'i', 'ș': 's', 'ț': 't',
			'Ă': 'A', 'Â': 'A', 'Î': 'I', 'Ș': 'S', 'Ț': 'T',
			'à': 'a', 'á': 'a', 'â': 'a', 'ã': 'a', 'ä': 'a', 'å': 'a', 'æ': 'ae',
			'À': 'A', 'Á': 'A', 'Â': 'A', 'Ã': 'A', 'Ä': 'A', 'Å': 'A', 'Æ': 'AE',
			'è': 'e', 'é': 'e', 'ê': 'e', 'ë': 'e',
			'È': 'E', 'É': 'E', 'Ê': 'E', 'Ë': 'E',
			'ì': 'i', 'í': 'i', 'î': 'i', 'ï': 'i',
			'Ì': 'I', 'Í': 'I', 'Î': 'I', 'Ï': 'I',
			'ò': 'o', 'ó': 'o', 'ô': 'o', 'õ': 'o', 'ö': 'o', 'ø': 'o',
			'Ò': 'O', 'Ó': 'O', 'Ô': 'O', 'Õ': 'O', 'Ö': 'O', 'Ø': 'O',
			'ù': 'u', 'ú': 'u', 'û': 'u', 'ü': 'u',
			'Ù': 'U', 'Ú': 'U', 'Û': 'U', 'Ü': 'U',
			'ý': 'y', 'ÿ': 'y',
			'Ý': 'Y', 'Ÿ': 'Y',
			'ñ': 'n', 'Ñ': 'N',
			'ç': 'c', 'Ç': 'C',
			'ß': 'ss'
		};

		return textStr.replace(/[^\u0000-\u007E]/g, (char) => {
			return diacriticsMap[char] || char;
		});
	}

	/**
	 * Generate a professional PDF invoice with enhanced features
	 */
	static async generateInvoicePDF(options: PDFGenerationOptions): Promise<Buffer> {
		try {
			// Dynamic import to avoid SSR issues
			const { PDFDocument, rgb, StandardFonts, PageSizes } = await import('pdf-lib');
			
			// Get invoice data
			const invoiceData = await this.getInvoiceData(options);
			if (!invoiceData) {
				throw new Error('Invoice not found');
			}

			// Get tenant branding
			const tenantBranding = await this.getTenantBranding(options.tenantId);

			// Get translations for the selected language
			const translations = await this.getTranslations(options.language || 'en');

			// Create PDF document
			const pdfDoc = await PDFDocument.create();
			const page = pdfDoc.addPage(PageSizes.A4);
			const { width, height } = page.getSize();

			// Load fonts
			const font = await pdfDoc.embedFont(StandardFonts.Helvetica);
			const boldFont = await pdfDoc.embedFont(StandardFonts.HelveticaBold);

			// Set up colors
			const primaryColor = rgb(0.2, 0.4, 0.8);
			const secondaryColor = rgb(0.6, 0.6, 0.6);
			const textColor = rgb(0.1, 0.1, 0.1);

			// Header section
			await this.drawHeader(page, invoiceData, tenantBranding, font, boldFont, primaryColor, textColor, translations);

			// Company and customer information
			await this.drawCompanyInfo(page, invoiceData, tenantBranding, font, boldFont, textColor, translations);
			await this.drawCustomerInfo(page, invoiceData, font, boldFont, textColor, translations);

			// Invoice details
			await this.drawInvoiceDetails(page, invoiceData, font, boldFont, textColor, translations);

			// Items table
			await this.drawItemsTable(page, invoiceData, font, boldFont, textColor, secondaryColor, translations);

			// Totals section
			await this.drawTotalsSection(page, invoiceData, font, boldFont, textColor, primaryColor, translations);

			// Footer
			await this.drawFooter(page, invoiceData, tenantBranding, font, textColor, secondaryColor, translations);

			// Add watermarks if requested
			if (options.includeWatermark) {
				await this.addWatermark(page, tenantBranding, font, secondaryColor);
			}

			// Add QR code if requested
			if (options.includeQRCode) {
				await this.addQRCode(page, invoiceData, width, height);
			}

			// Add barcode if requested
			if (options.includeBarcode) {
				await this.addBarcode(page, invoiceData, width, height);
			}

			// Generate PDF bytes
			const pdfBytes = await pdfDoc.save();
			return Buffer.from(pdfBytes);
		} catch (error) {
			console.error('Error generating PDF:', error);
			throw error;
		}
	}

	/**
	 * Send invoice via email with PDF attachment
	 */
	static async sendInvoiceEmail(
		options: PDFGenerationOptions,
		emailOptions: EmailOptions
	): Promise<boolean> {
		try {
			// Generate PDF
			const pdfBuffer = await this.generateInvoicePDF(options);

			// Prepare email with PDF attachment
			const emailWithAttachment: EmailOptions = {
				...emailOptions,
				attachments: [
					...(emailOptions.attachments || []),
					{
						filename: `invoice-${options.invoiceId}.pdf`,
						content: pdfBuffer,
						mimeType: 'application/pdf',
					},
				],
			};

			// Send email (implement based on your email service)
			const success = await this.sendEmail(emailWithAttachment);

			// Log email sending
			await this.logEmailSent(options, emailOptions, success);

			return success;
		} catch (error) {
			console.error('Error sending invoice email:', error);
			throw error;
		}
	}

	/**
	 * Get invoice data for PDF generation
	 */
	private static async getInvoiceData(options: PDFGenerationOptions): Promise<any> {
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
			throw error;
		}
	}

	/**
	 * Get tenant branding information
	 */
	private static async getTenantBranding(tenantId: string): Promise<any> {
		try {
			const tenant = await prisma.tenant.findUnique({
				where: { id: parseInt(tenantId) },
				select: {
					name: true,
					companyEmail: true,
					address: true,
					defaultCurrency: true,
					logoUrl: true,
					website: true,
					phone: true,
					companyTaxId: true,
					registrationNumber: true,
				},
			});

			return tenant || {};
		} catch (error) {
			console.error('Error getting tenant branding:', error);
			return {};
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

		items.forEach(item => {
			const quantity = parseFloat(item.quantity || '0');
			const price = parseFloat(item.price || '0');
			const vatRate = parseFloat(item.product_vat || '0');
			
			const itemTotal = quantity * price;
			const itemVat = (itemTotal * vatRate) / 100;
			
			subtotal += itemTotal;
			vatTotal += itemVat;
		});

		const grandTotal = subtotal + vatTotal;

		return {
			subtotal,
			vatTotal,
			grandTotal,
		};
	}

	/**
	 * Draw header section
	 */
	private static async drawHeader(
		page: any,
		invoiceData: any,
		tenantBranding: any,
		font: any,
		boldFont: any,
		primaryColor: any,
		textColor: any,
		translations: Record<string, string>
	): Promise<void> {
		const { width } = page.getSize();
		
		// Draw border line
		page.drawLine({
			start: { x: 50, y: 780 },
			end: { x: width - 50, y: 780 },
			thickness: 2,
			color: textColor,
		});

		// Company logo placeholder (circle with first letter)
		const companyInitial = (tenantBranding.name || 'C').charAt(0).toUpperCase();
		page.drawCircle({
			x: 60,
			y: 760,
			size: 20,
			borderColor: textColor,
			borderWidth: 2,
		});
		page.drawText(this.removeDiacritics(companyInitial), {
			x: 55,
			y: 750,
			size: 16,
			font: boldFont,
			color: textColor,
		});

		// Company name
		page.drawText(this.removeDiacritics(tenantBranding.name || 'Company Name'), {
			x: 100,
			y: 760,
			size: 20,
			font: boldFont,
			color: textColor,
		});
		page.drawText('Private Limited', {
			x: 100,
			y: 740,
			size: 12,
			font: font,
			color: textColor,
		});

		// Invoice title - right side
		page.drawText(this.removeDiacritics(translations.invoice || 'INVOICE'), {
			x: width - 200,
			y: 760,
			size: 32,
			font: boldFont,
			color: textColor,
		});

		// Invoice number and date
		const invoiceNumber = invoiceData.invoice?.invoice_series ? 
			`${invoiceData.invoice.invoice_series}-${invoiceData.invoice.invoice_number}` : 
			invoiceData.invoice?.invoice_number || 'N/A';
		
		page.drawText(`${this.removeDiacritics(translations.invoiceNumber || 'Invoice#')} ${this.removeDiacritics(invoiceNumber)}`, {
			x: width - 200,
			y: 730,
			size: 12,
			font: boldFont,
			color: textColor,
		});

		// Date
		const invoiceDate = new Date(invoiceData.invoice?.date || new Date()).toLocaleDateString();
		page.drawText(`${this.removeDiacritics(translations.date || 'Date')}: ${this.removeDiacritics(invoiceDate)}`, {
			x: width - 200,
			y: 715,
			size: 12,
			font: font,
			color: textColor,
		});

		// Total Due
		const totalAmount = invoiceData.invoice?.total_amount || 0;
		const currency = invoiceData.invoice?.base_currency || 'USD';
		const safeTotalAmount = typeof totalAmount === 'number' ? totalAmount : parseFloat(totalAmount) || 0;
		page.drawText(`Total Due: ${this.removeDiacritics(currency)} ${this.removeDiacritics(safeTotalAmount.toFixed(2))}`, {
			x: width - 200,
			y: 700,
			size: 14,
			font: boldFont,
			color: textColor,
		});

		// Draw bottom border line
		page.drawLine({
			start: { x: 50, y: 680 },
			end: { x: width - 50, y: 680 },
			thickness: 2,
			color: textColor,
		});
	}

	/**
	 * Draw company information
	 */
	private static async drawCompanyInfo(
		page: any,
		invoiceData: any,
		tenantBranding: any,
		font: any,
		boldFont: any,
		textColor: any,
		translations: Record<string, string>
	): Promise<void> {
		const y = 650;
		let currentY = y;

		page.drawText(`${this.removeDiacritics(translations.company || 'From')}:`, {
			x: 50,
			y: currentY,
			size: 12,
			font: boldFont,
			color: textColor,
		});

		currentY -= 20;
		page.drawText(this.removeDiacritics(tenantBranding.name || 'Company Name'), {
			x: 50,
			y: currentY,
			size: 12,
			font: boldFont,
			color: textColor,
		});

		if (tenantBranding.address) {
			currentY -= 15;
			page.drawText(this.removeDiacritics(tenantBranding.address), {
				x: 50,
				y: currentY,
				size: 10,
				font: font,
				color: textColor,
			});
		}

		if (tenantBranding.companyEmail) {
			currentY -= 15;
			page.drawText(this.removeDiacritics(tenantBranding.companyEmail), {
				x: 50,
				y: currentY,
				size: 10,
				font: font,
				color: textColor,
			});
		}

		if (tenantBranding.phone) {
			currentY -= 15;
			page.drawText(this.removeDiacritics(tenantBranding.phone), {
				x: 50,
				y: currentY,
				size: 10,
				font: font,
				color: textColor,
			});
		}
	}

	/**
	 * Draw customer information
	 */
	private static async drawCustomerInfo(
		page: any,
		invoiceData: any,
		font: any,
		boldFont: any,
		textColor: any,
		translations: Record<string, string>
	): Promise<void> {
		const { width } = page.getSize();
		const y = 650;
		let currentY = y;

		page.drawText(`${this.removeDiacritics(translations.customer || 'Bill To')}:`, {
			x: width - 200,
			y: currentY,
			size: 12,
			font: boldFont,
			color: textColor,
		});

		if (invoiceData.customer) {
			currentY -= 20;
			page.drawText(this.removeDiacritics(invoiceData.customer.customer_name || 'Customer Name'), {
				x: width - 200,
				y: currentY,
				size: 12,
				font: boldFont,
				color: textColor,
			});

			if (invoiceData.customer.customer_address) {
				currentY -= 15;
				page.drawText(this.removeDiacritics(invoiceData.customer.customer_address), {
					x: width - 200,
					y: currentY,
					size: 10,
					font: font,
					color: textColor,
				});
			}

			if (invoiceData.customer.customer_email) {
				currentY -= 15;
				page.drawText(this.removeDiacritics(invoiceData.customer.customer_email), {
					x: width - 200,
					y: currentY,
					size: 10,
					font: font,
					color: textColor,
				});
			}
		}
	}

	/**
	 * Draw invoice details
	 */
	private static async drawInvoiceDetails(
		page: any,
		invoiceData: any,
		font: any,
		boldFont: any,
		textColor: any,
		translations: Record<string, string>
	): Promise<void> {
		const y = 580;
		let currentY = y;

		// Invoice date
		page.drawText(`${this.removeDiacritics(translations.date || 'Invoice Date')}:`, {
			x: 50,
			y: currentY,
			size: 12,
			font: boldFont,
			color: textColor,
		});
		page.drawText(this.removeDiacritics(invoiceData.invoice?.date || 'N/A'), {
			x: 150,
			y: currentY,
			size: 12,
			font: font,
			color: textColor,
		});

		// Due date
		if (invoiceData.invoice?.due_date) {
			currentY -= 20;
			page.drawText(`${this.removeDiacritics(translations.dueDate || 'Due Date')}:`, {
				x: 50,
				y: currentY,
				size: 12,
				font: boldFont,
				color: textColor,
			});
			page.drawText(this.removeDiacritics(invoiceData.invoice.due_date), {
				x: 150,
				y: currentY,
				size: 12,
				font: font,
				color: textColor,
			});
		}

		// Payment terms
		if (invoiceData.invoice?.payment_terms) {
			currentY -= 20;
			page.drawText(`${this.removeDiacritics(translations.paymentTerms || 'Payment Terms')}:`, {
				x: 50,
				y: currentY,
				size: 12,
				font: boldFont,
				color: textColor,
			});
			page.drawText(this.removeDiacritics(invoiceData.invoice.payment_terms), {
				x: 150,
				y: currentY,
				size: 12,
				font: font,
				color: textColor,
			});
		}
	}

	/**
	 * Draw items table
	 */
	private static async drawItemsTable(
		page: any,
		invoiceData: any,
		font: any,
		boldFont: any,
		textColor: any,
		secondaryColor: any,
		translations: Record<string, string>
	): Promise<void> {
		const y = 500;
		const tableWidth = 500;
		const colWidths = [200, 80, 80, 60];

		// Table header background
		page.drawRectangle({
			x: 50,
			y: y - 30,
			width: tableWidth,
			height: 30,
			color: rgb(0.95, 0.95, 0.95),
		});

		// Table header border
		page.drawRectangle({
			x: 50,
			y: y - 30,
			width: tableWidth,
			height: 30,
			borderColor: textColor,
			borderWidth: 1,
		});

		const headers = [
			`${translations.item || 'ITEM'} ${translations.description || 'DESCRIPTION'}`,
			translations.unitPrice || 'PRICE',
			translations.quantity || 'QTY',
			translations.total || 'TOTAL'
		];
		let x = 50;
		headers.forEach((header, index) => {
			page.drawText(this.removeDiacritics(header), {
				x: x + 5,
				y: y - 20,
				size: 10,
				font: boldFont,
				color: textColor,
			});
			x += colWidths[index];
		});

		// Table rows
		let currentY = y - 50;
		invoiceData.items.forEach((item: any, index: number) => {
			// Draw row border
			page.drawRectangle({
				x: 50,
				y: currentY - 20,
				width: tableWidth,
				height: 20,
				borderColor: textColor,
				borderWidth: 1,
			});

			// Item data
			x = 50;
			const unitPrice = parseFloat(item.unit_price || '0') || 0;
			const quantity = parseFloat(item.quantity || '0') || 0;
			const itemData = [
				item.product_name || item.description || 'Item',
				`${unitPrice.toFixed(2)}`,
				item.quantity || '0',
				`${(quantity * unitPrice).toFixed(2)}`,
			];

			itemData.forEach((data, dataIndex) => {
				page.drawText(this.removeDiacritics(data), {
					x: x + 5,
					y: currentY - 10,
					size: 9,
					font: font,
					color: textColor,
				});
				x += colWidths[dataIndex];
			});

			currentY -= 20;
		});
	}

	/**
	 * Draw totals section
	 */
	private static async drawTotalsSection(
		page: any,
		invoiceData: any,
		font: any,
		boldFont: any,
		textColor: any,
		primaryColor: any,
		translations: Record<string, string>
	): Promise<void> {
		const { width } = page.getSize();
		const y = 200;
		let currentY = y;

		// Subtotal
		const safeSubtotal = typeof invoiceData.totals.subtotal === 'number' ? invoiceData.totals.subtotal : parseFloat(invoiceData.totals.subtotal) || 0;
		page.drawText(`${this.removeDiacritics(translations.subtotal || 'SUB TOTAL')}:`, {
			x: width - 200,
			y: currentY,
			size: 10,
			font: boldFont,
			color: textColor,
		});
		page.drawText(this.removeDiacritics(safeSubtotal.toFixed(2)), {
			x: width - 100,
			y: currentY,
			size: 10,
			font: font,
			color: textColor,
		});

		// VAT
		const safeVatTotal = typeof invoiceData.totals.vatTotal === 'number' ? invoiceData.totals.vatTotal : parseFloat(invoiceData.totals.vatTotal) || 0;
		if (safeVatTotal > 0) {
			currentY -= 15;
			page.drawText(`${this.removeDiacritics(translations.tax || 'Tax VAT 18%')}:`, {
				x: width - 200,
				y: currentY,
				size: 10,
				font: boldFont,
				color: textColor,
			});
			page.drawText(this.removeDiacritics(safeVatTotal.toFixed(2)), {
				x: width - 100,
				y: currentY,
				size: 10,
				font: font,
				color: textColor,
			});
		}

		// Discount
		currentY -= 15;
		const discount = safeSubtotal * 0.1;
		page.drawText('Discount 10%:', {
			x: width - 200,
			y: currentY,
			size: 10,
			font: boldFont,
			color: textColor,
		});
		page.drawText(`-${this.removeDiacritics(discount.toFixed(2))}`, {
			x: width - 100,
			y: currentY,
			size: 10,
			font: font,
			color: textColor,
		});

		// Grand total with border
		currentY -= 20;
		page.drawLine({
			start: { x: width - 200, y: currentY + 10 },
			end: { x: width - 50, y: currentY + 10 },
			thickness: 2,
			color: textColor,
		});
		currentY -= 20;
		
		const safeGrandTotal = typeof invoiceData.totals.grandTotal === 'number' ? invoiceData.totals.grandTotal : parseFloat(invoiceData.totals.grandTotal) || 0;
		page.drawText(`${this.removeDiacritics(translations.grandTotal || 'GRAND TOTAL')}:`, {
			x: width - 200,
			y: currentY,
			size: 14,
			font: boldFont,
			color: textColor,
		});
		page.drawText(this.removeDiacritics(safeGrandTotal.toFixed(2)), {
			x: width - 100,
			y: currentY,
			size: 14,
			font: boldFont,
			color: textColor,
		});
	}

	/**
	 * Draw footer
	 */
	private static async drawFooter(
		page: any,
		invoiceData: any,
		tenantBranding: any,
		font: any,
		textColor: any,
		secondaryColor: any,
		translations: Record<string, string>
	): Promise<void> {
		const y = 100;
		const { width } = page.getSize();

		// Footer line
		page.drawLine({
			start: { x: 50, y: y + 20 },
			end: { x: width - 50, y: y + 20 },
			thickness: 1,
			color: textColor,
		});

		// Left side - Payment and Contact
		let currentY = y;
		
		// Payment Method
		page.drawText('Payment Method:', {
			x: 50,
			y: currentY,
			size: 10,
			font: font,
			color: textColor,
		});
		currentY -= 15;
		page.drawText('Payment: Visa, Master Card', {
			x: 50,
			y: currentY,
			size: 9,
			font: font,
			color: textColor,
		});
		currentY -= 12;
		page.drawText('We accept Cheque', {
			x: 50,
			y: currentY,
			size: 9,
			font: font,
			color: textColor,
		});
		currentY -= 12;
		page.drawText(`Paypal: ${tenantBranding.companyEmail || 'paypal@company.com'}`, {
			x: 50,
			y: currentY,
			size: 9,
			font: font,
			color: textColor,
		});

		currentY -= 20;
		// Contact
		page.drawText('Contact:', {
			x: 50,
			y: currentY,
			size: 10,
			font: font,
			color: textColor,
		});
		currentY -= 15;
		page.drawText(tenantBranding.address || '123 Street, Town Postal, County', {
			x: 50,
			y: currentY,
			size: 9,
			font: font,
			color: textColor,
		});
		currentY -= 12;
		page.drawText(tenantBranding.phone || '+999 123 456 789', {
			x: 50,
			y: currentY,
			size: 9,
			font: font,
			color: textColor,
		});
		currentY -= 12;
		page.drawText(tenantBranding.companyEmail || 'info@yourname', {
			x: 50,
			y: currentY,
			size: 9,
			font: font,
			color: textColor,
		});
		currentY -= 12;
		page.drawText(tenantBranding.website || 'www.domainname.com', {
			x: 50,
			y: currentY,
			size: 9,
			font: font,
			color: textColor,
		});

		currentY -= 20;
		// Terms & Condition
		page.drawText('Terms & Condition:', {
			x: 50,
			y: currentY,
			size: 10,
			font: font,
			color: textColor,
		});
		currentY -= 15;
		page.drawText('Contrary to popular belief Lorem Ipsum not ipsum simply lorem ispum dolor ipsum.', {
			x: 50,
			y: currentY,
			size: 9,
			font: font,
			color: textColor,
		});

		// Right side - Signature
		page.drawText('Signature:', {
			x: width - 200,
			y: y,
			size: 10,
			font: font,
			color: textColor,
		});
		page.drawLine({
			start: { x: width - 200, y: y - 20 },
			end: { x: width - 100, y: y - 20 },
			thickness: 1,
			color: textColor,
		});
		page.drawText('Manager', {
			x: width - 200,
			y: y - 35,
			size: 9,
			font: font,
			color: textColor,
		});
	}

	/**
	 * Add watermark
	 */
	private static async addWatermark(
		page: any,
		tenantBranding: any,
		font: any,
		secondaryColor: any
	): Promise<void> {
		const { width, height } = page.getSize();
		
		page.drawText(this.removeDiacritics(tenantBranding.name || 'CONFIDENTIAL'), {
			x: width / 2 - 50,
			y: height / 2,
			size: 48,
			font: font,
			color: rgb(0.9, 0.9, 0.9),
			rotate: { type: 'degrees', angle: -45 },
		});
	}

	/**
	 * Add QR code (placeholder - implement with actual QR code library)
	 */
	private static async addQRCode(page: any, invoiceData: any, width: number, height: number): Promise<void> {
		// Placeholder for QR code implementation
		// You would use a QR code library like 'qrcode' here
		page.drawText('QR Code', {
			x: width - 100,
			y: 50,
			size: 10,
			font: await page.doc.embedFont('Helvetica'),
			color: rgb(0.5, 0.5, 0.5),
		});
	}

	/**
	 * Add barcode (placeholder - implement with actual barcode library)
	 */
	private static async addBarcode(page: any, invoiceData: any, width: number, height: number): Promise<void> {
		// Placeholder for barcode implementation
		// You would use a barcode library like 'jsbarcode' here
		page.drawText('Barcode', {
			x: 50,
			y: 50,
			size: 10,
			font: await page.doc.embedFont('Helvetica'),
			color: rgb(0.5, 0.5, 0.5),
		});
	}

	/**
	 * Send email (implement based on your email service)
	 */
	private static async sendEmail(emailOptions: EmailOptions): Promise<boolean> {
		try {
			// Implement email sending logic here
			// This could use services like SendGrid, AWS SES, Nodemailer, etc.
			console.log('Sending email:', emailOptions);
			
			// Placeholder implementation
			return true;
		} catch (error) {
			console.error('Error sending email:', error);
			return false;
		}
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
			tax: 'Tax VAT 18%',
			grandTotal: 'GRAND TOTAL',
			paymentTerms: 'Payment Terms',
			paymentMethod: 'Payment Method',
			notes: 'Notes',
			thankYou: 'Thank you for your business!',
			page: 'Page',
			of: 'of',
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
				paymentMethod: 'Metoda de Plata',
				notes: 'Note',
				thankYou: 'Va multumim pentru incredere!',
				page: 'Pagina',
				of: 'din',
				item: 'Produs',
				unitOfMeasure: 'U.M.',
				vatRate: 'TVA %',
				vatAmount: 'Valoare TVA',
				lineTotal: 'Total linie',
				subtotalExclVat: 'Subtotal (fara TVA)',
				vatTotal: 'Total TVA',
				grandTotalInclVat: 'TOTAL GENERAL (cu TVA)',
				paymentInformation: 'INFORMATII DE PLATA',
				legalNotices: 'AVIZE LEGALE',
				termsAndConditions: 'Termeni si Conditii',
				signature: 'Semnatura',
				manager: 'Manager',
				contact: 'Contact',
				from: 'De la',
				billTo: 'Facturat catre',
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
				paymentMethod: 'Metodo de Pago',
				notes: 'Notas',
				thankYou: '¡Gracias por su confianza!',
				page: 'Pagina',
				of: 'de',
				item: 'Articulo',
				unitOfMeasure: 'U.M.',
				vatRate: 'IVA %',
				vatAmount: 'Valor IVA',
				lineTotal: 'Total linea',
				subtotalExclVat: 'Subtotal (sin IVA)',
				vatTotal: 'Total IVA',
				grandTotalInclVat: 'TOTAL GENERAL (con IVA)',
				paymentInformation: 'INFORMACION DE PAGO',
				legalNotices: 'AVISOS LEGALES',
				termsAndConditions: 'Terminos y Condiciones',
				signature: 'Firma',
				manager: 'Gerente',
				contact: 'Contacto',
				from: 'De',
				billTo: 'Facturar a',
			},
			fr: {
				invoice: 'FACTURE',
				invoiceNumber: 'Facture#',
				date: 'Date',
				dueDate: 'Date d\'Echeance',
				customer: 'Facturer a',
				company: 'De',
				description: 'Description',
				quantity: 'QUANTITE',
				unitPrice: 'PRIX',
				total: 'TOTAL',
				subtotal: 'SOUS-TOTAL',
				tax: 'TVA 18%',
				grandTotal: 'TOTAL GENERAL',
				paymentTerms: 'Conditions de Paiement',
				paymentMethod: 'Methode de Paiement',
				notes: 'Notes',
				thankYou: 'Merci pour votre confiance!',
				page: 'Page',
				of: 'de',
				item: 'Article',
				unitOfMeasure: 'U.M.',
				vatRate: 'TVA %',
				vatAmount: 'Valeur TVA',
				lineTotal: 'Total ligne',
				subtotalExclVat: 'Sous-total (sans TVA)',
				vatTotal: 'Total TVA',
				grandTotalInclVat: 'TOTAL GENERAL (avec TVA)',
				paymentInformation: 'INFORMATIONS PAIEMENT',
				legalNotices: 'AVIS LEGAUX',
				termsAndConditions: 'Termes et Conditions',
				signature: 'Signature',
				manager: 'Manager',
				contact: 'Contact',
				from: 'De',
				billTo: 'Facturer a',
			},
			de: {
				invoice: 'RECHNUNG',
				invoiceNumber: 'Rechnung#',
				date: 'Datum',
				dueDate: 'Fälligkeitsdatum',
				customer: 'Rechnung an',
				company: 'Von',
				description: 'Beschreibung',
				quantity: 'MENGE',
				unitPrice: 'PREIS',
				total: 'GESAMT',
				subtotal: 'ZWISCHENSUMME',
				tax: 'MwSt 18%',
				grandTotal: 'GESAMTSUMME',
				paymentTerms: 'Zahlungsbedingungen',
				paymentMethod: 'Zahlungsmethode',
				notes: 'Notizen',
				thankYou: 'Vielen Dank für Ihr Vertrauen!',
				page: 'Seite',
				of: 'von',
				item: 'Artikel',
				unitOfMeasure: 'Einh.',
				vatRate: 'MwSt %',
				vatAmount: 'MwSt-Wert',
				lineTotal: 'Zeilen-Summe',
				subtotalExclVat: 'Zwischensumme (ohne MwSt)',
				vatTotal: 'MwSt-Gesamt',
				grandTotalInclVat: 'GESAMTSUMME (mit MwSt)',
				paymentInformation: 'ZAHLUNGSINFORMATIONEN',
				legalNotices: 'RECHTLICHE HINWEISE',
				termsAndConditions: 'Geschäftsbedingungen',
				signature: 'Unterschrift',
				manager: 'Manager',
				contact: 'Kontakt',
				from: 'Von',
				billTo: 'Rechnung an',
			},
			zh: {
				invoice: '发票',
				invoiceNumber: '发票#',
				date: '日期',
				dueDate: '到期日期',
				customer: '开票给',
				company: '来自',
				description: '描述',
				quantity: '数量',
				unitPrice: '价格',
				total: '总计',
				subtotal: '小计',
				tax: '增值税 18%',
				grandTotal: '总金额',
				paymentTerms: '付款条件',
				paymentMethod: '付款方式',
				notes: '备注',
				thankYou: '感谢您的信任！',
				page: '页',
				of: '共',
				item: '商品',
				unitOfMeasure: '单位',
				vatRate: '增值税%',
				vatAmount: '增值税额',
				lineTotal: '行总计',
				subtotalExclVat: '小计（不含增值税）',
				vatTotal: '增值税总计',
				grandTotalInclVat: '总金额（含增值税）',
				paymentInformation: '付款信息',
				legalNotices: '法律声明',
				termsAndConditions: '条款和条件',
				signature: '签名',
				manager: '经理',
				contact: '联系方式',
				from: '来自',
				billTo: '开票给',
			},
			ru: {
				invoice: 'СЧЕТ-ФАКТУРА',
				invoiceNumber: 'Счет#',
				date: 'Дата',
				dueDate: 'Дата Платежа',
				customer: 'Счет Выставлен',
				company: 'От',
				description: 'Описание',
				quantity: 'КОЛИЧЕСТВО',
				unitPrice: 'ЦЕНА',
				total: 'ИТОГО',
				subtotal: 'ПРОМЕЖУТОЧНЫЙ ИТОГ',
				tax: 'НДС 18%',
				grandTotal: 'ОБЩИЙ ИТОГ',
				paymentTerms: 'Условия Оплаты',
				paymentMethod: 'Способ Оплаты',
				notes: 'Примечания',
				thankYou: 'Спасибо за доверие!',
				page: 'Страница',
				of: 'из',
				item: 'Товар',
				unitOfMeasure: 'Ед.',
				vatRate: 'НДС %',
				vatAmount: 'Сумма НДС',
				lineTotal: 'Итого по строке',
				subtotalExclVat: 'Промежуточный итог (без НДС)',
				vatTotal: 'Итого НДС',
				grandTotalInclVat: 'ОБЩИЙ ИТОГ (с НДС)',
				paymentInformation: 'ИНФОРМАЦИЯ О ПЛАТЕЖЕ',
				legalNotices: 'ПРАВОВЫЕ УВЕДОМЛЕНИЯ',
				termsAndConditions: 'Условия и Положения',
				signature: 'Подпись',
				manager: 'Менеджер',
				contact: 'Контакт',
				from: 'От',
				billTo: 'Счет Выставлен',
			},
		};

		// Return translations for the specified language or default to English
		return { ...translations, ...(languageTranslations[language] || {}) };
	}

	/**
	 * Log email sending
	 */
	private static async logEmailSent(
		options: PDFGenerationOptions,
		emailOptions: EmailOptions,
		success: boolean
	): Promise<void> {
		try {
			await prisma.invoiceAuditLog.create({
				data: {
					tenantId: parseInt(options.tenantId),
					databaseId: options.databaseId,
					invoiceId: options.invoiceId || 0,
					action: 'email_sent',
					metadata: {
						recipients: emailOptions.to,
						subject: emailOptions.subject,
						status: success ? 'success' : 'error',
					},
				},
			});
		} catch (error) {
			console.error('Error logging email sent:', error);
		}
	}
}
