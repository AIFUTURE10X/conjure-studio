/**
 * lib/edit-mask.ts
 *
 * Server-side mask hygiene and pixel-lock compositing for /api/edit-image.
 *
 * Mask convention (matches the client's buildMaskBlob): opaque black RGBA
 * everywhere, fully transparent (alpha=0) marks the region to edit.
 *
 * gpt-image masks are guidance, not a hard constraint — unmasked pixels can
 * still drift slightly between the request and the result. Two mitigations:
 *   1. hygieneMask grows + feathers the region we SEND to OpenAI, so the
 *      model has a little breathing room to blend at the edge instead of
 *      fighting a razor-sharp boundary (which tends to produce seams).
 *   2. pixelLockComposite then pastes the model's result back over the
 *      ORIGINAL image, clipped to a feathered version of the RAW (pre-grow)
 *      mask, so pixels outside the user's painted area come back
 *      byte-identical (or near enough — the feather itself is a deliberate,
 *      narrow blend zone) regardless of what the model actually changed.
 */

import sharp from "sharp"

export interface HygieneMaskOptions {
  /** Pixels to dilate the edit region by before feathering. */
  growPx?: number
  /** Pixels of blur applied to the (already grown) edge. */
  featherPx?: number
}

const DEFAULT_GROW_PX = 8
const DEFAULT_FEATHER_PX = 6
const DEFAULT_LOCK_FEATHER_PX = 8
/** ~10% of 255 — reclaims blur-spread pixels as fully in-region (dilation). */
const DILATE_THRESHOLD = 26

const clampSigma = (px: number) => Math.max(0.3, px)

function invert(buffer: Buffer): Buffer {
  const out = Buffer.alloc(buffer.length)
  for (let i = 0; i < buffer.length; i++) out[i] = 255 - buffer[i]
  return out
}

/**
 * sharp silently promotes a raw single-channel buffer to 3-channel sRGB on
 * output unless the colourspace is pinned back to grayscale first — without
 * this, blur/threshold round-trips through raw single-channel buffers come
 * back 3x the expected size. Route every raw 1-channel ingestion through
 * here instead of calling `sharp(buffer, { raw: ... })` directly.
 */
function fromRawGray(buffer: Buffer, width: number, height: number) {
  return sharp(buffer, { raw: { width, height, channels: 1 } }).toColourspace("b-w")
}

/**
 * Grow then feather the transparent (edit) region of a raw mask PNG so the
 * boundary sent to OpenAI is soft rather than a hard cutout.
 */
export async function hygieneMask(
  maskBuffer: Buffer,
  { growPx = DEFAULT_GROW_PX, featherPx = DEFAULT_FEATHER_PX }: HygieneMaskOptions = {},
): Promise<Buffer> {
  const { width, height } = await sharp(maskBuffer).metadata()
  if (!width || !height) throw new Error("Could not read mask dimensions")

  const alpha = await sharp(maskBuffer).ensureAlpha().extractChannel("alpha").raw().toBuffer()
  // Invert: the edit region (source alpha=0) becomes white-on-black, which
  // ordinary blur/threshold ops can grow and soften.
  const editRegion = invert(alpha)

  const dilated = await fromRawGray(editRegion, width, height)
    .blur(clampSigma(growPx))
    .threshold(DILATE_THRESHOLD)
    .raw()
    .toBuffer()

  const feathered = await fromRawGray(dilated, width, height)
    .blur(clampSigma(featherPx))
    .raw()
    .toBuffer()

  // Back to mask convention: alpha=0 (fully transparent) inside the region.
  const outAlpha = invert(feathered)
  const black = Buffer.alloc(width * height * 3, 0)

  return sharp(black, { raw: { width, height, channels: 3 } })
    .joinChannel(outAlpha, { raw: { width, height, channels: 1 } })
    .png()
    .toBuffer()
}

/**
 * Composite an OpenAI edit result back over the original image so that only
 * the user's painted (raw, pre-grow) region actually changes — everything
 * else is restored from the original, byte-identical outside a narrow
 * feathered seam.
 */
export async function pixelLockComposite(
  originalBuffer: Buffer,
  resultBase64: string,
  rawMaskBuffer: Buffer,
  featherPx: number = DEFAULT_LOCK_FEATHER_PX,
): Promise<Buffer> {
  const resultBuffer = Buffer.from(resultBase64, "base64")
  const { width, height } = await sharp(resultBuffer).metadata()
  if (!width || !height) throw new Error("Could not read result image dimensions")

  const [originalResized, maskAlpha, resultRgb] = await Promise.all([
    sharp(originalBuffer).resize(width, height, { fit: "fill" }).ensureAlpha().png().toBuffer(),
    sharp(rawMaskBuffer).resize(width, height, { fit: "fill" }).ensureAlpha().extractChannel("alpha").raw().toBuffer(),
    sharp(resultBuffer).removeAlpha().raw().toBuffer(),
  ])

  // Edit region (where the AI result is allowed to show through), feathered
  // so the seam against the restored original blends rather than hard-cuts.
  const editRegion = invert(maskAlpha)
  const featheredAlpha = await fromRawGray(editRegion, width, height)
    .blur(clampSigma(featherPx))
    .raw()
    .toBuffer()

  const resultClippedToRegion = await sharp(resultRgb, { raw: { width, height, channels: 3 } })
    .joinChannel(featheredAlpha, { raw: { width, height, channels: 1 } })
    .png()
    .toBuffer()

  return sharp(originalResized)
    .composite([{ input: resultClippedToRegion, blend: "over" }])
    .png()
    .toBuffer()
}
