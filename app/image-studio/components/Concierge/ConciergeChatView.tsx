"use client"

import { useEffect, useRef, useState } from 'react'
import { Loader2, SendHorizonal, Sparkles } from 'lucide-react'
import { ConciergePlanCard } from './ConciergePlanCard'
import type { ConciergeChatMessage } from '../../hooks/useConciergeChat'
import {
  CONCIERGE_GOALS, GOAL_STARTER_MESSAGES,
  type ConciergeGoalId, type ConciergePlan,
} from '../../constants/concierge-tree'

interface ConciergeChatViewProps {
  messages: ConciergeChatMessage[]
  isThinking: boolean
  onSend: (text: string, fallbackGoal?: ConciergeGoalId) => void
  onApply: (plan: ConciergePlan) => void
  onSaveTemplate: (plan: ConciergePlan) => void
}

/** Chat surface of the Concierge dialog: welcome + goal chips, messages, plan cards, input. */
export function ConciergeChatView({ messages, isThinking, onSend, onApply, onSaveTemplate }: ConciergeChatViewProps) {
  const [input, setInput] = useState('')
  const bottomRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ block: 'nearest', behavior: 'smooth' })
  }, [messages.length, isThinking])

  const submit = () => {
    const text = input.trim()
    if (!text || isThinking) return
    setInput('')
    onSend(text)
  }

  return (
    <div className="flex min-h-0 flex-1 flex-col">
      <div className="min-h-0 flex-1 space-y-3 overflow-y-auto pr-1">
        <div className="rounded-lg border border-zinc-800 bg-zinc-900 p-3">
          <p className="text-sm leading-6 text-zinc-200">
            Tell me what you want to make — in your own words. I&apos;ll pick the
            model, write the prompts, dial in the settings, and pin a checklist.
          </p>
          <p className="mt-1 text-[11px] leading-4 text-zinc-500">
            e.g. &ldquo;a 10-second moody ad for my coffee brand, vertical for TikTok&rdquo;
          </p>
        </div>

        {messages.length === 0 && (
          <div className="flex flex-wrap gap-1.5">
            {CONCIERGE_GOALS.map((goal) => (
              <button
                key={goal.id}
                onClick={() => onSend(GOAL_STARTER_MESSAGES[goal.id], goal.id)}
                disabled={isThinking}
                className="rounded-full border border-zinc-700 bg-zinc-900 px-3 py-1.5 text-xs text-zinc-300 transition-colors hover:border-[#c99850]/50 hover:text-white disabled:opacity-50"
              >
                {goal.label}
              </button>
            ))}
          </div>
        )}

        {messages.map((message, index) => (
          <div key={index}>
            {message.role === 'user' ? (
              <div className="ml-8 rounded-lg bg-[#c99850]/10 border border-[#c99850]/25 px-3 py-2">
                <p className="text-sm leading-6 text-zinc-100">{message.content}</p>
              </div>
            ) : (
              <div className="mr-4 space-y-2">
                <div className="rounded-lg border border-zinc-800 bg-zinc-900 px-3 py-2">
                  <p className="whitespace-pre-wrap text-sm leading-6 text-zinc-200">{message.content}</p>
                </div>
                {message.plan && (
                  <ConciergePlanCard
                    plan={message.plan}
                    onApply={() => onApply(message.plan!)}
                    onSaveTemplate={() => onSaveTemplate(message.plan!)}
                  />
                )}
              </div>
            )}
          </div>
        ))}

        {isThinking && (
          <div className="mr-4 flex items-center gap-2 rounded-lg border border-zinc-800 bg-zinc-900 px-3 py-2">
            <Loader2 className="w-3.5 h-3.5 animate-spin text-[#dbb56e]" />
            <span className="text-xs text-zinc-400">Designing your setup…</span>
          </div>
        )}
        <div ref={bottomRef} />
      </div>

      <div className="mt-3 flex shrink-0 items-end gap-2">
        <textarea
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === 'Enter' && !e.shiftKey) {
              e.preventDefault()
              submit()
            }
          }}
          placeholder="Describe what you want to make…"
          rows={2}
          className="min-h-[44px] flex-1 resize-none rounded-lg border border-zinc-800 bg-zinc-900 px-3 py-2 text-sm text-zinc-200 placeholder:text-zinc-600 focus:border-[#c99850]/50 focus:outline-none"
        />
        <button
          onClick={submit}
          disabled={!input.trim() || isThinking}
          className="flex h-[44px] w-[44px] shrink-0 items-center justify-center rounded-lg bg-linear-to-r from-[#c99850] to-[#dbb56e] text-black transition-opacity hover:opacity-90 disabled:opacity-40"
          title="Send"
        >
          {isThinking ? <Loader2 className="w-4 h-4 animate-spin" /> : <SendHorizonal className="w-4 h-4" />}
        </button>
      </div>
      <p className="mt-1.5 flex items-center gap-1 text-[10px] text-zinc-600">
        <Sparkles className="w-2.5 h-2.5" />
        The concierge knows every model, cost, and workflow in the studio.
      </p>
    </div>
  )
}
