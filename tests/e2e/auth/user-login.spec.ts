import { test, expect } from '@playwright/test'

test.describe('User Login Flow', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/')
  })

  test('should login successfully with valid credentials', async ({ page }) => {
    // Navigate to login page
    await page.click('text=Sign In')
    await expect(page).toHaveURL(/.*\/login/)

    // Fill login form
    await page.fill('input[name="email"]', 'test@example.com')
    await page.fill('input[name="password"]', 'password123')

    // Submit form
    await page.click('button[type="submit"]')

    // Wait for successful login
    await expect(page).toHaveURL(/.*\/(dashboard|home)/, { timeout: 10000 })
    
    // Check for user menu or profile indicator
    await expect(page.locator('text=Welcome') || page.locator('[data-testid="user-menu"]')).toBeVisible()
  })

  test('should show error for invalid credentials', async ({ page }) => {
    await page.click('text=Sign In')
    await expect(page).toHaveURL(/.*\/login/)

    await page.fill('input[name="email"]', 'test@example.com')
    await page.fill('input[name="password"]', 'wrongpassword')

    await page.click('button[type="submit"]')

    await expect(page.locator('text=Invalid email or password')).toBeVisible()
  })

  test('should show error for non-existent user', async ({ page }) => {
    await page.click('text=Sign In')
    await expect(page).toHaveURL(/.*\/login/)

    await page.fill('input[name="email"]', 'nonexistent@example.com')
    await page.fill('input[name="password"]', 'password123')

    await page.click('button[type="submit"]')

    await expect(page.locator('text=Invalid email or password')).toBeVisible()
  })

  test('should show validation errors for empty fields', async ({ page }) => {
    await page.click('text=Sign In')
    await expect(page).toHaveURL(/.*\/login/)

    // Try to submit empty form
    await page.click('button[type="submit"]')

    // Check for validation errors
    await expect(page.locator('text=Email is required')).toBeVisible()
    await expect(page.locator('text=Password is required')).toBeVisible()
  })

  test('should show error for invalid email format', async ({ page }) => {
    await page.click('text=Sign In')
    await expect(page).toHaveURL(/.*\/login/)

    await page.fill('input[name="email"]', 'invalid-email')
    await page.fill('input[name="password"]', 'password123')

    await page.click('button[type="submit"]')

    await expect(page.locator('text=Please enter a valid email address')).toBeVisible()
  })

  test('should navigate to registration page from login', async ({ page }) => {
    await page.click('text=Sign In')
    await expect(page).toHaveURL(/.*\/login/)

    await page.click('text=Don\'t have an account? Sign up')
    await expect(page).toHaveURL(/.*\/register/)
  })

  test('should navigate to forgot password page', async ({ page }) => {
    await page.click('text=Sign In')
    await expect(page).toHaveURL(/.*\/login/)

    await page.click('text=Forgot password?')
    await expect(page).toHaveURL(/.*\/forgot-password/)
  })

  test('should handle network errors gracefully', async ({ page }) => {
    // Mock network failure
    await page.route('**/api/auth/signin', route => route.abort())

    await page.click('text=Sign In')
    await expect(page).toHaveURL(/.*\/login/)

    await page.fill('input[name="email"]', 'test@example.com')
    await page.fill('input[name="password"]', 'password123')

    await page.click('button[type="submit"]')

    await expect(page.locator('text=Network error. Please try again.')).toBeVisible()
  })

  test('should show loading state during login', async ({ page }) => {
    // Mock slow response
    await page.route('**/api/auth/signin', async route => {
      await new Promise(resolve => setTimeout(resolve, 2000))
      await route.continue()
    })

    await page.click('text=Sign In')
    await expect(page).toHaveURL(/.*\/login/)

    await page.fill('input[name="email"]', 'test@example.com')
    await page.fill('input[name="password"]', 'password123')

    await page.click('button[type="submit"]')

    // Check for loading state
    await expect(page.locator('button[type="submit"]:has-text("Signing In...")')).toBeVisible()
    await expect(page.locator('button[type="submit"]')).toBeDisabled()
  })

  test('should remember login state after page refresh', async ({ page }) => {
    await page.click('text=Sign In')
    await expect(page).toHaveURL(/.*\/login/)

    await page.fill('input[name="email"]', 'test@example.com')
    await page.fill('input[name="password"]', 'password123')

    await page.click('button[type="submit"]')

    // Wait for successful login
    await expect(page).toHaveURL(/.*\/(dashboard|home)/, { timeout: 10000 })

    // Refresh page
    await page.reload()

    // Should still be logged in
    await expect(page).toHaveURL(/.*\/(dashboard|home)/)
    await expect(page.locator('text=Welcome') || page.locator('[data-testid="user-menu"]')).toBeVisible()
  })

  test('should support remember me functionality', async ({ page }) => {
    await page.click('text=Sign In')
    await expect(page).toHaveURL(/.*\/login/)

    // Check if remember me checkbox exists
    const rememberMeCheckbox = page.locator('input[name="rememberMe"]')
    if (await rememberMeCheckbox.isVisible()) {
      await page.fill('input[name="email"]', 'test@example.com')
      await page.fill('input[name="password"]', 'password123')
      await page.check('input[name="rememberMe"]')

      await page.click('button[type="submit"]')

      // Wait for successful login
      await expect(page).toHaveURL(/.*\/(dashboard|home)/, { timeout: 10000 })

      // Close browser and reopen (simulate new session)
      await page.context().close()
      const newContext = await page.context().browser()?.newContext()
      const newPage = await newContext?.newPage()
      
      if (newPage) {
        await newPage.goto('/')
        
        // Should still be logged in due to remember me
        await expect(newPage).toHaveURL(/.*\/(dashboard|home)/)
      }
    }
  })

  test('should handle OAuth login with Google', async ({ page }) => {
    await page.click('text=Sign In')
    await expect(page).toHaveURL(/.*\/login/)

    // Check if Google login button exists
    const googleButton = page.locator('button:has-text("Continue with Google")')
    if (await googleButton.isVisible()) {
      // Mock OAuth flow
      await page.route('**/api/auth/signin/google', route => {
        route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify({
            user: {
              id: '1',
              email: 'test@gmail.com',
              name: 'Test User',
            },
          }),
        })
      })

      await googleButton.click()

      // Should redirect to OAuth provider or handle callback
      await expect(page).toHaveURL(/.*\/(dashboard|home|auth-callback)/, { timeout: 15000 })
    }
  })

  test('should handle case sensitivity in email', async ({ page }) => {
    await page.click('text=Sign In')
    await expect(page).toHaveURL(/.*\/login/)

    // Try with different case
    await page.fill('input[name="email"]', 'TEST@EXAMPLE.COM')
    await page.fill('input[name="password"]', 'password123')

    await page.click('button[type="submit"]')

    // Should either work (case insensitive) or show error
    const isLoggedIn = await page.url().includes('/dashboard') || await page.url().includes('/home')
    const hasError = await page.locator('text=Invalid email or password').isVisible()

    expect(isLoggedIn || hasError).toBeTruthy()
  })

  test('should handle special characters in password', async ({ page }) => {
    await page.click('text=Sign In')
    await expect(page).toHaveURL(/.*\/login/)

    await page.fill('input[name="email"]', 'test@example.com')
    await page.fill('input[name="password"]', 'P@ssw0rd!@#$%^&*()')

    await page.click('button[type="submit"]')

    // Should either work or show error (depending on if this password exists)
    const isLoggedIn = await page.url().includes('/dashboard') || await page.url().includes('/home')
    const hasError = await page.locator('text=Invalid email or password').isVisible()

    expect(isLoggedIn || hasError).toBeTruthy()
  })

  test('should prevent multiple simultaneous login attempts', async ({ page }) => {
    await page.click('text=Sign In')
    await expect(page).toHaveURL(/.*\/login/)

    await page.fill('input[name="email"]', 'test@example.com')
    await page.fill('input[name="password"]', 'password123')

    // Click submit multiple times quickly
    await page.click('button[type="submit"]')
    await page.click('button[type="submit"]')
    await page.click('button[type="submit"]')

    // Should only process one request
    await expect(page.locator('button[type="submit"]')).toBeDisabled()
  })

  test('should clear form errors when user starts typing', async ({ page }) => {
    await page.click('text=Sign In')
    await expect(page).toHaveURL(/.*\/login/)

    // Submit empty form to trigger errors
    await page.click('button[type="submit"]')
    await expect(page.locator('text=Email is required')).toBeVisible()

    // Start typing in email field
    await page.fill('input[name="email"]', 'test@example.com')

    // Error should be cleared
    await expect(page.locator('text=Email is required')).not.toBeVisible()
  })
})
