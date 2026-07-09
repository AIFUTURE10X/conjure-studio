"use client"

/**
 * HistoryHeader Component
 *
 * Header with title, selection controls, and action buttons
 */

import { Button } from '@/components/ui/button'
import { Checkbox } from '@/components/ui/checkbox'
import { X, Clock, Trash2, RefreshCw } from 'lucide-react'
import { NeonStatusBadge } from '../NeonStatusBadge'

interface HistoryHeaderProps {
  historyCount: number
  selectedCount: number
  allSelected: boolean
  loading: boolean
  isDeleting: boolean
  onSelectAll: () => void
  onSync: () => void
  onBulkDelete: () => void
  onClearAll: () => void
  onClose: () => void
}

export function HistoryHeader({
  historyCount,
  selectedCount,
  allSelected,
  loading,
  isDeleting,
  onSelectAll,
  onSync,
  onBulkDelete,
  onClearAll,
  onClose,
}: HistoryHeaderProps) {
  return (
    <div className="flex items-center justify-between p-6 border-b border-zinc-800">
      <div className="flex items-center gap-3">
        <div className="w-10 h-10 rounded-lg bg-linear-to-br from-[#c99850] to-[#dbb56e] flex items-center justify-center">
          <Clock className="w-5 h-5 text-black" />
        </div>
        <div className="flex items-center gap-3">
          <div>
            <h2 className="text-xl font-bold text-white">Parameter History</h2>
            <p className="text-sm text-zinc-400">
              {selectedCount > 0
                ? `${selectedCount} selected`
                : `${historyCount} ${historyCount === 1 ? 'item' : 'items'} saved`}
            </p>
          </div>
          <NeonStatusBadge endpoint="/api/history/test-connection" />
        </div>
        {historyCount > 0 && (
          <div className="flex items-center gap-2 ml-4">
            <Checkbox
              checked={allSelected && historyCount > 0}
              onCheckedChange={onSelectAll}
              className="border-[#c99850] data-[state=checked]:bg-[#c99850] data-[state=checked]:border-[#c99850]"
            />
            <span className="text-xs text-zinc-400">Select All</span>
          </div>
        )}
      </div>
      <div className="flex items-center gap-2">
        <Button
          onClick={onSync}
          disabled={loading}
          variant="ghost"
          size="sm"
          className="text-[#c99850] hover:text-[#dbb56e] hover:bg-[#c99850]/10"
        >
          <RefreshCw className={`w-4 h-4 mr-2 ${loading ? 'animate-spin' : ''}`} />
          Sync from Cloud
        </Button>
        {selectedCount > 0 ? (
          <Button
            onClick={onBulkDelete}
            disabled={isDeleting}
            variant="ghost"
            size="sm"
            className="text-red-400 hover:text-red-300 hover:bg-red-900/20"
          >
            <Trash2 className="w-4 h-4 mr-2" />
            Delete Selected ({selectedCount})
          </Button>
        ) : historyCount > 0 ? (
          <Button
            onClick={onClearAll}
            variant="ghost"
            size="sm"
            className="text-red-400 hover:text-red-300 hover:bg-red-900/20"
          >
            <Trash2 className="w-4 h-4 mr-2" />
            Clear All
          </Button>
        ) : null}
        <Button
          onClick={onClose}
          variant="ghost"
          size="icon"
          className="text-zinc-400 hover:text-white"
        >
          <X className="w-5 h-5" />
        </Button>
      </div>
    </div>
  )
}
