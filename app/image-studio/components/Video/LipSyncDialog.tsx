"use client"

/**
 * LipSyncDialog
 *
 * Make a finished clip talk: type text (built-in TTS voice) or upload an
 * MP3/WAV. Source clip must be 720p/1080p; Kling reads the face in the
 * video and syncs the mouth.
 */

import { useRef, useState } from 'react'
import { toast } from 'sonner'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Textarea } from '@/components/ui/textarea'
import { Loader2, Mic, Upload } from 'lucide-react'
import { ENGLISH_VOICES, CHINESE_VOICES, getVoiceById } from '../../constants/lipsync-voices'

const MAX_AUDIO_BYTES = 5 * 1024 * 1024

export type LipSyncPayload =
  | { mode: 'text'; text: string; voiceId: string; voiceLanguage: 'en' | 'zh' }
  | { mode: 'audio'; audioFile: File }

interface LipSyncDialogProps {
  isOpen: boolean
  onOpenChange: (open: boolean) => void
  onConfirm: (payload: LipSyncPayload) => Promise<void>
}

export function LipSyncDialog({ isOpen, onOpenChange, onConfirm }: LipSyncDialogProps) {
  const [mode, setMode] = useState<'text' | 'audio'>('text')
  const [text, setText] = useState('')
  const [voiceId, setVoiceId] = useState(ENGLISH_VOICES[0].id)
  const [audioFile, setAudioFile] = useState<File | null>(null)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const fileInputRef = useRef<HTMLInputElement>(null)

  const canSubmit = mode === 'text' ? text.trim().length > 0 : audioFile !== null

  const handleSubmit = async () => {
    if (!canSubmit || isSubmitting) return
    setIsSubmitting(true)
    try {
      if (mode === 'text') {
        const voice = getVoiceById(voiceId) ?? ENGLISH_VOICES[0]
        await onConfirm({ mode: 'text', text: text.trim().slice(0, 120), voiceId: voice.id, voiceLanguage: voice.language })
      } else if (audioFile) {
        await onConfirm({ mode: 'audio', audioFile })
      }
      onOpenChange(false)
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md bg-zinc-900 border-zinc-800 text-zinc-100">
        <DialogHeader>
          <DialogTitle className="text-white flex items-center gap-2">
            <Mic className="w-4 h-4 text-[#dbb56e]" />
            Lip Sync
          </DialogTitle>
        </DialogHeader>

        <div className="flex gap-1">
          {(['text', 'audio'] as const).map((m) => (
            <button
              key={m}
              onClick={() => setMode(m)}
              className={`px-3 h-7 rounded-md text-xs font-bold transition-colors ${
                mode === m
                  ? 'bg-linear-to-r from-[#c99850] to-[#dbb56e] text-black'
                  : 'bg-zinc-800 text-zinc-400 hover:text-white hover:bg-zinc-700'
              }`}
            >
              {m === 'text' ? 'Type text (AI voice)' : 'Upload audio'}
            </button>
          ))}
        </div>

        {mode === 'text' ? (
          <div className="space-y-3">
            <Textarea
              value={text}
              onChange={(e) => setText(e.target.value.slice(0, 120))}
              placeholder="What should they say? (max 120 characters)"
              className="min-h-[70px] bg-zinc-950 border-zinc-800 text-sm text-zinc-200 placeholder:text-zinc-600"
            />
            <p className="text-[10px] text-zinc-600 text-right">{text.length}/120</p>
            <div>
              <p className="text-xs text-zinc-400 mb-1.5">
                Voice <span className="text-zinc-600">({ENGLISH_VOICES.length + CHINESE_VOICES.length} available)</span>
              </p>
              <select
                value={voiceId}
                onChange={(e) => setVoiceId(e.target.value)}
                className="w-full h-9 rounded-md bg-zinc-950 border border-zinc-800 text-sm text-zinc-200 px-2 outline-none focus:border-[#c99850]"
              >
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
              </select>
            </div>
          </div>
        ) : (
          <div>
            <input
              ref={fileInputRef}
              type="file"
              accept="audio/mpeg,audio/wav,audio/mp3,.mp3,.wav"
              className="hidden"
              onChange={(e) => {
                const file = e.target.files?.[0]
                if (!file) return
                if (file.size > MAX_AUDIO_BYTES) {
                  toast.error('Audio must be under 5MB')
                  return
                }
                setAudioFile(file)
              }}
            />
            <button
              onClick={() => fileInputRef.current?.click()}
              className="w-full h-20 rounded-md border border-dashed border-zinc-700 flex flex-col items-center justify-center gap-1.5 hover:border-[#c99850]/50 transition-colors"
            >
              <Upload className="w-4 h-4 text-zinc-500" />
              <p className="text-xs text-zinc-400">
                {audioFile ? audioFile.name : 'Choose an MP3/WAV (2s–60s, max 5MB)'}
              </p>
            </button>
          </div>
        )}

        <p className="text-[10px] text-zinc-600 leading-4">
          Works on clips with a visible face, 720p/1080p sources. 4K clips: enhance-downscale first or regenerate at 1080p.
        </p>

        <Button
          onClick={handleSubmit}
          disabled={!canSubmit || isSubmitting}
          className="w-full font-medium bg-linear-to-r from-[#c99850] to-[#dbb56e] text-black hover:from-[#dbb56e] hover:to-[#c99850] disabled:opacity-50"
        >
          {isSubmitting ? (
            <><Loader2 className="w-4 h-4 mr-2 animate-spin" />Starting…</>
          ) : (
            'Generate talking video'
          )}
        </Button>
      </DialogContent>
    </Dialog>
  )
}
