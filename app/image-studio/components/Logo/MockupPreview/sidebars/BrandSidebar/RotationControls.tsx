"use client"

/**
 * Rotation Controls Component
 * Preset buttons and slider for text rotation
 */

import { ROTATION_PRESETS } from '../../text-effects-config'

interface RotationControlsProps {
  brandRotation: number
  onRotationChange: (rotation: number) => void
}

export function RotationControls({
  brandRotation,
  onRotationChange,
}: RotationControlsProps) {
  return (
    <div className="w-full space-y-1.5">
      <div className="flex items-center justify-between">
        <span className="text-[10px] text-zinc-300 font-normal uppercase">Rotation</span>
        <span className="text-[10px] text-zinc-300 font-normal">{brandRotation}°</span>
      </div>
      <div className="grid grid-cols-5 gap-1">
        {ROTATION_PRESETS.map((preset) => (
          <button
            key={preset.value}
            onClick={() => onRotationChange(preset.value)}
            className={`px-1 py-1.5 rounded-md text-[9px] font-extralight transition-all ${
              brandRotation === preset.value
                ? 'bg-purple-500/20 text-purple-300 border border-purple-500/30'
                : 'bg-zinc-800/50 text-zinc-400 border border-zinc-700/50 hover:bg-zinc-700/50'
            }`}
          >
            {preset.label}
          </button>
        ))}
      </div>
      {/* Rotation Slider */}
      <input
        type="range"
        min="-180"
        max="180"
        value={brandRotation}
        onChange={(e) => onRotationChange(parseInt(e.target.value))}
        className="w-full h-1.5 bg-zinc-700 rounded-lg appearance-none cursor-pointer accent-purple-500"
      />
    </div>
  )
}
