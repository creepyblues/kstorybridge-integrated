import { test, expect } from '@playwright/test';

const BASE = 'https://kstorybridge-dashboard-git-fe-4cc848-creepyblues-9060s-projects.vercel.app';

test('staging signup — newsletter consent pre-checked + account creation', async ({ page }) => {
  await page.goto(BASE + '/signup');

  await page.fill('[name="full_name"]', 'Neo Staging Test');
  await page.fill('[name="email"]', 'neo.staging.test@mailinator.com');
  await page.fill('[name="password"]', 'TestPass123!');
  await page.selectOption('[name="buyer_role"]', 'producer');

  // Verify checkbox pre-checked
  const checkbox = page.locator('#newsletter_consent');
  await expect(checkbox).toBeChecked();

  // Capture Supabase payload
  const signupPromise = page.waitForRequest(req =>
    req.url().includes('auth/v1/signup') && req.method() === 'POST'
  );

  await page.click('button[id="signup"]');
  const req = await signupPromise;
  const body = JSON.parse(req.postData() || '{}');

  console.log('EMAIL:', body.email);
  console.log('newsletter_consent:', body?.data?.newsletter_consent);
  console.log('account_type:', body?.data?.account_type);

  expect(body.email).toBe('neo.staging.test@mailinator.com');
  expect(body?.data?.newsletter_consent).toBe(true);

  // Wait for redirect or toast
  await page.waitForTimeout(3000);
  const url = page.url();
  console.log('FINAL URL:', url);
  // Success = redirected to /signin or shows toast
  const onSignin = url.includes('signin');
  const hasToast = await page.locator('[data-testid="toast"], [role="status"], .toast').isVisible().catch(() => false);
  console.log('Redirected to signin:', onSignin, '| Toast visible:', hasToast);
});
