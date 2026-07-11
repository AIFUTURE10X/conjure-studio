import { type NextRequest, NextResponse } from "next/server"
import { withCreditGuard, flatCost } from '@/lib/api/guard'
import { enforceRateLimit, RATE_LIMITS } from '@/lib/rate-limit'
import { resolveUserId } from '@/lib/api/identity'
import { put } from "@vercel/blob"
import { neon } from "@neondatabase/serverless"
import { removeBackground, type BackgroundRemovalMethod } from "@/lib/background-removal"
import { removeBackgroundCloud, removeBackgroundPixian } from "@/lib/cloud-bg-removal"
import { removeBackgroundWithReplicate, type ReplicateBgModel, type BgRemovalOptions } from "@/lib/replicate-bg-removal"
import { removeBackgroundSmart } from "@/lib/smart-bg-removal"
import { removeBackgroundWithPixelcut } from "@/lib/pixelcut-bg-removal"
import { isPhotoRoomBgRemovalError, removeBackgroundWithPhotoRoom } from "@/lib/photoroom-bg-removal"
import { removeBackgroundWithFal, isFalBgRemovalAvailable } from "@/lib/fal-bg-removal"

interface BgRemovalResult {
  transparentBase64: string
  bgRemovalMethod: BackgroundRemovalMethod
  fallbackWarning?: string
}

async function runPhotoRoomBackgroundRemoval(
  imageBase64: string,
  cloudApiKey: string | null,
  isLogoContext: boolean
): Promise<BgRemovalResult> {
  try {
    return {
      transparentBase64: await removeBackgroundWithPhotoRoom(imageBase64, cloudApiKey || undefined),
      bgRemovalMethod: 'photoroom',
    }
  } catch (error) {
    if (!isFalBgRemovalAvailable()) {
      throw error
    }

    const fallbackWarning = error instanceof Error ? error.message : 'PhotoRoom background removal failed'
    console.warn('[Remove BG API] PhotoRoom failed; falling back to fal:', fallbackWarning)
    return {
      transparentBase64: await removeBackgroundWithFal(imageBase64, { isLogoContext }),
      bgRemovalMethod: 'fal',
      fallbackWarning,
    }
  }
}

async function handlePost(request: NextRequest) {
  const rateLimited = await enforceRateLimit(request, RATE_LIMITS.transform)
  if (rateLimited) return rateLimited

  // Set when the caller asked for fal but FAL_KEY is missing, so a PhotoRoom
  // failure after the silent reroute reports the real story, not just PhotoRoom.
  let falConfigNote: string | null = null

  try {
    const formData = await request.formData()
    const imageFile = formData.get('image') as File | null
    let bgRemovalMethod = (formData.get('bgRemovalMethod') as BackgroundRemovalMethod) || 'photoroom'
    const cloudApiKey = formData.get('cloudApiKey') as string | null

    // Safety net: fal · BiRefNet is now the BG Remover default, but it needs
    // FAL_KEY. If that env var isn't configured (e.g. not yet set in prod),
    // fall back to PhotoRoom so the public tool never hard-fails.
    if (bgRemovalMethod === 'fal' && !isFalBgRemovalAvailable()) {
      console.warn('[Remove BG API] FAL_KEY not set — falling back to PhotoRoom')
      falConfigNote = 'Fal is not configured on the server (FAL_KEY is not set in the environment)'
      bgRemovalMethod = 'photoroom'
    }

    // Optional: metadata for saving to history (server-side save). Session
    // identity wins over the client-supplied id when signed in.
    const clientUserId = formData.get('userId') as string | null
    const userId = clientUserId ? await resolveUserId(request, clientUserId) : null
    const prompt = formData.get('prompt') as string | null
    const seed = formData.get('seed') as string | null
    const style = formData.get('style') as string | null
    const originalUrl = formData.get('originalUrl') as string | null

    // Detect if called from logo context (explicit param, referer, or custom header)
    const isLogoContext = formData.get('isLogoContext') === 'true'
      || request.headers.get('referer')?.includes('/logo')
      || request.headers.get('x-context') === 'logo'

    console.log("[Remove BG API] Request received:", {
      hasImage: !!imageFile,
      imageSize: imageFile?.size,
      bgRemovalMethod,
      hasApiKey: !!cloudApiKey,
      hasMetadata: !!(userId && prompt),
      isLogoContext,
    })

    if (!imageFile || imageFile.size === 0) {
      return NextResponse.json({ error: "Image is required" }, { status: 400 })
    }

    // Convert image to base64
    const arrayBuffer = await imageFile.arrayBuffer()
    const imageBase64 = Buffer.from(arrayBuffer).toString('base64')

    console.log(`[Remove BG API] Removing background with method: ${bgRemovalMethod}...`)

    // Remove background based on selected method
    let removalResult: BgRemovalResult

    if (bgRemovalMethod === 'smart') {
      // Use Smart removal - detects background color and preserves ALL content including text
      removalResult = {
        transparentBase64: await removeBackgroundSmart(imageBase64, {
          tolerance: 25,
          edgeSmoothing: false,  // Disabled - causes artifacts
        }),
        bgRemovalMethod,
      }
    } else if (bgRemovalMethod === 'replicate') {
      // Use Replicate AI (BRIA) - works on any background color with 256 levels of transparency
      // Pass isLogoContext for text-preserving settings when in logo context
      removalResult = {
        transparentBase64: await removeBackgroundWithReplicate(imageBase64, 'bria', { isLogoContext }),
        bgRemovalMethod,
      }
    } else if (bgRemovalMethod === '851-labs') {
      // Use 851-labs/background-remover - very cheap, good threshold control
      removalResult = {
        transparentBase64: await removeBackgroundWithReplicate(imageBase64, '851-labs'),
        bgRemovalMethod,
      }
    } else if (bgRemovalMethod === 'fal') {
      // Use fal.ai BiRefNet v2 - pay-as-you-go, top-tier edges, no subscription
      removalResult = {
        transparentBase64: await removeBackgroundWithFal(imageBase64, { isLogoContext }),
        bgRemovalMethod,
      }
    } else if (bgRemovalMethod === 'pixelcut') {
      // Use Pixelcut API - logo-optimized, preserves text and fine details
      removalResult = {
        transparentBase64: await removeBackgroundWithPixelcut(imageBase64, cloudApiKey || undefined),
        bgRemovalMethod,
      }
    } else if (bgRemovalMethod === 'photoroom') {
      // Use PhotoRoom API - professional-grade with fast processing.
      // If PhotoRoom is out of credits or otherwise unavailable, keep the
      // public tool working by falling back to fal when it is configured.
      removalResult = await runPhotoRoomBackgroundRemoval(imageBase64, cloudApiKey, isLogoContext)
    } else if (bgRemovalMethod === 'pixian' && cloudApiKey) {
      // Use Pixian.ai API
      removalResult = {
        transparentBase64: await removeBackgroundPixian(imageBase64, cloudApiKey),
        bgRemovalMethod,
      }
    } else if (bgRemovalMethod === 'cloud' && cloudApiKey) {
      // Use remove.bg cloud API
      removalResult = {
        transparentBase64: await removeBackgroundCloud(imageBase64, {
          apiKey: cloudApiKey
        }),
        bgRemovalMethod,
      }
    } else {
      // Use local methods (auto, simple, chromakey)
      removalResult = {
        transparentBase64: await removeBackground(imageBase64, {
          method: bgRemovalMethod,
          tolerance: 12,
          edgeSmoothing: true,
        }),
        bgRemovalMethod,
      }
    }

    console.log("[Remove BG API] Background removed successfully")

    // Upload to Vercel Blob. If Blob isn't configured (missing
    // BLOB_READ_WRITE_TOKEN), fall back to a base64 data URL so the tool still
    // works instead of hard-failing — same resilience pattern as logo-history.
    const buffer = Buffer.from(removalResult.transparentBase64, 'base64')
    const filename = `logos/rb-${Date.now()}-${Math.random().toString(36).substring(2, 8)}.png`

    let imageUrl: string
    try {
      console.log("[Remove BG API] Uploading to Vercel Blob...")
      const blobResult = await put(filename, buffer, {
        access: 'public',
        contentType: 'image/png'
      })
      imageUrl = blobResult.url
      console.log("[Remove BG API] Uploaded to Blob:", imageUrl)
    } catch (blobErr) {
      console.error("[Remove BG API] Blob upload failed, returning data URL:", blobErr)
      imageUrl = `data:image/png;base64,${removalResult.transparentBase64}`
    }

    // Server-side history save (if metadata provided)
    let historyId: number | null = null
    if (userId && prompt) {
      try {
        console.log("[Remove BG API] Saving to history for user:", userId)
        const sql = neon(process.env.NEON_DATABASE_URL!)
        const config = JSON.stringify({
          wasBackgroundRemoval: true,
          originalUrl: originalUrl || null,
          bgRemovalMethod: removalResult.bgRemovalMethod,
          fallbackWarning: removalResult.fallbackWarning || null,
        })

        const result = await sql`
          INSERT INTO logo_history (user_id, image_url, prompt, seed, style, config, is_favorited)
          VALUES (${userId}, ${imageUrl}, ${prompt}, ${seed ? parseInt(seed) : null}, ${style}, ${config}::jsonb, false)
          RETURNING id
        `
        historyId = result[0]?.id
        console.log("[Remove BG API] Saved to history with ID:", historyId)
      } catch (historyErr) {
        console.error("[Remove BG API] Failed to save to history:", historyErr)
        // Don't fail the request if history save fails
      }
    }

    return NextResponse.json({
      success: true,
      image: imageUrl,  // Blob URL, or a base64 data URL if Blob is unconfigured
      bgRemovalMethod: removalResult.bgRemovalMethod,
      fallbackWarning: removalResult.fallbackWarning,
      historyId,  // Return the history ID if saved
    })
  } catch (error) {
    console.error("[Remove BG API] Route error:", error)
    if (isPhotoRoomBgRemovalError(error)) {
      const providerStatus = error.status >= 500 ? 502 : error.status
      return NextResponse.json(
        {
          error: falConfigNote ? `${error.message} — ${falConfigNote}, so PhotoRoom was used instead` : error.message,
          code: error.status === 402 || error.status === 429 || error.status === 503
            ? 'provider_unavailable'
            : 'provider_error',
          provider: 'photoroom',
          providerCode: error.code,
        },
        { status: providerStatus }
      )
    }

    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Failed to remove background" },
      { status: 500 }
    )
  }
}

export const POST = withCreditGuard('background_removal', flatCost('removeBackground'), handlePost)
