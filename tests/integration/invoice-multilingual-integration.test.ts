/** @format */

import { NextRequest } from 'next/server';
import { GET } from '@/app/api/tenants/[tenantId]/invoices/[invoiceId]/download/route';

// Mock the dependencies
jest.mock('@/lib/session', () => ({
	requireAuthResponse: jest.fn().mockResolvedValue({ user: { id: 1 } }),
	requireTenantAccess: jest.fn().mockReturnValue(null),
	getUserId: jest.fn().mockReturnValue(1),
}));

jest.mock('@/lib/prisma', () => ({
	__esModule: true,
	default: {
		database: {
			findFirst: jest.fn().mockResolvedValue({ id: 1 }),
		},
		row: {
			findUnique: jest.fn().mockResolvedValue({
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
			findFirst: jest.fn().mockResolvedValue({
				id: 1,
				cells: [
					{ column: { name: 'customer_name' }, value: 'Test Customer' },
					{ column: { name: 'customer_email' }, value: 'customer@test.com' },
				],
			}),
		},
		tenant: {
			findUnique: jest.fn().mockResolvedValue({
				name: 'Test Company',
				companyEmail: 'test@company.com',
				address: 'Test Address',
				defaultCurrency: 'USD',
			}),
		},
		invoiceAuditLog: {
			create: jest.fn().mockResolvedValue({}),
		},
	},
}));

jest.mock('@/lib/invoice-system', () => ({
	InvoiceSystemService: {
		getInvoiceTables: jest.fn().mockResolvedValue({
			invoices: { id: 1 },
			invoice_items: { id: 2 },
			customers: { id: 3 },
		}),
	},
}));

jest.mock('@/lib/invoice-calculations', () => ({
	InvoiceCalculationService: {
		calculateInvoiceTotals: jest.fn().mockResolvedValue({
			subtotal: 200,
			vatTotal: 38,
			grandTotal: 238,
		}),
	},
}));

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

describe('Invoice Multilingual Integration', () => {
	beforeEach(() => {
		jest.clearAllMocks();
	});

	describe('PDF Download API', () => {
		it('should generate PDF with English language', async () => {
			const request = new NextRequest('http://localhost:3000/api/tenants/1/invoices/1/download?language=en&enhanced=true');
			const params = Promise.resolve({ tenantId: '1', invoiceId: '1' });

			const response = await GET(request, { params });

			expect(response.status).toBe(200);
			expect(response.headers.get('Content-Type')).toBe('application/pdf');
			expect(response.headers.get('Content-Disposition')).toContain('invoice-INV-001.pdf');
		});

		it('should generate PDF with Romanian language', async () => {
			const request = new NextRequest('http://localhost:3000/api/tenants/1/invoices/1/download?language=ro&enhanced=true');
			const params = Promise.resolve({ tenantId: '1', invoiceId: '1' });

			const response = await GET(request, { params });

			expect(response.status).toBe(200);
			expect(response.headers.get('Content-Type')).toBe('application/pdf');
			expect(response.headers.get('Content-Disposition')).toContain('factura-INV-001.pdf');
		});

		it('should generate PDF with Spanish language', async () => {
			const request = new NextRequest('http://localhost:3000/api/tenants/1/invoices/1/download?language=es&enhanced=true');
			const params = Promise.resolve({ tenantId: '1', invoiceId: '1' });

			const response = await GET(request, { params });

			expect(response.status).toBe(200);
			expect(response.headers.get('Content-Type')).toBe('application/pdf');
			expect(response.headers.get('Content-Disposition')).toContain('factura-INV-001.pdf');
		});

		it('should generate PDF with French language', async () => {
			const request = new NextRequest('http://localhost:3000/api/tenants/1/invoices/1/download?language=fr&enhanced=true');
			const params = Promise.resolve({ tenantId: '1', invoiceId: '1' });

			const response = await GET(request, { params });

			expect(response.status).toBe(200);
			expect(response.headers.get('Content-Type')).toBe('application/pdf');
			expect(response.headers.get('Content-Disposition')).toContain('facture-INV-001.pdf');
		});

		it('should generate PDF with German language', async () => {
			const request = new NextRequest('http://localhost:3000/api/tenants/1/invoices/1/download?language=de&enhanced=true');
			const params = Promise.resolve({ tenantId: '1', invoiceId: '1' });

			const response = await GET(request, { params });

			expect(response.status).toBe(200);
			expect(response.headers.get('Content-Type')).toBe('application/pdf');
			expect(response.headers.get('Content-Disposition')).toContain('rechnung-INV-001.pdf');
		});

		it('should generate preview PDF with inline disposition', async () => {
			const request = new NextRequest('http://localhost:3000/api/tenants/1/invoices/1/download?language=en&enhanced=true&preview=true');
			const params = Promise.resolve({ tenantId: '1', invoiceId: '1' });

			const response = await GET(request, { params });

			expect(response.status).toBe(200);
			expect(response.headers.get('Content-Type')).toBe('application/pdf');
			expect(response.headers.get('Content-Disposition')).toContain('inline');
			expect(response.headers.get('Cache-Control')).toContain('no-cache');
		});

		it('should generate download PDF with attachment disposition', async () => {
			const request = new NextRequest('http://localhost:3000/api/tenants/1/invoices/1/download?language=en&enhanced=true');
			const params = Promise.resolve({ tenantId: '1', invoiceId: '1' });

			const response = await GET(request, { params });

			expect(response.status).toBe(200);
			expect(response.headers.get('Content-Type')).toBe('application/pdf');
			expect(response.headers.get('Content-Disposition')).toContain('attachment');
			expect(response.headers.get('Cache-Control')).toContain('max-age=3600');
		});

		it('should fallback to English for unsupported language', async () => {
			const request = new NextRequest('http://localhost:3000/api/tenants/1/invoices/1/download?language=unknown&enhanced=true');
			const params = Promise.resolve({ tenantId: '1', invoiceId: '1' });

			const response = await GET(request, { params });

			expect(response.status).toBe(200);
			expect(response.headers.get('Content-Type')).toBe('application/pdf');
			expect(response.headers.get('Content-Disposition')).toContain('invoice-INV-001.pdf');
		});
	});
});
