"use client"

import { Home, Sparkles, ArrowRight, Check } from 'lucide-react'
import { Button } from "@/components/ui/button"
import Link from "next/link"
import Image from "next/image"

export default function LandingPage() {
  return (
    <div className="min-h-screen bg-black text-white">
      {/* Navigation */}
      <header className="border-b border-zinc-800 px-6 py-4">
        <div className="max-w-7xl mx-auto flex items-center justify-between">
          <div className="flex flex-col gap-1">
            <Image src="/logo.png" alt="Conjure Studio Logo" width={300} height={80} className="h-16 w-auto" />
            <p className="text-xs text-zinc-400 font-medium">AI-Powered Creative Tools</p>
          </div>

          <nav className="flex items-center gap-2">
            <Link href="/">
              <button
                className="flex items-center gap-2 px-4 py-2 rounded-lg text-black font-medium relative overflow-hidden"
                style={{
                  background:
                    "linear-gradient(135deg, #c99850 0%, #dbb56e 25%, #f4d698 50%, #dbb56e 75%, #c99850 100%)",
                }}
              >
                <Home className="w-4 h-4 relative z-10 text-black" />
                <span className="text-sm relative z-10">Home</span>
              </button>
            </Link>

            <Link href="/image-studio">
              <button
                className="flex items-center gap-2 px-4 py-2 rounded-lg text-black font-medium relative overflow-hidden"
                style={{
                  background:
                    "linear-gradient(135deg, #c99850 0%, #dbb56e 25%, #f4d698 50%, #dbb56e 75%, #c99850 100%)",
                }}
              >
                <Sparkles className="w-4 h-4 relative z-10 text-black" />
                <span className="text-sm relative z-10">Image Studio</span>
              </button>
            </Link>


                      </nav>

          <Button
            className="font-bold px-6 text-black"
            style={{
              background: "linear-gradient(135deg, #c99850 0%, #dbb56e 25%, #f4d698 50%, #dbb56e 75%, #c99850 100%)",
            }}
          >
            Get Conjure Studio
          </Button>
        </div>
      </header>

      {/* Hero Section */}
      <section className="relative px-6 py-24 overflow-hidden">
        <div className="max-w-5xl mx-auto text-center relative z-10">
          <div
            className="inline-block mb-4 px-4 py-1.5 rounded-full border border-zinc-700"
            style={{
              background: "linear-gradient(135deg, #c99850 0%, #dbb56e 25%, #f4d698 50%, #dbb56e 75%, #c99850 100%)",
            }}
          >
            <span className="text-sm font-medium text-black">Conjure Studio</span>
          </div>

          <h2 className="text-6xl font-bold mb-6 text-balance">
            Professional visual planning and ideation tools for{" "}
            <span
              className="bg-clip-text text-transparent"
              style={{
                backgroundImage:
                  "linear-gradient(135deg, #c99850 0%, #dbb56e 25%, #f4d698 50%, #dbb56e 75%, #c99850 100%)",
              }}
            >
              designers, marketers, and creators
            </span>
          </h2>

          <p className="text-xl text-zinc-400 mb-8 max-w-3xl mx-auto text-pretty">
            Transform your creative workflow with AI-powered image generation, prompt creation, and visual planning
            tools. Build better content faster.
          </p>

          <div className="flex items-center justify-center gap-4">
            <Link href="/image-studio">
              <Button
                className="font-bold px-8 py-6 text-lg text-black"
                style={{
                  background:
                    "linear-gradient(135deg, #c99850 0%, #dbb56e 25%, #f4d698 50%, #dbb56e 75%, #c99850 100%)",
                }}
              >
                Start Creating
                <ArrowRight className="w-5 h-5 ml-2" />
              </Button>
            </Link>
            <Button
              variant="outline"
              className="border-zinc-700 text-white hover:bg-zinc-800 px-8 py-6 text-lg font-medium bg-transparent"
            >
              View Demo
            </Button>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="px-6 py-20 bg-zinc-950">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-16">
            <h3 className="text-4xl font-bold mb-4">Powerful creative tools at your fingertips</h3>
            <p className="text-xl text-zinc-400">Everything you need to bring your visual ideas to life</p>
          </div>

          <div className="max-w-2xl mx-auto">
            {/* Image Studio Card */}
            <Link href="/image-studio">
              <div className="group bg-zinc-900 rounded-2xl p-8 border border-zinc-800 hover:border-[#c99850] transition-all cursor-pointer">
                <div
                  className="w-16 h-16 rounded-xl flex items-center justify-center mb-6 group-hover:opacity-90 transition-opacity"
                  style={{
                    background:
                      "linear-gradient(135deg, #c99850 0%, #dbb56e 25%, #f4d698 50%, #dbb56e 75%, #c99850 100%)",
                  }}
                >
                  <Sparkles className="w-8 h-8 text-black" />
                </div>
                <h4 className="text-2xl font-bold mb-3">Image Studio</h4>
                <p className="text-zinc-400 mb-6">
                  Create stunning AI-generated images with advanced prompt engineering tools. Save favorites, manage history, and iterate on your creative vision.
                </p>
                <ul className="space-y-2 mb-6">
                  <li className="flex items-center gap-2 text-sm text-zinc-300">
                    <Check className="w-4 h-4" style={{ color: "#c99850" }} />
                    AI-powered image generation
                  </li>
                  <li className="flex items-center gap-2 text-sm text-zinc-300">
                    <Check className="w-4 h-4" style={{ color: "#c99850" }} />
                    Smart prompt suggestions
                  </li>
                  <li className="flex items-center gap-2 text-sm text-zinc-300">
                    <Check className="w-4 h-4" style={{ color: "#c99850" }} />
                    Favorites and history tracking
                  </li>
                  <li className="flex items-center gap-2 text-sm text-zinc-300">
                    <Check className="w-4 h-4" style={{ color: "#c99850" }} />
                    Download and share
                  </li>
                </ul>
                <div
                  className="flex items-center gap-2 font-medium group-hover:gap-3 transition-all"
                  style={{ color: "#c99850" }}
                >
                  Try Image Studio
                  <ArrowRight className="w-4 h-4" />
                </div>
              </div>
            </Link>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="px-6 py-20">
        <div className="max-w-4xl mx-auto text-center">
          <div
            className="rounded-3xl p-12 border"
            style={{
              background: "linear-gradient(135deg, rgba(201, 152, 80, 0.2) 0%, rgba(201, 152, 80, 0.05) 100%)",
              borderColor: "rgba(201, 152, 80, 0.3)",
            }}
          >
            <Sparkles className="w-12 h-12 mx-auto mb-6" style={{ color: "#c99850" }} />
            <h3 className="text-4xl font-bold mb-4">Ready to supercharge your creative workflow?</h3>
            <p className="text-xl text-zinc-400 mb-8">
              Join thousands of designers and creators using Conjure Studio
            </p>
            <Link href="/image-studio">
              <Button
                className="font-bold px-8 py-6 text-lg text-black"
                style={{
                  background:
                    "linear-gradient(135deg, #c99850 0%, #dbb56e 25%, #f4d698 50%, #dbb56e 75%, #c99850 100%)",
                }}
              >
                Get Started Free
                <ArrowRight className="w-5 h-5 ml-2" />
              </Button>
            </Link>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-zinc-800 px-6 py-8">
        <div className="max-w-7xl mx-auto flex items-center justify-between">
          <div>
            <h1 className="text-xl font-bold mb-1">Conjure Studio</h1>
            <p className="text-xs text-zinc-500">© 2025 Conjure Studio. All rights reserved.</p>
          </div>
          <div className="flex gap-6 text-sm text-zinc-400">
            <a href="#" className="hover:text-white transition-colors">
              Privacy
            </a>
            <a href="#" className="hover:text-white transition-colors">
              Terms
            </a>
            <a href="#" className="hover:text-white transition-colors">
              Contact
            </a>
          </div>
        </div>
      </footer>
    </div>
  )
}
