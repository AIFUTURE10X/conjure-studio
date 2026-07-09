"use client"

import { useRef } from 'react'
import { Button } from '@/components/ui/button'
import { Upload, X, Copy, Wand2 } from 'lucide-react'

export type ReferenceMode = 'replicate' | 'inspire'

export interface ReferenceImage {
  file: File
  preview: string
  mode: ReferenceMode
}

interface ReferenceImageUploadProps {
  referenceImage: ReferenceImage | null
  onImageChange: (image: ReferenceImage | null) => void
}

export function ReferenceImageUpload({
  referenceImage,
  onImageChange,
}: ReferenceImageUploadProps) {
  const inputRef = useRef<HTMLInputElement>(null)

  const handleUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    if (!file.type.startsWith('image/')) {
      alert('Please upload a valid image file')
      e.target.value = ''
      return
    }

    if (file.size > 10 * 1024 * 1024) {
      alert('Image size must be less than 10MB')
      e.target.value = ''
      return
    }

    const preview = URL.createObjectURL(file)
    onImageChange({ file, preview, mode: 'replicate' }) // Default to replicate
    e.target.value = ''
  }

  const handleModeChange = (mode: ReferenceMode) => {
    if (referenceImage) {
      onImageChange({ ...referenceImage, mode })
    }
  }

  const handleRemove = () => {
    if (referenceImage?.preview) {
      URL.revokeObjectURL(referenceImage.preview)
    }
    onImageChange(null)
    if (inputRef.current) {
      inputRef.current.value = ''
    }
  }

  return (
    <div className="bg-zinc-800 rounded-lg p-3 border-2 border-[#c99850]/50">
      <label className="text-xs font-bold text-white mb-2 block">
        Reference Image (optional - for image-to-image generation)
      </label>
      {referenceImage ? (
        <div className="space-y-2">
          <div className="flex items-center gap-2 bg-zinc-900 rounded-lg p-2 border border-[#c99850]/30">
            <img
              src={referenceImage.preview || "/placeholder.svg"}
              alt="Reference"
              className="w-16 h-16 object-cover rounded"
            />
            <div className="flex-1">
              <p className="text-[10px] text-white font-medium">{referenceImage.file.name}</p>
              <p className="text-[8px] text-white/60">
                {(referenceImage.file.size / 1024).toFixed(1)} KB
              </p>
            </div>
            <Button
              onClick={handleRemove}
              variant="ghost"
              size="sm"
              className="h-6 px-2 text-[10px] bg-[#c99850]/10 hover:bg-[#c99850]/20 text-[#c99850]"
            >
              <X className="w-3 h-3" />
            </Button>
          </div>
          {/* Reference Mode Selector */}
          <div className="flex gap-2">
            <button
              onClick={() => handleModeChange('replicate')}
              className={`flex-1 flex items-center justify-center gap-1.5 px-3 py-2 rounded-lg text-[10px] font-medium transition-all ${
                referenceImage.mode === 'replicate'
                  ? 'bg-purple-600 text-white border border-purple-500'
                  : 'bg-zinc-800 text-zinc-400 border border-zinc-700 hover:border-zinc-600'
              }`}
            >
              <Copy className="w-3 h-3" />
              Replicate Exact
            </button>
            <button
              onClick={() => handleModeChange('inspire')}
              className={`flex-1 flex items-center justify-center gap-1.5 px-3 py-2 rounded-lg text-[10px] font-medium transition-all ${
                referenceImage.mode === 'inspire'
                  ? 'bg-amber-600 text-white border border-amber-500'
                  : 'bg-zinc-800 text-zinc-400 border border-zinc-700 hover:border-zinc-600'
              }`}
            >
              <Wand2 className="w-3 h-3" />
              Use as Inspiration
            </button>
          </div>
          <p className="text-[8px] text-zinc-500 text-center">
            {referenceImage.mode === 'replicate'
              ? 'Generate an exact copy of this image (ignores prompt)'
              : 'Use image as style/subject reference for your prompt'}
          </p>
        </div>
      ) : (
        <button
          onClick={() => inputRef.current?.click()}
          className="w-full border-2 border-dashed border-[#c99850]/50 hover:border-[#c99850] rounded-lg p-3 bg-zinc-900 hover:bg-zinc-800 transition-colors"
        >
          <div className="w-12 h-12 rounded-full bg-linear-to-br from-[#c99850] to-[#dbb56e] border-2 border-[#f4d698] flex items-center justify-center mx-auto mb-2">
            <Upload className="w-6 h-6 text-black" />
          </div>
          <p className="text-[10px] text-white/70">Click to upload reference image</p>
          <p className="text-[8px] text-white/60">JPEG, PNG, WebP (max 10MB)</p>
        </button>
      )}
      <input
        ref={inputRef}
        type="file"
        accept="image/*"
        onChange={handleUpload}
        className="hidden"
      />
    </div>
  )
}
