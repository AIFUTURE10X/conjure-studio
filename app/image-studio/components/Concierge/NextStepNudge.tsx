"use client"

import { useEffect, useState, type ReactNode } from 'react'
import { Lightbulb, X } from 'lucide-react'

interface NextStepNudgeProps {
  /** Stable id — drives the dismissed flag and the show-count cap. */
  nudgeKey: string
  children: ReactNode
}

const MAX_SHOWS = 3

const dismissedKey = (key: string) => `conjure-nudge-dismissed:${key}`
const countKey = (key: string) => `conjure-nudge-count:${key}`
const sessionKey = (key: string) => `conjure-nudge-counted:${key}`

/**
 * Small dismissible teaching ribbon shown at the moment a next step becomes
 * possible (first images → Animate; first clip → Extend/Assemble). Dismiss is
 * permanent; otherwise it appears for at most MAX_SHOWS sessions.
 */
export function NextStepNudge({ nudgeKey, children }: NextStepNudgeProps) {
  const [visible, setVisible] = useState(false)

  useEffect(() => {
    try {
      if (localStorage.getItem(dismissedKey(nudgeKey))) return
      const shows = Number(localStorage.getItem(countKey(nudgeKey)) ?? '0')
      if (shows >= MAX_SHOWS) return
      // Count once per browser session so a re-render doesn't burn a show.
      if (!sessionStorage.getItem(sessionKey(nudgeKey))) {
        sessionStorage.setItem(sessionKey(nudgeKey), '1')
        localStorage.setItem(countKey(nudgeKey), String(shows + 1))
      }
      setVisible(true)
    } catch {
      // Storage unavailable — skip the nudge rather than nag forever.
    }
  }, [nudgeKey])

  if (!visible) return null

  const dismiss = () => {
    setVisible(false)
    try {
      localStorage.setItem(dismissedKey(nudgeKey), '1')
    } catch {
      // Session-only dismiss is fine.
    }
  }

  return (
    <div className="flex items-start gap-2.5 rounded-lg border border-[#c99850]/30 bg-[#c99850]/5 px-3 py-2.5">
      <Lightbulb className="mt-0.5 w-3.5 h-3.5 shrink-0 text-[#dbb56e]" />
      <div className="min-w-0 flex-1 text-xs leading-5 text-zinc-300">{children}</div>
      <button
        onClick={dismiss}
        className="p-0.5 text-zinc-500 hover:text-zinc-200 transition-colors"
        title="Got it — don't show this again"
      >
        <X className="w-3.5 h-3.5" />
      </button>
    </div>
  )
}
