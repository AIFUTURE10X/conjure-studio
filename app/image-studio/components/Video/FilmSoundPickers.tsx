"use client"

/**
 * FilmSoundPickers — narration engine + voice selection and music mood
 * chips for the Assemble Film dialog.
 */

import { ELEVENLABS_VOICES, MUSIC_STYLES, type NarrationEngine } from '../../constants/film-assembly'
import { ENGLISH_VOICES, CHINESE_VOICES } from '../../constants/lipsync-voices'

export type NarrationChoice = 'none' | NarrationEngine

interface FilmSoundPickersProps {
  narrationChoice: NarrationChoice
  onNarrationChoice: (choice: NarrationChoice) => void
  voiceId: string
  onVoiceId: (id: string) => void
  musicStyleId: string
  onMusicStyleId: (id: string) => void
}

const NARRATION_OPTIONS: Array<{ id: NarrationChoice; label: string; hint: string }> = [
  { id: 'none', label: 'No narration', hint: 'Just the clips (and music if picked)' },
  { id: 'elevenlabs', label: 'ElevenLabs', hint: 'Best quality — expressive, natural narration' },
  { id: 'kling', label: 'Kling', hint: 'The 46 voices you know from Lip Sync' },
]

export function FilmSoundPickers({
  narrationChoice, onNarrationChoice, voiceId, onVoiceId, musicStyleId, onMusicStyleId,
}: FilmSoundPickersProps) {
  const handleChoice = (choice: NarrationChoice) => {
    onNarrationChoice(choice)
    if (choice === 'elevenlabs') onVoiceId(ELEVENLABS_VOICES[0].id)
    if (choice === 'kling') onVoiceId(ENGLISH_VOICES[0].id)
  }

  return (
    <div className="space-y-3 min-w-0">
      <div className="min-w-0">
        <p className="text-xs text-zinc-400 mb-1.5">Narration</p>
        <div className="flex gap-1 flex-wrap">
          {NARRATION_OPTIONS.map((option) => (
            <button
              key={option.id}
              onClick={() => handleChoice(option.id)}
              title={option.hint}
              className={`px-2.5 h-7 rounded-md text-xs font-bold transition-colors ${
                narrationChoice === option.id
                  ? 'bg-linear-to-r from-[#c99850] to-[#dbb56e] text-black'
                  : 'bg-zinc-800 text-zinc-400 hover:text-white hover:bg-zinc-700'
              }`}
            >
              {option.label}
            </button>
          ))}
        </div>
      </div>

      {narrationChoice !== 'none' && (
        <div>
          <p className="text-xs text-zinc-400 mb-1.5">Voice</p>
          <select
            value={voiceId}
            onChange={(e) => onVoiceId(e.target.value)}
            className="w-full h-9 rounded-md bg-zinc-950 border border-zinc-800 text-sm text-zinc-200 px-2 outline-none focus:border-[#c99850]"
          >
            {narrationChoice === 'elevenlabs' ? (
              ELEVENLABS_VOICES.map((voice) => (
                <option key={voice.id} value={voice.id}>{voice.label}</option>
              ))
            ) : (
              <>
                <optgroup label="English">
                  {ENGLISH_VOICES.map((voice) => (
                    <option key={voice.id} value={voice.id}>{voice.label}</option>
                  ))}
                </optgroup>
                <optgroup label="Chinese">
                  {CHINESE_VOICES.map((voice) => (
                    <option key={voice.id} value={voice.id}>{voice.label}</option>
                  ))}
                </optgroup>
              </>
            )}
          </select>
        </div>
      )}

      <div>
        <p className="text-xs text-zinc-400 mb-1.5">Background music</p>
        <div className="grid grid-cols-2 gap-1">
          {MUSIC_STYLES.map((style) => (
            <button
              key={style.id}
              onClick={() => onMusicStyleId(style.id)}
              title={style.prompt || 'No background music'}
              className={`flex items-center gap-1 min-w-0 px-2 py-1.5 rounded-md text-[11px] font-medium text-left transition-colors ${
                musicStyleId === style.id
                  ? 'bg-linear-to-r from-[#c99850] to-[#dbb56e] text-black'
                  : 'bg-zinc-800 text-zinc-400 hover:text-white hover:bg-zinc-700'
              }`}
            >
              <span className="shrink-0">{style.emoji}</span>
              <span className="truncate">{style.label}</span>
            </button>
          ))}
        </div>
        <p className="mt-1 text-[10px] text-zinc-600">
          Music is AI-generated to match the mood (30s max — longer films go quiet after).
        </p>
      </div>
    </div>
  )
}
