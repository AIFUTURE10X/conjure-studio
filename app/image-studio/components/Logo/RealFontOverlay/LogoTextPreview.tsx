"use client"

import { REAL_FONTS } from '@/app/image-studio/constants/real-fonts'
import type { LogoTextPreviewProps } from './types'

export function LogoTextPreview({
  logoUrl,
  brandName,
  tagline,
  selectedFont,
  fontSize,
  fontWeight,
  fontColor,
  textTransform,
  letterSpacing,
  position,
  taglineFontSize,
  loadedFonts,
}: LogoTextPreviewProps) {
  const font = REAL_FONTS[selectedFont]

  const fontStyle: React.CSSProperties = {
    fontFamily: loadedFonts.has(selectedFont) ? font?.family : 'sans-serif',
    fontSize: `${fontSize}px`,
    fontWeight,
    color: fontColor,
    textTransform: textTransform as React.CSSProperties['textTransform'],
    letterSpacing: `${letterSpacing}px`,
  }

  const getDisplayText = (text: string) => {
    if (textTransform === 'uppercase') return text.toUpperCase()
    if (textTransform === 'lowercase') return text.toLowerCase()
    return text
  }

  const TextBlock = () => (
    <div
      className={position === 'left' || position === 'right' ? '' : 'mt-4'}
      style={fontStyle}
    >
      <div>{getDisplayText(brandName)}</div>
      {tagline && (
        <div
          style={{
            fontSize: `${taglineFontSize}px`,
            fontWeight: 400,
            opacity: 0.8,
            marginTop: '4px',
          }}
        >
          {getDisplayText(tagline)}
        </div>
      )}
    </div>
  )

  return (
    <div className="flex-1 p-6 flex items-center justify-center bg-zinc-950/50 overflow-auto">
      <div
        className={`relative bg-zinc-800 rounded-xl p-8 ${
          position === 'left' || position === 'right' ? 'flex items-center gap-6' : 'text-center'
        }`}
      >
        {/* Text before logo */}
        {(position === 'above' || position === 'left') && <TextBlock />}

        {/* Logo */}
        <img
          src={logoUrl}
          alt="Logo preview"
          className="max-w-[200px] max-h-[200px] object-contain"
        />

        {/* Text after logo */}
        {(position === 'below' || position === 'right' || position === 'center') && <TextBlock />}
      </div>
    </div>
  )
}
