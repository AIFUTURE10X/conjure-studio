"use client"

/**
 * Automatic version of the manual "zoom out, zoom in" that un-sticks the
 * installed app: WebView2 can lay out the first paint against a stale window
 * size and skip re-resolving it, and a document-zoom change is the one action
 * observed to force the full style recalc it needs. Shortly after first paint
 * (and once more after the window has settled), bump the root zoom by an
 * imperceptible 0.01% for a single frame, then restore it. Harmless on
 * surfaces that laid out correctly.
 */

import { useEffect } from 'react'

const NUDGE_DELAYS_MS = [50, 600]

/** Bump the document zoom for one frame; returns a cancel/restore function. */
const nudgeZoom = (): (() => void) => {
  const root = document.documentElement
  const prev = root.style.zoom
  const parsed = prev ? Number.parseFloat(String(prev)) : 1
  const base = Number.isFinite(parsed) && parsed > 0 ? parsed : 1
  root.style.zoom = String(base * 1.0001)
  const restore = () => {
    root.style.zoom = prev
  }
  const raf = window.requestAnimationFrame(restore)
  return () => {
    window.cancelAnimationFrame(raf)
    restore()
  }
}

export function useFirstPaintReflowNudge(): void {
  useEffect(() => {
    let cancelNudge: (() => void) | null = null
    const timers = NUDGE_DELAYS_MS.map((ms) =>
      window.setTimeout(() => {
        cancelNudge?.()
        cancelNudge = nudgeZoom()
      }, ms),
    )
    return () => {
      timers.forEach((timer) => window.clearTimeout(timer))
      cancelNudge?.()
    }
  }, [])
}
