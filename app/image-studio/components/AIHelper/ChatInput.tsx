'use client'

import { ImageIcon, Send, Square } from 'lucide-react'
import { useCallback, useEffect, useRef } from 'react'
import type { AIHelperMode } from '../../hooks/useAIHelper'

// The composer starts tall enough to see a few lines (min-h-[120px]) and grows
// with the text up to this cap, after which it scrolls internally instead of
// pushing the chat off-screen. Keep in sync with the max-h-[360px] class.
const MAX_TEXTAREA_HEIGHT = 360

interface ChatInputProps {
  input: string
  setInput: (value: string) => void
  mode: AIHelperMode
  isLoading: boolean
  hasImages: boolean
  pendingQuestion?: string
  onSend: () => void
  onCancelRequest: () => void
  onImageUpload: (e: React.ChangeEvent<HTMLInputElement>) => void
}

export function ChatInput({ input, setInput, mode, isLoading, hasImages, pendingQuestion, onSend, onCancelRequest, onImageUpload }: ChatInputProps) {
  const fileInputRef = useRef<HTMLInputElement>(null)
  const textareaRef = useRef<HTMLTextAreaElement>(null)

  // Grow the composer to fit its content (up to MAX), then let it scroll. The
  // CSS min-height is the floor; here we only ever set an explicit height when
  // the content needs more room. Measured in a rAF so the first pass runs after
  // layout settles (measuring mid-mount can report a stale, oversized height).
  const autoResize = useCallback(() => {
    const el = textareaRef.current
    if (!el) return
    el.style.height = 'auto'
    el.style.height = `${Math.min(el.scrollHeight, MAX_TEXTAREA_HEIGHT)}px`
  }, [])

  useEffect(() => {
    const raf = requestAnimationFrame(autoResize)
    return () => cancelAnimationFrame(raf)
  }, [input, autoResize])

  useEffect(() => {
    if (pendingQuestion && !isLoading) {
      textareaRef.current?.focus({ preventScroll: true })
    }
  }, [pendingQuestion, isLoading])

  const defaultPlaceholder = mode === 'logo'
    ? "Describe your logo idea... (e.g., 'tech startup with cyan dots')"
    : 'Describe your image idea... (Shift+Enter for new line)'

  return (
    <div className="p-4 sm:p-5 border-t border-[#c99850]/30">
      <div className="flex items-end gap-3">
        <input
          ref={fileInputRef}
          type="file"
          accept="image/*"
          multiple
          onChange={onImageUpload}
          className="hidden"
        />
        <button
          onClick={() => fileInputRef.current?.click()}
          className="flex h-12 w-12 shrink-0 items-center justify-center bg-zinc-800 hover:bg-zinc-700 rounded transition-colors"
          title="Upload image"
        >
          <ImageIcon className="w-4 h-4 text-[#c99850]" />
        </button>
        <textarea
          ref={textareaRef}
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyPress={(e) => {
            if (e.key === 'Enter' && !e.shiftKey) {
              e.preventDefault()
              onSend()
            }
          }}
          placeholder={pendingQuestion ? 'Answer the follow-up question...' : defaultPlaceholder}
          aria-label={pendingQuestion ? 'Answer follow-up question' : 'Describe prompt idea'}
          className="min-h-[120px] max-h-[360px] flex-1 px-4 py-3 bg-zinc-800 border border-[#c99850]/30 rounded text-sm leading-6 text-white placeholder:text-zinc-500 focus:outline-none focus:ring-2 focus:ring-[#c99850]/50 resize-none overflow-y-auto"
          disabled={isLoading}
          rows={1}
        />
        <button
          onClick={isLoading ? onCancelRequest : onSend}
          disabled={!isLoading && (!input.trim() && !hasImages)}
          className={`flex h-12 w-12 shrink-0 items-center justify-center rounded transition-all disabled:cursor-not-allowed disabled:opacity-50 ${
            isLoading
              ? 'border border-red-500/40 bg-red-500/10 hover:bg-red-500/20'
              : 'bg-linear-to-r from-[#c99850] to-[#dbb56e] hover:from-[#dbb56e] hover:to-[#f4d698]'
          }`}
          title={isLoading ? 'Stop' : pendingQuestion ? 'Answer the follow-up' : 'Send'}
          aria-label={isLoading ? 'Stop' : pendingQuestion ? 'Answer the follow-up' : 'Send'}
        >
          {isLoading ? <Square className="w-4 h-4 text-red-200" /> : <Send className="w-4 h-4 text-black" />}
        </button>
      </div>
    </div>
  )
}
