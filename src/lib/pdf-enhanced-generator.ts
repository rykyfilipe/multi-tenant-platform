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
	 * Handle Unicode text for PDF generation
	 * This function ensures text is properly encoded for PDF display
	 */
	private static handleUnicodeText(text: any): string {
		if (!text) return '';
		
		// Convert to string if not already
		const textStr = String(text);
		
		// For languages that use non-Latin characters, we need to handle them specially
		// This is a temporary solution until we implement proper Unicode font support
		const hasNonLatinChars = /[^\u0000-\u007F]/.test(textStr);
		
		if (hasNonLatinChars) {
			// For now, replace problematic characters with safe alternatives
			// This is a temporary workaround until we implement proper Unicode font support
			return textStr
				.replace(/[^\u0000-\u007F]/g, '?') // Replace non-ASCII characters with ?
				.replace(/\?+/g, '?'); // Replace multiple ? with single ?
		}
		
		return textStr;
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

			// Load fonts - use TimesRoman for better Unicode support
			let font, boldFont;
			try {
				font = await pdfDoc.embedFont(StandardFonts.TimesRoman);
				boldFont = await pdfDoc.embedFont(StandardFonts.TimesRomanBold);
			} catch (error) {
				console.warn('Failed to load TimesRoman fonts, falling back to Helvetica:', error);
				font = await pdfDoc.embedFont(StandardFonts.Helvetica);
				boldFont = await pdfDoc.embedFont(StandardFonts.HelveticaBold);
			}

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
	 * Draw header section (matching HTML preview)
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
		const margin = 50;
		
		// Draw header border line (matching HTML preview)
		page.drawLine({
			start: { x: margin, y: 780 },
			end: { x: width - margin, y: 780 },
			thickness: 2,
			color: rgb(0.8, 0.8, 0.8),
		});

		// Company logo placeholder (matching HTML preview style)
		const companyInitial = (tenantBranding.name || 'C').charAt(0).toUpperCase();
		// Draw a 3x3 grid pattern like in HTML preview
		const gridSize = 6;
		const spacing = 2;
		const positions = [
			{ row: 0, col: 0 }, { row: 0, col: 1 }, { row: 0, col: 2 },
			{ row: 1, col: 0 }, { row: 1, col: 2 },
			{ row: 2, col: 0 }, { row: 2, col: 1 }, { row: 2, col: 2 }
		];
		
		positions.forEach(pos => {
			const squareX = margin + pos.col * (gridSize + spacing);
			const squareY = 760 - pos.row * (gridSize + spacing);
			
			page.drawRectangle({
				x: squareX,
				y: squareY,
				width: gridSize,
				height: gridSize,
				color: rgb(0, 0, 0),
			});
		});

		// Company name and details (matching HTML preview layout)
		page.drawText(this.handleUnicodeText(tenantBranding.name || 'Company Name'), {
			x: margin + 60,
			y: 760,
			size: 20,
			font: boldFont,
			color: rgb(0.1, 0.1, 0.1),
		});
		page.drawText('Private Limited', {
			x: margin + 60,
			y: 740,
			size: 12,
			font: font,
			color: rgb(0.4, 0.4, 0.4),
		});

		// Invoice title - right side (matching HTML preview)
		page.drawText(this.handleUnicodeText(translations.invoice || 'INVOICE'), {
			x: width - 200,
			y: 760,
			size: 32,
			font: boldFont,
			color: rgb(0.1, 0.1, 0.1),
		});

		// Invoice number and date (matching HTML preview)
		const invoiceNumber = invoiceData.invoice?.invoice_series ? 
			`${invoiceData.invoice.invoice_series}-${invoiceData.invoice.invoice_number}` : 
			invoiceData.invoice?.invoice_number || 'N/A';
		
		page.drawText(`${this.handleUnicodeText(translations.invoiceNumber || 'Invoice#')} ${this.handleUnicodeText(invoiceNumber)}`, {
			x: width - 200,
			y: 730,
			size: 12,
			font: boldFont,
			color: rgb(0.2, 0.2, 0.2),
		});

		// Date
		const invoiceDate = new Date(invoiceData.invoice?.date || new Date()).toLocaleDateString();
		page.drawText(`${this.handleUnicodeText(translations.date || 'Date')}: ${this.handleUnicodeText(invoiceDate)}`, {
			x: width - 200,
			y: 715,
			size: 12,
			font: font,
			color: rgb(0.4, 0.4, 0.4),
		});

		// Total Due (matching HTML preview)
		const totalAmount = invoiceData.invoice?.total_amount || 0;
		const currency = invoiceData.invoice?.base_currency || 'USD';
		const safeTotalAmount = typeof totalAmount === 'number' ? totalAmount : parseFloat(totalAmount) || 0;
		page.drawText(`Total Due: ${this.handleUnicodeText(currency)} ${this.handleUnicodeText(safeTotalAmount.toFixed(2))}`, {
			x: width - 200,
			y: 700,
			size: 14,
			font: boldFont,
			color: rgb(0.1, 0.1, 0.1),
		});

		// Draw bottom border line (matching HTML preview)
		page.drawLine({
			start: { x: margin, y: 680 },
			end: { x: width - margin, y: 680 },
			thickness: 2,
			color: rgb(0.8, 0.8, 0.8),
		});
	}

	/**
	 * Draw company information (matching HTML preview)
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
		const margin = 50;

		page.drawText(`${this.handleUnicodeText(translations.company || 'From')}:`, {
			x: margin,
			y: currentY,
			size: 12,
			font: boldFont,
			color: rgb(0.4, 0.4, 0.4),
		});

		currentY -= 20;
		page.drawText(this.handleUnicodeText(tenantBranding.name || 'Company Name'), {
			x: margin,
			y: currentY,
			size: 12,
			font: boldFont,
			color: rgb(0.1, 0.1, 0.1),
		});

		if (tenantBranding.address) {
			currentY -= 15;
			page.drawText(this.handleUnicodeText(tenantBranding.address), {
				x: margin,
				y: currentY,
				size: 10,
				font: font,
				color: rgb(0.4, 0.4, 0.4),
			});
		}

		// Company city, postal code, country
		const addressParts = [
			tenantBranding.companyPostalCode,
			tenantBranding.companyCity,
			tenantBranding.companyCountry
		].filter(Boolean);
		
		if (addressParts.length > 0) {
			currentY -= 15;
			page.drawText(this.handleUnicodeText(addressParts.join(', ')), {
				x: margin,
				y: currentY,
				size: 10,
				font: font,
				color: rgb(0.4, 0.4, 0.4),
			});
		}

		if (tenantBranding.companyEmail) {
			currentY -= 15;
			page.drawText(this.handleUnicodeText(tenantBranding.companyEmail), {
				x: margin,
				y: currentY,
				size: 10,
				font: font,
				color: rgb(0.4, 0.4, 0.4),
			});
		}

		if (tenantBranding.phone) {
			currentY -= 15;
			page.drawText(this.handleUnicodeText(tenantBranding.phone), {
				x: margin,
				y: currentY,
				size: 10,
				font: font,
				color: rgb(0.4, 0.4, 0.4),
			});
		}

		if (tenantBranding.website) {
			currentY -= 15;
			page.drawText(this.handleUnicodeText(tenantBranding.website), {
				x: margin,
				y: currentY,
				size: 10,
				font: font,
				color: rgb(0.4, 0.4, 0.4),
			});
		}

		if (tenantBranding.companyTaxId) {
			currentY -= 15;
			page.drawText(`Tax ID: ${this.handleUnicodeText(tenantBranding.companyTaxId)}`, {
				x: margin,
				y: currentY,
				size: 10,
				font: font,
				color: rgb(0.4, 0.4, 0.4),
			});
		}

		if (tenantBranding.registrationNumber) {
			currentY -= 15;
			page.drawText(`Reg. No: ${this.handleUnicodeText(tenantBranding.registrationNumber)}`, {
				x: margin,
				y: currentY,
				size: 10,
				font: font,
				color: rgb(0.4, 0.4, 0.4),
			});
		}
	}

	/**
	 * Draw customer information (matching HTML preview)
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
		const rightX = width - 200;

		page.drawText(`${this.handleUnicodeText(translations.customer || 'Bill To')}:`, {
			x: rightX,
			y: currentY,
			size: 12,
			font: boldFont,
			color: rgb(0.4, 0.4, 0.4),
		});

		if (invoiceData.customer) {
			currentY -= 20;
			page.drawText(this.handleUnicodeText(invoiceData.customer.customer_name || 'Customer Name'), {
				x: rightX,
				y: currentY,
				size: 12,
				font: boldFont,
				color: rgb(0.1, 0.1, 0.1),
			});

			if (invoiceData.customer.customer_address) {
				currentY -= 15;
				page.drawText(this.handleUnicodeText(invoiceData.customer.customer_address), {
					x: rightX,
					y: currentY,
					size: 10,
					font: font,
					color: rgb(0.4, 0.4, 0.4),
				});
			}

			if (invoiceData.customer.customer_email) {
				currentY -= 15;
				page.drawText(this.handleUnicodeText(invoiceData.customer.customer_email), {
					x: rightX,
					y: currentY,
					size: 10,
					font: font,
					color: rgb(0.4, 0.4, 0.4),
				});
			}

			if (invoiceData.customer.customer_phone) {
				currentY -= 15;
				page.drawText(this.handleUnicodeText(invoiceData.customer.customer_phone), {
					x: rightX,
					y: currentY,
					size: 10,
					font: font,
					color: rgb(0.4, 0.4, 0.4),
				});
			}
		}
	}

	/**
	 * Draw invoice details (matching HTML preview)
	 */
	private static async drawInvoiceDetails(
		page: any,
		invoiceData: any,
		font: any,
		boldFont: any,
		textColor: any,
		translations: Record<string, string>
	): Promise<void> {
		const { width } = page.getSize();
		const margin = 50;
		const y = 580;
		let currentY = y;
		const leftX = margin;
		const rightX = margin + 200;
		const farRightX = margin + 400;

		// Invoice Details section (matching HTML preview layout)
		// Invoice Date (Left)
		page.drawText(`${this.handleUnicodeText(translations.date || 'Invoice Date')}:`, {
			x: leftX,
			y: currentY,
			size: 12,
			font: boldFont,
			color: rgb(0.4, 0.4, 0.4),
		});
		page.drawText(this.handleUnicodeText(invoiceData.invoice?.date || 'N/A'), {
			x: leftX + 120,
			y: currentY,
			size: 12,
			font: font,
			color: rgb(0.1, 0.1, 0.1),
		});

		// Due Date (Middle)
		if (invoiceData.invoice?.due_date) {
			page.drawText(`${this.handleUnicodeText(translations.dueDate || 'Due Date')}:`, {
				x: rightX,
				y: currentY,
				size: 12,
				font: boldFont,
				color: rgb(0.4, 0.4, 0.4),
			});
			page.drawText(this.handleUnicodeText(invoiceData.invoice.due_date), {
				x: rightX + 120,
				y: currentY,
				size: 12,
				font: font,
				color: rgb(0.1, 0.1, 0.1),
			});
		}

		// Payment Terms (Right)
		if (invoiceData.invoice?.payment_terms) {
			page.drawText(`${this.handleUnicodeText(translations.paymentTerms || 'Payment Terms')}:`, {
				x: farRightX,
				y: currentY,
				size: 12,
				font: boldFont,
				color: rgb(0.4, 0.4, 0.4),
			});
			page.drawText(this.handleUnicodeText(invoiceData.invoice.payment_terms), {
				x: farRightX + 120,
				y: currentY,
				size: 12,
				font: font,
				color: rgb(0.1, 0.1, 0.1),
			});
		}

		// Draw bottom border line (matching HTML preview)
		page.drawLine({
			start: { x: margin, y: currentY - 30 },
			end: { x: width - margin, y: currentY - 30 },
			thickness: 1,
			color: rgb(0.8, 0.8, 0.8),
		});
	}

	/**
	 * Draw items table (matching HTML preview)
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
		const { width } = page.getSize();
		const margin = 50;
		const y = 500;
		const tableWidth = width - 2 * margin;
		const colWidths = [300, 80, 60, 80];

		// Table header background (matching HTML preview)
		page.drawRectangle({
			x: margin,
			y: y - 30,
			width: tableWidth,
			height: 30,
			color: rgb(0.95, 0.95, 0.95),
		});

		// Table header border (matching HTML preview)
		page.drawRectangle({
			x: margin,
			y: y - 30,
			width: tableWidth,
			height: 30,
			borderColor: rgb(0.8, 0.8, 0.8),
			borderWidth: 1,
		});

		const headers = [
			`${translations.item || 'ITEM'} ${translations.description || 'DESCRIPTION'}`,
			translations.unitPrice || 'PRICE',
			translations.quantity || 'QTY',
			translations.total || 'TOTAL'
		];
		let x = margin;
		headers.forEach((header, index) => {
			page.drawText(this.handleUnicodeText(header), {
				x: x + 5,
				y: y - 20,
				size: 10,
				font: boldFont,
				color: rgb(0.4, 0.4, 0.4),
			});
			x += colWidths[index];
		});

		// Table rows (matching HTML preview)
		let currentY = y - 50;
		invoiceData.items.forEach((item: any, index: number) => {
			// Draw row border
			page.drawRectangle({
				x: margin,
				y: currentY - 20,
				width: tableWidth,
				height: 20,
				borderColor: rgb(0.8, 0.8, 0.8),
				borderWidth: 1,
			});

			// Item data
			x = margin;
			const unitPrice = parseFloat(item.unit_price || '0') || 0;
			const quantity = parseFloat(item.quantity || '0') || 0;
			const currency = item.currency || invoiceData.invoice?.base_currency || 'USD';
			const itemData = [
				item.product_name || item.description || 'Item',
				`${currency} ${unitPrice.toFixed(2)}`,
				item.quantity || '0',
				`${currency} ${(quantity * unitPrice).toFixed(2)}`,
			];

			itemData.forEach((data, dataIndex) => {
				page.drawText(this.handleUnicodeText(data), {
					x: x + 5,
					y: currentY - 10,
					size: 9,
					font: dataIndex === 0 || dataIndex === 3 ? boldFont : font,
					color: rgb(0.1, 0.1, 0.1),
				});
				x += colWidths[dataIndex];
			});

			currentY -= 20;
		});
	}

	/**
	 * Draw totals section (matching HTML preview)
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
		const margin = 50;
		const y = 200;
		let currentY = y;
		const totalsWidth = 200;
		const totalsX = width - totalsWidth - margin;
		const currency = invoiceData.invoice?.base_currency || 'USD';

		// Subtotal (matching HTML preview)
		const safeSubtotal = typeof invoiceData.totals.subtotal === 'number' ? invoiceData.totals.subtotal : parseFloat(invoiceData.totals.subtotal) || 0;
		page.drawText(`${this.handleUnicodeText(translations.subtotal || 'SUB TOTAL')}:`, {
			x: totalsX,
			y: currentY,
			size: 10,
			font: boldFont,
			color: rgb(0.4, 0.4, 0.4),
		});
		page.drawText(`${this.handleUnicodeText(currency)} ${this.handleUnicodeText(safeSubtotal.toFixed(2))}`, {
			x: totalsX + 120,
			y: currentY,
			size: 10,
			font: font,
			color: rgb(0.1, 0.1, 0.1),
		});

		// VAT (matching HTML preview)
		const safeVatTotal = typeof invoiceData.totals.vatTotal === 'number' ? invoiceData.totals.vatTotal : parseFloat(invoiceData.totals.vatTotal) || 0;
		if (safeVatTotal > 0) {
			currentY -= 20;
			const vatRate = invoiceData.totals.vatRate || 0;
			const vatLabel = vatRate > 0 ? `${translations.tax || 'Tax VAT'} ${vatRate}%` : (translations.tax || 'Tax VAT');
			page.drawText(`${this.handleUnicodeText(vatLabel)}:`, {
				x: totalsX,
				y: currentY,
				size: 10,
				font: boldFont,
				color: rgb(0.4, 0.4, 0.4),
			});
			page.drawText(`${this.handleUnicodeText(currency)} ${this.handleUnicodeText(safeVatTotal.toFixed(2))}`, {
				x: totalsX + 120,
				y: currentY,
				size: 10,
				font: font,
				color: rgb(0.1, 0.1, 0.1),
			});
		}

		// Discount (only show if discount amount > 0) - matching HTML preview
		const discountAmount = invoiceData.totals.discountAmount || 0;
		if (discountAmount > 0) {
			currentY -= 20;
			const discountRate = invoiceData.totals.discountRate || 0;
			const discountLabel = discountRate > 0 ? `Discount ${discountRate}%` : 'Discount';
			page.drawText(`${this.handleUnicodeText(discountLabel)}:`, {
				x: totalsX,
				y: currentY,
				size: 10,
				font: boldFont,
				color: rgb(0.4, 0.4, 0.4),
			});
			page.drawText(`-${this.handleUnicodeText(currency)} ${this.handleUnicodeText(discountAmount.toFixed(2))}`, {
				x: totalsX + 120,
				y: currentY,
				size: 10,
				font: font,
				color: rgb(0.8, 0.2, 0.2),
			});
		}

		// Grand total with border (matching HTML preview)
		currentY -= 20;
		page.drawLine({
			start: { x: totalsX, y: currentY + 10 },
			end: { x: totalsX + totalsWidth, y: currentY + 10 },
			thickness: 2,
			color: rgb(0.8, 0.8, 0.8),
		});
		currentY -= 20;
		
		const safeGrandTotal = typeof invoiceData.totals.grandTotal === 'number' ? invoiceData.totals.grandTotal : parseFloat(invoiceData.totals.grandTotal) || 0;
		page.drawText(`${this.handleUnicodeText(translations.grandTotal || 'GRAND TOTAL')}:`, {
			x: totalsX,
			y: currentY,
			size: 14,
			font: boldFont,
			color: rgb(0.1, 0.1, 0.1),
		});
		page.drawText(`${this.handleUnicodeText(currency)} ${this.handleUnicodeText(safeGrandTotal.toFixed(2))}`, {
			x: totalsX + 120,
			y: currentY,
			size: 14,
			font: boldFont,
			color: rgb(0.1, 0.1, 0.1),
		});
	}

	/**
	 * Draw footer (matching HTML preview)
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
		const margin = 50;

		// Footer line (matching HTML preview)
		page.drawLine({
			start: { x: margin, y: y + 20 },
			end: { x: width - margin, y: y + 20 },
			thickness: 1,
			color: rgb(0.8, 0.8, 0.8),
		});

		// Left side - Payment and Contact (matching HTML preview)
		let currentY = y;
		
		// Payment Method
		page.drawText(this.handleUnicodeText(translations.paymentMethod || 'Payment Method:'), {
			x: margin,
			y: currentY,
			size: 10,
			font: font,
			color: rgb(0.4, 0.4, 0.4),
		});
		currentY -= 15;
		page.drawText(this.handleUnicodeText(translations.paymentMethods || 'Payment: Visa, Master Card'), {
			x: margin,
			y: currentY,
			size: 9,
			font: font,
			color: rgb(0.4, 0.4, 0.4),
		});
		currentY -= 12;
		page.drawText(this.handleUnicodeText(translations.acceptCheque || 'We accept Cheque'), {
			x: margin,
			y: currentY,
			size: 9,
			font: font,
			color: rgb(0.4, 0.4, 0.4),
		});
		if (tenantBranding.companyIban) {
			currentY -= 12;
			page.drawText(`IBAN: ${this.handleUnicodeText(tenantBranding.companyIban)}`, {
				x: margin,
				y: currentY,
				size: 9,
				font: font,
				color: rgb(0.4, 0.4, 0.4),
			});
		}
		if (tenantBranding.companyBank) {
			currentY -= 12;
			page.drawText(`Bank: ${this.handleUnicodeText(tenantBranding.companyBank)}`, {
				x: margin,
				y: currentY,
				size: 9,
				font: font,
				color: rgb(0.4, 0.4, 0.4),
			});
		}
		currentY -= 12;
		page.drawText(`Paypal: ${tenantBranding.companyEmail || 'paypal@company.com'}`, {
			x: margin,
			y: currentY,
			size: 9,
			font: font,
			color: rgb(0.4, 0.4, 0.4),
		});

		currentY -= 20;
		// Contact (matching HTML preview)
		page.drawText(this.handleUnicodeText(translations.contact || 'Contact:'), {
			x: margin,
			y: currentY,
			size: 10,
			font: font,
			color: rgb(0.4, 0.4, 0.4),
		});
		currentY -= 15;
		page.drawText(tenantBranding.address || '123 Street, Town Postal, County', {
			x: margin,
			y: currentY,
			size: 9,
			font: font,
			color: rgb(0.4, 0.4, 0.4),
		});
		currentY -= 12;
		page.drawText(tenantBranding.phone || '+999 123 456 789', {
			x: margin,
			y: currentY,
			size: 9,
			font: font,
			color: rgb(0.4, 0.4, 0.4),
		});
		currentY -= 12;
		page.drawText(tenantBranding.companyEmail || 'info@yourname', {
			x: margin,
			y: currentY,
			size: 9,
			font: font,
			color: rgb(0.4, 0.4, 0.4),
		});
		currentY -= 12;
		page.drawText(tenantBranding.website || 'www.domainname.com', {
			x: margin,
			y: currentY,
			size: 9,
			font: font,
			color: rgb(0.4, 0.4, 0.4),
		});

		currentY -= 20;
		// Terms & Condition (matching HTML preview)
		page.drawText(this.handleUnicodeText(translations.termsAndConditions || 'Terms & Condition:'), {
			x: margin,
			y: currentY,
			size: 10,
			font: font,
			color: rgb(0.4, 0.4, 0.4),
		});
		currentY -= 15;
		page.drawText(this.handleUnicodeText(translations.termsText || 'Contrary to popular belief Lorem Ipsum not ipsum simply lorem ispum dolor ipsum.'), {
			x: margin,
			y: currentY,
			size: 9,
			font: font,
			color: rgb(0.4, 0.4, 0.4),
		});

		// Right side - Signature (matching HTML preview)
		page.drawText(this.handleUnicodeText(translations.signature || 'Signature:'), {
			x: width - 200,
			y: y,
			size: 10,
			font: font,
			color: rgb(0.4, 0.4, 0.4),
		});
		page.drawLine({
			start: { x: width - 200, y: y - 20 },
			end: { x: width - 100, y: y - 20 },
			thickness: 2,
			color: rgb(0.6, 0.6, 0.6),
		});
		page.drawText(this.handleUnicodeText(translations.manager || 'Manager'), {
			x: width - 200,
			y: y - 35,
			size: 9,
			font: font,
			color: rgb(0.1, 0.1, 0.1),
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
		
		page.drawText(this.handleUnicodeText(tenantBranding.name || 'CONFIDENTIAL'), {
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
			tax: 'Tax VAT',
			grandTotal: 'GRAND TOTAL',
			paymentTerms: 'Payment Terms',
			paymentMethod: 'Payment Method',
			paymentMethods: 'Payment: Visa, Master Card',
			acceptCheque: 'We accept Cheque',
			contact: 'Contact',
			termsAndConditions: 'Terms & Condition',
			termsText: 'Please refer to our terms and conditions for detailed information.',
			signature: 'Signature',
			manager: 'Manager',
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
