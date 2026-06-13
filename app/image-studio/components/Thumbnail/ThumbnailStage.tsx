"use client"

/**
 * ThumbnailStage
 *
 * The fixed 1280×720 export surface, visually scaled to fit the canvas via a
 * transform on a wrapper (the captured node itself stays unscaled so exports
 * are exactly 1280×720). Composes the background fill/image plus the draggable
 * subject / headline / sticker layers.
 */

import { useEffect, useRef, useState } from 'react'
import { useThumbnail } from './ThumbnailProvider'
import { useStageDrag } from './useThumbnailDrag'
import { HeadlineLayer, StickerLayer, SubjectLayer } from './ThumbnailLayers'
import { THUMB_WIDTH, THUMB_HEIGHT, backgroundCss } from './thumbnail-constants'
import { backgroundImageFilter } from './thumbnail-fx'
import { thumbnailFontVars } from './thumbnail-fonts'

export function ThumbnailStage() {
  const { config, stageRef, setSelectedStickerId, selectedStickerId, nudgeSelected } = useThumbnail()
  const drag = useStageDrag(stageRef)
  const fitRef = useRef<HTMLDivElement | null>(null)
  const [scale, setScale] = useState(1)

  // Scale the fixed-size stage to the available width.
  useEffect(() => {
    const el = fitRef.current
    if (!el) return
    const observer = new ResizeObserver((entries) => {
      const width = entries[0]?.contentRect.width ?? el.clientWidth
      setScale(width / THUMB_WIDTH)
    })
    observer.observe(el)
    return () => observer.disconnect()
  }, [])

  // Arrow-key nudge for the selected layer (ignored while typing in a field).
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (!selectedStickerId) return
      const el = document.activeElement as HTMLElement | null
      if (el && (el.tagName === 'INPUT' || el.tagName === 'TEXTAREA' || el.isContentEditable)) return
      const step = e.shiftKey ? 2 : 0.5
      let dx = 0
      let dy = 0
      if (e.key === 'ArrowLeft') dx = -step
      else if (e.key === 'ArrowRight') dx = step
      else if (e.key === 'ArrowUp') dy = -step
      else if (e.key === 'ArrowDown') dy = step
      else return
      e.preventDefault()
      nudgeSelected(dx, dy)
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [selectedStickerId, nudgeSelected])

  const { background, subject, stickers } = config

  return (
    <div
      ref={fitRef}
      className="relative w-full overflow-hidden rounded-xl border border-zinc-800 bg-zinc-900 shadow-2xl"
      style={{ aspectRatio: `${THUMB_WIDTH} / ${THUMB_HEIGHT}` }}
    >
      <div className="absolute left-0 top-0 origin-top-left" style={{ transform: `scale(${scale})` }}>
        <div
          ref={stageRef}
          onPointerDown={() => setSelectedStickerId(null)}
          className={`relative overflow-hidden ${thumbnailFontVars}`}
          style={{ width: THUMB_WIDTH, height: THUMB_HEIGHT, background: backgroundCss(background) }}
        >
          {/* Background image layer */}
          {background.kind === 'image' && background.imageUrl && (
            <img
              src={background.imageUrl}
              alt=""
              className="absolute inset-0 h-full w-full object-cover"
              style={{ filter: backgroundImageFilter(background) }}
              draggable={false}
            />
          )}

          {/* Darken scrim (legibility behind text) */}
          {background.scrim ? (
            <div
              className="pointer-events-none absolute inset-0"
              style={{ backgroundColor: '#000', opacity: background.scrim / 100 }}
            />
          ) : null}

          {subject && <SubjectLayer subject={subject} drag={drag} />}

          <HeadlineLayer drag={drag} />

          {stickers.map((sticker) => (
            <StickerLayer key={sticker.id} sticker={sticker} drag={drag} />
          ))}

          {/* Safe-zone guide (excluded from export via data attribute) */}
          <div
            data-export-ignore
            className="pointer-events-none absolute inset-[4%] rounded-md border border-dashed border-white/20"
          />

          {/* Snap guides while dragging */}
          {drag.isDragging && drag.guides.x != null && (
            <div
              data-export-ignore
              className="pointer-events-none absolute inset-y-0 w-0.5 -translate-x-1/2 bg-[#c99850]/80"
              style={{ left: `${drag.guides.x}%` }}
            />
          )}
          {drag.isDragging && drag.guides.y != null && (
            <div
              data-export-ignore
              className="pointer-events-none absolute inset-x-0 h-0.5 -translate-y-1/2 bg-[#c99850]/80"
              style={{ top: `${drag.guides.y}%` }}
            />
          )}
        </div>
      </div>
    </div>
  )
}
