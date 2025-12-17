/**
 * Authentication E2E Tests
 *
 * Tests the authentication flows:
 * 1. Email signup
 * 2. Email sign in
 * 3. OAuth signup (Google)
 * 4. Sign out
 */

import { test, expect } from '@playwright/test';

test.describe('Sign Up Page', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/signup');
  });

  test('should display signup page with all elements', async ({ page }) => {
    // Check page heading - "Producer Sign Up"
    await expect(page.getByRole('heading', { name: /producer sign up/i })).toBeVisible();

    // Check email input (by label)
    await expect(page.getByLabel(/^email/i)).toBeVisible();

    // Check password input (by label)
    await expect(page.getByLabel(/^password/i)).toBeVisible();

    // Check sign up button - "Create Account"
    await expect(page.getByRole('button', { name: /create account/i })).toBeVisible();

    // Check OAuth options (Google) - "Continue with Google"
    await expect(page.getByRole('button', { name: /continue with google/i })).toBeVisible();

    // Check link to sign in - "Sign in here"
    await expect(page.getByRole('link', { name: /sign in here/i })).toBeVisible();
  });

  test('should show validation errors for missing required fields', async ({ page }) => {
    // Fill some fields but leave company empty (required but no HTML5 required attr)
    await page.getByLabel(/full name/i).fill('Test User');
    await page.getByLabel(/^email/i).fill('test@example.com');
    await page.getByLabel(/^password/i).fill('validpassword123');
    // Leave company empty - this triggers toast validation
    await page.getByLabel(/role/i).selectOption('producer');

    const submitButton = page.getByRole('button', { name: /create account/i });
    await submitButton.click();

    // Should show toast error for company required - use exact text to avoid multiple matches
    await expect(page.getByText('Company is required', { exact: true })).toBeVisible({ timeout: 5000 });
  });

  test('should show validation errors for short password', async ({ page }) => {
    // Fill required fields but with short password
    await page.getByLabel(/full name/i).fill('Test User');
    await page.getByLabel(/^email/i).fill('test@example.com');
    await page.getByLabel(/^password/i).fill('123'); // Too short (< 6 chars)
    await page.getByLabel(/company/i).fill('Test Company');
    await page.getByLabel(/role/i).selectOption('producer');

    const submitButton = page.getByRole('button', { name: /create account/i });
    await submitButton.click();

    // Should show toast error for password length
    await expect(page.getByText(/at least 6 characters/i)).toBeVisible({ timeout: 5000 });
  });

  test('should navigate to sign in page', async ({ page }) => {
    const signInLink = page.getByRole('link', { name: /sign in here/i });
    await signInLink.click();

    await expect(page).toHaveURL('/signin');
  });
});

test.describe('Sign In Page', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/signin');
  });

  test('should display sign in page with all elements', async ({ page }) => {
    // Check page heading - "Producer Sign In"
    await expect(page.getByRole('heading', { name: /producer sign in/i })).toBeVisible();

    // Check email input
    await expect(page.getByLabel(/^email/i)).toBeVisible();

    // Check password input
    await expect(page.getByLabel(/^password/i)).toBeVisible();

    // Check sign in button - "Sign In"
    await expect(page.getByRole('button', { name: /^sign in$/i })).toBeVisible();

    // Check OAuth options - "Continue with Google"
    await expect(page.getByRole('button', { name: /continue with google/i })).toBeVisible();

    // Check link to sign up - "Sign up here"
    await expect(page.getByRole('link', { name: /sign up here/i })).toBeVisible();
  });

  test('should show error for invalid credentials', async ({ page }) => {
    const emailInput = page.getByLabel(/^email/i);
    const passwordInput = page.getByLabel(/^password/i);
    const submitButton = page.getByRole('button', { name: /^sign in$/i });

    await emailInput.fill('nonexistent@example.com');
    await passwordInput.fill('wrongpassword123');
    await submitButton.click();

    // Should show toast error message - use exact text to avoid multiple matches
    await expect(page.getByText('Invalid login credentials', { exact: true })).toBeVisible({
      timeout: 10000,
    });
  });

  test('should navigate to sign up page', async ({ page }) => {
    const signUpLink = page.getByRole('link', { name: /sign up here/i });
    await signUpLink.click();

    await expect(page).toHaveURL('/signup');
  });
});

test.describe('Protected Routes', () => {
  test('should redirect to signin when accessing protected route without auth', async ({
    page,
  }) => {
    // Try to access a protected route
    await page.goto('/buyers/home');

    // Should redirect to signin
    await expect(page).toHaveURL(/signin|login/);
  });

  test('should redirect to signin when accessing comps navigator without auth', async ({
    page,
  }) => {
    await page.goto('/buyers/comps-navigator');

    // Should redirect to signin
    await expect(page).toHaveURL(/signin|login/);
  });

  test('should redirect to signin when accessing titles without auth', async ({ page }) => {
    await page.goto('/buyers/titles');

    // Should redirect to signin
    await expect(page).toHaveURL(/signin|login/);
  });
});

test.describe('OAuth Buttons', () => {
  test('Google OAuth button should be clickable on signup', async ({ page }) => {
    await page.goto('/signup');

    const googleButton = page.getByRole('button', { name: /continue with google/i });
    await expect(googleButton).toBeEnabled();

    // Note: We don't actually click because it would redirect to Google
    // In a full E2E environment with mock OAuth, we would test the complete flow
  });

  test('Google OAuth button should be clickable on signin', async ({ page }) => {
    await page.goto('/signin');

    const googleButton = page.getByRole('button', { name: /continue with google/i });
    await expect(googleButton).toBeEnabled();
  });
});
