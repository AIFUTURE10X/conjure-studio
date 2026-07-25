import { test, expect } from '@playwright/test'

test('Logo keeps direction ideas separate until the user copies or applies them', async ({ page }) => {
  await page.goto('/image-studio')
  await page.getByRole('button', { name: 'Logo', exact: true }).click()

  const logoPrompt = page.getByLabel('Logo prompt — used by Generate')
  const variationBrief = page.getByLabel('Variation brief — used only to create three directions')

  await logoPrompt.fill('CURRENT LOGO PROMPT')
  await variationBrief.fill('SEPARATE VARIATION BRIEF')
  await logoPrompt.fill('UPDATED LOGO PROMPT')

  await expect(variationBrief).toHaveValue('SEPARATE VARIATION BRIEF')
  await page.getByRole('button', { name: 'Copy current Logo prompt' }).click()
  await expect(variationBrief).toHaveValue('UPDATED LOGO PROMPT')
})

test('Logo prompt stays drag-resizable once a long brief has filled it', async ({ page }) => {
  await page.goto('/image-studio')
  await page.getByRole('button', { name: 'Logo', exact: true }).click()

  const logoPrompt = page.getByLabel('Logo prompt — used by Generate')
  await logoPrompt.fill(
    Array.from({ length: 8 }, (_, i) => `line ${i + 1} of a long logo brief`).join('\n'),
  )

  // The old max-h-40 clamped at 160px, which a brief this long already fills —
  // leaving the resize handle zero travel. Clearing it is the whole fix.
  const filled = await logoPrompt.boundingBox()
  expect(filled).not.toBeNull()
  expect(filled!.height).toBeGreaterThan(160)

  // Drag the native resize handle (bottom-right corner) down.
  await page.mouse.move(filled!.x + filled!.width - 3, filled!.y + filled!.height - 3)
  await page.mouse.down()
  await page.mouse.move(filled!.x + filled!.width - 3, filled!.y + filled!.height + 200, {
    steps: 12,
  })
  await page.mouse.up()

  const dragged = await logoPrompt.boundingBox()
  expect(dragged!.height).toBeGreaterThan(filled!.height + 60)
})
