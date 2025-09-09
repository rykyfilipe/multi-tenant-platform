/** @format */

// Use dynamic import for pdf-lib to avoid SSR issues
import type { PDFDocument as PDFDocumentType, RGB, TextAlignment } from "pdf-lib";
import { rgb } from "pdf-lib";

export interface InvoicePDFData {
	// Company information
	company: {
		name: string;
		taxId?: string;
		registrationNumber?: string;
		address?: string;
		city?: string;
		country?: string;
		postalCode?: string;
		iban?: string;
		bank?: string;
		phone?: string;
		email?: string;
		website?: string;
	};

	// Customer information
	customer: {
		name: string;
		taxId?: string;
		registrationNumber?: string;
		address?: string;
		city?: string;
		country?: string;
		postalCode?: string;
		email?: string;
		phone?: string;
	};

	// Invoice details
	invoice: {
		number: string;
		series?: string;
		date: string;
		dueDate?: string;
		currency: string;
		paymentTerms?: string;
		paymentMethod?: string;
	};

	// Invoice items
	items: Array<{
		description: string;
		sku?: string;
		category?: string;
		quantity: number;
		unitPrice: number;
		currency: string;
		vatRate?: number;
		vatAmount?: number;
		total: number;
	}>;

	// Totals
	totals: {
		subtotal: number;
		vatTotal: number;
		grandTotal: number;
		currency: string;
	};
}

export class PDFInvoiceGenerator {
	/**
	 * Remove diacritics from Romanian text to avoid PDF encoding errors
	 */
	private static removeDiacritics(text: string): string {
		if (!text) return text;

		const diacriticsMap: { [key: string]: string } = {
			ă: "a",
			Ă: "A",
			â: "a",
			Â: "A",
			î: "i",
			Î: "I",
			ș: "s",
			Ș: "S",
			ş: "s",
			Ş: "S",
			ț: "t",
			Ț: "T",
			ţ: "t",
			Ţ: "T",
		};

		return text.replace(
			/[ăâîșşțţĂÂÎȘŞȚŢ]/g,
			(match) => diacriticsMap[match] || match,
		);
	}

	/**
	 * Helper function to draw text with diacritics removed
	 */
	private static drawTextSafe(page: any, text: string, options: any): void {
		page.drawText(PDFInvoiceGenerator.removeDiacritics(text), options);
	}

	/**
	 * Get translations for the specified language
	 */
	private static getTranslations(language: string): Record<string, string> {
		const translations: Record<string, Record<string, string>> = {
			en: {
				invoice: 'INVOICE',
				supplier: 'SUPPLIER (ISSUER):',
				customer: 'CUSTOMER (BILL TO):',
				company: 'Company:',
				taxId: 'Tax ID:',
				regNo: 'Reg. No:',
				address: 'Address:',
				invoiceDetails: 'INVOICE DETAILS:',
				issueDate: 'Issue Date:',
				currency: 'Currency:',
				paymentDetails: 'PAYMENT DETAILS:',
				paymentTerms: 'Payment Terms: Net 30',
				paymentMethod: 'Payment Method: Bank Transfer / Credit Card',
				descriptionOfGoods: 'DESCRIPTION OF GOODS/SERVICES:',
				no: 'No.',
				description: 'Description of goods/services',
				um: 'U.M.',
				quantity: 'Quantity',
				unitPrice: 'Unit price',
				currencyCol: 'Currency',
				vatPercent: 'VAT %',
				vatValue: 'VAT value',
				lineTotal: 'Line total',
				subtotalExclVat: 'Subtotal (excl. VAT):',
				vatTotal: 'VAT Total:',
				grandTotalInclVat: 'GRAND TOTAL (incl. VAT):',
				totalInWords: 'Total in words:',
				paymentInformation: 'PAYMENT INFORMATION:',
				paymentMethodLabel: 'Payment Method:',
				paymentTermsLabel: 'Payment Terms:',
				legalNotices: 'LEGAL NOTICES:',
				legalText1: 'This invoice is a fiscal document according to legislation in force.',
				legalText2: 'Invoice serves as receipt if payment is made through bank.',
				documentGenerated: 'Document automatically generated on',
				page: 'Page',
			},
			ro: {
				invoice: 'FACTURĂ',
				supplier: 'FURNIZOR (EMITENT):',
				customer: 'CLIENT (FACTURAT CĂTRE):',
				company: 'Compania:',
				taxId: 'CUI:',
				regNo: 'Nr. Reg.:',
				address: 'Adresa:',
				invoiceDetails: 'DETALII FACTURĂ:',
				issueDate: 'Data emiterii:',
				currency: 'Moneda:',
				paymentDetails: 'DETALII PLATĂ:',
				paymentTerms: 'Termeni de plată: Net 30',
				paymentMethod: 'Metoda de plată: Transfer bancar / Card de credit',
				descriptionOfGoods: 'DESCRIEREA BUNURILOR/SERVICIILOR:',
				no: 'Nr.',
				description: 'Descrierea bunurilor/serviciilor',
				um: 'U.M.',
				quantity: 'Cantitatea',
				unitPrice: 'Preț unitar',
				currencyCol: 'Moneda',
				vatPercent: 'TVA %',
				vatValue: 'Valoarea TVA',
				lineTotal: 'Total linie',
				subtotalExclVat: 'Subtotal (fără TVA):',
				vatTotal: 'Total TVA:',
				grandTotalInclVat: 'TOTAL GENERAL (cu TVA):',
				totalInWords: 'Totalul în cuvinte:',
				paymentInformation: 'INFORMAȚII DE PLATĂ:',
				paymentMethodLabel: 'Metoda de plată:',
				paymentTermsLabel: 'Termeni de plată:',
				legalNotices: 'AVIZE LEGALE:',
				legalText1: 'Această factură este un document fiscal conform legislației în vigoare.',
				legalText2: 'Factura servește ca chitanță dacă plata se face prin bancă.',
				documentGenerated: 'Document generat automat pe',
				page: 'Pagina',
			},
		};

		return translations[language] || translations.en;
	}

	/**
	 * Generate professional PDF invoice using pdf-lib
	 */
	static async generateInvoicePDF(data: InvoicePDFData, language: string = 'en'): Promise<Buffer> {
		// Dynamic import to avoid SSR issues
		const { PDFDocument, rgb, StandardFonts } = await import("pdf-lib");
		
		// Get translations for the specified language
		const t = this.getTranslations(language);
		
		// Create a new PDF document
		const pdfDoc = await PDFDocument.create();
		const page = pdfDoc.addPage([595.28, 841.89]); // A4 size
		const { width, height } = page.getSize();

		// Embed the standard font
		const font = await pdfDoc.embedFont(StandardFonts.Helvetica);
		const boldFont = await pdfDoc.embedFont(StandardFonts.HelveticaBold);

		// Set margins
		const margin = 50;
		const contentWidth = width - 2 * margin;
		let currentY = height - margin;

		// Header
		currentY = this.drawHeader(
			page,
			data,
			font,
			boldFont,
			currentY,
			margin,
			contentWidth,
			t,
		);

		// Company and Customer Info
		currentY = this.drawCompanyCustomerInfo(
			page,
			data,
			font,
			boldFont,
			currentY,
			margin,
			contentWidth,
			t,
		);

		// Invoice Details
		currentY = this.drawInvoiceDetails(
			page,
			data,
			font,
			boldFont,
			currentY,
			margin,
			contentWidth,
			t,
		);

		// Items Table
		currentY = this.drawItemsTable(
			page,
			data,
			font,
			boldFont,
			currentY,
			margin,
			contentWidth,
			t,
		);

		// Totals
		currentY = this.drawTotals(
			page,
			data,
			font,
			boldFont,
			currentY,
			margin,
			contentWidth,
			t,
		);

		// Payment Details
		currentY = this.drawPaymentDetails(
			page,
			data,
			font,
			boldFont,
			currentY,
			margin,
			contentWidth,
			t,
		);

		// Legal Notice
		this.drawLegalNotice(page, data, font, currentY, margin, contentWidth, t);

		// Save the PDF
		const pdfBytes = await pdfDoc.save();
		return Buffer.from(pdfBytes);
	}

	private static drawHeader(
		page: any,
		data: InvoicePDFData,
		font: any,
		boldFont: any,
		currentY: number,
		margin: number,
		contentWidth: number,
		t: Record<string, string>,
	): number {
		// Draw header border
		page.drawRectangle({
			x: margin,
			y: currentY - 50,
			width: contentWidth,
			height: 60,
			borderColor: rgb(0.8, 0.8, 0.8),
			borderWidth: 1,
		});

		// Title - using translations
		const title = t.invoice;
		const titleWidth = boldFont.widthOfTextAtSize(title, 28);
		PDFInvoiceGenerator.drawTextSafe(page, title, {
			x: (page.getWidth() - titleWidth) / 2,
			y: currentY - 20,
			size: 28,
			font: boldFont,
			color: rgb(0.1, 0.1, 0.1),
		});

		// Invoice number
		const invoiceText = `Serie: ${data.invoice.series || "A"} Nr: ${
			data.invoice.number
		}`;
		const invoiceWidth = boldFont.widthOfTextAtSize(invoiceText, 14);
		PDFInvoiceGenerator.drawTextSafe(page, invoiceText, {
			x: (page.getWidth() - invoiceWidth) / 2,
			y: currentY - 40,
			size: 14,
			font: boldFont,
			color: rgb(0.2, 0.2, 0.2),
		});

		return currentY - 80;
	}

	private static drawCompanyCustomerInfo(
		page: any,
		data: InvoicePDFData,
		font: any,
		boldFont: any,
		currentY: number,
		margin: number,
		contentWidth: number,
		t: Record<string, string>,
	): number {
		const columnWidth = (contentWidth - 20) / 2; // Add spacing between columns
		const leftX = margin;
		const rightX = margin + columnWidth + 20;
		const startY = currentY;

		// Draw borders for both sections
		page.drawRectangle({
			x: leftX,
			y: currentY - 140,
			width: columnWidth,
			height: 140,
			borderColor: rgb(0.8, 0.8, 0.8),
			borderWidth: 1,
		});

		page.drawRectangle({
			x: rightX,
			y: currentY - 140,
			width: columnWidth,
			height: 140,
			borderColor: rgb(0.8, 0.8, 0.8),
			borderWidth: 1,
		});

		// Company Information (Left) - MANDATORY ELEMENTS
		let leftY = currentY - 10;
		PDFInvoiceGenerator.drawTextSafe(page, t.supplier, {
			x: leftX + 5,
			y: leftY,
			size: 12,
			font: boldFont,
			color: rgb(0.1, 0.1, 0.1),
		});
		leftY -= 20;

		// Company name (MANDATORY)
		PDFInvoiceGenerator.drawTextSafe(
			page,
			`${t.company} ${data.company.name || "-"}`,
			{
				x: leftX + 5,
				y: leftY,
				size: 10,
				font: boldFont,
				color: rgb(0.2, 0.2, 0.2),
			},
		);
		leftY -= 16;

		// Tax ID (MANDATORY)
		page.drawText(`${t.taxId} ${data.company.taxId || "-"}`, {
			x: leftX + 5,
			y: leftY,
			size: 9,
			font: font,
			color: rgb(0.3, 0.3, 0.3),
		});
		leftY -= 14;

		// Registration number (MANDATORY)
		page.drawText(`${t.regNo} ${data.company.registrationNumber || "-"}`, {
			x: leftX + 5,
			y: leftY,
			size: 9,
			font: font,
			color: rgb(0.3, 0.3, 0.3),
		});
		leftY -= 14;

		// Registered address (MANDATORY)
		if (data.company.address) {
			page.drawText(`${t.address}`, {
				x: leftX + 5,
				y: leftY,
				size: 9,
				font: font,
				color: rgb(0.3, 0.3, 0.3),
			});
			leftY -= 12;

			// Split long addresses
			const addressText = data.company.address;
			if (addressText.length > 30) {
				const words = addressText.split(" ");
				let line1 = "";
				let line2 = "";
				for (const word of words) {
					if (line1.length + word.length < 30) {
						line1 += (line1 ? " " : "") + word;
					} else {
						line2 += (line2 ? " " : "") + word;
					}
				}
				PDFInvoiceGenerator.drawTextSafe(page, line1, {
					x: leftX + 10,
					y: leftY,
					size: 8,
					font: font,
					color: rgb(0.3, 0.3, 0.3),
				});
				leftY -= 10;
				if (line2) {
					PDFInvoiceGenerator.drawTextSafe(page, line2, {
						x: leftX + 10,
						y: leftY,
						size: 8,
						font: font,
						color: rgb(0.3, 0.3, 0.3),
					});
					leftY -= 10;
				}
			} else {
				PDFInvoiceGenerator.drawTextSafe(page, addressText, {
					x: leftX + 10,
					y: leftY,
					size: 8,
					font: font,
					color: rgb(0.3, 0.3, 0.3),
				});
				leftY -= 12;
			}
		} else {
			page.drawText(`${t.address} -`, {
				x: leftX + 5,
				y: leftY,
				size: 9,
				font: font,
				color: rgb(0.3, 0.3, 0.3),
			});
			leftY -= 14;
		}

		// IBAN + Bank (RECOMMENDED)
		if (data.company.iban) {
			page.drawText(`IBAN: ${data.company.iban}`, {
				x: leftX + 5,
				y: leftY,
				size: 9,
				font: font,
				color: rgb(0.3, 0.3, 0.3),
			});
			leftY -= 14;
		}

		if (data.company.bank) {
			page.drawText(`Bank: ${data.company.bank}`, {
				x: leftX + 5,
				y: leftY,
				size: 9,
				font: font,
				color: rgb(0.3, 0.3, 0.3),
			});
			leftY -= 14;
		}

		// Contact details (RECOMMENDED)
		if (data.company.phone) {
			page.drawText(`Phone: ${data.company.phone}`, {
				x: leftX + 5,
				y: leftY,
				size: 9,
				font: font,
				color: rgb(0.3, 0.3, 0.3),
			});
			leftY -= 14;
		}

		if (data.company.email) {
			page.drawText(`Email: ${data.company.email}`, {
				x: leftX + 5,
				y: leftY,
				size: 9,
				font: font,
				color: rgb(0.3, 0.3, 0.3),
			});
			leftY -= 14;
		}

		// Customer Information (Right) - MANDATORY ELEMENTS
		let rightY = currentY - 10;
		PDFInvoiceGenerator.drawTextSafe(page, t.customer, {
			x: rightX + 5,
			y: rightY,
			size: 12,
			font: boldFont,
			color: rgb(0.1, 0.1, 0.1),
		});
		rightY -= 20;

		// Company/person name (MANDATORY)
		PDFInvoiceGenerator.drawTextSafe(
			page,
			`${t.company} ${data.customer.name || "-"}`,
			{
				x: rightX + 5,
				y: rightY,
				size: 10,
				font: boldFont,
				color: rgb(0.2, 0.2, 0.2),
			},
		);
		rightY -= 16;

		// Tax ID (MANDATORY if required)
		page.drawText(`${t.taxId} ${data.customer.taxId || "-"}`, {
			x: rightX + 5,
			y: rightY,
			size: 9,
			font: font,
			color: rgb(0.3, 0.3, 0.3),
		});
		rightY -= 14;

		// Complete address (MANDATORY)
		if (data.customer.address) {
			page.drawText(`${t.address}`, {
				x: rightX + 5,
				y: rightY,
				size: 9,
				font: font,
				color: rgb(0.3, 0.3, 0.3),
			});
			rightY -= 12;

			// Split long addresses
			const addressText = data.customer.address;
			if (addressText.length > 30) {
				const words = addressText.split(" ");
				let line1 = "";
				let line2 = "";
				for (const word of words) {
					if (line1.length + word.length < 30) {
						line1 += (line1 ? " " : "") + word;
					} else {
						line2 += (line2 ? " " : "") + word;
					}
				}
				PDFInvoiceGenerator.drawTextSafe(page, line1, {
					x: rightX + 10,
					y: rightY,
					size: 8,
					font: font,
					color: rgb(0.3, 0.3, 0.3),
				});
				rightY -= 10;
				if (line2) {
					PDFInvoiceGenerator.drawTextSafe(page, line2, {
						x: rightX + 10,
						y: rightY,
						size: 8,
						font: font,
						color: rgb(0.3, 0.3, 0.3),
					});
					rightY -= 10;
				}
			} else {
				PDFInvoiceGenerator.drawTextSafe(page, addressText, {
					x: rightX + 10,
					y: rightY,
					size: 8,
					font: font,
					color: rgb(0.3, 0.3, 0.3),
				});
				rightY -= 12;
			}
		} else {
			page.drawText(`${t.address} -`, {
				x: rightX + 5,
				y: rightY,
				size: 9,
				font: font,
				color: rgb(0.3, 0.3, 0.3),
			});
			rightY -= 14;
		}

		// Contact details (RECOMMENDED)
		if (data.customer.phone) {
			page.drawText(`Phone: ${data.customer.phone}`, {
				x: rightX + 5,
				y: rightY,
				size: 9,
				font: font,
				color: rgb(0.3, 0.3, 0.3),
			});
			rightY -= 14;
		}

		if (data.customer.email) {
			page.drawText(`Email: ${data.customer.email}`, {
				x: rightX + 5,
				y: rightY,
				size: 9,
				font: font,
				color: rgb(0.3, 0.3, 0.3),
			});
			rightY -= 14;
		}

		return currentY - 160;
	}

	private static drawInvoiceDetails(
		page: any,
		data: InvoicePDFData,
		font: any,
		boldFont: any,
		currentY: number,
		margin: number,
		contentWidth: number,
		t: Record<string, string>,
	): number {
		const columnWidth = contentWidth / 2;
		const leftX = margin;
		const rightX = margin + columnWidth;

		// Invoice Information (Left)
		PDFInvoiceGenerator.drawTextSafe(page, t.invoiceDetails, {
			x: leftX,
			y: currentY,
			size: 12,
			font: boldFont,
			color: rgb(0.2, 0.2, 0.2),
		});
		currentY -= 20;

		PDFInvoiceGenerator.drawTextSafe(
			page,
			`${t.issueDate} ${this.formatDate(data.invoice.date)}`,
			{
				x: leftX,
				y: currentY,
				size: 10,
				font: font,
				color: rgb(0.3, 0.3, 0.3),
			},
		);
		currentY -= 15;

		PDFInvoiceGenerator.drawTextSafe(
			page,
			`${t.currency} ${data.invoice.currency}`,
			{
				x: leftX,
				y: currentY,
				size: 10,
				font: font,
				color: rgb(0.3, 0.3, 0.3),
			},
		);
		currentY -= 15;

		// Payment Details (Right)
		currentY += 50; // Reset Y for right column
		PDFInvoiceGenerator.drawTextSafe(page, t.paymentDetails, {
			x: rightX,
			y: currentY,
			size: 12,
			font: boldFont,
			color: rgb(0.2, 0.2, 0.2),
		});
		currentY -= 20;

		PDFInvoiceGenerator.drawTextSafe(page, t.paymentTerms, {
			x: rightX,
			y: currentY,
			size: 10,
			font: font,
			color: rgb(0.3, 0.3, 0.3),
		});
		currentY -= 15;

		PDFInvoiceGenerator.drawTextSafe(
			page,
			t.paymentMethod,
			{
				x: rightX,
				y: currentY,
				size: 10,
				font: font,
				color: rgb(0.3, 0.3, 0.3),
			},
		);
		currentY -= 15;

		return currentY - 30;
	}

	private static drawItemsTable(
		page: any,
		data: InvoicePDFData,
		font: any,
		boldFont: any,
		currentY: number,
		margin: number,
		contentWidth: number,
		t: Record<string, string>,
	): number {
		// Table headers - MANDATORY ELEMENTS according to legislation
		const headers = [
			t.no,
			t.description,
			t.um,
			t.quantity,
			t.unitPrice,
			t.currencyCol,
			t.vatPercent,
			t.vatValue,
			t.lineTotal,
		];
		const columnWidths = [25, 180, 30, 40, 50, 35, 30, 40, 50];
		const tableHeight = 25 + data.items.length * 20 + 10;

		// Draw section title
		PDFInvoiceGenerator.drawTextSafe(page, t.descriptionOfGoods, {
			x: margin,
			y: currentY,
			size: 12,
			font: boldFont,
			color: rgb(0.1, 0.1, 0.1),
		});
		currentY -= 25;

		// Draw table border
		page.drawRectangle({
			x: margin,
			y: currentY - tableHeight,
			width: contentWidth,
			height: tableHeight,
			borderColor: rgb(0.8, 0.8, 0.8),
			borderWidth: 1,
		});

		// Draw header row background
		page.drawRectangle({
			x: margin,
			y: currentY - 20,
			width: contentWidth,
			height: 20,
			color: rgb(0.9, 0.9, 0.9),
			borderColor: rgb(0.8, 0.8, 0.8),
			borderWidth: 1,
		});

		// Draw vertical lines for columns
		let currentX = margin;
		for (let i = 0; i < columnWidths.length - 1; i++) {
			currentX += columnWidths[i];
			page.drawLine({
				start: { x: currentX, y: currentY },
				end: { x: currentX, y: currentY - tableHeight },
				color: rgb(0.8, 0.8, 0.8),
				thickness: 1,
			});
		}

		// Draw header text
		currentX = margin;
		headers.forEach((header, index) => {
			PDFInvoiceGenerator.drawTextSafe(page, header, {
				x: currentX + 2,
				y: currentY - 14,
				size: 8,
				font: boldFont,
				color: rgb(0.1, 0.1, 0.1),
			});
			currentX += columnWidths[index];
		});

		currentY -= 20;

		// Draw items
		data.items.forEach((item, index) => {
			// Draw row separator
			if (index > 0) {
				page.drawLine({
					start: { x: margin, y: currentY },
					end: { x: margin + contentWidth, y: currentY },
					color: rgb(0.9, 0.9, 0.9),
					thickness: 0.5,
				});
			}

			currentX = margin;

			// Nr. crt.
			page.drawText((index + 1).toString(), {
				x: currentX + 2,
				y: currentY - 14,
				size: 8,
				font: font,
				color: rgb(0.2, 0.2, 0.2),
			});
			currentX += columnWidths[0];

			// Description - handle long text
			let description = item.description || "-";
			if (description.length > 25) {
				description = description.substring(0, 22) + "...";
			}
			PDFInvoiceGenerator.drawTextSafe(page, description, {
				x: currentX + 2,
				y: currentY - 14,
				size: 8,
				font: font,
				color: rgb(0.2, 0.2, 0.2),
			});
			currentX += columnWidths[1];

			// Unit of Measure (U.M.)
			const unitOfMeasure = "buc"; // Default unit of measure
			PDFInvoiceGenerator.drawTextSafe(page, unitOfMeasure, {
				x: currentX + 2,
				y: currentY - 14,
				size: 8,
				font: font,
				color: rgb(0.2, 0.2, 0.2),
			});
			currentX += columnWidths[2];

			// Quantity
			page.drawText((item.quantity || 0).toString(), {
				x: currentX + 2,
				y: currentY - 14,
				size: 8,
				font: font,
				color: rgb(0.2, 0.2, 0.2),
			});
			currentX += columnWidths[3];

			// Unit Price
			page.drawText(this.formatPrice(item.unitPrice || 0), {
				x: currentX + 2,
				y: currentY - 14,
				size: 8,
				font: font,
				color: rgb(0.2, 0.2, 0.2),
			});
			currentX += columnWidths[4];

			// Currency
			page.drawText(item.currency || "-", {
				x: currentX + 2,
				y: currentY - 14,
				size: 8,
				font: font,
				color: rgb(0.2, 0.2, 0.2),
			});
			currentX += columnWidths[5];

			// VAT Rate
			const vatRate = item.vatRate || 0;
			page.drawText(`${vatRate}%`, {
				x: currentX + 2,
				y: currentY - 14,
				size: 8,
				font: font,
				color: rgb(0.2, 0.2, 0.2),
			});
			currentX += columnWidths[6];

			// VAT Amount
			const vatAmount = item.vatAmount || 0;
			page.drawText(this.formatPrice(vatAmount), {
				x: currentX + 2,
				y: currentY - 14,
				size: 8,
				font: font,
				color: rgb(0.2, 0.2, 0.2),
			});
			currentX += columnWidths[7];

			// Total line
			page.drawText(this.formatPrice(item.total || 0), {
				x: currentX + 2,
				y: currentY - 14,
				size: 8,
				font: boldFont,
				color: rgb(0.2, 0.2, 0.2),
			});

			currentY -= 20;
		});

		return currentY - 20;
	}

	private static drawTotals(
		page: any,
		data: InvoicePDFData,
		font: any,
		boldFont: any,
		currentY: number,
		margin: number,
		contentWidth: number,
		t: Record<string, string>,
	): number {
		const totalsWidth = 220;
		const totalsX = margin + contentWidth - totalsWidth;

		// Draw totals border
		page.drawRectangle({
			x: totalsX,
			y: currentY - 110,
			width: totalsWidth,
			height: 110,
			borderColor: rgb(0.8, 0.8, 0.8),
			borderWidth: 1,
		});

		// Subtotal without VAT (MANDATORY)
		PDFInvoiceGenerator.drawTextSafe(page, t.subtotalExclVat, {
			x: totalsX + 5,
			y: currentY - 15,
			size: 10,
			font: boldFont,
			color: rgb(0.2, 0.2, 0.2),
		});
		page.drawText(
			`${this.formatPrice(data.totals.subtotal)} ${data.totals.currency}`,
			{
				x: totalsX + 130,
				y: currentY - 15,
				size: 10,
				font: font,
				color: rgb(0.2, 0.2, 0.2),
			},
		);

		// VAT Total (MANDATORY)
		PDFInvoiceGenerator.drawTextSafe(page, t.vatTotal, {
			x: totalsX + 5,
			y: currentY - 35,
			size: 10,
			font: boldFont,
			color: rgb(0.2, 0.2, 0.2),
		});
		page.drawText(
			`${this.formatPrice(data.totals.vatTotal)} ${data.totals.currency}`,
			{
				x: totalsX + 130,
				y: currentY - 35,
				size: 10,
				font: font,
				color: rgb(0.2, 0.2, 0.2),
			},
		);

		// Draw separator line
		page.drawLine({
			start: { x: totalsX + 5, y: currentY - 45 },
			end: { x: totalsX + totalsWidth - 5, y: currentY - 45 },
			color: rgb(0.6, 0.6, 0.6),
			thickness: 1,
		});

		// Grand Total cu TVA (OBLIGATORIU)
		page.drawRectangle({
			x: totalsX + 2,
			y: currentY - 95,
			width: totalsWidth - 4,
			height: 35,
			color: rgb(0.95, 0.95, 0.95),
			borderColor: rgb(0.8, 0.8, 0.8),
			borderWidth: 1,
		});

		PDFInvoiceGenerator.drawTextSafe(page, t.grandTotalInclVat, {
			x: totalsX + 5,
			y: currentY - 70,
			size: 12,
			font: boldFont,
			color: rgb(0.1, 0.1, 0.1),
		});
		page.drawText(
			`${this.formatPrice(data.totals.grandTotal)} ${data.totals.currency}`,
			{
				x: totalsX + 5,
				y: currentY - 90,
				size: 14,
				font: boldFont,
				color: rgb(0.8, 0.2, 0.2),
			},
		);

		currentY -= 120;

		// Total in words - using ASCII only (MANDATORY)
		const totalInWords = `${t.totalInWords} ${this.numberToWords(
			data.totals.grandTotal,
		)} ${data.totals.currency}`;

		// Draw background for total in words
		page.drawRectangle({
			x: margin,
			y: currentY - 5,
			width: contentWidth,
			height: 20,
			color: rgb(0.98, 0.98, 0.98),
			borderColor: rgb(0.9, 0.9, 0.9),
			borderWidth: 1,
		});

		PDFInvoiceGenerator.drawTextSafe(page, totalInWords, {
			x: margin + 5,
			y: currentY + 5,
			size: 10,
			font: font,
			color: rgb(0.4, 0.4, 0.4),
		});

		return currentY - 30;
	}

	private static drawPaymentDetails(
		page: any,
		data: InvoicePDFData,
		font: any,
		boldFont: any,
		currentY: number,
		margin: number,
		contentWidth: number,
		t: Record<string, string>,
	): number {
		// Draw payment details section
		page.drawRectangle({
			x: margin,
			y: currentY - 50,
			width: contentWidth,
			height: 50,
			color: rgb(0.97, 0.97, 0.97),
			borderColor: rgb(0.8, 0.8, 0.8),
			borderWidth: 1,
		});

		// Section title
		PDFInvoiceGenerator.drawTextSafe(page, t.paymentInformation, {
			x: margin + 5,
			y: currentY - 15,
			size: 11,
			font: boldFont,
			color: rgb(0.1, 0.1, 0.1),
		});

		// Payment method (MANDATORY)
		const paymentMethod = data.invoice.paymentMethod || "Bank Transfer";
		PDFInvoiceGenerator.drawTextSafe(page, `${t.paymentMethodLabel} ${paymentMethod}`, {
			x: margin + 5,
			y: currentY - 30,
			size: 9,
			font: font,
			color: rgb(0.3, 0.3, 0.3),
		});

		// Payment terms (MANDATORY)
		const paymentTerms = data.invoice.paymentTerms || "Net 30 days";
		PDFInvoiceGenerator.drawTextSafe(page, `${t.paymentTermsLabel} ${paymentTerms}`, {
			x: margin + 200,
			y: currentY - 30,
			size: 9,
			font: font,
			color: rgb(0.3, 0.3, 0.6),
		});

		return currentY - 60;
	}

	private static drawLegalNotice(
		page: any,
		data: InvoicePDFData,
		font: any,
		currentY: number,
		margin: number,
		contentWidth: number,
		t: Record<string, string>,
	): void {
		// Draw legal notice section with border
		page.drawRectangle({
			x: margin,
			y: currentY - 60,
			width: contentWidth,
			height: 60,
			color: rgb(0.98, 0.98, 0.98),
			borderColor: rgb(0.8, 0.8, 0.8),
			borderWidth: 1,
		});

		// Legal notice title
		PDFInvoiceGenerator.drawTextSafe(page, t.legalNotices, {
			x: margin + 5,
			y: currentY - 15,
			size: 11,
			font: font,
			color: rgb(0.1, 0.1, 0.1),
		});

		// Legal text 1 (MANDATORY)
		const legalText1 = t.legalText1;
		PDFInvoiceGenerator.drawTextSafe(page, legalText1, {
			x: margin + 5,
			y: currentY - 30,
			size: 9,
			font: font,
			color: rgb(0.4, 0.4, 0.4),
		});

		// Legal text 2 (MANDATORY)
		const legalText2 = t.legalText2;
		PDFInvoiceGenerator.drawTextSafe(page, legalText2, {
			x: margin + 2,
			y: currentY - 45,
			size: 9,
			font: font,
			color: rgb(0.4, 0.4, 0.4),
		});

		// Draw footer section
		page.drawRectangle({
			x: margin,
			y: 30,
			width: contentWidth,
			height: 25,
			color: rgb(0.95, 0.95, 0.95),
			borderColor: rgb(0.9, 0.9, 0.9),
			borderWidth: 1,
		});

		// Footer with generation info
		const footerText = `${t.documentGenerated} ${this.formatDate(
			new Date().toISOString(),
		)}`;
		const footerWidth = font.widthOfTextAtSize(footerText, 8);

		PDFInvoiceGenerator.drawTextSafe(page, footerText, {
			x: (page.getWidth() - footerWidth) / 2,
			y: 42,
			size: 8,
			font: font,
			color: rgb(0.5, 0.5, 0.5),
		});

		// Add page number (for future multi-page support)
		PDFInvoiceGenerator.drawTextSafe(page, `${t.page} 1`, {
			x: margin + contentWidth - 50,
			y: 42,
			size: 8,
			font: font,
			color: rgb(0.6, 0.6, 0.6),
		});
	}

	/**
	 * Format date to English format - using ASCII only
	 */
	private static formatDate(dateString: string): string {
		const date = new Date(dateString);
		// Using English month names to avoid encoding issues
		return date.toLocaleDateString("en-US", {
			year: "numeric",
			month: "long",
			day: "numeric",
		});
	}

	/**
	 * Format price with 2 decimal places
	 */
	private static formatPrice(price: number): string {
		return price.toFixed(2);
	}

	/**
	 * Convert number to Romanian words - using ASCII only
	 */
	private static numberToWords(num: number): string {
		// Simplified Romanian number to words conversion - ASCII only
		if (num === 0) return "zero";
		if (num < 1000) return this.convertLessThanOneThousand(num);
		if (num < 1000000) return this.convertLessThanOneMillion(num);
		return this.convertLessThanOneBillion(num);
	}

	private static convertLessThanOneThousand(num: number): string {
		const ones = [
			"",
			"unu",
			"doi",
			"trei",
			"patru",
			"cinci",
			"sase",
			"sapte",
			"opt",
			"noua",
		];
		const tens = [
			"",
			"zece",
			"douazeci",
			"treizeci",
			"patruzeci",
			"cincizeci",
			"saizeci",
			"saptezeci",
			"optzeci",
			"nouazeci",
		];
		const teens = [
			"zece",
			"unsprezece",
			"douasprezece",
			"treisprezece",
			"paisprezece",
			"cincisprezece",
			"saisprezece",
			"saptesprezece",
			"optsprezece",
			"nouasprezece",
		];

		if (num === 0) return "";
		if (num < 10) return ones[num];
		if (num < 20) return teens[num - 10];
		if (num < 100) {
			if (num % 10 === 0) return tens[Math.floor(num / 10)];
			return tens[Math.floor(num / 10)] + " si " + ones[num % 10];
		}
		if (num % 100 === 0) return ones[Math.floor(num / 100)] + " sute";
		return (
			ones[Math.floor(num / 100)] +
			" sute " +
			this.convertLessThanOneThousand(num % 100)
		);
	}

	private static convertLessThanOneMillion(num: number): string {
		if (num === 0) return "";
		if (num < 1000) return this.convertLessThanOneThousand(num);
		if (num % 1000 === 0)
			return this.convertLessThanOneThousand(Math.floor(num / 1000)) + " mii";
		return (
			this.convertLessThanOneThousand(Math.floor(num / 1000)) +
			" mii " +
			this.convertLessThanOneThousand(num % 1000)
		);
	}

	private static convertLessThanOneBillion(num: number): string {
		if (num === 0) return "";
		if (num < 1000000) return this.convertLessThanOneMillion(num);
		if (num % 1000000 === 0)
			return (
				this.convertLessThanOneThousand(Math.floor(num / 1000000)) + " milioane"
			);
		return (
			this.convertLessThanOneThousand(Math.floor(num / 1000000)) +
			" milioane " +
			this.convertLessThanOneMillion(num % 1000000)
		);
	}
}
