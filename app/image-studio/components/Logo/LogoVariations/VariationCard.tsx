"use client"

import { Check } from 'lucide-react'
import type { LogoVariation } from './types'

interface VariationCardProps {
  variation: LogoVariation
  index: number
  selected: boolean
  onToggle: () => void
}

export function VariationCard({ variation, index, selected, onToggle }: VariationCardProps) {
  const chips = [
    variation.logoType,
    variation.logoVisualStyle,
    variation.logoRenderTreatment,
    variation.logoTypographyDirection,
    variation.aspectRatio,
    variation.resolution,
  ].filter(Boolean) as string[]

  return (
    <button
      onClick={onToggle}
      aria-pressed={selected}
      className={`flex w-full flex-col gap-1.5 rounded-lg border p-2.5 text-left transition-all ${
        selected
          ? 'border-[#c99850] bg-[#c99850]/10'
          : 'border-zinc-700 bg-zinc-900/70 hover:border-zinc-600 hover:bg-zinc-900'
      }`}
    >
      <div className="flex items-center gap-2">
        <span
          className={`flex h-4 w-4 shrink-0 items-center justify-center rounded border ${
            selected ? 'border-[#c99850] bg-[#c99850] text-black' : 'border-zinc-600 bg-transparent'
          }`}
        >
          {selected && <Check className="h-3 w-3" />}
        </span>
        <span className="truncate text-xs font-semibold text-white">
          {index + 1}. {variation.label}
        </span>
      </div>

      {variation.rationale && (
        <p className="text-[10px] italic leading-4 text-zinc-500">{variation.rationale}</p>
      )}

      <p className="line-clamp-3 text-[11px] leading-4 text-zinc-300">{variation.prompt}</p>

      {chips.length > 0 && (
        <div className="flex flex-wrap gap-1">
          {chips.map((chip) => (
            <span
              key={chip}
              className="rounded bg-zinc-800 px-1.5 py-0.5 text-[9px] font-medium text-zinc-400"
            >
              {chip}
            </span>
          ))}
        </div>
      )}
    </button>
  )
}
