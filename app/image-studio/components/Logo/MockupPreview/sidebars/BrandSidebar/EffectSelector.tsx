"use client"

/**
 * Effect Selector Component
 * Grid of text effect options
 */

import { TEXT_EFFECTS, type TextEffect } from '../../text-effects-config'

interface EffectSelectorProps {
  brandEffect: TextEffect
  onEffectChange: (effect: TextEffect) => void
}

export function EffectSelector({
  brandEffect,
  onEffectChange,
}: EffectSelectorProps) {
  return (
    <div className="w-full space-y-1.5">
      <div className="text-[10px] text-zinc-300 font-normal uppercase">Effect</div>
      <div className="grid grid-cols-3 gap-1">
        {(Object.keys(TEXT_EFFECTS) as TextEffect[]).map((effectKey) => {
          const effect = TEXT_EFFECTS[effectKey]
          return (
            <button
              key={effectKey}
              onClick={() => onEffectChange(effectKey)}
              className={`px-2 py-1.5 rounded-md text-[9px] font-extralight transition-all ${
                brandEffect === effectKey
                  ? 'bg-purple-500/20 text-purple-300 border border-purple-500/30'
                  : 'bg-zinc-800/50 text-zinc-400 border border-zinc-700/50 hover:bg-zinc-700/50'
              }`}
            >
              {effect.label}
            </button>
          )
        })}
      </div>
    </div>
  )
}
