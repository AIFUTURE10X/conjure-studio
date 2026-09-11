import { test, expect } from '@playwright/test'

/**
 * The settings-rail dropdowns are Radix popovers. Under the interface zoom
 * (CSS `zoom` on <html>, lib/ui-zoom.ts) Floating UI's translate() was applied
 * inside the zoomed root, so at 200% the panel opened at 2× its real offset —
 * off-screen, which users read as "the dropdown does not open". Pin the fix
 * (app/globals.css popper counter-zoom + ChipSelect var scaling) by opening
 * the first rail dropdown at both zoom levels and checking where it lands.
 */
for (const zoom of [1, 2]) {
  test(`settings rail dropdown opens on-screen and is usable at ${zoom * 100}% interface zoom`, async ({ page }) => {
    // The layout boot script reads this before first paint, same as a user who
    // set the zoom from the top bar.
    await page.addInitScript((z) => localStorage.setItem('ui-zoom', String(z)), zoom)
    await page.goto('/image-studio')

    const trigger = page.locator('[data-slot=popover-trigger]').first()
    await expect(trigger).toBeVisible()
    await trigger.scrollIntoViewIfNeeded()
    const triggerBox = (await trigger.boundingBox())!
    expect(triggerBox).not.toBeNull()

    await trigger.click()
    const content = page.locator('[data-slot=popover-content]')
    await expect(content).toBeVisible()
    const box = (await content.boundingBox())!
    const viewport = page.viewportSize()!

    // Fully inside the window — the regression put it at zoom× its offset.
    expect(box.x).toBeGreaterThanOrEqual(0)
    expect(box.y).toBeGreaterThanOrEqual(0)
    expect(box.x + box.width).toBeLessThanOrEqual(viewport.width)
    expect(box.y + box.height).toBeLessThanOrEqual(viewport.height)

    // Anchored just under its trigger and sized to it (sideOffset 6, ±rounding).
    const gap = box.y - (triggerBox.y + triggerBox.height)
    expect(gap).toBeGreaterThanOrEqual(0)
    expect(gap).toBeLessThanOrEqual(12)
    expect(Math.abs(box.width - triggerBox.width)).toBeLessThanOrEqual(4)

    // And it is actually interactive: picking an option closes it.
    await content.getByRole('button').first().click()
    await expect(content).toBeHidden()
  })
}
