"use client"

/**
 * Color Picker Section Component
 * Full color picker with RGB inputs and preset grid
 */

import { Pipette } from 'lucide-react'
import { RgbaColorPicker } from 'react-colorful'
import type { RgbaColor } from '@/app/image-studio/utils/color-conversions'
import { LETTER_COLOR_PALETTE, type ColorOption } from '@/app/image-studio/constants/color-palettes'

interface ColorPickerSectionProps {
  selectedPosition: number
  letter: string
  rgbaColor: RgbaColor
  rgbInputs: { r: string; g: string; b: string }
  selectedColorHex: string | undefined
  onRgbaChange: (color: RgbaColor) => void
  onRgbInputChange: (channel: 'r' | 'g' | 'b', value: string) => void
  onColorSelect: (color: ColorOption) => void
  onClose: () => void
}

export function ColorPickerSection({
  selectedPosition,
  letter,
  rgbaColor,
  rgbInputs,
  selectedColorHex,
  onRgbaChange,
  onRgbInputChange,
  onColorSelect,
  onClose,
}: ColorPickerSectionProps) {
  return (
    <div className="space-y-3 p-3 bg-zinc-800 rounded-lg border border-zinc-700">
      <div className="flex items-center justify-between">
        <span className="text-xs text-zinc-400">
          COLOR for letter <span className="font-bold text-white">{letter?.toUpperCase()}</span>
        </span>
        <button
          onClick={onClose}
          className="text-xs text-zinc-500 hover:text-white"
        >
          Done
        </button>
      </div>

      {/* Full Color Picker */}
      <div className="letter-color-picker">
        <RgbaColorPicker color={rgbaColor} onChange={onRgbaChange} />
      </div>

      {/* RGB Inputs */}
      <div className="flex items-center gap-2">
        <Pipette className="w-4 h-4 text-zinc-500 shrink-0" />
        <div className="flex gap-1.5 flex-1">
          <div className="flex-1">
            <input
              type="text"
              value={rgbInputs.r}
              onChange={(e) => onRgbInputChange('r', e.target.value)}
              className="w-full px-2 py-1.5 bg-zinc-900 border border-zinc-600 rounded text-center text-white text-sm"
              maxLength={3}
            />
            <div className="text-[10px] text-zinc-500 text-center mt-0.5">R</div>
          </div>
          <div className="flex-1">
            <input
              type="text"
              value={rgbInputs.g}
              onChange={(e) => onRgbInputChange('g', e.target.value)}
              className="w-full px-2 py-1.5 bg-zinc-900 border border-zinc-600 rounded text-center text-white text-sm"
              maxLength={3}
            />
            <div className="text-[10px] text-zinc-500 text-center mt-0.5">G</div>
          </div>
          <div className="flex-1">
            <input
              type="text"
              value={rgbInputs.b}
              onChange={(e) => onRgbInputChange('b', e.target.value)}
              className="w-full px-2 py-1.5 bg-zinc-900 border border-zinc-600 rounded text-center text-white text-sm"
              maxLength={3}
            />
            <div className="text-[10px] text-zinc-500 text-center mt-0.5">B</div>
          </div>
        </div>
      </div>

      {/* Preset Color Grid */}
      <div className="grid grid-cols-6 gap-1.5">
        {LETTER_COLOR_PALETTE.map((color) => (
          <button
            key={color.value}
            onClick={() => onColorSelect(color)}
            className={`w-9 h-9 rounded-lg border-2 transition-all hover:scale-110 ${
              selectedColorHex === color.hex
                ? 'border-purple-500 scale-105'
                : 'border-zinc-600 hover:border-zinc-400'
            }`}
            style={{ backgroundColor: color.hex }}
            title={color.name}
          />
        ))}
      </div>

      {/* Custom styles for react-colorful */}
      <style jsx global>{`
        .letter-color-picker .react-colorful {
          width: 100%;
          height: auto;
        }
        .letter-color-picker .react-colorful__saturation {
          height: 120px;
          border-radius: 8px;
        }
        .letter-color-picker .react-colorful__hue {
          height: 12px;
          border-radius: 6px;
          margin-top: 8px;
        }
        .letter-color-picker .react-colorful__alpha {
          display: none;
        }
        .letter-color-picker .react-colorful__pointer {
          width: 18px;
          height: 18px;
          border: 2px solid white;
          box-shadow: 0 2px 4px rgba(0,0,0,0.3);
        }
        .letter-color-picker .react-colorful__hue-pointer {
          width: 12px;
          height: 12px;
          border-radius: 50%;
        }
      `}</style>
    </div>
  )
}
