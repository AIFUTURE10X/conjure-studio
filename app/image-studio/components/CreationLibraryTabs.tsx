"use client"

import { Clapperboard, ImageIcon, Shapes } from 'lucide-react'
import type { CreationLibraryTab } from '../hooks/useImageStudioState'

interface CreationLibraryTabsProps {
  activeTab: CreationLibraryTab
  onSelect: (tab: CreationLibraryTab) => void
}

const TABS: Array<{
  id: CreationLibraryTab
  label: string
  Icon: typeof ImageIcon
}> = [
  { id: 'images', label: 'Images', Icon: ImageIcon },
  { id: 'videos', label: 'Videos', Icon: Clapperboard },
  { id: 'logos', label: 'Logos', Icon: Shapes },
]

export function CreationLibraryTabs({ activeTab, onSelect }: CreationLibraryTabsProps) {
  return (
    <div className="flex items-center gap-1 rounded-lg border border-zinc-800 bg-zinc-950/70 p-1">
      {TABS.map(({ id, label, Icon }) => (
        <button
          key={id}
          type="button"
          onClick={() => onSelect(id)}
          className={`flex items-center gap-1.5 rounded-md px-3 py-1.5 text-sm font-medium transition-colors ${
            activeTab === id
              ? 'border border-[#c99850]/50 bg-[#c99850]/20 text-[#dbb56e]'
              : 'border border-transparent text-zinc-400 hover:bg-zinc-800 hover:text-white'
          }`}
        >
          <Icon className="h-3.5 w-3.5" />
          {label}
        </button>
      ))}
    </div>
  )
}
