"use client"

import { useEffect, useMemo, useRef, useState } from 'react'
import { Stage, Layer, Image as KonvaImage, Line, Arrow, Rect, Ellipse, Text as KonvaText } from 'react-konva'
import Konva from 'konva'
import {
  ArrowUpRight,
  Circle as CircleIcon,
  Download,
  MousePointer2,
  Pencil,
  Save,
  Square as SquareIcon,
  Trash2,
  Type,
  Undo2,
  Redo2,
  X,
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Dialog, DialogContent, DialogTitle } from '@/components/ui/dialog'
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip'
import { cn } from '@/lib/utils'

type AnnotationTool = 'select' | 'pen' | 'arrow' | 'rectangle' | 'ellipse' | 'text'

interface BaseAnnotation {
  id: string
  color: string
  strokeWidth: number
}

interface PenAnnotation extends BaseAnnotation {
  kind: 'pen'
  points: number[]
}

interface ArrowAnnotation extends BaseAnnotation {
  kind: 'arrow'
  points: [number, number, number, number]
}

interface BoxAnnotation extends BaseAnnotation {
  kind: 'rectangle' | 'ellipse'
  x: number
  y: number
  width: number
  height: number
}

interface TextAnnotation extends BaseAnnotation {
  kind: 'text'
  x: number
  y: number
  text: string
  fontSize: number
}

type Annotation = PenAnnotation | ArrowAnnotation | BoxAnnotation | TextAnnotation

interface ImageAnnotationEditorProps {
  imageUrl: string
  imagePrompt?: string
  isOpen: boolean
  onOpenChange: (open: boolean) => void
  onSaveCopy?: (dataUrl: string, instruction?: string, maskDataUrl?: string) => void | Promise<void>
}

interface ImageSize {
  width: number
  height: number
}

interface Point {
  x: number
  y: number
}

const MAX_STAGE_WIDTH = 920
const MAX_STAGE_HEIGHT = 620
const MIN_STAGE_WIDTH = 280
const DEFAULT_TEXT = 'Note'
const DEFAULT_COLOR = '#38bdf8'
const COLOR_SWATCHES = ['#38bdf8', '#f97316', '#22c55e', '#f43f5e', '#facc15', '#ffffff']

const toolOptions: Array<{ tool: AnnotationTool; label: string; icon: typeof MousePointer2 }> = [
  { tool: 'select', label: 'Select', icon: MousePointer2 },
  { tool: 'pen', label: 'Pen', icon: Pencil },
  { tool: 'arrow', label: 'Arrow', icon: ArrowUpRight },
  { tool: 'rectangle', label: 'Rectangle', icon: SquareIcon },
  { tool: 'ellipse', label: 'Circle', icon: CircleIcon },
  { tool: 'text', label: 'Text', icon: Type },
]

const fitImageToStage = ({ width, height }: ImageSize): ImageSize => {
  const scale = Math.min(MAX_STAGE_WIDTH / width, MAX_STAGE_HEIGHT / height)
  const displayWidth = Math.max(MIN_STAGE_WIDTH, Math.round(width * scale))
  const displayHeight = Math.round(height * (displayWidth / width))

  if (displayHeight <= MAX_STAGE_HEIGHT) {
    return { width: displayWidth, height: displayHeight }
  }

  return {
    width: Math.round(width * (MAX_STAGE_HEIGHT / height)),
    height: MAX_STAGE_HEIGHT,
  }
}

const normalizeBox = (annotation: BoxAnnotation) => {
  const x = annotation.width < 0 ? annotation.x + annotation.width : annotation.x
  const y = annotation.height < 0 ? annotation.y + annotation.height : annotation.y
  return {
    x,
    y,
    width: Math.abs(annotation.width),
    height: Math.abs(annotation.height),
  }
}

const isTooSmall = (annotation: Annotation) => {
  if (annotation.kind === 'pen') return annotation.points.length < 4
  if (annotation.kind === 'arrow') {
    return Math.abs(annotation.points[2] - annotation.points[0]) < 4
      && Math.abs(annotation.points[3] - annotation.points[1]) < 4
  }
  if (annotation.kind === 'rectangle' || annotation.kind === 'ellipse') {
    return Math.abs(annotation.width) < 4 || Math.abs(annotation.height) < 4
  }
  if (annotation.kind === 'text') return annotation.text.trim().length === 0
  return false
}

const alphaFill = (color: string) => `${color}22`

const describePosition = ({ x, y }: Point, size: ImageSize) => {
  const horizontal = x < size.width / 3 ? 'left' : x > (size.width * 2) / 3 ? 'right' : 'center'
  const vertical = y < size.height / 3 ? 'top' : y > (size.height * 2) / 3 ? 'bottom' : 'middle'
  if (horizontal === 'center' && vertical === 'middle') return 'center'
  return `${vertical} ${horizontal}`
}

const buildAnnotationInstruction = (annotations: Annotation[], size: ImageSize) => {
  const notes = annotations
    .filter(annotation => !isTooSmall(annotation))
    .map(annotation => {
      if (annotation.kind === 'text') {
        return `Text "${annotation.text.trim()}" near ${describePosition({ x: annotation.x, y: annotation.y }, size)}`
      }
      if (annotation.kind === 'rectangle' || annotation.kind === 'ellipse') {
        const box = normalizeBox(annotation)
        const shape = annotation.kind === 'rectangle' ? 'Rectangle' : 'Circle'
        return `${shape} marking the ${describePosition({ x: box.x + box.width / 2, y: box.y + box.height / 2 }, size)} area`
      }
      if (annotation.kind === 'arrow') {
        return `Arrow from ${describePosition({ x: annotation.points[0], y: annotation.points[1] }, size)} toward ${describePosition({ x: annotation.points[2], y: annotation.points[3] }, size)}`
      }
      if (annotation.kind === 'pen') {
        return `Freehand mark near ${describePosition({ x: annotation.points[0], y: annotation.points[1] }, size)}`
      }
      return null
    })
    .filter((note): note is string => Boolean(note))

  return notes.length > 0 ? `Annotation details: ${notes.join('; ')}.` : undefined
}

const buildAnnotationMaskDataUrl = (annotations: Annotation[], imageSize: ImageSize, stageSize: ImageSize) => {
  const activeAnnotations = annotations.filter(annotation => !isTooSmall(annotation))
  if (activeAnnotations.length === 0) return undefined

  const canvas = document.createElement('canvas')
  canvas.width = imageSize.width
  canvas.height = imageSize.height
  const ctx = canvas.getContext('2d')
  if (!ctx) return undefined

  const scaleX = imageSize.width / stageSize.width
  const scaleY = imageSize.height / stageSize.height
  const scaleStroke = (value: number) => Math.max(16, value * Math.max(scaleX, scaleY))
  const pad = Math.max(24, 24 * Math.max(scaleX, scaleY))

  ctx.fillStyle = '#ffffff'
  ctx.fillRect(0, 0, canvas.width, canvas.height)
  ctx.globalCompositeOperation = 'destination-out'
  ctx.fillStyle = '#000000'
  ctx.strokeStyle = '#000000'
  ctx.lineCap = 'round'
  ctx.lineJoin = 'round'

  activeAnnotations.forEach(annotation => {
    if (annotation.kind === 'rectangle' || annotation.kind === 'ellipse') {
      const box = normalizeBox(annotation)
      const x = Math.max(0, box.x * scaleX - pad)
      const y = Math.max(0, box.y * scaleY - pad)
      const width = Math.min(canvas.width - x, box.width * scaleX + pad * 2)
      const height = Math.min(canvas.height - y, box.height * scaleY + pad * 2)
      if (annotation.kind === 'ellipse') {
        ctx.beginPath()
        ctx.ellipse(x + width / 2, y + height / 2, width / 2, height / 2, 0, 0, Math.PI * 2)
        ctx.fill()
      } else {
        ctx.fillRect(x, y, width, height)
      }
      return
    }

    if (annotation.kind === 'text') {
      const textWidth = Math.max(96, annotation.text.length * annotation.fontSize * 0.7) * scaleX
      const textHeight = annotation.fontSize * 1.5 * scaleY
      const x = Math.max(0, annotation.x * scaleX - pad)
      const y = Math.max(0, annotation.y * scaleY - pad)
      ctx.fillRect(x, y, Math.min(canvas.width - x, textWidth + pad * 2), Math.min(canvas.height - y, textHeight + pad * 2))
      return
    }

    if (annotation.kind !== 'arrow' && annotation.kind !== 'pen') return

    const points = annotation.points
    if (points.length < 4) return

    ctx.lineWidth = scaleStroke(annotation.strokeWidth + 18)
    ctx.beginPath()
    ctx.moveTo(points[0] * scaleX, points[1] * scaleY)
    for (let i = 2; i < points.length; i += 2) {
      ctx.lineTo(points[i] * scaleX, points[i + 1] * scaleY)
    }
    ctx.stroke()
  })

  return canvas.toDataURL('image/png')
}

export function ImageAnnotationEditor({
  imageUrl,
  imagePrompt,
  isOpen,
  onOpenChange,
  onSaveCopy,
}: ImageAnnotationEditorProps) {
  const stageRef = useRef<Konva.Stage>(null)
  const [imageElement, setImageElement] = useState<HTMLImageElement | null>(null)
  const [imageSize, setImageSize] = useState<ImageSize | null>(null)
  const [loadError, setLoadError] = useState<string | null>(null)
  const [exportError, setExportError] = useState<string | null>(null)
  const [status, setStatus] = useState<string | null>(null)
  const [isSavingCopy, setIsSavingCopy] = useState(false)
  const [tool, setTool] = useState<AnnotationTool>('pen')
  const [color, setColor] = useState(DEFAULT_COLOR)
  const [strokeWidth, setStrokeWidth] = useState(6)
  const [annotations, setAnnotations] = useState<Annotation[]>([])
  const [past, setPast] = useState<Annotation[][]>([])
  const [future, setFuture] = useState<Annotation[][]>([])
  const [draftId, setDraftId] = useState<string | null>(null)
  const [selectedId, setSelectedId] = useState<string | null>(null)

  useEffect(() => {
    if (!isOpen) return

    let active = true
    queueMicrotask(() => {
      if (!active) return
      setLoadError(null)
      setExportError(null)
      setStatus(null)
      setImageElement(null)
      setImageSize(null)
    })

    const image = new window.Image()
    image.crossOrigin = 'anonymous'
    image.onload = () => {
      if (!active) return
      setImageElement(image)
      setImageSize({ width: image.naturalWidth, height: image.naturalHeight })
    }
    image.onerror = () => {
      if (!active) return
      setImageElement(null)
      setImageSize(null)
      setLoadError('Image could not be loaded for annotation.')
    }
    image.src = imageUrl

    return () => {
      active = false
    }
  }, [imageUrl, isOpen])

  const stageSize = useMemo(() => {
    if (!imageSize) return { width: 640, height: 420 }
    return fitImageToStage(imageSize)
  }, [imageSize])

  const selectedText = annotations.find(
    (annotation): annotation is TextAnnotation => annotation.kind === 'text' && annotation.id === selectedId,
  )

  const recordHistory = () => {
    setPast(history => [...history, annotations])
    setFuture([])
  }

  const resetEditor = () => {
    setAnnotations([])
    setPast([])
    setFuture([])
    setDraftId(null)
    setSelectedId(null)
    setTool('pen')
  }

  const handleDialogOpenChange = (open: boolean) => {
    if (!open) resetEditor()
    onOpenChange(open)
  }

  const getPointer = (): Point | null => {
    const position = stageRef.current?.getPointerPosition()
    if (!position) return null

    return {
      x: Math.max(0, Math.min(stageSize.width, position.x)),
      y: Math.max(0, Math.min(stageSize.height, position.y)),
    }
  }

  const updateAnnotation = (id: string, updater: (annotation: Annotation) => Annotation) => {
    setAnnotations(current => current.map(annotation => (
      annotation.id === id ? updater(annotation) : annotation
    )))
  }

  const handlePointerStart = () => {
    const point = getPointer()
    if (!point) return

    if (tool === 'select') {
      setSelectedId(null)
      return
    }

    recordHistory()
    const id = `${tool}-${Date.now()}-${Math.round(point.x)}-${Math.round(point.y)}`
    const base = { id, color, strokeWidth }

    if (tool === 'text') {
      const textAnnotation: TextAnnotation = {
        ...base,
        kind: 'text',
        x: point.x,
        y: point.y,
        text: DEFAULT_TEXT,
        fontSize: 32,
      }
      setAnnotations(current => [...current, textAnnotation])
      setSelectedId(id)
      setTool('select')
      return
    }

    const nextAnnotation: Annotation = tool === 'pen'
      ? { ...base, kind: 'pen', points: [point.x, point.y] }
      : tool === 'arrow'
        ? { ...base, kind: 'arrow', points: [point.x, point.y, point.x, point.y] }
        : { ...base, kind: tool, x: point.x, y: point.y, width: 0, height: 0 }

    setAnnotations(current => [...current, nextAnnotation])
    setDraftId(id)
    setSelectedId(null)
  }

  const handlePointerMove = () => {
    if (!draftId) return
    const point = getPointer()
    if (!point) return

    updateAnnotation(draftId, annotation => {
      if (annotation.kind === 'pen') {
        return { ...annotation, points: [...annotation.points, point.x, point.y] }
      }
      if (annotation.kind === 'arrow') {
        return { ...annotation, points: [annotation.points[0], annotation.points[1], point.x, point.y] }
      }
      if (annotation.kind === 'rectangle' || annotation.kind === 'ellipse') {
        return { ...annotation, width: point.x - annotation.x, height: point.y - annotation.y }
      }
      return annotation
    })
  }

  const handlePointerEnd = () => {
    if (!draftId) return
    setAnnotations(current => current.filter(annotation => annotation.id !== draftId || !isTooSmall(annotation)))
    setDraftId(null)
  }

  const handleUndo = () => {
    setPast(history => {
      if (history.length === 0) return history
      const previous = history[history.length - 1]
      setFuture(items => [annotations, ...items])
      setAnnotations(previous)
      setSelectedId(null)
      return history.slice(0, -1)
    })
  }

  const handleRedo = () => {
    setFuture(items => {
      if (items.length === 0) return items
      const [next, ...remaining] = items
      setPast(history => [...history, annotations])
      setAnnotations(next)
      setSelectedId(null)
      return remaining
    })
  }

  const handleClear = () => {
    if (annotations.length === 0) return
    recordHistory()
    setAnnotations([])
    setSelectedId(null)
  }

  const handleDeleteSelected = () => {
    if (!selectedId) return
    recordHistory()
    setAnnotations(current => current.filter(annotation => annotation.id !== selectedId))
    setSelectedId(null)
  }

  const updateSelectedText = (updates: Partial<Pick<TextAnnotation, 'text' | 'fontSize' | 'color'>>) => {
    if (!selectedId) return
    recordHistory()
    setAnnotations(current => current.map(annotation => {
      if (annotation.id !== selectedId || annotation.kind !== 'text') return annotation
      return { ...annotation, ...updates }
    }))
  }

  const handleAnnotationClick = (id: string, event: Konva.KonvaEventObject<MouseEvent | TouchEvent>) => {
    event.cancelBubble = true
    setTool('select')
    setSelectedId(id)
  }

  const handleVectorDragEnd = (id: string, event: Konva.KonvaEventObject<DragEvent>) => {
    const deltaX = event.target.x()
    const deltaY = event.target.y()
    if (deltaX === 0 && deltaY === 0) return

    recordHistory()
    setAnnotations(current => current.map(annotation => {
      if (annotation.id !== id) return annotation
      if (annotation.kind === 'pen') {
        return {
          ...annotation,
          points: annotation.points.map((value, index) => value + (index % 2 === 0 ? deltaX : deltaY)),
        }
      }
      if (annotation.kind === 'arrow') {
        return {
          ...annotation,
          points: [
            annotation.points[0] + deltaX,
            annotation.points[1] + deltaY,
            annotation.points[2] + deltaX,
            annotation.points[3] + deltaY,
          ],
        }
      }
      return annotation
    }))
    event.target.position({ x: 0, y: 0 })
  }

  const handleBoxDragEnd = (id: string, event: Konva.KonvaEventObject<DragEvent>) => {
    recordHistory()
    setAnnotations(current => current.map(annotation => {
      if (annotation.id !== id || (annotation.kind !== 'rectangle' && annotation.kind !== 'ellipse')) {
        return annotation
      }
      const box = normalizeBox(annotation)
      if (annotation.kind === 'rectangle') {
        return { ...annotation, x: event.target.x(), y: event.target.y(), width: box.width, height: box.height }
      }
      return {
        ...annotation,
        x: event.target.x() - box.width / 2,
        y: event.target.y() - box.height / 2,
        width: box.width,
        height: box.height,
      }
    }))
  }

  const handleTextDragEnd = (id: string, event: Konva.KonvaEventObject<DragEvent>) => {
    recordHistory()
    updateAnnotation(id, annotation => {
      if (annotation.kind !== 'text') return annotation
      return { ...annotation, x: event.target.x(), y: event.target.y() }
    })
  }

  const createAnnotatedDataUrl = () => {
    setExportError(null)
    try {
      return stageRef.current?.toDataURL({ mimeType: 'image/png', pixelRatio: 2 }) ?? null
    } catch (error) {
      console.error('[v0] Annotation export failed:', error)
      setExportError('The annotated image could not be exported.')
      return null
    }
  }

  const downloadAnnotatedImage = () => {
    const dataUrl = createAnnotatedDataUrl()
    if (!dataUrl) return

    const link = document.createElement('a')
    const promptSlug = imagePrompt?.substring(0, 36).replace(/[^a-z0-9]/gi, '-').toLowerCase()
    link.href = dataUrl
    link.download = `${promptSlug || 'conjure-image'}-annotated-${Date.now()}.png`
    link.click()
    setStatus('Downloaded')
  }

  const handleSaveCopy = async () => {
    const dataUrl = createAnnotatedDataUrl()
    if (!dataUrl || !onSaveCopy) return
    setIsSavingCopy(true)
    try {
      await onSaveCopy(
        dataUrl,
        buildAnnotationInstruction(annotations, stageSize),
        imageSize ? buildAnnotationMaskDataUrl(annotations, imageSize, stageSize) : undefined,
      )
      setStatus('Saved copy')
    } catch (error) {
      console.error('[v0] Annotation save failed:', error)
      setExportError('The annotated image could not be saved.')
    } finally {
      setIsSavingCopy(false)
    }
  }

  const renderAnnotation = (annotation: Annotation) => {
    const selected = selectedId === annotation.id
    const draggable = tool === 'select'
    const commonProps = {
      name: 'annotation',
      stroke: annotation.color,
      strokeWidth: annotation.strokeWidth,
      shadowColor: selected ? '#ffffff' : undefined,
      shadowBlur: selected ? 8 : 0,
      draggable,
      onClick: (event: Konva.KonvaEventObject<MouseEvent>) => handleAnnotationClick(annotation.id, event),
      onTap: (event: Konva.KonvaEventObject<TouchEvent>) => handleAnnotationClick(annotation.id, event),
    }

    if (annotation.kind === 'pen') {
      return (
        <Line
          key={annotation.id}
          {...commonProps}
          points={annotation.points}
          lineCap="round"
          lineJoin="round"
          tension={0.35}
          onDragEnd={(event) => handleVectorDragEnd(annotation.id, event)}
        />
      )
    }

    if (annotation.kind === 'arrow') {
      return (
        <Arrow
          key={annotation.id}
          {...commonProps}
          points={annotation.points}
          fill={annotation.color}
          pointerLength={16}
          pointerWidth={16}
          lineCap="round"
          onDragEnd={(event) => handleVectorDragEnd(annotation.id, event)}
        />
      )
    }

    if (annotation.kind === 'rectangle') {
      const box = normalizeBox(annotation)
      return (
        <Rect
          key={annotation.id}
          {...commonProps}
          x={box.x}
          y={box.y}
          width={box.width}
          height={box.height}
          fill={alphaFill(annotation.color)}
          cornerRadius={6}
          onDragEnd={(event) => handleBoxDragEnd(annotation.id, event)}
        />
      )
    }

    if (annotation.kind === 'ellipse') {
      const box = normalizeBox(annotation)
      return (
        <Ellipse
          key={annotation.id}
          {...commonProps}
          x={box.x + box.width / 2}
          y={box.y + box.height / 2}
          radiusX={box.width / 2}
          radiusY={box.height / 2}
          fill={alphaFill(annotation.color)}
          onDragEnd={(event) => handleBoxDragEnd(annotation.id, event)}
        />
      )
    }

    if (annotation.kind === 'text') {
      return (
        <KonvaText
          key={annotation.id}
          name="annotation"
          text={annotation.text}
          x={annotation.x}
          y={annotation.y}
          fill={annotation.color}
          fontSize={annotation.fontSize}
          fontStyle="bold"
          draggable={draggable}
          shadowColor="black"
          shadowBlur={6}
          shadowOpacity={0.45}
          onClick={(event) => handleAnnotationClick(annotation.id, event)}
          onTap={(event) => handleAnnotationClick(annotation.id, event)}
          onDragEnd={(event) => handleTextDragEnd(annotation.id, event)}
        />
      )
    }

    return null
  }

  return (
    <Dialog open={isOpen} onOpenChange={handleDialogOpenChange}>
      <DialogContent
        showCloseButton={false}
        className="max-w-[min(96vw,1180px)] max-h-[92vh] overflow-hidden border-zinc-800 bg-zinc-950 p-0 text-white"
      >
        <DialogTitle className="sr-only">Annotate image</DialogTitle>

        <div className="flex min-h-0 max-h-[92vh] flex-col">
          <div className="flex flex-wrap items-center justify-between gap-3 border-b border-zinc-800 px-4 py-3">
            <div className="flex items-center gap-2">
              <Pencil className="h-4 w-4 text-[#dbb56e]" />
              <span className="text-sm font-semibold">Annotate</span>
              {status && <span className="rounded bg-zinc-800 px-2 py-1 text-xs text-zinc-300">{status}</span>}
            </div>

            <div className="flex flex-wrap items-center gap-2">
              <div className="flex items-center rounded-md border border-zinc-800 bg-zinc-900 p-1">
                {toolOptions.map(({ tool: option, label, icon: Icon }) => (
                  <Tooltip key={option}>
                    <TooltipTrigger asChild>
                      <button
                        type="button"
                        aria-label={label}
                        onClick={() => setTool(option)}
                        className={cn(
                          'flex h-8 w-8 items-center justify-center rounded text-zinc-400 transition-colors hover:bg-zinc-800 hover:text-white',
                          tool === option && 'bg-[#c99850] text-black hover:bg-[#dbb56e] hover:text-black',
                        )}
                      >
                        <Icon className="h-4 w-4" />
                      </button>
                    </TooltipTrigger>
                    <TooltipContent>{label}</TooltipContent>
                  </Tooltip>
                ))}
              </div>

              <div className="flex items-center gap-1 rounded-md border border-zinc-800 bg-zinc-900 px-2 py-1">
                {COLOR_SWATCHES.map(swatch => (
                  <button
                    key={swatch}
                    type="button"
                    aria-label={`Use ${swatch}`}
                    onClick={() => setColor(swatch)}
                    className={cn(
                      'h-6 w-6 rounded-full border border-white/20',
                      color === swatch && 'ring-2 ring-[#dbb56e] ring-offset-2 ring-offset-zinc-900',
                    )}
                    style={{ backgroundColor: swatch }}
                  />
                ))}
                <input
                  aria-label="Annotation color"
                  type="color"
                  value={color}
                  onChange={(event) => setColor(event.target.value)}
                  className="h-7 w-8 cursor-pointer rounded border-0 bg-transparent p-0"
                />
              </div>

              <div className="flex items-center gap-2 rounded-md border border-zinc-800 bg-zinc-900 px-3 py-1.5">
                <input
                  aria-label="Stroke size"
                  type="range"
                  min="2"
                  max="18"
                  value={strokeWidth}
                  onChange={(event) => setStrokeWidth(Number(event.target.value))}
                  className="h-2 w-24 cursor-pointer accent-[#c99850]"
                />
                <span className="w-9 text-right text-xs text-zinc-400">{strokeWidth}px</span>
              </div>

              <div className="flex items-center rounded-md border border-zinc-800 bg-zinc-900 p-1">
                <Tooltip>
                  <TooltipTrigger asChild>
                    <button
                      type="button"
                      aria-label="Undo"
                      onClick={handleUndo}
                      disabled={past.length === 0}
                      className="flex h-8 w-8 items-center justify-center rounded text-zinc-400 transition-colors hover:bg-zinc-800 hover:text-white disabled:opacity-35"
                    >
                      <Undo2 className="h-4 w-4" />
                    </button>
                  </TooltipTrigger>
                  <TooltipContent>Undo</TooltipContent>
                </Tooltip>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <button
                      type="button"
                      aria-label="Redo"
                      onClick={handleRedo}
                      disabled={future.length === 0}
                      className="flex h-8 w-8 items-center justify-center rounded text-zinc-400 transition-colors hover:bg-zinc-800 hover:text-white disabled:opacity-35"
                    >
                      <Redo2 className="h-4 w-4" />
                    </button>
                  </TooltipTrigger>
                  <TooltipContent>Redo</TooltipContent>
                </Tooltip>
              </div>

              <Button
                type="button"
                variant="ghost"
                size="icon-sm"
                onClick={() => handleDialogOpenChange(false)}
                className="text-zinc-400 hover:bg-zinc-800 hover:text-white"
                aria-label="Close annotator"
              >
                <X className="h-4 w-4" />
              </Button>
            </div>
          </div>

          <div className="flex min-h-0 flex-1 flex-col gap-3 overflow-auto bg-zinc-950 p-4 lg:flex-row">
            <div className="flex min-h-[360px] flex-1 items-center justify-center overflow-auto rounded-lg border border-zinc-800 bg-zinc-900/70 p-4">
              {loadError && (
                <div className="rounded-md border border-red-500/30 bg-red-500/10 px-4 py-3 text-sm text-red-200">
                  {loadError}
                </div>
              )}
              {!loadError && !imageElement && (
                <div className="h-8 w-8 rounded-full border-2 border-[#c99850] border-t-transparent animate-spin" />
              )}
              {imageElement && (
                <div className="overflow-hidden rounded-md shadow-2xl shadow-black/40">
                  <Stage
                    ref={stageRef}
                    width={stageSize.width}
                    height={stageSize.height}
                    className={tool === 'select' ? 'cursor-default' : 'cursor-crosshair'}
                    onMouseDown={() => handlePointerStart()}
                    onMouseMove={() => handlePointerMove()}
                    onMouseUp={() => handlePointerEnd()}
                    onTouchStart={() => handlePointerStart()}
                    onTouchMove={() => handlePointerMove()}
                    onTouchEnd={() => handlePointerEnd()}
                  >
                    <Layer>
                      <Rect width={stageSize.width} height={stageSize.height} fill="#111111" />
                      <KonvaImage image={imageElement} width={stageSize.width} height={stageSize.height} />
                      {annotations.map(renderAnnotation)}
                    </Layer>
                  </Stage>
                </div>
              )}
            </div>

            <div className="w-full space-y-3 lg:w-64">
              <div className="rounded-lg border border-zinc-800 bg-zinc-900 p-3">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-semibold uppercase tracking-[0.16em] text-zinc-500">Layers</span>
                  <span className="text-xs text-zinc-500">{annotations.length}</span>
                </div>
                <div className="mt-3 flex gap-2">
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={handleDeleteSelected}
                    disabled={!selectedId}
                    className="flex-1 border-zinc-700 bg-zinc-900 text-zinc-300 hover:bg-zinc-800"
                  >
                    <Trash2 className="h-3.5 w-3.5" />
                    Delete
                  </Button>
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={handleClear}
                    disabled={annotations.length === 0}
                    className="flex-1 border-zinc-700 bg-zinc-900 text-zinc-300 hover:bg-zinc-800"
                  >
                    Clear
                  </Button>
                </div>
              </div>

              {selectedText && (
                <div className="rounded-lg border border-zinc-800 bg-zinc-900 p-3">
                  <label className="text-xs font-semibold uppercase tracking-[0.16em] text-zinc-500" htmlFor="annotation-text">
                    Text
                  </label>
                  <input
                    id="annotation-text"
                    value={selectedText.text}
                    onChange={(event) => updateSelectedText({ text: event.target.value })}
                    className="mt-2 h-9 w-full rounded-md border border-zinc-700 bg-zinc-950 px-3 text-sm text-white outline-none focus:border-[#c99850]"
                  />
                  <div className="mt-3 flex items-center gap-2">
                    <input
                      aria-label="Text size"
                      type="range"
                      min="16"
                      max="96"
                      value={selectedText.fontSize}
                      onChange={(event) => updateSelectedText({ fontSize: Number(event.target.value) })}
                      className="h-2 flex-1 cursor-pointer accent-[#c99850]"
                    />
                    <span className="w-10 text-right text-xs text-zinc-400">{selectedText.fontSize}px</span>
                  </div>
                </div>
              )}

              {exportError && (
                <div className="rounded-md border border-red-500/30 bg-red-500/10 px-3 py-2 text-xs text-red-200">
                  {exportError}
                </div>
              )}

              <div className="grid gap-2">
                {onSaveCopy && (
                  <Button
                    type="button"
                    onClick={handleSaveCopy}
                    disabled={isSavingCopy}
                    className="bg-zinc-100 text-zinc-950 hover:bg-white"
                  >
                    <Save className="h-4 w-4" />
                    {isSavingCopy ? 'Saving...' : 'Save Copy'}
                  </Button>
                )}
                <Button
                  type="button"
                  onClick={downloadAnnotatedImage}
                  className="bg-[#c99850] text-black hover:bg-[#dbb56e]"
                >
                  <Download className="h-4 w-4" />
                  Download PNG
                </Button>
              </div>
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}
