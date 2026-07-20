"use client"

/**
 * ShotRow — one editable shot in the Story Mode plan: frame thumbnail,
 * frame/motion prompts, duration, and per-shot regenerate.
 */

import { Textarea } from '@/components/ui/textarea'
import { Check, Clapperboard, ImageIcon, Loader2, RefreshCw, Trash2, TriangleAlert } from 'lucide-react'
import type { StoryShot } from './useStoryMode'

interface ShotRowProps {
  shot: StoryShot
  totalShots: number
  onUpdate: (id: number, patch: Partial<Pick<StoryShot, 'title' | 'framePrompt' | 'motionPrompt' | 'durationSeconds'>>) => void
  onRemove: (id: number) => void
  onRegenerateFrame: (shot: StoryShot) => void
}

export function ShotRow({ shot, totalShots, onUpdate, onRemove, onRegenerateFrame }: ShotRowProps) {
  return (
    <div className="rounded-lg border border-zinc-800 bg-zinc-950 p-2.5 space-y-2">
      <div className="flex items-center gap-2">
        <span className="px-1.5 py-0.5 rounded bg-zinc-800 text-[10px] font-bold text-zinc-400 shrink-0">
          {shot.id}/{totalShots}
        </span>
        <input
          value={shot.title}
          onChange={(e) => onUpdate(shot.id, { title: e.target.value })}
          className="flex-1 min-w-0 bg-transparent text-xs font-medium text-zinc-200 outline-none border-b border-transparent focus:border-zinc-700"
        />
        {shot.videoQueued && (
          <span className="flex items-center gap-1 text-[10px] text-emerald-400 shrink-0">
            <Clapperboard className="w-3 h-3" /> queued
          </span>
        )}
        <button
          onClick={() => onRemove(shot.id)}
          title="Remove this shot"
          className="p-1 rounded-md text-zinc-600 hover:text-red-400 shrink-0"
        >
          <Trash2 className="w-3 h-3" />
        </button>
      </div>

      <div className="flex gap-2.5">
        <div className="w-24 shrink-0">
          <div className="relative w-24 h-16 rounded-md overflow-hidden border border-zinc-800 bg-black flex items-center justify-center">
            {shot.frameStatus === 'done' && shot.frameUrl ? (
              <img src={shot.frameUrl} alt={shot.title} className="w-full h-full object-cover" />
            ) : shot.frameStatus === 'generating' ? (
              <Loader2 className="w-4 h-4 text-[#dbb56e] animate-spin" />
            ) : shot.frameStatus === 'failed' ? (
              <TriangleAlert className="w-4 h-4 text-red-400" />
            ) : (
              <ImageIcon className="w-4 h-4 text-zinc-700" />
            )}
            {shot.frameStatus === 'done' && (
              <span className="absolute top-0.5 right-0.5 rounded-full bg-black/70 p-0.5">
                <Check className="w-2.5 h-2.5 text-emerald-400" />
              </span>
            )}
          </div>
          <button
            onClick={() => onRegenerateFrame(shot)}
            disabled={shot.frameStatus === 'generating'}
            className="mt-1 w-full flex items-center justify-center gap-1 px-1 py-0.5 rounded text-[10px] text-zinc-500 hover:text-zinc-300 hover:bg-zinc-800 transition-colors disabled:opacity-40"
          >
            <RefreshCw className="w-2.5 h-2.5" />
            {shot.frameStatus === 'done' ? 'Redo frame' : 'Frame'}
          </button>
        </div>

        <div className="flex-1 min-w-0 space-y-1.5">
          <Textarea
            value={shot.framePrompt}
            onChange={(e) => onUpdate(shot.id, { framePrompt: e.target.value })}
            title="Start-frame prompt (image)"
            className="min-h-[44px] bg-zinc-900 border-zinc-800 text-[11px] leading-4 text-zinc-300 resize-y p-1.5"
          />
          <div className="flex gap-1.5 items-start">
            <Textarea
              value={shot.motionPrompt}
              onChange={(e) => onUpdate(shot.id, { motionPrompt: e.target.value })}
              title="Motion prompt (video)"
              className="min-h-[34px] flex-1 bg-zinc-900 border-zinc-800 text-[11px] leading-4 text-[#dbb56e]/90 resize-y p-1.5"
            />
            <select
              value={shot.durationSeconds}
              onChange={(e) => onUpdate(shot.id, { durationSeconds: Number(e.target.value) })}
              title="Shot duration (snaps to what the selected model supports)"
              className="h-[34px] rounded-md bg-zinc-900 border border-zinc-800 text-[11px] text-zinc-300 px-1 outline-none"
            >
              {[4, 5, 6, 8, 10, 12].map((seconds) => (
                <option key={seconds} value={seconds}>{seconds}s</option>
              ))}
            </select>
          </div>
        </div>
      </div>
    </div>
  )
}
