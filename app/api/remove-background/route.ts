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
import { removeBackgroundWithPhotoRoom } from "@/lib/photoroom-bg-removal"

async function handlePost(request: NextRequest) {
  const rateLimited = await enforceRateLimit(request, RATE_LIMITS.transform)
  if (rateLimited) return rateLimited

  try {
    const formData = await request.formData()
    const imageFile = formData.get('image') as File | null
    const bgRemovalMethod = (formData.get('bgRemovalMethod') as BackgroundRemovalMethod) || 'photoroom'
    const cloudApiKey = formData.get('cloudApiKey') as string | null

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
    let transparentBase64: string

    if (bgRemovalMethod === 'smart') {
      // Use Smart removal - detects background color and preserves ALL content including text
      transparentBase64 = await removeBackgroundSmart(imageBase64, {
        tolerance: 25,
        edgeSmoothing: false,  // Disabled - causes artifacts
      })
    } else if (bgRemovalMethod === 'replicate') {
      // Use Replicate AI (BRIA) - works on any background color with 256 levels of transparency
      // Pass isLogoContext for text-preserving settings when in logo context
      transparentBase64 = await removeBackgroundWithReplicate(imageBase64, 'bria', { isLogoContext })
    } else if (bgRemovalMethod === '851-labs') {
      // Use 851-labs/background-remover - very cheap, good threshold control
      transparentBase64 = await removeBackgroundWithReplicate(imageBase64, '851-labs')
    } else if (bgRemovalMethod === 'pixelcut') {
      // Use Pixelcut API - logo-optimized, preserves text and fine details
      transparentBase64 = await removeBackgroundWithPixelcut(imageBase64, cloudApiKey || undefined)
    } else if (bgRemovalMethod === 'photoroom') {
      // Use PhotoRoom API - professional-grade with fast processing
      transparentBase64 = await removeBackgroundWithPhotoRoom(imageBase64, cloudApiKey || undefined)
    } else if (bgRemovalMethod === 'pixian' && cloudApiKey) {
      // Use Pixian.ai API
      transparentBase64 = await removeBackgroundPixian(imageBase64, cloudApiKey)
    } else if (bgRemovalMethod === 'cloud' && cloudApiKey) {
      // Use remove.bg cloud API
      transparentBase64 = await removeBackgroundCloud(imageBase64, {
        apiKey: cloudApiKey
      })
    } else {
      // Use local methods (auto, simple, chromakey)
      transparentBase64 = await removeBackground(imageBase64, {
        method: bgRemovalMethod,
        tolerance: 12,
        edgeSmoothing: true,
      })
    }

    console.log("[Remove BG API] Background removed successfully")

    // Upload to Vercel Blob instead of returning huge data URI
    const buffer = Buffer.from(transparentBase64, 'base64')
    const filename = `logos/rb-${Date.now()}-${Math.random().toString(36).substring(2, 8)}.png`

    console.log("[Remove BG API] Uploading to Vercel Blob...")
    const blobResult = await put(filename, buffer, {
      access: 'public',
      contentType: 'image/png'
    })

    console.log("[Remove BG API] Uploaded to Blob:", blobResult.url)

    // Server-side history save (if metadata provided)
    let historyId: number | null = null
    if (userId && prompt) {
      try {
        console.log("[Remove BG API] Saving to history for user:", userId)
        const sql = neon(process.env.NEON_DATABASE_URL!)
        const config = JSON.stringify({
          wasBackgroundRemoval: true,
          originalUrl: originalUrl || null,
          bgRemovalMethod
        })

        const result = await sql`
          INSERT INTO logo_history (user_id, image_url, prompt, seed, style, config, is_favorited)
          VALUES (${userId}, ${blobResult.url}, ${prompt}, ${seed ? parseInt(seed) : null}, ${style}, ${config}::jsonb, false)
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
      image: blobResult.url,  // Return URL instead of data URI
      bgRemovalMethod,
      historyId,  // Return the history ID if saved
    })
  } catch (error) {
    console.error("[Remove BG API] Route error:", error)
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Failed to remove background" },
      { status: 500 }
    )
  }
}

export const POST = withCreditGuard('background_removal', flatCost('removeBackground'), handlePost)
