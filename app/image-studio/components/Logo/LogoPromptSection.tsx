"use client"

import { useRef, useState, useCallback, useEffect } from 'react'
import { Upload, X, GripHorizontal, Sparkles, Loader2, Copy, Lightbulb } from 'lucide-react'
import { Tooltip, TooltipTrigger, TooltipContent } from '@/components/ui/tooltip'

interface ReferenceImage {
  file: File
  preview: string
}

interface LogoPromptSectionProps {
  prompt: string
  setPrompt: (value: string) => void
  negativePrompt: string
  setNegativePrompt: (value: string) => void
  referenceImage: ReferenceImage | null
  setReferenceImage: (image: ReferenceImage | null) => void
  referenceMode: 'replicate' | 'inspire'
  setReferenceMode: (mode: 'replicate' | 'inspire') => void
  removeBackgroundOnly: boolean
  setRemoveBackgroundOnly: (value: boolean) => void
  isGenerating: boolean
  isRemovingBackground: boolean
}

export function LogoPromptSection({
  prompt,
  setPrompt,
  negativePrompt,
  setNegativePrompt,
  referenceImage,
  setReferenceImage,
  referenceMode,
  setReferenceMode,
  removeBackgroundOnly,
  setRemoveBackgroundOnly,
  isGenerating,
  isRemovingBackground,
}: LogoPromptSectionProps) {
  const fileInputRef = useRef<HTMLInputElement>(null)
  const textareaRef = useRef<HTMLTextAreaElement>(null)
  const [textareaHeight, setTextareaHeight] = useState(120)
  const [isDragging, setIsDragging] = useState(false)
  const [isEnhancing, setIsEnhancing] = useState(false)
  const dragStartY = useRef(0)
  const dragStartHeight = useRef(0)

  // AI Enhance handler
  const handleAIEnhance = async () => {
    if (!prompt.trim()) return

    setIsEnhancing(true)
    try {
      const response = await fetch('/api/enhance-logo-prompt', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ prompt }),
      })
      const data = await response.json()
      if (data.enhancedPrompt) {
        setPrompt(data.enhancedPrompt)
      }
      if (data.negativePrompt) {
        setNegativePrompt(data.negativePrompt)
      }
    } catch (error) {
      console.error('Failed to enhance prompt:', error)
    } finally {
      setIsEnhancing(false)
    }
  }

  // Handle drag to resize textarea
  const handleDragStart = useCallback((e: React.MouseEvent) => {
    e.preventDefault()
    setIsDragging(true)
    dragStartY.current = e.clientY
    dragStartHeight.current = textareaHeight
  }, [textareaHeight])

  useEffect(() => {
    if (!isDragging) return

    const handleMouseMove = (e: MouseEvent) => {
      const deltaY = e.clientY - dragStartY.current
      const newHeight = Math.min(Math.max(dragStartHeight.current + deltaY, 64), 600)
      setTextareaHeight(newHeight)
    }

    const handleMouseUp = () => {
      setIsDragging(false)
    }

    document.addEventListener('mousemove', handleMouseMove)
    document.addEventListener('mouseup', handleMouseUp)

    return () => {
      document.removeEventListener('mousemove', handleMouseMove)
      document.removeEventListener('mouseup', handleMouseUp)
    }
  }, [isDragging])

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file && file.type.startsWith('image/')) {
      const preview = URL.createObjectURL(file)
      setReferenceImage({ file, preview })
    }
  }

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault()
    const file = e.dataTransfer.files?.[0]
    if (file && file.type.startsWith('image/')) {
      const preview = URL.createObjectURL(file)
      setReferenceImage({ file, preview })
    }
  }

  const clearReferenceImage = () => {
    if (referenceImage?.preview) {
      URL.revokeObjectURL(referenceImage.preview)
    }
    setReferenceImage(null)
    if (fileInputRef.current) {
      fileInputRef.current.value = ''
    }
  }

  return (
    <div className="space-y-3">
      {/* Prompt Input */}
      <div className="space-y-1">
        <label className="text-xs text-zinc-400">
          Describe your logo {referenceImage && <span className="text-zinc-500">(optional with reference)</span>}
        </label>
        <div className="relative">
          <textarea
            ref={textareaRef}
            value={prompt}
            onChange={(e) => setPrompt(e.target.value)}
            placeholder={referenceImage
              ? "Optional: describe changes or leave empty to recreate the reference..."
              : "e.g., A playful dog mascot for a pet store, A coffee cup icon for a cafe..."}
            style={{ height: textareaHeight }}
            className="w-full px-3 py-2 bg-zinc-800/50 border border-zinc-700 rounded-t-lg text-sm text-white placeholder:text-zinc-500 focus:outline-none focus:border-[#c99850] resize-none"
            disabled={isGenerating}
          />
          {/* Drag Handle */}
          <div
            onMouseDown={handleDragStart}
            className={`w-full h-4 bg-zinc-800/80 border-x border-b border-zinc-700 rounded-b-lg cursor-ns-resize flex items-center justify-center transition-colors hover:bg-zinc-700/80 ${isDragging ? 'bg-zinc-600/80' : ''}`}
          >
            <GripHorizontal className="w-4 h-3 text-zinc-500" />
          </div>
        </div>

        {/* AI Enhance Button */}
        <button
          onClick={handleAIEnhance}
          disabled={isEnhancing || !prompt.trim() || isGenerating}
          className="flex items-center justify-center gap-2 w-full px-3 py-2 bg-linear-to-r from-purple-600 to-pink-600 hover:from-purple-500 hover:to-pink-500 disabled:from-zinc-700 disabled:to-zinc-700 disabled:cursor-not-allowed text-white text-xs font-medium rounded-lg transition-all"
        >
          {isEnhancing ? (
            <>
              <Loader2 className="w-3.5 h-3.5 animate-spin" />
              Enhancing...
            </>
          ) : (
            <>
              <Sparkles className="w-3.5 h-3.5" />
              AI Enhance Prompt
            </>
          )}
        </button>
      </div>

      {/* Negative Prompt Input */}
      <div className="space-y-1">
        <label className="text-xs text-zinc-400">
          Avoid (optional) <span className="text-zinc-500">- what NOT to include</span>
        </label>
        <input
          value={negativePrompt}
          onChange={(e) => setNegativePrompt(e.target.value)}
          placeholder="e.g., text, watermark, blurry, complex, realistic photo..."
          className="w-full px-3 py-2 bg-zinc-800/50 border border-zinc-700 rounded-lg text-sm text-white placeholder:text-zinc-500 focus:outline-none focus:border-[#c99850]"
          disabled={isGenerating}
        />
      </div>

      {/* Reference Image Upload */}
      <div className="space-y-1">
        <label className="text-xs text-zinc-400">Reference Image (optional)</label>
        <input
          ref={fileInputRef}
          type="file"
          accept="image/*"
          onChange={handleFileSelect}
          className="hidden"
        />

        {!referenceImage ? (
          <div
            onClick={() => fileInputRef.current?.click()}
            onDrop={handleDrop}
            onDragOver={(e) => e.preventDefault()}
            className="border border-dashed border-zinc-700 rounded-lg p-2 text-center cursor-pointer hover:border-[#c99850] hover:bg-zinc-800/30 transition-all"
          >
            <div className="flex items-center justify-center gap-2">
              <Upload className="w-4 h-4 text-zinc-500" />
              <p className="text-xs text-zinc-400">
                Drop or <span className="text-[#dbb56e]">click to upload</span>
              </p>
            </div>
          </div>
        ) : (
          <div className="space-y-2">
            <div className="relative w-full">
              <div className="w-full h-14 rounded-lg overflow-hidden border border-zinc-700 bg-zinc-800">
                <img
                  src={referenceImage.preview}
                  alt="Reference"
                  className="w-full h-full object-contain"
                />
              </div>
              <button
                onClick={clearReferenceImage}
                className="absolute top-1 right-1 w-5 h-5 bg-red-500 hover:bg-red-600 rounded-full flex items-center justify-center transition-colors shadow-lg"
              >
                <X className="w-3 h-3 text-white" />
              </button>
            </div>

            {/* Replicate / Inspire Mode Toggle */}
            <div className="flex items-center gap-1 p-1 bg-zinc-800/50 rounded-lg border border-zinc-700">
              <Tooltip>
                <TooltipTrigger asChild>
                  <button
                    onClick={() => setReferenceMode('replicate')}
                    disabled={isGenerating}
                    className={`flex-1 flex items-center justify-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-medium transition-all ${
                      referenceMode === 'replicate'
                        ? 'bg-purple-500/20 text-purple-400 border border-purple-500/30'
                        : 'text-zinc-400 hover:text-white hover:bg-zinc-700'
                    }`}
                  >
                    <Copy className="w-3 h-3" />
                    Replicate
                  </button>
                </TooltipTrigger>
                <TooltipContent side="bottom">
                  <p className="text-xs">Exact reproduction - ignores style settings</p>
                </TooltipContent>
              </Tooltip>

              <Tooltip>
                <TooltipTrigger asChild>
                  <button
                    onClick={() => setReferenceMode('inspire')}
                    disabled={isGenerating}
                    className={`flex-1 flex items-center justify-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-medium transition-all ${
                      referenceMode === 'inspire'
                        ? 'bg-amber-500/20 text-amber-400 border border-amber-500/30'
                        : 'text-zinc-400 hover:text-white hover:bg-zinc-700'
                    }`}
                  >
                    <Lightbulb className="w-3 h-3" />
                    Inspire
                  </button>
                </TooltipTrigger>
                <TooltipContent side="bottom">
                  <p className="text-xs">Use as inspiration - applies style settings</p>
                </TooltipContent>
              </Tooltip>
            </div>
          </div>
        )}

        {/* Remove Background Only Option */}
        {referenceImage && (
          <label className="flex items-center gap-2 mt-2 cursor-pointer group">
            <input
              type="checkbox"
              checked={removeBackgroundOnly}
              onChange={(e) => setRemoveBackgroundOnly(e.target.checked)}
              disabled={isGenerating || isRemovingBackground}
              className="w-4 h-4 rounded border-zinc-600 bg-zinc-800 text-[#c99850] focus:ring-[#c99850] focus:ring-offset-0 cursor-pointer"
            />
            <span className="text-xs text-zinc-400 group-hover:text-zinc-300 transition-colors">
              Remove background only <span className="text-zinc-500">(don't generate new logo)</span>
            </span>
          </label>
        )}
      </div>
    </div>
  )
}
