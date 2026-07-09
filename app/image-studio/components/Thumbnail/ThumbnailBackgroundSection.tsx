"use client"

/**
 * ThumbnailBackgroundSection
 *
 * Background source (gradient / solid / image) + its color inputs, gradient
 * angle, and the photo-adjust FX panel. Lives in the Scene view of the rail.
 */

import { Upload } from 'lucide-react'
import { useThumbnail } from './ThumbnailProvider'
import { RangeRow } from './ThumbnailControls'
import { ThumbnailBackgroundFxPanel } from './ThumbnailBackgroundFxPanel'
import { type BackgroundKind } from './thumbnail-constants'
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

const BG_KINDS: { id: BackgroundKind; label: string }[] = [
  { id: 'gradient', label: 'Gradient' },
  { id: 'solid', label: 'Solid' },
  { id: 'image', label: 'Image' },
]

export function ThumbnailBackgroundSection() {
  const { config, setBackground } = useThumbnail()
  const { background } = config

  return (
    <div className="space-y-2">
      <h4 className={railLabel}>Background</h4>
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
        <div className="space-y-1.5">
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
          <RangeRow
            label="Gradient angle"
            value={background.gradientAngle ?? 135}
            min={0}
            max={360}
            suffix="°"
            onChange={(v) => setBackground({ gradientAngle: v })}
          />
        </div>
      )}
      {background.kind === 'image' && (
        <button onClick={() => pickImage((url) => setBackground({ imageUrl: url }))} className={`${railButton} w-full`}>
          <Upload className="h-3.5 w-3.5" /> {background.imageUrl ? 'Replace image' : 'Upload image'}
        </button>
      )}
      <ThumbnailBackgroundFxPanel />
    </div>
  )
}
