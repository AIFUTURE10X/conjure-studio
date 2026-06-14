"use client"

/**
 * ThumbnailSubjectView
 *
 * Contextual editor for the selected subject/face: cut out (bg removal), flip,
 * size, replace, remove, the pop FX (shadow/outline/glow + photo adjust), and
 * alignment. Shown when the subject layer is selected.
 */

import { FlipHorizontal2, Loader2, Scissors, Trash2, Upload } from 'lucide-react'
import { useThumbnail } from './ThumbnailProvider'
import { BackHeader } from './ThumbnailControls'
import { ThumbnailSubjectFxPanel } from './ThumbnailSubjectFxPanel'
import { ThumbnailArrangePanel } from './ThumbnailArrangePanel'
import { railButton } from './thumbnail-ui'

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

export function ThumbnailSubjectView() {
  const { config, patchSubject, setSubject, setSelectedStickerId, removeSubjectBackground, isCuttingOut } =
    useThumbnail()
  const subject = config.subject
  if (!subject) return null

  return (
    <div className="space-y-3">
      <BackHeader title="Subject" onBack={() => setSelectedStickerId(null)} />

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
          <button
            onClick={() => {
              setSubject(null)
              setSelectedStickerId(null)
            }}
            className={`${railButton} hover:border-red-500/60 hover:text-red-300`}
          >
            <Trash2 className="h-3.5 w-3.5" /> Remove
          </button>
        </div>
      </div>

      <ThumbnailSubjectFxPanel />
      <ThumbnailArrangePanel />
    </div>
  )
}
