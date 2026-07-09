"use client"

// Text Overlay Editor - Add text elements to logos with drag, resize, and style controls

import { useState, useRef, useEffect, useCallback } from 'react'
import { Stage, Layer, Image as KonvaImage, Text, Transformer } from 'react-konva'
import Konva from 'konva'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import { Type, Download, X, Plus } from 'lucide-react'
import { loadGoogleFont } from '@/lib/font-loader'
import { TextControlPanel } from './TextControlPanel'

const GOLD_GRADIENT = "linear-gradient(135deg, #c99850 0%, #dbb56e 25%, #f4d698 50%, #dbb56e 75%, #c99850 100%)"
const CANVAS_SIZE = 400

interface TextElement {
  id: string
  text: string
  x: number
  y: number
  fontSize: number
  fontFamily: string
  fill: string
  fontStyle: 'normal' | 'bold'
  align: 'left' | 'center' | 'right'
}

interface TextOverlayEditorProps {
  logoUrl: string
  onClose: () => void
  onExport: (dataUrl: string) => void
}

export function TextOverlayEditor({ logoUrl, onClose, onExport }: TextOverlayEditorProps) {
  const [textElements, setTextElements] = useState<TextElement[]>([])
  const [selectedId, setSelectedId] = useState<string | null>(null)
  const [logoImage, setLogoImage] = useState<HTMLImageElement | null>(null)
  const [fontsLoaded, setFontsLoaded] = useState(false)

  const stageRef = useRef<Konva.Stage>(null)
  const transformerRef = useRef<Konva.Transformer>(null)

  // Load logo image
  useEffect(() => {
    const img = new window.Image()
    img.crossOrigin = 'anonymous'
    img.src = logoUrl
    img.onload = () => setLogoImage(img)
  }, [logoUrl])

  // Preload common fonts
  useEffect(() => {
    const preloadFonts = async () => {
      await Promise.all([
        loadGoogleFont('Montserrat'),
        loadGoogleFont('Bebas Neue'),
        loadGoogleFont('Playfair Display'),
        loadGoogleFont('Poppins'),
      ])
      setFontsLoaded(true)
    }
    preloadFonts()
  }, [])

  // Update transformer when selection changes
  useEffect(() => {
    if (selectedId && transformerRef.current && stageRef.current) {
      const selectedNode = stageRef.current.findOne(`#${selectedId}`)
      if (selectedNode) {
        transformerRef.current.nodes([selectedNode])
        transformerRef.current.getLayer()?.batchDraw()
      }
    }
  }, [selectedId])

  const addTextElement = useCallback(() => {
    const newElement: TextElement = {
      id: `text-${Date.now()}`,
      text: 'Your Text',
      x: CANVAS_SIZE / 2 - 50,
      y: CANVAS_SIZE - 80,
      fontSize: 32,
      fontFamily: 'Montserrat',
      fill: '#ffffff',
      fontStyle: 'bold',
      align: 'center'
    }
    setTextElements(prev => [...prev, newElement])
    setSelectedId(newElement.id)
  }, [])

  const updateTextElement = useCallback((id: string, updates: Partial<TextElement>) => {
    setTextElements(prev => prev.map(el => el.id === id ? { ...el, ...updates } : el))
  }, [])

  const deleteTextElement = useCallback((id: string) => {
    setTextElements(prev => prev.filter(el => el.id !== id))
    if (selectedId === id) setSelectedId(null)
  }, [selectedId])

  const handleExport = useCallback(() => {
    if (stageRef.current) {
      setSelectedId(null)
      setTimeout(() => {
        const dataUrl = stageRef.current?.toDataURL({ pixelRatio: 2 })
        if (dataUrl) onExport(dataUrl)
      }, 50)
    }
  }, [onExport])

  const handleStageClick = (e: Konva.KonvaEventObject<MouseEvent>) => {
    if (e.target === e.target.getStage()) setSelectedId(null)
  }

  const selectedElement = textElements.find(el => el.id === selectedId)

  return (
    <Card className="bg-zinc-900/95 border border-zinc-800 p-4 w-full max-w-lg">
      <div className="space-y-3">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Type className="w-4 h-4 text-[#dbb56e]" />
            <h3 className="text-sm font-semibold text-white">Add Text to Logo</h3>
          </div>
          <Button variant="ghost" size="sm" onClick={onClose} className="h-7 w-7 p-0 text-zinc-400 hover:text-white">
            <X className="w-4 h-4" />
          </Button>
        </div>

        {/* Canvas Area */}
        <div
          className="rounded-lg overflow-hidden border border-zinc-700 mx-auto"
          style={{
            width: CANVAS_SIZE,
            height: CANVAS_SIZE,
            backgroundImage: `
              linear-gradient(45deg, #404040 25%, transparent 25%),
              linear-gradient(-45deg, #404040 25%, transparent 25%),
              linear-gradient(45deg, transparent 75%, #404040 75%),
              linear-gradient(-45deg, transparent 75%, #404040 75%)
            `,
            backgroundSize: '20px 20px',
            backgroundPosition: '0 0, 0 10px, 10px -10px, -10px 0px',
            backgroundColor: '#2a2a2a'
          }}
        >
          <Stage ref={stageRef} width={CANVAS_SIZE} height={CANVAS_SIZE} onClick={handleStageClick}>
            <Layer>
              {logoImage && (
                <KonvaImage
                  image={logoImage}
                  x={(CANVAS_SIZE - Math.min(logoImage.width, CANVAS_SIZE * 0.8)) / 2}
                  y={(CANVAS_SIZE - Math.min(logoImage.height, CANVAS_SIZE * 0.8)) / 2 - 20}
                  width={Math.min(logoImage.width, CANVAS_SIZE * 0.8)}
                  height={Math.min(logoImage.height, CANVAS_SIZE * 0.8)}
                />
              )}

              {textElements.map((el) => (
                <Text
                  key={el.id}
                  id={el.id}
                  text={el.text}
                  x={el.x}
                  y={el.y}
                  fontSize={el.fontSize}
                  fontFamily={el.fontFamily}
                  fill={el.fill}
                  fontStyle={el.fontStyle}
                  align={el.align}
                  draggable
                  onClick={() => setSelectedId(el.id)}
                  onTap={() => setSelectedId(el.id)}
                  onDragEnd={(e) => updateTextElement(el.id, { x: e.target.x(), y: e.target.y() })}
                  onTransformEnd={(e) => {
                    const node = e.target
                    const scaleX = node.scaleX()
                    updateTextElement(el.id, { x: node.x(), y: node.y(), fontSize: Math.round(el.fontSize * scaleX) })
                    node.scaleX(1)
                    node.scaleY(1)
                  }}
                />
              ))}

              <Transformer
                ref={transformerRef}
                enabledAnchors={['top-left', 'top-right', 'bottom-left', 'bottom-right']}
                boundBoxFunc={(oldBox, newBox) => (newBox.width < 20 || newBox.height < 20 ? oldBox : newBox)}
              />
            </Layer>
          </Stage>
        </div>

        {/* Add Text Button */}
        <Button onClick={addTextElement} variant="outline" className="w-full h-8 text-xs border-zinc-700 bg-zinc-800/50 hover:bg-zinc-700">
          <Plus className="w-3 h-3 mr-1" />
          Add Text Element
        </Button>

        {/* Text Controls */}
        {selectedElement && selectedId && (
          <TextControlPanel
            selectedElement={selectedElement}
            selectedId={selectedId}
            onUpdate={updateTextElement}
            onDelete={deleteTextElement}
          />
        )}

        {/* Export Button */}
        <Button onClick={handleExport} className="w-full h-9 text-sm font-semibold text-black" style={{ background: GOLD_GRADIENT }}>
          <Download className="w-4 h-4 mr-1.5" />
          Export Logo with Text
        </Button>

        <p className="text-[10px] text-zinc-500 text-center">
          Click on text to edit. Drag to position. Corners to resize.
        </p>
      </div>
    </Card>
  )
}
