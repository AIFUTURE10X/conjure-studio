"use client"

/**
 * QuestionSliders Components
 *
 * Slider controls for depth and tilt questions.
 * Provides fine-tuning after card preset selection.
 * Added accessibility: aria-labels, aria-valuetext
 */

import { Tooltip, TooltipTrigger, TooltipContent } from '@/components/ui/tooltip'
import { Info } from 'lucide-react'

interface DepthSliderProps {
  extrusionDepth: number
  onExtrusionChange: (value: number) => void
  showSlider?: boolean // In Quick Mode, slider is hidden; only cards
}

// Map depth percentage to description
function getDepthDescription(depth: number): string {
  if (depth === 0) return 'Flat 2D'
  if (depth <= 25) return 'Minimal depth'
  if (depth <= 50) return 'Subtle depth'
  if (depth <= 75) return 'Medium depth'
  return 'Maximum depth'
}

export function DepthSlider({ extrusionDepth, onExtrusionChange, showSlider = true }: DepthSliderProps) {
  if (!showSlider) return null

  return (
    <div className="max-w-md mx-auto mt-6 space-y-3">
      <div className="flex items-center justify-between text-sm">
        <div className="flex items-center gap-2">
          <span className="text-zinc-400">Fine-tune 3D Intensity</span>
          <Tooltip>
            <TooltipTrigger asChild>
              <button className="text-zinc-500 hover:text-zinc-300" aria-label="Help for 3D intensity">
                <Info className="w-3.5 h-3.5" />
              </button>
            </TooltipTrigger>
            <TooltipContent side="top" className="max-w-[200px]">
              Adjusts how much 3D depth effect is applied. Higher values create more dramatic shadows and dimensionality.
            </TooltipContent>
          </Tooltip>
        </div>
        <span className="text-purple-400 font-medium">{extrusionDepth}%</span>
      </div>
      <input
        type="range"
        min="0"
        max="100"
        step="5"
        value={extrusionDepth}
        onChange={(e) => onExtrusionChange(Number(e.target.value))}
        className="w-full h-2 bg-zinc-700 rounded-lg appearance-none cursor-pointer accent-purple-500"
        style={{
          background: `linear-gradient(to right, #8B5CF6 0%, #8B5CF6 ${extrusionDepth}%, #3f3f46 ${extrusionDepth}%, #3f3f46 100%)`
        }}
        aria-label="3D intensity slider"
        aria-valuemin={0}
        aria-valuemax={100}
        aria-valuenow={extrusionDepth}
        aria-valuetext={`${extrusionDepth}% - ${getDepthDescription(extrusionDepth)}`}
      />
      <div className="flex justify-between text-xs text-zinc-500">
        <span>0%</span>
        <span>35%</span>
        <span>65%</span>
        <span>100%</span>
      </div>
    </div>
  )
}

interface TiltSliderProps {
  tiltAngle: number
  onTiltAngleChange: (value: number) => void
  showSlider?: boolean // In Quick Mode, slider is hidden; only cards
}

// Map tilt angle to description
function getTiltDescription(angle: number): string {
  if (angle === 0) return 'No rotation'
  if (angle < 0) {
    if (angle >= -15) return 'Slight left tilt'
    return 'Dynamic left tilt'
  }
  if (angle <= 15) return 'Slight right tilt'
  return 'Dynamic right tilt'
}

export function TiltSlider({ tiltAngle, onTiltAngleChange, showSlider = true }: TiltSliderProps) {
  if (!showSlider) return null

  // Calculate fill percentage (center-based)
  const fillPercent = ((tiltAngle + 45) / 90) * 100
  const centerPercent = 50

  // Create gradient that fills from center
  let gradient: string
  if (tiltAngle < 0) {
    gradient = `linear-gradient(to right, #3f3f46 0%, #3f3f46 ${fillPercent}%, #8B5CF6 ${fillPercent}%, #8B5CF6 ${centerPercent}%, #3f3f46 ${centerPercent}%, #3f3f46 100%)`
  } else if (tiltAngle > 0) {
    gradient = `linear-gradient(to right, #3f3f46 0%, #3f3f46 ${centerPercent}%, #8B5CF6 ${centerPercent}%, #8B5CF6 ${fillPercent}%, #3f3f46 ${fillPercent}%, #3f3f46 100%)`
  } else {
    gradient = '#3f3f46'
  }

  return (
    <div className="max-w-md mx-auto mt-6 space-y-3">
      <div className="flex items-center justify-between text-sm">
        <div className="flex items-center gap-2">
          <span className="text-zinc-400">Fine-tune Tilt Angle</span>
          <Tooltip>
            <TooltipTrigger asChild>
              <button className="text-zinc-500 hover:text-zinc-300" aria-label="Help for tilt angle">
                <Info className="w-3.5 h-3.5" />
              </button>
            </TooltipTrigger>
            <TooltipContent side="top" className="max-w-[200px]">
              Rotates the entire logo. Negative values tilt left, positive values tilt right.
            </TooltipContent>
          </Tooltip>
        </div>
        <span className="text-purple-400 font-medium">{tiltAngle}°</span>
      </div>
      <input
        type="range"
        min="-45"
        max="45"
        step="1"
        value={tiltAngle}
        onChange={(e) => onTiltAngleChange(Number(e.target.value))}
        className="w-full h-2 bg-zinc-700 rounded-lg appearance-none cursor-pointer accent-purple-500"
        style={{ background: gradient }}
        aria-label="Tilt angle slider"
        aria-valuemin={-45}
        aria-valuemax={45}
        aria-valuenow={tiltAngle}
        aria-valuetext={`${tiltAngle} degrees - ${getTiltDescription(tiltAngle)}`}
      />
      <div className="flex justify-between text-xs text-zinc-500">
        <span>-45°</span>
        <span>-20°</span>
        <span>0°</span>
        <span>+20°</span>
        <span>+45°</span>
      </div>
    </div>
  )
}
