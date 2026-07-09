"use client"

/**
 * ComparisonView Component
 *
 * Side-by-side comparison modal for 2-4 logos
 */

import { useState } from 'react'
import {
  X,
  GitCompare,
  Download,
  Copy,
  Check,
  Star,
  ArrowRight
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { LogoHistoryItem } from './useLogoHistory'

interface ComparisonViewProps {
  isOpen: boolean
  onClose: () => void
  items: LogoHistoryItem[]
  onSelectWinner: (item: LogoHistoryItem) => void
}

export function ComparisonView({
  isOpen,
  onClose,
  items,
  onSelectWinner
}: ComparisonViewProps) {
  const [copiedId, setCopiedId] = useState<string | null>(null)

  if (!isOpen || items.length < 2) return null

  const handleCopyPrompt = async (item: LogoHistoryItem) => {
    try {
      await navigator.clipboard.writeText(item.prompt)
      setCopiedId(item.id)
      setTimeout(() => setCopiedId(null), 2000)
    } catch (err) {
      console.error('Failed to copy:', err)
    }
  }

  const handleDownload = (item: LogoHistoryItem) => {
    const link = document.createElement('a')
    link.href = item.imageUrl
    link.download = `logo-comparison-${Date.now()}.png`
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
  }

  const gridCols = items.length === 2 ? 'grid-cols-2' : items.length === 3 ? 'grid-cols-3' : 'grid-cols-4'

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/90 backdrop-blur-sm">
      <div className="relative w-full max-w-6xl mx-4 bg-zinc-900 rounded-2xl border border-zinc-700 shadow-2xl max-h-[90vh] flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-zinc-800 shrink-0">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-lg bg-linear-to-r from-purple-500 to-pink-500">
              <GitCompare className="w-5 h-5 text-white" />
            </div>
            <div>
              <h2 className="text-lg font-semibold text-white">Compare Logos</h2>
              <p className="text-xs text-zinc-400">
                Comparing {items.length} logos side by side
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 text-zinc-400 hover:text-white rounded-lg hover:bg-zinc-800 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Comparison Grid */}
        <div className="flex-1 overflow-y-auto p-6">
          <div className={`grid ${gridCols} gap-4`}>
            {items.map((item, index) => (
              <div
                key={item.id}
                className="bg-zinc-800/50 rounded-xl border border-zinc-700 overflow-hidden"
              >
                {/* Logo Label */}
                <div className="px-4 py-2 bg-zinc-800 border-b border-zinc-700 flex items-center justify-between">
                  <span className="text-sm font-medium text-white">
                    Option {index + 1}
                  </span>
                  {item.rating && (
                    <div className="flex items-center gap-0.5">
                      {[...Array(item.rating)].map((_, i) => (
                        <Star key={i} className="w-3 h-3 text-yellow-400 fill-yellow-400" />
                      ))}
                    </div>
                  )}
                </div>

                {/* Logo Image */}
                <div className="aspect-square bg-zinc-900 p-4">
                  <img
                    src={item.imageUrl}
                    alt={`Logo option ${index + 1}`}
                    className="w-full h-full object-contain"
                  />
                </div>

                {/* Prompt */}
                <div className="p-4 border-t border-zinc-700">
                  <p className="text-xs text-zinc-500 mb-1">Prompt:</p>
                  <p className="text-xs text-zinc-300 line-clamp-3" title={item.prompt}>
                    {item.prompt}
                  </p>
                  {item.seed && (
                    <p className="text-[10px] text-zinc-600 mt-2">
                      Seed: {item.seed}
                    </p>
                  )}
                </div>

                {/* Actions */}
                <div className="px-4 py-3 border-t border-zinc-700 flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => handleCopyPrompt(item)}
                      className="p-1.5 rounded bg-zinc-700 text-zinc-400 hover:text-white transition-colors"
                      title="Copy prompt"
                    >
                      {copiedId === item.id ? (
                        <Check className="w-4 h-4 text-green-400" />
                      ) : (
                        <Copy className="w-4 h-4" />
                      )}
                    </button>
                    <button
                      onClick={() => handleDownload(item)}
                      className="p-1.5 rounded bg-zinc-700 text-zinc-400 hover:text-white transition-colors"
                      title="Download"
                    >
                      <Download className="w-4 h-4" />
                    </button>
                  </div>
                  <Button
                    onClick={() => {
                      onSelectWinner(item)
                      onClose()
                    }}
                    size="sm"
                    className="h-7 px-3 text-xs bg-linear-to-r from-purple-500 to-pink-500 text-white hover:from-purple-600 hover:to-pink-600"
                  >
                    <ArrowRight className="w-3 h-3 mr-1" />
                    Use This
                  </Button>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Footer */}
        <div className="px-6 py-4 border-t border-zinc-800 shrink-0">
          <p className="text-xs text-zinc-500 text-center">
            Click &quot;Use This&quot; to load the logo and its settings into the editor
          </p>
        </div>
      </div>
    </div>
  )
}
