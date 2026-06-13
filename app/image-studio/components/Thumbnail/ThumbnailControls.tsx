"use client"

/**
 * ThumbnailControls — small reusable rail inputs (range, color swatch, toggle)
 * plus the shared photo-adjustment block, used across the FX panels.
 */

import { type ImageAdjust } from './thumbnail-constants'

export function RangeRow({
  label,
  value,
  min,
  max,
  step = 1,
  suffix = '',
  onChange,
}: {
  label: string
  value: number
  min: number
  max: number
  step?: number
  suffix?: string
  onChange: (value: number) => void
}) {
  return (
    <label className="block text-[11px] text-zinc-500">
      <span className="flex justify-between">
        <span>{label}</span>
        <span className="text-zinc-400">
          {value}
          {suffix}
        </span>
      </span>
      <input
        type="range"
        min={min}
        max={max}
        step={step}
        value={value}
        onChange={(e) => onChange(Number(e.target.value))}
        className="w-full accent-[#c99850]"
      />
    </label>
  )
}

export function SwatchRow({
  label,
  value,
  onChange,
}: {
  label: string
  value: string
  onChange: (value: string) => void
}) {
  return (
    <div className="flex items-center justify-between gap-2">
      <span className="text-[11px] text-zinc-500">{label}</span>
      <input
        type="color"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="h-7 w-12 shrink-0 cursor-pointer rounded-md border border-zinc-700 bg-zinc-900"
        aria-label={label}
      />
    </div>
  )
}

export function ToggleRow({
  label,
  active,
  onToggle,
}: {
  label: string
  active: boolean
  onToggle: () => void
}) {
  return (
    <button
      onClick={onToggle}
      aria-pressed={active}
      className={`flex w-full items-center justify-between rounded-md border px-2.5 py-1.5 text-xs font-medium transition-colors ${
        active ? 'border-[#c99850] bg-[#c99850]/10 text-[#dbb56e]' : 'border-zinc-700 bg-zinc-800/70 text-zinc-300 hover:bg-zinc-700'
      }`}
    >
      <span>{label}</span>
      <span className={`relative h-3.5 w-6 rounded-full transition-colors ${active ? 'bg-[#c99850]' : 'bg-zinc-600'}`}>
        <span className={`absolute top-0.5 h-2.5 w-2.5 rounded-full bg-white transition-all ${active ? 'left-3' : 'left-0.5'}`} />
      </span>
    </button>
  )
}

export function SelectRow({
  label,
  value,
  options,
  onChange,
}: {
  label: string
  value: string
  options: { id: string; label: string }[]
  onChange: (value: string) => void
}) {
  return (
    <label className="flex items-center justify-between gap-2 text-[11px] text-zinc-500">
      <span>{label}</span>
      <select
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="rounded-md border border-zinc-700 bg-zinc-900 px-2 py-1 text-[11px] text-zinc-200 focus:border-[#c99850]/60 focus:outline-none"
      >
        {options.map((o) => (
          <option key={o.id} value={o.id}>
            {o.label}
          </option>
        ))}
      </select>
    </label>
  )
}

export function AdjustControls({
  adjust,
  onChange,
}: {
  adjust: ImageAdjust
  onChange: (patch: Partial<ImageAdjust>) => void
}) {
  return (
    <div className="space-y-1.5">
      <RangeRow label="Brightness" value={adjust.brightness} min={50} max={150} suffix="%" onChange={(v) => onChange({ brightness: v })} />
      <RangeRow label="Contrast" value={adjust.contrast} min={50} max={200} suffix="%" onChange={(v) => onChange({ contrast: v })} />
      <RangeRow label="Saturation" value={adjust.saturation} min={0} max={200} suffix="%" onChange={(v) => onChange({ saturation: v })} />
      <RangeRow label="Blur" value={adjust.blur} min={0} max={20} suffix="px" onChange={(v) => onChange({ blur: v })} />
    </div>
  )
}
