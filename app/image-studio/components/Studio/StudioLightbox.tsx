"use client"

/**
 * StudioLightbox
 *
 * Hosts the shared image lightbox and its "Edit" entry point. Rendered
 * inside ImageGenerationProvider (unlike the rest of StudioShell's chrome)
 * so it can call applyEditedImage directly. Keeps its own editingIndex
 * because the grid (ResultsCanvas) and the lightbox are separate trigger
 * points into the same ImageEditModal.
 */

import { useState } from 'react'
import { ImageLightbox } from '../ImageLightbox'
import { ImageEditModal } from '../ImageEditor'
import { useStudioCore } from '../../context/useStudio'
import { useImageGenerationEngine } from '../../context/ImageGenerationProvider'
import { useEditChat } from '../../context/EditChatProvider'

export function StudioLightbox() {
  const { state, closeLightbox, navigateLightbox, handleDownloadFromLightbox } = useStudioCore()
  const { applyEditedImage } = useImageGenerationEngine()
  const { startEditChat } = useEditChat()
  const [editingIndex, setEditingIndex] = useState<number | null>(null)

  return (
    <>
      <ImageLightbox
        isOpen={state.lightboxOpen}
        images={state.generatedImages}
        currentIndex={state.lightboxIndex}
        onClose={closeLightbox}
        onNavigate={navigateLightbox}
        onDownload={handleDownloadFromLightbox}
        onEdit={() => {
          const index = state.lightboxIndex
          closeLightbox()
          setEditingIndex(index)
        }}
        onEditInChat={() => {
          const index = state.lightboxIndex
          const url = state.generatedImages[index]?.url
          closeLightbox()
          if (url) startEditChat(index, url)
        }}
      />

      {editingIndex !== null && state.generatedImages[editingIndex] && (
        <ImageEditModal
          imageUrl={state.generatedImages[editingIndex].url}
          onApply={(url, editPrompt) => applyEditedImage(editingIndex, url, editPrompt)}
          onClose={() => setEditingIndex(null)}
        />
      )}
    </>
  )
}
