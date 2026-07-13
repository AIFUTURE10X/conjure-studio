"use client"

/**
 * ThumbnailManualPanel
 *
 * The contextual settings rail. It shows controls for whatever is selected on
 * the canvas: a Scene/Design overview when nothing is selected, or a focused
 * editor for the selected text block / subject / sticker. Export lives in the
 * settings-rail shell so it remains reachable from both AI and Manual.
 */

import { useThumbnail } from './ThumbnailProvider'
import { ThumbnailSceneView } from './ThumbnailSceneView'
import { ThumbnailTextSection } from './ThumbnailTextSection'
import { ThumbnailSubjectView } from './ThumbnailSubjectView'
import { ThumbnailStickerControls } from './ThumbnailStickerControls'
import { SUBJECT_SELECTION_ID, type ThumbnailConfig } from './thumbnail-constants'

type SelectionKind = 'scene' | 'text' | 'subject' | 'sticker'

function selectionKind(id: string | null, config: ThumbnailConfig): SelectionKind {
  if (!id) return 'scene'
  if (id === SUBJECT_SELECTION_ID) return 'subject'
  if (config.headlines.some((h) => h.id === id)) return 'text'
  if (config.stickers.some((s) => s.id === id)) return 'sticker'
  return 'scene'
}

export function ThumbnailManualPanel() {
  const { config, selectedStickerId } = useThumbnail()
  const kind = selectionKind(selectedStickerId, config)

  return (
    <div className="space-y-5">
      {kind === 'text' ? (
        <ThumbnailTextSection />
      ) : kind === 'subject' ? (
        <ThumbnailSubjectView />
      ) : kind === 'sticker' ? (
        <ThumbnailStickerControls />
      ) : (
        <ThumbnailSceneView />
      )}
    </div>
  )
}
