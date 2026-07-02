"use client"

/**
 * EditToolbar
 *
 * Controls for ImageEditModal's paint phase: brush/eraser tool + size,
 * smart subject/background selection, undo/clear for the mask, the
 * erase-vs-replace AI mode, the replace prompt, a variant-count stepper,
 * and the Apply action.
 */

import { Eraser, Loader2, Paintbrush, Undo2, Wand2 } from 'lucide-react'
import { SmartMaskChips } from './SmartMaskChips'
import type { MaskDims } from './MaskCanvas'
import type { MaskTool } from './useMaskPainting'

export type EditMode = 'erase' | 'replace'

const MAX_VARIANTS = 3

interface EditToolbarProps {
  tool: MaskTool
  onToolChange: (tool: MaskTool) => void
  brushSize: number
  onBrushSizeChange: (size: number) => void
  /** Whether there's a stroke to undo — distinct from canClear, since a base (smart-mask) selection with no strokes still has content to clear. */
  canUndo: boolean
  /** Whether there's anything (strokes and/or a base selection) to clear. */
  canClear: boolean
  onUndo: () => void
  onClear: () => void
  mode: EditMode
  onModeChange: (mode: EditMode) => void
  prompt: string
  onPromptChange: (prompt: string) => void
  variants: number
  onVariantsChange: (count: number) => void
  isLoading: boolean
  onApply: () => void
  imageUrl: string
  getDisplayDims: () => MaskDims | null
  onMaskReady: (mask: ImageData) => void
}

const chipClass = (on: boolean) =>
  `flex items-center justify-center gap-1.5 rounded-md border px-3 py-2 text-xs font-medium transition-colors ${
    on ? 'border-[#c99850] bg-[#c99850]/10 text-[#dbb56e]' : 'border-zinc-700 bg-zinc-800/70 text-zinc-300 hover:bg-zinc-700'
  }`

export function EditToolbar({
  tool, onToolChange, brushSize, onBrushSizeChange,
  canUndo, canClear, onUndo, onClear,
  mode, onModeChange, prompt, onPromptChange,
  variants, onVariantsChange,
  isLoading, onApply,
  imageUrl, getDisplayDims, onMaskReady,
}: EditToolbarProps) {
  return (
    <div className="space-y-3">
      <div className="flex flex-wrap items-center gap-2">
        <div className="flex gap-1.5">
          <button onClick={() => onToolChange('brush')} className={chipClass(tool === 'brush')} title="Paint the mask">
            <Paintbrush className="h-3.5 w-3.5" /> Brush
          </button>
          <button onClick={() => onToolChange('eraser')} className={chipClass(tool === 'eraser')} title="Erase part of the mask">
            <Eraser className="h-3.5 w-3.5" /> Eraser
          </button>
        </div>

        <SmartMaskChips imageUrl={imageUrl} getDisplayDims={getDisplayDims} onMaskReady={onMaskReady} />

        <label className="flex min-w-[160px] flex-1 items-center gap-2 text-[11px] text-zinc-500">
          Brush size
          <input
            type="range"
            min={8}
            max={80}
            value={brushSize}
            onChange={(e) => onBrushSizeChange(Number(e.target.value))}
            className="w-full accent-[#c99850]"
            aria-label="Brush size"
          />
        </label>

        <button
          onClick={onUndo}
          disabled={!canUndo}
          title="Undo last stroke"
          className="flex items-center gap-1.5 rounded-md border border-zinc-700 bg-zinc-800/70 px-3 py-2 text-xs text-zinc-300 transition-colors hover:bg-zinc-700 disabled:cursor-not-allowed disabled:opacity-40"
        >
          <Undo2 className="h-3.5 w-3.5" /> Undo
        </button>
        <button
          onClick={onClear}
          disabled={!canClear}
          className="rounded-md border border-zinc-700 bg-zinc-800/70 px-3 py-2 text-xs text-zinc-300 transition-colors hover:bg-zinc-700 disabled:cursor-not-allowed disabled:opacity-40"
        >
          Clear
        </button>
      </div>

      <div className="grid grid-cols-2 gap-1.5">
        <button onClick={() => onModeChange('erase')} className={chipClass(mode === 'erase')}>
          <Eraser className="h-3.5 w-3.5" /> Erase
        </button>
        <button onClick={() => onModeChange('replace')} className={chipClass(mode === 'replace')}>
          <Wand2 className="h-3.5 w-3.5" /> Replace
        </button>
      </div>

      {mode === 'replace' && (
        <input
          value={prompt}
          onChange={(e) => onPromptChange(e.target.value)}
          placeholder="Describe what to put there…"
          className="w-full rounded-md border border-zinc-700 bg-zinc-900 px-2.5 py-2 text-xs text-zinc-100 placeholder:text-zinc-600 focus:border-[#c99850]/60 focus:outline-none"
        />
      )}

      <div className="flex items-center gap-2 text-[11px] text-zinc-500">
        <span>Variants</span>
        <div className="flex gap-1">
          {Array.from({ length: MAX_VARIANTS }, (_, i) => i + 1).map((count) => (
            <button
              key={count}
              onClick={() => onVariantsChange(count)}
              title={`Generate ${count} variant${count > 1 ? 's' : ''}`}
              className={`h-6 w-6 rounded-md border text-xs font-semibold transition-colors ${
                variants === count
                  ? 'border-[#c99850] bg-[#c99850]/10 text-[#dbb56e]'
                  : 'border-zinc-700 bg-zinc-800/70 text-zinc-400 hover:bg-zinc-700'
              }`}
            >
              {count}
            </button>
          ))}
        </div>
        {variants > 1 && <span>+1 credit each</span>}
      </div>

      <button
        onClick={onApply}
        disabled={isLoading}
        className="flex w-full items-center justify-center gap-2 rounded-md bg-linear-to-r from-purple-500 to-pink-500 px-4 py-2.5 text-sm font-semibold text-white transition-opacity hover:opacity-90 disabled:opacity-50"
      >
        {isLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Wand2 className="h-4 w-4" />}
        {isLoading ? 'Working…' : 'Apply AI edit'}
      </button>

      <p className="text-[11px] leading-snug text-zinc-500">
        Paint over the area you want to change. Uses 2 credits per edit.
      </p>
    </div>
  )
}
