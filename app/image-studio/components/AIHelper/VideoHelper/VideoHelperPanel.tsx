"use client"

/**
 * VideoHelperPanel
 *
 * The AI helper's video-mode face: a chat that knows the video models and
 * Story Mode, with Apply buttons under assistant replies (prompt, settings,
 * revised shot plan). Takes over HelperPanel while the studio is in video
 * mode.
 */

import { useEffect, useRef } from 'react'
import { Textarea } from '@/components/ui/textarea'
import { Check, Clapperboard, ListVideo, Loader2, Send, Settings2, Sparkles, Trash2 } from 'lucide-react'
import { useVideoHelper, type VideoHelperMessage } from './useVideoHelper'

function settingsSummary(settings: NonNullable<VideoHelperMessage['settings']>): string {
  return [
    settings.model,
    settings.duration !== undefined ? `${settings.duration}s` : null,
    settings.resolution,
    settings.aspectRatio,
    settings.generateAudio !== undefined ? (settings.generateAudio ? 'audio on' : 'audio off') : null,
  ].filter(Boolean).join(' · ')
}

export function VideoHelperPanel() {
  const {
    messages, welcome, input, setInput, isThinking, send,
    applyPrompt, applySettings, applyShots, clearChat,
  } = useVideoHelper()
  const scrollRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight, behavior: 'smooth' })
  }, [messages, isThinking])

  return (
    <div className="h-full flex flex-col bg-zinc-950 border-r border-zinc-800">
      <div className="flex items-center justify-between gap-2 px-4 py-3 border-b border-zinc-800 shrink-0">
        <div className="flex items-center gap-2 min-w-0">
          <Sparkles className="w-4 h-4 text-[#dbb56e] shrink-0" />
          <span className="text-sm font-medium text-zinc-200">AI Helper</span>
          <span className="text-[10px] font-semibold uppercase tracking-wider text-zinc-500 bg-zinc-900 border border-zinc-800 rounded px-1.5 py-0.5">
            video
          </span>
        </div>
        <button
          onClick={clearChat}
          className="p-1.5 text-zinc-500 hover:text-zinc-200 transition-colors"
          title="Clear chat history"
        >
          <Trash2 className="w-3.5 h-3.5" />
        </button>
      </div>

      <div ref={scrollRef} className="flex-1 min-h-0 overflow-y-auto px-3 py-3 space-y-3">
        {messages.length === 0 && (
          <div className="rounded-lg border border-zinc-800 bg-zinc-900/60 p-3">
            <p className="text-xs text-zinc-400 leading-5">{welcome}</p>
          </div>
        )}

        {messages.map((message, index) => (
          <div key={index} className={message.role === 'user' ? 'flex justify-end' : ''}>
            <div className={`max-w-[92%] rounded-lg p-2.5 ${
              message.role === 'user'
                ? 'bg-[#c99850]/15 border border-[#c99850]/25'
                : 'bg-zinc-900 border border-zinc-800'
            }`}>
              <p className="text-xs text-zinc-200 leading-5 whitespace-pre-wrap">{message.content}</p>

              {message.videoPrompt && (
                <div className="mt-2 rounded-md bg-zinc-950 border border-zinc-800 p-2">
                  <p className="text-[11px] text-[#dbb56e]/90 leading-4">{message.videoPrompt}</p>
                  <button
                    onClick={() => applyPrompt(message)}
                    className="mt-1.5 flex items-center gap-1 px-2 py-1 rounded-md text-[11px] font-medium bg-[#c99850] text-black hover:bg-[#dbb56e] transition-colors"
                  >
                    <Check className="w-3 h-3" />
                    Apply prompt
                  </button>
                </div>
              )}

              {message.settings && (
                <button
                  onClick={() => applySettings(message)}
                  className="mt-2 flex items-center gap-1.5 px-2 py-1 rounded-md text-[11px] font-medium bg-zinc-800 text-zinc-200 hover:bg-zinc-700 transition-colors"
                  title="Apply the suggested clip settings"
                >
                  <Settings2 className="w-3 h-3" />
                  Apply settings — {settingsSummary(message.settings)}
                </button>
              )}

              {message.revisedShots && message.revisedShots.length > 0 && (
                <button
                  onClick={() => applyShots(message)}
                  className="mt-2 flex items-center gap-1.5 px-2 py-1 rounded-md text-[11px] font-medium bg-emerald-700/80 text-white hover:bg-emerald-600 transition-colors"
                  title="Replace the Story Mode plan with this revision (frames for changed shots regenerate)"
                >
                  <ListVideo className="w-3 h-3" />
                  Apply revised plan ({message.revisedShots.length} shots)
                </button>
              )}
            </div>
          </div>
        ))}

        {isThinking && (
          <div className="flex items-center gap-2 text-zinc-500 text-xs px-1">
            <Loader2 className="w-3.5 h-3.5 animate-spin" />
            Directing…
          </div>
        )}
      </div>

      <div className="shrink-0 border-t border-zinc-800 p-3 space-y-2">
        <div className="flex flex-wrap gap-1">
          {['Write me a motion prompt', 'Which model should I use?', 'Plan a 4-shot story'].map((chip) => (
            <button
              key={chip}
              onClick={() => void send(chip)}
              disabled={isThinking}
              className="px-2 py-1 rounded-md text-[10px] bg-zinc-900 border border-zinc-800 text-zinc-400 hover:text-white hover:border-zinc-600 transition-colors disabled:opacity-40"
            >
              <Clapperboard className="w-2.5 h-2.5 inline mr-1" />
              {chip}
            </button>
          ))}
        </div>
        <div className="flex gap-2 items-end">
          <Textarea
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter' && !e.shiftKey) {
                e.preventDefault()
                void send(input)
              }
            }}
            placeholder="Ask about prompts, models, story plans…"
            className="min-h-[44px] max-h-28 bg-zinc-900 border-zinc-800 text-xs text-zinc-200 placeholder:text-zinc-600 resize-y"
          />
          <button
            onClick={() => void send(input)}
            disabled={!input.trim() || isThinking}
            title="Send"
            className="shrink-0 h-9 w-9 flex items-center justify-center rounded-md bg-linear-to-r from-[#c99850] to-[#dbb56e] text-black hover:from-[#dbb56e] hover:to-[#c99850] disabled:opacity-40 transition-colors"
          >
            <Send className="w-4 h-4" />
          </button>
        </div>
      </div>
    </div>
  )
}
