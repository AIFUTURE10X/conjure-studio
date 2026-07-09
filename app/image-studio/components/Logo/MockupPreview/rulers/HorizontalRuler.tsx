"use client"

/**
 * Horizontal Ruler Component
 *
 * SVG ruler displayed along top edge showing percentage positions (0-100%).
 * Features tick marks at 10% intervals with numbers at 20% intervals.
 */

interface HorizontalRulerProps {
  /** Width of the ruler in pixels */
  width: number
  /** Height of the ruler (default: 16px) */
  height?: number
  /** Current position marker (percentage 0-100, shown when dragging) */
  markerPosition?: number | null
  /** Whether to show the position marker */
  showMarker?: boolean
}

export function HorizontalRuler({
  width,
  height = 16,
  markerPosition = null,
  showMarker = false,
}: HorizontalRulerProps) {
  // Generate tick marks at 10% intervals
  const ticks = []
  for (let i = 0; i <= 100; i += 10) {
    const x = (i / 100) * width
    const isLabelTick = i % 20 === 0
    const tickHeight = isLabelTick ? 8 : 5

    ticks.push(
      <g key={i}>
        <line
          x1={x}
          y1={height}
          x2={x}
          y2={height - tickHeight}
          stroke="#a1a1aa"
          strokeWidth={1}
        />
        {isLabelTick && (
          <text
            x={x}
            y={height - 10}
            textAnchor="middle"
            fill="#d4d4d8"
            fontSize={8}
            fontFamily="system-ui, sans-serif"
            fontWeight={500}
          >
            {i}
          </text>
        )}
      </g>
    )
  }

  // Add smaller ticks at 5% intervals
  for (let i = 5; i <= 95; i += 10) {
    const x = (i / 100) * width
    ticks.push(
      <line
        key={`small-${i}`}
        x1={x}
        y1={height}
        x2={x}
        y2={height - 3}
        stroke="#71717a"
        strokeWidth={0.5}
      />
    )
  }

  return (
    <svg
      width={width}
      height={height}
      className="flex-shrink-0"
      style={{ backgroundColor: '#27272a' }}
    >
      {/* Background bar at bottom */}
      <line
        x1={0}
        y1={height - 0.5}
        x2={width}
        y2={height - 0.5}
        stroke="#3f3f46"
        strokeWidth={1}
      />

      {/* Tick marks and labels */}
      {ticks}

      {/* Position marker (when dragging) */}
      {showMarker && markerPosition !== null && (
        <>
          <line
            x1={(markerPosition / 100) * width}
            y1={0}
            x2={(markerPosition / 100) * width}
            y2={height}
            stroke="#a855f7"
            strokeWidth={1}
          />
          <rect
            x={(markerPosition / 100) * width - 14}
            y={1}
            width={28}
            height={12}
            fill="#a855f7"
            rx={2}
          />
          <text
            x={(markerPosition / 100) * width}
            y={10}
            textAnchor="middle"
            fill="#ffffff"
            fontSize={8}
            fontFamily="system-ui, sans-serif"
            fontWeight={500}
          >
            {markerPosition.toFixed(0)}%
          </text>
        </>
      )}
    </svg>
  )
}
