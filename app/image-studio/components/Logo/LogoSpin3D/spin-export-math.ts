/**
 * Pure timing, framing and naming maths for the 3D spin export.
 *
 * Import-free on purpose so `scripts/check-logo-3d-export.cjs` can transpile and
 * EXECUTE it. Encoding needs WebCodecs and rendering needs a GPU, neither of
 * which exists in CI — so every decision that can be gotten wrong silently
 * (frame counts, loop seam, camera framing) lives here instead of inline in the
 * encoder.
 */

export type ExportFormat = 'mp4' | 'webm'

export interface ExportResolution {
  id: string
  label: string
  width: number
  height: number
}

export const EXPORT_RESOLUTIONS: ExportResolution[] = [
  { id: '720p', label: '720p', width: 1280, height: 720 },
  { id: '1080p', label: '1080p', width: 1920, height: 1080 },
  { id: 'square', label: 'Square', width: 1080, height: 1080 },
]

export const EXPORT_FPS_OPTIONS = [24, 30, 60]
export const EXPORT_MIN_SECONDS = 2
export const EXPORT_MAX_SECONDS = 10

/** Clamp a requested duration to the supported range, rejecting junk. */
export function clampDuration(seconds: number): number {
  if (!Number.isFinite(seconds)) return EXPORT_MIN_SECONDS
  return Math.min(EXPORT_MAX_SECONDS, Math.max(EXPORT_MIN_SECONDS, seconds))
}

/**
 * Frames in the clip.
 *
 * Rounded, not floored: 2.5s at 24fps is 60 frames, and a floor would quietly
 * shorten the clip. The encoder renders indices 0..count-1.
 */
export function frameCountFor(durationSeconds: number, fps: number): number {
  const duration = clampDuration(durationSeconds)
  const safeFps = Number.isFinite(fps) && fps > 0 ? fps : 30
  return Math.max(1, Math.round(duration * safeFps))
}

/**
 * Whole spin revolutions for a clip, chosen nearest to the preview's speed.
 *
 * AC-3 pins the loop: rotation must span a whole number of turns across a
 * duration the user fixed, so the export cannot always reproduce the preview's
 * exact velocity — 4s at 1x previews 2/3 of a turn, and encoding 2/3 literally
 * would snap 120° at the wrap point. Rounding picks the whole count closest to
 * the preview's rate, and the floor of one keeps a short slow clip spinning at
 * all (zero turns is a static image, not a spin). The distortion is largest
 * where the floor bites — 2s at 0.2x previews 1/15 of a turn but exports one —
 * so the export panel shows the resulting turn count rather than absorbing it
 * silently.
 *
 * Duration is clamped by the same rule frameCountFor uses, so a junk duration
 * cannot ask for hundreds of turns inside a ten-second clip.
 */
export function exportRevolutions(durationSeconds: number, speed: number, basePeriodSeconds: number): number {
  const duration = clampDuration(durationSeconds)
  const safeSpeed = Number.isFinite(speed) && speed > 0 ? speed : 1
  const safePeriod = Number.isFinite(basePeriodSeconds) && basePeriodSeconds > 0 ? basePeriodSeconds : 6
  return Math.max(1, Math.round((duration * safeSpeed) / safePeriod))
}

/**
 * Rotation, in turns, for one frame — the property that makes the clip loop.
 *
 * Frame 0 is 0 turns and frame `frameCount` would be exactly `revolutions`, i.e.
 * the same orientation as frame 0. Since only 0..frameCount-1 are rendered, the
 * last rendered frame sits one step short of a full turn, so playback wraps with
 * no duplicated frame and no visible jump. Dividing by `frameCount - 1` instead
 * — the obvious off-by-one — renders the start orientation twice and stutters.
 */
export function frameTurns(frameIndex: number, frameCount: number, revolutions = 1): number {
  if (!(frameCount > 0)) return 0
  return (frameIndex / frameCount) * revolutions
}

/**
 * How many whole turns the tumble tilt makes across a clip.
 *
 * Tumble rotates two axes at once. The spin axis lands on a whole turn by
 * construction, but the tilt axis only closes if IT also completes a whole number
 * of turns — otherwise the clip ends mid-tilt and the loop snaps, which is the
 * one thing AC-3 forbids.
 *
 * Rounding the tilt to a whole number is the nearest legal fit to the preview's
 * 0.4 ratio — exact when the spin makes five turns, coarser below. At one spin
 * turn the only whole tilts are 0 and 1, and 0 is no tumble at all (the X axis
 * would never move, collapsing the export into a plain Y spin), so a short
 * tumble export visibly tilts faster than the preview. That is the price of
 * closure, accepted deliberately: the obvious alternative — keeping the
 * preview's fractional ratio — shipped once and snapped at the seam on every
 * duration/speed combination but one. `max(1, …)` is that floor.
 */
export const TUMBLE_TILT_RATIO = 0.4

export function tumbleTiltTurns(revolutions: number): number {
  const safe = Number.isFinite(revolutions) && revolutions > 0 ? revolutions : 1
  return Math.max(1, Math.round(safe * TUMBLE_TILT_RATIO))
}

/** Presentation timestamp, in seconds, for a frame. */
export function frameTimestamp(frameIndex: number, fps: number): number {
  const safeFps = Number.isFinite(fps) && fps > 0 ? fps : 30
  return frameIndex / safeFps
}

/** Duration of a single frame, in seconds. */
export function frameDuration(fps: number): number {
  const safeFps = Number.isFinite(fps) && fps > 0 ? fps : 30
  return 1 / safeFps
}

/** Exact clip length the encoder will produce, for asserting against the request. */
export function clipDurationFor(durationSeconds: number, fps: number): number {
  return frameCountFor(durationSeconds, fps) * frameDuration(fps)
}

/**
 * Camera distance that fits the logo for a given aspect ratio.
 *
 * The preview panel is wide; an export can be 16:9 or 1:1. A fixed distance would
 * frame those differently — the square export would crop a wide logo — so both
 * preview and export derive distance from their own aspect, which is what makes
 * the export actually match what was on screen.
 *
 * Vertical FOV binds on wide aspects, horizontal on narrow ones, so take whichever
 * pushes the camera further back.
 */
export function cameraDistanceFor(aspect: number, fovDegrees: number, size = 1, margin = 1.35): number {
  const safeAspect = Number.isFinite(aspect) && aspect > 0 ? aspect : 1
  const halfFov = ((Number.isFinite(fovDegrees) && fovDegrees > 0 ? fovDegrees : 45) * Math.PI) / 360
  const halfExtent = (size * margin) / 2
  const forVertical = halfExtent / Math.tan(halfFov)
  const forHorizontal = halfExtent / (safeAspect * Math.tan(halfFov))
  return Math.max(forVertical, forHorizontal)
}

/** H.264 cannot carry an alpha channel; VP9-in-WebM can. */
export function formatSupportsAlpha(format: ExportFormat): boolean {
  return format === 'webm'
}

/**
 * A transparent background is only honoured by a format that can carry alpha.
 * Returned so the UI can say so before the user commits to an encode, rather
 * than handing back a video with a black box where the transparency should be.
 */
export function alphaConflict(format: ExportFormat, isTransparent: boolean): boolean {
  return isTransparent && !formatSupportsAlpha(format)
}

/** Bitrate scaled to pixel count and frame rate, so 60fps 1080p isn't starved. */
export function bitrateFor(width: number, height: number, fps: number): number {
  const safeFps = Number.isFinite(fps) && fps > 0 ? fps : 30
  const pixels = Math.max(1, width * height)
  // ~0.12 bits per pixel per frame, floored so small/short clips stay clean.
  return Math.max(2_000_000, Math.round(pixels * safeFps * 0.12))
}

/**
 * Download filename. Identifies the source logo and the format so a folder of
 * exports is navigable, rather than a pile of `download.mp4`.
 */
export function exportFilename(prompt: string, format: ExportFormat): string {
  const slug = (prompt || '')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 40)
  return `${slug || 'logo'}-3d-spin.${format}`
}
