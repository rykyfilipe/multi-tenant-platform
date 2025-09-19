import { test, expect } from '@playwright/test'

test.describe('Widget Data Mapping Flow', () => {
  test.beforeEach(async ({ page }) => {
    // Login before each test
    await page.goto('/')
    await page.click('text=Sign In')
    await page.fill('input[name="email"]', 'test@example.com')
    await page.fill('input[name="password"]', 'password123')
    await page.click('button[type="submit"]')
    
    // Wait for successful login and navigate to dashboard
    await expect(page).toHaveURL(/.*\/(dashboard|home)/, { timeout: 10000 })
    
    // Navigate to dashboard page
    await page.click('text=Dashboard')
    await expect(page).toHaveURL(/.*\/dashboard/)
  })

  test('should create calendar widget with table data mapping', async ({ page }) => {
    // Mock API responses for table and column data
    await page.route('**/api/tables', async route => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify([
          { id: 1, name: 'events', databaseName: 'main' },
          { id: 2, name: 'tasks', databaseName: 'main' },
          { id: 3, name: 'users', databaseName: 'main' }
        ])
      })
    })

    await page.route('**/api/tables/1/columns', async route => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify([
          { id: 1, name: 'id', type: 'integer' },
          { id: 2, name: 'title', type: 'text' },
          { id: 3, name: 'date', type: 'date' },
          { id: 4, name: 'description', type: 'text' },
          { id: 5, name: 'location', type: 'text' }
        ])
      })
    })

    // Add a new calendar widget
    await page.click('[data-testid="add-widget-button"]')
    await page.click('text=Calendar')
    
    // Wait for widget editor to open
    await expect(page.locator('[data-testid="widget-editor"]')).toBeVisible()
    
    // Navigate to data tab
    await page.click('text=Data')
    
    // Configure data source
    await page.click('text=Configure Mapping')
    
    // Select events table
    await page.click('[data-testid="table-selector"]')
    await page.click('text=events (main)')
    
    // Load columns
    await page.click('text=Load Columns')
    await expect(page.locator('text=Loading columns...')).toBeVisible()
    
    // Map required fields
    await page.selectOption('[data-testid="dateColumn-mapping"]', 'date')
    await page.selectOption('[data-testid="titleColumn-mapping"]', 'title')
    
    // Save mapping
    await page.click('text=Save Mapping')
    
    // Save widget
    await page.click('text=Save Widget')
    
    // Verify widget is created and displays events
    await expect(page.locator('[data-testid="calendar-widget"]')).toBeVisible()
    await expect(page.locator('text=Calendar Widget')).toBeVisible()
  })

  test('should create tasks widget with table data mapping', async ({ page }) => {
    // Mock API responses
    await page.route('**/api/tables', async route => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify([
          { id: 2, name: 'tasks', databaseName: 'main' }
        ])
      })
    })

    await page.route('**/api/tables/2/columns', async route => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify([
          { id: 1, name: 'id', type: 'integer' },
          { id: 2, name: 'title', type: 'text' },
          { id: 3, name: 'status', type: 'text' },
          { id: 4, name: 'due_date', type: 'date' },
          { id: 5, name: 'priority', type: 'text' }
        ])
      })
    })

    // Add tasks widget
    await page.click('[data-testid="add-widget-button"]')
    await page.click('text=Tasks')
    
    // Configure data source
    await page.click('text=Data')
    await page.click('text=Configure Mapping')
    
    // Select tasks table
    await page.click('[data-testid="table-selector"]')
    await page.click('text=tasks (main)')
    
    // Load columns and map fields
    await page.click('text=Load Columns')
    await page.selectOption('[data-testid="titleColumn-mapping"]', 'title')
    await page.selectOption('[data-testid="statusColumn-mapping"]', 'status')
    await page.selectOption('[data-testid="dueDateColumn-mapping"]', 'due_date')
    
    // Save and verify
    await page.click('text=Save Mapping')
    await page.click('text=Save Widget')
    
    await expect(page.locator('[data-testid="tasks-widget"]')).toBeVisible()
    await expect(page.locator('text=Tasks Widget')).toBeVisible()
  })

  test('should create weather widget with API data source', async ({ page }) => {
    // Mock weather API
    await page.route('**/api/weather/**', async route => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          location: 'New York',
          temperature: 22,
          condition: 'Sunny',
          humidity: 65,
          windSpeed: 10
        })
      })
    })

    // Add weather widget
    await page.click('[data-testid="add-widget-button"]')
    await page.click('text=Weather')
    
    // Configure API data source
    await page.click('text=Data')
    await page.selectOption('[data-testid="data-source-type"]', 'api')
    
    // Configure API endpoint
    await page.fill('[data-testid="api-endpoint"]', 'https://api.weather.com/v1/current')
    await page.fill('[data-testid="api-key"]', 'test-api-key')
    
    // Save and verify
    await page.click('text=Save Widget')
    
    await expect(page.locator('[data-testid="weather-widget"]')).toBeVisible()
    await expect(page.locator('text=Weather Widget')).toBeVisible()
    await expect(page.locator('text=New York')).toBeVisible()
    await expect(page.locator('text=22°C')).toBeVisible()
  })

  test('should validate required fields before saving', async ({ page }) => {
    // Mock API responses
    await page.route('**/api/tables', async route => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify([
          { id: 1, name: 'events', databaseName: 'main' }
        ])
      })
    })

    await page.route('**/api/tables/1/columns', async route => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify([
          { id: 1, name: 'id', type: 'integer' },
          { id: 2, name: 'title', type: 'text' },
          { id: 3, name: 'date', type: 'date' }
        ])
      })
    })

    // Add calendar widget
    await page.click('[data-testid="add-widget-button"]')
    await page.click('text=Calendar')
    
    // Configure data source
    await page.click('text=Data')
    await page.click('text=Configure Mapping')
    
    // Select table but don't map all required fields
    await page.click('[data-testid="table-selector"]')
    await page.click('text=events (main)')
    await page.click('text=Load Columns')
    
    // Only map one required field
    await page.selectOption('[data-testid="dateColumn-mapping"]', 'date')
    // Don't map titleColumn
    
    // Try to save - should show validation error
    await page.click('text=Save Mapping')
    await expect(page.locator('text=Please complete all required field mappings')).toBeVisible()
    
    // Complete the mapping
    await page.selectOption('[data-testid="titleColumn-mapping"]', 'title')
    await page.click('text=Save Mapping')
    
    // Now should save successfully
    await page.click('text=Save Widget')
    await expect(page.locator('[data-testid="calendar-widget"]')).toBeVisible()
  })

  test('should handle API errors gracefully', async ({ page }) => {
    // Mock API error
    await page.route('**/api/tables', async route => {
      await route.fulfill({
        status: 500,
        contentType: 'application/json',
        body: JSON.stringify({ error: 'Internal server error' })
      })
    })

    // Add widget
    await page.click('[data-testid="add-widget-button"]')
    await page.click('text=Calendar')
    
    // Try to configure data source
    await page.click('text=Data')
    await page.click('text=Configure Mapping')
    
    // Should show error message
    await expect(page.locator('text=Error loading tables')).toBeVisible()
  })

  test('should support manual data entry for text widgets', async ({ page }) => {
    // Add text widget
    await page.click('[data-testid="add-widget-button"]')
    await page.click('text=Text')
    
    // Configure manual data source
    await page.click('text=Data')
    await page.selectOption('[data-testid="data-source-type"]', 'manual')
    
    // Enter text content
    await page.fill('[data-testid="text-content"]', 'This is a custom text widget with manual content.')
    
    // Save and verify
    await page.click('text=Save Widget')
    
    await expect(page.locator('[data-testid="text-widget"]')).toBeVisible()
    await expect(page.locator('text=This is a custom text widget with manual content.')).toBeVisible()
  })

  test('should update existing widget data mapping', async ({ page }) => {
    // Mock API responses
    await page.route('**/api/tables', async route => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify([
          { id: 1, name: 'events', databaseName: 'main' },
          { id: 2, name: 'tasks', databaseName: 'main' }
        ])
      })
    })

    await page.route('**/api/tables/*/columns', async route => {
      const tableId = route.request().url().split('/').pop()
      const columns = tableId === '1' ? [
        { id: 1, name: 'id', type: 'integer' },
        { id: 2, name: 'title', type: 'text' },
        { id: 3, name: 'date', type: 'date' }
      ] : [
        { id: 1, name: 'id', type: 'integer' },
        { id: 2, name: 'task_name', type: 'text' },
        { id: 3, name: 'due_date', type: 'date' }
      ]
      
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify(columns)
      })
    })

    // Create initial calendar widget
    await page.click('[data-testid="add-widget-button"]')
    await page.click('text=Calendar')
    
    await page.click('text=Data')
    await page.click('text=Configure Mapping')
    
    await page.click('[data-testid="table-selector"]')
    await page.click('text=events (main)')
    await page.click('text=Load Columns')
    
    await page.selectOption('[data-testid="dateColumn-mapping"]', 'date')
    await page.selectOption('[data-testid="titleColumn-mapping"]', 'title')
    await page.click('text=Save Mapping')
    await page.click('text=Save Widget')
    
    // Edit the widget
    await page.click('[data-testid="calendar-widget"] [data-testid="edit-widget-button"]')
    await page.click('text=Data')
    await page.click('text=Configure Mapping')
    
    // Change to tasks table
    await page.click('[data-testid="table-selector"]')
    await page.click('text=tasks (main)')
    await page.click('text=Load Columns')
    
    // Update mappings
    await page.selectOption('[data-testid="dateColumn-mapping"]', 'due_date')
    await page.selectOption('[data-testid="titleColumn-mapping"]', 'task_name')
    await page.click('text=Save Mapping')
    await page.click('text=Save Widget')
    
    // Verify widget updated
    await expect(page.locator('[data-testid="calendar-widget"]')).toBeVisible()
  })
})
