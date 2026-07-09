"use client"

import { useState, useRef, useCallback } from 'react'
import { ZoomIn, ZoomOut, Move, RotateCcw } from 'lucide-react'

interface WebsiteHeaderMockupProps {
  logoUrl: string
  brandName?: string
  darkMode?: boolean
  logoFilter?: React.CSSProperties
}

export function WebsiteHeaderMockup({ logoUrl, brandName = 'Brand', darkMode = true, logoFilter }: WebsiteHeaderMockupProps) {
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
    // Clamp position to keep logo visible (increased range)
    const maxOffset = 30
    setLogoPosition({
      x: Math.max(-maxOffset, Math.min(maxOffset, dragStartRef.current.startX + dx)),
      y: Math.max(-maxOffset, Math.min(maxOffset, dragStartRef.current.startY + dy))
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
      {/* Browser Window Container */}
      <div
        className={`rounded-xl overflow-hidden border ${
          darkMode ? 'border-zinc-700 bg-zinc-900' : 'border-gray-200 bg-white'
        }`}
        style={{ aspectRatio: '16 / 10' }}
      >
        {/* Browser Chrome */}
        <div
          className={`flex items-center gap-2 px-4 py-2 border-b ${
            darkMode ? 'bg-zinc-800 border-zinc-700' : 'bg-gray-100 border-gray-200'
          }`}
        >
          {/* Window Controls */}
          <div className="flex gap-1.5">
            <div className="w-3 h-3 rounded-full bg-red-500" />
            <div className="w-3 h-3 rounded-full bg-yellow-500" />
            <div className="w-3 h-3 rounded-full bg-green-500" />
          </div>
          {/* URL Bar */}
          <div
            className={`flex-1 mx-4 px-3 py-1 rounded-md text-xs ${
              darkMode ? 'bg-zinc-700 text-zinc-400' : 'bg-white text-gray-500 border border-gray-200'
            }`}
          >
            <span className="opacity-50">https://</span>
            <span>{brandName.toLowerCase().replace(/\s+/g, '')}.com</span>
          </div>
        </div>

        {/* Website Content */}
        <div className="p-0">
          {/* Navigation Header */}
          <header
            className={`flex items-center justify-between px-6 py-4 border-b ${
              darkMode ? 'bg-zinc-900 border-zinc-800' : 'bg-white border-gray-100'
            }`}
          >
            {/* Logo Area - Draggable */}
            <div className="flex items-center gap-3">
              <div
                className={`relative w-24 h-16 flex items-center justify-center ${isDragging ? 'cursor-grabbing' : 'cursor-grab'}`}
                onMouseDown={handleMouseDown}
              >
                <img
                  src={logoUrl}
                  alt={`${brandName} logo`}
                  className={`max-w-16 max-h-16 object-contain transition-transform pointer-events-none ${isDragging ? 'scale-105' : ''}`}
                  style={{ transform: `translate(${logoPosition.x}px, ${logoPosition.y}px) scale(${logoScale})`, ...logoFilter }}
                  draggable={false}
                />
                {!isDragging && (
                  <div className="absolute inset-0 flex items-center justify-center opacity-0 hover:opacity-100 transition-opacity">
                    <Move className="w-4 h-4 text-zinc-500" />
                  </div>
                )}
              </div>
            </div>

            {/* Navigation Menu */}
            <nav className="flex items-center gap-6">
              {['Home', 'Products', 'About', 'Contact'].map((item) => (
                <span
                  key={item}
                  className={`text-xs ${
                    darkMode ? 'text-zinc-400 hover:text-white' : 'text-gray-600 hover:text-gray-900'
                  }`}
                >
                  {item}
                </span>
              ))}
            </nav>

            {/* CTA Button */}
            <button className="px-4 py-1.5 rounded-md bg-linear-to-r from-purple-500 to-pink-500 text-white text-xs font-medium">
              Get Started
            </button>
          </header>

          {/* Hero Section Preview */}
          <div
            className={`px-6 py-12 ${
              darkMode ? 'bg-zinc-900' : 'bg-gray-50'
            }`}
          >
            <div className="max-w-md">
              {/* Hero Title Placeholder */}
              <div
                className={`h-6 w-3/4 rounded mb-3 ${
                  darkMode ? 'bg-zinc-700' : 'bg-gray-200'
                }`}
              />
              <div
                className={`h-6 w-1/2 rounded mb-6 ${
                  darkMode ? 'bg-zinc-700' : 'bg-gray-200'
                }`}
              />
              {/* Subtitle Placeholder */}
              <div
                className={`h-3 w-full rounded mb-2 ${
                  darkMode ? 'bg-zinc-800' : 'bg-gray-100'
                }`}
              />
              <div
                className={`h-3 w-4/5 rounded mb-6 ${
                  darkMode ? 'bg-zinc-800' : 'bg-gray-100'
                }`}
              />
              {/* CTA Buttons */}
              <div className="flex gap-3">
                <div className="h-8 w-24 rounded-md bg-linear-to-r from-purple-500 to-pink-500" />
                <div
                  className={`h-8 w-24 rounded-md border ${
                    darkMode ? 'border-zinc-600' : 'border-gray-300'
                  }`}
                />
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Shadow Effect */}
      <div
        className="absolute -bottom-4 left-1/2 -translate-x-1/2 w-4/5 h-8 rounded-full opacity-30"
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
