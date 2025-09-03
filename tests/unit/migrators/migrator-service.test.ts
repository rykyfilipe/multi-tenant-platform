/** @format */

import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { MigratorService } from '@/lib/migrators/migrator-service';
import { MigratorFactory } from '@/lib/migrators/migrator-factory';
import { CSVMigrator } from '@/lib/migrators/csv-migrator';
import { OblioMigrator } from '@/lib/migrators/oblio-migrator';
import prisma from '@/lib/prisma';

// Mock Prisma
vi.mock('@/lib/prisma', () => ({
	default: {
		database: {
			findFirst: vi.fn(),
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
	},
}));

describe('MigratorService', () => {
	beforeEach(() => {
		vi.clearAllMocks();
	});

	afterEach(() => {
		vi.restoreAllMocks();
	});

	describe('importInvoices', () => {
		it('should successfully import invoices from CSV', async () => {
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

			// Mock CSV migrator
			const mockCSVMigrator = {
				importInvoices: vi.fn().mockResolvedValue({
					success: true,
					imported: 2,
					updated: 0,
					skipped: 1,
					errors: 0,
					summary: {
						created: [],
						updated: [],
						skipped: [],
						errors: [],
					},
				}),
				validateConnection: vi.fn().mockResolvedValue(true),
			};

			vi.spyOn(MigratorFactory, 'createMigrator').mockReturnValue(mockCSVMigrator as any);

			const result = await MigratorService.importInvoices('csv', {
				tenantId: '1',
				fileContent: 'invoice_number,date,customer_name\nINV-001,2024-01-01,Test Customer',
			});

			expect(result.success).toBe(true);
			expect(result.imported).toBe(2);
			expect(result.skipped).toBe(1);
		});

		it('should handle validation errors', async () => {
			const result = await MigratorService.importInvoices('csv', {
				tenantId: '',
			} as any);

			expect(result.success).toBe(false);
		});

		it('should handle connection validation failure', async () => {
			// Mock database
			(prisma.database.findFirst as any).mockResolvedValue({
				id: 1,
				tenantId: 1,
			});

			// Mock Oblio migrator with failed connection
			const mockOblioMigrator = {
				validateConnection: vi.fn().mockResolvedValue(false),
			};

			vi.spyOn(MigratorFactory, 'createMigrator').mockReturnValue(mockOblioMigrator as any);

			await expect(
				MigratorService.importInvoices('oblio', {
					tenantId: '1',
					apiKey: 'invalid-key',
				})
			).rejects.toThrow('Failed to validate connection to oblio');
		});
	});

	describe('exportInvoices', () => {
		it('should successfully export invoices to CSV', async () => {
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
			});

			// Mock invoice data
			vi.spyOn(MigratorService as any, 'getInvoicesForExport').mockResolvedValue([
				{
					id: 1,
					cells: [
						{ column: { name: 'invoice_number' }, value: 'INV-001' },
						{ column: { name: 'date' }, value: '2024-01-01' },
						{ column: { name: 'total_amount' }, value: 100 },
					],
					items: [],
				},
			]);

			const result = await MigratorService.exportInvoices({
				tenantId: '1',
				format: 'csv',
			});

			expect(result.success).toBe(true);
			expect(result.format).toBe('csv');
			expect(result.data).toContain('Invoice Number');
			expect(result.data).toContain('INV-001');
		});

		it('should successfully export invoices to JSON', async () => {
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
			});

			// Mock invoice data
			vi.spyOn(MigratorService as any, 'getInvoicesForExport').mockResolvedValue([
				{
					id: 1,
					cells: [
						{ column: { name: 'invoice_number' }, value: 'INV-001' },
						{ column: { name: 'date' }, value: '2024-01-01' },
						{ column: { name: 'total_amount' }, value: 100 },
					],
					items: [],
				},
			]);

			const result = await MigratorService.exportInvoices({
				tenantId: '1',
				format: 'json',
			});

			expect(result.success).toBe(true);
			expect(result.format).toBe('json');
			expect(result.mimeType).toBe('application/json');
			
			const jsonData = JSON.parse(result.data);
			expect(jsonData).toHaveLength(1);
			expect(jsonData[0].id).toBe(1);
		});

		it('should handle unsupported export format', async () => {
			await expect(
				MigratorService.exportInvoices({
					tenantId: '1',
					format: 'xml' as any,
				})
			).rejects.toThrow('Unsupported export format: xml');
		});
	});

	describe('getImportHistory', () => {
		it('should return import history', async () => {
			// Mock database
			(prisma.database.findFirst as any).mockResolvedValue({
				id: 1,
				tenantId: 1,
			});

			// Mock audit logs
			(prisma.auditLog.findMany as any).mockResolvedValue([
				{
					id: 1,
					metadata: { source: 'csv', externalId: 'INV-001' },
					createdAt: new Date('2024-01-01'),
					userId: 1,
					status: 'success',
				},
			]);

			const history = await MigratorService.getImportHistory('1', 10);

			expect(history).toHaveLength(1);
			expect(history[0].provider).toBe('csv');
			expect(history[0].externalId).toBe('INV-001');
		});
	});

	describe('getExportHistory', () => {
		it('should return export history', async () => {
			// Mock database
			(prisma.database.findFirst as any).mockResolvedValue({
				id: 1,
				tenantId: 1,
			});

			// Mock audit logs
			(prisma.auditLog.findMany as any).mockResolvedValue([
				{
					id: 1,
					metadata: { format: 'csv', count: 5 },
					createdAt: new Date('2024-01-01'),
					userId: 1,
					status: 'success',
				},
			]);

			const history = await MigratorService.getExportHistory('1', 10);

			expect(history).toHaveLength(1);
			expect(history[0].format).toBe('csv');
			expect(history[0].count).toBe(5);
		});
	});
});
