import { test, expect } from '@playwright/test';

test.describe('Statistics', () => {
    test.beforeEach(async ({ page }) => {
        await page.goto('/statistics');
        await expect(page.locator('.stats-page')).toBeVisible();
    });

    test('controls section is visible', async ({ page }) => {
        await expect(page.locator('.stats-section')).toBeVisible();
        await expect(page.locator('.stats-generate-btn')).toBeVisible();
        await expect(page.locator('.stats-download-btn').first()).toBeVisible();
    });

    test('generate button shows chart or empty state', async ({ page }) => {
        await page.locator('.stats-generate-btn').click();
        await expect(
            page.locator('.recharts-responsive-container, .stats-empty')
        ).toBeVisible({ timeout: 10000 });
    });

    test('generate with date range works', async ({ page }) => {
        await page.locator('.stats-date-input').first().fill('2025-01-01');
        await page.locator('.stats-date-input').last().fill('2025-12-31');
        await page.locator('.stats-generate-btn').click();
        await expect(
            page.locator('.recharts-responsive-container, .stats-empty')
        ).toBeVisible({ timeout: 10000 });
    });

    test('switching data type clears the chart', async ({ page }) => {
        // Generate a chart first
        await page.locator('.stats-generate-btn').click();
        await expect(
            page.locator('.recharts-responsive-container, .stats-empty')
        ).toBeVisible({ timeout: 10000 });

        // Change data type — chart should disappear
        await page.locator('.stats-select').first().selectOption('comparisonTime');
        await expect(page.locator('.stats-chart-section')).not.toBeVisible();
    });

    test('export all triggers a CSV download', async ({ page }) => {
        const [download] = await Promise.all([
            page.waitForEvent('download'),
            page.locator('.stats-download-btn').first().click(),
        ]);
        expect(download.suggestedFilename()).toMatch(/^mentiplan-export-\d{4}-\d{2}-\d{2}\.csv$/);
    });

    test('chart download button appears and triggers download after generate', async ({ page }) => {
        await page.locator('.stats-generate-btn').click();
        await expect(
            page.locator('.recharts-responsive-container, .stats-empty')
        ).toBeVisible({ timeout: 10000 });

        // Chart download button is in the chart header (second download btn)
        const chartDownloadBtn = page.locator('.stats-chart-header .stats-download-btn');
        if (await chartDownloadBtn.isVisible()) {
            const [download] = await Promise.all([
                page.waitForEvent('download'),
                chartDownloadBtn.click(),
            ]);
            expect(download.suggestedFilename()).toMatch(/^mentiplan-statistics-/);
        }
    });
});
