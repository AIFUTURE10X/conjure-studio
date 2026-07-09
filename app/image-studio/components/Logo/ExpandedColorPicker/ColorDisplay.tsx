"use client"

/**
 * Color Display Component
 * Shows selected color info with clear button
 */

import { GRADIENT_DEFINITIONS, type ColorOption } from '@/app/image-studio/constants/color-palettes'
import type { RgbaColor } from '@/app/image-studio/utils/color-conversions'

interface ColorDisplayProps {
  selectedColor: ColorOption | null
  customColor?: string | null
  onClear: () => void
}

export function ColorDisplay({
  selectedColor,
  customColor,
  onClear,
}: ColorDisplayProps) {
  const showDisplay = selectedColor || (customColor && /^#[0-9A-Fa-f]{6}$/.test(customColor))

  if (!showDisplay) return null

  return (
    <div className="flex items-center justify-between p-2 bg-zinc-800/30 rounded-lg">
      <div className="flex items-center gap-2">
        <div
          className="w-6 h-6 rounded border border-zinc-600"
          style={{
            background: selectedColor
              ? (GRADIENT_DEFINITIONS[selectedColor.value] || selectedColor.hex)
              : customColor || undefined
          }}
        />
        <span className="text-xs text-zinc-300">
          {selectedColor ? selectedColor.name : `Custom: ${customColor}`}
        </span>
      </div>
      <button
        onClick={onClear}
        className="text-xs text-zinc-500 hover:text-white"
      >
        Clear
      </button>
    </div>
  )
}
