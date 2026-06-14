"use client"

/**
 * ThumbnailLayers
 *
 * The draggable stage layers — subject (with an on-canvas resize handle),
 * headline, and stickers (emoji / vector shapes / image watermark). Selection
 * is driven by the provider's single selectedStickerId (the subject uses a
 * sentinel id), so only one layer shows handles at a time.
 */

import { type CSSProperties } from 'react'
import { useThumbnail } from './ThumbnailProvider'
import { useStageDrag } from './useThumbnailDrag'
import { StickerShape, headlineStyle, textBlockContent } from './thumbnail-stage-utils'
import {
  SUBJECT_SELECTION_ID,
  THUMB_HEIGHT,
  type ThumbnailSticker,
  type ThumbnailSubject,
  type ThumbnailTextBlock,
} from './thumbnail-constants'
import { subjectImageFilter } from './thumbnail-fx'

type StageDrag = ReturnType<typeof useStageDrag>

const HANDLE =
  'absolute h-5 w-5 rounded-full border-2 border-[#c99850] bg-zinc-900 shadow-lg'

const blendOf = (value: string | undefined): CSSProperties['mixBlendMode'] =>
  value && value !== 'normal' ? (value as CSSProperties['mixBlendMode']) : undefined

function SubjectMedia({ subject }: { subject: ThumbnailSubject }) {
  const frame = subject.frame ?? 'none'
  const base: CSSProperties = {
    transform: `scaleX(${subject.flip ? -1 : 1})`,
    filter: subjectImageFilter(subject),
    mixBlendMode: blendOf(subject.blend),
  }
  if (frame === 'circle') {
    return (
      <div className="w-full" style={{ ...base, aspectRatio: '1 / 1', borderRadius: '50%', overflow: 'hidden' }}>
        <img src={subject.url} alt="Thumbnail subject" draggable={false} className="h-full w-full object-cover" />
      </div>
    )
  }
  if (frame === 'rounded') {
    return (
      <div className="w-full" style={{ ...base, borderRadius: '5%', overflow: 'hidden' }}>
        <img src={subject.url} alt="Thumbnail subject" draggable={false} className="block w-full" />
      </div>
    )
  }
  return <img src={subject.url} alt="Thumbnail subject" draggable={false} className="block w-full" style={base} />
}

export function SubjectLayer({ subject, drag }: { subject: ThumbnailSubject; drag: StageDrag }) {
  const { selectedStickerId, setSelectedStickerId, patchSubject } = useThumbnail()
  const selected = selectedStickerId === SUBJECT_SELECTION_ID
  return (
    <div
      onPointerDown={(e) => {
        setSelectedStickerId(SUBJECT_SELECTION_ID)
        drag.startDrag(e, { x: subject.x, y: subject.y }, (x, y) => patchSubject({ x, y }))
      }}
      className={`absolute select-none ${drag.isDragging ? 'cursor-grabbing' : 'cursor-grab'}`}
      style={{ left: `${subject.x}%`, top: `${subject.y}%`, width: `${subject.scale}%`, transform: 'translate(-50%, -50%)' }}
    >
      <SubjectMedia subject={subject} />
      {selected && (
        <>
          <div
            data-export-ignore
            className="pointer-events-none absolute -inset-1 rounded-md border-2 border-dashed border-[#c99850]"
          />
          <div
            data-export-ignore
            title="Drag to resize"
            onPointerDown={(e) =>
              drag.startResize(e, { x: subject.x, y: subject.y }, (scale) => patchSubject({ scale }))
            }
            className={`${HANDLE} -bottom-2.5 -right-2.5 cursor-nwse-resize`}
          />
        </>
      )}
    </div>
  )
}

export function TextBlockLayer({ block, drag }: { block: ThumbnailTextBlock; drag: StageDrag }) {
  const { config, patchTextBlock, removeTextBlock, selectedStickerId, setSelectedStickerId } = useThumbnail()
  if (!block.text) return null
  const selected = selectedStickerId === block.id
  const canDelete = config.headlines.length > 1
  // noWrap or an explicit line count manages wrapping itself, so drop the cap.
  const fixedLayout = block.noWrap || (block.lines ?? 0) >= 2
  return (
    <div
      data-testid="thumbnail-headline"
      onPointerDown={(e) => {
        setSelectedStickerId(block.id)
        drag.startDrag(e, { x: block.x, y: block.y }, (x, y) => patchTextBlock(block.id, { x, y }))
      }}
      className={`absolute select-none text-center ${drag.isDragging ? 'cursor-grabbing' : 'cursor-grab'}`}
      style={{
        left: `${block.x}%`,
        top: `${block.y}%`,
        maxWidth: fixedLayout ? 'none' : `${block.width ?? 60}%`,
        transform: `translate(-50%, -50%) rotate(${block.rotation}deg)`,
        ...headlineStyle(block),
      }}
    >
      {textBlockContent(block)}
      {selected && (
        <>
          <div
            data-export-ignore
            className="pointer-events-none absolute -inset-2 rounded-md border-2 border-dashed border-[#c99850]"
          />
          {canDelete && (
            <button
              data-export-ignore
              onPointerDown={(e) => e.stopPropagation()}
              onClick={() => removeTextBlock(block.id)}
              className="absolute -right-4 -top-4 flex h-7 w-7 items-center justify-center rounded-full bg-red-500 text-sm font-bold text-white shadow-lg hover:bg-red-600"
              title="Delete text"
            >
              ×
            </button>
          )}
        </>
      )}
    </div>
  )
}

export function StickerLayer({ sticker, drag }: { sticker: ThumbnailSticker; drag: StageDrag }) {
  const { selectedStickerId, setSelectedStickerId, patchSticker, removeSticker } = useThumbnail()
  const px = (sticker.size / 100) * THUMB_HEIGHT
  const selected = sticker.id === selectedStickerId
  const blend = blendOf(sticker.blend)
  return (
    <div
      onPointerDown={(e) => {
        setSelectedStickerId(sticker.id)
        drag.startDrag(e, { x: sticker.x, y: sticker.y }, (x, y) => patchSticker(sticker.id, { x, y }))
      }}
      className={`absolute select-none ${drag.isDragging ? 'cursor-grabbing' : 'cursor-grab'}`}
      style={{
        left: `${sticker.x}%`,
        top: `${sticker.y}%`,
        transform: `translate(-50%, -50%) rotate(${sticker.rotation}deg)`,
        lineHeight: 1,
      }}
    >
      {sticker.type === 'emoji' ? (
        <span style={{ fontSize: px, lineHeight: 1, mixBlendMode: blend }}>{sticker.content}</span>
      ) : sticker.type === 'image' ? (
        <img
          src={sticker.content}
          alt="Logo"
          draggable={false}
          style={{ width: px, height: 'auto', filter: 'drop-shadow(0 4px 8px rgba(0,0,0,0.4))', mixBlendMode: blend }}
        />
      ) : (
        <div style={{ width: px, height: px, mixBlendMode: blend }}>
          <StickerShape sticker={sticker} />
        </div>
      )}

      {selected && (
        <>
          <div
            data-export-ignore
            className="pointer-events-none absolute -inset-2 rounded-md border-2 border-dashed border-[#c99850]"
          />
          <button
            data-export-ignore
            onPointerDown={(e) => e.stopPropagation()}
            onClick={() => removeSticker(sticker.id)}
            className="absolute -right-4 -top-4 flex h-7 w-7 items-center justify-center rounded-full bg-red-500 text-sm font-bold text-white shadow-lg hover:bg-red-600"
            title="Delete sticker"
          >
            ×
          </button>
        </>
      )}
    </div>
  )
}
