"use client"

import { useState, useRef, useCallback } from 'react'
import { ZoomIn, ZoomOut, Move, RotateCcw } from 'lucide-react'

interface EmailSignatureMockupProps {
  logoUrl: string
  brandName?: string
  darkMode?: boolean
  logoFilter?: React.CSSProperties
}

export function EmailSignatureMockup({ logoUrl, brandName = 'Brand', darkMode = true, logoFilter }: EmailSignatureMockupProps) {
  const [logoScale, setLogoScale] = useState(1)
  const [logoPosition, setLogoPosition] = useState({ x: 0, y: 0 })
  const [isDragging, setIsDragging] = useState(false)
  const dragStartRef = useRef({ x: 0, y: 0, startX: 0, startY: 0 })

  const handleMouseDown = useCallback((e: React.MouseEvent) => {
    e.preventDefault()
    setIsDragging(true)
    dragStartRef.current = {
      x: e.clientX,
      y: e.clientY,
      startX: logoPosition.x,
      startY: logoPosition.y
    }
  }, [logoPosition])

  const handleMouseMove = useCallback((e: React.MouseEvent) => {
    if (!isDragging) return
    const dx = e.clientX - dragStartRef.current.x
    const dy = e.clientY - dragStartRef.current.y
    setLogoPosition({
      x: dragStartRef.current.startX + dx,
      y: dragStartRef.current.startY + dy
    })
  }, [isDragging])

  const handleMouseUp = useCallback(() => {
    setIsDragging(false)
  }, [])

  const handleReset = () => {
    setLogoScale(1)
    setLogoPosition({ x: 0, y: 0 })
  }

  return (
    <div
      className="relative"
      onMouseMove={handleMouseMove}
      onMouseUp={handleMouseUp}
      onMouseLeave={handleMouseUp}
    >
      {/* Email Container */}
      <div
        className={`rounded-xl overflow-hidden border ${
          darkMode ? 'border-zinc-700 bg-zinc-900' : 'border-gray-200 bg-white'
        }`}
        style={{ aspectRatio: '4 / 3' }}
      >
        {/* Email Header */}
        <div
          className={`px-4 py-3 border-b ${
            darkMode ? 'bg-zinc-800 border-zinc-700' : 'bg-gray-50 border-gray-200'
          }`}
        >
          <div className="flex items-center gap-2 mb-2">
            <span className={`text-xs ${darkMode ? 'text-zinc-500' : 'text-gray-500'}`}>To:</span>
            <span className={`text-xs ${darkMode ? 'text-zinc-300' : 'text-gray-700'}`}>client@example.com</span>
          </div>
          <div className="flex items-center gap-2">
            <span className={`text-xs ${darkMode ? 'text-zinc-500' : 'text-gray-500'}`}>Subject:</span>
            <span className={`text-xs ${darkMode ? 'text-zinc-300' : 'text-gray-700'}`}>Re: Project Update</span>
          </div>
        </div>

        {/* Email Body */}
        <div className={`p-4 ${darkMode ? 'bg-zinc-900' : 'bg-white'}`}>
          {/* Email Content Placeholder */}
          <div className="space-y-2 mb-6">
            <div className={`h-3 w-3/4 rounded ${darkMode ? 'bg-zinc-800' : 'bg-gray-100'}`} />
            <div className={`h-3 w-full rounded ${darkMode ? 'bg-zinc-800' : 'bg-gray-100'}`} />
            <div className={`h-3 w-5/6 rounded ${darkMode ? 'bg-zinc-800' : 'bg-gray-100'}`} />
            <div className={`h-3 w-2/3 rounded ${darkMode ? 'bg-zinc-800' : 'bg-gray-100'}`} />
          </div>

          {/* Signature Divider */}
          <div className={`border-t ${darkMode ? 'border-zinc-700' : 'border-gray-200'} pt-4`}>
            {/* Signature Block */}
            <div className="flex gap-4">
              {/* Draggable Logo */}
              <div
                className={`w-24 h-24 shrink-0 flex items-center justify-center overflow-hidden ${isDragging ? 'cursor-grabbing' : 'cursor-grab'}`}
                onMouseDown={handleMouseDown}
              >
                <img
                  src={logoUrl}
                  alt={brandName}
                  className={`max-w-full max-h-full object-contain transition-transform pointer-events-none ${isDragging ? 'scale-105' : ''}`}
                  style={{ transform: `translate(${logoPosition.x}px, ${logoPosition.y}px) scale(${logoScale})`, ...logoFilter }}
                  draggable={false}
                />
                {!isDragging && (
                  <div className="absolute opacity-0 hover:opacity-100 transition-opacity">
                    <Move className="w-4 h-4 text-zinc-500" />
                  </div>
                )}
              </div>

              {/* Contact Info */}
              <div className="flex-1">
                <div className={`font-semibold text-sm ${darkMode ? 'text-white' : 'text-gray-900'}`}>
                  John Smith
                </div>
                <div className={`text-xs ${darkMode ? 'text-purple-400' : 'text-purple-600'}`}>
                  Creative Director
                </div>
                <div className={`text-xs mt-2 ${darkMode ? 'text-zinc-400' : 'text-gray-600'}`}>
                  {brandName}
                </div>
                <div className={`text-xs ${darkMode ? 'text-zinc-500' : 'text-gray-500'} mt-1`}>
                  <div>hello@{brandName.toLowerCase().replace(/\s+/g, '')}.com</div>
                  <div>+1 (555) 123-4567</div>
                </div>

                {/* Social Icons */}
                <div className="flex gap-2 mt-3">
                  {['linkedin', 'twitter', 'instagram'].map((social) => (
                    <div
                      key={social}
                      className={`w-5 h-5 rounded flex items-center justify-center ${
                        darkMode ? 'bg-zinc-700' : 'bg-gray-200'
                      }`}
                    >
                      <div className={`w-2.5 h-2.5 rounded-sm ${
                        darkMode ? 'bg-zinc-500' : 'bg-gray-400'
                      }`} />
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Shadow Effect */}
      <div
        className="absolute -bottom-4 left-1/2 -translate-x-1/2 w-4/5 h-6 rounded-full opacity-25"
        style={{
          background: 'radial-gradient(ellipse, rgba(0,0,0,0.4) 0%, transparent 70%)',
        }}
      />

      {/* Logo Controls */}
      <div className="absolute top-12 right-2 flex items-center gap-1 bg-zinc-900/80 rounded-lg px-2 py-1 z-10">
        <button
          onClick={handleReset}
          className="p-1 text-zinc-400 hover:text-white transition-colors"
          title="Reset position and size"
        >
          <RotateCcw className="w-3.5 h-3.5" />
        </button>
        <div className="w-px h-4 bg-zinc-700" />
        <button
          onClick={() => setLogoScale(s => Math.max(0.3, s - 0.1))}
          className="p-1 text-zinc-400 hover:text-white transition-colors"
          title="Shrink logo"
        >
          <ZoomOut className="w-3.5 h-3.5" />
        </button>
        <span className="text-[10px] text-zinc-400 min-w-8 text-center">
          {Math.round(logoScale * 100)}%
        </span>
        <button
          onClick={() => setLogoScale(s => Math.min(2.5, s + 0.1))}
          className="p-1 text-zinc-400 hover:text-white transition-colors"
          title="Enlarge logo"
        >
          <ZoomIn className="w-3.5 h-3.5" />
        </button>
      </div>
    </div>
  )
}
