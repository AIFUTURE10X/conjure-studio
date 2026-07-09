/**
 * Hoodie Canvas Drawing
 *
 * Canvas export function for the hoodie mockup.
 * Extracted from HoodieShape.tsx to keep files under 300 lines.
 */

import type { MockupView } from '../generic/mockup-types'

/**
 * Draw hoodie shape to canvas (for export)
 *
 * ViewBox is '0 80 400 400' meaning:
 * - minX = 0, minY = 80
 * - width = 400, height = 400
 */
export function drawHoodieToCanvas(
  ctx: CanvasRenderingContext2D,
  color: { hex: string; textColor: 'light' | 'dark' },
  width: number,
  height: number,
  view: MockupView = 'front'
) {
  const isDark = color.textColor === 'light'
  const isBack = view === 'back'

  // ViewBox dimensions from HOODIE_VIEWBOX = '0 80 400 400'
  const viewBoxX = 0
  const viewBoxY = 80
  const viewBoxWidth = 400
  const viewBoxHeight = 400

  // Scale from viewBox dimensions to canvas size
  const scaleX = width / viewBoxWidth
  const scaleY = height / viewBoxHeight

  ctx.save()
  ctx.scale(scaleX, scaleY)
  // Translate to account for viewBox origin
  ctx.translate(-viewBoxX, -viewBoxY)

  // Hood ellipse
  ctx.beginPath()
  ctx.ellipse(200, 95, 85, 45, 0, 0, Math.PI * 2)
  ctx.fillStyle = color.hex
  ctx.fill()
  ctx.strokeStyle = isDark ? '#222' : '#ccc'
  ctx.lineWidth = 1.5
  ctx.stroke()

  // Main body
  ctx.beginPath()
  ctx.moveTo(60, 130)
  ctx.lineTo(20, 180)
  ctx.lineTo(50, 220)
  ctx.lineTo(50, 460)
  ctx.lineTo(350, 460)
  ctx.lineTo(350, 220)
  ctx.lineTo(380, 180)
  ctx.lineTo(340, 130)
  ctx.lineTo(280, 130)
  if (isBack) {
    // Back view: shallower neck curve
    ctx.bezierCurveTo(280, 145, 245, 155, 200, 155)
    ctx.bezierCurveTo(155, 155, 120, 145, 120, 130)
  } else {
    // Front view: deeper neckline
    ctx.bezierCurveTo(280, 160, 245, 185, 200, 185)
    ctx.bezierCurveTo(155, 185, 120, 160, 120, 130)
  }
  ctx.closePath()
  ctx.fillStyle = color.hex
  ctx.fill()
  ctx.strokeStyle = isDark ? '#333' : '#ddd'
  ctx.lineWidth = 1.5
  ctx.stroke()

  if (isBack) {
    // Back view: center seam (dashed)
    ctx.beginPath()
    ctx.moveTo(200, 155)
    ctx.lineTo(200, 460)
    ctx.strokeStyle = isDark ? 'rgba(0,0,0,0.15)' : 'rgba(0,0,0,0.1)'
    ctx.lineWidth = 1
    ctx.setLineDash([4, 4])
    ctx.stroke()
    ctx.setLineDash([])

    // Hood center seam
    ctx.beginPath()
    ctx.moveTo(200, 95)
    ctx.lineTo(200, 155)
    ctx.strokeStyle = isDark ? 'rgba(0,0,0,0.15)' : 'rgba(0,0,0,0.1)'
    ctx.lineWidth = 1
    ctx.setLineDash([3, 3])
    ctx.stroke()
    ctx.setLineDash([])

    // Back neckline
    ctx.beginPath()
    ctx.moveTo(120, 130)
    ctx.bezierCurveTo(120, 145, 155, 155, 200, 155)
    ctx.bezierCurveTo(245, 155, 280, 145, 280, 130)
    ctx.strokeStyle = isDark ? '#222' : '#bbb'
    ctx.lineWidth = 2
    ctx.stroke()
  } else {
    // Front view: center seam
    ctx.beginPath()
    ctx.moveTo(200, 185)
    ctx.lineTo(200, 460)
    ctx.strokeStyle = isDark ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.1)'
    ctx.lineWidth = 1
    ctx.stroke()

    // Front neckline
    ctx.beginPath()
    ctx.moveTo(120, 130)
    ctx.bezierCurveTo(120, 160, 155, 185, 200, 185)
    ctx.bezierCurveTo(245, 185, 280, 160, 280, 130)
    ctx.strokeStyle = isDark ? '#222' : '#bbb'
    ctx.lineWidth = 2
    ctx.stroke()

    // Pocket (front only)
    ctx.beginPath()
    ctx.moveTo(100, 340)
    ctx.quadraticCurveTo(100, 370, 130, 370)
    ctx.lineTo(270, 370)
    ctx.quadraticCurveTo(300, 370, 300, 340)
    ctx.lineTo(300, 320)
    ctx.quadraticCurveTo(300, 300, 270, 300)
    ctx.lineTo(130, 300)
    ctx.quadraticCurveTo(100, 300, 100, 320)
    ctx.closePath()
    ctx.strokeStyle = isDark ? 'rgba(0,0,0,0.25)' : 'rgba(0,0,0,0.15)'
    ctx.lineWidth = 1.5
    ctx.stroke()
  }

  ctx.restore()
}
