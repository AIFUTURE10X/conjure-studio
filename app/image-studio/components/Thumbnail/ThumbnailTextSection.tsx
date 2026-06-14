"use client"

/**
 * ThumbnailTextSection
 *
 * The "Text" block of the Manual rail: a list of text blocks (select / delete),
 * an "Add text block" button, and the editor (text, effect preset, color,
 * uppercase, size, tilt, letter spacing, font & FX) bound to the active block.
 */

import { Plus, Trash2 } from 'lucide-react'
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip'
import { useThumbnail } from './ThumbnailProvider'
import { RangeRow, ToggleRow } from './ThumbnailControls'
import { ThumbnailHeadlineFxPanel } from './ThumbnailHeadlineFxPanel'
import { TEXT_PRESETS } from './thumbnail-constants'
import { railButton, railLabel } from './thumbnail-ui'

export function ThumbnailTextSection() {
  const { config, setHeadline, activeHeadline, addTextBlock, removeTextBlock, setSelectedStickerId } = useThumbnail()
  const { headlines } = config
  const headline = activeHeadline

  return (
    <div className="space-y-2">
      <h4 className={railLabel}>Text</h4>

      <div className="space-y-1">
        {headlines.map((b) => {
          const active = b.id === headline.id
          return (
            <div key={b.id} className="flex items-center gap-1.5">
              <button
                onClick={() => setSelectedStickerId(b.id)}
                className={`flex-1 truncate rounded-md border px-2.5 py-1.5 text-left text-xs transition-colors ${
                  active ? 'border-[#c99850] text-[#dbb56e]' : 'border-zinc-700 bg-zinc-800/70 text-zinc-300 hover:bg-zinc-700'
                }`}
              >
                {b.text || 'Empty text'}
              </button>
              {headlines.length > 1 && (
                <button
                  onClick={() => removeTextBlock(b.id)}
                  title="Delete text block"
                  className="shrink-0 rounded-md border border-zinc-700 p-1.5 text-zinc-500 transition-colors hover:border-red-500/60 hover:text-red-300"
                >
                  <Trash2 className="h-3.5 w-3.5" />
                </button>
              )}
            </div>
          )
        })}
      </div>

      <button onClick={addTextBlock} className={`${railButton} w-full`}>
        <Plus className="h-3.5 w-3.5" /> Add text block
      </button>

      <textarea
        value={headline.text}
        onChange={(e) => setHeadline({ text: e.target.value })}
        rows={2}
        placeholder="Your title here (Enter for a new line)"
        className="w-full resize-none rounded-md border border-zinc-700 bg-zinc-900 px-2.5 py-2 text-xs text-zinc-100 placeholder:text-zinc-600 focus:border-[#c99850]/60 focus:outline-none"
      />
      <div className="grid grid-cols-4 gap-1.5">
        {TEXT_PRESETS.map((p) => (
          <Tooltip key={p.id}>
            <TooltipTrigger asChild>
              <button
                onClick={() => setHeadline({ preset: p.id })}
                className={`${railButton} ${headline.preset === p.id ? 'border-[#c99850] text-[#dbb56e]' : ''}`}
              >
                {p.label}
              </button>
            </TooltipTrigger>
            <TooltipContent side="top" className="max-w-48">
              {p.description}
            </TooltipContent>
          </Tooltip>
        ))}
      </div>
      <div className="flex items-center gap-2">
        <input
          type="color"
          value={headline.color}
          onChange={(e) => setHeadline({ color: e.target.value })}
          className="h-8 w-10 shrink-0 cursor-pointer rounded-md border border-zinc-700 bg-zinc-900"
          aria-label="Headline color"
        />
        <button
          onClick={() => setHeadline({ uppercase: !headline.uppercase })}
          className={`${railButton} flex-1 ${headline.uppercase ? 'border-[#c99850] text-[#dbb56e]' : ''}`}
        >
          UPPERCASE
        </button>
      </div>
      <label className="block text-[11px] text-zinc-500">
        Size
        <input
          type="range"
          min={8}
          max={40}
          value={headline.size}
          onChange={(e) => setHeadline({ size: Number(e.target.value) })}
          className="w-full accent-[#c99850]"
        />
      </label>
      <div className="flex items-center gap-2">
        <div className="flex-1">
          <ToggleRow
            label="Keep on one line"
            active={!!headline.noWrap}
            onToggle={() => setHeadline({ noWrap: !headline.noWrap })}
          />
        </div>
        <label className="flex shrink-0 items-center gap-1 text-[11px] text-zinc-500">
          Lines
          <input
            type="number"
            min={2}
            max={6}
            value={headline.lines ?? ''}
            placeholder="auto"
            disabled={!!headline.noWrap}
            onChange={(e) => setHeadline({ lines: e.target.value ? Number(e.target.value) : undefined })}
            className="w-14 rounded-md border border-zinc-700 bg-zinc-900 px-1.5 py-1.5 text-center text-xs text-zinc-100 placeholder:text-zinc-600 focus:border-[#c99850]/60 focus:outline-none disabled:opacity-40"
          />
        </label>
      </div>
      {!headline.noWrap && (headline.lines ?? 0) < 2 && (
        <RangeRow
          label="Width"
          value={headline.width ?? 60}
          min={20}
          max={100}
          suffix="%"
          onChange={(v) => setHeadline({ width: v })}
        />
      )}
      <label className="block text-[11px] text-zinc-500">
        Tilt
        <input
          type="range"
          min={-15}
          max={15}
          value={headline.rotation}
          onChange={(e) => setHeadline({ rotation: Number(e.target.value) })}
          className="w-full accent-[#c99850]"
        />
      </label>
      <RangeRow
        label="Letter spacing"
        value={headline.letterSpacing ?? -1}
        min={-5}
        max={40}
        onChange={(v) => setHeadline({ letterSpacing: v })}
      />
      <ThumbnailHeadlineFxPanel />
    </div>
  )
}
