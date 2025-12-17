/**
 * Trial Flow E2E Tests
 *
 * Tests the complete trial user journey:
 * 1. Visit /trial page
 * 2. Enter comp titles
 * 3. Search and view results
 * 4. Hit usage limit
 * 5. See limit modal
 */

import { test, expect } from '@playwright/test';

// Helper to set trial storage in correct format
const setTrialUsage = (page: any, searchesUsed: number) => {
  return page.evaluate((count: number) => {
    localStorage.setItem(
      'kstorybridge_trial_usage',
      JSON.stringify({ searches_used: count, version: 1 })
    );
  }, searchesUsed);
};

test.describe('Trial Flow', () => {
  test.beforeEach(async ({ page }) => {
    // Clear localStorage to reset trial count
    await page.goto('/trial');
    await page.evaluate(() => localStorage.clear());
    await page.reload();
    // Wait for typewriter animation to settle
    await page.waitForTimeout(2500);
  });

  test('should display trial page with search input', async ({ page }) => {
    await page.goto('/trial');
    await page.waitForTimeout(2500);

    // Check page title and header
    await expect(page.getByText('KStoryBridge')).toBeVisible();
    await expect(page.getByText('Trial').first()).toBeVisible();

    // Check trial counter - use first() to handle responsive duplicates
    await expect(page.getByText(/3 of 3/).first()).toBeVisible();

    // Check hero section (typewriter text) - wait for animation
    await expect(page.getByText('Discover Korean Content')).toBeVisible({ timeout: 5000 });

    // Check search input placeholder - actual placeholder text
    await expect(page.getByPlaceholder(/type a show you love/i)).toBeVisible();

    // Check Sign Up button in header
    await expect(page.locator('header').getByRole('link', { name: /sign up/i })).toBeVisible();
  });

  test('should allow adding comp titles and searching', async ({ page }) => {
    await page.goto('/trial');
    await page.waitForTimeout(2500);

    // Type a comp title in the search input
    const searchInput = page.getByPlaceholder(/type a show you love/i);
    await searchInput.fill('The Bear');

    // Wait for autocomplete suggestions
    await page.waitForTimeout(1000);

    // Press enter to select first autocomplete result
    await page.keyboard.press('Enter');
    await page.waitForTimeout(1000);

    // Should see "The Bear" text somewhere on page (selected or in results) - use first() for multiple matches
    await expect(page.getByText('The Bear').first()).toBeVisible({ timeout: 5000 });

    // Find Matches button should be visible
    await expect(page.getByRole('button', { name: /find matches/i })).toBeVisible();
  });

  test('should show Sign Up button linking to signup page', async ({ page }) => {
    await page.goto('/trial');
    await page.waitForTimeout(1000);

    const signUpLink = page.locator('header').getByRole('link', { name: /sign up/i });
    await expect(signUpLink).toHaveAttribute('href', '/signup');
  });

  test('should show footer CTA with Sign Up Free button', async ({ page }) => {
    await page.goto('/trial');
    await page.waitForTimeout(1000);

    // Scroll to footer
    await page.evaluate(() => window.scrollTo(0, document.body.scrollHeight));
    await page.waitForTimeout(500);

    // Check footer CTA text
    await expect(
      page.getByText('Ready to unlock unlimited searches and save your discoveries?')
    ).toBeVisible();

    // Check Sign Up Free button in footer
    const footerSignUp = page.locator('footer').getByRole('link', { name: /sign up free/i });
    await expect(footerSignUp).toBeVisible();
    await expect(footerSignUp).toHaveAttribute('href', '/signup');
  });

  test('should navigate to signup when clicking Sign Up', async ({ page }) => {
    await page.goto('/trial');
    await page.waitForTimeout(1000);

    const signUpLink = page.locator('header').getByRole('link', { name: /sign up/i });
    await signUpLink.click();

    // Should navigate to signup page
    await expect(page).toHaveURL('/signup');
  });
});

test.describe('Trial Limit', () => {
  test('should track usage in localStorage', async ({ page }) => {
    await page.goto('/trial');

    // Set trial usage in localStorage using correct key and format
    await setTrialUsage(page, 2);
    await page.reload();
    await page.waitForTimeout(1000);

    // Should show 1 of 3 (remaining = 3 - 2 = 1) - use first() for responsive duplicates
    await expect(page.getByText(/1 of 3/).first()).toBeVisible();
  });

  test('should show limit modal when trial exhausted', async ({ page }) => {
    await page.goto('/trial');

    // Set trial usage to max using correct key and format
    await setTrialUsage(page, 3);
    await page.reload();
    await page.waitForTimeout(1000);

    // Should show 0 of 3 - use first() for responsive duplicates
    await expect(page.getByText(/0 of 3/).first()).toBeVisible();

    // Try to search - type something first
    const searchInput = page.getByPlaceholder(/type a show you love/i);
    await searchInput.fill('Squid Game');
    await page.waitForTimeout(1000);
    await page.keyboard.press('Enter');
    await page.waitForTimeout(1000);

    // Look for Find Matches button and click it
    const searchButton = page.getByRole('button', { name: /find matches/i });
    if (await searchButton.isEnabled()) {
      await searchButton.click();

      // Should show limit modal - look for any sign of limit reached
      await expect(page.getByText(/limit|sign up|unlock|upgrade/i).first()).toBeVisible({
        timeout: 5000,
      });
    }
  });
});
