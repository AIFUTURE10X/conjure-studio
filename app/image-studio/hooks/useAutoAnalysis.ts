"use client"

/**
 * useAutoAnalysis Hook
 *
 * Handles automatic image analysis when images are uploaded
 */

import { useEffect, useRef, useCallback } from 'react'
import type { UploadedImage } from '../types'

interface AnalysisResults {
  subjects: Array<{ id: string; analysis: string; mode: string }>
  scene: { analysis: string; mode: string } | null
  style: { analysis: string; mode: string } | null
}

interface UseAutoAnalysisProps {
  subjectImages: UploadedImage[]
  sceneImage: UploadedImage | null
  styleImage: UploadedImage | null
  analysisMode: 'fast' | 'quality'
  selectedStylePreset: string
  analyzeImage: (file: File, type: 'subject' | 'scene' | 'style', mode: 'fast' | 'quality', preset?: string) => Promise<string>
  onAnalysisUpdate: (results: AnalysisResults) => void
  onResetAll: () => void
}

export function useAutoAnalysis({
  subjectImages,
  sceneImage,
  styleImage,
  analysisMode,
  selectedStylePreset,
  analyzeImage,
  onAnalysisUpdate,
  onResetAll,
}: UseAutoAnalysisProps) {
  // Ref to track which images are currently being analyzed
  const analyzingRef = useRef<Set<string>>(new Set())
  const analysisResultsRef = useRef<AnalysisResults>({
    subjects: [],
    scene: null,
    style: null,
  })
  // Track if we've ever had images uploaded
  const hadImagesRef = useRef(false)

  const autoAnalyze = useCallback(async () => {
    console.log('[v0] Auto-analyze triggered', {
      subjectCount: subjectImages.length,
      hasScene: !!sceneImage,
      hasStyle: !!styleImage
    })

    let resultsChanged = false
    const newResults = { ...analysisResultsRef.current }

    // Analyze subject images
    for (const img of subjectImages) {
      if (img.file) {
        const analyzeKey = `subject-${img.id}-${analysisMode}`
        const existingAnalysis = newResults.subjects.find(s => s.id === img.id)
        const needsAnalysis = !existingAnalysis || existingAnalysis.mode !== analysisMode
        const isCurrentlyAnalyzing = analyzingRef.current.has(analyzeKey)

        if (needsAnalysis && !isCurrentlyAnalyzing) {
          try {
            analyzingRef.current.add(analyzeKey)
            console.log(`[v0] Analyzing subject ${img.id} in ${analysisMode} mode`)
            const analysis = await analyzeImage(img.file, 'subject', analysisMode)
            console.log(`[v0] Subject analysis complete for ${img.id}:`, analysis?.substring(0, 100))

            newResults.subjects = [
              ...newResults.subjects.filter(s => s.id !== img.id),
              { id: img.id, analysis, mode: analysisMode }
            ]
            resultsChanged = true
          } catch (error) {
            console.error('[v0] Auto-analyze subject failed:', error)
          } finally {
            analyzingRef.current.delete(analyzeKey)
          }
        }
      }
    }

    // Analyze scene image
    if (sceneImage?.file) {
      const analyzeKey = `scene-${analysisMode}`
      const needsAnalysis = !newResults.scene || newResults.scene.mode !== analysisMode
      const isCurrentlyAnalyzing = analyzingRef.current.has(analyzeKey)

      if (needsAnalysis && !isCurrentlyAnalyzing) {
        try {
          analyzingRef.current.add(analyzeKey)
          console.log(`[v0] Analyzing scene in ${analysisMode} mode`)
          const analysis = await analyzeImage(sceneImage.file, 'scene', analysisMode)
          console.log(`[v0] Scene analysis complete:`, analysis?.substring(0, 100))

          newResults.scene = { analysis, mode: analysisMode }
          resultsChanged = true
        } catch (error) {
          console.error('[v0] Auto-analyze scene failed:', error)
        } finally {
          analyzingRef.current.delete(analyzeKey)
        }
      }
    }

    // Analyze style image
    if (styleImage?.file) {
      const analyzeKey = `style-${analysisMode}-${selectedStylePreset}`
      const needsAnalysis = !newResults.style || newResults.style.mode !== analysisMode
      const isCurrentlyAnalyzing = analyzingRef.current.has(analyzeKey)

      if (needsAnalysis && !isCurrentlyAnalyzing) {
        try {
          analyzingRef.current.add(analyzeKey)
          console.log(`[v0] Analyzing style in ${analysisMode} mode`)
          const analysis = await analyzeImage(styleImage.file, 'style', analysisMode, selectedStylePreset)
          console.log(`[v0] Style analysis complete:`, analysis?.substring(0, 100))

          newResults.style = { analysis, mode: analysisMode }
          resultsChanged = true
        } catch (error) {
          console.error('[v0] Auto-analyze style failed:', error)
        } finally {
          analyzingRef.current.delete(analyzeKey)
        }
      }
    }

    // Update results if changed
    if (resultsChanged) {
      analysisResultsRef.current = newResults
      onAnalysisUpdate(newResults)
    }

    const hasImages = subjectImages.length > 0 || !!sceneImage || !!styleImage

    // Track if we've had images
    if (hasImages) {
      hadImagesRef.current = true
    }

    // Only reset when images are explicitly removed (not on initial load)
    if (!hasImages && hadImagesRef.current) {
      onResetAll()
      hadImagesRef.current = false
      analysisResultsRef.current = { subjects: [], scene: null, style: null }
    }
  }, [subjectImages, sceneImage, styleImage, analysisMode, selectedStylePreset, analyzeImage, onAnalysisUpdate, onResetAll])

  useEffect(() => {
    autoAnalyze()
  }, [autoAnalyze])

  return {
    clearSubjectAnalysis: (id?: string) => {
      if (id) {
        analysisResultsRef.current.subjects = analysisResultsRef.current.subjects.filter(s => s.id !== id)
      } else {
        analysisResultsRef.current.subjects = []
      }
      onAnalysisUpdate(analysisResultsRef.current)
    },
    clearSceneAnalysis: () => {
      analysisResultsRef.current.scene = null
      onAnalysisUpdate(analysisResultsRef.current)
    },
    clearStyleAnalysis: () => {
      analysisResultsRef.current.style = null
      onAnalysisUpdate(analysisResultsRef.current)
    },
  }
}
