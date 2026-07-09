"use client"

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import { X, Copy, Check } from 'lucide-react'

interface CombinedPromptCardProps {
  combinedPrompt: string
  hasPrompt: boolean
  onClear: () => void
  onPromptChange?: (text: string) => void
}

export function CombinedPromptCard({
  combinedPrompt,
  hasPrompt,
  onClear,
  onPromptChange,
}: CombinedPromptCardProps) {
  const [isEditing, setIsEditing] = useState(false)
  const [editedText, setEditedText] = useState('')
  const [copied, setCopied] = useState(false)

  const handleCopy = () => {
    const textToCopy = isEditing ? editedText : combinedPrompt
    navigator.clipboard.writeText(textToCopy)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  const handleEdit = () => {
    if (isEditing) {
      onPromptChange?.(editedText)
      setIsEditing(false)
    } else {
      setEditedText(combinedPrompt)
      setIsEditing(true)
    }
  }

  const handleClear = () => {
    setEditedText('')
    setIsEditing(false)
    onClear()
  }

  return (
    <Card className="bg-zinc-800 border-2 border-[#c99850]/50 hover:border-[#c99850] transition-colors rounded-lg p-4">
      <div className="flex items-center justify-between mb-3">
        <div>
          <h3 className="text-sm font-bold text-white">Combined Prompt</h3>
          <p className="text-xs text-white/70">
            {hasPrompt ? "Combined analysis ready" : "Upload images to auto-generate"}
          </p>
        </div>
        {hasPrompt && (
          <div className="flex gap-1">
            <Button
              onClick={handleEdit}
              size="sm"
              variant="ghost"
              className="h-6 px-2 text-[10px] bg-[#c99850]/10 hover:bg-[#c99850]/20 text-[#c99850]"
            >
              {isEditing ? 'Save' : 'Edit'}
            </Button>
            <Button
              onClick={handleCopy}
              size="sm"
              variant="ghost"
              className="h-6 px-2 text-[10px] bg-[#c99850]/10 hover:bg-[#c99850]/20 text-[#c99850]"
            >
              {copied ? <Check className="w-3 h-3" /> : <Copy className="w-3 h-3" />}
            </Button>
            <Button
              onClick={handleClear}
              size="sm"
              variant="ghost"
              className="h-6 px-2 text-[10px] bg-red-900/20 hover:bg-red-900/30 text-red-400"
            >
              <X className="w-3 h-3" />
            </Button>
          </div>
        )}
      </div>
      {isEditing ? (
        <textarea
          value={editedText}
          onChange={(e) => setEditedText(e.target.value)}
          className="w-full h-32 px-3 py-2 rounded-lg text-xs bg-zinc-900 text-white placeholder:text-white/50 border border-[#c99850]/30 focus:outline-none focus:ring-2 focus:ring-[#c99850]/50 resize-none"
        />
      ) : (
        <div className="h-32 overflow-y-auto text-xs text-white/80 leading-relaxed px-1 bg-zinc-900 rounded-lg p-3 border border-[#c99850]/30">
          {hasPrompt ? combinedPrompt : (
            <div className="text-center py-8">
              <p className="text-xs text-white/70">Upload images to auto-generate prompts</p>
            </div>
          )}
        </div>
      )}
    </Card>
  )
}
