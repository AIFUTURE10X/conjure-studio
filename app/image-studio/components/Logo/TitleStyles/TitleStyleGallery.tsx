"use client"

/**
 * TitleStyleGallery - browse 108 curated movie/TV title treatments and apply one
 * as the starting point for the user's own wordmark.
 *
 * Applying a style writes a prompt built from that title's recreation brief with
 * the user's brand name substituted in — the aesthetic transfers, the original
 * wordmark does not — and drives the settings rail (logo type, visual style,
 * render treatment, typography) to match the design family.
 */

import { useState } from 'react'
import { toast } from 'sonner'
import { ChevronDown, ChevronUp, Clapperboard } from 'lucide-react'
import { TitleStyleCard } from './TitleStyleCard'
import { TitleStyleFilters } from './TitleStyleFilters'
import { TitleStyleSelectedPanel } from './TitleStyleSelectedPanel'
import { useTitleStyles } from './useTitleStyles'
import { fetchTitleStyleArtwork, type TitleStyleArtwork } from './titleStyleArtwork'
import {
  applyTitleStyleTemplate,
  TITLE_STYLE_BACKDROP_PROMPT,
  type TitleStylePreset,
  type TitleStyleSettings,
} from '../../../constants/title-logo-presets'
import type { LogoConcept, RenderStyle } from '../../../constants/logo-constants'

interface TitleStyleGalleryProps {
  onApplyPreset: (
    prompt: string,
    negativePrompt: string | undefined,
    concept: LogoConcept,
    renderStyles: RenderStyle[]
  ) => void
  /**
   * Optional. When provided, the gallery offers to also load the reference
   * artwork into the generator's reference slot. 'replicate' copies the
   * palette and finish closely (the prompt still letters the brand name);
   * 'inspire' treats it as a looser style guide.
   */
  onApplyReference?: (artwork: TitleStyleArtwork, mode: 'replicate' | 'inspire') => void
  /**
   * Optional. Called when the applied style keeps its dark backdrop (glow/neon
   * looks) — the parent should turn background removal off so the atmosphere
   * survives the pipeline.
   */
  onKeepBackground?: () => void
  /**
   * Optional. Drives the settings rail to match the style's design family:
   * logo type, visual style, render treatment, and typography. Typography
   * arrives as 'reference-match' when the artwork is also loaded as reference.
   */
  onApplyStyleSettings?: (settings: TitleStyleSettings) => void
  disabled?: boolean
}

export function TitleStyleGallery({
  onApplyPreset,
  onApplyReference,
  onKeepBackground,
  onApplyStyleSettings,
  disabled,
}: TitleStyleGalleryProps) {
  const [isExpanded, setIsExpanded] = useState(false)
  const [brandName, setBrandName] = useState('')
  const [useArtwork, setUseArtwork] = useState(false)
  // Replicate by default: it copies the reference palette and finish, which is
  // what picking a specific title treatment asks for. The prompt's exact-text
  // clause keeps the lettering on the user's brand name.
  const [artworkMode, setArtworkMode] = useState<'replicate' | 'inspire'>('replicate')
  const [keepBackdrop, setKeepBackdrop] = useState(false)
  const [loadingArtwork, setLoadingArtwork] = useState(false)
  const styles = useTitleStyles()

  // Selecting a style defaults the backdrop choice from its atmosphere flag.
  const handleSelect = (preset: TitleStylePreset | null) => {
    styles.selectStyle(preset)
    setKeepBackdrop(preset?.needsBackdrop ?? false)
  }

  const { selected } = styles
  const accentFor = (categoryId: string) =>
    styles.approaches.find((a) => a.id === categoryId)?.color ?? '#71717a'

  const handleApply = async () => {
    if (!selected || !brandName.trim() || loadingArtwork) return

    // Pull the artwork first — if it fails we keep the panel open so the user
    // can retry or apply without it, rather than silently dropping the option.
    let artwork: TitleStyleArtwork | null = null
    if (useArtwork && onApplyReference) {
      setLoadingArtwork(true)
      try {
        artwork = await fetchTitleStyleArtwork(selected.id)
      } catch (error) {
        toast.error(
          error instanceof Error ? error.message : 'Could not load reference artwork'
        )
        setLoadingArtwork(false)
        return
      }
      setLoadingArtwork(false)
    }

    const withBackdrop = keepBackdrop && Boolean(onKeepBackground)
    const prompt = withBackdrop
      ? `${applyTitleStyleTemplate(selected, brandName)} ${TITLE_STYLE_BACKDROP_PROMPT}`
      : applyTitleStyleTemplate(selected, brandName)

    onApplyPreset(prompt, selected.negativePrompt, selected.concept, selected.renderStyles)

    // Drive the settings rail to match the design family. With the artwork
    // loaded as reference, typography follows the reference instead.
    onApplyStyleSettings?.(
      artwork
        ? { ...selected.settings, typography: 'reference-match' }
        : selected.settings
    )

    if (withBackdrop) {
      onKeepBackground!()
      toast.info(
        'Background removal is off for this style — its glow lives on the dark backdrop. Re-enable it in Advanced settings.'
      )
    }

    if (artwork && onApplyReference) {
      onApplyReference(artwork, artworkMode)
      toast.success(
        artworkMode === 'replicate'
          ? `"${selected.sourceTitle}" applied — replicating its artwork with your brand name.`
          : `"${selected.sourceTitle}" applied with its artwork as inspiration.`
      )
    }

    handleSelect(null)
    setBrandName('')
    setUseArtwork(false)
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
                  onSelect={handleSelect}
                  accentColor={accentFor(preset.category)}
                />
              ))}
            </div>
          ) : (
            <p className="py-6 text-center text-xs text-zinc-500">
              No treatments match those filters.
            </p>
          )}

          {selected && (
            <TitleStyleSelectedPanel
              selected={selected}
              brandName={brandName}
              setBrandName={setBrandName}
              keepBackdrop={keepBackdrop}
              setKeepBackdrop={setKeepBackdrop}
              useArtwork={useArtwork}
              setUseArtwork={setUseArtwork}
              artworkMode={artworkMode}
              setArtworkMode={setArtworkMode}
              loadingArtwork={loadingArtwork}
              showBackdropOption={Boolean(onKeepBackground)}
              showArtworkOption={Boolean(onApplyReference)}
              onApply={() => void handleApply()}
              onClear={() => handleSelect(null)}
            />
          )}

          <p className="text-[10px] leading-relaxed text-zinc-600">
            Reference artwork via TMDB, shown for selection. Applying a style writes an
            original brief for your brand name; the artwork itself only reaches the generator
            if you opt in above.
          </p>
        </div>
      )}
    </div>
  )
}
