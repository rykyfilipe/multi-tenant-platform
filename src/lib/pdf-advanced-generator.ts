/** @format */

// Advanced PDF Generator with Professional Templates and Features
import type { PDFDocument as PDFDocumentType, RGB, PageSizes as PageSizesType } from 'pdf-lib';
import { PDF_TEMPLATES, PDFCustomization, DEFAULT_PDF_CUSTOMIZATION, getTemplateById } from './pdf-templates';
import { InvoiceSystemService } from './invoice-system';
import prisma from './prisma';

export interface AdvancedPDFOptions {
	tenantId: string;
	databaseId: number;
	invoiceId: number;
	templateId?: string;
	customization?: Partial<PDFCustomization>;
	includeQRCode?: boolean;
	includeBarcode?: boolean;
	includeWatermark?: boolean;
	watermarkText?: string;
	includeDigitalSignature?: boolean;
	signatureImage?: string;
	language?: string;
}

export interface PDFAnalytics {
	templateId: string;
	generationTime: number;
	fileSize: number;
	pageCount: number;
	features: string[];
	generatedAt: Date;
	generatedBy: string;
}

export class AdvancedPDFGenerator {
	/**
	 * Generate a professional PDF invoice with advanced features
	 */
	static async generateAdvancedPDF(options: AdvancedPDFOptions): Promise<{
		pdf: Buffer;
		analytics: PDFAnalytics;
	}> {
		const startTime = Date.now();
		
		try {
			// Dynamic import to avoid SSR issues
			const { PDFDocument, rgb, StandardFonts, PageSizes } = await import('pdf-lib');
			
			// Get invoice data
			const invoiceData = await this.getInvoiceData(options);
			if (!invoiceData) {
				throw new Error('Invoice not found');
			}

			// Get tenant branding and customization
			const tenantBranding = await this.getTenantBranding(options.tenantId);
			const customization = this.mergeCustomization(options.customization, options.templateId);

			// Create PDF document
			const pdfDoc = await PDFDocument.create();
			const page = pdfDoc.addPage(PageSizes.A4);
			const { width, height } = page.getSize();

			// Load fonts
			const fonts = await this.loadFonts(pdfDoc, customization.fonts);

			// Apply template-specific styling
			const template = getTemplateById(customization.templateId) || PDF_TEMPLATES[0];
			await this.applyTemplate(page, template, customization, fonts, width, height);

			// Generate content based on template
			await this.generateContent(page, invoiceData, tenantBranding, customization, fonts, width, height);

			// Add advanced features
			if (customization.features.showQRCode) {
				await this.addQRCode(page, invoiceData, customization, width, height);
			}

			if (customization.features.showBarcode) {
				await this.addBarcode(page, invoiceData, customization, width, height);
			}

			if (customization.features.showWatermark) {
				await this.addWatermark(page, customization, width, height);
			}

			if (customization.features.showDigitalSignature) {
				await this.addDigitalSignature(page, customization, width, height);
			}

			if (customization.features.showPageNumbers) {
				await this.addPageNumbers(pdfDoc, customization);
			}

			// Generate PDF
			const pdfBytes = await pdfDoc.save();
			const generationTime = Date.now() - startTime;

			// Create analytics
			const analytics: PDFAnalytics = {
				templateId: customization.templateId,
				generationTime,
				fileSize: pdfBytes.length,
				pageCount: pdfDoc.getPageCount(),
				features: this.getActiveFeatures(customization),
				generatedAt: new Date(),
				generatedBy: options.tenantId
			};

			// Save analytics to database
			await this.saveAnalytics(analytics, options.tenantId);

			return {
				pdf: Buffer.from(pdfBytes),
				analytics
			};

		} catch (error) {
			console.error('Error generating advanced PDF:', error);
			throw error;
		}
	}

	/**
	 * Apply template-specific styling to the page
	 */
	private static async applyTemplate(
		page: any,
		template: any,
		customization: PDFCustomization,
		fonts: any,
		width: number,
		height: number
	): Promise<void> {
		const { PDFDocument, rgb } = await import('pdf-lib');

		// Set background color
		page.drawRectangle({
			x: 0,
			y: 0,
			width,
			height,
			color: rgb(
				parseInt(customization.colors.background.slice(1, 3), 16) / 255,
				parseInt(customization.colors.background.slice(3, 5), 16) / 255,
				parseInt(customization.colors.background.slice(5, 7), 16) / 255
			)
		});

		// Draw header background
		page.drawRectangle({
			x: customization.layout.margins.left,
			y: height - customization.layout.headerHeight - customization.layout.margins.top,
			width: width - customization.layout.margins.left - customization.layout.margins.right,
			height: customization.layout.headerHeight,
			color: rgb(
				parseInt(customization.colors.primary.slice(1, 3), 16) / 255,
				parseInt(customization.colors.primary.slice(3, 5), 16) / 255,
				parseInt(customization.colors.primary.slice(5, 7), 16) / 255
			),
			opacity: 0.1
		});

		// Draw footer background
		page.drawRectangle({
			x: customization.layout.margins.left,
			y: customization.layout.margins.bottom,
			width: width - customization.layout.margins.left - customization.layout.margins.right,
			height: customization.layout.footerHeight,
			color: rgb(
				parseInt(customization.colors.secondary.slice(1, 3), 16) / 255,
				parseInt(customization.colors.secondary.slice(3, 5), 16) / 255,
				parseInt(customization.colors.secondary.slice(5, 7), 16) / 255
			),
			opacity: 0.05
		});
	}

	/**
	 * Generate main content based on template
	 */
	private static async generateContent(
		page: any,
		invoiceData: any,
		tenantBranding: any,
		customization: PDFCustomization,
		fonts: any,
		width: number,
		height: number
	): Promise<void> {
		const { rgb } = await import('pdf-lib');

		// Header content
		await this.drawHeader(page, invoiceData, tenantBranding, customization, fonts, width, height);
		
		// Company information
		await this.drawCompanyInfo(page, tenantBranding, customization, fonts, width, height);
		
		// Customer information
		await this.drawCustomerInfo(page, invoiceData.customer, customization, fonts, width, height);
		
		// Invoice details
		await this.drawInvoiceDetails(page, invoiceData.invoice, customization, fonts, width, height);
		
		// Items table
		await this.drawItemsTable(page, invoiceData.items, customization, fonts, width, height);
		
		// Totals
		await this.drawTotals(page, invoiceData.totals, customization, fonts, width, height);
		
		// Footer content
		await this.drawFooter(page, tenantBranding, customization, fonts, width, height);
	}

	/**
	 * Draw header section
	 */
	private static async drawHeader(
		page: any,
		invoiceData: any,
		tenantBranding: any,
		customization: PDFCustomization,
		fonts: any,
		width: number,
		height: number
	): Promise<void> {
		const { rgb } = await import('pdf-lib');

		const headerY = height - customization.layout.margins.top - 20;
		const headerX = customization.layout.margins.left;

		// Invoice title
		page.drawText('INVOICE', {
			x: headerX,
			y: headerY,
			size: 24,
			font: fonts.header,
			color: rgb(
				parseInt(customization.colors.primary.slice(1, 3), 16) / 255,
				parseInt(customization.colors.primary.slice(3, 5), 16) / 255,
				parseInt(customization.colors.primary.slice(5, 7), 16) / 255
			)
		});

		// Invoice number
		page.drawText(`#${invoiceData.invoice.number}`, {
			x: width - customization.layout.margins.right - 100,
			y: headerY,
			size: 18,
			font: fonts.header,
			color: rgb(
				parseInt(customization.colors.text.slice(1, 3), 16) / 255,
				parseInt(customization.colors.text.slice(3, 5), 16) / 255,
				parseInt(customization.colors.text.slice(5, 7), 16) / 255
			)
		});
	}

	/**
	 * Draw company information
	 */
	private static async drawCompanyInfo(
		page: any,
		tenantBranding: any,
		customization: PDFCustomization,
		fonts: any,
		width: number,
		height: number
	): Promise<void> {
		const { rgb } = await import('pdf-lib');

		const startY = height - customization.layout.margins.top - 80;
		const startX = customization.layout.margins.left;

		// Company name
		page.drawText(tenantBranding.name || 'Company Name', {
			x: startX,
			y: startY,
			size: 16,
			font: fonts.header,
			color: rgb(
				parseInt(customization.colors.text.slice(1, 3), 16) / 255,
				parseInt(customization.colors.text.slice(3, 5), 16) / 255,
				parseInt(customization.colors.text.slice(5, 7), 16) / 255
			)
		});

		// Company address
		if (tenantBranding.address) {
			page.drawText(tenantBranding.address, {
				x: startX,
				y: startY - 20,
				size: 10,
				font: fonts.body,
				color: rgb(
					parseInt(customization.colors.secondary.slice(1, 3), 16) / 255,
					parseInt(customization.colors.secondary.slice(3, 5), 16) / 255,
					parseInt(customization.colors.secondary.slice(5, 7), 16) / 255
				)
			});
		}
	}

	/**
	 * Draw customer information
	 */
	private static async drawCustomerInfo(
		page: any,
		customer: any,
		customization: PDFCustomization,
		fonts: any,
		width: number,
		height: number
	): Promise<void> {
		const { rgb } = await import('pdf-lib');

		const startY = height - customization.layout.margins.top - 200;
		const startX = width - customization.layout.margins.right - 200;

		// Customer title
		page.drawText('Bill To:', {
			x: startX,
			y: startY,
			size: 12,
			font: fonts.header,
			color: rgb(
				parseInt(customization.colors.text.slice(1, 3), 16) / 255,
				parseInt(customization.colors.text.slice(3, 5), 16) / 255,
				parseInt(customization.colors.text.slice(5, 7), 16) / 255
			)
		});

		// Customer name
		page.drawText(customer.name || 'Customer Name', {
			x: startX,
			y: startY - 20,
			size: 10,
			font: fonts.body,
			color: rgb(
				parseInt(customization.colors.text.slice(1, 3), 16) / 255,
				parseInt(customization.colors.text.slice(3, 5), 16) / 255,
				parseInt(customization.colors.text.slice(5, 7), 16) / 255
			)
		});

		// Customer address
		if (customer.address) {
			page.drawText(customer.address, {
				x: startX,
				y: startY - 40,
				size: 9,
				font: fonts.body,
				color: rgb(
					parseInt(customization.colors.secondary.slice(1, 3), 16) / 255,
					parseInt(customization.colors.secondary.slice(3, 5), 16) / 255,
					parseInt(customization.colors.secondary.slice(5, 7), 16) / 255
				)
			});
		}
	}

	/**
	 * Draw invoice details
	 */
	private static async drawInvoiceDetails(
		page: any,
		invoice: any,
		customization: PDFCustomization,
		fonts: any,
		width: number,
		height: number
	): Promise<void> {
		const { rgb } = await import('pdf-lib');

		const startY = height - customization.layout.margins.top - 300;
		const startX = customization.layout.margins.left;

		// Invoice details table
		const details = [
			['Date:', invoice.date || new Date().toLocaleDateString()],
			['Due Date:', invoice.dueDate || 'N/A'],
			['Payment Terms:', invoice.paymentTerms || 'Net 30'],
			['Payment Method:', invoice.paymentMethod || 'Bank Transfer']
		];

		details.forEach(([label, value], index) => {
			const y = startY - (index * 20);
			
			// Label
			page.drawText(label, {
				x: startX,
				y,
				size: 10,
				font: fonts.body,
				color: rgb(
					parseInt(customization.colors.secondary.slice(1, 3), 16) / 255,
					parseInt(customization.colors.secondary.slice(3, 5), 16) / 255,
					parseInt(customization.colors.secondary.slice(5, 7), 16) / 255
				)
			});

			// Value
			page.drawText(value, {
				x: startX + 100,
				y,
				size: 10,
				font: fonts.body,
				color: rgb(
					parseInt(customization.colors.text.slice(1, 3), 16) / 255,
					parseInt(customization.colors.text.slice(3, 5), 16) / 255,
					parseInt(customization.colors.text.slice(5, 7), 16) / 255
				)
			});
		});
	}

	/**
	 * Draw items table
	 */
	private static async drawItemsTable(
		page: any,
		items: any[],
		customization: PDFCustomization,
		fonts: any,
		width: number,
		height: number
	): Promise<void> {
		const { rgb } = await import('pdf-lib');

		const startY = height - customization.layout.margins.top - 400;
		const startX = customization.layout.margins.left;
		const tableWidth = width - customization.layout.margins.left - customization.layout.margins.right;

		// Table headers
		const headers = ['Description', 'Qty', 'Price', 'Total'];
		const columnWidths = [tableWidth * 0.5, tableWidth * 0.15, tableWidth * 0.15, tableWidth * 0.2];

		// Draw header background
		page.drawRectangle({
			x: startX,
			y: startY - 20,
			width: tableWidth,
			height: 25,
			color: rgb(
				parseInt(customization.colors.primary.slice(1, 3), 16) / 255,
				parseInt(customization.colors.primary.slice(3, 5), 16) / 255,
				parseInt(customization.colors.primary.slice(5, 7), 16) / 255
			)
		});

		// Draw header text
		headers.forEach((header, index) => {
			page.drawText(header, {
				x: startX + (index === 0 ? 10 : columnWidths.slice(0, index).reduce((a, b) => a + b, 0) + 10),
				y: startY - 15,
				size: 10,
				font: fonts.header,
				color: rgb(1, 1, 1) // White text on colored background
			});
		});

		// Draw items
		items.forEach((item, itemIndex) => {
			const itemY = startY - 50 - (itemIndex * 25);
			
			// Item description
			page.drawText(item.description || 'Item', {
				x: startX + 10,
				y: itemY,
				size: 9,
				font: fonts.body,
				color: rgb(
					parseInt(customization.colors.text.slice(1, 3), 16) / 255,
					parseInt(customization.colors.text.slice(3, 5), 16) / 255,
					parseInt(customization.colors.text.slice(5, 7), 16) / 255
				)
			});

			// Quantity
			page.drawText((item.quantity || 0).toString(), {
				x: startX + columnWidths[0] + 10,
				y: itemY,
				size: 9,
				font: fonts.body,
				color: rgb(
					parseInt(customization.colors.text.slice(1, 3), 16) / 255,
					parseInt(customization.colors.text.slice(3, 5), 16) / 255,
					parseInt(customization.colors.text.slice(5, 7), 16) / 255
				)
			});

			// Price
			page.drawText((item.price || 0).toFixed(2), {
				x: startX + columnWidths[0] + columnWidths[1] + 10,
				y: itemY,
				size: 9,
				font: fonts.body,
				color: rgb(
					parseInt(customization.colors.text.slice(1, 3), 16) / 255,
					parseInt(customization.colors.text.slice(3, 5), 16) / 255,
					parseInt(customization.colors.text.slice(5, 7), 16) / 255
				)
			});

			// Total
			page.drawText(((item.quantity || 0) * (item.price || 0)).toFixed(2), {
				x: startX + columnWidths[0] + columnWidths[1] + columnWidths[2] + 10,
				y: itemY,
				size: 9,
				font: fonts.body,
				color: rgb(
					parseInt(customization.colors.text.slice(1, 3), 16) / 255,
					parseInt(customization.colors.text.slice(3, 5), 16) / 255,
					parseInt(customization.colors.text.slice(5, 7), 16) / 255
				)
			});
		});
	}

	/**
	 * Draw totals section
	 */
	private static async drawTotals(
		page: any,
		totals: any,
		customization: PDFCustomization,
		fonts: any,
		width: number,
		height: number
	): Promise<void> {
		const { rgb } = await import('pdf-lib');

		const startY = height - customization.layout.margins.top - 500;
		const startX = width - customization.layout.margins.right - 200;

		// Subtotal
		page.drawText('Subtotal:', {
			x: startX,
			y: startY,
			size: 10,
			font: fonts.body,
			color: rgb(
				parseInt(customization.colors.text.slice(1, 3), 16) / 255,
				parseInt(customization.colors.text.slice(3, 5), 16) / 255,
				parseInt(customization.colors.text.slice(5, 7), 16) / 255
			)
		});

		page.drawText((totals.subtotal || 0).toFixed(2), {
			x: startX + 100,
			y: startY,
			size: 10,
			font: fonts.body,
			color: rgb(
				parseInt(customization.colors.text.slice(1, 3), 16) / 255,
				parseInt(customization.colors.text.slice(3, 5), 16) / 255,
				parseInt(customization.colors.text.slice(5, 7), 16) / 255
			)
		});

		// VAT
		page.drawText('VAT:', {
			x: startX,
			y: startY - 20,
			size: 10,
			font: fonts.body,
			color: rgb(
				parseInt(customization.colors.text.slice(1, 3), 16) / 255,
				parseInt(customization.colors.text.slice(3, 5), 16) / 255,
				parseInt(customization.colors.text.slice(5, 7), 16) / 255
			)
		});

		page.drawText((totals.vat_total || 0).toFixed(2), {
			x: startX + 100,
			y: startY - 20,
			size: 10,
			font: fonts.body,
			color: rgb(
				parseInt(customization.colors.text.slice(1, 3), 16) / 255,
				parseInt(customization.colors.text.slice(3, 5), 16) / 255,
				parseInt(customization.colors.text.slice(5, 7), 16) / 255
			)
		});

		// Total
		page.drawText('Total:', {
			x: startX,
			y: startY - 40,
			size: 12,
			font: fonts.header,
			color: rgb(
				parseInt(customization.colors.primary.slice(1, 3), 16) / 255,
				parseInt(customization.colors.primary.slice(3, 5), 16) / 255,
				parseInt(customization.colors.primary.slice(5, 7), 16) / 255
			)
		});

		page.drawText((totals.grand_total || 0).toFixed(2), {
			x: startX + 100,
			y: startY - 40,
			size: 12,
			font: fonts.header,
			color: rgb(
				parseInt(customization.colors.primary.slice(1, 3), 16) / 255,
				parseInt(customization.colors.primary.slice(3, 5), 16) / 255,
				parseInt(customization.colors.primary.slice(5, 7), 16) / 255
			)
		});
	}

	/**
	 * Draw footer section
	 */
	private static async drawFooter(
		page: any,
		tenantBranding: any,
		customization: PDFCustomization,
		fonts: any,
		width: number,
		height: number
	): Promise<void> {
		const { rgb } = await import('pdf-lib');

		const footerY = customization.layout.margins.bottom + 20;
		const footerX = customization.layout.margins.left;

		// Footer text
		page.drawText('Thank you for your business!', {
			x: footerX,
			y: footerY,
			size: 10,
			font: fonts.body,
			color: rgb(
				parseInt(customization.colors.secondary.slice(1, 3), 16) / 255,
				parseInt(customization.colors.secondary.slice(3, 5), 16) / 255,
				parseInt(customization.colors.secondary.slice(5, 7), 16) / 255
			)
		});

		// Company contact info
		if (tenantBranding.email) {
			page.drawText(`Email: ${tenantBranding.email}`, {
				x: footerX,
				y: footerY - 15,
				size: 9,
				font: fonts.body,
				color: rgb(
					parseInt(customization.colors.secondary.slice(1, 3), 16) / 255,
					parseInt(customization.colors.secondary.slice(3, 5), 16) / 255,
					parseInt(customization.colors.secondary.slice(5, 7), 16) / 255
				)
			});
		}
	}

	/**
	 * Add QR code to PDF
	 */
	private static async addQRCode(
		page: any,
		invoiceData: any,
		customization: PDFCustomization,
		width: number,
		height: number
	): Promise<void> {
		// QR code implementation would go here
		// For now, we'll add a placeholder
		const { rgb } = await import('pdf-lib');

		page.drawText('QR Code', {
			x: width - 100,
			y: height - 100,
			size: 8,
			font: await page.doc.embedFont('Helvetica'),
			color: rgb(0.5, 0.5, 0.5)
		});
	}

	/**
	 * Add barcode to PDF
	 */
	private static async addBarcode(
		page: any,
		invoiceData: any,
		customization: PDFCustomization,
		width: number,
		height: number
	): Promise<void> {
		// Barcode implementation would go here
		// For now, we'll add a placeholder
		const { rgb } = await import('pdf-lib');

		page.drawText('Barcode', {
			x: width - 100,
			y: height - 120,
			size: 8,
			font: await page.doc.embedFont('Helvetica'),
			color: rgb(0.5, 0.5, 0.5)
		});
	}

	/**
	 * Add watermark to PDF
	 */
	private static async addWatermark(
		page: any,
		customization: PDFCustomization,
		width: number,
		height: number
	): Promise<void> {
		const { rgb } = await import('pdf-lib');

		if (customization.features.watermarkText) {
			page.drawText(customization.features.watermarkText, {
				x: width / 2 - 50,
				y: height / 2,
				size: 48,
				font: await page.doc.embedFont('Helvetica-Bold'),
				color: rgb(0.8, 0.8, 0.8),
				opacity: customization.features.watermarkOpacity
			});
		}
	}

	/**
	 * Add digital signature to PDF
	 */
	private static async addDigitalSignature(
		page: any,
		customization: PDFCustomization,
		width: number,
		height: number
	): Promise<void> {
		// Digital signature implementation would go here
		// For now, we'll add a placeholder
		const { rgb } = await import('pdf-lib');

		page.drawText('Digital Signature', {
			x: width - 150,
			y: 50,
			size: 8,
			font: await page.doc.embedFont('Helvetica'),
			color: rgb(0.5, 0.5, 0.5)
		});
	}

	/**
	 * Add page numbers to PDF
	 */
	private static async addPageNumbers(pdfDoc: any, customization: PDFCustomization): Promise<void> {
		const pages = pdfDoc.getPages();
		const { rgb } = await import('pdf-lib');

		pages.forEach((page: any, index: number) => {
			const { width, height } = page.getSize();
			
			page.drawText(`Page ${index + 1} of ${pages.length}`, {
				x: width - 100,
				y: 30,
				size: 8,
				font: page.doc.embedFont('Helvetica'),
				color: rgb(0.5, 0.5, 0.5)
			});
		});
	}

	/**
	 * Load fonts for the PDF
	 */
	private static async loadFonts(pdfDoc: any, fonts: any): Promise<any> {
		const { StandardFonts } = await import('pdf-lib');
		
		return {
			header: await pdfDoc.embedFont(StandardFonts.HelveticaBold),
			body: await pdfDoc.embedFont(StandardFonts.Helvetica),
			monospace: await pdfDoc.embedFont(StandardFonts.Courier)
		};
	}

	/**
	 * Merge customization with defaults
	 */
	private static mergeCustomization(
		customization?: Partial<PDFCustomization>,
		templateId?: string
	): PDFCustomization {
		const template = templateId ? getTemplateById(templateId) : null;
		
		return {
			...DEFAULT_PDF_CUSTOMIZATION,
			...(template ? {
				templateId: template.id,
				colors: template.colors,
				fonts: template.fonts,
				layout: template.layout
			} : {}),
			...customization
		};
	}

	/**
	 * Get active features for analytics
	 */
	private static getActiveFeatures(customization: PDFCustomization): string[] {
		const features: string[] = [];
		
		if (customization.features.showQRCode) features.push('QR Code');
		if (customization.features.showBarcode) features.push('Barcode');
		if (customization.features.showWatermark) features.push('Watermark');
		if (customization.features.showDigitalSignature) features.push('Digital Signature');
		if (customization.features.showPageNumbers) features.push('Page Numbers');
		
		return features;
	}

	/**
	 * Save analytics to database
	 */
	private static async saveAnalytics(analytics: PDFAnalytics, tenantId: string): Promise<void> {
		try {
			await prisma.pdfAnalytics.create({
				data: {
					tenantId: parseInt(tenantId),
					templateId: analytics.templateId,
					generationTime: analytics.generationTime,
					fileSize: analytics.fileSize,
					pageCount: analytics.pageCount,
					features: analytics.features,
					generatedAt: analytics.generatedAt,
					generatedBy: analytics.generatedBy
				}
			});
		} catch (error) {
			console.error('Error saving PDF analytics:', error);
		}
	}

	/**
	 * Get invoice data
	 */
	private static async getInvoiceData(options: AdvancedPDFOptions): Promise<any> {
		// Implementation would fetch invoice data from database
		// This is a placeholder
		return {
			invoice: {
				number: 'INV-2025-000001',
				date: new Date().toLocaleDateString(),
				dueDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toLocaleDateString(),
				paymentTerms: 'Net 30',
				paymentMethod: 'Bank Transfer'
			},
			customer: {
				name: 'Customer Name',
				address: 'Customer Address'
			},
			items: [
				{
					description: 'Product 1',
					quantity: 2,
					price: 100.00
				},
				{
					description: 'Product 2',
					quantity: 1,
					price: 50.00
				}
			],
			totals: {
				subtotal: 250.00,
				vat_total: 47.50,
				grand_total: 297.50
			}
		};
	}

	/**
	 * Get tenant branding
	 */
	private static async getTenantBranding(tenantId: string): Promise<any> {
		try {
			const tenant = await prisma.tenant.findUnique({
				where: { id: parseInt(tenantId) },
				select: {
					name: true,
					address: true,
					companyEmail: true,
					logoUrl: true
				}
			});
			
			return tenant || {};
		} catch (error) {
			console.error('Error fetching tenant branding:', error);
			return {};
		}
	}
}
