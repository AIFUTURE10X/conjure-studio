"use client"

/**
 * Vertical Ruler Component
 *
 * SVG ruler displayed along left edge showing percentage positions (0-100%).
 * Features tick marks at 10% intervals with numbers at 20% intervals.
 */

interface VerticalRulerProps {
  /** Height of the ruler in pixels */
  height: number
  /** Width of the ruler (default: 16px) */
  width?: number
  /** Current position marker (percentage 0-100, shown when dragging) */
  markerPosition?: number | null
  /** Whether to show the position marker */
  showMarker?: boolean
}

export function VerticalRuler({
  height,
  width = 16,
  markerPosition = null,
  showMarker = false,
}: VerticalRulerProps) {
  // Generate tick marks at 10% intervals
  const ticks = []
  for (let i = 0; i <= 100; i += 10) {
    const y = (i / 100) * height
    const isLabelTick = i % 20 === 0
    const tickWidth = isLabelTick ? 8 : 5

    ticks.push(
      <g key={i}>
        <line
          x1={width}
          y1={y}
          x2={width - tickWidth}
          y2={y}
          stroke="#a1a1aa"
          strokeWidth={1}
        />
        {isLabelTick && (
          <text
            x={width - 10}
            y={y + 2}
            textAnchor="middle"
            fill="#d4d4d8"
            fontSize={8}
            fontFamily="system-ui, sans-serif"
            fontWeight={500}
            transform={`rotate(-90, ${width - 10}, ${y + 2})`}
          >
            {i}
          </text>
        )}
      </g>
    )
  }

  // Add smaller ticks at 5% intervals
  for (let i = 5; i <= 95; i += 10) {
    const y = (i / 100) * height
    ticks.push(
      <line
        key={`small-${i}`}
        x1={width}
        y1={y}
        x2={width - 3}
        y2={y}
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
      {/* Background bar at right */}
      <line
        x1={width - 0.5}
        y1={0}
        x2={width - 0.5}
        y2={height}
        stroke="#3f3f46"
        strokeWidth={1}
      />

      {/* Tick marks and labels */}
      {ticks}

      {/* Position marker (when dragging) */}
      {showMarker && markerPosition !== null && (
        <>
          <line
            x1={0}
            y1={(markerPosition / 100) * height}
            x2={width}
            y2={(markerPosition / 100) * height}
            stroke="#a855f7"
            strokeWidth={1}
          />
          <rect
            x={1}
            y={(markerPosition / 100) * height - 6}
            width={14}
            height={12}
            fill="#a855f7"
            rx={2}
          />
          <text
            x={8}
            y={(markerPosition / 100) * height + 3}
            textAnchor="middle"
            fill="#ffffff"
            fontSize={6}
            fontFamily="system-ui, sans-serif"
            fontWeight={500}
          >
            {markerPosition.toFixed(0)}
          </text>
        </>
      )}
    </svg>
  )
}
