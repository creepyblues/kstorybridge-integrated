/**
 * Newsletter → title page → signin/signup → title E2E
 *
 * Covers the full new-user journey from a deep link like
 * /buyers/titles/the-odd-one-next-door:
 *   1. anonymous → public preview (/titles/:slug), redirect stashed
 *   2. failed sign-in attempts (unknown email, auth user created outside the app)
 *   3. email signup → verification email → click link → title page
 *   4. returning user signs in → lands on the full title page
 *   5. duplicate-email signup, and Google OAuth start (no Google login)
 *
 * The hosted Supabase project has email confirmation ON (mailer_autoconfirm=false),
 * so the email link step is emulated with auth.admin.generateLink and opened in a
 * fresh browser context — exactly what happens when a user clicks the link from
 * their mail client.
 *
 * Creates REAL accounts (shared Supabase project) and deletes them after.
 * Requires SUPABASE_SERVICE_ROLE_KEY in repo-root .env.local.
 */
import { test, expect, type Page } from '@playwright/test';
import {
  testEmail,
  TEST_PASSWORD,
  createConfirmedBuyer,
  createOrphanAuthUser,
  generateSignupConfirmLink,
  deleteTestUser,
  getBuyerProfile,
} from './helpers/testUsers';

const SLUG = 'the-odd-one-next-door';
const DEEP_LINK = `/buyers/titles/${SLUG}`;
const TITLE_NAME = /The Odd One Next Door/;

async function stashedRedirect(page: Page) {
  return page.evaluate(() => sessionStorage.getItem('redirect_after_login'));
}

async function expectToast(page: Page, title: string) {
  await expect(page.getByText(title, { exact: true }).first()).toBeVisible({ timeout: 15000 });
}

async function expectFullTitlePage(page: Page) {
  await expect(page).toHaveURL(new RegExp(`${DEEP_LINK}$`), { timeout: 20000 });
  await expect(page.getByRole('heading', { name: TITLE_NAME })).toBeVisible({ timeout: 20000 });
  await expect(page.getByText(/title not found/i)).toHaveCount(0);
  // Full (authenticated) page must not show the anonymous unlock CTAs
  await expect(page.getByRole('link', { name: /unlock full analysis/i })).toHaveCount(0);
}

/** Deep link → preview → header "Sign In". Ends on /signin with redirect stashed. */
async function deepLinkToSignIn(page: Page) {
  await page.goto(DEEP_LINK);
  await expect(page).toHaveURL(new RegExp(`/titles/${SLUG}$`));
  await expect(page.getByText(TITLE_NAME).first()).toBeVisible({ timeout: 15000 });
  expect(await stashedRedirect(page)).toBe(DEEP_LINK);
  await page.getByRole('link', { name: /^sign in$/i }).first().click();
  await expect(page).toHaveURL(/\/signin$/);
  expect(await stashedRedirect(page)).toBe(DEEP_LINK);
}

/** Deep link → preview → "Unlock" CTA. Ends on /signup with redirect stashed. */
async function deepLinkToSignUp(page: Page) {
  await page.goto(DEEP_LINK);
  await expect(page).toHaveURL(new RegExp(`/titles/${SLUG}$`));
  await page.getByRole('link', { name: /unlock full analysis/i }).first().click();
  await expect(page).toHaveURL(/\/signup$/);
  expect(await stashedRedirect(page)).toBe(DEEP_LINK);
}

async function fillSignup(page: Page, email: string) {
  await page.fill('[name="full_name"]', 'E2E Newsletter Producer');
  await page.fill('[name="email"]', email);
  await page.fill('[name="password"]', TEST_PASSWORD);
  await page.fill('[name="buyer_company"]', 'E2E Studios');
  await page.selectOption('[name="buyer_role"]', 'producer');
  await page.click('button#signup');
}

async function signIn(page: Page, email: string) {
  await page.fill('#email', email);
  await page.fill('#password', TEST_PASSWORD);
  await page.click('button[type="submit"]');
}

test.describe('Newsletter deep link → new user journey', () => {
  test('1. anonymous deep link lands on public preview with redirect stashed', async ({ page }) => {
    await page.goto(DEEP_LINK);
    await expect(page).toHaveURL(new RegExp(`/titles/${SLUG}$`));
    await expect(page.getByText(TITLE_NAME).first()).toBeVisible({ timeout: 15000 });
    await expect(page.getByRole('link', { name: /unlock full analysis/i }).first()).toBeVisible();
    expect(await stashedRedirect(page)).toBe(DEEP_LINK);
  });

  test('2a. sign-in with unknown email fails in place and keeps the redirect', async ({ page }) => {
    await deepLinkToSignIn(page);
    await signIn(page, testEmail('unknown'));
    await expectToast(page, 'Sign In Failed');
    await expect(page).toHaveURL(/\/signin$/);
    expect(await stashedRedirect(page)).toBe(DEEP_LINK);

    // User gives up and goes to signup — redirect must survive
    await page.getByRole('link', { name: /sign up here/i }).click();
    await expect(page).toHaveURL(/\/signup$/);
    expect(await stashedRedirect(page)).toBe(DEEP_LINK);
  });

  test('2b. auth user created outside the app (no edge-function profile) can sign in to the title', async ({ page }) => {
    // The DB trigger handle_new_user_routing creates user_buyers from auth metadata,
    // so an auth user whose create-buyer-profile call failed is still not orphaned.
    const email = testEmail('orphan');
    await createOrphanAuthUser(email);
    try {
      expect(await getBuyerProfile(email), 'trigger should have created a buyer profile').not.toBeNull();
      await deepLinkToSignIn(page);
      await signIn(page, email);
      await expectToast(page, 'Welcome back!');
      await expectFullTitlePage(page);
    } finally {
      await deleteTestUser(email);
    }
  });

  test('3. email signup from deep link → verification email → title page', async ({ browser, page }) => {
    test.setTimeout(120000);
    const email = testEmail('signup');
    try {
      await deepLinkToSignIn(page);
      await page.getByRole('link', { name: /sign up here/i }).click();
      await expect(page).toHaveURL(/\/signup$/);

      await fillSignup(page, email);
      // Email confirmation is ON in the hosted project → no session yet
      await expectToast(page, 'Check your email');
      await expect(page).toHaveURL(/\/signin$/, { timeout: 10000 });
      expect(await stashedRedirect(page), 'redirect must survive until the email link is used').toBe(DEEP_LINK);

      const profile = await getBuyerProfile(email);
      expect(profile?.tier).toBe('basic');

      // The user opens the verification link from their mail client: new tab, no sessionStorage
      const link = await generateSignupConfirmLink(email, TEST_PASSWORD, `${new URL(page.url()).origin}/auth/callback`);
      const ctx = await browser.newContext();
      const p2 = await ctx.newPage();
      await p2.goto(link);
      await expect(p2).not.toHaveURL(/\/auth\/callback/, { timeout: 30000 });
      // Journey goal: the newsletter reader lands on the title they clicked
      await expectFullTitlePage(p2);
      await ctx.close();
    } finally {
      await deleteTestUser(email);
    }
  });

  test('4. returning user: deep link → sign in → full title page', async ({ page }) => {
    const email = testEmail('returning');
    await createConfirmedBuyer(email);
    try {
      await deepLinkToSignIn(page);
      await signIn(page, email);
      await expectToast(page, 'Welcome back!');
      await expectFullTitlePage(page);
      expect(await stashedRedirect(page)).toBeNull();
    } finally {
      await deleteTestUser(email);
    }
  });

  test('5a. signup with an email that already has an account tells the user clearly', async ({ page }) => {
    const email = testEmail('dupe');
    await createConfirmedBuyer(email);
    try {
      await deepLinkToSignUp(page);
      await fillSignup(page, email);
      // Must NOT pretend a new account was created ("Check your email") for an existing user
      await expect(page.getByText(/already|sign up failed/i).first()).toBeVisible({ timeout: 15000 });
      await expect(page.getByText('Check your email', { exact: true })).toHaveCount(0);
    } finally {
      await deleteTestUser(email);
    }
  });

  test('5b. Google OAuth from signup starts the provider flow with a bare callback URL', async ({ page }) => {
    await deepLinkToSignUp(page);
    const reqPromise = page.waitForRequest(r => /auth\/v1\/authorize\?.*provider=google/.test(r.url()), { timeout: 15000 });
    await page.getByRole('button', { name: /continue with google/i }).click();
    const req = await reqPromise;
    const url = new URL(req.url());
    // Callback must be bare (no params) per project rule
    expect(url.searchParams.get('redirect_to')).toMatch(/\/auth\/callback$/);
    // Stop before Google: the rest of the OAuth journey is a manual test
  });
});
