import { timingSafeEqual } from 'node:crypto'
import pg from 'pg'
import { OnlineMediaService, onlinePolicySchema } from './online-service'

const { Pool } = pg
export const onlinePool = new Pool({ connectionString: process.env.POPCORN_DATABASE_URL, max: 5 })

const integer = (name: string) => {
  const value = Number(process.env[name])
  if (!Number.isSafeInteger(value) || value <= 0) throw new Error(`${name} is not configured`)
  return value
}

export function loadOnlinePolicy() {
  return onlinePolicySchema.parse({
    operatorId: process.env.POPCORN_OPERATOR_ID,
    brands: (process.env.AGENT_MEDIA_ALLOWED_BRANDS ?? '').split(',').map(value => value.trim()).filter(Boolean),
    allowPaid: process.env.AGENT_MEDIA_ALLOW_PAID === '1',
    dailyLimitMicros: integer('AGENT_MEDIA_DAILY_LIMIT_MICROS'),
    totalLimitMicros: integer('AGENT_MEDIA_TOTAL_LIMIT_MICROS'),
    expiresAt: process.env.AGENT_MEDIA_POLICY_EXPIRES_AT,
    pricing: {
      checkedAt: process.env.AGENT_MEDIA_PRICING_CHECKED_AT,
      expiresAt: process.env.AGENT_MEDIA_PRICING_EXPIRES_AT,
      source: process.env.AGENT_MEDIA_PRICING_SOURCE,
      reserves: {
        low: integer('AGENT_MEDIA_RESERVE_LOW_MICROS'),
        medium: integer('AGENT_MEDIA_RESERVE_MEDIUM_MICROS'),
        high: integer('AGENT_MEDIA_RESERVE_HIGH_MICROS'),
      },
      referenceExtraMicros: Number(process.env.AGENT_MEDIA_REFERENCE_EXTRA_MICROS ?? -1),
    },
  })
}

export const onlineService = () => new OnlineMediaService(onlinePool, loadOnlinePolicy())

function safeTokenMatch(expected: string | undefined, supplied: string) {
  if (!expected || expected.length !== supplied.length) return false
  return timingSafeEqual(Buffer.from(expected), Buffer.from(supplied))
}

export function authorizePopcorn(request: Request) {
  if (process.env.AGENT_MEDIA_ONLINE_ENABLED !== '1') return false
  const header = request.headers.get('authorization') ?? ''
  const supplied = header.startsWith('Bearer ') ? header.slice(7) : ''
  return safeTokenMatch(process.env.POPCORN_AGENT_MEDIA_TOKEN, supplied)
}

export function authorizeCron(request: Request) {
  const header = request.headers.get('authorization') ?? ''
  const supplied = header.startsWith('Bearer ') ? header.slice(7) : ''
  return process.env.AGENT_MEDIA_ONLINE_ENABLED === '1' && safeTokenMatch(process.env.CRON_SECRET, supplied)
}

export function privateError(error: unknown) {
  const message = error instanceof Error ? error.message : 'Request failed'
  const status = /expired|changed|exhausted|already|idempotency/i.test(message) ? 409
    : /not authorized|not accessible/i.test(message) ? 403
      : /disabled/i.test(message) ? 423 : 400
  return Response.json({ error: message.replace(/OPENAI|provider response/gi, 'generation provider') }, { status })
}
