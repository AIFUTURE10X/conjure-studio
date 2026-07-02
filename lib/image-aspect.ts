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
