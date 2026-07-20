import { test, expect, type Page } from '@playwright/test'

const STUDIO_URL = '/image-studio'

const FAKE_PNG =
  'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAAC0lEQVR4nGNgYAAAAAMAASsJTYQAAAAASUVORK5CYII='

async function mockImageStudioApis(page: Page) {
  const generationRequests: string[] = []

  await page.route('**/api/generate-image', (route) =>
    {
      generationRequests.push(route.request().postDataBuffer()?.toString('utf8') || '')
      return route.fulfill({ json: { images: [FAKE_PNG] } })
    },
  )
  await page.route('**/api/history', (route) =>
    route.fulfill({ json: { success: true, id: `history-${Date.now()}` } }),
  )

  return generationRequests
}

async function generateImage(page: Page, prompt: string) {
  await page.getByPlaceholder(/Describe the image/).fill(prompt)
  await page.getByRole('button', { name: /^Generate$/ }).last().click()
}

test('keeps an annotated copy when generating another image', async ({ page }) => {
  const generationRequests = await mockImageStudioApis(page)

  await page.goto(STUDIO_URL)
  await generateImage(page, 'small ceramic coffee cup on a wooden desk')
  await expect(page.getByRole('heading', { name: 'Generated Images (1)' })).toBeVisible()

  await page.getByRole('button', { name: 'Annotate image' }).click()
  await expect(page.getByRole('dialog', { name: 'Annotate image' })).toBeVisible()
  await expect(page.locator('.konvajs-content')).toBeVisible()
  await page.getByRole('button', { name: 'Text' }).click()
  await page.locator('.konvajs-content canvas').click({ position: { x: 220, y: 180 } })
  await page.locator('#annotation-text').fill('Hero Product')
  await page.getByRole('button', { name: 'Save Copy' }).click()
  await expect(page.getByText('Saved copy')).toBeVisible()
  await page.getByRole('button', { name: 'Close annotator' }).click()
  await expect(page.getByRole('heading', { name: 'Generated Images (2)' })).toBeVisible()
  await expect(page.getByPlaceholder(/Describe the image/)).toContainText('annotated reference image')

  await generateImage(page, 'same cup with a blue saucer')
  await expect(page.getByRole('heading', { name: 'Generated Images (3)' })).toBeVisible()
  expect(generationRequests).toHaveLength(2)
  expect(generationRequests[0]).not.toContain('name="referenceImage"')
  expect(generationRequests[1]).toContain('name="referenceImage"')
  expect(generationRequests[1]).toContain('name="maskImage"')
  expect(generationRequests[1]).toContain('conjure-source-')
  expect(generationRequests[1]).toContain('conjure-edit-mask-')
  expect(generationRequests[1]).toContain('name="referenceMode"')
  expect(generationRequests[1]).toContain('inspire')
  expect(generationRequests[1]).toContain('annotated reference image')
  expect(generationRequests[1]).toContain('Hero Product')
  expect(generationRequests[1]).toContain('name="imageQuality"')
  expect(generationRequests[1]).toMatch(/name="imageQuality"[\s\S]*(low|medium)/)
  expect(generationRequests[1]).not.toContain('high')
})
