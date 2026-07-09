"use client"

/**
 * EditChatPanel
 *
 * Full-panel takeover of the AI helper sidebar for a conversational image
 * edit: header shows the working thumbnail and version label, the message
 * list auto-scrolls as new turns arrive, and the footer hosts the
 * instruction input and mask picker entry point.
 */

import { useEffect, useRef } from 'react'
import { X } from 'lucide-react'
import { EditChatMessages } from './EditChatMessages'
import { EditChatInput } from './EditChatInput'
import { useEditChat } from '../../context/EditChatProvider'

export function EditChatPanel() {
  const { target, versions, currentVersionIndex, messages, exitEditChat } = useEditChat()
  const scrollRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight, behavior: 'smooth' })
  }, [messages])

  if (!target) return null
  const current = versions[currentVersionIndex]

  return (
    <div className="flex h-full flex-col">
      <div className="flex shrink-0 items-center gap-3 border-b border-zinc-800 px-4 py-3">
        <button
          onClick={exitEditChat}
          title="Exit edit chat"
          aria-label="Exit edit chat"
          className="text-zinc-400 transition-colors hover:text-white"
        >
          <X className="h-4 w-4" />
        </button>
        {current && (
          <img
            src={current.url}
            alt="Current version"
            className="h-8 w-8 rounded border border-zinc-800 object-cover"
          />
        )}
        <p className="min-w-0 flex-1 truncate text-sm font-medium text-zinc-200">Editing image</p>
        {current && (
          <span className="shrink-0 rounded border border-zinc-800 bg-zinc-900 px-1.5 py-0.5 text-[10px] font-semibold uppercase tracking-wider text-[#dbb56e]">
            {current.label}
          </span>
        )}
      </div>

      <div ref={scrollRef} className="flex-1 min-h-0 space-y-3 overflow-y-auto px-4 py-4">
        <EditChatMessages />
      </div>

      <EditChatInput />
    </div>
  )
}
