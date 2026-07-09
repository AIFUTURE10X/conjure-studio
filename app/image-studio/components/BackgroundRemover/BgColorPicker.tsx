"use client"

/**
 * BgColorPicker Component
 *
 * Color picker for adding solid color backgrounds to processed images.
 * Shows preset colors + custom color picker.
 */

import { useState, useRef, useEffect } from 'react'
import { Palette, X } from 'lucide-react'

interface BgColorPickerProps {
  selectedColor: string | null
  onColorChange: (color: string | null) => void
}

// Preset colors - transparent first, then common colors
const PRESET_COLORS = [
  { value: null, label: 'Transparent', preview: 'checkerboard' },
  { value: '#ffffff', label: 'White' },
  { value: '#000000', label: 'Black' },
  { value: '#18181b', label: 'Dark Gray' },
  { value: '#3b82f6', label: 'Blue' },
  { value: '#ef4444', label: 'Red' },
  { value: '#22c55e', label: 'Green' },
  { value: '#f59e0b', label: 'Orange' },
  { value: '#8b5cf6', label: 'Purple' },
  { value: '#ec4899', label: 'Pink' },
]

// Checkerboard pattern for transparent preview
const checkerboardBg = `
  linear-gradient(45deg, #374151 25%, transparent 25%),
  linear-gradient(-45deg, #374151 25%, transparent 25%),
  linear-gradient(45deg, transparent 75%, #374151 75%),
  linear-gradient(-45deg, transparent 75%, #374151 75%)
`

export function BgColorPicker({ selectedColor, onColorChange }: BgColorPickerProps) {
  const [showCustomPicker, setShowCustomPicker] = useState(false)
  const [customColor, setCustomColor] = useState('#3b82f6')
  const colorInputRef = useRef<HTMLInputElement>(null)

  // Handle custom color input change
  const handleCustomColorChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newColor = e.target.value
    setCustomColor(newColor)
    onColorChange(newColor)
  }

  // Open native color picker
  const openColorPicker = () => {
    colorInputRef.current?.click()
  }

  return (
    <div className="mt-3 p-3 bg-zinc-800/50 rounded-lg border border-zinc-700">
      <div className="flex items-center justify-between mb-2">
        <div className="flex items-center gap-2">
          <Palette className="w-4 h-4 text-zinc-400" />
          <span className="text-xs font-medium text-zinc-300">Background Color</span>
        </div>
        {selectedColor && (
          <button
            onClick={() => onColorChange(null)}
            className="flex items-center gap-1 text-xs text-zinc-500 hover:text-zinc-300 transition-colors"
          >
            <X className="w-3 h-3" />
            Clear
          </button>
        )}
      </div>

      <div className="flex items-center gap-1.5 flex-wrap">
        {/* Preset colors */}
        {PRESET_COLORS.map((preset, index) => (
          <button
            key={index}
            onClick={() => onColorChange(preset.value)}
            title={preset.label}
            className={`w-7 h-7 rounded-md border-2 transition-all hover:scale-110 ${
              selectedColor === preset.value
                ? 'border-[#dbb56e] ring-1 ring-[#dbb56e]/50'
                : 'border-zinc-600 hover:border-zinc-500'
            }`}
            style={
              preset.preview === 'checkerboard'
                ? {
                    backgroundImage: checkerboardBg,
                    backgroundSize: '8px 8px',
                    backgroundPosition: '0 0, 0 4px, 4px -4px, -4px 0px',
                    backgroundColor: '#1f2937',
                  }
                : { backgroundColor: preset.value || 'transparent' }
            }
          />
        ))}

        {/* Custom color picker button */}
        <button
          onClick={openColorPicker}
          title="Custom color"
          className={`w-7 h-7 rounded-md border-2 transition-all hover:scale-110 flex items-center justify-center ${
            selectedColor && !PRESET_COLORS.find(p => p.value === selectedColor)
              ? 'border-[#dbb56e] ring-1 ring-[#dbb56e]/50'
              : 'border-zinc-600 hover:border-zinc-500'
          }`}
          style={{
            background: selectedColor && !PRESET_COLORS.find(p => p.value === selectedColor)
              ? selectedColor
              : 'linear-gradient(135deg, #ef4444, #f59e0b, #22c55e, #3b82f6, #8b5cf6)'
          }}
        >
          {(!selectedColor || PRESET_COLORS.find(p => p.value === selectedColor)) && (
            <span className="text-[10px] font-bold text-white drop-shadow-md">+</span>
          )}
        </button>

        {/* Hidden native color input */}
        <input
          ref={colorInputRef}
          type="color"
          value={customColor}
          onChange={handleCustomColorChange}
          className="sr-only"
        />
      </div>

      {/* Show current color value if custom */}
      {selectedColor && !PRESET_COLORS.find(p => p.value === selectedColor) && (
        <div className="mt-2 flex items-center gap-2">
          <span className="text-[10px] text-zinc-500 uppercase">Custom:</span>
          <code className="text-[10px] text-zinc-400 bg-zinc-800 px-1.5 py-0.5 rounded">
            {selectedColor}
          </code>
        </div>
      )}
    </div>
  )
}
