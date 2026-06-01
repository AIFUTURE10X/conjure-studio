"use client"

/**
 * BatchGenerator Component
 *
 * Modal for generating 4 logo variations simultaneously
 */

import { X, Sparkles, Grid2X2, Loader2 } from 'lucide-react'
import { BatchResultCard } from './BatchResultCard'
import { useBatchGeneration, BatchItem, BatchGenerationOptions } from '../../../hooks/useBatchGeneration'
import { useFavorites } from '../../SimpleFavorites'
import { GeneratedLogo } from '../../../hooks/useLogoGeneration'

interface BatchGeneratorProps {
  isOpen: boolean
  onClose: () => void
  options: BatchGenerationOptions
  onSelectLogo: (logo: GeneratedLogo) => void
}

export function BatchGenerator({
  isOpen,
  onClose,
  options,
  onSelectLogo,
}: BatchGeneratorProps) {
  const { items, isGenerating, generateBatch, retryItem, clearBatch } = useBatchGeneration()
  const { toggleFavorite, isFavorite } = useFavorites()

  // Start generation when modal opens
  const handleStartGeneration = () => {
    generateBatch(options)
  }

  // Handle selecting a logo
  const handleSelect = (item: BatchItem) => {
    if (item.logo) {
      onSelectLogo(item.logo)
      onClose()
    }
  }

  // Handle retry
  const handleRetry = (itemId: string) => {
    retryItem(itemId, options)
  }

  // Handle download
  const handleDownload = (item: BatchItem) => {
    if (!item.logo) return
    const link = document.createElement('a')
    link.href = item.logo.url
    const sanitizedPrompt = item.logo.prompt
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .substring(0, 20)
    link.download = `logo-${sanitizedPrompt}-${item.seed}.png`
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
  }

  // Handle favorite
  const handleFavorite = (item: BatchItem) => {
    if (!item.logo) return
    toggleFavorite(item.logo.url, {
      style: item.logo.style,
      params: {
        prompt: item.logo.prompt,
        aspectRatio: item.logo.aspectRatio,
        seed: item.logo.seed,
      },
    })
  }

  // Handle close
  const handleClose = () => {
    clearBatch()
    onClose()
  }

  // Count completed items
  const completedCount = items.filter((i) => i.status === 'completed').length
  const totalCount = items.length || 4

  if (!isOpen) return null

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm">
      <div className="relative w-full max-w-md bg-zinc-900 rounded-2xl border border-zinc-700 shadow-2xl">
        {/* Header */}
        <div className="flex items-center justify-between px-4 py-3 border-b border-zinc-800">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-lg bg-linear-to-r from-purple-500 to-pink-500">
              <Grid2X2 className="w-5 h-5 text-white" />
            </div>
            <div>
              <h2 className="text-lg font-semibold text-white">Batch Generation</h2>
              <p className="text-xs text-zinc-400">
                {isGenerating
                  ? `Generating ${completedCount}/${totalCount} variations...`
                  : items.length > 0
                  ? `${completedCount} variations ready`
                  : 'Generate 4 logo variations at once'}
              </p>
            </div>
          </div>
          <button
            onClick={handleClose}
            className="p-2 text-zinc-400 hover:text-white rounded-lg hover:bg-zinc-800 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="p-3">
          {/* Prompt Preview */}
          <div className="mb-3 p-2 bg-zinc-800/50 rounded-lg border border-zinc-700/50">
            <p className="text-xs text-zinc-400 mb-1">Prompt:</p>
            <p className="text-sm text-white line-clamp-2">{options.prompt}</p>
          </div>

          {/* Generation Grid or Start Button */}
          {items.length === 0 ? (
            <div className="flex flex-col items-center py-12">
              <div className="p-4 rounded-full bg-purple-500/20 mb-4">
                <Sparkles className="w-8 h-8 text-purple-400" />
              </div>
              <h3 className="text-lg font-medium text-white mb-2">
                Ready to Generate
              </h3>
              <p className="text-sm text-zinc-400 text-center mb-6 max-w-md">
                Click below to generate 4 logo variations with different seeds.
                Each variation will have a unique look while keeping your settings.
              </p>
              <button
                onClick={handleStartGeneration}
                className="flex items-center gap-2 px-6 py-3 bg-linear-to-r from-purple-500 to-pink-500 text-white rounded-lg font-medium hover:opacity-90 transition-all"
              >
                <Grid2X2 className="w-5 h-5" />
                Generate 4 Variations
              </button>
            </div>
          ) : (
            <div className="grid grid-cols-2 gap-2">
              {items.map((item, index) => (
                <BatchResultCard
                  key={item.id}
                  item={item}
                  index={index}
                  onSelect={handleSelect}
                  onRetry={handleRetry}
                  onDownload={handleDownload}
                  onFavorite={handleFavorite}
                  isFavorite={item.logo ? isFavorite(item.logo.url) : false}
                />
              ))}
            </div>
          )}
        </div>

        {/* Footer - Show when generation is complete */}
        {items.length > 0 && !isGenerating && (
          <div className="flex items-center justify-between px-4 py-3 border-t border-zinc-800">
            <button
              onClick={handleStartGeneration}
              className="flex items-center gap-2 px-4 py-2 bg-zinc-800 hover:bg-zinc-700 text-white rounded-lg text-sm transition-colors"
            >
              <Sparkles className="w-4 h-4" />
              Generate New Set
            </button>
            <p className="text-xs text-zinc-500">
              Click on any variation to use it
            </p>
          </div>
        )}

        {/* Loading Overlay */}
        {isGenerating && (
          <div className="absolute bottom-0 left-0 right-0 h-1 bg-zinc-800 overflow-hidden">
            <div
              className="h-full bg-linear-to-r from-purple-500 to-pink-500 transition-all duration-300"
              style={{ width: `${(completedCount / totalCount) * 100}%` }}
            />
          </div>
        )}
      </div>
    </div>
  )
}
