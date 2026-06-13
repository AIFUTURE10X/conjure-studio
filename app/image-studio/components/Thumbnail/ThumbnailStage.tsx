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

export function ThumbnailStage() {
  const { config, stageRef, setSelectedStickerId } = useThumbnail()
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
          className="relative overflow-hidden"
          style={{ width: THUMB_WIDTH, height: THUMB_HEIGHT, background: backgroundCss(background) }}
        >
          {/* Background image layer */}
          {background.kind === 'image' && background.imageUrl && (
            <img
              src={background.imageUrl}
              alt=""
              className="absolute inset-0 h-full w-full object-cover"
              draggable={false}
            />
          )}

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
        </div>
      </div>
    </div>
  )
}
