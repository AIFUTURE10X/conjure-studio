import { type NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import { enforceRateLimit, RATE_LIMITS } from '@/lib/rate-limit'
import {
  generateOpenAIVisionText,
  getOpenAITextApiKeyNames,
  hasOpenAITextApiKey,
  isOpenAIAuthError,
  isOpenAIRateLimitError,
} from '@/lib/openai-text-client'

const MAX_IMAGE_BYTES = 12 * 1024 * 1024

const targetLanguageSchema = z.enum(['English', 'Thai'])

interface TranslationBlock {
  id: string
  label: string
  originalText: string
  translatedText: string
}

interface TranslationResponse {
  sourceLanguage: string
  targetLanguage: 'English' | 'Thai'
  summary: string
  blocks: TranslationBlock[]
  translatedText: string
  originalText: string
  usagePrompt: string
}

function stripJsonFences(text: string): string {
  return text
    .trim()
    .replace(/^```(?:json)?\s*/i, '')
    .replace(/\s*```$/i, '')
    .trim()
}

function asString(value: unknown, fallback = ''): string {
  return typeof value === 'string' ? value.trim() : fallback
}

function normalizeBlocks(value: unknown): TranslationBlock[] {
  if (!Array.isArray(value)) return []

  return value
    .map((item, index) => {
      const record = item && typeof item === 'object' ? item as Record<string, unknown> : {}
      const originalText = asString(record.originalText)
      const translatedText = asString(record.translatedText)
      if (!originalText && !translatedText) return null

      return {
        id: asString(record.id, `block-${index + 1}`),
        label: asString(record.label, `Block ${index + 1}`),
        originalText,
        translatedText,
      }
    })
    .filter((block): block is TranslationBlock => Boolean(block))
}

function parseTranslationJson(text: string, targetLanguage: 'English' | 'Thai'): TranslationResponse {
  let parsed: Record<string, unknown>
  try {
    parsed = JSON.parse(stripJsonFences(text)) as Record<string, unknown>
  } catch {
    const fallbackText = text.trim()
    return {
      sourceLanguage: 'Unknown',
      targetLanguage,
      summary: 'The model returned plain text instead of structured blocks.',
      blocks: [{
        id: 'block-1',
        label: 'Extracted copy',
        originalText: '',
        translatedText: fallbackText,
      }],
      originalText: '',
      translatedText: fallbackText,
      usagePrompt: buildUsagePrompt(targetLanguage, fallbackText),
    }
  }

  const blocks = normalizeBlocks(parsed.blocks)
  const originalText = blocks.map(block => block.originalText).filter(Boolean).join('\n\n')
  const translatedText = blocks.map(block => block.translatedText).filter(Boolean).join('\n\n')

  return {
    sourceLanguage: asString(parsed.sourceLanguage, 'Unknown'),
    targetLanguage,
    summary: asString(parsed.summary, 'Text extracted and translated from the uploaded design.'),
    blocks,
    originalText,
    translatedText,
    usagePrompt: asString(parsed.usagePrompt, buildUsagePrompt(targetLanguage, translatedText)),
  }
}

function buildUsagePrompt(targetLanguage: 'English' | 'Thai', translatedText: string): string {
  return [
    `Create a polished brochure layout using this ${targetLanguage} copy.`,
    'Keep the hierarchy clear with headline, supporting copy, key details, and call-to-action.',
    'Use clean premium typography, strong spacing, and a print-ready editorial composition.',
    '',
    translatedText,
  ].join('\n')
}

function buildTranslationPrompt(targetLanguage: 'English' | 'Thai'): string {
  return `You are an expert OCR and marketing translation assistant for design files.

Analyze the uploaded brochure, flyer, poster, menu, or marketing image.

Tasks:
1. Extract every meaningful visible text block. Preserve reading order and grouping.
2. Detect the source language. If the image mixes languages, name the main source language and mention mixed language in the summary.
3. Translate the copy into ${targetLanguage}. Keep marketing tone natural, concise, and faithful. Do not invent offers, prices, addresses, phone numbers, names, dates, legal terms, or claims.
4. Keep numbers, prices, phone numbers, URLs, addresses, and brand names exact unless they are part of ordinary prose.
5. Return JSON only. No markdown.

JSON shape:
{
  "sourceLanguage": "Thai",
  "targetLanguage": "${targetLanguage}",
  "summary": "One sentence about what was translated.",
  "blocks": [
    {
      "id": "block-1",
      "label": "Headline",
      "originalText": "exact OCR text",
      "translatedText": "translated copy"
    }
  ],
  "usagePrompt": "A concise image-generation prompt for recreating a brochure with the translated copy."
}`
}

export async function POST(request: NextRequest) {
  const rateLimited = await enforceRateLimit(request, RATE_LIMITS.transform)
  if (rateLimited) return rateLimited

  try {
    if (!hasOpenAITextApiKey()) {
      return NextResponse.json(
        {
          error: 'OpenAI API key not configured',
          details: `${getOpenAITextApiKeyNames()} is required for OCR and translation.`,
        },
        { status: 500 },
      )
    }

    const formData = await request.formData()
    const image = formData.get('image')
    const parsedTargetLanguage = targetLanguageSchema.safeParse(formData.get('targetLanguage') || 'English')

    if (!(image instanceof File)) {
      return NextResponse.json({ error: 'No image provided' }, { status: 400 })
    }

    if (!image.type.startsWith('image/')) {
      return NextResponse.json({ error: 'Only image uploads are supported' }, { status: 400 })
    }

    if (image.size > MAX_IMAGE_BYTES) {
      return NextResponse.json({ error: 'Image is too large', details: 'Upload an image under 12 MB.' }, { status: 413 })
    }

    if (!parsedTargetLanguage.success) {
      return NextResponse.json({ error: 'Unsupported target language' }, { status: 400 })
    }

    const bytes = await image.arrayBuffer()
    const imageBase64 = Buffer.from(bytes).toString('base64')
    const targetLanguage = parsedTargetLanguage.data

    const text = await generateOpenAIVisionText({
      prompt: buildTranslationPrompt(targetLanguage),
      imageBase64,
      mimeType: image.type,
      options: { maxOutputTokens: 5000 },
    })

    const result = parseTranslationJson(text, targetLanguage)
    return NextResponse.json(result)
  } catch (error) {
    const details = error instanceof Error ? error.message : String(error)
    let hint = 'Try a sharper image with readable text.'
    if (isOpenAIAuthError(error)) {
      hint = `${getOpenAITextApiKeyNames()} is invalid or missing.`
    } else if (isOpenAIRateLimitError(error)) {
      hint = 'OpenAI quota or rate limit exceeded. Try again shortly.'
    }

    console.error('[translate-design-text] failed:', error)
    return NextResponse.json(
      { error: 'Failed to translate design text', details, hint },
      { status: 500 },
    )
  }
}
