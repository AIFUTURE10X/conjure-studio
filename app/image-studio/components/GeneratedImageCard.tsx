"use client"

import { useState, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { Download, RotateCcw, Maximize2, Eraser, Loader2, Expand, Wand2, MessagesSquare, Pencil, Film, Clapperboard } from 'lucide-react'
import { FavoriteButton } from './SimpleFavorites'
import { ImageAnnotationEditor } from './Annotation'

type RestoreParameters = Record<string, unknown>

interface GeneratedImageCardProps {
  imageUrl: string
  imagePrompt?: string
  imageTimestamp?: number
  index: number
  aspectRatio: string
  selectedStylePreset: string
  imageMetadata?: {
    dimensions: string
    fileSize?: string
  }
  parameters?: RestoreParameters
  isFavorite: boolean
  onToggleFavorite: () => void
  onDownload: () => void
  onOpenLightbox: () => void
  onRestoreParameters?: (params: RestoreParameters) => void
  onRemoveBackground?: (index: number) => Promise<void>
  onUpscale?: (index: number) => Promise<void>
  onEdit?: () => void
  onEditInChat?: () => void
  onSaveAnnotated?: (index: number, dataUrl: string, instruction?: string, maskDataUrl?: string) => void | Promise<void>
  onSetEndFrame?: (index: number) => void
  onAnimate?: (index: number) => void
}

export function GeneratedImageCard({
  imageUrl,
  imagePrompt,
  imageTimestamp: _imageTimestamp,
  index,
  aspectRatio,
  selectedStylePreset,
  imageMetadata,
  parameters,
  isFavorite,
  onToggleFavorite,
  onDownload,
  onOpenLightbox,
  onRestoreParameters,
  onRemoveBackground,
  onUpscale,
  onEdit,
  onEditInChat,
  onSaveAnnotated,
  onSetEndFrame,
  onAnimate,
}: GeneratedImageCardProps) {
  const [metadata, setMetadata] = useState<{ dimensions: string; fileSize?: string } | null>(imageMetadata || null)
  const [isRemovingBg, setIsRemovingBg] = useState(false)
  const [isUpscaling, setIsUpscaling] = useState(false)
  const [isAnnotating, setIsAnnotating] = useState(false)

  const handleRemoveBackground = async () => {
    if (!onRemoveBackground || isRemovingBg) return
    setIsRemovingBg(true)
    try {
      await onRemoveBackground(index)
    } finally {
      setIsRemovingBg(false)
    }
  }

  const handleUpscale = async () => {
    if (!onUpscale || isUpscaling) return
    setIsUpscaling(true)
    try {
      await onUpscale(index)
    } finally {
      setIsUpscaling(false)
    }
  }

  useEffect(() => {
    if (imageUrl) {
      const img = new Image()
      img.onload = async () => {
        let fileSize = 'Unknown'
        try {
          // Try fetching as blob first - more reliable for Vercel blob storage
          const response = await fetch(imageUrl)
          const blob = await response.blob()
          const mb = blob.size / (1024 * 1024)
          fileSize = `~${mb.toFixed(1)} MB`
          console.log('[v0] File size calculated for', imageUrl.substring(0, 50), ':', fileSize, 'bytes:', blob.size)
        } catch (error) {
          console.error('[v0] Failed to calculate file size:', error)
        }

        setMetadata({
          dimensions: `${img.width}×${img.height}`,
          fileSize,
        })
      }
      img.src = imageUrl
    }
  }, [imageUrl]) // Only depend on imageUrl, not metadata

  return (
    <div className="relative group">
      <div className="relative rounded-lg overflow-hidden bg-zinc-800">
        <img
          src={imageUrl || "/placeholder.svg"}
          alt={`Generated ${index + 1}`}
          className="w-full h-auto object-contain cursor-pointer"
          onClick={onOpenLightbox}
        />
        
        {/* Hover overlay with favorite button and metadata badges */}
        <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity">
          {/* Metadata Badges - Top */}
          <div className="absolute top-2 left-2 right-2 flex flex-wrap gap-1">
            {aspectRatio && (
              <span className="px-2 py-0.5 text-[10px] font-bold rounded" style={{
                background: 'linear-gradient(135deg, #c99850 0%, #dbb56e 50%, #c99850 100%)',
                color: '#000'
              }}>
                {aspectRatio}
              </span>
            )}
            {selectedStylePreset && (
              <span className="px-2 py-0.5 text-[10px] font-bold rounded" style={{
                background: 'linear-gradient(135deg, #c99850 0%, #dbb56e 50%, #c99850 100%)',
                color: '#000'
              }}>
                {selectedStylePreset}
              </span>
            )}
            {metadata?.dimensions && (
              <span className="px-2 py-0.5 text-[10px] font-bold rounded" style={{
                background: 'linear-gradient(135deg, #c99850 0%, #dbb56e 50%, #c99850 100%)',
                color: '#000'
              }}>
                {metadata.dimensions}
              </span>
            )}
            {metadata?.fileSize && (
              <span className="px-2 py-0.5 text-[10px] font-bold rounded" style={{
                background: 'linear-gradient(135deg, #c99850 0%, #dbb56e 50%, #c99850 100%)',
                color: '#000'
              }}>
                {metadata.fileSize}
              </span>
            )}
          </div>

          {/* Center Favorite Button */}
          <div className="absolute inset-0 flex items-center justify-center gap-4">
            <button
              onClick={onOpenLightbox}
              className="p-3 rounded-full bg-white/90 text-gray-800 hover:bg-white transition-colors focus:outline-none focus:ring-2 focus:ring-[#c99850]"
              aria-label="Enlarge image"
            >
              <Maximize2 className="w-6 h-6" />
            </button>
            <FavoriteButton
              imageUrl={imageUrl}
              isFavorite={isFavorite}
              onToggle={onToggleFavorite}
              size="lg"
            />
          </div>

          {/* Restore Parameters Button - Bottom Right */}
          {parameters && onRestoreParameters && (
            <div className="absolute bottom-2 right-2">
              <Button
                onClick={() => onRestoreParameters(parameters)}
                size="sm"
                className="text-[10px] px-2 py-1 h-auto"
                style={{
                  background: 'linear-gradient(135deg, #c99850 0%, #dbb56e 50%, #c99850 100%)',
                  color: '#000',
                  fontWeight: 'bold'
                }}
              >
                <RotateCcw className="w-3 h-3 mr-1" />
                Restore Parameters
              </Button>
            </div>
          )}
        </div>
      </div>
      
      {/* Action buttons below image */}
      <div className="flex flex-wrap gap-2 mt-2">
        <Button
          onClick={onDownload}
          size="sm"
          className="min-w-[120px] flex-1 bg-[#c99850] text-black hover:bg-[#dbb56e]"
        >
          <Download className="w-3 h-3 mr-1" />
          Download
        </Button>
        <Button
          onClick={() => setIsAnnotating(true)}
          size="sm"
          aria-label="Annotate image"
          className="min-w-[120px] flex-1 bg-sky-600 text-white hover:bg-sky-500"
        >
          <Pencil className="w-3 h-3 mr-1" />
          Annotate
        </Button>
        {onRemoveBackground && (
          <Button
            onClick={handleRemoveBackground}
            size="sm"
            disabled={isRemovingBg}
            className="min-w-[120px] flex-1 bg-purple-600 text-white hover:bg-purple-500 disabled:opacity-50"
          >
            {isRemovingBg ? (
              <>
                <Loader2 className="w-3 h-3 mr-1 animate-spin" />
                Removing...
              </>
            ) : (
              <>
                <Eraser className="w-3 h-3 mr-1" />
                Remove BG
              </>
            )}
          </Button>
        )}
        {onAnimate && (
          <Button
            onClick={() => onAnimate(index)}
            size="sm"
            className="min-w-[120px] flex-1 bg-linear-to-r from-[#c99850] to-[#dbb56e] text-black hover:from-[#dbb56e] hover:to-[#c99850]"
            title="Video: use this image as the START frame and open the video generator"
          >
            <Clapperboard className="w-3 h-3 mr-1" />
            Animate
          </Button>
        )}
        {onSetEndFrame && (
          <Button
            onClick={() => onSetEndFrame(index)}
            size="sm"
            className="min-w-[120px] flex-1 bg-emerald-600 text-white hover:bg-emerald-500"
            title="Video: use this image as the END frame (pair it with a start frame set via Animate)"
          >
            <Film className="w-3 h-3 mr-1" />
            End Frame
          </Button>
        )}
        {onUpscale && (
          <Button
            onClick={handleUpscale}
            size="sm"
            disabled={isUpscaling}
            className="min-w-[120px] flex-1 bg-blue-600 text-white hover:bg-blue-500 disabled:opacity-50"
            title="AI-upscale this image to 4K via Real-ESRGAN"
          >
            {isUpscaling ? (
              <>
                <Loader2 className="w-3 h-3 mr-1 animate-spin" />
                Upscaling...
              </>
            ) : (
              <>
                <Expand className="w-3 h-3 mr-1" />
                Upscale 4K
              </>
            )}
          </Button>
        )}
        {onEdit && (
          <Button
            onClick={onEdit}
            size="sm"
            className="flex-1 bg-linear-to-r from-purple-500 to-pink-500 text-white hover:opacity-90"
            title="AI Edit — paint a mask and erase or replace part of the image"
          >
            <Wand2 className="w-3 h-3 mr-1" />
            AI Edit
          </Button>
        )}
        {onEditInChat && (
          <Button
            onClick={onEditInChat}
            size="sm"
            className="px-2 bg-zinc-800 text-[#dbb56e] hover:bg-zinc-700"
            title="Edit in chat — describe changes conversationally"
            aria-label="Edit in chat"
          >
            <MessagesSquare className="w-3 h-3" />
          </Button>
        )}
      </div>
      <ImageAnnotationEditor
        imageUrl={imageUrl}
        imagePrompt={imagePrompt}
        isOpen={isAnnotating}
        onOpenChange={setIsAnnotating}
        onSaveCopy={onSaveAnnotated ? (dataUrl, instruction, maskDataUrl) => onSaveAnnotated(index, dataUrl, instruction, maskDataUrl) : undefined}
      />
    </div>
  )
}
