"use client"

/**
 * ThumbnailAiPanel
 *
 * The hybrid AI step: describe the video / paste the title, pick a look, and
 * AI generates the background image (via /api/generate-image). The headline
 * stays an editable overlay layer so the text is always crisp and correct.
 */

import { useState } from 'react'
import { Loader2, Sparkles, Type } from 'lucide-react'
import { useThumbnail } from './ThumbnailProvider'
import { THUMBNAIL_AI_STYLES } from './thumbnail-constants'

export function ThumbnailAiPanel() {
  const { generateBackground, isGeneratingBg, setHeadline } = useThumbnail()
  const [idea, setIdea] = useState('')
  const [styleId, setStyleId] = useState(THUMBNAIL_AI_STYLES[0].id)
  const aiStyle = THUMBNAIL_AI_STYLES.find((s) => s.id === styleId) ?? THUMBNAIL_AI_STYLES[0]

  const chip =
    'rounded-md border px-2 py-1.5 text-[11px] font-medium transition-colors disabled:opacity-50'

  return (
    <div className="space-y-2 rounded-lg border border-[#c99850]/30 bg-[#c99850]/5 p-3">
      <div className="flex items-center gap-1.5">
        <Sparkles className="h-3.5 w-3.5 text-[#dbb56e]" />
        <h4 className="text-[11px] font-semibold uppercase tracking-wide text-[#dbb56e]">AI Generate</h4>
      </div>

      <textarea
        value={idea}
        onChange={(e) => setIdea(e.target.value)}
        rows={2}
        placeholder="Paste your video title or describe the thumbnail…"
        className="w-full resize-none rounded-md border border-zinc-700 bg-zinc-900 px-2.5 py-2 text-xs text-zinc-100 placeholder:text-zinc-600 focus:border-[#c99850]/60 focus:outline-none"
      />

      <div className="grid grid-cols-3 gap-1.5">
        {THUMBNAIL_AI_STYLES.map((s) => (
          <button
            key={s.id}
            onClick={() => setStyleId(s.id)}
            className={`${chip} ${styleId === s.id ? 'border-[#c99850] bg-[#c99850]/15 text-[#dbb56e]' : 'border-zinc-700 bg-zinc-800/70 text-zinc-300 hover:bg-zinc-700'}`}
          >
            {s.label}
          </button>
        ))}
      </div>

      <button
        onClick={() => generateBackground(idea, aiStyle.prompt)}
        disabled={isGeneratingBg}
        className="flex w-full items-center justify-center gap-2 rounded-md bg-linear-to-r from-purple-500 to-pink-500 px-3 py-2 text-xs font-semibold text-white transition-opacity hover:opacity-90 disabled:opacity-50"
      >
        {isGeneratingBg ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Sparkles className="h-3.5 w-3.5" />}
        {isGeneratingBg ? 'Generating…' : 'Generate background'}
      </button>

      <button
        onClick={() => idea.trim() && setHeadline({ text: idea.trim() })}
        disabled={!idea.trim()}
        className={`${chip} flex w-full items-center justify-center gap-1.5 border-zinc-700 bg-zinc-800/70 text-zinc-300 hover:bg-zinc-700`}
      >
        <Type className="h-3.5 w-3.5" /> Use title as headline
      </button>

      <p className="text-[10px] leading-snug text-zinc-500">
        AI makes the picture; your headline stays editable on top.
      </p>
    </div>
  )
}
