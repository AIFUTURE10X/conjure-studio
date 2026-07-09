'use client'

import { X } from 'lucide-react'

interface ImageUploadPreviewProps {
  images: string[]
  onRemove: (idx: number) => void
}

export function ImageUploadPreview({ images, onRemove }: ImageUploadPreviewProps) {
  if (images.length === 0) return null

  return (
    <div className="px-4 py-2 border-t border-[#c99850]/30 bg-zinc-950">
      <div className="flex gap-2 overflow-x-auto">
        {images.map((img, idx) => (
          <div key={idx} className="relative shrink-0 w-16 h-16 rounded overflow-hidden border border-[#c99850]/30">
            <img src={img || "/placeholder.svg"} alt={`Upload ${idx + 1}`} className="w-full h-full object-cover" />
            <button
              onClick={() => onRemove(idx)}
              className="absolute top-0 right-0 bg-red-500 text-white p-1 rounded-bl"
            >
              <X className="w-3 h-3" />
            </button>
          </div>
        ))}
      </div>
    </div>
  )
}
