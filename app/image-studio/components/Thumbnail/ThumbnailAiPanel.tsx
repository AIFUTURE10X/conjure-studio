"use client"

/**
 * ThumbnailAiPanel
 *
 * The hybrid AI step: describe the video / paste the title, then either
 * (a) get 3 AI thumbnail concepts to click-apply, or (b) generate a
 * background directly. The headline always stays an editable overlay layer.
 */

import { useState } from 'react'
import { toast } from 'sonner'
import { Lightbulb, Loader2, Sparkles, Trash2, Type } from 'lucide-react'
import { useThumbnail } from './ThumbnailProvider'
import {
  THUMBNAIL_AI_STYLES,
  THUMBNAIL_MODELS,
  THUMBNAIL_SIZES,
  type ThumbnailConcept,
  type ThumbnailSize,
} from './thumbnail-constants'

const chip =
  'rounded-md border px-2 py-1.5 text-[11px] font-medium transition-colors disabled:opacity-50'
const chipOn = 'border-[#c99850] bg-[#c99850]/15 text-[#dbb56e]'
const chipOff = 'border-zinc-700 bg-zinc-800/70 text-zinc-300 hover:bg-zinc-700'

export function ThumbnailAiPanel() {
  const {
    config,
    generateBackground,
    generateBackgroundVariations,
    bgVariations,
    chooseBackground,
    isGeneratingBg,
    clearBackground,
    setHeadline,
    applyTemplate,
  } = useThumbnail()
  const [idea, setIdea] = useState('')
  const [styleId, setStyleId] = useState(THUMBNAIL_AI_STYLES[0].id)
  const [model, setModel] = useState(THUMBNAIL_MODELS[0].id)
  const [size, setSize] = useState<ThumbnailSize>('1K')
  const [concepts, setConcepts] = useState<ThumbnailConcept[]>([])
  const [loadingConcepts, setLoadingConcepts] = useState(false)

  const aiStyle = THUMBNAIL_AI_STYLES.find((s) => s.id === styleId) ?? THUMBNAIL_AI_STYLES[0]
  const hasAiBackground = config.background.kind === 'image' && !!config.background.imageUrl

  const fetchConcepts = async () => {
    if (!idea.trim()) return
    setLoadingConcepts(true)
    try {
      const res = await fetch('/api/generate-thumbnail-concepts', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ title: idea.trim() }),
      })
      const data = (await res.json()) as { concepts?: ThumbnailConcept[]; error?: string }
      if (!res.ok || !Array.isArray(data.concepts) || data.concepts.length === 0) {
        throw new Error(data.error || 'No concepts returned')
      }
      setConcepts(data.concepts)
    } catch (err) {
      console.error('[Thumbnail] concepts failed:', err)
      toast.error('Could not get ideas — try again')
    } finally {
      setLoadingConcepts(false)
    }
  }

  const applyConcept = (concept: ThumbnailConcept) => {
    applyTemplate(concept.templateId)
    setHeadline({ text: concept.headline, color: concept.color })
    const style = THUMBNAIL_AI_STYLES.find((s) => s.id === concept.styleId) ?? aiStyle
    setStyleId(style.id)
    generateBackground(concept.backgroundPrompt, style.prompt, { model, imageSize: size })
  }

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

      {/* 1) AI concepts from the title */}
      <button
        onClick={fetchConcepts}
        disabled={!idea.trim() || loadingConcepts}
        className="flex w-full items-center justify-center gap-2 rounded-md border border-[#c99850]/50 bg-[#c99850]/10 px-3 py-2 text-xs font-semibold text-[#dbb56e] transition-colors hover:bg-[#c99850]/20 disabled:opacity-50"
      >
        {loadingConcepts ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Lightbulb className="h-3.5 w-3.5" />}
        {loadingConcepts ? 'Thinking…' : 'Get 3 thumbnail ideas'}
      </button>

      {concepts.length > 0 && (
        <div className="space-y-1.5">
          <p className="text-[10px] font-semibold uppercase tracking-wide text-zinc-500">
            Click a concept to build it
          </p>
          {concepts.map((concept, i) => (
            <button
              key={i}
              onClick={() => applyConcept(concept)}
              disabled={isGeneratingBg}
              className="flex w-full flex-col items-start gap-0.5 rounded-md border border-zinc-700 bg-zinc-900 px-2.5 py-2 text-left transition-colors hover:border-[#c99850]/60 disabled:opacity-50"
            >
              <span className="text-xs font-bold" style={{ color: concept.color }}>
                {concept.headline}
              </span>
              <span className="text-[10px] leading-snug text-zinc-500">{concept.summary}</span>
            </button>
          ))}
        </div>
      )}

      {/* 2) Or generate a background directly */}
      <div className="grid grid-cols-3 gap-1.5 border-t border-[#c99850]/20 pt-2">
        {THUMBNAIL_AI_STYLES.map((s) => (
          <button key={s.id} onClick={() => setStyleId(s.id)} className={`${chip} ${styleId === s.id ? chipOn : chipOff}`}>
            {s.label}
          </button>
        ))}
      </div>

      <div className="flex gap-1.5">
        {THUMBNAIL_MODELS.map((m) => (
          <button key={m.id} onClick={() => setModel(m.id)} title={m.full} className={`${chip} flex-1 ${model === m.id ? chipOn : chipOff}`}>
            {m.label}
          </button>
        ))}
        {THUMBNAIL_SIZES.map((s) => (
          <button key={s} onClick={() => setSize(s)} title={`${s} resolution`} className={`${chip} ${size === s ? chipOn : chipOff}`}>
            {s}
          </button>
        ))}
      </div>

      <div className="flex gap-1.5">
        <button
          onClick={() => generateBackground(idea, aiStyle.prompt, { model, imageSize: size })}
          disabled={isGeneratingBg}
          className="flex flex-1 items-center justify-center gap-2 rounded-md bg-linear-to-r from-purple-500 to-pink-500 px-3 py-2 text-xs font-semibold text-white transition-opacity hover:opacity-90 disabled:opacity-50"
        >
          {isGeneratingBg ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Sparkles className="h-3.5 w-3.5" />}
          {isGeneratingBg ? 'Generating…' : hasAiBackground ? 'Regenerate' : 'Generate background'}
        </button>
        <button
          onClick={() => generateBackgroundVariations(idea, aiStyle.prompt, { model, imageSize: size })}
          disabled={isGeneratingBg}
          title="Generate 3 options to choose from"
          className="shrink-0 rounded-md border border-purple-400/50 bg-purple-500/10 px-3 py-2 text-xs font-semibold text-purple-200 transition-colors hover:bg-purple-500/20 disabled:opacity-50"
        >
          ×3
        </button>
      </div>

      {bgVariations.length > 1 && (
        <div className="grid grid-cols-3 gap-1.5">
          {bgVariations.map((url, i) => (
            <button
              key={i}
              onClick={() => chooseBackground(url)}
              title={`Option ${i + 1}`}
              className={`overflow-hidden rounded-md border transition-colors ${
                config.background.imageUrl === url ? 'border-[#c99850]' : 'border-zinc-700 hover:border-zinc-500'
              }`}
              style={{ aspectRatio: '16 / 9' }}
            >
              <img src={url} alt={`Option ${i + 1}`} className="h-full w-full object-cover" />
            </button>
          ))}
        </div>
      )}

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
