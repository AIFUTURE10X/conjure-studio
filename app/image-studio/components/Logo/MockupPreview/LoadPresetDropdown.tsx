"use client"

/**
 * LoadPresetDropdown Component
 *
 * Dropdown displaying saved mockup presets with thumbnail grid.
 * Extracted from ProductMockupsPanel.tsx to keep files under 300 lines.
 */

import { RefObject } from 'react'
import { FolderOpen, Trash2, Package, ChevronDown } from 'lucide-react'
import type { SavedMockup } from './useProductMockupsState'

interface LoadPresetDropdownProps {
  isOpen: boolean
  onToggle: () => void
  savedMockups: SavedMockup[]
  onLoadMockup: (mockup: SavedMockup) => void
  onDeleteMockup: (id: string) => void
  onDeleteAll: () => void
  dropdownRef: RefObject<HTMLDivElement | null>
}

function getTimeAgo(timestamp: number): string {
  const now = Date.now()
  const diff = now - timestamp
  const hours = Math.floor(diff / (1000 * 60 * 60))
  const days = Math.floor(hours / 24)
  return days > 0 ? `${days}d ago` : hours > 0 ? `${hours}h ago` : 'Just now'
}

export function LoadPresetDropdown({
  isOpen,
  onToggle,
  savedMockups,
  onLoadMockup,
  onDeleteMockup,
  onDeleteAll,
  dropdownRef
}: LoadPresetDropdownProps) {
  return (
    <div ref={dropdownRef} className="relative">
      <button
        onClick={onToggle}
        className="flex items-center gap-2 px-3 py-1.5 rounded-lg text-sm font-medium transition-all whitespace-nowrap text-blue-400 hover:text-blue-300 hover:bg-blue-500/10 border border-blue-500/30"
        title="Load a saved mockup preset"
      >
        <FolderOpen className="w-4 h-4" />
        Load Preset ({savedMockups.length})
        <ChevronDown className={`w-3 h-3 transition-transform ${isOpen ? 'rotate-180' : ''}`} />
      </button>

      {isOpen && (
        <div className="absolute right-0 top-full mt-2 bg-zinc-900 border border-zinc-700 rounded-xl shadow-2xl z-50 overflow-hidden p-4 min-w-[600px] max-w-[90vw]">
          {/* Header with actions */}
          <div className="flex items-center gap-3 pb-3 mb-3 border-b border-zinc-700">
            <span className="text-sm font-medium text-white">Saved Presets</span>
            <span className="text-xs text-zinc-500">({savedMockups.length})</span>
            <div className="flex-1" />
            {savedMockups.length > 0 && (
              <button
                onClick={() => {
                  if (confirm('Delete all saved presets?')) {
                    onDeleteAll()
                  }
                }}
                className="flex items-center gap-1.5 px-2.5 py-1 text-xs text-red-400 hover:text-red-300 hover:bg-red-500/10 rounded-md transition-colors"
              >
                <Trash2 className="w-3.5 h-3.5" />
                Delete All
              </button>
            )}
          </div>

          {savedMockups.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-12 text-center">
              <Package className="w-12 h-12 text-zinc-600 mb-3" />
              <p className="text-zinc-400 text-sm">No saved presets yet</p>
              <p className="text-zinc-500 text-xs mt-1">Save a mockup to access it quickly later</p>
            </div>
          ) : (
            <div className="grid grid-cols-3 gap-3 max-h-[400px] overflow-y-auto pr-1">
              {savedMockups.map((mockup) => (
                <SavedPresetCard
                  key={mockup.id}
                  mockup={mockup}
                  onLoad={() => onLoadMockup(mockup)}
                  onDelete={() => onDeleteMockup(mockup.id)}
                />
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  )
}

interface SavedPresetCardProps {
  mockup: SavedMockup
  onLoad: () => void
  onDelete: () => void
}

function SavedPresetCard({ mockup, onLoad, onDelete }: SavedPresetCardProps) {
  const timeAgo = getTimeAgo(mockup.timestamp)

  return (
    <div
      className="group bg-zinc-800 rounded-lg overflow-hidden border border-zinc-700/50 hover:border-blue-500/50 transition-all cursor-pointer"
      onClick={onLoad}
    >
      {/* Thumbnail */}
      <div className="aspect-square bg-zinc-900 relative">
        {mockup.thumbnail ? (
          <img
            src={mockup.thumbnail}
            alt={mockup.name || 'Preset'}
            className="w-full h-full object-contain"
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center text-zinc-600">
            <Package className="w-10 h-10" />
          </div>
        )}
        {/* Delete button overlay */}
        <button
          onClick={(e) => {
            e.stopPropagation()
            onDelete()
          }}
          className="absolute top-2 right-2 p-1.5 rounded-md bg-black/60 text-zinc-400 hover:text-red-400 hover:bg-red-500/20 opacity-0 group-hover:opacity-100 transition-all"
          title="Delete preset"
        >
          <Trash2 className="w-4 h-4" />
        </button>
      </div>

      {/* Info */}
      <div className="p-2.5">
        <div className="text-xs text-zinc-500 mb-0.5">{timeAgo}</div>
        <div className="text-sm text-white font-medium truncate">
          {mockup.name || mockup.brandName || 'Untitled'}
        </div>
      </div>
    </div>
  )
}
