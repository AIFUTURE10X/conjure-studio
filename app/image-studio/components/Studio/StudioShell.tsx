"use client"

/**
 * StudioShell
 *
 * Unified 3-panel workspace: helper | canvas | settings rail, with a
 * persistent resizable layout. Skeleton stage: helper and rail are
 * placeholders; the canvas hosts the existing generate UI in image mode.
 * Shared modals (lightbox, favorites, parameter history) render here so
 * image mode is fully functional inside the shell.
 */

import { useDefaultLayout } from 'react-resizable-panels'
import { SlidersHorizontal } from 'lucide-react'
import {
  ResizableHandle,
  ResizablePanel,
  ResizablePanelGroup,
} from '@/components/ui/resizable'
import { ImageLightbox } from '../ImageLightbox'
import { FavoritesModal } from '../SimpleFavorites'
import { ParameterHistoryPanel } from '../ParameterHistoryPanel'
import { StudioTopBar } from './StudioTopBar'
import { HelperPanel } from './HelperPanel'
import { CanvasPanel } from './CanvasPanel'
import { useStudioCore } from '../../context/useStudio'

function SettingsRailPlaceholder() {
  return (
    <div className="h-full flex flex-col bg-zinc-950 border-l border-zinc-800">
      <div className="flex items-center gap-2 px-4 py-3 border-b border-zinc-800">
        <SlidersHorizontal className="w-4 h-4 text-[#dbb56e]" />
        <span className="text-sm font-medium text-zinc-200">Settings</span>
      </div>
      <div className="flex-1 flex items-center justify-center p-6">
        <p className="text-xs text-zinc-500 text-center leading-5">
          The shared settings rail lands here next, with live suggestion
          previews from the AI helper.
        </p>
      </div>
    </div>
  )
}

export function StudioShell() {
  const {
    favorites, toggleFavorite, clearAll, state,
    handleRestoreParameters, closeLightbox, navigateLightbox, handleDownloadFromLightbox,
  } = useStudioCore()

  const { defaultLayout, onLayoutChanged } = useDefaultLayout({ id: 'studio-layout' })

  return (
    <div className="h-screen flex flex-col bg-linear-to-br from-zinc-950 via-black to-zinc-950">
      <StudioTopBar />

      <div className="flex-1 min-h-0">
        <ResizablePanelGroup
          orientation="horizontal"
          defaultLayout={defaultLayout}
          onLayoutChanged={onLayoutChanged}
        >
          <ResizablePanel id="helper" defaultSize={22} minSize={14} collapsible>
            <HelperPanel />
          </ResizablePanel>
          <ResizableHandle withHandle className="bg-zinc-800" />
          <ResizablePanel id="canvas" defaultSize={56} minSize={30}>
            <CanvasPanel />
          </ResizablePanel>
          <ResizableHandle withHandle className="bg-zinc-800" />
          <ResizablePanel id="settings-rail" defaultSize={22} minSize={14} collapsible>
            <SettingsRailPlaceholder />
          </ResizablePanel>
        </ResizablePanelGroup>
      </div>

      {state.showFavorites && (
        <FavoritesModal
          favorites={favorites}
          onClose={() => state.setShowFavorites(false)}
          onRemove={toggleFavorite}
          onClearAll={clearAll}
          onRestoreParameters={handleRestoreParameters}
        />
      )}

      {state.showParameterHistory && (
        <ParameterHistoryPanel
          isOpen={state.showParameterHistory}
          onClose={() => state.setShowParameterHistory(false)}
          onRestoreParameters={handleRestoreParameters}
        />
      )}

      <ImageLightbox
        isOpen={state.lightboxOpen}
        images={state.generatedImages}
        currentIndex={state.lightboxIndex}
        onClose={closeLightbox}
        onNavigate={navigateLightbox}
        onDownload={handleDownloadFromLightbox}
      />
    </div>
  )
}
