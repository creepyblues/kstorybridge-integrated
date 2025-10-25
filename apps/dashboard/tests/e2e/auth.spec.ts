/**
 * E2E Tests for Authentication Flows
 *
 * Tests:
 * 1. Buyer email signup → profile creation → dashboard redirect
 * 2. Creator email signup → profile creation → dashboard redirect
 * 3. Email signin → dashboard access
 * 4. OAuth signin (manual test only - requires browser interaction)
 *
 * Note: Each test creates a NEW user with unique email to avoid conflicts
 */

import { test, expect } from '@playwright/test';
import { loginAs, createAndLoginAsBuyer, createAndLoginAsCreator } from './fixtures/auth';

test.describe('Authentication Flows', () => {
  test('buyer signup → profile creation → dashboard redirect', async ({ page }) => {
    // Create unique test buyer
    const testEmail = `test-buyer-e2e-${Date.now()}@testcompany.com`;
    const testPassword = 'Test-Password-123';

    // 1. Navigate to buyer signup
    await page.goto('/signup/buyer');

    // 2. Fill signup form
    await page.fill('[name="email"]', testEmail);
    await page.fill('[name="password"]', testPassword);
    await page.fill('[name="full_name"]', 'E2E Test Buyer');
    await page.fill('[name="buyer_company"]', 'E2E Test Company');
    await page.fill('[name="buyer_role"]', 'Producer');

    // 3. Submit form
    await page.click('button[type="submit"]');

    // 4. Wait for redirect to buyer dashboard
    await page.waitForURL('/buyers/home', { timeout: 15000 });

    // 5. Verify we're on the buyer dashboard
    expect(page.url()).toContain('/buyers/home');

    // 6. Verify user is authenticated (should see profile/logout options)
    const profileSection = page.locator('[data-testid="user-profile"], nav');
    await expect(profileSection).toBeVisible();

    // 7. Verify tier is basic (default)
    await page.goto('/buyers/profile');
    const tierBadge = page.locator('text=/basic/i');
    await expect(tierBadge.first()).toBeVisible();
  });

  test('creator signup → profile creation → dashboard redirect', async ({ page }) => {
    // Create unique test creator
    const testEmail = `test-creator-e2e-${Date.now()}@gmail.com`;
    const testPassword = 'Test-Password-123';

    // 1. Navigate to creator signup
    await page.goto('/signup/creator');

    // 2. Fill signup form
    await page.fill('[name="email"]', testEmail);
    await page.fill('[name="password"]', testPassword);
    await page.fill('[name="full_name"]', 'E2E Test Creator');
    await page.fill('[name="pen_name"]', 'E2E Pen Name');

    // Select role (author)
    const roleSelect = page.locator('[name="ip_owner_role"]');
    if (await roleSelect.isVisible()) {
      await roleSelect.selectOption('author');
    }

    // 3. Submit form
    await page.click('button[type="submit"]');

    // 4. Wait for redirect to creator dashboard
    await page.waitForURL('/creators/home', { timeout: 15000 });

    // 5. Verify we're on the creator dashboard
    expect(page.url()).toContain('/creators/home');

    // 6. Verify user is authenticated
    const profileSection = page.locator('[data-testid="user-profile"], nav');
    await expect(profileSection).toBeVisible();
  });

  test('email signin → dashboard access (buyer)', async ({ page }) => {
    // First, create a test buyer
    const { email, password } = await createAndLoginAsBuyer(page);

    // Logout
    await page.goto('/signin'); // Simple logout by going to signin

    // Now test signin
    await page.fill('[name="email"]', email);
    await page.fill('[name="password"]', password);
    await page.click('button[type="submit"]');

    // Should redirect to buyer dashboard
    await page.waitForURL('/buyers/home', { timeout: 10000 });
    expect(page.url()).toContain('/buyers/home');
  });

  test('email signin → dashboard access (creator)', async ({ page }) => {
    // First, create a test creator
    const { email, password } = await createAndLoginAsCreator(page);

    // Logout
    await page.goto('/signin'); // Simple logout by going to signin

    // Now test signin
    await page.fill('[name="email"]', email);
    await page.fill('[name="password"]', password);
    await page.click('button[type="submit"]');

    // Should redirect to creator dashboard
    await page.waitForURL('/creators/home', { timeout: 10000 });
    expect(page.url()).toContain('/creators/home');
  });

  test('protected routes redirect unauthenticated users', async ({ page }) => {
    // Try to access buyer dashboard without authentication
    await page.goto('/buyers/home');

    // Should redirect to signin
    await page.waitForURL('/signin', { timeout: 10000 });
    expect(page.url()).toContain('/signin');

    // Try to access creator dashboard
    await page.goto('/creators/home');

    // Should redirect to signin
    await page.waitForURL('/signin', { timeout: 10000 });
    expect(page.url()).toContain('/signin');

    // Try to access chat
    await page.goto('/chat');

    // Should redirect to signin
    await page.waitForURL('/signin', { timeout: 10000 });
    expect(page.url()).toContain('/signin');
  });

  test('password validation enforces requirements', async ({ page }) => {
    await page.goto('/signup/buyer');

    const weakPasswords = [
      'weak',           // Too short, no uppercase, no number
      'weakpassword',   // No uppercase, no number
      'WEAKPASSWORD',   // No lowercase, no number
      'WeakPassword',   // No number
    ];

    for (const weakPassword of weakPasswords) {
      await page.fill('[name="email"]', `test-${Date.now()}@test.com`);
      await page.fill('[name="password"]', weakPassword);
      await page.fill('[name="full_name"]', 'Test User');
      await page.fill('[name="buyer_company"]', 'Test Co');
      await page.fill('[name="buyer_role"]', 'Test Role');

      await page.click('button[type="submit"]');

      // Should show error or not proceed
      await page.waitForTimeout(2000);

      // Should NOT redirect (still on signup page)
      expect(page.url()).toContain('/signup/buyer');
    }
  });
});
