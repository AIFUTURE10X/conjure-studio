"use client"

/**
 * BgRemoverQueue Component
 *
 * Horizontal scrollable thumbnail strip showing queued images with status.
 * Click to select, X to remove. Status: pending/processing/complete/error.
 */

import { X, Loader2, Check, AlertCircle } from 'lucide-react'
import type { QueueItem } from '../../hooks/useBackgroundRemoverState'

interface BgRemoverQueueProps {
  items: QueueItem[]
  selectedId: string | null
  onSelect: (id: string) => void
  onRemove: (id: string) => void
}

export function BgRemoverQueue({ items, selectedId, onSelect, onRemove }: BgRemoverQueueProps) {
  if (items.length === 0) return null

  return (
    <div className="pt-3 mb-4">
      <div className="flex items-center gap-2 mb-2">
        <h4 className="text-xs font-medium text-zinc-400 uppercase tracking-wider leading-relaxed">
          Image Queue
        </h4>
        <span className="text-xs text-zinc-500">
          ({items.filter(i => i.status === 'complete').length}/{items.length} processed)
        </span>
      </div>

      <div className="flex gap-2 overflow-x-auto pb-2 pt-2 -mx-1 px-1">
        {items.map((item) => (
          <QueueThumbnail
            key={item.id}
            item={item}
            isSelected={selectedId === item.id}
            onSelect={() => onSelect(item.id)}
            onRemove={() => onRemove(item.id)}
          />
        ))}
      </div>
    </div>
  )
}

interface QueueThumbnailProps {
  item: QueueItem
  isSelected: boolean
  onSelect: () => void
  onRemove: () => void
}

function QueueThumbnail({ item, isSelected, onSelect, onRemove }: QueueThumbnailProps) {
  const statusColors = {
    pending: 'bg-zinc-600',
    processing: 'bg-blue-500 animate-pulse',
    complete: 'bg-green-500',
    error: 'bg-red-500',
  }

  const StatusIcon = {
    pending: null,
    processing: <Loader2 className="w-3 h-3 animate-spin" />,
    complete: <Check className="w-3 h-3" />,
    error: <AlertCircle className="w-3 h-3" />,
  }

  return (
    <div
      onClick={onSelect}
      className={`
        relative flex-shrink-0 w-20 h-20 rounded-lg overflow-hidden cursor-pointer
        transition-all duration-200 group
        ${isSelected
          ? 'ring-2 ring-[#dbb56e] ring-offset-2 ring-offset-zinc-900'
          : 'ring-1 ring-zinc-700 hover:ring-zinc-500'
        }
      `}
    >
      {/* Thumbnail image */}
      <img
        src={item.originalUrl}
        alt={item.fileName}
        className="w-full h-full object-cover"
      />

      {/* Status badge */}
      <div
        className={`
          absolute bottom-1 left-1 px-1.5 py-0.5 rounded text-white text-[10px]
          flex items-center gap-1
          ${statusColors[item.status]}
        `}
      >
        {StatusIcon[item.status]}
        <span className="capitalize">{item.status}</span>
      </div>

      {/* Remove button */}
      <button
        onClick={(e) => {
          e.stopPropagation()
          onRemove()
        }}
        className="
          absolute top-1 right-1 w-5 h-5 rounded-full
          bg-black/60 hover:bg-red-500 text-white
          flex items-center justify-center
          opacity-0 group-hover:opacity-100 transition-opacity
        "
      >
        <X className="w-3 h-3" />
      </button>

      {/* Processing overlay */}
      {item.status === 'processing' && (
        <div className="absolute inset-0 bg-black/40 flex items-center justify-center">
          <Loader2 className="w-6 h-6 text-white animate-spin" />
        </div>
      )}
    </div>
  )
}
