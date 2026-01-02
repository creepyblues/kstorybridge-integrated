/**
 * E2E Test Template: Authentication
 *
 * This template provides a starting point for creating auth E2E tests.
 * Copy this file and customize for your specific app.
 *
 * Usage:
 *   1. Copy to apps/[app]/e2e/auth.e2e.ts
 *   2. Update routes for your app (/signin vs /buyers/signin)
 *   3. Update form fields for your app
 *   4. Run with: npx playwright test auth.e2e.ts
 */

import { test, expect, type Page } from '@playwright/test';

// ==============================================================================
// CONFIGURATION - Update these for your app
// ==============================================================================

const CONFIG = {
  // Base routes (update for your app)
  routes: {
    signup: '/signup',           // Creator: /signup, Dashboard: /buyers/signup
    signin: '/signin',           // Creator: /signin, Dashboard: /buyers/signin
    home: '/home',               // Creator: /home, Dashboard: /buyers/home
    protected: ['/home', '/titles', '/profile'],  // Routes that require auth
  },

  // Test data
  testUser: {
    email: 'test@example.com',
    password: 'ValidPassword123!',
    fullName: 'Test User',
    // Add app-specific fields here
  },
};

// ==============================================================================
// HELPER FUNCTIONS
// ==============================================================================

async function fillSignupForm(page: Page, overrides: Partial<typeof CONFIG.testUser> = {}) {
  const data = { ...CONFIG.testUser, ...overrides };

  await page.getByLabel(/full name/i).fill(data.fullName);
  await page.getByLabel(/^email/i).fill(data.email);
  await page.getByLabel(/^password/i).fill(data.password);

  // Add app-specific field fills here
  // Example for Creator app:
  // await page.getByLabel(/pen name/i).fill('Test Author');
  // await page.getByLabel(/role/i).selectOption('author');
}

async function fillSigninForm(page: Page, email: string, password: string) {
  await page.getByLabel(/email/i).fill(email);
  await page.getByLabel(/password/i).fill(password);
}

// ==============================================================================
// TESTS
// ==============================================================================

test.describe('Sign Up Page', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto(CONFIG.routes.signup);
  });

  test('should display signup form with all required elements', async ({ page }) => {
    // Check page title/heading
    await expect(page.getByRole('heading', { name: /create.*account/i })).toBeVisible();

    // Check form fields are visible
    await expect(page.getByLabel(/full name/i)).toBeVisible();
    await expect(page.getByLabel(/^email/i)).toBeVisible();
    await expect(page.getByLabel(/^password/i)).toBeVisible();

    // Check submit button
    await expect(page.getByRole('button', { name: /create account/i })).toBeVisible();

    // Check signin link
    await expect(page.getByText(/already have an account/i)).toBeVisible();
  });

  test('should show validation errors for empty required fields', async ({ page }) => {
    // Submit empty form
    await page.getByRole('button', { name: /create account/i }).click();

    // Check for validation messages
    await expect(page.getByText(/required/i).first()).toBeVisible({ timeout: 5000 });
  });

  test('should show validation error for invalid email format', async ({ page }) => {
    await fillSignupForm(page, { email: 'invalid-email' });
    await page.getByRole('button', { name: /create account/i }).click();

    await expect(page.getByText(/valid email/i)).toBeVisible({ timeout: 5000 });
  });

  test('should show validation error for weak password', async ({ page }) => {
    await fillSignupForm(page, { password: '123' });
    await page.getByRole('button', { name: /create account/i }).click();

    await expect(page.getByText(/password/i)).toBeVisible({ timeout: 5000 });
  });

  test('should navigate to signin page when clicking signin link', async ({ page }) => {
    await page.getByRole('link', { name: /sign in/i }).click();
    await expect(page).toHaveURL(CONFIG.routes.signin);
  });

  // OAuth button tests
  test('should have clickable Google OAuth button', async ({ page }) => {
    const googleButton = page.getByRole('button', { name: /google/i });
    await expect(googleButton).toBeVisible();
    await expect(googleButton).toBeEnabled();
  });
});

test.describe('Sign In Page', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto(CONFIG.routes.signin);
  });

  test('should display signin form with all required elements', async ({ page }) => {
    await expect(page.getByRole('heading', { name: /sign in/i })).toBeVisible();
    await expect(page.getByLabel(/email/i)).toBeVisible();
    await expect(page.getByLabel(/password/i)).toBeVisible();
    await expect(page.getByRole('button', { name: /sign in/i })).toBeVisible();
  });

  test('should show error for invalid credentials', async ({ page }) => {
    await fillSigninForm(page, 'wrong@example.com', 'wrongpassword');
    await page.getByRole('button', { name: /sign in/i }).click();

    await expect(page.getByText(/invalid|incorrect|error/i)).toBeVisible({ timeout: 10000 });
  });

  test('should navigate to signup page when clicking signup link', async ({ page }) => {
    await page.getByRole('link', { name: /create.*account|sign up/i }).click();
    await expect(page).toHaveURL(CONFIG.routes.signup);
  });
});

test.describe('Protected Routes', () => {
  for (const route of CONFIG.routes.protected) {
    test(`should redirect unauthenticated user from ${route} to signin`, async ({ page }) => {
      await page.goto(route);

      // Should redirect to signin
      await expect(page).toHaveURL(new RegExp(CONFIG.routes.signin));
    });
  }
});

test.describe('Authentication Flow', () => {
  // This test requires a real test account or mock
  test.skip('should complete full signup flow', async ({ page }) => {
    await page.goto(CONFIG.routes.signup);

    // Use unique email to avoid conflicts
    const uniqueEmail = `test+${Date.now()}@example.com`;
    await fillSignupForm(page, { email: uniqueEmail });

    await page.getByRole('button', { name: /create account/i }).click();

    // Wait for redirect to home
    await expect(page).toHaveURL(CONFIG.routes.home, { timeout: 30000 });
  });

  // This test requires existing test credentials
  test.skip('should complete full signin flow', async ({ page }) => {
    await page.goto(CONFIG.routes.signin);

    await fillSigninForm(page,
      process.env.TEST_USER_EMAIL!,
      process.env.TEST_USER_PASSWORD!
    );

    await page.getByRole('button', { name: /sign in/i }).click();

    // Wait for redirect to home
    await expect(page).toHaveURL(CONFIG.routes.home, { timeout: 30000 });
  });
});
