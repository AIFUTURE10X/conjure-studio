"use client"

import type React from "react"
import { useEffect, useRef } from "react"

export const ParticleWave: React.FC = () => {
  const canvasRef = useRef<HTMLCanvasElement>(null)

  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return

    const ctx = canvas.getContext("2d")
    if (!ctx) return

    // Set canvas size
    const resize = () => {
      canvas.width = window.innerWidth
      canvas.height = window.innerHeight
    }
    resize()
    window.addEventListener("resize", resize)

    // Particle wave configuration - Structured horizontal rows
    const particles: Array<{
      x: number
      y: number
      baseX: number
      baseY: number
      size: number
      opacity: number
      row: number
      col: number
    }> = []

    const cols = 120 // More columns for denser effect
    const rows = 40 // More rows
    const spacing = canvas.width / cols
    const rowHeight = canvas.height / rows

    // Create particles in structured grid (horizontal rows)
    for (let row = 0; row < rows; row++) {
      for (let col = 0; col < cols; col++) {
        const baseX = col * spacing
        const baseY = row * rowHeight

        // Create depth effect - particles further back are smaller and more transparent
        const depth = row / rows
        const size = (1 - depth * 0.7) * 2
        const opacity = (1 - depth * 0.6) * 0.8

        particles.push({
          x: baseX,
          y: baseY,
          baseX,
          baseY,
          size,
          opacity,
          row,
          col,
        })
      }
    }

    // Animation
    let frame = 0
    const animate = () => {
      ctx.fillStyle = "#000000"
      ctx.fillRect(0, 0, canvas.width, canvas.height)

      frame += 0.008

      particles.forEach((particle) => {
        // Create horizontal flowing wave effect
        const wave1 = Math.sin((particle.col / cols) * Math.PI * 3 + frame) * 40
        const wave2 = Math.sin((particle.col / cols) * Math.PI * 2 - frame * 1.2) * 20
        const wave3 = Math.sin((particle.row / rows) * Math.PI + frame * 0.5) * 15

        // Apply waves vertically to create flowing horizontal lines
        particle.y = particle.baseY + wave1 + wave2 + wave3

        // Slight horizontal movement
        particle.x = particle.baseX + Math.sin(frame + particle.row * 0.1) * 10

        // Draw particle with glow
        const gradient = ctx.createRadialGradient(particle.x, particle.y, 0, particle.x, particle.y, particle.size * 3)

        gradient.addColorStop(0, `rgba(255, 255, 255, ${particle.opacity})`)
        gradient.addColorStop(0.5, `rgba(255, 255, 255, ${particle.opacity * 0.5})`)
        gradient.addColorStop(1, "rgba(255, 255, 255, 0)")

        ctx.fillStyle = gradient
        ctx.beginPath()
        ctx.arc(particle.x, particle.y, particle.size, 0, Math.PI * 2)
        ctx.fill()

        // Draw connecting lines for horizontal flow effect
        if (particle.col < cols - 1) {
          const nextParticle = particles[particle.row * cols + particle.col + 1]
          if (nextParticle) {
            const distance = Math.abs(particle.y - nextParticle.y)
            if (distance < 50) {
              ctx.strokeStyle = `rgba(255, 255, 255, ${particle.opacity * 0.15})`
              ctx.lineWidth = 0.5
              ctx.beginPath()
              ctx.moveTo(particle.x, particle.y)
              ctx.lineTo(nextParticle.x, nextParticle.y)
              ctx.stroke()
            }
          }
        }
      })

      requestAnimationFrame(animate)
    }

    animate()

    return () => {
      window.removeEventListener("resize", resize)
    }
  }, [])

  return <canvas ref={canvasRef} className="fixed inset-0 pointer-events-none" style={{ zIndex: 0 }} />
}
