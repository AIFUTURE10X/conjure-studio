// Shared types for RealFontOverlay components

export type TextPosition = 'below' | 'above' | 'left' | 'right' | 'center'
export type TextTransform = 'none' | 'uppercase' | 'lowercase'

export interface FontControlsProps {
  brandName: string
  setBrandName: (name: string) => void
  tagline: string
  setTagline: (tagline: string) => void
  selectedFont: string
  setSelectedFont: (font: string) => void
  fontSize: number
  setFontSize: (size: number) => void
  fontWeight: number
  setFontWeight: (weight: number) => void
  fontColor: string
  setFontColor: (color: string) => void
  textTransform: TextTransform
  setTextTransform: (transform: TextTransform) => void
  letterSpacing: number
  setLetterSpacing: (spacing: number) => void
  position: TextPosition
  setPosition: (position: TextPosition) => void
  taglineFontSize: number
  setTaglineFontSize: (size: number) => void
  loadedFonts: Set<string>
}

export interface LogoTextPreviewProps {
  logoUrl: string
  brandName: string
  tagline: string
  selectedFont: string
  fontSize: number
  fontWeight: number
  fontColor: string
  textTransform: TextTransform
  letterSpacing: number
  position: TextPosition
  taglineFontSize: number
  loadedFonts: Set<string>
}

export interface RealFontOverlayProps {
  isOpen: boolean
  onClose: () => void
  logoUrl: string
  brandName: string
  tagline?: string
  onExport: (combinedImageUrl: string) => void
}
