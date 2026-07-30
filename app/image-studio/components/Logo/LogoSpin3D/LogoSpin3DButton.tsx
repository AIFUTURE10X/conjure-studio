"use client"

import { useState } from 'react'
import { Box } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip'
import { LogoSpin3DModal } from './LogoSpin3DModal'

/**
 * Entry point for the 3D spin.
 *
 * Owns the open state and the modal itself rather than taking an `onShow…`
 * callback like the sibling actions do. Both surfaces that render the logo action
 * row (Studio/LogoCanvas and LogoPanel/LogoPanel) then get the feature without
 * duplicating state in each, and LogoActionButtons — already at the 250-line
 * warning threshold in app/image-studio/CLAUDE.md — grows by three lines.
 *
 * Only three.js is code-split (inside the modal's scene); this wrapper is tiny.
 */
export function LogoSpin3DButton({ logoUrl, logoPrompt }: { logoUrl: string; logoPrompt?: string }) {
  const [isOpen, setIsOpen] = useState(false)

  return (
    <>
      <Tooltip>
        <TooltipTrigger asChild>
          <Button
            onClick={() => setIsOpen(true)}
            size="sm"
            className="h-8 flex-1 border border-[#c99850]/30 bg-linear-to-r from-[#c99850]/20 to-[#dbb56e]/20 text-xs text-[#dbb56e] hover:from-[#c99850]/30 hover:to-[#dbb56e]/30"
          >
            <Box className="mr-1.5 h-3 w-3" />
            3D Spin
          </Button>
        </TooltipTrigger>
        <TooltipContent side="bottom">
          Extrude this logo into a rotating 3D preview, built from its own vector paths
        </TooltipContent>
      </Tooltip>

      <LogoSpin3DModal isOpen={isOpen} onClose={() => setIsOpen(false)} logoUrl={logoUrl} logoPrompt={logoPrompt} />
    </>
  )
}
