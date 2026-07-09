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
 *
 * versions/messages append via functional setState (not a stale-closure
 * spread) since chooseCandidate can race an in-flight runEdit.
 */

import { createContext, useCallback, useContext, useMemo, useState, type ReactNode } from 'react'
import { toast } from 'sonner'
import {
  editResponseUrls,
  loadImageElement,
  parseEditResponse,
  prepareImageForEdit,
} from '../components/ImageEditor/upload-prep'
import { useImageGenerationEngine } from './ImageGenerationProvider'
import { appendVersion, buildEditFormData, isMaskAspectStale, useRefBackedState } from './edit-chat-helpers'
import {
  findNewestResultMessage,
  type EditChatEngine,
  type EditChatMessage,
  type EditChatTarget,
  type EditChatVersion,
  type PendingMask,
} from './edit-chat-types'

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
const DEFAULT_VARIANTS = 1
const DIMENSION_CHANGED_HINT = 'The image size changed — repaint the area to scope this edit.'

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
  const [variants, setVariants] = useState(DEFAULT_VARIANTS)
  const [expectedCanvasUrl, setExpectedCanvasUrl] = useState<string | undefined>(undefined)
  // Ref-backed: runEdit must see moreLikeVersion's mask-clear immediately,
  // not on the next render (see useRefBackedState).
  const [pendingMaskState, setPendingMask, pendingMaskRef] = useRefBackedState<PendingMask | null>(null)
  const [lastInstruction, setLastInstruction, lastInstructionRef] = useRefBackedState('')

  const startEditChat = useCallback((index: number, url: string) => {
    setTarget({ index, originalUrl: url })
    setVersions([{ url, label: 'Original' }])
    setCurrentVersionIndex(0)
    setMessages([{ id: nextMessageId(), role: 'assistant', text: WELCOME_TEXT }])
    setPendingMask(null)
    setExpectedCanvasUrl(url)
    setLastInstruction('')
  }, [setPendingMask, setLastInstruction])

  const exitEditChat = useCallback(() => {
    setTarget(null)
    setVersions([])
    setCurrentVersionIndex(0)
    setMessages([])
    setPendingMask(null)
    setIsEditing(false)
    setExpectedCanvasUrl(undefined)
    setLastInstruction('')
  }, [setPendingMask, setLastInstruction])

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
    let activeMask = pendingMaskRef.current
    const isRemove = !trimmed && !!activeMask
    if (!trimmed && !activeMask) return

    setLastInstruction(trimmed)

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

      // A mask painted at a different aspect ratio would silently stretch
      // to scope the wrong region instead of failing loudly.
      if (activeMask && isMaskAspectStale(prepared.width, prepared.height, activeMask)) {
        activeMask = null
        setPendingMask(null)
        setMessages((prev) => [...prev, { id: nextMessageId(), role: 'assistant', text: DIMENSION_CHANGED_HINT }])
        if (!trimmed) return
      }

      const formData = await buildEditFormData({
        imageBlob: prepared.blob,
        fileName: prepared.fileName,
        imageWidth: prepared.width,
        imageHeight: prepared.height,
        mask: activeMask,
        isRemove,
        trimmedInstruction: trimmed,
        variants,
      })

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
          { id: nextMessageId(), role: 'assistant', candidateUrls: urls, instruction: trimmed, sourceIndex },
        ])
        return
      }

      const newIndex = appendVersion(setVersions, (i) => ({ url: urls[0], label: `Edit ${i}`, promptUsed: trimmed }))
      setCurrentVersionIndex(newIndex)
      setMessages((prev) => [
        ...prev,
        { id: nextMessageId(), role: 'assistant', resultVersionIndex: newIndex, text: trimmed, sourceIndex },
      ])
    } finally {
      setIsEditing(false)
    }
  }, [isEditing, target, versions, variants, setPendingMask, setLastInstruction, pendingMaskRef])

  const sendEdit = useCallback(
    (instruction: string) => runEdit(instruction, currentVersionIndex),
    [runEdit, currentVersionIndex],
  )

  const rerollLast = useCallback(() => {
    const newest = findNewestResultMessage(messages)
    const sourceIndex = newest?.sourceIndex ?? currentVersionIndex
    return runEdit(lastInstructionRef.current, sourceIndex)
  }, [runEdit, messages, currentVersionIndex, lastInstructionRef])

  const moreLikeVersion = useCallback((index: number) => {
    setCurrentVersionIndex(index)
    // A mask painted for a previous edit shouldn't silently scope a
    // "more like this" variation of a different version.
    setPendingMask(null)
    const instruction = versions[index]?.promptUsed || DEFAULT_VARIATION_INSTRUCTION
    return runEdit(instruction, index)
  }, [runEdit, versions, setPendingMask])

  const chooseCandidate = useCallback((messageId: string, url: string) => {
    const message = messages.find((m) => m.id === messageId)
    const newIndex = appendVersion(setVersions, (i) => ({ url, label: `Edit ${i}`, promptUsed: message?.instruction }))
    setCurrentVersionIndex(newIndex)
    setMessages((prev) =>
      prev.map((m) => (m.id === messageId ? { ...m, chosenUrl: url, resultVersionIndex: newIndex } : m)),
    )
  }, [messages])

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
      const applied = await applyEditedImage(target.index, version.url, version.promptUsed || 'chat edit', expectedCanvasUrl)
      if (applied) setExpectedCanvasUrl(version.url)
    } catch (error) {
      console.error('[EditChat] apply to canvas failed:', error)
      toast.error('Could not apply this version to the canvas')
    }
  }, [target, versions, applyEditedImage, expectedCanvasUrl])

  const canReroll = lastInstruction !== '' || pendingMaskState !== null

  const value = useMemo<EditChatEngine>(() => ({
    target,
    versions,
    currentVersionIndex,
    messages,
    isEditing,
    pendingMask: pendingMaskState,
    variants,
    canReroll,
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
    target, versions, currentVersionIndex, messages, isEditing, pendingMaskState, variants, canReroll,
    startEditChat, exitEditChat, setPendingMask, currentImageUrl, sendEdit, rerollLast, moreLikeVersion,
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
