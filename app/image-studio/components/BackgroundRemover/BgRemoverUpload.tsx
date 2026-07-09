"use client"

/**
 * BgRemoverUpload Component
 *
 * Multi-file drag-drop upload zone for background remover.
 * Supports PNG, JPG, WebP images up to 10MB each.
 */

import { useState, useCallback, useRef } from 'react'
import { Upload, ImageIcon } from 'lucide-react'

interface BgRemoverUploadProps {
  onUpload: (files: File[]) => void
  compact?: boolean  // Smaller version when queue has items
}

const ACCEPTED_TYPES = ['image/png', 'image/jpeg', 'image/jpg', 'image/webp']
const MAX_FILE_SIZE = 10 * 1024 * 1024  // 10MB

export function BgRemoverUpload({ onUpload, compact = false }: BgRemoverUploadProps) {
  const [isDragOver, setIsDragOver] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const inputRef = useRef<HTMLInputElement>(null)

  const validateFiles = useCallback((files: File[]): File[] => {
    const validFiles: File[] = []
    const errors: string[] = []

    for (const file of files) {
      if (!ACCEPTED_TYPES.includes(file.type)) {
        errors.push(`${file.name}: Invalid type (use PNG, JPG, or WebP)`)
        continue
      }
      if (file.size > MAX_FILE_SIZE) {
        errors.push(`${file.name}: File too large (max 10MB)`)
        continue
      }
      validFiles.push(file)
    }

    if (errors.length > 0) {
      setError(errors.join('; '))
      setTimeout(() => setError(null), 5000)
    }

    return validFiles
  }, [])

  const handleFiles = useCallback((files: FileList | File[]) => {
    const fileArray = Array.from(files)
    const validFiles = validateFiles(fileArray)
    if (validFiles.length > 0) {
      onUpload(validFiles)
    }
  }, [onUpload, validateFiles])

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault()
    e.stopPropagation()
    setIsDragOver(true)
  }, [])

  const handleDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault()
    e.stopPropagation()
    setIsDragOver(false)
  }, [])

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault()
    e.stopPropagation()
    setIsDragOver(false)

    if (e.dataTransfer.files.length > 0) {
      handleFiles(e.dataTransfer.files)
    }
  }, [handleFiles])

  const handleClick = useCallback(() => {
    inputRef.current?.click()
  }, [])

  const handleInputChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      handleFiles(e.target.files)
      // Reset input for re-upload of same files
      e.target.value = ''
    }
  }, [handleFiles])

  if (compact) {
    return (
      <div className="mb-4">
        <button
          onClick={handleClick}
          className="flex items-center gap-2 px-4 py-2 rounded-lg bg-zinc-800/80 border border-zinc-700 hover:bg-zinc-700/80 hover:border-zinc-600 transition-all text-sm text-zinc-300"
        >
          <Upload className="w-4 h-4" />
          Add More Images
        </button>
        <input
          ref={inputRef}
          type="file"
          accept={ACCEPTED_TYPES.join(',')}
          multiple
          onChange={handleInputChange}
          className="hidden"
        />
        {error && (
          <p className="mt-2 text-xs text-red-400">{error}</p>
        )}
      </div>
    )
  }

  return (
    <div
      onClick={handleClick}
      onDragOver={handleDragOver}
      onDragLeave={handleDragLeave}
      onDrop={handleDrop}
      className={`
        relative min-h-[320px] flex flex-col items-center justify-center
        rounded-lg border-2 border-dashed cursor-pointer
        transition-all duration-200
        ${isDragOver
          ? 'border-[#c99850] bg-[#c99850]/10'
          : 'border-[#c99850]/40 hover:border-[#c99850]/70 hover:bg-zinc-800/30'
        }
      `}
    >
      <input
        ref={inputRef}
        type="file"
        accept={ACCEPTED_TYPES.join(',')}
        multiple
        onChange={handleInputChange}
        className="hidden"
      />

      {/* Icon */}
      <div
        className="w-12 h-12 rounded-xl flex items-center justify-center mb-3"
        style={{
          background: "linear-gradient(135deg, #c99850 0%, #dbb56e 50%, #c99850 100%)",
        }}
      >
        {isDragOver ? (
          <ImageIcon className="w-6 h-6 text-black" />
        ) : (
          <Upload className="w-6 h-6 text-black" />
        )}
      </div>

      {/* Text */}
      <h3 className="text-base font-semibold text-white mb-1">
        {isDragOver ? 'Drop images here' : 'Drop images or click to upload'}
      </h3>
      <p className="text-xs text-zinc-400 text-center max-w-xs">
        PNG, JPG, WebP • Max 10MB each
      </p>

      {/* Error message */}
      {error && (
        <div className="absolute bottom-4 left-4 right-4">
          <p className="text-sm text-red-400 text-center bg-red-500/10 rounded-lg px-3 py-2">
            {error}
          </p>
        </div>
      )}
    </div>
  )
}
