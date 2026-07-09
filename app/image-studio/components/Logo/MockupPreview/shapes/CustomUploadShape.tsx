"use client"

/**
 * CustomUploadShape Component
 *
 * Renders either an upload dropzone or the user's uploaded product photo.
 * Part of the custom upload mockup system.
 */

import { useState, useRef } from 'react'
import { Upload, ImageIcon } from 'lucide-react'
import type { ProductColor } from '../generic/mockup-types'

interface CustomUploadShapeProps {
  color: ProductColor
  className?: string
  style?: React.CSSProperties
  /** URL of the uploaded custom product image */
  customImageUrl?: string
  /** Callback when user uploads an image */
  onImageUpload?: (url: string) => void
}

export function CustomUploadShape({
  color,
  className,
  style,
  customImageUrl,
  onImageUpload,
}: CustomUploadShapeProps) {
  const [isDraggingOver, setIsDraggingOver] = useState(false)
  const [imageLoaded, setImageLoaded] = useState(false)
  const inputRef = useRef<HTMLInputElement>(null)

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault()
    setIsDraggingOver(true)
  }

  const handleDragLeave = () => {
    setIsDraggingOver(false)
  }

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault()
    setIsDraggingOver(false)

    const file = e.dataTransfer.files?.[0]
    if (file && file.type.startsWith('image/')) {
      processFile(file)
    }
  }

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file) {
      processFile(file)
    }
    // Reset input for re-upload
    if (inputRef.current) {
      inputRef.current.value = ''
    }
  }

  const processFile = (file: File) => {
    const url = URL.createObjectURL(file)
    onImageUpload?.(url)
    setImageLoaded(false)
  }

  // If we have an uploaded image, show it
  if (customImageUrl) {
    return (
      <div
        className={`absolute inset-0 flex items-center justify-center bg-zinc-800 ${className || ''}`}
        style={style}
      >
        {/* Loading placeholder */}
        {!imageLoaded && (
          <div className="absolute inset-0 flex items-center justify-center bg-zinc-800/50 animate-pulse">
            <div className="w-16 h-16 rounded-full bg-zinc-700/50" />
          </div>
        )}

        {/* Uploaded product image */}
        <img
          src={customImageUrl}
          alt="Custom product"
          className={`w-full h-full object-contain transition-opacity duration-300 ${
            imageLoaded ? 'opacity-100' : 'opacity-0'
          }`}
          style={{
            filter: 'drop-shadow(0 20px 40px rgba(0,0,0,0.35))',
          }}
          onLoad={() => setImageLoaded(true)}
        />
      </div>
    )
  }

  // No image - show upload dropzone
  return (
    <div
      className={`absolute inset-0 flex items-center justify-center ${className || ''}`}
      style={style}
    >
      <div
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
        onClick={() => inputRef.current?.click()}
        className={`w-[90%] h-[90%] flex flex-col items-center justify-center rounded-xl border-2 border-dashed cursor-pointer transition-all ${
          isDraggingOver
            ? 'border-purple-500 bg-purple-500/10'
            : 'border-zinc-600 bg-zinc-800/50 hover:border-zinc-500 hover:bg-zinc-800'
        }`}
      >
        <div className={`w-16 h-16 rounded-full flex items-center justify-center mb-4 ${
          isDraggingOver ? 'bg-purple-500/20' : 'bg-zinc-700/50'
        }`}>
          {isDraggingOver ? (
            <ImageIcon className="w-8 h-8 text-purple-400" />
          ) : (
            <Upload className="w-8 h-8 text-zinc-400" />
          )}
        </div>

        <p className={`text-sm font-medium mb-1 ${
          isDraggingOver ? 'text-purple-400' : 'text-zinc-300'
        }`}>
          {isDraggingOver ? 'Drop image here' : 'Upload Product Photo'}
        </p>

        <p className="text-xs text-zinc-500">
          Drag & drop or click to browse
        </p>

        <p className="text-[10px] text-zinc-600 mt-2">
          PNG, JPG, WebP supported
        </p>
      </div>

      <input
        ref={inputRef}
        type="file"
        accept="image/*"
        onChange={handleFileSelect}
        className="hidden"
      />
    </div>
  )
}

/**
 * Draw custom upload to canvas (for export)
 * This draws the uploaded image as the product background
 */
export async function drawCustomUploadToCanvas(
  ctx: CanvasRenderingContext2D,
  color: ProductColor,
  width: number,
  height: number,
  customImageUrl?: string
): Promise<void> {
  // Fill background
  ctx.fillStyle = '#27272a' // zinc-800
  ctx.fillRect(0, 0, width, height)

  // If we have a custom image, draw it
  if (customImageUrl) {
    return new Promise((resolve) => {
      const img = new Image()
      img.crossOrigin = 'anonymous'

      img.onload = () => {
        // Calculate aspect-fit dimensions
        const imgAspect = img.width / img.height
        const canvasAspect = width / height

        let drawWidth: number
        let drawHeight: number
        let drawX: number
        let drawY: number

        if (imgAspect > canvasAspect) {
          drawWidth = width
          drawHeight = width / imgAspect
          drawX = 0
          drawY = (height - drawHeight) / 2
        } else {
          drawHeight = height
          drawWidth = height * imgAspect
          drawX = (width - drawWidth) / 2
          drawY = 0
        }

        ctx.drawImage(img, drawX, drawY, drawWidth, drawHeight)
        resolve()
      }

      img.onerror = () => {
        console.error('Failed to load custom image for export')
        resolve()
      }

      img.src = customImageUrl
    })
  }
}
