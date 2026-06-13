"use client"

/**
 * ThumbnailDuotoneFilter
 *
 * Inline SVG filter that maps the background image to two colors (black →
 * shadow, white → highlight). Rendered inside the captured stage node so the
 * `url(#thumb-duotone)` reference resolves in the html-to-image export.
 */

import { type ThumbnailDuotone } from './thumbnail-constants'
import { hexToUnit } from './thumbnail-fx'

export function ThumbnailDuotoneFilter({ duotone }: { duotone: ThumbnailDuotone }) {
  const s = hexToUnit(duotone.shadow)
  const h = hexToUnit(duotone.highlight)
  return (
    <svg className="absolute h-0 w-0" aria-hidden="true">
      <defs>
        <filter id="thumb-duotone" colorInterpolationFilters="sRGB">
          <feColorMatrix
            type="matrix"
            values="0.33 0.33 0.33 0 0  0.33 0.33 0.33 0 0  0.33 0.33 0.33 0 0  0 0 0 1 0"
          />
          <feComponentTransfer>
            <feFuncR type="table" tableValues={`${s.r} ${h.r}`} />
            <feFuncG type="table" tableValues={`${s.g} ${h.g}`} />
            <feFuncB type="table" tableValues={`${s.b} ${h.b}`} />
          </feComponentTransfer>
        </filter>
      </defs>
    </svg>
  )
}
