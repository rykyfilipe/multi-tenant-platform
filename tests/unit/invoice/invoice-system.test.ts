/** @format */

import { describe, it, expect, beforeEach, afterEach, jest } from '@jest/globals';
import { InvoiceSystemService } from '@/lib/invoice-system';
import prisma from '@/lib/prisma';

// Mock Prisma
jest.mock('@/lib/prisma', () => ({
	default: {
		table: {
			findFirst: jest.fn(),
			findMany: jest.fn(),
			create: jest.fn(),
			update: jest.fn(),
			delete: jest.fn(),
		},
		column: {
			findMany: jest.fn(),
			create: jest.fn(),
			createMany: jest.fn(),
		},
		row: {
			findFirst: jest.fn(),
			findMany: jest.fn(),
			create: jest.fn(),
			update: jest.fn(),
			delete: jest.fn(),
		},
		cell: {
			findMany: jest.fn(),
			create: jest.fn(),
			createMany: jest.fn(),
		},
		auditLog: {
			create: jest.fn(),
		},
	},
}));

describe('InvoiceSystemService', () => {
	const mockTenantId = 1;
	const mockDatabaseId = 1;

	beforeEach(() => {
		jest.clearAllMocks();
	});

	afterEach(() => {
		jest.restoreAllMocks();
	});

	describe('getInvoiceTables', () => {
		it('should return invoice tables when they exist', async () => {
			const mockTables = [
				{
					id: 1,
					name: 'invoices',
					protectedType: 'invoices',
					columns: [
						{ id: 1, name: 'invoice_number', type: 'TEXT', isLocked: true },
						{ id: 2, name: 'date', type: 'DATE', isLocked: true },
						{ id: 3, name: 'customer_id', type: 'INTEGER', isLocked: true },
					],
				},
				{
					id: 2,
					name: 'invoice_items',
					protectedType: 'invoice_items',
					columns: [
						{ id: 4, name: 'invoice_id', type: 'INTEGER', isLocked: true },
						{ id: 5, name: 'quantity', type: 'INTEGER', isLocked: true },
						{ id: 6, name: 'price', type: 'DECIMAL', isLocked: true },
					],
				},
				{
					id: 3,
					name: 'customers',
					protectedType: 'customers',
					columns: [
						{ id: 7, name: 'customer_name', type: 'TEXT', isLocked: true },
						{ id: 8, name: 'customer_email', type: 'TEXT', isLocked: true },
					],
				},
			];

			(prisma.table.findMany as any).mockResolvedValue(mockTables);

			const result = await InvoiceSystemService.getInvoiceTables(mockTenantId, mockDatabaseId);

			expect(result.invoices).toBeDefined();
			expect(result.invoice_items).toBeDefined();
			expect(result.customers).toBeDefined();
			expect(result.invoices?.columns).toHaveLength(3);
			expect(result.invoice_items?.columns).toHaveLength(3);
			expect(result.customers?.columns).toHaveLength(2);
		});

		it('should return null for missing tables', async () => {
			(prisma.table.findMany as any).mockResolvedValue([]);

			const result = await InvoiceSystemService.getInvoiceTables(mockTenantId, mockDatabaseId);

			expect(result.invoices).toBeNull();
			expect(result.invoice_items).toBeNull();
			expect(result.customers).toBeNull();
		});
	});

	describe('initializeInvoiceTables', () => {
		it('should create invoice tables with correct structure', async () => {
			const mockCreatedTables = [
				{ id: 1, name: 'invoices' },
				{ id: 2, name: 'invoice_items' },
				{ id: 3, name: 'customers' },
			];

			(prisma.table.create as any)
				.mockResolvedValueOnce(mockCreatedTables[0])
				.mockResolvedValueOnce(mockCreatedTables[1])
				.mockResolvedValueOnce(mockCreatedTables[2]);

			(prisma.column.createMany as any).mockResolvedValue({ count: 3 });

			const result = await InvoiceSystemService.initializeInvoiceTables(mockTenantId, mockDatabaseId);

			expect(result.invoices).toBeDefined();
			expect(result.invoice_items).toBeDefined();
			expect(result.customers).toBeDefined();
			expect(prisma.table.create).toHaveBeenCalledTimes(3);
			expect(prisma.column.createMany).toHaveBeenCalledTimes(3);
		});
	});

	describe('generateInvoiceNumberWithConfig', () => {
		it('should generate invoice number with series and year', async () => {
			const mockConfig = {
				series: 'INV',
				includeYear: true,
				startNumber: 1,
				separator: '-',
			};

			// Mock existing invoices
			(prisma.row.findMany as any).mockResolvedValue([
				{
					cells: [
						{ column: { name: 'invoice_series' }, value: 'INV-2024' },
						{ column: { name: 'invoice_number' }, value: 'INV-2024-000001' },
					],
				},
				{
					cells: [
						{ column: { name: 'invoice_series' }, value: 'INV-2024' },
						{ column: { name: 'invoice_number' }, value: 'INV-2024-000002' },
					],
				},
			]);

			const result = await InvoiceSystemService.generateInvoiceNumberWithConfig(
				mockTenantId,
				mockDatabaseId,
				mockConfig
			);

			expect(result.series).toBe('INV-2024');
			expect(result.number).toBe('INV-2024-000003');
			expect(result.nextNumber).toBe(4);
		});

		it('should generate first invoice number when no invoices exist', async () => {
			const mockConfig = {
				series: 'INV',
				includeYear: true,
				startNumber: 1,
				separator: '-',
			};

			(prisma.row.findMany as any).mockResolvedValue([]);

			const result = await InvoiceSystemService.generateInvoiceNumberWithConfig(
				mockTenantId,
				mockDatabaseId,
				mockConfig
			);

			expect(result.series).toBe('INV-2024');
			expect(result.number).toBe('INV-2024-000001');
			expect(result.nextNumber).toBe(2);
		});

		it('should generate invoice number without year', async () => {
			const mockConfig = {
				series: 'INV',
				includeYear: false,
				startNumber: 1,
				separator: '-',
			};

			(prisma.row.findMany as any).mockResolvedValue([]);

			const result = await InvoiceSystemService.generateInvoiceNumberWithConfig(
				mockTenantId,
				mockDatabaseId,
				mockConfig
			);

			expect(result.series).toBe('INV');
			expect(result.number).toBe('INV-000001');
			expect(result.nextNumber).toBe(2);
		});
	});

	describe('getInvoiceNumberingStats', () => {
		it('should return correct statistics', async () => {
			const mockInvoices = [
				{
					cells: [
						{ column: { name: 'invoice_series' }, value: 'INV-2024' },
						{ column: { name: 'invoice_number' }, value: 'INV-2024-000001' },
						{ column: { name: 'date' }, value: '2024-01-01' },
					],
				},
				{
					cells: [
						{ column: { name: 'invoice_series' }, value: 'INV-2024' },
						{ column: { name: 'invoice_number' }, value: 'INV-2024-000002' },
						{ column: { name: 'date' }, value: '2024-01-15' },
					],
				},
				{
					cells: [
						{ column: { name: 'invoice_series' }, value: 'INV-2023' },
						{ column: { name: 'invoice_number' }, value: 'INV-2023-000001' },
						{ column: { name: 'date' }, value: '2023-12-31' },
					],
				},
			];

			(prisma.row.findMany as any).mockResolvedValue(mockInvoices);

			const result = await InvoiceSystemService.getInvoiceNumberingStats(mockTenantId, mockDatabaseId);

			expect(result.totalInvoices).toBe(3);
			expect(result.nextInvoiceNumber).toBe('INV-2024-000003');
			expect(result.lastInvoiceNumber).toBe('INV-2024-000002');
			expect(result.seriesBreakdown).toHaveProperty('INV-2024');
			expect(result.seriesBreakdown).toHaveProperty('INV-2023');
			expect(result.yearlyStats).toHaveProperty('2024');
			expect(result.yearlyStats).toHaveProperty('2023');
		});
	});

	describe('updateInvoiceTablesSchema', () => {
		it('should add missing columns to existing tables', async () => {
			const mockTables = [
				{
					id: 1,
					name: 'invoices',
					columns: [
						{ id: 1, name: 'invoice_number', type: 'TEXT' },
						{ id: 2, name: 'date', type: 'DATE' },
					],
				},
				{
					id: 2,
					name: 'invoice_items',
					columns: [
						{ id: 3, name: 'invoice_id', type: 'INTEGER' },
						{ id: 4, name: 'quantity', type: 'INTEGER' },
					],
				},
			];

			(prisma.table.findMany as any).mockResolvedValue(mockTables);
			(prisma.column.createMany as any).mockResolvedValue({ count: 2 });

			await InvoiceSystemService.updateInvoiceTablesSchema(mockTenantId, mockDatabaseId);

			expect(prisma.column.createMany).toHaveBeenCalled();
		});
	});
});
