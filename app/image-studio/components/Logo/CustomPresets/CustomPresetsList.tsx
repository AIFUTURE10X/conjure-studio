"use client"

/**
 * CustomPresetsList Component
 *
 * Displays user's saved custom presets with edit/delete actions
 */

import { useState } from 'react'
import {
  Trash2,
  Copy,
  MoreVertical,
  Download,
  Upload,
  AlertTriangle,
  FolderOpen
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { useCustomPresets, CustomPreset } from './useCustomPresets'

interface CustomPresetsListProps {
  onSelectPreset: (preset: CustomPreset) => void
  selectedPresetId?: string
}

export function CustomPresetsList({
  onSelectPreset,
  selectedPresetId
}: CustomPresetsListProps) {
  const [menuOpenId, setMenuOpenId] = useState<string | null>(null)
  const [showImport, setShowImport] = useState(false)
  const [importText, setImportText] = useState('')
  const [importError, setImportError] = useState<string | null>(null)
  const [showDeleteConfirm, setShowDeleteConfirm] = useState<string | null>(null)

  const {
    presets,
    presetsCount,
    maxPresets,
    deletePreset,
    duplicatePreset,
    exportPresets,
    importPresets,
    clearAllPresets
  } = useCustomPresets()

  const handleExport = () => {
    const json = exportPresets()
    const blob = new Blob([json], { type: 'application/json' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = 'logo-presets-backup.json'
    document.body.appendChild(a)
    a.click()
    document.body.removeChild(a)
    URL.revokeObjectURL(url)
  }

  const handleImport = () => {
    setImportError(null)
    const result = importPresets(importText, 'merge')
    if (result.success) {
      setShowImport(false)
      setImportText('')
    } else {
      setImportError(result.error || 'Import failed')
    }
  }

  const handleDelete = (id: string) => {
    deletePreset(id)
    setShowDeleteConfirm(null)
    setMenuOpenId(null)
  }

  const handleDuplicate = (id: string) => {
    duplicatePreset(id)
    setMenuOpenId(null)
  }

  if (presets.length === 0 && !showImport) {
    return (
      <div className="p-4 text-center space-y-3">
        <FolderOpen className="w-8 h-8 text-zinc-600 mx-auto" />
        <p className="text-sm text-zinc-500">No saved presets yet</p>
        <p className="text-xs text-zinc-600">
          Configure a logo style and save it as a preset for quick access
        </p>
        <Button
          variant="outline"
          size="sm"
          onClick={() => setShowImport(true)}
          className="bg-zinc-800 border-zinc-700 text-zinc-300 hover:bg-zinc-700 text-xs"
        >
          <Upload className="w-3 h-3 mr-1" />
          Import Presets
        </Button>
      </div>
    )
  }

  return (
    <div className="space-y-2">
      {/* Header with actions */}
      <div className="flex items-center justify-between px-1 mb-2">
        <span className="text-xs text-zinc-500">
          {presetsCount}/{maxPresets} presets
        </span>
        <div className="flex items-center gap-1">
          <Button
            variant="ghost"
            size="sm"
            onClick={handleExport}
            disabled={presets.length === 0}
            className="h-6 px-2 text-xs text-zinc-400 hover:text-white"
            title="Export presets"
          >
            <Download className="w-3 h-3" />
          </Button>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setShowImport(!showImport)}
            className="h-6 px-2 text-xs text-zinc-400 hover:text-white"
            title="Import presets"
          >
            <Upload className="w-3 h-3" />
          </Button>
        </div>
      </div>

      {/* Import section */}
      {showImport && (
        <div className="p-3 bg-zinc-800/50 rounded-lg space-y-2 border border-zinc-700">
          <p className="text-xs text-zinc-400">Paste JSON to import:</p>
          <textarea
            value={importText}
            onChange={(e) => setImportText(e.target.value)}
            className="w-full h-20 p-2 text-xs bg-zinc-900 border border-zinc-700 rounded text-white resize-none"
            placeholder='[{"name": "My Preset", ...}]'
          />
          {importError && (
            <p className="text-xs text-red-400">{importError}</p>
          )}
          <div className="flex gap-2">
            <Button
              size="sm"
              onClick={handleImport}
              disabled={!importText.trim()}
              className="h-7 text-xs bg-[#c99850] text-black hover:bg-[#dbb56e]"
            >
              Import
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => {
                setShowImport(false)
                setImportText('')
                setImportError(null)
              }}
              className="h-7 text-xs bg-zinc-800 border-zinc-700 text-zinc-300"
            >
              Cancel
            </Button>
          </div>
        </div>
      )}

      {/* Preset list */}
      <div className="space-y-1 max-h-[180px] overflow-y-auto pr-1">
        {presets.map((preset) => (
          <div key={preset.id} className="relative">
            <button
              onClick={() => onSelectPreset(preset)}
              className={`w-full p-2 rounded-lg border text-left transition-all ${
                selectedPresetId === preset.id
                  ? 'border-[#c99850] bg-[#c99850]/10'
                  : 'border-zinc-700 bg-zinc-800/50 hover:border-zinc-600 hover:bg-zinc-800'
              }`}
            >
              <div className="flex items-start gap-2">
                <span className="text-lg">{preset.icon}</span>
                <div className="flex-1 min-w-0">
                  <div className="text-xs font-medium text-white truncate">
                    {preset.name}
                  </div>
                  {preset.description && (
                    <div className="text-[10px] text-zinc-500 truncate">
                      {preset.description}
                    </div>
                  )}
                  <div className="text-[9px] text-zinc-600 mt-0.5">
                    Based on: {preset.basePresetId}
                  </div>
                </div>
                <button
                  onClick={(e) => {
                    e.stopPropagation()
                    setMenuOpenId(menuOpenId === preset.id ? null : preset.id)
                  }}
                  className="p-1 hover:bg-zinc-700 rounded"
                >
                  <MoreVertical className="w-3 h-3 text-zinc-500" />
                </button>
              </div>
            </button>

            {/* Dropdown menu */}
            {menuOpenId === preset.id && (
              <div className="absolute right-0 top-full mt-1 w-32 bg-zinc-800 border border-zinc-700 rounded-lg shadow-xl z-10 overflow-hidden">
                <button
                  onClick={() => handleDuplicate(preset.id)}
                  className="w-full flex items-center gap-2 px-3 py-2 text-xs text-zinc-300 hover:bg-zinc-700"
                >
                  <Copy className="w-3 h-3" />
                  Duplicate
                </button>
                <button
                  onClick={() => {
                    setShowDeleteConfirm(preset.id)
                    setMenuOpenId(null)
                  }}
                  className="w-full flex items-center gap-2 px-3 py-2 text-xs text-red-400 hover:bg-zinc-700"
                >
                  <Trash2 className="w-3 h-3" />
                  Delete
                </button>
              </div>
            )}

            {/* Delete confirmation */}
            {showDeleteConfirm === preset.id && (
              <div className="absolute inset-0 bg-zinc-900/95 rounded-lg flex items-center justify-center p-2 z-20">
                <div className="text-center space-y-2">
                  <AlertTriangle className="w-5 h-5 text-amber-400 mx-auto" />
                  <p className="text-[10px] text-zinc-300">Delete this preset?</p>
                  <div className="flex gap-1 justify-center">
                    <Button
                      size="sm"
                      onClick={() => handleDelete(preset.id)}
                      className="h-6 px-2 text-[10px] bg-red-500 hover:bg-red-600 text-white"
                    >
                      Delete
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setShowDeleteConfirm(null)}
                      className="h-6 px-2 text-[10px] bg-zinc-800 border-zinc-600 text-zinc-300"
                    >
                      Cancel
                    </Button>
                  </div>
                </div>
              </div>
            )}
          </div>
        ))}
      </div>

      {/* Click outside to close menu */}
      {menuOpenId && (
        <div
          className="fixed inset-0 z-0"
          onClick={() => setMenuOpenId(null)}
        />
      )}
    </div>
  )
}
