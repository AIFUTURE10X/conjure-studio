"use client"

/**
 * EditChatInput
 *
 * Footer input for the edit chat: a quick-fill chip row, a variants
 * stepper (1-3, default 2), the instruction textarea (Enter to send,
 * Shift+Enter for a newline), a "Paint area" button that opens
 * MaskPickerModal to scope the next edit, a chip showing the pending mask
 * once one is attached, and the send action. Sending with an empty
 * instruction is allowed when a mask is attached — that means "remove the
 * painted area" (see EditChatProvider.runEdit).
 */

import { useRef, useState } from 'react'
import { Loader2, Paintbrush, SendHorizonal, X } from 'lucide-react'
import { MaskPickerModal } from './MaskPickerModal'
import { EditChipsRow } from './EditChipsRow'
import { useEditChat } from '../../context/EditChatProvider'

const MIN_VARIANTS = 1

export function EditChatInput() {
  const { isEditing, pendingMask, setPendingMask, sendEdit, currentImageUrl, variants, setVariants } = useEditChat()
  const [input, setInput] = useState('')
  const [showMaskPicker, setShowMaskPicker] = useState(false)
  const textareaRef = useRef<HTMLTextAreaElement>(null)

  const canSend = (!!input.trim() || !!pendingMask) && !isEditing

  const handleSend = () => {
    if (!canSend) return
    const instruction = input.trim()
    setInput('')
    void sendEdit(instruction)
  }

  const handleChipPick = (fill: string) => {
    setInput((prev) => (prev ? `${prev}${fill}` : fill))
    textareaRef.current?.focus()
  }

  const sourceUrl = currentImageUrl()

  return (
    <div className="shrink-0 space-y-2 border-t border-zinc-800 p-3">
      <EditChipsRow onPick={handleChipPick} />

      <div className="flex items-center gap-2 text-[11px] text-zinc-500">
        <span>Variants</span>
        <div className="flex gap-1">
          {[1, 2, 3].map((count) => (
            <button
              key={count}
              onClick={() => setVariants(count)}
              disabled={isEditing}
              title={`Generate ${count} variant${count > 1 ? 's' : ''}`}
              className={`h-6 w-6 rounded-md border text-xs font-semibold transition-colors ${
                variants === count
                  ? 'border-[#c99850] bg-[#c99850]/10 text-[#dbb56e]'
                  : 'border-zinc-700 bg-zinc-800/70 text-zinc-400 hover:bg-zinc-700'
              } disabled:cursor-not-allowed disabled:opacity-50`}
            >
              {count}
            </button>
          ))}
        </div>
        {variants > MIN_VARIANTS && <span>+{variants - 1} credit each</span>}
      </div>

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
          ref={textareaRef}
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === 'Enter' && !e.shiftKey) {
              e.preventDefault()
              handleSend()
            }
          }}
          rows={2}
          placeholder={
            pendingMask
              ? 'Describe a change — or send empty to remove the painted area'
              : 'Describe the change… (Shift+Enter for a new line)'
          }
          aria-label="Describe the edit"
          disabled={isEditing}
          className="min-h-[44px] flex-1 resize-none rounded-md border border-zinc-700 bg-zinc-900 px-3 py-2 text-sm text-zinc-100 placeholder:text-zinc-600 focus:border-[#c99850]/60 focus:outline-none disabled:opacity-60"
        />
        <button
          onClick={handleSend}
          disabled={!canSend}
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
