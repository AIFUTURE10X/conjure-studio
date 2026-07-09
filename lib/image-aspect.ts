/**
 * Shared aspect-ratio utilities for the image-edit routes: the canonical
 * ratio list, its numeric values, and a "closest ratio" matcher used to
 * pick an output aspect ratio from an uploaded image's pixel dimensions.
 */

export const RATIOS = ["1:1", "16:9", "9:16", "4:3", "3:4", "3:2", "2:3", "21:9", "5:4", "4:5"] as const
export type Ratio = (typeof RATIOS)[number]

export const RATIO_VALUE: Record<Ratio, number> = {
  "1:1": 1, "16:9": 16 / 9, "9:16": 9 / 16, "4:3": 4 / 3, "3:4": 3 / 4,
  "3:2": 3 / 2, "2:3": 2 / 3, "21:9": 21 / 9, "5:4": 5 / 4, "4:5": 4 / 5,
}

export function closestRatio(width?: number, height?: number): Ratio {
  if (!width || !height) return "1:1"
  const target = width / height
  return RATIOS.reduce((best, r) =>
    Math.abs(Math.log(target / RATIO_VALUE[r])) < Math.abs(Math.log(target / RATIO_VALUE[best])) ? r : best,
  )
}

const EXACT_SIZE_MIN_EDGE = 256
const EXACT_SIZE_MAX_EDGE = 2048
const clampEdge = (value: number) =>
  Math.min(EXACT_SIZE_MAX_EDGE, Math.max(EXACT_SIZE_MIN_EDGE, Math.round(value / 16) * 16))

/**
 * gpt-image-2 accepts arbitrary WxH (each edge divisible by 16, aspect
 * between 1:3 and 3:1) instead of only its fixed size buckets. Returns the
 * exact size to request so an edit's output keeps the source's aspect ratio
 * instead of drifting to the nearest bucket; undefined when the source
 * aspect falls outside what the endpoint supports, so the caller can fall
 * back to a size bucket.
 */
export function exactOpenAISize(width?: number, height?: number): string | undefined {
  if (!width || !height) return undefined
  const ratio = width / height
  if (ratio < 1 / 3 || ratio > 3) return undefined

  // Scale the whole image so both edges land within [256, 2048] while keeping
  // the source aspect ratio. Clamping each edge independently (the previous
  // behavior) skews the aspect whenever only one edge is out of range — e.g.
  // 1600x3000 became 1600x2048 — making gpt-image edit on a wrong-shaped canvas
  // that pixelLockComposite then stretches back. The 1:3–3:1 guard above means
  // the shrink-to-fit and grow-to-fit factors can never conflict.
  const longEdge = Math.max(width, height)
  const shortEdge = Math.min(width, height)
  let scale = Math.min(1, EXACT_SIZE_MAX_EDGE / longEdge)
  scale = Math.max(scale, EXACT_SIZE_MIN_EDGE / shortEdge)

  return `${clampEdge(width * scale)}x${clampEdge(height * scale)}`
}
