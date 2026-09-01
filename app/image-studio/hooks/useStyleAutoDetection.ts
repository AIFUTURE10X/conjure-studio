"use client"

import { useState, useEffect } from 'react'

interface StylePreset {
  value: string
  label: string
}

export function useStyleAutoDetection(
  styleAnalysisText: string | null,
  stylePresets: StylePreset[]
) {
  const [detectedStyle, setDetectedStyle] = useState<string | null>(null)

  useEffect(() => {
    if (!styleAnalysisText) return

    const styleText = styleAnalysisText.toLowerCase()
    
    // Noir outranks the exact-match pass below: "noir comic book panel" contains
    // the literal "comic book", but the noir read is the more specific one.
    let detected = ['noir', 'chiaroscuro', 'graphic novel'].some(signal => styleText.includes(signal))
      ? stylePresets.find(p => p.value === 'Ink Noir')
      : undefined

    // Try exact matches first, longest value wins. Array order used to decide,
    // so "Studio Ghibli hand-drawn anime" matched Anime (earlier in the list)
    // over the more specific Studio Ghibli.
    if (!detected) {
      detected = stylePresets
        .filter(preset => styleText.includes(preset.value.toLowerCase()))
        .sort((a, b) => b.value.length - a.value.length)[0]
    }

    // Partial matches for common variations
    if (!detected) {
      if (styleText.includes('ghibli')) {
        detected = stylePresets.find(p => p.value === 'Studio Ghibli')
      } else if (styleText.includes('shinkai')) {
        detected = stylePresets.find(p => p.value === 'Makoto Shinkai')
      } else if (styleText.includes('disney')) {
        detected = stylePresets.find(p => p.value === 'Disney Modern 3D')
      } else if (styleText.includes('spider') || styleText.includes('verse')) {
        detected = stylePresets.find(p => p.value === 'Sony Spider-Verse')
      } else if (
        styleText.includes('digital clay') ||
        (styleText.includes('clay') && (styleText.includes('computer-rendered') || styleText.includes('smooth 3d')))
      ) {
        detected = stylePresets.find(p => p.value === '3D Digital Clay')
      } else if (styleText.includes('clay') || styleText.includes('plasticine')) {
        detected = stylePresets.find(p => p.value === 'Clay 3D')
      } else if (styleText.includes('anime')) {
        detected = stylePresets.find(p => p.value === 'Anime')
      } else if (styleText.includes('cartoon')) {
        detected = stylePresets.find(p => p.value === 'Cartoon Style')
      } else if (styleText.includes('comic')) {
        detected = stylePresets.find(p => p.value === 'Comic Book')
      } else if (styleText.includes('oil') && styleText.includes('paint')) {
        detected = stylePresets.find(p => p.value === 'Oil Painting')
      } else if (styleText.includes('watercolor')) {
        detected = stylePresets.find(p => p.value === 'Watercolor')
      } else if (styleText.includes('sketch') || styleText.includes('pencil')) {
        detected = stylePresets.find(p => p.value === 'Pencil Sketch')
      } else if (styleText.includes('3d') || styleText.includes('render')) {
        detected = stylePresets.find(p => p.value === '3D Render')
      } else if (styleText.includes('photo') || styleText.includes('realistic')) {
        detected = stylePresets.find(p => p.value === 'Realistic')
      }
    }
    
    setDetectedStyle(detected?.value || null)
  }, [styleAnalysisText, stylePresets])

  return detectedStyle
}
