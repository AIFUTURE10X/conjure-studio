"use client"

/**
 * Expanded Color Picker Component
 * Full-featured color picker with categories, presets, and custom input
 *
 * Refactored into sub-components:
 * - FullColorPicker: Saturation/hue picker with RGB inputs
 * - CategoryTabs: Tab navigation for color categories
 * - ColorGrid: Selectable color/gradient presets
 * - ColorDisplay: Selected color info
 */

import { useState, useEffect } from 'react'
import { hexToRgba, rgbaToHex, type RgbaColor } from '@/app/image-studio/utils/color-conversions'
import type { ColorOption, ColorCategory } from '@/app/image-studio/constants/color-palettes'
import { FullColorPicker } from './FullColorPicker'
import { CategoryTabs } from './CategoryTabs'
import { ColorGrid } from './ColorGrid'
import { ColorDisplay } from './ColorDisplay'

// Re-export types for backwards compatibility
export type { ColorOption, ColorCategory } from '@/app/image-studio/constants/color-palettes'
export {
  COLOR_CATEGORIES,
  EXPANDED_COLOR_PRESETS,
  GRADIENT_DEFINITIONS
} from '@/app/image-studio/constants/color-palettes'

interface ExpandedColorPickerProps {
  label: string
  selectedColor: ColorOption | null
  onSelectColor: (color: ColorOption | null) => void
  customColor?: string | null
  onCustomColorChange?: (hex: string | null) => void
  showCustomInput?: boolean
}

export function ExpandedColorPicker({
  label,
  selectedColor,
  onSelectColor,
  customColor,
  onCustomColorChange,
  showCustomInput = true,
}: ExpandedColorPickerProps) {
  const [activeCategory, setActiveCategory] = useState<ColorCategory>('primary')
  const [rgbaColor, setRgbaColor] = useState<RgbaColor>(
    selectedColor ? hexToRgba(selectedColor.hex) : { r: 255, g: 255, b: 255, a: 1 }
  )
  const [rgbInputs, setRgbInputs] = useState({
    r: rgbaColor.r.toString(),
    g: rgbaColor.g.toString(),
    b: rgbaColor.b.toString()
  })

  // Sync when selectedColor changes externally
  useEffect(() => {
    if (selectedColor) {
      const rgba = hexToRgba(selectedColor.hex)
      setRgbaColor(rgba)
      setRgbInputs({ r: rgba.r.toString(), g: rgba.g.toString(), b: rgba.b.toString() })
    }
  }, [selectedColor])

  const handleColorClick = (color: ColorOption) => {
    if (selectedColor?.value === color.value) {
      onSelectColor(null)
    } else {
      onSelectColor(color)
      if (onCustomColorChange) {
        onCustomColorChange(null)
      }
      const rgba = hexToRgba(color.hex)
      setRgbaColor(rgba)
      setRgbInputs({ r: rgba.r.toString(), g: rgba.g.toString(), b: rgba.b.toString() })
    }
  }

  const handleRgbaChange = (color: RgbaColor) => {
    setRgbaColor(color)
    setRgbInputs({ r: color.r.toString(), g: color.g.toString(), b: color.b.toString() })

    const hex = rgbaToHex(color)
    if (onCustomColorChange) {
      onCustomColorChange(hex)
    }
    onSelectColor(null) // Clear preset when using picker
  }

  const handleRgbInputChange = (channel: 'r' | 'g' | 'b', value: string) => {
    setRgbInputs({ ...rgbInputs, [channel]: value })

    if (value !== '' && !isNaN(parseInt(value))) {
      const numValue = Math.max(0, Math.min(255, parseInt(value) || 0))
      const newRgba = { ...rgbaColor, [channel]: numValue }
      handleRgbaChange(newRgba)
    }
  }

  const handleClear = () => {
    onSelectColor(null)
    if (onCustomColorChange) onCustomColorChange(null)
    setRgbaColor({ r: 255, g: 255, b: 255, a: 1 })
    setRgbInputs({ r: '255', g: '255', b: '255' })
  }

  return (
    <div className="space-y-3">
      {/* Label */}
      <label className="text-sm font-medium text-zinc-300">{label}</label>

      {/* Full Color Picker */}
      {showCustomInput && (
        <FullColorPicker
          rgbaColor={rgbaColor}
          rgbInputs={rgbInputs}
          onRgbaChange={handleRgbaChange}
          onRgbInputChange={handleRgbInputChange}
        />
      )}

      {/* Category Tabs */}
      <CategoryTabs
        activeCategory={activeCategory}
        onCategoryChange={setActiveCategory}
      />

      {/* Color Grid */}
      <ColorGrid
        activeCategory={activeCategory}
        selectedColor={selectedColor}
        onColorClick={handleColorClick}
      />

      {/* Selected Color Display */}
      <ColorDisplay
        selectedColor={selectedColor}
        customColor={customColor}
        onClear={handleClear}
      />
    </div>
  )
}
