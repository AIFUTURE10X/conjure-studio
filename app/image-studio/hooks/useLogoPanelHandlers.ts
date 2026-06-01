"use client"

import { useState, useCallback, useRef, useEffect } from 'react'
import { toast } from 'sonner'
import { BgRemovalMethod, type GeneratedLogo, type LogoStyle } from './useLogoGeneration'
import type { LogoHistoryItem } from '../components/Logo/LogoHistory'
import { getUserId } from '../components/Logo/LogoHistory/useLogoHistoryData'
import { urlToBase64 } from '../utils/export-utils'

interface LogoPanelHandlersProps {
  generatedLogo: GeneratedLogo | null
  setLogo: (logo: GeneratedLogo) => void
  bgRemovalMethod: BgRemovalMethod
  onLogoGenerated?: (url: string) => void
  addToHistory?: (item: Omit<LogoHistoryItem, 'id' | 'timestamp' | 'isFavorited'>) => Promise<string> | void
}

export function useLogoPanelHandlers({ generatedLogo, setLogo, bgRemovalMethod, onLogoGenerated, addToHistory }: LogoPanelHandlersProps) {
  const [isRemovingLogoBg, setIsRemovingLogoBg] = useState(false)
  const [isUpscaling, setIsUpscaling] = useState(false)
  const [isExportingSvg, setIsExportingSvg] = useState(false)
  const [isExportingPdf, setIsExportingPdf] = useState(false)
  const [copied, setCopied] = useState(false)
  const [isRemovingRefBg, setIsRemovingRefBg] = useState(false)

  // Use ref to always have the latest addToHistory function (avoids stale closure)
  const addToHistoryRef = useRef(addToHistory)
  useEffect(() => {
    addToHistoryRef.current = addToHistory
  }, [addToHistory])

  const handleRemoveLogoBackground = useCallback(async () => {
    console.log('[RB-Logo v8] handleRemoveLogoBackground CALLED')
    console.log('[RB-Logo v8] generatedLogo available:', !!generatedLogo)
    if (!generatedLogo) return
    setIsRemovingLogoBg(true)
    try {
      const response = await fetch(generatedLogo.url)
      const blob = await response.blob()
      const file = new File([blob], 'logo.png', { type: 'image/png' })
      const formData = new FormData()
      formData.append('image', file)
      formData.append('bgRemovalMethod', bgRemovalMethod)
      formData.append('isLogoContext', 'true') // Enable text-preserving params for taglines

      // Pass metadata for server-side history save (more reliable than client-side)
      const userId = getUserId()
      formData.append('userId', userId)
      formData.append('prompt', generatedLogo.prompt || 'Background removed')
      if (generatedLogo.seed) formData.append('seed', generatedLogo.seed.toString())
      if (generatedLogo.style) formData.append('style', generatedLogo.style)
      formData.append('originalUrl', generatedLogo.originalUrl || generatedLogo.url)

      console.log('[RB-Logo v8] Sending request with metadata, userId:', userId, 'isLogoContext: true')
      const apiResponse = await fetch('/api/remove-background', { method: 'POST', body: formData })
      if (!apiResponse.ok) throw new Error((await apiResponse.json().catch(() => ({}))).error || 'Failed')
      const data = await apiResponse.json()
      console.log('[RB-Logo v8] API returned, image URL:', data.image?.substring(0, 80), 'historyId:', data.historyId)
      if (data.error) throw new Error(data.error)
      if (!data.image) throw new Error('No image returned')

      // Store original URL before replacing with BG-removed version (keep first original)
      setLogo({
        ...generatedLogo,
        originalUrl: generatedLogo.originalUrl || generatedLogo.url,
        url: data.image,
        bgRemovalMethod,
        timestamp: Date.now()
      })
      onLogoGenerated?.(data.image)

      // History is saved server-side now, just show success
      if (data.historyId) {
        toast.success('Background removed and saved to history!')
      } else {
        toast.success('Background removed!')
      }
    } catch (err) {
      console.error('[RB-Logo v8] Error:', err)
      toast.error(`Background removal failed: ${err instanceof Error ? err.message : 'Unknown error'}`)
    } finally {
      setIsRemovingLogoBg(false)
    }
  }, [generatedLogo, bgRemovalMethod, setLogo, onLogoGenerated])

  const handleUpscale = useCallback(async (targetResolution: '2K' | '4K', method: 'ai' | 'fast' = 'ai') => {
    if (!generatedLogo) return
    setIsUpscaling(true)
    try {
      // Use utility function - see EXPORT_FIX_REFERENCE.md for why this pattern is needed
      const imageBase64 = await urlToBase64(generatedLogo.url)

      const formData = new FormData()
      formData.append('imageBase64', imageBase64)
      formData.append('targetResolution', targetResolution)
      formData.append('method', method)
      const response = await fetch('/api/upscale-logo', { method: 'POST', body: formData })
      if (!response.ok) throw new Error((await response.json().catch(() => ({}))).error || 'Failed')
      const data = await response.json()
      if (data.error) throw new Error(data.error)
      if (!data.image) throw new Error('No image returned')
      if (data.message) { toast.info(data.message); return }
      setLogo({ ...generatedLogo, url: data.image })
      toast.success(`Successfully upscaled to ${targetResolution}`)
    } catch (err) {
      console.error('[LogoPanel] Upscale error:', err)
      toast.error(`Upscale failed: ${err instanceof Error ? err.message : 'Unknown error'}`)
    } finally {
      setIsUpscaling(false)
    }
  }, [generatedLogo, setLogo])

  const handleCopyToClipboard = useCallback(async () => {
    if (!generatedLogo) return
    try {
      const response = await fetch(generatedLogo.url)
      const blob = await response.blob()
      await navigator.clipboard.write([new ClipboardItem({ 'image/png': blob })])
      setCopied(true)
      toast.success('Logo copied to clipboard')
      setTimeout(() => setCopied(false), 2000)
    } catch (err) {
      console.error('Failed to copy:', err)
      toast.error('Failed to copy logo to clipboard')
    }
  }, [generatedLogo])

  const handleExportSvg = useCallback(async () => {
    if (!generatedLogo) return
    setIsExportingSvg(true)
    try {
      // Use utility function - see EXPORT_FIX_REFERENCE.md for why this pattern is needed
      const imageBase64 = await urlToBase64(generatedLogo.url)

      const formData = new FormData()
      formData.append('imageBase64', imageBase64)
      formData.append('mode', 'auto')
      formData.append('colorCount', '16')
      formData.append('removeBackground', 'true') // Remove background paths from SVG for transparency
      const response = await fetch('/api/vectorize-logo', { method: 'POST', body: formData })
      if (!response.ok) throw new Error((await response.json().catch(() => ({}))).error || 'Failed')
      const svgContent = await response.text()
      const blob = new Blob([svgContent], { type: 'image/svg+xml' })
      const url = URL.createObjectURL(blob)
      const link = document.createElement('a')
      link.href = url
      link.download = `logo-${generatedLogo.prompt.toLowerCase().replace(/[^a-z0-9]+/g, '-').substring(0, 30)}-${Date.now()}.svg`
      document.body.appendChild(link)
      link.click()
      document.body.removeChild(link)
      URL.revokeObjectURL(url)
      toast.success('SVG exported successfully')
    } catch (err) {
      console.error('Failed to export SVG:', err)
      toast.error(`SVG export failed: ${err instanceof Error ? err.message : 'Unknown error'}`)
    } finally {
      setIsExportingSvg(false)
    }
  }, [generatedLogo])

  const handleExportPdf = useCallback(async () => {
    if (!generatedLogo) return
    setIsExportingPdf(true)
    try {
      const jsPDF = (await import('jspdf')).default
      const img = new Image()
      img.crossOrigin = 'anonymous'

      await new Promise<void>((resolve, reject) => {
        img.onload = () => {
          try {
            const pdf = new jsPDF('p', 'mm', 'a4')
            const pdfWidth = pdf.internal.pageSize.getWidth()
            const pdfHeight = pdf.internal.pageSize.getHeight()
            const imgAspect = img.width / img.height
            const maxWidth = pdfWidth - 40
            const maxHeight = pdfHeight - 40
            let imgWidth = maxWidth
            let imgHeight = imgWidth / imgAspect
            if (imgHeight > maxHeight) {
              imgHeight = maxHeight
              imgWidth = imgHeight * imgAspect
            }
            const x = (pdfWidth - imgWidth) / 2
            const y = (pdfHeight - imgHeight) / 2

            // Draw the logo on the PDF (transparent areas will show PDF's default white background)
            pdf.addImage(img, 'PNG', x, y, imgWidth, imgHeight)
            const fileName = `logo-${generatedLogo.prompt.toLowerCase().replace(/[^a-z0-9]+/g, '-').substring(0, 30)}-${Date.now()}.pdf`
            pdf.save(fileName)
            resolve()
          } catch (err) {
            reject(err)
          }
        }
        img.onerror = () => reject(new Error('Failed to load image'))
        img.src = generatedLogo.url
      })

      toast.success('PDF exported successfully!')
    } catch (err) {
      console.error('Failed to export PDF:', err)
      toast.error(`PDF export failed: ${err instanceof Error ? err.message : 'Unknown error'}`)
    } finally {
      setIsExportingPdf(false)
    }
  }, [generatedLogo])

  const handleRemoveRefBackground = useCallback(async (referenceImage: { file: File; preview: string }) => {
    console.log('[RB-Ref v2] handleRemoveRefBackground CALLED')
    setIsRemovingRefBg(true)
    try {
      const formData = new FormData()
      formData.append('image', referenceImage.file)
      formData.append('bgRemovalMethod', bgRemovalMethod)
      formData.append('isLogoContext', 'true') // Enable text-preserving params for taglines

      // Pass metadata for server-side history save
      const userId = getUserId()
      formData.append('userId', userId)
      formData.append('prompt', 'Background removed (reference)')
      formData.append('style', 'flat')

      console.log('[RB-Ref v2] Sending request with metadata, userId:', userId, 'isLogoContext: true')
      const response = await fetch('/api/remove-background', { method: 'POST', body: formData })
      if (!response.ok) throw new Error((await response.json().catch(() => ({}))).error || 'Failed')
      const data = await response.json()
      console.log('[RB-Ref v2] API returned, historyId:', data.historyId)
      if (data.error) throw new Error(data.error)
      if (!data.image) throw new Error('No image returned')

      const newLogo = { url: data.image, prompt: 'Background removed', style: 'flat' as LogoStyle, aspectRatio: '1:1' as const, textMode: 'ai-text' as const, bgRemovalMethod, timestamp: Date.now() }
      setLogo(newLogo)
      onLogoGenerated?.(data.image)

      if (data.historyId) {
        toast.success('Background removed and saved to history!')
      } else {
        toast.success('Background removed!')
      }
    } catch (err) {
      console.error('[RB-Ref v2] Background removal error:', err)
      toast.error(`Background removal failed: ${err instanceof Error ? err.message : 'Unknown error'}`)
    } finally {
      setIsRemovingRefBg(false)
    }
  }, [bgRemovalMethod, setLogo, onLogoGenerated])

  return {
    isRemovingLogoBg, isUpscaling, isExportingSvg, isExportingPdf, copied, isRemovingRefBg,
    handleRemoveLogoBackground, handleUpscale, handleCopyToClipboard, handleExportSvg, handleExportPdf, handleRemoveRefBackground
  }
}
