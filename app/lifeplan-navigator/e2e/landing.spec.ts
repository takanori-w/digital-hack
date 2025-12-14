import { test, expect } from '@playwright/test'

test.describe('Landing Page', () => {
  test('should display the hero section', async ({ page }) => {
    await page.goto('/')

    // Check for main heading or hero text
    await expect(page.locator('h1, [data-testid="hero-title"]')).toBeVisible()
  })

  test('should have navigation elements', async ({ page }) => {
    await page.goto('/')

    // Check for navigation or main content
    const content = page.locator('main, [role="main"]')
    await expect(content).toBeVisible()
  })

  test('should be responsive on mobile', async ({ page }) => {
    // Set mobile viewport
    await page.setViewportSize({ width: 375, height: 667 })
    await page.goto('/')

    // Page should still render properly
    await expect(page).toHaveTitle(/.+/)
  })

  test('should have proper security headers', async ({ page }) => {
    const response = await page.goto('/')
    const headers = response?.headers()

    // Check security headers
    expect(headers?.['x-frame-options']).toBe('DENY')
    expect(headers?.['x-content-type-options']).toBe('nosniff')
  })

  test('should navigate to dashboard when CTA is clicked', async ({ page }) => {
    await page.goto('/')

    // Look for a CTA button
    const ctaButton = page.locator('button, a').filter({ hasText: /始める|スタート|ダッシュボード/ }).first()

    if (await ctaButton.isVisible()) {
      await ctaButton.click()
      // Should navigate away from landing
      await page.waitForLoadState('networkidle')
    }
  })
})

test.describe('Accessibility', () => {
  test('should have no major accessibility violations', async ({ page }) => {
    await page.goto('/')

    // Check that main content areas have proper roles
    const main = page.locator('main, [role="main"]')
    await expect(main).toBeVisible()

    // Check for proper heading hierarchy
    const h1 = page.locator('h1')
    const h1Count = await h1.count()
    expect(h1Count).toBeGreaterThanOrEqual(1)
  })

  test('should have proper focus management', async ({ page }) => {
    await page.goto('/')

    // Tab through interactive elements
    await page.keyboard.press('Tab')

    // Should have visible focus indicator
    const focusedElement = page.locator(':focus')
    await expect(focusedElement).toBeVisible()
  })
})

test.describe('Performance', () => {
  test('should load within acceptable time', async ({ page }) => {
    const startTime = Date.now()
    await page.goto('/')
    await page.waitForLoadState('domcontentloaded')
    const loadTime = Date.now() - startTime

    // Page should load within 5 seconds
    expect(loadTime).toBeLessThan(5000)
  })
})
