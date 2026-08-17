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
 *
 * The recovery floor is derived from the MEASURED background, not a constant.
 * A fixed floor of 18 used to sit below the gate's own ceiling (mean < 28), so
 * a logo on charcoal — or on a black that picked up compression noise — had its
 * entire background resurrected as semi-transparent haze. Two safeguards now
 * prevent that: the floor is pushed clear of the background's own brightness,
 * and the whole pass is abandoned if it would resurrect an implausible share of
 * the background.
 */

import sharp from 'sharp'

const luma = (r: number, g: number, b: number) => 0.299 * r + 0.587 * g + 0.114 * b

/** Background must be this dark, and this uniform, for recovery to apply at all. */
const MAX_BG_MEAN = 28
const MAX_BG_STD = 20
/** Recovered pixels ramp to full alpha this far above the floor. */
const RAMP_WIDTH = 54
/**
 * If recovery would turn on more than this share of the matte's background,
 * it is keying the background itself rather than detail sitting on top of it.
 */
const MAX_RESURRECTED_FRACTION = 0.2

interface BorderStats {
  mean: number
  std: number
}

/** Sample the image border to characterise the background. */
function sampleBorderLuma(rgba: Buffer, width: number, height: number): BorderStats {
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
  return { mean, std: Math.sqrt(variance) }
}

/**
 * Restore bright detail (sparkles, glow) that an AI matte removed, when the
 * original sits on a near-solid dark background. Returns base64 PNG. Falls back
 * to the processed image unchanged on any issue, on a non-dark background, or
 * when the luminance key would clearly be keying the background itself.
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
    const { mean, std } = sampleBorderLuma(origRaw, width, height)

    // Near-black and fairly uniform → a logo/graphic on a solid dark background.
    if (!(mean < MAX_BG_MEAN && std < MAX_BG_STD)) return processedBase64

    // Put the floor clear of the background's own brightness AND its noise, so
    // we only key detail that genuinely sits above the backdrop. A constant
    // here is what caused whole backgrounds to be resurrected.
    const lo = mean + 4 * std + 8
    const hi = lo + RAMP_WIDTH
    if (hi >= 255) return processedBase64 // no headroom left to key against

    // Match the matte to the original's dimensions so pixels line up.
    const matteRaw = await sharp(Buffer.from(processedBase64, 'base64'))
      .resize(width, height, { fit: 'fill' })
      .ensureAlpha()
      .raw()
      .toBuffer()

    const out = Buffer.from(origRaw) // keep original RGB; override alpha below
    let matteBackground = 0
    let resurrected = 0

    for (let i = 0; i < out.length; i += 4) {
      const lum = luma(origRaw[i], origRaw[i + 1], origRaw[i + 2])
      const ramp = Math.min(1, Math.max(0, (lum - lo) / (hi - lo)))
      const lumAlpha = Math.round(ramp * 255)
      const matteAlpha = matteRaw[i + 3]

      if (matteAlpha <= 16) {
        matteBackground += 1
        if (lumAlpha > 16) resurrected += 1
      }

      out[i + 3] = lumAlpha > matteAlpha ? lumAlpha : matteAlpha
    }

    // Sanity gate: recovering a large share of what the matte called background
    // means the key is tracking the backdrop, not detail on top of it.
    if (matteBackground > 0 && resurrected / matteBackground > MAX_RESURRECTED_FRACTION) {
      console.warn(
        `[BrightDetailRecovery] skipped — key would resurrect ${((resurrected / matteBackground) * 100).toFixed(1)}% of background`,
      )
      return processedBase64
    }

    // Clear RGB under fully transparent pixels. Leaving the original dark
    // backdrop there bleeds a halo into the edges on any later resize or
    // composite, and inflates the PNG considerably.
    for (let i = 0; i < out.length; i += 4) {
      if (out[i + 3] === 0) {
        out[i] = 0
        out[i + 1] = 0
        out[i + 2] = 0
      }
    }

    const png = await sharp(out, { raw: { width, height, channels: 4 } }).png().toBuffer()
    return png.toString('base64')
  } catch (error) {
    console.error('[BrightDetailRecovery] failed, using processed image as-is:', error)
    return processedBase64
  }
}
