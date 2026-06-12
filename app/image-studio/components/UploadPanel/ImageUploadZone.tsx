"use client"

/**
 * ImageUploadZone Component
 *
 * Reusable drop zone for scene and style images
 */

import { useRef } from 'react'
import { Button } from '@/components/ui/button'
import { Upload, X } from 'lucide-react'
import type { UploadedImage } from '../../types'

interface ImageUploadZoneProps {
  title: string
  subtitle: string
  image: UploadedImage | null
  isDragging: boolean
  onDragOver: (e: React.DragEvent) => void
  onDragLeave: () => void
  onDrop: (e: React.DragEvent) => void
  onFileSelect: (file: File) => void
  onClear: () => void
}

export function ImageUploadZone({
  title,
  subtitle,
  image,
  isDragging,
  onDragOver,
  onDragLeave,
  onDrop,
  onFileSelect,
  onClear,
}: ImageUploadZoneProps) {
  const inputRef = useRef<HTMLInputElement>(null)

  const handleFileInput = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files
    if (files && files[0]) {
      onFileSelect(files[0])
    }
    e.target.value = ''
  }

  return (
    <section className="flex h-full flex-col rounded-xl border border-zinc-700/70 bg-zinc-900/60 p-4">
      <div className="flex flex-wrap items-start justify-between gap-2 mb-3">
        <div className="min-w-0">
          <h3 className="text-base font-semibold text-white break-words">{title}</h3>
          <p className="text-sm text-zinc-500">{subtitle}</p>
        </div>
        {!image && (
          <Button
            size="sm"
            onClick={() => inputRef.current?.click()}
            className="shrink-0 font-semibold text-black"
            style={{
              background: "linear-gradient(135deg, #c99850 0%, #dbb56e 25%, #f4d698 50%, #dbb56e 75%, #c99850 100%)",
            }}
          >
            <Upload className="w-3 h-3 mr-1" />
            Browse
          </Button>
        )}
        <input
          ref={inputRef}
          type="file"
          accept="image/*"
          className="hidden"
          onChange={handleFileInput}
        />
      </div>

      <div
        onDragOver={onDragOver}
        onDragLeave={onDragLeave}
        onDrop={onDrop}
        onClick={() => !image && inputRef.current?.click()}
        className={`min-h-[120px] flex-1 border border-dashed rounded-lg p-3 text-center transition-colors flex items-center justify-center ${
          isDragging
            ? 'border-[#c99850] bg-[#c99850]/10'
            : 'border-[#c99850]/40 bg-zinc-950/20 hover:border-[#c99850]/80 hover:bg-zinc-950/40'
        } ${!image ? 'cursor-pointer' : ''}`}
      >
        {image ? (
          <div className="relative group w-full">
            <img
              src={image.preview || "/placeholder.svg"}
              alt={title}
              className="w-full h-32 object-cover rounded-lg"
            />
            <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center rounded-lg">
              <Button
                size="sm"
                variant="destructive"
                onClick={(e) => {
                  e.stopPropagation()
                  onClear()
                }}
              >
                <X className="w-3 h-3 mr-1" />
                Remove
              </Button>
            </div>
          </div>
        ) : (
          <div>
            <div className="w-10 h-10 rounded-full bg-linear-to-br from-[#c99850] to-[#dbb56e] border border-[#f4d698]/80 flex items-center justify-center mx-auto mb-2 shadow-lg shadow-[#c99850]/10">
              <Upload className="w-5 h-5 text-black" />
            </div>
            <p className="text-xs font-medium text-zinc-300">Drop image here</p>
          </div>
        )}
      </div>
    </section>
  )
}
