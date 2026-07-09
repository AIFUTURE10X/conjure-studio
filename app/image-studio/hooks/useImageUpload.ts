import { useState, useCallback } from 'react'
import type { UploadedImage } from '../types'

export function useImageUpload() {
  const [subjectImages, setSubjectImages] = useState<UploadedImage[]>([])
  const [sceneImage, setSceneImage] = useState<UploadedImage | null>(null)
  const [styleImage, setStyleImage] = useState<UploadedImage | null>(null)
  const [isDragging, setIsDragging] = useState(false)

  const createImagePreview = useCallback((file: File): Promise<string> => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader()
      reader.onload = (e) => resolve(e.target?.result as string)
      reader.onerror = reject
      reader.readAsDataURL(file)
    })
  }, [])

  const addSubjectImages = useCallback(async (files: FileList | File[]) => {
    const fileArray = Array.from(files)
    const newImages: UploadedImage[] = []

    for (const file of fileArray) {
      if (!file.type.startsWith('image/')) continue
      
      const preview = await createImagePreview(file)
      newImages.push({
        id: `subject-${Date.now()}-${Math.random()}`,
        file,
        preview,
        selected: true, // Auto-select new uploads
      })
    }

    setSubjectImages(prev => [...prev, ...newImages])
  }, [createImagePreview])

  const setSceneImageFile = useCallback(async (file: File) => {
    const preview = await createImagePreview(file)
    setSceneImage({
      id: `scene-${Date.now()}`,
      file,
      preview,
      selected: true,
    })
  }, [createImagePreview])

  const setStyleImageFile = useCallback(async (file: File) => {
    const preview = await createImagePreview(file)
    setStyleImage({
      id: `style-${Date.now()}`,
      file,
      preview,
      selected: true,
    })
  }, [createImagePreview])

  const removeSubjectImage = useCallback((id: string) => {
    setSubjectImages(prev => prev.filter(img => img.id !== id))
  }, [])

  const toggleSubjectSelection = useCallback((id: string) => {
    setSubjectImages(prev =>
      prev.map(img =>
        img.id === id ? { ...img, selected: !img.selected } : img
      )
    )
  }, [])

  const clearSceneImage = useCallback(() => setSceneImage(null), [])
  const clearStyleImage = useCallback(() => setStyleImage(null), [])

  const clearAllImages = useCallback(() => {
    setSubjectImages([])
    setSceneImage(null)
    setStyleImage(null)
  }, [])

  return {
    // State
    subjectImages,
    sceneImage,
    styleImage,
    isDragging,
    setIsDragging,
    
    // Actions
    addSubjectImages,
    setSceneImageFile,
    setStyleImageFile,
    removeSubjectImage,
    toggleSubjectSelection,
    clearSceneImage,
    clearStyleImage,
    clearAllImages,
  }
}
