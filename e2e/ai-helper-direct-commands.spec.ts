import { test, expect } from '@playwright/test'

/**
 * Regression: the AI helper's local direct-command shortcuts must not swallow
 * creative requests that merely mention a setting. A message like "...in a 4:3
 * ratio, 2K resolution" once matched the local "2k resolution" shortcut, which
 * applied the setting, replied "Image settings updated", and never sent the
 * request to the AI. Bare commands like "set 2k" must still resolve locally.
 */

const CREATIVE_REQUEST =
  "Now I want an image for this placeholder for a visa. Maybe you can add a passport that's been stamped with a TM30 visa or something like that in a 4:3 ratio, 2K resolution."

test('creative request mentioning a resolution reaches the AI intact', async ({ page }) => {
  let requestedMessage: string | null = null
  await page.route('**/api/generate-prompt-suggestion', async (route) => {
    requestedMessage = (route.request().postDataJSON() as { message?: string }).message ?? null
    await route.fulfill({ json: { message: 'MOCKED HELPER REPLY' } })
  })

  await page.goto('/image-studio')
  await page.getByLabel('Describe prompt idea').fill(CREATIVE_REQUEST)
  await page.getByRole('button', { name: 'Send', exact: true }).click()

  await expect(page.getByText('MOCKED HELPER REPLY')).toBeVisible()
  expect(requestedMessage).toContain('TM30 visa')
  expect(requestedMessage).toContain('2K resolution')
  await expect(page.getByText('Image settings updated')).toHaveCount(0)
})

test('bare settings command still resolves locally without an AI call', async ({ page }) => {
  let apiCalls = 0
  await page.route('**/api/generate-prompt-suggestion', async (route) => {
    apiCalls++
    await route.fulfill({ json: { message: 'MOCKED HELPER REPLY' } })
  })

  await page.goto('/image-studio')
  await page.getByLabel('Describe prompt idea').fill('set 2k')
  await page.getByRole('button', { name: 'Send', exact: true }).click()

  await expect(page.getByText('Image settings updated: 2K resolution.')).toBeVisible()
  expect(apiCalls).toBe(0)
})
