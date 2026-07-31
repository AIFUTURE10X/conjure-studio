import { test, expect, type Page } from '@playwright/test'

/**
 * 3D spin export (issue #34).
 *
 * Both API calls are stubbed, so this needs no keys and costs nothing — matching
 * the rest of the suite. The logo is a 1x1 PNG the app never actually decodes for
 * 3D purposes; the geometry comes entirely from the stubbed SVG below, which is
 * what makes the render deterministic here.
 *
 * The encode itself needs WebCodecs. Headless CI Chromium ships VP9 but often not
 * H.264, so each format is probed in-page and skipped when the runner cannot
 * encode it — a visible skip rather than a red build that says nothing about the
 * code. The frame-count assertions below need no codec at all and always run.
 */

const FAKE_PNG =
  'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAAC0lEQVR4nGNgYAAAAAMAASsJTYQAAAAASUVORK5CYII='

/** Two filled paths in two colours, so the multi-mesh path is exercised too. */
const FAKE_SVG = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100">
  <path fill="#c99850" d="M10 10 H60 V60 H10 Z"/>
  <path fill="#3b82f6" d="M55 55 H90 V90 H55 Z"/>
</svg>`

async function stubLogoApis(page: Page) {
  await page.route('**/api/generate-logo', async (route) => {
    await route.fulfill({ json: { image: FAKE_PNG, aspectRatio: '1:1' } })
  })
  await page.route('**/api/vectorize-logo', async (route) => {
    await route.fulfill({ status: 200, contentType: 'image/svg+xml', body: FAKE_SVG })
  })
  // History is irrelevant here and would otherwise hit a real database.
  await page.route('**/api/logo-history**', async (route) => {
    await route.fulfill({ json: { history: [] } })
  })
}

async function canEncode(page: Page, codec: string): Promise<boolean> {
  return page.evaluate(async (c) => {
    if (typeof (window as unknown as { VideoEncoder?: unknown }).VideoEncoder === 'undefined') return false
    try {
      const support = await VideoEncoder.isConfigSupported({ codec: c, width: 640, height: 360, bitrate: 2_000_000 })
      return Boolean(support.supported)
    } catch {
      return false
    }
  }, codec)
}

async function openSpinPanel(page: Page) {
  await stubLogoApis(page)
  await page.goto('/image-studio')
  await page.getByRole('button', { name: 'Logo', exact: true }).click()

  await page.getByPlaceholder(/logo you want to generate/i).fill('e2e export fixture')
  await page.getByRole('button', { name: 'Generate', exact: true }).click()

  await page.getByRole('button', { name: '3D Spin' }).click()
  await expect(page.getByRole('heading', { name: '3D Spin' })).toBeVisible()
  // The canvas only mounts once geometry was built from the stubbed SVG, so its
  // presence already proves vectorize -> SVGLoader -> ExtrudeGeometry worked.
  await expect(page.locator('canvas')).toBeVisible()
}

test.describe('3D spin export', () => {
  test('reports the exact frame count, clip length and whole-turn count for the chosen settings', async ({ page }) => {
    await openSpinPanel(page)

    // 4s @ 30fps -> 120 frames; at the default 1x speed a 4s or 2s clip rounds
    // to one whole turn, and showing that is the point — the loop-closing
    // quantization is disclosed before the encode, not discovered after.
    await expect(page.getByText('120 frames · 4.0s · 1 turn')).toBeVisible()

    await page.getByRole('button', { name: '2s', exact: true }).click()
    await expect(page.getByText('60 frames · 2.0s · 1 turn')).toBeVisible()

    await page.getByRole('button', { name: '24fps', exact: true }).click()
    await expect(page.getByText('48 frames · 2.0s · 1 turn')).toBeVisible()
  })

  test('blocks an MP4 export of a transparent background rather than exporting a black box', async ({ page }) => {
    await openSpinPanel(page)

    await page.getByRole('button', { name: 'Transparent' }).click()
    await page.getByRole('button', { name: 'MP4', exact: true }).click()

    await expect(page.getByText(/MP4 cannot carry transparency/i)).toBeVisible()
    await expect(page.getByRole('button', { name: /^Export MP4$/ })).toBeDisabled()
  })

  test('exports a real video file (AC-1)', async ({ page }) => {
    await openSpinPanel(page)

    // Prefer whichever codec this runner can actually encode.
    const webmOk = await canEncode(page, 'vp09.00.10.08')
    const mp4Ok = await canEncode(page, 'avc1.640028') || await canEncode(page, 'avc1.42001f')
    test.skip(!webmOk && !mp4Ok, 'This runner has no WebCodecs video encoder available')

    if (!mp4Ok) await page.getByRole('button', { name: 'WebM', exact: true }).click()
    // Keep it short so the encode finishes well inside the test timeout.
    await page.getByRole('button', { name: '2s', exact: true }).click()
    await page.getByRole('button', { name: '24fps', exact: true }).click()
    await page.getByRole('button', { name: '720p', exact: true }).click()

    const downloadPromise = page.waitForEvent('download', { timeout: 60_000 })
    await page.getByRole('button', { name: /^Export (MP4|WEBM)$/ }).click()
    const download = await downloadPromise

    expect(download.suggestedFilename()).toMatch(/-3d-spin\.(mp4|webm)$/)

    const path = await download.path()
    expect(path).toBeTruthy()
    const { size } = await (await import('node:fs/promises')).stat(path as string)
    expect(size).toBeGreaterThan(0)
  })
})
