'use client'

import { Sparkles, Palette, Check } from 'lucide-react'
import type { DotMatrixConfig } from '../../constants/dot-matrix-config'

interface LogoConfigCardProps {
  logoConfig: Partial<DotMatrixConfig>
  isApplied: boolean
  onApply: () => void
}

export function LogoConfigCard({ logoConfig, isApplied, onApply }: LogoConfigCardProps) {
  if (!logoConfig || Object.keys(logoConfig).length === 0) return null

  return (
    <div className="mt-2 bg-zinc-800 border border-purple-500/30 rounded-lg p-3 space-y-2">
      <div className="flex items-center gap-2 mb-2 pb-2 border-b border-purple-500/20">
        <Sparkles className="w-4 h-4 text-purple-400" />
        <span className="text-xs font-bold text-purple-400">Logo Settings Suggestion</span>
      </div>

      {/* Display key config values */}
      <div className="grid grid-cols-2 gap-2 text-xs">
        {logoConfig.dotSize && (
          <div>
            <span className="text-zinc-500">Dot Size:</span>
            <span className="text-zinc-200 ml-1">{logoConfig.dotSize}</span>
          </div>
        )}
        {logoConfig.dotShape && (
          <div>
            <span className="text-zinc-500">Shape:</span>
            <span className="text-zinc-200 ml-1">{logoConfig.dotShape}</span>
          </div>
        )}
        {logoConfig.dotColor && (
          <div className="flex items-center gap-1">
            <span className="text-zinc-500">Dot Color:</span>
            <div
              className="w-3 h-3 rounded-full border border-zinc-600"
              style={{ backgroundColor: typeof logoConfig.dotColor === 'object' ? logoConfig.dotColor.hex : '#8B5CF6' }}
            />
            <span className="text-zinc-200">
              {typeof logoConfig.dotColor === 'object' ? logoConfig.dotColor.name : logoConfig.dotColor}
            </span>
          </div>
        )}
        {logoConfig.metallicFinish && (
          <div>
            <span className="text-zinc-500">Finish:</span>
            <span className="text-zinc-200 ml-1">{logoConfig.metallicFinish}</span>
          </div>
        )}
        {logoConfig.depthLevel && (
          <div>
            <span className="text-zinc-500">3D Depth:</span>
            <span className="text-zinc-200 ml-1">{logoConfig.depthLevel}</span>
          </div>
        )}
        {logoConfig.glowEffect && (
          <div>
            <span className="text-zinc-500">Glow:</span>
            <span className="text-zinc-200 ml-1">{logoConfig.glowEffect}</span>
          </div>
        )}
        {logoConfig.materialType && (
          <div>
            <span className="text-zinc-500">Material:</span>
            <span className="text-zinc-200 ml-1">{logoConfig.materialType}</span>
          </div>
        )}
        {logoConfig.sparkleIntensity && (
          <div>
            <span className="text-zinc-500">Sparkle:</span>
            <span className="text-zinc-200 ml-1">{logoConfig.sparkleIntensity}</span>
          </div>
        )}
      </div>

      {/* Apply to Logo Button */}
      <button
        onClick={onApply}
        className={`w-full mt-2 px-3 py-2 text-xs font-bold rounded transition-all flex items-center justify-center gap-2 ${
          isApplied
            ? 'bg-green-500 text-white'
            : 'bg-linear-to-r from-purple-500 to-purple-600 text-white hover:from-purple-600 hover:to-purple-700'
        }`}
      >
        {isApplied ? (
          <>
            <Check className="w-4 h-4" />
            Applied! Opening Configurator...
          </>
        ) : (
          <>
            <Palette className="w-4 h-4" />
            Apply to Logo Configurator
          </>
        )}
      </button>
    </div>
  )
}
