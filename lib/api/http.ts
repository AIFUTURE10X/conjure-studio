import { NextResponse } from 'next/server'
import type { ZodIssue, ZodType, output as ZodOutput } from 'zod'

/**
 * Uniform API error envelope: { error, code, issues? }.
 * Every 4xx produced by request parsing/validation uses this shape so
 * clients (and the AI helper's error formatter) can rely on it.
 */
export interface ApiErrorIssue {
  path: string
  message: string
}

export function apiError(
  status: number,
  code: string,
  error: string,
  issues?: ApiErrorIssue[],
): NextResponse {
  return NextResponse.json({ error, code, ...(issues?.length ? { issues } : {}) }, { status })
}

function toIssues(zodIssues: ZodIssue[]): ApiErrorIssue[] {
  return zodIssues.map((issue) => ({
    path: issue.path.join('.') || '(root)',
    message: issue.message,
  }))
}

export type ParseResult<T> = { data: T; response?: undefined } | { data?: undefined; response: NextResponse }

/** Parse + validate a JSON body. Malformed JSON and schema failures both return uniform 400s. */
export async function parseJson<S extends ZodType>(request: Request, schema: S): Promise<ParseResult<ZodOutput<S>>> {
  let raw: unknown
  try {
    raw = await request.json()
  } catch {
    return { response: apiError(400, 'invalid_json', 'Request body is not valid JSON') }
  }
  const result = schema.safeParse(raw)
  if (!result.success) {
    return { response: apiError(400, 'invalid_request', 'Request validation failed', toIssues(result.error.issues)) }
  }
  return { data: result.data }
}

/** Parse multipart/form-data, guarding malformed payloads with a uniform 400. */
export async function parseFormData(request: Request): Promise<ParseResult<FormData>> {
  try {
    return { data: await request.formData() }
  } catch {
    return { response: apiError(400, 'invalid_form_data', 'Request body is not valid form data') }
  }
}

/** Validate URL search params (or any plain object) against a schema. */
export function parseParams<S extends ZodType>(params: Record<string, unknown>, schema: S): ParseResult<ZodOutput<S>> {
  const result = schema.safeParse(params)
  if (!result.success) {
    return { response: apiError(400, 'invalid_request', 'Request validation failed', toIssues(result.error.issues)) }
  }
  return { data: result.data }
}

/** Collect FormData string fields into a plain object and validate. File entries are skipped. */
export function parseFormFields<S extends ZodType>(formData: FormData, schema: S): ParseResult<ZodOutput<S>> {
  const fields: Record<string, string> = {}
  formData.forEach((value, key) => {
    if (typeof value === 'string') fields[key] = value
  })
  return parseParams(fields, schema)
}
