"use client"

/**
 * Color Selector Component
 * Full color picker with RGB inputs and quick presets
 */

import { useState, useEffect, useRef } from 'react'
import { ChevronDown, Pipette } from 'lucide-react'
import { RgbaColorPicker } from 'react-colorful'
import { hexToRgba, rgbaToHex, type RgbaColor } from '@/app/image-studio/utils/color-conversions'
import { QUICK_COLORS } from '@/app/image-studio/constants/color-palettes'

interface ColorSelectorProps {
  brandColor: string
  isOpen: boolean
  onToggleOpen: () => void
  onColorChange: (color: string) => void
}

export function ColorSelector({
  brandColor,
  isOpen,
  onToggleOpen,
  onColorChange,
}: ColorSelectorProps) {
  const [rgbaColor, setRgbaColor] = useState<RgbaColor>(() => hexToRgba(brandColor))
  const [rgbInputs, setRgbInputs] = useState(() => {
    const rgba = hexToRgba(brandColor)
    return { r: rgba.r.toString(), g: rgba.g.toString(), b: rgba.b.toString() }
  })

  // Track if we're currently picking (to prevent sync feedback loop)
  const isPickingRef = useRef(false)
  const lastInternalColorRef = useRef(brandColor)

  // Sync color picker when brandColor changes externally (not from our own picker)
  useEffect(() => {
    // Skip sync if the change originated from this picker
    if (isPickingRef.current || brandColor === lastInternalColorRef.current) {
      return
    }
    const rgba = hexToRgba(brandColor)
    setRgbaColor(rgba)
    setRgbInputs({ r: rgba.r.toString(), g: rgba.g.toString(), b: rgba.b.toString() })
  }, [brandColor])

  const handleRgbaChange = (color: RgbaColor) => {
    isPickingRef.current = true
    setRgbaColor(color)
    setRgbInputs({ r: color.r.toString(), g: color.g.toString(), b: color.b.toString() })
    const hex = rgbaToHex(color)
    lastInternalColorRef.current = hex
    onColorChange(hex)
    // Reset picking flag after a short delay to allow parent state to settle
    requestAnimationFrame(() => {
      isPickingRef.current = false
    })
  }

  const handleRgbInputChange = (channel: 'r' | 'g' | 'b', value: string) => {
    setRgbInputs({ ...rgbInputs, [channel]: value })
    if (value !== '' && !isNaN(parseInt(value))) {
      const numValue = Math.max(0, Math.min(255, parseInt(value) || 0))
      const newRgba = { ...rgbaColor, [channel]: numValue }
      setRgbaColor(newRgba)
      const hex = rgbaToHex(newRgba)
      lastInternalColorRef.current = hex
      onColorChange(hex)
    }
  }

  const handleQuickColorSelect = (color: string) => {
    lastInternalColorRef.current = color
    onColorChange(color)
    const rgba = hexToRgba(color)
    setRgbaColor(rgba)
    setRgbInputs({ r: rgba.r.toString(), g: rgba.g.toString(), b: rgba.b.toString() })
  }

  return (
    <div className="w-full space-y-1.5">
      <button
        onClick={onToggleOpen}
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
              <div className="flex-1">
                <input
                  type="text"
                  value={rgbInputs.r}
                  onChange={(e) => handleRgbInputChange('r', e.target.value)}
                  className="w-full px-1.5 py-1 bg-zinc-900 border border-zinc-600 rounded text-center text-white text-[10px] font-extralight"
                  maxLength={3}
                />
                <div className="text-[8px] text-zinc-500 text-center mt-0.5 font-extralight">R</div>
              </div>
              <div className="flex-1">
                <input
                  type="text"
                  value={rgbInputs.g}
                  onChange={(e) => handleRgbInputChange('g', e.target.value)}
                  className="w-full px-1.5 py-1 bg-zinc-900 border border-zinc-600 rounded text-center text-white text-[10px] font-extralight"
                  maxLength={3}
                />
                <div className="text-[8px] text-zinc-500 text-center mt-0.5 font-extralight">G</div>
              </div>
              <div className="flex-1">
                <input
                  type="text"
                  value={rgbInputs.b}
                  onChange={(e) => handleRgbInputChange('b', e.target.value)}
                  className="w-full px-1.5 py-1 bg-zinc-900 border border-zinc-600 rounded text-center text-white text-[10px] font-extralight"
                  maxLength={3}
                />
                <div className="text-[8px] text-zinc-500 text-center mt-0.5 font-extralight">B</div>
              </div>
            </div>
          </div>

          {/* Quick Color Presets */}
          <div className="grid grid-cols-6 gap-1">
            {QUICK_COLORS.map((color) => (
              <button
                key={color}
                onClick={() => handleQuickColorSelect(color)}
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
