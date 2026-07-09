"use client"

/**
 * LightboxControls Component
 *
 * Bottom control bar for the MockupLightbox with zoom, theme, and download controls
 */

import { X, ZoomIn, ZoomOut, Sun, Moon, Download, Maximize2 } from 'lucide-react'

interface LightboxControlsProps {
  onClose: () => void
  darkMode: boolean
  onToggleDarkMode: () => void
  zoomLevel: number
  onZoomChange: (delta: number) => void
  onZoomReset: () => void
  onDownload: () => void
}

export function LightboxControls({
  onClose,
  darkMode,
  onToggleDarkMode,
  zoomLevel,
  onZoomChange,
  onZoomReset,
  onDownload,
}: LightboxControlsProps) {
  return (
    <div className="flex-shrink-0 flex items-center gap-4 bg-zinc-800/60 rounded-full px-4 py-2">
      {/* Close Button */}
      <button
        onClick={onClose}
        className="p-2 rounded-full bg-zinc-700 text-zinc-400 hover:text-white hover:bg-red-500/80 transition-colors"
        title="Close (Esc)"
      >
        <X className="w-5 h-5" />
      </button>

      <div className="w-px h-6 bg-zinc-600" />

      {/* Dark/Light Mode Toggle */}
      <button
        onClick={onToggleDarkMode}
        className={`p-2 rounded-full transition-colors ${
          darkMode
            ? 'bg-zinc-700 text-yellow-400'
            : 'bg-zinc-700 text-zinc-400 hover:text-white'
        }`}
        title={darkMode ? 'Light mode' : 'Dark mode'}
      >
        {darkMode ? <Moon className="w-5 h-5" /> : <Sun className="w-5 h-5" />}
      </button>

      <div className="w-px h-6 bg-zinc-600" />

      {/* Zoom Controls */}
      <button
        onClick={() => onZoomChange(-0.25)}
        className="p-2 rounded-full bg-zinc-700 text-zinc-400 hover:text-white transition-colors disabled:opacity-50"
        title="Zoom out (-)"
        disabled={zoomLevel <= 0.5}
      >
        <ZoomOut className="w-5 h-5" />
      </button>

      <span className="text-sm text-zinc-400 min-w-[50px] text-center">
        {Math.round(zoomLevel * 100)}%
      </span>

      <button
        onClick={() => onZoomChange(0.25)}
        className="p-2 rounded-full bg-zinc-700 text-zinc-400 hover:text-white transition-colors disabled:opacity-50"
        title="Zoom in (+)"
        disabled={zoomLevel >= 3}
      >
        <ZoomIn className="w-5 h-5" />
      </button>

      <button
        onClick={onZoomReset}
        className="p-2 rounded-full bg-zinc-700 text-zinc-400 hover:text-white transition-colors"
        title="Reset zoom"
      >
        <Maximize2 className="w-5 h-5" />
      </button>

      <div className="w-px h-6 bg-zinc-600" />

      {/* Download Button */}
      <button
        onClick={onDownload}
        className="flex items-center gap-2 px-4 py-2 rounded-full bg-linear-to-r from-purple-500 to-pink-500 text-white font-medium hover:opacity-90 transition-opacity"
      >
        <Download className="w-4 h-4" />
        Download Logo
      </button>
    </div>
  )
}

export function KeyboardHints() {
  return (
    <div className="flex-shrink-0 flex items-center gap-4 text-xs text-zinc-500 mt-2">
      <span>← → Navigate</span>
      <span>+ - Zoom</span>
      <span>Esc Close</span>
    </div>
  )
}
