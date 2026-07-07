/**
 * App-wide UI zoom (page scale) helpers.
 *
 * Installed/standalone app windows hide the browser's zoom controls, so we
 * provide our own: a persisted scale applied to the document root via the CSS
 * `zoom` property. Works identically in a browser tab and the installed app.
 */

export const UI_ZOOM_KEY = 'ui-zoom'
export const UI_ZOOM_MIN = 0.5
export const UI_ZOOM_MAX = 2
export const UI_ZOOM_STEP = 0.1

/** Fired on window whenever applyUiZoom changes the document zoom. */
export const UI_ZOOM_EVENT = 'ui-zoom-change'

/** Clamp to the supported range and round to whole percent (avoids float drift). */
export const clampUiZoom = (zoom: number): number =>
  Math.min(UI_ZOOM_MAX, Math.max(UI_ZOOM_MIN, Math.round(zoom * 100) / 100))

export function applyUiZoom(zoom: number): void {
  if (typeof document === 'undefined') return
  const root = document.documentElement
  if (zoom === 1) {
    // `zoom: 1` is the default; clearing keeps the inline style tidy.
    root.style.zoom = ''
    root.style.removeProperty('--ui-zoom')
  } else {
    root.style.zoom = String(zoom)
    // Mirrored as a CSS var so fixed full-window layouts can size themselves
    // to `100vw / zoom` × `100dvh / zoom` and still fill the window.
    root.style.setProperty('--ui-zoom', String(zoom))
  }
  window.dispatchEvent(new Event(UI_ZOOM_EVENT))
}

/**
 * The zoom currently applied to <html> — the inline style set by applyUiZoom
 * or the pre-paint boot script in app/layout.tsx. 1 when no zoom is applied.
 */
export function readAppliedUiZoom(): number {
  if (typeof document === 'undefined') return 1
  const raw = document.documentElement.style.zoom
  const parsed = raw ? Number.parseFloat(String(raw)) : 1
  return Number.isFinite(parsed) && parsed > 0 ? parsed : 1
}

export function readStoredUiZoom(): number {
  if (typeof window === 'undefined') return 1
  try {
    const raw = window.localStorage.getItem(UI_ZOOM_KEY)
    const parsed = raw ? Number(raw) : 1
    return Number.isFinite(parsed) ? clampUiZoom(parsed) : 1
  } catch {
    return 1
  }
}

export function storeUiZoom(zoom: number): void {
  if (typeof window === 'undefined') return
  try {
    window.localStorage.setItem(UI_ZOOM_KEY, String(zoom))
  } catch {
    // Ignore storage failures (private mode, quota, etc.)
  }
}

/** True when running as an installed/standalone app (no browser zoom UI). */
export function isStandaloneDisplay(): boolean {
  if (typeof window === 'undefined') return false
  return (
    window.matchMedia?.('(display-mode: standalone)').matches ||
    window.matchMedia?.('(display-mode: window-controls-overlay)').matches ||
    // iOS Safari
    (window.navigator as Navigator & { standalone?: boolean }).standalone === true
  )
}
