"use client"

/**
 * EditChatMessages
 *
 * Renders the edit-chat transcript: user instructions (with an optional
 * "area painted" chip), assistant replies, version-result cards with
 * apply/revert actions, and inline error bubbles. A trailing "Applying
 * edit…" bubble covers the in-flight request.
 */

import { ImageDown, Loader2, Paintbrush, RotateCcw } from 'lucide-react'
import { useEditChat } from '../../context/EditChatProvider'

export function EditChatMessages() {
  const { messages, versions, currentVersionIndex, isEditing, revertToVersion, applyVersionToCanvas } = useEditChat()

  return (
    <>
      {messages.map((message) => {
        if (message.role === 'user') {
          return (
            <div key={message.id} className="flex justify-end">
              <div className="max-w-[92%] space-y-1.5 rounded-lg bg-zinc-800 px-3 py-2 text-right">
                {message.text && (
                  <p className="whitespace-pre-wrap text-sm leading-6 text-zinc-100">{message.text}</p>
                )}
                {message.hasMask && (
                  <span className="inline-flex items-center gap-1 rounded bg-zinc-900 px-1.5 py-0.5 text-[10px] text-zinc-400">
                    <Paintbrush className="h-3 w-3" /> area painted
                  </span>
                )}
              </div>
            </div>
          )
        }

        if (message.isError) {
          return (
            <div key={message.id} className="flex justify-start">
              <div className="max-w-[92%] rounded-lg border border-red-900/60 bg-red-900/20 px-3 py-2 text-sm text-red-400">
                {message.text}
              </div>
            </div>
          )
        }

        const resultIndex = message.resultVersionIndex
        const version = resultIndex !== undefined ? versions[resultIndex] : undefined

        return (
          <div key={message.id} className="flex justify-start">
            <div className="max-w-[92%] space-y-2 rounded-lg bg-zinc-800 px-3 py-2">
              {message.text && <p className="whitespace-pre-wrap text-sm leading-6 text-white">{message.text}</p>}
              {version && resultIndex !== undefined && (
                <div className="space-y-1.5">
                  <img
                    src={version.url}
                    alt={version.label}
                    className="max-h-56 w-full rounded-lg border border-zinc-800 object-contain"
                  />
                  <div className="flex items-center justify-between gap-2">
                    <span className="text-[10px] font-semibold uppercase tracking-wider text-[#dbb56e]">
                      {version.label}
                    </span>
                    <div className="flex gap-1.5">
                      <button
                        onClick={() => void applyVersionToCanvas(resultIndex)}
                        title="Apply this version to the canvas"
                        className="flex items-center gap-1 rounded-md bg-[#c99850] px-2 py-1 text-[11px] font-semibold text-black transition-colors hover:bg-[#dbb56e]"
                      >
                        <ImageDown className="h-3 w-3" /> Apply to canvas
                      </button>
                      {resultIndex !== currentVersionIndex && (
                        <button
                          onClick={() => revertToVersion(resultIndex)}
                          title="Continue editing from this version"
                          className="flex items-center gap-1 rounded-md border border-zinc-700 px-2 py-1 text-[11px] text-zinc-300 transition-colors hover:bg-zinc-700"
                        >
                          <RotateCcw className="h-3 w-3" /> Edit from this
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>
        )
      })}

      {isEditing && (
        <div className="flex justify-start">
          <div className="flex items-center gap-2 rounded-lg bg-zinc-800 px-3 py-2 text-sm text-zinc-400">
            <Loader2 className="h-3.5 w-3.5 animate-spin" />
            Applying edit…
          </div>
        </div>
      )}
    </>
  )
}
