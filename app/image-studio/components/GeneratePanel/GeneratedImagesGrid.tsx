"use client"

import { Card } from '@/components/ui/card'
import { GeneratedImageCard } from '../GeneratedImageCard'

interface GeneratedImage {
  url: string
  prompt?: string
  timestamp?: number
}

interface GenerationParameters {
  mainPrompt?: string
  aspectRatio: string
  selectedStylePreset: string
  imageCount: number
  negativePrompt: string
  selectedCameraAngle: string
  selectedCameraLens: string
  styleStrength: string
}

interface GeneratedImagesGridProps {
  images: GeneratedImage[]
  aspectRatio: string
  selectedStylePreset: string
  parameters: GenerationParameters
  isFavorite: (url: string) => boolean
  onToggleFavorite: (url: string, metadata: any) => void
  onDownload: (url: string, index: number, prompt?: string) => void
  onOpenLightbox: (index: number) => void
  onRestoreParameters?: (params: any) => void
  getImageMetadata: (url: string) => Promise<{ dimensions: string; fileSize: string }>
}

export function GeneratedImagesGrid({
  images,
  aspectRatio,
  selectedStylePreset,
  parameters,
  isFavorite,
  onToggleFavorite,
  onDownload,
  onOpenLightbox,
  onRestoreParameters,
  getImageMetadata,
}: GeneratedImagesGridProps) {
  if (images.length === 0) return null

  return (
    <Card className="bg-zinc-900 border-[#c99850]/30 p-6">
      <h3 className="text-lg font-bold text-white mb-4">Generated Images ({images.length})</h3>
      <div className="grid grid-cols-2 gap-4">
        {images.map((img, index) => (
          <GeneratedImageCard
            key={index}
            imageUrl={img.url}
            imagePrompt={img.prompt}
            imageTimestamp={img.timestamp}
            index={index}
            aspectRatio={aspectRatio}
            selectedStylePreset={selectedStylePreset}
            parameters={{
              mainPrompt: img.prompt,
              aspectRatio: parameters.aspectRatio,
              selectedStylePreset: parameters.selectedStylePreset,
              imageCount: parameters.imageCount,
              negativePrompt: parameters.negativePrompt,
              selectedCameraAngle: parameters.selectedCameraAngle,
              selectedCameraLens: parameters.selectedCameraLens,
              styleStrength: parameters.styleStrength,
            }}
            isFavorite={isFavorite(img.url)}
            onToggleFavorite={async () => {
              const freshMetadata = await getImageMetadata(img.url)
              onToggleFavorite(img.url, {
                ratio: aspectRatio,
                style: selectedStylePreset,
                dimensions: freshMetadata.dimensions,
                fileSize: freshMetadata.fileSize,
                prompt: img.prompt,
                timestamp: img.timestamp,
                parameters: {
                  mainPrompt: img.prompt,
                  aspectRatio: parameters.aspectRatio,
                  selectedStylePreset: parameters.selectedStylePreset,
                  imageCount: parameters.imageCount,
                  negativePrompt: parameters.negativePrompt,
                  selectedCameraAngle: parameters.selectedCameraAngle,
                  selectedCameraLens: parameters.selectedCameraLens,
                  styleStrength: parameters.styleStrength,
                }
              })
            }}
            onDownload={() => onDownload(img.url, index, img.prompt)}
            onOpenLightbox={() => onOpenLightbox(index)}
            onRestoreParameters={onRestoreParameters}
          />
        ))}
      </div>
    </Card>
  )
}
