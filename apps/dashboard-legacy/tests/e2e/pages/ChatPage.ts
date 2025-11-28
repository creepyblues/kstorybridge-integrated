/**
 * Page Object Model for Chat Page
 *
 * Provides reusable methods for interacting with the AI chatbot
 */

import { Page, Locator, expect } from '@playwright/test';

export class ChatPage {
  readonly page: Page;
  readonly chatInput: Locator;
  readonly sendButton: Locator;
  readonly messages: Locator;
  readonly latestResponse: Locator;

  constructor(page: Page) {
    this.page = page;
    this.chatInput = page.locator('textarea[placeholder*="Ask"], textarea[placeholder*="message"]');
    this.sendButton = page.locator('button[type="submit"]').last();
    this.messages = page.locator('[data-message-role]');
    this.latestResponse = page.locator('[data-message-role="assistant"]').last();
  }

  async goto() {
    await this.page.goto('/chat');
    await this.page.waitForLoadState('networkidle');
  }

  async sendMessage(message: string) {
    await this.chatInput.fill(message);
    await this.sendButton.click();
  }

  async waitForResponse(timeout: number = 15000) {
    // Wait for loading state to appear and disappear
    await this.page.waitForSelector('[data-loading="true"]', { timeout: 2000 }).catch(() => {});
    await this.page.waitForSelector('[data-loading="false"]', { timeout }).catch(() => {});

    // Wait for new response to appear
    await this.latestResponse.waitFor({ state: 'visible', timeout });
  }

  async getLatestResponse(): Promise<string> {
    return await this.latestResponse.textContent() || '';
  }

  async getAllMessages(): Promise<string[]> {
    const messages = await this.messages.all();
    return Promise.all(messages.map(msg => msg.textContent() || ''));
  }

  async getTitleLinks(): Promise<number> {
    const links = this.latestResponse.locator('a[href*="/titles/"]');
    return await links.count();
  }

  async clickFirstTitleLink() {
    const firstLink = this.latestResponse.locator('a[href*="/titles/"]').first();
    await firstLink.click();
  }

  async verifyResponseContains(text: string) {
    const response = await this.getLatestResponse();
    expect(response.toLowerCase()).toContain(text.toLowerCase());
  }

  async verifyResponseNotEmpty() {
    const response = await this.getLatestResponse();
    expect(response.length).toBeGreaterThan(50); // Meaningful response
  }

  async verifyHasTitleLinks() {
    const linkCount = await this.getTitleLinks();
    expect(linkCount).toBeGreaterThan(0);
  }

  async clearChat() {
    // Look for clear/new chat button
    const clearButton = this.page.locator('button:has-text("New"), button:has-text("Clear")');
    if (await clearButton.isVisible()) {
      await clearButton.click();
    }
  }
}
