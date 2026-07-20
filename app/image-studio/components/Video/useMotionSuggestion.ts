"use client"

import { useCallback, useEffect, useRef, useState } from 'react'
import { toast } from 'sonner'

/**
 * Auto-writes a motion prompt from the start frame (Midjourney-style "Auto"):
 * when a new start frame lands and the prompt box is empty, fetch a
 * suggestion and fill it. Never overwrites text the user has typed.
 * Also exposes suggestNow() for the manual "Suggest motion" button, which
 * DOES replace the current prompt (explicit user action).
 */
export function useMotionSuggestion({
  startFrameUrl,
  prompt,
  setPrompt,
}: {
  startFrameUrl: string | null
  prompt: string
  setPrompt: (value: string) => void
}) {
  const [isSuggesting, setIsSuggesting] = useState(false)
  const lastAutoUrlRef = useRef<string | null>(null)
  const requestIdRef = useRef(0)

  const fetchSuggestion = useCallback(async (imageUrl: string): Promise<string | null> => {
    const requestId = ++requestIdRef.current
    setIsSuggesting(true)
    try {
      const response = await fetch('/api/suggest-motion-prompt', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ imageUrl }),
      })
      const data = await response.json().catch(() => ({}))
      if (!response.ok) throw new Error(data.error || 'Suggestion failed')
      // A newer request superseded this one — drop the stale result.
      if (requestId !== requestIdRef.current) return null
      return typeof data.motionPrompt === 'string' ? data.motionPrompt : null
    } finally {
      if (requestId === requestIdRef.current) setIsSuggesting(false)
    }
  }, [])

  // Auto-fill on a fresh start frame when the prompt box is empty.
  const promptIsEmpty = prompt.trim().length === 0
  useEffect(() => {
    if (!startFrameUrl || !promptIsEmpty) return
    if (lastAutoUrlRef.current === startFrameUrl) return
    lastAutoUrlRef.current = startFrameUrl

    let cancelled = false
    fetchSuggestion(startFrameUrl)
      .then((suggestion) => {
        if (!cancelled && suggestion) setPrompt(suggestion)
      })
      .catch((error) => console.error('[motion-prompt] Auto-suggest failed:', error))
    return () => { cancelled = true }
  }, [startFrameUrl, promptIsEmpty, fetchSuggestion, setPrompt])

  const suggestNow = useCallback(async () => {
    if (!startFrameUrl || isSuggesting) return
    try {
      const suggestion = await fetchSuggestion(startFrameUrl)
      if (suggestion) setPrompt(suggestion)
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Could not suggest a motion prompt')
    }
  }, [startFrameUrl, isSuggesting, fetchSuggestion, setPrompt])

  return { isSuggesting, suggestNow }
}
