"use client"

/**
 * CameraMotionChips
 *
 * Toggleable camera-move presets for the video prompt. A chip is "on"
 * when its phrase is present in the prompt; toggling appends/removes the
 * phrase. Exclusive presets (Static) clear every other selected move.
 */

import { Video } from 'lucide-react'
import {
  MOTION_PRESETS,
  appendMotionPhrase,
  removeMotionPhrase,
} from '../../constants/video-motion-presets'

interface CameraMotionChipsProps {
  prompt: string
  onPromptChange: (prompt: string) => void
}

export function CameraMotionChips({ prompt, onPromptChange }: CameraMotionChipsProps) {
  const lowerPrompt = prompt.toLowerCase()
  const isSelected = (phrase: string) => lowerPrompt.includes(phrase.toLowerCase())

  const toggle = (id: string) => {
    const preset = MOTION_PRESETS.find((p) => p.id === id)
    if (!preset) return

    if (isSelected(preset.phrase)) {
      onPromptChange(removeMotionPhrase(prompt, preset.phrase))
      return
    }

    let next = prompt
    if (preset.exclusive) {
      for (const other of MOTION_PRESETS) {
        if (other.id !== preset.id) next = removeMotionPhrase(next, other.phrase)
      }
    } else {
      const exclusive = MOTION_PRESETS.filter((p) => p.exclusive)
      for (const other of exclusive) next = removeMotionPhrase(next, other.phrase)
    }
    onPromptChange(appendMotionPhrase(next, preset.phrase))
  }

  return (
    <div>
      <div className="flex items-center gap-1.5 mb-1.5">
        <Video className="w-3 h-3 text-zinc-500" />
        <p className="text-xs text-zinc-400">Camera move</p>
      </div>
      <div className="flex flex-wrap gap-1">
        {MOTION_PRESETS.map((preset) => {
          const active = isSelected(preset.phrase)
          return (
            <button
              key={preset.id}
              onClick={() => toggle(preset.id)}
              title={preset.phrase}
              className={`px-2 h-6 rounded-md text-[11px] font-medium transition-colors ${
                active
                  ? 'bg-linear-to-r from-[#c99850] to-[#dbb56e] text-black'
                  : 'bg-zinc-800 text-zinc-400 hover:text-white hover:bg-zinc-700'
              }`}
            >
              {preset.label}
            </button>
          )
        })}
      </div>
    </div>
  )
}
