"use client"

import { useState, useEffect } from 'react'
import { Heart, Download, Maximize2 } from 'lucide-react'
import { Card } from '@/components/ui/card'
import { Button } from '@/components/ui/button'

interface ImageCardProps {
  url: string
  prompt?: string
  aspectRatio?: string
  style?: string
  width?: number
  height?: number
  fileSizeMB?: number
  index: number
  onImageClick: () => void
  onDownload?: () => void
}

const GOLD_GRADIENT = "linear-gradient(135deg, #c99850 0%, #dbb56e 25%, #f4d698 50%, #dbb56e 75%, #c99850 100%)"

export function ImageCard({
  url,
  prompt,
  aspectRatio,
  style,
  width,
  height,
  fileSizeMB,
  index,
  onImageClick,
  onDownload
}: ImageCardProps) {
  const [isFavorited, setIsFavorited] = useState(false)
  const [imageMetadata, setImageMetadata] = useState({ width, height, fileSizeMB })

  useEffect(() => {
    if (typeof window !== 'undefined') {
      try {
        const favorites = JSON.parse(localStorage.getItem('image-favorites') || '[]')
        const isFav = favorites.some((fav: any) => fav.url === url)
        setIsFavorited(isFav)
      } catch (error) {
        console.error('[v0] Failed to check favorites:', error)
      }
    }
  }, [url])

  useEffect(() => {
    if (!width || !height) {
      const img = new Image()
      img.crossOrigin = 'anonymous'
      img.onload = async () => {
        const metadata = {
          width: img.naturalWidth,
          height: img.naturalHeight,
          fileSizeMB: fileSizeMB || 0
        }

        if (!url.startsWith('blob:') && fileSizeMB === undefined) {
          try {
            const response = await fetch(url)
            const blob = await response.blob()
            metadata.fileSizeMB = blob.size / (1024 * 1024)
          } catch (error) {
            console.error('[v0] Failed to fetch file size:', error)
          }
        }

        setImageMetadata(metadata)
      }
      img.onerror = () => {
        console.error('[v0] Failed to load image:', url)
      }
      img.src = url
    }
  }, [url, width, height, fileSizeMB])

  const handleFavoriteToggle = (e: React.MouseEvent) => {
    e.stopPropagation()
    
    const newFavoritedState = !isFavorited
    setIsFavorited(newFavoritedState)
    
    const favorites = JSON.parse(localStorage.getItem('image-favorites') || '[]')
    
    if (newFavoritedState) {
      const newFavorite = {
        url,
        prompt,
        aspectRatio,
        style,
        width: imageMetadata.width,
        height: imageMetadata.height,
        fileSizeMB: imageMetadata.fileSizeMB,
        timestamp: new Date().toISOString()
      }
      favorites.push(newFavorite)
      localStorage.setItem('image-favorites', JSON.stringify(favorites))
    } else {
      const filtered = favorites.filter((fav: any) => fav.url !== url)
      localStorage.setItem('image-favorites', JSON.stringify(filtered))
    }
  }

  return (
    <Card className="bg-zinc-900 border-zinc-800 p-2 group overflow-hidden">
      <div 
        className="relative aspect-square rounded-lg overflow-hidden bg-zinc-800 cursor-pointer"
        onClick={onImageClick}
      >
        <img
          src={url || "/placeholder.svg"}
          alt={`Generated ${index + 1}`}
          className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-105"
        />
        
        <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-2">
          <Button
            onClick={handleFavoriteToggle}
            size="sm"
            style={isFavorited ? { 
              backgroundColor: '#ef4444',
              color: 'white'
            } : {
              backgroundColor: 'rgba(0, 0, 0, 0.8)',
              color: 'white'
            }}
            className="transition-all duration-150 active:scale-95 active:brightness-90 hover:brightness-110"
          >
            <Heart 
              className="w-4 h-4 transition-all duration-150" 
              fill={isFavorited ? 'white' : 'none'}
              stroke="currentColor"
            />
          </Button>
          <Button
            size="sm"
            className="text-black pointer-events-none"
            style={{ background: GOLD_GRADIENT }}
          >
            <Maximize2 className="w-4 h-4 mr-2" />
            View Full
          </Button>
        </div>
        
        <div className="absolute bottom-2 left-2 right-2 flex flex-wrap gap-1.5 opacity-0 group-hover:opacity-100 transition-opacity">
          {aspectRatio && (
            <div className="bg-black/90 backdrop-blur-sm px-2.5 py-1 rounded text-[10px] font-bold text-[#c99850] border border-[#c99850]/50">
              {aspectRatio}
            </div>
          )}
          {style && (
            <div className="bg-black/90 backdrop-blur-sm px-2.5 py-1 rounded text-[10px] font-bold text-[#c99850] border border-[#c99850]/50 max-w-[120px] truncate">
              {style}
            </div>
          )}
          {imageMetadata.width && imageMetadata.height && (
            <div className="bg-black/90 backdrop-blur-sm px-2.5 py-1 rounded text-[10px] font-bold text-[#c99850] border border-[#c99850]/50">
              {imageMetadata.width}×{imageMetadata.height}
            </div>
          )}
          {imageMetadata.fileSizeMB !== undefined && imageMetadata.fileSizeMB > 0 && (
            <div className="bg-black/90 backdrop-blur-sm px-2.5 py-1 rounded text-[10px] font-bold text-[#c99850] border border-[#c99850]/50">
              {imageMetadata.fileSizeMB.toFixed(2)} MB
            </div>
          )}
        </div>
        
        {isFavorited && (
          <div className="absolute top-2 right-2 bg-red-500 rounded-full p-1.5 shadow-lg animate-in fade-in zoom-in duration-200">
            <Heart className="w-3 h-3 text-white fill-white" />
          </div>
        )}
      </div>
      
      {prompt && (
        <p className="text-xs text-zinc-400 mt-2 line-clamp-2">{prompt}</p>
      )}
    </Card>
  )
}
