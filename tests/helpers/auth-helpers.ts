import { Page, expect } from '@playwright/test'
import { TIMEOUTS } from './test-config'

/**
 * Sign in with email and password
 */
export async function signInWithEmail(
  page: Page,
  email: string,
  password: string
) {
  // Fill in sign-in form
  await page.fill('input[type="email"]', email)
  await page.fill('input[type="password"]', password)

  // Click sign in button
  await page.click('button[type="submit"]')

  // Wait for navigation to complete
  await page.waitForLoadState('networkidle', { timeout: TIMEOUTS.navigation })
}

/**
 * Sign out
 */
export async function signOut(page: Page) {
  // Click user menu or sign out button
  // Implementation depends on UI structure
  await page.click('[data-testid="sign-out-button"]', { timeout: TIMEOUTS.default })
  await page.waitForLoadState('networkidle')
}

/**
 * Wait for authentication redirect
 */
export async function waitForAuthRedirect(
  page: Page,
  expectedPath: string,
  timeout = TIMEOUTS.oauth
) {
  await page.waitForURL(`**${expectedPath}**`, { timeout })
}

/**
 * Check if user is authenticated by checking for protected elements
 */
export async function isAuthenticated(page: Page): Promise<boolean> {
  try {
    // Check for common authenticated UI elements
    await page.waitForSelector('[data-testid="user-menu"]', { timeout: 2000 })
    return true
  } catch {
    return false
  }
}
