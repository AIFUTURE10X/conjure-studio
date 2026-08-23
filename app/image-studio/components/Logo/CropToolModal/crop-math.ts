/**
 * Pure geometry helpers for the logo crop tool.
 *
 * All rects are stored as fractions of the image (0..1 on both axes) so they
 * survive window resizes without recalculation. Aspect ratios are expressed in
 * PIXEL space (w/h), so fraction-space math needs the image's own aspect to
 * convert: wFrac = hFrac * (targetAspect / imageAspect).
 */

export interface CropRect {
  x: number
  y: number
  w: number
  h: number
}

export type CropHandle = 'nw' | 'n' | 'ne' | 'e' | 'se' | 's' | 'sw' | 'w'

/** Smallest allowed crop edge, as a fraction of the image. */
export const MIN_CROP_FRACTION = 0.02

export const FULL_RECT: CropRect = { x: 0, y: 0, w: 1, h: 1 }

const clamp01 = (value: number) => Math.min(Math.max(value, 0), 1)

/** Convert a pixel-space aspect (w/h) to fraction-space (wFrac/hFrac). */
export const toFractionAspect = (pixelAspect: number, imageAspect: number) =>
  pixelAspect / imageAspect

/** Largest centered rect matching a fraction-space aspect. */
export function centeredAspectRect(fracAspect: number): CropRect {
  const w = fracAspect >= 1 ? 1 : fracAspect
  const h = fracAspect >= 1 ? 1 / fracAspect : 1
  return { x: (1 - w) / 2, y: (1 - h) / 2, w, h }
}

/** Translate a rect so its origin lands at (x, y), kept fully inside the image. */
export function moveRect(rect: CropRect, x: number, y: number): CropRect {
  return {
    ...rect,
    x: Math.min(Math.max(x, 0), 1 - rect.w),
    y: Math.min(Math.max(y, 0), 1 - rect.h),
  }
}

/** Free-form resize: the dragged edge(s) follow the pointer, opposite edges stay put. */
export function resizeRectFree(rect: CropRect, handle: CropHandle, px: number, py: number): CropRect {
  let left = rect.x
  let top = rect.y
  let right = rect.x + rect.w
  let bottom = rect.y + rect.h
  const cx = clamp01(px)
  const cy = clamp01(py)

  if (handle.includes('w')) left = Math.min(cx, right - MIN_CROP_FRACTION)
  if (handle.includes('e')) right = Math.max(cx, left + MIN_CROP_FRACTION)
  if (handle.includes('n')) top = Math.min(cy, bottom - MIN_CROP_FRACTION)
  if (handle.includes('s')) bottom = Math.max(cy, top + MIN_CROP_FRACTION)

  return { x: left, y: top, w: right - left, h: bottom - top }
}

/**
 * Aspect-locked resize from a corner: the opposite corner anchors, the crop
 * grows toward the pointer while holding the fraction-space aspect.
 */
export function resizeRectLocked(
  rect: CropRect,
  handle: 'nw' | 'ne' | 'se' | 'sw',
  px: number,
  py: number,
  fracAspect: number
): CropRect {
  const dirX = handle.includes('e') ? 1 : -1
  const dirY = handle.includes('s') ? 1 : -1
  const anchorX = dirX > 0 ? rect.x : rect.x + rect.w
  const anchorY = dirY > 0 ? rect.y : rect.y + rect.h

  let w = Math.max((clamp01(px) - anchorX) * dirX, MIN_CROP_FRACTION)
  let h = Math.max((clamp01(py) - anchorY) * dirY, MIN_CROP_FRACTION)

  // Snap to the aspect using whichever axis the pointer pushed further.
  if (w / fracAspect > h) h = w / fracAspect
  else w = h * fracAspect

  // Shrink back if the locked shape would spill past the image edge.
  const maxW = dirX > 0 ? 1 - anchorX : anchorX
  const maxH = dirY > 0 ? 1 - anchorY : anchorY
  if (w > maxW) {
    w = maxW
    h = w / fracAspect
  }
  if (h > maxH) {
    h = maxH
    w = h * fracAspect
  }

  return {
    x: dirX > 0 ? anchorX : anchorX - w,
    y: dirY > 0 ? anchorY : anchorY - h,
    w,
    h,
  }
}

/**
 * Rect drawn from a fixed origin toward the pointer (fresh drag on empty
 * space). With an aspect lock this reuses the corner-resize math.
 */
export function drawRect(
  originX: number,
  originY: number,
  px: number,
  py: number,
  fracAspect: number | null
): CropRect {
  if (fracAspect !== null) {
    const seed: CropRect = { x: originX, y: originY, w: 0, h: 0 }
    const handle = `${py >= originY ? 's' : 'n'}${px >= originX ? 'e' : 'w'}` as 'nw' | 'ne' | 'se' | 'sw'
    return resizeRectLocked(seed, handle, px, py, fracAspect)
  }
  const cx = clamp01(px)
  const cy = clamp01(py)
  return {
    x: Math.min(originX, cx),
    y: Math.min(originY, cy),
    w: Math.max(Math.abs(cx - originX), MIN_CROP_FRACTION),
    h: Math.max(Math.abs(cy - originY), MIN_CROP_FRACTION),
  }
}

/** Fraction rect → integer source-pixel rect, clamped inside the image. */
export function toPixelRect(rect: CropRect, naturalWidth: number, naturalHeight: number) {
  const sx = Math.min(Math.round(rect.x * naturalWidth), naturalWidth - 1)
  const sy = Math.min(Math.round(rect.y * naturalHeight), naturalHeight - 1)
  return {
    sx,
    sy,
    sw: Math.max(1, Math.min(Math.round(rect.w * naturalWidth), naturalWidth - sx)),
    sh: Math.max(1, Math.min(Math.round(rect.h * naturalHeight), naturalHeight - sy)),
  }
}
