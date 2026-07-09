"use client"

/**
 * Draggable Logo Component
 * Handles logo positioning and display on the mockup
 */

import { forwardRef } from 'react'

interface LogoDraggableProps {
  logoUrl: string
  position: { x: number; y: number }
  scale: number
  isDragging: boolean
  isDarkShirt: boolean
  onDragStart: (e: React.MouseEvent | React.TouchEvent) => void
  logoFilter?: React.CSSProperties
}

export const LogoDraggable = forwardRef<HTMLDivElement, LogoDraggableProps>(
  ({ logoUrl, position, scale, isDragging, isDarkShirt, onDragStart, logoFilter }, ref) => {
    return (
      <div
        ref={ref}
        data-draggable="logo"
        className={`absolute cursor-move transition-transform ${isDragging ? 'opacity-90' : ''}`}
        style={{
          left: `${position.x}%`,
          top: `${position.y}%`,
          transform: 'translate(-50%, -50%)',
          // Width matches export calculation: (printAreaWidth% * scale)
          // Export uses: (mockupConfig.logoPrintArea.width / 100) * canvasWidth * scale
          // For preview: use same percentage (50% base * scale)
          width: `${50 * scale}%`,
          zIndex: 10,
        }}
        onMouseDown={onDragStart}
        onTouchStart={onDragStart}
      >
        <img
          src={logoUrl}
          alt="Logo"
          className="w-full h-auto object-contain pointer-events-none"
          style={{
            // Use screen blend on dark products, multiply on light products
            // This creates realistic logo integration with photo backgrounds
            mixBlendMode: isDarkShirt ? 'screen' : 'multiply',
            opacity: 0.95, // Slight transparency for better integration
            filter: logoFilter?.filter
              ? `contrast(1.05) ${isDarkShirt ? 'brightness(1.15) ' : ''}${logoFilter.filter}`
              : isDarkShirt ? 'contrast(1.05) brightness(1.15)' : 'contrast(1.05)',
          }}
          crossOrigin="anonymous"
        />
      </div>
    )
  }
)

LogoDraggable.displayName = 'LogoDraggable'
