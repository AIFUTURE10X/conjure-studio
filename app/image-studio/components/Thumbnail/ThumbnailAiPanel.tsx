"use client"

/**
 * ThumbnailAiPanel
 *
 * The hybrid AI step: describe the video / paste the title, pick a look +
 * model, and AI generates the background image (via /api/generate-image).
 * The headline stays an editable overlay layer so text is always crisp.
 */

import { useState } from 'react'
import { Loader2, Sparkles, Trash2, Type } from 'lucide-react'
import { useThumbnail } from './ThumbnailProvider'
import {
  THUMBNAIL_AI_STYLES,
  THUMBNAIL_MODELS,
  THUMBNAIL_SIZES,
  type ThumbnailSize,
} from './thumbnail-constants'

const chip =
  'rounded-md border px-2 py-1.5 text-[11px] font-medium transition-colors disabled:opacity-50'
const chipOn = 'border-[#c99850] bg-[#c99850]/15 text-[#dbb56e]'
const chipOff = 'border-zinc-700 bg-zinc-800/70 text-zinc-300 hover:bg-zinc-700'

export function ThumbnailAiPanel() {
  const { config, generateBackground, isGeneratingBg, clearBackground, setHeadline } = useThumbnail()
  const [idea, setIdea] = useState('')
  const [styleId, setStyleId] = useState(THUMBNAIL_AI_STYLES[0].id)
  const [model, setModel] = useState(THUMBNAIL_MODELS[0].id)
  const [size, setSize] = useState<ThumbnailSize>('1K')

  const aiStyle = THUMBNAIL_AI_STYLES.find((s) => s.id === styleId) ?? THUMBNAIL_AI_STYLES[0]
  const hasAiBackground = config.background.kind === 'image' && !!config.background.imageUrl

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
          <button key={s.id} onClick={() => setStyleId(s.id)} className={`${chip} ${styleId === s.id ? chipOn : chipOff}`}>
            {s.label}
          </button>
        ))}
      </div>

      {/* Model + quality */}
      <div className="flex gap-1.5">
        {THUMBNAIL_MODELS.map((m) => (
          <button
            key={m.id}
            onClick={() => setModel(m.id)}
            title={m.full}
            className={`${chip} flex-1 ${model === m.id ? chipOn : chipOff}`}
          >
            {m.label}
          </button>
        ))}
        {THUMBNAIL_SIZES.map((s) => (
          <button key={s} onClick={() => setSize(s)} title={`${s} resolution`} className={`${chip} ${size === s ? chipOn : chipOff}`}>
            {s}
          </button>
        ))}
      </div>

      <button
        onClick={() => generateBackground(idea, aiStyle.prompt, { model, imageSize: size })}
        disabled={isGeneratingBg}
        className="flex w-full items-center justify-center gap-2 rounded-md bg-linear-to-r from-purple-500 to-pink-500 px-3 py-2 text-xs font-semibold text-white transition-opacity hover:opacity-90 disabled:opacity-50"
      >
        {isGeneratingBg ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Sparkles className="h-3.5 w-3.5" />}
        {isGeneratingBg ? 'Generating…' : hasAiBackground ? 'Regenerate background' : 'Generate background'}
      </button>

      <div className="flex gap-1.5">
        <button
          onClick={() => idea.trim() && setHeadline({ text: idea.trim() })}
          disabled={!idea.trim()}
          className={`${chip} ${chipOff} flex flex-1 items-center justify-center gap-1.5`}
        >
          <Type className="h-3.5 w-3.5" /> Use as headline
        </button>
        {hasAiBackground && (
          <button
            onClick={clearBackground}
            title="Remove the AI background"
            className={`${chip} ${chipOff} flex items-center justify-center gap-1.5 hover:border-red-500/60 hover:text-red-300`}
          >
            <Trash2 className="h-3.5 w-3.5" /> Clear
          </button>
        )}
      </div>

      <p className="text-[10px] leading-snug text-zinc-500">
        AI makes the picture; your headline stays editable on top.
      </p>
    </div>
  )
}
