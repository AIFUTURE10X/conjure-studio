"use client"

import { Loader2, Trash2, X } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Checkbox } from '@/components/ui/checkbox'
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip'
import { CreationLibraryTabs } from '../../CreationLibraryTabs'
import type { CreationLibraryTab } from '../../../hooks/useImageStudioState'
import type { VideoHistoryTab } from './useVideoHistoryBrowser'

interface VideoHistoryHeaderProps {
  onSelectMedia: (tab: CreationLibraryTab) => void
  tab: VideoHistoryTab
  onTabChange: (tab: VideoHistoryTab) => void
  selectedCount: number
  hasSelectableClips: boolean
  isAllSelected: boolean
  onToggleAll: () => void
  onDeleteSelected: () => void
  isDeleting: boolean
  onClose: () => void
}

const TABS: Array<{ id: VideoHistoryTab; label: string }> = [
  { id: 'all', label: 'All' },
  { id: 'favorites', label: 'Favorites' },
]

/**
 * Modal header: title, tab switch, select-all and the batch delete.
 *
 * Extracted from VideoHistoryModal so both files stay under the 300-line limit in
 * app/image-studio/CLAUDE.md.
 */
export function VideoHistoryHeader({
  onSelectMedia, tab, onTabChange, selectedCount, hasSelectableClips, isAllSelected,
  onToggleAll, onDeleteSelected, isDeleting, onClose,
}: VideoHistoryHeaderProps) {
  return (
    <div className="flex items-center justify-between gap-4 p-4 border-b border-zinc-800">
      <div className="flex items-center gap-4 min-w-0">
        <div className="min-w-0">
          <h2 className="text-xl font-bold text-white">Creation Library</h2>
          <p className="text-xs text-zinc-400">
            {selectedCount > 0 ? `${selectedCount} selected` : 'Every clip you have generated'}
          </p>
        </div>

        <CreationLibraryTabs activeTab="videos" onSelect={onSelectMedia} />

        {hasSelectableClips && (
          <div className="flex items-center gap-2 shrink-0">
            <Checkbox
              checked={isAllSelected}
              onCheckedChange={onToggleAll}
              aria-label="Select all clips"
              className="border-[#c99850] data-[state=checked]:bg-[#c99850] data-[state=checked]:border-[#c99850]"
            />
            <span className="text-xs text-zinc-400">Select all</span>
          </div>
        )}
      </div>

      <div className="flex items-center gap-2 shrink-0">
        {selectedCount > 0 && (
          <Button
            onClick={onDeleteSelected}
            disabled={isDeleting}
            size="sm"
            className="bg-red-900/20 hover:bg-red-900/30 text-red-400 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isDeleting
              ? <Loader2 className="w-4 h-4 mr-2 animate-spin" />
              : <Trash2 className="w-4 h-4 mr-2" />}
            Delete selected ({selectedCount})
          </Button>
        )}

        <div className="flex items-center gap-1 p-1 bg-zinc-950 rounded-lg border border-zinc-800">
          {TABS.map((option) => (
            <button
              key={option.id}
              onClick={() => onTabChange(option.id)}
              className={`px-3 py-1 rounded-md text-xs font-medium transition-colors ${
                tab === option.id
                  ? 'bg-linear-to-r from-[#c99850] to-[#dbb56e] text-black'
                  : 'text-zinc-400 hover:text-white hover:bg-zinc-800'
              }`}
            >
              {option.label}
            </button>
          ))}
        </div>

        <Tooltip>
          <TooltipTrigger asChild>
            <Button onClick={onClose} size="sm" variant="ghost" className="text-zinc-400 hover:text-white">
              <X className="w-4 h-4" />
            </Button>
          </TooltipTrigger>
          <TooltipContent side="bottom">Close</TooltipContent>
        </Tooltip>
      </div>
    </div>
  )
}
