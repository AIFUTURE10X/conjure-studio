import {
  generateOpenAIText,
  getOpenAITextApiKeyNames,
  isOpenAIAuthError,
  isOpenAIRateLimitError,
} from './openai-text-client'
import {
  normalizeAIHelperModelChoice,
  resolveAIHelperModel,
  type AIHelperModelChoice,
} from './ai-helper-models'

const ANTHROPIC_MESSAGES_ENDPOINT = 'https://api.anthropic.com/v1/messages'
const DEFAULT_MAX_OUTPUT_TOKENS = 6000

interface AnthropicMessagePayload {
  content?: unknown
}

interface AnthropicContentPart {
  type?: unknown
  text?: unknown
}

class AnthropicServiceError extends Error {
  status?: number

  constructor(message: string, status?: number) {
    super(message)
    this.name = 'AnthropicServiceError'
    this.status = status
  }
}

function parseAnthropicError(status: number, body: string): AnthropicServiceError {
  try {
    const parsed = JSON.parse(body) as { error?: { message?: unknown } }
    const message = typeof parsed.error?.message === 'string'
      ? parsed.error.message
      : `Anthropic request failed (${status})`
    return new AnthropicServiceError(message, status)
  } catch {
    return new AnthropicServiceError(body || `Anthropic request failed (${status})`, status)
  }
}

function extractAnthropicText(payload: AnthropicMessagePayload): string {
  const content = Array.isArray(payload.content) ? payload.content as AnthropicContentPart[] : []
  const text = content
    .filter((part) => part.type === 'text' && typeof part.text === 'string')
    .map((part) => part.text as string)
    .join('\n')
    .trim()

  if (!text) throw new AnthropicServiceError('No text returned from Anthropic API')
  return text
}

async function generateAnthropicText(prompt: string, model: string): Promise<string> {
  const apiKey = process.env.ANTHROPIC_API_KEY
  if (!apiKey) {
    throw new AnthropicServiceError('ANTHROPIC_API_KEY environment variable is not set', 401)
  }

  const response = await fetch(ANTHROPIC_MESSAGES_ENDPOINT, {
    method: 'POST',
    headers: {
      'anthropic-version': '2023-06-01',
      'content-type': 'application/json',
      'x-api-key': apiKey,
    },
    body: JSON.stringify({
      model,
      max_tokens: DEFAULT_MAX_OUTPUT_TOKENS,
      messages: [{ role: 'user', content: prompt }],
    }),
  })

  const body = await response.text()
  if (!response.ok) throw parseAnthropicError(response.status, body)
  return extractAnthropicText(JSON.parse(body) as AnthropicMessagePayload)
}

export function getAIHelperModelAvailability() {
  return {
    auto: Boolean(process.env.OPENAI_API_KEY),
    best: Boolean(process.env.OPENAI_API_KEY),
    opus: Boolean(process.env.ANTHROPIC_API_KEY),
  }
}

export function getAIHelperModelNames() {
  return {
    auto: resolveAIHelperModel('auto').model,
    best: resolveAIHelperModel('best').model,
    opus: resolveAIHelperModel('opus').model,
  }
}

export function getAIHelperApiKeyNameForChoice(choice: unknown): string {
  return resolveAIHelperModel(choice).provider === 'anthropic'
    ? 'ANTHROPIC_API_KEY'
    : getOpenAITextApiKeyNames()
}

export function hasAIHelperApiKey(choice: unknown): boolean {
  return resolveAIHelperModel(choice).provider === 'anthropic'
    ? Boolean(process.env.ANTHROPIC_API_KEY)
    : Boolean(process.env.OPENAI_API_KEY)
}

export async function generateAIHelperText(prompt: string, choice: unknown): Promise<string> {
  const resolved = resolveAIHelperModel(choice)
  if (resolved.provider === 'anthropic') {
    return generateAnthropicText(prompt, resolved.model)
  }
  return generateOpenAIText(prompt, { model: resolved.model })
}

export function getAIHelperApiKeyNames(error: unknown): string {
  return error instanceof AnthropicServiceError ? 'ANTHROPIC_API_KEY' : getOpenAITextApiKeyNames()
}

export function isAIHelperRateLimitError(error: unknown): boolean {
  return error instanceof AnthropicServiceError
    ? error.status === 429
    : isOpenAIRateLimitError(error)
}

export function isAIHelperAuthError(error: unknown): boolean {
  return error instanceof AnthropicServiceError
    ? error.status === 401 || error.status === 403
    : isOpenAIAuthError(error)
}

export function getNormalizedAIHelperModelChoice(value: unknown): AIHelperModelChoice {
  return normalizeAIHelperModelChoice(value)
}
