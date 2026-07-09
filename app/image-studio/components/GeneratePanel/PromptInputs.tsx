"use client"

import { useRef, useState, useCallback, useEffect } from 'react'
import { GripHorizontal } from 'lucide-react'

function cleanPastedText(text: string): string {
  return text
    .replace(/\r\n/g, '\n')
    .replace(/\r/g, '\n')
    .split(/\n{2,}/)
    .map((para) =>
      para
        .split('\n')
        .map((line) => line.replace(/^[ \t]+/, '').replace(/[ \t]+$/, ''))
        .filter((line) => line.length > 0)
        .join(' '),
    )
    .filter((para) => para.length > 0)
    .join('\n\n')
}

function handlePaste(
  e: React.ClipboardEvent<HTMLTextAreaElement>,
  onChange: (value: string) => void,
) {
  const pasted = e.clipboardData.getData('text')
  if (!pasted) return
  e.preventDefault()
  const cleaned = cleanPastedText(pasted)
  const el = e.currentTarget
  const start = el.selectionStart ?? el.value.length
  const end = el.selectionEnd ?? el.value.length
  const next = el.value.slice(0, start) + cleaned + el.value.slice(end)
  onChange(next)
  requestAnimationFrame(() => {
    const pos = start + cleaned.length
    el.setSelectionRange(pos, pos)
  })
}

function useTextareaResize(initial = 120, min = 64, max = 600) {
  const [height, setHeight] = useState(initial)
  const [isDragging, setIsDragging] = useState(false)
  const dragStartY = useRef(0)
  const dragStartHeight = useRef(0)

  const handleDragStart = useCallback(
    (e: React.MouseEvent) => {
      e.preventDefault()
      setIsDragging(true)
      dragStartY.current = e.clientY
      dragStartHeight.current = height
    },
    [height],
  )

  useEffect(() => {
    if (!isDragging) return
    const onMove = (e: MouseEvent) => {
      const delta = e.clientY - dragStartY.current
      setHeight(Math.min(Math.max(dragStartHeight.current + delta, min), max))
    }
    const onUp = () => setIsDragging(false)
    document.addEventListener('mousemove', onMove)
    document.addEventListener('mouseup', onUp)
    return () => {
      document.removeEventListener('mousemove', onMove)
      document.removeEventListener('mouseup', onUp)
    }
  }, [isDragging, min, max])

  return { height, isDragging, handleDragStart }
}

interface PromptInputsProps {
  mainPrompt: string
  negativePrompt: string
  onMainPromptChange: (value: string) => void
  onNegativePromptChange: (value: string) => void
}

export function PromptInputs({
  mainPrompt,
  negativePrompt,
  onMainPromptChange,
  onNegativePromptChange,
}: PromptInputsProps) {
  const main = useTextareaResize(120)
  const negative = useTextareaResize(120)

  return (
    <div className="grid grid-cols-2 gap-4">
      <div>
        <label className="text-xs font-bold text-white mb-2 block">
          Main Prompt (type here or use combined analysis)
        </label>
        <div className="relative">
          <textarea
            value={mainPrompt}
            onChange={(e) => onMainPromptChange(e.target.value)}
            onPaste={(e) => handlePaste(e, onMainPromptChange)}
            placeholder="Describe the image you want... or leave empty to use combined analysis"
            style={{ height: main.height }}
            className="w-full px-4 py-3 rounded-t-lg text-sm bg-zinc-800 text-white placeholder:text-white/50 border-2 border-b-0 border-[#c99850]/50 focus:outline-none focus:ring-2 focus:ring-[#c99850]/50 resize-none"
          />
          <div
            onMouseDown={main.handleDragStart}
            className={`w-full h-4 bg-zinc-800 border-2 border-t-0 border-[#c99850]/50 rounded-b-lg cursor-ns-resize flex items-center justify-center transition-colors hover:bg-zinc-700 ${main.isDragging ? 'bg-zinc-700' : ''}`}
          >
            <GripHorizontal className="w-4 h-3 text-zinc-500" />
          </div>
        </div>
      </div>

      <div>
        <label className="text-xs font-bold text-white mb-2 block">
          Negative Prompt (exclude unwanted elements)
        </label>
        <div className="relative">
          <textarea
            value={negativePrompt}
            onChange={(e) => onNegativePromptChange(e.target.value)}
            onPaste={(e) => handlePaste(e, onNegativePromptChange)}
            placeholder="e.g. blurry, low quality, distorted"
            style={{ height: negative.height }}
            className="w-full px-4 py-3 rounded-t-lg text-sm bg-zinc-800 text-white placeholder:text-white/50 border-2 border-b-0 border-[#c99850]/50 focus:outline-none focus:ring-2 focus:ring-[#c99850]/50 resize-none"
          />
          <div
            onMouseDown={negative.handleDragStart}
            className={`w-full h-4 bg-zinc-800 border-2 border-t-0 border-[#c99850]/50 rounded-b-lg cursor-ns-resize flex items-center justify-center transition-colors hover:bg-zinc-700 ${negative.isDragging ? 'bg-zinc-700' : ''}`}
          >
            <GripHorizontal className="w-4 h-3 text-zinc-500" />
          </div>
        </div>
      </div>
    </div>
  )
}
