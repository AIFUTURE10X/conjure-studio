import { ZodError, type ZodType, type output as ZodOutput } from 'zod'
import { extractJson } from './extract-json'

/**
 * Structured-JSON helper for LLM routes: parse, and on a malformed or
 * schema-invalid response, retry ONCE with the specific failures fed back to
 * the model. Model output drifts (a field runs long, a number arrives as a
 * string, JSON gets truncated); a single self-repair pass turns most of those
 * intermittent 500s into a working plan instead of a dead end for the user.
 */

export class LlmJsonError extends Error {
  readonly detail: string

  constructor(message: string, detail: string) {
    super(message)
    this.name = 'LlmJsonError'
    this.detail = detail
  }
}

function describeFailure(error: unknown): string {
  if (error instanceof ZodError) {
    return error.issues
      .map((issue) => `- ${issue.path.join('.') || '(root)'}: ${issue.message}`)
      .join('\n')
  }
  return `- ${error instanceof Error ? error.message : String(error)}`
}

export async function parseLlmJson<S extends ZodType>({
  generate,
  schema,
  label,
}: {
  /** Runs the model. `repairHint` is empty on the first attempt. */
  generate: (repairHint: string) => Promise<string>
  schema: S
  /** Log prefix, e.g. 'photo-director:concepts'. */
  label: string
}): Promise<ZodOutput<S>> {
  let lastRaw = ''
  let lastFailure = ''

  for (let attempt = 1; attempt <= 2; attempt++) {
    const repairHint = attempt === 1 ? '' : `

Your previous response was rejected. Fix exactly these problems and return the corrected JSON only:
${lastFailure}
Keep every field within its stated limit — shorten your wording rather than dropping fields, and return strict JSON with no markdown fences.`

    lastRaw = await generate(repairHint)
    try {
      return schema.parse(extractJson(lastRaw)) as ZodOutput<S>
    } catch (error) {
      lastFailure = describeFailure(error)
      // Raw output is logged (truncated) so a drift like this is diagnosable
      // from the server log instead of only reproducible by hand.
      console.error(`[${label}] attempt ${attempt} rejected:\n${lastFailure}\nRaw: ${lastRaw.slice(0, 800)}`)
    }
  }

  throw new LlmJsonError(`${label} produced unusable JSON twice`, lastFailure)
}
