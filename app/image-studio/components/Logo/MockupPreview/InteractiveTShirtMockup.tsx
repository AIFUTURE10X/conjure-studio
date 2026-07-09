"use client"

// Interactive T-Shirt Mockup - Drag logo, resize, color picker, export (PNG/SVG/PDF)
import { useState, useRef, useEffect, useCallback } from 'react'
import { Stage, Layer, Path, Image as KonvaImage, Transformer, Text, Group, Line } from 'react-konva'
import Konva from 'konva'
import { jsPDF } from 'jspdf'
import {
  TSHIRT_COLORS,
  DEFAULT_LOGO_POSITION,
  DEFAULT_LOGO_SIZE,
  PRINTABLE_AREA,
  LOGO_SIZE_LIMITS,
  STAGE_WIDTH,
  STAGE_HEIGHT,
  TSHIRT_PATH,
  LEFT_SLEEVE_PATH,
  RIGHT_SLEEVE_PATH,
  type TShirtColor
} from './tshirt-assets'
import { TShirtControls } from './TShirtControls'

interface InteractiveTShirtMockupProps {
  logoUrl: string
  brandName?: string
  onExport?: (format: 'png' | 'svg' | 'pdf', dataUrl: string) => void
}

export function InteractiveTShirtMockup({
  logoUrl,
  brandName = 'Brand',
  onExport
}: InteractiveTShirtMockupProps) {
  const stageRef = useRef<Konva.Stage>(null)
  const logoRef = useRef<Konva.Image>(null)
  const transformerRef = useRef<Konva.Transformer>(null)

  const [logoImage, setLogoImage] = useState<HTMLImageElement | null>(null)
  const [logoPosition, setLogoPosition] = useState(DEFAULT_LOGO_POSITION)
  const [logoSize, setLogoSize] = useState(DEFAULT_LOGO_SIZE)
  const [isSelected, setIsSelected] = useState(false)
  const [selectedColor, setSelectedColor] = useState<TShirtColor>(TSHIRT_COLORS[0])
  const [showColorPicker, setShowColorPicker] = useState(false)
  const [showExportMenu, setShowExportMenu] = useState(false)
  const [showBrandName, setShowBrandName] = useState(true)
  const [editableBrandName, setEditableBrandName] = useState(brandName)
  const [isEditingName, setIsEditingName] = useState(false)

  // Load logo image
  useEffect(() => {
    const img = new window.Image()
    img.crossOrigin = 'anonymous'
    img.src = logoUrl
    img.onload = () => {
      setLogoImage(img)
      // Calculate initial size maintaining aspect ratio
      const aspectRatio = img.width / img.height
      const newWidth = DEFAULT_LOGO_SIZE.width
      const newHeight = newWidth / aspectRatio
      setLogoSize({ width: newWidth, height: Math.min(newHeight, LOGO_SIZE_LIMITS.maxHeight) })
    }
  }, [logoUrl])

  // Attach transformer to logo when selected
  useEffect(() => {
    if (isSelected && logoRef.current && transformerRef.current) {
      transformerRef.current.nodes([logoRef.current])
      transformerRef.current.getLayer()?.batchDraw()
    }
  }, [isSelected])

  // Constrain logo position within printable area
  const constrainPosition = useCallback((pos: { x: number; y: number }) => {
    const halfWidth = logoSize.width / 2
    const halfHeight = logoSize.height / 2
    return {
      x: Math.max(PRINTABLE_AREA.minX + halfWidth, Math.min(pos.x, PRINTABLE_AREA.maxX - halfWidth)),
      y: Math.max(PRINTABLE_AREA.minY + halfHeight, Math.min(pos.y, PRINTABLE_AREA.maxY - halfHeight))
    }
  }, [logoSize])

  const handleDragEnd = (e: Konva.KonvaEventObject<DragEvent>) => {
    setLogoPosition({ x: e.target.x(), y: e.target.y() })
  }

  const handleTransformEnd = () => {
    if (!logoRef.current) return
    const node = logoRef.current
    const scaleX = node.scaleX()
    const scaleY = node.scaleY()

    // Reset scale and apply to width/height
    node.scaleX(1)
    node.scaleY(1)

    const newWidth = Math.max(LOGO_SIZE_LIMITS.minWidth, Math.min(node.width() * scaleX, LOGO_SIZE_LIMITS.maxWidth))
    const newHeight = Math.max(LOGO_SIZE_LIMITS.minHeight, Math.min(node.height() * scaleY, LOGO_SIZE_LIMITS.maxHeight))

    setLogoSize({ width: newWidth, height: newHeight })
    setLogoPosition({ x: node.x(), y: node.y() })
  }

  const handleStageClick = (e: Konva.KonvaEventObject<MouseEvent | TouchEvent>) => {
    if (e.target === stageRef.current || e.target.getClassName() === 'Path') {
      setIsSelected(false)
    }
  }

  const handleReset = () => {
    setLogoPosition(DEFAULT_LOGO_POSITION)
    if (logoImage) {
      const aspectRatio = logoImage.width / logoImage.height
      const newWidth = DEFAULT_LOGO_SIZE.width
      const newHeight = newWidth / aspectRatio
      setLogoSize({ width: newWidth, height: Math.min(newHeight, LOGO_SIZE_LIMITS.maxHeight) })
    } else {
      setLogoSize(DEFAULT_LOGO_SIZE)
    }
    setIsSelected(false)
  }

  const handleExport = async (format: 'png' | 'svg' | 'pdf') => {
    if (!stageRef.current) return
    setIsSelected(false) // Hide transformer for export
    setShowExportMenu(false)

    // Wait for transformer to hide
    await new Promise(resolve => setTimeout(resolve, 50))

    if (format === 'png') {
      const dataUrl = stageRef.current.toDataURL({ pixelRatio: 2 })
      downloadFile(dataUrl, `tshirt-mockup-${brandName}.png`)
      onExport?.('png', dataUrl)
    } else if (format === 'pdf') {
      const dataUrl = stageRef.current.toDataURL({ pixelRatio: 2 })
      const pdf = new jsPDF('portrait', 'px', [STAGE_WIDTH, STAGE_HEIGHT])
      pdf.addImage(dataUrl, 'PNG', 0, 0, STAGE_WIDTH, STAGE_HEIGHT)
      pdf.save(`tshirt-mockup-${brandName}.pdf`)
      onExport?.('pdf', dataUrl)
    } else if (format === 'svg') {
      // For SVG, we generate a basic SVG structure
      const svgContent = generateSVG()
      const blob = new Blob([svgContent], { type: 'image/svg+xml' })
      const url = URL.createObjectURL(blob)
      downloadFile(url, `tshirt-mockup-${brandName}.svg`)
      URL.revokeObjectURL(url)
      onExport?.('svg', svgContent)
    }
  }

  const downloadFile = (dataUrl: string, filename: string) => {
    const link = document.createElement('a')
    link.href = dataUrl
    link.download = filename
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
  }

  const generateSVG = () => {
    const brandTextSvg = showBrandName && editableBrandName
      ? `<text x="200" y="380" text-anchor="middle" fill="${selectedColor.textColor === 'light' ? '#a1a1aa' : '#52525b'}" font-size="10" letter-spacing="2">${editableBrandName.toUpperCase()}</text>`
      : ''
    return `<svg xmlns="http://www.w3.org/2000/svg" width="${STAGE_WIDTH}" height="${STAGE_HEIGHT}" viewBox="0 0 ${STAGE_WIDTH} ${STAGE_HEIGHT}">
  <defs>
    <filter id="shadow" x="-20%" y="-20%" width="140%" height="140%">
      <feDropShadow dx="0" dy="10" stdDeviation="15" flood-opacity="0.3"/>
    </filter>
  </defs>
  <rect width="100%" height="100%" fill="#18181b"/>
  <g filter="url(#shadow)">
    <path d="${TSHIRT_PATH}" fill="${selectedColor.hex}" stroke="#333" stroke-width="2"/>
    <path d="${LEFT_SLEEVE_PATH}" fill="${selectedColor.hex}" stroke="#333" stroke-width="2"/>
    <path d="${RIGHT_SLEEVE_PATH}" fill="${selectedColor.hex}" stroke="#333" stroke-width="2"/>
  </g>
  <image href="${logoUrl}" x="${logoPosition.x - logoSize.width / 2}" y="${logoPosition.y - logoSize.height / 2}" width="${logoSize.width}" height="${logoSize.height}"/>
  ${brandTextSvg}
</svg>`
  }

  const textColor = selectedColor.textColor === 'light' ? '#a1a1aa' : '#52525b'
  const strokeColor = selectedColor.textColor === 'light' ? '#333' : '#d4d4d8'

  return (
    <div className="relative">
      {/* Canvas Stage */}
      <div className="rounded-xl overflow-hidden bg-zinc-900 border border-zinc-700">
        <Stage
          ref={stageRef}
          width={STAGE_WIDTH}
          height={STAGE_HEIGHT}
          onClick={handleStageClick}
          onTap={handleStageClick}
        >
          <Layer>
            {/* Background */}
            <Path
              data={`M0 0 L${STAGE_WIDTH} 0 L${STAGE_WIDTH} ${STAGE_HEIGHT} L0 ${STAGE_HEIGHT} Z`}
              fill="#18181b"
            />

            {/* T-Shirt Shadow */}
            <Group shadowColor="black" shadowBlur={30} shadowOffsetY={10} shadowOpacity={0.3}>
              {/* T-Shirt Body */}
              <Path data={TSHIRT_PATH} fill={selectedColor.hex} stroke={strokeColor} strokeWidth={2} />
              {/* Left Sleeve */}
              <Path data={LEFT_SLEEVE_PATH} fill={selectedColor.hex} stroke={strokeColor} strokeWidth={2} />
              {/* Right Sleeve */}
              <Path data={RIGHT_SLEEVE_PATH} fill={selectedColor.hex} stroke={strokeColor} strokeWidth={2} />
            </Group>

            {/* Collar line */}
            <Line points={[140, 100, 170, 130, 200, 140, 230, 130, 260, 100]} stroke={strokeColor} strokeWidth={1} tension={0.5} />

            {/* Center fold line */}
            <Line points={[200, 160, 200, 380]} stroke={strokeColor} strokeWidth={1} opacity={0.3} />

            {/* Logo */}
            {logoImage && (
              <KonvaImage
                ref={logoRef}
                image={logoImage}
                x={logoPosition.x}
                y={logoPosition.y}
                width={logoSize.width}
                height={logoSize.height}
                offsetX={logoSize.width / 2}
                offsetY={logoSize.height / 2}
                draggable
                dragBoundFunc={constrainPosition}
                onDragEnd={handleDragEnd}
                onClick={() => setIsSelected(true)}
                onTap={() => setIsSelected(true)}
                onTransformEnd={handleTransformEnd}
              />
            )}

            {/* Transformer for resize */}
            {isSelected && (
              <Transformer
                ref={transformerRef}
                keepRatio={true}
                enabledAnchors={['top-left', 'top-right', 'bottom-left', 'bottom-right']}
                boundBoxFunc={(oldBox, newBox) => {
                  if (newBox.width < LOGO_SIZE_LIMITS.minWidth || newBox.height < LOGO_SIZE_LIMITS.minHeight) {
                    return oldBox
                  }
                  if (newBox.width > LOGO_SIZE_LIMITS.maxWidth || newBox.height > LOGO_SIZE_LIMITS.maxHeight) {
                    return oldBox
                  }
                  return newBox
                }}
              />
            )}

            {/* Brand Name (optional) */}
            {showBrandName && editableBrandName && (
              <Text
                text={editableBrandName.toUpperCase()}
                x={200}
                y={365}
                fontSize={10}
                fill={textColor}
                letterSpacing={2}
                align="center"
                offsetX={editableBrandName.length * 3}
              />
            )}
          </Layer>
        </Stage>
      </div>

      {/* Controls Bar */}
      <TShirtControls
        selectedColor={selectedColor}
        onColorChange={setSelectedColor}
        showColorPicker={showColorPicker}
        onToggleColorPicker={setShowColorPicker}
        showBrandName={showBrandName}
        onToggleBrandName={setShowBrandName}
        editableBrandName={editableBrandName}
        onBrandNameChange={setEditableBrandName}
        isEditingName={isEditingName}
        onEditingNameChange={setIsEditingName}
        onReset={handleReset}
        showExportMenu={showExportMenu}
        onToggleExportMenu={setShowExportMenu}
        onExport={handleExport}
      />

      {/* Instructions */}
      <p className="text-[10px] text-zinc-500 text-center mt-2">
        Click logo to select • Drag to move • Corner handles to resize
      </p>
    </div>
  )
}
