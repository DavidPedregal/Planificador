import { defineConfig, devices } from '@playwright/test';
import { config } from 'dotenv';
config(); // loads .env from the current directory

export default defineConfig({
    testDir: './e2e',
    fullyParallel: false,
    retries: 1,
    workers: 1,
    reporter: [['html', { open: 'never' }]],
    globalSetup: './e2e/global-setup.ts',
    use: {
        baseURL: 'https://mentiplan.com',
        trace: 'on-first-retry',
        storageState: 'e2e/.auth/user.json',
    },
    projects: [
        {
            name: 'chromium',
            use: { ...devices['Desktop Chrome'] },
        },
    ],
});
