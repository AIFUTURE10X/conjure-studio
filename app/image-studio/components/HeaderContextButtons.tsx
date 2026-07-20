"use client"

/**
 * HeaderContextButtons Component
 *
 * Context-specific buttons that appear in the header.
 * Only shown when Image Generator is active.
 * Contains: History, Favorites, Restore Parameters
 */

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Clock, FolderOpen, Heart, Settings } from 'lucide-react'
import { CollectionsModal } from './Collections/CollectionsModal'

interface HeaderContextButtonsProps {
  favoritesCount: number
  hasStoredParams: boolean
  onShowHistory: () => void
  onRestoreParameters: () => void
  onShowFavorites: () => void
}

export function HeaderContextButtons({
  favoritesCount,
  hasStoredParams,
  onShowHistory,
  onRestoreParameters,
  onShowFavorites,
}: HeaderContextButtonsProps) {
  const [showCollections, setShowCollections] = useState(false)

  return (
    <div className="flex items-center gap-2">
      {/* History Button */}
      <Button
        onClick={onShowHistory}
        variant="ghost"
        size="sm"
        className="text-zinc-400 hover:text-white flex items-center gap-2"
      >
        <Clock className="w-4 h-4" />
        <span className="text-sm">History</span>
      </Button>

      {/* Favorites Button */}
      <Button
        onClick={onShowFavorites}
        variant="ghost"
        size="sm"
        className="text-zinc-400 hover:text-white flex items-center gap-2"
      >
        <Heart className="w-4 h-4" />
        <span className="text-sm">Favorites ({favoritesCount})</span>
      </Button>

      {/* Collections Button */}
      <Button
        onClick={() => setShowCollections(true)}
        variant="ghost"
        size="sm"
        className="text-zinc-400 hover:text-white flex items-center gap-2"
      >
        <FolderOpen className="w-4 h-4" />
        <span className="text-sm">Collections</span>
      </Button>
      <CollectionsModal open={showCollections} onOpenChange={setShowCollections} />

      {/* Restore Parameters Button - only shown if stored params exist */}
      {hasStoredParams && (
        <Button
          onClick={onRestoreParameters}
          size="sm"
          className="px-3 py-1.5 bg-linear-to-r from-[#c99850] to-[#dbb56e] text-black hover:from-[#dbb56e] hover:to-[#c99850] font-medium flex items-center gap-2"
        >
          <Settings className="w-4 h-4" />
          <span className="text-sm">Restore Parameters</span>
        </Button>
      )}
    </div>
  )
}
