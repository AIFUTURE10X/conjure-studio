"use client"

import { Slider } from '@/components/ui/slider'
import { Layers } from 'lucide-react'

// ============================================
// TYPES
// ============================================

export type DepthLevel = 'flat' | 'subtle' | 'medium' | 'deep' | 'extreme'

export interface DepthPreset {
  id: DepthLevel
  label: string
  value: number // 0-100
  description: string
}

// ============================================
// PRESETS
// ============================================

export const DEPTH_PRESETS: DepthPreset[] = [
  { id: 'flat', label: 'Flat', value: 0, description: '2D, no depth' },
  { id: 'subtle', label: 'Subtle', value: 25, description: 'Hint of 3D' },
  { id: 'medium', label: 'Medium', value: 50, description: 'Balanced 3D' },
  { id: 'deep', label: 'Deep', value: 75, description: 'Pronounced 3D' },
  { id: 'extreme', label: 'Extreme', value: 100, description: 'Maximum depth' },
]

// ============================================
// COMPONENT PROPS
// ============================================

interface DepthSliderProps {
  depthAmount: number // 0-100
  onDepthChange: (amount: number) => void
  depthLevel: DepthLevel | null
  onDepthLevelChange: (level: DepthLevel | null) => void
}

// ============================================
// COMPONENT
// ============================================

export function DepthSlider({
  depthAmount,
  onDepthChange,
  depthLevel,
  onDepthLevelChange,
}: DepthSliderProps) {

  const handleSliderChange = (values: number[]) => {
    const newValue = values[0]
    onDepthChange(newValue)

    // Auto-update level based on slider position
    const matchingPreset = DEPTH_PRESETS.find(p => p.value === newValue)
    if (matchingPreset) {
      onDepthLevelChange(matchingPreset.id)
    } else {
      // Find closest preset
      const closest = DEPTH_PRESETS.reduce((prev, curr) =>
        Math.abs(curr.value - newValue) < Math.abs(prev.value - newValue) ? curr : prev
      )
      onDepthLevelChange(closest.id)
    }
  }

  const handlePresetClick = (preset: DepthPreset) => {
    onDepthChange(preset.value)
    onDepthLevelChange(preset.id)
  }

  // Get current depth description
  const getCurrentDescription = (): string => {
    if (depthAmount === 0) return 'Flat 2D - No depth effect'
    if (depthAmount <= 15) return 'Minimal - Very subtle shadow'
    if (depthAmount <= 30) return 'Subtle - Light 3D appearance'
    if (depthAmount <= 45) return 'Light - Noticeable depth'
    if (depthAmount <= 60) return 'Medium - Balanced 3D extrusion'
    if (depthAmount <= 75) return 'Deep - Strong 3D effect'
    if (depthAmount <= 90) return 'Very Deep - Dramatic depth'
    return 'Extreme - Maximum 3D extrusion'
  }

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <label className="text-sm font-medium text-zinc-300 flex items-center gap-2">
          <Layers className="w-4 h-4 text-purple-400" />
          3D Depth Control
        </label>
        <span className="text-sm font-mono text-purple-400">{depthAmount}%</span>
      </div>

      {/* Visual Depth Preview */}
      <div className="relative h-16 bg-zinc-800 rounded-lg overflow-hidden">
        {/* Depth visualization */}
        <div
          className="absolute inset-0 flex items-center justify-center"
          style={{
            perspective: '200px',
          }}
        >
          <div
            className="text-2xl font-bold text-white transition-transform duration-300"
            style={{
              transform: `translateZ(${depthAmount / 2}px) rotateX(${depthAmount / 10}deg)`,
              textShadow: depthAmount > 0
                ? `0 ${depthAmount / 10}px ${depthAmount / 5}px rgba(0,0,0,0.5),
                   0 ${depthAmount / 5}px ${depthAmount / 3}px rgba(0,0,0,0.3)`
                : 'none',
            }}
          >
            3D
          </div>
        </div>

        {/* Depth indicator bar */}
        <div className="absolute bottom-0 left-0 right-0 h-1 bg-zinc-700">
          <div
            className="h-full bg-linear-to-r from-purple-600 to-purple-400 transition-all duration-300"
            style={{ width: `${depthAmount}%` }}
          />
        </div>
      </div>

      {/* Slider */}
      <div className="space-y-2">
        <Slider
          value={[depthAmount]}
          onValueChange={handleSliderChange}
          min={0}
          max={100}
          step={1}
          className="w-full"
        />

        {/* Preset markers on slider */}
        <div className="relative h-4">
          {DEPTH_PRESETS.map((preset) => (
            <button
              key={preset.id}
              onClick={() => handlePresetClick(preset)}
              className={`absolute top-0 transform -translate-x-1/2 transition-all ${
                depthLevel === preset.id
                  ? 'text-purple-400 scale-110'
                  : 'text-zinc-500 hover:text-zinc-300'
              }`}
              style={{ left: `${preset.value}%` }}
              title={preset.description}
            >
              <div className="flex flex-col items-center">
                <div className={`w-1.5 h-1.5 rounded-full ${
                  depthLevel === preset.id ? 'bg-purple-400' : 'bg-zinc-600'
                }`} />
                <span className="text-[9px] mt-0.5">{preset.label}</span>
              </div>
            </button>
          ))}
        </div>
      </div>

      {/* Quick Presets */}
      <div className="flex gap-1.5">
        {DEPTH_PRESETS.map((preset) => (
          <button
            key={preset.id}
            onClick={() => handlePresetClick(preset)}
            className={`flex-1 py-1.5 rounded-md text-xs font-medium transition-all ${
              depthLevel === preset.id
                ? 'bg-purple-600 text-white'
                : 'bg-zinc-800 text-zinc-400 hover:bg-zinc-700 hover:text-white'
            }`}
          >
            {preset.label}
          </button>
        ))}
      </div>

      {/* Current Description */}
      <div className="p-2 bg-zinc-800/50 rounded-lg">
        <p className="text-xs text-zinc-400 text-center">
          {getCurrentDescription()}
        </p>
      </div>
    </div>
  )
}

// Helper to get depth description for prompt
export function getDepthPromptDescription(amount: number): string {
  if (amount === 0) return 'flat 2D'
  if (amount <= 20) return 'very subtle 3D depth'
  if (amount <= 40) return 'subtle 3D depth with light extrusion'
  if (amount <= 60) return 'medium 3D extrusion'
  if (amount <= 80) return 'deep 3D extrusion with significant depth'
  return 'extreme 3D with dramatic depth and heavy extrusion'
}
