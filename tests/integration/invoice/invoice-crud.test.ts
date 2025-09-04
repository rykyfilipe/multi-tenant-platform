/** @format */

import { describe, it, expect, beforeEach, afterEach, jest } from '@jest/globals';
import { NextRequest } from 'next/server';
import { POST as createInvoice, GET as getInvoices } from '@/app/api/tenants/[tenantId]/invoices/route';
import { PUT as updateInvoice, DELETE as deleteInvoice } from '@/app/api/tenants/[tenantId]/invoices/[invoiceId]/route';

// Mock authentication
jest.mock('@/lib/session', () => ({
	requireAuthResponse: jest.fn(),
	requireTenantAccess: jest.fn(),
	getUserId: jest.fn(),
}));

// Mock Prisma
jest.mock('@/lib/prisma', () => ({
	default: {
		user: {
			findFirst: jest.fn(),
		},
		database: {
			findFirst: jest.fn(),
		},
		tenant: {
			findUnique: jest.fn(),
		},
		table: {
			findFirst: jest.fn(),
			findMany: jest.fn(),
		},
		row: {
			create: jest.fn(),
			findMany: jest.fn(),
			findUnique: jest.fn(),
			update: jest.fn(),
			delete: jest.fn(),
		},
		cell: {
			create: jest.fn(),
			createMany: jest.fn(),
			findMany: jest.fn(),
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
		initializeInvoiceTables: jest.fn(),
		generateInvoiceNumberWithConfig: jest.fn(),
		getInvoiceNumberingStats: jest.fn(),
		updateInvoiceTablesSchema: jest.fn(),
	},
}));

// Mock InvoiceCalculationService
jest.mock('@/lib/invoice-calculations', () => ({
	InvoiceCalculationService: {
		calculateInvoiceTotals: jest.fn(),
	},
}));

describe('Invoice CRUD API Routes', () => {
	const mockTenantId = '1';
	const mockUserId = '1';
	const mockDatabaseId = 1;

	beforeEach(() => {
		jest.clearAllMocks();

		// Mock authentication
		const { requireAuthResponse, requireTenantAccess, getUserId } = require('@/lib/session');
		requireAuthResponse.mockResolvedValue({
			user: { id: mockUserId, email: 'test@example.com' },
		});
		requireTenantAccess.mockReturnValue(null);
		getUserId.mockReturnValue(mockUserId);

		// Mock Prisma calls
		const prisma = require('@/lib/prisma').default;
		prisma.user.findFirst.mockResolvedValue({ id: mockUserId });
		prisma.database.findFirst.mockResolvedValue({ id: mockDatabaseId, tenantId: Number(mockTenantId) });
		prisma.tenant.findUnique.mockResolvedValue({ defaultCurrency: 'USD' });

		// Mock InvoiceSystemService
		const { InvoiceSystemService } = require('@/lib/invoice-system');
		InvoiceSystemService.getInvoiceTables.mockResolvedValue({
			invoices: {
				id: 1,
				columns: [
					{ id: 1, name: 'invoice_number', isLocked: true },
					{ id: 2, name: 'date', isLocked: true },
					{ id: 3, name: 'due_date', isLocked: true },
					{ id: 4, name: 'customer_id', isLocked: true },
					{ id: 5, name: 'total_amount', isLocked: true },
					{ id: 6, name: 'base_currency', isLocked: true },
				],
			},
			invoice_items: {
				id: 2,
				columns: [
					{ id: 7, name: 'invoice_id', isLocked: true },
					{ id: 8, name: 'product_ref_table', isLocked: true },
					{ id: 9, name: 'product_ref_id', isLocked: true },
					{ id: 10, name: 'quantity', isLocked: true },
					{ id: 11, name: 'price', isLocked: true },
					{ id: 12, name: 'product_vat', isLocked: true },
					{ id: 13, name: 'currency', isLocked: true },
				],
			},
			customers: {
				id: 3,
				columns: [
					{ id: 14, name: 'customer_name', isLocked: true },
					{ id: 15, name: 'customer_email', isLocked: true },
				],
			},
		});

		InvoiceSystemService.generateInvoiceNumberWithConfig.mockResolvedValue({
			number: 'INV-2024-000001',
			series: 'INV-2024',
			nextNumber: 2,
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

	describe('POST /api/tenants/[tenantId]/invoices', () => {
		it('should create invoice successfully', async () => {
			const prisma = require('@/lib/prisma').default;
			prisma.row.create
				.mockResolvedValueOnce({ id: 1 }) // Invoice row
				.mockResolvedValueOnce({ id: 2 }); // Invoice item row

			prisma.cell.createMany.mockResolvedValue({ count: 6 });

			const requestBody = {
				customer_id: 1,
				base_currency: 'USD',
				due_date: '2024-02-01',
				payment_terms: 'Net 30',
				payment_method: 'Bank Transfer',
				notes: 'Test invoice',
				products: [
					{
						product_ref_table: 'products',
						product_ref_id: 1,
						quantity: 1,
						unit_of_measure: 'buc',
						description: 'Test Product',
						currency: 'USD',
						original_price: 100,
						converted_price: 100,
						price: 100,
					},
				],
			};

			const request = new NextRequest('http://localhost:3000/api/tenants/1/invoices', {
				method: 'POST',
				body: JSON.stringify(requestBody),
				headers: {
					'Content-Type': 'application/json',
				},
			});

			const response = await createInvoice(request, { params: Promise.resolve({ tenantId: mockTenantId }) });
			const data = await response.json();

			expect(response.status).toBe(200);
			expect(data.message).toBe('Invoice created successfully');
			expect(data.invoice.id).toBe(1);
			expect(data.invoice.invoice_number).toBe('INV-2024-000001');
		});

		it('should handle validation errors', async () => {
			const requestBody = {
				// Missing required fields
				customer_id: 1,
			};

			const request = new NextRequest('http://localhost:3000/api/tenants/1/invoices', {
				method: 'POST',
				body: JSON.stringify(requestBody),
				headers: {
					'Content-Type': 'application/json',
				},
			});

			const response = await createInvoice(request, { params: Promise.resolve({ tenantId: mockTenantId }) });
			const data = await response.json();

			expect(response.status).toBe(400);
			expect(data.error).toBe('Validation error');
		});

		it('should handle unauthorized access', async () => {
			const { requireAuthResponse } = require('@/lib/session');
			requireAuthResponse.mockResolvedValue(null);

			const request = new NextRequest('http://localhost:3000/api/tenants/1/invoices', {
				method: 'POST',
				body: JSON.stringify({}),
				headers: {
					'Content-Type': 'application/json',
				},
			});

			const response = await createInvoice(request, { params: Promise.resolve({ tenantId: mockTenantId }) });
			const data = await response.json();

			expect(response.status).toBe(401);
			expect(data.error).toBe('Unauthorized');
		});

		it('should handle missing database', async () => {
			const prisma = require('@/lib/prisma').default;
			prisma.database.findFirst.mockResolvedValue(null);

			const requestBody = {
				customer_id: 1,
				base_currency: 'USD',
				due_date: '2024-02-01',
				payment_method: 'Bank Transfer',
				products: [],
			};

			const request = new NextRequest('http://localhost:3000/api/tenants/1/invoices', {
				method: 'POST',
				body: JSON.stringify(requestBody),
				headers: {
					'Content-Type': 'application/json',
				},
			});

			const response = await createInvoice(request, { params: Promise.resolve({ tenantId: mockTenantId }) });
			const data = await response.json();

			expect(response.status).toBe(404);
			expect(data.error).toBe('Database not found for this tenant');
		});
	});

	describe('GET /api/tenants/[tenantId]/invoices', () => {
		it('should return invoice statistics', async () => {
			const { InvoiceSystemService } = require('@/lib/invoice-system');
			InvoiceSystemService.getInvoiceNumberingStats.mockResolvedValue({
				nextInvoiceNumber: 'INV-2024-000002',
				lastInvoiceNumber: 'INV-2024-000001',
				totalInvoices: 1,
				seriesBreakdown: { 'INV-2024': 1 },
				yearlyStats: { 2024: 1 },
				monthlyStats: { '2024-01': 1 },
			});

			const prisma = require('@/lib/prisma').default;
			prisma.table.findFirst.mockResolvedValue({ id: 1 });
			prisma.row.findMany.mockResolvedValue([
				{
					id: 1,
					cells: [
						{ column: { name: 'invoice_number' }, value: 'INV-2024-000001' },
						{ column: { name: 'date' }, value: '2024-01-01' },
						{ column: { name: 'total_amount' }, value: 120 },
					],
				},
			]);

			const request = new NextRequest('http://localhost:3000/api/tenants/1/invoices');
			const response = await getInvoices(request, { params: Promise.resolve({ tenantId: mockTenantId }) });
			const data = await response.json();

			expect(response.status).toBe(200);
			expect(data.success).toBe(true);
			expect(data.data.invoices).toHaveLength(1);
			expect(data.data.nextInvoiceNumber).toBe('INV-2024-000002');
			expect(data.data.totalInvoices).toBe(1);
		});

		it('should handle missing database', async () => {
			const prisma = require('@/lib/prisma').default;
			prisma.database.findFirst.mockResolvedValue(null);

			const request = new NextRequest('http://localhost:3000/api/tenants/1/invoices');
			const response = await getInvoices(request, { params: Promise.resolve({ tenantId: mockTenantId }) });
			const data = await response.json();

			expect(response.status).toBe(404);
			expect(data.error).toBe('Database not found for this tenant');
		});
	});
});
