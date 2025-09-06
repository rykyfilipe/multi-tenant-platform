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
			await this.drawHeader(page, invoiceData, tenantBranding, font, boldFont, primaryColor, textColor);

			// Company and customer information
			await this.drawCompanyInfo(page, invoiceData, tenantBranding, font, boldFont, textColor);
			await this.drawCustomerInfo(page, invoiceData, font, boldFont, textColor);

			// Invoice details
			await this.drawInvoiceDetails(page, invoiceData, font, boldFont, textColor);

			// Items table
			await this.drawItemsTable(page, invoiceData, font, boldFont, textColor, secondaryColor);

			// Totals section
			await this.drawTotalsSection(page, invoiceData, font, boldFont, textColor, primaryColor);

			// Footer
			await this.drawFooter(page, invoiceData, tenantBranding, font, textColor, secondaryColor);

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
							value: options.invoiceId.toString(),
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
					logo: true,
					website: true,
					phone: true,
					vatNumber: true,
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
		textColor: any
	): Promise<void> {
		const { width } = page.getSize();
		
		// Company logo and name
		page.drawText(tenantBranding.name || 'Company Name', {
			x: 50,
			y: 750,
			size: 24,
			font: boldFont,
			color: primaryColor,
		});

		// Invoice title
		page.drawText('INVOICE', {
			x: width - 150,
			y: 750,
			size: 28,
			font: boldFont,
			color: primaryColor,
		});

		// Invoice number
		page.drawText(`Invoice #: ${invoiceData.invoice?.invoice_number || 'N/A'}`, {
			x: width - 150,
			y: 720,
			size: 12,
			font: font,
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
		textColor: any
	): Promise<void> {
		const y = 680;
		let currentY = y;

		page.drawText('From:', {
			x: 50,
			y: currentY,
			size: 14,
			font: boldFont,
			color: textColor,
		});

		currentY -= 20;
		page.drawText(tenantBranding.name || 'Company Name', {
			x: 50,
			y: currentY,
			size: 12,
			font: font,
			color: textColor,
		});

		if (tenantBranding.address) {
			currentY -= 15;
			page.drawText(tenantBranding.address, {
				x: 50,
				y: currentY,
				size: 10,
				font: font,
				color: textColor,
			});
		}

		if (tenantBranding.companyEmail) {
			currentY -= 15;
			page.drawText(tenantBranding.companyEmail, {
				x: 50,
				y: currentY,
				size: 10,
				font: font,
				color: textColor,
			});
		}

		if (tenantBranding.phone) {
			currentY -= 15;
			page.drawText(tenantBranding.phone, {
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
		textColor: any
	): Promise<void> {
		const { width } = page.getSize();
		const y = 680;
		let currentY = y;

		page.drawText('Bill To:', {
			x: width - 200,
			y: currentY,
			size: 14,
			font: boldFont,
			color: textColor,
		});

		if (invoiceData.customer) {
			currentY -= 20;
			page.drawText(invoiceData.customer.customer_name || 'Customer Name', {
				x: width - 200,
				y: currentY,
				size: 12,
				font: font,
				color: textColor,
			});

			if (invoiceData.customer.customer_address) {
				currentY -= 15;
				page.drawText(invoiceData.customer.customer_address, {
					x: width - 200,
					y: currentY,
					size: 10,
					font: font,
					color: textColor,
				});
			}

			if (invoiceData.customer.customer_email) {
				currentY -= 15;
				page.drawText(invoiceData.customer.customer_email, {
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
		textColor: any
	): Promise<void> {
		const y = 580;
		let currentY = y;

		// Invoice date
		page.drawText('Invoice Date:', {
			x: 50,
			y: currentY,
			size: 12,
			font: boldFont,
			color: textColor,
		});
		page.drawText(invoiceData.invoice?.date || 'N/A', {
			x: 150,
			y: currentY,
			size: 12,
			font: font,
			color: textColor,
		});

		// Due date
		if (invoiceData.invoice?.due_date) {
			currentY -= 20;
			page.drawText('Due Date:', {
				x: 50,
				y: currentY,
				size: 12,
				font: boldFont,
				color: textColor,
			});
			page.drawText(invoiceData.invoice.due_date, {
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
			page.drawText('Payment Terms:', {
				x: 50,
				y: currentY,
				size: 12,
				font: boldFont,
				color: textColor,
			});
			page.drawText(invoiceData.invoice.payment_terms, {
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
		secondaryColor: any
	): Promise<void> {
		const y = 500;
		const tableWidth = 500;
		const colWidths = [200, 80, 80, 80, 60];

		// Table header
		page.drawRectangle({
			x: 50,
			y: y - 30,
			width: tableWidth,
			height: 30,
			color: secondaryColor,
		});

		const headers = ['Description', 'Quantity', 'Price', 'VAT', 'Total'];
		let x = 50;
		headers.forEach((header, index) => {
			page.drawText(header, {
				x: x + 5,
				y: y - 20,
				size: 10,
				font: boldFont,
				color: rgb(1, 1, 1),
			});
			x += colWidths[index];
		});

		// Table rows
		let currentY = y - 50;
		invoiceData.items.forEach((item: any, index: number) => {
			// Alternate row colors
			if (index % 2 === 0) {
				page.drawRectangle({
					x: 50,
					y: currentY - 20,
					width: tableWidth,
					height: 20,
					color: rgb(0.95, 0.95, 0.95),
				});
			}

			// Item data
			x = 50;
			const itemData = [
				item.product_name || item.description || 'Item',
				item.quantity || '0',
				`${parseFloat(item.price || '0').toFixed(2)}`,
				`${parseFloat(item.product_vat || '0').toFixed(1)}%`,
				`${(parseFloat(item.quantity || '0') * parseFloat(item.price || '0')).toFixed(2)}`,
			];

			itemData.forEach((data, dataIndex) => {
				page.drawText(data, {
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
		primaryColor: any
	): Promise<void> {
		const { width } = page.getSize();
		const y = 200;
		let currentY = y;

		// Subtotal
		page.drawText('Subtotal:', {
			x: width - 200,
			y: currentY,
			size: 12,
			font: font,
			color: textColor,
		});
		page.drawText(invoiceData.totals.subtotal.toFixed(2), {
			x: width - 100,
			y: currentY,
			size: 12,
			font: font,
			color: textColor,
		});

		// VAT
		if (invoiceData.totals.vatTotal > 0) {
			currentY -= 20;
			page.drawText('VAT:', {
				x: width - 200,
				y: currentY,
				size: 12,
				font: font,
				color: textColor,
			});
			page.drawText(invoiceData.totals.vatTotal.toFixed(2), {
				x: width - 100,
				y: currentY,
				size: 12,
				font: font,
				color: textColor,
			});
		}

		// Grand total
		currentY -= 30;
		page.drawText('Total:', {
			x: width - 200,
			y: currentY,
			size: 16,
			font: boldFont,
			color: primaryColor,
		});
		page.drawText(invoiceData.totals.grandTotal.toFixed(2), {
			x: width - 100,
			y: currentY,
			size: 16,
			font: boldFont,
			color: primaryColor,
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
		secondaryColor: any
	): Promise<void> {
		const y = 100;

		// Footer line
		page.drawLine({
			start: { x: 50, y: y + 20 },
			end: { x: 550, y: y + 20 },
			thickness: 1,
			color: secondaryColor,
		});

		// Footer text
		page.drawText('Thank you for your business!', {
			x: 50,
			y: y,
			size: 12,
			font: font,
			color: textColor,
		});

		if (tenantBranding.website) {
			page.drawText(tenantBranding.website, {
				x: 50,
				y: y - 15,
				size: 10,
				font: font,
				color: secondaryColor,
			});
		}
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
		
		page.drawText(tenantBranding.name || 'CONFIDENTIAL', {
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
					action: 'email_sent',
					status: success ? 'success' : 'error',
					metadata: {
						invoiceId: options.invoiceId,
						recipients: emailOptions.to,
						subject: emailOptions.subject,
					},
				},
			});
		} catch (error) {
			console.error('Error logging email sent:', error);
		}
	}
}
