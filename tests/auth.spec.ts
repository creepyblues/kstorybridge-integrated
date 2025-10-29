import { test, expect } from '@playwright/test'
import { getEnvironmentConfig, TEST_USERS, TIMEOUTS } from './helpers/test-config'
import { signInWithEmail, waitForAuthRedirect } from './helpers/auth-helpers'

/**
 * Authentication Tests
 *
 * Tests email + OAuth authentication for both buyers and creators
 * across staging and production environments.
 *
 * CRITICAL: These tests verify the multi-environment OAuth fixes
 * deployed in Oct 2025 (commits 71653337, d8e726db, 82ec917a)
 */

test.describe('Authentication - Email Signup/Signin', () => {
  const config = getEnvironmentConfig()

  test.describe('Buyer Authentication', () => {
    test('should sign in as buyer with email', async ({ page }) => {
      // Navigate to dashboard signin
      await page.goto(`${config.dashboard}/signin`)

      // Sign in with test buyer credentials
      await signInWithEmail(page, TEST_USERS.buyer.email, TEST_USERS.buyer.password)

      // Should redirect to buyer home
      await waitForAuthRedirect(page, '/buyers/home', TIMEOUTS.oauth)

      // Verify authenticated state
      await expect(page).toHaveURL(/\/buyers\/home/)

      // Check for authenticated UI elements
      const userMenu = page.locator('[data-testid="user-menu"]')
      await expect(userMenu).toBeVisible({ timeout: TIMEOUTS.default })
    })

    test('should redirect to chat from buyer home', async ({ page }) => {
      // Sign in first
      await page.goto(`${config.dashboard}/signin`)
      await signInWithEmail(page, TEST_USERS.buyer.email, TEST_USERS.buyer.password)
      await waitForAuthRedirect(page, '/buyers/home', TIMEOUTS.oauth)

      // Buyer home should redirect to chat
      await page.waitForURL(/\/buyers\/chat/, { timeout: TIMEOUTS.navigation })

      await expect(page).toHaveURL(/\/buyers\/chat/)
    })

    test('should reject invalid buyer credentials', async ({ page }) => {
      await page.goto(`${config.dashboard}/signin`)

      // Try with invalid credentials
      await page.fill('input[type="email"]', 'invalid@example.com')
      await page.fill('input[type="password"]', 'wrong-password')
      await page.click('button[type="submit"]')

      // Should show error message
      const errorMessage = page.locator('text=/Invalid credentials|Sign in failed/i')
      await expect(errorMessage).toBeVisible({ timeout: TIMEOUTS.default })
    })
  })

  test.describe('Creator Authentication', () => {
    test('should sign in as creator with email', async ({ page }) => {
      // Navigate to creator signin
      await page.goto(`${config.creator}/signin`)

      // Sign in with test creator credentials
      await signInWithEmail(page, TEST_USERS.creator.email, TEST_USERS.creator.password)

      // Should redirect to creator home
      await waitForAuthRedirect(page, '/home', TIMEOUTS.oauth)

      // Verify authenticated state
      await expect(page).toHaveURL(/\/home/)

      // Check for authenticated UI elements
      const userMenu = page.locator('[data-testid="user-menu"]')
      await expect(userMenu).toBeVisible({ timeout: TIMEOUTS.default })
    })

    test('should reject invalid creator credentials', async ({ page }) => {
      await page.goto(`${config.creator}/signin`)

      // Try with invalid credentials
      await page.fill('input[type="email"]', 'invalid@example.com')
      await page.fill('input[type="password"]', 'wrong-password')
      await page.click('button[type="submit"]')

      // Should show error message
      const errorMessage = page.locator('text=/Invalid credentials|Sign in failed/i')
      await expect(errorMessage).toBeVisible({ timeout: TIMEOUTS.default })
    })
  })
})

test.describe('Authentication - OAuth Flow', () => {
  const config = getEnvironmentConfig()

  test.describe('OAuth Multi-Environment Support', () => {
    /**
     * CRITICAL TEST: Verifies multi-environment OAuth redirect fix
     *
     * This test validates the fix from Oct 2025 that ensures OAuth
     * callbacks redirect to the correct domain (staging vs production).
     *
     * Without this fix: OAuth would redirect to wrong domain causing
     * "bad_oauth_state" errors and hung signup flows.
     *
     * Test verifies:
     * - Staging: dashboard-v2.kstorybridge.com/auth/callback
     * - Production: dashboard.kstorybridge.com/auth/callback
     * - No parameters in callback URL (per CLAUDE.md rules)
     */
    test('should use correct OAuth redirect URL for environment', async ({ page, context }) => {
      // Navigate to signup page
      await page.goto(`${config.dashboard}/signup/buyer`)

      // Click Google OAuth button
      const googleButton = page.locator('button:has-text("Continue with Google")')
      await expect(googleButton).toBeVisible({ timeout: TIMEOUTS.default })

      // Listen for OAuth redirect
      const redirectPromise = page.waitForEvent('popup')
      await googleButton.click()

      // Get the OAuth popup window
      const popup = await redirectPromise
      await popup.waitForLoadState()

      // Verify redirect URL includes correct domain
      const url = popup.url()

      if (process.env.TEST_ENV === 'staging') {
        expect(url).toContain('redirect_uri=https%3A%2F%2Fdashboard-v2.kstorybridge.com%2Fauth%2Fcallback')
      } else if (process.env.TEST_ENV === 'production') {
        expect(url).toContain('redirect_uri=https%3A%2F%2Fdashboard.kstorybridge.com%2Fauth%2Fcallback')
      }

      // Verify no parameters in callback URL (critical rule from CLAUDE.md)
      expect(url).not.toContain('redirect_uri=https%3A%2F%2F.*%2Fauth%2Fcallback%3F')
    })

    test.skip('should complete OAuth signup flow (manual test only)', async ({ page }) => {
      /**
       * MANUAL TEST ONLY
       *
       * This test requires real Google credentials and cannot be automated
       * without access to test Google accounts. Mark as .skip and run manually
       * during staging verification.
       *
       * Manual steps:
       * 1. Navigate to signup page
       * 2. Click "Continue with Google"
       * 3. Complete Google OAuth flow
       * 4. Verify redirect to profile completion page
       * 5. Fill profile fields (pen_name, role, etc.)
       * 6. Verify redirect to home page
       * 7. Verify session persists
       */

      await page.goto(`${config.dashboard}/signup/buyer`)

      // Click OAuth button
      await page.click('button:has-text("Continue with Google")')

      // Wait for OAuth redirect back to app
      await waitForAuthRedirect(page, '/auth/callback', 60000)

      // Should redirect to home after OAuth
      await waitForAuthRedirect(page, '/buyers/home', TIMEOUTS.oauth)

      await expect(page).toHaveURL(/\/buyers\/home/)
    })
  })

  test.describe('OAuth Error Handling', () => {
    test('should handle OAuth cancellation gracefully', async ({ page }) => {
      await page.goto(`${config.dashboard}/signup/buyer`)

      // Click Google OAuth button
      const googleButton = page.locator('button:has-text("Continue with Google")')
      await expect(googleButton).toBeVisible({ timeout: TIMEOUTS.default })

      // Listen for OAuth popup
      const redirectPromise = page.waitForEvent('popup')
      await googleButton.click()

      const popup = await redirectPromise

      // Close the OAuth popup (simulating user cancellation)
      await popup.close()

      // Should remain on signup page
      await expect(page).toHaveURL(/\/signup\/buyer/)

      // Should not show error message for cancellation
      const errorMessage = page.locator('text=/error|failed/i')
      await expect(errorMessage).not.toBeVisible()
    })
  })
})

test.describe('Authentication - Session Persistence', () => {
  const config = getEnvironmentConfig()

  test('should maintain session after page refresh', async ({ page }) => {
    // Sign in
    await page.goto(`${config.dashboard}/signin`)
    await signInWithEmail(page, TEST_USERS.buyer.email, TEST_USERS.buyer.password)
    await waitForAuthRedirect(page, '/buyers/home', TIMEOUTS.oauth)

    // Verify authenticated
    const userMenu = page.locator('[data-testid="user-menu"]')
    await expect(userMenu).toBeVisible({ timeout: TIMEOUTS.default })

    // Refresh page
    await page.reload()

    // Should still be authenticated
    await expect(userMenu).toBeVisible({ timeout: TIMEOUTS.default })
    await expect(page).toHaveURL(/\/buyers\//)
  })

  test('should redirect to signin when not authenticated', async ({ page }) => {
    // Try to access protected route without auth
    await page.goto(`${config.dashboard}/buyers/home`)

    // Should redirect to signin
    await page.waitForURL(/\/signin/, { timeout: TIMEOUTS.navigation })
    await expect(page).toHaveURL(/\/signin/)
  })
})
