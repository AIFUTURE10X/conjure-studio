"use client"

/**
 * LogoHistoryPanel Component
 *
 * Collapsible panel showing logo generation history with filters.
 * Toolbar extracted to HistoryToolbar.tsx to keep files under 300 lines.
 */

import { useState, useEffect, MutableRefObject } from 'react'
import { History, ChevronDown, ChevronUp, Heart } from 'lucide-react'
import { HistoryItem } from './HistoryItem'
import { HistoryToolbar } from './HistoryToolbar'
import { useLogoHistory, LogoHistoryItem } from './useLogoHistory'

interface LogoHistoryPanelProps {
  onUseSettings?: (item: LogoHistoryItem) => void
  onLoadImage?: (item: LogoHistoryItem) => void
  /** Send logo directly to mockups panel */
  onSendToMockups?: (item: LogoHistoryItem) => void
  onCompare?: (items: LogoHistoryItem[]) => void
  /** Filter to show only items with this style ('logo' or 'mockup') */
  filterStyle?: 'logo' | 'mockup'
  /** Compact mode for sidebar placement */
  compact?: boolean
  /** Ref to expose refresh function to parent for triggering refresh after external saves */
  refreshRef?: MutableRefObject<(() => void) | null>
  /** When true, removes the collapsible header and shows content directly with full height */
  alwaysExpanded?: boolean
}

export function LogoHistoryPanel({
  onUseSettings,
  onLoadImage,
  onSendToMockups,
  onCompare,
  filterStyle,
  compact = false,
  refreshRef,
  alwaysExpanded = false
}: LogoHistoryPanelProps) {
  const [isExpanded, setIsExpanded] = useState(false)
  const [showFavoritesOnly, setShowFavoritesOnly] = useState(false)
  const [showClearConfirm, setShowClearConfirm] = useState(false)

  const {
    items,
    totalCount,
    favoritesCount,
    isLoading,
    isSyncing,
    toggleFavorite,
    setRating,
    removeFromHistory,
    clearAllHistory,
    syncFromCloud,
    selectedForComparison,
    toggleComparisonSelection,
    clearComparisonSelection,
    getComparisonItems,
    canAddToComparison,
    selectAll,
    deleteSelected
  } = useLogoHistory()

  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false)
  const [isDeleting, setIsDeleting] = useState(false)

  // Expose syncFromCloud to parent via ref for triggering refresh after external saves
  useEffect(() => {
    if (refreshRef) {
      refreshRef.current = syncFromCloud
    }
    return () => {
      if (refreshRef) {
        refreshRef.current = null
      }
    }
  }, [refreshRef, syncFromCloud])

  // Filter by style first, then by favorites
  const styleFilteredItems = filterStyle
    ? items.filter(i => filterStyle === 'mockup' ? i.style === 'mockup' : i.style !== 'mockup')
    : items

  const displayItems = showFavoritesOnly
    ? styleFilteredItems.filter(i => i.isFavorited)
    : styleFilteredItems

  // Count favorites within filtered items
  const filteredFavoritesCount = styleFilteredItems.filter(i => i.isFavorited).length

  const handleCompare = () => {
    const comparisonItems = getComparisonItems()
    if (comparisonItems.length >= 2 && onCompare) {
      onCompare(comparisonItems)
    }
  }

  // Dynamic labels based on filter
  const historyLabel = filterStyle === 'mockup' ? 'Mockup History' : 'Generation History'
  const displayCount = styleFilteredItems.length

  // Determine if content should be shown
  const showContent = alwaysExpanded || isExpanded

  return (
    <div className={alwaysExpanded ? "h-full flex flex-col" : (compact ? "space-y-1" : "space-y-2")}>
      {/* Header Toggle - only show when not always expanded */}
      {!alwaysExpanded && (
        <button
          onClick={() => setIsExpanded(!isExpanded)}
          className={`w-full flex items-center justify-between bg-zinc-800/50 hover:bg-zinc-800 border border-zinc-700 rounded-lg text-white transition-colors ${
            compact ? "px-2 py-1.5 text-xs" : "px-3 py-2 text-sm"
          }`}
        >
          <div className="flex items-center gap-2">
            <History className={`${compact ? "w-3 h-3" : "w-4 h-4"} text-blue-400`} />
            <span>{historyLabel}</span>
            <span className="text-xs text-zinc-500">({displayCount})</span>
            {filteredFavoritesCount > 0 && (
              <span className="flex items-center gap-1 text-xs text-red-400">
                <Heart className="w-3 h-3 fill-current" />
                {filteredFavoritesCount}
              </span>
            )}
          </div>
          {isExpanded ? (
            <ChevronUp className={`${compact ? "w-3 h-3" : "w-4 h-4"} text-zinc-400`} />
          ) : (
            <ChevronDown className={`${compact ? "w-3 h-3" : "w-4 h-4"} text-zinc-400`} />
          )}
        </button>
      )}

      {/* Always Expanded Header - simple title bar */}
      {alwaysExpanded && (
        <div className="flex items-center justify-between px-1 py-2 border-b border-zinc-700 shrink-0">
          <div className="flex items-center gap-2">
            <History className="w-4 h-4 text-blue-400" />
            <span className="text-sm font-medium text-white">{historyLabel}</span>
            <span className="text-xs text-zinc-500">({displayCount})</span>
            {filteredFavoritesCount > 0 && (
              <span className="flex items-center gap-1 text-xs text-red-400">
                <Heart className="w-3 h-3 fill-current" />
                {filteredFavoritesCount}
              </span>
            )}
          </div>
        </div>
      )}

      {/* Content */}
      {showContent && (
        <div className={alwaysExpanded
          ? "flex-1 flex flex-col space-y-2 overflow-hidden"
          : `bg-zinc-800/30 border border-zinc-700 rounded-lg space-y-2 ${compact ? "p-2 min-w-[320px]" : "p-3 space-y-3"}`
        }>
          {/* Toolbar */}
          <HistoryToolbar
            displayItemsCount={displayItems.length}
            selectedCount={selectedForComparison.length}
            allSelected={selectedForComparison.length === displayItems.length && displayItems.length > 0}
            showFavoritesOnly={showFavoritesOnly}
            showDeleteConfirm={showDeleteConfirm}
            isDeleting={isDeleting}
            isSyncing={isSyncing}
            showClearConfirm={showClearConfirm}
            onSelectAll={() => {
              if (selectedForComparison.length === displayItems.length) {
                clearComparisonSelection()
              } else {
                selectAll()
              }
            }}
            onClearSelection={clearComparisonSelection}
            onToggleFavoritesFilter={() => setShowFavoritesOnly(!showFavoritesOnly)}
            onShowDeleteConfirm={setShowDeleteConfirm}
            onDeleteSelected={async () => {
              setIsDeleting(true)
              await deleteSelected()
              setIsDeleting(false)
            }}
            onCompare={handleCompare}
            onSync={syncFromCloud}
            onShowClearConfirm={setShowClearConfirm}
            onClearAll={clearAllHistory}
          />

          {/* Selection hint */}
          {selectedForComparison.length > 0 && selectedForComparison.length < 2 && (
            <p className="text-[10px] text-zinc-500">
              Select at least 2 logos to compare (max 4)
            </p>
          )}

          {/* History grid */}
          {displayItems.length > 0 ? (
            <div className={`grid gap-2 pr-1 ${
              alwaysExpanded
                ? "grid-cols-4 overflow-y-auto scrollbar-hide max-h-[400px]"
                : `overflow-y-auto ${compact ? "grid-cols-2 max-h-[400px]" : "grid-cols-3 max-h-[300px]"}`
            }`}>
              {displayItems.map((item) => (
                <div key={item.id}>
                  <HistoryItem
                    item={item}
                    isSelected={selectedForComparison.includes(item.id)}
                    onToggleSelect={() => toggleComparisonSelection(item.id)}
                    onToggleFavorite={() => toggleFavorite(item.id)}
                    onSetRating={(rating) => setRating(item.id, rating)}
                    onDelete={() => removeFromHistory(item.id)}
                    onUseSettings={onUseSettings ? () => onUseSettings(item) : () => {}}
                    onLoadImage={onLoadImage ? () => onLoadImage(item) : undefined}
                    onSendToMockups={onSendToMockups ? () => onSendToMockups(item) : undefined}
                    canSelect={true}
                    hideUseSettings={filterStyle === 'mockup'}
                  />
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-4">
              <p className="text-sm text-zinc-500">
                {showFavoritesOnly ? 'No favorites yet' : 'No history yet'}
              </p>
              {showFavoritesOnly && (
                <button
                  onClick={() => setShowFavoritesOnly(false)}
                  className="text-xs text-blue-400 hover:underline mt-1"
                >
                  Show all history
                </button>
              )}
            </div>
          )}

          {/* Footer info */}
          <p className="text-[10px] text-zinc-600 text-center">
            History synced to cloud. Favorite logos for quick access.
          </p>
        </div>
      )}
    </div>
  )
}
