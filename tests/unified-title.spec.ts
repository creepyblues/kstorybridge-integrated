import { test, expect } from '@playwright/test'
import { getEnvironmentConfig } from './helpers/test-config'

const config = getEnvironmentConfig()

test.describe('Unified Title Detail — Public Page', () => {
  test('should load public title page for anonymous user', async ({ page }) => {
    await page.goto(`${config.dashboard}/titles/idol-house`)
    await expect(page.getByRole('heading', { name: 'Idol House' })).toBeVisible({ timeout: 15000 })
    const coverImg = page.locator('img[alt="Idol House"]')
    await expect(coverImg).toBeVisible({ timeout: 10000 })
    await expect(page.locator('text=Synopsis')).toBeVisible()
    await expect(page.locator('text=Unlock Full Analysis').first()).toBeVisible()
  })

  test('should show blurred adaptation intelligence for anonymous user', async ({ page }) => {
    await page.goto(`${config.dashboard}/titles/idol-house`)
    await expect(page.locator('text=Adaptation Intelligence')).toBeVisible({ timeout: 15000 })
  })

  test('should show Format section for anonymous user', async ({ page }) => {
    await page.goto(`${config.dashboard}/titles/idol-house`)
    await expect(page.getByText(/Format/).first()).toBeVisible({ timeout: 15000 })
  })

  test('should show Rights section for anonymous user', async ({ page }) => {
    await page.goto(`${config.dashboard}/titles/idol-house`)
    await expect(page.getByText(/Rights/).first()).toBeVisible({ timeout: 15000 })
  })

  test('should return 404-like for non-existent slug', async ({ page }) => {
    await page.goto(`${config.dashboard}/titles/this-title-does-not-exist-12345`)
    await expect(page.locator('text=Title Not Found')).toBeVisible({ timeout: 15000 })
  })
})

test.describe('Unified Title Detail — Header & Branding', () => {
  test('should show Sign In button for anonymous user', async ({ page }) => {
    await page.goto(`${config.dashboard}/titles/idol-house`)
    await expect(page.locator('text=Sign In')).toBeVisible({ timeout: 15000 })
  })

  test('should show KStoryBridge branding in header', async ({ page }) => {
    await page.goto(`${config.dashboard}/titles/idol-house`)
    await expect(page.locator('header')).toContainText('Story', { timeout: 15000 })
  })
})
