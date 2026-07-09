"use client"

/**
 * AppIconMockup Component
 *
 * Shows logo as mobile app icon and social avatar
 */

import { useState, useRef, useCallback } from 'react'
import { ZoomIn, ZoomOut, Move, RotateCcw } from 'lucide-react'

interface AppIconMockupProps {
  logoUrl: string
  brandName?: string
  logoFilter?: React.CSSProperties
}

export function AppIconMockup({
  logoUrl,
  brandName = "Your Brand",
  logoFilter,
}: AppIconMockupProps) {
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

  const imgStyle = { transform: `translate(${logoPosition.x}px, ${logoPosition.y}px) scale(${logoScale})`, ...logoFilter }

  return (
    <div
      className="space-y-6 relative"
      onMouseMove={handleMouseMove}
      onMouseUp={handleMouseUp}
      onMouseLeave={handleMouseUp}
    >
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

      {/* iOS App Icon Style */}
      <div className="flex items-center gap-4">
        {/* Large Icon - Draggable */}
        <div className="relative">
          <div
            className={`w-28 h-28 rounded-[22%] overflow-hidden bg-linear-to-br from-zinc-800 to-zinc-900 flex items-center justify-center p-4 ${isDragging ? 'cursor-grabbing' : 'cursor-grab'}`}
            style={{
              boxShadow: '0 10px 30px -5px rgba(0,0,0,0.3), inset 0 1px 0 rgba(255,255,255,0.1)',
            }}
            onMouseDown={handleMouseDown}
          >
            <img
              src={logoUrl}
              alt="App icon preview"
              className={`max-w-full max-h-full object-contain transition-transform pointer-events-none ${isDragging ? 'scale-105' : ''}`}
              style={imgStyle}
              draggable={false}
            />
            {!isDragging && (
              <div className="absolute inset-0 flex items-center justify-center opacity-0 hover:opacity-100 transition-opacity">
                <Move className="w-4 h-4 text-white/50" />
              </div>
            )}
          </div>
          {/* Shine overlay */}
          <div
            className="absolute inset-0 rounded-[22%] pointer-events-none"
            style={{
              background: 'linear-gradient(135deg, rgba(255,255,255,0.15) 0%, transparent 50%)',
            }}
          />
        </div>

        {/* Medium Icon */}
        <div className="relative">
          <div
            className="w-20 h-20 rounded-[22%] overflow-hidden bg-linear-to-br from-zinc-800 to-zinc-900 flex items-center justify-center p-3"
            style={{
              boxShadow: '0 8px 20px -3px rgba(0,0,0,0.3), inset 0 1px 0 rgba(255,255,255,0.1)',
            }}
          >
            <img
              src={logoUrl}
              alt="App icon preview"
              className="max-w-full max-h-full object-contain transition-transform"
              style={imgStyle}
            />
          </div>
          <div
            className="absolute inset-0 rounded-[22%] pointer-events-none"
            style={{
              background: 'linear-gradient(135deg, rgba(255,255,255,0.15) 0%, transparent 50%)',
            }}
          />
        </div>

        {/* Small Icon */}
        <div className="relative">
          <div
            className="w-14 h-14 rounded-[22%] overflow-hidden bg-linear-to-br from-zinc-800 to-zinc-900 flex items-center justify-center p-2"
            style={{
              boxShadow: '0 6px 15px -2px rgba(0,0,0,0.3), inset 0 1px 0 rgba(255,255,255,0.1)',
            }}
          >
            <img
              src={logoUrl}
              alt="App icon preview"
              className="max-w-full max-h-full object-contain transition-transform"
              style={imgStyle}
            />
          </div>
          <div
            className="absolute inset-0 rounded-[22%] pointer-events-none"
            style={{
              background: 'linear-gradient(135deg, rgba(255,255,255,0.15) 0%, transparent 50%)',
            }}
          />
        </div>
      </div>

      {/* Social Media Avatars */}
      <div className="space-y-2">
        <p className="text-[10px] text-zinc-500 font-medium">Social Avatars</p>
        <div className="flex items-center gap-3">
          {/* Circle Avatar (Instagram, Twitter) */}
          <div className="relative">
            <div
              className="w-20 h-20 rounded-full overflow-hidden bg-linear-to-br from-zinc-800 to-zinc-900 flex items-center justify-center p-3"
              style={{
                boxShadow: '0 8px 20px -3px rgba(0,0,0,0.3)',
              }}
            >
              <img
                src={logoUrl}
                alt="Avatar preview"
                className="max-w-full max-h-full object-contain"
              />
            </div>
            {/* Instagram-style ring */}
            <div className="absolute -inset-0.5 rounded-full border-2 border-gradient-to-r from-purple-500 via-pink-500 to-orange-500 opacity-0 hover:opacity-100 transition-opacity" />
          </div>

          {/* Square with slight radius (LinkedIn) */}
          <div
            className="w-20 h-20 rounded-lg overflow-hidden bg-linear-to-br from-zinc-800 to-zinc-900 flex items-center justify-center p-3"
            style={{
              boxShadow: '0 8px 20px -3px rgba(0,0,0,0.3)',
            }}
          >
            <img
              src={logoUrl}
              alt="Avatar preview"
              className="max-w-full max-h-full object-contain transition-transform"
              style={imgStyle}
            />
          </div>

          {/* Small circle (Favicon) */}
          <div
            className="w-12 h-12 rounded-full overflow-hidden bg-linear-to-br from-zinc-800 to-zinc-900 flex items-center justify-center p-2"
            style={{
              boxShadow: '0 4px 10px -2px rgba(0,0,0,0.3)',
            }}
          >
            <img
              src={logoUrl}
              alt="Favicon preview"
              className="max-w-full max-h-full object-contain transition-transform"
              style={imgStyle}
            />
          </div>
        </div>
      </div>

      {/* Light Background Variants */}
      <div className="space-y-2">
        <p className="text-[10px] text-zinc-500 font-medium">Light Background</p>
        <div className="flex items-center gap-3">
          <div
            className="w-20 h-20 rounded-[22%] overflow-hidden bg-white flex items-center justify-center p-3"
            style={{
              boxShadow: '0 8px 20px -3px rgba(0,0,0,0.15), inset 0 0 0 1px rgba(0,0,0,0.05)',
            }}
          >
            <img
              src={logoUrl}
              alt="App icon preview"
              className="max-w-full max-h-full object-contain transition-transform"
              style={imgStyle}
            />
          </div>

          <div
            className="w-20 h-20 rounded-full overflow-hidden bg-gray-100 flex items-center justify-center p-3"
            style={{
              boxShadow: '0 8px 20px -3px rgba(0,0,0,0.1)',
            }}
          >
            <img
              src={logoUrl}
              alt="Avatar preview"
              className="max-w-full max-h-full object-contain transition-transform"
              style={imgStyle}
            />
          </div>

          <div
            className="w-20 h-20 rounded-lg overflow-hidden bg-linear-to-br from-gray-50 to-gray-100 flex items-center justify-center p-3"
            style={{
              boxShadow: '0 8px 20px -3px rgba(0,0,0,0.1)',
            }}
          >
            <img
              src={logoUrl}
              alt="Avatar preview"
              className="max-w-full max-h-full object-contain transition-transform"
              style={imgStyle}
            />
          </div>
        </div>
      </div>
    </div>
  )
}
