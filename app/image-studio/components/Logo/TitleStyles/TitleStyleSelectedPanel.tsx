"use client"

/**
 * TitleStyleSelectedPanel - the "Selected: <title>" section of the gallery:
 * brief, brand-name input, the backdrop/artwork options, and the settings
 * summary chips. Pure presentation — all state lives in TitleStyleGallery.
 */

import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { ExternalLink, Loader2, X } from 'lucide-react'
import { GOLD_GRADIENT } from '../../../constants/logo-constants'
import type { TitleStylePreset } from '../../../constants/title-logo-presets'

interface TitleStyleSelectedPanelProps {
  selected: TitleStylePreset
  brandName: string
  setBrandName: (value: string) => void
  keepBackdrop: boolean
  setKeepBackdrop: (value: boolean) => void
  useArtwork: boolean
  setUseArtwork: (value: boolean) => void
  artworkMode: 'replicate' | 'inspire'
  setArtworkMode: (value: 'replicate' | 'inspire') => void
  loadingArtwork: boolean
  showBackdropOption: boolean
  showArtworkOption: boolean
  onApply: () => void
  onClear: () => void
}

export function TitleStyleSelectedPanel({
  selected,
  brandName,
  setBrandName,
  keepBackdrop,
  setKeepBackdrop,
  useArtwork,
  setUseArtwork,
  artworkMode,
  setArtworkMode,
  loadingArtwork,
  showBackdropOption,
  showArtworkOption,
  onApply,
  onClear,
}: TitleStyleSelectedPanelProps) {
  return (
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
        <button type="button" onClick={onClear} className="ml-auto rounded p-1 hover:bg-zinc-700">
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
            if (e.key === 'Enter' && brandName.trim()) onApply()
          }}
        />
        <Button
          onClick={onApply}
          disabled={!brandName.trim() || loadingArtwork}
          size="sm"
          className="h-8 px-4 text-xs font-semibold text-black disabled:opacity-50"
          style={{ background: GOLD_GRADIENT }}
        >
          {loadingArtwork ? <Loader2 className="h-3 w-3 animate-spin" /> : 'Apply'}
        </Button>
      </div>

      {/* Glow/neon looks need their dark backdrop — default on for those */}
      {showBackdropOption && (
        <label className="group flex cursor-pointer items-start gap-2">
          <input
            type="checkbox"
            checked={keepBackdrop}
            onChange={(e) => setKeepBackdrop(e.target.checked)}
            disabled={loadingArtwork}
            className="mt-0.5 h-3.5 w-3.5 shrink-0 cursor-pointer rounded border-zinc-600 bg-zinc-800 text-[#c99850] focus:ring-0 focus:ring-offset-0"
          />
          <span className="text-[10px] leading-relaxed text-zinc-400 transition-colors group-hover:text-zinc-300">
            Keep the dark backdrop{' '}
            <span className="text-zinc-500">
              (turns background removal off — glow and atmosphere only survive on their
              background{selected.needsBackdrop ? '; recommended for this style' : ''})
            </span>
          </span>
        </label>
      )}

      {/* Opt-in: hand the artwork to the generator as visual inspiration */}
      {showArtworkOption && (
        <label className="group flex cursor-pointer items-start gap-2">
          <input
            type="checkbox"
            checked={useArtwork}
            onChange={(e) => setUseArtwork(e.target.checked)}
            disabled={loadingArtwork}
            className="mt-0.5 h-3.5 w-3.5 shrink-0 cursor-pointer rounded border-zinc-600 bg-zinc-800 text-[#c99850] focus:ring-0 focus:ring-offset-0"
          />
          <span className="text-[10px] leading-relaxed text-zinc-400 transition-colors group-hover:text-zinc-300">
            Also load the artwork as a visual reference{' '}
            <span className="text-zinc-500">
              (the model reads its palette, shapes and finish, but still letters your brand
              name. Sets Typography to Reference Match.)
            </span>
          </span>
        </label>
      )}

      {/* How closely the reference is followed — only relevant once it's loaded */}
      {showArtworkOption && useArtwork && (
        <div className="ml-5 flex items-center gap-1 rounded-lg border border-zinc-700 bg-zinc-800/50 p-1">
          <button
            type="button"
            onClick={() => setArtworkMode('replicate')}
            disabled={loadingArtwork}
            className={`flex-1 rounded-md px-3 py-1 text-[10px] font-medium transition-all ${
              artworkMode === 'replicate'
                ? 'border border-purple-500/30 bg-purple-500/20 text-purple-400'
                : 'text-zinc-400 hover:bg-zinc-700 hover:text-white'
            }`}
          >
            Replicate — match its colors &amp; finish
          </button>
          <button
            type="button"
            onClick={() => setArtworkMode('inspire')}
            disabled={loadingArtwork}
            className={`flex-1 rounded-md px-3 py-1 text-[10px] font-medium transition-all ${
              artworkMode === 'inspire'
                ? 'border border-amber-500/30 bg-amber-500/20 text-amber-400'
                : 'text-zinc-400 hover:bg-zinc-700 hover:text-white'
            }`}
          >
            Inspire — looser style guide
          </button>
        </div>
      )}

      <div className="flex flex-wrap items-center gap-2 text-[10px] text-zinc-500">
        <span>Applies:</span>
        <span className="rounded bg-zinc-700 px-1.5 py-0.5 text-zinc-300">
          {selected.fontStartingPoint}
        </span>
        <span className="rounded bg-zinc-700 px-1.5 py-0.5 capitalize text-zinc-300">
          {selected.settings.logoType}
        </span>
        <span className="rounded bg-zinc-700 px-1.5 py-0.5 capitalize text-zinc-300">
          {selected.settings.visualStyle}
        </span>
        <span className="rounded bg-zinc-700 px-1.5 py-0.5 capitalize text-zinc-300">
          {selected.settings.renderTreatment}
        </span>
        <span className="rounded bg-zinc-700 px-1.5 py-0.5 capitalize text-zinc-300">
          {useArtwork ? 'reference-match' : selected.settings.typography}
        </span>
      </div>
    </div>
  )
}
