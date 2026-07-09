"use client"

/**
 * Letter Color Picker Component
 * Allows per-letter color customization for brand names
 *
 * Refactored into sub-components:
 * - LetterGrid: Clickable letter buttons
 * - ColorPickerSection: Full picker with RGB inputs
 * - ColorSummary: Assigned colors display
 */

import { useState, useEffect } from 'react'
import { Palette } from 'lucide-react'
import { hexToRgba, rgbaToHex, type RgbaColor } from '@/app/image-studio/utils/color-conversions'
import type { ColorOption, LetterColorConfig } from '@/app/image-studio/constants/color-palettes'
import { LetterGrid } from './LetterGrid'
import { ColorPickerSection } from './ColorPickerSection'
import { ColorSummary } from './ColorSummary'

// Re-export types for backwards compatibility
export type { ColorOption, LetterColorConfig } from '@/app/image-studio/constants/color-palettes'
export { LETTER_COLOR_PALETTE } from '@/app/image-studio/constants/color-palettes'

interface LetterColorPickerProps {
  brandName: string
  letterColors: LetterColorConfig[]
  onLetterColorsChange: (colors: LetterColorConfig[]) => void
}

export function LetterColorPicker({
  brandName,
  letterColors,
  onLetterColorsChange,
}: LetterColorPickerProps) {
  const [selectedPosition, setSelectedPosition] = useState<number | null>(null)
  const [rgbaColor, setRgbaColor] = useState<RgbaColor>({ r: 255, g: 255, b: 255, a: 1 })
  const [rgbInputs, setRgbInputs] = useState({ r: '255', g: '255', b: '255' })

  // Remove spaces for letter display
  const letters = brandName.replace(/\s/g, '').split('')

  const getColorForPosition = (position: number): ColorOption | undefined => {
    return letterColors.find(lc => lc.position === position)?.color
  }

  // Sync color picker when selected position changes
  useEffect(() => {
    if (selectedPosition !== null) {
      const assignedColor = getColorForPosition(selectedPosition)
      if (assignedColor) {
        const rgba = hexToRgba(assignedColor.hex)
        setRgbaColor(rgba)
        setRgbInputs({ r: rgba.r.toString(), g: rgba.g.toString(), b: rgba.b.toString() })
      } else {
        // Default to white for new selection
        setRgbaColor({ r: 255, g: 255, b: 255, a: 1 })
        setRgbInputs({ r: '255', g: '255', b: '255' })
      }
    }
  }, [selectedPosition])

  const handleLetterClick = (position: number) => {
    if (selectedPosition === position) {
      setSelectedPosition(null)
    } else {
      setSelectedPosition(position)
    }
  }

  const handleColorSelect = (color: ColorOption) => {
    if (selectedPosition === null) return

    const existingIndex = letterColors.findIndex(lc => lc.position === selectedPosition)

    if (existingIndex >= 0) {
      const updated = [...letterColors]
      updated[existingIndex] = { position: selectedPosition, color }
      onLetterColorsChange(updated)
    } else {
      onLetterColorsChange([...letterColors, { position: selectedPosition, color }])
    }

    // Update picker to match selected preset
    const rgba = hexToRgba(color.hex)
    setRgbaColor(rgba)
    setRgbInputs({ r: rgba.r.toString(), g: rgba.g.toString(), b: rgba.b.toString() })
  }

  const handleRgbaChange = (color: RgbaColor) => {
    setRgbaColor(color)
    setRgbInputs({ r: color.r.toString(), g: color.g.toString(), b: color.b.toString() })

    if (selectedPosition !== null) {
      const hex = rgbaToHex(color)
      const customColor: ColorOption = { name: 'Custom', value: 'custom', hex }

      const existingIndex = letterColors.findIndex(lc => lc.position === selectedPosition)
      if (existingIndex >= 0) {
        const updated = [...letterColors]
        updated[existingIndex] = { position: selectedPosition, color: customColor }
        onLetterColorsChange(updated)
      } else {
        onLetterColorsChange([...letterColors, { position: selectedPosition, color: customColor }])
      }
    }
  }

  const handleRgbInputChange = (channel: 'r' | 'g' | 'b', value: string) => {
    setRgbInputs({ ...rgbInputs, [channel]: value })

    if (value !== '' && !isNaN(parseInt(value))) {
      const numValue = Math.max(0, Math.min(255, parseInt(value) || 0))
      const newRgba = { ...rgbaColor, [channel]: numValue }
      handleRgbaChange(newRgba)
    }
  }

  const handleRemoveColor = (position: number, e: React.MouseEvent) => {
    e.stopPropagation()
    onLetterColorsChange(letterColors.filter(lc => lc.position !== position))
  }

  const handleClearAll = () => {
    onLetterColorsChange([])
    setSelectedPosition(null)
  }

  if (!brandName.trim()) {
    return (
      <div className="p-4 bg-zinc-800/50 rounded-lg text-center text-zinc-500 text-sm">
        Enter a brand name to customize letter colors
      </div>
    )
  }

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <label className="text-sm font-medium text-zinc-300 flex items-center gap-2">
          <Palette className="w-4 h-4 text-purple-400" />
          Per-Letter Color
        </label>
        {letterColors.length > 0 && (
          <button
            onClick={handleClearAll}
            className="text-xs text-zinc-500 hover:text-zinc-300 transition-colors"
          >
            Clear All
          </button>
        )}
      </div>

      {/* Instructions */}
      <p className="text-xs text-zinc-500">
        Click a letter to assign a unique color. Great for highlighting specific characters.
      </p>

      {/* Letter Selection Grid */}
      <LetterGrid
        letters={letters}
        letterColors={letterColors}
        selectedPosition={selectedPosition}
        onLetterClick={handleLetterClick}
        onRemoveColor={handleRemoveColor}
        getColorForPosition={getColorForPosition}
      />

      {/* Color Picker (shown when letter selected) */}
      {selectedPosition !== null && (
        <ColorPickerSection
          selectedPosition={selectedPosition}
          letter={letters[selectedPosition - 1]}
          rgbaColor={rgbaColor}
          rgbInputs={rgbInputs}
          selectedColorHex={getColorForPosition(selectedPosition)?.hex}
          onRgbaChange={handleRgbaChange}
          onRgbInputChange={handleRgbInputChange}
          onColorSelect={handleColorSelect}
          onClose={() => setSelectedPosition(null)}
        />
      )}

      {/* Summary of assigned colors */}
      <ColorSummary letterColors={letterColors} letters={letters} />
    </div>
  )
}
