"use client"

/**
 * BgRemoverPreview Component
 *
 * Side-by-side preview showing original vs processed image.
 * Uses checkerboard pattern to show transparency.
 * Click on completed result to open lightbox with before/after comparison.
 * Supports background color overlay for completed images.
 */

import { Loader2, ImageIcon, Maximize2 } from 'lucide-react'
import { BgColorPicker } from './BgColorPicker'

interface BgRemoverPreviewProps {
  original: string | undefined
  processed: string | null | undefined
  status: 'pending' | 'processing' | 'complete' | 'error' | undefined
  error?: string
  onOpenLightbox?: () => void
  backgroundColor?: string | null
  onBackgroundColorChange?: (color: string | null) => void
}

// CSS checkerboard pattern for transparency
const checkerboardStyle = {
  backgroundImage: `
    linear-gradient(45deg, #374151 25%, transparent 25%),
    linear-gradient(-45deg, #374151 25%, transparent 25%),
    linear-gradient(45deg, transparent 75%, #374151 75%),
    linear-gradient(-45deg, transparent 75%, #374151 75%)
  `,
  backgroundSize: '16px 16px',
  backgroundPosition: '0 0, 0 8px, 8px -8px, -8px 0px',
  backgroundColor: '#1f2937',
}

export function BgRemoverPreview({
  original,
  processed,
  status,
  error,
  onOpenLightbox,
  backgroundColor,
  onBackgroundColorChange
}: BgRemoverPreviewProps) {
  if (!original) {
    return (
      <div className="flex items-center justify-center h-64 rounded-xl bg-zinc-800/50 border border-zinc-700">
        <div className="text-center">
          <ImageIcon className="w-12 h-12 text-zinc-600 mx-auto mb-2" />
          <p className="text-sm text-zinc-500">Select an image to preview</p>
        </div>
      </div>
    )
  }

  // Get result background style - solid color or checkerboard
  const getResultBackgroundStyle = () => {
    if (backgroundColor) {
      return { backgroundColor }
    }
    return checkerboardStyle
  }

  return (
    <div className="mb-3">
      <div className="grid grid-cols-2 gap-3">
      {/* Original */}
      <div className="rounded-lg overflow-hidden border border-zinc-700">
        <div className="px-2 py-1.5 bg-zinc-800 border-b border-zinc-700">
          <span className="text-[10px] font-medium text-zinc-400 uppercase tracking-wider">
            Original
          </span>
        </div>
        <div className="p-3 bg-zinc-800/50 flex items-center justify-center min-h-[220px]">
          <img
            src={original}
            alt="Original"
            className="max-w-full max-h-[200px] object-contain rounded"
          />
        </div>
      </div>

        {/* Result */}
        <div className="rounded-lg overflow-hidden border border-zinc-700">
          <div className="px-2 py-1.5 bg-zinc-800 border-b border-zinc-700">
            <span className="text-[10px] font-medium text-zinc-400 uppercase tracking-wider">
              Result
            </span>
          </div>
          <div
            className="p-3 flex items-center justify-center min-h-[220px]"
            style={getResultBackgroundStyle()}
          >
          {status === 'pending' && (
            <div className="text-center">
              <div className="w-10 h-10 rounded-full bg-zinc-700/80 flex items-center justify-center mx-auto mb-1.5">
                <ImageIcon className="w-5 h-5 text-zinc-400" />
              </div>
              <p className="text-xs text-zinc-400">Click &quot;Remove Background&quot;</p>
            </div>
          )}

          {status === 'processing' && (
            <div className="text-center">
              <Loader2 className="w-8 h-8 text-[#dbb56e] animate-spin mx-auto mb-1.5" />
              <p className="text-xs text-zinc-300">Removing background...</p>
            </div>
          )}

          {status === 'complete' && processed && (
            <div className="relative group">
              <img
                src={processed}
                alt="Result"
                className="max-w-full max-h-[200px] object-contain rounded cursor-pointer"
                onClick={onOpenLightbox}
              />
              {/* Fullscreen overlay button */}
              {onOpenLightbox && (
                <button
                  onClick={onOpenLightbox}
                  className="absolute inset-0 flex items-center justify-center bg-black/0 group-hover:bg-black/40 transition-colors rounded"
                  title="View fullscreen comparison"
                >
                  <div className="opacity-0 group-hover:opacity-100 transition-opacity bg-black/70 rounded-full p-3">
                    <Maximize2 className="w-6 h-6 text-white" />
                  </div>
                </button>
              )}
            </div>
          )}

          {status === 'error' && (
            <div className="text-center">
              <div className="w-10 h-10 rounded-full bg-red-500/20 flex items-center justify-center mx-auto mb-1.5">
                <span className="text-lg">⚠️</span>
              </div>
              <p className="text-xs text-red-400">{error || 'Processing failed'}</p>
            </div>
          )}
          </div>
        </div>
      </div>

      {/* Color picker - only show when background is removed */}
      {status === 'complete' && processed && onBackgroundColorChange && (
        <BgColorPicker
          selectedColor={backgroundColor ?? null}
          onColorChange={onBackgroundColorChange}
        />
      )}
    </div>
  )
}
