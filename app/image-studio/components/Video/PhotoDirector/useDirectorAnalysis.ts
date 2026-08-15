"use client"

import { useCallback, useState } from 'react'
import { toast } from 'sonner'
import { dataUrlToScaledJpegFile } from './photo-intake'
import { applyDirectorAnalysis, useDirectorProject } from './useDirectorProject'
import { multiPhotoAnalysisSchema } from '@/lib/video/photo-director-schema'

/** Analysis copies are downscaled — full-res originals stay for generation. */
const ANALYSIS_MAX_DIM = 1536

/**
 * Joint photo analysis: sends analysis-sized copies of every project photo to
 * /api/analyze-photo-pair as FormData Files and applies the validated result
 * to the project (which also seeds the working constraint list).
 */
export function useDirectorAnalysis() {
  const project = useDirectorProject()
  const [isAnalyzing, setIsAnalyzing] = useState(false)
  const photos = project?.photos

  const analyzePhotos = useCallback(async (): Promise<boolean> => {
    if (!photos || photos.length < 2) return false
    setIsAnalyzing(true)
    try {
      const formData = new FormData()
      for (const [index, photo] of photos.entries()) {
        formData.append('photos', await dataUrlToScaledJpegFile(photo.dataUrl, ANALYSIS_MAX_DIM, `photo-${index + 1}.jpg`))
      }

      const response = await fetch('/api/analyze-photo-pair', { method: 'POST', body: formData })
      const data = await response.json().catch(() => ({}))
      if (!response.ok) {
        throw new Error(data.error || `Analysis failed (${response.status})`)
      }

      applyDirectorAnalysis(multiPhotoAnalysisSchema.parse(data.analysis))
      return true
    } catch (error) {
      console.error('[photo-director] Analyze failed:', error)
      toast.error(error instanceof Error ? error.message : 'Could not analyze the photos')
      return false
    } finally {
      setIsAnalyzing(false)
    }
  }, [photos])

  return { analyzePhotos, isAnalyzing }
}
