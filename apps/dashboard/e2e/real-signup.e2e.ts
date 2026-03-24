import { test, expect } from '@playwright/test';

test('create real account — neo e2e test', async ({ page }) => {
  await page.goto('/signup');

  await page.fill('[name="full_name"]', 'Neo E2E Tester');
  await page.fill('[name="email"]', 'neo.e2e.signup@mailinator.com');
  await page.fill('[name="password"]', 'TestPass123!');
  await page.selectOption('[name="buyer_role"]', 'producer');

  // Verify newsletter consent is pre-checked
  const checkbox = page.locator('#newsletter_consent');
  await expect(checkbox).toBeChecked();

  // Capture the Supabase payload
  const signupPromise = page.waitForRequest(req =>
    req.url().includes('auth/v1/signup') && req.method() === 'POST'
  );

  await page.click('button[id="signup"]');

  const req = await signupPromise;
  const body = JSON.parse(req.postData() || '{}');
  console.log('EMAIL:', body.email);
  console.log('newsletter_consent:', body?.data?.newsletter_consent);
  console.log('account_type:', body?.data?.account_type);

  expect(body.email).toBe('neo.e2e.signup@mailinator.com');
  expect(body?.data?.newsletter_consent).toBe(true);
  expect(body?.data?.account_type).toBe('buyer');

  // Wait for success
  await expect(page.getByText(/check your email/i)).toBeVisible({ timeout: 10000 });
  console.log('SIGNUP SUCCESS');
});
