'use client'

import { X, Trash2, ImageIcon, Sparkles } from 'lucide-react'
import type { AIHelperMode } from '../../hooks/useAIHelper'

interface AIHelperHeaderProps {
  mode: AIHelperMode
  setMode: (mode: AIHelperMode) => void
  onClearHistory: () => void
  onClose: () => void
}

export function AIHelperHeader({ mode, setMode, onClearHistory, onClose }: AIHelperHeaderProps) {
  return (
    <>
      {/* Header */}
      <div className="flex items-center justify-between gap-4 p-4 sm:p-5 border-b border-[#c99850]/30">
        <h3 className="text-xl font-bold text-[#c99850]">
          {mode === 'logo' ? 'AI Logo Designer' : 'AI Prompt Helper'}
        </h3>
        <div className="flex shrink-0 gap-2">
          <button
            onClick={async () => {
              if (confirm('Clear all AI Helper messages? This will remove all chat history.')) {
                await onClearHistory()
              }
            }}
            className="p-2 hover:bg-zinc-800 rounded transition-colors"
            title="Clear chat"
          >
            <Trash2 className="w-4 h-4 text-[#c99850]" />
          </button>
          <button
            onClick={onClose}
            className="p-2 hover:bg-zinc-800 rounded transition-colors"
          >
            <X className="w-4 h-4 text-[#c99850]" />
          </button>
        </div>
      </div>

      {/* Mode Toggle */}
      <div className="flex border-b border-[#c99850]/30">
        <button
          onClick={() => setMode('image')}
          className={`flex-1 py-2 px-4 text-sm font-medium flex items-center justify-center gap-2 transition-colors ${
            mode === 'image'
              ? 'bg-[#c99850]/20 text-[#c99850] border-b-2 border-[#c99850]'
              : 'text-zinc-400 hover:text-zinc-200'
          }`}
        >
          <ImageIcon className="w-4 h-4" />
          Image
        </button>
        <button
          onClick={() => setMode('logo')}
          className={`flex-1 py-2 px-4 text-sm font-medium flex items-center justify-center gap-2 transition-colors ${
            mode === 'logo'
              ? 'bg-[#c99850]/20 text-[#c99850] border-b-2 border-[#c99850]'
              : 'text-zinc-400 hover:text-zinc-200'
          }`}
        >
          <Sparkles className="w-4 h-4" />
          Logo
        </button>
      </div>
    </>
  )
}

interface EmptyStateProps {
  mode: AIHelperMode
}

export function EmptyState({ mode }: EmptyStateProps) {
  return (
    <div className="text-center text-zinc-500 text-sm mt-8">
      {mode === 'logo' ? (
        <>
          <p className="mb-2">Hi! I'm your AI logo design assistant.</p>
          <p className="mb-4">
            Describe your logo idea and I'll suggest a generation-ready logo prompt and matching settings.
          </p>
          <p className="text-xs text-zinc-600">
            Examples: "luxury residence wordmark in teal and champagne", "tech startup monogram with clean geometry",
            "creative agency badge with a warm vintage palette"
          </p>
        </>
      ) : (
        <>
          <p className="mb-2">Hi! I'm your AI prompt assistant.</p>
          <p>
            Tell me what image you want to create and I'll help you craft the perfect prompt with optimal camera
            settings. You can also upload images to help me understand your vision better.
          </p>
        </>
      )}
    </div>
  )
}
