export const AI_HELPER_MODEL_CHOICES = ['auto', 'best', 'opus'] as const

export type AIHelperModelChoice = (typeof AI_HELPER_MODEL_CHOICES)[number]
export type AIHelperModelProvider = 'openai' | 'anthropic'

interface AIHelperModelEnvironment {
  OPENAI_TEXT_MODEL?: string
  AI_HELPER_BEST_OPENAI_MODEL?: string
  ANTHROPIC_TEXT_MODEL?: string
}

export interface ResolvedAIHelperModel {
  choice: AIHelperModelChoice
  provider: AIHelperModelProvider
  model: string
}

export function normalizeAIHelperModelChoice(value: unknown): AIHelperModelChoice {
  return typeof value === 'string' && AI_HELPER_MODEL_CHOICES.includes(value as AIHelperModelChoice)
    ? value as AIHelperModelChoice
    : 'auto'
}

export function resolveAIHelperModel(
  value: unknown,
  environment: AIHelperModelEnvironment = process.env as AIHelperModelEnvironment,
): ResolvedAIHelperModel {
  const choice = normalizeAIHelperModelChoice(value)

  if (choice === 'opus') {
    return {
      choice,
      provider: 'anthropic',
      model: (environment.ANTHROPIC_TEXT_MODEL || 'claude-opus-5').trim(),
    }
  }

  if (choice === 'best') {
    return {
      choice,
      provider: 'openai',
      model: (environment.AI_HELPER_BEST_OPENAI_MODEL || 'gpt-5.6-sol').trim(),
    }
  }

  return {
    choice,
    provider: 'openai',
    model: (environment.OPENAI_TEXT_MODEL || 'gpt-5.4-mini').trim(),
  }
}
