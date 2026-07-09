const RESPONSES_ENDPOINT = "https://api.openai.com/v1/responses"
const DEFAULT_TEXT_MODEL = "gpt-5.4-mini"
const DEFAULT_MAX_OUTPUT_TOKENS = 6000

type OpenAIInputContent =
  | { type: "input_text"; text: string }
  | { type: "input_image"; image_url: string }

interface OpenAITextOptions {
  model?: string
  maxOutputTokens?: number
}

interface OpenAIResponseContentPart {
  text?: unknown
  output_text?: unknown
}

interface OpenAIResponseOutputItem {
  content?: unknown
}

interface OpenAIResponsePayload {
  output_text?: unknown
  output?: unknown
}

export class OpenAIServiceError extends Error {
  status?: number
  code?: string
  type?: string

  constructor(message: string, options: { status?: number; code?: string; type?: string } = {}) {
    super(message)
    this.name = "OpenAIServiceError"
    this.status = options.status
    this.code = options.code
    this.type = options.type
  }
}

export function getOpenAITextApiKeyNames(): string {
  return "OPENAI_API_KEY"
}

export function hasOpenAITextApiKey(): boolean {
  return Boolean(process.env.OPENAI_API_KEY)
}

function getOpenAITextApiKey(): string {
  const apiKey = process.env.OPENAI_API_KEY
  if (!apiKey) {
    throw new OpenAIServiceError(`${getOpenAITextApiKeyNames()} environment variable is not set`, {
      status: 401,
      code: "missing_api_key",
      type: "authentication_error",
    })
  }
  return apiKey
}

function getOpenAITextModel(model?: string): string {
  // Trim so a stray space in an env var (e.g. "gpt-5.4 ") doesn't produce an
  // "model does not exist" error from OpenAI.
  return (model || process.env.OPENAI_TEXT_MODEL || DEFAULT_TEXT_MODEL).trim()
}

function parseOpenAIError(status: number, body: string): OpenAIServiceError {
  try {
    const parsed = JSON.parse(body) as { error?: { message?: unknown; code?: unknown; type?: unknown } }
    const error = parsed.error || {}
    const message = typeof error.message === "string" ? error.message : `OpenAI request failed (${status})`
    return new OpenAIServiceError(message, {
      status,
      code: typeof error.code === "string" ? error.code : undefined,
      type: typeof error.type === "string" ? error.type : undefined,
    })
  } catch {
    return new OpenAIServiceError(body || `OpenAI request failed (${status})`, { status })
  }
}

function extractOpenAIText(data: OpenAIResponsePayload): string {
  if (typeof data?.output_text === "string" && data.output_text.trim()) {
    return data.output_text
  }

  const output = Array.isArray(data?.output) ? data.output : []
  const textParts = output.flatMap((item) => {
    const content = Array.isArray((item as OpenAIResponseOutputItem)?.content)
      ? (item as OpenAIResponseOutputItem).content as OpenAIResponseContentPart[]
      : []
    return content.flatMap((part) => {
      if (typeof part?.text === "string") return [part.text]
      if (typeof part?.output_text === "string") return [part.output_text]
      return []
    })
  })

  const text = textParts.join("\n").trim()
  if (!text) {
    throw new OpenAIServiceError("No text returned from OpenAI API")
  }
  return text
}

function isRetryableStatus(status?: number): boolean {
  return status === 429 || status === 500 || status === 502 || status === 503 || status === 504
}

const sleep = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms))

async function callOpenAIResponses(content: OpenAIInputContent[], options: OpenAITextOptions = {}): Promise<string> {
  const apiKey = getOpenAITextApiKey()
  const maxAttempts = Number(process.env.OPENAI_TEXT_MAX_ATTEMPTS || 3)
  const baseDelay = Number(process.env.OPENAI_TEXT_RETRY_BASE_DELAY || 1000)
  let lastError: unknown

  for (let attempt = 1; attempt <= maxAttempts; attempt++) {
    try {
      const response = await fetch(RESPONSES_ENDPOINT, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${apiKey}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          model: getOpenAITextModel(options.model),
          input: [{ role: "user", content }],
          max_output_tokens: options.maxOutputTokens || DEFAULT_MAX_OUTPUT_TOKENS,
        }),
      })

      const body = await response.text()
      if (!response.ok) {
        throw parseOpenAIError(response.status, body)
      }

      return extractOpenAIText(JSON.parse(body) as OpenAIResponsePayload)
    } catch (error) {
      lastError = error
      const status = error instanceof OpenAIServiceError ? error.status : undefined
      if (attempt < maxAttempts && isRetryableStatus(status)) {
        await sleep(Math.min(8000, baseDelay * Math.pow(2, attempt - 1)))
        continue
      }
      throw error
    }
  }

  throw lastError instanceof Error ? lastError : new OpenAIServiceError("OpenAI request failed")
}

export async function generateOpenAIText(prompt: string, options: OpenAITextOptions = {}): Promise<string> {
  return callOpenAIResponses([{ type: "input_text", text: prompt }], options)
}

export async function generateOpenAIVisionText({
  prompt,
  imageBase64,
  mimeType,
  options = {},
}: {
  prompt: string
  imageBase64: string
  mimeType: string
  options?: OpenAITextOptions
}): Promise<string> {
  return callOpenAIResponses(
    [
      { type: "input_text", text: prompt },
      { type: "input_image", image_url: `data:${mimeType};base64,${imageBase64}` },
    ],
    options,
  )
}

export function isOpenAIRateLimitError(error: unknown): boolean {
  const message = error instanceof Error ? error.message.toLowerCase() : String(error).toLowerCase()
  const status = error instanceof OpenAIServiceError ? error.status : undefined
  return status === 429 || message.includes("rate limit") || message.includes("quota")
}

export function isOpenAIAuthError(error: unknown): boolean {
  const message = error instanceof Error ? error.message.toLowerCase() : String(error).toLowerCase()
  const status = error instanceof OpenAIServiceError ? error.status : undefined
  return status === 401 || status === 403 || message.includes("api key") || message.includes("authentication")
}
