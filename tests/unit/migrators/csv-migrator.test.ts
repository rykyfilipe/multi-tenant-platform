/** @format */

import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { CSVMigrator } from '@/lib/migrators/csv-migrator';
import prisma from '@/lib/prisma';

// Mock Prisma
vi.mock('@/lib/prisma', () => ({
	default: {
		database: {
			findFirst: vi.fn(),
		},
		row: {
			create: vi.fn(),
			findFirst: vi.fn(),
		},
		cell: {
			createMany: vi.fn(),
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
		generateInvoiceNumberWithConfig: vi.fn(),
	},
}));

describe('CSVMigrator', () => {
	let csvMigrator: CSVMigrator;

	beforeEach(() => {
		vi.clearAllMocks();
		csvMigrator = new CSVMigrator();
	});

	afterEach(() => {
		vi.restoreAllMocks();
	});

	describe('getProviderName', () => {
		it('should return correct provider name', () => {
			expect(csvMigrator.getProviderName()).toBe('csv');
		});
	});

	describe('importInvoices', () => {
		it('should successfully import CSV invoices', async () => {
			// Mock database
			(prisma.database.findFirst as any).mockResolvedValue({
				id: 1,
				tenantId: 1,
			});

			// Mock invoice tables
			const { InvoiceSystemService } = await import('@/lib/invoice-system');
			(InvoiceSystemService.getInvoiceTables as any).mockResolvedValue({
				invoices: { id: 1 },
				invoice_items: { id: 2 },
				customers: { id: 3 },
			});

			// Mock invoice number generation
			(InvoiceSystemService.generateInvoiceNumberWithConfig as any).mockResolvedValue({
				number: 'CSV-001',
			});

			// Mock row creation
			(prisma.row.create as any).mockResolvedValue({ id: 1 });

			// Mock cell creation
			(prisma.cell.createMany as any).mockResolvedValue({ count: 5 });

			// Mock audit log creation
			(prisma.auditLog.create as any).mockResolvedValue({ id: 1 });

			const csvContent = `invoice_number,date,customer_name,customer_email,description,quantity,price,currency
INV-001,2024-01-01,Test Customer,test@example.com,Test Product,1,100,USD`;

			const result = await csvMigrator.importInvoices({
				tenantId: '1',
				fileContent: csvContent,
			});

			expect(result.success).toBe(true);
			expect(result.imported).toBe(1);
			expect(result.errors).toBe(0);
		});

		it('should handle missing file content', async () => {
			await expect(
				csvMigrator.importInvoices({
					tenantId: '1',
				})
			).rejects.toThrow('File content or file path is required for CSV import');
		});

		it('should handle invalid CSV format', async () => {
			// Mock database
			(prisma.database.findFirst as any).mockResolvedValue({
				id: 1,
				tenantId: 1,
			});

			// Mock invoice tables
			const { InvoiceSystemService } = await import('@/lib/invoice-system');
			(InvoiceSystemService.getInvoiceTables as any).mockResolvedValue({
				invoices: { id: 1 },
				invoice_items: { id: 2 },
				customers: { id: 3 },
			});

			const result = await csvMigrator.importInvoices({
				tenantId: '1',
				fileContent: 'invalid,csv,content',
			});

			expect(result.success).toBe(true);
			expect(result.imported).toBe(0);
			expect(result.errors).toBe(0);
		});

		it('should handle database not found', async () => {
			// Mock database not found
			(prisma.database.findFirst as any).mockResolvedValue(null);

			await expect(
				csvMigrator.importInvoices({
					tenantId: '1',
					fileContent: 'invoice_number,date\nINV-001,2024-01-01',
				})
			).rejects.toThrow('Database not found for tenant');
		});
	});

	describe('parseCSV', () => {
		it('should parse simple CSV correctly', async () => {
			const csvContent = `invoice_number,date,customer_name
INV-001,2024-01-01,Test Customer`;

			// Mock database
			(prisma.database.findFirst as any).mockResolvedValue({
				id: 1,
				tenantId: 1,
			});

			// Mock invoice tables
			const { InvoiceSystemService } = await import('@/lib/invoice-system');
			(InvoiceSystemService.getInvoiceTables as any).mockResolvedValue({
				invoices: { id: 1 },
				invoice_items: { id: 2 },
				customers: { id: 3 },
			});

			// Mock row creation
			(prisma.row.create as any).mockResolvedValue({ id: 1 });

			// Mock cell creation
			(prisma.cell.createMany as any).mockResolvedValue({ count: 5 });

			// Mock audit log creation
			(prisma.auditLog.create as any).mockResolvedValue({ id: 1 });

			const result = await csvMigrator.importInvoices({
				tenantId: '1',
				fileContent: csvContent,
			});

			expect(result.success).toBe(true);
			expect(result.imported).toBe(1);
		});

		it('should handle CSV with quoted values', async () => {
			const csvContent = `invoice_number,date,customer_name
"INV-001","2024-01-01","Test Customer, Inc."`;

			// Mock database
			(prisma.database.findFirst as any).mockResolvedValue({
				id: 1,
				tenantId: 1,
			});

			// Mock invoice tables
			const { InvoiceSystemService } = await import('@/lib/invoice-system');
			(InvoiceSystemService.getInvoiceTables as any).mockResolvedValue({
				invoices: { id: 1 },
				invoice_items: { id: 2 },
				customers: { id: 3 },
			});

			// Mock row creation
			(prisma.row.create as any).mockResolvedValue({ id: 1 });

			// Mock cell creation
			(prisma.cell.createMany as any).mockResolvedValue({ count: 5 });

			// Mock audit log creation
			(prisma.auditLog.create as any).mockResolvedValue({ id: 1 });

			const result = await csvMigrator.importInvoices({
				tenantId: '1',
				fileContent: csvContent,
			});

			expect(result.success).toBe(true);
			expect(result.imported).toBe(1);
		});

		it('should handle CSV with multiple items per invoice', async () => {
			const csvContent = `invoice_number,date,customer_name,description,quantity,price
INV-001,2024-01-01,Test Customer,Product 1,1,100
INV-001,2024-01-01,Test Customer,Product 2,2,50`;

			// Mock database
			(prisma.database.findFirst as any).mockResolvedValue({
				id: 1,
				tenantId: 1,
			});

			// Mock invoice tables
			const { InvoiceSystemService } = await import('@/lib/invoice-system');
			(InvoiceSystemService.getInvoiceTables as any).mockResolvedValue({
				invoices: { id: 1 },
				invoice_items: { id: 2 },
				customers: { id: 3 },
			});

			// Mock row creation
			(prisma.row.create as any).mockResolvedValue({ id: 1 });

			// Mock cell creation
			(prisma.cell.createMany as any).mockResolvedValue({ count: 5 });

			// Mock audit log creation
			(prisma.auditLog.create as any).mockResolvedValue({ id: 1 });

			const result = await csvMigrator.importInvoices({
				tenantId: '1',
				fileContent: csvContent,
			});

			expect(result.success).toBe(true);
			expect(result.imported).toBe(1);
		});
	});

	describe('mapCSVStatus', () => {
		it('should map CSV status correctly', () => {
			const migrator = new CSVMigrator();
			
			// Test private method through public method
			expect((migrator as any).mapCSVStatus('draft')).toBe('draft');
			expect((migrator as any).mapCSVStatus('issued')).toBe('issued');
			expect((migrator as any).mapCSVStatus('paid')).toBe('paid');
			expect((migrator as any).mapCSVStatus('overdue')).toBe('overdue');
			expect((migrator as any).mapCSVStatus('cancelled')).toBe('cancelled');
			expect((migrator as any).mapCSVStatus('credit_note')).toBe('credit_note');
			expect((migrator as any).mapCSVStatus('proforma')).toBe('proforma');
			expect((migrator as any).mapCSVStatus('unknown')).toBe('issued');
			expect((migrator as any).mapCSVStatus('')).toBe('issued');
		});
	});
});
