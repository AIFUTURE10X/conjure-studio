"use client"

/**
 * ThumbnailArrangePanel
 *
 * Align the selected layer (subject / headline / sticker) to the canvas, and a
 * reminder that arrow keys nudge it. Selection comes from the canvas; dragging
 * also snaps to center / thirds / edges with on-canvas guides.
 */

import { useThumbnail } from './ThumbnailProvider'
import { ToggleRow } from './ThumbnailControls'
import { HEADLINE_SELECTION_ID, SUBJECT_SELECTION_ID } from './thumbnail-constants'
import { railButton, railLabel } from './thumbnail-ui'

function selectionLabel(id: string | null): string {
  if (id === SUBJECT_SELECTION_ID) return 'Subject'
  if (id === HEADLINE_SELECTION_ID) return 'Headline'
  if (id) return 'Sticker'
  return ''
}

export function ThumbnailArrangePanel() {
  const { config, selectedStickerId, alignSelected, setSubjectOnTop } = useThumbnail()
  const label = selectionLabel(selectedStickerId)

  return (
    <div className="space-y-2">
      <h4 className={railLabel}>Arrange</h4>

      {config.subject && (
        <ToggleRow
          label="Subject above headline"
          active={!!config.subjectOnTop}
          onToggle={() => setSubjectOnTop(!config.subjectOnTop)}
        />
      )}
      {label ? (
        <>
          <p className="text-[10px] text-zinc-500">
            Aligning <span className="text-[#dbb56e]">{label}</span> · arrow keys nudge (Shift = bigger)
          </p>
          <div className="grid grid-cols-3 gap-1.5">
            <button className={railButton} onClick={() => alignSelected(10, null)}>Left</button>
            <button className={railButton} onClick={() => alignSelected(50, null)}>Center</button>
            <button className={railButton} onClick={() => alignSelected(90, null)}>Right</button>
            <button className={railButton} onClick={() => alignSelected(null, 12)}>Top</button>
            <button className={railButton} onClick={() => alignSelected(null, 50)}>Middle</button>
            <button className={railButton} onClick={() => alignSelected(null, 88)}>Bottom</button>
          </div>
        </>
      ) : (
        <p className="text-[10px] text-zinc-600">
          Click a layer on the canvas (subject, headline, or sticker) to align or nudge it.
        </p>
      )}
    </div>
  )
}
