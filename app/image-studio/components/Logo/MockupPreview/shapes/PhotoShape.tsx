"use client"

/**
 * PhotoShape Component
 *
 * Renders a product photo for realistic mockups.
 * Used as an alternative to SVG shapes for photo-realistic rendering.
 */

import { useState } from 'react'
import type { ProductColor } from '../generic/mockup-types'

interface PhotoShapeProps {
  photoUrl: string
  color: ProductColor
  className?: string
  style?: React.CSSProperties
  onError?: () => void
}

export function PhotoShape({
  photoUrl,
  color,
  className,
  style,
  onError,
}: PhotoShapeProps) {
  const [imageLoaded, setImageLoaded] = useState(false)
  const [hasError, setHasError] = useState(false)

  const handleLoad = () => {
    setImageLoaded(true)
  }

  const handleError = () => {
    setHasError(true)
    onError?.()
  }

  if (hasError) {
    // Return null - parent component should fallback to SVG
    return null
  }

  return (
    <div
      className={`absolute inset-0 flex items-center justify-center ${className || ''}`}
      style={style}
    >
      {/* Loading placeholder */}
      {!imageLoaded && (
        <div
          className="absolute inset-0 flex items-center justify-center bg-zinc-800/50 rounded-lg animate-pulse"
        >
          <div className="w-16 h-16 rounded-full bg-zinc-700/50" />
        </div>
      )}

      {/* Product photo */}
      <img
        src={photoUrl}
        alt={`${color.name} product mockup`}
        className={`w-full h-full object-contain transition-opacity duration-300 ${
          imageLoaded ? 'opacity-100' : 'opacity-0'
        }`}
        style={{
          filter: 'drop-shadow(0 20px 40px rgba(0,0,0,0.35))',
        }}
        onLoad={handleLoad}
        onError={handleError}
        crossOrigin="anonymous"
      />
    </div>
  )
}

/**
 * Draw photo to canvas (for export)
 * This is used by useGenericExport when renderMode is 'photo'
 */
export async function drawPhotoToCanvas(
  ctx: CanvasRenderingContext2D,
  photoUrl: string,
  width: number,
  height: number
): Promise<boolean> {
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
        // Image is wider - fit to width
        drawWidth = width
        drawHeight = width / imgAspect
        drawX = 0
        drawY = (height - drawHeight) / 2
      } else {
        // Image is taller - fit to height
        drawHeight = height
        drawWidth = height * imgAspect
        drawX = (width - drawWidth) / 2
        drawY = 0
      }

      ctx.drawImage(img, drawX, drawY, drawWidth, drawHeight)
      resolve(true)
    }

    img.onerror = () => {
      console.error('Failed to load photo for canvas export:', photoUrl)
      resolve(false)
    }

    img.src = photoUrl
  })
}
