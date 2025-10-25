/**
 * Page Object Model for Titles Page (Creator)
 *
 * Provides reusable methods for title management
 */

import { Page, Locator, expect } from '@playwright/test';

export class TitlesPage {
  readonly page: Page;
  readonly createButton: Locator;
  readonly titlesList: Locator;

  constructor(page: Page) {
    this.page = page;
    this.createButton = page.locator('button:has-text("Create"), button:has-text("Add Title")');
    this.titlesList = page.locator('[data-testid="titles-list"], .titles-grid');
  }

  async goto() {
    await this.page.goto('/creators/titles');
    await this.page.waitForLoadState('networkidle');
  }

  async clickCreateTitle() {
    await this.createButton.click();
  }

  async fillTitleForm(data: {
    title_name_en: string;
    title_name_kr?: string;
    description?: string;
    synopsis?: string;
    genre?: string;
  }) {
    await this.page.fill('[name="title_name_en"]', data.title_name_en);

    if (data.title_name_kr) {
      await this.page.fill('[name="title_name_kr"]', data.title_name_kr);
    }

    if (data.description) {
      await this.page.fill('[name="description"]', data.description);
    }

    if (data.synopsis) {
      await this.page.fill('[name="synopsis"]', data.synopsis);
    }

    if (data.genre) {
      await this.page.selectOption('[name="genre"]', data.genre);
    }
  }

  async submitForm() {
    await this.page.click('button[type="submit"]');
  }

  async createTitle(data: {
    title_name_en: string;
    title_name_kr?: string;
    description?: string;
    synopsis?: string;
    genre?: string;
  }) {
    await this.fillTitleForm(data);
    await this.submitForm();

    // Wait for redirect to title detail page or success
    await this.page.waitForURL(/\/creators\/titles\/\d+|\/creators\/titles/, { timeout: 10000 });
  }

  async searchTitle(query: string) {
    const searchInput = this.page.locator('input[placeholder*="Search"], input[type="search"]');
    await searchInput.fill(query);
  }

  async getTitleCount(): Promise<number> {
    const titles = this.page.locator('[data-testid="title-card"], .title-item');
    return await titles.count();
  }

  async clickTitleByName(name: string) {
    const titleCard = this.page.locator(`text=${name}`).first();
    await titleCard.click();
  }

  async verifyTitleExists(name: string) {
    const titleCard = this.page.locator(`text=${name}`);
    await expect(titleCard).toBeVisible();
  }
}

export class TitleDetailPage {
  readonly page: Page;
  readonly editButton: Locator;
  readonly deleteButton: Locator;
  readonly titleName: Locator;
  readonly description: Locator;
  readonly synopsis: Locator;

  constructor(page: Page) {
    this.page = page;
    this.editButton = page.locator('button:has-text("Edit")');
    this.deleteButton = page.locator('button:has-text("Delete")');
    this.titleName = page.locator('h1, [data-testid="title-name"]');
    this.description = page.locator('[data-testid="title-description"]');
    this.synopsis = page.locator('[data-testid="title-synopsis"]');
  }

  async clickEdit() {
    await this.editButton.click();
  }

  async updateTitle(data: {
    title_name_en?: string;
    description?: string;
    synopsis?: string;
  }) {
    await this.clickEdit();

    if (data.title_name_en) {
      await this.page.fill('[name="title_name_en"]', data.title_name_en);
    }

    if (data.description) {
      await this.page.fill('[name="description"]', data.description);
    }

    if (data.synopsis) {
      await this.page.fill('[name="synopsis"]', data.synopsis);
    }

    await this.page.click('button[type="submit"]');

    // Wait for update success
    await this.page.waitForTimeout(1000);
  }

  async deleteTitle() {
    await this.deleteButton.click();

    // Confirm deletion if modal appears
    const confirmButton = this.page.locator('button:has-text("Confirm"), button:has-text("Delete")');
    if (await confirmButton.isVisible({ timeout: 2000 })) {
      await confirmButton.click();
    }

    // Wait for redirect to titles list
    await this.page.waitForURL('/creators/titles', { timeout: 10000 });
  }

  async verifyTitleName(expectedName: string) {
    await expect(this.titleName).toContainText(expectedName);
  }

  async verifyDescription(expectedDescription: string) {
    await expect(this.description).toContainText(expectedDescription);
  }

  async verifySynopsis(expectedSynopsis: string) {
    await expect(this.synopsis).toContainText(expectedSynopsis);
  }
}
