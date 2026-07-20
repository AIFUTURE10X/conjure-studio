import { neon } from '@neondatabase/serverless'
import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import { apiError, parseParams } from '@/lib/api/http'
import { resolveUserId } from '@/lib/api/identity'
import { userIdSchema } from '@/lib/validation/common'
import { videoGenerationCost, imageGenerationCost, VIDEO_TOOL_COSTS } from '@/lib/credits/cost-map'
import { getVideoModel } from '@/lib/video/providers'

export const runtime = 'nodejs'

/**
 * GET /api/analytics?userId&days=7|30|90 — spend breakdown.
 *
 * Costs are computed from the history tables via the cost map, so numbers
 * exist even in free mode (credits_charged = 0). When a job stored a real
 * charge it wins over the computed estimate. Failed video jobs count as 0
 * (they auto-refund). The credit ledger, when populated, is returned as
 * the "billed" supplement.
 */

const querySchema = z.object({
  userId: userIdSchema,
  days: z.coerce.number().int().refine((d) => [7, 30, 90].includes(d)).catch(30),
})

function getSQL() {
  const url = process.env.NEON_DATABASE_URL
  if (!url) throw new Error('No database connection string configured')
  return neon(url)
}

type CategoryId = 'image' | 'video' | 'lipsync' | 'enhance' | 'logo'

interface JobEntry {
  kind: CategoryId
  label: string
  credits: number
  units: number
  timestamp: number
  status: 'completed' | 'pending' | 'failed' | 'refunded'
}

function videoJobCost(row: {
  model: string
  duration_seconds: number | null
  resolution: string | null
  has_audio: boolean
  credits_charged: number
  status: string
}): { kind: CategoryId; credits: number } {
  const kind: CategoryId = row.model === 'kling-lipsync' ? 'lipsync'
    : row.model === 'seedvr-upscale' ? 'enhance'
    : 'video'
  if (row.status === 'failed') return { kind, credits: 0 }
  if (row.credits_charged > 0) return { kind, credits: row.credits_charged }
  if (kind === 'lipsync') return { kind, credits: VIDEO_TOOL_COSTS.lipsync }
  if (kind === 'enhance') return { kind, credits: VIDEO_TOOL_COSTS.videoUpscale }
  if (!getVideoModel(row.model)) return { kind, credits: 0 }
  return {
    kind,
    credits: videoGenerationCost(row.model, row.duration_seconds ?? 5, row.resolution ?? '1080p', row.has_audio),
  }
}

export async function GET(request: NextRequest) {
  const parsed = parseParams(Object.fromEntries(request.nextUrl.searchParams), querySchema)
  if (parsed.response) return parsed.response
  const userId = await resolveUserId(request, parsed.data.userId)
  const days = parsed.data.days

  try {
    const sql = getSQL()
    const since = new Date(Date.now() - days * 24 * 60 * 60 * 1000).toISOString()

    const [videoRows, imageRows, logoRows, ledgerRows] = await Promise.all([
      sql`
        SELECT prompt, model, duration_seconds, resolution, has_audio, credits_charged, status, created_at
        FROM public.video_history
        WHERE user_id = ${userId} AND created_at >= ${since}
        ORDER BY created_at DESC
      `,
      sql`
        SELECT prompt, COALESCE(array_length(image_urls, 1), 0) AS image_count, created_at
        FROM public.generation_history
        WHERE user_id = ${userId} AND created_at >= ${since}
        ORDER BY created_at DESC
      `,
      sql`
        SELECT prompt, (config->>'wasBackgroundRemoval') AS was_bg_removal, created_at
        FROM public.logo_history
        WHERE user_id = ${userId} AND created_at >= ${since}
        ORDER BY created_at DESC
      `,
      sql`
        SELECT reason, SUM(-delta)::int AS credits
        FROM public.credit_ledger
        WHERE user_id = ${userId} AND delta < 0 AND created_at >= ${since}
        GROUP BY reason
        ORDER BY credits DESC
      `.catch(() => [] as Array<Record<string, unknown>>),
    ])

    const jobs: JobEntry[] = []

    for (const row of videoRows) {
      const { kind, credits } = videoJobCost(row as never)
      jobs.push({
        kind,
        label: String(row.prompt ?? '').slice(0, 100),
        credits,
        units: 1,
        timestamp: new Date(row.created_at as string).getTime(),
        status: row.status === 'failed' ? 'refunded' : (row.status as JobEntry['status']),
      })
    }

    for (const row of imageRows) {
      const count = Math.max(1, Number(row.image_count) || 1)
      jobs.push({
        kind: 'image',
        label: String(row.prompt ?? '').slice(0, 100),
        credits: imageGenerationCost('gpt-image-2', '1K', count),
        units: count,
        timestamp: new Date(row.created_at as string).getTime(),
        status: 'completed',
      })
    }

    for (const row of logoRows) {
      const isBgRemoval = String(row.was_bg_removal) === 'true'
      jobs.push({
        kind: 'logo',
        label: String(row.prompt ?? '').slice(0, 100),
        credits: isBgRemoval ? 1 : 4,
        units: 1,
        timestamp: new Date(row.created_at as string).getTime(),
        status: 'completed',
      })
    }

    jobs.sort((a, b) => b.timestamp - a.timestamp)

    const categoryMeta: Record<CategoryId, { label: string }> = {
      image: { label: 'Image generation' },
      video: { label: 'Video generation' },
      lipsync: { label: 'Lip sync' },
      enhance: { label: 'Video enhance' },
      logo: { label: 'Logos' },
    }
    const categories = (Object.keys(categoryMeta) as CategoryId[]).map((id) => {
      const rows = jobs.filter((job) => job.kind === id)
      const credits = rows.reduce((sum, job) => sum + job.credits, 0)
      const units = rows.reduce((sum, job) => sum + job.units, 0)
      return {
        id,
        label: categoryMeta[id].label,
        credits,
        jobs: rows.length,
        units,
        avgCredits: rows.length > 0 ? Math.round((credits / rows.length) * 10) / 10 : 0,
      }
    }).filter((category) => category.jobs > 0)

    // Daily stacked series (oldest → newest), grouped image / video / tools.
    const daily: Array<{ date: string; image: number; video: number; tools: number }> = []
    for (let i = days - 1; i >= 0; i--) {
      const dayStart = new Date()
      dayStart.setHours(0, 0, 0, 0)
      dayStart.setDate(dayStart.getDate() - i)
      const dayEnd = dayStart.getTime() + 24 * 60 * 60 * 1000
      const inDay = jobs.filter((job) => job.timestamp >= dayStart.getTime() && job.timestamp < dayEnd)
      daily.push({
        date: dayStart.toISOString().slice(0, 10),
        image: inDay.filter((j) => j.kind === 'image').reduce((sum, j) => sum + j.credits, 0),
        video: inDay.filter((j) => j.kind === 'video').reduce((sum, j) => sum + j.credits, 0),
        tools: inDay.filter((j) => j.kind === 'lipsync' || j.kind === 'enhance' || j.kind === 'logo').reduce((sum, j) => sum + j.credits, 0),
      })
    }

    return NextResponse.json({
      days,
      totals: {
        credits: jobs.reduce((sum, job) => sum + job.credits, 0),
        jobs: jobs.length,
        images: jobs.filter((j) => j.kind === 'image').reduce((sum, j) => sum + j.units, 0),
        videos: jobs.filter((j) => j.kind === 'video').length,
      },
      categories,
      daily,
      recent: jobs.slice(0, 30),
      billed: (ledgerRows as Array<Record<string, unknown>>).map((row) => ({
        reason: String(row.reason),
        credits: Number(row.credits) || 0,
      })),
    })
  } catch (error) {
    console.error('[analytics] Failed:', error)
    return apiError(500, 'db_error', 'Could not load analytics')
  }
}
