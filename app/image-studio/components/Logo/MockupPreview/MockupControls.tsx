"use client"

/**
 * Mockup Controls Component
 * Bottom controls: Reset button, Save to History, Change Image, and Export dropdown (PNG/SVG/PDF)
 */

import { useRef } from 'react'
import { RotateCcw, Download, ChevronDown, Loader2, FileImage, FileCode, FileText, Save, Upload } from 'lucide-react'

interface MockupControlsProps {
  isExporting: boolean
  showExportMenu: boolean
  onReset: () => void
  onToggleExportMenu: () => void
  onExportPNG: () => void
  onExportSVG: () => void
  onExportPDF: () => void
  /** Callback to save mockup to history */
  onSaveToHistory?: () => void
  /** Whether save is in progress */
  isSavingToHistory?: boolean
  /** Callback when product image is changed */
  onChangeProductImage?: (url: string) => void
  /** Whether to show the Change button (for custom uploads) */
  showChangeButton?: boolean
}

export function MockupControls({
  isExporting,
  showExportMenu,
  onReset,
  onToggleExportMenu,
  onExportPNG,
  onExportSVG,
  onExportPDF,
  onSaveToHistory,
  isSavingToHistory,
  onChangeProductImage,
  showChangeButton,
}: MockupControlsProps) {
  const fileInputRef = useRef<HTMLInputElement>(null)

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file && file.type.startsWith('image/')) {
      const url = URL.createObjectURL(file)
      onChangeProductImage?.(url)
    }
    // Reset input for re-upload
    if (fileInputRef.current) {
      fileInputRef.current.value = ''
    }
  }
  return (
    <div className="flex justify-center gap-2">
      <button
        onClick={onReset}
        className="flex items-center gap-1.5 px-3 py-1.5 text-zinc-400 hover:text-white bg-zinc-800 hover:bg-zinc-700 rounded-lg border border-zinc-700 text-sm"
        title="Reset position & size"
      >
        <RotateCcw className="w-4 h-4" />
        Reset
      </button>

      {/* Save to History Button */}
      {onSaveToHistory && (
        <button
          onClick={onSaveToHistory}
          disabled={isSavingToHistory}
          className="flex items-center gap-1.5 px-3 py-1.5 text-emerald-400 hover:text-emerald-300 bg-emerald-500/10 hover:bg-emerald-500/20 rounded-lg border border-emerald-500/30 text-sm disabled:opacity-50 disabled:cursor-not-allowed"
          title="Save mockup to history"
        >
          {isSavingToHistory ? (
            <>
              <Loader2 className="w-4 h-4 animate-spin" />
              Saving...
            </>
          ) : (
            <>
              <Save className="w-4 h-4" />
              To History
            </>
          )}
        </button>
      )}

      {/* Change Product Image Button */}
      {showChangeButton && onChangeProductImage && (
        <>
          <button
            onClick={() => fileInputRef.current?.click()}
            className="flex items-center gap-1.5 px-3 py-1.5 text-zinc-400 hover:text-white bg-zinc-800 hover:bg-zinc-700 rounded-lg border border-zinc-700 text-sm"
            title="Change product image"
          >
            <Upload className="w-4 h-4" />
            Change
          </button>
          <input
            ref={fileInputRef}
            type="file"
            accept="image/*"
            onChange={handleFileSelect}
            className="hidden"
          />
        </>
      )}

      {/* Export Dropdown */}
      <div className="relative">
        <button
          onClick={onToggleExportMenu}
          disabled={isExporting}
          className="flex items-center gap-1.5 px-4 py-1.5 bg-linear-to-r from-purple-500 to-pink-500 hover:opacity-90 rounded-lg text-sm text-white font-medium disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {isExporting ? (
            <>
              <Loader2 className="w-4 h-4 animate-spin" />
              Exporting...
            </>
          ) : (
            <>
              <Download className="w-4 h-4" />
              Export
              <ChevronDown className="w-3 h-3" />
            </>
          )}
        </button>

        {showExportMenu && !isExporting && (
          <div className="absolute bottom-full mb-1 right-0 bg-zinc-800 border border-zinc-700 rounded-lg shadow-xl z-30 overflow-hidden min-w-[140px]">
            <button
              onClick={onExportPNG}
              className="flex items-center gap-2 w-full px-3 py-2 text-sm text-zinc-300 hover:bg-zinc-700 hover:text-white"
            >
              <FileImage className="w-4 h-4" />
              PNG Image
            </button>
            <button
              onClick={onExportSVG}
              className="flex items-center gap-2 w-full px-3 py-2 text-sm text-zinc-300 hover:bg-zinc-700 hover:text-white"
            >
              <FileCode className="w-4 h-4" />
              SVG Vector
            </button>
            <button
              onClick={onExportPDF}
              className="flex items-center gap-2 w-full px-3 py-2 text-sm text-zinc-300 hover:bg-zinc-700 hover:text-white"
            >
              <FileText className="w-4 h-4" />
              PDF Document
            </button>
          </div>
        )}
      </div>
    </div>
  )
}
