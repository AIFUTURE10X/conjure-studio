"use client"

/**
 * EditChatInput
 *
 * Footer input for the edit chat: instruction textarea (Enter to send,
 * Shift+Enter for a newline), a "Paint area" button that opens
 * MaskPickerModal to scope the next edit, a chip showing the pending mask
 * once one is attached, and the send action.
 */

import { useState } from 'react'
import { Loader2, Paintbrush, SendHorizonal, X } from 'lucide-react'
import { MaskPickerModal } from './MaskPickerModal'
import { useEditChat } from '../../context/EditChatProvider'

export function EditChatInput() {
  const { isEditing, pendingMask, setPendingMask, sendEdit, currentImageUrl } = useEditChat()
  const [input, setInput] = useState('')
  const [showMaskPicker, setShowMaskPicker] = useState(false)

  const handleSend = () => {
    if (!input.trim() || isEditing) return
    const instruction = input.trim()
    setInput('')
    void sendEdit(instruction)
  }

  const sourceUrl = currentImageUrl()

  return (
    <div className="shrink-0 space-y-2 border-t border-zinc-800 p-3">
      {pendingMask && (
        <div className="flex items-center gap-2 rounded-md border border-zinc-800 bg-zinc-900 px-2 py-1.5">
          <img src={pendingMask.previewUrl} alt="Painted area preview" className="h-8 w-8 rounded object-cover" />
          <span className="flex-1 text-xs text-zinc-400">Area selected</span>
          <button
            onClick={() => setPendingMask(null)}
            title="Clear painted area"
            aria-label="Clear painted area"
            className="text-zinc-500 transition-colors hover:text-white"
          >
            <X className="h-3.5 w-3.5" />
          </button>
        </div>
      )}

      <div className="flex items-end gap-2">
        <button
          onClick={() => setShowMaskPicker(true)}
          disabled={!sourceUrl || isEditing}
          title="Paint the area to change"
          aria-label="Paint the area to change"
          className="flex h-10 w-10 shrink-0 items-center justify-center rounded-md bg-zinc-800 text-[#dbb56e] transition-colors hover:bg-zinc-700 disabled:cursor-not-allowed disabled:opacity-50"
        >
          <Paintbrush className="h-4 w-4" />
        </button>
        <textarea
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === 'Enter' && !e.shiftKey) {
              e.preventDefault()
              handleSend()
            }
          }}
          rows={2}
          placeholder="Describe the change… (Shift+Enter for a new line)"
          aria-label="Describe the edit"
          disabled={isEditing}
          className="min-h-[44px] flex-1 resize-none rounded-md border border-zinc-700 bg-zinc-900 px-3 py-2 text-sm text-zinc-100 placeholder:text-zinc-600 focus:border-[#c99850]/60 focus:outline-none disabled:opacity-60"
        />
        <button
          onClick={handleSend}
          disabled={!input.trim() || isEditing}
          title="Send"
          aria-label="Send edit instruction"
          className="flex h-10 w-10 shrink-0 items-center justify-center rounded-md bg-linear-to-r from-purple-500 to-pink-500 text-white transition-opacity hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-50"
        >
          {isEditing ? <Loader2 className="h-4 w-4 animate-spin" /> : <SendHorizonal className="h-4 w-4" />}
        </button>
      </div>

      {showMaskPicker && sourceUrl && (
        <MaskPickerModal
          imageUrl={sourceUrl}
          onAttach={(mask) => {
            setPendingMask(mask)
            setShowMaskPicker(false)
          }}
          onClose={() => setShowMaskPicker(false)}
        />
      )}
    </div>
  )
}
