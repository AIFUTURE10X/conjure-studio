"use client"

/**
 * Text Items List Component
 * Displays and manages multiple text items in the sidebar
 */

import { useState } from 'react'
import { Plus, Trash2, GripVertical, Pencil } from 'lucide-react'
import type { TextItem } from '../../text-effects-config'

interface TextItemsListProps {
  textItems?: TextItem[]
  selectedTextId?: string | null
  onAddText?: () => void
  onRemoveText?: (id: string) => void
  onSelectText?: (id: string) => void
  onUpdateTextContent?: (id: string, content: string) => void
}

export function TextItemsList({
  textItems,
  selectedTextId,
  onAddText,
  onRemoveText,
  onSelectText,
  onUpdateTextContent,
}: TextItemsListProps) {
  const [editingTextId, setEditingTextId] = useState<string | null>(null)

  if (!textItems) return null

  return (
    <div className="w-full space-y-1.5">
      <div className="text-[10px] text-zinc-300 font-normal uppercase">Text Items</div>
      {textItems.map((item, index) => (
        <div
          key={item.id}
          className={`flex items-center gap-1 px-2 py-1.5 rounded-lg text-[11px] font-extralight transition-all ${
            selectedTextId === item.id
              ? 'bg-purple-500/15 text-purple-300 border border-purple-500/30'
              : 'bg-zinc-800/50 text-zinc-400 hover:bg-zinc-700/50 border border-zinc-700/50'
          }`}
        >
          <GripVertical className="w-3 h-3 text-zinc-600 cursor-grab shrink-0" />
          {editingTextId === item.id ? (
            <input
              type="text"
              value={item.content}
              onChange={(e) => onUpdateTextContent?.(item.id, e.target.value)}
              onBlur={() => setEditingTextId(null)}
              onKeyDown={(e) => e.key === 'Enter' && setEditingTextId(null)}
              autoFocus
              className="flex-1 bg-transparent border-none outline-none text-white px-1"
            />
          ) : (
            <span
              onClick={() => onSelectText?.(item.id)}
              className="flex-1 truncate cursor-pointer"
            >
              {item.content || `Text ${index + 1}`}
            </span>
          )}
          <button
            onClick={() => setEditingTextId(item.id)}
            className="p-0.5 hover:text-purple-400"
            title="Edit text"
          >
            <Pencil className="w-3 h-3" />
          </button>
          <button
            onClick={(e) => { e.stopPropagation(); onRemoveText?.(item.id) }}
            className="p-0.5 hover:text-red-400"
            title="Remove"
          >
            <Trash2 className="w-3 h-3" />
          </button>
        </div>
      ))}
      {onAddText && (
        <button
          onClick={onAddText}
          className="flex items-center justify-center gap-1.5 w-full px-3 py-1.5 bg-emerald-500/10 hover:bg-emerald-500/20 rounded-lg text-[11px] text-emerald-400 font-extralight border border-emerald-500/20"
        >
          <Plus className="w-3 h-3" />
          <span>Add Text</span>
        </button>
      )}
    </div>
  )
}
