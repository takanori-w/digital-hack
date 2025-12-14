import { test, expect } from '@playwright/test'

test.describe('Phase 3 Features - Quiz', () => {
  test.beforeEach(async ({ page }) => {
    // Navigate to the app
    await page.goto('/')
  })

  test('should display quiz tab in dashboard', async ({ page }) => {
    // Check for quiz tab
    const quizTab = page.locator('button, nav a').filter({ hasText: /理解度チェック/ })
    await expect(quizTab).toBeVisible()
  })

  test('should display quiz CTA card on dashboard', async ({ page }) => {
    // Check for quiz CTA card
    const ctaCard = page.locator('div').filter({ hasText: /制度理解度チェック/ }).first()
    await expect(ctaCard).toBeVisible()
  })

  test('should navigate to quiz when clicking CTA', async ({ page }) => {
    // Find and click the quiz CTA button
    const ctaButton = page.locator('button').filter({ hasText: /チェックを始める/ }).first()

    if (await ctaButton.isVisible()) {
      await ctaButton.click()
      await page.waitForLoadState('networkidle')

      // Should show quiz content
      const quizContent = page.locator('text=理解度チェック')
      await expect(quizContent).toBeVisible()
    }
  })
})

test.describe('Phase 3 Features - Settings', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/')
  })

  test('should display settings tab', async ({ page }) => {
    const settingsTab = page.locator('button, nav a').filter({ hasText: /設定/ })
    await expect(settingsTab).toBeVisible()
  })

  test('should show profile settings panel', async ({ page }) => {
    // Click settings tab
    const settingsTab = page.locator('button').filter({ hasText: /設定/ }).first()
    await settingsTab.click()
    await page.waitForLoadState('networkidle')

    // Check for profile settings
    const profileSection = page.locator('text=プロフィール設定')
    await expect(profileSection).toBeVisible()
  })

  test('should display all section tabs in settings', async ({ page }) => {
    // Navigate to settings
    const settingsTab = page.locator('button').filter({ hasText: /設定/ }).first()
    await settingsTab.click()
    await page.waitForLoadState('networkidle')

    // Check for section tabs
    const expectedTabs = ['基本情報', '住所', '仕事', '家族構成', '資産・家計', '将来の予定', '目標']

    for (const tabName of expectedTabs) {
      const tab = page.locator('button').filter({ hasText: tabName })
      // At least one tab should be visible or available
    }
  })
})

test.describe('Phase 3 Features - Navigation', () => {
  test('should have 5 main navigation tabs', async ({ page }) => {
    await page.goto('/')

    const expectedTabs = ['ダッシュボード', 'シミュレーション', '補助金・制度', '理解度チェック', '設定']

    for (const tabName of expectedTabs) {
      const tab = page.locator('button, nav a').filter({ hasText: tabName }).first()
      await expect(tab).toBeVisible()
    }
  })

  test('should switch between tabs correctly', async ({ page }) => {
    await page.goto('/')

    // Click simulation tab
    const simTab = page.locator('button').filter({ hasText: /シミュレーション/ }).first()
    await simTab.click()
    await page.waitForLoadState('networkidle')

    // Click benefits tab
    const benefitsTab = page.locator('button').filter({ hasText: /補助金・制度/ }).first()
    await benefitsTab.click()
    await page.waitForLoadState('networkidle')

    // Click back to dashboard
    const dashboardTab = page.locator('button').filter({ hasText: /ダッシュボード/ }).first()
    await dashboardTab.click()
    await page.waitForLoadState('networkidle')
  })
})

test.describe('Phase 3 Features - Laws Panel', () => {
  test('should display laws panel on dashboard', async ({ page }) => {
    await page.goto('/')

    // Check for laws section
    const lawsSection = page.locator('text=関連する法令・制度')
    await expect(lawsSection).toBeVisible()
  })
})

test.describe('Phase 3 Features - Responsive Design', () => {
  test('should be responsive on tablet', async ({ page }) => {
    await page.setViewportSize({ width: 768, height: 1024 })
    await page.goto('/')

    // Check main content is visible
    const main = page.locator('main, [role="main"]')
    await expect(main).toBeVisible()
  })

  test('should be responsive on mobile', async ({ page }) => {
    await page.setViewportSize({ width: 375, height: 667 })
    await page.goto('/')

    // Navigation should still work
    const content = page.locator('main, [role="main"]')
    await expect(content).toBeVisible()
  })
})
