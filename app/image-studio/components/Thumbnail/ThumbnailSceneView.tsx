"use client"

/**
 * ThumbnailSceneView
 *
 * The rail's "Design & content" overview, shown when nothing is selected on the
 * canvas: template, one-click styles, background, and entry points for the
 * content layers (text blocks, subject, stickers, logo) plus saved history.
 * Selecting any layer (here or on the canvas) swaps the rail to its editor.
 */

import { Plus, Upload } from 'lucide-react'
import { useThumbnail } from './ThumbnailProvider'
import { ThumbnailTemplatePicker } from './ThumbnailTemplatePicker'
import { ThumbnailStylesPanel } from './ThumbnailStylesPanel'
import { ThumbnailBackgroundSection } from './ThumbnailBackgroundSection'
import { ThumbnailStickerPanel } from './ThumbnailStickerPanel'
import { ThumbnailLogoPanel } from './ThumbnailLogoPanel'
import { ThumbnailHistoryStrip } from './ThumbnailHistoryStrip'
import { SUBJECT_SELECTION_ID } from './thumbnail-constants'
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

export function ThumbnailSceneView() {
  const { config, setSelectedStickerId, addTextBlock, setSubject } = useThumbnail()
  const { headlines, subject } = config

  return (
    <div className="space-y-5">
      <ThumbnailTemplatePicker />
      <ThumbnailStylesPanel />
      <ThumbnailBackgroundSection />

      <div className="space-y-2">
        <h4 className={railLabel}>Text</h4>
        <div className="space-y-1">
          {headlines.map((b) => (
            <button
              key={b.id}
              onClick={() => setSelectedStickerId(b.id)}
              className="flex w-full items-center justify-between gap-2 rounded-md border border-zinc-700 bg-zinc-800/70 px-2.5 py-2 text-left text-xs text-zinc-200 transition-colors hover:bg-zinc-700"
            >
              <span className="truncate">{b.text || 'Empty text'}</span>
              <span className="shrink-0 text-[10px] text-zinc-500">Edit ›</span>
            </button>
          ))}
        </div>
        <button onClick={addTextBlock} className={`${railButton} w-full`}>
          <Plus className="h-3.5 w-3.5" /> Add text block
        </button>
      </div>

      <div className="space-y-2">
        <h4 className={railLabel}>Subject / Face</h4>
        {subject ? (
          <button
            onClick={() => setSelectedStickerId(SUBJECT_SELECTION_ID)}
            className="flex w-full items-center gap-2 rounded-md border border-zinc-700 bg-zinc-800/70 p-1.5 text-left transition-colors hover:bg-zinc-700"
          >
            <img src={subject.url} alt="" className="h-9 w-9 shrink-0 rounded object-cover" />
            <span className="text-xs text-zinc-200">Edit subject</span>
            <span className="ml-auto pr-1 text-[10px] text-zinc-500">›</span>
          </button>
        ) : (
          <button
            onClick={() => pickImage((url) => setSubject({ url, x: 76, y: 58, scale: 46, flip: false }))}
            className={`${railButton} w-full`}
          >
            <Upload className="h-3.5 w-3.5" /> Upload photo
          </button>
        )}
      </div>

      <ThumbnailStickerPanel />
      <ThumbnailLogoPanel />
      <ThumbnailHistoryStrip />
    </div>
  )
}
