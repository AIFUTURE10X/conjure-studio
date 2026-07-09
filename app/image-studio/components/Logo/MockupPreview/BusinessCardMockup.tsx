"use client"

/**
 * BusinessCardMockup Component
 *
 * Shows logo on a realistic business card preview with draggable logo
 */

import { useState, useRef, useCallback } from 'react'
import { ZoomIn, ZoomOut, Move, RotateCcw } from 'lucide-react'

interface BusinessCardMockupProps {
  logoUrl: string
  brandName?: string
  darkMode?: boolean
  logoFilter?: React.CSSProperties
}

export function BusinessCardMockup({
  logoUrl,
  brandName = "Your Brand",
  darkMode = false,
  logoFilter,
}: BusinessCardMockupProps) {
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
      {/* Business Card Container */}
      <div
        className={`relative w-full aspect-[1.75/1] rounded-lg shadow-xl overflow-hidden ${
          darkMode
            ? 'bg-linear-to-br from-zinc-900 via-zinc-800 to-zinc-900'
            : 'bg-linear-to-br from-white via-gray-50 to-white'
        }`}
        style={{
          boxShadow: darkMode
            ? '0 25px 50px -12px rgba(0, 0, 0, 0.5)'
            : '0 25px 50px -12px rgba(0, 0, 0, 0.25)',
        }}
      >
        {/* Subtle Pattern Overlay */}
        <div
          className="absolute inset-0 opacity-5"
          style={{
            backgroundImage: `url("data:image/svg+xml,%3Csvg width='60' height='60' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='none' fill-rule='evenodd'%3E%3Cg fill='%23${darkMode ? 'ffffff' : '000000'}' fill-opacity='0.4'%3E%3Cpath d='M36 34v-4h-2v4h-4v2h4v4h2v-4h4v-2h-4zm0-30V0h-2v4h-4v2h4v4h2V6h4V4h-4zM6 34v-4H4v4H0v2h4v4h2v-4h4v-2H6zM6 4V0H4v4H0v2h4v4h2V6h4V4H6z'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E")`,
          }}
        />

        {/* Card Content */}
        <div className="relative h-full p-6 flex flex-col justify-between">
          {/* Top - Draggable Logo */}
          <div
            className={`relative w-full h-24 ${isDragging ? 'cursor-grabbing' : 'cursor-grab'}`}
            onMouseDown={handleMouseDown}
          >
            <div
              className={`absolute flex items-center justify-start transition-transform ${isDragging ? 'scale-105' : ''}`}
              style={{
                transform: `translate(${logoPosition.x}px, ${logoPosition.y}px) scale(${logoScale})`,
                transformOrigin: 'top left'
              }}
            >
              <img
                src={logoUrl}
                alt="Logo preview"
                className="max-h-20 object-contain pointer-events-none"
                style={logoFilter}
                draggable={false}
              />
            </div>
            {/* Drag hint */}
            {!isDragging && (
              <div className="absolute top-0 right-0 opacity-0 hover:opacity-100 transition-opacity">
                <Move className="w-4 h-4 text-zinc-500" />
              </div>
            )}
          </div>

          {/* Bottom - Contact Info */}
          <div className="space-y-1">
            <p className={`text-sm font-semibold ${darkMode ? 'text-white' : 'text-gray-900'}`}>
              John Smith
            </p>
            <p className={`text-xs ${darkMode ? 'text-zinc-400' : 'text-gray-500'}`}>
              Creative Director
            </p>
            <div className="pt-2 space-y-0.5">
              <p className={`text-[10px] ${darkMode ? 'text-zinc-500' : 'text-gray-400'}`}>
                hello@{brandName.toLowerCase().replace(/\s+/g, '')}.com
              </p>
              <p className={`text-[10px] ${darkMode ? 'text-zinc-500' : 'text-gray-400'}`}>
                +1 (555) 123-4567
              </p>
            </div>
          </div>
        </div>

        {/* Shine Effect */}
        <div
          className="absolute inset-0 pointer-events-none"
          style={{
            background: 'linear-gradient(135deg, rgba(255,255,255,0.1) 0%, transparent 50%, transparent 100%)',
          }}
        />
      </div>

      {/* Card Shadow/Reflection */}
      <div
        className="absolute -bottom-4 left-4 right-4 h-8 rounded-full blur-xl opacity-30"
        style={{
          background: darkMode
            ? 'radial-gradient(ellipse, rgba(100,100,100,0.5) 0%, transparent 70%)'
            : 'radial-gradient(ellipse, rgba(0,0,0,0.3) 0%, transparent 70%)',
        }}
      />

      {/* Logo Controls */}
      <div className="absolute top-2 right-2 flex items-center gap-1 bg-zinc-900/80 rounded-lg px-2 py-1">
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
