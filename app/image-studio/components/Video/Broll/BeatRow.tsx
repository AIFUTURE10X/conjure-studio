"use client"

/**
 * BeatRow — one editable B-roll moment: keyword, the transcript line it
 * covers, the cutaway prompt, and a per-beat duration.
 */

import { Textarea } from '@/components/ui/textarea'
import { Clapperboard, Quote, Trash2 } from 'lucide-react'
import type { BrollBeat } from './useBrollPlan'

interface BeatRowProps {
  beat: BrollBeat
  totalBeats: number
  onUpdate: (id: number, patch: Partial<Pick<BrollBeat, 'keyword' | 'videoPrompt' | 'durationSeconds'>>) => void
  onRemove: (id: number) => void
}

export function BeatRow({ beat, totalBeats, onUpdate, onRemove }: BeatRowProps) {
  return (
    <div className="rounded-lg border border-zinc-800 bg-zinc-950 p-2.5 space-y-2">
      <div className="flex items-center gap-2">
        <span className="px-1.5 py-0.5 rounded bg-zinc-800 text-[10px] font-bold text-zinc-400 shrink-0">
          {beat.id}/{totalBeats}
        </span>
        <input
          value={beat.keyword}
          onChange={(e) => onUpdate(beat.id, { keyword: e.target.value })}
          title="Short label for this B-roll moment"
          className="flex-1 min-w-0 bg-transparent text-xs font-medium text-zinc-200 outline-none border-b border-transparent focus:border-zinc-700"
        />
        {beat.videoQueued && (
          <span className="flex items-center gap-1 text-[10px] text-emerald-400 shrink-0">
            <Clapperboard className="w-3 h-3" /> queued
          </span>
        )}
        <select
          value={beat.durationSeconds}
          onChange={(e) => onUpdate(beat.id, { durationSeconds: Number(e.target.value) })}
          title="Clip duration (snaps to what Seedance Fast supports)"
          className="h-6 rounded-md bg-zinc-900 border border-zinc-800 text-[11px] text-zinc-300 px-1 outline-none shrink-0"
        >
          {[5, 6, 8, 10, 12].map((seconds) => (
            <option key={seconds} value={seconds}>{seconds}s</option>
          ))}
        </select>
        <button
          onClick={() => onRemove(beat.id)}
          title="Remove this beat"
          className="p-1 rounded-md text-zinc-600 hover:text-red-400 shrink-0"
        >
          <Trash2 className="w-3 h-3" />
        </button>
      </div>

      <p className="flex items-start gap-1.5 text-[10px] leading-4 text-zinc-500 italic">
        <Quote className="w-3 h-3 mt-0.5 shrink-0 text-zinc-600" />
        <span className="line-clamp-2">{beat.sourcePhrase}</span>
      </p>

      <Textarea
        value={beat.videoPrompt}
        onChange={(e) => onUpdate(beat.id, { videoPrompt: e.target.value })}
        title="Text-to-video cutaway prompt"
        className="min-h-[44px] bg-zinc-900 border-zinc-800 text-[11px] leading-4 text-[#dbb56e]/90 resize-y p-1.5"
      />
    </div>
  )
}
