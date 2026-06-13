"use client"

/**
 * ThumbnailProvider
 *
 * Isolated state for the Thumbnail mode (config + layer actions + export +
 * history), shared between the center canvas and the settings rail. Kept
 * separate from StudioProvider so the new mode can't affect the existing modes.
 * Config is persisted to localStorage; heavy AI/export/history logic lives in
 * dedicated hooks (useThumbnailGenerate / useThumbnailExport / useThumbnailHistory).
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
import {
  BLANK_CONFIG,
  DEFAULT_ADJUST,
  DEFAULT_SUBJECT_FX,
  THUMBNAIL_TEMPLATES,
  THUMB_STORAGE_KEY,
  createSticker,
  type ImageAdjust,
  type SubjectFx,
  type ThumbnailBackground,
  type ThumbnailConfig,
  type ThumbnailFormat,
  type ThumbnailHeadline,
  type ThumbnailHistoryItem,
  type ThumbnailSticker,
  type ThumbnailSubject,
  type UpscaleTarget,
} from './thumbnail-constants'
import { loadThumbnailConfig } from './thumbnail-utils'
import { useThumbnailGenerate } from './useThumbnailGenerate'
import { useThumbnailExport } from './useThumbnailExport'
import { useThumbnailHistory } from './useThumbnailHistory'
import { useThumbnailArrange } from './useThumbnailArrange'

interface ThumbnailContextValue {
  config: ThumbnailConfig
  setBackground: (patch: Partial<ThumbnailBackground>) => void
  setSubject: (subject: ThumbnailSubject | null) => void
  patchSubject: (patch: Partial<ThumbnailSubject>) => void
  patchSubjectFx: (patch: Partial<SubjectFx>) => void
  patchSubjectAdjust: (patch: Partial<ImageAdjust>) => void
  patchBackgroundAdjust: (patch: Partial<ImageAdjust>) => void
  setHeadline: (patch: Partial<ThumbnailHeadline>) => void
  applyTemplate: (id: string) => void
  applyConfig: (config: ThumbnailConfig) => void
  reset: () => void
  clearBackground: () => void
  selectedStickerId: string | null
  setSelectedStickerId: (id: string | null) => void
  addSticker: (sticker: ThumbnailSticker) => void
  addImageSticker: (url: string) => void
  patchSticker: (id: string, patch: Partial<ThumbnailSticker>) => void
  removeSticker: (id: string) => void
  reorderSticker: (id: string, dir: 'forward' | 'back') => void
  nudgeSelected: (dx: number, dy: number) => void
  alignSelected: (x: number | null, y: number | null) => void
  setSubjectOnTop: (on: boolean) => void
  removeSubjectBackground: () => Promise<void>
  isCuttingOut: boolean
  generateBackground: (idea: string, stylePrompt: string, options?: { model?: string; imageSize?: string }) => Promise<void>
  generateBackgroundVariations: (idea: string, stylePrompt: string, options?: { model?: string; imageSize?: string }) => Promise<void>
  bgVariations: string[]
  chooseBackground: (url: string) => void
  isGeneratingBg: boolean
  recolorBackground: (colorNames: string[]) => Promise<void>
  isRecoloring: boolean
  expandBackground: () => Promise<void>
  enhanceImage: (target: 'subject' | 'background') => Promise<void>
  isExpanding: boolean
  isEnhancing: boolean
  stageRef: RefObject<HTMLDivElement | null>
  isExporting: boolean
  exportImage: (format: ThumbnailFormat) => Promise<void>
  upscaleExport: (target: UpscaleTarget) => Promise<void>
  isUpscaling: boolean
  capturePreview: () => Promise<string | null>
  history: ThumbnailHistoryItem[]
  isSavingHistory: boolean
  saveThumbnail: () => Promise<void>
  deleteThumbnail: (id: string) => Promise<void>
}

const ThumbnailContext = createContext<ThumbnailContextValue | null>(null)

export function useThumbnail() {
  const ctx = useContext(ThumbnailContext)
  if (!ctx) throw new Error('useThumbnail must be used within ThumbnailProvider')
  return ctx
}

export function ThumbnailProvider({ children }: { children: ReactNode }) {
  const [config, setConfig] = useState<ThumbnailConfig>(() => loadThumbnailConfig())
  const [selectedStickerId, setSelectedStickerId] = useState<string | null>(null)
  const stageRef = useRef<HTMLDivElement | null>(null)

  // Mirror config + selection so async/keyboard handlers read the latest values.
  const configRef = useRef(config)
  useEffect(() => {
    configRef.current = config
  }, [config])

  const selectedRef = useRef(selectedStickerId)
  useEffect(() => {
    selectedRef.current = selectedStickerId
  }, [selectedStickerId])

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

  const generate = useThumbnailGenerate({ setConfig, configRef })
  const exporter = useThumbnailExport(stageRef)
  const historyApi = useThumbnailHistory(stageRef, configRef)

  const setBackground = useCallback((patch: Partial<ThumbnailBackground>) => {
    setConfig((c) => ({ ...c, background: { ...c.background, ...patch } }))
  }, [])

  const setSubject = useCallback((subject: ThumbnailSubject | null) => {
    setConfig((c) => ({ ...c, subject }))
  }, [])

  const patchSubject = useCallback((patch: Partial<ThumbnailSubject>) => {
    setConfig((c) => (c.subject ? { ...c, subject: { ...c.subject, ...patch } } : c))
  }, [])

  const patchSubjectFx = useCallback((patch: Partial<SubjectFx>) => {
    setConfig((c) =>
      c.subject ? { ...c, subject: { ...c.subject, fx: { ...DEFAULT_SUBJECT_FX, ...c.subject.fx, ...patch } } } : c,
    )
  }, [])

  const patchSubjectAdjust = useCallback((patch: Partial<ImageAdjust>) => {
    setConfig((c) =>
      c.subject ? { ...c, subject: { ...c.subject, adjust: { ...DEFAULT_ADJUST, ...c.subject.adjust, ...patch } } } : c,
    )
  }, [])

  const patchBackgroundAdjust = useCallback((patch: Partial<ImageAdjust>) => {
    setConfig((c) => ({ ...c, background: { ...c.background, adjust: { ...DEFAULT_ADJUST, ...c.background.adjust, ...patch } } }))
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

  const applyConfig = useCallback((next: ThumbnailConfig) => {
    setSelectedStickerId(null)
    generate.clearVariations()
    setConfig(next)
  }, [generate])

  const reset = useCallback(() => {
    generate.clearVariations()
    setSelectedStickerId(null)
    setConfig(BLANK_CONFIG)
  }, [generate])

  const addSticker = useCallback((sticker: ThumbnailSticker) => {
    setConfig((c) => ({ ...c, stickers: [...c.stickers, sticker] }))
    setSelectedStickerId(sticker.id)
  }, [])

  const addImageSticker = useCallback((url: string) => {
    const sticker = createSticker('image', url, { x: 86, y: 86, size: 14 })
    setConfig((c) => ({ ...c, stickers: [...c.stickers, sticker] }))
    setSelectedStickerId(sticker.id)
  }, [])

  const patchSticker = useCallback((id: string, patch: Partial<ThumbnailSticker>) => {
    setConfig((c) => ({ ...c, stickers: c.stickers.map((s) => (s.id === id ? { ...s, ...patch } : s)) }))
  }, [])

  const removeSticker = useCallback((id: string) => {
    setConfig((c) => ({ ...c, stickers: c.stickers.filter((s) => s.id !== id) }))
    setSelectedStickerId((cur) => (cur === id ? null : cur))
  }, [])

  const { reorderSticker, nudgeSelected, alignSelected, setSubjectOnTop } = useThumbnailArrange({ setConfig, selectedRef })

  return (
    <ThumbnailContext.Provider
      value={{
        config,
        setBackground,
        setSubject,
        patchSubject,
        patchSubjectFx,
        patchSubjectAdjust,
        patchBackgroundAdjust,
        setHeadline,
        applyTemplate,
        applyConfig,
        reset,
        clearBackground: generate.clearBackground,
        selectedStickerId,
        setSelectedStickerId,
        addSticker,
        addImageSticker,
        patchSticker,
        removeSticker,
        reorderSticker,
        nudgeSelected,
        alignSelected,
        setSubjectOnTop,
        removeSubjectBackground: generate.removeSubjectBackground,
        isCuttingOut: generate.isCuttingOut,
        generateBackground: generate.generateBackground,
        generateBackgroundVariations: generate.generateBackgroundVariations,
        bgVariations: generate.bgVariations,
        chooseBackground: generate.chooseBackground,
        isGeneratingBg: generate.isGeneratingBg,
        recolorBackground: generate.recolorBackground,
        isRecoloring: generate.isRecoloring,
        expandBackground: generate.expandBackground,
        enhanceImage: generate.enhanceImage,
        isExpanding: generate.isExpanding,
        isEnhancing: generate.isEnhancing,
        stageRef,
        isExporting: exporter.isExporting,
        exportImage: exporter.exportImage,
        upscaleExport: exporter.upscaleExport,
        isUpscaling: exporter.isUpscaling,
        capturePreview: exporter.capturePreview,
        history: historyApi.history,
        isSavingHistory: historyApi.isSavingHistory,
        saveThumbnail: historyApi.saveThumbnail,
        deleteThumbnail: historyApi.deleteThumbnail,
      }}
    >
      {children}
    </ThumbnailContext.Provider>
  )
}
