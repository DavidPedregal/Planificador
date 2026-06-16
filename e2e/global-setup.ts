import { chromium } from '@playwright/test';
import fs from 'fs';
import path from 'path';

export default async function globalSetup() {
    const token = process.env.E2E_TOKEN;
    if (!token) throw new Error('E2E_TOKEN is required.\nRun with: E2E_TOKEN=<jwt> npx playwright test');

    // Decode JWT payload to get userId (no verification needed here)
    const payload = JSON.parse(Buffer.from(token.split('.')[1], 'base64url').toString());
    const user = { id: payload.userId, name: 'E2E', email: 'e2e@mentiplan.com' };

    const browser = await chromium.launch();
    const page = await browser.newPage();
    await page.goto('https://mentiplan.com');

    await page.evaluate(({ token, user }) => {
        localStorage.setItem('token', token);
        localStorage.setItem('user', JSON.stringify(user));
    }, { token, user });

    const authDir = path.join(__dirname, '.auth');
    if (!fs.existsSync(authDir)) fs.mkdirSync(authDir, { recursive: true });
    await page.context().storageState({ path: path.join(authDir, 'user.json') });

    await browser.close();
}
