"use client"

/**
 * TitleStyleGallery - browse 108 curated movie/TV title treatments and apply one
 * as the starting point for the user's own wordmark.
 *
 * Applying a style writes a prompt built from that title's recreation brief with
 * the user's brand name substituted in — the aesthetic transfers, the original
 * wordmark does not. Reference artwork is displayed for choosing only; it is
 * never sent to the generator.
 */

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { ChevronDown, ChevronUp, Clapperboard, ExternalLink, X } from 'lucide-react'
import { TitleStyleCard } from './TitleStyleCard'
import { TitleStyleFilters } from './TitleStyleFilters'
import { useTitleStyles } from './useTitleStyles'
import { applyTitleStyleTemplate } from '../../../constants/title-logo-presets'
import { GOLD_GRADIENT, type LogoConcept, type RenderStyle } from '../../../constants/logo-constants'

interface TitleStyleGalleryProps {
  onApplyPreset: (
    prompt: string,
    negativePrompt: string | undefined,
    concept: LogoConcept,
    renderStyles: RenderStyle[]
  ) => void
  disabled?: boolean
}

export function TitleStyleGallery({ onApplyPreset, disabled }: TitleStyleGalleryProps) {
  const [isExpanded, setIsExpanded] = useState(false)
  const [brandName, setBrandName] = useState('')
  const styles = useTitleStyles()

  const { selected } = styles
  const accentFor = (categoryId: string) =>
    styles.approaches.find((a) => a.id === categoryId)?.color ?? '#71717a'

  const handleApply = () => {
    if (!selected || !brandName.trim()) return

    onApplyPreset(
      applyTitleStyleTemplate(selected, brandName),
      selected.negativePrompt,
      selected.concept,
      selected.renderStyles
    )

    styles.selectStyle(null)
    setBrandName('')
    setIsExpanded(false)
  }

  return (
    <div className="space-y-2">
      {/* Header toggle */}
      <button
        type="button"
        onClick={() => setIsExpanded(!isExpanded)}
        disabled={disabled}
        className="flex w-full items-center justify-between rounded-lg border border-zinc-700 bg-zinc-800/50 px-3 py-2 text-sm text-white transition-colors hover:bg-zinc-800 disabled:opacity-50"
      >
        <div className="flex items-center gap-2">
          <Clapperboard className="h-4 w-4 text-[#dbb56e]" />
          <span>Title Styles</span>
          <span className="text-xs text-zinc-500">{styles.totalCount} film &amp; TV treatments</span>
          {selected && (
            <span className="rounded-full bg-[#c99850]/20 px-2 py-0.5 text-xs text-[#dbb56e]">
              {selected.sourceTitle}
            </span>
          )}
        </div>
        {isExpanded ? (
          <ChevronUp className="h-4 w-4 text-zinc-400" />
        ) : (
          <ChevronDown className="h-4 w-4 text-zinc-400" />
        )}
      </button>

      {isExpanded && (
        <div className="space-y-3 rounded-lg border border-zinc-700 bg-zinc-800/30 p-3">
          <TitleStyleFilters
            approaches={styles.approaches}
            counts={styles.counts}
            search={styles.search}
            setSearch={styles.setSearch}
            medium={styles.medium}
            setMedium={styles.setMedium}
            category={styles.category}
            setCategory={styles.setCategory}
            resultCount={styles.filtered.length}
            totalCount={styles.totalCount}
            onReset={styles.resetFilters}
          />

          {/* Grid */}
          {styles.filtered.length > 0 ? (
            <div className="grid max-h-[280px] grid-cols-3 gap-2 overflow-y-auto pr-1">
              {styles.filtered.map((preset) => (
                <TitleStyleCard
                  key={preset.id}
                  preset={preset}
                  isSelected={selected?.id === preset.id}
                  onSelect={styles.selectStyle}
                  accentColor={accentFor(preset.category)}
                />
              ))}
            </div>
          ) : (
            <p className="py-6 text-center text-xs text-zinc-500">
              No treatments match those filters.
            </p>
          )}

          {/* Selected style + apply */}
          {selected && (
            <div className="space-y-2 border-t border-zinc-700 pt-2">
              <div className="flex items-center gap-2">
                <span className="text-xs text-zinc-400">Selected:</span>
                <span className="text-xs font-medium text-white">{selected.sourceTitle}</span>
                <a
                  href={selected.referenceUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center gap-1 text-[10px] text-zinc-500 hover:text-[#dbb56e]"
                >
                  View original <ExternalLink className="h-2.5 w-2.5" />
                </a>
                <button
                  type="button"
                  onClick={() => styles.selectStyle(null)}
                  className="ml-auto rounded p-1 hover:bg-zinc-700"
                >
                  <X className="h-3 w-3 text-zinc-400" />
                </button>
              </div>

              <div className="rounded bg-zinc-900/50 p-2 text-[10px] leading-relaxed text-zinc-500">
                <span className="text-zinc-400">Brief:</span> {selected.signatureElement}.{' '}
                {selected.traits.slice(0, 4).join(' · ')}
              </div>

              <div className="flex gap-2">
                <Input
                  placeholder="Enter your brand name..."
                  value={brandName}
                  onChange={(e) => setBrandName(e.target.value)}
                  className="h-8 flex-1 border-zinc-700 bg-zinc-900 text-sm text-white placeholder:text-zinc-500"
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' && brandName.trim()) handleApply()
                  }}
                />
                <Button
                  onClick={handleApply}
                  disabled={!brandName.trim()}
                  size="sm"
                  className="h-8 px-4 text-xs font-semibold text-black disabled:opacity-50"
                  style={{ background: GOLD_GRADIENT }}
                >
                  Apply
                </Button>
              </div>

              <div className="flex flex-wrap items-center gap-2 text-[10px] text-zinc-500">
                <span>Base font:</span>
                <span className="rounded bg-zinc-700 px-1.5 py-0.5 text-zinc-300">
                  {selected.fontStartingPoint}
                </span>
                <span className="rounded bg-zinc-700 px-1.5 py-0.5 capitalize text-zinc-300">
                  {selected.concept}
                </span>
                {selected.renderStyles.map((style) => (
                  <span key={style} className="rounded bg-zinc-700 px-1.5 py-0.5 text-zinc-300">
                    {style}
                  </span>
                ))}
              </div>
            </div>
          )}

          <p className="text-[10px] leading-relaxed text-zinc-600">
            Reference artwork via TMDB, shown for selection only — it is never sent to the
            generator. Applying a style writes an original brief for your brand name.
          </p>
        </div>
      )}
    </div>
  )
}
