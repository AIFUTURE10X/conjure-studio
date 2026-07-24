"use client"

/**
 * ThumbnailCanvas
 *
 * Center workspace for Thumbnail mode: the 1280×720 stage plus framing copy.
 * Controls live in the settings rail (ThumbnailSettingsRail).
 */

import { useCallback, useEffect } from 'react'
import { useStudioReset } from '../../context/useStudio'
import { useThumbnail } from './ThumbnailProvider'
import { ThumbnailStage } from './ThumbnailStage'

export function ThumbnailCanvas() {
  const { reset } = useThumbnail()
  const { registerReset } = useStudioReset()

  // Always-mounted half of the Thumbnail reset: reset() returns the canvas
  // (background, subject, headlines, stickers, template) to blank. The center
  // canvas is never collapsed, so this guarantees the visible thumbnail clears
  // even when the settings rail (which registers the AI-input clear) is closed.
  const handleResetCanvas = useCallback(() => reset(), [reset])
  useEffect(() => registerReset('thumbnail', handleResetCanvas), [registerReset, handleResetCanvas])

  return (
    <div className="flex-1 overflow-y-auto p-4 lg:p-6">
      <div className="mx-auto max-w-4xl space-y-4">
        <div>
          <h2 className="text-lg font-bold text-white">YouTube Thumbnail</h2>
          <p className="text-xs text-zinc-500">
            1280×720 · drag the headline and subject to position them, then export from the rail
          </p>
        </div>

        <ThumbnailStage />

        <p className="text-center text-[11px] text-zinc-600">
          Use <span className="text-[#dbb56e]">AI Generate</span> in the rail to create a background, add your
          photo + headline, then export.
        </p>
      </div>
    </div>
  )
}
