"use client"

/**
 * SavePresetModal Component
 *
 * Modal for naming and saving mockup presets with thumbnail generation.
 * Extracted from ProductMockupsPanel.tsx to keep files under 300 lines.
 */

import { RefObject } from 'react'
import { generateThumbnailFromCapture } from './utils'

interface SavePresetModalProps {
  isOpen: boolean
  onClose: () => void
  presetName: string
  onPresetNameChange: (name: string) => void
  inputRef: RefObject<HTMLInputElement | null>
  onSave: (logoUrl: string, name: string, thumbnail?: string, brandSettings?: any) => void
  captureCanvas?: () => Promise<HTMLCanvasElement | null>
  getBrandSettings?: () => any
  effectiveLogoUrl: string
}

export function SavePresetModal({
  isOpen,
  onClose,
  presetName,
  onPresetNameChange,
  inputRef,
  onSave,
  captureCanvas,
  getBrandSettings,
  effectiveLogoUrl
}: SavePresetModalProps) {
  if (!isOpen) return null

  const handleSave = async () => {
    if (!presetName.trim()) return

    const brandSettings = getBrandSettings?.()
    const thumbnail = captureCanvas
      ? await generateThumbnailFromCapture(captureCanvas)
      : undefined

    onSave(effectiveLogoUrl, presetName.trim(), thumbnail, brandSettings)
    onClose()
    onPresetNameChange('')
  }

  const handleKeyDown = async (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && presetName.trim()) {
      await handleSave()
    } else if (e.key === 'Escape') {
      onClose()
    }
  }

  return (
    <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50">
      <div className="bg-zinc-900 border border-zinc-700 rounded-xl p-6 w-full max-w-sm shadow-2xl">
        <h3 className="text-lg font-semibold text-white mb-4">Save Preset</h3>
        <label className="block text-sm text-zinc-400 mb-2">Preset Name</label>
        <input
          ref={inputRef}
          type="text"
          value={presetName}
          onChange={(e) => onPresetNameChange(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder="Enter preset name..."
          className="w-full px-3 py-2 bg-zinc-800 border border-zinc-600 rounded-lg text-white placeholder-zinc-500 focus:outline-none focus:border-green-500"
        />
        <div className="flex justify-end gap-2 mt-4">
          <button
            onClick={onClose}
            className="px-4 py-2 text-sm text-zinc-400 hover:text-white transition-colors"
          >
            Cancel
          </button>
          <button
            onClick={handleSave}
            disabled={!presetName.trim()}
            className="px-4 py-2 text-sm bg-green-600 hover:bg-green-500 text-white rounded-lg disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            Save
          </button>
        </div>
      </div>
    </div>
  )
}
