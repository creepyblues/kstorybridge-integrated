/**
 * E2E Tests for AI Chatbot Flows
 *
 * Tests:
 * 1. Basic query → vector search → response with title links
 * 2. Follow-up query → contextual response (Phase 4 feature)
 * 3. Multiple query intents (discovery, comparison, information, recommendation)
 * 4. Title link click → title detail page
 *
 * Prerequisites: User must be authenticated as buyer (basic tier minimum)
 */

import { test, expect } from '@playwright/test';
import { createAndLoginAsBuyer } from './fixtures/auth';
import { ChatPage } from './pages/ChatPage';

test.describe('AI Chatbot Flows', () => {
  let chatPage: ChatPage;

  test.beforeEach(async ({ page }) => {
    // Create and login as buyer
    await createAndLoginAsBuyer(page, 'basic');

    // Initialize chat page
    chatPage = new ChatPage(page);
    await chatPage.goto();
  });

  test('discovery query → response with title recommendations', async ({ page }) => {
    const query = 'Show me romantic webtoons with strong female leads';

    // 1. Send discovery query
    await chatPage.sendMessage(query);

    // 2. Wait for response
    await chatPage.waitForResponse();

    // 3. Verify response is not empty
    await chatPage.verifyResponseNotEmpty();

    // 4. Verify response contains titles
    await chatPage.verifyResponseContains('title');

    // 5. Verify response has clickable title links
    await chatPage.verifyHasTitleLinks();
  });

  test('comparison query → structured comparison response', async ({ page }) => {
    const query = 'Compare "Love in Seoul" and "Destiny Partners"';

    // 1. Send comparison query
    await chatPage.sendMessage(query);

    // 2. Wait for response
    await chatPage.waitForResponse();

    // 3. Verify response mentions both titles
    const response = await chatPage.getLatestResponse();
    expect(response.toLowerCase()).toContain('love in seoul');
    expect(response.toLowerCase()).toContain('destiny partners');

    // 4. Verify response has comparison elements
    expect(response.length).toBeGreaterThan(100); // Substantive comparison
  });

  test('information query → detailed title information', async ({ page }) => {
    const query = 'Tell me about "Fantasy Chronicles"';

    // 1. Send information query
    await chatPage.sendMessage(query);

    // 2. Wait for response
    await chatPage.waitForResponse();

    // 3. Verify response contains title name
    await chatPage.verifyResponseContains('Fantasy Chronicles');

    // 4. Verify response has details (should be long)
    const response = await chatPage.getLatestResponse();
    expect(response.length).toBeGreaterThan(150);
  });

  test('follow-up query → contextual response (Phase 4)', async ({ page }) => {
    // 1. Send initial query
    await chatPage.sendMessage('Tell me about romantic webtoons');
    await chatPage.waitForResponse();
    const firstResponse = await chatPage.getLatestResponse();

    // 2. Send follow-up query
    await chatPage.sendMessage('Tell me more about the first one');
    await chatPage.waitForResponse();
    const followUpResponse = await chatPage.getLatestResponse();

    // 3. Verify follow-up is different (not repeating)
    expect(followUpResponse).not.toBe(firstResponse);

    // 4. Verify follow-up is contextual (mentions a title)
    expect(followUpResponse.length).toBeGreaterThan(100);
  });

  test('title link click → navigate to title detail', async ({ page }) => {
    // 1. Send query that returns titles
    await chatPage.sendMessage('Show me action webtoons');
    await chatPage.waitForResponse();

    // 2. Verify title links exist
    const linkCount = await chatPage.getTitleLinks();
    expect(linkCount).toBeGreaterThan(0);

    // 3. Click first title link
    await chatPage.clickFirstTitleLink();

    // 4. Verify navigation to title detail page
    await page.waitForURL(/\/titles\/\d+/, { timeout: 10000 });
    expect(page.url()).toMatch(/\/titles\/\d+/);

    // 5. Verify title detail page loaded
    const titleName = page.locator('h1, [data-testid="title-name"]');
    await expect(titleName).toBeVisible();
  });

  test('multiple queries → conversation history maintained', async ({ page }) => {
    // 1. Send first query
    await chatPage.sendMessage('Tell me about romantic webtoons');
    await chatPage.waitForResponse();

    // 2. Send second query
    await chatPage.sendMessage('What about action webtoons?');
    await chatPage.waitForResponse();

    // 3. Send third query
    await chatPage.sendMessage('Compare these two genres');
    await chatPage.waitForResponse();

    // 4. Verify all messages are visible
    const allMessages = await chatPage.getAllMessages();
    expect(allMessages.length).toBeGreaterThanOrEqual(6); // 3 queries + 3 responses
  });

  test('empty query → error handling', async ({ page }) => {
    // 1. Try to send empty query
    await chatPage.sendMessage('');

    // 2. Send button should be disabled or nothing happens
    await page.waitForTimeout(1000);

    // 3. Should still be on chat page (no error crash)
    expect(page.url()).toContain('/chat');
  });

  test('very long query → response handling', async ({ page }) => {
    const longQuery = 'Tell me about romantic webtoons with strong female leads, complex character development, beautiful art style, engaging plot twists, emotional depth, cultural authenticity, and unique storytelling perspectives '.repeat(5);

    // 1. Send long query
    await chatPage.sendMessage(longQuery.slice(0, 500)); // Truncate if needed

    // 2. Wait for response (might take longer)
    await chatPage.waitForResponse(20000); // 20 second timeout

    // 3. Verify response received
    await chatPage.verifyResponseNotEmpty();
  });

  test('recommendation query → personalized suggestions', async ({ page }) => {
    const query = 'Recommend titles similar to "Love in Seoul"';

    // 1. Send recommendation query
    await chatPage.sendMessage(query);

    // 2. Wait for response
    await chatPage.waitForResponse();

    // 3. Verify response has recommendations
    await chatPage.verifyResponseNotEmpty();
    await chatPage.verifyHasTitleLinks();

    // 4. Verify mentions "similar" or "recommend"
    const response = await chatPage.getLatestResponse();
    const hasSimilarLanguage =
      response.toLowerCase().includes('similar') ||
      response.toLowerCase().includes('recommend') ||
      response.toLowerCase().includes('like');
    expect(hasSimilarLanguage).toBeTruthy();
  });
});
