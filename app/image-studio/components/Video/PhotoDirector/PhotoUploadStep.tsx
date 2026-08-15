"use client"

import { useRef, useState } from 'react'
import { toast } from 'sonner'
import { Button } from '@/components/ui/button'
import {
  Dialog, DialogClose, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle,
} from '@/components/ui/dialog'
import { ArrowDown, ArrowRight, ArrowUp, ImagePlus, Loader2, RefreshCw, Sparkles, X } from 'lucide-react'
import { processPhotoFiles, hasExtremeDimensionMismatch } from './photo-intake'
import {
  appendDirectorPhotos,
  moveDirectorPhoto,
  resetDirectorAnalysis,
  setDirectorPhotos,
  setDirectorStep,
  useDirectorProject,
} from './useDirectorProject'
import { MIN_PHOTOS, MAX_PHOTOS } from '../../../constants/photo-director'

interface PhotoUploadStepProps {
  onAnalyze: () => void
  isAnalyzing: boolean
}

/** A photo edit that would make an existing analysis wrong. */
type PendingEdit = { kind: 'remove' | 'replace'; photoId: string }

/** Step 1 — upload, reorder, replace, and remove the source photographs. */
export function PhotoUploadStep({ onAnalyze, isAnalyzing }: PhotoUploadStepProps) {
  const project = useDirectorProject()
  const inputRef = useRef<HTMLInputElement>(null)
  const replaceRef = useRef<HTMLInputElement>(null)
  const [replaceId, setReplaceId] = useState<string | null>(null)
  const [pendingEdit, setPendingEdit] = useState<PendingEdit | null>(null)
  const [isProcessing, setIsProcessing] = useState(false)
  const photos = project?.photos ?? []
  const hasAnalysis = Boolean(project?.analysis)

  const startReplace = (photoId: string) => {
    setReplaceId(photoId)
    replaceRef.current?.click()
  }

  /** Remove/replace makes a prior analysis wrong — clear it and everything downstream. */
  const commitDestructive = (edit: PendingEdit) => {
    if (hasAnalysis) {
      resetDirectorAnalysis()
      toast.info('Analysis cleared — these photos no longer match it')
    }
    if (edit.kind === 'remove') {
      setDirectorPhotos(photos.filter((photo) => photo.id !== edit.photoId))
    } else {
      startReplace(edit.photoId)
    }
  }

  const requestDestructive = (edit: PendingEdit) => {
    if (hasAnalysis) setPendingEdit(edit)
    else commitDestructive(edit)
  }

  const handleFiles = async (files: FileList | null) => {
    if (!files || files.length === 0) return
    setIsProcessing(true)
    try {
      const { photos: added, errors } = await processPhotoFiles(Array.from(files), photos)
      errors.forEach((message) => toast.error(message))
      // Appending keeps every existing photo index valid, so the analysis survives.
      if (added.length > 0) {
        appendDirectorPhotos(added)
        if (hasAnalysis) toast.info('Photo added — re-analyze to include it in the AI\'s findings')
      }
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
        setDirectorPhotos(photos.map((photo) => (photo.id === replaceId ? added[0] : photo)))
      }
    } finally {
      setIsProcessing(false)
      setReplaceId(null)
    }
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

      {hasAnalysis && (
        <div className="flex items-center gap-2 rounded-lg border border-[#c99850]/30 bg-zinc-950 px-2.5 py-2">
          <p className="flex-1 text-[11px] text-zinc-300 leading-4">
            Your analysis and shot plan for these photos are saved — reordering keeps them.
          </p>
          <Button
            onClick={() => setDirectorStep('analysis')}
            size="sm"
            className="h-6 px-2 text-[10px] bg-zinc-800 text-zinc-200 hover:bg-zinc-700 shrink-0"
          >
            Back to analysis
            <ArrowRight className="w-3 h-3 ml-1" />
          </Button>
        </div>
      )}

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
                  onClick={() => moveDirectorPhoto(index, -1)}
                  disabled={index === 0}
                  title="Move earlier — your analysis is kept"
                  className="p-1 rounded bg-black/70 text-zinc-300 hover:text-white disabled:opacity-40"
                >
                  <ArrowUp className="w-3 h-3" />
                </button>
                <button
                  onClick={() => moveDirectorPhoto(index, 1)}
                  disabled={index === photos.length - 1}
                  title="Move later — your analysis is kept"
                  className="p-1 rounded bg-black/70 text-zinc-300 hover:text-white disabled:opacity-40"
                >
                  <ArrowDown className="w-3 h-3" />
                </button>
                <button
                  onClick={() => photo.dataUrl ? requestDestructive({ kind: 'replace', photoId: photo.id }) : startReplace(photo.id)}
                  title={photo.dataUrl ? 'Replace this photo' : 'Re-attach this photo'}
                  className="p-1 rounded bg-black/70 text-zinc-300 hover:text-white"
                >
                  <RefreshCw className="w-3 h-3" />
                </button>
                <button
                  onClick={() => requestDestructive({ kind: 'remove', photoId: photo.id })}
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
              : hasAnalysis
                ? 'Run a fresh analysis — this replaces the saved findings and your corrections'
                : 'Analyze the photos together — nothing is generated yet'}
          className="ml-auto font-medium bg-linear-to-r from-[#c99850] to-[#dbb56e] text-black hover:from-[#dbb56e] hover:to-[#c99850] disabled:opacity-50"
        >
          {isAnalyzing ? (
            <><Loader2 className="w-3.5 h-3.5 mr-1.5 animate-spin" />Analyzing…</>
          ) : (
            <><Sparkles className="w-3.5 h-3.5 mr-1.5" />{hasAnalysis ? 'Re-analyze my photos' : 'Analyze my photos'}</>
          )}
        </Button>
      </div>

      <Dialog open={pendingEdit !== null} onOpenChange={(open) => { if (!open) setPendingEdit(null) }}>
        <DialogContent className="max-w-md bg-zinc-950 border-zinc-800">
          <DialogHeader>
            <DialogTitle className="text-white">
              {pendingEdit?.kind === 'remove' ? 'Remove this photo?' : 'Replace this photo?'}
            </DialogTitle>
            <DialogDescription className="text-zinc-400">
              The AI&apos;s analysis was built from your current photos, so changing them clears it
              along with your corrections, concepts, and shot plan. Generated clips are kept in your
              video history. To change the running order instead, use the arrows — that keeps everything.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <DialogClose asChild>
              <button className="px-4 py-2 rounded-lg text-sm font-medium bg-zinc-900 text-zinc-300 hover:bg-zinc-800 border border-zinc-800 transition-colors">
                Cancel
              </button>
            </DialogClose>
            <button
              onClick={() => { if (pendingEdit) commitDestructive(pendingEdit); setPendingEdit(null) }}
              className="px-4 py-2 rounded-lg text-sm font-medium bg-linear-to-r from-[#c99850] to-[#dbb56e] text-black hover:opacity-90 transition-opacity"
            >
              {pendingEdit?.kind === 'remove' ? 'Remove photo' : 'Choose replacement'}
            </button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
