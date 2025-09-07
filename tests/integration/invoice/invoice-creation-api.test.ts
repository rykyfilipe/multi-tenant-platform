/** @format */

import { describe, it, expect, beforeEach, afterEach, jest } from '@jest/globals';
import { NextRequest } from 'next/server';
import { POST as createInvoice } from '@/app/api/tenants/[tenantId]/invoices/route';

// Mock authentication
jest.mock('@/lib/session', () => ({
	requireAuthResponse: jest.fn().mockResolvedValue({
		user: { email: 'test@example.com' },
	}),
	requireTenantAccess: jest.fn().mockReturnValue(null),
	getUserId: jest.fn().mockReturnValue('1'),
}));

// Mock Prisma
const mockPrisma = {
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
	invoiceAuditLog: {
		create: jest.fn(),
	},
};

jest.mock('@/lib/prisma', () => ({
	default: mockPrisma,
	withRetry: jest.fn((fn) => fn()),
}));

// Mock InvoiceSystemService
jest.mock('@/lib/invoice-system', () => ({
	InvoiceSystemService: {
		getInvoiceTables: jest.fn(),
	},
}));

// Mock InvoiceCalculationService
jest.mock('@/lib/invoice-calculations', () => ({
	InvoiceCalculationService: {
		calculateInvoiceTotals: jest.fn(),
	},
}));

// Mock semantic helpers
jest.mock('@/lib/semantic-helpers', () => ({
	validateTableForInvoices: jest.fn(),
	extractProductDetails: jest.fn(),
	getValidationMessage: jest.fn(),
}));

describe('Invoice Creation API Integration Tests', () => {
	beforeEach(() => {
		jest.clearAllMocks();
		
		// Setup default mocks
		mockPrisma.user.findFirst.mockResolvedValue({ id: '1', email: 'test@example.com' });
		mockPrisma.database.findFirst.mockResolvedValue({ id: 1, tenantId: 1 });
		mockPrisma.tenant.findUnique.mockResolvedValue({ defaultCurrency: 'USD' });
		mockPrisma.table.findFirst.mockResolvedValue({ id: 1, name: 'invoices' });
		mockPrisma.table.findMany.mockResolvedValue([
			{ id: 1, name: 'invoices', columns: [{ id: 1, semanticType: 'invoice_total_amount' }] },
			{ id: 2, name: 'invoice_items', columns: [] },
		]);
		mockPrisma.row.create.mockResolvedValue({ id: 1 });
		mockPrisma.cell.create.mockResolvedValue({ id: 1 });
		mockPrisma.invoiceAuditLog.create.mockResolvedValue({ id: 1 });
	});

	describe('POST /api/tenants/[tenantId]/invoices', () => {
		it('should create invoice successfully with valid data', async () => {
			const { InvoiceSystemService } = require('@/lib/invoice-system');
			const { InvoiceCalculationService } = require('@/lib/invoice-calculations');
			
			InvoiceSystemService.getInvoiceTables.mockResolvedValue({
				invoices: { id: 1, columns: [{ id: 1, semanticType: 'invoice_total_amount' }] },
				invoice_items: { id: 2, columns: [] },
			});
			
			InvoiceCalculationService.calculateInvoiceTotals.mockResolvedValue({
				subtotal: 200,
				vatTotal: 40,
				grandTotal: 240,
				subtotalInBaseCurrency: 200,
				vatTotalInBaseCurrency: 40,
				grandTotalInBaseCurrency: 240,
				baseCurrency: 'USD',
				totalsByCurrency: { USD: 200 },
				vatTotalsByCurrency: { USD: 40 },
				itemsCount: 2,
			});

			const requestBody = {
				customer_id: 1,
				base_currency: 'USD',
				due_date: '2024-12-31',
				payment_terms: 'Net 30',
				payment_method: 'Bank Transfer',
				notes: 'Test invoice',
				status: 'draft',
				invoice_series: 'INV-2024',
				products: [
					{
						product_ref_table: 'products',
						product_ref_id: 1,
						quantity: 2,
						unit_of_measure: 'pcs',
						description: 'Test Product 1',
						currency: 'USD',
						original_price: 100,
						converted_price: 100,
						price: 100,
					},
					{
						product_ref_table: 'products',
						product_ref_id: 2,
						quantity: 1,
						unit_of_measure: 'pcs',
						description: 'Test Product 2',
						currency: 'USD',
						original_price: 50,
						converted_price: 50,
						price: 50,
					},
				],
			};

			const request = new NextRequest('http://localhost:3000/api/tenants/1/invoices', {
				method: 'POST',
				body: JSON.stringify(requestBody),
				headers: { 'Content-Type': 'application/json' },
			});

			const response = await createInvoice(request, { params: Promise.resolve({ tenantId: '1' }) });
			const responseData = await response.json();

			expect(response.status).toBe(200);
			expect(responseData.message).toBe('Invoice created successfully');
			expect(responseData.invoice).toBeDefined();
			expect(responseData.invoice.customer_id).toBe(1);
			expect(responseData.invoice.items_count).toBe(2);
		});

		it('should return 400 for invalid request body', async () => {
			const request = new NextRequest('http://localhost:3000/api/tenants/1/invoices', {
				method: 'POST',
				body: 'invalid json',
				headers: { 'Content-Type': 'application/json' },
			});

			const response = await createInvoice(request, { params: Promise.resolve({ tenantId: '1' }) });
			const responseData = await response.json();

			expect(response.status).toBe(400);
			expect(responseData.error).toBe('Invalid request body');
		});

		it('should return 400 for missing required fields', async () => {
			const requestBody = {
				// Missing customer_id, base_currency, due_date, payment_method, products
			};

			const request = new NextRequest('http://localhost:3000/api/tenants/1/invoices', {
				method: 'POST',
				body: JSON.stringify(requestBody),
				headers: { 'Content-Type': 'application/json' },
			});

			const response = await createInvoice(request, { params: Promise.resolve({ tenantId: '1' }) });
			const responseData = await response.json();

			expect(response.status).toBe(400);
			expect(responseData.error).toBe('Validation failed');
			expect(responseData.details).toBeDefined();
			expect(responseData.details.length).toBeGreaterThan(0);
		});

		it('should return 400 for invalid customer_id', async () => {
			const requestBody = {
				customer_id: 0, // Invalid customer ID
				base_currency: 'USD',
				due_date: '2024-12-31',
				payment_method: 'Bank Transfer',
				products: [],
			};

			const request = new NextRequest('http://localhost:3000/api/tenants/1/invoices', {
				method: 'POST',
				body: JSON.stringify(requestBody),
				headers: { 'Content-Type': 'application/json' },
			});

			const response = await createInvoice(request, { params: Promise.resolve({ tenantId: '1' }) });
			const responseData = await response.json();

			expect(response.status).toBe(400);
			expect(responseData.error).toBe('Validation failed');
			expect(responseData.details.some((d: any) => d.field === 'customer_id')).toBe(true);
		});

		it('should return 400 for invalid currency format', async () => {
			const requestBody = {
				customer_id: 1,
				base_currency: 'usd', // Invalid format - should be uppercase
				due_date: '2024-12-31',
				payment_method: 'Bank Transfer',
				products: [],
			};

			const request = new NextRequest('http://localhost:3000/api/tenants/1/invoices', {
				method: 'POST',
				body: JSON.stringify(requestBody),
				headers: { 'Content-Type': 'application/json' },
			});

			const response = await createInvoice(request, { params: Promise.resolve({ tenantId: '1' }) });
			const responseData = await response.json();

			expect(response.status).toBe(400);
			expect(responseData.error).toBe('Validation failed');
			expect(responseData.details.some((d: any) => d.field === 'base_currency')).toBe(true);
		});

		it('should return 400 for past due date', async () => {
			const yesterday = new Date();
			yesterday.setDate(yesterday.getDate() - 1);
			const pastDate = yesterday.toISOString().split('T')[0];

			const requestBody = {
				customer_id: 1,
				base_currency: 'USD',
				due_date: pastDate,
				payment_method: 'Bank Transfer',
				products: [],
			};

			const request = new NextRequest('http://localhost:3000/api/tenants/1/invoices', {
				method: 'POST',
				body: JSON.stringify(requestBody),
				headers: { 'Content-Type': 'application/json' },
			});

			const response = await createInvoice(request, { params: Promise.resolve({ tenantId: '1' }) });
			const responseData = await response.json();

			expect(response.status).toBe(400);
			expect(responseData.error).toBe('Invalid due date');
			expect(responseData.message).toBe('Due date cannot be in the past');
		});

		it('should return 400 for invalid due date format', async () => {
			const requestBody = {
				customer_id: 1,
				base_currency: 'USD',
				due_date: 'invalid-date',
				payment_method: 'Bank Transfer',
				products: [],
			};

			const request = new NextRequest('http://localhost:3000/api/tenants/1/invoices', {
				method: 'POST',
				body: JSON.stringify(requestBody),
				headers: { 'Content-Type': 'application/json' },
			});

			const response = await createInvoice(request, { params: Promise.resolve({ tenantId: '1' }) });
			const responseData = await response.json();

			expect(response.status).toBe(400);
			expect(responseData.error).toBe('Invalid due date');
			expect(responseData.message).toBe('Due date must be a valid date');
		});

		it('should return 400 for invalid product data', async () => {
			const requestBody = {
				customer_id: 1,
				base_currency: 'USD',
				due_date: '2024-12-31',
				payment_method: 'Bank Transfer',
				products: [
					{
						product_ref_table: '', // Invalid
						product_ref_id: 0, // Invalid
						quantity: -1, // Invalid
						currency: 'usd', // Invalid format
						original_price: -10, // Invalid
						converted_price: -10, // Invalid
						price: -10, // Invalid
					},
				],
			};

			const request = new NextRequest('http://localhost:3000/api/tenants/1/invoices', {
				method: 'POST',
				body: JSON.stringify(requestBody),
				headers: { 'Content-Type': 'application/json' },
			});

			const response = await createInvoice(request, { params: Promise.resolve({ tenantId: '1' }) });
			const responseData = await response.json();

			expect(response.status).toBe(400);
			expect(responseData.error).toBe('Validation failed');
			expect(responseData.details.length).toBeGreaterThan(0);
		});

		it('should return 400 for empty products array', async () => {
			const requestBody = {
				customer_id: 1,
				base_currency: 'USD',
				due_date: '2024-12-31',
				payment_method: 'Bank Transfer',
				products: [], // Empty array
			};

			const request = new NextRequest('http://localhost:3000/api/tenants/1/invoices', {
				method: 'POST',
				body: JSON.stringify(requestBody),
				headers: { 'Content-Type': 'application/json' },
			});

			const response = await createInvoice(request, { params: Promise.resolve({ tenantId: '1' }) });
			const responseData = await response.json();

			expect(response.status).toBe(400);
			expect(responseData.error).toBe('Validation failed');
			expect(responseData.details.some((d: any) => d.field === 'products')).toBe(true);
		});

		it('should return 404 when database not found', async () => {
			mockPrisma.database.findFirst.mockResolvedValue(null);

			const requestBody = {
				customer_id: 1,
				base_currency: 'USD',
				due_date: '2024-12-31',
				payment_method: 'Bank Transfer',
				products: [
					{
						product_ref_table: 'products',
						product_ref_id: 1,
						quantity: 1,
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
				headers: { 'Content-Type': 'application/json' },
			});

			const response = await createInvoice(request, { params: Promise.resolve({ tenantId: '1' }) });
			const responseData = await response.json();

			expect(response.status).toBe(404);
			expect(responseData.error).toBe('Database not found for this tenant');
		});

		it('should return 503 for database connection errors', async () => {
			mockPrisma.database.findFirst.mockRejectedValue(new Error('Connection failed'));

			const requestBody = {
				customer_id: 1,
				base_currency: 'USD',
				due_date: '2024-12-31',
				payment_method: 'Bank Transfer',
				products: [
					{
						product_ref_table: 'products',
						product_ref_id: 1,
						quantity: 1,
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
				headers: { 'Content-Type': 'application/json' },
			});

			const response = await createInvoice(request, { params: Promise.resolve({ tenantId: '1' }) });
			const responseData = await response.json();

			expect(response.status).toBe(503);
			expect(responseData.error).toBe('Database connection error');
		});

		it('should return 500 for Prisma errors', async () => {
			mockPrisma.row.create.mockRejectedValue(new Error('Prisma error occurred'));

			const { InvoiceSystemService } = require('@/lib/invoice-system');
			const { InvoiceCalculationService } = require('@/lib/invoice-calculations');
			
			InvoiceSystemService.getInvoiceTables.mockResolvedValue({
				invoices: { id: 1, columns: [{ id: 1, semanticType: 'invoice_total_amount' }] },
				invoice_items: { id: 2, columns: [] },
			});
			
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

			const requestBody = {
				customer_id: 1,
				base_currency: 'USD',
				due_date: '2024-12-31',
				payment_method: 'Bank Transfer',
				products: [
					{
						product_ref_table: 'products',
						product_ref_id: 1,
						quantity: 1,
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
				headers: { 'Content-Type': 'application/json' },
			});

			const response = await createInvoice(request, { params: Promise.resolve({ tenantId: '1' }) });
			const responseData = await response.json();

			expect(response.status).toBe(500);
			expect(responseData.error).toBe('Database error');
		});
	});
});
