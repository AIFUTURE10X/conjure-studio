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
