"use client"

import { useEffect, useRef } from "react"

interface AnimatedGridProps {
  hovering?: boolean
}

export function AnimatedGrid({ hovering }: AnimatedGridProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null)

  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return

    const ctx = canvas.getContext("2d")
    if (!ctx) return

    // Set canvas size
    const resizeCanvas = () => {
      canvas.width = window.innerWidth
      canvas.height = window.innerHeight
    }
    resizeCanvas()
    window.addEventListener("resize", resizeCanvas)

    // Grid configuration
    const gridSize = 40
    const lineWidth = 1
    const baseOpacity = 0.15
    const glowOpacity = 0.4

    // Animation state
    let animationFrame: number
    let time = 0

    // Create grid lines with animation data
    const verticalLines: Array<{ x: number; phase: number; speed: number }> = []
    const horizontalLines: Array<{ y: number; phase: number; speed: number }> = []

    for (let x = 0; x < canvas.width; x += gridSize) {
      verticalLines.push({
        x,
        phase: Math.random() * Math.PI * 2,
        speed: 0.5 + Math.random() * 0.5,
      })
    }

    for (let y = 0; y < canvas.height; y += gridSize) {
      horizontalLines.push({
        y,
        phase: Math.random() * Math.PI * 2,
        speed: 0.5 + Math.random() * 0.5,
      })
    }

    const animate = () => {
      ctx.fillStyle = "#000000"
      ctx.fillRect(0, 0, canvas.width, canvas.height)

      time += 0.01

      // Draw vertical lines
      verticalLines.forEach((line) => {
        const pulse = Math.sin(time * line.speed + line.phase)
        const opacity = baseOpacity + (pulse * 0.5 + 0.5) * (glowOpacity - baseOpacity)

        ctx.strokeStyle = `rgba(255, 255, 255, ${opacity})`
        ctx.lineWidth = lineWidth
        ctx.beginPath()
        ctx.moveTo(line.x, 0)
        ctx.lineTo(line.x, canvas.height)
        ctx.stroke()

        // Add glow effect on some lines
        if (pulse > 0.7) {
          ctx.strokeStyle = `rgba(255, 255, 255, ${opacity * 0.3})`
          ctx.lineWidth = lineWidth + 2
          ctx.beginPath()
          ctx.moveTo(line.x, 0)
          ctx.lineTo(line.x, canvas.height)
          ctx.stroke()
        }
      })

      // Draw horizontal lines
      horizontalLines.forEach((line) => {
        const pulse = Math.sin(time * line.speed + line.phase)
        const opacity = baseOpacity + (pulse * 0.5 + 0.5) * (glowOpacity - baseOpacity)

        ctx.strokeStyle = `rgba(255, 255, 255, ${opacity})`
        ctx.lineWidth = lineWidth
        ctx.beginPath()
        ctx.moveTo(0, line.y)
        ctx.lineTo(canvas.width, line.y)
        ctx.stroke()

        // Add glow effect on some lines
        if (pulse > 0.7) {
          ctx.strokeStyle = `rgba(255, 255, 255, ${opacity * 0.3})`
          ctx.lineWidth = lineWidth + 2
          ctx.beginPath()
          ctx.moveTo(0, line.y)
          ctx.lineTo(canvas.width, line.y)
          ctx.stroke()
        }
      })

      // Add intersection glow points
      if (hovering) {
        verticalLines.forEach((vLine) => {
          horizontalLines.forEach((hLine) => {
            const vPulse = Math.sin(time * vLine.speed + vLine.phase)
            const hPulse = Math.sin(time * hLine.speed + hLine.phase)

            if (vPulse > 0.8 && hPulse > 0.8) {
              const gradient = ctx.createRadialGradient(vLine.x, hLine.y, 0, vLine.x, hLine.y, 20)
              gradient.addColorStop(0, "rgba(255, 255, 255, 0.3)")
              gradient.addColorStop(1, "rgba(255, 255, 255, 0)")

              ctx.fillStyle = gradient
              ctx.fillRect(vLine.x - 20, hLine.y - 20, 40, 40)
            }
          })
        })
      }

      animationFrame = requestAnimationFrame(animate)
    }

    animate()

    return () => {
      window.removeEventListener("resize", resizeCanvas)
      cancelAnimationFrame(animationFrame)
    }
  }, [hovering])

  return <canvas ref={canvasRef} className="fixed inset-0 w-full h-full" />
}
