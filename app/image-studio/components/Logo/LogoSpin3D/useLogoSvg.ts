import { useCallback, useEffect, useState } from 'react'
import { urlToBase64 } from '../../../utils/export-utils'
import { svgLooksDrawable } from './spin-3d-params'

/**
 * The vector source for the 3D spin: the logo's SVG paths.
 *
 * `/api/vectorize-logo` persists nothing — it answers with the SVG as a
 * `Content-Disposition: attachment` download — so there is no stored vector to
 * read and the spin has to obtain one itself (AC-2). The request mirrors
 * `handleExportSvg` in hooks/useLogoPanelHandlers.ts exactly (`mode: auto`,
 * 16 colours, background paths stripped) so the geometry matches what the SVG
 * export would have produced.
 *
 * Results are cached at module scope, keyed by logo URL, so reopening the panel
 * for the same logo re-uses the SVG instead of paying for another vectorize
 * (AC-3). Module scope rather than component state is deliberate: the cache has
 * to outlive the modal unmounting, which is exactly the case AC-3 describes.
 *
 * Cached values are read during render rather than copied into state. Pushing
 * them through an effect meant a synchronous setState on every cache hit — a
 * wasted cascading render, and one the react-hooks lint rule rightly objects to.
 * Only the two genuinely asynchronous outcomes are state.
 */

/**
 * Keyed by logo URL. Values are the SVG markup.
 *
 * Capped and evicted oldest-first. Growth is already gated — each entry costs a
 * credit-gated vectorize call on a distinct logo — but an unbounded module-level
 * cache of multi-KB strings has no business living for the whole session.
 */
const SVG_CACHE_LIMIT = 24
const svgCache = new Map<string, string>()

function cacheSvg(logoUrl: string, svg: string): void {
  // Re-inserting moves the key to the end, so recently used entries survive.
  svgCache.delete(logoUrl)
  svgCache.set(logoUrl, svg)
  while (svgCache.size > SVG_CACHE_LIMIT) {
    const oldest = svgCache.keys().next().value
    if (oldest === undefined) break
    svgCache.delete(oldest)
  }
}

/** Requests in flight, so two mounts for one logo share a single vectorize. */
const inFlight = new Map<string, Promise<string>>()

const NO_PATHS_MESSAGE =
  'This logo could not be turned into 3D — vectorizing it produced no solid shapes. Try a logo with flat colours and clear edges.'

async function vectorize(logoUrl: string): Promise<string> {
  const imageBase64 = await urlToBase64(logoUrl)

  const formData = new FormData()
  formData.append('imageBase64', imageBase64)
  formData.append('mode', 'auto')
  formData.append('colorCount', '16')
  formData.append('removeBackground', 'true')

  const response = await fetch('/api/vectorize-logo', { method: 'POST', body: formData })
  if (!response.ok) {
    const data = await response.json().catch(() => null)
    throw new Error(data?.error || 'Could not vectorize this logo')
  }

  const svg = await response.text()
  // Reject here rather than handing an empty SVG to the loader, so AC-9 surfaces
  // a sentence the user can act on instead of a blank canvas.
  if (!svgLooksDrawable(svg)) throw new Error(NO_PATHS_MESSAGE)
  return svg
}

export interface LogoSvgState {
  svg: string | null
  isLoading: boolean
  error: string | null
  retry: () => void
}

export function useLogoSvg(logoUrl: string | null, isActive: boolean): LogoSvgState {
  // Both are tagged with the URL they belong to, so switching logos cannot show
  // the previous one's SVG (or its error) for a frame.
  const [fetched, setFetched] = useState<{ url: string; svg: string } | null>(null)
  const [failure, setFailure] = useState<{ url: string; message: string } | null>(null)
  const [attempt, setAttempt] = useState(0)

  const cached = logoUrl ? svgCache.get(logoUrl) ?? null : null
  const svg = cached ?? (fetched && fetched.url === logoUrl ? fetched.svg : null)
  const error = failure && failure.url === logoUrl ? failure.message : null
  // Derived, not stored: anything active with no result and no error yet is loading.
  const isLoading = isActive && Boolean(logoUrl) && !svg && !error

  const retry = useCallback(() => {
    if (logoUrl) {
      svgCache.delete(logoUrl)
      inFlight.delete(logoUrl)
    }
    setFailure(null)
    setFetched(null)
    setAttempt((value) => value + 1)
  }, [logoUrl])

  useEffect(() => {
    if (!isActive || !logoUrl) return
    // A cache hit needs no work at all — `cached` above already surfaces it.
    if (svgCache.has(logoUrl)) return

    let cancelled = false

    // Share one request per logo: a remount mid-flight must not start a second
    // vectorize, which would bill a second time.
    let request = inFlight.get(logoUrl)
    if (!request) {
      request = vectorize(logoUrl)
      inFlight.set(logoUrl, request)
    }

    request
      .then((result) => {
        cacheSvg(logoUrl, result)
        if (!cancelled) setFetched({ url: logoUrl, svg: result })
      })
      .catch((fetchError: unknown) => {
        if (cancelled) return
        setFailure({
          url: logoUrl,
          message: fetchError instanceof Error ? fetchError.message : 'Could not vectorize this logo',
        })
      })
      .finally(() => {
        inFlight.delete(logoUrl)
      })

    return () => { cancelled = true }
  }, [logoUrl, isActive, attempt])

  return { svg, isLoading, error, retry }
}
