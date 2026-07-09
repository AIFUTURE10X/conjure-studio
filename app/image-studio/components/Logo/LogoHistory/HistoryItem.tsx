"use client"

/**
 * HistoryItem Component
 *
 * Single history entry with thumbnail, actions, and comparison checkbox
 */

import { useState, useEffect } from 'react'
import {
  Heart,
  Star,
  Trash2,
  Copy,
  RotateCcw,
  Check,
  MoreVertical,
  ImageIcon,
  ImagePlus,
  Scissors,
  Layout
} from 'lucide-react'
import { LogoHistoryItem } from './useLogoHistory'

interface HistoryItemProps {
  item: LogoHistoryItem
  isSelected: boolean
  onToggleSelect: () => void
  onToggleFavorite: () => void
  onSetRating: (rating: 1 | 2 | 3 | 4 | 5 | undefined) => void
  onDelete: () => void
  onUseSettings: () => void
  onLoadImage?: () => void
  /** Send this logo directly to the mockups panel */
  onSendToMockups?: () => void
  canSelect: boolean
  /** Hide the "Use Settings" button (for mockups that don't have generation settings) */
  hideUseSettings?: boolean
}

export function HistoryItem({
  item,
  isSelected,
  onToggleSelect,
  onToggleFavorite,
  onSetRating,
  onDelete,
  onUseSettings,
  onLoadImage,
  onSendToMockups,
  canSelect,
  hideUseSettings = false
}: HistoryItemProps) {
  const [showMenu, setShowMenu] = useState(false)
  const [copied, setCopied] = useState(false)
  const [fileSize, setFileSize] = useState<string | null>(null)

  // Calculate file size on mount
  useEffect(() => {
    if (item.imageUrl) {
      fetch(item.imageUrl)
        .then(res => res.blob())
        .then(blob => {
          const mb = blob.size / (1024 * 1024)
          setFileSize(mb >= 1 ? `${mb.toFixed(1)} MB` : `${(blob.size / 1024).toFixed(0)} KB`)
        })
        .catch(() => setFileSize(null))
    }
  }, [item.imageUrl])

  const handleCopyPrompt = async () => {
    try {
      await navigator.clipboard.writeText(item.prompt)
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    } catch (err) {
      console.error('Failed to copy:', err)
    }
  }

  const formatTime = (timestamp: number) => {
    const date = new Date(timestamp)
    const now = new Date()
    const diffMs = now.getTime() - date.getTime()
    const diffMins = Math.floor(diffMs / 60000)
    const diffHours = Math.floor(diffMins / 60)

    if (diffMins < 1) return 'Just now'
    if (diffMins < 60) return `${diffMins}m ago`
    if (diffHours < 24) return `${diffHours}h ago`
    return date.toLocaleDateString()
  }

  return (
    <div
      className={`relative group p-2 rounded-lg border transition-all ${
        isSelected
          ? 'border-purple-500 bg-purple-500/10'
          : 'border-zinc-700 bg-zinc-800/50 hover:border-zinc-600'
      }`}
    >
      {/* Selection checkbox */}
      <button
        onClick={onToggleSelect}
        disabled={!canSelect && !isSelected}
        className={`absolute top-1 left-1 z-10 w-5 h-5 rounded flex items-center justify-center transition-all ${
          isSelected
            ? 'bg-purple-500 text-white'
            : canSelect
              ? 'bg-zinc-700/80 text-zinc-400 opacity-0 group-hover:opacity-100'
              : 'bg-zinc-700/50 text-zinc-600 cursor-not-allowed'
        }`}
      >
        {isSelected && <Check className="w-3 h-3" />}
      </button>

      {/* Thumbnail */}
      <div className="relative aspect-square rounded overflow-hidden mb-2 bg-zinc-900">
        <img
          src={item.imageUrl}
          alt="Generated logo"
          className="w-full h-full object-contain"
        />
        {/* Favorite badge */}
        {item.isFavorited && (
          <div className="absolute top-1 right-1 w-5 h-5 rounded-full bg-red-500 flex items-center justify-center">
            <Heart className="w-3 h-3 text-white fill-white" />
          </div>
        )}
      </div>

      {/* Info */}
      <div className="space-y-1">
        <div className="flex items-center gap-1 flex-wrap">
          <p className="text-[10px] text-zinc-500">{formatTime(item.timestamp)}</p>
          {item.config?.wasReplication && (
            <span className="flex items-center gap-0.5 px-1 py-0.5 bg-purple-500/20 text-purple-400 rounded text-[8px]" title="Created from reference image">
              <ImageIcon className="w-2 h-2" />
              Ref
            </span>
          )}
          {item.config?.wasBackgroundRemoval && (
            <span className="flex items-center gap-0.5 px-1 py-0.5 bg-green-500/20 text-green-400 rounded text-[8px]" title="Background removed">
              <Scissors className="w-2 h-2" />
              BG
            </span>
          )}
          {item.config?.wasMockup && (
            <span className="flex items-center gap-0.5 px-1 py-0.5 bg-blue-500/20 text-blue-400 rounded text-[8px]" title={`${item.config.mockupType} mockup`}>
              <Layout className="w-2 h-2" />
              Mockup
            </span>
          )}
          {fileSize && (
            <span
              className="px-1 py-0.5 rounded text-[8px] font-medium"
              style={{ background: 'linear-gradient(135deg, #c99850 0%, #dbb56e 50%, #c99850 100%)', color: '#000' }}
              title="File size"
            >
              {fileSize}
            </span>
          )}
        </div>
        <p className="text-[10px] text-zinc-400 line-clamp-2" title={item.prompt}>
          {item.prompt === '[Reference Image]' ? 'From reference image' : item.prompt.substring(0, 50)}{item.prompt.length > 50 && item.prompt !== '[Reference Image]' ? '...' : ''}
        </p>

        {/* Rating stars */}
        <div className="flex items-center gap-0.5">
          {[1, 2, 3, 4, 5].map((star) => (
            <button
              key={star}
              onClick={() => onSetRating(item.rating === star ? undefined : star as 1|2|3|4|5)}
              className="p-0.5"
            >
              <Star
                className={`w-3 h-3 ${
                  item.rating && star <= item.rating
                    ? 'text-yellow-400 fill-yellow-400'
                    : 'text-zinc-600'
                }`}
              />
            </button>
          ))}
        </div>
      </div>

      {/* Actions */}
      <div className="flex items-center justify-between mt-2 pt-2 border-t border-zinc-700">
        <div className="flex items-center gap-1">
          <button
            onClick={onToggleFavorite}
            className={`p-1 rounded transition-colors ${
              item.isFavorited
                ? 'text-red-400 hover:text-red-300'
                : 'text-pink-400/70 hover:text-pink-400'
            }`}
            title={item.isFavorited ? 'Remove from favorites' : 'Add to favorites'}
          >
            <Heart className={`w-3.5 h-3.5 ${item.isFavorited ? 'fill-current' : ''}`} />
          </button>
          <button
            onClick={handleCopyPrompt}
            className="p-1 rounded text-blue-400/70 hover:text-blue-400 transition-colors"
            title="Copy prompt"
          >
            {copied ? (
              <Check className="w-3.5 h-3.5 text-green-400" />
            ) : (
              <Copy className="w-3.5 h-3.5" />
            )}
          </button>
          {!hideUseSettings && (
            <button
              onClick={onUseSettings}
              className="p-1 rounded text-amber-400/70 hover:text-amber-400 transition-colors"
              title="Use these settings"
            >
              <RotateCcw className="w-3.5 h-3.5" />
            </button>
          )}
          {onLoadImage && (
            <button
              onClick={onLoadImage}
              className="p-1 rounded text-purple-400/70 hover:text-purple-400 transition-colors"
              title="Load image to preview"
            >
              <ImagePlus className="w-3.5 h-3.5" />
            </button>
          )}
          {onSendToMockups && (
            <button
              onClick={onSendToMockups}
              className="p-1 rounded text-cyan-400/70 hover:text-cyan-400 transition-colors"
              title="Send to mockups"
            >
              <Layout className="w-3.5 h-3.5" />
            </button>
          )}
        </div>

        {/* More menu */}
        <div className="relative">
          <button
            onClick={() => setShowMenu(!showMenu)}
            className="p-1 rounded text-zinc-500 hover:text-white transition-colors"
          >
            <MoreVertical className="w-3.5 h-3.5" />
          </button>
          {showMenu && (
            <>
              <div
                className="fixed inset-0 z-10"
                onClick={() => setShowMenu(false)}
              />
              <div className="absolute right-0 bottom-full mb-1 w-28 bg-zinc-800 border border-zinc-700 rounded-lg shadow-xl z-20 overflow-hidden">
                <button
                  onClick={() => {
                    onDelete()
                    setShowMenu(false)
                  }}
                  className="w-full flex items-center gap-2 px-3 py-2 text-xs text-red-400 hover:bg-zinc-700"
                >
                  <Trash2 className="w-3 h-3" />
                  Delete
                </button>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  )
}
