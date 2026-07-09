import { betterAuth } from 'better-auth'
import { nextCookies } from 'better-auth/next-js'
import { pgPool } from './db/pool'
import { grantCredits } from './credits'
import { SIGNUP_GRANT_CREDITS } from './credits/cost-map'

/**
 * Better Auth server instance, backed by the existing Neon Postgres over the
 * standard Postgres protocol (pg Pool). Auth tables live alongside app data —
 * schema in scripts/008_better_auth_tables.sql.
 *
 * Email/password is always on. Google sign-in switches on automatically when
 * GOOGLE_CLIENT_ID/GOOGLE_CLIENT_SECRET are present, so production can enable
 * it without a code change.
 */

function resolveBaseURL(): string | undefined {
  if (process.env.BETTER_AUTH_URL) return process.env.BETTER_AUTH_URL
  if (process.env.VERCEL_PROJECT_PRODUCTION_URL) return `https://${process.env.VERCEL_PROJECT_PRODUCTION_URL}`
  if (process.env.VERCEL_URL) return `https://${process.env.VERCEL_URL}`
  return undefined
}

/**
 * Origins allowed to hit the auth endpoints besides the baseURL. Needed when
 * the app is served from a domain other than the one Vercel infers (e.g. a
 * custom domain added after the project was created) — otherwise Better Auth
 * rejects requests from the real site. Comma-separated env override plus the
 * resolved base URL.
 */
function resolveTrustedOrigins(): string[] {
  const origins = new Set(
    (process.env.BETTER_AUTH_TRUSTED_ORIGINS || '')
      .split(',')
      .map((origin) => origin.trim())
      .filter(Boolean),
  )
  const base = resolveBaseURL()
  if (base) origins.add(base)
  return [...origins]
}

const trustedOrigins = resolveTrustedOrigins()

const googleClientId = process.env.GOOGLE_CLIENT_ID
const googleClientSecret = process.env.GOOGLE_CLIENT_SECRET

export const auth = betterAuth({
  database: pgPool,
  secret: process.env.BETTER_AUTH_SECRET,
  baseURL: resolveBaseURL(),
  ...(trustedOrigins.length ? { trustedOrigins } : {}),
  emailAndPassword: {
    enabled: true,
  },
  databaseHooks: {
    user: {
      create: {
        after: async (user) => {
          // Welcome credits; idempotency key makes hook retries harmless.
          try {
            await grantCredits(user.id, SIGNUP_GRANT_CREDITS, 'signup_grant', `signup:${user.id}`)
          } catch (error) {
            console.error('[auth] signup credit grant failed:', error)
          }
        },
      },
    },
  },
  ...(googleClientId && googleClientSecret
    ? {
        socialProviders: {
          google: { clientId: googleClientId, clientSecret: googleClientSecret },
        },
      }
    : {}),
  plugins: [nextCookies()],
})

export type AuthSession = typeof auth.$Infer.Session

/** Resolve the signed-in user from request headers, or null when anonymous. */
export async function getSessionUser(headers: Headers) {
  const session = await auth.api.getSession({ headers })
  return session?.user ?? null
}

/** True when Google sign-in is configured (used to show/hide the button). */
export const isGoogleAuthConfigured = Boolean(googleClientId && googleClientSecret)
