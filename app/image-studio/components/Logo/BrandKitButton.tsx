"use client"

/**
 * BrandKitButton
 *
 * One-click brand package for the generated logo: popover with a brand-name
 * field → /api/brand-kit builds the ZIP (sizes, favicons, social canvases,
 * SVG, palette) → browser downloads it.
 */

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover'
import { Loader2, Package } from 'lucide-react'
import { toast } from 'sonner'
import type { GeneratedLogo } from '../../hooks/useLogoGeneration'

function suggestBrandName(prompt: string): string {
  const words = prompt
    .replace(/[^a-zA-Z0-9\s]/g, ' ')
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 3)
  if (words.length === 0) return ''
  return words.map((w) => w.charAt(0).toUpperCase() + w.slice(1)).join(' ')
}

export function BrandKitButton({ generatedLogo }: { generatedLogo: GeneratedLogo }) {
  const [isOpen, setIsOpen] = useState(false)
  const [brandName, setBrandName] = useState('')
  const [isBuilding, setIsBuilding] = useState(false)

  const handleOpenChange = (open: boolean) => {
    setIsOpen(open)
    if (open && !brandName) setBrandName(suggestBrandName(generatedLogo.prompt))
  }

  const handleBuild = async () => {
    setIsBuilding(true)
    const toastId = toast.loading('Building your brand kit — sizes, favicons, social banners, SVG…')
    try {
      const res = await fetch('/api/brand-kit', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ imageUrl: generatedLogo.url, brandName: brandName.trim() || undefined }),
      })
      const contentType = res.headers.get('content-type') || ''

      if (!res.ok) {
        const data = contentType.includes('json') ? await res.json() : null
        toast.error(data?.error || 'Brand kit failed — please try again', { id: toastId })
        return
      }

      const link = document.createElement('a')
      if (contentType.includes('application/zip')) {
        // Direct ZIP response (Blob storage unavailable).
        const objectUrl = URL.createObjectURL(await res.blob())
        link.href = objectUrl
        link.download = 'brand-kit.zip'
        link.click()
        URL.revokeObjectURL(objectUrl)
      } else {
        const data = await res.json()
        if (!data.url) {
          toast.error(data.error || 'Brand kit failed — please try again', { id: toastId })
          return
        }
        link.href = data.url
        link.download = data.fileName || 'brand-kit.zip'
        link.click()
      }

      toast.success('Brand kit downloaded — logo sizes, favicons, social banners, SVG and palette', {
        id: toastId,
      })
      setIsOpen(false)
    } catch {
      toast.error('Brand kit failed — please try again', { id: toastId })
    } finally {
      setIsBuilding(false)
    }
  }

  return (
    <Popover open={isOpen} onOpenChange={handleOpenChange}>
      <PopoverTrigger asChild>
        <Button
          size="sm"
          className="h-8 flex-1 bg-linear-to-r from-[#c99850]/20 to-[#dbb56e]/20 hover:from-[#c99850]/30 hover:to-[#dbb56e]/30 text-[#dbb56e] border border-[#c99850]/40 text-xs"
          title="Download a complete brand package: logo sizes, favicons, social banners, SVG, color palette"
        >
          <Package className="w-3 h-3 mr-1.5" />
          Brand Kit
        </Button>
      </PopoverTrigger>
      <PopoverContent align="start" className="w-72 bg-zinc-900 border-zinc-700 p-3 space-y-3">
        <div>
          <p className="text-sm font-medium text-white">Brand kit</p>
          <p className="mt-1 text-xs leading-5 text-zinc-400">
            One ZIP with your logo at every size, favicon set, social-media banners, SVG vector, and
            color palette.
          </p>
        </div>
        <div className="space-y-1.5">
          <label htmlFor="brand-kit-name" className="text-xs font-medium text-zinc-300">
            Brand name (used in the files)
          </label>
          <Input
            id="brand-kit-name"
            value={brandName}
            onChange={(e) => setBrandName(e.target.value)}
            placeholder="Your Brand"
            maxLength={80}
            className="h-8 bg-zinc-950 border-zinc-700 text-white text-sm"
          />
        </div>
        <Button
          onClick={handleBuild}
          disabled={isBuilding}
          className="w-full h-8 text-xs font-medium bg-linear-to-r from-[#c99850] to-[#dbb56e] text-black hover:from-[#dbb56e] hover:to-[#c99850]"
        >
          {isBuilding ? (
            <>
              <Loader2 className="w-3.5 h-3.5 mr-1.5 animate-spin" />
              Building…
            </>
          ) : (
            <>
              <Package className="w-3.5 h-3.5 mr-1.5" />
              Generate & download
            </>
          )}
        </Button>
      </PopoverContent>
    </Popover>
  )
}
