export function getGeminiApiKey(): string | undefined {
  return process.env.GEMINI_API_KEY || process.env.GOOGLE_AI_API_KEY
}

export function getGeminiApiKeyNames(): string {
  return "GEMINI_API_KEY or GOOGLE_AI_API_KEY"
}
