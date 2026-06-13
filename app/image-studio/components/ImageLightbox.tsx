"use client"

import { useEffect } from 'react'
import { X, ChevronLeft, ChevronRight, Download } from 'lucide-react'
import { Dialog, DialogContent } from '@/components/ui/dialog'
import { useImageZoom } from '../hooks/useImageZoom'
import { ZoomControls } from './ZoomControls'

interface ImageLightboxProps {
  isOpen: boolean
  images: Array<{ url: string; prompt?: string }>
  currentIndex: number
  onClose: () => void
  onNavigate: (direction: 'prev' | 'next') => void
  onDownload?: () => void
}

export function ImageLightbox({
  isOpen,
  images,
  currentIndex,
  onClose,
  onNavigate,
  onDownload
}: ImageLightboxProps) {
  const {
    containerRef,
    onMouseDown,
    onDoubleClick,
    transform,
    transition,
    cursor,
    controls,
  } = useImageZoom({ isActive: isOpen, resetKey: currentIndex })

  // Keyboard navigation
  useEffect(() => {
    if (!isOpen) return

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        onClose()
      } else if (e.key === 'ArrowLeft') {
        onNavigate('prev')
      } else if (e.key === 'ArrowRight') {
        onNavigate('next')
      }
    }

    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [isOpen, onClose, onNavigate])

  const currentImage = images[currentIndex]

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-[90vw]! max-h-[90vh]! w-[90vw] h-[90vh] p-0 bg-black border-zinc-800 overflow-hidden">
        <div className="relative w-full h-full flex flex-col">
          {/* Close button */}
          <button
            onClick={onClose}
            className="absolute top-4 right-4 z-50 p-2 rounded-full bg-black/50 hover:bg-black/70 text-white transition-colors"
            aria-label="Close lightbox"
          >
            <X className="w-6 h-6" />
          </button>

          {/* Download button */}
          {onDownload && (
            <button
              onClick={onDownload}
              className="absolute top-4 right-16 z-50 p-2 rounded-full bg-black/50 hover:bg-black/70 text-white transition-colors"
              aria-label="Download image"
            >
              <Download className="w-6 h-6" />
            </button>
          )}

          {/* Previous button */}
          {images.length > 1 && (
            <button
              onClick={() => onNavigate('prev')}
              className="absolute left-4 top-1/2 -translate-y-1/2 z-50 p-3 rounded-full bg-black/50 hover:bg-black/70 text-white transition-colors"
              aria-label="Previous image"
            >
              <ChevronLeft className="w-8 h-8" />
            </button>
          )}

          {/* Next button */}
          {images.length > 1 && (
            <button
              onClick={() => onNavigate('next')}
              className="absolute right-4 top-1/2 -translate-y-1/2 z-50 p-3 rounded-full bg-black/50 hover:bg-black/70 text-white transition-colors"
              aria-label="Next image"
            >
              <ChevronRight className="w-8 h-8" />
            </button>
          )}

          {/* Zoomable / pannable image area */}
          <div
            ref={containerRef}
            className="flex-1 min-h-0 flex items-center justify-center overflow-hidden px-16 pt-12"
          >
            <img
              src={currentImage?.url || '/placeholder.svg'}
              alt={currentImage?.prompt || `Image ${currentIndex + 1}`}
              className="max-w-full max-h-full object-contain select-none"
              draggable={false}
              onMouseDown={onMouseDown}
              onDoubleClick={onDoubleClick}
              style={{ transform, transition, cursor }}
            />
          </div>

          {/* Bottom bar: caption + zoom controls + counter */}
          <div className="shrink-0 flex flex-col items-center gap-2 px-4 pb-4 pt-2">
            {currentImage?.prompt && (
              <p className="max-w-3xl text-center text-sm text-zinc-400 line-clamp-2">
                {currentImage.prompt}
              </p>
            )}
            <div className="flex items-center gap-3">
              <ZoomControls state={controls} />
              {images.length > 1 && (
                <div className="px-3 py-1.5 rounded-full bg-zinc-800/80 text-white text-sm">
                  {currentIndex + 1} / {images.length}
                </div>
              )}
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}
