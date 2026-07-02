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
 */

import { createContext, useCallback, useContext, useMemo, useState, type ReactNode } from 'react'
import { toast } from 'sonner'
import { useImageGenerationEngine } from './ImageGenerationProvider'

export interface EditChatVersion {
  url: string
  label: string
  /** The instruction that produced this version, if any (absent for "Original"). */
  promptUsed?: string
}

export interface EditChatMessage {
  id: string
  role: 'user' | 'assistant'
  text?: string
  hasMask?: boolean
  resultVersionIndex?: number
  isError?: boolean
}

export interface PendingMask {
  blob: Blob
  previewUrl: string
}

export interface EditChatTarget {
  index: number
  originalUrl: string
}

export interface EditChatEngine {
  target: EditChatTarget | null
  versions: EditChatVersion[]
  currentVersionIndex: number
  messages: EditChatMessage[]
  isEditing: boolean
  pendingMask: PendingMask | null
  startEditChat: (index: number, url: string) => void
  exitEditChat: () => void
  setPendingMask: (mask: PendingMask | null) => void
  currentImageUrl: () => string | undefined
  sendEdit: (instruction: string) => Promise<void>
  revertToVersion: (index: number) => void
  applyVersionToCanvas: (index: number) => Promise<void>
}

const EditChatContext = createContext<EditChatEngine | null>(null)

const WELCOME_TEXT =
  'Describe the change you want — or paint an area first so the edit only touches that spot.'

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

  const startEditChat = useCallback((index: number, url: string) => {
    setTarget({ index, originalUrl: url })
    setVersions([{ url, label: 'Original' }])
    setCurrentVersionIndex(0)
    setMessages([{ id: nextMessageId(), role: 'assistant', text: WELCOME_TEXT }])
    setPendingMask(null)
  }, [])

  const exitEditChat = useCallback(() => {
    setTarget(null)
    setVersions([])
    setCurrentVersionIndex(0)
    setMessages([])
    setPendingMask(null)
    setIsEditing(false)
  }, [])

  const currentImageUrl = useCallback(
    () => versions[currentVersionIndex]?.url,
    [versions, currentVersionIndex],
  )

  const sendEdit = useCallback(async (instruction: string) => {
    const trimmed = instruction.trim()
    if (isEditing || !target || !trimmed) return

    setMessages((prev) => [
      ...prev,
      { id: nextMessageId(), role: 'user', text: trimmed, hasMask: !!pendingMask },
    ])
    setIsEditing(true)

    const activeMask = pendingMask
    const sourceUrl = versions[currentVersionIndex]?.url
    const pushError = (text: string) => {
      setMessages((prev) => [...prev, { id: nextMessageId(), role: 'assistant', isError: true, text }])
    }

    try {
      if (!sourceUrl) {
        pushError('Could not find the current image to edit.')
        return
      }

      let imageBlob: Blob
      try {
        const sourceResponse = await fetch(sourceUrl)
        imageBlob = await sourceResponse.blob()
      } catch (error) {
        console.error('[EditChat] failed to load source image:', error)
        toast.error('Network error — could not load the current image')
        pushError('Could not load the current image. Check your connection and try again.')
        return
      }

      const formData = new FormData()
      formData.append('image', new File([imageBlob], 'image.png', { type: 'image/png' }))
      if (activeMask) {
        formData.append('mask', activeMask.blob, 'mask.png')
        formData.append('mode', 'replace')
      }
      formData.append('prompt', trimmed)

      let response: Response
      try {
        response = await fetch('/api/edit-image', { method: 'POST', body: formData })
      } catch (error) {
        console.error('[EditChat] request failed:', error)
        toast.error('Network error — check your connection and try again')
        pushError('The edit request could not reach the server. Check your connection and try again.')
        return
      }

      const data = (await response.json().catch(() => ({}))) as {
        success?: boolean
        image?: string
        error?: string
      }
      if (!response.ok || !data.image) {
        pushError(data.error || 'Edit failed')
        return
      }

      const newIndex = versions.length
      setVersions([...versions, { url: data.image, label: `Edit ${newIndex}`, promptUsed: trimmed }])
      setCurrentVersionIndex(newIndex)
      setMessages((prev) => [
        ...prev,
        { id: nextMessageId(), role: 'assistant', resultVersionIndex: newIndex, text: trimmed },
      ])
      setPendingMask(null)
    } finally {
      setIsEditing(false)
    }
  }, [isEditing, target, pendingMask, versions, currentVersionIndex])

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
    startEditChat,
    exitEditChat,
    setPendingMask,
    currentImageUrl,
    sendEdit,
    revertToVersion,
    applyVersionToCanvas,
  }), [
    target, versions, currentVersionIndex, messages, isEditing, pendingMask,
    startEditChat, exitEditChat, currentImageUrl, sendEdit, revertToVersion, applyVersionToCanvas,
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
