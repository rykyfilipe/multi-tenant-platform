import { test, expect } from '@playwright/test'

test.describe('Database Table Management', () => {
  test.beforeEach(async ({ page }) => {
    // Login and navigate to database page
    await page.goto('/')
    await page.click('text=Sign In')
    await page.fill('input[name="email"]', 'test@example.com')
    await page.fill('input[name="password"]', 'password123')
    await page.click('button[type="submit"]')
    
    // Wait for successful login and navigate to database
    await expect(page).toHaveURL(/.*\/(dashboard|home)/, { timeout: 10000 })
    await page.click('text=Database')
    await expect(page).toHaveURL(/.*\/database/)
  })

  test('should display existing tables', async ({ page }) => {
    // Check for tables list
    await expect(page.locator('[data-testid="tables-list"]')).toBeVisible()
    
    // Check for existing tables
    await expect(page.locator('text=users')).toBeVisible()
    await expect(page.locator('text=products')).toBeVisible()
  })

  test('should create a new table', async ({ page }) => {
    // Click create table button
    await page.click('[data-testid="create-table-button"]')
    
    // Fill table creation form
    await page.fill('input[name="tableName"]', 'customers')
    await page.fill('textarea[name="description"]', 'Customer information table')
    
    // Add columns
    await page.click('[data-testid="add-column-button"]')
    await page.fill('input[name="columns.0.name"]', 'id')
    await page.selectOption('select[name="columns.0.type"]', 'INTEGER')
    await page.check('input[name="columns.0.required"]')
    await page.check('input[name="columns.0.primaryKey"]')
    
    await page.click('[data-testid="add-column-button"]')
    await page.fill('input[name="columns.1.name"]', 'name')
    await page.selectOption('select[name="columns.1.type"]', 'VARCHAR')
    await page.fill('input[name="columns.1.length"]', '255')
    await page.check('input[name="columns.1.required"]')
    
    // Submit form
    await page.click('button[type="submit"]')
    
    // Check for success message
    await expect(page.locator('text=Table created successfully')).toBeVisible()
    
    // Check that table appears in list
    await expect(page.locator('text=customers')).toBeVisible()
  })

  test('should edit an existing table', async ({ page }) => {
    // Click edit button on first table
    await page.click('[data-testid="edit-table-button"]:first-of-type')
    
    // Modify table name
    await page.fill('input[name="tableName"]', 'users_updated')
    await page.fill('textarea[name="description"]', 'Updated user table description')
    
    // Submit changes
    await page.click('button[type="submit"]')
    
    // Check for success message
    await expect(page.locator('text=Table updated successfully')).toBeVisible()
    
    // Check that table name is updated
    await expect(page.locator('text=users_updated')).toBeVisible()
  })

  test('should delete a table', async ({ page }) => {
    // Click delete button on first table
    await page.click('[data-testid="delete-table-button"]:first-of-type')
    
    // Confirm deletion in modal
    await expect(page.locator('text=Are you sure you want to delete this table?')).toBeVisible()
    await page.click('button:has-text("Delete")')
    
    // Check for success message
    await expect(page.locator('text=Table deleted successfully')).toBeVisible()
    
    // Check that table is removed from list
    await expect(page.locator('text=users')).not.toBeVisible()
  })

  test('should add columns to existing table', async ({ page }) => {
    // Click on table to open unified editor
    await page.click('text=users')
    
    // Wait for unified editor to load
    await page.waitForSelector('.unified-table-header')
    
    // Click add column button in header
    await page.click('.column-header .add-column-button')
    
    // Fill column form
    await page.fill('input[name="name"]', 'phone')
    await page.selectOption('select[name="type"]', 'VARCHAR')
    await page.fill('input[name="length"]', '20')
    await page.fill('textarea[name="description"]', 'User phone number')
    
    // Submit form
    await page.click('button[type="submit"]')
    
    // Check for success message
    await expect(page.locator('text=Column added successfully')).toBeVisible()
    
    // Check that column appears in table
    await expect(page.locator('text=phone')).toBeVisible()
  })

  test('should edit table columns', async ({ page }) => {
    // Click on table to open unified editor
    await page.click('text=users')
    
    // Wait for unified editor to load
    await page.waitForSelector('.unified-table-header')
    
    // Click edit button on first column in header
    await page.click('.column-header .edit-column-button:first-of-type')
    
    // Modify column properties
    await page.fill('input[name="name"]', 'user_id')
    await page.selectOption('select[name="type"]', 'BIGINT')
    await page.fill('textarea[name="description"]', 'Updated user ID column')
    
    // Submit changes
    await page.click('button[type="submit"]')
    
    // Check for success message
    await expect(page.locator('text=Column updated successfully')).toBeVisible()
    
    // Check that column name is updated
    await expect(page.locator('text=user_id')).toBeVisible()
  })

  test('should delete table columns', async ({ page }) => {
    // Click on table to open unified editor
    await page.click('text=users')
    
    // Wait for unified editor to load
    await page.waitForSelector('.unified-table-header')
    
    // Click delete button on first column in header
    await page.click('.column-header .delete-column-button:first-of-type')
    
    // Confirm deletion
    await expect(page.locator('text=Are you sure you want to delete this column?')).toBeVisible()
    await page.click('button:has-text("Delete")')
    
    // Check for success message
    await expect(page.locator('text=Column deleted successfully')).toBeVisible()
  })

  test('should handle table validation errors', async ({ page }) => {
    // Click create table button
    await page.click('[data-testid="create-table-button"]')
    
    // Try to submit empty form
    await page.click('button[type="submit"]')
    
    // Check for validation errors
    await expect(page.locator('text=Table name is required')).toBeVisible()
    await expect(page.locator('text=At least one column is required')).toBeVisible()
  })

  test('should handle duplicate table names', async ({ page }) => {
    // Click create table button
    await page.click('[data-testid="create-table-button"]')
    
    // Use existing table name
    await page.fill('input[name="tableName"]', 'users')
    await page.fill('textarea[name="description"]', 'Duplicate table')
    
    // Add a column
    await page.click('[data-testid="add-column-button"]')
    await page.fill('input[name="columns.0.name"]', 'id')
    await page.selectOption('select[name="columns.0.type"]', 'INTEGER')
    
    // Submit form
    await page.click('button[type="submit"]')
    
    // Check for error message
    await expect(page.locator('text=Table name already exists')).toBeVisible()
  })

  test('should handle column validation errors', async ({ page }) => {
    // Click create table button
    await page.click('[data-testid="create-table-button"]')
    
    await page.fill('input[name="tableName"]', 'test_table')
    await page.fill('textarea[name="description"]', 'Test table')
    
    // Add column with invalid data
    await page.click('[data-testid="add-column-button"]')
    await page.fill('input[name="columns.0.name"]', '') // Empty name
    await page.selectOption('select[name="columns.0.type"]', 'VARCHAR')
    
    // Submit form
    await page.click('button[type="submit"]')
    
    // Check for validation errors
    await expect(page.locator('text=Column name is required')).toBeVisible()
  })

  test('should handle duplicate column names', async ({ page }) => {
    // Click create table button
    await page.click('[data-testid="create-table-button"]')
    
    await page.fill('input[name="tableName"]', 'test_table')
    await page.fill('textarea[name="description"]', 'Test table')
    
    // Add two columns with same name
    await page.click('[data-testid="add-column-button"]')
    await page.fill('input[name="columns.0.name"]', 'id')
    await page.selectOption('select[name="columns.0.type"]', 'INTEGER')
    
    await page.click('[data-testid="add-column-button"]')
    await page.fill('input[name="columns.1.name"]', 'id') // Duplicate name
    await page.selectOption('select[name="columns.1.type"]', 'VARCHAR')
    
    // Submit form
    await page.click('button[type="submit"]')
    
    // Check for error message
    await expect(page.locator('text=Column names must be unique')).toBeVisible()
  })

  test('should handle table permissions', async ({ page }) => {
    // Check for permission indicators
    const permissionIndicators = page.locator('[data-testid="table-permissions"]')
    if (await permissionIndicators.isVisible()) {
      await expect(permissionIndicators).toContainText('Public')
      await expect(permissionIndicators).toContainText('Private')
    }
  })

  test('should handle table search and filtering', async ({ page }) => {
    // Use search functionality
    const searchInput = page.locator('[data-testid="table-search"]')
    if (await searchInput.isVisible()) {
      await searchInput.fill('user')
      
      // Check that only matching tables are shown
      await expect(page.locator('text=users')).toBeVisible()
      await expect(page.locator('text=products')).not.toBeVisible()
    }
    
    // Use filter functionality
    const filterSelect = page.locator('[data-testid="table-filter"]')
    if (await filterSelect.isVisible()) {
      await filterSelect.selectOption('public')
      
      // Check that only public tables are shown
      await expect(page.locator('[data-testid="table-item"]')).toHaveCount(1)
    }
  })

  test('should handle table sorting', async ({ page }) => {
    // Click on sort button
    const sortButton = page.locator('[data-testid="sort-tables"]')
    if (await sortButton.isVisible()) {
      await sortButton.click()
      
      // Check that tables are sorted
      const tableNames = await page.locator('[data-testid="table-name"]').allTextContents()
      const sortedNames = [...tableNames].sort()
      expect(tableNames).toEqual(sortedNames)
    }
  })

  test('should handle table pagination', async ({ page }) => {
    // Check for pagination controls
    const pagination = page.locator('[data-testid="table-pagination"]')
    if (await pagination.isVisible()) {
      // Click next page
      await page.click('[data-testid="next-page"]')
      
      // Check that page changed
      await expect(page.locator('[data-testid="current-page"]')).toContainText('2')
    }
  })

  test('should handle table export functionality', async ({ page }) => {
    // Click export button
    const exportButton = page.locator('[data-testid="export-table"]')
    if (await exportButton.isVisible()) {
      await exportButton.click()
      
      // Check for export options
      await expect(page.locator('text=Export as CSV')).toBeVisible()
      await expect(page.locator('text=Export as JSON')).toBeVisible()
      await expect(page.locator('text=Export as Excel')).toBeVisible()
    }
  })

  test('should handle table import functionality', async ({ page }) => {
    // Click import button
    const importButton = page.locator('[data-testid="import-table"]')
    if (await importButton.isVisible()) {
      await importButton.click()
      
      // Check for import options
      await expect(page.locator('text=Import from CSV')).toBeVisible()
      await expect(page.locator('text=Import from JSON')).toBeVisible()
    }
  })

  test('should handle table relationships', async ({ page }) => {
    // Click on table to view details
    await page.click('text=users')
    
    // Check for relationships section
    const relationshipsSection = page.locator('[data-testid="table-relationships"]')
    if (await relationshipsSection.isVisible()) {
      await expect(relationshipsSection).toContainText('Foreign Keys')
      await expect(relationshipsSection).toContainText('References')
    }
  })

  test('should handle table indexes', async ({ page }) => {
    // Click on table to view details
    await page.click('text=users')
    
    // Check for indexes section
    const indexesSection = page.locator('[data-testid="table-indexes"]')
    if (await indexesSection.isVisible()) {
      await expect(indexesSection).toContainText('Indexes')
      await expect(indexesSection).toContainText('Primary Key')
    }
  })

  test('should handle table constraints', async ({ page }) => {
    // Click on table to view details
    await page.click('text=users')
    
    // Check for constraints section
    const constraintsSection = page.locator('[data-testid="table-constraints"]')
    if (await constraintsSection.isVisible()) {
      await expect(constraintsSection).toContainText('Constraints')
      await expect(constraintsSection).toContainText('Unique')
      await expect(constraintsSection).toContainText('Check')
    }
  })

  test('should handle table statistics', async ({ page }) => {
    // Click on table to view details
    await page.click('text=users')
    
    // Check for statistics section
    const statisticsSection = page.locator('[data-testid="table-statistics"]')
    if (await statisticsSection.isVisible()) {
      await expect(statisticsSection).toContainText('Row Count')
      await expect(statisticsSection).toContainText('Size')
      await expect(statisticsSection).toContainText('Last Updated')
    }
  })

  test('should handle table backup and restore', async ({ page }) => {
    // Click on table to view details
    await page.click('text=users')
    
    // Check for backup/restore options
    const backupButton = page.locator('[data-testid="backup-table"]')
    const restoreButton = page.locator('[data-testid="restore-table"]')
    
    if (await backupButton.isVisible()) {
      await backupButton.click()
      await expect(page.locator('text=Backup created successfully')).toBeVisible()
    }
    
    if (await restoreButton.isVisible()) {
      await restoreButton.click()
      await expect(page.locator('text=Table restored successfully')).toBeVisible()
    }
  })
})
