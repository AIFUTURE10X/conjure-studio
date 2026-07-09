"use client"

/**
 * BgRemoverLightbox Component
 *
 * Fullscreen lightbox with before/after comparison slider.
 * Uses a draggable divider to reveal original vs processed image.
 */

import { useState, useRef, useCallback, useEffect } from 'react'
import { X, Download, GripVertical } from 'lucide-react'
import { Dialog, DialogContent } from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { toast } from 'sonner'
import { compositeBackground } from './utils/compositeBackground'

interface BgRemoverLightboxProps {
  isOpen: boolean
  onClose: () => void
  originalUrl: string
  processedUrl: string
  fileName?: string
  backgroundColor?: string | null
}

// CSS checkerboard pattern for transparency
const checkerboardStyle = {
  backgroundImage: `
    linear-gradient(45deg, #374151 25%, transparent 25%),
    linear-gradient(-45deg, #374151 25%, transparent 25%),
    linear-gradient(45deg, transparent 75%, #374151 75%),
    linear-gradient(-45deg, transparent 75%, #374151 75%)
  `,
  backgroundSize: '20px 20px',
  backgroundPosition: '0 0, 0 10px, 10px -10px, -10px 0px',
  backgroundColor: '#1f2937',
}

export function BgRemoverLightbox({
  isOpen,
  onClose,
  originalUrl,
  processedUrl,
  fileName = 'image',
  backgroundColor,
}: BgRemoverLightboxProps) {
  const [sliderPosition, setSliderPosition] = useState(50)
  const [isDragging, setIsDragging] = useState(false)
  const containerRef = useRef<HTMLDivElement>(null)

  // Handle slider drag
  const handleDrag = useCallback((clientX: number) => {
    if (!containerRef.current) return

    const rect = containerRef.current.getBoundingClientRect()
    const x = clientX - rect.left
    const percentage = Math.min(Math.max((x / rect.width) * 100, 0), 100)
    setSliderPosition(percentage)
  }, [])

  const handleMouseDown = useCallback(() => {
    setIsDragging(true)
  }, [])

  const handleMouseUp = useCallback(() => {
    setIsDragging(false)
  }, [])

  const handleMouseMove = useCallback((e: MouseEvent) => {
    if (isDragging) {
      handleDrag(e.clientX)
    }
  }, [isDragging, handleDrag])

  const handleTouchMove = useCallback((e: TouchEvent) => {
    if (isDragging && e.touches[0]) {
      handleDrag(e.touches[0].clientX)
    }
  }, [isDragging, handleDrag])

  // Add/remove event listeners
  useEffect(() => {
    if (isDragging) {
      window.addEventListener('mousemove', handleMouseMove)
      window.addEventListener('mouseup', handleMouseUp)
      window.addEventListener('touchmove', handleTouchMove)
      window.addEventListener('touchend', handleMouseUp)
    }

    return () => {
      window.removeEventListener('mousemove', handleMouseMove)
      window.removeEventListener('mouseup', handleMouseUp)
      window.removeEventListener('touchmove', handleTouchMove)
      window.removeEventListener('touchend', handleMouseUp)
    }
  }, [isDragging, handleMouseMove, handleMouseUp, handleTouchMove])

  // Keyboard navigation
  useEffect(() => {
    if (!isOpen) return

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        onClose()
      } else if (e.key === 'ArrowLeft') {
        setSliderPosition(p => Math.max(p - 5, 0))
      } else if (e.key === 'ArrowRight') {
        setSliderPosition(p => Math.min(p + 5, 100))
      }
    }

    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [isOpen, onClose])

  // Download processed image (with background color if selected)
  const handleDownload = useCallback(async () => {
    try {
      let blob: Blob

      // If background color is selected, composite it onto the image
      if (backgroundColor) {
        blob = await compositeBackground(processedUrl, backgroundColor)
      } else {
        const response = await fetch(processedUrl)
        blob = await response.blob()
      }

      const url = URL.createObjectURL(blob)
      const link = document.createElement('a')
      link.href = url
      const suffix = backgroundColor ? '-with-bg' : '-no-bg'
      link.download = `${fileName.replace(/\.[^.]+$/, '')}${suffix}.png`
      document.body.appendChild(link)
      link.click()
      document.body.removeChild(link)
      URL.revokeObjectURL(url)
      toast.success('Image downloaded!')
    } catch (err) {
      console.error('Download failed:', err)
      toast.error('Download failed')
    }
  }, [processedUrl, fileName, backgroundColor])

  // Get background style for the processed image area
  const getProcessedBgStyle = () => {
    if (backgroundColor) {
      return { backgroundColor }
    }
    return checkerboardStyle
  }

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-[95vw] max-h-[95vh] w-[95vw] h-[95vh] p-0 bg-zinc-950 border-zinc-800">
        <div className="relative w-full h-full flex flex-col">
          {/* Header */}
          <div className="flex items-center justify-between px-4 py-3 border-b border-zinc-800 bg-zinc-900/80">
            <div className="flex items-center gap-3">
              <span className="text-sm font-medium text-white">Before / After Comparison</span>
              <span className="text-xs text-zinc-500">
                Drag slider or use arrow keys
              </span>
            </div>
            <div className="flex items-center gap-2">
              <Button
                variant="ghost"
                size="sm"
                onClick={handleDownload}
                className="text-zinc-400 hover:text-white"
              >
                <Download className="w-4 h-4 mr-1.5" />
                Download
              </Button>
              <button
                onClick={onClose}
                className="p-2 rounded-lg hover:bg-zinc-800 text-zinc-400 hover:text-white transition-colors"
                aria-label="Close lightbox"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
          </div>

          {/* Comparison area */}
          <div
            ref={containerRef}
            className="flex-1 relative overflow-hidden cursor-ew-resize"
            style={getProcessedBgStyle()}
            onMouseDown={(e) => {
              handleMouseDown()
              handleDrag(e.clientX)
            }}
            onTouchStart={(e) => {
              handleMouseDown()
              if (e.touches[0]) handleDrag(e.touches[0].clientX)
            }}
          >
            {/* Processed image (full, bottom layer) */}
            <div className="absolute inset-0 flex items-center justify-center p-8">
              <img
                src={processedUrl}
                alt="Processed (background removed)"
                className="max-w-full max-h-full object-contain select-none pointer-events-none"
                draggable={false}
              />
            </div>

            {/* Original image (clipped, top layer) */}
            <div
              className="absolute inset-0 flex items-center justify-center p-8 overflow-hidden"
              style={{
                clipPath: `inset(0 ${100 - sliderPosition}% 0 0)`,
                backgroundColor: '#18181b',
              }}
            >
              <img
                src={originalUrl}
                alt="Original"
                className="max-w-full max-h-full object-contain select-none pointer-events-none"
                draggable={false}
              />
            </div>

            {/* Slider line */}
            <div
              className="absolute top-0 bottom-0 w-1 bg-white shadow-lg pointer-events-none"
              style={{ left: `${sliderPosition}%`, transform: 'translateX(-50%)' }}
            >
              {/* Slider handle */}
              <div
                className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-10 h-10 rounded-full bg-white shadow-xl flex items-center justify-center cursor-ew-resize pointer-events-auto"
                onMouseDown={handleMouseDown}
                onTouchStart={handleMouseDown}
              >
                <GripVertical className="w-5 h-5 text-zinc-600" />
              </div>
            </div>

            {/* Labels */}
            <div className="absolute bottom-6 left-6 px-3 py-1.5 rounded-lg bg-black/70 text-white text-sm font-medium">
              Before
            </div>
            <div className="absolute bottom-6 right-6 px-3 py-1.5 rounded-lg bg-black/70 text-white text-sm font-medium">
              After
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}
