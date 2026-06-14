"use client"

/**
 * ConjureBrandPresets
 *
 * One-click brand recipes for Conjure Studio logos. Each button drops a
 * tuned prompt + the full chip stack (type, style, render, typography,
 * ratio, 4K, BG removal) into the generator so the user can tweak and
 * hit Generate without touching the settings rail.
 */

import { Sparkles } from 'lucide-react'
import {
  CONJURE_BRAND_PRESETS,
  type ConjureBrandPreset,
} from '../../constants/conjure-brand-presets'

interface ConjureBrandPresetsProps {
  onApply: (preset: ConjureBrandPreset) => void
  disabled?: boolean
}

export function ConjureBrandPresets({ onApply, disabled }: ConjureBrandPresetsProps) {
  return (
    <div className="rounded-xl border border-[#c99850]/30 bg-linear-to-br from-[#c99850]/10 to-zinc-900/40 p-3">
      <div className="mb-2 flex items-center gap-2">
        <Sparkles className="h-4 w-4 text-[#dbb56e]" />
        <span className="text-sm font-semibold text-white">Conjure Studio Presets</span>
        <span className="ml-auto text-[10px] text-zinc-500">4K · transparent PNG</span>
      </div>

      <div className="grid grid-cols-1 gap-2 sm:grid-cols-3">
        {CONJURE_BRAND_PRESETS.map((preset) => (
          <button
            key={preset.id}
            onClick={() => onApply(preset)}
            disabled={disabled}
            title={`Apply "${preset.name}" — fills the prompt and all settings. Then tweak or hit Generate.`}
            className="group flex flex-col gap-2 rounded-lg border border-zinc-700 bg-zinc-900/70 p-2.5 text-left transition-all hover:border-[#c99850]/60 hover:bg-zinc-900 disabled:cursor-not-allowed disabled:opacity-50"
          >
            <div className="flex items-center gap-2">
              <span className="text-base leading-none text-[#dbb56e]">{preset.icon}</span>
              <span className="truncate text-xs font-semibold text-white">{preset.name}</span>
            </div>
            <p className="text-[10px] leading-4 text-zinc-400">{preset.tagline}</p>
            <div className="mt-auto flex flex-wrap gap-1">
              {preset.chips.map((chip) => (
                <span
                  key={chip}
                  className="rounded bg-zinc-800 px-1.5 py-0.5 text-[9px] font-medium text-zinc-400 group-hover:text-zinc-300"
                >
                  {chip}
                </span>
              ))}
            </div>
          </button>
        ))}
      </div>

      <p className="mt-2 text-[10px] leading-4 text-zinc-500">
        After generating, use <span className="text-zinc-400">AI Recolor / Color Shift</span> to test
        gold, black &amp; white — and pull a <span className="text-zinc-400">Flat Vector</span> copy for a
        clean favicon.
      </p>
    </div>
  )
}
