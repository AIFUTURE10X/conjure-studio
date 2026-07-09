"use client"

import { useState } from 'react'
import { Search, Image as ImageIcon } from 'lucide-react'
import { Input } from '@/components/ui/input'
import {
  IconStyle,
  IconPosition,
  IconOption,
  PositionOption,
  ICON_OPTIONS,
  ICON_CATEGORIES,
  POSITION_OPTIONS,
  getIconById,
  getPositionById,
  getIconPromptDescription,
} from '../../constants/icon-options'

// Re-export types and helpers for backwards compatibility
export type { IconStyle, IconPosition, IconOption, PositionOption }
export { ICON_OPTIONS, ICON_CATEGORIES, POSITION_OPTIONS, getIconById, getPositionById, getIconPromptDescription }

// ============================================
// COMPONENT PROPS
// ============================================

interface IconSelectorProps {
  selectedIcon: IconStyle | null
  selectedPosition: IconPosition | null
  onIconChange: (icon: IconStyle | null) => void
  onPositionChange: (position: IconPosition | null) => void
}

// ============================================
// COMPONENT
// ============================================

export function IconSelector({
  selectedIcon,
  selectedPosition,
  onIconChange,
  onPositionChange,
}: IconSelectorProps) {
  const [activeCategory, setActiveCategory] = useState<'all' | typeof ICON_CATEGORIES[number]['id']>('all')
  const [searchQuery, setSearchQuery] = useState('')

  const filteredIcons = ICON_OPTIONS.filter(icon => {
    if (icon.id === 'none') return true
    if (activeCategory !== 'all' && icon.category !== activeCategory) return false
    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase()
      return icon.label.toLowerCase().includes(query) ||
             icon.category.includes(query)
    }
    return true
  })

  const handleIconClick = (iconId: IconStyle) => {
    if (selectedIcon === iconId) {
      onIconChange(null)
      onPositionChange(null)
    } else if (iconId === 'none') {
      onIconChange(null)
      onPositionChange(null)
    } else {
      onIconChange(iconId)
      if (!selectedPosition) {
        onPositionChange('before-text')
      }
    }
  }

  const selectedIconInfo = ICON_OPTIONS.find(i => i.id === selectedIcon)

  return (
    <div className="space-y-4">
      {/* Search */}
      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-500" />
        <Input
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          placeholder="Search icons..."
          className="pl-9 bg-zinc-800 border-zinc-700 text-white placeholder:text-zinc-500 h-8 text-sm"
        />
      </div>

      {/* Category Filter */}
      <div className="flex flex-wrap gap-1">
        <button
          onClick={() => setActiveCategory('all')}
          className={`px-2 py-1 rounded-md text-xs font-medium transition-colors ${
            activeCategory === 'all'
              ? 'bg-purple-600 text-white'
              : 'bg-zinc-800 text-zinc-400 hover:bg-zinc-700'
          }`}
        >
          All
        </button>
        {ICON_CATEGORIES.map((cat) => (
          <button
            key={cat.id}
            onClick={() => setActiveCategory(cat.id)}
            className={`px-2 py-1 rounded-md text-xs font-medium transition-colors flex items-center gap-1 ${
              activeCategory === cat.id
                ? 'bg-purple-600 text-white'
                : 'bg-zinc-800 text-zinc-400 hover:bg-zinc-700'
            }`}
          >
            <span>{cat.icon}</span>
            <span>{cat.label}</span>
          </button>
        ))}
      </div>

      {/* Icon Grid */}
      <div className="grid grid-cols-6 gap-1.5 max-h-[180px] overflow-y-auto p-1">
        {filteredIcons.map((icon) => (
          <button
            key={icon.id}
            onClick={() => handleIconClick(icon.id)}
            className={`p-2 rounded-lg border transition-all flex flex-col items-center ${
              selectedIcon === icon.id
                ? 'border-purple-500 bg-purple-500/20'
                : 'border-zinc-700 bg-zinc-800/50 hover:border-zinc-600 hover:bg-zinc-800'
            }`}
            title={icon.label}
          >
            <span className="text-xl">{icon.emoji}</span>
            <span className="text-[8px] text-zinc-400 truncate w-full text-center mt-0.5">
              {icon.label}
            </span>
          </button>
        ))}
      </div>

      {/* Position Selector (only when icon selected) */}
      {selectedIcon && selectedIcon !== 'none' && (
        <div className="space-y-2 pt-2 border-t border-zinc-700">
          <label className="text-sm font-medium text-zinc-300 flex items-center gap-2">
            <ImageIcon className="w-4 h-4 text-purple-400" />
            Icon Position
          </label>
          <div className="grid grid-cols-3 gap-1.5">
            {POSITION_OPTIONS.map((pos) => (
              <button
                key={pos.id}
                onClick={() => onPositionChange(pos.id)}
                className={`p-2 rounded-lg border transition-all text-center ${
                  selectedPosition === pos.id
                    ? 'border-purple-500 bg-purple-500/20'
                    : 'border-zinc-700 bg-zinc-800 hover:border-zinc-600'
                }`}
              >
                <div className="text-sm font-mono text-white">{pos.icon}</div>
                <div className="text-[9px] text-zinc-400">{pos.label}</div>
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Selected Summary */}
      {selectedIconInfo && selectedIconInfo.id !== 'none' && (
        <div className="p-3 bg-purple-500/10 border border-purple-500/30 rounded-lg">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <span className="text-2xl">{selectedIconInfo.emoji}</span>
              <div>
                <div className="text-sm font-medium text-white">{selectedIconInfo.label}</div>
                <div className="text-xs text-zinc-400">
                  {POSITION_OPTIONS.find(p => p.id === selectedPosition)?.description || 'Select position'}
                </div>
              </div>
            </div>
            <button
              onClick={() => {
                onIconChange(null)
                onPositionChange(null)
              }}
              className="text-xs text-zinc-400 hover:text-white px-2 py-1"
            >
              Remove
            </button>
          </div>
        </div>
      )}
    </div>
  )
}
