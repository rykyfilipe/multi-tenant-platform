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
	 * Handle Unicode text for PDF generation
	 * This function ensures text is properly encoded for PDF display
	 */
	private static handleUnicodeText(text: string): string {
		if (!text) return text;
		
		// For languages that use non-Latin characters, we need to handle them specially
		// This is a temporary solution until we implement proper Unicode font support
		const hasNonLatinChars = /[^\u0000-\u007F]/.test(text);
		
		if (hasNonLatinChars) {
			// For now, replace problematic characters with safe alternatives
			// This is a temporary workaround until we implement proper Unicode font support
			return text
				.replace(/[^\u0000-\u007F]/g, '?') // Replace non-ASCII characters with ?
				.replace(/\?+/g, '?'); // Replace multiple ? with single ?
		}
		
		return text;
	}

	/**
	 * Helper function to draw text with Unicode support
	 */
	private static drawTextSafe(page: any, text: string, options: any): void {
		page.drawText(PDFInvoiceGenerator.handleUnicodeText(text), options);
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
				invoice: 'FACTURA',
				supplier: 'FURNIZOR (EMITENT):',
				customer: 'CLIENT (FACTURAT CATRE):',
				company: 'Compania:',
				taxId: 'CUI:',
				regNo: 'Nr. Reg.:',
				address: 'Adresa:',
				invoiceDetails: 'DETALII FACTURA:',
				issueDate: 'Data emiterii:',
				currency: 'Moneda:',
				paymentDetails: 'DETALII PLATA:',
				paymentTerms: 'Termeni de plata: Net 30',
				paymentMethod: 'Metoda de plata: Transfer bancar / Card de credit',
				descriptionOfGoods: 'DESCRIEREA BUNURILOR/SERVICIILOR:',
				no: 'Nr.',
				description: 'Descrierea bunurilor/serviciilor',
				um: 'U.M.',
				quantity: 'Cantitatea',
				unitPrice: 'Pret unitar',
				currencyCol: 'Moneda',
				vatPercent: 'TVA %',
				vatValue: 'Valoarea TVA',
				lineTotal: 'Total linie',
				subtotalExclVat: 'Subtotal (fara TVA):',
				vatTotal: 'Total TVA:',
				grandTotalInclVat: 'TOTAL GENERAL (cu TVA):',
				totalInWords: 'Totalul in cuvinte:',
				paymentInformation: 'INFORMATII DE PLATA:',
				paymentMethodLabel: 'Metoda de plata:',
				paymentTermsLabel: 'Termeni de plata:',
				legalNotices: 'AVIZE LEGALE:',
				legalText1: 'Aceasta factura este un document fiscal conform legislatiei in vigoare.',
				legalText2: 'Factura serveste ca chitanta daca plata se face prin banca.',
				documentGenerated: 'Document generat automat pe',
				page: 'Pagina',
			},
			es: {
				invoice: 'FACTURA',
				supplier: 'PROVEEDOR (EMISOR):',
				customer: 'CLIENTE (FACTURAR A):',
				company: 'Empresa:',
				taxId: 'CIF:',
				regNo: 'Nº Reg.:',
				address: 'Direccion:',
				invoiceDetails: 'DETALLES FACTURA:',
				issueDate: 'Fecha de emision:',
				currency: 'Moneda:',
				paymentDetails: 'DETALLES PAGO:',
				paymentTerms: 'Terminos de pago: Net 30',
				paymentMethod: 'Metodo de pago: Transferencia bancaria / Tarjeta de credito',
				descriptionOfGoods: 'DESCRIPCION DE BIENES/SERVICIOS:',
				no: 'Nº',
				description: 'Descripcion de bienes/servicios',
				um: 'U.M.',
				quantity: 'Cantidad',
				unitPrice: 'Precio unitario',
				currencyCol: 'Moneda',
				vatPercent: 'IVA %',
				vatValue: 'Valor IVA',
				lineTotal: 'Total linea',
				subtotalExclVat: 'Subtotal (sin IVA):',
				vatTotal: 'Total IVA:',
				grandTotalInclVat: 'TOTAL GENERAL (con IVA):',
				totalInWords: 'Total en palabras:',
				paymentInformation: 'INFORMACION DE PAGO:',
				paymentMethodLabel: 'Metodo de pago:',
				paymentTermsLabel: 'Terminos de pago:',
				legalNotices: 'AVISOS LEGALES:',
				legalText1: 'Esta factura es un documento fiscal segun la legislacion vigente.',
				legalText2: 'La factura sirve como recibo si el pago se realiza a traves del banco.',
				documentGenerated: 'Documento generado automaticamente el',
				page: 'Pagina',
			},
			fr: {
				invoice: 'FACTURE',
				supplier: 'FOURNISSEUR (EMETTEUR):',
				customer: 'CLIENT (FACTURER A):',
				company: 'Societe:',
				taxId: 'SIRET:',
				regNo: 'N° Reg.:',
				address: 'Adresse:',
				invoiceDetails: 'DETAILS FACTURE:',
				issueDate: 'Date d\'emission:',
				currency: 'Devise:',
				paymentDetails: 'DETAILS PAIEMENT:',
				paymentTerms: 'Conditions de paiement: Net 30',
				paymentMethod: 'Methode de paiement: Virement bancaire / Carte de credit',
				descriptionOfGoods: 'DESCRIPTION DES BIENS/SERVICES:',
				no: 'N°',
				description: 'Description des biens/services',
				um: 'U.M.',
				quantity: 'Quantite',
				unitPrice: 'Prix unitaire',
				currencyCol: 'Devise',
				vatPercent: 'TVA %',
				vatValue: 'Valeur TVA',
				lineTotal: 'Total ligne',
				subtotalExclVat: 'Sous-total (sans TVA):',
				vatTotal: 'Total TVA:',
				grandTotalInclVat: 'TOTAL GENERAL (avec TVA):',
				totalInWords: 'Total en mots:',
				paymentInformation: 'INFORMATIONS PAIEMENT:',
				paymentMethodLabel: 'Methode de paiement:',
				paymentTermsLabel: 'Conditions de paiement:',
				legalNotices: 'AVIS LEGAUX:',
				legalText1: 'Cette facture est un document fiscal selon la legislation en vigueur.',
				legalText2: 'La facture sert de recu si le paiement est effectue par banque.',
				documentGenerated: 'Document genere automatiquement le',
				page: 'Page',
			},
			de: {
				invoice: 'RECHNUNG',
				supplier: 'LIEFERANT (AUSSTELLER):',
				customer: 'KUNDE (RECHNUNG AN):',
				company: 'Unternehmen:',
				taxId: 'USt-IdNr:',
				regNo: 'Reg.-Nr.:',
				address: 'Adresse:',
				invoiceDetails: 'RECHNUNGSDETAILS:',
				issueDate: 'Ausstellungsdatum:',
				currency: 'Wahrung:',
				paymentDetails: 'ZAHLUNGSDETAILS:',
				paymentTerms: 'Zahlungsbedingungen: Netto 30',
				paymentMethod: 'Zahlungsmethode: Bankuberweisung / Kreditkarte',
				descriptionOfGoods: 'BESCHREIBUNG WAREN/DIENSTLEISTUNGEN:',
				no: 'Nr.',
				description: 'Beschreibung Waren/Dienstleistungen',
				um: 'Einh.',
				quantity: 'Menge',
				unitPrice: 'Einzelpreis',
				currencyCol: 'Wahrung',
				vatPercent: 'MwSt %',
				vatValue: 'MwSt-Wert',
				lineTotal: 'Zeilen-Summe',
				subtotalExclVat: 'Zwischensumme (ohne MwSt):',
				vatTotal: 'MwSt-Gesamt:',
				grandTotalInclVat: 'GESAMTSUMME (mit MwSt):',
				totalInWords: 'Gesamtsumme in Worten:',
				paymentInformation: 'ZAHLUNGSINFORMATIONEN:',
				paymentMethodLabel: 'Zahlungsmethode:',
				paymentTermsLabel: 'Zahlungsbedingungen:',
				legalNotices: 'RECHTLICHE HINWEISE:',
				legalText1: 'Diese Rechnung ist ein Steuerdokument nach geltendem Recht.',
				legalText2: 'Die Rechnung dient als Quittung bei Bankzahlung.',
				documentGenerated: 'Dokument automatisch generiert am',
				page: 'Seite',
			},
			zh: {
				invoice: '发票',
				supplier: '供应商（开票方）:',
				customer: '客户（开票给）:',
				company: '公司:',
				taxId: '税号:',
				regNo: '注册号:',
				address: '地址:',
				invoiceDetails: '发票详情:',
				issueDate: '开票日期:',
				currency: '货币:',
				paymentDetails: '付款详情:',
				paymentTerms: '付款条件: 净30天',
				paymentMethod: '付款方式: 银行转账 / 信用卡',
				descriptionOfGoods: '商品/服务描述:',
				no: '编号',
				description: '商品/服务描述',
				um: '单位',
				quantity: '数量',
				unitPrice: '单价',
				currencyCol: '货币',
				vatPercent: '增值税%',
				vatValue: '增值税额',
				lineTotal: '行总计',
				subtotalExclVat: '小计（不含增值税）:',
				vatTotal: '增值税总计:',
				grandTotalInclVat: '总计（含增值税）:',
				totalInWords: '总金额（大写）:',
				paymentInformation: '付款信息:',
				paymentMethodLabel: '付款方式:',
				paymentTermsLabel: '付款条件:',
				legalNotices: '法律声明:',
				legalText1: '本发票是根据现行法律规定的税务文件。',
				legalText2: '通过银行付款时，发票作为收据。',
				documentGenerated: '文档自动生成于',
				page: '页',
			},
			ru: {
				invoice: 'СЧЕТ-ФАКТУРА',
				supplier: 'ПОСТАВЩИК (ЭМИТЕНТ):',
				customer: 'КЛИЕНТ (СЧЕТ ВЫСТАВЛЕН):',
				company: 'Компания:',
				taxId: 'ИНН:',
				regNo: 'Рег. №:',
				address: 'Адрес:',
				invoiceDetails: 'ДЕТАЛИ СЧЕТА:',
				issueDate: 'Дата выставления:',
				currency: 'Валюта:',
				paymentDetails: 'ДЕТАЛИ ПЛАТЕЖА:',
				paymentTerms: 'Условия оплаты: Чистые 30',
				paymentMethod: 'Способ оплаты: Банковский перевод / Кредитная карта',
				descriptionOfGoods: 'ОПИСАНИЕ ТОВАРОВ/УСЛУГ:',
				no: '№',
				description: 'Описание товаров/услуг',
				um: 'Ед.',
				quantity: 'Количество',
				unitPrice: 'Цена за единицу',
				currencyCol: 'Валюта',
				vatPercent: 'НДС %',
				vatValue: 'Сумма НДС',
				lineTotal: 'Итого по строке',
				subtotalExclVat: 'Промежуточный итог (без НДС):',
				vatTotal: 'Итого НДС:',
				grandTotalInclVat: 'ОБЩИЙ ИТОГ (с НДС):',
				totalInWords: 'Итого прописью:',
				paymentInformation: 'ИНФОРМАЦИЯ О ПЛАТЕЖЕ:',
				paymentMethodLabel: 'Способ оплаты:',
				paymentTermsLabel: 'Условия оплаты:',
				legalNotices: 'ПРАВОВЫЕ УВЕДОМЛЕНИЯ:',
				legalText1: 'Данный счет-фактура является налоговым документом согласно действующему законодательству.',
				legalText2: 'Счет-фактура служит квитанцией при оплате через банк.',
				documentGenerated: 'Документ автоматически сгенерирован',
				page: 'Страница',
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

		// Try to use Unicode-compatible fonts, fallback to standard fonts
		let font, boldFont;
		try {
			// For Unicode support, we need to use a different approach
			// For now, we'll use TimesRoman which has better Unicode support than Helvetica
			font = await pdfDoc.embedFont(StandardFonts.TimesRoman);
			boldFont = await pdfDoc.embedFont(StandardFonts.TimesRomanBold);
		} catch (error) {
			console.warn('Failed to load Unicode fonts, falling back to Helvetica:', error);
			// Fallback to standard fonts
			font = await pdfDoc.embedFont(StandardFonts.Helvetica);
			boldFont = await pdfDoc.embedFont(StandardFonts.HelveticaBold);
		}

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

		// Footer section is now handled in drawPaymentDetails

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
		const { width } = page.getSize();
		
		// Company logo placeholder (grid pattern like in image)
		this.drawCompanyLogo(page, margin, currentY - 20);
		
		// Company name
		PDFInvoiceGenerator.drawTextSafe(page, data.company.name || "Pin Box", {
			x: margin + 60,
			y: currentY - 10,
			size: 18,
			font: boldFont,
			color: rgb(0.1, 0.1, 0.1),
		});
		
		PDFInvoiceGenerator.drawTextSafe(page, "Private Limited", {
			x: margin + 60,
			y: currentY - 30,
			size: 12,
			font: font,
			color: rgb(0.3, 0.3, 0.3),
		});

		// Invoice title - right side
		PDFInvoiceGenerator.drawTextSafe(page, t.invoice, {
			x: width - 150,
			y: currentY - 10,
			size: 32,
			font: boldFont,
			color: rgb(0.1, 0.1, 0.1),
		});

		// Invoice number and date
		PDFInvoiceGenerator.drawTextSafe(page, `Invoice# ${data.invoice.number}`, {
			x: width - 150,
			y: currentY - 40,
			size: 12,
			font: boldFont,
			color: rgb(0.2, 0.2, 0.2),
		});

		PDFInvoiceGenerator.drawTextSafe(page, `Date: ${this.formatDate(data.invoice.date)}`, {
			x: width - 150,
			y: currentY - 55,
			size: 12,
			font: font,
			color: rgb(0.3, 0.3, 0.3),
		});

		return currentY - 80;
	}

	private static drawCompanyLogo(page: any, x: number, y: number): void {
		// Draw a 3x3 grid pattern like in the image
		const gridSize = 6;
		const spacing = 2;
		
		// Draw 8 squares in a 3x3 grid (missing center square)
		const positions = [
			{ row: 0, col: 0 }, { row: 0, col: 1 }, { row: 0, col: 2 },
			{ row: 1, col: 0 }, { row: 1, col: 2 },
			{ row: 2, col: 0 }, { row: 2, col: 1 }, { row: 2, col: 2 }
		];
		
		positions.forEach(pos => {
			const squareX = x + pos.col * (gridSize + spacing);
			const squareY = y - pos.row * (gridSize + spacing);
			
			page.drawRectangle({
				x: squareX,
				y: squareY,
				width: gridSize,
				height: gridSize,
				color: rgb(0, 0, 0),
			});
		});
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
		const { width } = page.getSize();
		const leftX = margin;
		const rightX = width - 200;
		const startY = currentY;

		// Bill To section (Right side)
		let rightY = currentY - 10;
		PDFInvoiceGenerator.drawTextSafe(page, "Bill To:", {
			x: rightX,
			y: rightY,
			size: 12,
			font: boldFont,
			color: rgb(0.1, 0.1, 0.1),
		});
		rightY -= 20;

		// Customer name
		PDFInvoiceGenerator.drawTextSafe(page, data.customer.name || "Jonathon Deo", {
			x: rightX,
			y: rightY,
			size: 12,
			font: boldFont,
			color: rgb(0.2, 0.2, 0.2),
		});
		rightY -= 15;

		// Customer address
		PDFInvoiceGenerator.drawTextSafe(page, data.customer.address || "123 Street, Town/City, County", {
			x: rightX,
			y: rightY,
			size: 10,
			font: font,
			color: rgb(0.3, 0.3, 0.3),
		});
		rightY -= 15;

		// Customer phone
		if (data.customer.phone) {
			PDFInvoiceGenerator.drawTextSafe(page, data.customer.phone, {
				x: rightX,
				y: rightY,
				size: 10,
				font: font,
				color: rgb(0.3, 0.3, 0.3),
			});
		}

		// Total Due section
		const totalDueY = currentY - 10;
		PDFInvoiceGenerator.drawTextSafe(page, "Total Due:", {
			x: rightX,
			y: totalDueY - 60,
			size: 12,
			font: boldFont,
			color: rgb(0.1, 0.1, 0.1),
		});
		
		const currency = data.invoice.currency || "USD";
		const grandTotal = data.totals.grandTotal || 0;
		PDFInvoiceGenerator.drawTextSafe(page, `${currency}: $ ${grandTotal.toFixed(2)}`, {
			x: rightX,
			y: totalDueY - 80,
			size: 14,
			font: boldFont,
			color: rgb(0.1, 0.1, 0.1),
		});

		return currentY - 100;
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
		// Table headers matching the image
		const headers = [
			"ITEM DESCRIPTION",
			"PRICE",
			"QTY",
			"TOTAL"
		];
		const columnWidths = [300, 80, 60, 80];
		const tableHeight = 25 + data.items.length * 30 + 10;

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
			color: rgb(0.95, 0.95, 0.95),
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
				x: currentX + 5,
				y: currentY - 14,
				size: 10,
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

			// Item description with sub-description
			const description = item.description || "Web Design";
			const subDescription = "Contrary to popular belief Lorem Ipsum simply";
			
			PDFInvoiceGenerator.drawTextSafe(page, description, {
				x: currentX + 5,
				y: currentY - 12,
				size: 10,
				font: boldFont,
				color: rgb(0.2, 0.2, 0.2),
			});
			
			PDFInvoiceGenerator.drawTextSafe(page, subDescription, {
				x: currentX + 5,
				y: currentY - 25,
				size: 8,
				font: font,
				color: rgb(0.4, 0.4, 0.4),
			});
			currentX += columnWidths[0];

			// Price
			PDFInvoiceGenerator.drawTextSafe(page, `$${this.formatPrice(item.unitPrice || 0)}`, {
				x: currentX + 5,
				y: currentY - 12,
				size: 10,
				font: font,
				color: rgb(0.2, 0.2, 0.2),
			});
			currentX += columnWidths[1];

			// Quantity
			PDFInvoiceGenerator.drawTextSafe(page, (item.quantity || 0).toString(), {
				x: currentX + 5,
				y: currentY - 12,
				size: 10,
				font: font,
				color: rgb(0.2, 0.2, 0.2),
			});
			currentX += columnWidths[2];

			// Total
			PDFInvoiceGenerator.drawTextSafe(page, `$${this.formatPrice(item.total || 0)}`, {
				x: currentX + 5,
				y: currentY - 12,
				size: 10,
				font: font,
				color: rgb(0.2, 0.2, 0.2),
			});

			currentY -= 30;
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
		const { width } = page.getSize();
		const totalsWidth = 200;
		const totalsX = width - totalsWidth - margin;

		// Subtotal
		PDFInvoiceGenerator.drawTextSafe(page, "SUB TOTAL", {
			x: totalsX,
			y: currentY,
			size: 10,
			font: boldFont,
			color: rgb(0.2, 0.2, 0.2),
		});
		PDFInvoiceGenerator.drawTextSafe(page, `$${this.formatPrice(data.totals.subtotal)}`, {
			x: totalsX + 120,
			y: currentY,
			size: 10,
			font: font,
			color: rgb(0.2, 0.2, 0.2),
		});
		currentY -= 20;

		// Tax VAT 18%
		PDFInvoiceGenerator.drawTextSafe(page, "Tax Vat 18%", {
			x: totalsX,
			y: currentY,
			size: 10,
			font: boldFont,
			color: rgb(0.2, 0.2, 0.2),
		});
		PDFInvoiceGenerator.drawTextSafe(page, `$${this.formatPrice(data.totals.vatTotal)}`, {
			x: totalsX + 120,
			y: currentY,
			size: 10,
			font: font,
			color: rgb(0.2, 0.2, 0.2),
		});
		currentY -= 20;

		// Discount 10%
		const discount = data.totals.subtotal * 0.1;
		PDFInvoiceGenerator.drawTextSafe(page, "Discount 10%", {
			x: totalsX,
			y: currentY,
			size: 10,
			font: boldFont,
			color: rgb(0.2, 0.2, 0.2),
		});
		PDFInvoiceGenerator.drawTextSafe(page, `-$${this.formatPrice(discount)}`, {
			x: totalsX + 120,
			y: currentY,
			size: 10,
			font: font,
			color: rgb(0.2, 0.2, 0.2),
		});
		currentY -= 20;

		// Draw separator line
		page.drawLine({
			start: { x: totalsX, y: currentY + 10 },
			end: { x: totalsX + totalsWidth, y: currentY + 10 },
			color: rgb(0.6, 0.6, 0.6),
			thickness: 1,
		});
		currentY -= 20;

		// Grand Total
		const grandTotal = data.totals.grandTotal - discount;
		PDFInvoiceGenerator.drawTextSafe(page, "Grand Total", {
			x: totalsX,
			y: currentY,
			size: 14,
			font: boldFont,
			color: rgb(0.1, 0.1, 0.1),
		});
		PDFInvoiceGenerator.drawTextSafe(page, `$${this.formatPrice(grandTotal)}`, {
			x: totalsX + 120,
			y: currentY,
			size: 14,
			font: boldFont,
			color: rgb(0.1, 0.1, 0.1),
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
		const { width } = page.getSize();
		const leftX = margin;
		const rightX = width - 200;

		// Left side - Payment Method
		let leftY = currentY;
		PDFInvoiceGenerator.drawTextSafe(page, "Payment Method:", {
			x: leftX,
			y: leftY,
			size: 10,
			font: font,
			color: rgb(0.1, 0.1, 0.1),
		});
		leftY -= 15;
		PDFInvoiceGenerator.drawTextSafe(page, "Payment: Visa, Master Card", {
			x: leftX,
			y: leftY,
			size: 9,
			font: font,
			color: rgb(0.3, 0.3, 0.3),
		});
		leftY -= 12;
		PDFInvoiceGenerator.drawTextSafe(page, "We accept Cheque", {
			x: leftX,
			y: leftY,
			size: 9,
			font: font,
			color: rgb(0.3, 0.3, 0.3),
		});
		leftY -= 12;
		PDFInvoiceGenerator.drawTextSafe(page, `Paypal: ${data.company.email || 'paypal@company.com'}`, {
			x: leftX,
			y: leftY,
			size: 9,
			font: font,
			color: rgb(0.3, 0.3, 0.3),
		});

		leftY -= 20;
		// Contact
		PDFInvoiceGenerator.drawTextSafe(page, "Contact:", {
			x: leftX,
			y: leftY,
			size: 10,
			font: font,
			color: rgb(0.1, 0.1, 0.1),
		});
		leftY -= 15;
		PDFInvoiceGenerator.drawTextSafe(page, data.company.address || "123 Street, Town Postal, County", {
			x: leftX,
			y: leftY,
			size: 9,
			font: font,
			color: rgb(0.3, 0.3, 0.3),
		});
		leftY -= 12;
		PDFInvoiceGenerator.drawTextSafe(page, data.company.phone || "+999 123 456 789", {
			x: leftX,
			y: leftY,
			size: 9,
			font: font,
			color: rgb(0.3, 0.3, 0.3),
		});
		leftY -= 12;
		PDFInvoiceGenerator.drawTextSafe(page, data.company.email || "info@yourname", {
			x: leftX,
			y: leftY,
			size: 9,
			font: font,
			color: rgb(0.3, 0.3, 0.3),
		});
		leftY -= 12;
		PDFInvoiceGenerator.drawTextSafe(page, data.company.website || "www.domainname.com", {
			x: leftX,
			y: leftY,
			size: 9,
			font: font,
			color: rgb(0.3, 0.3, 0.3),
		});

		leftY -= 20;
		// Terms & Condition
		PDFInvoiceGenerator.drawTextSafe(page, "Terms & Condition:", {
			x: leftX,
			y: leftY,
			size: 10,
			font: font,
			color: rgb(0.1, 0.1, 0.1),
		});
		leftY -= 15;
		PDFInvoiceGenerator.drawTextSafe(page, "Contrary to popular belief Lorem Ipsum not ipsum simply lorem ispum dolor ipsum.", {
			x: leftX,
			y: leftY,
			size: 9,
			font: font,
			color: rgb(0.3, 0.3, 0.3),
		});

		// Right side - Signature
		PDFInvoiceGenerator.drawTextSafe(page, "Signature:", {
			x: rightX,
			y: currentY,
			size: 10,
			font: font,
			color: rgb(0.1, 0.1, 0.1),
		});
		page.drawLine({
			start: { x: rightX, y: currentY - 20 },
			end: { x: rightX + 100, y: currentY - 20 },
			thickness: 1,
			color: rgb(0.1, 0.1, 0.1),
		});
		PDFInvoiceGenerator.drawTextSafe(page, "Mark Williams", {
			x: rightX,
			y: currentY - 35,
			size: 9,
			font: font,
			color: rgb(0.1, 0.1, 0.1),
		});
		PDFInvoiceGenerator.drawTextSafe(page, "Manager", {
			x: rightX,
			y: currentY - 50,
			size: 8,
			font: font,
			color: rgb(0.3, 0.3, 0.3),
		});

		return currentY - 100;
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
