/**
 * E2E Tests: Complete Invoice Workflow
 * 
 * These tests verify the complete user workflow for invoice creation,
 * from UI interaction to PDF generation.
 */

import { test, expect } from '@playwright/test';

test.describe('Invoice Workflow E2E Tests', () => {
  test.beforeEach(async ({ page }) => {
    // Navigate to the application
    await page.goto('/');
    
    // Login (assuming you have a login flow)
    await page.fill('[data-testid="email"]', 'test@example.com');
    await page.fill('[data-testid="password"]', 'password');
    await page.click('[data-testid="login-button"]');
    
    // Wait for dashboard to load
    await page.waitForSelector('[data-testid="dashboard"]');
  });

  test('should create invoice through complete workflow', async ({ page }) => {
    // Navigate to invoices page
    await page.click('[data-testid="invoices-nav"]');
    await page.waitForSelector('[data-testid="invoices-list"]');

    // Click create invoice button
    await page.click('[data-testid="create-invoice-button"]');
    await page.waitForSelector('[data-testid="invoice-form"]');

    // Fill customer information
    await page.selectOption('[data-testid="customer-select"]', '1');
    
    // Add product items
    await page.click('[data-testid="add-product-button"]');
    
    // Fill first product
    await page.selectOption('[data-testid="product-select-0"]', '1');
    await page.fill('[data-testid="quantity-input-0"]', '2');
    await page.fill('[data-testid="price-input-0"]', '100.50');
    
    // Add second product
    await page.click('[data-testid="add-product-button"]');
    await page.selectOption('[data-testid="product-select-1"]', '2');
    await page.fill('[data-testid="quantity-input-1"]', '1');
    await page.fill('[data-testid="price-input-1"]', '250.00');

    // Verify calculations are updated
    await expect(page.locator('[data-testid="subtotal"]')).toContainText('451.00');
    await expect(page.locator('[data-testid="tax-total"]')).toContainText('85.69');
    await expect(page.locator('[data-testid="grand-total"]')).toContainText('536.69');

    // Fill additional information
    await page.fill('[data-testid="notes-textarea"]', 'Test invoice for E2E testing');
    await page.selectOption('[data-testid="payment-terms"]', 'net_30');
    await page.selectOption('[data-testid="payment-method"]', 'bank_transfer');

    // Save invoice
    await page.click('[data-testid="save-invoice-button"]');
    
    // Wait for success message
    await expect(page.locator('[data-testid="success-message"]')).toBeVisible();
    await expect(page.locator('[data-testid="success-message"]')).toContainText('Invoice created successfully');

    // Verify invoice appears in list
    await page.waitForSelector('[data-testid="invoices-list"]');
    await expect(page.locator('[data-testid="invoice-row"]').first()).toContainText('INV-2025-');
  });

  test('should preview invoice before saving', async ({ page }) => {
    // Navigate to invoices and start creating
    await page.click('[data-testid="invoices-nav"]');
    await page.click('[data-testid="create-invoice-button"]');
    await page.waitForSelector('[data-testid="invoice-form"]');

    // Fill basic information
    await page.selectOption('[data-testid="customer-select"]', '1');
    await page.click('[data-testid="add-product-button"]');
    await page.selectOption('[data-testid="product-select-0"]', '1');
    await page.fill('[data-testid="quantity-input-0"]', '1');
    await page.fill('[data-testid="price-input-0"]', '100.00');

    // Click preview button
    await page.click('[data-testid="preview-invoice-button"]');
    
    // Wait for preview modal/page
    await page.waitForSelector('[data-testid="invoice-preview"]');
    
    // Verify preview content
    await expect(page.locator('[data-testid="invoice-number"]')).toBeVisible();
    await expect(page.locator('[data-testid="customer-name"]')).toBeVisible();
    await expect(page.locator('[data-testid="product-name-0"]')).toContainText('Test Product');
    await expect(page.locator('[data-testid="line-total-0"]')).toContainText('100.00');
    await expect(page.locator('[data-testid="grand-total"]')).toContainText('119.00'); // Including 19% VAT

    // Close preview
    await page.click('[data-testid="close-preview-button"]');
  });

  test('should generate PDF from created invoice', async ({ page }) => {
    // First create an invoice (or assume one exists)
    await page.click('[data-testid="invoices-nav"]');
    await page.waitForSelector('[data-testid="invoices-list"]');

    // Click on first invoice
    await page.click('[data-testid="invoice-row"]:first-child');
    await page.waitForSelector('[data-testid="invoice-details"]');

    // Click generate PDF button
    const downloadPromise = page.waitForEvent('download');
    await page.click('[data-testid="generate-pdf-button"]');
    
    const download = await downloadPromise;
    expect(download.suggestedFilename()).toMatch(/invoice.*\.pdf$/i);
    
    // Verify download started
    expect(download).toBeTruthy();
  });

  test('should handle validation errors gracefully', async ({ page }) => {
    // Navigate to create invoice
    await page.click('[data-testid="invoices-nav"]');
    await page.click('[data-testid="create-invoice-button"]');
    await page.waitForSelector('[data-testid="invoice-form"]');

    // Try to save without required fields
    await page.click('[data-testid="save-invoice-button"]');

    // Verify validation errors appear
    await expect(page.locator('[data-testid="customer-error"]')).toContainText('Customer is required');
    await expect(page.locator('[data-testid="products-error"]')).toContainText('At least one product is required');

    // Fill invalid data
    await page.selectOption('[data-testid="customer-select"]', '1');
    await page.click('[data-testid="add-product-button"]');
    await page.selectOption('[data-testid="product-select-0"]', '1');
    await page.fill('[data-testid="quantity-input-0"]', '-1'); // Invalid negative quantity
    await page.fill('[data-testid="price-input-0"]', 'abc'); // Invalid price

    await page.click('[data-testid="save-invoice-button"]');

    // Verify field-specific errors
    await expect(page.locator('[data-testid="quantity-error-0"]')).toContainText('Quantity must be positive');
    await expect(page.locator('[data-testid="price-error-0"]')).toContainText('Price must be a valid number');
  });

  test('should edit existing invoice', async ({ page }) => {
    // Navigate to invoices list
    await page.click('[data-testid="invoices-nav"]');
    await page.waitForSelector('[data-testid="invoices-list"]');

    // Click edit on first invoice
    await page.click('[data-testid="edit-invoice-button"]:first-child');
    await page.waitForSelector('[data-testid="invoice-form"]');

    // Modify invoice
    await page.fill('[data-testid="quantity-input-0"]', '3');
    
    // Save changes
    await page.click('[data-testid="save-invoice-button"]');
    
    // Verify success
    await expect(page.locator('[data-testid="success-message"]')).toContainText('Invoice updated successfully');

    // Verify changes persisted
    await page.waitForSelector('[data-testid="invoices-list"]');
    await page.click('[data-testid="invoice-row"]:first-child');
    await page.waitForSelector('[data-testid="invoice-details"]');
    await expect(page.locator('[data-testid="quantity-display-0"]')).toContainText('3');
  });

  test('should delete invoice with confirmation', async ({ page }) => {
    // Navigate to invoices list
    await page.click('[data-testid="invoices-nav"]');
    await page.waitForSelector('[data-testid="invoices-list"]');

    // Count invoices before deletion
    const invoiceCountBefore = await page.locator('[data-testid="invoice-row"]').count();

    // Click delete on first invoice
    await page.click('[data-testid="delete-invoice-button"]:first-child');
    
    // Confirm deletion in modal
    await page.waitForSelector('[data-testid="confirm-delete-modal"]');
    await page.click('[data-testid="confirm-delete-button"]');

    // Verify success message
    await expect(page.locator('[data-testid="success-message"]')).toContainText('Invoice deleted successfully');

    // Verify invoice count decreased
    const invoiceCountAfter = await page.locator('[data-testid="invoice-row"]').count();
    expect(invoiceCountAfter).toBe(invoiceCountBefore - 1);
  });

  test('should handle large invoice with many items', async ({ page }) => {
    // Navigate to create invoice
    await page.click('[data-testid="invoices-nav"]');
    await page.click('[data-testid="create-invoice-button"]');
    await page.waitForSelector('[data-testid="invoice-form"]');

    // Fill basic info
    await page.selectOption('[data-testid="customer-select"]', '1');

    // Add many products (test performance)
    for (let i = 0; i < 20; i++) {
      await page.click('[data-testid="add-product-button"]');
      await page.selectOption(`[data-testid="product-select-${i}"]`, '1');
      await page.fill(`[data-testid="quantity-input-${i}"]`, '1');
      await page.fill(`[data-testid="price-input-${i}"]`, '10.00');
    }

    // Verify calculations still work
    await expect(page.locator('[data-testid="subtotal"]')).toContainText('200.00');
    await expect(page.locator('[data-testid="grand-total"]')).toContainText('238.00');

    // Save invoice
    await page.click('[data-testid="save-invoice-button"]');
    
    // Verify success
    await expect(page.locator('[data-testid="success-message"]')).toBeVisible();
  });

  test('should handle network errors gracefully', async ({ page }) => {
    // Mock network failure
    await page.route('**/api/tenants/*/invoices', route => {
      route.abort('failed');
    });

    // Navigate to create invoice
    await page.click('[data-testid="invoices-nav"]');
    await page.click('[data-testid="create-invoice-button"]');
    await page.waitForSelector('[data-testid="invoice-form"]');

    // Fill form
    await page.selectOption('[data-testid="customer-select"]', '1');
    await page.click('[data-testid="add-product-button"]');
    await page.selectOption('[data-testid="product-select-0"]', '1');
    await page.fill('[data-testid="quantity-input-0"]', '1');
    await page.fill('[data-testid="price-input-0"]', '100.00');

    // Try to save
    await page.click('[data-testid="save-invoice-button"]');

    // Verify error handling
    await expect(page.locator('[data-testid="error-message"]')).toContainText('Failed to create invoice');
    await expect(page.locator('[data-testid="retry-button"]')).toBeVisible();
  });
});
