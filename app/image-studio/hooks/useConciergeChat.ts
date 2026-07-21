"use client"

import { useCallback, useState } from 'react'
import type { VideoSettingsValue } from '../constants/video-settings-defaults'
import {
  resolveConciergePlan,
  type ConciergeGoalId,
  type ConciergePlan,
} from '../constants/concierge-tree'

/**
 * Concierge chat state: freeform messages go to /api/concierge, which replies
 * with either a clarifying question or a complete studio plan. Chip-origin
 * messages carry their goal id so an API failure can fall back to the static
 * decision tree instead of a dead end.
 */

export interface ConciergeChatMessage {
  role: 'user' | 'assistant'
  content: string
  plan?: ConciergePlan
}

interface ApiPlan {
  title: string
  mode: 'image' | 'video' | 'logo'
  video?: VideoSettingsValue
  videoPrompt?: string
  imagePrompt?: string
  imageAspectRatio?: string
  why: string
  draftFirst?: boolean
  steps: ConciergePlan['steps']
}

function toClientPlan(plan: ApiPlan): ConciergePlan {
  return {
    id: `ai-${Date.now()}`,
    title: plan.title,
    mode: plan.mode,
    video: plan.video,
    videoPrompt: plan.videoPrompt,
    imagePrompt: plan.imagePrompt,
    imageAspectRatio: plan.imageAspectRatio,
    why: plan.why,
    draftFirst: plan.draftFirst,
    steps: plan.steps,
  }
}

export function useConciergeChat() {
  const [messages, setMessages] = useState<ConciergeChatMessage[]>([])
  const [isThinking, setIsThinking] = useState(false)

  const send = useCallback(async (rawText: string, fallbackGoal?: ConciergeGoalId) => {
    const text = rawText.trim()
    if (!text || isThinking) return
    setIsThinking(true)
    setMessages((prev) => [...prev, { role: 'user', content: text }])

    try {
      const history = messages.slice(-10).map((m) => ({ role: m.role, content: m.content }))
      const response = await fetch('/api/concierge', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ message: text, history }),
      })
      const data = await response.json().catch(() => ({}))
      if (!response.ok) throw new Error(data?.error?.message || data?.error || `Concierge failed (${response.status})`)
      setMessages((prev) => [...prev, {
        role: 'assistant',
        content: data.message as string,
        plan: data.plan ? toClientPlan(data.plan as ApiPlan) : undefined,
      }])
    } catch (error) {
      console.error('[concierge] Send failed:', error)
      if (fallbackGoal) {
        const fallback = resolveConciergePlan(fallbackGoal, null)
        setMessages((prev) => [...prev, {
          role: 'assistant',
          content: 'I could not reach the AI just now, so here is the standard plan for that:',
          plan: fallback,
        }])
      } else {
        setMessages((prev) => [...prev, {
          role: 'assistant',
          content: error instanceof Error ? error.message : 'Sorry, I hit an error — try again.',
        }])
      }
    } finally {
      setIsThinking(false)
    }
  }, [messages, isThinking])

  const reset = useCallback(() => setMessages([]), [])

  return { messages, isThinking, send, reset }
}
