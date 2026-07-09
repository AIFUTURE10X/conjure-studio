'use client'

import { useState } from 'react'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'

const EMOJI_OPTIONS = ['⚡', '🎯', '🔐', '💳', '📤', '🔔', '👤', '⚙️', '🎨', '📊']

interface AddFeatureDialogProps {
  open: boolean
  onClose: () => void
  onSave: (name: string, description: string, icon: string) => void
  projectName?: string
}

export function AddFeatureDialog({ open, onClose, onSave, projectName }: AddFeatureDialogProps) {
  const [name, setName] = useState('')
  const [description, setDescription] = useState('')
  const [icon, setIcon] = useState('⚡')

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (!name.trim()) return
    onSave(name.trim(), description.trim(), icon)
    setName('')
    setDescription('')
    setIcon('⚡')
    onClose()
  }

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="bg-zinc-900 border-zinc-800 max-w-md">
        <DialogHeader>
          <DialogTitle className="text-white">
            Add Feature{projectName ? ` to ${projectName}` : ''}
          </DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Icon selector */}
          <div>
            <label className="text-sm font-medium text-zinc-300 mb-1.5 block">Icon</label>
            <div className="flex flex-wrap gap-2">
              {EMOJI_OPTIONS.map(emoji => (
                <button
                  key={emoji}
                  type="button"
                  onClick={() => setIcon(emoji)}
                  className={`w-10 h-10 flex items-center justify-center text-xl rounded-lg transition-colors ${
                    icon === emoji
                      ? 'bg-[#c99850]/20 border-2 border-[#c99850]'
                      : 'bg-zinc-800 border border-zinc-700 hover:border-zinc-600'
                  }`}
                >
                  {emoji}
                </button>
              ))}
            </div>
          </div>

          {/* Name */}
          <div>
            <label className="text-sm font-medium text-zinc-300 mb-1.5 block">Feature Name</label>
            <Input
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Authentication, Settings, etc."
              className="bg-zinc-800 border-zinc-700 text-white"
              autoFocus
            />
          </div>

          {/* Description */}
          <div>
            <label className="text-sm font-medium text-zinc-300 mb-1.5 block">Description</label>
            <Textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="What this feature covers..."
              className="bg-zinc-800 border-zinc-700 text-white min-h-[60px]"
            />
          </div>

          <DialogFooter>
            <Button type="button" variant="ghost" onClick={onClose}>
              Cancel
            </Button>
            <Button
              type="submit"
              disabled={!name.trim()}
              className="bg-[#c99850] hover:bg-[#dbb56e] text-black"
            >
              Add Feature
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
