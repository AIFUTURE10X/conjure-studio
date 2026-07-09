"use client"

/**
 * BgRemoverControls Component
 *
 * Process buttons and download actions for background removal.
 * Supports batch processing and ZIP download.
 */

import { useState } from 'react'
import { Loader2, Download, Trash2, Eraser } from 'lucide-react'
import JSZip from 'jszip'
import { compositeBackground } from './utils/compositeBackground'

interface BgRemoverControlsProps {
  onProcessSelected: () => void
  onProcessAll: () => void
  onClearQueue: () => void
  selectedItem: { processedUrl: string | null; fileName: string; status: string } | undefined
  pendingCount: number
  completeCount: number
  completeItems: { processedUrl: string | null; fileName: string }[]
  isProcessing: boolean
  isProcessingAll: boolean
  backgroundColor?: string | null
}

export function BgRemoverControls({
  onProcessSelected,
  onProcessAll,
  onClearQueue,
  selectedItem,
  pendingCount,
  completeCount,
  completeItems,
  isProcessing,
  isProcessingAll,
  backgroundColor,
}: BgRemoverControlsProps) {
  const [isDownloadingZip, setIsDownloadingZip] = useState(false)

  const canProcessSelected = selectedItem && selectedItem.status === 'pending' && !isProcessing
  const canProcessAll = pendingCount > 0 && !isProcessingAll
  const canDownloadSelected = selectedItem?.processedUrl
  const canDownloadAll = completeCount > 0

  // Download single image (with background color if selected)
  const handleDownloadSelected = async () => {
    if (!selectedItem?.processedUrl) return

    try {
      let blob: Blob

      // If background color is selected, composite it onto the image
      if (backgroundColor) {
        blob = await compositeBackground(selectedItem.processedUrl, backgroundColor)
      } else {
        // Fetch the original transparent image
        const response = await fetch(selectedItem.processedUrl)
        blob = await response.blob()
      }

      const url = URL.createObjectURL(blob)
      const link = document.createElement('a')
      link.href = url
      const baseName = selectedItem.fileName.replace(/\.[^.]+$/, '')
      const suffix = backgroundColor ? '_with_bg' : '_no_bg'
      link.download = `${baseName}${suffix}.png`
      document.body.appendChild(link)
      link.click()
      document.body.removeChild(link)
      URL.revokeObjectURL(url)
    } catch (error) {
      console.error('Failed to download image:', error)
    }
  }

  // Download all as ZIP (with background color if selected)
  const handleDownloadAll = async () => {
    if (completeItems.length === 0) return

    setIsDownloadingZip(true)
    try {
      const zip = new JSZip()
      const suffix = backgroundColor ? '_with_bg' : '_no_bg'

      await Promise.all(
        completeItems.map(async (item) => {
          if (!item.processedUrl) return

          let blob: Blob

          // If background color is selected, composite it onto the image
          if (backgroundColor) {
            blob = await compositeBackground(item.processedUrl, backgroundColor)
          } else {
            const response = await fetch(item.processedUrl)
            blob = await response.blob()
          }

          const baseName = item.fileName.replace(/\.[^.]+$/, '')
          zip.file(`${baseName}${suffix}.png`, blob)
        })
      )

      const content = await zip.generateAsync({ type: 'blob' })
      const url = URL.createObjectURL(content)
      const link = document.createElement('a')
      link.href = url
      link.download = `background_removed_${Date.now()}.zip`
      link.click()
      URL.revokeObjectURL(url)
    } catch (error) {
      console.error('Failed to create ZIP:', error)
    } finally {
      setIsDownloadingZip(false)
    }
  }

  return (
    <div className="space-y-4">
      {/* Action buttons */}
      <div className="flex flex-wrap gap-2">
        {/* Process selected */}
        <button
          onClick={onProcessSelected}
          disabled={!canProcessSelected}
          className={`
            flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium
            transition-all
            ${canProcessSelected
              ? 'bg-gradient-to-r from-[#c99850] to-[#dbb56e] text-black hover:opacity-90'
              : 'bg-zinc-700 text-zinc-400 cursor-not-allowed'
            }
          `}
        >
          {isProcessing ? (
            <Loader2 className="w-4 h-4 animate-spin" />
          ) : (
            <Eraser className="w-4 h-4" />
          )}
          Remove Background
        </button>

        {/* Process all */}
        {pendingCount > 1 && (
          <button
            onClick={onProcessAll}
            disabled={!canProcessAll}
            className={`
              flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium
              transition-all border
              ${canProcessAll
                ? 'border-[#c99850] text-[#dbb56e] hover:bg-[#c99850]/10'
                : 'border-zinc-700 text-zinc-500 cursor-not-allowed'
              }
            `}
          >
            {isProcessingAll ? (
              <Loader2 className="w-4 h-4 animate-spin" />
            ) : (
              <Eraser className="w-4 h-4" />
            )}
            Remove All ({pendingCount})
          </button>
        )}

        {/* Download selected */}
        {canDownloadSelected && (
          <button
            onClick={handleDownloadSelected}
            className="flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium bg-green-600 hover:bg-green-500 text-white transition-all"
          >
            <Download className="w-4 h-4" />
            Download
          </button>
        )}

        {/* Download all as ZIP */}
        {canDownloadAll && completeCount > 1 && (
          <button
            onClick={handleDownloadAll}
            disabled={isDownloadingZip}
            className="flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium bg-zinc-700 hover:bg-zinc-600 text-white transition-all"
          >
            {isDownloadingZip ? (
              <Loader2 className="w-4 h-4 animate-spin" />
            ) : (
              <Download className="w-4 h-4" />
            )}
            Download All ({completeCount})
          </button>
        )}

        {/* Clear queue */}
        <button
          onClick={onClearQueue}
          className="flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium bg-zinc-800 hover:bg-red-600/20 text-zinc-400 hover:text-red-400 border border-zinc-700 hover:border-red-600/50 transition-all ml-auto"
        >
          <Trash2 className="w-4 h-4" />
          Clear Queue
        </button>
      </div>
    </div>
  )
}
