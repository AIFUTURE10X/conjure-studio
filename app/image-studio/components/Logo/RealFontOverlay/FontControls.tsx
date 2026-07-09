"use client"

import { Palette, Move } from 'lucide-react'
import { FontSelector } from './FontSelector'
import { REAL_FONTS } from '@/app/image-studio/constants/real-fonts'
import type { TextPosition, TextTransform, FontControlsProps } from './types'

export function FontControls({
  brandName,
  setBrandName,
  tagline,
  setTagline,
  selectedFont,
  setSelectedFont,
  fontSize,
  setFontSize,
  fontWeight,
  setFontWeight,
  fontColor,
  setFontColor,
  textTransform,
  setTextTransform,
  letterSpacing,
  setLetterSpacing,
  position,
  setPosition,
  taglineFontSize,
  setTaglineFontSize,
  loadedFonts,
}: FontControlsProps) {
  const currentFont = REAL_FONTS[selectedFont]

  return (
    <div className="w-80 border-l border-zinc-800 p-4 overflow-y-auto shrink-0">
      {/* Text Inputs */}
      <div className="space-y-4 mb-6">
        <div>
          <label className="block text-xs text-zinc-400 mb-1.5">Brand Name</label>
          <input
            type="text"
            value={brandName}
            onChange={(e) => setBrandName(e.target.value)}
            className="w-full px-3 py-2 bg-zinc-800 border border-zinc-700 rounded-lg text-white text-sm focus:outline-none focus:border-purple-500"
          />
        </div>
        <div>
          <label className="block text-xs text-zinc-400 mb-1.5">Tagline (optional)</label>
          <input
            type="text"
            value={tagline}
            onChange={(e) => setTagline(e.target.value)}
            placeholder="Your slogan here..."
            className="w-full px-3 py-2 bg-zinc-800 border border-zinc-700 rounded-lg text-white text-sm focus:outline-none focus:border-purple-500 placeholder:text-zinc-600"
          />
        </div>
      </div>

      {/* Font Selection */}
      <div className="mb-6">
        <FontSelector
          selectedFontId={selectedFont}
          onSelectFont={setSelectedFont}
          loadedFonts={loadedFonts}
        />
      </div>

      {/* Font Weight */}
      {currentFont && currentFont.weights.length > 1 && (
        <div className="mb-4">
          <label className="block text-xs text-zinc-400 mb-1.5">
            Weight: {fontWeight}
          </label>
          <div className="flex gap-1">
            {currentFont.weights.map((w) => (
              <button
                key={w}
                onClick={() => setFontWeight(w)}
                className={`flex-1 py-1.5 text-xs rounded ${
                  fontWeight === w
                    ? 'bg-purple-500 text-white'
                    : 'bg-zinc-800 text-zinc-400 hover:bg-zinc-700'
                }`}
              >
                {w}
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Font Size */}
      <div className="mb-4">
        <label className="block text-xs text-zinc-400 mb-1.5">
          Size: {fontSize}px
        </label>
        <input
          type="range"
          min="12"
          max="72"
          value={fontSize}
          onChange={(e) => setFontSize(Number(e.target.value))}
          className="w-full accent-purple-500"
        />
      </div>

      {/* Color */}
      <div className="mb-4">
        <label className="flex text-xs text-zinc-400 mb-1.5 items-center gap-2">
          <Palette className="w-3 h-3" /> Color
        </label>
        <div className="flex gap-2">
          <input
            type="color"
            value={fontColor}
            onChange={(e) => setFontColor(e.target.value)}
            className="w-10 h-10 rounded cursor-pointer bg-transparent"
          />
          <input
            type="text"
            value={fontColor}
            onChange={(e) => setFontColor(e.target.value)}
            className="flex-1 px-3 py-2 bg-zinc-800 border border-zinc-700 rounded-lg text-white text-sm font-mono"
          />
        </div>
      </div>

      {/* Text Transform */}
      <div className="mb-4">
        <label className="block text-xs text-zinc-400 mb-1.5">Text Case</label>
        <div className="flex gap-1">
          {(['none', 'uppercase', 'lowercase'] as TextTransform[]).map((t) => (
            <button
              key={t}
              onClick={() => setTextTransform(t)}
              className={`flex-1 py-1.5 text-xs rounded ${
                textTransform === t
                  ? 'bg-purple-500 text-white'
                  : 'bg-zinc-800 text-zinc-400 hover:bg-zinc-700'
              }`}
            >
              {t === 'none' ? 'Normal' : t === 'uppercase' ? 'UPPER' : 'lower'}
            </button>
          ))}
        </div>
      </div>

      {/* Letter Spacing */}
      <div className="mb-4">
        <label className="block text-xs text-zinc-400 mb-1.5">
          Letter Spacing: {letterSpacing}px
        </label>
        <input
          type="range"
          min="-2"
          max="10"
          value={letterSpacing}
          onChange={(e) => setLetterSpacing(Number(e.target.value))}
          className="w-full accent-purple-500"
        />
      </div>

      {/* Position */}
      <div className="mb-6">
        <label className="flex text-xs text-zinc-400 mb-1.5 items-center gap-2">
          <Move className="w-3 h-3" /> Position
        </label>
        <div className="grid grid-cols-3 gap-1">
          {/* Row 1: Above, Left, Center */}
          {(['above', 'left', 'center'] as TextPosition[]).map((p) => (
            <button
              key={p}
              onClick={() => setPosition(p)}
              className={`py-2 text-xs rounded capitalize ${
                position === p
                  ? 'bg-purple-500 text-white'
                  : 'bg-zinc-800 text-zinc-400 hover:bg-zinc-700'
              }`}
            >
              {p}
            </button>
          ))}
          {/* Row 2: Right, Below, (empty or duplicate center as "overlay") */}
          {(['right', 'below'] as TextPosition[]).map((p) => (
            <button
              key={p}
              onClick={() => setPosition(p)}
              className={`py-2 text-xs rounded capitalize ${
                position === p
                  ? 'bg-purple-500 text-white'
                  : 'bg-zinc-800 text-zinc-400 hover:bg-zinc-700'
              }`}
            >
              {p}
            </button>
          ))}
        </div>
      </div>

      {/* Tagline Size */}
      {tagline && (
        <div className="mb-4">
          <label className="block text-xs text-zinc-400 mb-1.5">
            Tagline Size: {taglineFontSize}px
          </label>
          <input
            type="range"
            min="10"
            max="32"
            value={taglineFontSize}
            onChange={(e) => setTaglineFontSize(Number(e.target.value))}
            className="w-full accent-purple-500"
          />
        </div>
      )}
    </div>
  )
}
