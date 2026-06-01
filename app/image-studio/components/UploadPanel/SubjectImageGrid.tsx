"use client"

/**
 * SubjectImageGrid Component
 *
 * Grid display for subject images with selection and removal controls
 */

import { Button } from '@/components/ui/button'
import { X, Check, Upload } from 'lucide-react'
import type { UploadedImage } from '../../types'

interface SubjectImageGridProps {
  subjectImages: UploadedImage[]
  onToggleSelection: (id: string) => void
  onRemove: (id: string) => void
}

export function SubjectImageGrid({
  subjectImages,
  onToggleSelection,
  onRemove,
}: SubjectImageGridProps) {
  if (subjectImages.length === 0) {
    return (
      <div className="min-h-[150px] flex flex-col items-center justify-center text-center">
        <div className="w-12 h-12 rounded-full bg-linear-to-br from-[#c99850] to-[#dbb56e] border border-[#f4d698]/80 flex items-center justify-center mx-auto mb-3 shadow-lg shadow-[#c99850]/10">
          <Upload className="w-6 h-6 text-black" />
        </div>
        <p className="text-sm font-medium text-zinc-200">Drop subjects here</p>
        <p className="text-xs text-zinc-500 mt-1">or browse from your device</p>
      </div>
    )
  }

  return (
    <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3">
      {subjectImages.map((img) => (
        <div
          key={img.id}
          className={`relative group rounded-lg overflow-hidden border transition-all bg-zinc-950 ${
            img.selected
              ? 'border-[#c99850] shadow-lg shadow-[#c99850]/20'
              : 'border-zinc-700'
          }`}
        >
          <img
            src={img.preview || "/placeholder.svg"}
            alt="Subject"
            className="w-full h-28 object-cover"
          />

          {/* Overlay Controls */}
          <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-2">
            <Button
              size="sm"
              variant="secondary"
              onClick={() => onToggleSelection(img.id)}
              className="bg-zinc-800 hover:bg-zinc-700"
            >
              {img.selected ? (
                <>
                  <Check className="w-3 h-3 mr-1" />
                  Selected
                </>
              ) : (
                'Select'
              )}
            </Button>
            <Button
              size="sm"
              variant="destructive"
              onClick={() => onRemove(img.id)}
            >
              <X className="w-3 h-3" />
            </Button>
          </div>

          {/* Selection Badge */}
          {img.selected && (
            <div className="absolute top-2 right-2 w-6 h-6 rounded-full bg-[#c99850] flex items-center justify-center">
              <Check className="w-4 h-4 text-black" />
            </div>
          )}
        </div>
      ))}
    </div>
  )
}
