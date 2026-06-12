import { NextResponse } from 'next/server'
import { Ratelimit } from '@upstash/ratelimit'
import { Redis } from '@upstash/redis'

/**
 * Per-IP rate limiting for the generation/transform routes — with no auth,
 * this is the only protection for the provider API keys on a public
 * deployment.
 *
 * Backend selection:
 * - When UPSTASH_REDIS_REST_URL/TOKEN are set (Vercel Marketplace Upstash),
 *   a shared sliding window across all instances.
 * - Otherwise an in-memory sliding window per warm instance — weaker, but
 *   Fluid Compute reuses instances enough for it to blunt abuse until
 *   Upstash is provisioned.
 *
 * 429 responses use the uniform envelope; useAIHelper already turns 429s
 * into an actionable "wait about a minute" message.
 */

export interface RateLimitPolicy {
  /** Stable id, used as the redis key prefix. */
  id: string
  limit: number
  windowSeconds: number
}

export const RATE_LIMITS = {
  /** Provider-billed generation calls (Gemini/OpenAI images). */
  generation: { id: 'generation', limit: 10, windowSeconds: 60 },
  /** AI helper chat (Gemini text). */
  helper: { id: 'helper', limit: 20, windowSeconds: 60 },
  /** Transforms: background removal, upscale, vectorize, analyze, enhance. */
  transform: { id: 'transform', limit: 30, windowSeconds: 60 },
} satisfies Record<string, RateLimitPolicy>

function getClientIp(request: Request): string {
  const forwarded = request.headers.get('x-forwarded-for')
  if (forwarded) return forwarded.split(',')[0].trim()
  return request.headers.get('x-real-ip') || 'unknown'
}

// ── Upstash backend ────────────────────────────────────────────────────────

let redis: Redis | null | undefined
const upstashLimiters = new Map<string, Ratelimit>()

function getRedis(): Redis | null {
  if (redis !== undefined) return redis
  const url = process.env.UPSTASH_REDIS_REST_URL || process.env.KV_REST_API_URL
  const token = process.env.UPSTASH_REDIS_REST_TOKEN || process.env.KV_REST_API_TOKEN
  redis = url && token ? new Redis({ url, token }) : null
  return redis
}

function getUpstashLimiter(policy: RateLimitPolicy): Ratelimit | null {
  const client = getRedis()
  if (!client) return null
  let limiter = upstashLimiters.get(policy.id)
  if (!limiter) {
    limiter = new Ratelimit({
      redis: client,
      limiter: Ratelimit.slidingWindow(policy.limit, `${policy.windowSeconds} s`),
      prefix: `ratelimit:${policy.id}`,
    })
    upstashLimiters.set(policy.id, limiter)
  }
  return limiter
}

// ── In-memory fallback (per warm instance) ────────────────────────────────

const memoryWindows = new Map<string, number[]>()

function memoryLimit(policy: RateLimitPolicy, ip: string): { success: boolean; retryAfterSeconds: number } {
  const key = `${policy.id}:${ip}`
  const now = Date.now()
  const windowMs = policy.windowSeconds * 1000
  const timestamps = (memoryWindows.get(key) || []).filter((t) => now - t < windowMs)

  if (timestamps.length >= policy.limit) {
    memoryWindows.set(key, timestamps)
    const retryAfterSeconds = Math.ceil((timestamps[0] + windowMs - now) / 1000)
    return { success: false, retryAfterSeconds: Math.max(1, retryAfterSeconds) }
  }

  timestamps.push(now)
  memoryWindows.set(key, timestamps)

  // Opportunistic cleanup so the map cannot grow without bound.
  if (memoryWindows.size > 10_000) {
    for (const [k, v] of memoryWindows) {
      if (v.every((t) => now - t >= windowMs)) memoryWindows.delete(k)
    }
  }

  return { success: true, retryAfterSeconds: 0 }
}

// ── Public API ─────────────────────────────────────────────────────────────

function tooManyRequests(retryAfterSeconds: number): NextResponse {
  return NextResponse.json(
    {
      error: 'Too many requests — please wait a moment and try again.',
      code: 'rate_limited',
    },
    { status: 429, headers: { 'Retry-After': String(retryAfterSeconds) } },
  )
}

/**
 * Returns a 429 response when the caller is over the limit, or null to
 * proceed. Fails open on limiter errors — generation must not break because
 * the rate limiter is unavailable.
 */
export async function enforceRateLimit(request: Request, policy: RateLimitPolicy): Promise<NextResponse | null> {
  const ip = getClientIp(request)

  try {
    const upstash = getUpstashLimiter(policy)
    if (upstash) {
      const result = await upstash.limit(ip)
      if (!result.success) {
        const retryAfterSeconds = Math.max(1, Math.ceil((result.reset - Date.now()) / 1000))
        return tooManyRequests(retryAfterSeconds)
      }
      return null
    }

    const result = memoryLimit(policy, ip)
    if (!result.success) {
      return tooManyRequests(result.retryAfterSeconds)
    }
    return null
  } catch (error) {
    console.error('[rate-limit] Limiter error (failing open):', error)
    return null
  }
}
