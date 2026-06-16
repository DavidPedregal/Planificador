import { test, expect } from '@playwright/test';

test.describe('Settings', () => {
    test.beforeEach(async ({ page }) => {
        await page.goto('/settings');
        await expect(page.locator('.settings-page')).toBeVisible();
    });

    test('all sections are visible', async ({ page }) => {
        await expect(page.locator('.settings-section')).toHaveCount(4); // Appearance, Calendar, Planner, Account
    });

    test('can toggle to light theme and back', async ({ page }) => {
        await page.locator('.settings-theme-btn').last().click(); // Light button
        await expect(page.locator('html')).toHaveAttribute('data-theme', 'light');

        await page.locator('.settings-theme-btn').first().click(); // Dark button
        await expect(page.locator('html')).toHaveAttribute('data-theme', 'dark');
    });

    test('can save new maxTime and it persists after reload', async ({ page }) => {
        const input = page.locator('.settings-section').last().locator('..').locator('.settings-number-input');
        // Use the Planner section specifically
        const plannerSection = page.locator('.settings-section').filter({ has: page.locator('.settings-number-input') }).last();
        const maxTimeInput = plannerSection.locator('.settings-number-input');
        const saveBtn = plannerSection.locator('.settings-save-btn');

        await maxTimeInput.fill('25');
        await saveBtn.click();

        await page.goto('/settings');
        await expect(plannerSection.locator('.settings-number-input')).toHaveValue('25');

        // Restore original value
        await maxTimeInput.fill('10');
        await saveBtn.click();
    });

    test('maxTime shows error for invalid value', async ({ page }) => {
        const plannerSection = page.locator('.settings-section').filter({ has: page.locator('.settings-number-input') }).last();
        const maxTimeInput = plannerSection.locator('.settings-number-input');
        const saveBtn = plannerSection.locator('.settings-save-btn');

        await maxTimeInput.fill('0');
        await saveBtn.click();
        await expect(page.locator('.settings-error')).toBeVisible();
    });
});
