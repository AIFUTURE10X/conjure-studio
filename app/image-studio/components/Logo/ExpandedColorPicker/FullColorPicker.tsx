"use client"

/**
 * Full Color Picker Component
 * Saturation/hue picker with RGB inputs
 */

import { Pipette } from 'lucide-react'
import { RgbaColorPicker } from 'react-colorful'
import type { RgbaColor } from '@/app/image-studio/utils/color-conversions'

interface FullColorPickerProps {
  rgbaColor: RgbaColor
  rgbInputs: { r: string; g: string; b: string }
  onRgbaChange: (color: RgbaColor) => void
  onRgbInputChange: (channel: 'r' | 'g' | 'b', value: string) => void
}

export function FullColorPicker({
  rgbaColor,
  rgbInputs,
  onRgbaChange,
  onRgbInputChange,
}: FullColorPickerProps) {
  return (
    <div className="space-y-3 p-3 bg-zinc-800 rounded-lg border border-zinc-700">
      <div className="text-xs text-zinc-400 uppercase tracking-wide">COLOR</div>

      {/* Saturation/Brightness Square + Hue Slider */}
      <div className="expanded-color-picker">
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

      {/* Custom styles for react-colorful */}
      <style jsx global>{`
        .expanded-color-picker .react-colorful {
          width: 100%;
          height: auto;
        }
        .expanded-color-picker .react-colorful__saturation {
          height: 120px;
          border-radius: 8px;
        }
        .expanded-color-picker .react-colorful__hue {
          height: 12px;
          border-radius: 6px;
          margin-top: 8px;
        }
        .expanded-color-picker .react-colorful__alpha {
          display: none;
        }
        .expanded-color-picker .react-colorful__pointer {
          width: 18px;
          height: 18px;
          border: 2px solid white;
          box-shadow: 0 2px 4px rgba(0,0,0,0.3);
        }
        .expanded-color-picker .react-colorful__hue-pointer {
          width: 12px;
          height: 12px;
          border-radius: 50%;
        }
      `}</style>
    </div>
  )
}
