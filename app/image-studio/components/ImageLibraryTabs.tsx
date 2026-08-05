"use client"

import { Clock, Heart } from 'lucide-react'
import type { ImageLibraryTab } from '../hooks/useImageStudioState'

interface ImageLibraryTabsProps {
  activeTab: ImageLibraryTab
  onSelectTab: (tab: ImageLibraryTab) => void
  historyCount?: number
  favoritesCount?: number
}

export function ImageLibraryTabs({
  activeTab,
  onSelectTab,
  historyCount,
  favoritesCount,
}: ImageLibraryTabsProps) {
  const tabClass = (tab: ImageLibraryTab) =>
    `flex items-center gap-1.5 px-3 py-1.5 rounded-md text-sm font-medium transition-colors ${
      activeTab === tab
        ? 'bg-[#c99850]/20 text-[#dbb56e] border border-[#c99850]/50'
        : 'text-zinc-400 hover:text-white hover:bg-zinc-800 border border-transparent'
    }`

  return (
    <div className="flex items-center gap-1 rounded-lg bg-zinc-950/70 p-1 border border-zinc-800">
      <button type="button" onClick={() => onSelectTab('history')} className={tabClass('history')}>
        <Clock className="w-3.5 h-3.5" />
        History{historyCount === undefined ? '' : ` (${historyCount})`}
      </button>
      <button type="button" onClick={() => onSelectTab('favorites')} className={tabClass('favorites')}>
        <Heart className={`w-3.5 h-3.5 ${activeTab === 'favorites' ? 'fill-current' : ''}`} />
        Favorites{favoritesCount === undefined ? '' : ` (${favoritesCount})`}
      </button>
    </div>
  )
}
