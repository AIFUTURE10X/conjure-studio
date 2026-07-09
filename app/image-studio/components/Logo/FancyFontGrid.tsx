"use client"

import { useState, useMemo } from 'react'
import { Search } from 'lucide-react'
import { Input } from '@/components/ui/input'
import { FANCY_FONT_STYLES, FONT_CATEGORIES, getFontById, type FancyFontCategory, type FancyFontStyle } from '../../constants/fancy-fonts'

// Re-export types and data for backward compatibility
export type { FancyFontCategory, FancyFontStyle }
export { FANCY_FONT_STYLES, FONT_CATEGORIES, getFontById }

interface FancyFontGridProps {
  brandName: string
  selectedFont: string | null
  onSelectFont: (fontId: string | null) => void
}

export function FancyFontGrid({ brandName, selectedFont, onSelectFont }: FancyFontGridProps) {
  const [activeCategory, setActiveCategory] = useState<FancyFontCategory | 'all'>('all')
  const [searchQuery, setSearchQuery] = useState('')
  const [hoveredFont, setHoveredFont] = useState<FancyFontStyle | null>(null)

  const displayName = brandName || 'BRAND'

  const filteredFonts = useMemo(() => {
    let fonts = FANCY_FONT_STYLES
    if (activeCategory !== 'all') fonts = fonts.filter(f => f.category === activeCategory)
    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase()
      fonts = fonts.filter(f => f.name.toLowerCase().includes(query) || f.description.toLowerCase().includes(query) || f.tags.some(t => t.includes(query)))
    }
    return fonts
  }, [activeCategory, searchQuery])

  const handleFontClick = (fontId: string) => onSelectFont(selectedFont === fontId ? null : fontId)

  return (
    <div className="space-y-4">
      {/* Search */}
      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-500" />
        <Input value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)} placeholder="Search fonts..." className="pl-9 bg-zinc-800 border-zinc-700 text-white placeholder:text-zinc-500 h-9" />
      </div>

      {/* Category Filter */}
      <div className="flex flex-wrap gap-1.5">
        <button onClick={() => setActiveCategory('all')} className={`px-2.5 py-1 rounded-md text-xs font-medium transition-colors ${activeCategory === 'all' ? 'bg-purple-600 text-white' : 'bg-zinc-800 text-zinc-400 hover:bg-zinc-700'}`}>All</button>
        {FONT_CATEGORIES.map((cat) => (
          <button key={cat.id} onClick={() => setActiveCategory(cat.id)} className={`px-2.5 py-1 rounded-md text-xs font-medium transition-colors flex items-center gap-1 ${activeCategory === cat.id ? 'bg-purple-600 text-white' : 'bg-zinc-800 text-zinc-400 hover:bg-zinc-700'}`}>
            <span>{cat.icon}</span>
            <span>{cat.label}</span>
          </button>
        ))}
      </div>

      {/* Font Grid */}
      <div className="grid grid-cols-3 gap-2 max-h-80 overflow-y-auto pr-1">
        {filteredFonts.map((font) => (
          <button key={font.id} onClick={() => handleFontClick(font.id)} onMouseEnter={() => setHoveredFont(font)} onMouseLeave={() => setHoveredFont(null)}
            className={`relative p-3 rounded-lg border transition-all text-left group ${selectedFont === font.id ? 'border-purple-500 bg-purple-500/20' : 'border-zinc-700 bg-zinc-800/50 hover:border-zinc-600 hover:bg-zinc-800'}`}>
            <div className="text-base text-white truncate mb-1 leading-tight" style={{ fontFamily: font.fallbackPreview }}>{displayName}</div>
            <div className="text-[10px] text-zinc-400 truncate">{font.name}</div>
            <div className="absolute top-1.5 right-1.5">
              <span className="text-[10px] px-1.5 py-0.5 rounded bg-zinc-700/80 text-zinc-400">{font.category}</span>
            </div>
          </button>
        ))}
      </div>

      {/* Hover Preview Tooltip */}
      {hoveredFont && (
        <div className="fixed z-50 pointer-events-none" style={{ left: '50%', bottom: '20%', transform: 'translateX(-50%)' }}>
          <div className="bg-zinc-900 border border-zinc-700 rounded-xl p-5 shadow-2xl min-w-[300px]">
            <div className="text-3xl text-white text-center mb-3" style={{ fontFamily: hoveredFont.fallbackPreview }}>{displayName}</div>
            <div className="text-center space-y-1">
              <div className="text-sm font-medium text-white">{hoveredFont.name}</div>
              <div className="text-xs text-zinc-400">{hoveredFont.description}</div>
              <div className="flex flex-wrap justify-center gap-1 mt-2">
                {hoveredFont.tags.slice(0, 4).map(tag => <span key={tag} className="text-[10px] px-1.5 py-0.5 rounded bg-zinc-800 text-zinc-500">{tag}</span>)}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Selected Font Info */}
      {selectedFont && (
        <div className="p-3 bg-purple-500/10 border border-purple-500/30 rounded-lg">
          <div className="flex items-center justify-between">
            <div>
              <span className="text-xs text-purple-300">Selected: </span>
              <span className="text-sm font-medium text-white">{FANCY_FONT_STYLES.find(f => f.id === selectedFont)?.name}</span>
            </div>
            <button onClick={() => onSelectFont(null)} className="text-xs text-zinc-400 hover:text-white">Clear</button>
          </div>
        </div>
      )}

      {/* Empty State */}
      {filteredFonts.length === 0 && (
        <div className="text-center py-8 text-zinc-500 text-sm">No fonts found matching your search</div>
      )}
    </div>
  )
}
