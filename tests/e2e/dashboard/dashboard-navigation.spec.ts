import { test, expect } from '@playwright/test'

test.describe('Dashboard Navigation', () => {
  test.beforeEach(async ({ page }) => {
    // Login before each test
    await page.goto('/')
    await page.click('text=Sign In')
    await page.fill('input[name="email"]', 'test@example.com')
    await page.fill('input[name="password"]', 'password123')
    await page.click('button[type="submit"]')
    
    // Wait for successful login
    await expect(page).toHaveURL(/.*\/(dashboard|home)/, { timeout: 10000 })
  })

  test('should display main navigation menu', async ({ page }) => {
    // Check for main navigation elements
    await expect(page.locator('nav')).toBeVisible()
    await expect(page.locator('text=Dashboard')).toBeVisible()
    await expect(page.locator('text=Database')).toBeVisible()
    await expect(page.locator('text=Analytics')).toBeVisible()
    await expect(page.locator('text=Settings')).toBeVisible()
  })

  test('should navigate to dashboard page', async ({ page }) => {
    await page.click('text=Dashboard')
    await expect(page).toHaveURL(/.*\/dashboard/)
    
    // Check for dashboard content
    await expect(page.locator('text=Welcome to your dashboard')).toBeVisible()
  })

  test('should navigate to database management page', async ({ page }) => {
    await page.click('text=Database')
    await expect(page).toHaveURL(/.*\/database/)
    
    // Check for database content
    await expect(page.locator('text=Database Management')).toBeVisible()
  })

  test('should navigate to analytics page', async ({ page }) => {
    await page.click('text=Analytics')
    await expect(page).toHaveURL(/.*\/analytics/)
    
    // Check for analytics content
    await expect(page.locator('text=Analytics Dashboard')).toBeVisible()
  })

  test('should navigate to settings page', async ({ page }) => {
    await page.click('text=Settings')
    await expect(page).toHaveURL(/.*\/settings/)
    
    // Check for settings content
    await expect(page.locator('text=Settings')).toBeVisible()
  })

  test('should display user profile menu', async ({ page }) => {
    // Click on user profile/avatar
    await page.click('[data-testid="user-menu"]')
    
    // Check for profile menu items
    await expect(page.locator('text=Profile')).toBeVisible()
    await expect(page.locator('text=Settings')).toBeVisible()
    await expect(page.locator('text=Sign Out')).toBeVisible()
  })

  test('should navigate to user profile', async ({ page }) => {
    await page.click('[data-testid="user-menu"]')
    await page.click('text=Profile')
    
    await expect(page).toHaveURL(/.*\/profile/)
    await expect(page.locator('text=User Profile')).toBeVisible()
  })

  test('should logout successfully', async ({ page }) => {
    await page.click('[data-testid="user-menu"]')
    await page.click('text=Sign Out')
    
    // Should redirect to login page
    await expect(page).toHaveURL(/.*\/(login|$)/)
    await expect(page.locator('text=Sign In')).toBeVisible()
  })

  test('should show active navigation state', async ({ page }) => {
    // Navigate to dashboard
    await page.click('text=Dashboard')
    await expect(page.locator('text=Dashboard').locator('..')).toHaveClass(/active/)
    
    // Navigate to database
    await page.click('text=Database')
    await expect(page.locator('text=Database').locator('..')).toHaveClass(/active/)
    await expect(page.locator('text=Dashboard').locator('..')).not.toHaveClass(/active/)
  })

  test('should handle mobile navigation menu', async ({ page }) => {
    // Set mobile viewport
    await page.setViewportSize({ width: 375, height: 667 })
    
    // Check for mobile menu button
    const mobileMenuButton = page.locator('[data-testid="mobile-menu-button"]')
    if (await mobileMenuButton.isVisible()) {
      await mobileMenuButton.click()
      
      // Check for mobile menu items
      await expect(page.locator('text=Dashboard')).toBeVisible()
      await expect(page.locator('text=Database')).toBeVisible()
      await expect(page.locator('text=Analytics')).toBeVisible()
      await expect(page.locator('text=Settings')).toBeVisible()
    }
  })

  test('should display breadcrumbs for nested pages', async ({ page }) => {
    // Navigate to a nested page
    await page.click('text=Database')
    await page.click('text=Tables')
    
    // Check for breadcrumbs
    const breadcrumbs = page.locator('[data-testid="breadcrumbs"]')
    if (await breadcrumbs.isVisible()) {
      await expect(breadcrumbs).toContainText('Database')
      await expect(breadcrumbs).toContainText('Tables')
    }
  })

  test('should handle keyboard navigation', async ({ page }) => {
    // Test Tab navigation
    await page.keyboard.press('Tab')
    await page.keyboard.press('Tab')
    await page.keyboard.press('Tab')
    
    // Check if focus is visible
    const focusedElement = page.locator(':focus')
    await expect(focusedElement).toBeVisible()
  })

  test('should display notifications', async ({ page }) => {
    // Check for notification bell or indicator
    const notificationButton = page.locator('[data-testid="notifications"]')
    if (await notificationButton.isVisible()) {
      await notificationButton.click()
      
      // Check for notifications panel
      await expect(page.locator('[data-testid="notifications-panel"]')).toBeVisible()
    }
  })

  test('should handle search functionality', async ({ page }) => {
    // Check for search input
    const searchInput = page.locator('[data-testid="search-input"]')
    if (await searchInput.isVisible()) {
      await searchInput.fill('test search')
      await page.keyboard.press('Enter')
      
      // Should navigate to search results or show search suggestions
      await expect(page.locator('[data-testid="search-results"]')).toBeVisible()
    }
  })

  test('should display tenant information', async ({ page }) => {
    // Check for tenant name or info
    const tenantInfo = page.locator('[data-testid="tenant-info"]')
    if (await tenantInfo.isVisible()) {
      await expect(tenantInfo).toContainText('Test Tenant')
    }
  })

  test('should handle theme switching', async ({ page }) => {
    // Check for theme toggle
    const themeToggle = page.locator('[data-testid="theme-toggle"]')
    if (await themeToggle.isVisible()) {
      await themeToggle.click()
      
      // Check if theme changed (dark/light mode)
      const body = page.locator('body')
      const hasDarkClass = await body.evaluate(el => el.classList.contains('dark'))
      expect(hasDarkClass).toBeTruthy()
    }
  })

  test('should display language selector', async ({ page }) => {
    // Check for language selector
    const languageSelector = page.locator('[data-testid="language-selector"]')
    if (await languageSelector.isVisible()) {
      await languageSelector.click()
      
      // Check for language options
      await expect(page.locator('text=English')).toBeVisible()
      await expect(page.locator('text=Spanish')).toBeVisible()
      await expect(page.locator('text=French')).toBeVisible()
    }
  })

  test('should handle responsive navigation', async ({ page }) => {
    // Test different viewport sizes
    const viewports = [
      { width: 320, height: 568 }, // Mobile
      { width: 768, height: 1024 }, // Tablet
      { width: 1024, height: 768 }, // Desktop
      { width: 1920, height: 1080 }, // Large desktop
    ]

    for (const viewport of viewports) {
      await page.setViewportSize(viewport)
      
      // Navigation should be visible and functional
      await expect(page.locator('nav')).toBeVisible()
      
      // Test navigation functionality
      await page.click('text=Dashboard')
      await expect(page).toHaveURL(/.*\/dashboard/)
    }
  })

  test('should handle navigation with browser back/forward', async ({ page }) => {
    // Navigate to different pages
    await page.click('text=Dashboard')
    await expect(page).toHaveURL(/.*\/dashboard/)
    
    await page.click('text=Database')
    await expect(page).toHaveURL(/.*\/database/)
    
    await page.click('text=Analytics')
    await expect(page).toHaveURL(/.*\/analytics/)
    
    // Use browser back button
    await page.goBack()
    await expect(page).toHaveURL(/.*\/database/)
    
    await page.goBack()
    await expect(page).toHaveURL(/.*\/dashboard/)
    
    // Use browser forward button
    await page.goForward()
    await expect(page).toHaveURL(/.*\/database/)
  })

  test('should handle navigation errors gracefully', async ({ page }) => {
    // Mock navigation error
    await page.route('**/api/dashboard', route => route.abort())
    
    await page.click('text=Dashboard')
    
    // Should show error message or fallback
    await expect(page.locator('text=Error loading dashboard') || page.locator('text=Something went wrong')).toBeVisible()
  })

  test('should maintain navigation state during page refresh', async ({ page }) => {
    await page.click('text=Database')
    await expect(page).toHaveURL(/.*\/database/)
    
    // Refresh page
    await page.reload()
    
    // Should still be on database page
    await expect(page).toHaveURL(/.*\/database/)
    await expect(page.locator('text=Database').locator('..')).toHaveClass(/active/)
  })
})
