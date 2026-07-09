import { useMemo } from 'react'
import { UploadedImage } from '../types'

export function usePromptBuilder(
  subjectImages: UploadedImage[],
  analysisResults: {
    subjects: any[]
    scene: any | null
    style: any | null
  }
) {
  const combinedPrompt = useMemo(() => {
    const parts: string[] = []
    
    const selectedSubjectIds = subjectImages
      .filter(img => img.selected)
      .map(img => img.id)
    
    const subjectAnalyses = analysisResults.subjects
      .filter(subj => selectedSubjectIds.includes(subj.id) && subj.analysis?.trim())
      .map(subj => subj.analysis)
    
    if (subjectAnalyses.length > 0) {
      parts.push(subjectAnalyses.join('. '))
    }
    
    // Add scene analysis
    if (analysisResults.scene?.analysis?.trim()) {
      parts.push(analysisResults.scene.analysis)
    }
    
    // Add style analysis
    if (analysisResults.style?.analysis?.trim()) {
      parts.push(analysisResults.style.analysis)
    }
    
    return parts.join('. ')
  }, [subjectImages, analysisResults])
  
  return {
    combinedPrompt,
    hasPrompt: combinedPrompt.length > 0
  }
}
