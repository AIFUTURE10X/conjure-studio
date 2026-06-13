"use client"

/**
 * ThumbnailProvider
 *
 * Isolated state for the Thumbnail mode (config + layer actions + export),
 * shared between the center canvas and the settings rail. Kept separate from
 * StudioProvider so the new mode can't affect the existing modes. Config is
 * persisted to localStorage.
 */

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useRef,
  useState,
  type ReactNode,
  type RefObject,
} from 'react'
import { toast } from 'sonner'
import {
  DEFAULT_CONFIG,
  THUMBNAIL_TEMPLATES,
  THUMB_HEIGHT,
  THUMB_STORAGE_KEY,
  THUMB_WIDTH,
  type ThumbnailBackground,
  type ThumbnailConfig,
  type ThumbnailHeadline,
  type ThumbnailSubject,
} from './thumbnail-constants'
import { loadThumbnailConfig, postGenerateImage, toDataUrl } from './thumbnail-utils'

interface ThumbnailContextValue {
  config: ThumbnailConfig
  setBackground: (patch: Partial<ThumbnailBackground>) => void
  setSubject: (subject: ThumbnailSubject | null) => void
  patchSubject: (patch: Partial<ThumbnailSubject>) => void
  setHeadline: (patch: Partial<ThumbnailHeadline>) => void
  applyTemplate: (id: string) => void
  reset: () => void
  clearBackground: () => void
  removeSubjectBackground: () => Promise<void>
  isCuttingOut: boolean
  generateBackground: (idea: string, stylePrompt: string, options?: { model?: string; imageSize?: string }) => Promise<void>
  generateBackgroundVariations: (idea: string, stylePrompt: string, options?: { model?: string; imageSize?: string }) => Promise<void>
  bgVariations: string[]
  chooseBackground: (url: string) => void
  isGeneratingBg: boolean
  stageRef: RefObject<HTMLDivElement | null>
  isExporting: boolean
  exportPng: () => Promise<void>
}

const ThumbnailContext = createContext<ThumbnailContextValue | null>(null)

export function useThumbnail() {
  const ctx = useContext(ThumbnailContext)
  if (!ctx) throw new Error('useThumbnail must be used within ThumbnailProvider')
  return ctx
}

export function ThumbnailProvider({ children }: { children: ReactNode }) {
  const [config, setConfig] = useState<ThumbnailConfig>(() => loadThumbnailConfig())
  const [isExporting, setIsExporting] = useState(false)
  const [isCuttingOut, setIsCuttingOut] = useState(false)
  const [isGeneratingBg, setIsGeneratingBg] = useState(false)
  const [bgVariations, setBgVariations] = useState<string[]>([])
  const stageRef = useRef<HTMLDivElement | null>(null)

  // Mirror config so async handlers read the latest value without re-binding.
  const configRef = useRef(config)
  useEffect(() => {
    configRef.current = config
  }, [config])

  // Persist config — debounced so dragging (and large data-URL backgrounds)
  // don't thrash localStorage on every update.
  useEffect(() => {
    const id = window.setTimeout(() => {
      try {
        window.localStorage.setItem(THUMB_STORAGE_KEY, JSON.stringify(config))
      } catch {
        // ignore storage failures (quota, private mode, etc.)
      }
    }, 400)
    return () => window.clearTimeout(id)
  }, [config])

  const setBackground = useCallback((patch: Partial<ThumbnailBackground>) => {
    setConfig((c) => ({ ...c, background: { ...c.background, ...patch } }))
  }, [])

  const setSubject = useCallback((subject: ThumbnailSubject | null) => {
    setConfig((c) => ({ ...c, subject }))
  }, [])

  const patchSubject = useCallback((patch: Partial<ThumbnailSubject>) => {
    setConfig((c) => (c.subject ? { ...c, subject: { ...c.subject, ...patch } } : c))
  }, [])

  const setHeadline = useCallback((patch: Partial<ThumbnailHeadline>) => {
    setConfig((c) => ({ ...c, headline: { ...c.headline, ...patch } }))
  }, [])

  const applyTemplate = useCallback((id: string) => {
    const template = THUMBNAIL_TEMPLATES.find((t) => t.id === id)
    if (!template) return
    setConfig((c) => ({
      ...c,
      templateId: id,
      background: { ...c.background, ...template.background },
      headline: { ...c.headline, ...template.headline },
      subject: c.subject ? { ...c.subject, ...template.subject } : c.subject,
    }))
  }, [])

  const reset = useCallback(() => {
    setBgVariations([])
    setConfig(DEFAULT_CONFIG)
  }, [])

  const clearBackground = useCallback(() => {
    setBgVariations([])
    setConfig((c) => ({
      ...c,
      background: { ...c.background, kind: 'gradient', imageUrl: undefined },
    }))
  }, [])

  const chooseBackground = useCallback((url: string) => {
    setConfig((c) => ({ ...c, background: { ...c.background, kind: 'image', imageUrl: url } }))
  }, [])

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
  }, [])

  const generateBackground = useCallback(
    async (idea: string, stylePrompt: string, options?: { model?: string; imageSize?: string }) => {
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
    [],
  )

  const generateBackgroundVariations = useCallback(
    async (idea: string, stylePrompt: string, options?: { model?: string; imageSize?: string }) => {
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
    [],
  )

  const exportPng = useCallback(async () => {
    const node = stageRef.current
    if (!node) return
    setIsExporting(true)
    try {
      const { toBlob } = await import('html-to-image')
      const blob = await toBlob(node, {
        width: THUMB_WIDTH,
        height: THUMB_HEIGHT,
        canvasWidth: THUMB_WIDTH,
        canvasHeight: THUMB_HEIGHT,
        pixelRatio: 1,
        cacheBust: true,
        filter: (el) => !(el instanceof Element && el.hasAttribute('data-export-ignore')),
      })
      if (!blob) throw new Error('Empty export')
      const url = URL.createObjectURL(blob)
      const link = document.createElement('a')
      link.href = url
      link.download = 'youtube-thumbnail.png'
      link.click()
      URL.revokeObjectURL(url)
      toast.success('Thumbnail exported (1280×720)')
    } catch (err) {
      console.error('[Thumbnail] export failed:', err)
      toast.error('Export failed')
    } finally {
      setIsExporting(false)
    }
  }, [])

  return (
    <ThumbnailContext.Provider
      value={{
        config,
        setBackground,
        setSubject,
        patchSubject,
        setHeadline,
        applyTemplate,
        reset,
        clearBackground,
        removeSubjectBackground,
        isCuttingOut,
        generateBackground,
        generateBackgroundVariations,
        bgVariations,
        chooseBackground,
        isGeneratingBg,
        stageRef,
        isExporting,
        exportPng,
      }}
    >
      {children}
    </ThumbnailContext.Provider>
  )
}
