"use client"

/**
 * AccountMenu
 *
 * Real-auth account slot in the StudioTopBar. Signed out: a Sign in link.
 * Signed in: avatar popover with the user's identity, credit balance, and
 * sign out. Credits load from /api/account/credits when available.
 */

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover'
import { Coins, FolderInput, Loader2, LogIn, LogOut, UserCircle2 } from 'lucide-react'
import { toast } from 'sonner'
import { useSession, signOut } from '@/lib/auth-client'
import { getKnownUserIds } from '@/lib/user-id'

const claimMarkerKey = (accountId: string, knownIds: string[]) =>
  `genie-claimed-known-ids:${accountId}:${[...knownIds].sort().join('|')}`

export function AccountMenu() {
  const { data: session, isPending } = useSession()
  const [isOpen, setIsOpen] = useState(false)
  const [credits, setCredits] = useState<number | null>(null)
  const [isClaiming, setIsClaiming] = useState(false)

  const handleClaim = async () => {
    setIsClaiming(true)
    try {
      const res = await fetch('/api/account/claim', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ legacyUserIds: getKnownUserIds() }),
      })
      const data = await res.json()
      if (!res.ok) {
        toast.error(data.error || 'Claim failed')
        return
      }
      toast.success(
        data.alreadyClaimed
          ? 'This device’s data is already on your account'
          : `Moved ${data.moved} items to your account`,
      )
      setTimeout(() => window.location.reload(), 600)
    } catch {
      toast.error('Claim failed — please try again')
    } finally {
      setIsClaiming(false)
    }
  }

  useEffect(() => {
    if (!session?.user?.id) return

    const knownIds = getKnownUserIds()
    if (knownIds.length === 0) return

    const storageKey = claimMarkerKey(session.user.id, knownIds)
    if (localStorage.getItem(storageKey)) return

    let cancelled = false

    fetch('/api/account/claim', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ legacyUserIds: knownIds }),
    })
      .then(async (res) => {
        const data = await res.json().catch(() => null)
        if (!res.ok) throw new Error(data?.error || 'Claim failed')
        return data
      })
      .then((data) => {
        if (cancelled) return
        localStorage.setItem(storageKey, '1')
        if (typeof data?.moved === 'number' && data.moved > 0) {
          toast.success(`Restored ${data.moved} saved items to your account`)
          setTimeout(() => window.location.reload(), 700)
        }
      })
      .catch((error) => {
        if (!cancelled) console.error('[AccountMenu] Automatic data claim failed:', error)
      })

    return () => {
      cancelled = true
    }
  }, [session])

  // Load on sign-in, refresh whenever the popover opens.
  useEffect(() => {
    if (!session) return
    fetch('/api/account/credits')
      .then((res) => (res.ok ? res.json() : null))
      .then((data) => setCredits(typeof data?.balance === 'number' ? data.balance : null))
      .catch(() => setCredits(null))
  }, [isOpen, session])

  if (isPending) return null

  if (!session) {
    return (
      <Link
        href="/sign-in"
        className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium bg-linear-to-r from-[#c99850] to-[#dbb56e] text-black hover:from-[#dbb56e] hover:to-[#c99850] transition-colors"
      >
        <LogIn className="w-3.5 h-3.5" />
        <span className="hidden sm:inline">Sign in</span>
      </Link>
    )
  }

  const { user } = session

  return (
    <Popover open={isOpen} onOpenChange={setIsOpen}>
      <PopoverTrigger asChild>
        <Button
          variant="ghost"
          size="sm"
          className="h-8 px-2 text-zinc-300 hover:text-white hover:bg-zinc-800"
          title="Your account"
        >
          <UserCircle2 className="w-4 h-4 mr-1 text-[#dbb56e]" />
          <span className="hidden sm:inline text-xs max-w-[120px] truncate">
            {user.name || user.email}
          </span>
        </Button>
      </PopoverTrigger>

      <PopoverContent align="end" className="w-64 bg-zinc-900 border-zinc-700 p-0">
        <div className="p-3 border-b border-zinc-800">
          <p className="text-sm font-medium text-white truncate">{user.name || 'Account'}</p>
          <p className="text-xs text-zinc-500 truncate">{user.email}</p>
        </div>

        <div className="px-3 py-2 border-b border-zinc-800 flex items-center justify-between">
          <span className="flex items-center gap-1.5 text-xs text-zinc-400">
            <Coins className="w-3.5 h-3.5 text-[#dbb56e]" />
            Credits
          </span>
          <span className="flex items-center gap-2">
            <span className="text-sm font-semibold text-[#f0d49b]">
              {credits === null ? '—' : credits}
            </span>
            <Link
              href="/credits"
              className="rounded-md border border-[#c99850]/40 bg-[#c99850]/10 px-2 py-0.5 text-[10px] font-semibold text-[#f0d49b] hover:bg-[#c99850]/20 transition-colors"
            >
              Buy
            </Link>
          </span>
        </div>

        <div className="p-2 space-y-1">
          <button
            onClick={handleClaim}
            disabled={isClaiming}
            title="Move this browser's anonymous images, logos, and favorites onto your account"
            className="w-full flex items-center gap-2 px-3 py-2 rounded-md text-sm text-zinc-300 hover:bg-zinc-800 hover:text-white transition-colors disabled:opacity-50"
          >
            {isClaiming ? <Loader2 className="w-4 h-4 animate-spin" /> : <FolderInput className="w-4 h-4" />}
            Claim this device’s data
          </button>
          <button
            onClick={() => void signOut().then(() => window.location.reload())}
            className="w-full flex items-center gap-2 px-3 py-2 rounded-md text-sm text-zinc-300 hover:bg-zinc-800 hover:text-white transition-colors"
          >
            <LogOut className="w-4 h-4" />
            Sign out
          </button>
        </div>
      </PopoverContent>
    </Popover>
  )
}
