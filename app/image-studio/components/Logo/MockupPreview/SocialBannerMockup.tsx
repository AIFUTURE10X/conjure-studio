"use client"

import { useState, useRef, useCallback } from 'react'
import { ZoomIn, ZoomOut, Move, RotateCcw } from 'lucide-react'

interface SocialBannerMockupProps {
  logoUrl: string
  brandName?: string
  darkMode?: boolean
  logoFilter?: React.CSSProperties
}

export function SocialBannerMockup({ logoUrl, brandName = 'Brand', darkMode = true, logoFilter }: SocialBannerMockupProps) {
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

  const bgColor = darkMode ? 'bg-zinc-800' : 'bg-gray-100'
  const textColor = darkMode ? 'text-zinc-400' : 'text-gray-500'
  const borderColor = darkMode ? 'border-zinc-700' : 'border-gray-200'
  const imgStyle = { transform: `translate(${logoPosition.x}px, ${logoPosition.y}px) scale(${logoScale})`, ...logoFilter }

  return (
    <div
      className="relative space-y-4"
      onMouseMove={handleMouseMove}
      onMouseUp={handleMouseUp}
      onMouseLeave={handleMouseUp}
    >
      {/* Facebook Cover */}
      <div className="relative">
        <div className={`text-[10px] ${textColor} mb-1 flex items-center gap-1`}>
          <svg className="w-3 h-3" viewBox="0 0 24 24" fill="currentColor">
            <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z"/>
          </svg>
          Facebook Cover
        </div>
        <div
          className={`relative rounded-lg overflow-hidden border ${borderColor}`}
          style={{ aspectRatio: '820 / 312' }}
        >
          <div
            className={`absolute inset-0 ${bgColor}`}
            style={{
              background: darkMode
                ? 'linear-gradient(135deg, #1e3a5f 0%, #0f172a 50%, #1e1b4b 100%)'
                : 'linear-gradient(135deg, #e0f2fe 0%, #f8fafc 50%, #f3e8ff 100%)',
            }}
          />
          <div className="absolute inset-0 flex items-center justify-center gap-4 px-8">
            <div
              className={`relative w-32 h-32 flex items-center justify-center ${isDragging ? 'cursor-grabbing' : 'cursor-grab'}`}
              onMouseDown={handleMouseDown}
            >
              <img src={logoUrl} alt={brandName} className={`max-w-full max-h-full object-contain transition-transform pointer-events-none ${isDragging ? 'scale-105' : ''}`} style={imgStyle} draggable={false} />
              {!isDragging && (
                <div className="absolute inset-0 flex items-center justify-center opacity-0 hover:opacity-100 transition-opacity">
                  <Move className="w-4 h-4 text-white/50" />
                </div>
              )}
            </div>
            <div className={`text-xl font-bold ${darkMode ? 'text-white' : 'text-gray-800'}`}>
              {brandName}
            </div>
          </div>
        </div>
      </div>

      {/* Twitter/X Header */}
      <div className="relative">
        <div className={`text-[10px] ${textColor} mb-1 flex items-center gap-1`}>
          <svg className="w-3 h-3" viewBox="0 0 24 24" fill="currentColor">
            <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z"/>
          </svg>
          Twitter/X Header
        </div>
        <div
          className={`relative rounded-lg overflow-hidden border ${borderColor}`}
          style={{ aspectRatio: '1500 / 500' }}
        >
          <div
            className={`absolute inset-0 ${bgColor}`}
            style={{
              background: darkMode
                ? 'linear-gradient(90deg, #0f172a 0%, #1e293b 50%, #0f172a 100%)'
                : 'linear-gradient(90deg, #f1f5f9 0%, #ffffff 50%, #f1f5f9 100%)',
            }}
          />
          <div className="absolute inset-0 flex items-center justify-center gap-3 px-6">
            <div
              className={`relative w-24 h-24 flex items-center justify-center ${isDragging ? 'cursor-grabbing' : 'cursor-grab'}`}
              onMouseDown={handleMouseDown}
            >
              <img src={logoUrl} alt={brandName} className={`max-w-full max-h-full object-contain transition-transform pointer-events-none ${isDragging ? 'scale-105' : ''}`} style={imgStyle} draggable={false} />
            </div>
            <div className={`text-lg font-semibold ${darkMode ? 'text-white' : 'text-gray-800'}`}>
              {brandName}
            </div>
          </div>
        </div>
      </div>

      {/* LinkedIn Banner */}
      <div className="relative">
        <div className={`text-[10px] ${textColor} mb-1 flex items-center gap-1`}>
          <svg className="w-3 h-3" viewBox="0 0 24 24" fill="currentColor">
            <path d="M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433c-1.144 0-2.063-.926-2.063-2.065 0-1.138.92-2.063 2.063-2.063 1.14 0 2.064.925 2.064 2.063 0 1.139-.925 2.065-2.064 2.065zm1.782 13.019H3.555V9h3.564v11.452zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.222 0h.003z"/>
          </svg>
          LinkedIn Banner
        </div>
        <div
          className={`relative rounded-lg overflow-hidden border ${borderColor}`}
          style={{ aspectRatio: '1584 / 396' }}
        >
          <div
            className={`absolute inset-0 ${bgColor}`}
            style={{
              background: darkMode
                ? 'linear-gradient(135deg, #0a4275 0%, #0f172a 100%)'
                : 'linear-gradient(135deg, #dbeafe 0%, #f8fafc 100%)',
            }}
          />
          <div className="absolute inset-0 flex items-center px-8 gap-4">
            <div
              className={`relative w-28 h-28 flex items-center justify-center ${isDragging ? 'cursor-grabbing' : 'cursor-grab'}`}
              onMouseDown={handleMouseDown}
            >
              <img src={logoUrl} alt={brandName} className={`max-w-full max-h-full object-contain transition-transform pointer-events-none ${isDragging ? 'scale-105' : ''}`} style={imgStyle} draggable={false} />
            </div>
            <div>
              <div className={`text-lg font-bold ${darkMode ? 'text-white' : 'text-gray-800'}`}>
                {brandName}
              </div>
              <div className={`text-xs ${darkMode ? 'text-blue-300' : 'text-blue-600'}`}>
                Follow us for updates
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Shadow Effect */}
      <div
        className="absolute -bottom-4 left-1/2 -translate-x-1/2 w-4/5 h-6 rounded-full opacity-20"
        style={{
          background: 'radial-gradient(ellipse, rgba(0,0,0,0.4) 0%, transparent 70%)',
        }}
      />

      {/* Logo Controls */}
      <div className="absolute top-0 right-0 flex items-center gap-1 bg-zinc-900/80 rounded-lg px-2 py-1 z-10">
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
