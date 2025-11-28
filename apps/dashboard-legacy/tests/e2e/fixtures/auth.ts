/**
 * Authentication Fixtures for E2E Tests
 *
 * Provides reusable login helpers and test user management
 */

import { Page } from '@playwright/test';

// Test password (matches Phase 1 setup)
export const TEST_PASSWORD = 'Test-Password-123';

/**
 * Login as existing test user
 */
export async function loginAs(page: Page, email: string, password: string = TEST_PASSWORD) {
  await page.goto('/signin');

  await page.fill('[name="email"]', email);
  await page.fill('[name="password"]', password);
  await page.click('button[type="submit"]');

  // Wait for redirect (either /buyers/home or /creators/home)
  await page.waitForURL(/\/(buyers|creators)\/home/, { timeout: 10000 });
}

/**
 * Logout current user
 */
export async function logout(page: Page) {
  // Click profile menu
  await page.click('[data-testid="profile-menu"]');

  // Click logout button
  await page.click('[data-testid="logout-button"]');

  // Wait for redirect to signin
  await page.waitForURL('/signin');
}

/**
 * Check if user is authenticated
 */
export async function isAuthenticated(page: Page): Promise<boolean> {
  try {
    // Check if we're on a protected page
    const url = page.url();
    return url.includes('/buyers/') || url.includes('/creators/');
  } catch {
    return false;
  }
}

/**
 * Create test buyer and login (uses Phase 1 CLI script)
 * Note: This creates a NEW user each time - cleanup after test!
 */
export async function createAndLoginAsBuyer(
  page: Page,
  tier: 'basic' | 'pro' | 'suite' = 'basic'
): Promise<{ email: string; password: string }> {
  const email = `test-buyer-${tier}-${Date.now()}@testcompany.com`;

  // Navigate to signup
  await page.goto('/signup/buyer');

  // Fill form
  await page.fill('[name="email"]', email);
  await page.fill('[name="password"]', TEST_PASSWORD);
  await page.fill('[name="full_name"]', `Test Buyer ${tier.toUpperCase()}`);
  await page.fill('[name="buyer_company"]', 'Test Company LLC');
  await page.fill('[name="buyer_role"]', tier === 'suite' ? 'Executive Producer' : 'Producer');

  // Submit
  await page.click('button[type="submit"]');

  // Wait for redirect
  await page.waitForURL('/buyers/home', { timeout: 15000 });

  return { email, password: TEST_PASSWORD };
}

/**
 * Create test creator and login
 */
export async function createAndLoginAsCreator(
  page: Page,
  role: 'author' | 'agent' = 'author'
): Promise<{ email: string; password: string }> {
  const email = `test-creator-${role}-${Date.now()}@gmail.com`;

  // Navigate to signup
  await page.goto('/signup/creator');

  // Fill form
  await page.fill('[name="email"]', email);
  await page.fill('[name="password"]', TEST_PASSWORD);
  await page.fill('[name="full_name"]', `Test ${role === 'author' ? 'Author' : 'Agent'}`);
  await page.fill('[name="pen_name"]', role === 'author' ? 'Test Pen Name' : 'Test Agency');

  // Select role
  await page.selectOption('[name="ip_owner_role"]', role);

  if (role === 'agent') {
    await page.fill('[name="ip_owner_company"]', 'Test Literary Agency');
  }

  // Submit
  await page.click('button[type="submit"]');

  // Wait for redirect
  await page.waitForURL('/creators/home', { timeout: 15000 });

  return { email, password: TEST_PASSWORD };
}
