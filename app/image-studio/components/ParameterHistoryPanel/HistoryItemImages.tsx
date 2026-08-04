"use client"

/**
 * HistoryItemImages Component
 *
 * Image area of a history card.
 *
 * One history row holds the whole batch a generation produced (imageCount can
 * be up to 10), but the card used to render `imageUrls[0]` and reduce the rest
 * to a "+N more" badge. Every image after the first therefore looked like it
 * had never been saved — which is what kept getting reported as "history is
 * broken" even though both images were in Neon. Render all of them.
 */

import { Button } from '@/components/ui/button'
import { Download, RotateCcw, ZoomIn } from 'lucide-react'

interface HistoryItemImagesProps {
  imageUrls: string[]
  onRestore: () => void
  onDownload: (imageUrl: string, index: number) => void
  onPreview: (imageIndex: number) => void
}

/** Keep tiles roughly square: 2 across for a normal batch, 3 for a big one. */
function gridColumnsClass(count: number) {
  return count > 4 ? 'grid-cols-3' : 'grid-cols-2'
}

export function HistoryItemImages({
  imageUrls,
  onRestore,
  onDownload,
  onPreview,
}: HistoryItemImagesProps) {
  // Single image: unchanged from the original card — full-bleed preview with
  // the combined Download/Restore overlay.
  if (imageUrls.length === 1) {
    return (
      <>
        <img
          src={imageUrls[0] || "/placeholder.svg"}
          alt="Generated preview"
          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
        />
        <div
          className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-2 cursor-zoom-in"
          title="Click for larger view"
          onClick={(e) => {
            e.stopPropagation()
            onPreview(0)
          }}
        >
          <Button
            onClick={(e) => {
              e.stopPropagation()
              onDownload(imageUrls[0], 0)
            }}
            size="sm"
            className="bg-[#c99850] hover:bg-[#dbb56e] text-black"
          >
            <Download className="w-4 h-4 mr-2" />
            Download
          </Button>
          <Button
            onClick={(e) => {
              e.stopPropagation()
              onRestore()
            }}
            size="sm"
            className="bg-[#c99850] hover:bg-[#dbb56e] text-black"
          >
            <RotateCcw className="w-4 h-4 mr-2" />
            Restore
          </Button>
        </div>
      </>
    )
  }

  // Batch: every image gets its own tile, its own preview, and its own
  // download, so nothing in the generation is hidden behind a badge.
  return (
    <div className={`absolute inset-0 grid ${gridColumnsClass(imageUrls.length)} gap-0.5`}>
      {imageUrls.map((url, index) => (
        <div
          key={`${index}-${url}`}
          className="relative overflow-hidden bg-zinc-900 group/tile cursor-zoom-in"
          title={`Image ${index + 1} of ${imageUrls.length} — click for larger view`}
          onClick={(e) => {
            e.stopPropagation()
            onPreview(index)
          }}
        >
          <img
            src={url || "/placeholder.svg"}
            alt={`Generated preview ${index + 1} of ${imageUrls.length}`}
            className="w-full h-full object-cover transition-transform duration-300 group-hover/tile:scale-105"
          />
          <span className="absolute bottom-1 right-1 bg-black/70 backdrop-blur-sm text-white text-[10px] leading-none px-1.5 py-1 rounded-full pointer-events-none">
            {index + 1}/{imageUrls.length}
          </span>
          <div className="absolute inset-0 bg-black/60 opacity-0 group-hover/tile:opacity-100 transition-opacity flex items-center justify-center gap-1">
            <Button
              onClick={(e) => {
                e.stopPropagation()
                onPreview(index)
              }}
              size="icon"
              className="h-7 w-7 bg-[#c99850] hover:bg-[#dbb56e] text-black"
              title="View larger"
            >
              <ZoomIn className="w-3.5 h-3.5" />
            </Button>
            <Button
              onClick={(e) => {
                e.stopPropagation()
                onDownload(url, index)
              }}
              size="icon"
              className="h-7 w-7 bg-[#c99850] hover:bg-[#dbb56e] text-black"
              title="Download this image"
            >
              <Download className="w-3.5 h-3.5" />
            </Button>
          </div>
        </div>
      ))}
    </div>
  )
}
