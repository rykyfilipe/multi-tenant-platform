/** @format */

import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { EnhancedPDFGenerator } from '@/lib/pdf-enhanced-generator';
import prisma from '@/lib/prisma';

// Mock Prisma
vi.mock('@/lib/prisma', () => ({
	default: {
		tenant: {
			findUnique: vi.fn(),
		},
		row: {
			findFirst: vi.fn(),
			findMany: vi.fn(),
		},
		auditLog: {
			create: vi.fn(),
		},
	},
}));

// Mock InvoiceSystemService
vi.mock('@/lib/invoice-system', () => ({
	InvoiceSystemService: {
		getInvoiceTables: vi.fn(),
		getCustomerTables: vi.fn(),
	},
}));

// Mock PDF-lib
vi.mock('pdf-lib', () => ({
	PDFDocument: {
		create: vi.fn().mockResolvedValue({
			addPage: vi.fn().mockReturnValue({
				getSize: vi.fn().mockReturnValue({ width: 595, height: 842 }),
				drawText: vi.fn(),
				drawRectangle: vi.fn(),
				drawLine: vi.fn(),
			}),
			embedFont: vi.fn().mockResolvedValue({}),
			save: vi.fn().mockResolvedValue(new Uint8Array([1, 2, 3, 4])),
		}),
	},
	StandardFonts: {
		Helvetica: 'Helvetica',
		HelveticaBold: 'HelveticaBold',
	},
	PageSizes: {
		A4: [595, 842],
	},
	rgb: vi.fn().mockReturnValue({}),
}));

describe('EnhancedPDFGenerator', () => {
	beforeEach(() => {
		vi.clearAllMocks();
	});

	afterEach(() => {
		vi.restoreAllMocks();
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
			(prisma.database.findFirst as any).mockResolvedValue({ id: 1, tenantId: 1 });
			(prisma.row.findFirst as any).mockResolvedValue(mockInvoiceRow);
			(prisma.row.findMany as any).mockResolvedValue(mockInvoiceItems);
			(prisma.tenant.findUnique as any).mockResolvedValue(mockTenant);

			// Mock InvoiceSystemService
			const { InvoiceSystemService } = await import('@/lib/invoice-system');
			InvoiceSystemService.getInvoiceTables.mockResolvedValue({
				invoices: { id: 1 },
				invoice_items: { id: 2 },
			});
			InvoiceSystemService.getCustomerTables.mockResolvedValue({
				customers: { id: 3 },
			});

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
			(prisma.database.findFirst as any).mockResolvedValue({ id: 1, tenantId: 1 });
			(prisma.row.findFirst as any).mockResolvedValue({
				id: 1,
				cells: [
					{ column: { name: 'invoice_number' }, value: 'INV-001' },
					{ column: { name: 'date' }, value: '2024-01-01' },
					{ column: { name: 'customer_id' }, value: 1 },
				],
			});
			(prisma.row.findMany as any).mockResolvedValue([]);
			(prisma.tenant.findUnique as any).mockResolvedValue({
				name: 'Test Company',
			});

			const { InvoiceSystemService } = await import('@/lib/invoice-system');
			InvoiceSystemService.getInvoiceTables.mockResolvedValue({
				invoices: { id: 1 },
				invoice_items: { id: 2 },
			});
			InvoiceSystemService.getCustomerTables.mockResolvedValue({
				customers: { id: 3 },
			});

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
			(prisma.database.findFirst as any).mockResolvedValue({ id: 1, tenantId: 1 });
			(prisma.row.findFirst as any).mockResolvedValue(null);

			const { InvoiceSystemService } = await import('@/lib/invoice-system');
			InvoiceSystemService.getInvoiceTables.mockResolvedValue({
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
			(prisma.database.findFirst as any).mockResolvedValue(null);

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
			vi.spyOn(EnhancedPDFGenerator, 'generateInvoicePDF').mockResolvedValue(
				Buffer.from('mock-pdf-content')
			);

			// Mock email sending
			vi.spyOn(EnhancedPDFGenerator as any, 'sendEmail').mockResolvedValue(true);

			// Mock audit logging
			(prisma.auditLog.create as any).mockResolvedValue({ id: 1 });

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
			expect(prisma.auditLog.create).toHaveBeenCalled();
		});

		it('should handle email sending failure', async () => {
			// Mock PDF generation
			vi.spyOn(EnhancedPDFGenerator, 'generateInvoicePDF').mockResolvedValue(
				Buffer.from('mock-pdf-content')
			);

			// Mock email sending failure
			vi.spyOn(EnhancedPDFGenerator as any, 'sendEmail').mockResolvedValue(false);

			// Mock audit logging
			(prisma.auditLog.create as any).mockResolvedValue({ id: 1 });

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
