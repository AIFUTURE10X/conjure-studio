"use client"

/**
 * StudioTopBar
 *
 * Workspace header for the unified studio shell: home link, mode switcher,
 * image-mode context buttons (history/favorites), and the account slot.
 * Absorbs ImageStudioHeader's role for the v2 shell.
 */

import { useState } from 'react'
import Link from 'next/link'
import { Home, ImageIcon, Settings } from 'lucide-react'
import { Dialog, DialogContent, DialogTitle } from '@/components/ui/dialog'
import { HeaderContextButtons } from '../HeaderContextButtons'
import { AccountManager } from '../AccountManager'
import { AccountMenu } from './AccountMenu'
import { UiZoomControl } from './UiZoomControl'
import { SettingsPanel } from '../Settings'
import { useStudioCore, useStudioMode } from '../../context/useStudio'
import type { StudioMode } from '../../context/studio-types'

const MODE_OPTIONS: Array<{ mode: StudioMode; label: string }> = [
  { mode: 'image', label: 'Image' },
  { mode: 'logo', label: 'Logo' },
  { mode: 'mockups', label: 'Mockups' },
  { mode: 'bg-remover', label: 'BG Remover' },
]

export function StudioTopBar() {
  const { mode, setMode } = useStudioMode()
  const {
    favorites, hasStoredParams, handleRestoreParameters, state, setShowPhotoGenerator,
    settings, updateSetting, resetSettings, presets, handleLoadPreset,
    deletePreset, updatePreset, clearAllPresets,
  } = useStudioCore()
  const [showSettings, setShowSettings] = useState(false)

  return (
    <header className="border-b border-zinc-800 px-4 py-2 bg-black/50 backdrop-blur-sm shrink-0 z-50">
      <div className="flex items-center justify-between gap-3">
        <Link
          href="/"
          className="flex items-center gap-2 px-3 py-1.5 rounded-lg text-sm font-medium transition-all bg-zinc-900/80 text-zinc-200 hover:bg-zinc-800 hover:text-white border border-zinc-700"
        >
          <div
            className="w-5 h-5 rounded flex items-center justify-center shrink-0"
            style={{
              background: "linear-gradient(135deg, #c99850 0%, #dbb56e 50%, #c99850 100%)",
            }}
          >
            <Home className="w-3 h-3 text-black" />
          </div>
          <span className="hidden sm:inline">Home</span>
        </Link>

        <div className="flex items-center gap-1 p-1 bg-zinc-900 rounded-lg border border-zinc-800">
          {MODE_OPTIONS.map((option) => (
            <button
              key={option.mode}
              onClick={() => setMode(option.mode)}
              className={`px-4 py-1.5 rounded-md text-sm font-medium transition-colors ${
                mode === option.mode
                  ? 'bg-linear-to-r from-[#c99850] to-[#dbb56e] text-black'
                  : 'text-zinc-400 hover:text-white hover:bg-zinc-800'
              }`}
            >
              {option.label}
            </button>
          ))}
        </div>

        <div className="flex items-center gap-2">
          {mode === 'image' && (
            <HeaderContextButtons
              favoritesCount={favorites.length}
              hasStoredParams={hasStoredParams}
              onShowHistory={() => state.setShowParameterHistory(true)}
              onRestoreParameters={handleRestoreParameters}
              onShowFavorites={() => state.setShowFavorites(true)}
            />
          )}
          {mode === 'logo' && (
            <button
              onClick={() => setShowPhotoGenerator(true)}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium bg-zinc-900 text-zinc-300 hover:text-white hover:bg-zinc-800 border border-zinc-800 transition-colors"
              title="Generate Product Photos for Mockups"
            >
              <ImageIcon className="w-3.5 h-3.5 text-[#dbb56e]" />
              <span className="hidden sm:inline">Product Photos</span>
            </button>
          )}
          <UiZoomControl />
          <button
            onClick={() => setShowSettings(true)}
            className="p-2 rounded-lg text-zinc-400 hover:text-white hover:bg-zinc-800 transition-colors"
            title="Studio settings"
          >
            <Settings className="w-4 h-4" />
          </button>
          <AccountManager />
          <AccountMenu />
        </div>
      </div>

      <Dialog open={showSettings} onOpenChange={setShowSettings}>
        <DialogContent className="max-w-3xl max-h-[85vh] overflow-y-auto bg-zinc-950 border-zinc-800 p-0">
          <DialogTitle className="sr-only">Studio settings</DialogTitle>
          <SettingsPanel
            settings={settings}
            onUpdateSetting={updateSetting}
            onResetSettings={resetSettings}
            onBack={() => setShowSettings(false)}
            presets={presets}
            onLoadPreset={(preset) => { handleLoadPreset(preset); setShowSettings(false) }}
            onDeletePreset={deletePreset}
            onUpdatePreset={updatePreset}
            onClearAllPresets={clearAllPresets}
          />
        </DialogContent>
      </Dialog>
    </header>
  )
}
