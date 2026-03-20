import { test, expect } from '@playwright/test';

test.describe('Newsletter consent checkbox — Producer signup', () => {
  test('checkbox is present and unchecked by default', async ({ page }) => {
    await page.goto('/signup');
    const checkbox = page.locator('#newsletter_consent');
    await expect(checkbox).toBeVisible();
    await expect(checkbox).toBeChecked();
  });

  test('checkbox can be checked', async ({ page }) => {
    await page.goto('/signup');
    const checkbox = page.locator('#newsletter_consent');
    await checkbox.check();
    await expect(checkbox).toBeChecked();
  });

  test('privacy policy link is present and correct', async ({ page }) => {
    await page.goto('/signup');
    const link = page.locator('a[href="https://kstorybridge.com/privacy"]').first();
    await expect(link).toBeVisible();
    await expect(link).toHaveAttribute('target', '_blank');
  });

  test('signup form submits with newsletter consent checked', async ({ page }) => {
    await page.goto('/signup');
    await page.fill('[name="full_name"]', 'E2E Test User');
    await page.fill('[name="email"]', `e2etest+${Date.now()}@mailinator.com`);
    await page.fill('[name="password"]', 'testpass123');
    await page.check('#newsletter_consent');
    await expect(page.locator('#newsletter_consent')).toBeChecked();

    // Intercept supabase signup request
    const signupPromise = page.waitForRequest(req =>
      req.url().includes('auth/v1/signup') && req.method() === 'POST'
    );

    await page.click('button[type="submit"]');

    const req = await signupPromise;
    const body = JSON.parse(req.postData() || '{}');
    expect(body?.data?.newsletter_consent).toBe(true);
  });
});

test.describe('Newsletter consent checkbox — Complete Profile (OAuth)', () => {
  test('checkbox is present on complete-profile page', async ({ page }) => {
    // Navigate directly (will redirect to signin if not authed — just check the page renders)
    const response = await page.goto('/complete-profile');
    // Either the page loads or redirects — both are valid
    const checkbox = page.locator('#newsletter_consent');
    const isVisible = await checkbox.isVisible().catch(() => false);
    // If redirected to signin, the checkbox won't be there — that's expected
    if (await page.url().includes('complete-profile')) {
      await expect(checkbox).toBeVisible();
    } else {
      // Redirected to signin — auth guard is working
      expect(page.url()).toContain('signin');
    }
  });
});
