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
import {
  ResizableHandle,
  ResizablePanel,
  ResizablePanelGroup,
} from '@/components/ui/resizable'
import { ImageLightbox } from '../ImageLightbox'
import { FavoritesModal } from '../SimpleFavorites'
import { ParameterHistoryPanel } from '../ParameterHistoryPanel'
import { MockupPhotoGenerator } from '../Logo/MockupPreview/MockupPhotoGenerator'
import { StudioTopBar } from './StudioTopBar'
import { HelperPanel } from './HelperPanel'
import { CanvasPanel } from './CanvasPanel'
import { SettingsRail } from './SettingsRail'
import { StudioMobileLayout } from './StudioMobileLayout'
import { useStudioCore } from '../../context/useStudio'
import { ImageGenerationProvider } from '../../context/ImageGenerationProvider'
import { LogoGenerationProvider } from '../../context/LogoGenerationProvider'
import { HelperBridgeProvider } from '../../context/HelperBridgeProvider'
import { ThumbnailProvider } from '../Thumbnail'
import { useMediaQuery } from '../../hooks/useMediaQuery'

export function StudioShell() {
  const {
    favorites, toggleFavorite, clearAll, state,
    handleRestoreParameters, closeLightbox, navigateLightbox, handleDownloadFromLightbox,
    showPhotoGenerator, setShowPhotoGenerator,
  } = useStudioCore()

  const { defaultLayout, onLayoutChanged } = useDefaultLayout({ id: 'studio-layout' })
  const isDesktop = useMediaQuery('(min-width: 1024px)')

  return (
    <div
      className="flex flex-col bg-linear-to-br from-zinc-950 via-black to-zinc-950"
      style={{
        // Compensate for the interface-zoom scale (set on <html>) so the
        // fixed shell always fills the window — no gap below / right when
        // zoomed out, no overflow when zoomed in. Falls back to a normal
        // full-window shell when no zoom is set.
        width: 'calc(100vw / var(--ui-zoom, 1))',
        height: 'calc(100dvh / var(--ui-zoom, 1))',
      }}
    >
      <StudioTopBar />

      <div className="flex-1 min-h-0 flex flex-col">
        <ImageGenerationProvider>
        <LogoGenerationProvider>
        <HelperBridgeProvider>
        <ThumbnailProvider>
          {isDesktop ? (
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
                <SettingsRail />
              </ResizablePanel>
            </ResizablePanelGroup>
          ) : (
            <StudioMobileLayout />
          )}
        </ThumbnailProvider>
        </HelperBridgeProvider>
        </LogoGenerationProvider>
        </ImageGenerationProvider>
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

      {showPhotoGenerator && (
        <MockupPhotoGenerator onClose={() => setShowPhotoGenerator(false)} />
      )}
    </div>
  )
}
