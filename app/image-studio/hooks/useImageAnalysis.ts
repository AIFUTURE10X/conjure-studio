import { useState, useCallback } from 'react'
import { AnalysisResult } from '../types'

export function useImageAnalysis() {
  const [analyzing, setAnalyzing] = useState(false)

  const analyzeImage = useCallback(async (
    file: File,
    type: 'subject' | 'scene' | 'style',
    mode: 'fast' | 'quality' = 'quality',
    selectedStylePreset?: string
  ): Promise<string> => {
    setAnalyzing(true)

    try {
      console.log('[v0] Starting image analysis:', { type, mode, fileName: file.name, selectedStylePreset })

      const formData = new FormData()
      formData.append('image', file)
      formData.append('type', type)
      formData.append('mode', mode)
      
      if (type === 'style' && selectedStylePreset) {
        formData.append('selectedStylePreset', selectedStylePreset)
      }

      const response = await fetch('/api/analyze-image', {
        method: 'POST',
        body: formData,
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error || 'Analysis failed')
      }

      const data = await response.json()
      console.log('[v0] Analysis successful:', { type, textLength: data.analysis?.length })
      
      return data.analysis
    } catch (error) {
      console.error('[v0] Analysis error:', error)
      throw error
    } finally {
      setAnalyzing(false)
    }
  }, [])

  return {
    analyzeImage,
    analyzing,
  }
}
