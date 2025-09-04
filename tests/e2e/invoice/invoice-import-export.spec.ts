/** @format */

import { test, expect } from '@playwright/test';

test.describe('Invoice Import/Export Flow', () => {
	test.beforeEach(async ({ page }) => {
		// Mock authentication
		await page.addInitScript(() => {
			window.localStorage.setItem('auth-token', 'mock-token');
			window.localStorage.setItem('user', JSON.stringify({
				id: '1',
				email: 'test@example.com',
				tenantId: '1'
			}));
		});

		// Mock API responses
		await page.route('**/api/tenants/1/invoices', async (route) => {
			await route.fulfill({
				status: 200,
				contentType: 'application/json',
				body: JSON.stringify({
					success: true,
					data: {
						invoices: [
							{
								id: 1,
								invoice_number: 'INV-2024-000001',
								date: '2024-01-01',
								customer_id: 1,
								total_amount: 120,
								currency: 'USD'
							}
						],
						nextInvoiceNumber: 'INV-2024-000002',
						totalInvoices: 1
					}
				})
			});
		});

		await page.route('**/api/tenants/1/invoices/import', async (route) => {
			await route.fulfill({
				status: 200,
				contentType: 'application/json',
				body: JSON.stringify({
					success: true,
					providers: [
						{
							name: 'csv',
							displayName: 'CSV',
							description: 'Import from CSV file',
							requiresApiKey: false,
							supportsFileUpload: true,
							supportsDateRange: false
						},
						{
							name: 'oblio',
							displayName: 'Oblio',
							description: 'Import from Oblio API',
							requiresApiKey: true,
							supportsFileUpload: false,
							supportsDateRange: true
						}
					],
					importHistory: []
				})
			});
		});

		await page.route('**/api/tenants/1/invoices/export', async (route) => {
			await route.fulfill({
				status: 200,
				contentType: 'application/json',
				body: JSON.stringify({
					success: true,
					formats: [
						{
							name: 'csv',
							displayName: 'CSV',
							description: 'Export as CSV file',
							mimeType: 'text/csv'
						},
						{
							name: 'json',
							displayName: 'JSON',
							description: 'Export as JSON file',
							mimeType: 'application/json'
						}
					],
					exportHistory: []
				})
			});
		});

		// Navigate to invoices page
		await page.goto('/home/invoices');
	});

	test('should export invoices to CSV', async ({ page }) => {
		// Mock export API
		await page.route('**/api/tenants/1/invoices/export', async (route) => {
			if (route.request().method() === 'POST') {
				await route.fulfill({
					status: 200,
					headers: {
						'Content-Type': 'text/csv',
						'Content-Disposition': 'attachment; filename="invoices_export_2024-01-01.csv"'
					},
					body: 'Invoice Number,Date,Customer,Total\nINV-2024-000001,2024-01-01,Test Customer,120'
				});
			}
		});

		// Click export button
		await page.click('button:has-text("Export")');

		// Wait for export modal
		await page.waitForSelector('[data-testid="export-modal"]');

		// Select CSV format
		await page.click('[data-testid="format-select"]');
		await page.click('text=CSV');

		// Set limit
		await page.fill('[data-testid="limit-input"]', '100');

		// Set date filters
		await page.fill('[data-testid="date-from-input"]', '2024-01-01');
		await page.fill('[data-testid="date-to-input"]', '2024-01-31');

		// Click export button
		await page.click('button:has-text("Export")');

		// Wait for download to start
		await page.waitForEvent('download');

		// Verify success message
		await expect(page.locator('[data-testid="success-message"]')).toContainText('Export completed');
	});

	test('should export invoices to JSON', async ({ page }) => {
		// Mock export API
		await page.route('**/api/tenants/1/invoices/export', async (route) => {
			if (route.request().method() === 'POST') {
				await route.fulfill({
					status: 200,
					headers: {
						'Content-Type': 'application/json',
						'Content-Disposition': 'attachment; filename="invoices_export_2024-01-01.json"'
					},
					body: JSON.stringify([
						{
							id: 1,
							invoice_number: 'INV-2024-000001',
							date: '2024-01-01',
							customer_id: 1,
							total_amount: 120
						}
					])
				});
			}
		});

		// Click export button
		await page.click('button:has-text("Export")');

		// Wait for export modal
		await page.waitForSelector('[data-testid="export-modal"]');

		// Select JSON format
		await page.click('[data-testid="format-select"]');
		await page.click('text=JSON');

		// Click export button
		await page.click('button:has-text("Export")');

		// Wait for download to start
		await page.waitForEvent('download');

		// Verify success message
		await expect(page.locator('[data-testid="success-message"]')).toContainText('Export completed');
	});

	test('should import invoices from CSV', async ({ page }) => {
		// Mock import API
		await page.route('**/api/tenants/1/invoices/import', async (route) => {
			if (route.request().method() === 'POST') {
				await route.fulfill({
					status: 200,
					contentType: 'application/json',
					body: JSON.stringify({
						success: true,
						result: {
							imported: 2,
							updated: 0,
							skipped: 1,
							errors: 0,
							summary: {
								created: [],
								updated: [],
								skipped: [],
								errors: []
							}
						}
					})
				});
			}
		});

		// Click import button
		await page.click('button:has-text("Import")');

		// Wait for import modal
		await page.waitForSelector('[data-testid="import-modal"]');

		// Select CSV provider
		await page.click('[data-testid="provider-select"]');
		await page.click('text=CSV');

		// Upload CSV file
		const fileInput = page.locator('[data-testid="file-input"]');
		await fileInput.setInputFiles({
			name: 'invoices.csv',
			mimeType: 'text/csv',
			buffer: Buffer.from('Invoice Number,Date,Customer,Total\nINV-001,2024-01-01,Test Customer,120')
		});

		// Set import options
		await page.check('[data-testid="skip-duplicates-checkbox"]');
		await page.check('[data-testid="create-missing-customers-checkbox"]');

		// Click import button
		await page.click('button:has-text("Import")');

		// Wait for import to complete
		await page.waitForSelector('[data-testid="import-results"]');

		// Verify import results
		await expect(page.locator('[data-testid="imported-count"]')).toContainText('2');
		await expect(page.locator('[data-testid="skipped-count"]')).toContainText('1');
		await expect(page.locator('[data-testid="errors-count"]')).toContainText('0');

		// Verify success message
		await expect(page.locator('[data-testid="success-message"]')).toContainText('Import completed');
	});

	test('should import invoices from Oblio API', async ({ page }) => {
		// Mock import API
		await page.route('**/api/tenants/1/invoices/import', async (route) => {
			if (route.request().method() === 'POST') {
				await route.fulfill({
					status: 200,
					contentType: 'application/json',
					body: JSON.stringify({
						success: true,
						result: {
							imported: 5,
							updated: 2,
							skipped: 0,
							errors: 0,
							summary: {
								created: [],
								updated: [],
								skipped: [],
								errors: []
							}
						}
					})
				});
			}
		});

		// Click import button
		await page.click('button:has-text("Import")');

		// Wait for import modal
		await page.waitForSelector('[data-testid="import-modal"]');

		// Select Oblio provider
		await page.click('[data-testid="provider-select"]');
		await page.click('text=Oblio');

		// Enter API key
		await page.fill('[data-testid="api-key-input"]', 'oblio-api-key-123');

		// Set date range
		await page.fill('[data-testid="date-from-input"]', '2024-01-01');
		await page.fill('[data-testid="date-to-input"]', '2024-01-31');

		// Set import options
		await page.selectOption('[data-testid="deduplication-strategy-select"]', 'external_id');

		// Click import button
		await page.click('button:has-text("Import")');

		// Wait for import to complete
		await page.waitForSelector('[data-testid="import-results"]');

		// Verify import results
		await expect(page.locator('[data-testid="imported-count"]')).toContainText('5');
		await expect(page.locator('[data-testid="updated-count"]')).toContainText('2');
		await expect(page.locator('[data-testid="errors-count"]')).toContainText('0');

		// Verify success message
		await expect(page.locator('[data-testid="success-message"]')).toContainText('Import completed');
	});

	test('should handle import validation errors', async ({ page }) => {
		// Mock validation error
		await page.route('**/api/tenants/1/invoices/import', async (route) => {
			if (route.request().method() === 'POST') {
				await route.fulfill({
					status: 400,
					contentType: 'application/json',
					body: JSON.stringify({
						error: 'Validation failed',
						details: [
							{
								field: 'provider',
								message: 'Provider is required'
							}
						]
					})
				});
			}
		});

		// Click import button
		await page.click('button:has-text("Import")');

		// Wait for import modal
		await page.waitForSelector('[data-testid="import-modal"]');

		// Try to import without selecting provider
		await page.click('button:has-text("Import")');

		// Verify error message
		await expect(page.locator('[data-testid="error-message"]')).toContainText('Please select a provider');
	});

	test('should handle export errors', async ({ page }) => {
		// Mock export error
		await page.route('**/api/tenants/1/invoices/export', async (route) => {
			if (route.request().method() === 'POST') {
				await route.fulfill({
					status: 500,
					contentType: 'application/json',
					body: JSON.stringify({
						error: 'Export failed',
						message: 'Database connection error'
					})
				});
			}
		});

		// Click export button
		await page.click('button:has-text("Export")');

		// Wait for export modal
		await page.waitForSelector('[data-testid="export-modal"]');

		// Select CSV format
		await page.click('[data-testid="format-select"]');
		await page.click('text=CSV');

		// Click export button
		await page.click('button:has-text("Export")');

		// Verify error message
		await expect(page.locator('[data-testid="error-message"]')).toContainText('Export failed');
	});
});
