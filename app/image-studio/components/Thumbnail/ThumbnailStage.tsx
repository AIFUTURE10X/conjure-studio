"use client"

/**
 * ThumbnailStage
 *
 * The fixed 1280×720 export surface, visually scaled to fit the canvas via a
 * transform on a wrapper (the captured node itself stays unscaled so exports
 * are exactly 1280×720). Background / subject / headline render as layers;
 * subject and headline are draggable.
 */

import { useEffect, useRef, useState, type CSSProperties } from 'react'
import { useThumbnail } from './ThumbnailProvider'
import { useStageDrag } from './useThumbnailDrag'
import {
  THUMB_WIDTH,
  THUMB_HEIGHT,
  backgroundCss,
  type ThumbnailHeadline,
} from './thumbnail-constants'

function headlineStyle(headline: ThumbnailHeadline): CSSProperties {
  const fontPx = (headline.size / 100) * THUMB_HEIGHT
  const stroke = Math.max(3, fontPx * 0.07)
  const base: CSSProperties = {
    fontSize: fontPx,
    fontWeight: 900,
    lineHeight: 1.02,
    color: headline.color,
    textTransform: headline.uppercase ? 'uppercase' : 'none',
    letterSpacing: '-0.01em',
    fontFamily: "'Geist', system-ui, sans-serif",
  }
  if (headline.preset === 'pop') {
    return { ...base, WebkitTextStroke: `${stroke}px #000`, textShadow: `${fontPx * 0.05}px ${fontPx * 0.05}px 0 #000` }
  }
  if (headline.preset === 'outline') {
    return { ...base, WebkitTextStroke: `${stroke * 1.3}px #000` }
  }
  if (headline.preset === 'shadow') {
    return { ...base, textShadow: `0 ${fontPx * 0.04}px ${fontPx * 0.08}px rgba(0,0,0,0.75)` }
  }
  // block
  return {
    ...base,
    color: headline.color,
    backgroundColor: '#000',
    padding: `${fontPx * 0.08}px ${fontPx * 0.18}px`,
    borderRadius: fontPx * 0.08,
    boxDecorationBreak: 'clone',
    WebkitBoxDecorationBreak: 'clone',
  }
}

export function ThumbnailStage() {
  const { config, stageRef, setHeadline, patchSubject } = useThumbnail()
  const { startDrag, isDragging } = useStageDrag(stageRef)
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

  const { background, subject, headline } = config

  return (
    <div
      ref={fitRef}
      className="relative w-full overflow-hidden rounded-xl border border-zinc-800 bg-zinc-900 shadow-2xl"
      style={{ aspectRatio: `${THUMB_WIDTH} / ${THUMB_HEIGHT}` }}
    >
      <div className="absolute left-0 top-0 origin-top-left" style={{ transform: `scale(${scale})` }}>
        <div
          ref={stageRef}
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

          {/* Subject layer (draggable) */}
          {subject && (
            <img
              src={subject.url}
              alt="Thumbnail subject"
              draggable={false}
              onPointerDown={(e) => startDrag(e, { x: subject.x, y: subject.y }, (x, y) => patchSubject({ x, y }))}
              className={`absolute select-none ${isDragging ? 'cursor-grabbing' : 'cursor-grab'}`}
              style={{
                left: `${subject.x}%`,
                top: `${subject.y}%`,
                width: `${subject.scale}%`,
                transform: `translate(-50%, -50%) scaleX(${subject.flip ? -1 : 1})`,
                filter: 'drop-shadow(0 12px 24px rgba(0,0,0,0.45))',
              }}
            />
          )}

          {/* Headline layer (draggable) */}
          {headline.text && (
            <div
              onPointerDown={(e) => startDrag(e, { x: headline.x, y: headline.y }, (x, y) => setHeadline({ x, y }))}
              className={`absolute max-w-[60%] select-none text-center ${isDragging ? 'cursor-grabbing' : 'cursor-grab'}`}
              style={{
                left: `${headline.x}%`,
                top: `${headline.y}%`,
                transform: `translate(-50%, -50%) rotate(${headline.rotation}deg)`,
                ...headlineStyle(headline),
              }}
            >
              {headline.text}
            </div>
          )}

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
