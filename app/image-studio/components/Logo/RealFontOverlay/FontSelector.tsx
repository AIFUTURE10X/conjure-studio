"use client"

import { useState, useEffect } from 'react'
import { ChevronDown, Check } from 'lucide-react'
import { REAL_FONTS, REAL_FONT_CATEGORIES, type RealFontCategory, type RealFont } from '@/app/image-studio/constants/real-fonts'

interface FontSelectorProps {
  selectedFontId: string
  onSelectFont: (fontId: string) => void
  loadedFonts: Set<string>
}

export function FontSelector({ selectedFontId, onSelectFont, loadedFonts }: FontSelectorProps) {
  const [isOpen, setIsOpen] = useState(false)
  const selectedFont = REAL_FONTS[selectedFontId]

  // Group fonts by category
  const fontsByCategory = Object.entries(REAL_FONTS).reduce(
    (acc, [id, font]) => {
      if (!acc[font.category]) acc[font.category] = []
      acc[font.category].push({ id, ...font })
      return acc
    },
    {} as Record<RealFontCategory, (RealFont & { id: string })[]>
  )

  return (
    <div className="relative">
      <label className="block text-xs text-zinc-400 mb-1.5">Font Family</label>

      {/* Selected Font Button */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="w-full flex items-center justify-between px-3 py-2.5 bg-zinc-800 border border-zinc-700 rounded-lg text-white hover:border-zinc-600 transition-colors"
      >
        <span
          className="text-sm"
          style={{
            fontFamily: loadedFonts.has(selectedFontId) ? selectedFont?.family : 'inherit',
          }}
        >
          {selectedFont?.name || 'Select font'}
        </span>
        <ChevronDown className={`w-4 h-4 text-zinc-400 transition-transform ${isOpen ? 'rotate-180' : ''}`} />
      </button>

      {/* Dropdown */}
      {isOpen && (
        <>
          {/* Backdrop */}
          <div className="fixed inset-0 z-40" onClick={() => setIsOpen(false)} />

          {/* Dropdown Menu */}
          <div className="absolute z-50 w-full mt-1 bg-zinc-800 border border-zinc-700 rounded-lg shadow-xl max-h-80 overflow-y-auto">
            {(Object.keys(REAL_FONT_CATEGORIES) as RealFontCategory[]).map((category) => (
              <div key={category}>
                {/* Category Header */}
                <div className="sticky top-0 px-3 py-2 bg-zinc-900 border-b border-zinc-700">
                  <span className="text-xs font-medium text-zinc-400">
                    {REAL_FONT_CATEGORIES[category].emoji} {REAL_FONT_CATEGORIES[category].label}
                  </span>
                </div>

                {/* Fonts in Category */}
                {fontsByCategory[category]?.map((font) => (
                  <button
                    key={font.id}
                    onClick={() => {
                      onSelectFont(font.id)
                      setIsOpen(false)
                    }}
                    className={`w-full flex items-center justify-between px-3 py-2.5 hover:bg-zinc-700/50 transition-colors ${
                      selectedFontId === font.id ? 'bg-purple-500/20' : ''
                    }`}
                  >
                    <div className="flex flex-col items-start">
                      <span
                        className="text-sm text-white"
                        style={{
                          fontFamily: loadedFonts.has(font.id) ? font.family : 'inherit',
                        }}
                      >
                        {font.name}
                      </span>
                      <span className="text-[10px] text-zinc-500">{font.description}</span>
                    </div>
                    {selectedFontId === font.id && (
                      <Check className="w-4 h-4 text-purple-400" />
                    )}
                  </button>
                ))}
              </div>
            ))}
          </div>
        </>
      )}
    </div>
  )
}
