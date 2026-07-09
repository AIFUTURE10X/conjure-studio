"use client"

/**
 * ZoomControls
 *
 * Compact zoom in / out / reset bar used by the full-screen viewers.
 * The percentage label doubles as a reset-to-fit button.
 */

import { ZoomIn, ZoomOut } from 'lucide-react'
import type { ZoomControlState } from '../hooks/useImageZoom'

interface ZoomControlsProps {
  state: ZoomControlState
  className?: string
}

export function ZoomControls({ state, className = '' }: ZoomControlsProps) {
  const { zoom, canZoomIn, canZoomOut, zoomIn, zoomOut, reset } = state

  return (
    <div
      className={`flex items-center gap-1 rounded-full bg-zinc-800/80 backdrop-blur px-2 py-1 ${className}`}
    >
      <button
        onClick={zoomOut}
        disabled={!canZoomOut}
        title="Zoom out (-)"
        aria-label="Zoom out"
        className="p-2 rounded-full text-zinc-300 hover:text-white hover:bg-zinc-700 transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
      >
        <ZoomOut className="w-5 h-5" />
      </button>

      <button
        onClick={reset}
        title="Reset zoom (0)"
        aria-label="Reset zoom"
        className="min-w-[52px] text-center text-sm font-medium text-zinc-200 hover:text-white transition-colors"
      >
        {Math.round(zoom * 100)}%
      </button>

      <button
        onClick={zoomIn}
        disabled={!canZoomIn}
        title="Zoom in (+)"
        aria-label="Zoom in"
        className="p-2 rounded-full text-zinc-300 hover:text-white hover:bg-zinc-700 transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
      >
        <ZoomIn className="w-5 h-5" />
      </button>
    </div>
  )
}
