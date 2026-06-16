import { test, expect } from '@playwright/test';

const API = 'https://mentiplan.com/api';
const TOKEN = () => process.env.E2E_TOKEN!;

async function apiFetch(path: string, options: RequestInit = {}) {
    const res = await fetch(`${API}${path}`, {
        ...options,
        headers: { Authorization: `Bearer ${TOKEN()}`, 'Content-Type': 'application/json', ...options.headers },
    });
    return res.json();
}

async function getFirstCalendarId(): Promise<string> {
    const { data } = await apiFetch('/calendars');
    if (!data?.length) throw new Error('No custom calendars found — create one before running e2e tests');
    return data[0]._id;
}

// Returns start/end ISO strings for today at 10:00–11:00 local time
function todaySlot() {
    const d = new Date();
    const start = new Date(d.getFullYear(), d.getMonth(), d.getDate(), 10, 0, 0).toISOString();
    const end   = new Date(d.getFullYear(), d.getMonth(), d.getDate(), 11, 0, 0).toISOString();
    return { start, end };
}

test.describe('Events', () => {
    let eventId: string;
    // Track every ID created (including retries) so nothing leaks
    const createdIds: string[] = [];

    test.beforeAll(async () => {
        // Clean up any stale E2E events left over from previous runs
        const { data: events } = await apiFetch('/events');
        const stale = (events ?? []).filter((e: { title: string; _id: string }) => e.title === 'E2E Test Event');
        await Promise.all(stale.map((e: { _id: string }) => apiFetch(`/events/${e._id}`, { method: 'DELETE' })));
    });

    test.beforeEach(async () => {
        const calendarId = await getFirstCalendarId();
        const { start, end } = todaySlot();
        const { data } = await apiFetch('/events', {
            method: 'POST',
            body: JSON.stringify({
                title: 'E2E Test Event',
                calendarId,
                start,
                end,
                useCalendarColor: true,
                color: '#6366f1',
            }),
        });
        eventId = data._id;
        createdIds.push(eventId);
    });

    test.afterEach(async () => {
        // Delete all events created during this test including any retry attempts
        const ids = createdIds.splice(0);
        await Promise.all(ids.map(id => apiFetch(`/events/${id}`, { method: 'DELETE' })));
    });

    test('event appears on the calendar', async ({ page }) => {
        await page.goto('/home');
        await expect(page.locator('.fc')).toBeVisible();
        await expect(page.getByText('E2E Test Event')).toBeVisible();
    });

    test('clicking an event opens the edit dialog', async ({ page }) => {
        await page.goto('/home');
        await page.locator('.fc-event').filter({ hasText: 'E2E Test Event' }).first().locator('.fc-event-main').click({ force: true });
        await expect(page.locator('.aed-dialog')).toBeVisible();
    });

    test('edit dialog shows the event title', async ({ page }) => {
        await page.goto('/home');
        await page.locator('.fc-event').filter({ hasText: 'E2E Test Event' }).first().locator('.fc-event-main').click({ force: true });
        await expect(page.locator('.aed-input').first()).toHaveValue('E2E Test Event');
    });

    test('editing and saving an event updates its title', async ({ page }) => {
        await page.goto('/home');
        await page.locator('.fc-event').filter({ hasText: 'E2E Test Event' }).first().locator('.fc-event-main').click({ force: true });
        await expect(page.locator('.aed-dialog')).toBeVisible();
        // Wait for event data to load before filling — the hook fetches from API on open,
        // and a fill() during loading gets overwritten when the response arrives.
        await expect(page.locator('.aed-btn-save')).toBeEnabled();
        await expect(page.locator('.aed-input').first()).toHaveValue('E2E Test Event');
        await page.locator('.aed-input').first().fill('E2E Updated Event');
        await page.locator('.aed-btn-save').click();
        await expect(page.locator('.aed-dialog')).not.toBeVisible();
        await expect(page.locator('.fc-event').filter({ hasText: 'E2E Updated Event' })).toBeVisible();
    });

    test('closing the dialog returns to the calendar', async ({ page }) => {
        await page.goto('/home');
        await page.locator('.fc-event').filter({ hasText: 'E2E Test Event' }).first().locator('.fc-event-main').click({ force: true });
        await page.locator('.aed-close').click();
        await expect(page.locator('.aed-dialog')).not.toBeVisible();
        await expect(page.locator('.fc')).toBeVisible();
    });
});
