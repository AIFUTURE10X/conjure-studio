"use client"

import { useCallback, useEffect, useRef, useState } from 'react'
import { Button } from '@/components/ui/button'
import { Check, Copy, FileText, Languages, Loader2, Upload, Wand2, X } from 'lucide-react'
import { useStudioCore, useStudioMode, useStudioReset } from '../../context/useStudio'

type TargetLanguage = 'English' | 'Thai'

interface TranslationBlock {
  id: string
  label: string
  originalText: string
  translatedText: string
}

interface TranslationResult {
  sourceLanguage: string
  targetLanguage: TargetLanguage
  summary: string
  blocks: TranslationBlock[]
  translatedText: string
  originalText: string
  usagePrompt: string
}

interface TranslationErrorPayload {
  error?: string
  details?: string
}

const TARGET_LANGUAGES: TargetLanguage[] = ['English', 'Thai']

function buildTranslatedText(blocks: TranslationBlock[]): string {
  return blocks
    .map(block => block.translatedText.trim())
    .filter(Boolean)
    .join('\n\n')
}

function buildOriginalText(blocks: TranslationBlock[]): string {
  return blocks
    .map(block => block.originalText.trim())
    .filter(Boolean)
    .join('\n\n')
}

function buildPromptFromResult(result: TranslationResult): string {
  const translatedText = buildTranslatedText(result.blocks) || result.translatedText
  return [
    `Create a polished brochure layout using this ${result.targetLanguage} copy.`,
    'Preserve the original meaning, keep the copy legible, and use clear editorial hierarchy.',
    'Design it as a premium marketing brochure with refined typography, balanced spacing, and a clean print-ready composition.',
    '',
    translatedText,
  ].join('\n')
}

export function TranslateTextPanel() {
  const { state } = useStudioCore()
  const { setMode, setPromptCollapsed } = useStudioMode()
  const fileInputRef = useRef<HTMLInputElement>(null)
  const previewObjectUrlRef = useRef<string | null>(null)
  const [targetLanguage, setTargetLanguage] = useState<TargetLanguage>('English')
  const [file, setFile] = useState<File | null>(null)
  const [previewUrl, setPreviewUrl] = useState<string | null>(null)
  const [result, setResult] = useState<TranslationResult | null>(null)
  const [isDragging, setIsDragging] = useState(false)
  const [isTranslating, setIsTranslating] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [copiedKey, setCopiedKey] = useState<string | null>(null)

  useEffect(() => {
    return () => {
      if (previewObjectUrlRef.current) {
        URL.revokeObjectURL(previewObjectUrlRef.current)
      }
    }
  }, [])

  const handleFile = (nextFile: File | undefined) => {
    if (!nextFile) return
    if (!nextFile.type.startsWith('image/')) {
      setError('Upload an image file.')
      return
    }

    if (previewObjectUrlRef.current) {
      URL.revokeObjectURL(previewObjectUrlRef.current)
    }

    const url = URL.createObjectURL(nextFile)
    previewObjectUrlRef.current = url
    setFile(nextFile)
    setPreviewUrl(url)
    setResult(null)
    setError(null)
  }

  const handleDrop = (event: React.DragEvent<HTMLDivElement>) => {
    event.preventDefault()
    setIsDragging(false)
    handleFile(event.dataTransfer.files[0])
  }

  const handleTranslate = async () => {
    if (!file) {
      setError('Upload a brochure or design image first.')
      return
    }

    setIsTranslating(true)
    setError(null)

    try {
      const formData = new FormData()
      formData.append('image', file)
      formData.append('targetLanguage', targetLanguage)

      const response = await fetch('/api/translate-design-text', {
        method: 'POST',
        body: formData,
      })
      const data = await response.json() as Partial<TranslationResult> & TranslationErrorPayload

      if (!response.ok) {
        throw new Error(data.details || data.error || 'Translation failed')
      }

      setResult({
        sourceLanguage: data.sourceLanguage || 'Unknown',
        targetLanguage,
        summary: data.summary || 'Text extracted and translated.',
        blocks: Array.isArray(data.blocks) ? data.blocks : [],
        translatedText: data.translatedText || '',
        originalText: data.originalText || '',
        usagePrompt: data.usagePrompt || '',
      })
    } catch (translationError) {
      setError(translationError instanceof Error ? translationError.message : 'Translation failed')
    } finally {
      setIsTranslating(false)
    }
  }

  const updateBlock = (id: string, translatedText: string) => {
    setResult(current => {
      if (!current) return current
      const blocks = current.blocks.map(block =>
        block.id === id ? { ...block, translatedText } : block,
      )
      return {
        ...current,
        blocks,
        translatedText: buildTranslatedText(blocks),
      }
    })
  }

  const copyText = async (text: string, key: string) => {
    if (!text.trim()) return
    await navigator.clipboard.writeText(text)
    setCopiedKey(key)
    window.setTimeout(() => setCopiedKey(null), 1200)
  }

  const copyTranslatedText = async () => {
    if (!result) return
    await copyText(buildTranslatedText(result.blocks) || result.translatedText, 'translated-all')
  }

  const handleUseInPrompt = () => {
    if (!result) return
    state.setMainPrompt(buildPromptFromResult(result))
    setPromptCollapsed(false)
    setMode('image')
  }

  const clearFile = () => {
    if (previewObjectUrlRef.current) {
      URL.revokeObjectURL(previewObjectUrlRef.current)
      previewObjectUrlRef.current = null
    }
    setFile(null)
    setPreviewUrl(null)
    setResult(null)
    setError(null)
    if (fileInputRef.current) fileInputRef.current.value = ''
  }

  // Reset the Translate tab to defaults: drop the uploaded image (revoking its
  // object URL), clear the translation result/error, return the target
  // language to English, and reset the transient flags. All setters/refs are
  // stable, so this closure never needs re-registering.
  const { registerReset } = useStudioReset()
  const handleResetTranslateTab = useCallback(() => {
    if (previewObjectUrlRef.current) {
      URL.revokeObjectURL(previewObjectUrlRef.current)
      previewObjectUrlRef.current = null
    }
    setFile(null)
    setPreviewUrl(null)
    setResult(null)
    setError(null)
    if (fileInputRef.current) fileInputRef.current.value = ''
    setTargetLanguage('English')
    setIsDragging(false)
    setIsTranslating(false)
    setCopiedKey(null)
  }, [])
  useEffect(() => registerReset('translate', handleResetTranslateTab), [registerReset, handleResetTranslateTab])

  return (
    <div className="h-full overflow-y-auto bg-zinc-950 px-4 py-4">
      <div className="mx-auto flex h-full max-w-6xl flex-col gap-4">
        <div className="flex flex-wrap items-center justify-between gap-3 border-b border-zinc-800 pb-4">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-lg border border-[#c99850]/30 bg-[#c99850]/10">
              <Languages className="h-5 w-5 text-[#dbb56e]" />
            </div>
            <div>
              <h1 className="text-base font-semibold text-white">Translate Text</h1>
              <p className="text-xs text-zinc-500">OCR and translation for brochure images</p>
            </div>
          </div>

          <div className="flex items-center gap-2 rounded-lg border border-zinc-800 bg-zinc-900 p-1">
            {TARGET_LANGUAGES.map(language => (
              <button
                key={language}
                onClick={() => setTargetLanguage(language)}
                className={`h-8 rounded-md px-3 text-xs font-semibold transition-colors ${
                  targetLanguage === language
                    ? 'bg-[#dbb56e] text-black'
                    : 'text-zinc-400 hover:bg-zinc-800 hover:text-white'
                }`}
              >
                {language}
              </button>
            ))}
          </div>
        </div>

        <div className="grid min-h-0 flex-1 gap-4 xl:grid-cols-[minmax(280px,0.85fr)_minmax(0,1.15fr)]">
          <section className="flex min-h-[420px] flex-col gap-4 rounded-lg border border-zinc-800 bg-zinc-900/60 p-4">
            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              className="hidden"
              onChange={(event) => handleFile(event.target.files?.[0])}
            />

            <div
              onDragOver={(event) => {
                event.preventDefault()
                setIsDragging(true)
              }}
              onDragLeave={() => setIsDragging(false)}
              onDrop={handleDrop}
              onClick={() => fileInputRef.current?.click()}
              className={`flex min-h-[260px] cursor-pointer flex-col items-center justify-center gap-3 rounded-lg border border-dashed p-5 text-center transition-colors ${
                isDragging
                  ? 'border-[#dbb56e] bg-[#c99850]/10'
                  : 'border-zinc-700 bg-zinc-950/50 hover:border-[#c99850]/70'
              }`}
            >
              {previewUrl ? (
                <img
                  src={previewUrl}
                  alt="Uploaded brochure preview"
                  className="max-h-[320px] max-w-full rounded-md object-contain"
                />
              ) : (
                <>
                  <Upload className="h-8 w-8 text-[#dbb56e]" />
                  <div>
                    <p className="text-sm font-medium text-zinc-200">Upload brochure image</p>
                    <p className="mt-1 text-xs text-zinc-500">PNG, JPG, or WebP under 12 MB</p>
                  </div>
                </>
              )}
            </div>

            {file && (
              <div className="flex items-center justify-between gap-3 rounded-lg border border-zinc-800 bg-zinc-950 px-3 py-2">
                <div className="min-w-0">
                  <p className="truncate text-xs font-medium text-zinc-200">{file.name}</p>
                  <p className="text-[11px] text-zinc-500">{(file.size / 1024 / 1024).toFixed(2)} MB</p>
                </div>
                <button
                  onClick={clearFile}
                  className="rounded-md p-1.5 text-zinc-500 transition-colors hover:bg-zinc-800 hover:text-white"
                  title="Remove image"
                >
                  <X className="h-4 w-4" />
                </button>
              </div>
            )}

            {error && (
              <p role="alert" className="rounded-lg border border-red-500/30 bg-red-500/10 px-3 py-2 text-xs text-red-200">
                {error}
              </p>
            )}

            <Button
              onClick={handleTranslate}
              disabled={!file || isTranslating}
              className="h-10 bg-linear-to-r from-[#c99850] to-[#dbb56e] font-semibold text-black hover:from-[#dbb56e] hover:to-[#f4d698]"
            >
              {isTranslating ? (
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              ) : (
                <Languages className="mr-2 h-4 w-4" />
              )}
              Translate to {targetLanguage}
            </Button>
          </section>

          <section className="min-h-[420px] overflow-hidden rounded-lg border border-zinc-800 bg-zinc-900/60">
            {!result ? (
              <div className="flex h-full min-h-[420px] flex-col items-center justify-center p-8 text-center">
                <FileText className="mb-4 h-10 w-10 text-zinc-600" />
                <p className="text-sm font-medium text-zinc-300">No translated copy yet</p>
                <p className="mt-2 max-w-sm text-xs leading-5 text-zinc-500">
                  Upload a design image and run translation to see editable copy blocks here.
                </p>
              </div>
            ) : (
              <div className="flex h-full min-h-[420px] flex-col">
                <div className="flex flex-wrap items-center justify-between gap-3 border-b border-zinc-800 px-4 py-3">
                  <div>
                    <p className="text-sm font-semibold text-white">
                      {result.sourceLanguage} to {result.targetLanguage}
                    </p>
                    <p className="mt-1 text-xs text-zinc-500">{result.summary}</p>
                  </div>
                  <div className="flex flex-wrap items-center gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => copyText(buildOriginalText(result.blocks) || result.originalText, 'original-all')}
                      className="border-zinc-700 text-zinc-300 hover:bg-zinc-800 hover:text-white"
                    >
                      {copiedKey === 'original-all' ? <Check className="mr-1.5 h-3.5 w-3.5" /> : <Copy className="mr-1.5 h-3.5 w-3.5" />}
                      Original
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={copyTranslatedText}
                      className="border-zinc-700 text-zinc-300 hover:bg-zinc-800 hover:text-white"
                    >
                      {copiedKey === 'translated-all' ? <Check className="mr-1.5 h-3.5 w-3.5" /> : <Copy className="mr-1.5 h-3.5 w-3.5" />}
                      Translation
                    </Button>
                    <Button
                      size="sm"
                      onClick={handleUseInPrompt}
                      className="bg-[#dbb56e] font-semibold text-black hover:bg-[#f0d49b]"
                    >
                      <Wand2 className="mr-1.5 h-3.5 w-3.5" />
                      Use in prompt
                    </Button>
                  </div>
                </div>

                <div className="flex-1 overflow-y-auto p-4">
                  {result.blocks.length === 0 ? (
                    <p className="rounded-lg border border-zinc-800 bg-zinc-950 p-4 text-sm text-zinc-400">
                      No text blocks were detected.
                    </p>
                  ) : (
                    <div className="space-y-3">
                      {result.blocks.map((block, index) => (
                        <div key={block.id} className="rounded-lg border border-zinc-800 bg-zinc-950/70 p-3">
                          <div className="mb-3 flex items-center justify-between gap-2">
                            <p className="text-xs font-semibold uppercase tracking-wide text-[#dbb56e]">
                              {block.label || `Block ${index + 1}`}
                            </p>
                            <button
                              onClick={() => copyText(block.translatedText, `block-${block.id}`)}
                              className="rounded-md p-1.5 text-zinc-500 transition-colors hover:bg-zinc-800 hover:text-white"
                              title="Copy translated block"
                            >
                              {copiedKey === `block-${block.id}` ? <Check className="h-3.5 w-3.5" /> : <Copy className="h-3.5 w-3.5" />}
                            </button>
                          </div>
                          <div className="grid gap-3 lg:grid-cols-2">
                            <div>
                              <p className="mb-1.5 text-[11px] font-medium text-zinc-500">Original</p>
                              <div className="min-h-24 whitespace-pre-wrap rounded-md border border-zinc-800 bg-black/40 p-3 text-sm leading-6 text-zinc-300">
                                {block.originalText || 'No original text detected'}
                              </div>
                            </div>
                            <label className="block">
                              <span className="mb-1.5 block text-[11px] font-medium text-zinc-500">Translated</span>
                              <textarea
                                value={block.translatedText}
                                onChange={(event) => updateBlock(block.id, event.target.value)}
                                className="min-h-24 w-full resize-y rounded-md border border-zinc-700 bg-zinc-900 p-3 text-sm leading-6 text-white outline-none focus:border-[#c99850] focus:ring-1 focus:ring-[#c99850]"
                              />
                            </label>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            )}
          </section>
        </div>
      </div>
    </div>
  )
}
