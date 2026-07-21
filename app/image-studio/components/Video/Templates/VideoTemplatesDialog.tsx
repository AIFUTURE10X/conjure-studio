"use client"

import { useMemo, useState } from 'react'
import { Dialog, DialogContent, DialogTitle } from '@/components/ui/dialog'
import { Clapperboard, LayoutTemplate, Pencil, Play, Trash2 } from 'lucide-react'
import { TemplateEditForm } from './TemplateEditForm'
import { VIDEO_MODELS, type VideoModelId } from '@/lib/video/providers'
import { VIDEO_STARTER_TEMPLATES, isStarterTemplate } from '../../../constants/video-starter-templates'
import type { GeneratePreset } from '../../../constants/settings-defaults'

interface VideoTemplatesDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  presets: GeneratePreset[]
  onLoad: (preset: GeneratePreset) => void
  onUpdate: (id: string, updates: { name: string; params: GeneratePreset['params'] }) => void
  onDelete: (id: string) => void
}

const UNCATEGORIZED = 'Uncategorized'

function metaLine(preset: GeneratePreset): string {
  const video = preset.params.video
  if (!video) return 'No clip settings'
  const label = VIDEO_MODELS[video.model as VideoModelId]?.label ?? video.model
  return `${label} · ${video.duration}s · ${video.aspectRatio} · ${video.generateAudio ? 'audio' : 'silent'}`
}

/**
 * Templates browser for the video panel: the user's saved video templates
 * grouped by category, plus the read-only starter pack. Load applies prompt +
 * settings; user templates can be edited (prompt, settings, category) or deleted.
 */
export function VideoTemplatesDialog({ open, onOpenChange, presets, onLoad, onUpdate, onDelete }: VideoTemplatesDialogProps) {
  const [editingId, setEditingId] = useState<string | null>(null)

  const groups = useMemo(() => {
    const videoPresets = presets.filter((preset) => preset.source === 'video')
    const all = [...videoPresets, ...VIDEO_STARTER_TEMPLATES]
    const byCategory = new Map<string, GeneratePreset[]>()
    for (const preset of all) {
      const category = preset.params.category?.trim() || UNCATEGORIZED
      byCategory.set(category, [...(byCategory.get(category) ?? []), preset])
    }
    // User categories first (alphabetical), Uncategorized last.
    return [...byCategory.entries()].sort(([a], [b]) => {
      if (a === UNCATEGORIZED) return 1
      if (b === UNCATEGORIZED) return -1
      return a.localeCompare(b)
    })
  }, [presets])

  const handleLoad = (preset: GeneratePreset) => {
    onLoad(preset)
    onOpenChange(false)
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="flex max-h-[85vh] max-w-2xl flex-col overflow-hidden bg-zinc-950 border-zinc-800">
        <DialogTitle className="flex items-center gap-2 text-base text-white">
          <LayoutTemplate className="w-4 h-4 text-[#dbb56e]" />
          Video templates
          <span className="ml-auto text-[10px] font-normal uppercase tracking-wider text-zinc-600">
            Load · edit · reuse
          </span>
        </DialogTitle>

        <div className="min-h-0 flex-1 space-y-4 overflow-y-auto pr-1">
          {groups.map(([category, items]) => (
            <div key={category}>
              <h3 className="mb-1.5 text-[11px] font-bold uppercase tracking-wider text-zinc-500">{category}</h3>
              <div className="space-y-1.5">
                {items.map((preset) => {
                  const starter = isStarterTemplate(preset)
                  if (editingId === preset.id) {
                    return (
                      <TemplateEditForm
                        key={preset.id}
                        preset={preset}
                        onSave={(id, updates) => { onUpdate(id, updates); setEditingId(null) }}
                        onCancel={() => setEditingId(null)}
                      />
                    )
                  }
                  return (
                    <div
                      key={preset.id}
                      className="flex items-center gap-3 rounded-md border border-zinc-800 bg-zinc-900 px-3 py-2"
                    >
                      {preset.params.thumbnailUrl ? (
                        <img
                          src={preset.params.thumbnailUrl}
                          alt=""
                          className="h-10 w-10 shrink-0 rounded object-cover"
                        />
                      ) : (
                        <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded bg-zinc-950">
                          <Clapperboard className="w-4 h-4 text-zinc-600" />
                        </div>
                      )}
                      <div className="min-w-0 flex-1">
                        <div className="flex items-center gap-1.5">
                          <p className="truncate text-sm font-medium text-zinc-100">{preset.name}</p>
                          {starter && (
                            <span className="shrink-0 rounded bg-[#c99850]/15 px-1.5 py-0.5 text-[9px] font-bold uppercase tracking-wider text-[#dbb56e]">
                              Starter
                            </span>
                          )}
                        </div>
                        <p className="truncate text-[11px] text-zinc-500">{metaLine(preset)}</p>
                        <p className="truncate text-[11px] text-zinc-600" title={preset.params.mainPrompt}>
                          {preset.params.mainPrompt}
                        </p>
                      </div>
                      <div className="flex shrink-0 gap-1">
                        <button
                          onClick={() => handleLoad(preset)}
                          title="Load this template into the video generator"
                          className="flex h-7 w-7 items-center justify-center rounded-md bg-[#c99850]/15 text-[#dbb56e] transition-colors hover:bg-[#c99850]/30"
                        >
                          <Play className="w-3.5 h-3.5" />
                        </button>
                        {!starter && (
                          <>
                            <button
                              onClick={() => setEditingId(preset.id)}
                              title="Edit name, category, prompt, and settings"
                              className="flex h-7 w-7 items-center justify-center rounded-md bg-zinc-800 text-zinc-400 transition-colors hover:bg-zinc-700 hover:text-white"
                            >
                              <Pencil className="w-3.5 h-3.5" />
                            </button>
                            <button
                              onClick={() => onDelete(preset.id)}
                              title="Delete this template"
                              className="flex h-7 w-7 items-center justify-center rounded-md bg-zinc-800 text-zinc-400 transition-colors hover:bg-red-500/20 hover:text-red-400"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          </>
                        )}
                      </div>
                    </div>
                  )
                })}
              </div>
            </div>
          ))}
          <p className="pb-1 text-center text-[11px] leading-4 text-zinc-600">
            Save your own: the bookmark button on any finished clip stores its exact
            prompt and settings as a template.
          </p>
        </div>
      </DialogContent>
    </Dialog>
  )
}
