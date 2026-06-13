"use client"

/**
 * UiZoomControl
 *
 * Top-bar control that scales the whole interface. Installed/standalone app
 * windows hide the browser's zoom UI, so this gives reliable zoom in both the
 * browser and the installed app. The level is persisted across sessions, and
 * in standalone mode Ctrl/Cmd +/-/0 drive it too (in a normal tab those keys
 * are left to the browser's native zoom).
 */

import { useCallback, useEffect, useState } from 'react'
import { ZoomIn, ZoomOut } from 'lucide-react'
import {
  UI_ZOOM_MIN,
  UI_ZOOM_MAX,
  UI_ZOOM_STEP,
  applyUiZoom,
  clampUiZoom,
  isStandaloneDisplay,
  readStoredUiZoom,
  storeUiZoom,
} from '@/lib/ui-zoom'

export function UiZoomControl() {
  const [zoom, setZoom] = useState<number>(() => readStoredUiZoom())

  // Keep the DOM scale and stored value in sync with state.
  useEffect(() => {
    applyUiZoom(zoom)
    storeUiZoom(zoom)
  }, [zoom])

  const zoomIn = useCallback(() => setZoom((z) => clampUiZoom(z + UI_ZOOM_STEP)), [])
  const zoomOut = useCallback(() => setZoom((z) => clampUiZoom(z - UI_ZOOM_STEP)), [])
  const resetZoom = useCallback(() => setZoom(1), [])

  // In the installed app the browser's Ctrl +/- shortcuts are unavailable, so
  // wire them to the in-app zoom. Skipped in a normal tab (native zoom wins).
  useEffect(() => {
    if (!isStandaloneDisplay()) return

    const handleKey = (e: KeyboardEvent) => {
      if (!(e.ctrlKey || e.metaKey) || e.altKey || e.shiftKey) return
      if (e.key === '=' || e.key === '+') {
        e.preventDefault()
        zoomIn()
      } else if (e.key === '-' || e.key === '_') {
        e.preventDefault()
        zoomOut()
      } else if (e.key === '0') {
        e.preventDefault()
        resetZoom()
      }
    }

    window.addEventListener('keydown', handleKey)
    return () => window.removeEventListener('keydown', handleKey)
  }, [zoomIn, zoomOut, resetZoom])

  return (
    <div className="hidden lg:flex items-center gap-0.5 p-1 bg-zinc-900 rounded-lg border border-zinc-800">
      <button
        onClick={zoomOut}
        disabled={zoom <= UI_ZOOM_MIN}
        title="Zoom out interface (Ctrl -)"
        aria-label="Zoom out interface"
        className="p-1.5 rounded-md text-zinc-400 hover:text-white hover:bg-zinc-800 transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
      >
        <ZoomOut className="w-4 h-4" />
      </button>

      <button
        onClick={resetZoom}
        title="Reset interface zoom (Ctrl 0)"
        aria-label="Reset interface zoom"
        className="min-w-[44px] px-1 text-center text-xs font-medium text-zinc-300 hover:text-white transition-colors"
      >
        {Math.round(zoom * 100)}%
      </button>

      <button
        onClick={zoomIn}
        disabled={zoom >= UI_ZOOM_MAX}
        title="Zoom in interface (Ctrl +)"
        aria-label="Zoom in interface"
        className="p-1.5 rounded-md text-zinc-400 hover:text-white hover:bg-zinc-800 transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
      >
        <ZoomIn className="w-4 h-4" />
      </button>
    </div>
  )
}
