"use client"

/**
 * Mockup Export Hook
 * Handles PNG, SVG, and PDF export using html2canvas to capture rendered DOM
 * See EXPORT_FIX_REFERENCE.md for documentation on why this approach is used
 */

import { useState, useCallback } from 'react'
import html2canvas from 'html2canvas'
import jsPDF from 'jspdf'
import { toast } from 'sonner'
import type { TShirtColor } from './tshirt-assets'
import type { TextEffect, TextItem } from './text-effects-config'

interface ExportConfig {
  logoUrl: string
  logoPosition: { x: number; y: number }
  logoScale: number
  selectedColor: TShirtColor
  showBrandName: boolean
  editableBrandName: string
  brandFont: string
  brandColor: string
  brandPosition: { x: number; y: number }
  brandScale: number
  brandEffect: TextEffect
  brandRotation: number
  textItems: TextItem[]
  onExport?: (format: 'png', dataUrl: string) => void
}

export function useMockupExport(config: ExportConfig) {
  const [isExporting, setIsExporting] = useState(false)
  const [showExportMenu, setShowExportMenu] = useState(false)

  /**
   * Capture the rendered mockup using html2canvas
   * This captures exactly what the user sees - T-shirt, logo, text, and effects
   */
  const captureCanvas = useCallback(async (): Promise<HTMLCanvasElement | null> => {
    try {
      // Find the mockup container element with data-mockup-capture attribute
      const mockupElement = document.querySelector('[data-mockup-capture]') as HTMLElement
      if (!mockupElement) {
        toast.error('Export failed: Mockup element not found')
        return null
      }

      // Use html2canvas to capture the rendered DOM
      const canvas = await html2canvas(mockupElement, {
        backgroundColor: '#18181b',
        scale: 2, // HiDPI support for crisp exports
        useCORS: true, // Allow cross-origin images
        allowTaint: true,
        logging: false,
      })

      return canvas
    } catch (err) {
      console.error('Canvas capture failed:', err)
      toast.error(`Export failed: ${err instanceof Error ? err.message : 'Unknown error'}`)
      return null
    }
  }, [])

  const handleExportPNG = useCallback(async () => {
    setIsExporting(true); setShowExportMenu(false)
    try {
      const canvas = await captureCanvas()
      if (!canvas) { setIsExporting(false); return }
      canvas.toBlob((blob) => {
        if (!blob) { toast.error('Export failed'); setIsExporting(false); return }
        const url = URL.createObjectURL(blob)
        const link = document.createElement('a')
        link.href = url
        link.download = `tshirt-mockup-${config.editableBrandName || 'brand'}.png`
        link.click()
        URL.revokeObjectURL(url)
        toast.success('PNG exported!')
        config.onExport?.('png', url)
        setIsExporting(false)
      }, 'image/png', 0.95)
    } catch { setIsExporting(false) }
  }, [captureCanvas, config])

  const handleExportSVG = useCallback(async () => {
    setIsExporting(true); setShowExportMenu(false)
    try {
      const canvas = await captureCanvas()
      if (!canvas) { setIsExporting(false); return }
      const dataUrl = canvas.toDataURL('image/png')
      const svg = `<?xml version="1.0"?>\n<svg xmlns="http://www.w3.org/2000/svg" xmlns:xlink="http://www.w3.org/1999/xlink" width="${canvas.width}" height="${canvas.height}">\n  <image xlink:href="${dataUrl}" width="${canvas.width}" height="${canvas.height}"/>\n</svg>`
      const blob = new Blob([svg], { type: 'image/svg+xml' })
      const url = URL.createObjectURL(blob)
      const link = document.createElement('a')
      link.href = url
      link.download = `tshirt-mockup-${config.editableBrandName || 'brand'}.svg`
      link.click()
      URL.revokeObjectURL(url)
      toast.success('SVG exported!')
      setIsExporting(false)
    } catch { setIsExporting(false) }
  }, [captureCanvas, config])

  const handleExportPDF = useCallback(async () => {
    setIsExporting(true); setShowExportMenu(false)
    try {
      const canvas = await captureCanvas()
      if (!canvas) { setIsExporting(false); return }
      const imgData = canvas.toDataURL('image/png')
      const pdf = new jsPDF('p', 'mm', 'a4')
      const pdfWidth = pdf.internal.pageSize.getWidth()
      const pdfHeight = pdf.internal.pageSize.getHeight()
      const imgWidth = pdfWidth - 20
      const imgHeight = (canvas.height * imgWidth) / canvas.width
      const yPos = (pdfHeight - imgHeight) / 2
      pdf.addImage(imgData, 'PNG', 10, yPos > 10 ? yPos : 10, imgWidth, imgHeight)
      pdf.save(`tshirt-mockup-${config.editableBrandName || 'brand'}.pdf`)
      toast.success('PDF exported!')
      setIsExporting(false)
    } catch { setIsExporting(false) }
  }, [captureCanvas, config])

  return {
    isExporting,
    showExportMenu,
    setShowExportMenu,
    handleExportPNG,
    handleExportSVG,
    handleExportPDF,
  }
}
