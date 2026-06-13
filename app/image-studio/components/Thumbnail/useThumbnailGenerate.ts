"use client"

/**
 * useThumbnailGenerate
 *
 * The AI/transform actions for the background + subject: generate one or three
 * background variations, cut out the subject (bg removal), and recolor the
 * background to brand colors. Extracted from ThumbnailProvider to keep each
 * file focused. The headline always stays an editable overlay layer.
 */

import { useCallback, useState, type Dispatch, type MutableRefObject, type SetStateAction } from 'react'
import { toast } from 'sonner'
import { postGenerateImage, toDataUrl } from './thumbnail-utils'
import { type ThumbnailConfig } from './thumbnail-constants'

type GenerateOptions = { model?: string; imageSize?: string }

interface Deps {
  setConfig: Dispatch<SetStateAction<ThumbnailConfig>>
  configRef: MutableRefObject<ThumbnailConfig>
}

export function useThumbnailGenerate({ setConfig, configRef }: Deps) {
  const [isGeneratingBg, setIsGeneratingBg] = useState(false)
  const [isCuttingOut, setIsCuttingOut] = useState(false)
  const [isRecoloring, setIsRecoloring] = useState(false)
  const [bgVariations, setBgVariations] = useState<string[]>([])

  const chooseBackground = useCallback(
    (url: string) => {
      setConfig((c) => ({ ...c, background: { ...c.background, kind: 'image', imageUrl: url } }))
    },
    [setConfig],
  )

  const clearVariations = useCallback(() => setBgVariations([]), [])

  const clearBackground = useCallback(() => {
    setBgVariations([])
    setConfig((c) => ({ ...c, background: { ...c.background, kind: 'gradient', imageUrl: undefined } }))
  }, [setConfig])

  const generateBackground = useCallback(
    async (idea: string, stylePrompt: string, options?: GenerateOptions) => {
      setIsGeneratingBg(true)
      try {
        const images = await postGenerateImage(idea, stylePrompt, options, 1)
        setBgVariations([])
        setConfig((c) => ({ ...c, background: { ...c.background, kind: 'image', imageUrl: images[0] } }))
        toast.success('AI background generated')
      } catch (err) {
        console.error('[Thumbnail] background generation failed:', err)
        toast.error('Background generation failed — try again')
      } finally {
        setIsGeneratingBg(false)
      }
    },
    [setConfig],
  )

  const generateBackgroundVariations = useCallback(
    async (idea: string, stylePrompt: string, options?: GenerateOptions) => {
      setIsGeneratingBg(true)
      try {
        const images = await postGenerateImage(idea, stylePrompt, options, 3)
        setBgVariations(images)
        setConfig((c) => ({ ...c, background: { ...c.background, kind: 'image', imageUrl: images[0] } }))
        toast.success(`Generated ${images.length} option${images.length > 1 ? 's' : ''}`)
      } catch (err) {
        console.error('[Thumbnail] variations failed:', err)
        toast.error('Generation failed — try again')
      } finally {
        setIsGeneratingBg(false)
      }
    },
    [setConfig],
  )

  const removeSubjectBackground = useCallback(async () => {
    const current = configRef.current.subject
    if (!current) return
    setIsCuttingOut(true)
    try {
      const blob = await (await fetch(current.url)).blob()
      const form = new FormData()
      form.append('image', blob, 'subject.png')
      const res = await fetch('/api/remove-background', { method: 'POST', body: form })
      const data = (await res.json()) as { image?: string; error?: string }
      if (!res.ok || !data.image) throw new Error(data.error || 'Background removal failed')
      const dataUrl = await toDataUrl(data.image)
      setConfig((c) => (c.subject ? { ...c, subject: { ...c.subject, url: dataUrl } } : c))
      toast.success('Background removed')
    } catch (err) {
      console.error('[Thumbnail] cutout failed:', err)
      toast.error('Could not remove the background')
    } finally {
      setIsCuttingOut(false)
    }
  }, [setConfig, configRef])

  const recolorBackground = useCallback(
    async (colorNames: string[]) => {
      const bg = configRef.current.background
      if (bg.kind !== 'image' || !bg.imageUrl) {
        toast.error('Generate or upload a background image first')
        return
      }
      if (colorNames.length === 0) {
        toast.error('Pick at least one brand color')
        return
      }
      setIsRecoloring(true)
      try {
        const res = await fetch('/api/recolor-logo', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ imageUrl: bg.imageUrl, colors: colorNames.slice(0, 4), preserveMetallic: false }),
        })
        const data = (await res.json()) as { image?: string; error?: string }
        if (!res.ok || !data.image) throw new Error(data.error || 'Recolor failed')
        const dataUrl = await toDataUrl(data.image)
        setBgVariations([])
        setConfig((c) => ({ ...c, background: { ...c.background, kind: 'image', imageUrl: dataUrl } }))
        toast.success('Background recolored to brand colors')
      } catch (err) {
        console.error('[Thumbnail] recolor failed:', err)
        toast.error('Recolor failed — try again')
      } finally {
        setIsRecoloring(false)
      }
    },
    [setConfig, configRef],
  )

  return {
    bgVariations,
    isGeneratingBg,
    isCuttingOut,
    isRecoloring,
    chooseBackground,
    clearBackground,
    clearVariations,
    generateBackground,
    generateBackgroundVariations,
    removeSubjectBackground,
    recolorBackground,
  }
}
