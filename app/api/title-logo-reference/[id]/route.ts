/**
 * GET /api/title-logo-reference/[id]
 *
 * Streams a title-logo reference PNG from the TMDB image CDN so the browser can
 * turn it into a File for the logo generator's reference-image slot. Fetching
 * image.tmdb.org directly from the page can't be relied on to produce a
 * canvas/blob-safe response, so this proxies it same-origin.
 *
 * The id must name an entry in the curated library — the upstream URL comes from
 * that entry, never from the request. This is deliberately not a general-purpose
 * image proxy.
 */

import { NextResponse, type NextRequest } from 'next/server'
import { findLogo } from '@/lib/logo-templates/great-title-logos'

const ALLOWED_HOST = 'image.tmdb.org'

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params

  const logo = findLogo(id)
  if (!logo) {
    return NextResponse.json({ error: 'Unknown title style' }, { status: 404 })
  }

  // Belt and braces: the url is library data, but re-check the host so a bad
  // edit to the library can never turn this into an open proxy.
  let upstream: URL
  try {
    upstream = new URL(logo.logoUrl)
  } catch {
    return NextResponse.json({ error: 'Malformed reference url' }, { status: 500 })
  }

  if (upstream.protocol !== 'https:' || upstream.hostname !== ALLOWED_HOST) {
    return NextResponse.json({ error: 'Reference url is not permitted' }, { status: 502 })
  }

  try {
    const response = await fetch(upstream, {
      // TMDB artwork is immutable per path; let the platform cache it.
      next: { revalidate: 60 * 60 * 24 },
    })

    if (!response.ok) {
      return NextResponse.json(
        { error: `Upstream returned ${response.status}` },
        { status: 502 }
      )
    }

    const body = await response.arrayBuffer()

    return new NextResponse(body, {
      status: 200,
      headers: {
        'Content-Type': response.headers.get('content-type') ?? 'image/png',
        'Content-Length': String(body.byteLength),
        'Cache-Control': 'public, max-age=86400, immutable',
        'Content-Disposition': `inline; filename="${logo.id}.png"`,
      },
    })
  } catch (error) {
    console.error(`[title-logo-reference] fetch failed for ${id}:`, error)
    return NextResponse.json({ error: 'Failed to load reference artwork' }, { status: 502 })
  }
}
