"use client"

/**
 * TitleStyleCard - one reference treatment in the Title Styles grid.
 *
 * The artwork is loaded straight from the TMDB image CDN (transparent
 * ClearLogo PNGs) — it is shown as attributed reference only, never sent to
 * the generator. Dark-inked marks get a light backdrop so they stay legible
 * against the studio's dark chrome.
 */

import { useState } from 'react'
import { Check, ImageOff } from 'lucide-react'
import { Tooltip, TooltipTrigger, TooltipContent } from '@/components/ui/tooltip'
import { useInViewOnce } from './useInViewOnce'
import type { TitleStylePreset } from '../../../constants/title-logo-presets'

interface TitleStyleCardProps {
  preset: TitleStylePreset
  isSelected: boolean
  onSelect: (preset: TitleStylePreset) => void
  accentColor: string
}

export function TitleStyleCard({ preset, isSelected, onSelect, accentColor }: TitleStyleCardProps) {
  const [artworkFailed, setArtworkFailed] = useState(false)
  const { ref, inView } = useInViewOnce<HTMLButtonElement>()

  return (
    <Tooltip>
      <TooltipTrigger asChild>
        <button
          ref={ref}
          type="button"
          onClick={() => onSelect(preset)}
          className={`group relative rounded-lg border p-2 text-left transition-all ${
            isSelected
              ? 'border-[#c99850] bg-[#c99850]/10'
              : 'border-zinc-700 bg-zinc-800/50 hover:border-zinc-600 hover:bg-zinc-800'
          }`}
        >
          {isSelected && (
            <div className="absolute top-1 right-1 z-10 flex h-4 w-4 items-center justify-center rounded-full bg-[#c99850]">
              <Check className="h-3 w-3 text-black" />
            </div>
          )}

          <div
            className={`mb-1.5 flex h-12 w-full items-center justify-center overflow-hidden rounded ${
              preset.needsLightBackdrop ? 'bg-zinc-300' : 'bg-zinc-900/60'
            }`}
          >
            {artworkFailed ? (
              <ImageOff className="h-4 w-4 text-zinc-600" />
            ) : inView ? (
              <img
                src={preset.artworkUrl}
                alt={`${preset.sourceTitle} title treatment`}
                decoding="async"
                onError={() => setArtworkFailed(true)}
                className="h-full w-full object-contain p-1 transition-transform group-hover:scale-105"
              />
            ) : (
              <div className="h-full w-full animate-pulse bg-zinc-700/40" />
            )}
          </div>

          <div className="truncate text-[11px] font-medium text-white">{preset.sourceTitle}</div>
          <div className="flex items-center gap-1">
            <span
              className="h-1.5 w-1.5 shrink-0 rounded-full"
              style={{ backgroundColor: accentColor }}
            />
            <span className="truncate text-[10px] text-zinc-500">{preset.signatureElement}</span>
          </div>
        </button>
      </TooltipTrigger>
      <TooltipContent side="bottom" className="max-w-[260px]">
        <p className="text-xs font-medium">
          {preset.sourceTitle}{' '}
          <span className="text-zinc-400">
            ({preset.year} {preset.medium === 'tv' ? 'TV' : 'film'})
          </span>
        </p>
        <p className="mt-1 text-xs text-zinc-300">{preset.signatureElement}</p>
        <p className="mt-1 text-[10px] text-zinc-400">
          {preset.categoryLabel} · base font {preset.fontStartingPoint}
        </p>
      </TooltipContent>
    </Tooltip>
  )
}
