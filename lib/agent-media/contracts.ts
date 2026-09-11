import { createHash } from 'node:crypto'
import { z } from 'zod'

export const safeId = z.string().regex(/^[a-z0-9][a-z0-9-]{0,79}$/)
export const sha256 = z.string().regex(/^[a-f0-9]{64}$/)
export const instant = z.string().datetime({ offset: true }).refine(v => Number.isFinite(Date.parse(v)))
export const micros = z.number().int().min(1).max(20_000_000)
export const imageRequest = z.object({
  brand: safeId,
  prompt: z.string().trim().min(1).max(12_000).refine(v => Buffer.byteLength(v) <= 16_000),
  model: z.literal('gpt-image-2'),
  aspectRatio: z.enum(['1:1', '16:9', '9:16', '4:3', '3:4', '3:2', '2:3', '21:9', '5:4', '4:5']),
  quality: z.enum(['low', 'medium', 'high']),
  reference: z.object({ id: sha256, sha256 }).strict().optional(),
}).strict()
export const pricePolicy = z.object({
  currency: z.literal('USD'), source: z.string().url(), reviewedBy: z.string().min(1).max(100),
  checkedAt: instant, expiresAt: instant,
  // The operator reviews these ceilings for the exact bounded 1K workflow.
  // They are reservations, not claims of guaranteed provider prices or invoices.
  reserves: z.object({ low: micros, medium: micros, high: micros }).strict(),
  referenceExtraMicros: z.number().int().min(0).max(20_000_000),
}).strict()
export const configSchema = z.object({
  owner: safeId, brands: z.array(safeId).min(1).max(20), dataRoot: z.string().min(1),
  allowPaid: z.boolean(), dailyLimitMicros: micros, totalLimitMicros: micros,
  policyExpiresAt: instant, pricing: pricePolicy,
}).strict()
export type MediaRequest = z.infer<typeof imageRequest>
export type MediaConfig = z.infer<typeof configSchema>
export interface Quote {
  version: 1; id: string; owner: string; request: MediaRequest; inputHash: string;
  size: string; reserveMicros: number; currency: 'USD'; expiresAt: string;
  policyHash: string; pricingSource: string; costMeaning: string;
}
export interface Operation {
  id: string; quote: Quote; createdAt: string; approvalId: string;
}
export interface Asset {
  id: string; brand: string; owner: string; sha256: string; width: number; height: number;
  byteLength: number; mimeType: 'image/png'; operationId?: string;
}
export interface Provider {
  assertReady?(): void;
  generate(request: MediaRequest, size: string, reference?: Buffer): Promise<Buffer>;
}
export class MediaError extends Error {}
export function requireMedia(value: unknown, message: string): asserts value {
  if (!value) throw new MediaError(message)
}
const canonical = (value: unknown): unknown => Array.isArray(value) ? value.map(canonical)
  : value && typeof value === 'object' ? Object.fromEntries(Object.entries(value).sort(([a], [b]) => a.localeCompare(b)).map(([k, v]) => [k, canonical(v)])) : value
export const hash = (value: unknown): string => createHash('sha256').update(Buffer.isBuffer(value) ? value : JSON.stringify(canonical(value))).digest('hex')
