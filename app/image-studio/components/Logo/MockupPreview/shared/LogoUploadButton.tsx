"use client"

/**
 * LogoUploadButton Component
 *
 * Reusable button for uploading logos (PNG, JPG, SVG).
 * Supports both click-to-upload and drag-and-drop.
 */

import { useState, useRef } from 'react'
import { Upload, Loader2 } from 'lucide-react'
import { toast } from 'sonner'

interface LogoUploadButtonProps {
  /** Called with the data URL of the uploaded image */
  onUpload: (dataUrl: string) => void
  /** Button label text */
  label?: string
  /** Use compact style for sidebar */
  compact?: boolean
  /** Additional CSS classes */
  className?: string
}

export function LogoUploadButton({
  onUpload,
  label = 'Import Logo',
  compact = false,
  className = ''
}: LogoUploadButtonProps) {
  const [isLoading, setIsLoading] = useState(false)
  const [isDragging, setIsDragging] = useState(false)
  const inputRef = useRef<HTMLInputElement>(null)

  const processFile = (file: File) => {
    // Validate file type
    const validTypes = ['image/png', 'image/jpeg', 'image/jpg', 'image/svg+xml']
    if (!validTypes.includes(file.type)) {
      toast.error('Please upload a PNG, JPG, or SVG file')
      return
    }

    // Validate file size (max 10MB)
    if (file.size > 10 * 1024 * 1024) {
      toast.error('File size must be under 10MB')
      return
    }

    setIsLoading(true)
    const reader = new FileReader()
    reader.onload = (e) => {
      const dataUrl = e.target?.result as string
      onUpload(dataUrl)
      setIsLoading(false)
      toast.success('Logo imported successfully!')
    }
    reader.onerror = () => {
      toast.error('Failed to read file')
      setIsLoading(false)
    }
    reader.readAsDataURL(file)
  }

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file) processFile(file)
    // Reset input so same file can be selected again
    e.target.value = ''
  }

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault()
    setIsDragging(false)
    const file = e.dataTransfer.files?.[0]
    if (file) processFile(file)
  }

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault()
    setIsDragging(true)
  }

  const handleDragLeave = () => {
    setIsDragging(false)
  }

  if (compact) {
    // Compact button style for sidebar
    return (
      <div className="w-full">
        <button
          onClick={() => inputRef.current?.click()}
          disabled={isLoading}
          className={`w-full flex items-center justify-center gap-2 px-3 py-2 rounded-lg text-xs font-extralight transition-all bg-blue-500/20 text-blue-400 border border-blue-500/30 hover:bg-blue-500/30 disabled:opacity-50 disabled:cursor-not-allowed ${className}`}
          title="Import logo from file"
        >
          {isLoading ? (
            <>
              <Loader2 className="w-3.5 h-3.5 animate-spin" />
              <span>Loading...</span>
            </>
          ) : (
            <>
              <Upload className="w-3.5 h-3.5" />
              <span>{label}</span>
            </>
          )}
        </button>
        <input
          ref={inputRef}
          type="file"
          accept="image/png,image/jpeg,image/jpg,image/svg+xml"
          onChange={handleFileSelect}
          className="hidden"
        />
      </div>
    )
  }

  // Full button style with drag-and-drop for header
  return (
    <div className="relative">
      <button
        onClick={() => inputRef.current?.click()}
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
        disabled={isLoading}
        className={`flex items-center gap-2 px-3 py-1.5 rounded-lg text-sm font-medium transition-all whitespace-nowrap ${
          isDragging
            ? 'bg-blue-500/30 text-blue-300 border-blue-500'
            : 'bg-blue-500/20 text-blue-400 border border-blue-500/30 hover:bg-blue-500/30'
        } disabled:opacity-50 disabled:cursor-not-allowed ${className}`}
        title="Import logo from file (PNG, JPG, SVG)"
      >
        {isLoading ? (
          <>
            <Loader2 className="w-4 h-4 animate-spin" />
            Loading...
          </>
        ) : (
          <>
            <Upload className="w-4 h-4" />
            {label}
          </>
        )}
      </button>
      <input
        ref={inputRef}
        type="file"
        accept="image/png,image/jpeg,image/jpg,image/svg+xml"
        onChange={handleFileSelect}
        className="hidden"
      />
    </div>
  )
}
