/** @format */

import { describe, it, expect, beforeEach, afterEach, jest } from '@jest/globals';
import { EnhancedPDFGenerator } from '@/lib/pdf-enhanced-generator';
import prisma from '@/lib/prisma';

// Mock Prisma will be defined below

// Mock InvoiceSystemService
const mockInvoiceSystemService = {
	getInvoiceTables: jest.fn(),
	getCustomerTables: jest.fn(),
};

jest.mock('@/lib/invoice-system', () => ({
	InvoiceSystemService: mockInvoiceSystemService,
}));

// Mock Prisma
const mockPrisma = {
	tenant: { findUnique: jest.fn() },
	database: { findFirst: jest.fn() },
	row: { findFirst: jest.fn(), findMany: jest.fn() },
	auditLog: { create: jest.fn() },
	table: { findMany: jest.fn() },
	findManyWithCache: jest.fn(),
};

jest.mock('@/lib/prisma', () => ({
	default: mockPrisma,
}));

// Mock PDF-lib
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
			save: jest.fn().mockResolvedValue(new Uint8Array([1, 2, 3, 4])),
		}),
	},
	StandardFonts: {
		Helvetica: 'Helvetica',
		HelveticaBold: 'HelveticaBold',
	},
	PageSizes: {
		A4: [595, 842],
	},
	rgb: jest.fn().mockReturnValue({}),
}));

describe('EnhancedPDFGenerator', () => {
	beforeEach(() => {
		jest.clearAllMocks();
	});

	afterEach(() => {
		jest.restoreAllMocks();
	});

	describe('generateInvoicePDF', () => {
		it('should generate PDF with basic options', async () => {
			// Mock invoice data
			const mockInvoiceRow = {
				id: 1,
				cells: [
					{ column: { name: 'invoice_number' }, value: 'INV-001' },
					{ column: { name: 'date' }, value: '2024-01-01' },
					{ column: { name: 'due_date' }, value: '2024-01-31' },
					{ column: { name: 'customer_id' }, value: 1 },
					{ column: { name: 'status' }, value: 'issued' },
					{ column: { name: 'base_currency' }, value: 'USD' },
					{ column: { name: 'total_amount' }, value: 100 },
					{ column: { name: 'payment_terms' }, value: 'Net 30' },
					{ column: { name: 'payment_method' }, value: 'Bank Transfer' },
					{ column: { name: 'notes' }, value: 'Thank you!' },
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
						{ column: { name: 'product_vat' }, value: 0 },
						{ column: { name: 'description' }, value: 'Test Product' },
						{ column: { name: 'unit_of_measure' }, value: 'buc' },
						{ column: { name: 'product_name' }, value: 'Test Product' },
						{ column: { name: 'product_sku' }, value: 'SKU-001' },
						{ column: { name: 'product_category' }, value: 'Category' },
					],
				},
			];

			const mockCustomer = {
				id: 1,
				cells: [
					{ column: { name: 'customer_name' }, value: 'Test Customer' },
					{ column: { name: 'customer_email' }, value: 'test@example.com' },
					{ column: { name: 'customer_address' }, value: '123 Test St' },
					{ column: { name: 'customer_city' }, value: 'Test City' },
					{ column: { name: 'customer_country' }, value: 'Test Country' },
					{ column: { name: 'customer_postal_code' }, value: '12345' },
					{ column: { name: 'customer_phone' }, value: '123-456-7890' },
				],
			};

			const mockTenant = {
				name: 'Test Company',
				companyEmail: 'company@example.com',
				address: '456 Company St',
				defaultCurrency: 'USD',
				logo: null,
				website: 'https://example.com',
				phone: '987-654-3210',
				vatNumber: 'VAT123',
				registrationNumber: 'REG456',
			};

								// Mock Prisma calls
					mockPrisma.database.findFirst.mockResolvedValue({ id: 1, tenantId: 1 });
					mockPrisma.row.findFirst.mockResolvedValue(mockInvoiceRow);
					mockPrisma.row.findMany.mockResolvedValue(mockInvoiceItems);
					mockPrisma.tenant.findUnique.mockResolvedValue(mockTenant);

			// Mock prisma.findManyWithCache to return invoice tables
			mockPrisma.findManyWithCache.mockResolvedValue([
				{ id: 1, protectedType: 'invoices', columns: [] },
				{ id: 2, protectedType: 'invoice_items', columns: [] },
				{ id: 3, protectedType: 'customers', columns: [] },
			]);

			const result = await EnhancedPDFGenerator.generateInvoicePDF({
				tenantId: '1',
				databaseId: 1,
				invoiceId: 1,
				includeWatermark: false,
				includeQRCode: false,
				includeBarcode: false,
			});

			expect(result).toBeInstanceOf(Buffer);
			expect(result.length).toBeGreaterThan(0);
		});

		it('should generate PDF with watermark', async () => {
								// Mock minimal data
					mockPrisma.database.findFirst.mockResolvedValue({ id: 1, tenantId: 1 });
					mockPrisma.row.findFirst.mockResolvedValue({
				id: 1,
				cells: [
					{ column: { name: 'invoice_number' }, value: 'INV-001' },
					{ column: { name: 'date' }, value: '2024-01-01' },
					{ column: { name: 'customer_id' }, value: 1 },
				],
			});
								mockPrisma.row.findMany.mockResolvedValue([]);
					mockPrisma.tenant.findUnique.mockResolvedValue({
				name: 'Test Company',
			});

			// Mock prisma.findManyWithCache to return invoice tables
			mockPrisma.findManyWithCache.mockResolvedValue([
				{ id: 1, protectedType: 'invoices', columns: [] },
				{ id: 2, protectedType: 'invoice_items', columns: [] },
				{ id: 3, protectedType: 'customers', columns: [] },
			]);

			const result = await EnhancedPDFGenerator.generateInvoicePDF({
				tenantId: '1',
				databaseId: 1,
				invoiceId: 1,
				includeWatermark: true,
				includeQRCode: false,
				includeBarcode: false,
			});

			expect(result).toBeInstanceOf(Buffer);
		});

		it('should handle missing invoice', async () => {
			mockPrisma.database.findFirst.mockResolvedValue({ id: 1, tenantId: 1 });
			mockPrisma.row.findFirst.mockResolvedValue(null);

			mockInvoiceSystemService.getInvoiceTables.mockResolvedValue({
				invoices: { id: 1 },
				invoice_items: { id: 2 },
			});

			await expect(
				EnhancedPDFGenerator.generateInvoicePDF({
					tenantId: '1',
					databaseId: 1,
					invoiceId: 1,
				})
			).rejects.toThrow('Invoice not found');
		});

		it('should handle missing database', async () => {
			mockPrisma.database.findFirst.mockResolvedValue(null);

			await expect(
				EnhancedPDFGenerator.generateInvoicePDF({
					tenantId: '1',
					databaseId: 1,
					invoiceId: 1,
				})
			).rejects.toThrow('Database not found for tenant');
		});
	});

	describe('sendInvoiceEmail', () => {
		it('should send email with PDF attachment', async () => {
			// Mock PDF generation
			jest.spyOn(EnhancedPDFGenerator, 'generateInvoicePDF').mockResolvedValue(
				Buffer.from('mock-pdf-content')
			);

			// Mock email sending
			jest.spyOn(EnhancedPDFGenerator as any, 'sendEmail').mockResolvedValue(true);

			// Mock audit logging
			mockPrisma.auditLog.create.mockResolvedValue({ id: 1 });

			const result = await EnhancedPDFGenerator.sendInvoiceEmail(
				{
					tenantId: '1',
					databaseId: 1,
					invoiceId: 1,
				},
				{
					to: ['test@example.com'],
					subject: 'Invoice #INV-001',
					body: 'Please find your invoice attached.',
				}
			);

			expect(result).toBe(true);
			expect(EnhancedPDFGenerator.generateInvoicePDF).toHaveBeenCalled();
			expect(mockPrisma.auditLog.create).toHaveBeenCalled();
		});

		it('should handle email sending failure', async () => {
			// Mock PDF generation
			jest.spyOn(EnhancedPDFGenerator, 'generateInvoicePDF').mockResolvedValue(
				Buffer.from('mock-pdf-content')
			);

			// Mock email sending failure
			jest.spyOn(EnhancedPDFGenerator as any, 'sendEmail').mockResolvedValue(false);

								// Mock audit logging
					mockPrisma.auditLog.create.mockResolvedValue({ id: 1 });

			const result = await EnhancedPDFGenerator.sendInvoiceEmail(
				{
					tenantId: '1',
					databaseId: 1,
					invoiceId: 1,
				},
				{
					to: ['test@example.com'],
					subject: 'Invoice #INV-001',
					body: 'Please find your invoice attached.',
				}
			);

			expect(result).toBe(false);
		});
	});

	describe('transformRowToObject', () => {
		it('should transform row data to object', () => {
			const mockRow = {
				cells: [
					{ column: { name: 'invoice_number' }, value: 'INV-001' },
					{ column: { name: 'date' }, value: '2024-01-01' },
					{ column: { name: 'total_amount' }, value: 100 },
				],
			};

			const result = (EnhancedPDFGenerator as any).transformRowToObject(mockRow);

			expect(result).toEqual({
				invoice_number: 'INV-001',
				date: '2024-01-01',
				total_amount: 100,
			});
		});
	});

	describe('calculateTotals', () => {
		it('should calculate invoice totals correctly', () => {
			const mockItems = [
				{
					quantity: 2,
					price: 50,
					product_vat: 20,
				},
				{
					quantity: 1,
					price: 100,
					product_vat: 10,
				},
			];

			const result = (EnhancedPDFGenerator as any).calculateTotals(mockItems);

			expect(result.subtotal).toBe(200); // (2*50) + (1*100)
			expect(result.vatTotal).toBe(30); // (100*0.2) + (100*0.1)
			expect(result.grandTotal).toBe(230); // 200 + 30
		});

		it('should handle items with zero values', () => {
			const mockItems = [
				{
					quantity: 0,
					price: 50,
					product_vat: 20,
				},
				{
					quantity: 1,
					price: 0,
					product_vat: 10,
				},
			];

			const result = (EnhancedPDFGenerator as any).calculateTotals(mockItems);

			expect(result.subtotal).toBe(0);
			expect(result.vatTotal).toBe(0);
			expect(result.grandTotal).toBe(0);
		});
	});
});
