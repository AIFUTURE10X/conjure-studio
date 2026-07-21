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

import { useEffect } from 'react'
import { useDefaultLayout } from 'react-resizable-panels'
import {
  ResizableHandle,
  ResizablePanel,
  ResizablePanelGroup,
} from '@/components/ui/resizable'
import { FavoritesModal } from '../SimpleFavorites'
import { ParameterHistoryPanel } from '../ParameterHistoryPanel'
import { MockupPhotoGenerator } from '../Logo/MockupPreview/MockupPhotoGenerator'
import { ConciergeChecklist } from '../Concierge'
import { StudioTopBar } from './StudioTopBar'
import { HelperPanel } from './HelperPanel'
import { CanvasPanel } from './CanvasPanel'
import { SettingsRail } from './SettingsRail'
import { StudioMobileLayout } from './StudioMobileLayout'
import { StudioLightbox } from './StudioLightbox'
import { useStudioCore } from '../../context/useStudio'
import { ImageGenerationProvider } from '../../context/ImageGenerationProvider'
import { EditChatProvider } from '../../context/EditChatProvider'
import { LogoGenerationProvider } from '../../context/LogoGenerationProvider'
import { HelperBridgeProvider } from '../../context/HelperBridgeProvider'
import { ThumbnailProvider } from '../Thumbnail'
import { useMediaQuery } from '../../hooks/useMediaQuery'
import { useZoomedViewportSize } from '../../hooks/useZoomedViewportSize'
import { useFirstPaintReflowNudge } from '../../hooks/useFirstPaintReflowNudge'

export function StudioShell() {
  const {
    favorites, toggleFavorite, clearAll, state,
    handleRestoreParameters,
    showPhotoGenerator, setShowPhotoGenerator,
  } = useStudioCore()

  const { defaultLayout, onLayoutChanged } = useDefaultLayout({ id: 'studio-layout' })
  const isDesktop = useMediaQuery('(min-width: 1024px)')
  const viewport = useZoomedViewportSize()
  useFirstPaintReflowNudge()

  // The studio is a full-window workspace: every scroll lives inside a
  // panel, never the document. Lock the page scroll while the shell is mounted
  // (restored on navigation away) so nothing — a fresh generation, an image
  // that grows a panel — can ever push the document taller than the viewport
  // and expose empty space below the app.
  useEffect(() => {
    const html = document.documentElement
    const { overflow: prevHtml } = html.style
    const { overflow: prevBody } = document.body.style
    // 'clip' (not 'hidden'): a clipped box is not a scroll container at all,
    // so focus()/scrollIntoView can never scroll the document programmatically.
    html.style.overflow = 'clip'
    document.body.style.overflow = 'clip'
    return () => {
      html.style.overflow = prevHtml
      document.body.style.overflow = prevBody
    }
  }, [])

  return (
    <div
      // Size the shell IN-FLOW to explicit, JS-measured pixels rather than with
      // position:fixed or viewport units. The installed app's webview (WebView2)
      // can resolve viewport units — and a fixed box's containing block — against
      // a stale window size on the first layout pass and never re-resolve them,
      // which rendered the studio cramped into the top of the window. The hook
      // measures window.innerWidth/innerHeight (always current), compensates for
      // the interface-zoom CSS `zoom` on <html>, and re-measures on resize/zoom
      // change, so the shell fills the window on every surface. overflow-clip
      // (not hidden — a hidden box is still programmatically scrollable, so a
      // focus() or scrollIntoView inside a panel could scroll the whole app
      // off the top of the window) makes the shell a non-scroll container,
      // and the html/body clip above does the same for the document — together
      // they stop the empty-space-below / jump-on-generate / shift-to-top
      // behaviors for good.
      className="flex flex-col overflow-clip bg-linear-to-br from-zinc-950 via-black to-zinc-950"
      style={{ width: viewport.width, height: viewport.height }}
    >
      <StudioTopBar />

      <div className="relative flex-1 min-h-0 flex flex-col">
        <ImageGenerationProvider>
        <EditChatProvider>
        <LogoGenerationProvider>
        <HelperBridgeProvider>
        <ThumbnailProvider>
          {isDesktop ? (
            <ResizablePanelGroup
              orientation="horizontal"
              defaultLayout={defaultLayout}
              onLayoutChanged={onLayoutChanged}
            >
              {/* minSize 20: below ~200px the helper composer and rail controls
                  wrap into unusable slivers; collapsing stays available. */}
              <ResizablePanel id="helper" defaultSize={22} minSize={20} collapsible>
                <HelperPanel />
              </ResizablePanel>
              <ResizableHandle withHandle className="bg-zinc-800" />
              <ResizablePanel id="canvas" defaultSize={56} minSize={30}>
                <CanvasPanel />
              </ResizablePanel>
              <ResizableHandle withHandle className="bg-zinc-800" />
              <ResizablePanel id="settings-rail" defaultSize={22} minSize={20} collapsible>
                <SettingsRail />
              </ResizablePanel>
            </ResizablePanelGroup>
          ) : (
            <StudioMobileLayout />
          )}
          <StudioLightbox />
        </ThumbnailProvider>
        </HelperBridgeProvider>
        </LogoGenerationProvider>
        </EditChatProvider>
        </ImageGenerationProvider>
        <ConciergeChecklist />
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

      {showPhotoGenerator && (
        <MockupPhotoGenerator onClose={() => setShowPhotoGenerator(false)} />
      )}
    </div>
  )
}
