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

const VOICES = [
  { id: 'ai_kaiya', label: 'Kaiya (female)' },
  { id: 'oversea_male1', label: 'Male narrator' },
  { id: 'uk_boy1', label: 'UK young male' },
  { id: 'uk_man2', label: 'UK male' },
  { id: 'uk_oldman3', label: 'UK older male' },
  { id: 'genshin_klee2', label: 'Playful child' },
]

const MAX_AUDIO_BYTES = 5 * 1024 * 1024

interface LipSyncDialogProps {
  isOpen: boolean
  onOpenChange: (open: boolean) => void
  onConfirm: (payload: { mode: 'text'; text: string; voiceId: string } | { mode: 'audio'; audioFile: File }) => Promise<void>
}

export function LipSyncDialog({ isOpen, onOpenChange, onConfirm }: LipSyncDialogProps) {
  const [mode, setMode] = useState<'text' | 'audio'>('text')
  const [text, setText] = useState('')
  const [voiceId, setVoiceId] = useState(VOICES[0].id)
  const [audioFile, setAudioFile] = useState<File | null>(null)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const fileInputRef = useRef<HTMLInputElement>(null)

  const canSubmit = mode === 'text' ? text.trim().length > 0 : audioFile !== null

  const handleSubmit = async () => {
    if (!canSubmit || isSubmitting) return
    setIsSubmitting(true)
    try {
      if (mode === 'text') {
        await onConfirm({ mode: 'text', text: text.trim().slice(0, 120), voiceId })
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
              <p className="text-xs text-zinc-400 mb-1.5">Voice</p>
              <div className="flex flex-wrap gap-1">
                {VOICES.map((voice) => (
                  <button
                    key={voice.id}
                    onClick={() => setVoiceId(voice.id)}
                    className={`px-2 h-7 rounded-md text-xs transition-colors ${
                      voiceId === voice.id
                        ? 'bg-linear-to-r from-[#c99850] to-[#dbb56e] text-black font-bold'
                        : 'bg-zinc-800 text-zinc-400 hover:text-white hover:bg-zinc-700'
                    }`}
                  >
                    {voice.label}
                  </button>
                ))}
              </div>
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
