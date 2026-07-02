"use client"

/**
 * EditChatProvider
 *
 * Conversational "Edit in chat" engine for the studio. Tracks one target
 * image at a time as a version history (the original plus each AI-edited
 * result), replays the current working version through /api/edit-image on
 * every user instruction (optionally scoped by a painted mask), and lets
 * the caller apply any version back to the studio canvas via
 * useImageGenerationEngine().applyEditedImage. Must be mounted inside
 * ImageGenerationProvider — it calls useImageGenerationEngine at the top
 * level of the provider component.
 *
 * Multi-variant responses (variants > 1) don't create a version right away:
 * they're held on the assistant message as `candidateUrls` until the user
 * picks one via chooseCandidate. The painted mask is intentionally NOT
 * cleared after a send — it stays attached so re-roll/"more like this" and
 * quick follow-ups against the same region are one click, not a repaint.
 */

import { createContext, useCallback, useContext, useMemo, useRef, useState, type ReactNode } from 'react'
import { toast } from 'sonner'
import {
  editResponseUrls,
  loadImageElement,
  parseEditResponse,
  prepareImageForEdit,
  scaleMaskBlob,
} from '../components/ImageEditor/upload-prep'
import { useImageGenerationEngine } from './ImageGenerationProvider'
import type { EditChatEngine, EditChatMessage, EditChatTarget, EditChatVersion, PendingMask } from './edit-chat-types'

export type {
  EditChatEngine,
  EditChatMessage,
  EditChatTarget,
  EditChatVersion,
  PendingMask,
} from './edit-chat-types'

const EditChatContext = createContext<EditChatEngine | null>(null)

const WELCOME_TEXT =
  'Describe the change you want — or paint an area first so the edit only touches that spot.'
const DEFAULT_VARIATION_INSTRUCTION =
  'subtle natural variation of this image; keep composition, subject and style identical'
const REMOVE_LABEL = '(remove the painted area)'
const DEFAULT_VARIANTS = 2

// Plain counter is enough for React keys in a single-tab chat — no need for
// crypto.randomUUID's collision guarantees here.
let messageSeq = 0
const nextMessageId = () => {
  messageSeq += 1
  return `edit-chat-${Date.now()}-${messageSeq}`
}

export function EditChatProvider({ children }: { children: ReactNode }) {
  const { applyEditedImage } = useImageGenerationEngine()

  const [target, setTarget] = useState<EditChatTarget | null>(null)
  const [versions, setVersions] = useState<EditChatVersion[]>([])
  const [currentVersionIndex, setCurrentVersionIndex] = useState(0)
  const [messages, setMessages] = useState<EditChatMessage[]>([])
  const [isEditing, setIsEditing] = useState(false)
  const [pendingMask, setPendingMask] = useState<PendingMask | null>(null)
  const [variants, setVariants] = useState(DEFAULT_VARIANTS)
  const lastInstructionRef = useRef('')

  const startEditChat = useCallback((index: number, url: string) => {
    setTarget({ index, originalUrl: url })
    setVersions([{ url, label: 'Original' }])
    setCurrentVersionIndex(0)
    setMessages([{ id: nextMessageId(), role: 'assistant', text: WELCOME_TEXT }])
    setPendingMask(null)
    lastInstructionRef.current = ''
  }, [])

  const exitEditChat = useCallback(() => {
    setTarget(null)
    setVersions([])
    setCurrentVersionIndex(0)
    setMessages([])
    setPendingMask(null)
    setIsEditing(false)
    lastInstructionRef.current = ''
  }, [])

  const currentImageUrl = useCallback(
    () => versions[currentVersionIndex]?.url,
    [versions, currentVersionIndex],
  )

  // Shared edit flow. `sourceIndex` is threaded through explicitly (rather
  // than reading currentVersionIndex state inside) so callers that just
  // changed the working version — moreLikeVersion — don't race a stale
  // closure from a setState that hasn't committed yet.
  const runEdit = useCallback(async (instructionRaw: string, sourceIndex: number) => {
    if (isEditing || !target) return
    const trimmed = instructionRaw.trim()
    const activeMask = pendingMask
    const isRemove = !trimmed && !!activeMask
    if (!trimmed && !activeMask) return

    lastInstructionRef.current = trimmed

    setMessages((prev) => [
      ...prev,
      { id: nextMessageId(), role: 'user', text: isRemove ? REMOVE_LABEL : trimmed, hasMask: !!activeMask },
    ])
    setIsEditing(true)

    const sourceUrl = versions[sourceIndex]?.url
    const pushError = (text: string) => {
      setMessages((prev) => [...prev, { id: nextMessageId(), role: 'assistant', isError: true, text }])
    }

    try {
      if (!sourceUrl) {
        pushError('Could not find the current image to edit.')
        return
      }

      // Downscale/re-encode to fit Vercel's request-body cap — edit results
      // are 2K PNGs, and reposting one unmodified for the next round 413s.
      let prepared: Awaited<ReturnType<typeof prepareImageForEdit>>
      try {
        prepared = await prepareImageForEdit(await loadImageElement(sourceUrl))
      } catch (error) {
        console.error('[EditChat] failed to load source image:', error)
        toast.error('Network error — could not load the current image')
        pushError('Could not load the current image. Check your connection and try again.')
        return
      }

      const formData = new FormData()
      formData.append('image', prepared.blob, prepared.fileName)
      if (activeMask) {
        // The mask was painted at the source's natural size; rescale it to
        // the exact pixel size actually being uploaded.
        formData.append('mask', await scaleMaskBlob(activeMask.blob, prepared.width, prepared.height), 'mask.png')
        formData.append('mode', isRemove ? 'erase' : 'replace')
      }
      if (trimmed) formData.append('prompt', trimmed)
      formData.append('variants', String(variants))

      let response: Response
      try {
        response = await fetch('/api/edit-image', { method: 'POST', body: formData })
      } catch (error) {
        console.error('[EditChat] request failed:', error)
        toast.error('Network error — check your connection and try again')
        pushError('The edit request could not reach the server. Check your connection and try again.')
        return
      }

      const data = await parseEditResponse(response)
      const urls = editResponseUrls(data)
      if (!response.ok || urls.length === 0) {
        pushError(data.error || 'Edit failed')
        return
      }

      if (urls.length > 1) {
        setMessages((prev) => [
          ...prev,
          { id: nextMessageId(), role: 'assistant', candidateUrls: urls, instruction: trimmed },
        ])
        return
      }

      const newIndex = versions.length
      setVersions([...versions, { url: urls[0], label: `Edit ${newIndex}`, promptUsed: trimmed }])
      setCurrentVersionIndex(newIndex)
      setMessages((prev) => [
        ...prev,
        { id: nextMessageId(), role: 'assistant', resultVersionIndex: newIndex, text: trimmed },
      ])
    } finally {
      setIsEditing(false)
    }
  }, [isEditing, target, pendingMask, versions, variants])

  const sendEdit = useCallback(
    (instruction: string) => runEdit(instruction, currentVersionIndex),
    [runEdit, currentVersionIndex],
  )

  const rerollLast = useCallback(
    () => runEdit(lastInstructionRef.current, currentVersionIndex),
    [runEdit, currentVersionIndex],
  )

  const moreLikeVersion = useCallback((index: number) => {
    setCurrentVersionIndex(index)
    const instruction = versions[index]?.promptUsed ?? DEFAULT_VARIATION_INSTRUCTION
    return runEdit(instruction, index)
  }, [runEdit, versions])

  const chooseCandidate = useCallback((messageId: string, url: string) => {
    const message = messages.find((m) => m.id === messageId)
    const newIndex = versions.length
    setVersions([...versions, { url, label: `Edit ${newIndex}`, promptUsed: message?.instruction }])
    setCurrentVersionIndex(newIndex)
    setMessages((prev) =>
      prev.map((m) => (m.id === messageId ? { ...m, chosenUrl: url, resultVersionIndex: newIndex } : m)),
    )
  }, [messages, versions])

  const revertToVersion = useCallback((index: number) => {
    setCurrentVersionIndex(index)
    setMessages((prev) => [
      ...prev,
      { id: nextMessageId(), role: 'assistant', text: `Now working from ${versions[index]?.label ?? 'that version'}.` },
    ])
  }, [versions])

  const applyVersionToCanvas = useCallback(async (index: number) => {
    if (!target) return
    const version = versions[index]
    if (!version) return
    try {
      await applyEditedImage(target.index, version.url, version.promptUsed || 'chat edit')
    } catch (error) {
      console.error('[EditChat] apply to canvas failed:', error)
      toast.error('Could not apply this version to the canvas')
    }
  }, [target, versions, applyEditedImage])

  const value = useMemo<EditChatEngine>(() => ({
    target,
    versions,
    currentVersionIndex,
    messages,
    isEditing,
    pendingMask,
    variants,
    setVariants,
    startEditChat,
    exitEditChat,
    setPendingMask,
    currentImageUrl,
    sendEdit,
    rerollLast,
    moreLikeVersion,
    chooseCandidate,
    revertToVersion,
    applyVersionToCanvas,
  }), [
    target, versions, currentVersionIndex, messages, isEditing, pendingMask, variants,
    startEditChat, exitEditChat, currentImageUrl, sendEdit, rerollLast, moreLikeVersion,
    chooseCandidate, revertToVersion, applyVersionToCanvas,
  ])

  return <EditChatContext.Provider value={value}>{children}</EditChatContext.Provider>
}

export function useEditChat(): EditChatEngine {
  const engine = useContext(EditChatContext)
  if (engine === null) {
    throw new Error('useEditChat must be used within <EditChatProvider>')
  }
  return engine
}
