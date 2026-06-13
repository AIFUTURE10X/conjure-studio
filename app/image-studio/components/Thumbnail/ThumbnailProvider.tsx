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

interface ThumbnailContextValue {
  config: ThumbnailConfig
  setBackground: (patch: Partial<ThumbnailBackground>) => void
  setSubject: (subject: ThumbnailSubject | null) => void
  patchSubject: (patch: Partial<ThumbnailSubject>) => void
  setHeadline: (patch: Partial<ThumbnailHeadline>) => void
  applyTemplate: (id: string) => void
  reset: () => void
  removeSubjectBackground: () => Promise<void>
  isCuttingOut: boolean
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

function loadConfig(): ThumbnailConfig {
  if (typeof window === 'undefined') return DEFAULT_CONFIG
  try {
    const raw = window.localStorage.getItem(THUMB_STORAGE_KEY)
    if (!raw) return DEFAULT_CONFIG
    const parsed = JSON.parse(raw) as Partial<ThumbnailConfig>
    return {
      ...DEFAULT_CONFIG,
      ...parsed,
      background: { ...DEFAULT_CONFIG.background, ...parsed.background },
      headline: { ...DEFAULT_CONFIG.headline, ...parsed.headline },
      subject: parsed.subject ?? null,
    }
  } catch {
    return DEFAULT_CONFIG
  }
}

async function toDataUrl(url: string): Promise<string> {
  if (url.startsWith('data:')) return url
  const blob = await (await fetch(url)).blob()
  return await new Promise<string>((resolve, reject) => {
    const reader = new FileReader()
    reader.onload = () => resolve(reader.result as string)
    reader.onerror = () => reject(new Error('read failed'))
    reader.readAsDataURL(blob)
  })
}

export function ThumbnailProvider({ children }: { children: ReactNode }) {
  const [config, setConfig] = useState<ThumbnailConfig>(() => loadConfig())
  const [isExporting, setIsExporting] = useState(false)
  const [isCuttingOut, setIsCuttingOut] = useState(false)
  const stageRef = useRef<HTMLDivElement | null>(null)

  // Mirror config so async handlers read the latest value without re-binding.
  const configRef = useRef(config)
  useEffect(() => {
    configRef.current = config
  }, [config])

  // Persist config.
  useEffect(() => {
    try {
      window.localStorage.setItem(THUMB_STORAGE_KEY, JSON.stringify(config))
    } catch {
      // ignore storage failures
    }
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

  const reset = useCallback(() => setConfig(DEFAULT_CONFIG), [])

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
        removeSubjectBackground,
        isCuttingOut,
        stageRef,
        isExporting,
        exportPng,
      }}
    >
      {children}
    </ThumbnailContext.Provider>
  )
}
