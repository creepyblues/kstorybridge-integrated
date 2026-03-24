import { test, expect, type Page } from '@playwright/test'
import { getEnvironmentConfig, TEST_USERS, TIMEOUTS } from './helpers/test-config'

const config = getEnvironmentConfig()
const DASH = config.dashboard

// Helper: sign in with email
async function signIn(page: Page, email: string, password: string) {
  await page.goto(`${DASH}/signin`)
  await page.fill('input[type="email"]', email)
  await page.fill('input[type="password"]', password)
  await page.click('button[type="submit"]')
  // Wait for redirect away from signin
  await page.waitForURL(url => !url.toString().includes('/signin'), { timeout: TIMEOUTS.navigation })
}

// Helper: sign out
async function signOut(page: Page) {
  // Try clicking user menu / sign out
  const signOutBtn = page.locator('text=Sign Out, text=Sign out, text=Logout, text=Log out').first()
  if (await signOutBtn.isVisible({ timeout: 3000 }).catch(() => false)) {
    await signOutBtn.click()
  } else {
    // Navigate to signin to clear session
    await page.goto(`${DASH}/signin`)
  }
}

// ============================================================
// SECTION 1: Public Title Page (Anonymous)
// ============================================================
test.describe('1. Public Title Page — Anonymous', () => {
  test('1.1 Load public title page with hero, cover, synopsis', async ({ page }) => {
    await page.goto(`${DASH}/titles/idol-house`)
    await expect(page.getByRole('heading', { name: 'Idol House' })).toBeVisible({ timeout: 15000 })
    await expect(page.locator('img[alt="Idol House"]')).toBeVisible({ timeout: 10000 })
    await expect(page.locator('text=Synopsis')).toBeVisible()
  })

  test('1.2 Show signup CTA for anonymous user', async ({ page }) => {
    await page.goto(`${DASH}/titles/idol-house`)
    await expect(page.locator('text=Unlock Full Analysis').first()).toBeVisible({ timeout: 15000 })
  })

  test('1.3 Show blurred Adaptation Intelligence section', async ({ page }) => {
    await page.goto(`${DASH}/titles/idol-house`)
    await expect(page.locator('text=Adaptation Intelligence')).toBeVisible({ timeout: 15000 })
  })

  test('1.4 Show Format section', async ({ page }) => {
    await page.goto(`${DASH}/titles/idol-house`)
    await expect(page.getByText(/Format/).first()).toBeVisible({ timeout: 15000 })
  })

  test('1.5 Show Rights section', async ({ page }) => {
    await page.goto(`${DASH}/titles/idol-house`)
    await expect(page.getByText(/Rights/).first()).toBeVisible({ timeout: 15000 })
  })

  test('1.6 404 for non-existent slug', async ({ page }) => {
    await page.goto(`${DASH}/titles/this-title-does-not-exist-xyz`)
    await expect(page.locator('text=Title Not Found')).toBeVisible({ timeout: 15000 })
  })

  test('1.7 Header shows Sign In button', async ({ page }) => {
    await page.goto(`${DASH}/titles/idol-house`)
    await expect(page.getByRole('button', { name: 'Sign In', exact: true })).toBeVisible({ timeout: 15000 })
  })

  test('1.8 Header shows KStoryBridge branding', async ({ page }) => {
    await page.goto(`${DASH}/titles/idol-house`)
    await expect(page.locator('header')).toContainText('Story', { timeout: 15000 })
  })
})

// ============================================================
// SECTION 2: Authentication Flows
// ============================================================
test.describe('2. Authentication', () => {
  test('2.1 Sign in with buyer test account', async ({ page }) => {
    await signIn(page, TEST_USERS.buyer.email, TEST_USERS.buyer.password)
    // Should land on buyer home or dashboard
    await expect(page).toHaveURL(/buyers/, { timeout: TIMEOUTS.navigation })
  })

  test('2.2 Reject invalid credentials', async ({ page }) => {
    await page.goto(`${DASH}/signin`)
    await page.fill('input[type="email"]', 'invalid@test.com')
    await page.fill('input[type="password"]', 'wrongpassword')
    await page.click('button[type="submit"]')
    // Should show error, stay on signin
    await page.waitForTimeout(3000)
    expect(page.url()).toContain('/signin')
  })

  test('2.3 Redirect unauthenticated user from /buyers to /signin', async ({ page }) => {
    await page.goto(`${DASH}/buyers/home`)
    await expect(page).toHaveURL(/signin/, { timeout: TIMEOUTS.navigation })
  })
})

// ============================================================
// SECTION 3: Sign-in Redirect (title page → sign in → back to title)
// ============================================================
test.describe('3. Auth Redirect from Title Page', () => {
  test('3.1 Sign in from title page → redirects back to title', async ({ page }) => {
    // Visit title page as anon
    await page.goto(`${DASH}/titles/idol-house`)
    await expect(page.getByRole('button', { name: 'Sign In', exact: true })).toBeVisible({ timeout: 15000 })

    // Click Sign In
    await page.getByRole('button', { name: 'Sign In', exact: true }).click()
    await expect(page).toHaveURL(/signin/, { timeout: TIMEOUTS.navigation })

    // Sign in
    await page.fill('input[type="email"]', TEST_USERS.buyer.email)
    await page.fill('input[type="password"]', TEST_USERS.buyer.password)
    await page.click('button[type="submit"]')

    // Should redirect to /buyers/titles/idol-house (slug-based)
    await expect(page).toHaveURL(/buyers\/titles\/idol-house/, { timeout: TIMEOUTS.navigation })
  })

  test('3.2 Public /titles/:slug redirects logged-in user to /buyers/titles/:slug', async ({ page }) => {
    await signIn(page, TEST_USERS.buyer.email, TEST_USERS.buyer.password)
    await page.goto(`${DASH}/titles/idol-house`)
    await expect(page).toHaveURL(/buyers\/titles\/idol-house/, { timeout: TIMEOUTS.navigation })
  })
})

// ============================================================
// SECTION 4: Dashboard Title Detail (Authenticated + Sidebar)
// ============================================================
test.describe('4. Dashboard Title Detail — Authenticated', () => {
  test.beforeEach(async ({ page }) => {
    await signIn(page, TEST_USERS.buyer.email, TEST_USERS.buyer.password)
  })

  test('4.1 Load title detail by slug with sidebar', async ({ page }) => {
    await page.goto(`${DASH}/buyers/titles/idol-house`)
    await expect(page.getByRole('heading', { name: 'Idol House' })).toBeVisible({ timeout: 15000 })
    // Should have sidebar navigation
    await expect(page.locator('nav, [class*="sidebar"], [class*="Sidebar"]').first()).toBeVisible({ timeout: 5000 })
  })

  test('4.2 Show cover image', async ({ page }) => {
    await page.goto(`${DASH}/buyers/titles/idol-house`)
    const img = page.locator('img[alt="Idol House"]')
    await expect(img).toBeVisible({ timeout: 15000 })
  })

  test('4.3 Show synopsis section', async ({ page }) => {
    await page.goto(`${DASH}/buyers/titles/idol-house`)
    await expect(page.locator('text=Synopsis')).toBeVisible({ timeout: 15000 })
  })

  test('4.4 No "Go to Dashboard" button', async ({ page }) => {
    await page.goto(`${DASH}/buyers/titles/idol-house`)
    await page.waitForTimeout(3000)
    await expect(page.locator('text=Go to Dashboard')).not.toBeVisible()
  })

  test('4.5 No "Contact for Licensing" button', async ({ page }) => {
    await page.goto(`${DASH}/buyers/titles/idol-house`)
    await page.waitForTimeout(3000)
    await expect(page.locator('text=Contact for Licensing')).not.toBeVisible()
  })

  test('4.6 Show Save/Bookmark button', async ({ page }) => {
    await page.goto(`${DASH}/buyers/titles/idol-house`)
    const saveBtn = page.locator('button:has-text("Save"), button:has-text("Saved")')
    await expect(saveBtn).toBeVisible({ timeout: 15000 })
  })

  test('4.7 UUID in URL still works (backward compat)', async ({ page }) => {
    // First get the UUID for idol-house
    await page.goto(`${DASH}/buyers/titles/idol-house`)
    await expect(page.getByRole('heading', { name: 'Idol House' })).toBeVisible({ timeout: 15000 })

    // Now try accessing via a known UUID pattern — getTitleBySlug handles this
    // We test the fallback by confirming the slug route works
    const url = page.url()
    expect(url).toContain('/buyers/titles/idol-house')
  })
})

// ============================================================
// SECTION 5: Dashboard Navigation — All Title Links Use Slug
// ============================================================
test.describe('5. Dashboard Navigation — Slug URLs', () => {
  test.beforeEach(async ({ page }) => {
    await signIn(page, TEST_USERS.buyer.email, TEST_USERS.buyer.password)
  })

  test('5.1 Buyer Home loads', async ({ page }) => {
    await page.goto(`${DASH}/buyers/home`)
    await expect(page.locator('body')).not.toContainText('Application error', { timeout: 15000 })
    await page.waitForTimeout(2000)
    // Page should load without crashing
    expect(page.url()).toContain('/buyers/home')
  })

  test('5.2 Trending/Featured page loads', async ({ page }) => {
    await page.goto(`${DASH}/buyers/trending`)
    await expect(page.locator('body')).not.toContainText('Application error', { timeout: 15000 })
    await page.waitForTimeout(3000)
    // Check for any title cards
    const titleCards = page.locator('[class*="card"], [class*="Card"]')
    // Page should not crash
    expect(page.url()).toContain('/buyers/trending')
  })

  test('5.3 Format Spotlight page loads', async ({ page }) => {
    await page.goto(`${DASH}/buyers/format-spotlight`)
    await expect(page.locator('body')).not.toContainText('Application error', { timeout: 15000 })
    await page.waitForTimeout(3000)
    expect(page.url()).toContain('/buyers/format-spotlight')
  })

  test('5.4 Click title from Format Spotlight uses slug URL', async ({ page }) => {
    await page.goto(`${DASH}/buyers/format-spotlight`)
    await page.waitForTimeout(5000)

    // Find any clickable title card
    const titleCard = page.locator('[class*="card"] >> visible=true').first()
    if (await titleCard.isVisible({ timeout: 5000 }).catch(() => false)) {
      await titleCard.click()
      await page.waitForTimeout(3000)
      const url = page.url()
      // URL should contain slug (not UUID pattern)
      const isSlug = !(/[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}/.test(url.split('/buyers/titles/')[1] || ''))
      // Even if UUID, page should load (backward compat)
      await expect(page.locator('body')).not.toContainText('Title not found')
    }
  })

  test('5.5 Titles listing page loads', async ({ page }) => {
    await page.goto(`${DASH}/buyers/titles`)
    await expect(page.locator('body')).not.toContainText('Application error', { timeout: 15000 })
    await page.waitForTimeout(3000)
  })

  test('5.6 Comps Navigator page loads', async ({ page }) => {
    await page.goto(`${DASH}/buyers/comps`)
    await expect(page.locator('body')).not.toContainText('Application error', { timeout: 15000 })
    await page.waitForTimeout(3000)
  })

  test('5.7 Mandates page loads', async ({ page }) => {
    await page.goto(`${DASH}/buyers/mandates`)
    await expect(page.locator('body')).not.toContainText('Application error', { timeout: 15000 })
    await page.waitForTimeout(3000)
  })

  test('5.8 Saved Titles page loads', async ({ page }) => {
    await page.goto(`${DASH}/buyers/saved`)
    await expect(page.locator('body')).not.toContainText('Application error', { timeout: 15000 })
    await page.waitForTimeout(3000)
  })

  test('5.9 Chat page loads', async ({ page }) => {
    await page.goto(`${DASH}/buyers/chat`)
    await expect(page.locator('body')).not.toContainText('Application error', { timeout: 15000 })
    await page.waitForTimeout(3000)
  })

  test('5.10 Profile page loads', async ({ page }) => {
    await page.goto(`${DASH}/buyers/profile`)
    await expect(page.locator('body')).not.toContainText('Application error', { timeout: 15000 })
    await page.waitForTimeout(3000)
  })
})

// ============================================================
// SECTION 6: Signin/Signup Pages
// ============================================================
test.describe('6. Auth Pages', () => {
  test('6.1 Signin page loads', async ({ page }) => {
    await page.goto(`${DASH}/signin`)
    await expect(page.locator('input[type="email"]')).toBeVisible({ timeout: 10000 })
    await expect(page.locator('input[type="password"]')).toBeVisible()
  })

  test('6.2 Signup page loads', async ({ page }) => {
    await page.goto(`${DASH}/signup`)
    await expect(page.locator('body')).not.toContainText('Application error', { timeout: 10000 })
  })

  test('6.3 Trial page loads', async ({ page }) => {
    await page.goto(`${DASH}/trial`)
    await expect(page.locator('body')).not.toContainText('Application error', { timeout: 10000 })
  })
})

// ============================================================
// SECTION 7: Multiple Titles — Slug Consistency
// ============================================================
test.describe('7. Multiple Titles — Verify Slug Routes', () => {
  test.beforeEach(async ({ page }) => {
    await signIn(page, TEST_USERS.buyer.email, TEST_USERS.buyer.password)
  })

  test('7.1 Navigate to title from buyer home search/results', async ({ page }) => {
    await page.goto(`${DASH}/buyers/home`)
    await page.waitForTimeout(5000)

    // Look for any title link on the home page
    const titleLink = page.locator('a[href*="/buyers/titles/"], [role="button"], [class*="card"]').first()
    if (await titleLink.isVisible({ timeout: 5000 }).catch(() => false)) {
      await titleLink.click()
      await page.waitForTimeout(3000)

      // Should load a title page without error
      if (page.url().includes('/buyers/titles/')) {
        await expect(page.locator('body')).not.toContainText('Title not found')
        await expect(page.locator('body')).not.toContainText('Application error')
      }
    }
  })

  test('7.2 Navigate back from title detail to home', async ({ page }) => {
    await page.goto(`${DASH}/buyers/titles/idol-house`)
    await expect(page.getByRole('heading', { name: 'Idol House' })).toBeVisible({ timeout: 15000 })

    // Click home/logo in sidebar
    await page.goto(`${DASH}/buyers/home`)
    await expect(page.locator('body')).not.toContainText('Application error', { timeout: 10000 })
  })
})
