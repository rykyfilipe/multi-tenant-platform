import { test, expect } from '@playwright/test'

test.describe('User Registration Flow', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/')
  })

  test('should complete user registration successfully', async ({ page }) => {
    // Navigate to registration page
    await page.click('text=Sign Up')
    await expect(page).toHaveURL(/.*\/register/)

    // Fill registration form
    await page.fill('input[name="firstName"]', 'John')
    await page.fill('input[name="lastName"]', 'Doe')
    await page.fill('input[name="email"]', 'john.doe@example.com')
    await page.fill('input[name="password"]', 'SecurePassword123!')
    await page.selectOption('select[name="role"]', 'ADMIN')

    // Submit form
    await page.click('button[type="submit"]')

    // Wait for success message or redirect
    await expect(page.locator('text=Registration successful')).toBeVisible({ timeout: 10000 })
    
    // Should redirect to dashboard or home page
    await expect(page).toHaveURL(/.*\/(dashboard|home)/)
  })

  test('should show validation errors for invalid input', async ({ page }) => {
    await page.click('text=Sign Up')
    await expect(page).toHaveURL(/.*\/register/)

    // Try to submit empty form
    await page.click('button[type="submit"]')

    // Check for validation errors
    await expect(page.locator('text=First name is required')).toBeVisible()
    await expect(page.locator('text=Last name is required')).toBeVisible()
    await expect(page.locator('text=Email is required')).toBeVisible()
    await expect(page.locator('text=Password is required')).toBeVisible()
  })

  test('should show error for invalid email format', async ({ page }) => {
    await page.click('text=Sign Up')
    await expect(page).toHaveURL(/.*\/register/)

    await page.fill('input[name="firstName"]', 'John')
    await page.fill('input[name="lastName"]', 'Doe')
    await page.fill('input[name="email"]', 'invalid-email')
    await page.fill('input[name="password"]', 'SecurePassword123!')
    await page.selectOption('select[name="role"]', 'ADMIN')

    await page.click('button[type="submit"]')

    await expect(page.locator('text=Please enter a valid email address')).toBeVisible()
  })

  test('should show error for weak password', async ({ page }) => {
    await page.click('text=Sign Up')
    await expect(page).toHaveURL(/.*\/register/)

    await page.fill('input[name="firstName"]', 'John')
    await page.fill('input[name="lastName"]', 'Doe')
    await page.fill('input[name="email"]', 'john.doe@example.com')
    await page.fill('input[name="password"]', '123')
    await page.selectOption('select[name="role"]', 'ADMIN')

    await page.click('button[type="submit"]')

    await expect(page.locator('text=Password must be at least 8 characters')).toBeVisible()
  })

  test('should show error for existing email', async ({ page }) => {
    await page.click('text=Sign Up')
    await expect(page).toHaveURL(/.*\/register/)

    // Use an email that already exists
    await page.fill('input[name="firstName"]', 'John')
    await page.fill('input[name="lastName"]', 'Doe')
    await page.fill('input[name="email"]', 'existing@example.com')
    await page.fill('input[name="password"]', 'SecurePassword123!')
    await page.selectOption('select[name="role"]', 'ADMIN')

    await page.click('button[type="submit"]')

    await expect(page.locator('text=User with this email already exists')).toBeVisible()
  })

  test('should navigate to login page from registration', async ({ page }) => {
    await page.click('text=Sign Up')
    await expect(page).toHaveURL(/.*\/register/)

    await page.click('text=Already have an account? Sign in')
    await expect(page).toHaveURL(/.*\/login/)
  })

  test('should handle network errors gracefully', async ({ page }) => {
    // Mock network failure
    await page.route('**/api/(auth)/register', route => route.abort())

    await page.click('text=Sign Up')
    await expect(page).toHaveURL(/.*\/register/)

    await page.fill('input[name="firstName"]', 'John')
    await page.fill('input[name="lastName"]', 'Doe')
    await page.fill('input[name="email"]', 'john.doe@example.com')
    await page.fill('input[name="password"]', 'SecurePassword123!')
    await page.selectOption('select[name="role"]', 'ADMIN')

    await page.click('button[type="submit"]')

    await expect(page.locator('text=Network error. Please try again.')).toBeVisible()
  })

  test('should show loading state during registration', async ({ page }) => {
    // Mock slow response
    await page.route('**/api/(auth)/register', async route => {
      await new Promise(resolve => setTimeout(resolve, 2000))
      await route.continue()
    })

    await page.click('text=Sign Up')
    await expect(page).toHaveURL(/.*\/register/)

    await page.fill('input[name="firstName"]', 'John')
    await page.fill('input[name="lastName"]', 'Doe')
    await page.fill('input[name="email"]', 'john.doe@example.com')
    await page.fill('input[name="password"]', 'SecurePassword123!')
    await page.selectOption('select[name="role"]', 'ADMIN')

    await page.click('button[type="submit"]')

    // Check for loading state
    await expect(page.locator('button[type="submit"]:has-text("Creating Account...")')).toBeVisible()
    await expect(page.locator('button[type="submit"]')).toBeDisabled()
  })

  test('should support different user roles', async ({ page }) => {
    const roles = ['ADMIN', 'USER', 'VIEWER']
    
    for (const role of roles) {
      await page.click('text=Sign Up')
      await expect(page).toHaveURL(/.*\/register/)

      await page.fill('input[name="firstName"]', 'John')
      await page.fill('input[name="lastName"]', 'Doe')
      await page.fill('input[name="email"]', `john.doe.${role.toLowerCase()}@example.com`)
      await page.fill('input[name="password"]', 'SecurePassword123!')
      await page.selectOption('select[name="role"]', role)

      await page.click('button[type="submit"]')

      await expect(page.locator('text=Registration successful')).toBeVisible({ timeout: 10000 })
      
      // Logout for next iteration
      await page.click('text=Sign Out')
      await page.waitForURL(/.*\//)
    }
  })

  test('should validate password confirmation if field exists', async ({ page }) => {
    await page.click('text=Sign Up')
    await expect(page).toHaveURL(/.*\/register/)

    // Check if password confirmation field exists
    const confirmPasswordField = page.locator('input[name="confirmPassword"]')
    if (await confirmPasswordField.isVisible()) {
      await page.fill('input[name="firstName"]', 'John')
      await page.fill('input[name="lastName"]', 'Doe')
      await page.fill('input[name="email"]', 'john.doe@example.com')
      await page.fill('input[name="password"]', 'SecurePassword123!')
      await page.fill('input[name="confirmPassword"]', 'DifferentPassword123!')
      await page.selectOption('select[name="role"]', 'ADMIN')

      await page.click('button[type="submit"]')

      await expect(page.locator('text=Passwords do not match')).toBeVisible()
    }
  })

  test('should handle form reset', async ({ page }) => {
    await page.click('text=Sign Up')
    await expect(page).toHaveURL(/.*\/register/)

    // Fill form
    await page.fill('input[name="firstName"]', 'John')
    await page.fill('input[name="lastName"]', 'Doe')
    await page.fill('input[name="email"]', 'john.doe@example.com')
    await page.fill('input[name="password"]', 'SecurePassword123!')
    await page.selectOption('select[name="role"]', 'ADMIN')

    // Reset form
    await page.click('button:has-text("Reset")')

    // Check that fields are cleared
    await expect(page.locator('input[name="firstName"]')).toHaveValue('')
    await expect(page.locator('input[name="lastName"]')).toHaveValue('')
    await expect(page.locator('input[name="email"]')).toHaveValue('')
    await expect(page.locator('input[name="password"]')).toHaveValue('')
  })
})
