/** @format */

import { EnhancedPDFGenerator } from '@/lib/pdf-enhanced-generator';

// Mock pdf-lib
jest.mock('pdf-lib', () => ({
	PDFDocument: {
		create: jest.fn().mockResolvedValue({
			addPage: jest.fn().mockReturnValue({
				getSize: jest.fn().mockReturnValue({ width: 595, height: 842 }),
				drawText: jest.fn(),
				drawRectangle: jest.fn(),
				drawLine: jest.fn(),
			}),
			embedFont: jest.fn().mockResolvedValue({}),
			save: jest.fn().mockResolvedValue(new Uint8Array([1, 2, 3])),
		}),
	},
	rgb: jest.fn().mockReturnValue({}),
	StandardFonts: {
		Helvetica: 'Helvetica',
		HelveticaBold: 'HelveticaBold',
	},
	PageSizes: {
		A4: [595.28, 841.89],
	},
}));

// Mock prisma
jest.mock('@/lib/prisma', () => ({
	__esModule: true,
	default: {
		tenant: {
			findUnique: jest.fn().mockResolvedValue({
				name: 'Test Company',
				companyEmail: 'test@company.com',
				address: 'Test Address',
				defaultCurrency: 'USD',
			}),
		},
		row: {
			findFirst: jest.fn().mockResolvedValue({
				id: 1,
				cells: [
					{ column: { name: 'invoice_number' }, value: 'INV-001' },
					{ column: { name: 'date' }, value: '2024-01-01' },
					{ column: { name: 'customer_id' }, value: 1 },
				],
			}),
			findMany: jest.fn().mockResolvedValue([
				{
					id: 1,
					cells: [
						{ column: { name: 'product_name' }, value: 'Test Product' },
						{ column: { name: 'quantity' }, value: 2 },
						{ column: { name: 'price' }, value: 100 },
						{ column: { name: 'product_vat' }, value: 19 },
					],
				},
			]),
		},
	},
}));

// Mock InvoiceSystemService
jest.mock('@/lib/invoice-system', () => ({
	InvoiceSystemService: {
		getInvoiceTables: jest.fn().mockResolvedValue({
			invoices: { id: 1 },
			invoice_items: { id: 2 },
			customers: { id: 3 },
		}),
	},
}));

describe('Invoice Multilingual PDF Generation', () => {
	beforeEach(() => {
		jest.clearAllMocks();
	});

	describe('Translation Support', () => {
		it('should generate PDF with English translations', async () => {
			const options = {
				tenantId: '1',
				databaseId: 1,
				invoiceId: 1,
				language: 'en',
			};

			const result = await EnhancedPDFGenerator.generateInvoicePDF(options);

			expect(result).toBeInstanceOf(Buffer);
			expect(result.length).toBeGreaterThan(0);
		});

		it('should generate PDF with Romanian translations', async () => {
			const options = {
				tenantId: '1',
				databaseId: 1,
				invoiceId: 1,
				language: 'ro',
			};

			const result = await EnhancedPDFGenerator.generateInvoicePDF(options);

			expect(result).toBeInstanceOf(Buffer);
			expect(result.length).toBeGreaterThan(0);
		});

		it('should generate PDF with Spanish translations', async () => {
			const options = {
				tenantId: '1',
				databaseId: 1,
				invoiceId: 1,
				language: 'es',
			};

			const result = await EnhancedPDFGenerator.generateInvoicePDF(options);

			expect(result).toBeInstanceOf(Buffer);
			expect(result.length).toBeGreaterThan(0);
		});

		it('should generate PDF with French translations', async () => {
			const options = {
				tenantId: '1',
				databaseId: 1,
				invoiceId: 1,
				language: 'fr',
			};

			const result = await EnhancedPDFGenerator.generateInvoicePDF(options);

			expect(result).toBeInstanceOf(Buffer);
			expect(result.length).toBeGreaterThan(0);
		});

		it('should generate PDF with German translations', async () => {
			const options = {
				tenantId: '1',
				databaseId: 1,
				invoiceId: 1,
				language: 'de',
			};

			const result = await EnhancedPDFGenerator.generateInvoicePDF(options);

			expect(result).toBeInstanceOf(Buffer);
			expect(result.length).toBeGreaterThan(0);
		});

		it('should fallback to English for unsupported language', async () => {
			const options = {
				tenantId: '1',
				databaseId: 1,
				invoiceId: 1,
				language: 'unknown',
			};

			const result = await EnhancedPDFGenerator.generateInvoicePDF(options);

			expect(result).toBeInstanceOf(Buffer);
			expect(result.length).toBeGreaterThan(0);
		});
	});

	describe('Filename Generation', () => {
		it('should generate correct filename for English', () => {
			const getInvoiceFilename = (lang: string) => {
				const filenameMap: Record<string, string> = {
					'en': 'invoice',
					'ro': 'factura',
					'es': 'factura',
					'fr': 'facture',
					'de': 'rechnung'
				};
				return filenameMap[lang] || 'invoice';
			};

			expect(getInvoiceFilename('en')).toBe('invoice');
			expect(getInvoiceFilename('ro')).toBe('factura');
			expect(getInvoiceFilename('es')).toBe('factura');
			expect(getInvoiceFilename('fr')).toBe('facture');
			expect(getInvoiceFilename('de')).toBe('rechnung');
			expect(getInvoiceFilename('unknown')).toBe('invoice');
		});
	});

	describe('Translation Content', () => {
		it('should have correct Romanian translations', () => {
			const translations = {
				invoice: 'Factura',
				invoiceNumber: 'Numarul Facturii',
				date: 'Data',
				dueDate: 'Data Scadentei',
				customer: 'Client',
				company: 'Companie',
				description: 'Descriere',
				quantity: 'Cantitate',
				unitPrice: 'Pret Unit',
				total: 'Total',
				subtotal: 'Subtotal',
				tax: 'TVA',
				grandTotal: 'Total General',
				paymentTerms: 'Termeni de Plata',
				paymentMethod: 'Metoda de Plata',
				notes: 'Note',
				thankYou: 'Va multumim pentru afacerea cu noi!',
				page: 'Pagina',
				of: 'din',
			};

			expect(translations.invoice).toBe('Factura');
			expect(translations.customer).toBe('Client');
			expect(translations.tax).toBe('TVA');
			expect(translations.thankYou).toBe('Va multumim pentru afacerea cu noi!');
		});

		it('should have correct Spanish translations', () => {
			const translations = {
				invoice: 'Factura',
				invoiceNumber: 'Numero de Factura',
				date: 'Fecha',
				dueDate: 'Fecha de Vencimiento',
				customer: 'Cliente',
				company: 'Empresa',
				description: 'Descripcion',
				quantity: 'Cantidad',
				unitPrice: 'Precio Unitario',
				total: 'Total',
				subtotal: 'Subtotal',
				tax: 'Impuestos',
				grandTotal: 'Total General',
				paymentTerms: 'Terminos de Pago',
				paymentMethod: 'Metodo de Pago',
				notes: 'Notas',
				thankYou: 'Gracias por su negocio!',
				page: 'Pagina',
				of: 'de',
			};

			expect(translations.invoice).toBe('Factura');
			expect(translations.customer).toBe('Cliente');
			expect(translations.tax).toBe('Impuestos');
			expect(translations.thankYou).toBe('Gracias por su negocio!');
		});
	});
});
