import { defineConfig, devices } from '@playwright/test'

/**
 * Playwright config for the Image Studio e2e smoke tests.
 *
 * Focus: drive the Thumbnail generator in a real browser to catch regressions
 * the type-check/lint can't (mode routing, panel wiring, canvas edits, export).
 * AI routes are mocked in the specs, so no API keys are required to run these.
 *
 * The web server runs `next dev`; on first compile of the studio page Next
 * fetches the self-hosted display fonts from Google Fonts, so the host running
 * the tests needs outbound network (CI and local dev have it).
 */

const PORT = Number(process.env.PORT ?? 3000)
const BASE_URL = process.env.E2E_BASE_URL ?? `http://localhost:${PORT}`
const isCI = !!process.env.CI

export default defineConfig({
  testDir: './e2e',
  // The studio shell hydrates a resizable layout + dynamic import; give actions
  // and the first (compile-on-demand) navigation room to breathe.
  timeout: 60_000,
  expect: { timeout: 15_000 },
  fullyParallel: true,
  forbidOnly: isCI,
  retries: isCI ? 1 : 0,
  workers: isCI ? 1 : undefined,
  reporter: isCI ? [['github'], ['html', { open: 'never' }]] : [['list']],
  use: {
    baseURL: BASE_URL,
    actionTimeout: 15_000,
    navigationTimeout: 30_000,
    trace: 'on-first-retry',
    // Thumbnail mode uses the desktop 3-panel layout (>= 1024px).
    viewport: { width: 1440, height: 900 },
  },
  projects: [{ name: 'chromium', use: { ...devices['Desktop Chrome'] } }],
  webServer: {
    command: 'npm run dev',
    url: BASE_URL,
    reuseExistingServer: !isCI,
    timeout: 180_000,
  },
})
