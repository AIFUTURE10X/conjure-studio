"use client"

/**
 * CreditsPageClient
 *
 * Buy-credits page: balance, the three packs → Stripe Checkout, and
 * success/cancelled banners after returning from Stripe. The webhook does
 * the actual granting, so the success banner notes a short delay.
 */

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { useSearchParams } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { ArrowLeft, Check, Coins, Loader2, Receipt } from 'lucide-react'
import { toast } from 'sonner'
import { useSession } from '@/lib/auth-client'
import { CREDIT_PACKS } from '@/lib/billing/packs'

export function CreditsPageClient() {
  const { data: session, isPending } = useSession()
  const searchParams = useSearchParams()
  const status = searchParams.get('status')
  const [balance, setBalance] = useState<number | null>(null)
  const [buyingPackId, setBuyingPackId] = useState<string | null>(null)

  useEffect(() => {
    if (!session) return
    fetch('/api/account/credits')
      .then((res) => (res.ok ? res.json() : null))
      .then((data) => setBalance(typeof data?.balance === 'number' ? data.balance : null))
      .catch(() => setBalance(null))
  }, [session, status])

  const handleBuy = async (packId: string) => {
    setBuyingPackId(packId)
    try {
      const res = await fetch('/api/stripe/checkout', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ packId }),
      })
      const data = await res.json()
      if (!res.ok || !data.url) {
        toast.error(data.error || 'Could not start checkout')
        return
      }
      window.location.href = data.url
    } catch {
      toast.error('Could not start checkout — please try again')
    } finally {
      setBuyingPackId(null)
    }
  }

  const handlePortal = async () => {
    try {
      const res = await fetch('/api/stripe/portal', { method: 'POST' })
      const data = await res.json()
      if (!res.ok || !data.url) {
        toast.error(data.error || 'No billing history yet')
        return
      }
      window.location.href = data.url
    } catch {
      toast.error('Could not open the billing portal')
    }
  }

  return (
    <div className="min-h-screen bg-linear-to-br from-zinc-950 via-black to-zinc-950 px-4 py-10">
      <div className="mx-auto w-full max-w-3xl space-y-8">
        <div className="flex items-center justify-between">
          <Link
            href="/image-studio"
            className="flex items-center gap-1.5 text-sm text-zinc-400 hover:text-white transition-colors"
          >
            <ArrowLeft className="w-4 h-4" />
            Back to the studio
          </Link>
          {session && (
            <button
              onClick={handlePortal}
              className="flex items-center gap-1.5 text-xs text-zinc-500 hover:text-zinc-300 transition-colors"
            >
              <Receipt className="w-3.5 h-3.5" />
              Billing history
            </button>
          )}
        </div>

        {status === 'success' && (
          <div className="rounded-lg border border-emerald-700/50 bg-emerald-950/40 px-4 py-3 text-sm text-emerald-300">
            Payment received — your credits will appear within a few seconds. Refresh if you don’t see them yet.
          </div>
        )}
        {status === 'cancelled' && (
          <div className="rounded-lg border border-zinc-700 bg-zinc-900/60 px-4 py-3 text-sm text-zinc-300">
            Checkout cancelled — no charge was made.
          </div>
        )}

        <div className="text-center space-y-2">
          <h1 className="text-2xl font-semibold text-white">Credits</h1>
          <p className="text-sm text-zinc-400">
            Credits power generations: roughly 1 credit per standard image, more for 4K and ChatGPT Images.
          </p>
          {session && (
            <p className="inline-flex items-center gap-2 rounded-full border border-[#c99850]/40 bg-[#c99850]/10 px-4 py-1.5 text-sm text-[#f0d49b]">
              <Coins className="w-4 h-4" />
              Balance: <span className="font-semibold">{balance === null ? '—' : balance}</span>
            </p>
          )}
        </div>

        {!session && !isPending ? (
          <div className="rounded-xl border border-zinc-800 bg-zinc-900/60 p-8 text-center space-y-3">
            <p className="text-sm text-zinc-300">Sign in to buy credits and keep your work on your account.</p>
            <Link
              href="/sign-in"
              className="inline-block rounded-lg bg-linear-to-r from-[#c99850] to-[#dbb56e] px-5 py-2 text-sm font-medium text-black hover:from-[#dbb56e] hover:to-[#c99850] transition-colors"
            >
              Sign in
            </Link>
          </div>
        ) : (
          <div className="grid gap-4 sm:grid-cols-3">
            {CREDIT_PACKS.map((pack) => (
              <div
                key={pack.id}
                className={`flex flex-col rounded-xl border bg-zinc-900/60 p-5 ${
                  pack.id === 'creator' ? 'border-[#c99850]/60 ring-1 ring-[#c99850]/30' : 'border-zinc-800'
                }`}
              >
                {pack.id === 'creator' && (
                  <span className="mb-2 self-start rounded-full bg-[#c99850]/15 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-[#f0d49b]">
                    Most popular
                  </span>
                )}
                <h2 className="text-base font-semibold text-white">{pack.name}</h2>
                <p className="mt-1 text-2xl font-bold text-[#f0d49b]">
                  {pack.credits}
                  <span className="ml-1 text-xs font-normal text-zinc-400">credits</span>
                </p>
                <p className="mt-2 flex-1 text-xs leading-5 text-zinc-400">{pack.blurb}</p>
                <Button
                  onClick={() => handleBuy(pack.id)}
                  disabled={buyingPackId !== null}
                  className="mt-4 w-full font-medium bg-linear-to-r from-[#c99850] to-[#dbb56e] text-black hover:from-[#dbb56e] hover:to-[#c99850]"
                >
                  {buyingPackId === pack.id ? (
                    <Loader2 className="w-4 h-4 animate-spin" />
                  ) : (
                    <>${(pack.amountUsdCents / 100).toFixed(0)}</>
                  )}
                </Button>
              </div>
            ))}
          </div>
        )}

        <ul className="mx-auto max-w-md space-y-1.5 text-xs text-zinc-500">
          {[
            'New accounts start with 30 free credits',
            'Credits never expire',
            'Failed generations are automatically refunded',
          ].map((line) => (
            <li key={line} className="flex items-center gap-2">
              <Check className="w-3.5 h-3.5 text-[#c99850]" />
              {line}
            </li>
          ))}
        </ul>
      </div>
    </div>
  )
}
