"use client"

import { useState, useEffect } from 'react'
import { X, Download, Eye, EyeOff } from 'lucide-react'
import { Dialog, DialogContent } from '@/components/ui/dialog'
import { transparencyGridStyle } from '../../constants/logo-constants'
import { downloadImageAsFile } from '../../utils/export-utils'
import { useImageZoom } from '../../hooks/useImageZoom'
import { ZoomControls } from '../ZoomControls'

// Background options for lightbox
export type LightboxBackground = 'transparent' | 'white' | 'black' | 'gradient'

interface LogoLightboxProps {
  logoUrl: string
  originalUrl?: string
  isOpen: boolean
  onClose: () => void
  initialBackground?: LightboxBackground
  logoFilter?: React.CSSProperties
}

export function LogoLightbox({
  logoUrl,
  originalUrl,
  isOpen,
  onClose,
  initialBackground = 'transparent',
  logoFilter,
}: LogoLightboxProps) {
  const [background, setBackground] = useState<LightboxBackground>(initialBackground)
  const [showOriginal, setShowOriginal] = useState(false)
  const {
    containerRef,
    onMouseDown,
    onDoubleClick,
    transform,
    transition,
    cursor,
    controls,
  } = useImageZoom({ isActive: isOpen, resetKey: showOriginal })

  // Check if we have an original (before BG removal) version
  const hasOriginal = !!originalUrl

  // Update background when initialBackground changes
  useEffect(() => {
    setBackground(initialBackground)
  }, [initialBackground])

  // Reset showOriginal when lightbox opens
  useEffect(() => {
    if (isOpen) setShowOriginal(false)
  }, [isOpen])

  const handleDownload = async () => {
    try {
      // Use utility function - see EXPORT_FIX_REFERENCE.md for why this pattern is needed
      await downloadImageAsFile(logoUrl, 'logo.png')
    } catch (err) {
      console.error('[Lightbox] Download failed:', err)
    }
  }

  // Selected background, applied to the full image area (mirrors ImageLightbox layout)
  const backgroundStyle: React.CSSProperties =
    background === 'transparent'
      ? transparencyGridStyle
      : background === 'white'
        ? { backgroundColor: '#ffffff' }
        : background === 'black'
          ? { backgroundColor: '#000000' }
          : { background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)' }

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent
        showCloseButton={false}
        className="max-w-[90vw]! max-h-[90vh]! w-[90vw] h-[90vh] p-0 bg-black border-zinc-800 overflow-hidden"
      >
        <div className="relative w-full h-full flex flex-col">
          {/* Close button */}
          <button
            onClick={onClose}
            className="absolute top-4 right-4 z-50 p-2 rounded-full bg-black/50 hover:bg-black/70 text-white transition-colors"
            aria-label="Close lightbox"
          >
            <X className="w-6 h-6" />
          </button>

          {/* Zoomable / pannable image area */}
          <div
            ref={containerRef}
            className="flex-1 min-h-0 flex items-center justify-center overflow-hidden px-16 py-12 rounded-t-lg"
            style={backgroundStyle}
          >
            <img
              src={showOriginal && hasOriginal ? originalUrl : logoUrl}
              alt="Generated logo full size"
              className="max-w-full max-h-full object-contain select-none"
              draggable={false}
              onMouseDown={onMouseDown}
              onDoubleClick={onDoubleClick}
              style={{ ...logoFilter, transform, transition, cursor }}
            />
          </div>

          {/* Bottom bar: background swatches + zoom/before-after/download + hint */}
          <div className="shrink-0 flex flex-col items-center gap-3 px-4 pb-4 pt-3 bg-black">
            {/* Background Toggle Buttons */}
            <div className="flex items-center gap-2 bg-zinc-800/60 rounded-full px-3 py-1.5">
              <span className="text-xs text-zinc-400 mr-1">Background:</span>
              <button
                onClick={() => setBackground('transparent')}
                className={`w-8 h-8 rounded-full border-2 transition-all ${background === 'transparent' ? 'border-purple-500 scale-110' : 'border-zinc-600 hover:border-zinc-400'}`}
                style={transparencyGridStyle}
                title="Transparent"
              />
              <button
                onClick={() => setBackground('white')}
                className={`w-8 h-8 rounded-full border-2 bg-white transition-all ${background === 'white' ? 'border-purple-500 scale-110' : 'border-zinc-600 hover:border-zinc-400'}`}
                title="White"
              />
              <button
                onClick={() => setBackground('black')}
                className={`w-8 h-8 rounded-full border-2 bg-black transition-all ${background === 'black' ? 'border-purple-500 scale-110' : 'border-zinc-600 hover:border-zinc-400'}`}
                title="Black"
              />
              <button
                onClick={() => setBackground('gradient')}
                className={`w-8 h-8 rounded-full border-2 transition-all ${background === 'gradient' ? 'border-purple-500 scale-110' : 'border-zinc-600 hover:border-zinc-400'}`}
                style={{ background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)' }}
                title="Gradient"
              />
            </div>

            {/* Zoom controls + Before/After toggle + Download */}
            <div className="flex items-center gap-3">
              <ZoomControls state={controls} />

              {hasOriginal && (
                <button
                  onClick={() => setShowOriginal(!showOriginal)}
                  className={`flex items-center gap-2 px-3 py-1.5 rounded-full text-sm font-medium transition-all ${
                    showOriginal
                      ? 'bg-amber-500/20 text-amber-400 border border-amber-500/30'
                      : 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30'
                  }`}
                  title={showOriginal ? 'Showing original (before BG removal)' : 'Showing processed (after BG removal)'}
                >
                  {showOriginal ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  {showOriginal ? 'Before' : 'After'}
                </button>
              )}

              <button
                onClick={handleDownload}
                className="flex items-center gap-2 px-4 py-2 rounded-full bg-linear-to-r from-purple-500 to-pink-500 text-white font-medium hover:opacity-90 transition-opacity"
              >
                <Download className="w-4 h-4" />
                Download Logo
              </button>
            </div>

            {/* Hint */}
            <p className="text-xs text-zinc-500">Scroll or +/- to zoom · drag to pan · Esc to close</p>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}
