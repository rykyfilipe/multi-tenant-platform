/** @format */

import { describe, it, expect, beforeEach, afterEach, jest } from '@jest/globals';
import { NextRequest } from 'next/server';
import { GET as downloadInvoice } from '@/app/api/tenants/[tenantId]/invoices/[invoiceId]/download/route';

// Mock authentication
jest.mock('@/lib/session', () => ({
	requireAuthResponse: jest.fn(),
	requireTenantAccess: jest.fn(),
	getUserId: jest.fn(),
}));

// Mock Prisma
jest.mock('@/lib/prisma', () => ({
	default: {
		database: {
			findFirst: jest.fn(),
		},
		row: {
			findUnique: jest.fn(),
			findFirst: jest.fn(),
			findMany: jest.fn(),
		},
		tenant: {
			findUnique: jest.fn(),
		},
		auditLog: {
			create: jest.fn(),
		},
	},
}));

// Mock InvoiceSystemService
jest.mock('@/lib/invoice-system', () => ({
	InvoiceSystemService: {
		getInvoiceTables: jest.fn(),
	},
}));

// Mock PDF generators
jest.mock('@/lib/pdf-invoice-generator', () => ({
	PDFInvoiceGenerator: {
		generateInvoicePDF: jest.fn(),
	},
}));

jest.mock('@/lib/pdf-enhanced-generator', () => ({
	EnhancedPDFGenerator: {
		generateInvoicePDF: jest.fn(),
	},
}));

// Mock InvoiceCalculationService
jest.mock('@/lib/invoice-calculations', () => ({
	InvoiceCalculationService: {
		calculateInvoiceTotals: jest.fn(),
	},
}));

describe('Invoice PDF Download API', () => {
	const mockTenantId = '1';
	const mockInvoiceId = '1';
	const mockDatabaseId = 1;

	beforeEach(() => {
		jest.clearAllMocks();

		// Mock authentication
		const { requireAuthResponse, requireTenantAccess, getUserId } = require('@/lib/session');
		requireAuthResponse.mockResolvedValue({
			user: { id: '1', email: 'test@example.com' },
		});
		requireTenantAccess.mockReturnValue(null);
		getUserId.mockReturnValue('1');

		// Mock Prisma calls
		const prisma = require('@/lib/prisma').default;
		prisma.database.findFirst.mockResolvedValue({ id: mockDatabaseId, tenantId: Number(mockTenantId) });
		prisma.tenant.findUnique.mockResolvedValue({
			name: 'Test Company',
			companyEmail: 'company@example.com',
			address: '123 Test St',
			defaultCurrency: 'USD',
		});

		// Mock invoice data
		const mockInvoice = {
			id: 1,
			cells: [
				{ column: { name: 'invoice_number' }, value: 'INV-2024-000001' },
				{ column: { name: 'date' }, value: '2024-01-01' },
				{ column: { name: 'due_date' }, value: '2024-01-31' },
				{ column: { name: 'customer_id' }, value: 1 },
				{ column: { name: 'base_currency' }, value: 'USD' },
				{ column: { name: 'total_amount' }, value: 120 },
				{ column: { name: 'payment_terms' }, value: 'Net 30' },
				{ column: { name: 'payment_method' }, value: 'Bank Transfer' },
			],
		};

		const mockCustomer = {
			id: 1,
			cells: [
				{ column: { name: 'customer_name' }, value: 'Test Customer' },
				{ column: { name: 'customer_email' }, value: 'customer@example.com' },
				{ column: { name: 'customer_address' }, value: '456 Customer St' },
			],
		};

		const mockInvoiceItems = [
			{
				id: 1,
				cells: [
					{ column: { name: 'invoice_id' }, value: 1 },
					{ column: { name: 'quantity' }, value: 1 },
					{ column: { name: 'price' }, value: 100 },
					{ column: { name: 'currency' }, value: 'USD' },
					{ column: { name: 'product_vat' }, value: 20 },
					{ column: { name: 'description' }, value: 'Test Product' },
					{ column: { name: 'product_name' }, value: 'Test Product' },
					{ column: { name: 'product_sku' }, value: 'SKU-001' },
				],
			},
		];

		prisma.row.findUnique.mockResolvedValue(mockInvoice);
		prisma.row.findFirst.mockResolvedValue(mockCustomer);
		prisma.row.findMany.mockResolvedValue(mockInvoiceItems);

		// Mock InvoiceSystemService
		const { InvoiceSystemService } = require('@/lib/invoice-system');
		InvoiceSystemService.getInvoiceTables.mockResolvedValue({
			invoices: { id: 1 },
			invoice_items: { id: 2 },
			customers: { id: 3 },
		});

		// Mock InvoiceCalculationService
		const { InvoiceCalculationService } = require('@/lib/invoice-calculations');
		InvoiceCalculationService.calculateInvoiceTotals.mockResolvedValue({
			subtotal: 100,
			vatTotal: 20,
			grandTotal: 120,
			subtotalInBaseCurrency: 100,
			vatTotalInBaseCurrency: 20,
			grandTotalInBaseCurrency: 120,
			baseCurrency: 'USD',
			totalsByCurrency: { USD: 100 },
			vatTotalsByCurrency: { USD: 20 },
			itemsCount: 1,
		});
	});

	afterEach(() => {
		jest.restoreAllMocks();
	});

	describe('GET /api/tenants/[tenantId]/invoices/[invoiceId]/download', () => {
		it('should generate and download PDF successfully', async () => {
			const { PDFInvoiceGenerator } = require('@/lib/pdf-invoice-generator');
			const mockPdfBuffer = Buffer.from('mock-pdf-content');
			PDFInvoiceGenerator.generateInvoicePDF.mockResolvedValue(mockPdfBuffer);

			const request = new NextRequest('http://localhost:3000/api/tenants/1/invoices/1/download');
			const response = await downloadInvoice(request, {
				params: Promise.resolve({ tenantId: mockTenantId, invoiceId: mockInvoiceId }),
			});

			expect(response.status).toBe(200);
			expect(response.headers.get('Content-Type')).toBe('application/pdf');
			expect(response.headers.get('Content-Disposition')).toContain('factura-INV-2024-000001.pdf');

			const responseBuffer = Buffer.from(await response.arrayBuffer());
			expect(responseBuffer).toEqual(mockPdfBuffer);
		});

		it('should generate enhanced PDF with options', async () => {
			const { EnhancedPDFGenerator } = require('@/lib/pdf-enhanced-generator');
			const mockPdfBuffer = Buffer.from('enhanced-pdf-content');
			EnhancedPDFGenerator.generateInvoicePDF.mockResolvedValue(mockPdfBuffer);

			const request = new NextRequest(
				'http://localhost:3000/api/tenants/1/invoices/1/download?enhanced=true&watermark=true&qrcode=true'
			);
			const response = await downloadInvoice(request, {
				params: Promise.resolve({ tenantId: mockTenantId, invoiceId: mockInvoiceId }),
			});

			expect(response.status).toBe(200);
			expect(EnhancedPDFGenerator.generateInvoicePDF).toHaveBeenCalledWith({
				tenantId: mockTenantId,
				databaseId: mockDatabaseId,
				invoiceId: Number(mockInvoiceId),
				includeWatermark: true,
				includeQRCode: true,
				includeBarcode: false,
			});
		});

		it('should handle missing invoice', async () => {
			const prisma = require('@/lib/prisma').default;
			prisma.row.findUnique.mockResolvedValue(null);

			const request = new NextRequest('http://localhost:3000/api/tenants/1/invoices/1/download');
			const response = await downloadInvoice(request, {
				params: Promise.resolve({ tenantId: mockTenantId, invoiceId: mockInvoiceId }),
			});

			expect(response.status).toBe(404);
			const data = await response.json();
			expect(data.error).toBe('Invoice not found');
		});

		it('should handle missing database', async () => {
			const prisma = require('@/lib/prisma').default;
			prisma.database.findFirst.mockResolvedValue(null);

			const request = new NextRequest('http://localhost:3000/api/tenants/1/invoices/1/download');
			const response = await downloadInvoice(request, {
				params: Promise.resolve({ tenantId: mockTenantId, invoiceId: mockInvoiceId }),
			});

			expect(response.status).toBe(404);
			const data = await response.json();
			expect(data.error).toBe('Database not found for this tenant');
		});

		it('should handle PDF generation failure', async () => {
			const { PDFInvoiceGenerator } = require('@/lib/pdf-invoice-generator');
			PDFInvoiceGenerator.generateInvoicePDF.mockRejectedValue(new Error('PDF generation failed'));

			const request = new NextRequest('http://localhost:3000/api/tenants/1/invoices/1/download');
			const response = await downloadInvoice(request, {
				params: Promise.resolve({ tenantId: mockTenantId, invoiceId: mockInvoiceId }),
			});

			expect(response.status).toBe(500);
			const data = await response.json();
			expect(data.error).toBe('Failed to generate PDF invoice');
		});

		it('should handle unauthorized access', async () => {
			const { requireAuthResponse } = require('@/lib/session');
			requireAuthResponse.mockResolvedValue(null);

			const request = new NextRequest('http://localhost:3000/api/tenants/1/invoices/1/download');
			const response = await downloadInvoice(request, {
				params: Promise.resolve({ tenantId: mockTenantId, invoiceId: mockInvoiceId }),
			});

			expect(response.status).toBe(401);
		});

		it('should handle forbidden access', async () => {
			const { requireTenantAccess } = require('@/lib/session');
			requireTenantAccess.mockReturnValue({ status: 403, json: () => ({ error: 'Forbidden' }) });

			const request = new NextRequest('http://localhost:3000/api/tenants/1/invoices/1/download');
			const response = await downloadInvoice(request, {
				params: Promise.resolve({ tenantId: mockTenantId, invoiceId: mockInvoiceId }),
			});

			expect(response.status).toBe(403);
		});

		it('should create audit log for PDF generation', async () => {
			const { PDFInvoiceGenerator } = require('@/lib/pdf-invoice-generator');
			const mockPdfBuffer = Buffer.from('mock-pdf-content');
			PDFInvoiceGenerator.generateInvoicePDF.mockResolvedValue(mockPdfBuffer);

			const prisma = require('@/lib/prisma').default;
			prisma.auditLog.create.mockResolvedValue({ id: 1 });

			const request = new NextRequest('http://localhost:3000/api/tenants/1/invoices/1/download');
			await downloadInvoice(request, {
				params: Promise.resolve({ tenantId: mockTenantId, invoiceId: mockInvoiceId }),
			});

			expect(prisma.auditLog.create).toHaveBeenCalledWith({
				data: {
					tenantId: Number(mockTenantId),
					databaseId: mockDatabaseId,
					action: 'pdf_generated',
					status: 'success',
					metadata: {
						invoiceId: Number(mockInvoiceId),
						useEnhanced: false,
						includeWatermark: false,
						includeQRCode: false,
						includeBarcode: false,
					},
				},
			});
		});
	});
});
