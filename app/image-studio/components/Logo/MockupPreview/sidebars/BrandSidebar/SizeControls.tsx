"use client"

/**
 * Size Controls Component
 * Buttons and slider for controlling text scale
 */

import { ZoomIn, ZoomOut } from 'lucide-react'

interface SizeControlsProps {
  brandScale: number
  onScaleIncrease: () => void
  onScaleDecrease: () => void
  onScaleChange?: (scale: number) => void
}

export function SizeControls({
  brandScale,
  onScaleIncrease,
  onScaleDecrease,
  onScaleChange,
}: SizeControlsProps) {
  return (
    <div className="w-full space-y-1.5">
      <div className="flex items-center justify-between">
        <span className="text-[10px] text-zinc-300 font-normal uppercase">Size</span>
        <span className="text-[10px] text-zinc-300 font-normal">{Math.round(brandScale * 100)}%</span>
      </div>
      <div className="flex items-center gap-2">
        <button
          onClick={onScaleDecrease}
          className="p-1.5 text-zinc-400 hover:text-white bg-zinc-800/50 hover:bg-zinc-700 rounded-md border border-zinc-700/50"
        >
          <ZoomOut className="w-3.5 h-3.5" />
        </button>
        <div className="flex-1 text-center text-xs text-zinc-300 font-extralight">{Math.round(brandScale * 100)}%</div>
        <button
          onClick={onScaleIncrease}
          className="p-1.5 text-zinc-400 hover:text-white bg-zinc-800/50 hover:bg-zinc-700 rounded-md border border-zinc-700/50"
        >
          <ZoomIn className="w-3.5 h-3.5" />
        </button>
      </div>
      {/* Size Slider */}
      {onScaleChange && (
        <input
          type="range"
          min="50"
          max="800"
          value={Math.round(brandScale * 100)}
          onChange={(e) => onScaleChange(parseInt(e.target.value) / 100)}
          className="w-full h-1.5 bg-zinc-700 rounded-lg appearance-none cursor-pointer accent-purple-500"
        />
      )}
    </div>
  )
}
