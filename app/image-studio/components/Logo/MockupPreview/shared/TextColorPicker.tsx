"use client"

/**
 * Text Color Picker Component
 *
 * Full RGB color picker with quick presets for brand text.
 * Extracted from BrandSidebar to keep files under 300 lines.
 */

import { useState, useEffect } from 'react'
import { Pipette, ChevronDown } from 'lucide-react'
import { RgbaColorPicker, RgbaColor } from 'react-colorful'
import { hexToRgba, rgbaToHex, QUICK_COLORS } from './color-utils'

interface TextColorPickerProps {
  /** Current brand color (hex) */
  brandColor: string
  /** Whether the dropdown is open */
  isOpen: boolean
  /** Called to toggle dropdown */
  onToggle: () => void
  /** Called when color changes */
  onColorChange: (color: string) => void
}

export function TextColorPicker({
  brandColor,
  isOpen,
  onToggle,
  onColorChange,
}: TextColorPickerProps) {
  const [rgbaColor, setRgbaColor] = useState<RgbaColor>(() => hexToRgba(brandColor))
  const [rgbInputs, setRgbInputs] = useState(() => {
    const rgba = hexToRgba(brandColor)
    return { r: rgba.r.toString(), g: rgba.g.toString(), b: rgba.b.toString() }
  })

  // Sync color picker when brandColor changes externally
  useEffect(() => {
    const rgba = hexToRgba(brandColor)
    setRgbaColor(rgba)
    setRgbInputs({ r: rgba.r.toString(), g: rgba.g.toString(), b: rgba.b.toString() })
  }, [brandColor])

  const handleRgbaChange = (color: RgbaColor) => {
    setRgbaColor(color)
    setRgbInputs({ r: color.r.toString(), g: color.g.toString(), b: color.b.toString() })
    onColorChange(rgbaToHex(color))
  }

  const handleRgbInputChange = (channel: 'r' | 'g' | 'b', value: string) => {
    setRgbInputs({ ...rgbInputs, [channel]: value })
    if (value !== '' && !isNaN(parseInt(value))) {
      const numValue = Math.max(0, Math.min(255, parseInt(value) || 0))
      const newRgba = { ...rgbaColor, [channel]: numValue }
      setRgbaColor(newRgba)
      onColorChange(rgbaToHex(newRgba))
    }
  }

  const handleQuickColorClick = (color: string) => {
    onColorChange(color)
    const rgba = hexToRgba(color)
    setRgbaColor(rgba)
    setRgbInputs({ r: rgba.r.toString(), g: rgba.g.toString(), b: rgba.b.toString() })
  }

  return (
    <div className="w-full space-y-1.5">
      <button
        onClick={onToggle}
        className="w-full flex items-center justify-between px-3 py-2 bg-zinc-800/50 border border-zinc-700/50 rounded-lg hover:bg-zinc-700/50 transition-colors"
      >
        <div className="flex items-center gap-2">
          <span className="text-[10px] text-zinc-300 font-normal uppercase">Color</span>
          <div
            className="w-5 h-5 rounded border border-zinc-600"
            style={{ backgroundColor: brandColor }}
          />
        </div>
        <ChevronDown className={`w-4 h-4 text-zinc-400 transition-transform ${isOpen ? 'rotate-180' : ''}`} />
      </button>

      {isOpen && (
        <div className="bg-zinc-800 border border-zinc-700 rounded-lg p-3 space-y-3">
          {/* Saturation/Brightness Square + Hue Slider */}
          <div className="brand-color-picker">
            <RgbaColorPicker color={rgbaColor} onChange={handleRgbaChange} />
          </div>

          {/* RGB Inputs */}
          <div className="flex items-center gap-2">
            <Pipette className="w-4 h-4 text-zinc-500 shrink-0" />
            <div className="flex gap-1 flex-1">
              {(['r', 'g', 'b'] as const).map((channel) => (
                <div key={channel} className="flex-1">
                  <input
                    type="text"
                    value={rgbInputs[channel]}
                    onChange={(e) => handleRgbInputChange(channel, e.target.value)}
                    className="w-full px-1.5 py-1 bg-zinc-900 border border-zinc-600 rounded text-center text-white text-[10px] font-extralight"
                    maxLength={3}
                  />
                  <div className="text-[8px] text-zinc-500 text-center mt-0.5 font-extralight">
                    {channel.toUpperCase()}
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Quick Color Presets */}
          <div className="grid grid-cols-6 gap-1">
            {QUICK_COLORS.map((color) => (
              <button
                key={color}
                onClick={() => handleQuickColorClick(color)}
                className={`w-6 h-6 rounded border-2 transition-all hover:scale-110 ${
                  brandColor.toLowerCase() === color ? 'border-purple-500' : 'border-zinc-700'
                }`}
                style={{ backgroundColor: color }}
              />
            ))}
          </div>
        </div>
      )}

      {/* Custom styles for react-colorful */}
      <style jsx global>{`
        .brand-color-picker .react-colorful {
          width: 100%;
          height: auto;
        }
        .brand-color-picker .react-colorful__saturation {
          height: 120px;
          border-radius: 8px;
        }
        .brand-color-picker .react-colorful__hue {
          height: 12px;
          border-radius: 6px;
          margin-top: 8px;
        }
        .brand-color-picker .react-colorful__alpha {
          display: none;
        }
        .brand-color-picker .react-colorful__pointer {
          width: 16px;
          height: 16px;
          border: 2px solid white;
          box-shadow: 0 2px 4px rgba(0,0,0,0.3);
        }
        .brand-color-picker .react-colorful__hue-pointer {
          width: 12px;
          height: 12px;
          border-radius: 50%;
        }
      `}</style>
    </div>
  )
}
