/**
 * Dot Matrix Description Maps
 * All the static description mappings for prompt generation
 */

import {
  DotSize,
  DotSpacing,
  DotShape,
  PatternStyle,
  PatternCoverage,
  BackgroundColor,
  MetallicFinish,
  FontStyle,
  TextWeight,
  LetterSpacing,
  BrandPosition,
  LogoOrientation,
  SwooshStyle,
  SwooshPosition,
  SparkleIntensity,
  ShadowStyle,
  DepthLevel,
  LightingDirection,
  BevelStyle,
  Perspective,
  IconStyle,
} from '../../constants/dot-matrix-config'

export const dotSizeDescriptions: Record<DotSize, string> = {
  'tiny': 'TINY fine-detailed',
  'small': 'SMALL subtle',
  'medium': 'MEDIUM-SIZED',
  'large': 'LARGE bold',
  'extra-large': 'EXTRA-LARGE chunky prominent',
}

export const dotSpacingDescriptions: Record<DotSpacing, string> = {
  'tight': 'TIGHTLY packed dense',
  'normal': 'NORMAL spacing',
  'loose': 'LOOSELY spaced airy',
  'very-loose': 'VERY LOOSELY scattered widely spaced',
}

export const dotShapeDescriptions: Record<DotShape, string> = {
  'circle': 'circular',
  'square': 'square-shaped',
  'diamond': 'diamond-shaped',
  'hexagon': 'hexagonal',
}

export const patternStyleDescriptions: Record<PatternStyle, string> = {
  'uniform': 'uniform grid pattern',
  'halftone': 'halftone gradient pattern with varying dot sizes',
  'scatter': 'randomly scattered organic pattern',
  'radial': 'radial pattern radiating from center',
}

export const patternCoverageDescriptions: Record<PatternCoverage, string> = {
  'full': 'filling the entire letters',
  'partial-fade': 'gradually fading at edges',
  'edge-only': 'concentrated on letter edges',
  'center-only': 'concentrated in letter centers',
}

export const backgroundDescriptions: Record<BackgroundColor, string> = {
  'dark-navy': 'dark navy blue background',
  'black': 'pure black background',
  'dark-gray': 'dark charcoal gray background',
  'gradient': 'navy-to-black gradient background',
  'transparent': 'transparent background',
}

export const metallicDescriptions: Record<MetallicFinish, string> = {
  'chrome': 'brushed chrome/silver metallic',
  'gold': 'luxurious gold metallic',
  'bronze': 'warm bronze metallic',
  'rose-gold': 'elegant rose gold metallic',
  'platinum': 'premium platinum metallic',
  'copper': 'rich copper metallic',
}

export const fontStyleDescriptions: Record<FontStyle, string> = {
  'sans-serif-bold': 'bold sans-serif typography',
  'serif-elegant': 'elegant serif typography',
  'modern-geometric': 'modern geometric futuristic font',
  'tech-digital': 'tech digital cyber font',
  'script-fancy': 'elegant decorative script cursive typography',
  'display-bold': 'impactful display bold headline typography',
}

export const textWeightDescriptions: Record<TextWeight, string> = {
  'light': 'light weight',
  'regular': 'regular weight',
  'bold': 'bold weight',
  'extra-bold': 'extra bold heavy weight',
}

export const letterSpacingDescriptions: Record<LetterSpacing, string> = {
  'tight': 'tightly spaced letters',
  'normal': 'normal letter spacing',
  'wide': 'wide letter spacing',
  'very-wide': 'very wide dramatic letter spacing',
}

export const brandPositionDescriptions: Record<BrandPosition, string> = {
  'above': 'positioned above the icon',
  'below': 'positioned below the icon',
  'left': 'positioned to the left of the icon',
  'right': 'positioned to the right of the icon',
  'integrated': 'integrated with the design',
}

export const orientationDescriptions: Record<LogoOrientation, string> = {
  'horizontal': 'horizontal layout',
  'vertical': 'vertical stacked layout',
  'square': 'square compact layout',
}

export const swooshDescriptions: Record<SwooshStyle, string> = {
  'none': '',
  'circular': 'CIRCULAR arc swoosh element',
  'dynamic': 'DYNAMIC flowing curved swoosh',
  'ribbon': 'thick RIBBON band swoosh',
  'orbit': 'elliptical ORBIT path swoosh',
}

export const swooshPositionDescriptions: Record<SwooshPosition, string> = {
  'around': 'wrapping around the letters',
  'above': 'arcing above the text',
  'below': 'sweeping below the text',
  'wrapping': 'passing through and around the design',
}

export const sparkleDescriptions: Record<SparkleIntensity, string> = {
  'none': '',
  'subtle': 'with subtle sparkle accents',
  'medium': 'with medium sparkle and shine effects',
  'dramatic': 'with dramatic sparkling star burst effects',
}

export const shadowDescriptions: Record<ShadowStyle, string> = {
  'none': '',
  'soft-drop': 'soft drop shadow',
  'hard': 'hard crisp shadow',
  'long-cast': 'long dramatic cast shadow',
}

export const depthDescriptions: Record<DepthLevel, string> = {
  'flat': 'flat 2D',
  'subtle': 'subtle 3D depth',
  'medium': 'medium 3D extrusion',
  'deep': 'deep 3D extrusion with significant depth',
  'extreme': 'extreme 3D with dramatic depth and perspective',
}

export const lightingDescriptions: Record<LightingDirection, string> = {
  'top-left': 'dramatic studio lighting from top-left',
  'top': 'dramatic overhead lighting from top',
  'top-right': 'dramatic studio lighting from top-right',
  'side': 'dramatic side lighting',
}

export const bevelDescriptions: Record<BevelStyle, string> = {
  'none': '',
  'soft': 'with soft beveled edges',
  'sharp': 'with sharp beveled edges',
  'embossed': 'with embossed raised edges',
}

export const perspectiveDescriptions: Record<Perspective, string> = {
  'straight': 'straight-on view',
  'slight-angle': 'slight angular perspective',
  'isometric': 'isometric 3D perspective',
}

export const iconDescriptions: Record<IconStyle, string> = {
  'none': '',
  'globe': 'with a globe/world icon element',
  'arrow': 'with an upward arrow icon element',
  'abstract': 'with an abstract geometric icon element',
  'geometric': 'with a hexagonal geometric icon element',
  'star': 'with a star icon element',
}
