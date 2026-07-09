"use client"

import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { Button } from "@/components/ui/button"
import { Settings } from 'lucide-react'
import { CAMERA_ANGLE_OPTIONS, CAMERA_LENS_OPTIONS } from '../../constants/toolbar-options'

interface AdvancedSettingsPopoverProps {
  selectedCameraAngle: string
  onCameraAngleChange: (angle: string) => void
  selectedCameraLens: string
  onCameraLensChange: (lens: string) => void
  styleStrength: 'subtle' | 'moderate' | 'strong'
  onStyleStrengthChange: (strength: 'subtle' | 'moderate' | 'strong') => void
  onHover?: (hovered: boolean) => void
}

export function AdvancedSettingsPopover({
  selectedCameraAngle, onCameraAngleChange,
  selectedCameraLens, onCameraLensChange,
  styleStrength, onStyleStrengthChange, onHover
}: AdvancedSettingsPopoverProps) {
  return (
    <Popover>
      <PopoverTrigger asChild>
        <Button
          className="px-6 py-3 font-medium flex items-center gap-2 bg-transparent text-zinc-400 hover:text-white"
          onMouseEnter={() => onHover?.(true)}
          onMouseLeave={() => onHover?.(false)}
        >
          <Settings className="w-4 h-4" />
          Advanced
        </Button>
      </PopoverTrigger>
      <PopoverContent align="end" className="w-[800px] bg-zinc-900 border-zinc-800 p-4">
        <div className="space-y-4">
          <h3 className="text-sm font-bold text-[#c99850]">Advanced Settings</h3>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-xs font-medium text-[#c99850] mb-2 block">Camera Angle (optional)</label>
              <select
                value={selectedCameraAngle}
                onChange={(e) => onCameraAngleChange(e.target.value)}
                className="w-full px-3 py-2 rounded-lg text-xs bg-zinc-800 text-white border border-[#c99850]/30 focus:outline-none focus:ring-2 focus:ring-[#c99850]/30"
              >
                {CAMERA_ANGLE_OPTIONS.map(opt => (
                  <option key={opt.value} value={opt.value}>{opt.label}</option>
                ))}
              </select>
            </div>

            <div>
              <label className="text-xs font-medium text-[#c99850] mb-2 block">Camera Lens (optional)</label>
              <select
                value={selectedCameraLens}
                onChange={(e) => onCameraLensChange(e.target.value)}
                className="w-full px-3 py-2 rounded-lg text-xs bg-zinc-800 text-white border border-[#c99850]/30 focus:outline-none focus:ring-2 focus:ring-[#c99850]/30"
              >
                {CAMERA_LENS_OPTIONS.map(opt => (
                  <option key={opt.value} value={opt.value}>{opt.label}</option>
                ))}
              </select>
            </div>
          </div>

          <div>
            <label className="text-xs font-medium text-[#c99850] mb-2 block">Style Strength</label>
            <div className="flex gap-2">
              {(['subtle', 'moderate', 'strong'] as const).map(strength => (
                <button
                  key={strength}
                  onClick={() => onStyleStrengthChange(strength)}
                  className={`flex-1 px-3 py-2 rounded-lg text-xs font-medium transition-colors border capitalize ${
                    styleStrength === strength
                      ? 'bg-[#c99850] text-black border-[#c99850]'
                      : 'bg-zinc-800 text-zinc-300 hover:bg-zinc-700 border-[#c99850]/30'
                  }`}
                >
                  {strength}
                </button>
              ))}
            </div>
          </div>
        </div>
      </PopoverContent>
    </Popover>
  )
}
