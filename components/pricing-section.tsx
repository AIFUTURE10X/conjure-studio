"use client"

import Link from "next/link"
import { Check } from "lucide-react"
import { CREDIT_PACKS } from "@/lib/billing/packs"

/** Landing-page pricing: pay-as-you-go credit packs, no subscription. */
export function PricingSection() {
  return (
    <section className="bg-black px-4 py-20">
      <div className="mx-auto w-full max-w-4xl space-y-10">
        <div className="text-center space-y-3">
          <h2 className="text-3xl font-bold text-white">Simple, pay-as-you-go pricing</h2>
          <p className="font-mono text-sm text-foreground/60 max-w-[480px] mx-auto">
            No subscription. Buy credits when you need them — they never expire.
            New accounts start with 30 free credits.
          </p>
        </div>

        <div className="grid gap-5 sm:grid-cols-3">
          {CREDIT_PACKS.map((pack) => (
            <div
              key={pack.id}
              className={`flex flex-col rounded-2xl border bg-zinc-950 p-6 ${
                pack.id === "creator" ? "border-[#FF8C1A]/60 ring-1 ring-[#FF8C1A]/30" : "border-zinc-800"
              }`}
            >
              {pack.id === "creator" && (
                <span className="mb-3 self-start rounded-full bg-[#FF8C1A]/15 px-2.5 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-[#FF8C1A]">
                  Most popular
                </span>
              )}
              <h3 className="text-lg font-semibold text-white">{pack.name}</h3>
              <p className="mt-2 text-3xl font-bold text-white">
                ${(pack.amountUsdCents / 100).toFixed(0)}
                <span className="ml-2 text-sm font-normal text-zinc-400">{pack.credits} credits</span>
              </p>
              <p className="mt-3 flex-1 text-sm leading-6 text-zinc-400">{pack.blurb}</p>
              <ul className="mt-4 space-y-1.5 text-xs text-zinc-500">
                {["Images, logos, mockups & 4K", "Failed runs auto-refunded"].map((line) => (
                  <li key={line} className="flex items-center gap-2">
                    <Check className="w-3.5 h-3.5 text-[#FF8C1A]" />
                    {line}
                  </li>
                ))}
              </ul>
              <Link
                href="/sign-in"
                className="mt-6 rounded-lg bg-[#FF8C1A] px-4 py-2.5 text-center text-sm font-medium text-white hover:bg-[#FF8C1A]/90 transition-colors"
              >
                Get started
              </Link>
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}
