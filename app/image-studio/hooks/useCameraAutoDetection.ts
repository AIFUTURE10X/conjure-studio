"use client"

import { useState, useEffect } from 'react'

export function useCameraAutoDetection(sceneAnalysisText: string | null) {
  const [detectedAngle, setDetectedAngle] = useState<string>('')
  const [detectedLens, setDetectedLens] = useState<string>('')
  const [detectedRatio, setDetectedRatio] = useState<string | null>(null)

  useEffect(() => {
    if (!sceneAnalysisText) return

    const sceneText = sceneAnalysisText.toLowerCase()
    
    // Auto-detect aspect ratio
    if (sceneText.includes('portrait') || sceneText.includes('vertical')) {
      setDetectedRatio('9:16')
    } else if (sceneText.includes('panorama') || sceneText.includes('wide') || sceneText.includes('landscape')) {
      setDetectedRatio('16:9')
    } else if (sceneText.includes('square')) {
      setDetectedRatio('1:1')
    }
    
    // Auto-detect camera angle
    if (sceneText.includes('aerial') || sceneText.includes('bird') || sceneText.includes('above')) {
      setDetectedAngle('Aerial View')
    } else if (sceneText.includes('low angle') || sceneText.includes('from below')) {
      setDetectedAngle('Low Angle')
    } else if (sceneText.includes('high angle') || sceneText.includes('from above')) {
      setDetectedAngle('High Angle')
    } else if (sceneText.includes('eye level') || sceneText.includes('straight')) {
      setDetectedAngle('Eye Level')
    }
    
    // Auto-detect camera lens
    if (sceneText.includes('macro') || sceneText.includes('close-up') || sceneText.includes('detailed')) {
      setDetectedLens('Macro')
    } else if (sceneText.includes('wide angle') || sceneText.includes('expansive')) {
      setDetectedLens('Wide Angle')
    } else if (sceneText.includes('telephoto') || sceneText.includes('zoom') || sceneText.includes('distant')) {
      setDetectedLens('Telephoto')
    }
  }, [sceneAnalysisText])

  return { detectedAngle, detectedLens, detectedRatio }
}
