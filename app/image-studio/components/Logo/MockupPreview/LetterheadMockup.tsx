"use client"

/**
 * LetterheadMockup Component
 *
 * Shows logo on a letterhead/stationery preview
 */

import { useState, useRef, useCallback } from 'react'
import { ZoomIn, ZoomOut, Move, RotateCcw } from 'lucide-react'

interface LetterheadMockupProps {
  logoUrl: string
  brandName?: string
  darkMode?: boolean
  logoFilter?: React.CSSProperties
}

export function LetterheadMockup({
  logoUrl,
  brandName = "Your Brand",
  darkMode = false,
  logoFilter,
}: LetterheadMockupProps) {
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
      {/* Paper Container */}
      <div
        className={`relative w-full aspect-[0.77/1] rounded-sm overflow-hidden ${
          darkMode
            ? 'bg-zinc-900'
            : 'bg-white'
        }`}
        style={{
          boxShadow: darkMode
            ? '0 25px 50px -12px rgba(0, 0, 0, 0.5), inset 0 0 0 1px rgba(255,255,255,0.1)'
            : '0 25px 50px -12px rgba(0, 0, 0, 0.15), inset 0 0 0 1px rgba(0,0,0,0.05)',
        }}
      >
        {/* Header Section with Draggable Logo */}
        <div className={`px-6 pt-6 pb-4 border-b ${darkMode ? 'border-zinc-800' : 'border-gray-100'}`}>
          <div className="flex items-center justify-between">
            <div
              className={`relative w-40 h-14 flex items-center overflow-hidden ${isDragging ? 'cursor-grabbing' : 'cursor-grab'}`}
              onMouseDown={handleMouseDown}
            >
              <img
                src={logoUrl}
                alt="Logo preview"
                className={`max-w-full max-h-full object-contain transition-transform pointer-events-none ${isDragging ? 'scale-105' : ''}`}
                style={{ transform: `translate(${logoPosition.x}px, ${logoPosition.y}px) scale(${logoScale})`, ...logoFilter }}
                draggable={false}
              />
              {!isDragging && (
                <div className="absolute inset-0 flex items-center justify-center opacity-0 hover:opacity-100 transition-opacity">
                  <Move className="w-4 h-4 text-zinc-500" />
                </div>
              )}
            </div>
            <div className="text-right">
              <p className={`text-[8px] ${darkMode ? 'text-zinc-500' : 'text-gray-400'}`}>
                123 Business Street
              </p>
              <p className={`text-[8px] ${darkMode ? 'text-zinc-500' : 'text-gray-400'}`}>
                New York, NY 10001
              </p>
            </div>
          </div>
        </div>

        {/* Letter Content - Placeholder Lines */}
        <div className="px-6 py-6 space-y-4">
          {/* Date */}
          <div className={`w-20 h-2 rounded ${darkMode ? 'bg-zinc-800' : 'bg-gray-100'}`} />

          {/* Greeting */}
          <div className="pt-4">
            <div className={`w-24 h-2 rounded ${darkMode ? 'bg-zinc-800' : 'bg-gray-100'}`} />
          </div>

          {/* Body Paragraphs */}
          <div className="space-y-2 pt-2">
            <div className={`w-full h-2 rounded ${darkMode ? 'bg-zinc-800' : 'bg-gray-100'}`} />
            <div className={`w-full h-2 rounded ${darkMode ? 'bg-zinc-800' : 'bg-gray-100'}`} />
            <div className={`w-3/4 h-2 rounded ${darkMode ? 'bg-zinc-800' : 'bg-gray-100'}`} />
          </div>

          <div className="space-y-2 pt-2">
            <div className={`w-full h-2 rounded ${darkMode ? 'bg-zinc-800' : 'bg-gray-100'}`} />
            <div className={`w-full h-2 rounded ${darkMode ? 'bg-zinc-800' : 'bg-gray-100'}`} />
            <div className={`w-5/6 h-2 rounded ${darkMode ? 'bg-zinc-800' : 'bg-gray-100'}`} />
          </div>

          <div className="space-y-2 pt-2">
            <div className={`w-full h-2 rounded ${darkMode ? 'bg-zinc-800' : 'bg-gray-100'}`} />
            <div className={`w-2/3 h-2 rounded ${darkMode ? 'bg-zinc-800' : 'bg-gray-100'}`} />
          </div>

          {/* Signature Area */}
          <div className="pt-6 space-y-2">
            <div className={`w-16 h-2 rounded ${darkMode ? 'bg-zinc-800' : 'bg-gray-100'}`} />
            <div className={`w-24 h-2 rounded ${darkMode ? 'bg-zinc-700' : 'bg-gray-200'}`} />
          </div>
        </div>

        {/* Footer */}
        <div className={`absolute bottom-0 left-0 right-0 px-6 py-3 border-t ${darkMode ? 'border-zinc-800' : 'border-gray-100'}`}>
          <div className="flex justify-center gap-4">
            <p className={`text-[7px] ${darkMode ? 'text-zinc-600' : 'text-gray-300'}`}>
              www.{brandName.toLowerCase().replace(/\s+/g, '')}.com
            </p>
            <p className={`text-[7px] ${darkMode ? 'text-zinc-600' : 'text-gray-300'}`}>
              info@{brandName.toLowerCase().replace(/\s+/g, '')}.com
            </p>
            <p className={`text-[7px] ${darkMode ? 'text-zinc-600' : 'text-gray-300'}`}>
              +1 (555) 123-4567
            </p>
          </div>
        </div>
      </div>

      {/* Paper Shadow */}
      <div
        className="absolute -bottom-3 left-2 right-2 h-6 rounded-full blur-lg opacity-20"
        style={{
          background: 'radial-gradient(ellipse, rgba(0,0,0,0.4) 0%, transparent 70%)',
        }}
      />

      {/* Logo Controls */}
      <div className="absolute top-2 right-2 flex items-center gap-1 bg-zinc-900/80 rounded-lg px-2 py-1 z-10">
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
