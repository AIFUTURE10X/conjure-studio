'use client'

import { Send, ImageIcon } from 'lucide-react'
import { useRef } from 'react'
import type { AIHelperMode } from '../../hooks/useAIHelper'

interface ChatInputProps {
  input: string
  setInput: (value: string) => void
  mode: AIHelperMode
  isLoading: boolean
  hasImages: boolean
  onSend: () => void
  onImageUpload: (e: React.ChangeEvent<HTMLInputElement>) => void
}

export function ChatInput({ input, setInput, mode, isLoading, hasImages, onSend, onImageUpload }: ChatInputProps) {
  const fileInputRef = useRef<HTMLInputElement>(null)

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
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyPress={(e) => {
            if (e.key === 'Enter' && !e.shiftKey) {
              e.preventDefault()
              onSend()
            }
          }}
          placeholder={mode === 'logo'
            ? "Describe your logo idea... (e.g., 'tech startup with cyan dots')"
            : "Describe your image idea... (Shift+Enter for new line)"
          }
          className="min-h-[96px] flex-1 px-4 py-3 bg-zinc-800 border border-[#c99850]/30 rounded text-sm leading-6 text-white placeholder:text-zinc-500 focus:outline-none focus:ring-2 focus:ring-[#c99850]/50 resize-none"
          disabled={isLoading}
          rows={3}
        />
        <button
          onClick={onSend}
          disabled={isLoading || (!input.trim() && !hasImages)}
          className="flex h-12 w-12 shrink-0 items-center justify-center bg-linear-to-r from-[#c99850] to-[#dbb56e] hover:from-[#dbb56e] hover:to-[#f4d698] rounded transition-all disabled:opacity-50 disabled:cursor-not-allowed"
        >
          <Send className="w-4 h-4 text-black" />
        </button>
      </div>
    </div>
  )
}
