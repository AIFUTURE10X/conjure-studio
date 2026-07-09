"use client"

/**
 * SmartMaskChips
 *
 * Auto-selection chips for the paint-mask tools: "Select subject" runs the
 * current image through fal's background remover and turns the resulting
 * alpha channel into a mask; "Select background" uses the inverse. Both
 * hand the result to useMaskPainting's setBaseMask so it composites with
 * hand-painted strokes exactly like an imported selection.
 */

import { useState } from 'react'
import { Image as ImageIcon, Loader2, UserRound } from 'lucide-react'
import { toast } from 'sonner'
import type { MaskDims } from './MaskCanvas'

interface SmartMaskChipsProps {
  imageUrl: string
  /** Lazily read so callers don't need to mirror MaskCanvas's dims into their own state. */
  getDisplayDims: () => MaskDims | null
  onMaskReady: (mask: ImageData) => void
}

type Selecting = 'subject' | 'background' | null

const SUBJECT_ALPHA_THRESHOLD = 64

function loadImage(url: string): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const img = new Image()
    img.crossOrigin = 'anonymous'
    img.onload = () => resolve(img)
    img.onerror = () => reject(new Error('image load failed'))
    img.src = url
  })
}

async function fetchImageAsFile(imageUrl: string): Promise<File> {
  const response = await fetch(imageUrl)
  if (!response.ok) throw new Error('Could not load the image')
  const blob = await response.blob()
  return new File([blob], 'source.png', { type: blob.type || 'image/png' })
}

/** Alpha-only mask: fully opaque where the cutout kept the subject, transparent elsewhere (or inverted). */
function maskFromCutout(cutout: HTMLImageElement, width: number, height: number, invert: boolean): ImageData {
  const canvas = document.createElement('canvas')
  canvas.width = width
  canvas.height = height
  const ctx = canvas.getContext('2d')!
  ctx.drawImage(cutout, 0, 0, width, height)
  const source = ctx.getImageData(0, 0, width, height)

  const mask = new ImageData(width, height)
  for (let i = 3; i < source.data.length; i += 4) {
    const isSubject = source.data[i] > SUBJECT_ALPHA_THRESHOLD
    mask.data[i] = (invert ? !isSubject : isSubject) ? 255 : 0
  }
  return mask
}

const chipClass =
  'flex items-center justify-center gap-1.5 rounded-md border border-zinc-700 bg-zinc-800/70 px-3 py-2 text-xs font-medium text-zinc-300 transition-colors hover:bg-zinc-700 disabled:cursor-not-allowed disabled:opacity-50'

export function SmartMaskChips({ imageUrl, getDisplayDims, onMaskReady }: SmartMaskChipsProps) {
  const [selecting, setSelecting] = useState<Selecting>(null)

  const runSelect = async (target: 'subject' | 'background') => {
    if (selecting) return
    const dims = getDisplayDims()
    if (!dims) {
      toast.error('Could not detect the subject')
      return
    }
    setSelecting(target)
    try {
      const formData = new FormData()
      formData.append('image', await fetchImageAsFile(imageUrl))
      formData.append('bgRemovalMethod', 'fal')

      const response = await fetch('/api/remove-background', { method: 'POST', body: formData })
      const data = await response.json()
      if (!response.ok || !data.image) {
        throw new Error(data.error || 'Background removal failed')
      }

      const cutout = await loadImage(data.image)
      // Built at natural (not display) resolution — both consumers
      // (useMaskPainting's redraw/buildMaskBlob) already drawImage-scale
      // whichever resolution they're handed, so painting at the source's
      // actual pixel size avoids a lossy upscale of the mask edges later.
      onMaskReady(maskFromCutout(cutout, dims.nw, dims.nh, target === 'background'))
    } catch (error) {
      console.error('[SmartMaskChips] selection failed:', error)
      toast.error(error instanceof Error ? error.message : 'Could not detect the subject')
    } finally {
      setSelecting(null)
    }
  }

  return (
    <div className="flex gap-1.5">
      <button
        onClick={() => void runSelect('subject')}
        disabled={!!selecting}
        title="Auto-select the main subject (1 credit)"
        className={chipClass}
      >
        {selecting === 'subject' ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <UserRound className="h-3.5 w-3.5" />}
        Select subject
      </button>
      <button
        onClick={() => void runSelect('background')}
        disabled={!!selecting}
        title="Auto-select everything behind the subject (1 credit)"
        className={chipClass}
      >
        {selecting === 'background' ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <ImageIcon className="h-3.5 w-3.5" />}
        Select background
      </button>
    </div>
  )
}
