"use client"

/**
 * ThumbnailCanvas
 *
 * Center workspace for Thumbnail mode: the 1280×720 stage plus framing copy.
 * Controls live in the settings rail (ThumbnailSettingsRail).
 */

import { ThumbnailStage } from './ThumbnailStage'

export function ThumbnailCanvas() {
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
