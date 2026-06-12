"use client"

import { toast } from 'sonner'

/**
 * Typed JSON fetch for client → API calls.
 *
 * - Non-2xx responses throw ApiError carrying the server's uniform
 *   envelope ({ error, code, issues? }) when present.
 * - Network failures and malformed JSON also throw ApiError.
 * - By default a failure shows a toast; pass errorToast: false to handle
 *   presentation yourself, or a string to customize the message.
 */
export class ApiError extends Error {
  status: number
  code: string
  issues?: Array<{ path: string; message: string }>

  constructor(status: number, code: string, message: string, issues?: Array<{ path: string; message: string }>) {
    super(message)
    this.name = 'ApiError'
    this.status = status
    this.code = code
    this.issues = issues
  }
}

interface FetchJsonOptions extends RequestInit {
  /** Toast message on failure; false disables the toast. Defaults to the server error. */
  errorToast?: string | false
}

export async function fetchJson<T = unknown>(input: RequestInfo | URL, options: FetchJsonOptions = {}): Promise<T> {
  const { errorToast, ...init } = options

  let response: Response
  try {
    response = await fetch(input, init)
  } catch (cause) {
    const error = new ApiError(0, 'network_error', 'Network request failed')
    if (errorToast !== false) toast.error(typeof errorToast === 'string' ? errorToast : 'Network request failed')
    console.error('[api] Network failure:', input, cause)
    throw error
  }

  let body: unknown = null
  try {
    body = await response.json()
  } catch {
    // Non-JSON body; fall through with null
  }

  if (!response.ok) {
    const envelope = (body ?? {}) as { error?: string; code?: string; issues?: Array<{ path: string; message: string }> }
    const message = envelope.error || `Request failed (${response.status})`
    const error = new ApiError(response.status, envelope.code || 'request_failed', message, envelope.issues)
    if (errorToast !== false) toast.error(typeof errorToast === 'string' ? errorToast : message)
    console.error('[api] Request failed:', input, response.status, envelope)
    throw error
  }

  return body as T
}
