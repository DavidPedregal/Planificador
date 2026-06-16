import { test, expect } from '@playwright/test';

test.describe('Auth guard', () => {
    test('unauthenticated users are redirected to landing page', async ({ browser }) => {
        // Fresh context with no stored auth
        const ctx = await browser.newContext({ storageState: undefined });
        const page = await ctx.newPage();
        await page.goto('/home');
        await expect(page).toHaveURL('/');
        await ctx.close();
    });

    test('authenticated users reach /home', async ({ page }) => {
        await page.goto('/home');
        await expect(page).toHaveURL('/home');
        await expect(page.locator('.home-root')).toBeVisible();
    });

    test('authenticated users reach /settings', async ({ page }) => {
        await page.goto('/settings');
        await expect(page).toHaveURL('/settings');
        await expect(page.locator('.settings-page')).toBeVisible();
    });

    test('authenticated users reach /statistics', async ({ page }) => {
        await page.goto('/statistics');
        await expect(page).toHaveURL('/statistics');
        await expect(page.locator('.stats-page')).toBeVisible();
    });
});
