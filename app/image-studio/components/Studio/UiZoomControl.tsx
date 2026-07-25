"use client"

/**
 * UiZoomControl
 *
 * Top-bar control that scales the whole interface. It replaces browser zoom
 * everywhere: installed/standalone windows hide the browser's zoom UI, and in a
 * normal tab Chrome's zoom only offers a coarse preset ladder (…100/110/125…).
 * Ctrl/Cmd +/-/0 and Ctrl/Cmd + wheel are intercepted in both cases so zooming
 * moves in even UI_ZOOM_STEP increments. The level persists across sessions.
 */

import { useCallback, useEffect, useState } from 'react'
import { ZoomIn, ZoomOut } from 'lucide-react'
import {
  UI_ZOOM_MIN,
  UI_ZOOM_MAX,
  UI_ZOOM_STEP,
  applyUiZoom,
  clampUiZoom,
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

  const zoomBy = useCallback((delta: number) => setZoom((z) => clampUiZoom(z + delta)), [])
  const zoomIn = useCallback(() => zoomBy(UI_ZOOM_STEP), [zoomBy])
  const zoomOut = useCallback(() => zoomBy(-UI_ZOOM_STEP), [zoomBy])
  const resetZoom = useCallback(() => setZoom(1), [])

  // Own the zoom gestures in every context: unavailable in the installed app,
  // and too coarse in a browser tab (Chrome's presets jump 100 → 110 → 125).
  useEffect(() => {
    const handleKey = (e: KeyboardEvent) => {
      if (!(e.ctrlKey || e.metaKey) || e.altKey || e.shiftKey) return
      if (e.key === '=' || e.key === '+') {
        e.preventDefault()
        zoomBy(UI_ZOOM_STEP)
      } else if (e.key === '-' || e.key === '_') {
        e.preventDefault()
        zoomBy(-UI_ZOOM_STEP)
      } else if (e.key === '0') {
        e.preventDefault()
        resetZoom()
      }
    }
    const handleWheel = (e: WheelEvent) => {
      if (!(e.ctrlKey || e.metaKey)) return
      e.preventDefault()
      zoomBy(e.deltaY < 0 ? UI_ZOOM_STEP : -UI_ZOOM_STEP)
    }

    window.addEventListener('keydown', handleKey)
    window.addEventListener('wheel', handleWheel, { passive: false })
    return () => {
      window.removeEventListener('keydown', handleKey)
      window.removeEventListener('wheel', handleWheel)
    }
  }, [zoomBy, resetZoom])

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
        title="Reset interface zoom (Ctrl 0 · Ctrl + scroll to zoom)"
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
