"use client"

import { useState, useEffect } from 'react'
import { X, Download, Eye, EyeOff } from 'lucide-react'
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

  // Handle Esc key to close
  useEffect(() => {
    if (!isOpen) return

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose()
    }

    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [isOpen, onClose])

  if (!isOpen) return null

  const handleDownload = async () => {
    try {
      // Use utility function - see EXPORT_FIX_REFERENCE.md for why this pattern is needed
      await downloadImageAsFile(logoUrl, 'logo.png')
    } catch (err) {
      console.error('[Lightbox] Download failed:', err)
    }
  }

  return (
    <div
      className="fixed inset-0 z-100 flex items-center justify-center bg-black/95 backdrop-blur-md"
      onClick={(e) => e.target === e.currentTarget && onClose()}
    >
      {/* Close Button */}
      <button
        onClick={onClose}
        className="absolute top-4 right-4 z-10 p-3 rounded-full bg-zinc-800/80 text-white hover:bg-red-500/80 transition-colors"
        title="Close (Esc)"
      >
        <X className="w-6 h-6" />
      </button>

      {/* Main Content */}
      <div className="flex flex-col items-center gap-6 max-w-[95vw] max-h-[95vh]">
        {/* Logo Display - Large (zoomable / pannable) */}
        <div
          ref={containerRef}
          className="relative rounded-2xl overflow-hidden border border-zinc-700/50 p-4"
          style={{
            ...(background === 'transparent' ? transparencyGridStyle : {}),
            backgroundColor: background === 'white' ? '#ffffff' : background === 'black' ? '#000000' : undefined,
            background: background === 'gradient' ? 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)' : undefined,
            maxWidth: '94vw',
            maxHeight: '90vh',
          }}
        >
          <img
            src={showOriginal && hasOriginal ? originalUrl : logoUrl}
            alt="Generated logo full size"
            className="max-w-full max-h-[85vh] object-contain select-none"
            draggable={false}
            onMouseDown={onMouseDown}
            onDoubleClick={onDoubleClick}
            style={{
              minWidth: '820px',
              minHeight: '560px',
              ...logoFilter,
              transform,
              transition,
              cursor,
            }}
          />
        </div>

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

        {/* Zoom Controls */}
        <ZoomControls state={controls} />

        {/* Controls */}
        <div className="flex items-center gap-4 bg-zinc-800/60 rounded-full px-4 py-2">
          <button
            onClick={onClose}
            className="p-2 rounded-full bg-zinc-700 text-zinc-400 hover:text-white hover:bg-red-500/80 transition-colors"
            title="Close"
          >
            <X className="w-5 h-5" />
          </button>

          <div className="w-px h-6 bg-zinc-600" />

          {/* Before/After Toggle - only shows if BG was removed */}
          {hasOriginal && (
            <>
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
              <div className="w-px h-6 bg-zinc-600" />
            </>
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
  )
}
