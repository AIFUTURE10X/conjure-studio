"use client"

import { useState, useEffect, useMemo } from 'react'
import { Heart, X, Download, RotateCcw, Trash2, Check } from 'lucide-react'
import { NeonStatusBadge } from '../NeonStatusBadge'
import { ImageLightbox } from '../ImageLightbox'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import { Checkbox } from '@/components/ui/checkbox'
import { usePreviewLightbox } from '../../hooks/usePreviewLightbox'
import type { FavoriteImage } from '@/lib/db/dbService'

interface FavoritesModalProps {
  favorites: FavoriteImage[]
  onClose: () => void
  onRemove: (url: string) => void
  onClearAll: () => void
  onRestoreParameters?: (params: any, imageUrl?: string) => void
}

export function FavoritesModal({ favorites, onClose, onRemove, onClearAll, onRestoreParameters }: FavoritesModalProps) {
  const [selectedItems, setSelectedItems] = useState<Set<string>>(new Set())
  const [isDeleting, setIsDeleting] = useState(false)
  const previewImages = useMemo(() => favorites.map((fav) => ({ url: fav.url })), [favorites])
  const lightbox = usePreviewLightbox(previewImages)

  const handleToggleSelect = (url: string) => {
    setSelectedItems(prev => {
      const newSet = new Set(prev)
      newSet.has(url) ? newSet.delete(url) : newSet.add(url)
      return newSet
    })
  }

  const handleSelectAll = () => {
    setSelectedItems(selectedItems.size === favorites.length ? new Set() : new Set(favorites.map(f => f.url)))
  }

  const handleBulkDelete = async () => {
    if (selectedItems.size === 0 || !confirm(`Delete ${selectedItems.size} selected image(s)?`)) return
    setIsDeleting(true)
    try {
      for (const url of selectedItems) await onRemove(url)
      setSelectedItems(new Set())
    } finally {
      setIsDeleting(false)
    }
  }

  const handleDownload = async (url: string, index: number) => {
    try {
      const response = await fetch(url, { mode: 'cors', cache: 'no-cache' })
      const blob = await response.blob()
      const blobUrl = URL.createObjectURL(blob)
      const link = document.createElement('a')
      link.href = blobUrl
      link.download = `favorite-${index + 1}-${Date.now()}.png`
      link.style.display = 'none'
      document.body.appendChild(link)
      link.click()
      setTimeout(() => { document.body.removeChild(link); URL.revokeObjectURL(blobUrl) }, 100)
    } catch (error) {
      console.error('[v0] Download failed:', error)
    }
  }

  const handleRestore = (fav: FavoriteImage) => {
    // Support both 'params' (new) and 'parameters' (legacy) keys
    const params = fav.metadata?.params || fav.metadata?.parameters
    if (params && onRestoreParameters) {
      // Bring the image back into the results canvas AND reload its settings
      onRestoreParameters(params, fav.url)
      onClose()
    }
  }

  return (
    <div className="fixed inset-0 z-50 bg-black/90 flex items-center justify-center p-4">
      <Card className="bg-zinc-900 border-[#c99850]/30 max-w-5xl w-full max-h-[90vh] overflow-hidden flex flex-col">
        <div className="flex items-center justify-between p-4 border-b border-zinc-800">
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-3">
              <div>
                <h2 className="text-xl font-bold text-white">Favorites</h2>
                <p className="text-xs text-zinc-400">{selectedItems.size > 0 ? `${selectedItems.size} selected` : `${favorites.length} saved images`}</p>
              </div>
              <NeonStatusBadge endpoint="/api/favorites/test-connection" />
            </div>
            {favorites.length > 0 && (
              <div className="flex items-center gap-2">
                <Checkbox checked={selectedItems.size === favorites.length && favorites.length > 0} onCheckedChange={handleSelectAll} className="border-[#c99850]" />
                <span className="text-xs text-zinc-400">Select All</span>
              </div>
            )}
          </div>
          <div className="flex gap-2">
            {selectedItems.size > 0 && (
              <Button onClick={handleBulkDelete} size="sm" disabled={isDeleting} className="bg-red-900/20 hover:bg-red-900/30 text-red-400">
                <Trash2 className="w-4 h-4 mr-2" />Delete Selected ({selectedItems.size})
              </Button>
            )}
            {favorites.length > 0 && selectedItems.size === 0 && (
              <Button onClick={onClearAll} size="sm" className="bg-red-900/20 hover:bg-red-900/30 text-red-400">
                <Trash2 className="w-4 h-4 mr-2" />Clear All
              </Button>
            )}
            <Button onClick={onClose} size="sm" variant="ghost" className="text-zinc-400 hover:text-white"><X className="w-4 h-4" /></Button>
          </div>
        </div>

        <div className="flex-1 overflow-y-auto p-4">
          {favorites.length === 0 ? (
            <div className="text-center py-12">
              <Heart className="w-16 h-16 text-zinc-700 mx-auto mb-4" />
              <p className="text-zinc-400">No favorites yet</p>
              <p className="text-xs text-zinc-500 mt-2">Click the heart button on generated images to save them</p>
            </div>
          ) : (
            <div className="grid grid-cols-3 gap-4">
              {favorites.map((fav, idx) => (
                <FavoriteCard
                  key={idx}
                  fav={fav}
                  idx={idx}
                  isSelected={selectedItems.has(fav.url)}
                  onToggleSelect={handleToggleSelect}
                  onDownload={handleDownload}
                  onRemove={onRemove}
                  onRestore={handleRestore}
                  hasRestoreHandler={!!onRestoreParameters}
                  onPreview={() => lightbox.open(idx)}
                />
              ))}
            </div>
          )}
        </div>
      </Card>

      <ImageLightbox
        isOpen={lightbox.isOpen}
        images={previewImages}
        currentIndex={lightbox.index ?? 0}
        onClose={lightbox.close}
        onNavigate={lightbox.navigate}
        onDownload={() => void lightbox.download()}
      />
    </div>
  )
}

interface FavoriteCardProps {
  fav: FavoriteImage
  idx: number
  isSelected: boolean
  onToggleSelect: (url: string) => void
  onDownload: (url: string, idx: number) => void
  onRemove: (url: string) => void
  onRestore: (fav: FavoriteImage) => void
  hasRestoreHandler: boolean
  onPreview: () => void
}

function FavoriteCard({ fav, idx, isSelected, onToggleSelect, onDownload, onRemove, onRestore, hasRestoreHandler, onPreview }: FavoriteCardProps) {
  const [fileSize, setFileSize] = useState<string | null>(null)

  // Calculate file size on mount (fallback if metadata.fileSize is missing)
  useEffect(() => {
    if (fav.metadata?.fileSize) {
      setFileSize(fav.metadata.fileSize)
    } else if (fav.url) {
      fetch(fav.url)
        .then(res => res.blob())
        .then(blob => {
          const mb = blob.size / (1024 * 1024)
          setFileSize(mb >= 1 ? `${mb.toFixed(1)} MB` : `${(blob.size / 1024).toFixed(0)} KB`)
        })
        .catch(() => setFileSize(null))
    }
  }, [fav.url, fav.metadata?.fileSize])

  return (
    <div className="relative group">
      <div className="absolute top-2 left-2 z-20">
        <div className="relative">
          <Checkbox
            checked={isSelected}
            onCheckedChange={() => onToggleSelect(fav.url)}
            className="bg-black/80 border-[#c99850] backdrop-blur-sm data-[state=checked]:bg-[#c99850] data-[state=checked]:border-[#c99850]"
          />
          {isSelected && <div className="absolute inset-0 flex items-center justify-center pointer-events-none"><Check className="w-3 h-3 text-black stroke-3" /></div>}
        </div>
      </div>

      <img src={fav.url || "/placeholder.svg"} alt={`Favorite ${idx + 1}`} className={`w-full aspect-square object-cover rounded-lg transition-all ${isSelected ? 'ring-2 ring-[#c99850]' : ''}`} />

      {(fav.metadata || fileSize) && (
        <div className="absolute bottom-0 left-0 right-0 p-2 bg-linear-to-t from-black/90 to-transparent opacity-0 group-hover:opacity-100 transition-opacity">
          <div className="flex flex-wrap gap-1">
            {fav.metadata?.ratio && <span className="text-xs px-2 py-0.5 bg-[#c99850] text-black font-medium rounded">{fav.metadata.ratio}</span>}
            {fav.metadata?.style && <span className="text-xs px-2 py-0.5 bg-[#c99850] text-black font-medium rounded">{fav.metadata.style}</span>}
            {fav.metadata?.dimensions && <span className="text-xs px-2 py-0.5 bg-[#c99850] text-black font-medium rounded">{fav.metadata.dimensions}</span>}
            {fileSize && <span className="text-xs px-2 py-0.5 font-medium rounded" style={{ background: 'linear-gradient(135deg, #c99850 0%, #dbb56e 50%, #c99850 100%)', color: '#000' }}>{fileSize}</span>}
            {(fav.metadata?.params || fav.metadata?.parameters) && <span className="text-xs px-2 py-0.5 bg-green-600 text-white font-medium rounded">Has Parameters</span>}
          </div>
        </div>
      )}

      <div className="absolute top-2 right-2 flex gap-1 transition-opacity z-20">
        {(fav.metadata?.params || fav.metadata?.parameters) && hasRestoreHandler && (
          <Button onClick={(e) => { e.stopPropagation(); onRestore(fav) }} size="sm" className="bg-[#c99850] hover:bg-[#dbb56e] text-black backdrop-blur-sm h-8 px-3" title="Restore image & settings to the generator">
            <RotateCcw className="w-4 h-4 mr-1" />Restore
          </Button>
        )}
        <Button onClick={(e) => { e.stopPropagation(); onDownload(fav.url, idx) }} size="sm" className="bg-black/80 hover:bg-black/90 text-white backdrop-blur-sm h-8 px-2"><Download className="w-4 h-4" /></Button>
        <Button onClick={(e) => { e.stopPropagation(); onRemove(fav.url) }} size="sm" className="bg-red-500/80 hover:bg-red-600/90 text-white backdrop-blur-sm h-8 px-2"><X className="w-4 h-4" /></Button>
      </div>

      {/* Click the image for the large lightbox view; Restore stays on its button. */}
      <div className="absolute inset-0 cursor-zoom-in z-10" title="Click for larger view" onClick={onPreview} />
    </div>
  )
}
