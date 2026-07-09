"use client"

/**
 * Logo Sidebar Component
 * Left sidebar: Logo settings (color, scale)
 */

import { ZoomIn, ZoomOut } from 'lucide-react'
import { TSHIRT_COLORS, type TShirtColor } from '../tshirt-assets'

interface LogoSidebarProps {
  selectedColor: TShirtColor
  showColorPicker: boolean
  logoScale: number
  onColorSelect: (color: TShirtColor) => void
  onToggleColorPicker: () => void
  onScaleIncrease: () => void
  onScaleDecrease: () => void
}

export function LogoSidebar({
  selectedColor,
  showColorPicker,
  logoScale,
  onColorSelect,
  onToggleColorPicker,
  onScaleIncrease,
  onScaleDecrease,
}: LogoSidebarProps) {
  return (
    <div className="flex flex-col gap-3 w-40 shrink-0 p-3 items-center justify-start max-h-[520px] overflow-y-auto scrollbar-hide">
      <div className="text-[11px] text-zinc-200 font-medium uppercase tracking-wider text-center w-full py-1 bg-zinc-800/50 rounded-md border border-zinc-700/50">Logo Settings</div>

      {/* T-Shirt Color - Grid */}
      <div className="w-full space-y-2">
        <div className="text-[10px] text-zinc-300 font-normal uppercase">T-Shirt Color</div>
        <div className="grid grid-cols-4 gap-1.5">
          {TSHIRT_COLORS.slice(0, 12).map((color) => (
            <button
              key={color.id}
              onClick={() => onColorSelect(color)}
              className={`w-7 h-7 rounded-md border-2 transition-all hover:scale-110 ${
                selectedColor.id === color.id ? 'border-purple-500 scale-105 shadow-lg shadow-purple-500/30' : 'border-zinc-700 hover:border-zinc-500'
              }`}
              style={{ backgroundColor: color.hex }}
              title={color.name}
            />
          ))}
        </div>
        {TSHIRT_COLORS.length > 12 && (
          <button
            onClick={onToggleColorPicker}
            className="w-full text-[9px] text-zinc-500 hover:text-zinc-300 font-extralight py-1"
          >
            {showColorPicker ? 'Show less' : `+${TSHIRT_COLORS.length - 12} more colors`}
          </button>
        )}
        {showColorPicker && (
          <div className="grid grid-cols-4 gap-1.5 pt-1">
            {TSHIRT_COLORS.slice(12).map((color) => (
              <button
                key={color.id}
                onClick={() => onColorSelect(color)}
                className={`w-7 h-7 rounded-md border-2 transition-all hover:scale-110 ${
                  selectedColor.id === color.id ? 'border-purple-500 scale-105' : 'border-zinc-700 hover:border-zinc-500'
                }`}
                style={{ backgroundColor: color.hex }}
                title={color.name}
              />
            ))}
          </div>
        )}
      </div>

      {/* Logo Scale Controls */}
      <div className="w-full space-y-2">
        <div className="text-[10px] text-zinc-300 font-normal uppercase">Logo Size</div>
        <div className="flex items-center gap-2">
          <button
            onClick={onScaleDecrease}
            className="p-1.5 text-zinc-400 hover:text-white bg-zinc-800/50 hover:bg-zinc-700 rounded-md border border-zinc-700/50"
            title="Decrease"
          >
            <ZoomOut className="w-3.5 h-3.5" />
          </button>
          <div className="flex-1 text-center text-xs text-zinc-300 font-extralight">{Math.round(logoScale * 100)}%</div>
          <button
            onClick={onScaleIncrease}
            className="p-1.5 text-zinc-400 hover:text-white bg-zinc-800/50 hover:bg-zinc-700 rounded-md border border-zinc-700/50"
            title="Increase"
          >
            <ZoomIn className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>
    </div>
  )
}
