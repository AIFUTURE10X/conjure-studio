"use client"

/**
 * Export Utility Functions
 *
 * Canvas drawing helpers for mockup export.
 * Extracted from useGenericExport.ts to keep files under 300 lines.
 *
 * See EXPORT_FIX_REFERENCE.md for documentation on the preloadImage pattern
 */

import type { TextEffect } from './mockup-types'

/**
 * Preload image utility - waits for image to fully load
 * Uses fetch+blob pattern to handle Vercel Blob URLs reliably
 */
export async function preloadImage(url: string): Promise<HTMLImageElement> {
  // Handle data URLs directly (already local)
  if (url.startsWith('data:')) {
    return new Promise((resolve, reject) => {
      const img = new Image()
      img.onload = () => resolve(img)
      img.onerror = () => reject(new Error('Image failed to load'))
      img.src = url
    })
  }

  // Fetch remote URLs (Vercel Blob, etc.) and convert to blob URL
  const response = await fetch(url)
  const blob = await response.blob()
  const blobUrl = URL.createObjectURL(blob)

  return new Promise((resolve, reject) => {
    const img = new Image()
    img.onload = () => {
      URL.revokeObjectURL(blobUrl)  // Clean up
      resolve(img)
    }
    img.onerror = () => {
      URL.revokeObjectURL(blobUrl)
      reject(new Error('Image failed to load'))
    }
    img.src = blobUrl
  })
}

/**
 * Draw text with effect on canvas
 */
export function drawTextWithEffect(
  ctx: CanvasRenderingContext2D,
  text: string,
  x: number,
  y: number,
  color: string,
  effect: TextEffect
) {
  ctx.save()

  switch (effect) {
    case '3d':
      for (let i = 4; i >= 1; i--) {
        ctx.fillStyle = `rgba(0, 0, 0, ${0.2 + (4 - i) * 0.15})`
        ctx.fillText(text, x + i, y + i)
      }
      ctx.fillStyle = color
      ctx.fillText(text, x, y)
      break

    case 'embossed':
      ctx.fillStyle = 'rgba(255, 255, 255, 0.4)'
      ctx.fillText(text, x - 1, y - 1)
      ctx.fillStyle = 'rgba(0, 0, 0, 0.5)'
      ctx.fillText(text, x + 1, y + 1)
      ctx.fillStyle = color
      ctx.fillText(text, x, y)
      break

    case 'floating':
      ctx.shadowColor = 'rgba(0, 0, 0, 0.5)'
      ctx.shadowBlur = 8
      ctx.shadowOffsetX = 0
      ctx.shadowOffsetY = 4
      ctx.fillStyle = color
      ctx.fillText(text, x, y)
      break

    case 'debossed':
      ctx.fillStyle = 'rgba(255, 255, 255, 0.25)'
      ctx.fillText(text, x + 1, y + 1)
      ctx.fillStyle = 'rgba(0, 0, 0, 0.5)'
      ctx.fillText(text, x - 1, y - 1)
      ctx.fillStyle = color
      ctx.fillText(text, x, y)
      break

    default:
      ctx.fillStyle = color
      ctx.fillText(text, x, y)
  }

  ctx.restore()
}

/**
 * Draw text with rotation
 */
export function drawRotatedText(
  ctx: CanvasRenderingContext2D,
  text: string,
  x: number,
  y: number,
  rotation: number,
  color: string,
  effect: TextEffect
) {
  ctx.save()
  ctx.translate(x, y)
  ctx.rotate((rotation * Math.PI) / 180)
  drawTextWithEffect(ctx, text, 0, 0, color, effect)
  ctx.restore()
}
