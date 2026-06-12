import { pgPool } from '@/lib/db/pool'

/**
 * Transactional credit operations on the profiles + credit_ledger tables.
 * Balances change only inside a row-locked transaction that also appends a
 * ledger entry; a unique idempotency_key makes any operation safe to replay.
 */

export class InsufficientCreditsError extends Error {
  constructor(public balance: number, public required: number) {
    super(`Insufficient credits: have ${balance}, need ${required}`)
    this.name = 'InsufficientCreditsError'
  }
}

export interface CreditChangeResult {
  balance: number
  /** False when the idempotency key had already been applied. */
  applied: boolean
}

export async function getBalance(userId: string): Promise<number> {
  const result = await pgPool.query('SELECT credit_balance FROM profiles WHERE user_id = $1', [userId])
  return result.rows[0]?.credit_balance ?? 0
}

async function applyDelta(
  userId: string,
  delta: number,
  reason: string,
  idempotencyKey: string | null,
  metadata?: Record<string, unknown>,
): Promise<CreditChangeResult> {
  const client = await pgPool.connect()
  try {
    await client.query('BEGIN')

    await client.query('INSERT INTO profiles (user_id) VALUES ($1) ON CONFLICT (user_id) DO NOTHING', [userId])
    const locked = await client.query('SELECT credit_balance FROM profiles WHERE user_id = $1 FOR UPDATE', [userId])
    const balance: number = locked.rows[0].credit_balance

    const newBalance = balance + delta
    if (newBalance < 0) {
      await client.query('ROLLBACK')
      throw new InsufficientCreditsError(balance, -delta)
    }

    const ledger = await client.query(
      `INSERT INTO credit_ledger (user_id, delta, balance_after, reason, idempotency_key, metadata)
       VALUES ($1, $2, $3, $4, $5, $6)
       ON CONFLICT (idempotency_key) DO NOTHING
       RETURNING id`,
      [userId, delta, newBalance, reason, idempotencyKey, metadata ? JSON.stringify(metadata) : null],
    )

    if (idempotencyKey && ledger.rows.length === 0) {
      // Already applied in a previous request — keep the existing balance.
      await client.query('ROLLBACK')
      return { balance, applied: false }
    }

    await client.query('UPDATE profiles SET credit_balance = $2, updated_at = NOW() WHERE user_id = $1', [userId, newBalance])
    await client.query('COMMIT')
    return { balance: newBalance, applied: true }
  } catch (error) {
    await client.query('ROLLBACK').catch(() => {})
    throw error
  } finally {
    client.release()
  }
}

/** Add credits (signup grant, Stripe purchase, refund). */
export async function grantCredits(
  userId: string,
  amount: number,
  reason: string,
  idempotencyKey: string,
  metadata?: Record<string, unknown>,
): Promise<CreditChangeResult> {
  if (amount <= 0) throw new Error(`grantCredits amount must be positive, got ${amount}`)
  return applyDelta(userId, amount, reason, idempotencyKey, metadata)
}

/** Remove credits. Throws InsufficientCreditsError when the balance is too low. */
export async function debitCredits(
  userId: string,
  amount: number,
  reason: string,
  idempotencyKey?: string,
  metadata?: Record<string, unknown>,
): Promise<CreditChangeResult> {
  if (amount <= 0) throw new Error(`debitCredits amount must be positive, got ${amount}`)
  return applyDelta(userId, -amount, reason, idempotencyKey ?? null, metadata)
}

/**
 * Reserve→commit pattern for provider calls: debit before the provider call,
 * refund if it fails. The refund reuses the reservation key with a suffix so
 * a retried failure can't double-refund.
 */
export async function refundReservation(
  userId: string,
  amount: number,
  reservationKey: string,
  reason: string,
): Promise<CreditChangeResult> {
  return grantCredits(userId, amount, reason, `${reservationKey}:refund`)
}
