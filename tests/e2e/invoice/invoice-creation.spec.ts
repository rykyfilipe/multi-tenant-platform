/** @format */

import { test, expect } from '@playwright/test';

test.describe('Invoice Creation Flow', () => {
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
		await page.route('**/api/tenants/1/customers', async (route) => {
			await route.fulfill({
				status: 200,
				contentType: 'application/json',
				body: JSON.stringify({
					success: true,
					data: [
						{
							id: 1,
							customer_name: 'Test Customer',
							customer_email: 'test@example.com',
							customer_address: '123 Test St'
						}
					]
				})
			});
		});

		await page.route('**/api/tenants/1/databases/tables', async (route) => {
			await route.fulfill({
				status: 200,
				contentType: 'application/json',
				body: JSON.stringify([
					{
						id: 1,
						name: 'products',
						description: 'Products Table',
						columns: [
							{ name: 'name', semanticType: 'PRODUCT_NAME' },
							{ name: 'price', semanticType: 'PRODUCT_PRICE' },
							{ name: 'currency', semanticType: 'CURRENCY' },
							{ name: 'vat', semanticType: 'PRODUCT_VAT' }
						]
					}
				])
			});
		});

		await page.route('**/api/tenants/1/databases/*/tables/*/rows', async (route) => {
			await route.fulfill({
				status: 200,
				contentType: 'application/json',
				body: JSON.stringify({
					data: [
						{
							id: 1,
							cells: [
								{ column: { name: 'name' }, value: 'Test Product' },
								{ column: { name: 'price' }, value: 100 },
								{ column: { name: 'currency' }, value: 'USD' },
								{ column: { name: 'vat' }, value: 20 }
							]
						}
					]
				})
			});
		});

		await page.route('**/api/tenants/1/invoices', async (route) => {
			if (route.request().method() === 'POST') {
				await route.fulfill({
					status: 200,
					contentType: 'application/json',
					body: JSON.stringify({
						message: 'Invoice created successfully',
						invoice: {
							id: 1,
							invoice_number: 'INV-2024-000001',
							customer_id: 1,
							items_count: 1
						}
					})
				});
			} else {
				await route.fulfill({
					status: 200,
					contentType: 'application/json',
					body: JSON.stringify({
						success: true,
						data: {
							invoices: [],
							nextInvoiceNumber: 'INV-2024-000001',
							totalInvoices: 0
						}
					})
				});
			}
		});

		// Navigate to invoices page
		await page.goto('/home/invoices');
	});

	test('should create invoice successfully', async ({ page }) => {
		// Click create invoice button
		await page.click('button:has-text("Create Invoice")');

		// Wait for form to load
		await page.waitForSelector('[data-testid="invoice-form"]');

		// Select customer
		await page.click('[data-testid="customer-select"]');
		await page.click('text=Test Customer');

		// Set due date
		await page.fill('[data-testid="due-date-input"]', '2024-02-01');

		// Set payment method
		await page.click('[data-testid="payment-method-select"]');
		await page.click('text=Bank Transfer');

		// Add product
		await page.click('[data-testid="product-table-select"]');
		await page.click('text=products');

		// Wait for products to load
		await page.waitForSelector('[data-testid="product-select"]');

		await page.click('[data-testid="product-select"]');
		await page.click('text=Test Product');

		// Set quantity
		await page.fill('[data-testid="quantity-input"]', '2');

		// Add product to invoice
		await page.click('button:has-text("Add Product")');

		// Verify product was added
		await expect(page.locator('[data-testid="product-list"]')).toContainText('Test Product');
		await expect(page.locator('[data-testid="product-list"]')).toContainText('Quantity: 2');
		await expect(page.locator('[data-testid="product-list"]')).toContainText('Price: $100.00');

		// Verify totals calculation
		await expect(page.locator('[data-testid="subtotal"]')).toContainText('$200.00');
		await expect(page.locator('[data-testid="vat-total"]')).toContainText('$40.00');
		await expect(page.locator('[data-testid="grand-total"]')).toContainText('$240.00');

		// Submit invoice
		await page.click('button:has-text("Generate Invoice")');

		// Verify success message
		await expect(page.locator('[data-testid="success-message"]')).toContainText('Invoice created successfully');
	});

	test('should validate required fields', async ({ page }) => {
		// Click create invoice button
		await page.click('button:has-text("Create Invoice")');

		// Try to submit without filling required fields
		await page.click('button:has-text("Generate Invoice")');

		// Verify validation messages
		await expect(page.locator('text=Please select a customer')).toBeVisible();
		await expect(page.locator('text=Due date is required')).toBeVisible();
		await expect(page.locator('text=Payment method is required')).toBeVisible();
		await expect(page.locator('text=Add at least one product')).toBeVisible();
	});

	test('should handle currency conversion', async ({ page }) => {
		// Mock exchange rate API
		await page.route('**/api/currency/exchange-rate', async (route) => {
			await route.fulfill({
				status: 200,
				contentType: 'application/json',
				body: JSON.stringify({
					rate: 1.2,
					date: '2024-01-01',
					source: 'test'
				})
			});
		});

		// Click create invoice button
		await page.click('button:has-text("Create Invoice")');

		// Select customer
		await page.click('[data-testid="customer-select"]');
		await page.click('text=Test Customer');

		// Set due date
		await page.fill('[data-testid="due-date-input"]', '2024-02-01');

		// Set payment method
		await page.click('[data-testid="payment-method-select"]');
		await page.click('text=Bank Transfer');

		// Change base currency to EUR
		await page.click('[data-testid="base-currency-select"]');
		await page.click('text=EUR');

		// Add product with USD price
		await page.click('[data-testid="product-table-select"]');
		await page.click('text=products');

		await page.click('[data-testid="product-select"]');
		await page.click('text=Test Product');

		await page.fill('[data-testid="quantity-input"]', '1');
		await page.click('button:has-text("Add Product")');

		// Verify currency conversion
		await expect(page.locator('[data-testid="conversion-info"]')).toContainText('USD → EUR');
		await expect(page.locator('[data-testid="conversion-info"]')).toContainText('Rate: 1.2000');
	});

	test('should edit existing invoice', async ({ page }) => {
		// Mock existing invoice data
		await page.route('**/api/tenants/1/invoices/1', async (route) => {
			await route.fulfill({
				status: 200,
				contentType: 'application/json',
				body: JSON.stringify({
					invoice: {
						id: 1,
						invoice_number: 'INV-2024-000001',
						date: '2024-01-01',
						due_date: '2024-01-31',
						customer_id: 1,
						base_currency: 'USD',
						total_amount: 120,
						payment_terms: 'Net 30',
						payment_method: 'Bank Transfer',
						notes: 'Test invoice'
					},
					customer: {
						id: 1,
						customer_name: 'Test Customer',
						customer_email: 'test@example.com'
					},
					items: [
						{
							id: 1,
							product_ref_table: 'products',
							product_ref_id: 1,
							quantity: 1,
							price: 100,
							currency: 'USD',
							product_vat: 20,
							description: 'Test Product'
						}
					]
				})
			});
		});

		// Navigate to edit mode
		await page.goto('/home/invoices?edit=1');

		// Wait for form to load with existing data
		await page.waitForSelector('[data-testid="invoice-form"]');

		// Verify form is pre-filled
		await expect(page.locator('[data-testid="customer-select"]')).toHaveValue('1');
		await expect(page.locator('[data-testid="due-date-input"]')).toHaveValue('2024-01-31');
		await expect(page.locator('[data-testid="payment-method-select"]')).toHaveValue('Bank Transfer');

		// Verify product is loaded
		await expect(page.locator('[data-testid="product-list"]')).toContainText('Test Product');

		// Update quantity
		await page.fill('[data-testid="quantity-input-1"]', '2');

		// Submit updated invoice
		await page.click('button:has-text("Update Invoice")');

		// Verify success message
		await expect(page.locator('[data-testid="success-message"]')).toContainText('Invoice updated successfully');
	});
});
