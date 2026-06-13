"use client"

/**
 * ThumbnailSettingsRail
 *
 * Right-rail controls for Thumbnail mode: template, background, subject
 * (upload + one-click cutout reusing /api/remove-background), headline text
 * styling, and 1280×720 PNG export.
 */

import { type ReactNode } from 'react'
import { Download, FlipHorizontal2, Loader2, Scissors, Trash2, Upload } from 'lucide-react'
import { useThumbnail } from './ThumbnailProvider'
import { ThumbnailAiPanel } from './ThumbnailAiPanel'
import {
  TEXT_PRESETS,
  THUMBNAIL_TEMPLATES,
  type BackgroundKind,
} from './thumbnail-constants'

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
      <h4 className="text-[11px] font-semibold uppercase tracking-wide text-zinc-500">{title}</h4>
      {children}
    </div>
  )
}

const railButton =
  'flex items-center justify-center gap-1.5 rounded-md border border-zinc-700 bg-zinc-800/70 px-2 py-1.5 text-xs font-medium text-zinc-300 transition-colors hover:bg-zinc-700 hover:text-white disabled:opacity-50'

const BG_KINDS: { id: BackgroundKind; label: string }[] = [
  { id: 'gradient', label: 'Gradient' },
  { id: 'solid', label: 'Solid' },
  { id: 'image', label: 'Image' },
]

export function ThumbnailSettingsRail() {
  const {
    config,
    setBackground,
    setSubject,
    patchSubject,
    setHeadline,
    applyTemplate,
    reset,
    removeSubjectBackground,
    isCuttingOut,
    isExporting,
    exportPng,
  } = useThumbnail()

  const handleClearAll = () => {
    if (window.confirm('Clear this thumbnail and start over? This removes the background, photo, and headline.')) {
      reset()
    }
  }
  const { background, subject, headline } = config

  return (
    <div className="space-y-5 p-4">
      <ThumbnailAiPanel />

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
      </Section>

      <div className="space-y-2 border-t border-zinc-800 pt-4">
        <button
          onClick={exportPng}
          disabled={isExporting}
          className="flex w-full items-center justify-center gap-2 rounded-md bg-linear-to-r from-[#c99850] to-[#dbb56e] px-3 py-2.5 text-sm font-semibold text-black transition-opacity hover:opacity-90 disabled:opacity-50"
        >
          {isExporting ? <Loader2 className="h-4 w-4 animate-spin" /> : <Download className="h-4 w-4" />}
          Export PNG (1280×720)
        </button>
        <button
          onClick={handleClearAll}
          className={`${railButton} w-full hover:border-red-500/60 hover:text-red-300`}
        >
          <Trash2 className="h-3.5 w-3.5" /> Clear all
        </button>
      </div>
    </div>
  )
}
