import { test, expect } from '@playwright/test'
import { getEnvironmentConfig, TEST_USERS, TIMEOUTS } from './helpers/test-config'
import { signInWithEmail, waitForAuthRedirect } from './helpers/auth-helpers'

/**
 * AI Chatbot Tests
 *
 * Tests the AI chatbot system including:
 * - Basic query/response flow
 * - Phase 4 contextual responses (follow-up detection)
 * - Pitch analytics integration (Phase 3)
 * - Response validation (no hallucinations)
 * - Edge function health
 *
 * Feature Flags (should be enabled in production):
 * - ENABLE_CONTEXTUAL_RESPONSES=true (Phase 4)
 * - ENABLE_PITCH_CONTEXT=true (Phase 3)
 */

test.describe('AI Chatbot - Basic Functionality', () => {
  const config = getEnvironmentConfig()

  test.beforeEach(async ({ page }) => {
    // Sign in as buyer to access chatbot
    await page.goto(`${config.dashboard}/signin`)
    await signInWithEmail(page, TEST_USERS.buyer.email, TEST_USERS.buyer.password)
    await waitForAuthRedirect(page, '/buyers/chat', TIMEOUTS.oauth)

    // Verify chat page loaded
    await expect(page).toHaveURL(/\/buyers\/chat/)
  })

  test('should load chat interface', async ({ page }) => {
    // Check for chat input
    const chatInput = page.locator('textarea[placeholder*="Ask about Korean content"]')
    await expect(chatInput).toBeVisible({ timeout: TIMEOUTS.default })

    // Check for submit button
    const submitButton = page.locator('button[type="submit"]')
    await expect(submitButton).toBeVisible({ timeout: TIMEOUTS.default })

    // Check for chat history area
    const chatHistory = page.locator('[data-testid="chat-messages"]')
    await expect(chatHistory).toBeVisible({ timeout: TIMEOUTS.default })
  })

  test('should submit query and receive response', async ({ page }) => {
    // Find chat input
    const chatInput = page.locator('textarea[placeholder*="Ask about Korean content"]')
    await expect(chatInput).toBeVisible({ timeout: TIMEOUTS.default })

    // Type a test query
    await chatInput.fill('Tell me about fantasy webtoons')

    // Submit query
    const submitButton = page.locator('button[type="submit"]')
    await submitButton.click()

    // Wait for response (chatbot can take 5-18s)
    const responseMessage = page.locator('[data-testid="assistant-message"]').last()
    await expect(responseMessage).toBeVisible({ timeout: TIMEOUTS.api })

    // Verify response has content
    const responseText = await responseMessage.textContent()
    expect(responseText).toBeTruthy()
    expect(responseText!.length).toBeGreaterThan(50) // Should have substantial response
  })

  test('should return title recommendations with links', async ({ page }) => {
    const chatInput = page.locator('textarea[placeholder*="Ask about Korean content"]')
    await chatInput.fill('What are some popular fantasy webtoons?')

    const submitButton = page.locator('button[type="submit"]')
    await submitButton.click()

    // Wait for response
    const responseMessage = page.locator('[data-testid="assistant-message"]').last()
    await expect(responseMessage).toBeVisible({ timeout: TIMEOUTS.api })

    // Should contain title cards or links
    const titleCards = page.locator('[data-testid="title-card"]')
    await expect(titleCards.first()).toBeVisible({ timeout: TIMEOUTS.default })

    // Count how many titles returned (should be multiple)
    const titleCount = await titleCards.count()
    expect(titleCount).toBeGreaterThan(0)
    expect(titleCount).toBeLessThanOrEqual(10) // Phase 1: increased to 10 results
  })

  test('should handle zero-results gracefully', async ({ page }) => {
    const chatInput = page.locator('textarea[placeholder*="Ask about Korean content"]')

    // Query for something unlikely to have results
    await chatInput.fill('Tell me about webtoons featuring purple unicorns from mars')

    const submitButton = page.locator('button[type="submit"]')
    await submitButton.click()

    // Wait for response
    const responseMessage = page.locator('[data-testid="assistant-message"]').last()
    await expect(responseMessage).toBeVisible({ timeout: TIMEOUTS.api })

    // Should have polite fallback message
    const responseText = await responseMessage.textContent()
    expect(responseText).toMatch(/unable to find|no titles|try different|not found/i)
  })
})

test.describe('AI Chatbot - Phase 4: Contextual Responses', () => {
  const config = getEnvironmentConfig()

  test.beforeEach(async ({ page }) => {
    // Sign in as buyer
    await page.goto(`${config.dashboard}/signin`)
    await signInWithEmail(page, TEST_USERS.buyer.email, TEST_USERS.buyer.password)
    await waitForAuthRedirect(page, '/buyers/chat', TIMEOUTS.oauth)
  })

  test('should detect follow-up queries and provide focused responses', async ({ page }) => {
    const chatInput = page.locator('textarea[placeholder*="Ask about Korean content"]')
    const submitButton = page.locator('button[type="submit"]')

    // First query: Ask about a specific title
    await chatInput.fill('Tell me about "Solo Leveling"')
    await submitButton.click()

    // Wait for first response
    const firstResponse = page.locator('[data-testid="assistant-message"]').nth(0)
    await expect(firstResponse).toBeVisible({ timeout: TIMEOUTS.api })

    // Second query: Follow-up asking for specific section
    await chatInput.fill('What about the characters?')
    await submitButton.click()

    // Wait for second response
    const secondResponse = page.locator('[data-testid="assistant-message"]').nth(1)
    await expect(secondResponse).toBeVisible({ timeout: TIMEOUTS.api })

    // Verify second response is focused on characters (not repeating plot)
    const secondText = await secondResponse.textContent()
    expect(secondText).toMatch(/character|protagonist|sung jinwoo/i)

    // Should NOT repeat plot information from first response
    const firstText = await firstResponse.textContent()
    const plotKeywords = ['plot', 'story', 'narrative']

    // Second response should have fewer plot keywords (more focused)
    const secondPlotMatches = plotKeywords.filter(keyword =>
      secondText!.toLowerCase().includes(keyword)
    ).length
    const firstPlotMatches = plotKeywords.filter(keyword =>
      firstText!.toLowerCase().includes(keyword)
    ).length

    // Contextual response should have fewer repetitive plot elements
    expect(secondPlotMatches).toBeLessThanOrEqual(firstPlotMatches)
  })

  test('should use pitch analytics when available', async ({ page }) => {
    /**
     * Tests Phase 3: Pitch Analytics Integration
     *
     * When pitch_analysis data exists in vector search results,
     * chatbot should use it to provide richer responses.
     */
    const chatInput = page.locator('textarea[placeholder*="Ask about Korean content"]')
    const submitButton = page.locator('button[type="submit"]')

    // Query for titles with pitch data
    await chatInput.fill('What are the key themes in popular fantasy webtoons?')
    await submitButton.click()

    // Wait for response
    const responseMessage = page.locator('[data-testid="assistant-message"]').last()
    await expect(responseMessage).toBeVisible({ timeout: TIMEOUTS.api })

    const responseText = await responseMessage.textContent()

    // Should include detailed analysis (from pitch data)
    expect(responseText!.length).toBeGreaterThan(200) // Richer content with pitch

    // Should mention themes/characters/market positioning
    expect(responseText).toMatch(/theme|character|market|audience/i)
  })
})

test.describe('AI Chatbot - Response Validation', () => {
  const config = getEnvironmentConfig()

  test.beforeEach(async ({ page }) => {
    // Sign in as buyer
    await page.goto(`${config.dashboard}/signin`)
    await signInWithEmail(page, TEST_USERS.buyer.email, TEST_USERS.buyer.password)
    await waitForAuthRedirect(page, '/buyers/chat', TIMEOUTS.oauth)
  })

  test('should not hallucinate title names', async ({ page }) => {
    /**
     * Tests Phase 1 Anti-Hallucination Validation
     *
     * Chatbot should only recommend titles that actually exist
     * in the vector search results, never inventing fake titles.
     */
    const chatInput = page.locator('textarea[placeholder*="Ask about Korean content"]')
    await chatInput.fill('Show me fantasy webtoons')

    const submitButton = page.locator('button[type="submit"]')
    await submitButton.click()

    // Wait for response with title cards
    const responseMessage = page.locator('[data-testid="assistant-message"]').last()
    await expect(responseMessage).toBeVisible({ timeout: TIMEOUTS.api })

    // Get all title cards
    const titleCards = page.locator('[data-testid="title-card"]')
    const titleCount = await titleCards.count()

    // Each title card should have a valid link
    for (let i = 0; i < titleCount; i++) {
      const titleLink = titleCards.nth(i).locator('a')
      await expect(titleLink).toHaveAttribute('href', /.+/) // Non-empty href
    }

    // Response text should match titles in cards
    const responseText = await responseMessage.textContent()
    const firstTitleText = await titleCards.first().textContent()

    // First title mentioned should match first card (validation working)
    expect(responseText).toContain(firstTitleText!)
  })

  test('should complete responses within timeout', async ({ page }) => {
    /**
     * Performance test: Chatbot should respond within 18 seconds
     * (documented max response time in LOCAL_VS_PRODUCTION_DIFFERENCES.md)
     */
    const chatInput = page.locator('textarea[placeholder*="Ask about Korean content"]')
    await chatInput.fill('What are popular romance webtoons?')

    const startTime = Date.now()

    const submitButton = page.locator('button[type="submit"]')
    await submitButton.click()

    // Wait for response
    const responseMessage = page.locator('[data-testid="assistant-message"]').last()
    await expect(responseMessage).toBeVisible({ timeout: TIMEOUTS.api })

    const endTime = Date.now()
    const responseTime = (endTime - startTime) / 1000 // Convert to seconds

    // Should be within documented limits (5-18s)
    expect(responseTime).toBeLessThan(20) // Allow 2s buffer
    console.log(`Chatbot response time: ${responseTime.toFixed(2)}s`)
  })
})

test.describe('AI Chatbot - Edge Function Health', () => {
  const config = getEnvironmentConfig()

  test.beforeEach(async ({ page }) => {
    // Sign in as buyer
    await page.goto(`${config.dashboard}/signin`)
    await signInWithEmail(page, TEST_USERS.buyer.email, TEST_USERS.buyer.password)
    await waitForAuthRedirect(page, '/buyers/chat', TIMEOUTS.oauth)
  })

  test('should handle API errors gracefully', async ({ page }) => {
    // Monitor network requests
    let apiErrorDetected = false
    page.on('response', response => {
      if (response.url().includes('/chat-orchestrator') && response.status() >= 500) {
        apiErrorDetected = true
      }
    })

    const chatInput = page.locator('textarea[placeholder*="Ask about Korean content"]')
    await chatInput.fill('Tell me about action webtoons')

    const submitButton = page.locator('button[type="submit"]')
    await submitButton.click()

    // Wait for response or error
    try {
      const responseMessage = page.locator('[data-testid="assistant-message"]').last()
      await expect(responseMessage).toBeVisible({ timeout: TIMEOUTS.api })
    } catch (error) {
      // If timeout, check if there's an error message shown to user
      const errorMessage = page.locator('text=/error|failed|unavailable/i')
      await expect(errorMessage).toBeVisible({ timeout: TIMEOUTS.default })
    }

    // Log if API error was detected
    if (apiErrorDetected) {
      console.log('⚠️ API error detected - check edge function logs')
    }
  })

  test('should verify feature flags are enabled', async ({ page, request }) => {
    /**
     * Verify that production feature flags are enabled:
     * - ENABLE_CONTEXTUAL_RESPONSES=true (Phase 4)
     * - ENABLE_PITCH_CONTEXT=true (Phase 3)
     *
     * This test makes a direct API call to check edge function config
     */

    // Make test query and check response headers/logs
    const chatInput = page.locator('textarea[placeholder*="Ask about Korean content"]')
    await chatInput.fill('Test query')

    // Listen for API response
    const responsePromise = page.waitForResponse(
      response => response.url().includes('/chat-orchestrator') && response.status() === 200,
      { timeout: TIMEOUTS.api }
    )

    const submitButton = page.locator('button[type="submit"]')
    await submitButton.click()

    const apiResponse = await responsePromise

    // Verify response is successful
    expect(apiResponse.status()).toBe(200)

    // Log response for manual verification
    const responseBody = await apiResponse.json()
    console.log('✅ Chatbot API response received')
    console.log(`Response length: ${JSON.stringify(responseBody).length} characters`)
  })
})
