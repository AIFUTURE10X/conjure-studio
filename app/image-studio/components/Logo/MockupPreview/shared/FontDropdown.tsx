"use client"

/**
 * Font Dropdown Component
 *
 * Font selector with popular fonts grid and expandable full list.
 * Extracted from BrandSidebar to keep files under 300 lines.
 */

import { ChevronDown } from 'lucide-react'
import { REAL_FONTS } from '@/app/image-studio/constants/real-fonts'

interface FontDropdownProps {
  brandFont: string
  isOpen: boolean
  showAllFonts: boolean
  onToggle: () => void
  onToggleShowAllFonts: () => void
  onFontChange: (font: string) => void
}

// Popular fonts for quick access
const POPULAR_FONTS = ['montserrat', 'poppins', 'raleway', 'playfair-display', 'bebas-neue', 'orbitron', 'great-vibes', 'pacifico']

export function FontDropdown({
  brandFont,
  isOpen,
  showAllFonts,
  onToggle,
  onToggleShowAllFonts,
  onFontChange,
}: FontDropdownProps) {
  return (
    <div className="w-full space-y-1.5">
      <button
        onClick={onToggle}
        className="w-full flex items-center justify-between px-3 py-2 bg-zinc-800/50 border border-zinc-700/50 rounded-lg hover:bg-zinc-700/50 transition-colors"
      >
        <div className="flex items-center gap-2">
          <span className="text-[10px] text-zinc-300 font-normal uppercase">Font</span>
          <span
            className="text-xs text-white font-extralight truncate max-w-[100px]"
            style={{ fontFamily: REAL_FONTS[brandFont]?.family || 'sans-serif' }}
          >
            {REAL_FONTS[brandFont]?.name || 'Select'}
          </span>
        </div>
        <ChevronDown className={`w-4 h-4 text-zinc-400 transition-transform ${isOpen ? 'rotate-180' : ''}`} />
      </button>

      {isOpen && (
        <div className="bg-zinc-800 border border-zinc-700 rounded-lg p-2 space-y-2">
          <div className="grid grid-cols-2 gap-1">
            {POPULAR_FONTS.map((fontKey) => {
              const font = REAL_FONTS[fontKey]
              if (!font) return null
              return (
                <button
                  key={fontKey}
                  onClick={() => onFontChange(fontKey)}
                  className={`px-2 py-1.5 rounded-md text-[10px] font-extralight transition-all truncate ${
                    brandFont === fontKey
                      ? 'bg-purple-500/20 text-purple-300 border border-purple-500/30'
                      : 'bg-zinc-700/50 text-zinc-400 border border-zinc-600/50 hover:bg-zinc-600/50'
                  }`}
                  style={{ fontFamily: font.family }}
                >
                  {font.name}
                </button>
              )
            })}
          </div>
          <button
            onClick={onToggleShowAllFonts}
            className="w-full text-[9px] text-zinc-500 hover:text-zinc-300 font-extralight py-1 border-t border-zinc-700 pt-2"
          >
            {showAllFonts ? 'Show less' : 'More fonts...'}
          </button>
          {showAllFonts && (
            <div className="grid grid-cols-2 gap-1 max-h-32 overflow-y-auto">
              {Object.keys(REAL_FONTS).filter(k => !POPULAR_FONTS.includes(k)).map((fontKey) => {
                const font = REAL_FONTS[fontKey]
                if (!font) return null
                return (
                  <button
                    key={fontKey}
                    onClick={() => onFontChange(fontKey)}
                    className={`px-2 py-1.5 rounded-md text-[10px] font-extralight transition-all truncate ${
                      brandFont === fontKey
                        ? 'bg-purple-500/20 text-purple-300 border border-purple-500/30'
                        : 'bg-zinc-700/50 text-zinc-400 border border-zinc-600/50 hover:bg-zinc-600/50'
                    }`}
                    style={{ fontFamily: font.family }}
                  >
                    {font.name}
                  </button>
                )
              })}
            </div>
          )}
        </div>
      )}
    </div>
  )
}
