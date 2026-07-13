import { test, expect, type Page } from '@playwright/test'

const FAKE_PNG =
  'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAAC0lEQVR4nGNgYAAAAAMAASsJTYQAAAAASUVORK5CYII='

async function openMockups(page: Page) {
  await page.goto('/image-studio')
  await page.getByRole('button', { name: 'Mockups', exact: true }).click()
  await expect(page.getByRole('button', { name: 'Create Product Photo' })).toBeVisible()
}

test.beforeEach(async ({ page }) => {
  await openMockups(page)
})

test('product photo creation explains both steps and keeps the result visible', async ({ page }) => {
  await page.route('**/api/generate-mockup-photos', async (route) => {
    await new Promise((resolve) => setTimeout(resolve, 500))
    await route.fulfill({ json: { success: true, product: 'mug', color: 'cream', dataUrl: FAKE_PNG } })
  })

  await page.getByRole('button', { name: 'Create Product Photo' }).click()
  await expect(page.getByRole('heading', { name: 'Create a Product Photo' })).toBeVisible()
  await expect(page.getByText('Step 1 · Choose a product')).toBeVisible()
  await expect(page.getByText('public/mockups')).toHaveCount(0)
  await expect(page.getByText('renderMode')).toHaveCount(0)
  await expect(page.getByRole('button', { name: 'Generate All' })).toHaveCount(0)

  const mugRow = page.getByRole('button', { name: 'mug 3 colors · choose one to generate', exact: true })
  await mugRow.click()
  await expect(mugRow).toHaveAttribute('aria-expanded', 'true')
  await expect(page.getByText('Step 2 · Choose a color', { exact: true })).toBeVisible()

  await page.getByRole('button', { name: 'Generate cream mug photo' }).click()
  await expect(page.getByRole('status')).toContainText('usually 30–90 seconds')
  await expect(page.getByRole('button', { name: 'Creating cream mug photo' })).toBeDisabled()

  await expect(page.getByRole('status')).toContainText('cream mug photo is ready')
  await expect(page.getByRole('img', { name: 'cream mug product photo' })).toBeVisible()
  await expect(page.getByRole('link', { name: 'Download photo' })).toBeVisible()
})

test('selecting a mug applies its readable higher brand-text defaults', async ({ page }) => {
  await page.getByRole('button', { name: 'Products', exact: true }).click()
  await page.getByRole('button', { name: 'Mugs', exact: true }).click()

  const brandText = page.locator('[data-draggable="text"]').first()
  await expect(brandText).toHaveCSS('top', /60%|[0-9.]+px/)
  await expect(brandText).toHaveAttribute('style', /top: 60%;/)
  await expect(brandText).toHaveAttribute('style', /scaleX\(1\.2\).*scaleY\(1\.2\)/)
  await expect(brandText.locator('span')).toHaveCSS('color', 'rgb(24, 24, 27)')
})
