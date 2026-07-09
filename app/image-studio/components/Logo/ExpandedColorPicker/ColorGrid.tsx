"use client"

/**
 * Color Grid Component
 * Grid of selectable color/gradient presets
 */

import {
  EXPANDED_COLOR_PRESETS,
  GRADIENT_DEFINITIONS,
  type ColorOption,
  type ColorCategory
} from '@/app/image-studio/constants/color-palettes'

interface ColorGridProps {
  activeCategory: ColorCategory
  selectedColor: ColorOption | null
  onColorClick: (color: ColorOption) => void
}

export function ColorGrid({
  activeCategory,
  selectedColor,
  onColorClick,
}: ColorGridProps) {
  const isGradientCategory = activeCategory === 'gradient'

  return (
    <div className="grid grid-cols-10 gap-1.5 p-2 bg-zinc-800/50 rounded-lg">
      {EXPANDED_COLOR_PRESETS[activeCategory].map((color) => {
        const isGradient = isGradientCategory && GRADIENT_DEFINITIONS[color.value]
        return (
          <button
            key={color.value}
            onClick={() => onColorClick(color)}
            className={`relative w-7 h-7 rounded-md transition-all hover:scale-110 ${
              selectedColor?.value === color.value
                ? 'ring-2 ring-purple-500 ring-offset-2 ring-offset-zinc-900'
                : 'border border-zinc-600 hover:border-zinc-400'
            }`}
            style={{
              background: isGradient
                ? GRADIENT_DEFINITIONS[color.value]
                : color.hex
            }}
            title={color.name}
          />
        )
      })}
    </div>
  )
}
