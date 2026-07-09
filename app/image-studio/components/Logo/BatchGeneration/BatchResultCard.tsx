"use client"

/**
 * BatchResultCard Component
 *
 * Individual card for batch generation results
 */

import { Loader2, Check, AlertCircle, RotateCcw, Download, Heart, Copy } from 'lucide-react'
import { BatchItem } from '../../../hooks/useBatchGeneration'
import { useState } from 'react'

interface BatchResultCardProps {
  item: BatchItem
  index: number
  onSelect: (item: BatchItem) => void
  onRetry: (itemId: string) => void
  onDownload: (item: BatchItem) => void
  onFavorite: (item: BatchItem) => void
  isFavorite?: boolean
  isSelected?: boolean
}

export function BatchResultCard({
  item,
  index,
  onSelect,
  onRetry,
  onDownload,
  onFavorite,
  isFavorite = false,
  isSelected = false,
}: BatchResultCardProps) {
  const [copied, setCopied] = useState(false)

  const handleCopyToClipboard = async () => {
    if (!item.logo?.url) return
    try {
      const response = await fetch(item.logo.url)
      const blob = await response.blob()
      await navigator.clipboard.write([
        new ClipboardItem({ [blob.type]: blob }),
      ])
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    } catch (err) {
      console.error('Failed to copy:', err)
    }
  }

  return (
    <div
      className={`relative rounded-xl overflow-hidden border-2 transition-all ${
        isSelected
          ? 'border-purple-500 ring-2 ring-purple-500/30'
          : item.status === 'completed'
          ? 'border-zinc-700 hover:border-purple-500/50'
          : 'border-zinc-800'
      }`}
    >
      {/* Variation Number Badge */}
      <div className="absolute top-2 left-2 z-10 px-2 py-0.5 bg-black/60 backdrop-blur-sm rounded-full text-xs text-white font-medium">
        #{index + 1}
      </div>

      {/* Content Area */}
      <div className="aspect-square bg-zinc-800 flex items-center justify-center">
        {item.status === 'pending' && (
          <div className="text-zinc-500 text-sm">Waiting...</div>
        )}

        {item.status === 'generating' && (
          <div className="flex flex-col items-center gap-2">
            <Loader2 className="w-8 h-8 text-purple-400 animate-spin" />
            <span className="text-xs text-zinc-400">Generating...</span>
          </div>
        )}

        {item.status === 'error' && (
          <div className="flex flex-col items-center gap-2 p-4 text-center">
            <AlertCircle className="w-8 h-8 text-red-400" />
            <span className="text-xs text-red-400">{item.error}</span>
            <button
              onClick={() => onRetry(item.id)}
              className="flex items-center gap-1 px-3 py-1.5 bg-zinc-700 hover:bg-zinc-600 rounded-lg text-xs text-white transition-colors"
            >
              <RotateCcw className="w-3 h-3" />
              Retry
            </button>
          </div>
        )}

        {item.status === 'completed' && item.logo && (
          <img
            src={item.logo.url}
            alt={`Variation ${index + 1}`}
            className="w-full h-full object-contain p-2 cursor-pointer"
            onClick={() => onSelect(item)}
          />
        )}
      </div>

      {/* Action Bar - Only show for completed items */}
      {item.status === 'completed' && item.logo && (
        <div className="flex items-center justify-between p-2 bg-zinc-900 border-t border-zinc-800">
          {/* Seed Info */}
          <span className="text-[10px] text-zinc-500 font-mono">
            Seed: {item.seed}
          </span>

          {/* Action Buttons */}
          <div className="flex items-center gap-1">
            <button
              onClick={() => onFavorite(item)}
              className={`p-1.5 rounded-lg transition-colors ${
                isFavorite
                  ? 'text-red-400 bg-red-500/20'
                  : 'text-zinc-400 hover:text-red-400 hover:bg-zinc-800'
              }`}
              title="Add to favorites"
            >
              <Heart className={`w-3.5 h-3.5 ${isFavorite ? 'fill-current' : ''}`} />
            </button>

            <button
              onClick={handleCopyToClipboard}
              className="p-1.5 rounded-lg text-zinc-400 hover:text-white hover:bg-zinc-800 transition-colors"
              title="Copy to clipboard"
            >
              {copied ? (
                <Check className="w-3.5 h-3.5 text-green-400" />
              ) : (
                <Copy className="w-3.5 h-3.5" />
              )}
            </button>

            <button
              onClick={() => onDownload(item)}
              className="p-1.5 rounded-lg text-zinc-400 hover:text-white hover:bg-zinc-800 transition-colors"
              title="Download"
            >
              <Download className="w-3.5 h-3.5" />
            </button>

            <button
              onClick={() => onSelect(item)}
              className="px-2 py-1 rounded-lg bg-purple-500/20 text-purple-400 hover:bg-purple-500/30 text-xs font-medium transition-colors"
            >
              Use
            </button>
          </div>
        </div>
      )}
    </div>
  )
}
