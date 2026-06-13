"use client"

/**
 * ThumbnailExportPanel
 *
 * Export controls: PNG or size-clamped JPG (≤2 MB), an AI upscale-and-download
 * at 2K/4K, save-to-history, and clear-all.
 */

import { useState } from 'react'
import { Download, Loader2, Maximize2, Save, Trash2 } from 'lucide-react'
import { useThumbnail } from './ThumbnailProvider'
import { UPSCALE_TARGETS, type ThumbnailFormat } from './thumbnail-constants'
import { goldButton, railButton, railLabel } from './thumbnail-ui'

const FORMATS: { id: ThumbnailFormat; label: string }[] = [
  { id: 'png', label: 'PNG' },
  { id: 'jpg', label: 'JPG ≤2 MB' },
]

export function ThumbnailExportPanel() {
  const {
    exportImage,
    isExporting,
    upscaleExport,
    isUpscaling,
    saveThumbnail,
    isSavingHistory,
    reset,
  } = useThumbnail()
  const [format, setFormat] = useState<ThumbnailFormat>('png')

  const handleClearAll = () => {
    if (window.confirm('Clear this thumbnail and start over? This removes the background, photo, and headline.')) {
      reset()
    }
  }

  return (
    <div className="space-y-2 border-t border-zinc-800 pt-4">
      <h4 className={railLabel}>Export</h4>

      <div className="grid grid-cols-2 gap-1.5">
        {FORMATS.map((f) => (
          <button
            key={f.id}
            onClick={() => setFormat(f.id)}
            className={`${railButton} ${format === f.id ? 'border-[#c99850] text-[#dbb56e]' : ''}`}
          >
            {f.label}
          </button>
        ))}
      </div>

      <button onClick={() => exportImage(format)} disabled={isExporting} className={goldButton}>
        {isExporting ? <Loader2 className="h-4 w-4 animate-spin" /> : <Download className="h-4 w-4" />}
        Export {format.toUpperCase()} (1280×720)
      </button>

      <div className="grid grid-cols-2 gap-1.5">
        {UPSCALE_TARGETS.map((t) => (
          <button
            key={t}
            onClick={() => upscaleExport(t)}
            disabled={isUpscaling}
            title={`AI upscale to ${t} and download`}
            className={railButton}
          >
            {isUpscaling ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Maximize2 className="h-3.5 w-3.5" />}
            {t}
          </button>
        ))}
      </div>

      <button onClick={saveThumbnail} disabled={isSavingHistory} className={`${railButton} w-full`}>
        {isSavingHistory ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Save className="h-3.5 w-3.5" />}
        Save to history
      </button>

      <button onClick={handleClearAll} className={`${railButton} w-full hover:border-red-500/60 hover:text-red-300`}>
        <Trash2 className="h-3.5 w-3.5" /> Clear all
      </button>
    </div>
  )
}
