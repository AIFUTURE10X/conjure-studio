"use client"

/**
 * Export logic for RealFontOverlay
 * Handles canvas drawing and export functionality
 */

import { useCallback, RefObject } from 'react'
import { REAL_FONTS } from '@/app/image-studio/constants/real-fonts'
import type { TextPosition, TextTransform } from './types'

interface UseRealFontExportProps {
  canvasRef: RefObject<HTMLCanvasElement | null>
  logoUrl: string
  brandName: string
  tagline: string
  selectedFont: string
  fontSize: number
  fontWeight: number
  fontColor: string
  textTransform: TextTransform
  letterSpacing: number
  position: TextPosition
  taglineFontSize: number
  onExport: (dataUrl: string) => void
  onClose: () => void
}

// Helper function to draw text with letter spacing
function drawTextWithSpacing(
  ctx: CanvasRenderingContext2D,
  text: string,
  x: number,
  y: number,
  spacing: number,
  align: 'left' | 'center' | 'right' = 'center'
) {
  if (spacing === 0) {
    ctx.fillText(text, x, y)
    return
  }

  const chars = text.split('')
  let totalWidth = 0
  chars.forEach((char, i) => {
    totalWidth += ctx.measureText(char).width
    if (i < chars.length - 1) totalWidth += spacing
  })

  let startX = x
  if (align === 'center') startX = x - totalWidth / 2
  else if (align === 'right') startX = x - totalWidth

  const originalAlign = ctx.textAlign
  ctx.textAlign = 'left'

  let currentX = startX
  chars.forEach((char, i) => {
    ctx.fillText(char, currentX, y)
    currentX += ctx.measureText(char).width + (i < chars.length - 1 ? spacing : 0)
  })

  ctx.textAlign = originalAlign
}

export function useRealFontExport({
  canvasRef,
  logoUrl,
  brandName,
  tagline,
  selectedFont,
  fontSize,
  fontWeight,
  fontColor,
  textTransform,
  letterSpacing,
  position,
  taglineFontSize,
  onExport,
  onClose,
}: UseRealFontExportProps) {
  const handleExport = useCallback(async () => {
    const canvas = canvasRef.current
    if (!canvas) return

    const ctx = canvas.getContext('2d')
    if (!ctx) return

    await document.fonts.ready
    const font = REAL_FONTS[selectedFont]

    const loadImage = (url: string): Promise<HTMLImageElement> => {
      return new Promise((resolve, reject) => {
        const img = new Image()
        img.crossOrigin = 'anonymous'
        img.onload = () => resolve(img)
        img.onerror = (e) => reject(new Error('Failed to load image'))
        img.src = url
      })
    }

    try {
      const img = await loadImage(logoUrl)
      const padding = 40
      const textHeight = fontSize + (tagline ? taglineFontSize + 10 : 0) + 20

      let canvasWidth = img.width
      let canvasHeight = img.height

      if (position === 'below' || position === 'above') {
        canvasHeight = img.height + textHeight + padding
      } else if (position === 'left' || position === 'right') {
        canvasWidth = img.width + 300
      }

      canvas.width = canvasWidth
      canvas.height = canvasHeight
      ctx.clearRect(0, 0, canvas.width, canvas.height)

      let logoX = 0, logoY = 0
      if (position === 'below') { logoX = (canvasWidth - img.width) / 2; logoY = 0 }
      else if (position === 'above') { logoX = (canvasWidth - img.width) / 2; logoY = textHeight }
      else if (position === 'left') { logoX = canvasWidth - img.width - padding; logoY = (canvasHeight - img.height) / 2 }
      else if (position === 'right') { logoX = padding; logoY = (canvasHeight - img.height) / 2 }
      else { logoX = (canvasWidth - img.width) / 2; logoY = (canvasHeight - img.height) / 2 }

      ctx.drawImage(img, logoX, logoY)

      ctx.font = `${fontWeight} ${fontSize}px "${font?.name || 'sans-serif'}"`
      ctx.fillStyle = fontColor
      ctx.textAlign = 'center'

      let displayText = brandName
      if (textTransform === 'uppercase') displayText = brandName.toUpperCase()
      if (textTransform === 'lowercase') displayText = brandName.toLowerCase()

      let textX = canvasWidth / 2, textY = 0
      if (position === 'below') textY = img.height + padding + fontSize
      else if (position === 'above') textY = fontSize + 10
      else if (position === 'left') { textX = padding + 100; textY = canvasHeight / 2 }
      else if (position === 'right') { textX = img.width + padding + 100; textY = canvasHeight / 2 }
      else textY = canvasHeight / 2 + img.height / 2 + fontSize

      drawTextWithSpacing(ctx, displayText, textX, textY, letterSpacing, 'center')

      if (tagline) {
        ctx.font = `400 ${taglineFontSize}px "${font?.name || 'sans-serif'}"`
        const taglineText = textTransform === 'uppercase' ? tagline.toUpperCase()
          : textTransform === 'lowercase' ? tagline.toLowerCase() : tagline
        drawTextWithSpacing(ctx, taglineText, textX, textY + taglineFontSize + 8, letterSpacing / 2, 'center')
      }

      const dataUrl = canvas.toDataURL('image/png')
      const link = document.createElement('a')
      link.download = `${brandName.toLowerCase().replace(/\s+/g, '-')}-logo.png`
      link.href = dataUrl
      document.body.appendChild(link)
      link.click()
      document.body.removeChild(link)

      onExport(dataUrl)
      onClose()
    } catch (error) {
      console.error('Export failed:', error)
      alert('Export failed. Please try again.')
    }
  }, [canvasRef, logoUrl, brandName, tagline, selectedFont, fontSize, fontWeight, fontColor, textTransform, letterSpacing, position, taglineFontSize, onExport, onClose])

  return { handleExport }
}
