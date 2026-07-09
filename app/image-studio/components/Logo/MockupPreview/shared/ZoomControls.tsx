"use client"

/**
 * Zoom Controls Component
 *
 * Provides sliders for canvas zoom (view the full mockup) and logo size.
 */

import { useMemo, useCallback } from 'react'
import { ZoomIn, ZoomOut, RotateCcw } from 'lucide-react'
import { Slider } from '@/components/ui/slider'

interface ZoomControlsProps {
  canvasZoom: number
  onCanvasZoomChange: (zoom: number) => void
  logoScale: number
  onLogoScaleChange: (scale: number) => void
  defaultLogoScale?: number
}

export function ZoomControls({
  canvasZoom,
  onCanvasZoomChange,
  logoScale,
  onLogoScaleChange,
  defaultLogoScale = 1.0,
}: ZoomControlsProps) {
  const handleResetZoom = useCallback(() => {
    onCanvasZoomChange(1.0)
    onLogoScaleChange(defaultLogoScale)
  }, [onCanvasZoomChange, onLogoScaleChange, defaultLogoScale])

  // Memoize value arrays to prevent infinite render loop from Radix Slider
  const canvasZoomValue = useMemo(() => [Math.round(canvasZoom * 100)], [canvasZoom])
  const logoScaleValue = useMemo(() => [Math.round(logoScale * 100)], [logoScale])

  // Memoize handlers to keep references stable
  const handleCanvasZoomChange = useCallback(([value]: number[]) => {
    onCanvasZoomChange(value / 100)
  }, [onCanvasZoomChange])

  const handleLogoScaleChange = useCallback(([value]: number[]) => {
    onLogoScaleChange(value / 100)
  }, [onLogoScaleChange])

  return (
    <div className="space-y-3 p-3 bg-zinc-800/50 rounded-lg">
      {/* Header with reset */}
      <div className="flex items-center justify-between">
        <span className="text-[10px] text-zinc-200 font-medium uppercase">
          Zoom Controls
        </span>
        <button
          onClick={handleResetZoom}
          className="p-1 rounded hover:bg-zinc-700 text-zinc-400 hover:text-white transition-colors"
          title="Reset zoom"
        >
          <RotateCcw className="w-3 h-3" />
        </button>
      </div>

      {/* Canvas/View Zoom */}
      <div className="space-y-2">
        <div className="flex items-center justify-between">
          <span className="text-xs text-zinc-200 font-normal flex items-center gap-1.5">
            <ZoomOut className="w-3 h-3" />
            View
          </span>
          <span className="text-xs text-zinc-300 font-mono">
            {Math.round(canvasZoom * 100)}%
          </span>
        </div>
        <Slider
          value={canvasZoomValue}
          min={50}
          max={150}
          step={1}
          onValueChange={handleCanvasZoomChange}
          className="w-full"
        />
      </div>

      {/* Logo Size */}
      <div className="space-y-2">
        <div className="flex items-center justify-between">
          <span className="text-xs text-zinc-200 font-normal flex items-center gap-1.5">
            <ZoomIn className="w-3 h-3" />
            Logo
          </span>
          <span className="text-xs text-zinc-300 font-mono">
            {Math.round(logoScale * 100)}%
          </span>
        </div>
        <Slider
          value={logoScaleValue}
          min={20}
          max={200}
          step={1}
          onValueChange={handleLogoScaleChange}
          className="w-full"
        />
      </div>
    </div>
  )
}
