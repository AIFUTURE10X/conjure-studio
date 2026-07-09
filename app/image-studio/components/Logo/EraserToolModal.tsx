"use client"

import { useRef, useEffect, useState } from 'react'
import { Button } from '@/components/ui/button'
import { Eraser, ZoomIn, ZoomOut, RotateCcw } from 'lucide-react'
import { GeneratedLogo } from '../../hooks/useLogoGeneration'
import { transparencyGridStyle } from '../../constants/logo-constants'

interface EraserToolModalProps {
  generatedLogo: GeneratedLogo
  onClose: () => void
  onUpdateLogo: (logo: GeneratedLogo) => void
}

export function EraserToolModal({ generatedLogo, onClose, onUpdateLogo }: EraserToolModalProps) {
  const [eraserSize, setEraserSize] = useState(20)
  const [eraserZoom, setEraserZoom] = useState(1)
  const [isErasing, setIsErasing] = useState(false)
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const logoImageRef = useRef<HTMLImageElement | null>(null)

  // Initialize canvas
  useEffect(() => {
    if (!generatedLogo || !canvasRef.current) return

    const canvas = canvasRef.current
    const ctx = canvas.getContext('2d')
    if (!ctx) return

    const img = new Image()
    img.crossOrigin = 'anonymous'
    img.onload = () => {
      canvas.width = img.width
      canvas.height = img.height
      ctx.drawImage(img, 0, 0)
      logoImageRef.current = img
    }
    img.src = generatedLogo.url
  }, [generatedLogo?.url])

  const eraseAtPoint = (canvasX: number, canvasY: number) => {
    if (!canvasRef.current) return

    const canvas = canvasRef.current
    const ctx = canvas.getContext('2d')
    if (!ctx) return

    ctx.globalCompositeOperation = 'destination-out'
    ctx.beginPath()
    ctx.arc(canvasX, canvasY, eraserSize, 0, Math.PI * 2)
    ctx.fill()
    ctx.globalCompositeOperation = 'source-over'
  }

  const handleCanvasMouseDown = (e: React.MouseEvent<HTMLCanvasElement>) => {
    setIsErasing(true)

    const canvas = canvasRef.current
    if (!canvas) return

    const rect = canvas.getBoundingClientRect()
    const scaleX = canvas.width / rect.width
    const scaleY = canvas.height / rect.height
    const canvasX = (e.clientX - rect.left) * scaleX
    const canvasY = (e.clientY - rect.top) * scaleY

    eraseAtPoint(canvasX, canvasY)
  }

  const handleCanvasMouseMove = (e: React.MouseEvent<HTMLCanvasElement>) => {
    if (!isErasing) return

    const canvas = canvasRef.current
    if (!canvas) return

    const rect = canvas.getBoundingClientRect()
    const scaleX = canvas.width / rect.width
    const scaleY = canvas.height / rect.height
    const canvasX = (e.clientX - rect.left) * scaleX
    const canvasY = (e.clientY - rect.top) * scaleY

    eraseAtPoint(canvasX, canvasY)
  }

  const handleCanvasMouseUp = () => {
    if (isErasing && canvasRef.current && generatedLogo) {
      const dataUrl = canvasRef.current.toDataURL('image/png')
      onUpdateLogo({
        ...generatedLogo,
        url: dataUrl
      })
    }
    setIsErasing(false)
  }

  const handleCanvasMouseLeave = () => {
    if (isErasing) {
      handleCanvasMouseUp()
    }
  }

  const handleClose = () => {
    setEraserZoom(1)
    onClose()
  }

  const getCursorStyle = () => {
    const scaledSize = Math.round(eraserSize * eraserZoom)
    const clampedSize = Math.min(128, Math.max(8, scaledSize))
    return `url('data:image/svg+xml,<svg xmlns="http://www.w3.org/2000/svg" width="${clampedSize * 2}" height="${clampedSize * 2}" viewBox="0 0 ${clampedSize * 2} ${clampedSize * 2}"><circle cx="${clampedSize}" cy="${clampedSize}" r="${clampedSize - 1}" fill="none" stroke="white" stroke-width="2"/><circle cx="${clampedSize}" cy="${clampedSize}" r="${clampedSize - 1}" fill="none" stroke="black" stroke-width="1" stroke-dasharray="3,3"/></svg>') ${clampedSize} ${clampedSize}, crosshair`
  }

  return (
    <div className="fixed inset-0 z-50 flex flex-col bg-black/95 backdrop-blur-sm">
      {/* Header toolbar */}
      <div className="flex items-center justify-between px-6 py-4 bg-zinc-900 border-b border-zinc-800">
        <div className="flex items-center gap-3">
          <Eraser className="w-5 h-5 text-[#dbb56e]" />
          <span className="text-sm font-medium text-white">Spot Clean Tool</span>
          <span className="text-xs text-zinc-500">Click and drag to erase unwanted marks</span>
        </div>
        <div className="flex items-center gap-4">
          {/* Zoom controls */}
          <div className="flex items-center gap-1 border-r border-zinc-700 pr-4">
            <Button
              onClick={() => setEraserZoom(Math.max(0.5, eraserZoom - 0.25))}
              size="sm"
              variant="ghost"
              className="h-8 w-8 p-0 text-zinc-400 hover:text-white hover:bg-zinc-800"
              disabled={eraserZoom <= 0.5}
            >
              <ZoomOut className="w-4 h-4" />
            </Button>
            <span className="text-xs text-zinc-400 w-12 text-center">{Math.round(eraserZoom * 100)}%</span>
            <Button
              onClick={() => setEraserZoom(Math.min(4, eraserZoom + 0.25))}
              size="sm"
              variant="ghost"
              className="h-8 w-8 p-0 text-zinc-400 hover:text-white hover:bg-zinc-800"
              disabled={eraserZoom >= 4}
            >
              <ZoomIn className="w-4 h-4" />
            </Button>
            <Button
              onClick={() => setEraserZoom(1)}
              size="sm"
              variant="ghost"
              className="h-8 w-8 p-0 text-zinc-400 hover:text-white hover:bg-zinc-800"
              title="Reset zoom"
            >
              <RotateCcw className="w-3 h-3" />
            </Button>
          </div>
          {/* Brush size */}
          <div className="flex items-center gap-2">
            <label className="text-xs text-zinc-400">Brush:</label>
            <input
              type="range"
              min="5"
              max="100"
              value={eraserSize}
              onChange={(e) => setEraserSize(parseInt(e.target.value))}
              className="w-24 h-2 bg-zinc-700 rounded-lg appearance-none cursor-pointer accent-[#c99850]"
            />
            <span className="text-xs text-zinc-400 w-8 text-right">{eraserSize}px</span>
          </div>
          <Button
            onClick={handleClose}
            size="sm"
            className="h-8 px-4 bg-[#c99850] hover:bg-[#b8874a] text-black text-sm font-medium"
          >
            Done
          </Button>
        </div>
      </div>

      {/* Canvas area */}
      <div
        className="flex-1 flex items-center justify-center p-8 overflow-auto"
        style={transparencyGridStyle}
      >
        <canvas
          ref={canvasRef}
          className="shadow-2xl"
          style={{
            transform: `scale(${eraserZoom})`,
            transformOrigin: 'center center',
            cursor: getCursorStyle()
          }}
          onMouseDown={handleCanvasMouseDown}
          onMouseMove={handleCanvasMouseMove}
          onMouseUp={handleCanvasMouseUp}
          onMouseLeave={handleCanvasMouseLeave}
        />
      </div>

      {/* Footer hint */}
      <div className="px-6 py-3 bg-zinc-900 border-t border-zinc-800 text-center">
        <p className="text-xs text-zinc-500">
          Use zoom controls to see details. Scroll to pan when zoomed in. Changes save automatically.
        </p>
      </div>
    </div>
  )
}
