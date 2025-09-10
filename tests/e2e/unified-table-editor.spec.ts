import { test, expect } from "@playwright/test";

test.describe("Unified Table Editor", () => {
	test.beforeEach(async ({ page }) => {
		// Navigate to the unified table editor
		await page.goto("/home/database/table/1/edit");
		await page.waitForLoadState("networkidle");
	});

	test("should display unified table editor interface", async ({ page }) => {
		// Check that the unified table editor is loaded
		await expect(page.locator(".unified-table-header")).toBeVisible();
		await expect(page.locator(".column-header")).toBeVisible();
		await expect(page.locator(".data-grid")).toBeVisible();
	});

	test("should add new column with enhanced properties", async ({ page }) => {
		// Click add column button
		await page.click(".add-column-button");
		await expect(page.locator(".add-column-form")).toBeVisible();

		// Fill column form with enhanced properties
		await page.fill('input[name="name"]', "Test Column");
		await page.selectOption('select[name="type"]', "string");
		await page.fill('textarea[name="description"]', "Test description");
		await page.check('input[name="unique"]');
		await page.fill('input[name="defaultValue"]', "default value");

		// Submit form
		await page.click('button[type="submit"]');

		// Verify column was added
		await expect(page.locator(".column-header")).toContainText("Test Column");
	});

	test("should edit column properties", async ({ page }) => {
		// Click edit button on first column
		await page.click(".edit-column-button:first-of-type");
		await expect(page.locator(".column-properties-sidebar")).toBeVisible();

		// Update column properties
		await page.fill('input[name="name"]', "Updated Column");
		await page.fill('textarea[name="description"]', "Updated description");
		await page.check('input[name="unique"]');
		await page.fill('input[name="defaultValue"]', "updated default");

		// Save changes
		await page.click('button[type="submit"]');

		// Verify changes were applied
		await expect(page.locator(".column-header")).toContainText("Updated Column");
	});

	test("should delete column", async ({ page }) => {
		// Click delete button on first column
		await page.click(".delete-column-button:first-of-type");

		// Confirm deletion
		await page.click("button:has-text('Confirm')");

		// Verify column was removed
		await expect(page.locator(".column-header")).toHaveCount(0);
	});

	test("should handle unique constraint validation", async ({ page }) => {
		// Add a unique column
		await page.click(".add-column-button");
		await page.fill('input[name="name"]', "Unique Column");
		await page.selectOption('select[name="type"]', "string");
		await page.check('input[name="unique"]');
		await page.click('button[type="submit"]');

		// Try to add duplicate value
		await page.click(".add-row-button");
		await page.fill('input[data-column="Unique Column"]', "duplicate");
		await page.click('button:has-text("Save")');

		// Try to add same value again
		await page.click(".add-row-button");
		await page.fill('input[data-column="Unique Column"]', "duplicate");
		await page.click('button:has-text("Save")');

		// Should show unique constraint error
		await expect(page.locator(".error-message")).toContainText("already exists");
	});

	test("should apply default values when creating rows", async ({ page }) => {
		// Add column with default value
		await page.click(".add-column-button");
		await page.fill('input[name="name"]', "Default Column");
		await page.selectOption('select[name="type"]', "string");
		await page.fill('input[name="defaultValue"]', "default value");
		await page.click('button[type="submit"]');

		// Add new row without providing value for default column
		await page.click(".add-row-button");
		await page.click('button:has-text("Save")');

		// Verify default value was applied
		await expect(page.locator('input[data-column="Default Column"]')).toHaveValue("default value");
	});

	test("should edit cell values", async ({ page }) => {
		// Click on a cell to edit
		await page.click(".editable-cell:first-of-type");

		// Type new value
		await page.fill(".editable-cell input", "New Value");

		// Save changes
		await page.press(".editable-cell input", "Enter");

		// Verify value was updated
		await expect(page.locator(".editable-cell:first-of-type")).toContainText("New Value");
	});

	test("should handle bulk row operations", async ({ page }) => {
		// Select multiple rows
		await page.check(".row-checkbox:first-of-type");
		await page.check(".row-checkbox:nth-of-type(2)");

		// Delete selected rows
		await page.click(".bulk-delete-button");
		await page.click("button:has-text('Confirm')");

		// Verify rows were deleted
		await expect(page.locator(".row-checkbox")).toHaveCount(0);
	});

	test("should handle CSV import/export", async ({ page }) => {
		// Test CSV export
		await page.click(".export-csv-button");
		
		// Wait for download to start
		const downloadPromise = page.waitForEvent("download");
		await downloadPromise;

		// Test CSV import
		await page.click(".import-csv-button");
		
		// Upload CSV file
		const fileInput = page.locator('input[type="file"]');
		await fileInput.setInputFiles("tests/fixtures/sample-data.csv");

		// Confirm import
		await page.click("button:has-text('Import')");

		// Verify data was imported
		await expect(page.locator(".data-grid")).toContainText("Imported Data");
	});

	test("should handle table filters", async ({ page }) => {
		// Open filters
		await page.click(".filters-button");
		await expect(page.locator(".filters-panel")).toBeVisible();

		// Add filter
		await page.selectOption('select[name="column"]', "Name");
		await page.selectOption('select[name="operator"]', "contains");
		await page.fill('input[name="value"]', "test");

		// Apply filter
		await page.click("button:has-text('Apply Filter')");

		// Verify filter was applied
		await expect(page.locator(".data-grid")).toContainText("test");
	});

	test("should handle column reordering", async ({ page }) => {
		// Drag and drop column to reorder
		const sourceColumn = page.locator(".column-header:first-of-type");
		const targetColumn = page.locator(".column-header:last-of-type");

		await sourceColumn.dragTo(targetColumn);

		// Verify columns were reordered
		await expect(page.locator(".column-header:first-of-type")).toContainText("Email");
	});

	test("should handle responsive design", async ({ page }) => {
		// Test mobile view
		await page.setViewportSize({ width: 375, height: 667 });

		// Check that mobile layout is applied
		await expect(page.locator(".unified-table-header")).toBeVisible();
		await expect(page.locator(".column-header")).toBeVisible();

		// Test tablet view
		await page.setViewportSize({ width: 768, height: 1024 });

		// Check that tablet layout is applied
		await expect(page.locator(".unified-table-header")).toBeVisible();
		await expect(page.locator(".data-grid")).toBeVisible();
	});

	test("should handle error states gracefully", async ({ page }) => {
		// Simulate network error
		await page.route("**/api/**", route => route.abort());

		// Try to add column
		await page.click(".add-column-button");
		await page.fill('input[name="name"]', "Error Column");
		await page.click('button[type="submit"]');

		// Should show error message
		await expect(page.locator(".error-message")).toBeVisible();
	});

	test("should maintain state during navigation", async ({ page }) => {
		// Make some changes
		await page.click(".add-column-button");
		await page.fill('input[name="name"]', "Persistent Column");
		await page.click('button[type="submit"]');

		// Navigate away and back
		await page.goto("/home/database");
		await page.goto("/home/database/table/1/edit");

		// Verify changes are still there
		await expect(page.locator(".column-header")).toContainText("Persistent Column");
	});
});
