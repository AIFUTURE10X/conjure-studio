'use client'

import { useState } from 'react'
import { Trash2, Play, Pencil, Check, X, Save } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { GeneratePreset, PresetSource } from '../../constants/settings-defaults'

// Human-readable labels for preset sources
const SOURCE_LABELS: Record<PresetSource, string> = {
  'generate': 'Image Generator',
  'logo': 'Logo Generator',
  'mockups': 'Mockups',
  'bg-remover': 'BG Remover',
}

interface PresetsPanelProps {
  presets: GeneratePreset[]
  onLoadPreset: (preset: GeneratePreset) => void
  onDeletePreset: (id: string) => void
  onUpdatePreset: (id: string, updates: { name?: string }) => void
  onClearAll: () => void
}

export function PresetsPanel({
  presets,
  onLoadPreset,
  onDeletePreset,
  onUpdatePreset,
  onClearAll,
}: PresetsPanelProps) {
  const [editingId, setEditingId] = useState<string | null>(null)
  const [editName, setEditName] = useState('')

  const startEditing = (preset: GeneratePreset) => {
    setEditingId(preset.id)
    setEditName(preset.name)
  }

  const cancelEditing = () => {
    setEditingId(null)
    setEditName('')
  }

  const saveEdit = (id: string) => {
    if (editName.trim()) {
      onUpdatePreset(id, { name: editName.trim() })
    }
    setEditingId(null)
    setEditName('')
  }

  const formatDate = (timestamp: number) => {
    return new Date(timestamp).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
    })
  }

  if (presets.length === 0) {
    return (
      <div className="text-center py-12">
        <Save className="w-12 h-12 text-zinc-600 mx-auto mb-4" />
        <h3 className="text-lg font-medium text-zinc-300 mb-2">No Presets Saved</h3>
        <p className="text-sm text-zinc-500 max-w-sm mx-auto">
          Save your favorite prompt and settings combinations from the Generate tab for quick access later.
        </p>
      </div>
    )
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between mb-4">
        <p className="text-sm text-zinc-400">
          {presets.length} preset{presets.length !== 1 ? 's' : ''} saved
        </p>
        <Button
          variant="ghost"
          size="sm"
          onClick={onClearAll}
          className="text-red-400 hover:text-red-300 hover:bg-red-900/20"
        >
          <Trash2 className="w-4 h-4 mr-2" />
          Clear All
        </Button>
      </div>

      <div className="space-y-2">
        {presets.map(preset => (
          <div
            key={preset.id}
            className="bg-zinc-800/50 border border-zinc-700 rounded-lg p-4 hover:border-zinc-600 transition-colors"
          >
            <div className="flex items-start justify-between gap-3">
              <div className="flex-1 min-w-0">
                {editingId === preset.id ? (
                  <div className="flex items-center gap-2">
                    <input
                      type="text"
                      value={editName}
                      onChange={(e) => setEditName(e.target.value)}
                      className="flex-1 bg-zinc-700 border border-zinc-600 rounded px-2 py-1 text-white text-sm focus:outline-none focus:border-[#dbb56e]"
                      autoFocus
                      onKeyDown={(e) => {
                        if (e.key === 'Enter') saveEdit(preset.id)
                        if (e.key === 'Escape') cancelEditing()
                      }}
                    />
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => saveEdit(preset.id)}
                      className="h-7 w-7 text-green-400 hover:text-green-300"
                    >
                      <Check className="w-4 h-4" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={cancelEditing}
                      className="h-7 w-7 text-zinc-400 hover:text-white"
                    >
                      <X className="w-4 h-4" />
                    </Button>
                  </div>
                ) : (
                  <>
                    <div className="flex items-center gap-2">
                      <h4 className="font-medium text-white truncate">{preset.name}</h4>
                      {preset.source && (
                        <span className="px-2 py-0.5 bg-[#dbb56e]/20 text-[#dbb56e] rounded text-xs font-medium">
                          {SOURCE_LABELS[preset.source] || preset.source}
                        </span>
                      )}
                    </div>
                    <p className="text-xs text-zinc-500 mt-1">
                      Created {formatDate(preset.createdAt)}
                    </p>
                  </>
                )}

                {/* Preview of settings */}
                <div className="mt-2 flex flex-wrap gap-2">
                  {preset.params.selectedStylePreset && (
                    <span className="px-2 py-0.5 bg-zinc-700 rounded text-xs text-zinc-300">
                      {preset.params.selectedStylePreset}
                    </span>
                  )}
                  {preset.params.aspectRatio && (
                    <span className="px-2 py-0.5 bg-zinc-700 rounded text-xs text-zinc-300">
                      {preset.params.aspectRatio}
                    </span>
                  )}
                  {preset.params.selectedModel && (
                    <span className="px-2 py-0.5 bg-zinc-700 rounded text-xs text-zinc-300">
                      {preset.params.selectedModel.includes('flash') ? 'Flash' : 'Pro'}
                    </span>
                  )}
                </div>

                {/* Prompt preview */}
                {preset.params.mainPrompt && (
                  <p className="mt-2 text-sm text-zinc-400 line-clamp-2">
                    {preset.params.mainPrompt}
                  </p>
                )}
              </div>

              {/* Action buttons */}
              <div className="flex items-center gap-1">
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => onLoadPreset(preset)}
                  className="h-8 w-8 text-[#dbb56e] hover:text-[#f0d090] hover:bg-[#dbb56e]/10"
                  title="Load Preset"
                >
                  <Play className="w-4 h-4" />
                </Button>
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => startEditing(preset)}
                  className="h-8 w-8 text-zinc-400 hover:text-white"
                  title="Rename"
                >
                  <Pencil className="w-4 h-4" />
                </Button>
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => onDeletePreset(preset.id)}
                  className="h-8 w-8 text-zinc-400 hover:text-red-400"
                  title="Delete"
                >
                  <Trash2 className="w-4 h-4" />
                </Button>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}
