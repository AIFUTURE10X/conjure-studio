import { NextRequest, NextResponse } from 'next/server'
import { put } from '@vercel/blob'
import { z } from 'zod'
import { apiError, parseJson } from '@/lib/api/http'
import { withCreditGuard, flatCost } from '@/lib/api/guard'
import { enforceRateLimit, RATE_LIMITS } from '@/lib/rate-limit'
import { urlOrDataUriSchema } from '@/lib/validation/common'
import { buildBrandKit } from '@/lib/brand-kit/build'

/**
 * POST /api/brand-kit { imageUrl, brandName? } → { url, fileName, colors }
 * Builds the full brand package ZIP from a logo PNG and returns a Blob URL.
 */

const bodySchema = z.object({
  imageUrl: urlOrDataUriSchema,
  brandName: z.string().trim().max(80).optional(),
})

function slugify(name: string): string {
  return (
    name
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/^-+|-+$/g, '')
      .slice(0, 40) || 'brand'
  )
}

async function handlePost(request: NextRequest) {
  const rateLimited = await enforceRateLimit(request, RATE_LIMITS.transform)
  if (rateLimited) return rateLimited

  const parsed = await parseJson(request, bodySchema)
  if (parsed.response) return parsed.response
  const { imageUrl } = parsed.data
  const brandName = parsed.data.brandName || 'Your Brand'

  try {
    const imageResponse = await fetch(imageUrl)
    if (!imageResponse.ok) return apiError(400, 'invalid_request', 'Could not fetch the logo image')
    const sourcePng = Buffer.from(await imageResponse.arrayBuffer())

    console.log('[brand-kit] Building kit for:', brandName, `(${sourcePng.length} bytes source)`)
    const { zip, colors } = await buildBrandKit(sourcePng, brandName)
    const fileName = `${slugify(brandName)}-brand-kit.zip`

    // Prefer a Blob URL; stream the ZIP directly when Blob is unavailable
    // (e.g. local dev without BLOB_READ_WRITE_TOKEN).
    try {
      const blob = await put(`brand-kits/${slugify(brandName)}-${Date.now()}.zip`, zip, {
        access: 'public',
        contentType: 'application/zip',
      })
      console.log('[brand-kit] Uploaded:', blob.url, `(${zip.length} bytes)`)
      return NextResponse.json({ url: blob.url, fileName, colors })
    } catch (blobError) {
      console.warn('[brand-kit] Blob unavailable, returning ZIP directly:', blobError)
      return new NextResponse(new Uint8Array(zip), {
        headers: {
          'Content-Type': 'application/zip',
          'Content-Disposition': `attachment; filename="${fileName}"`,
        },
      })
    }
  } catch (error) {
    console.error('[brand-kit] failed:', error)
    return apiError(500, 'internal_error', 'Brand kit generation failed — please try again')
  }
}

export const POST = withCreditGuard('brand_kit', flatCost('brandKit'), handlePost)
