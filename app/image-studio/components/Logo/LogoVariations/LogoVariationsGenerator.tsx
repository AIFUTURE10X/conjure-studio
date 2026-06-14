"use client"

/**
 * LogoVariationsGenerator
 *
 * Ask the AI helper model for 3 distinct logo directions from a brand
 * brief, pick one, and apply its prompt + settings to the generator. Runs
 * against the standalone /api/generate-logo-variations endpoint so it never
 * touches the protected AI-helper chat subsystem.
 */

import { useState } from 'react'
import { toast } from 'sonner'
import { Loader2, Sparkles, Wand2, Zap } from 'lucide-react'
import { VariationCard } from './VariationCard'
import { variationToPatch, type HelperModelTier, type LogoVariation } from './types'
import type { LogoSettingsSuggestionPatch } from '../../../context/suggestion-patch'

interface LogoVariationsGeneratorProps {
  onApply: (patch: LogoSettingsSuggestionPatch) => void
  defaultBrief?: string
  disabled?: boolean
}

const MODEL_TIERS: { value: HelperModelTier; label: string; hint: string; icon: typeof Zap }[] = [
  { value: 'fast', label: 'Fast', hint: 'gpt-5.4-mini — quick & cheap', icon: Zap },
  { value: 'hq', label: 'Quality', hint: 'Larger model — slower, sharper ideas', icon: Sparkles },
]

export function LogoVariationsGenerator({ onApply, defaultBrief = '', disabled }: LogoVariationsGeneratorProps) {
  const [brief, setBrief] = useState(defaultBrief)
  const [model, setModel] = useState<HelperModelTier>('fast')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [variations, setVariations] = useState<LogoVariation[]>([])
  const [selectedId, setSelectedId] = useState<string | null>(null)

  const generate = async () => {
    const trimmed = brief.trim()
    if (!trimmed || loading) return
    setLoading(true)
    setError(null)
    try {
      const res = await fetch('/api/generate-logo-variations', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ brief: trimmed, model }),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data?.error || 'Failed to generate variations.')
      const list: LogoVariation[] = data.variations || []
      setVariations(list)
      setSelectedId(list[0]?.id ?? null)
      if (list.length === 0) setError('No variations returned. Try a more detailed brief.')
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to generate variations.')
      setVariations([])
      setSelectedId(null)
    } finally {
      setLoading(false)
    }
  }

  const apply = () => {
    const chosen = variations.find((v) => v.id === selectedId)
    if (!chosen) return
    onApply(variationToPatch(chosen))
    toast.success(`"${chosen.label}" applied — tweak the prompt or hit Generate.`)
  }

  return (
    <div className="rounded-xl border border-purple-500/30 bg-linear-to-br from-purple-500/10 to-zinc-900/40 p-3">
      <div className="mb-2 flex items-center gap-2">
        <Wand2 className="h-4 w-4 text-purple-300" />
        <span className="text-sm font-semibold text-white">AI Logo Variations</span>
        <span className="ml-auto text-[10px] text-zinc-500">3 directions · 1 click apply</span>
      </div>

      <textarea
        value={brief}
        onChange={(e) => setBrief(e.target.value)}
        placeholder="Describe the brand / logo (e.g. 'Conjure Studio — an AI image-generation studio, magical & premium, gold on black')"
        rows={2}
        disabled={disabled || loading}
        className="w-full resize-y rounded-md border border-zinc-700 bg-zinc-950 p-2 text-xs text-zinc-100 placeholder:text-zinc-600 focus:border-purple-500/60 focus:outline-none disabled:opacity-50"
      />

      <div className="mt-2 flex items-center gap-2">
        <div className="flex items-center gap-1 rounded-md border border-zinc-700 bg-zinc-900 p-0.5">
          {MODEL_TIERS.map(({ value, label, hint, icon: Icon }) => (
            <button
              key={value}
              onClick={() => setModel(value)}
              title={hint}
              disabled={disabled || loading}
              className={`flex items-center gap-1 rounded px-2 py-1 text-[11px] font-medium transition-colors disabled:opacity-50 ${
                model === value ? 'bg-purple-500/30 text-purple-200' : 'text-zinc-400 hover:text-zinc-200'
              }`}
            >
              <Icon className="h-3 w-3" />
              {label}
            </button>
          ))}
        </div>

        <button
          onClick={generate}
          disabled={disabled || loading || !brief.trim()}
          className="ml-auto flex items-center gap-1.5 rounded-md bg-linear-to-r from-purple-500 to-pink-500 px-3 py-1.5 text-xs font-semibold text-white transition-opacity hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-50"
        >
          {loading ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Sparkles className="h-3.5 w-3.5" />}
          {loading ? 'Thinking…' : 'Generate 3 variations'}
        </button>
      </div>

      {error && <p className="mt-2 text-[11px] text-red-400">{error}</p>}

      {variations.length > 0 && (
        <div className="mt-3 space-y-2">
          {variations.map((variation, index) => (
            <VariationCard
              key={variation.id}
              variation={variation}
              index={index}
              selected={selectedId === variation.id}
              onToggle={() => setSelectedId(variation.id)}
            />
          ))}

          <button
            onClick={apply}
            disabled={!selectedId}
            className="w-full rounded-md bg-linear-to-r from-[#c99850] to-[#dbb56e] px-3 py-2 text-xs font-semibold text-black transition-opacity hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-50"
          >
            Apply selected to settings
          </button>
          <p className="text-[10px] leading-4 text-zinc-500">
            Tick a direction, apply it, then tweak the prompt or hit Generate. Run again to explore more.
          </p>
        </div>
      )}
    </div>
  )
}
