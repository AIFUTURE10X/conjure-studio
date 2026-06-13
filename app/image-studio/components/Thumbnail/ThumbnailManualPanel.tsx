"use client"

/**
 * ThumbnailManualPanel
 *
 * The "Manual" half of the Thumbnail rail: template picker, background source,
 * subject (upload + one-click cutout reusing /api/remove-background), headline
 * text styling, stickers, logo/watermark, export, and saved-thumbnail history.
 * Paired with ThumbnailAiPanel behind the rail's AI | Manual tabs.
 */

import { type ReactNode } from 'react'
import { FlipHorizontal2, Loader2, Scissors, Trash2, Upload } from 'lucide-react'
import { useThumbnail } from './ThumbnailProvider'
import { ThumbnailStickerPanel } from './ThumbnailStickerPanel'
import { ThumbnailLogoPanel } from './ThumbnailLogoPanel'
import { ThumbnailExportPanel } from './ThumbnailExportPanel'
import { ThumbnailHistoryStrip } from './ThumbnailHistoryStrip'
import { ThumbnailBackgroundFxPanel } from './ThumbnailBackgroundFxPanel'
import { ThumbnailSubjectFxPanel } from './ThumbnailSubjectFxPanel'
import { ThumbnailHeadlineFxPanel } from './ThumbnailHeadlineFxPanel'
import { ThumbnailArrangePanel } from './ThumbnailArrangePanel'
import { TEXT_PRESETS, THUMBNAIL_TEMPLATES, type BackgroundKind } from './thumbnail-constants'
import { railButton, railLabel } from './thumbnail-ui'

function pickImage(onPicked: (dataUrl: string) => void) {
  const input = document.createElement('input')
  input.type = 'file'
  input.accept = 'image/*'
  input.onchange = () => {
    const file = input.files?.[0]
    if (!file) return
    const reader = new FileReader()
    reader.onload = () => onPicked(reader.result as string)
    reader.readAsDataURL(file)
  }
  input.click()
}

function Section({ title, children }: { title: string; children: ReactNode }) {
  return (
    <div className="space-y-2">
      <h4 className={railLabel}>{title}</h4>
      {children}
    </div>
  )
}

const BG_KINDS: { id: BackgroundKind; label: string }[] = [
  { id: 'gradient', label: 'Gradient' },
  { id: 'solid', label: 'Solid' },
  { id: 'image', label: 'Image' },
]

export function ThumbnailManualPanel() {
  const {
    config,
    setBackground,
    setSubject,
    patchSubject,
    setHeadline,
    applyTemplate,
    removeSubjectBackground,
    isCuttingOut,
  } = useThumbnail()

  const { background, subject, headline } = config

  return (
    <div className="space-y-5">
      <Section title="Template">
        <div className="grid grid-cols-2 gap-1.5">
          {THUMBNAIL_TEMPLATES.map((t) => (
            <button
              key={t.id}
              onClick={() => applyTemplate(t.id)}
              className={`${railButton} h-12 text-center leading-tight ${config.templateId === t.id ? 'border-[#c99850] text-[#dbb56e]' : ''}`}
            >
              {t.label}
            </button>
          ))}
        </div>
      </Section>

      <Section title="Background">
        <div className="grid grid-cols-3 gap-1.5">
          {BG_KINDS.map((k) => (
            <button
              key={k.id}
              onClick={() => setBackground({ kind: k.id })}
              className={`${railButton} ${background.kind === k.id ? 'border-[#c99850] text-[#dbb56e]' : ''}`}
            >
              {k.label}
            </button>
          ))}
        </div>
        {background.kind === 'solid' && (
          <input
            type="color"
            value={background.color}
            onChange={(e) => setBackground({ color: e.target.value })}
            className="h-8 w-full cursor-pointer rounded-md border border-zinc-700 bg-zinc-900"
            aria-label="Background color"
          />
        )}
        {background.kind === 'gradient' && (
          <div className="flex gap-1.5">
            {[0, 1].map((i) => (
              <input
                key={i}
                type="color"
                value={background.gradient[i]}
                onChange={(e) => {
                  const next: [string, string] = [...background.gradient]
                  next[i] = e.target.value
                  setBackground({ gradient: next })
                }}
                className="h-8 flex-1 cursor-pointer rounded-md border border-zinc-700 bg-zinc-900"
                aria-label={`Gradient color ${i + 1}`}
              />
            ))}
          </div>
        )}
        {background.kind === 'image' && (
          <button onClick={() => pickImage((url) => setBackground({ imageUrl: url }))} className={`${railButton} w-full`}>
            <Upload className="h-3.5 w-3.5" /> {background.imageUrl ? 'Replace image' : 'Upload image'}
          </button>
        )}
        <ThumbnailBackgroundFxPanel />
      </Section>

      <Section title="Subject / Face">
        {!subject ? (
          <button
            onClick={() => pickImage((url) => setSubject({ url, x: 76, y: 58, scale: 46, flip: false }))}
            className={`${railButton} w-full`}
          >
            <Upload className="h-3.5 w-3.5" /> Upload photo
          </button>
        ) : (
          <div className="space-y-2">
            <div className="grid grid-cols-2 gap-1.5">
              <button onClick={removeSubjectBackground} disabled={isCuttingOut} className={railButton}>
                {isCuttingOut ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Scissors className="h-3.5 w-3.5" />}
                Cut out
              </button>
              <button onClick={() => patchSubject({ flip: !subject.flip })} className={railButton}>
                <FlipHorizontal2 className="h-3.5 w-3.5" /> Flip
              </button>
            </div>
            <label className="block text-[11px] text-zinc-500">
              Size
              <input
                type="range"
                min={15}
                max={90}
                value={subject.scale}
                onChange={(e) => patchSubject({ scale: Number(e.target.value) })}
                className="w-full accent-[#c99850]"
              />
            </label>
            <div className="grid grid-cols-2 gap-1.5">
              <button onClick={() => pickImage((url) => setSubject({ ...subject, url }))} className={railButton}>
                <Upload className="h-3.5 w-3.5" /> Replace
              </button>
              <button onClick={() => setSubject(null)} className={`${railButton} hover:border-red-500/60 hover:text-red-300`}>
                <Trash2 className="h-3.5 w-3.5" /> Remove
              </button>
            </div>
          </div>
        )}
      </Section>

      <ThumbnailSubjectFxPanel />

      <Section title="Headline">
        <textarea
          value={headline.text}
          onChange={(e) => setHeadline({ text: e.target.value })}
          rows={2}
          placeholder="Your title here"
          className="w-full resize-none rounded-md border border-zinc-700 bg-zinc-900 px-2.5 py-2 text-xs text-zinc-100 placeholder:text-zinc-600 focus:border-[#c99850]/60 focus:outline-none"
        />
        <div className="grid grid-cols-4 gap-1.5">
          {TEXT_PRESETS.map((p) => (
            <button
              key={p.id}
              onClick={() => setHeadline({ preset: p.id })}
              className={`${railButton} ${headline.preset === p.id ? 'border-[#c99850] text-[#dbb56e]' : ''}`}
            >
              {p.label}
            </button>
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
        <ThumbnailHeadlineFxPanel />
      </Section>

      <ThumbnailStickerPanel />

      <ThumbnailArrangePanel />

      <ThumbnailLogoPanel />

      <ThumbnailExportPanel />

      <ThumbnailHistoryStrip />
    </div>
  )
}
