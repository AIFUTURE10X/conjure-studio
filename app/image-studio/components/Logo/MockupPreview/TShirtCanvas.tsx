"use client"

/**
 * T-Shirt Canvas Component
 * SVG rendering of the t-shirt shape with fabric effects
 */

import { type TShirtColor } from './tshirt-assets'

interface TShirtCanvasProps {
  color: TShirtColor
}

export function TShirtCanvas({ color }: TShirtCanvasProps) {
  const isDark = color.textColor === 'light'

  return (
    <div className="absolute inset-0 flex items-start justify-center">
      <svg
        viewBox="0 100 400 360"
        className="w-full h-full drop-shadow-2xl"
        style={{ filter: 'drop-shadow(0 20px 40px rgba(0,0,0,0.4))' }}
        preserveAspectRatio="xMidYMin meet"
      >
        {/* Fabric texture gradient */}
        <defs>
          <linearGradient id="fabricSheen" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="rgba(255,255,255,0.1)" />
            <stop offset="50%" stopColor="rgba(255,255,255,0)" />
            <stop offset="100%" stopColor="rgba(0,0,0,0.1)" />
          </linearGradient>
          <linearGradient id="fabricFold" x1="50%" y1="0%" x2="50%" y2="100%">
            <stop offset="0%" stopColor="rgba(255,255,255,0.05)" />
            <stop offset="30%" stopColor="rgba(0,0,0,0.05)" />
            <stop offset="70%" stopColor="rgba(255,255,255,0.03)" />
            <stop offset="100%" stopColor="rgba(0,0,0,0.1)" />
          </linearGradient>
          <filter id="fabricNoise" x="0%" y="0%" width="100%" height="100%">
            <feTurbulence type="fractalNoise" baseFrequency="0.9" numOctaves="4" result="noise"/>
            <feDisplacementMap in="SourceGraphic" in2="noise" scale="2" xChannelSelector="R" yChannelSelector="G"/>
          </filter>
        </defs>

        {/* T-shirt body */}
        <path
          d="M70 120
             L30 160 L60 190 L60 440
             L340 440 L340 190 L370 160 L330 120
             L270 120
             C270 145 240 175 200 175
             C160 175 130 145 130 120
             Z"
          fill={color.hex}
          stroke={isDark ? '#333' : '#ddd'}
          strokeWidth="1.5"
        />

        {/* Fabric sheen overlay */}
        <path
          d="M70 120
             L30 160 L60 190 L60 440
             L340 440 L340 190 L370 160 L330 120
             L270 120
             C270 145 240 175 200 175
             C160 175 130 145 130 120
             Z"
          fill="url(#fabricSheen)"
        />

        {/* Vertical fold line */}
        <path
          d="M200 175 L200 440"
          stroke={isDark ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.1)'}
          strokeWidth="1"
        />

        {/* Collar detail */}
        <path
          d="M130 120 C130 145 160 175 200 175 C240 175 270 145 270 120"
          fill="none"
          stroke={isDark ? '#222' : '#ccc'}
          strokeWidth="2"
        />

        {/* Inner collar shadow */}
        <path
          d="M140 125 C140 145 165 170 200 170 C235 170 260 145 260 125"
          fill="none"
          stroke={isDark ? 'rgba(0,0,0,0.3)' : 'rgba(0,0,0,0.2)'}
          strokeWidth="1"
        />

        {/* Sleeve seam lines */}
        <path
          d="M60 190 L70 120"
          stroke={isDark ? 'rgba(0,0,0,0.2)' : 'rgba(0,0,0,0.15)'}
          strokeWidth="1"
        />
        <path
          d="M340 190 L330 120"
          stroke={isDark ? 'rgba(0,0,0,0.2)' : 'rgba(0,0,0,0.15)'}
          strokeWidth="1"
        />
      </svg>
    </div>
  )
}
