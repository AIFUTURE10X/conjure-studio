"use client"

import { useEffect, useState } from 'react'
import { Dialog, DialogContent, DialogTitle } from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { BookmarkPlus } from 'lucide-react'

interface SaveTemplateDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  defaultName: string
  /** Existing category names offered as suggestions. */
  categories: string[]
  onConfirm: (name: string, category: string) => void
}

/** Name + category prompt when saving a clip or plan as a reusable template. */
export function SaveTemplateDialog({ open, onOpenChange, defaultName, categories, onConfirm }: SaveTemplateDialogProps) {
  const [name, setName] = useState(defaultName)
  const [category, setCategory] = useState('')

  useEffect(() => {
    if (open) setName(defaultName)
  }, [open, defaultName])

  const confirm = () => {
    onConfirm(name.trim() || 'Untitled template', category.trim())
    onOpenChange(false)
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-sm bg-zinc-950 border-zinc-800">
        <DialogTitle className="flex items-center gap-2 text-base text-white">
          <BookmarkPlus className="w-4 h-4 text-[#dbb56e]" />
          Save as template
        </DialogTitle>

        <div className="space-y-3">
          <div>
            <label className="mb-1 block text-xs text-zinc-400">Template name</label>
            <input
              value={name}
              onChange={(e) => setName(e.target.value)}
              onKeyDown={(e) => { if (e.key === 'Enter') confirm() }}
              placeholder="e.g. Coffee bag hero orbit"
              className="w-full rounded-lg border border-zinc-800 bg-zinc-900 px-3 py-2 text-sm text-zinc-200 placeholder:text-zinc-600 focus:border-[#c99850]/50 focus:outline-none"
            />
          </div>
          <div>
            <label className="mb-1 block text-xs text-zinc-400">Category (your shelf — optional)</label>
            <input
              value={category}
              onChange={(e) => setCategory(e.target.value)}
              onKeyDown={(e) => { if (e.key === 'Enter') confirm() }}
              list="template-category-suggestions"
              placeholder="e.g. Product Ads"
              className="w-full rounded-lg border border-zinc-800 bg-zinc-900 px-3 py-2 text-sm text-zinc-200 placeholder:text-zinc-600 focus:border-[#c99850]/50 focus:outline-none"
            />
            <datalist id="template-category-suggestions">
              {categories.map((option) => <option key={option} value={option} />)}
            </datalist>
          </div>
          <Button
            onClick={confirm}
            className="w-full font-medium bg-linear-to-r from-[#c99850] to-[#dbb56e] text-black hover:from-[#dbb56e] hover:to-[#c99850]"
          >
            Save template
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  )
}
