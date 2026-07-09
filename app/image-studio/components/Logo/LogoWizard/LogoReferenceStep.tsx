"use client"

/**
 * LogoReferenceStep Component
 *
 * Step 0 in the Logo Wizard - Optional logo upload for AI analysis
 * Allows users to upload a reference logo to auto-detect settings
 */

import { useState, useCallback, useRef } from 'react'
import { Upload, X, Sparkles, Loader2, ChevronRight, Check } from 'lucide-react'
import { Input } from '@/components/ui/input'
import { parseAnalysis, type AnalysisResult } from '../../../utils/logo-analysis-parser'

interface LogoReferenceStepProps {
  onAnalysisComplete: (analysis: AnalysisResult, brandName: string) => void
  onSkip: () => void
  analyzing: boolean
  setAnalyzing: (analyzing: boolean) => void
}

export function LogoReferenceStep({
  onAnalysisComplete,
  onSkip,
  analyzing,
  setAnalyzing,
}: LogoReferenceStepProps) {
  const [uploadedFile, setUploadedFile] = useState<File | null>(null)
  const [previewUrl, setPreviewUrl] = useState<string | null>(null)
  const [brandName, setBrandName] = useState('')
  const [analysisComplete, setAnalysisComplete] = useState(false)
  const [analysisResult, setAnalysisResult] = useState<AnalysisResult | null>(null)
  const [error, setError] = useState<string | null>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)

  const handleFileSelect = useCallback((file: File) => {
    // Validate file type
    const validTypes = ['image/png', 'image/jpeg', 'image/webp', 'image/gif']
    if (!validTypes.includes(file.type)) {
      setError('Please upload a PNG, JPG, or WebP image')
      return
    }
    // Validate file size (10MB max)
    if (file.size > 10 * 1024 * 1024) {
      setError('Image must be smaller than 10MB')
      return
    }
    setError(null)
    setUploadedFile(file)
    setPreviewUrl(URL.createObjectURL(file))
    setAnalysisComplete(false)
    setAnalysisResult(null)
  }, [])

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault()
    const file = e.dataTransfer.files[0]
    if (file) handleFileSelect(file)
  }, [handleFileSelect])

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault()
  }, [])

  const handleRemoveImage = useCallback(() => {
    setUploadedFile(null)
    if (previewUrl) URL.revokeObjectURL(previewUrl)
    setPreviewUrl(null)
    setAnalysisComplete(false)
    setAnalysisResult(null)
    setError(null)
  }, [previewUrl])

  const handleAnalyze = async () => {
    // Only require uploaded file - brand name can be extracted from analysis
    if (!uploadedFile) return
    setAnalyzing(true)
    setError(null)

    try {
      const formData = new FormData()
      formData.append('image', uploadedFile)
      formData.append('type', 'logo')
      formData.append('mode', 'quality')

      const response = await fetch('/api/analyze-image', {
        method: 'POST',
        body: formData,
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error || 'Analysis failed')
      }

      const data = await response.json()
      const parsed = parseAnalysis(data.analysis)
      setAnalysisResult(parsed)
      setAnalysisComplete(true)

      // Auto-populate brand name if extracted and user hasn't entered one yet
      if (parsed.brandName && (!brandName.trim() || brandName.trim() === '')) {
        setBrandName(parsed.brandName)
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to analyze logo')
    } finally {
      setAnalyzing(false)
    }
  }

  const handleContinue = () => {
    if (analysisResult && brandName.trim()) {
      onAnalysisComplete(analysisResult, brandName.trim())
    }
  }

  // Can analyze with just the image - brand name will be extracted
  const canAnalyze = uploadedFile && !analyzing
  // Continue requires brand name (either entered or extracted)
  const canContinue = analysisComplete && brandName.trim().length > 0

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="text-center">
        <h3 className="text-xl font-semibold text-white mb-2">
          Have a logo design you&apos;d like to match?
        </h3>
        <p className="text-sm text-zinc-400">
          Upload a reference logo and we&apos;ll detect its style settings
        </p>
        <button
          onClick={onSkip}
          className="inline-flex items-center gap-2 text-base text-purple-400 hover:text-purple-300 mt-4 px-5 py-2.5 rounded-xl hover:bg-purple-500/10 transition-all font-semibold border border-purple-500/30 hover:border-purple-500/50"
        >
          Skip This Step If No Reference Image
          <ChevronRight className="w-5 h-5" />
        </button>
      </div>

      {/* Upload Area or Preview */}
      {!previewUrl ? (
        <div
          onDrop={handleDrop}
          onDragOver={handleDragOver}
          onClick={() => fileInputRef.current?.click()}
          className="border-2 border-dashed border-zinc-600 rounded-xl p-8 text-center cursor-pointer hover:border-purple-500 hover:bg-purple-500/5 transition-all"
        >
          <Upload className="w-10 h-10 text-zinc-500 mx-auto mb-3" />
          <p className="text-sm text-zinc-300 mb-1">Drag & drop or click to upload</p>
          <p className="text-xs text-zinc-500">PNG, JPG, WebP - max 10MB</p>
          <input
            ref={fileInputRef}
            type="file"
            accept="image/png,image/jpeg,image/webp"
            onChange={(e) => e.target.files?.[0] && handleFileSelect(e.target.files[0])}
            className="hidden"
          />
        </div>
      ) : (
        <div className="relative">
          <div className="flex gap-4 items-start">
            {/* Preview Image */}
            <div className="relative w-32 h-32 rounded-lg overflow-hidden bg-zinc-800 shrink-0">
              <img
                src={previewUrl}
                alt="Uploaded logo"
                className="w-full h-full object-contain"
              />
              <button
                onClick={handleRemoveImage}
                className="absolute top-1 right-1 p-1 bg-black/60 rounded-full hover:bg-black/80 transition-colors"
              >
                <X className="w-4 h-4 text-white" />
              </button>
            </div>

            {/* Status / Results */}
            <div className="flex-1 min-w-0">
              {analyzing ? (
                <div className="flex items-center gap-3 text-purple-400">
                  <Loader2 className="w-5 h-5 animate-spin" />
                  <span>Analyzing your logo...</span>
                </div>
              ) : analysisComplete && analysisResult ? (
                <div className="space-y-2">
                  <div className="flex items-center gap-2 text-green-400">
                    <Check className="w-5 h-5" />
                    <span className="font-medium">Analysis Complete</span>
                    {analysisResult.confidence > 0 && (
                      <span className="text-xs text-zinc-400">({analysisResult.confidence}% confidence)</span>
                    )}
                  </div>
                  <div className="text-xs text-zinc-400 grid grid-cols-2 gap-x-4 gap-y-1">
                    {/* NEW: Show extracted brand name prominently */}
                    {analysisResult.brandName && (
                      <p className="col-span-2 text-sm mb-1">
                        Brand Name: <span className="text-purple-400 font-medium">{analysisResult.brandName}</span>
                      </p>
                    )}
                    <p>Industry: <span className="text-zinc-200 capitalize">{analysisResult.industry}</span></p>
                    <p>Style: <span className="text-zinc-200 capitalize">{analysisResult.style}</span></p>
                    <p>Colors: <span className="text-zinc-200 capitalize">{analysisResult.colors.join(', ')}</span></p>
                    <p>Depth: <span className="text-zinc-200 capitalize">{analysisResult.depth}</span></p>
                    {analysisResult.metallic !== 'none' && (
                      <p>Metallic: <span className="text-zinc-200 capitalize">{analysisResult.metallic}</span></p>
                    )}
                    {analysisResult.glow !== 'none' && (
                      <p>Glow: <span className="text-zinc-200 capitalize">{analysisResult.glow}</span></p>
                    )}
                    {/* NEW: Show frame if detected */}
                    {analysisResult.frameShape && analysisResult.frameShape !== 'none' && (
                      <p>Frame: <span className="text-zinc-200 capitalize">
                        {analysisResult.frameMaterial && analysisResult.frameMaterial !== 'none'
                          ? `${analysisResult.frameMaterial} ${analysisResult.frameShape}`
                          : analysisResult.frameShape}
                      </span></p>
                    )}
                    {/* NEW: Show icon if detected */}
                    {analysisResult.iconType && analysisResult.iconType !== 'none' && (
                      <p>Icon: <span className="text-zinc-200 capitalize">{analysisResult.iconType}</span></p>
                    )}
                    {analysisResult.pattern !== 'none' && (
                      <p>Pattern: <span className="text-zinc-200 capitalize">{analysisResult.pattern}</span></p>
                    )}
                    {analysisResult.effects.length > 0 && (
                      <p className="col-span-2">Effects: <span className="text-zinc-200 capitalize">{analysisResult.effects.join(', ')}</span></p>
                    )}
                  </div>
                </div>
              ) : (
                <p className="text-sm text-zinc-400">
                  Upload a logo to analyze - we&apos;ll extract the brand name automatically
                </p>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Brand Name Input */}
      <div className="space-y-2">
        <label className="text-sm font-medium text-zinc-300">
          Brand Name <span className="text-red-400">*</span>
        </label>
        <Input
          value={brandName}
          onChange={(e) => setBrandName(e.target.value)}
          placeholder="Enter your brand name..."
          className="bg-zinc-800 border-zinc-700 text-white placeholder:text-zinc-500 h-11"
          disabled={analyzing}
        />
        <p className="text-xs text-zinc-500">
          {analysisComplete && analysisResult?.brandName
            ? "Extracted from your logo - edit if needed"
            : "Enter manually or it will be extracted from your logo"}
        </p>
      </div>

      {/* Error Message */}
      {error && (
        <p className="text-sm text-red-400 text-center">{error}</p>
      )}

      {/* Action Buttons */}
      <div className="flex items-center justify-between pt-2">
        <button
          onClick={onSkip}
          disabled={analyzing}
          className="flex items-center gap-2 px-5 py-2.5 text-base text-purple-400 hover:text-purple-300 transition-colors disabled:opacity-50 font-medium rounded-lg hover:bg-purple-500/10"
        >
          Skip If No Reference
          <ChevronRight className="w-5 h-5" />
        </button>

        {!analysisComplete ? (
          <button
            onClick={handleAnalyze}
            disabled={!canAnalyze}
            className={`flex items-center gap-2 px-6 py-2.5 rounded-lg font-medium transition-all ${
              canAnalyze
                ? 'bg-linear-to-r from-purple-500 to-pink-500 text-white hover:opacity-90'
                : 'bg-zinc-800 text-zinc-500 cursor-not-allowed'
            }`}
          >
            {analyzing ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                Analyzing...
              </>
            ) : (
              <>
                <Sparkles className="w-4 h-4" />
                Analyze Logo
              </>
            )}
          </button>
        ) : (
          <button
            onClick={handleContinue}
            className="flex items-center gap-2 px-6 py-2.5 rounded-lg font-medium bg-linear-to-r from-purple-500 to-pink-500 text-white hover:opacity-90 transition-all"
          >
            See Your Logo Variations
            <ChevronRight className="w-4 h-4" />
          </button>
        )}
      </div>
    </div>
  )
}
