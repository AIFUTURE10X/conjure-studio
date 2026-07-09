"use client"

/**
 * History Toolbar Component
 *
 * Toolbar with selection, favorites filter, delete, compare, sync, and clear buttons.
 * Extracted from LogoHistoryPanel.tsx to keep files under 300 lines.
 */

import { Heart, Trash2, GitCompare, CheckSquare, Square, History } from 'lucide-react'
import { Button } from '@/components/ui/button'

interface HistoryToolbarProps {
  displayItemsCount: number
  selectedCount: number
  allSelected: boolean
  showFavoritesOnly: boolean
  showDeleteConfirm: boolean
  isDeleting: boolean
  isSyncing: boolean
  showClearConfirm: boolean
  onSelectAll: () => void
  onClearSelection: () => void
  onToggleFavoritesFilter: () => void
  onShowDeleteConfirm: (show: boolean) => void
  onDeleteSelected: () => Promise<void>
  onCompare: () => void
  onSync: () => void
  onShowClearConfirm: (show: boolean) => void
  onClearAll: () => void
}

export function HistoryToolbar({
  displayItemsCount,
  selectedCount,
  allSelected,
  showFavoritesOnly,
  showDeleteConfirm,
  isDeleting,
  isSyncing,
  showClearConfirm,
  onSelectAll,
  onClearSelection,
  onToggleFavoritesFilter,
  onShowDeleteConfirm,
  onDeleteSelected,
  onCompare,
  onSync,
  onShowClearConfirm,
  onClearAll,
}: HistoryToolbarProps) {
  return (
    <div className="flex items-center justify-between">
      <div className="flex items-center gap-2">
        {/* Select All checkbox */}
        <button
          onClick={onSelectAll}
          className="flex items-center gap-1 px-2 py-1 rounded text-xs bg-zinc-700 text-zinc-400 hover:text-white transition-colors"
          title={allSelected ? 'Deselect all' : 'Select all'}
        >
          {allSelected && displayItemsCount > 0 ? (
            <CheckSquare className="w-3 h-3 text-purple-400" />
          ) : (
            <Square className="w-3 h-3" />
          )}
          {selectedCount > 0 ? `${selectedCount} selected` : 'Select All'}
        </button>

        {/* History / Favorites Tabs */}
        <div className="flex items-center rounded overflow-hidden border border-zinc-600">
          <button
            onClick={() => showFavoritesOnly && onToggleFavoritesFilter()}
            className={`flex items-center gap-1 px-2 py-1 text-xs transition-colors ${
              !showFavoritesOnly
                ? 'bg-zinc-600 text-white'
                : 'bg-zinc-800 text-zinc-400 hover:text-white'
            }`}
          >
            <History className="w-3 h-3" />
            History
          </button>
          <button
            onClick={() => !showFavoritesOnly && onToggleFavoritesFilter()}
            className={`flex items-center gap-1 px-2 py-1 text-xs transition-colors ${
              showFavoritesOnly
                ? 'bg-red-500/20 text-red-400'
                : 'bg-zinc-800 text-zinc-400 hover:text-white'
            }`}
          >
            <Heart className={`w-3 h-3 ${showFavoritesOnly ? 'fill-current' : ''}`} />
            Favorites
          </button>
        </div>

        {/* Delete Selected button */}
        {selectedCount > 0 && (
          <>
            {showDeleteConfirm ? (
              <div className="flex items-center gap-1 bg-red-500/10 rounded px-2 py-1 border border-red-500/30">
                <span className="text-[10px] text-red-400">Delete {selectedCount}?</span>
                <Button
                  onClick={async () => {
                    await onDeleteSelected()
                    onShowDeleteConfirm(false)
                  }}
                  disabled={isDeleting}
                  size="sm"
                  className="h-5 px-2 text-[10px] bg-red-500 hover:bg-red-600 text-white"
                >
                  {isDeleting ? 'Deleting...' : 'Yes'}
                </Button>
                <Button
                  onClick={() => onShowDeleteConfirm(false)}
                  size="sm"
                  variant="ghost"
                  className="h-5 px-2 text-[10px] text-zinc-400"
                >
                  No
                </Button>
              </div>
            ) : (
              <Button
                onClick={() => onShowDeleteConfirm(true)}
                size="sm"
                className="h-6 px-2 text-xs bg-red-500/20 text-red-400 border border-red-500/30 hover:bg-red-500/30"
              >
                <Trash2 className="w-3 h-3 mr-1" />
                Delete Selected
              </Button>
            )}
          </>
        )}

        {/* Compare button */}
        {selectedCount >= 2 && selectedCount <= 4 && (
          <Button
            onClick={onCompare}
            size="sm"
            className="h-6 px-2 text-xs bg-purple-500/20 text-purple-400 border border-purple-500/30 hover:bg-purple-500/30"
          >
            <GitCompare className="w-3 h-3 mr-1" />
            Compare
          </Button>
        )}

        {selectedCount > 0 && (
          <button
            onClick={onClearSelection}
            className="text-xs text-zinc-500 hover:text-white"
          >
            Clear
          </button>
        )}
      </div>

      {/* Sync and Clear */}
      <div className="flex items-center gap-2">
        {/* Sync button */}
        <button
          onClick={onSync}
          disabled={isSyncing}
          className={`p-1 rounded transition-colors ${
            isSyncing ? 'text-blue-400 animate-spin' : 'text-zinc-500 hover:text-blue-400'
          }`}
          title="Sync from cloud"
        >
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
          </svg>
        </button>

        {/* Clear history */}
        <div className="relative">
          {showClearConfirm ? (
            <div className="flex items-center gap-2">
              <span className="text-[10px] text-zinc-400">Clear all?</span>
              <Button
                onClick={() => {
                  onClearAll()
                  onShowClearConfirm(false)
                }}
                size="sm"
                className="h-5 px-2 text-[10px] bg-red-500/20 text-red-400"
              >
                Yes
              </Button>
              <Button
                onClick={() => onShowClearConfirm(false)}
                size="sm"
                variant="ghost"
                className="h-5 px-2 text-[10px] text-zinc-400"
              >
                No
              </Button>
            </div>
          ) : (
            <button
              onClick={() => onShowClearConfirm(true)}
              className="p-1 text-zinc-500 hover:text-red-400 rounded transition-colors"
              title="Clear history"
            >
              <Trash2 className="w-4 h-4" />
            </button>
          )}
        </div>
      </div>
    </div>
  )
}
