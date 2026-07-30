"use client"

import { Slider } from '@/components/ui/slider'
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip'
import { SPIN_DEPTH_LEVELS, type SpinAxis, type SpinDepthLevel, type SpinMaterial } from './spin-3d-params'

/**
 * Parameter rail for the 3D spin. Every change is applied straight to the live
 * preview — no apply/confirm step (AC-5).
 *
 * Split from LogoSpin3DModal to keep both files under the 300-line limit in
 * app/image-studio/CLAUDE.md.
 */

export const BACKGROUND_OPTIONS: Array<{ id: string; label: string; value: string | null; swatch: string }> = [
  { id: 'transparent', label: 'Transparent', value: null, swatch: 'repeating-conic-gradient(#52525b 0% 25%, #27272a 0% 50%) 50%/8px 8px' },
  { id: 'dark', label: 'Dark', value: '#18181b', swatch: '#18181b' },
  { id: 'light', label: 'Light', value: '#f4f4f5', swatch: '#f4f4f5' },
  { id: 'gold', label: 'Gold', value: '#c99850', swatch: '#c99850' },
]

const MATERIALS: Array<{ id: SpinMaterial; label: string }> = [
  { id: 'matte', label: 'Matte' },
  { id: 'metallic', label: 'Metallic' },
  { id: 'glossy', label: 'Glossy' },
]

const AXES: Array<{ id: SpinAxis; label: string; hint: string }> = [
  { id: 'y', label: 'Y', hint: 'Spin left to right' },
  { id: 'x', label: 'X', hint: 'Tip forward and back' },
  { id: 'tumble', label: 'Tumble', hint: 'Rotate on both axes' },
]

const DEPTH_LABELS: Record<SpinDepthLevel, string> = {
  flat: 'Flat', subtle: 'Subtle', medium: 'Medium', deep: 'Deep', extreme: 'Extreme',
}

interface SegmentedProps<T extends string> {
  options: Array<{ id: T; label: string; hint?: string }>
  value: T
  onChange: (value: T) => void
}

function Segmented<T extends string>({ options, value, onChange }: SegmentedProps<T>) {
  return (
    <div className="flex flex-wrap items-center gap-1 rounded-lg border border-zinc-800 bg-zinc-950 p-1">
      {options.map((option) => {
        const button = (
          <button
            key={option.id}
            onClick={() => onChange(option.id)}
            className={`rounded-md px-2.5 py-1 text-xs font-medium transition-colors ${
              value === option.id
                ? 'bg-linear-to-r from-[#c99850] to-[#dbb56e] text-black'
                : 'text-zinc-400 hover:bg-zinc-800 hover:text-white'
            }`}
          >
            {option.label}
          </button>
        )
        if (!option.hint) return button
        return (
          <Tooltip key={option.id}>
            <TooltipTrigger asChild>{button}</TooltipTrigger>
            <TooltipContent side="bottom">{option.hint}</TooltipContent>
          </Tooltip>
        )
      })}
    </div>
  )
}

function Row({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="flex flex-col gap-1.5">
      <span className="text-xs text-zinc-400">{label}</span>
      {children}
    </div>
  )
}

export interface SpinSettings {
  level: SpinDepthLevel
  bevelEnabled: boolean
  material: SpinMaterial
  axis: SpinAxis
  speed: number
  backgroundId: string
}

interface LogoSpin3DControlsProps {
  settings: SpinSettings
  onChange: (patch: Partial<SpinSettings>) => void
}

export function LogoSpin3DControls({ settings, onChange }: LogoSpin3DControlsProps) {
  return (
    <div className="flex flex-col gap-4">
      <Row label="Depth">
        <Segmented
          options={SPIN_DEPTH_LEVELS.map((level) => ({ id: level, label: DEPTH_LABELS[level] }))}
          value={settings.level}
          onChange={(level) => onChange({ level })}
        />
      </Row>

      <Row label="Edges">
        <Segmented
          options={[{ id: 'sharp', label: 'Sharp' }, { id: 'bevelled', label: 'Bevelled' }]}
          value={settings.bevelEnabled ? 'bevelled' : 'sharp'}
          onChange={(value) => onChange({ bevelEnabled: value === 'bevelled' })}
        />
      </Row>

      <Row label="Material">
        <Segmented options={MATERIALS} value={settings.material} onChange={(material) => onChange({ material })} />
      </Row>

      <Row label="Spin axis">
        <Segmented options={AXES} value={settings.axis} onChange={(axis) => onChange({ axis })} />
      </Row>

      <Row label={`Speed — ${settings.speed.toFixed(1)}×`}>
        <Slider
          value={[settings.speed]}
          min={0.2}
          max={3}
          step={0.1}
          onValueChange={(values) => onChange({ speed: values[0] })}
        />
      </Row>

      <Row label="Background">
        <div className="flex flex-wrap items-center gap-2">
          {BACKGROUND_OPTIONS.map((option) => (
            <Tooltip key={option.id}>
              <TooltipTrigger asChild>
                <button
                  onClick={() => onChange({ backgroundId: option.id })}
                  aria-label={option.label}
                  className={`h-7 w-7 rounded-md border transition-colors ${
                    settings.backgroundId === option.id
                      ? 'border-[#dbb56e] ring-2 ring-[#c99850]/50'
                      : 'border-zinc-700 hover:border-zinc-500'
                  }`}
                  style={{ background: option.swatch }}
                />
              </TooltipTrigger>
              <TooltipContent side="bottom">{option.label}</TooltipContent>
            </Tooltip>
          ))}
        </div>
      </Row>
    </div>
  )
}
