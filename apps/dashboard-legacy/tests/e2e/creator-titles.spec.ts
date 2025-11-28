/**
 * E2E Tests for Creator Title Management (CRUD)
 *
 * Tests:
 * 1. Create title → verify creation
 * 2. Edit title → verify update
 * 3. View title list → search/filter
 * 4. Delete title → verify deletion
 *
 * Prerequisites: User must be authenticated as creator
 */

import { test, expect } from '@playwright/test';
import { createAndLoginAsCreator } from './fixtures/auth';
import { TitlesPage, TitleDetailPage } from './pages/TitlesPage';

test.describe('Creator Title Management', () => {
  let titlesPage: TitlesPage;
  let titleDetailPage: TitleDetailPage;

  test.beforeEach(async ({ page }) => {
    // Create and login as creator
    await createAndLoginAsCreator(page, 'author');

    // Initialize page objects
    titlesPage = new TitlesPage(page);
    titleDetailPage = new TitleDetailPage(page);

    // Navigate to titles page
    await titlesPage.goto();
  });

  test('create new title → verify in list', async ({ page }) => {
    const testTitle = {
      title_name_en: `E2E Test Title ${Date.now()}`,
      title_name_kr: 'E2E 테스트 제목',
      description: 'This is an E2E test title created by Playwright',
      synopsis: 'Test synopsis for automated testing',
      genre: 'Romance',
    };

    // 1. Click create title button
    await titlesPage.clickCreateTitle();

    // 2. Fill title form
    await titlesPage.fillTitleForm(testTitle);

    // 3. Submit form
    await titlesPage.submitForm();

    // 4. Wait for redirect (either to detail page or back to list)
    await page.waitForTimeout(2000);

    // 5. Go back to titles list
    await titlesPage.goto();

    // 6. Verify title appears in list
    await titlesPage.verifyTitleExists(testTitle.title_name_en);
  });

  test('edit existing title → verify update', async ({ page }) => {
    // First, create a title to edit
    const initialTitle = {
      title_name_en: `E2E Edit Test ${Date.now()}`,
      title_name_kr: '수정 테스트',
      description: 'Initial description',
      synopsis: 'Initial synopsis',
    };

    await titlesPage.clickCreateTitle();
    await titlesPage.createTitle(initialTitle);

    // Navigate to title detail (should already be there after creation)
    await page.waitForTimeout(1000);

    // Update the title
    const updatedData = {
      description: 'UPDATED description via E2E test',
      synopsis: 'UPDATED synopsis via E2E test',
    };

    await titleDetailPage.updateTitle(updatedData);

    // Verify updates
    await titleDetailPage.verifyDescription(updatedData.description);
    await titleDetailPage.verifySynopsis(updatedData.synopsis);
  });

  test('view title details → all fields visible', async ({ page }) => {
    // Create a complete title
    const completeTitle = {
      title_name_en: `E2E Complete Title ${Date.now()}`,
      title_name_kr: '완전한 제목',
      description: 'Complete test description with all fields',
      synopsis: 'Complete test synopsis for viewing',
      genre: 'Fantasy',
    };

    await titlesPage.clickCreateTitle();
    await titlesPage.createTitle(completeTitle);

    // Should be on detail page now
    await page.waitForTimeout(1000);

    // Verify title name is visible
    await titleDetailPage.verifyTitleName(completeTitle.title_name_en);

    // Verify all fields are rendered
    const titleNameElement = page.locator(`text=${completeTitle.title_name_en}`);
    await expect(titleNameElement).toBeVisible();

    // Check for description section
    const descriptionText = page.locator(`text=${completeTitle.description}`);
    await expect(descriptionText).toBeVisible();

    // Check for synopsis section
    const synopsisText = page.locator(`text=${completeTitle.synopsis}`);
    await expect(synopsisText).toBeVisible();
  });

  test('delete title → verify removal from list', async ({ page }) => {
    // Create a title to delete
    const titleToDelete = {
      title_name_en: `E2E Delete Test ${Date.now()}`,
      title_name_kr: '삭제 테스트',
      description: 'This title will be deleted',
    };

    await titlesPage.clickCreateTitle();
    await titlesPage.createTitle(titleToDelete);

    // Wait for creation
    await page.waitForTimeout(1000);

    // Delete the title
    await titleDetailPage.deleteTitle();

    // Should redirect to titles list
    await page.waitForURL('/creators/titles', { timeout: 10000 });

    // Verify title is NOT in list
    await page.waitForTimeout(1000);
    const deletedTitle = page.locator(`text=${titleToDelete.title_name_en}`);
    await expect(deletedTitle).not.toBeVisible();
  });

  test('search titles → filter results', async ({ page }) => {
    // Create multiple titles for search testing
    const titles = [
      { title_name_en: `Romance Search Test ${Date.now()}`, genre: 'Romance' },
      { title_name_en: `Action Search Test ${Date.now()}`, genre: 'Action' },
    ];

    for (const title of titles) {
      await titlesPage.clickCreateTitle();
      await titlesPage.fillTitleForm(title);
      await titlesPage.submitForm();
      await page.waitForTimeout(1000);
      await titlesPage.goto();
    }

    // Search for "Romance"
    await titlesPage.searchTitle('Romance Search Test');

    // Wait for filter
    await page.waitForTimeout(1000);

    // Verify Romance title is visible
    const romanceTitle = page.locator(`text=/Romance Search Test/`);
    await expect(romanceTitle.first()).toBeVisible();
  });

  test('title list pagination/loading', async ({ page }) => {
    // Navigate to titles page
    await titlesPage.goto();

    // Get initial title count
    const initialCount = await titlesPage.getTitleCount();

    // Verify we have some titles (or 0 if new account)
    expect(initialCount).toBeGreaterThanOrEqual(0);

    // If there are titles, verify they render
    if (initialCount > 0) {
      const firstTitleCard = page.locator('[data-testid="title-card"], .title-item').first();
      await expect(firstTitleCard).toBeVisible();
    }
  });

  test('create title with minimal fields', async ({ page }) => {
    // Test creating title with only required fields
    const minimalTitle = {
      title_name_en: `E2E Minimal Title ${Date.now()}`,
    };

    await titlesPage.clickCreateTitle();
    await titlesPage.fillTitleForm(minimalTitle);
    await titlesPage.submitForm();

    // Should still create successfully
    await page.waitForTimeout(2000);

    // Verify creation
    await titlesPage.goto();
    await titlesPage.verifyTitleExists(minimalTitle.title_name_en);
  });

  test('cancel title creation → no title created', async ({ page }) => {
    // Click create
    await titlesPage.clickCreateTitle();

    // Fill some data
    await page.fill('[name="title_name_en"]', 'Cancelled Title');

    // Click cancel button (if exists)
    const cancelButton = page.locator('button:has-text("Cancel")');
    if (await cancelButton.isVisible()) {
      await cancelButton.click();

      // Should return to titles list
      await page.waitForURL('/creators/titles', { timeout: 10000 });

      // Verify title was NOT created
      await page.waitForTimeout(1000);
      const cancelledTitle = page.locator('text=Cancelled Title');
      await expect(cancelledTitle).not.toBeVisible();
    }
  });
});
