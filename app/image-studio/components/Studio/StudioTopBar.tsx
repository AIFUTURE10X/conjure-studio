"use client"

/**
 * StudioTopBar
 *
 * Workspace header for the unified studio shell: home link, mode switcher,
 * image-mode context buttons (history/favorites), and the account slot.
 * Absorbs ImageStudioHeader's role for the v2 shell.
 */

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { Home, ImageIcon, Settings, Sparkles } from 'lucide-react'
import { Dialog, DialogContent, DialogTitle } from '@/components/ui/dialog'
import { ConciergeDialog } from '../Concierge'
import { HeaderContextButtons } from '../HeaderContextButtons'
import { AccountManager } from '../AccountManager'
import { AccountMenu } from './AccountMenu'
import { UiZoomControl } from './UiZoomControl'
import { SettingsPanel } from '../Settings'
import { useStudioCore, useStudioMode } from '../../context/useStudio'
import { getKnownUserIds, getUserId } from '@/lib/user-id'
import type { StudioMode } from '../../context/studio-types'

const MODE_OPTIONS: Array<{ mode: StudioMode; label: string }> = [
  { mode: 'image', label: 'Image' },
  { mode: 'video', label: 'Video' },
  { mode: 'logo', label: 'Logo' },
  { mode: 'thumbnail', label: 'Thumbnail' },
  { mode: 'translate', label: 'Translate' },
  { mode: 'mockups', label: 'Mockups' },
  { mode: 'bg-remover', label: 'BG Remover' },
  { mode: 'analytics', label: 'Analytics' },
  { mode: 'guide', label: 'Guide' },
]

const SHOW_ACCOUNT_CONTROLS = ['on', 'true', '1'].includes(
  (process.env.NEXT_PUBLIC_SAAS_ENFORCEMENT || '').toLowerCase(),
)

const deviceClaimMarkerKey = (targetUserId: string, knownIds: string[]) =>
  `genie-device-claimed-known-ids:${targetUserId}:${[...knownIds].sort().join('|')}`

export function StudioTopBar() {
  const { mode, setMode } = useStudioMode()
  const {
    favorites, hasStoredParams, handleRestoreParameters, state, setShowPhotoGenerator,
    settings, updateSetting, resetSettings, presets, handleLoadPreset,
    deletePreset, updatePreset, clearAllPresets,
  } = useStudioCore()
  const [showSettings, setShowSettings] = useState(false)
  const [showConcierge, setShowConcierge] = useState(false)

  useEffect(() => {
    if (typeof window === 'undefined' || SHOW_ACCOUNT_CONTROLS) return

    const targetUserId = getUserId()
    const knownIds = getKnownUserIds()
    const legacyUserIds = knownIds.filter((id) => id !== targetUserId)
    if (legacyUserIds.length === 0) return

    const markerKey = deviceClaimMarkerKey(targetUserId, knownIds)
    if (localStorage.getItem(markerKey)) return

    localStorage.setItem(markerKey, 'pending')

    fetch('/api/device/claim', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ targetUserId, legacyUserIds }),
    })
      .then(async (res) => {
        const data = await res.json().catch(() => null)
        if (!res.ok) throw new Error(data?.error || 'Device claim failed')
        localStorage.setItem(markerKey, '1')
        if (typeof data?.moved === 'number' && data.moved > 0) {
          window.location.reload()
        }
      })
      .catch((error) => {
        localStorage.removeItem(markerKey)
        console.error('[StudioTopBar] Anonymous device claim failed:', error)
      })
  }, [])

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
          <button
            onClick={() => setShowConcierge(true)}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium bg-[#c99850]/10 text-[#dbb56e] hover:bg-[#c99850]/20 border border-[#c99850]/40 transition-colors"
            title="Not sure where to start? Answer two questions and get a ready-made plan"
          >
            <Sparkles className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">Help me start</span>
          </button>
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
          {SHOW_ACCOUNT_CONTROLS && (
            <>
              <AccountManager />
              <AccountMenu />
            </>
          )}
        </div>
      </div>

      <ConciergeDialog open={showConcierge} onOpenChange={setShowConcierge} />

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
