"use client"

/**
 * Generic Mockup Export Hook
 *
 * Handles PNG, SVG, and PDF export for any mockup type.
 * Uses html-to-image for DOM capture (true WYSIWYG export).
 */

import { useState, useCallback, RefObject } from 'react'
import { toPng, toCanvas } from 'html-to-image'
import jsPDF from 'jspdf'
import { toast } from 'sonner'
import type { MockupConfig, ProductColor, Position, TextEffect, TextItem, MockupView } from './mockup-types'
import { preloadImage } from './export-utils'

// Re-export preloadImage for backward compatibility
export { preloadImage }

interface UseGenericExportConfig {
  /** Mockup configuration */
  mockupConfig: MockupConfig
  /** Reference to the mockup container element for DOM capture */
  containerRef: RefObject<HTMLDivElement | null>
  /** Logo image URL (optional - can show blank product) */
  logoUrl?: string
  /** Logo position (percentage) */
  logoPosition: Position
  /** Logo scale */
  logoScale: number
  /** Selected product color */
  selectedColor: ProductColor
  /** Whether to show brand name */
  showBrandName: boolean
  /** Brand name text */
  brandName: string
  /** Brand font key */
  brandFont: string
  /** Brand text color */
  brandColor: string
  /** Brand text position */
  brandPosition: Position
  /** Brand text scale */
  brandScale: number
  /** Brand text effect */
  brandEffect: TextEffect
  /** Brand text rotation */
  brandRotation: number
  /** Multiple text items */
  textItems: TextItem[]
  /** Optional callback after export */
  onExport?: (format: 'png', dataUrl: string) => void
  /** Photo URL for photo-based rendering (null = use SVG) */
  photoUrl?: string | null
  /** Current view (front/back) */
  view?: MockupView
}

export function useGenericExport(config: UseGenericExportConfig) {
  const [isExporting, setIsExporting] = useState(false)
  const [showExportMenu, setShowExportMenu] = useState(false)

  const { mockupConfig, containerRef } = config
  const scale = mockupConfig.exportConfig.scale || 2

  /**
   * Capture the mockup container as a canvas using html-to-image
   * This gives TRUE WYSIWYG export - exactly what you see in preview
   */
  const captureCanvas = useCallback(async (): Promise<HTMLCanvasElement | null> => {
    try {
      const element = containerRef.current
      if (!element) {
        toast.error('Export failed: Container not found')
        return null
      }

      console.log('[Export] Starting DOM capture with html-to-image...')

      // Temporarily remove background for transparent export
      element.classList.remove('bg-zinc-900')

      // Use html-to-image to capture the DOM exactly as rendered (true WYSIWYG)
      const canvas = await toCanvas(element, {
        pixelRatio: scale,
        cacheBust: true,
        backgroundColor: undefined, // Transparent
        filter: (node) => {
          // Filter out UI elements that shouldn't be in export (rulers, grids, controls)
          if (node instanceof Element) {
            // Keep everything except ruler/grid overlays which have z-30 class
            const className = node.className?.toString() || ''
            if (className.includes('z-30') || className.includes('z-5')) {
              return false // Exclude rulers and grid
            }
          }
          return true
        },
      })

      // Restore background after capture
      element.classList.add('bg-zinc-900')

      console.log('[Export] DOM captured successfully', { width: canvas.width, height: canvas.height })
      return canvas
    } catch (err) {
      // Restore background on error too
      containerRef.current?.classList.add('bg-zinc-900')
      console.error('Canvas capture failed:', err)
      toast.error(`Export failed: ${err instanceof Error ? err.message : 'Unknown error'}`)
      return null
    }
  }, [containerRef, scale])

  const handleExportPNG = useCallback(async () => {
    setIsExporting(true)
    setShowExportMenu(false)
    try {
      const canvas = await captureCanvas()
      if (!canvas) {
        setIsExporting(false)
        return
      }
      canvas.toBlob((blob) => {
        if (!blob) {
          toast.error('Export failed')
          setIsExporting(false)
          return
        }
        const url = URL.createObjectURL(blob)
        const link = document.createElement('a')
        link.href = url
        link.download = `${mockupConfig.id}-mockup-${config.brandName || 'brand'}.png`
        link.click()
        URL.revokeObjectURL(url)
        toast.success('PNG exported!')
        config.onExport?.('png', url)
        setIsExporting(false)
      }, 'image/png', 0.95)
    } catch {
      setIsExporting(false)
    }
  }, [captureCanvas, mockupConfig, config])

  const handleExportSVG = useCallback(async () => {
    setIsExporting(true)
    setShowExportMenu(false)
    try {
      const canvas = await captureCanvas()
      if (!canvas) {
        setIsExporting(false)
        return
      }
      const dataUrl = canvas.toDataURL('image/png')
      const svg = `<?xml version="1.0"?>\n<svg xmlns="http://www.w3.org/2000/svg" xmlns:xlink="http://www.w3.org/1999/xlink" width="${canvas.width}" height="${canvas.height}">\n  <image xlink:href="${dataUrl}" width="${canvas.width}" height="${canvas.height}"/>\n</svg>`
      const blob = new Blob([svg], { type: 'image/svg+xml' })
      const url = URL.createObjectURL(blob)
      const link = document.createElement('a')
      link.href = url
      link.download = `${mockupConfig.id}-mockup-${config.brandName || 'brand'}.svg`
      link.click()
      URL.revokeObjectURL(url)
      toast.success('SVG exported!')
      setIsExporting(false)
    } catch {
      setIsExporting(false)
    }
  }, [captureCanvas, mockupConfig, config])

  const handleExportPDF = useCallback(async () => {
    setIsExporting(true)
    setShowExportMenu(false)
    try {
      const canvas = await captureCanvas()
      if (!canvas) {
        setIsExporting(false)
        return
      }
      const imgData = canvas.toDataURL('image/png')
      const pdf = new jsPDF('p', 'mm', 'a4')
      const pdfWidth = pdf.internal.pageSize.getWidth()
      const pdfHeight = pdf.internal.pageSize.getHeight()
      const imgWidth = pdfWidth - 20
      const imgHeight = (canvas.height * imgWidth) / canvas.width
      const yPos = (pdfHeight - imgHeight) / 2
      pdf.addImage(imgData, 'PNG', 10, yPos > 10 ? yPos : 10, imgWidth, imgHeight)
      pdf.save(`${mockupConfig.id}-mockup-${config.brandName || 'brand'}.pdf`)
      toast.success('PDF exported!')
      setIsExporting(false)
    } catch {
      setIsExporting(false)
    }
  }, [captureCanvas, mockupConfig, config])

  return {
    isExporting,
    showExportMenu,
    setShowExportMenu,
    handleExportPNG,
    handleExportSVG,
    handleExportPDF,
    captureCanvas,
  }
}
