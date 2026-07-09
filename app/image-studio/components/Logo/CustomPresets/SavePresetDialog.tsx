"use client"

/**
 * SavePresetDialog Component
 *
 * Modal dialog for saving current configuration as a custom preset
 */

import { useState } from 'react'
import { X, Save, AlertTriangle } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { useCustomPresets } from './useCustomPresets'

// Emoji categories for preset icons
const PRESET_EMOJIS = [
  ['⭐', '💫', '✨', '🌟', '💎', '🔥', '⚡', '💡'],
  ['🎨', '🎯', '🎪', '🎭', '🎬', '🎮', '🎵', '🎸'],
  ['🏢', '🏠', '🏪', '🏭', '🛒', '💼', '📊', '📈'],
  ['🌿', '🌸', '🌺', '🍀', '🌈', '☀️', '🌙', '❄️'],
  ['🍕', '🍔', '🍰', '☕', '🍷', '🥗', '🍣', '🧁'],
  ['💻', '📱', '🖥️', '⚙️', '🔧', '🛠️', '🔬', '🚀']
]

interface SavePresetDialogProps {
  isOpen: boolean
  onClose: () => void
  currentConfig: Record<string, any>
  basePresetId: string
  basePresetName: string
}

export function SavePresetDialog({
  isOpen,
  onClose,
  currentConfig,
  basePresetId,
  basePresetName
}: SavePresetDialogProps) {
  const [name, setName] = useState('')
  const [description, setDescription] = useState('')
  const [selectedEmoji, setSelectedEmoji] = useState('⭐')
  const [error, setError] = useState<string | null>(null)
  const [isSaving, setIsSaving] = useState(false)

  const { addPreset, presetsCount, maxPresets, canAddMore } = useCustomPresets()

  const handleSave = async () => {
    setError(null)
    setIsSaving(true)

    try {
      const result = addPreset(
        name,
        basePresetId,
        currentConfig,
        selectedEmoji,
        description || undefined
      )

      if (result.success) {
        // Reset form and close
        setName('')
        setDescription('')
        setSelectedEmoji('⭐')
        onClose()
      } else {
        setError(result.error || 'Failed to save preset')
      }
    } catch (err) {
      setError('An unexpected error occurred')
    } finally {
      setIsSaving(false)
    }
  }

  const handleClose = () => {
    setName('')
    setDescription('')
    setSelectedEmoji('⭐')
    setError(null)
    onClose()
  }

  if (!isOpen) return null

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm">
      <div className="relative w-full max-w-md bg-zinc-900 rounded-2xl border border-zinc-700 shadow-2xl">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-zinc-800">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-lg bg-linear-to-r from-amber-500 to-orange-500">
              <Save className="w-5 h-5 text-white" />
            </div>
            <div>
              <h2 className="text-lg font-semibold text-white">Save as Preset</h2>
              <p className="text-xs text-zinc-400">
                {presetsCount}/{maxPresets} presets saved
              </p>
            </div>
          </div>
          <button
            onClick={handleClose}
            className="p-2 text-zinc-400 hover:text-white rounded-lg hover:bg-zinc-800 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 space-y-4">
          {/* Warning if at limit */}
          {!canAddMore && (
            <div className="flex items-start gap-3 p-3 bg-amber-500/10 border border-amber-500/30 rounded-lg">
              <AlertTriangle className="w-5 h-5 text-amber-400 flex-shrink-0 mt-0.5" />
              <div className="text-sm text-amber-200">
                You&apos;ve reached the maximum of {maxPresets} presets. Delete some existing
                presets to save new ones.
              </div>
            </div>
          )}

          {/* Base preset info */}
          <div className="p-3 bg-zinc-800/50 rounded-lg">
            <p className="text-xs text-zinc-500 mb-1">Based on</p>
            <p className="text-sm text-white font-medium">{basePresetName}</p>
          </div>

          {/* Name input */}
          <div className="space-y-2">
            <label className="text-sm text-zinc-400">Preset Name *</label>
            <Input
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="e.g., My Tech Logo Style"
              className="h-10 bg-zinc-800 border-zinc-700 text-white placeholder:text-zinc-500"
              disabled={!canAddMore}
              maxLength={50}
            />
          </div>

          {/* Description input */}
          <div className="space-y-2">
            <label className="text-sm text-zinc-400">Description (optional)</label>
            <Input
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Brief description of this preset..."
              className="h-10 bg-zinc-800 border-zinc-700 text-white placeholder:text-zinc-500"
              disabled={!canAddMore}
              maxLength={100}
            />
          </div>

          {/* Emoji selector */}
          <div className="space-y-2">
            <label className="text-sm text-zinc-400">Choose an Icon</label>
            <div className="p-3 bg-zinc-800/50 rounded-lg space-y-2">
              {PRESET_EMOJIS.map((row, rowIndex) => (
                <div key={rowIndex} className="flex gap-1 justify-center">
                  {row.map((emoji) => (
                    <button
                      key={emoji}
                      onClick={() => setSelectedEmoji(emoji)}
                      disabled={!canAddMore}
                      className={`w-9 h-9 text-lg rounded-lg transition-all ${
                        selectedEmoji === emoji
                          ? 'bg-[#c99850] scale-110'
                          : 'bg-zinc-700 hover:bg-zinc-600'
                      } disabled:opacity-50 disabled:cursor-not-allowed`}
                    >
                      {emoji}
                    </button>
                  ))}
                </div>
              ))}
            </div>
          </div>

          {/* Error message */}
          {error && (
            <div className="p-3 bg-red-500/10 border border-red-500/30 rounded-lg">
              <p className="text-sm text-red-400">{error}</p>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="flex items-center justify-end gap-3 px-6 py-4 border-t border-zinc-800">
          <Button
            variant="outline"
            onClick={handleClose}
            className="bg-zinc-800 border-zinc-700 text-white hover:bg-zinc-700"
          >
            Cancel
          </Button>
          <Button
            onClick={handleSave}
            disabled={!name.trim() || !canAddMore || isSaving}
            className="bg-linear-to-r from-amber-500 to-orange-500 text-white hover:from-amber-600 hover:to-orange-600"
          >
            {isSaving ? 'Saving...' : 'Save Preset'}
          </Button>
        </div>
      </div>
    </div>
  )
}
