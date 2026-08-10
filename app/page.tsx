import Image from "next/image"
import Link from "next/link"
import {
  ArrowRight,
  ArrowUpRight,
  Clapperboard,
  ImageIcon,
  Layers3,
  Package,
  PenTool,
  Sparkles,
} from "lucide-react"

const capabilities = [
  {
    icon: ImageIcon,
    label: "Images",
    copy: "Create, refine, upscale, and edit without breaking your flow.",
  },
  {
    icon: PenTool,
    label: "Logos",
    copy: "Shape brand-ready marks, variations, and transparent exports.",
  },
  {
    icon: Clapperboard,
    label: "Motion",
    copy: "Turn still ideas into cinematic clips and connected scenes.",
  },
  {
    icon: Package,
    label: "Mockups",
    copy: "Place your work on products and export presentation-ready files.",
  },
]

const workflow = [
  {
    number: "01",
    title: "Describe the spark",
    copy: "Start in your own words. The studio helps shape the prompt, style, composition, and production settings.",
  },
  {
    number: "02",
    title: "Direct the result",
    copy: "Generate, compare, edit, remove backgrounds, and build variations while the idea is still fresh.",
  },
  {
    number: "03",
    title: "Take it further",
    copy: "Move the same concept into logos, motion, mockups, and your organized Creation Library.",
  },
]

const Brand = () => (
  <Link href="/" className="group flex items-center gap-3" aria-label="Conjure Studio home">
    <span className="relative grid size-10 place-items-center overflow-hidden rounded-xl border border-[#dfb86a]/25 bg-[#151109] shadow-[0_0_30px_rgba(223,184,106,0.08)] transition-transform duration-300 group-hover:-rotate-3">
      <span aria-hidden="true" className="size-10 bg-[url('/icon.svg')] bg-cover" />
    </span>
    <span>
      <span className="block text-[15px] font-semibold tracking-[-0.01em] text-white">Conjure Studio</span>
      <span className="block text-[9px] font-medium uppercase tracking-[0.22em] text-[#a69e91]">AI creative atelier</span>
    </span>
  </Link>
)

export default function LandingPage() {
  return (
    <main className="min-h-screen overflow-hidden bg-[#070706] text-[#f7f3eb] selection:bg-[#dfb86a] selection:text-black">
      <div className="pointer-events-none fixed inset-0 z-50 opacity-[0.035] [background-image:url('data:image/svg+xml,%3Csvg_viewBox=%220_0_180_180%22_xmlns=%22http://www.w3.org/2000/svg%22%3E%3Cfilter_id=%22n%22%3E%3CfeTurbulence_type=%22fractalNoise%22_baseFrequency=%22.9%22_numOctaves=%224%22_stitchTiles=%22stitch%22/%3E%3C/filter%3E%3Crect_width=%22100%25%22_height=%22100%25%22_filter=%22url(%23n)%22_opacity=%22.7%22/%3E%3C/svg%3E')]" />

      <header className="absolute inset-x-0 top-0 z-40 border-b border-white/[0.07] bg-[#070706]/80 backdrop-blur-xl">
        <div className="mx-auto flex h-[76px] max-w-[1440px] items-center justify-between px-5 sm:px-8 lg:px-12">
          <Brand />

          <nav className="hidden items-center gap-8 text-[13px] font-medium text-[#a69e91] md:flex" aria-label="Main navigation">
            <a href="#work" className="transition-colors hover:text-white">What it makes</a>
            <a href="#workflow" className="transition-colors hover:text-white">How it works</a>
            <a href="#capabilities" className="transition-colors hover:text-white">Inside the studio</a>
          </nav>

          <Link
            href="/image-studio"
            className="group hidden items-center gap-2 rounded-full border border-[#dfb86a]/30 bg-[#dfb86a] px-5 py-2.5 text-[13px] font-semibold text-[#120e07] transition-all hover:bg-[#edcc89] md:flex"
          >
            Open studio
            <ArrowUpRight className="size-3.5 transition-transform group-hover:translate-x-0.5 group-hover:-translate-y-0.5" />
          </Link>

          <Link
            href="/image-studio"
            className="grid size-10 place-items-center rounded-full bg-[#dfb86a] text-black md:hidden"
            aria-label="Open Conjure Studio"
          >
            <ArrowUpRight className="size-4" />
          </Link>
        </div>
      </header>

      <section className="relative isolate min-h-[860px] px-5 pb-16 pt-32 sm:px-8 lg:min-h-screen lg:px-12 lg:pb-8 lg:pt-28">
        <div className="pointer-events-none absolute -left-48 top-16 size-[520px] rounded-full bg-[#8d6129]/[0.09] blur-[130px]" />
        <div className="pointer-events-none absolute right-0 top-0 h-[70%] w-[55%] bg-[radial-gradient(circle_at_center,rgba(223,184,106,0.08),transparent_66%)]" />

        <div className="mx-auto grid min-h-[calc(100vh-7rem)] max-w-[1440px] items-center gap-14 lg:grid-cols-[0.88fr_1.12fr] lg:gap-8">
          <div className="relative z-10 max-w-[680px] py-8 lg:py-16">
            <div className="mb-7 flex items-center gap-3 text-[10px] font-semibold uppercase tracking-[0.24em] text-[#c5bcae]">
              <span className="grid size-7 place-items-center rounded-full border border-[#dfb86a]/25 bg-[#dfb86a]/10">
                <Sparkles className="size-3.5 text-[#dfb86a]" />
              </span>
              One idea. Every visual direction.
            </div>

            <h1 className="landing-display max-w-[680px] text-[clamp(3.7rem,7.2vw,7.6rem)] font-medium leading-[0.83] tracking-[-0.07em] text-[#f5f0e7]">
              Conjure the
              <span className="block text-[#dfb86a]">impossible.</span>
            </h1>

            <p className="mt-8 max-w-[570px] text-base leading-7 text-[#a69e91] sm:text-lg sm:leading-8">
              A focused AI studio for turning a rough thought into images, logos, motion, and product-ready mockups—without stitching together five different tools.
            </p>

            <div className="mt-9 flex flex-col gap-3 sm:flex-row">
              <Link
                href="/image-studio"
                className="group inline-flex min-h-14 items-center justify-center gap-3 rounded-full bg-[#dfb86a] px-7 text-sm font-semibold text-[#120e07] transition-all hover:bg-[#edcc89]"
              >
                Enter the studio
                <ArrowRight className="size-4 transition-transform group-hover:translate-x-1" />
              </Link>
              <a
                href="#work"
                className="inline-flex min-h-14 items-center justify-center rounded-full border border-white/15 bg-white/[0.03] px-7 text-sm font-medium text-[#ded7cc] transition-colors hover:border-white/30 hover:bg-white/[0.06]"
              >
                See what it makes
              </a>
            </div>

            <div className="mt-12 flex flex-wrap items-center gap-x-8 gap-y-4 border-t border-white/[0.09] pt-6 text-[11px] uppercase tracking-[0.17em] text-[#706a61]">
              <span>Image generation</span>
              <span>Logo direction</span>
              <span>Image to video</span>
              <span>4K export</span>
            </div>
          </div>

          <div className="relative mx-auto w-full max-w-[760px] lg:ml-auto lg:max-w-none">
            <div className="relative ml-auto aspect-[4/4.9] w-full max-w-[720px] overflow-hidden rounded-[2rem] border border-white/10 bg-[#0c0a08] shadow-[0_40px_120px_rgba(0,0,0,0.65)] sm:rounded-[2.6rem]">
              <Image
                src="/conjure-hero-atelier.webp"
                alt="A golden creative lamp transforming an idea into a portrait, product image, logo, and cinematic landscape"
                fill
                priority
                sizes="(max-width: 1024px) 92vw, 52vw"
                className="object-cover"
              />
              <div className="absolute inset-0 bg-[linear-gradient(180deg,transparent_55%,rgba(7,7,6,0.88)_100%)]" />
              <div className="absolute inset-x-6 bottom-5 flex items-end justify-between gap-5 sm:inset-x-8 sm:bottom-7">
                <div>
                  <p className="text-[10px] font-semibold uppercase tracking-[0.22em] text-[#dfb86a]">Creative flow</p>
                  <p className="mt-1 text-sm font-medium text-white sm:text-base">Prompt → Image → Motion</p>
                </div>
                <span className="grid size-11 shrink-0 place-items-center rounded-full border border-white/15 bg-black/35 backdrop-blur-md">
                  <Layers3 className="size-4 text-[#dfb86a]" />
                </span>
              </div>
            </div>

            <div className="absolute -left-3 top-[13%] hidden rounded-2xl border border-white/10 bg-[#0c0b09]/85 p-3.5 shadow-2xl backdrop-blur-xl sm:block lg:-left-8">
              <div className="flex items-center gap-3">
                <span className="grid size-9 place-items-center rounded-xl bg-[#dfb86a]/12">
                  <Sparkles className="size-4 text-[#dfb86a]" />
                </span>
                <div>
                  <p className="text-[9px] uppercase tracking-[0.16em] text-[#777067]">Studio state</p>
                  <p className="mt-0.5 text-xs font-medium text-white">Ready to create</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      <section id="work" className="border-y border-white/[0.08] bg-[#0a0908] px-5 py-24 sm:px-8 lg:px-12 lg:py-32">
        <div className="mx-auto max-w-[1440px]">
          <div className="grid gap-10 lg:grid-cols-[0.7fr_1.3fr] lg:gap-20">
            <div>
              <p className="text-[10px] font-semibold uppercase tracking-[0.24em] text-[#dfb86a]">What it makes</p>
              <h2 className="landing-display mt-5 max-w-md text-5xl font-medium leading-[0.95] tracking-[-0.045em] text-[#f5f0e7] sm:text-6xl">
                One spark. A whole campaign.
              </h2>
              <p className="mt-6 max-w-md text-sm leading-7 text-[#938b80]">
                Keep the idea—not the app-switching—at the center of the process. Each tool is built to hand the work naturally to the next.
              </p>
            </div>

            <div id="capabilities" className="grid gap-px overflow-hidden rounded-[1.6rem] border border-white/[0.08] bg-white/[0.08] sm:grid-cols-2">
              {capabilities.map(({ icon: Icon, label, copy }, index) => (
                <article key={label} className="group relative min-h-56 bg-[#0d0c0a] p-7 transition-colors hover:bg-[#12100c] sm:p-8">
                  <div className="flex items-start justify-between">
                    <span className="grid size-11 place-items-center rounded-xl border border-[#dfb86a]/15 bg-[#dfb86a]/[0.07] text-[#dfb86a]">
                      <Icon className="size-5" />
                    </span>
                    <span className="text-[10px] tracking-[0.18em] text-[#4f4b44]">0{index + 1}</span>
                  </div>
                  <h3 className="mt-8 text-xl font-semibold tracking-[-0.02em] text-white">{label}</h3>
                  <p className="mt-3 max-w-xs text-sm leading-6 text-[#888076]">{copy}</p>
                  <div className="absolute bottom-0 left-0 h-px w-0 bg-[#dfb86a] transition-all duration-500 group-hover:w-full" />
                </article>
              ))}
            </div>
          </div>
        </div>
      </section>

      <section id="workflow" className="relative px-5 py-24 sm:px-8 lg:px-12 lg:py-32">
        <div className="pointer-events-none absolute left-1/2 top-0 h-72 w-[70%] -translate-x-1/2 bg-[radial-gradient(ellipse_at_top,rgba(223,184,106,0.07),transparent_70%)]" />
        <div className="relative mx-auto max-w-[1440px]">
          <div className="flex flex-col justify-between gap-6 border-b border-white/[0.09] pb-10 sm:flex-row sm:items-end">
            <div>
              <p className="text-[10px] font-semibold uppercase tracking-[0.24em] text-[#dfb86a]">How it works</p>
              <h2 className="landing-display mt-5 text-5xl font-medium tracking-[-0.05em] sm:text-6xl">From thought to tangible.</h2>
            </div>
            <p className="max-w-sm text-sm leading-6 text-[#8f877c]">A continuous creative workflow built around the way ideas actually evolve.</p>
          </div>

          <div className="grid lg:grid-cols-3">
            {workflow.map((step) => (
              <article key={step.number} className="border-b border-white/[0.09] py-10 lg:border-b-0 lg:border-r lg:px-9 lg:py-14 first:lg:pl-0 last:lg:border-r-0 last:lg:pr-0">
                <span className="text-[11px] font-semibold tracking-[0.2em] text-[#dfb86a]">{step.number}</span>
                <h3 className="mt-10 text-2xl font-semibold tracking-[-0.03em] text-[#f5f0e7]">{step.title}</h3>
                <p className="mt-4 max-w-sm text-sm leading-7 text-[#878075]">{step.copy}</p>
              </article>
            ))}
          </div>
        </div>
      </section>

      <section className="px-5 pb-6 sm:px-8 lg:px-12 lg:pb-10">
        <div className="relative mx-auto max-w-[1440px] overflow-hidden rounded-[2rem] border border-[#dfb86a]/20 bg-[#110e08] px-6 py-16 sm:px-12 lg:px-20 lg:py-24">
          <div className="pointer-events-none absolute -right-24 -top-40 size-[520px] rounded-full bg-[#dfb86a]/10 blur-[100px]" />
          <div className="relative flex flex-col items-start justify-between gap-10 lg:flex-row lg:items-end">
            <div className="max-w-3xl">
              <p className="text-[10px] font-semibold uppercase tracking-[0.24em] text-[#dfb86a]">Your next idea is waiting</p>
              <h2 className="landing-display mt-5 text-5xl font-medium leading-[0.95] tracking-[-0.05em] sm:text-6xl lg:text-7xl">Make the thing you can already see.</h2>
            </div>
            <Link href="/image-studio" className="group inline-flex min-h-14 shrink-0 items-center justify-center gap-3 rounded-full bg-[#dfb86a] px-7 text-sm font-semibold text-[#120e07] transition-colors hover:bg-[#edcc89]">
              Start creating
              <ArrowRight className="size-4 transition-transform group-hover:translate-x-1" />
            </Link>
          </div>
        </div>
      </section>

      <footer className="px-5 py-10 sm:px-8 lg:px-12">
        <div className="mx-auto flex max-w-[1440px] flex-col gap-7 border-t border-white/[0.08] pt-8 sm:flex-row sm:items-center sm:justify-between">
          <Brand />
          <p className="text-[11px] text-[#5e5951]">© {new Date().getFullYear()} Conjure Studio. Built for ideas in motion.</p>
          <Link href="/image-studio" className="flex items-center gap-2 text-xs font-medium text-[#a69e91] transition-colors hover:text-white">
            Enter the studio <ArrowUpRight className="size-3.5" />
          </Link>
        </div>
      </footer>
    </main>
  )
}
