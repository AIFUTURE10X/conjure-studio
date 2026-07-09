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
    
    // Try exact matches first
    let detected = stylePresets.find(preset => 
      styleText.includes(preset.value.toLowerCase())
    )
    
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
