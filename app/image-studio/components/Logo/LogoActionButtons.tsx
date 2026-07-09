"use client"

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import {
  Type,
  Download,
  Copy,
  Check,
  FileCode,
  Eraser,
  Maximize2,
  Heart,
  Loader2,
  Sparkles,
  Scissors,
  CreditCard,
  ALargeSmall,
  ChevronDown,
  FileImage,
  FileText
} from 'lucide-react'
import { GeneratedLogo } from '../../hooks/useLogoGeneration'
import { BrandKitButton } from './BrandKitButton'

interface LogoActionButtonsProps {
  generatedLogo: GeneratedLogo
  onShowTextEditor: () => void
  onToggleEraserMode: () => void
  isEraserMode: boolean
  onDownload: () => void
  onExportSvg: () => void
  isExportingSvg: boolean
  onExportPdf: () => void
  isExportingPdf: boolean
  onCopyToClipboard: () => void
  copied: boolean
  onUpscale: (resolution: '2K' | '4K', method: 'ai' | 'fast') => void
  isUpscaling: boolean
  onToggleFavorite: () => void
  isFavorite: boolean
  isFavoriteToggling: boolean
  onRemoveBackground: () => void
  isRemovingBackground: boolean
  onShowMockup?: () => void
  onShowRealFontOverlay?: () => void
}

export function LogoActionButtons({
  generatedLogo,
  onShowTextEditor,
  onToggleEraserMode,
  isEraserMode,
  onDownload,
  onExportSvg,
  isExportingSvg,
  onExportPdf,
  isExportingPdf,
  onCopyToClipboard,
  copied,
  onUpscale,
  isUpscaling,
  onToggleFavorite,
  isFavorite,
  isFavoriteToggling,
  onRemoveBackground,
  isRemovingBackground,
  onShowMockup,
  onShowRealFontOverlay,
}: LogoActionButtonsProps) {
  const [showUpscaleMenu, setShowUpscaleMenu] = useState(false)
  const [showExportMenu, setShowExportMenu] = useState(false)
  const isExporting = isExportingSvg || isExportingPdf
  const needsExactText = generatedLogo.textMode === 'exact-text-overlay'

  const handleUpscale = (resolution: '2K' | '4K', method: 'ai' | 'fast') => {
    setShowUpscaleMenu(false)
    onUpscale(resolution, method)
  }

  return (
    <div className="grid grid-cols-7 gap-1">
      <Button
        onClick={onShowTextEditor}
        size="sm"
        className="h-8 bg-zinc-800 hover:bg-zinc-700 text-white border border-zinc-700 text-xs"
      >
        <Type className="w-3 h-3 mr-1" />
        Text
      </Button>
      <Button
        onClick={onToggleEraserMode}
        size="sm"
        className={`h-8 ${isEraserMode ? 'bg-[#c99850] text-black' : 'bg-zinc-800 hover:bg-zinc-700 text-white'} border border-zinc-700 text-xs`}
      >
        <Eraser className="w-3 h-3 mr-1" />
        Clean
      </Button>
      <Button
        onClick={onRemoveBackground}
        disabled={isRemovingBackground}
        size="sm"
        className="h-8 bg-zinc-800 hover:bg-zinc-700 text-white border border-zinc-700 text-xs"
      >
        {isRemovingBackground ? (
          <Loader2 className="w-3 h-3 mr-1 animate-spin" />
        ) : (
          <Scissors className="w-3 h-3 mr-1" />
        )}
        {isRemovingBackground ? '...' : 'BG'}
      </Button>
      {/* Export Dropdown */}
      <div className="relative col-span-2">
        <Button
          onClick={() => setShowExportMenu(!showExportMenu)}
          disabled={isExporting}
          size="sm"
          className="h-8 w-full bg-linear-to-r from-purple-500 to-pink-500 hover:opacity-90 text-white border-0 text-xs"
        >
          {isExporting ? (
            <Loader2 className="w-3 h-3 mr-1 animate-spin" />
          ) : (
            <Download className="w-3 h-3 mr-1" />
          )}
          Export
          <ChevronDown className="w-3 h-3 ml-1" />
        </Button>

        {showExportMenu && !isExporting && (
          <div className="absolute bottom-full mb-1 left-0 bg-zinc-800 border border-zinc-700 rounded-lg shadow-xl z-30 overflow-hidden min-w-[130px]">
            <button
              onClick={() => { onDownload(); setShowExportMenu(false) }}
              className="flex items-center gap-2 w-full px-3 py-2 text-sm text-zinc-300 hover:bg-zinc-700 hover:text-white"
            >
              <FileImage className="w-4 h-4" />
              PNG Image
            </button>
            <button
              onClick={() => { onExportSvg(); setShowExportMenu(false) }}
              className="flex items-center gap-2 w-full px-3 py-2 text-sm text-zinc-300 hover:bg-zinc-700 hover:text-white"
            >
              <FileCode className="w-4 h-4" />
              SVG Vector
            </button>
            <button
              onClick={() => { onExportPdf(); setShowExportMenu(false) }}
              className="flex items-center gap-2 w-full px-3 py-2 text-sm text-zinc-300 hover:bg-zinc-700 hover:text-white"
            >
              <FileText className="w-4 h-4" />
              PDF Document
            </button>
          </div>
        )}
      </div>
      <Button
        onClick={onCopyToClipboard}
        size="sm"
        className="h-8 bg-zinc-800 hover:bg-zinc-700 text-white border border-zinc-700 text-xs"
      >
        {copied ? (
          <Check className="w-3 h-3 mr-1 text-green-400" />
        ) : (
          <Copy className="w-3 h-3 mr-1" />
        )}
        Copy
      </Button>

      {/* Upscale Button with Dropdown */}
      <div className="relative">
        <Button
          onClick={() => setShowUpscaleMenu(!showUpscaleMenu)}
          disabled={isUpscaling}
          size="sm"
          className="h-8 w-full bg-zinc-800 hover:bg-zinc-700 text-white border border-zinc-700 text-xs"
        >
          {isUpscaling ? (
            <Loader2 className="w-3 h-3 mr-1 animate-spin" />
          ) : (
            <Maximize2 className="w-3 h-3 mr-1" />
          )}
          {isUpscaling ? '...' : 'Scale'}
        </Button>
        {showUpscaleMenu && (
          <div className="absolute bottom-full left-0 mb-1 w-32 bg-zinc-800 border border-zinc-700 rounded-lg shadow-lg overflow-hidden z-10">
            <div className="px-2 py-1 text-[9px] text-zinc-500 bg-zinc-900 border-b border-zinc-700">
              AI Enhanced (crisp)
            </div>
            <button
              onClick={() => handleUpscale('2K', 'ai')}
              className="w-full px-3 py-1.5 text-xs text-white hover:bg-zinc-700 text-left flex items-center gap-1"
            >
              <Sparkles className="w-3 h-3 text-[#dbb56e]" />
              2K AI
            </button>
            <button
              onClick={() => handleUpscale('4K', 'ai')}
              className="w-full px-3 py-1.5 text-xs text-white hover:bg-zinc-700 text-left flex items-center gap-1 border-b border-zinc-700"
            >
              <Sparkles className="w-3 h-3 text-[#dbb56e]" />
              4K AI
            </button>
            <div className="px-2 py-1 text-[9px] text-zinc-500 bg-zinc-900 border-b border-zinc-700">
              Basic (fast, free)
            </div>
            <button
              onClick={() => handleUpscale('2K', 'fast')}
              className="w-full px-3 py-1.5 text-xs text-zinc-400 hover:bg-zinc-700 text-left"
            >
              2K Fast
            </button>
            <button
              onClick={() => handleUpscale('4K', 'fast')}
              className="w-full px-3 py-1.5 text-xs text-zinc-400 hover:bg-zinc-700 text-left"
            >
              4K Fast
            </button>
          </div>
        )}
      </div>

      {/* Favorite Button */}
      <Button
        onClick={onToggleFavorite}
        disabled={isFavoriteToggling}
        size="sm"
        className={`h-8 ${isFavorite ? 'bg-red-500 hover:bg-red-600 text-white' : 'bg-zinc-800 hover:bg-zinc-700 text-white'} border border-zinc-700 text-xs`}
      >
        {isFavoriteToggling ? (
          <Loader2 className="w-3 h-3 mr-1 animate-spin" />
        ) : (
          <Heart className={`w-3 h-3 mr-1 ${isFavorite ? 'fill-white' : ''}`} />
        )}
        {isFavorite ? 'Saved' : 'Fav'}
      </Button>

      {/* Second Row - Brand Kit, Real Font & Mockup Buttons */}
      <div className="col-span-8 flex gap-1 mt-1">
        <BrandKitButton generatedLogo={generatedLogo} />
        {onShowRealFontOverlay && (
            <Button
              onClick={onShowRealFontOverlay}
              size="sm"
              className={`h-8 flex-1 border text-xs ${
                needsExactText
                  ? 'bg-[#c99850]/20 hover:bg-[#c99850]/30 text-[#dbb56e] border-[#c99850]/40'
                  : 'bg-linear-to-r from-purple-500/20 to-pink-500/20 hover:from-purple-500/30 hover:to-pink-500/30 text-purple-400 border-purple-500/30'
              }`}
            >
              <ALargeSmall className="w-3 h-3 mr-1.5" />
              {needsExactText ? 'Add Exact Text' : 'Real Font Overlay'}
            </Button>
          )}
        {onShowMockup && (
          <Button
            onClick={onShowMockup}
            size="sm"
            className="h-8 flex-1 bg-linear-to-r from-blue-500/20 to-cyan-500/20 hover:from-blue-500/30 hover:to-cyan-500/30 text-cyan-400 border border-cyan-500/30 text-xs"
          >
            <CreditCard className="w-3 h-3 mr-1.5" />
            Preview on Mockups
          </Button>
        )}
      </div>
    </div>
  )
}
