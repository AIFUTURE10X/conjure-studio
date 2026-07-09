"use client"

/**
 * HistoryItemCard Component
 *
 * Individual card for displaying a history item with preview and actions
 */

import { Card } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Checkbox } from '@/components/ui/checkbox'
import { Clock, Trash2, RotateCcw, Download, Check } from 'lucide-react'
import type { HistoryItem } from '@/lib/history'

interface HistoryItemCardProps {
  item: HistoryItem
  isSelected: boolean
  onToggleSelect: (id: string) => void
  onRestore: (item: HistoryItem) => void
  onDelete: (id: string, e: React.MouseEvent) => void
  onDownload: (imageUrl: string, index: number) => void
}

export function HistoryItemCard({
  item,
  isSelected,
  onToggleSelect,
  onRestore,
  onDelete,
  onDownload,
}: HistoryItemCardProps) {
  return (
    <Card
      className={`bg-zinc-800 border-zinc-700 hover:border-[#c99850]/50 transition-all cursor-pointer group overflow-hidden ${
        isSelected ? 'ring-2 ring-[#c99850] border-[#c99850]' : ''
      }`}
      onClick={() => onRestore(item)}
    >
      {/* Image Preview */}
      <div className="relative aspect-square bg-zinc-900 overflow-hidden">
        <div
          className="absolute top-2 left-2 z-10"
          onClick={(e) => e.stopPropagation()}
        >
          <div className="relative w-5 h-5">
            <Checkbox
              checked={isSelected}
              onCheckedChange={() => onToggleSelect(item.id)}
              className="bg-black/80 border-[#c99850] data-[state=checked]:bg-[#c99850] data-[state=checked]:border-[#c99850] backdrop-blur-sm"
            />
            {isSelected && (
              <Check className="absolute inset-0 w-5 h-5 text-black pointer-events-none" strokeWidth={3} />
            )}
          </div>
        </div>

        {item.imageUrls && item.imageUrls.length > 0 ? (
          <>
            <img
              src={item.imageUrls[0] || "/placeholder.svg"}
              alt="Generated preview"
              className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
            />
            {item.imageUrls.length > 1 && (
              <div className="absolute top-2 right-2 bg-black/70 backdrop-blur-sm text-white text-xs px-2 py-1 rounded-full">
                +{item.imageUrls.length - 1} more
              </div>
            )}

            {item.metadata && (
              <div className="absolute bottom-0 left-0 right-0 p-2 bg-linear-to-t from-black/90 to-transparent opacity-0 group-hover:opacity-100 transition-opacity">
                <div className="flex flex-wrap gap-1">
                  {item.aspectRatio && (
                    <span className="text-xs px-2 py-0.5 bg-[#c99850] text-black font-medium rounded">
                      {item.aspectRatio}
                    </span>
                  )}
                  {item.metadata.style && (
                    <span className="text-xs px-2 py-0.5 bg-[#c99850] text-black font-medium rounded">
                      {item.metadata.style}
                    </span>
                  )}
                  {item.metadata.dimensions && (
                    <span className="text-xs px-2 py-0.5 bg-[#c99850] text-black font-medium rounded">
                      {item.metadata.dimensions}
                    </span>
                  )}
                </div>
              </div>
            )}

            <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-2">
              <Button
                onClick={(e) => {
                  e.stopPropagation()
                  onDownload(item.imageUrls[0], 0)
                }}
                size="sm"
                className="bg-[#c99850] hover:bg-[#dbb56e] text-black"
              >
                <Download className="w-4 h-4 mr-2" />
                Download
              </Button>
              <Button
                size="sm"
                className="bg-[#c99850] hover:bg-[#dbb56e] text-black"
              >
                <RotateCcw className="w-4 h-4 mr-2" />
                Restore
              </Button>
            </div>
          </>
        ) : (
          <div className="w-full h-full flex items-center justify-center text-zinc-600">
            <Clock className="w-12 h-12" />
          </div>
        )}
      </div>

      {/* Details */}
      <div className="p-4">
        {/* Prompt */}
        <p className="text-sm text-white mb-3 line-clamp-2 min-h-[2.5rem]">
          {item.prompt}
        </p>

        {/* Metadata */}
        <div className="flex items-center justify-between text-xs text-zinc-400 mb-3">
          <span className="px-2 py-1 bg-zinc-900 rounded">
            {item.aspectRatio}
          </span>
          <span className="text-zinc-500">
            {new Date(item.timestamp).toLocaleDateString('en-US', {
              month: 'short',
              day: 'numeric',
              hour: '2-digit',
              minute: '2-digit',
            })}
          </span>
        </div>

        {/* Actions */}
        <div className="flex gap-2">
          <Button
            onClick={() => onRestore(item)}
            size="sm"
            className="flex-1 bg-[#c99850]/10 hover:bg-[#c99850]/20 text-[#c99850] border border-[#c99850]/30"
          >
            <RotateCcw className="w-3 h-3 mr-2" />
            Restore
          </Button>
          <Button
            onClick={(e) => onDelete(item.id, e)}
            size="sm"
            variant="ghost"
            className="text-red-400 hover:text-red-300 hover:bg-red-900/20"
          >
            <Trash2 className="w-4 h-4" />
          </Button>
        </div>
      </div>
    </Card>
  )
}
