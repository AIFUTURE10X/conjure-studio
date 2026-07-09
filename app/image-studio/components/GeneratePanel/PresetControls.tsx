"use client"

/**
 * Preset save/load controls for GeneratePanel
 */

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Save, FolderOpen } from 'lucide-react'
import type { GeneratePreset, SavedGenerateParams } from '../../constants/settings-defaults'
import type { CreativeDirectionState } from '../../constants/creative-direction-options'

interface PresetControlsProps {
  mainPrompt: string
  negativePrompt: string
  aspectRatio: string
  selectedStylePreset: string
  selectedCameraAngle: string
  selectedCameraLens: string
  styleStrength: 'subtle' | 'moderate' | 'strong'
  imageSize: '1K' | '2K' | '4K'
  selectedModel: string
  creativeDirection: CreativeDirectionState
  presets: GeneratePreset[]
  onSavePreset?: (name: string, params: SavedGenerateParams) => void
  onLoadPreset?: (preset: GeneratePreset) => void
  onSetMainPrompt: (prompt: string) => void
  onSetNegativePrompt: (prompt: string) => void
}

export function PresetControls({
  mainPrompt,
  negativePrompt,
  aspectRatio,
  selectedStylePreset,
  selectedCameraAngle,
  selectedCameraLens,
  styleStrength,
  imageSize,
  selectedModel,
  creativeDirection,
  presets,
  onSavePreset,
  onLoadPreset,
  onSetMainPrompt,
  onSetNegativePrompt,
}: PresetControlsProps) {
  const [showPresetModal, setShowPresetModal] = useState(false)
  const [presetName, setPresetName] = useState('')
  const [showLoadPresets, setShowLoadPresets] = useState(false)

  const handleSavePreset = () => {
    if (presetName.trim()) {
      onSavePreset?.(presetName, {
        mainPrompt,
        negativePrompt,
        aspectRatio,
        selectedStylePreset,
        selectedCameraAngle,
        selectedCameraLens,
        styleStrength,
        imageSize,
        selectedModel,
        creativeDirection,
      })
      setPresetName('')
      setShowPresetModal(false)
    }
  }

  const handleLoadPreset = (preset: GeneratePreset) => {
    const p = preset.params
    if (p.mainPrompt) onSetMainPrompt(p.mainPrompt)
    if (p.negativePrompt) onSetNegativePrompt(p.negativePrompt)
    onLoadPreset?.(preset)
    setShowLoadPresets(false)
  }

  return (
    <>
      <div className="flex items-center gap-1 ml-auto">
        <Button
          variant="outline"
          size="sm"
          onClick={() => setShowPresetModal(true)}
          className="border-zinc-700 text-zinc-300 hover:text-white hover:border-[#dbb56e]"
          disabled={!mainPrompt.trim()}
        >
          <Save className="w-4 h-4 mr-1" />
          Save Preset
        </Button>
        {presets.length > 0 && (
          <Button
            variant="outline"
            size="sm"
            onClick={() => setShowLoadPresets(!showLoadPresets)}
            className="border-zinc-700 text-zinc-300 hover:text-white hover:border-[#dbb56e]"
          >
            <FolderOpen className="w-4 h-4 mr-1" />
            Load ({presets.length})
          </Button>
        )}
      </div>

      {/* Save Preset Modal */}
      {showPresetModal && (
        <div className="p-3 bg-zinc-800 rounded-lg border border-zinc-700 space-y-3">
          <p className="text-sm text-zinc-300">Save current settings as a preset:</p>
          <input
            type="text"
            placeholder="Preset name (e.g., My Logo Style)"
            value={presetName}
            onChange={(e) => setPresetName(e.target.value)}
            className="w-full bg-zinc-700 border border-zinc-600 rounded px-3 py-2 text-white text-sm focus:outline-none focus:border-[#dbb56e]"
            autoFocus
            onKeyDown={(e) => {
              if (e.key === 'Enter' && presetName.trim()) handleSavePreset()
              if (e.key === 'Escape') {
                setShowPresetModal(false)
                setPresetName('')
              }
            }}
          />
          <div className="flex gap-2 justify-end">
            <Button variant="ghost" size="sm" onClick={() => { setShowPresetModal(false); setPresetName('') }}>
              Cancel
            </Button>
            <Button
              size="sm"
              onClick={handleSavePreset}
              disabled={!presetName.trim()}
              className="bg-[#dbb56e] text-black hover:bg-[#c99850]"
            >
              Save
            </Button>
          </div>
        </div>
      )}

      {/* Load Presets Dropdown */}
      {showLoadPresets && presets.length > 0 && (
        <div className="p-2 bg-zinc-800 rounded-lg border border-zinc-700 max-h-48 overflow-y-auto space-y-1">
          {presets.map(preset => (
            <button
              key={preset.id}
              onClick={() => handleLoadPreset(preset)}
              className="w-full text-left px-3 py-2 rounded hover:bg-zinc-700 transition-colors"
            >
              <span className="text-sm text-white font-medium">{preset.name}</span>
              <span className="text-xs text-zinc-400 block truncate">{preset.params.mainPrompt}</span>
            </button>
          ))}
        </div>
      )}
    </>
  )
}
