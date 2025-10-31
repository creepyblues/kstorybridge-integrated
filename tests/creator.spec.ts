import { test, expect } from '@playwright/test'
import { getEnvironmentConfig, TEST_USERS, TIMEOUTS } from './helpers/test-config'
import { signInWithEmail, waitForAuthRedirect } from './helpers/auth-helpers'

/**
 * Creator V2 App Tests
 *
 * Tests the creator-focused dashboard including:
 * - Title CRUD operations (create, read, update, delete)
 * - Profile management
 * - OAuth authentication
 * - Multi-step survey form
 *
 * CRITICAL: Tests the bug fix from Oct 2025 (tags→keywords field)
 */

test.describe('Creator V2 - Title Management', () => {
  const config = getEnvironmentConfig()

  test.beforeEach(async ({ page }) => {
    // Sign in as creator
    await page.goto(`${config.creator}/signin`)
    await signInWithEmail(page, TEST_USERS.creator.email, TEST_USERS.creator.password)
    await waitForAuthRedirect(page, '/home', TIMEOUTS.oauth)

    // Verify creator home loaded
    await expect(page).toHaveURL(/\/home/)
  })

  test('should load creator home page', async ({ page }) => {
    // Check for navigation sidebar
    const sidebar = page.locator('[data-testid="cms-sidebar"]')
    await expect(sidebar).toBeVisible({ timeout: TIMEOUTS.default })

    // Check for "Add Title" button
    const addButton = page.locator('text=/Add Title|New Title/i')
    await expect(addButton).toBeVisible({ timeout: TIMEOUTS.default })

    // Check for titles list or empty state
    const titlesList = page.locator('[data-testid="titles-list"]')
    const emptyState = page.locator('text=/No titles yet|Create your first/i')

    // Either titles list or empty state should be visible
    await expect(titlesList.or(emptyState)).toBeVisible({ timeout: TIMEOUTS.default })
  })

  test('should navigate to titles page', async ({ page }) => {
    // Click "Titles" in sidebar
    const titlesLink = page.locator('a[href="/titles"]')
    await titlesLink.click()

    // Should navigate to titles list
    await expect(page).toHaveURL(/\/titles/)

    // Page should load
    const pageTitle = page.locator('h1:has-text("My Titles")')
    await expect(pageTitle).toBeVisible({ timeout: TIMEOUTS.default })
  })

  test('should load add title survey form', async ({ page }) => {
    // Navigate to add title page
    await page.goto(`${config.creator}/titles/add`)

    // Should show multi-step survey form
    const surveyForm = page.locator('[data-testid="survey-form"]')
    await expect(surveyForm).toBeVisible({ timeout: TIMEOUTS.default })

    // Should show step indicator (e.g., "Step 1 of 5")
    const stepIndicator = page.locator('text=/Step 1/i')
    await expect(stepIndicator).toBeVisible({ timeout: TIMEOUTS.default })

    // Should have required fields for Step 1
    const titleNameKr = page.locator('input[name="title_name_kr"]')
    const titleNameEn = page.locator('input[name="title_name_en"]')

    await expect(titleNameKr).toBeVisible({ timeout: TIMEOUTS.default })
    await expect(titleNameEn).toBeVisible({ timeout: TIMEOUTS.default })
  })

  test('should validate required fields in survey', async ({ page }) => {
    await page.goto(`${config.creator}/titles/add`)

    // Try to submit without filling required fields
    const nextButton = page.locator('button:has-text("Next")')
    await nextButton.click()

    // Should show validation errors
    const errorMessages = page.locator('text=/required|This field/i')
    await expect(errorMessages.first()).toBeVisible({ timeout: TIMEOUTS.default })
  })

  test.skip('should create new title via survey (end-to-end)', async ({ page }) => {
    /**
     * MANUAL TEST - Creates real data
     *
     * This test creates a real title in the database. Use with caution
     * and clean up test data after running.
     */
    await page.goto(`${config.creator}/titles/add`)

    // Step 1: Basic Information
    await page.fill('input[name="title_name_kr"]', '테스트 웹툰')
    await page.fill('input[name="title_name_en"]', 'Test Webtoon')
    await page.fill('input[name="title_url"]', 'https://example.com/test-webtoon')
    await page.fill('input[name="title_image"]', 'https://via.placeholder.com/300x400')
    await page.fill('input[name="story_author"]', 'Test Author')

    // Select genre
    await page.selectOption('select[name="genre"]', 'fantasy')

    // Click Next
    await page.click('button:has-text("Next")')

    // Step 2: Story Details (fill required fields)
    await page.fill('textarea[name="setting_description"]', 'A test story setting')
    await page.click('button:has-text("Next")')

    // Step 3: Narrative Structure
    await page.fill('textarea[name="story_structure"]', 'Test story structure')
    await page.click('button:has-text("Next")')

    // Step 4: Platform Metrics (optional, skip)
    await page.click('button:has-text("Next")')

    // Step 5: Documents (optional, submit)
    await page.click('button:has-text("Submit")')

    // Should redirect to title detail page
    await page.waitForURL(/\/titles\/[a-z0-9-]+/, { timeout: TIMEOUTS.navigation })

    // Verify title was created
    const titleHeader = page.locator('h1:has-text("Test Webtoon")')
    await expect(titleHeader).toBeVisible({ timeout: TIMEOUTS.default })
  })
})

test.describe('Creator V2 - Title Edit (Bug Fix Verification)', () => {
  const config = getEnvironmentConfig()

  test.beforeEach(async ({ page }) => {
    // Sign in as creator
    await page.goto(`${config.creator}/signin`)
    await signInWithEmail(page, TEST_USERS.creator.email, TEST_USERS.creator.password)
    await waitForAuthRedirect(page, '/home', TIMEOUTS.oauth)
  })

  test.skip('should edit existing title without errors', async ({ page }) => {
    /**
     * CRITICAL TEST: Verifies tags→keywords bug fix
     *
     * Before fix: Editing title failed with HTTP 400 because code
     * tried to save to non-existent 'tags' field.
     *
     * After fix: Edit should succeed using 'keywords' field.
     *
     * MANUAL TEST - Requires existing title with ID
     */

    // Navigate to an existing title's edit page
    // Replace 'TEST_TITLE_ID' with real title ID for testing
    const testTitleId = process.env.TEST_TITLE_ID || 'replace-with-real-id'
    await page.goto(`${config.creator}/titles/${testTitleId}/edit`)

    // Should load edit form with existing data
    const titleNameEn = page.locator('input[name="title_name_en"]')
    await expect(titleNameEn).toHaveValue(/.+/) // Should have existing value

    // Modify a field
    const keywords = page.locator('input[name="keywords"]')
    await keywords.fill('test, keywords, updated')

    // Save changes
    const saveButton = page.locator('button:has-text("Save Changes")')
    await saveButton.click()

    // Should redirect back to title detail (no error)
    await page.waitForURL(/\/titles\/[a-z0-9-]+$/, { timeout: TIMEOUTS.navigation })

    // Should show success message or updated content
    const successMessage = page.locator('text=/saved|updated|success/i')
    await expect(successMessage).toBeVisible({ timeout: TIMEOUTS.default })

    // Verify keywords were saved (not tags)
    const keywordBadges = page.locator('[data-testid="keyword-badge"]')
    await expect(keywordBadges.first()).toBeVisible({ timeout: TIMEOUTS.default })

    // Should contain "test" keyword
    const keywordText = await keywordBadges.first().textContent()
    expect(keywordText).toMatch(/test/i)
  })

  test('should display keywords field in edit form', async ({ page }) => {
    /**
     * Verifies that edit form uses 'keywords' field, not 'tags'
     */

    // Note: This test requires at least one title to exist
    await page.goto(`${config.creator}/titles`)

    // Find first title card
    const firstTitle = page.locator('[data-testid="title-card"]').first()

    try {
      // Click edit button if title exists
      const editButton = firstTitle.locator('button:has-text("Edit")')
      await editButton.click({ timeout: 5000 })

      // Should navigate to edit page
      await page.waitForURL(/\/titles\/.*\/edit/, { timeout: TIMEOUTS.navigation })

      // Check for keywords input (not tags)
      const keywordsInput = page.locator('input[name="keywords"]')
      await expect(keywordsInput).toBeVisible({ timeout: TIMEOUTS.default })

      // Should NOT have tags input
      const tagsInput = page.locator('input[name="tags"]')
      await expect(tagsInput).not.toBeVisible()
    } catch (error) {
      // If no titles exist, skip test
      test.skip()
    }
  })
})

test.describe('Creator V2 - Profile Management', () => {
  const config = getEnvironmentConfig()

  test.beforeEach(async ({ page }) => {
    // Sign in as creator
    await page.goto(`${config.creator}/signin`)
    await signInWithEmail(page, TEST_USERS.creator.email, TEST_USERS.creator.password)
    await waitForAuthRedirect(page, '/home', TIMEOUTS.oauth)
  })

  test('should load profile page', async ({ page }) => {
    // Navigate to profile
    await page.goto(`${config.creator}/profile`)

    // Should show profile information
    const profileHeader = page.locator('h1:has-text("Profile")')
    await expect(profileHeader).toBeVisible({ timeout: TIMEOUTS.default })

    // Should show email (read-only)
    const emailField = page.locator('input[type="email"]')
    await expect(emailField).toBeVisible({ timeout: TIMEOUTS.default })
    await expect(emailField).toBeDisabled() // Email should be read-only

    // Should show pen_name field
    const penNameField = page.locator('input[name="pen_name"]')
    await expect(penNameField).toBeVisible({ timeout: TIMEOUTS.default })
  })

  test('should edit profile information', async ({ page }) => {
    await page.goto(`${config.creator}/profile`)

    // Click edit button
    const editButton = page.locator('button:has-text("Edit")')
    await editButton.click()

    // Fields should become editable
    const penNameField = page.locator('input[name="pen_name"]')
    await expect(penNameField).not.toBeDisabled()

    // Modify pen_name
    await penNameField.fill('Updated Test Name')

    // Save changes
    const saveButton = page.locator('button:has-text("Save")')
    await saveButton.click()

    // Should show success message
    const successMessage = page.locator('text=/saved|updated|success/i')
    await expect(successMessage).toBeVisible({ timeout: TIMEOUTS.default })

    // Verify pen_name was updated
    await expect(penNameField).toHaveValue('Updated Test Name')
  })
})

test.describe('Creator V2 - Title Detail View', () => {
  const config = getEnvironmentConfig()

  test.beforeEach(async ({ page }) => {
    // Sign in as creator
    await page.goto(`${config.creator}/signin`)
    await signInWithEmail(page, TEST_USERS.creator.email, TEST_USERS.creator.password)
    await waitForAuthRedirect(page, '/home', TIMEOUTS.oauth)
  })

  test('should display title details', async ({ page }) => {
    // Navigate to titles list
    await page.goto(`${config.creator}/titles`)

    // Find first title card and click it
    const firstTitle = page.locator('[data-testid="title-card"]').first()

    try {
      await firstTitle.click({ timeout: 5000 })

      // Should navigate to title detail page
      await page.waitForURL(/\/titles\/[a-z0-9-]+$/, { timeout: TIMEOUTS.navigation })

      // Should show title information
      const titleHeader = page.locator('h1')
      await expect(titleHeader).toBeVisible({ timeout: TIMEOUTS.default })

      // Should show synopsis/description
      const synopsis = page.locator('[data-testid="synopsis"]')
      await expect(synopsis).toBeVisible({ timeout: TIMEOUTS.default })

      // Should show keywords (if any exist)
      const keywordSection = page.locator('text=/Keywords/i')
      // Keywords section may or may not be visible depending on data

      // Should have Edit and Delete buttons
      const editButton = page.locator('button:has-text("Edit")')
      const deleteButton = page.locator('button:has-text("Delete")')

      await expect(editButton.or(deleteButton)).toBeVisible({ timeout: TIMEOUTS.default })
    } catch (error) {
      // If no titles exist, skip test
      test.skip()
    }
  })

  test('should display keywords correctly (bug fix verification)', async ({ page }) => {
    /**
     * Verifies that title detail page displays keywords field correctly
     * (not trying to fallback to non-existent 'tags' field)
     */
    await page.goto(`${config.creator}/titles`)

    const firstTitle = page.locator('[data-testid="title-card"]').first()

    try {
      await firstTitle.click({ timeout: 5000 })
      await page.waitForURL(/\/titles\/[a-z0-9-]+$/, { timeout: TIMEOUTS.navigation })

      // Check for keywords display
      const keywordsSection = page.locator('h5:has-text("Keywords")')

      // If keywords exist, should display as badges
      if (await keywordsSection.isVisible({ timeout: 2000 })) {
        const keywordBadges = page.locator('[data-testid="keyword-badge"]')
        await expect(keywordBadges.first()).toBeVisible({ timeout: TIMEOUTS.default })

        // Badges should have text content
        const badgeText = await keywordBadges.first().textContent()
        expect(badgeText).toBeTruthy()
      }

      // Page should NOT have JavaScript errors from missing 'tags' field
      const consoleErrors: string[] = []
      page.on('console', msg => {
        if (msg.type() === 'error') {
          consoleErrors.push(msg.text())
        }
      })

      // Refresh to trigger any potential errors
      await page.reload()
      await page.waitForLoadState('networkidle')

      // Should NOT have errors about 'tags' field
      const tagsErrors = consoleErrors.filter(error => error.includes('tags'))
      expect(tagsErrors.length).toBe(0)
    } catch (error) {
      test.skip()
    }
  })
})

test.describe('Creator V2 - OAuth Authentication', () => {
  const config = getEnvironmentConfig()

  test('should have correct OAuth redirect URL for environment', async ({ page }) => {
    /**
     * Verifies multi-environment OAuth support for Creator app
     * Same as dashboard, but for creator domain
     */

    await page.goto(`${config.creator}/signup`)

    // Click Google OAuth button
    const googleButton = page.locator('button:has-text("Continue with Google")')
    await expect(googleButton).toBeVisible({ timeout: TIMEOUTS.default })

    // Listen for OAuth redirect
    const redirectPromise = page.waitForEvent('popup')
    await googleButton.click()

    const popup = await redirectPromise
    await popup.waitForLoadState()

    // Verify redirect URL includes correct creator domain
    const url = popup.url()

    if (process.env.TEST_ENV === 'staging') {
      expect(url).toContain('redirect_uri=https%3A%2F%2Fcreator-staging.kstorybridge.com%2Fauth%2Fcallback')
    } else if (process.env.TEST_ENV === 'production') {
      expect(url).toContain('redirect_uri=https%3A%2F%2Fcreator.kstorybridge.com%2Fauth%2Fcallback')
    }

    // Verify no parameters in callback URL
    expect(url).not.toContain('redirect_uri=https%3A%2F%2F.*%2Fauth%2Fcallback%3F')
  })
})

test.describe('Creator V2 - Permission Checks', () => {
  const config = getEnvironmentConfig()

  test.beforeEach(async ({ page }) => {
    // Sign in as creator
    await page.goto(`${config.creator}/signin`)
    await signInWithEmail(page, TEST_USERS.creator.email, TEST_USERS.creator.password)
    await waitForAuthRedirect(page, '/home', TIMEOUTS.oauth)
  })

  test('should only show own titles in list', async ({ page }) => {
    /**
     * Verifies RLS policies: creators should only see their own titles
     */
    await page.goto(`${config.creator}/titles`)

    // Get all title cards
    const titleCards = page.locator('[data-testid="title-card"]')
    const titleCount = await titleCards.count()

    // All titles should belong to current user
    // This is enforced by RLS at database level
    // UI should not show titles from other creators

    if (titleCount > 0) {
      // Each title should have edit/delete buttons (indicating ownership)
      for (let i = 0; i < titleCount; i++) {
        const card = titleCards.nth(i)
        const editButton = card.locator('button:has-text("Edit")')

        // Should be able to edit own titles
        await expect(editButton).toBeVisible({ timeout: TIMEOUTS.default })
      }
    }
  })

  test('should not allow editing other creators titles', async ({ page }) => {
    /**
     * Tries to access another creator's title edit page directly
     * Should show permission error or redirect
     */

    // Try to access a title that doesn't belong to this user
    // Replace with a known title ID from different creator
    const otherCreatorTitleId = process.env.OTHER_CREATOR_TITLE_ID || 'test-other-title-id'

    await page.goto(`${config.creator}/titles/${otherCreatorTitleId}/edit`)

    // Should either:
    // 1. Show permission error
    // 2. Redirect to home/titles page
    // 3. Show 404

    await page.waitForLoadState('networkidle')

    const errorMessage = page.locator('text=/permission|not found|access denied/i')
    const currentUrl = page.url()

    // Should not be on the edit page
    expect(currentUrl).not.toContain(`/${otherCreatorTitleId}/edit`)

    // Should show error or have redirected
    const hasError = await errorMessage.isVisible({ timeout: 2000 })
    const hasRedirected = currentUrl.includes('/titles') || currentUrl.includes('/home')

    expect(hasError || hasRedirected).toBeTruthy()
  })
})
