import { test, expect, type Page } from '@playwright/test'

/**
 * Thumbnail generator smoke tests.
 *
 * These drive the real UI in Chromium. The AI endpoints (concepts, image
 * generation) are mocked with `page.route`, so the suite is deterministic and
 * needs no API keys — it verifies the *wiring and client-side behaviour*
 * (mode routing, AI | Manual tabs, canvas edits, AI flows, export), not the
 * quality of real model output.
 */

const STUDIO_URL = '/image-studio'

// A valid 1×1 PNG, used as a stand-in for an AI-generated background.
const FAKE_PNG =
  'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAAC0lEQVR4nGNgYAAAAAMAASsJTYQAAAAASUVORK5CYII='

// Mirrors the ThumbnailConcept shape the rail consumes (templateId / styleId
// must be real ids so applyConcept doesn't no-op).
const MOCK_CONCEPTS = [
  {
    templateId: 'reaction',
    styleId: 'gaming',
    headline: 'MIND BLOWN',
    color: '#ffe14d',
    backgroundPrompt: 'an excited gamer reacting',
    summary: 'Reaction face with a punchy two-word hook',
  },
  {
    templateId: 'top-list',
    styleId: '3d',
    headline: 'TOP 10 PCS',
    color: '#ffffff',
    backgroundPrompt: 'glossy 3d pc parts',
    summary: 'Numbered list layout',
  },
  {
    templateId: 'lower-third',
    styleId: 'cinematic',
    headline: 'I WAS WRONG',
    color: '#ff3b30',
    backgroundPrompt: 'cinematic dramatic portrait',
    summary: 'Lower-third caption over a full-bleed scene',
  },
]

async function openThumbnailMode(page: Page) {
  await page.goto(STUDIO_URL)
  await page.getByRole('button', { name: 'Thumbnail', exact: true }).click()
  await expect(page.getByTestId('thumbnail-stage')).toBeVisible()
}

async function openManualTab(page: Page) {
  await page.getByRole('button', { name: 'Manual', exact: true }).click()
}

// The rail is contextual: the text editor only appears once a text block is
// selected. Clicking the headline on the canvas selects it and opens the editor.
async function selectHeadline(page: Page) {
  await page.getByTestId('thumbnail-headline').first().click()
}

test.beforeEach(async ({ page }) => {
  await openThumbnailMode(page)
})

test('renders the 1280×720 stage with the default headline', async ({ page }) => {
  await expect(page.getByRole('heading', { name: 'YouTube Thumbnail' })).toBeVisible()
  await expect(page.getByTestId('thumbnail-stage')).toBeVisible()
  await expect(page.getByTestId('thumbnail-headline')).toContainText('YOUR TITLE HERE')
})

test('Manual: typing a headline updates the canvas live', async ({ page }) => {
  await openManualTab(page)
  await selectHeadline(page)
  await page.getByPlaceholder('Your title here').fill('Test Headline 123')
  await expect(page.getByTestId('thumbnail-headline')).toContainText('Test Headline 123')
})

test('Manual: selecting a template marks it active', async ({ page }) => {
  await openManualTab(page)
  // Template is a dropdown — open it, pick an option, then the trigger reflects it.
  await page.getByRole('button', { name: 'Template' }).click()
  await page.getByRole('button', { name: 'Reaction face', exact: true }).click()
  await expect(page.getByRole('button', { name: 'Template' })).toContainText('Reaction face')
})

test('Manual: a solid background reveals a colour picker', async ({ page }) => {
  await openManualTab(page)
  await page.getByRole('button', { name: 'Solid', exact: true }).click()
  await expect(page.getByLabel('Background color')).toBeVisible()
})

test('AI: title → 3 concepts renders cards and applying one builds it', async ({ page }) => {
  await page.route('**/api/generate-thumbnail-concepts', (route) =>
    route.fulfill({ json: { concepts: MOCK_CONCEPTS } }),
  )
  await page.route('**/api/generate-image', (route) =>
    route.fulfill({ json: { images: [FAKE_PNG] } }),
  )

  await page.getByRole('button', { name: 'AI', exact: true }).click()
  const brief = page.getByLabel('Video title or brief')
  await brief.fill('How I built a gaming PC in 10 minutes')
  await page.getByRole('button', { name: 'Get 3 thumbnail ideas' }).click()

  await expect(page.getByText('Click a concept to build it')).toBeVisible()

  // Picking a concept applies its headline and generates the background.
  await page.getByRole('button', { name: /MIND BLOWN/ }).click()
  await expect(page.getByTestId('thumbnail-headline')).toContainText('MIND BLOWN')
  await expect(brief).toHaveValue('How I built a gaming PC in 10 minutes')
  await expect(page.getByTestId('thumbnail-stage').locator('img')).toBeVisible()
})

test('AI: Generate background shows an honest ETA and adds an image layer', async ({ page }) => {
  await page.route('**/api/generate-image', async (route) => {
    await new Promise((resolve) => setTimeout(resolve, 500))
    await route.fulfill({ json: { images: [FAKE_PNG] } })
  })

  await page.getByRole('button', { name: 'AI', exact: true }).click()
  await page.getByLabel('Video title or brief').fill('Epic mountain sunrise, dramatic')
  const generate = page.getByRole('button', { name: 'Generate background' })
  await generate.click()

  await expect(page.getByRole('status')).toContainText('usually 30–90 seconds')
  await expect(page.getByRole('button', { name: 'Generating…' })).toBeDisabled()
  await expect(page.getByTestId('thumbnail-stage').locator('img')).toBeVisible()
  await expect(page.getByText('Creating your background')).toHaveCount(0)
})

test('Manual: font picker opens a grid and selects a font', async ({ page }) => {
  await openManualTab(page)
  await selectHeadline(page)
  const trigger = page.getByRole('button', { name: 'Font' })
  await expect(trigger).toContainText('Geist')

  await trigger.click()
  // Grid options (incl. the newly added Google fonts) appear in the popover.
  await page.getByRole('button', { name: 'Manrope', exact: true }).click()

  // The trigger reflects the picked font and the popover closes.
  await expect(trigger).toContainText('Manrope')
})

test('Manual: Clear all wipes the canvas to a blank screen', async ({ page }) => {
  await openManualTab(page)
  // The default config renders a headline; confirm it's there to start.
  await expect(page.getByTestId('thumbnail-headline')).toBeVisible()

  // "Clear all" (pinned in Export) asks for confirmation via window.confirm — accept it.
  page.once('dialog', (dialog) => dialog.accept())
  await page.getByRole('button', { name: 'Clear all' }).click()

  // Blank canvas: the headline layer renders nothing once the text is empty.
  await expect(page.getByTestId('thumbnail-headline')).toHaveCount(0)
  // Open the now-empty text block from the Scene view and confirm the field cleared.
  await page.getByRole('button', { name: 'Empty text' }).click()
  await expect(page.getByPlaceholder('Your title here')).toHaveValue('')
  // Stage itself still renders (it's just empty now).
  await expect(page.getByTestId('thumbnail-stage')).toBeVisible()
})

test('AI: Export PNG is always available and downloads a 1280×720 file', async ({ page }) => {
  await expect(page.getByRole('button', { name: 'AI', exact: true })).toHaveAttribute('aria-pressed', 'true')
  await expect(page.getByRole('button', { name: /Export PNG/ })).toBeVisible()
  const downloadPromise = page.waitForEvent('download')
  await page.getByRole('button', { name: /Export PNG/ }).click()
  const download = await downloadPromise
  expect(download.suggestedFilename()).toBe('youtube-thumbnail.png')
})
