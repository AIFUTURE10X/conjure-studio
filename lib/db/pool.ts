import { Pool } from 'pg'

/**
 * Shared pg Pool for Neon over the standard Postgres protocol. Used where
 * multi-statement transactions are needed (Better Auth, account claims,
 * credit ledger) — the @neondatabase/serverless http driver stays in place
 * for the simple single-statement routes.
 */

const connectionString = process.env.NEON_DATABASE_URL || process.env.DATABASE_URL

const globalForPg = globalThis as unknown as { pgPool?: Pool }

export const pgPool =
  globalForPg.pgPool ??
  new Pool({ connectionString, max: 3 })

if (process.env.NODE_ENV !== 'production') globalForPg.pgPool = pgPool
