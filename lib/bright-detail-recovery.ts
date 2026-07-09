/**
 * lib/bright-detail-recovery.ts
 *
 * AI matting (BiRefNet, PhotoRoom, …) does salient-object segmentation, so it
 * drops faint, disconnected bright detail — e.g. the gold sparkle trail on a
 * logo — treating it as background. When the source sits on a near-solid dark
 * background, those sparkles are simply bright pixels we can recover by
 * luminance.
 *
 * This blends the AI matte with a luminance key: final alpha = max(matteAlpha,
 * luminanceAlpha). The main subject keeps the matte's clean edges; faint bright
 * specks the matte zeroed are restored. It is a no-op unless the background is
 * detected as near-solid and dark, so photos and light/busy backgrounds are
 * unaffected.
 */

import sharp from 'sharp'

const luma = (r: number, g: number, b: number) => 0.299 * r + 0.587 * g + 0.114 * b

/** Sample the image border to decide if the background is near-solid and dark. */
function isDarkSolidBackground(rgba: Buffer, width: number, height: number): boolean {
  const samples: number[] = []
  const stepX = Math.max(1, Math.floor(width / 64))
  const stepY = Math.max(1, Math.floor(height / 64))

  for (let x = 0; x < width; x += stepX) {
    for (const y of [0, height - 1]) {
      const i = (y * width + x) * 4
      samples.push(luma(rgba[i], rgba[i + 1], rgba[i + 2]))
    }
  }
  for (let y = 0; y < height; y += stepY) {
    for (const x of [0, width - 1]) {
      const i = (y * width + x) * 4
      samples.push(luma(rgba[i], rgba[i + 1], rgba[i + 2]))
    }
  }

  const mean = samples.reduce((a, b) => a + b, 0) / samples.length
  const variance = samples.reduce((a, b) => a + (b - mean) ** 2, 0) / samples.length
  const std = Math.sqrt(variance)

  // Near-black and fairly uniform → a logo/graphic on a solid dark background.
  return mean < 28 && std < 20
}

/**
 * Restore bright detail (sparkles, glow) that an AI matte removed, when the
 * original sits on a near-solid dark background. Returns base64 PNG. Falls back
 * to the processed image unchanged on any issue or non-dark background.
 *
 * @param originalBase64  Source image (no data-URL prefix)
 * @param processedBase64 AI-matted PNG with alpha (no data-URL prefix)
 */
export async function recoverBrightDetailOnDarkBackground(
  originalBase64: string,
  processedBase64: string,
): Promise<string> {
  try {
    const original = sharp(Buffer.from(originalBase64, 'base64')).ensureAlpha()
    const meta = await original.metadata()
    const width = meta.width ?? 0
    const height = meta.height ?? 0
    if (!width || !height) return processedBase64

    const origRaw = await original.raw().toBuffer()
    if (!isDarkSolidBackground(origRaw, width, height)) return processedBase64

    // Match the matte to the original's dimensions so pixels line up.
    const matteRaw = await sharp(Buffer.from(processedBase64, 'base64'))
      .resize(width, height, { fit: 'fill' })
      .ensureAlpha()
      .raw()
      .toBuffer()

    const out = Buffer.from(origRaw) // keep original RGB; override alpha below
    const lo = 18
    const hi = 72
    for (let i = 0; i < out.length; i += 4) {
      const lum = luma(origRaw[i], origRaw[i + 1], origRaw[i + 2])
      const ramp = Math.min(1, Math.max(0, (lum - lo) / (hi - lo)))
      const lumAlpha = Math.round(ramp * 255)
      const matteAlpha = matteRaw[i + 3]
      out[i + 3] = lumAlpha > matteAlpha ? lumAlpha : matteAlpha
    }

    const png = await sharp(out, { raw: { width, height, channels: 4 } }).png().toBuffer()
    return png.toString('base64')
  } catch (error) {
    console.error('[BrightDetailRecovery] failed, using processed image as-is:', error)
    return processedBase64
  }
}
