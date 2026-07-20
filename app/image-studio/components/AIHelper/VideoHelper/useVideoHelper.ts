"use client"

import { useCallback, useEffect, useState } from 'react'
import { toast } from 'sonner'
import { useStudioCore } from '../../../context/useStudio'
import { useHelperBridge, type StoryPlanShot } from '../../../context/HelperBridgeProvider'

/**
 * Video-mode AI helper chat. Talks to /api/video-prompt-helper with the
 * live video context; assistant replies can carry applyable payloads
 * (video prompt, settings patch, revised Story Mode shot plan). Registers
 * itself as the bridge runner while mounted so "Improve with AI" and
 * Story Mode's "Refine with AI" seed this chat.
 */

export interface VideoHelperMessage {
  role: 'user' | 'assistant'
  content: string
  videoPrompt?: string
  settings?: {
    model?: string
    duration?: number
    resolution?: string
    aspectRatio?: string
    generateAudio?: boolean
  }
  revisedShots?: StoryPlanShot[]
}

const WELCOME = 'I’m your video director. Ask me to write a motion prompt, pick the right model for a shot, plan a multi-shot story, or explain any tool. When I propose something, an Apply button appears under my reply.'

export function useVideoHelper() {
  const { state } = useStudioCore()
  const { registerHelperRunner, applyStoryPlan } = useHelperBridge()
  const [messages, setMessages] = useState<VideoHelperMessage[]>([])
  const [input, setInput] = useState('')
  const [isThinking, setIsThinking] = useState(false)

  const send = useCallback(async (rawText: string) => {
    const text = rawText.trim()
    if (!text || isThinking) return
    setIsThinking(true)
    setMessages((prev) => [...prev, { role: 'user', content: text }])
    setInput('')

    try {
      const history = messages.slice(-10).map((m) => ({ role: m.role, content: m.content }))
      const response = await fetch('/api/video-prompt-helper', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          message: text,
          history,
          context: {
            currentPrompt: state.videoPrompt,
            hasStartFrame: Boolean(state.videoStartFrame),
            hasEndFrame: Boolean(state.videoEndFrame),
            settings: state.videoSettings,
          },
        }),
      })
      const data = await response.json().catch(() => ({}))
      if (!response.ok) throw new Error(data.error || `Helper failed (${response.status})`)
      setMessages((prev) => [...prev, {
        role: 'assistant',
        content: data.message as string,
        videoPrompt: data.videoPrompt,
        settings: data.settings,
        revisedShots: data.revisedShots,
      }])
    } catch (error) {
      console.error('[video-helper] Send failed:', error)
      setMessages((prev) => [...prev, {
        role: 'assistant',
        content: error instanceof Error ? error.message : 'Sorry, I hit an error — try again.',
      }])
    } finally {
      setIsThinking(false)
    }
  }, [messages, isThinking, state.videoPrompt, state.videoStartFrame, state.videoEndFrame, state.videoSettings])

  // Bridge runner: "Improve with AI" / "Refine with AI" seed this chat while
  // it is mounted (video mode). HelperPanel skips its own registration then.
  useEffect(() => {
    registerHelperRunner((prompt) => void send(prompt))
    return () => registerHelperRunner(null)
  }, [registerHelperRunner, send])

  const applyPrompt = useCallback((message: VideoHelperMessage) => {
    if (!message.videoPrompt) return
    state.setVideoPrompt(message.videoPrompt)
    toast.success('Prompt applied to the video generator')
  }, [state.setVideoPrompt])

  const applySettings = useCallback((message: VideoHelperMessage) => {
    if (!message.settings) return
    state.setVideoSettings({ ...state.videoSettings, ...message.settings } as typeof state.videoSettings)
    toast.success('Settings applied to the video generator')
  }, [state.videoSettings, state.setVideoSettings])

  const applyShots = useCallback((message: VideoHelperMessage) => {
    if (!message.revisedShots?.length) return
    const applied = applyStoryPlan(message.revisedShots)
    if (applied) toast.success('Revised shot plan applied in Story Mode')
    else toast.error('Story Mode is not available to receive the plan')
  }, [applyStoryPlan])

  const clearChat = useCallback(() => setMessages([]), [])

  return {
    messages,
    welcome: WELCOME,
    input,
    setInput,
    isThinking,
    send,
    applyPrompt,
    applySettings,
    applyShots,
    clearChat,
  }
}
