import { test, expect } from '@playwright/test';

test.describe('Home page', () => {
    test.beforeEach(async ({ page }) => {
        await page.goto('/home');
        // Wait for auth guard to resolve and calendar to mount
        await expect(page.locator('.home-root')).toBeVisible();
    });

    test('renders the calendar', async ({ page }) => {
        await expect(page.locator('.fc')).toBeVisible();
    });

    test('renders the sidebar', async ({ page }) => {
        await expect(page.locator('.home-sidebar')).toBeVisible();
    });

    test('sidebar shows calendar list', async ({ page }) => {
        // The sidebar loads calendars — at least one entry should appear
        await expect(page.locator('.home-sidebar')).toContainText(/.+/);
    });

    test('calendar toolbar shows navigation buttons', async ({ page }) => {
        await expect(page.locator('.fc-toolbar')).toBeVisible();
        await expect(page.locator('.fc-prev-button')).toBeVisible();
        await expect(page.locator('.fc-next-button')).toBeVisible();
        await expect(page.locator('.fc-today-button')).toBeVisible();
    });
});
