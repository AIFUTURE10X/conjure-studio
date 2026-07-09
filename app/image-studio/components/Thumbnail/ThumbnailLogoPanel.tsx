"use client"

/**
 * ThumbnailLogoPanel
 *
 * Channel logo / watermark layer. Upload a logo, or drop one in from Logo mode
 * (pulled from the shared logo history). Either way it becomes a draggable
 * image sticker, so size / rotate / delete reuse the sticker controls.
 */

import { useEffect, useState } from 'react'
import { Loader2, Upload } from 'lucide-react'
import { toast } from 'sonner'
import { getUserId } from '@/lib/user-id'
import { useThumbnail } from './ThumbnailProvider'
import { toDataUrl } from './thumbnail-utils'
import { THUMBNAIL_HISTORY_STYLE } from './thumbnail-constants'
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

interface RecentLogo {
  id: string
  url: string
}

export function ThumbnailLogoPanel() {
  const { addImageSticker } = useThumbnail()
  const [logos, setLogos] = useState<RecentLogo[]>([])
  const [loadingId, setLoadingId] = useState<string | null>(null)

  useEffect(() => {
    let cancelled = false
    ;(async () => {
      try {
        const userId = getUserId()
        const res = await fetch(`/api/logo-history?userId=${encodeURIComponent(userId)}`)
        if (!res.ok) return
        const data = (await res.json()) as { history?: { id: string; imageUrl: string; style?: string }[] }
        const recent = (data.history || [])
          .filter((i) => i.style !== THUMBNAIL_HISTORY_STYLE && i.imageUrl)
          .slice(0, 6)
          .map((i) => ({ id: i.id, url: i.imageUrl }))
        if (!cancelled) setLogos(recent)
      } catch {
        // best-effort — the upload button still works
      }
    })()
    return () => {
      cancelled = true
    }
  }, [])

  const addWatermark = async (logo: RecentLogo) => {
    setLoadingId(logo.id)
    try {
      // Inline as a data URL so cross-origin blobs don't taint the export canvas.
      addImageSticker(await toDataUrl(logo.url))
    } catch {
      toast.error('Could not load that logo')
    } finally {
      setLoadingId(null)
    }
  }

  return (
    <div className="space-y-2">
      <h4 className={railLabel}>Logo / Watermark</h4>
      <button onClick={() => pickImage((url) => addImageSticker(url))} className={`${railButton} w-full`}>
        <Upload className="h-3.5 w-3.5" /> Upload logo
      </button>

      {logos.length > 0 && (
        <>
          <p className="text-[10px] text-zinc-600">Or drop in a logo from Logo mode:</p>
          <div className="grid grid-cols-6 gap-1.5">
            {logos.map((logo) => (
              <button
                key={logo.id}
                onClick={() => addWatermark(logo)}
                disabled={loadingId === logo.id}
                title="Add as watermark"
                className="relative flex aspect-square items-center justify-center overflow-hidden rounded-md border border-zinc-700 bg-zinc-900 transition-colors hover:border-[#c99850]/60 disabled:opacity-50"
              >
                {loadingId === logo.id ? (
                  <Loader2 className="h-3.5 w-3.5 animate-spin text-zinc-400" />
                ) : (
                  <img src={logo.url} alt="" className="h-full w-full object-contain" />
                )}
              </button>
            ))}
          </div>
        </>
      )}

      <p className="text-[10px] leading-snug text-zinc-500">
        Added as a draggable layer — select it to resize, rotate, or delete in Stickers.
      </p>
    </div>
  )
}
