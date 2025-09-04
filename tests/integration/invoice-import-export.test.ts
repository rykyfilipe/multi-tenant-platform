/** @format */

import { describe, it, expect, beforeEach, afterEach, jest } from '@jest/globals';
import { NextRequest } from 'next/server';
import { POST as importPOST, GET as importGET } from '@/app/api/tenants/[tenantId]/invoices/import/route';
import { POST as exportPOST, GET as exportGET } from '@/app/api/tenants/[tenantId]/invoices/export/route';

// Mock authentication
jest.mock('@/lib/auth', () => ({
	authOptions: {},
	getServerSession: jest.fn(),
	checkUserTenantAccess: jest.fn(),
}));

// Mock migrator service
jest.mock('@/lib/migrators', () => ({
	MigratorService: {
		importInvoices: jest.fn(),
		getAvailableProviders: jest.fn(),
		getImportHistory: jest.fn(),
		exportInvoices: jest.fn(),
		getExportHistory: jest.fn(),
	},
}));

describe('Invoice Import/Export API Routes', () => {
	const mockTenantId = '1';
	const mockUserId = '1';

	beforeEach(() => {
		jest.clearAllMocks();
		
		// Mock authentication
		const { getServerSession } = require('@/lib/auth');
		getServerSession.mockResolvedValue({
			user: { id: mockUserId },
		});

		// Mock tenant access
		const { checkUserTenantAccess } = require('@/lib/auth');
		checkUserTenantAccess.mockResolvedValue(true);
	});

	afterEach(() => {
		jest.restoreAllMocks();
	});

	describe('Import API', () => {
		describe('POST /api/tenants/[tenantId]/invoices/import', () => {
			it('should successfully import invoices from CSV', async () => {
				const { MigratorService } = await import('@/lib/migrators');
				MigratorService.importInvoices.mockResolvedValue({
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
				});

				const request = new NextRequest('http://localhost:3000/api/tenants/1/invoices/import', {
					method: 'POST',
					body: JSON.stringify({
						provider: 'csv',
						fileContent: 'invoice_number,date,customer_name\nINV-001,2024-01-01,Test Customer',
					}),
					headers: {
						'Content-Type': 'application/json',
					},
				});

				const response = await importPOST(request, { params: { tenantId: mockTenantId } });
				const data = await response.json();

				expect(response.status).toBe(200);
				expect(data.success).toBe(true);
				expect(data.result.imported).toBe(2);
				expect(data.result.skipped).toBe(1);
			});

			it('should handle validation errors', async () => {
				const request = new NextRequest('http://localhost:3000/api/tenants/1/invoices/import', {
					method: 'POST',
					body: JSON.stringify({
						provider: 'csv',
						// Missing required fields
					}),
					headers: {
						'Content-Type': 'application/json',
					},
				});

				const response = await importPOST(request, { params: { tenantId: mockTenantId } });
				const data = await response.json();

				expect(response.status).toBe(400);
				expect(data.error).toBe('Validation failed');
			});

			it('should handle unauthorized access', async () => {
				const { getServerSession } = require('@/lib/auth');
				getServerSession.mockResolvedValue(null);

				const request = new NextRequest('http://localhost:3000/api/tenants/1/invoices/import', {
					method: 'POST',
					body: JSON.stringify({
						provider: 'csv',
						fileContent: 'test',
					}),
					headers: {
						'Content-Type': 'application/json',
					},
				});

				const response = await importPOST(request, { params: { tenantId: mockTenantId } });
				const data = await response.json();

				expect(response.status).toBe(401);
				expect(data.error).toBe('Unauthorized');
			});

			it('should handle forbidden access', async () => {
				const { checkUserTenantAccess } = require('@/lib/auth');
				checkUserTenantAccess.mockResolvedValue(false);

				const request = new NextRequest('http://localhost:3000/api/tenants/1/invoices/import', {
					method: 'POST',
					body: JSON.stringify({
						provider: 'csv',
						fileContent: 'test',
					}),
					headers: {
						'Content-Type': 'application/json',
					},
				});

				const response = await importPOST(request, { params: { tenantId: mockTenantId } });
				const data = await response.json();

				expect(response.status).toBe(403);
				expect(data.error).toBe('Forbidden');
			});
		});

		describe('GET /api/tenants/[tenantId]/invoices/import', () => {
			it('should return available providers and import history', async () => {
				const { MigratorService } = await import('@/lib/migrators');
				MigratorService.getAvailableProviders.mockReturnValue(['csv', 'oblio', 'smartbill']);
				MigratorService.getImportHistory.mockResolvedValue([
					{
						id: 1,
						provider: 'csv',
						externalId: 'INV-001',
						importedAt: new Date('2024-01-01'),
						userId: mockUserId,
						success: true,
					},
				]);

				const request = new NextRequest('http://localhost:3000/api/tenants/1/invoices/import');
				const response = await importGET(request, { params: { tenantId: mockTenantId } });
				const data = await response.json();

				expect(response.status).toBe(200);
				expect(data.success).toBe(true);
				expect(data.providers).toHaveLength(3);
				expect(data.importHistory).toHaveLength(1);
			});
		});
	});

	describe('Export API', () => {
		describe('POST /api/tenants/[tenantId]/invoices/export', () => {
			it('should successfully export invoices to CSV', async () => {
				const { MigratorService } = await import('@/lib/migrators');
				MigratorService.exportInvoices.mockResolvedValue({
					success: true,
					data: 'Invoice Number,Date,Customer\nINV-001,2024-01-01,Test Customer',
					mimeType: 'text/csv',
					filename: 'invoices_export_2024-01-01.csv',
					count: 1,
					format: 'csv',
				});

				const request = new NextRequest('http://localhost:3000/api/tenants/1/invoices/export', {
					method: 'POST',
					body: JSON.stringify({
						format: 'csv',
						limit: 100,
					}),
					headers: {
						'Content-Type': 'application/json',
					},
				});

				const response = await exportPOST(request, { params: { tenantId: mockTenantId } });

				expect(response.status).toBe(200);
				expect(response.headers.get('Content-Type')).toBe('text/csv');
				expect(response.headers.get('Content-Disposition')).toContain('invoices_export_2024-01-01.csv');
			});

			it('should successfully export invoices to JSON', async () => {
				const { MigratorService } = await import('@/lib/migrators');
				MigratorService.exportInvoices.mockResolvedValue({
					success: true,
					data: JSON.stringify([{ id: 1, invoice_number: 'INV-001' }]),
					mimeType: 'application/json',
					filename: 'invoices_export_2024-01-01.json',
					count: 1,
					format: 'json',
				});

				const request = new NextRequest('http://localhost:3000/api/tenants/1/invoices/export', {
					method: 'POST',
					body: JSON.stringify({
						format: 'json',
						limit: 100,
					}),
					headers: {
						'Content-Type': 'application/json',
					},
				});

				const response = await exportPOST(request, { params: { tenantId: mockTenantId } });

				expect(response.status).toBe(200);
				expect(response.headers.get('Content-Type')).toBe('application/json');
				expect(response.headers.get('Content-Disposition')).toContain('invoices_export_2024-01-01.json');
			});

			it('should handle validation errors', async () => {
				const request = new NextRequest('http://localhost:3000/api/tenants/1/invoices/export', {
					method: 'POST',
					body: JSON.stringify({
						format: 'invalid',
					}),
					headers: {
						'Content-Type': 'application/json',
					},
				});

				const response = await exportPOST(request, { params: { tenantId: mockTenantId } });
				const data = await response.json();

				expect(response.status).toBe(400);
				expect(data.error).toBe('Validation failed');
			});

			it('should handle export filters', async () => {
				const { MigratorService } = await import('@/lib/migrators');
				MigratorService.exportInvoices.mockResolvedValue({
					success: true,
					data: 'Invoice Number,Date,Customer\nINV-001,2024-01-01,Test Customer',
					mimeType: 'text/csv',
					filename: 'invoices_export_2024-01-01.csv',
					count: 1,
					format: 'csv',
				});

				const request = new NextRequest('http://localhost:3000/api/tenants/1/invoices/export', {
					method: 'POST',
					body: JSON.stringify({
						format: 'csv',
						limit: 50,
						filters: {
							dateFrom: '2024-01-01',
							dateTo: '2024-01-31',
							status: 'paid',
							customerId: 1,
						},
					}),
					headers: {
						'Content-Type': 'application/json',
					},
				});

				const response = await exportPOST(request, { params: { tenantId: mockTenantId } });

				expect(response.status).toBe(200);
				expect(MigratorService.exportInvoices).toHaveBeenCalledWith({
					tenantId: mockTenantId,
					format: 'csv',
					limit: 50,
					filters: {
						dateFrom: '2024-01-01',
						dateTo: '2024-01-31',
						status: 'paid',
						customerId: 1,
					},
				});
			});
		});

		describe('GET /api/tenants/[tenantId]/invoices/export', () => {
			it('should return available formats and export history', async () => {
				const { MigratorService } = await import('@/lib/migrators');
				MigratorService.getExportHistory.mockResolvedValue([
					{
						id: 1,
						format: 'csv',
						exportedAt: new Date('2024-01-01'),
						userId: mockUserId,
						count: 5,
						success: true,
					},
				]);

				const request = new NextRequest('http://localhost:3000/api/tenants/1/invoices/export');
				const response = await exportGET(request, { params: { tenantId: mockTenantId } });
				const data = await response.json();

				expect(response.status).toBe(200);
				expect(data.success).toBe(true);
				expect(data.formats).toHaveLength(2); // CSV and JSON
				expect(data.exportHistory).toHaveLength(1);
			});
		});
	});
});
