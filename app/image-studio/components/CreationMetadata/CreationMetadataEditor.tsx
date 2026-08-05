"use client"

import { useState } from 'react'
import { Loader2 } from 'lucide-react'
import { toast } from 'sonner'
import { Button } from '@/components/ui/button'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Input } from '@/components/ui/input'
import type { CreationMediaMetadata } from '@/lib/creation-metadata'
import { saveCreationMetadata } from '@/lib/creation-metadata-client'

interface CreationMetadataEditorProps {
  item: CreationMediaMetadata | null
  categorySuggestions: string[]
  onClose: () => void
  onSaved: (metadata: CreationMediaMetadata) => void
}

export function CreationMetadataEditor({
  item,
  categorySuggestions,
  onClose,
  onSaved,
}: CreationMetadataEditorProps) {
  return (
    <Dialog open={item !== null} onOpenChange={(open) => { if (!open) onClose() }}>
      <DialogContent className="border-zinc-800 bg-zinc-900 text-zinc-100 sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Edit creation details</DialogTitle>
        </DialogHeader>
        {item && (
          <CreationMetadataForm
            key={`${item.mediaType}:${item.mediaUrl}`}
            item={item}
            categorySuggestions={categorySuggestions}
            onClose={onClose}
            onSaved={onSaved}
          />
        )}
      </DialogContent>
    </Dialog>
  )
}

function CreationMetadataForm({
  item,
  categorySuggestions,
  onClose,
  onSaved,
}: CreationMetadataEditorProps & { item: CreationMediaMetadata }) {
  const [title, setTitle] = useState(item.title ?? '')
  const [category, setCategory] = useState(item.category ?? '')
  const [tags, setTags] = useState(item.tags.join(', '))
  const [isSaving, setIsSaving] = useState(false)

  const handleSave = async () => {
    if (isSaving) return
    setIsSaving(true)
    try {
      const saved = await saveCreationMetadata({
        mediaType: item.mediaType,
        mediaUrl: item.mediaUrl,
        title,
        category,
        tags: tags.split(',').map((tag) => tag.trim()).filter(Boolean),
      })
      onSaved(saved)
      toast.success('Creation details saved')
      onClose()
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Could not save creation details')
    } finally {
      setIsSaving(false)
    }
  }

  return (
        <div className="space-y-4">
          <label className="block space-y-1.5 text-xs text-zinc-400">
            <span>Title</span>
            <Input
              value={title}
              onChange={(event) => setTitle(event.target.value)}
              maxLength={120}
              placeholder="e.g. Luxury villa launch"
              className="border-zinc-700 bg-zinc-950 text-white"
            />
          </label>

          <label className="block space-y-1.5 text-xs text-zinc-400">
            <span>Category</span>
            <Input
              value={category}
              onChange={(event) => setCategory(event.target.value)}
              maxLength={80}
              list="creation-category-suggestions"
              placeholder="e.g. Marketing"
              className="border-zinc-700 bg-zinc-950 text-white"
            />
            <datalist id="creation-category-suggestions">
              {categorySuggestions.map((value) => <option key={value} value={value} />)}
            </datalist>
          </label>

          <label className="block space-y-1.5 text-xs text-zinc-400">
            <span>Tags</span>
            <Input
              value={tags}
              onChange={(event) => setTags(event.target.value)}
              placeholder="phuket, luxury, black-gold"
              className="border-zinc-700 bg-zinc-950 text-white"
            />
            <span className="block text-[10px] text-zinc-600">Separate tags with commas.</span>
          </label>

          <div className="flex justify-end gap-2">
            <Button type="button" variant="ghost" onClick={onClose} disabled={isSaving}>Cancel</Button>
            <Button
              type="button"
              onClick={() => void handleSave()}
              disabled={isSaving}
              className="bg-[#c99850] text-black hover:bg-[#dbb56e]"
            >
              {isSaving && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Save details
            </Button>
          </div>
        </div>
  )
}
