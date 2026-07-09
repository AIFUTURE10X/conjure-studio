"use client"

// Text Control Panel - Font, size, color, and style controls for text elements

import { Button } from '@/components/ui/button'
import { Bold, AlignLeft, AlignCenter, AlignRight, Trash2 } from 'lucide-react'
import { LOGO_FONTS, waitForFont } from '@/lib/font-loader'

interface TextElement {
  id: string
  text: string
  x: number
  y: number
  fontSize: number
  fontFamily: string
  fill: string
  fontStyle: 'normal' | 'bold'
  align: 'left' | 'center' | 'right'
}

interface TextControlPanelProps {
  selectedElement: TextElement
  selectedId: string
  onUpdate: (id: string, updates: Partial<TextElement>) => void
  onDelete: (id: string) => void
}

export function TextControlPanel({
  selectedElement,
  selectedId,
  onUpdate,
  onDelete
}: TextControlPanelProps) {
  const handleFontChange = async (fontFamily: string) => {
    await waitForFont(fontFamily, selectedElement.fontSize)
    onUpdate(selectedId, { fontFamily })
  }

  return (
    <div className="space-y-2 p-3 bg-zinc-800/50 rounded-lg border border-zinc-700">
      {/* Text Input */}
      <input
        type="text"
        value={selectedElement.text}
        onChange={(e) => onUpdate(selectedId, { text: e.target.value })}
        className="w-full px-2 py-1.5 bg-zinc-900 border border-zinc-700 rounded text-sm text-white focus:outline-none focus:border-[#c99850]"
        placeholder="Enter text..."
      />

      {/* Font Family */}
      <select
        value={selectedElement.fontFamily}
        onChange={(e) => handleFontChange(e.target.value)}
        className="w-full px-2 py-1.5 bg-zinc-900 border border-zinc-700 rounded text-sm text-white focus:outline-none focus:border-[#c99850]"
      >
        {LOGO_FONTS.map((font) => (
          <option key={font.name} value={font.name}>
            {font.name}
          </option>
        ))}
      </select>

      {/* Size and Color Row */}
      <div className="flex gap-2">
        <div className="flex-1">
          <label className="text-[10px] text-zinc-500 block mb-0.5">Size</label>
          <input
            type="range"
            min="12"
            max="120"
            value={selectedElement.fontSize}
            onChange={(e) => onUpdate(selectedId, { fontSize: parseInt(e.target.value) })}
            className="w-full accent-[#c99850]"
          />
        </div>
        <div>
          <label className="text-[10px] text-zinc-500 block mb-0.5">Color</label>
          <input
            type="color"
            value={selectedElement.fill}
            onChange={(e) => onUpdate(selectedId, { fill: e.target.value })}
            className="w-8 h-7 rounded cursor-pointer bg-transparent"
          />
        </div>
      </div>

      {/* Style Buttons */}
      <div className="flex gap-1">
        <Button
          variant="ghost"
          size="sm"
          onClick={() => onUpdate(selectedId, {
            fontStyle: selectedElement.fontStyle === 'bold' ? 'normal' : 'bold'
          })}
          className={`h-7 px-2 ${selectedElement.fontStyle === 'bold' ? 'bg-zinc-700 text-white' : 'text-zinc-400'}`}
        >
          <Bold className="w-3 h-3" />
        </Button>
        <Button
          variant="ghost"
          size="sm"
          onClick={() => onUpdate(selectedId, { align: 'left' })}
          className={`h-7 px-2 ${selectedElement.align === 'left' ? 'bg-zinc-700 text-white' : 'text-zinc-400'}`}
        >
          <AlignLeft className="w-3 h-3" />
        </Button>
        <Button
          variant="ghost"
          size="sm"
          onClick={() => onUpdate(selectedId, { align: 'center' })}
          className={`h-7 px-2 ${selectedElement.align === 'center' ? 'bg-zinc-700 text-white' : 'text-zinc-400'}`}
        >
          <AlignCenter className="w-3 h-3" />
        </Button>
        <Button
          variant="ghost"
          size="sm"
          onClick={() => onUpdate(selectedId, { align: 'right' })}
          className={`h-7 px-2 ${selectedElement.align === 'right' ? 'bg-zinc-700 text-white' : 'text-zinc-400'}`}
        >
          <AlignRight className="w-3 h-3" />
        </Button>
        <div className="flex-1" />
        <Button
          variant="ghost"
          size="sm"
          onClick={() => onDelete(selectedId)}
          className="h-7 px-2 text-red-400 hover:text-red-300 hover:bg-red-500/10"
        >
          <Trash2 className="w-3 h-3" />
        </Button>
      </div>
    </div>
  )
}
