"use client"

import { useRef, useState } from 'react'
import { toast } from 'sonner'
import { Button } from '@/components/ui/button'
import { ArrowDown, ArrowUp, ImagePlus, Loader2, RefreshCw, Sparkles, X } from 'lucide-react'
import { processPhotoFiles, hasExtremeDimensionMismatch } from './photo-intake'
import { resetDirectorAnalysis, setDirectorPhotos, useDirectorProject } from './useDirectorProject'
import { MIN_PHOTOS, MAX_PHOTOS } from '../../../constants/photo-director'
import type { PhotoReference } from '@/lib/video/photo-director-schema'

interface PhotoUploadStepProps {
  onAnalyze: () => void
  isAnalyzing: boolean
}

/** Step 1 — upload, reorder, replace, and remove the source photographs. */
export function PhotoUploadStep({ onAnalyze, isAnalyzing }: PhotoUploadStepProps) {
  const project = useDirectorProject()
  const inputRef = useRef<HTMLInputElement>(null)
  const replaceRef = useRef<HTMLInputElement>(null)
  const [replaceId, setReplaceId] = useState<string | null>(null)
  const [isProcessing, setIsProcessing] = useState(false)
  const photos = project?.photos ?? []
  const hadAnalysis = Boolean(project?.analysis)

  const applyPhotoChange = (next: PhotoReference[]) => {
    // Changing the photo set invalidates any prior analysis and everything
    // downstream of it — that's the one destructive transition in the flow.
    if (hadAnalysis) {
      resetDirectorAnalysis()
      toast.info('Photos changed — the previous analysis was cleared')
    }
    setDirectorPhotos(next)
  }

  const handleFiles = async (files: FileList | null) => {
    if (!files || files.length === 0) return
    setIsProcessing(true)
    try {
      const { photos: added, errors } = await processPhotoFiles(Array.from(files), photos)
      errors.forEach((message) => toast.error(message))
      if (added.length > 0) applyPhotoChange([...photos, ...added])
    } finally {
      setIsProcessing(false)
    }
  }

  const handleReplace = async (files: FileList | null) => {
    if (!files || files.length === 0 || !replaceId) return
    setIsProcessing(true)
    try {
      const others = photos.filter((photo) => photo.id !== replaceId)
      const { photos: added, errors } = await processPhotoFiles([files[0]], others)
      errors.forEach((message) => toast.error(message))
      if (added.length > 0) {
        applyPhotoChange(photos.map((photo) => (photo.id === replaceId ? added[0] : photo)))
      }
    } finally {
      setIsProcessing(false)
      setReplaceId(null)
    }
  }

  const move = (index: number, direction: -1 | 1) => {
    const target = index + direction
    if (target < 0 || target >= photos.length) return
    const next = [...photos]
    ;[next[index], next[target]] = [next[target], next[index]]
    applyPhotoChange(next)
  }

  const missingFullRes = photos.filter((photo) => !photo.dataUrl)
  const mismatch = hasExtremeDimensionMismatch(photos)
  const canAnalyze = photos.length >= MIN_PHOTOS && missingFullRes.length === 0 && !isProcessing && !isAnalyzing

  return (
    <div className="space-y-3">
      <p className="text-xs text-zinc-400 leading-5">
        Upload two or more photos of the same room or property. The AI will study them together,
        point out what must stay true, and build a shot plan around them. Order matters — Photo 1
        is your likely opening frame.
      </p>

      {photos.length > 0 && (
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
          {photos.map((photo, index) => (
            <div key={photo.id} className="relative rounded-lg overflow-hidden border border-zinc-800 bg-zinc-950 group">
              <img
                src={photo.dataUrl || photo.thumbUrl}
                alt={photo.label || `Photo ${index + 1}`}
                className="w-full h-28 object-cover"
              />
              <span className="absolute top-1 left-1 px-1.5 py-0.5 rounded bg-black/70 text-[10px] font-bold text-white">
                {photo.isDerivedCrop ? `Crop of ${photos.findIndex((p) => p.id === photo.sourcePhotoId) + 1 || '?'}` : `Photo ${index + 1}`}
              </span>
              {!photo.dataUrl && (
                <span className="absolute inset-x-1 bottom-1 px-1.5 py-0.5 rounded bg-amber-600/90 text-[10px] font-medium text-black text-center">
                  Re-attach — full photo was too big to keep after reload
                </span>
              )}
              <div className="absolute top-1 right-1 flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                <button
                  onClick={() => move(index, -1)}
                  disabled={index === 0}
                  title="Move earlier"
                  className="p-1 rounded bg-black/70 text-zinc-300 hover:text-white disabled:opacity-40"
                >
                  <ArrowUp className="w-3 h-3" />
                </button>
                <button
                  onClick={() => move(index, 1)}
                  disabled={index === photos.length - 1}
                  title="Move later"
                  className="p-1 rounded bg-black/70 text-zinc-300 hover:text-white disabled:opacity-40"
                >
                  <ArrowDown className="w-3 h-3" />
                </button>
                <button
                  onClick={() => { setReplaceId(photo.id); replaceRef.current?.click() }}
                  title={photo.dataUrl ? 'Replace this photo' : 'Re-attach this photo'}
                  className="p-1 rounded bg-black/70 text-zinc-300 hover:text-white"
                >
                  <RefreshCw className="w-3 h-3" />
                </button>
                <button
                  onClick={() => applyPhotoChange(photos.filter((item) => item.id !== photo.id))}
                  title="Remove this photo"
                  className="p-1 rounded bg-black/70 text-zinc-300 hover:text-red-400"
                >
                  <X className="w-3 h-3" />
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {mismatch && (
        <p className="text-[11px] text-amber-400/90 leading-4">
          These photos have very different shapes — they can still be analyzed, but pairing them in
          one video may look uneven. Similar orientations work best.
        </p>
      )}

      <input ref={inputRef} type="file" accept="image/*" multiple className="hidden" aria-label="Upload photos"
        onChange={(e) => { void handleFiles(e.target.files); e.target.value = '' }} />
      <input ref={replaceRef} type="file" accept="image/*" className="hidden" aria-label="Replace photo"
        onChange={(e) => { void handleReplace(e.target.files); e.target.value = '' }} />

      <div className="flex items-center gap-2">
        <Button
          onClick={() => inputRef.current?.click()}
          disabled={isProcessing || photos.length >= MAX_PHOTOS}
          size="sm"
          className="bg-zinc-800 text-zinc-200 hover:bg-zinc-700 disabled:opacity-50"
        >
          {isProcessing ? (
            <><Loader2 className="w-3.5 h-3.5 mr-1.5 animate-spin" />Reading photos…</>
          ) : (
            <><ImagePlus className="w-3.5 h-3.5 mr-1.5" />{photos.length === 0 ? 'Add photos' : 'Add another photo'}</>
          )}
        </Button>
        <span className="text-[11px] text-zinc-500">
          {photos.length}/{MAX_PHOTOS} · at least {MIN_PHOTOS} needed
        </span>
        <Button
          onClick={onAnalyze}
          disabled={!canAnalyze}
          size="sm"
          title={photos.length < MIN_PHOTOS
            ? `Add at least ${MIN_PHOTOS} photos first`
            : missingFullRes.length > 0
              ? 'Re-attach the flagged photos first'
              : 'Analyze the photos together — nothing is generated yet'}
          className="ml-auto font-medium bg-linear-to-r from-[#c99850] to-[#dbb56e] text-black hover:from-[#dbb56e] hover:to-[#c99850] disabled:opacity-50"
        >
          {isAnalyzing ? (
            <><Loader2 className="w-3.5 h-3.5 mr-1.5 animate-spin" />Analyzing…</>
          ) : (
            <><Sparkles className="w-3.5 h-3.5 mr-1.5" />Analyze my photos</>
          )}
        </Button>
      </div>
    </div>
  )
}
