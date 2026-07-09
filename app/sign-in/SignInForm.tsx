"use client"

/**
 * SignInForm
 *
 * Email/password sign-in with a sign-up toggle, plus Google when the server
 * has OAuth keys configured. Successful auth lands in the studio.
 */

import { useState } from 'react'
import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Loader2, Sparkles } from 'lucide-react'
import { signIn, signUp } from '@/lib/auth-client'

const STUDIO_URL = '/image-studio'

export function SignInForm({ googleEnabled }: { googleEnabled: boolean }) {
  const [isSignUp, setIsSignUp] = useState(false)
  const [name, setName] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [isSubmitting, setIsSubmitting] = useState(false)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError(null)
    setIsSubmitting(true)
    try {
      const result = isSignUp
        ? await signUp.email({ name: name.trim() || email.split('@')[0], email, password })
        : await signIn.email({ email, password })
      if (result.error) {
        setError(result.error.message || 'Something went wrong — please try again.')
        return
      }
      window.location.href = STUDIO_URL
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleGoogle = async () => {
    setError(null)
    await signIn.social({ provider: 'google', callbackURL: STUDIO_URL })
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-linear-to-br from-zinc-950 via-black to-zinc-950 px-4">
      <div className="w-full max-w-sm space-y-6">
        <div className="text-center space-y-2">
          <div
            className="mx-auto w-12 h-12 rounded-xl flex items-center justify-center"
            style={{ background: 'linear-gradient(135deg, #c99850 0%, #dbb56e 50%, #c99850 100%)' }}
          >
            <Sparkles className="w-6 h-6 text-black" />
          </div>
          <h1 className="text-xl font-semibold text-white">
            {isSignUp ? 'Create your account' : 'Welcome back'}
          </h1>
          <p className="text-sm text-zinc-400">
            {isSignUp
              ? 'Sign up to keep your images, logos, and credits in one place.'
              : 'Sign in to your v0 Prompts Genie account.'}
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          {isSignUp && (
            <div className="space-y-1.5">
              <label htmlFor="name" className="text-sm font-medium text-zinc-300">Name</label>
              <Input
                id="name"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Your name"
                autoComplete="name"
                className="bg-zinc-900 border-zinc-700 text-white"
              />
            </div>
          )}

          <div className="space-y-1.5">
            <label htmlFor="email" className="text-sm font-medium text-zinc-300">Email</label>
            <Input
              id="email"
              type="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="you@example.com"
              autoComplete="email"
              className="bg-zinc-900 border-zinc-700 text-white"
            />
          </div>

          <div className="space-y-1.5">
            <label htmlFor="password" className="text-sm font-medium text-zinc-300">Password</label>
            <Input
              id="password"
              type="password"
              required
              minLength={8}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder={isSignUp ? 'At least 8 characters' : 'Your password'}
              autoComplete={isSignUp ? 'new-password' : 'current-password'}
              className="bg-zinc-900 border-zinc-700 text-white"
            />
          </div>

          {error && (
            <p role="alert" className="text-sm text-red-400">{error}</p>
          )}

          <Button
            type="submit"
            disabled={isSubmitting}
            className="w-full font-medium bg-linear-to-r from-[#c99850] to-[#dbb56e] text-black hover:from-[#dbb56e] hover:to-[#c99850]"
          >
            {isSubmitting && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
            {isSignUp ? 'Create account' : 'Sign in'}
          </Button>
        </form>

        {googleEnabled && (
          <>
            <div className="flex items-center gap-3">
              <div className="h-px flex-1 bg-zinc-800" />
              <span className="text-xs text-zinc-500">or</span>
              <div className="h-px flex-1 bg-zinc-800" />
            </div>
            <Button
              type="button"
              variant="outline"
              onClick={handleGoogle}
              className="w-full border-zinc-700 bg-zinc-900 text-zinc-200 hover:bg-zinc-800 hover:text-white"
            >
              Continue with Google
            </Button>
          </>
        )}

        <p className="text-center text-sm text-zinc-400">
          {isSignUp ? 'Already have an account?' : "Don't have an account?"}{' '}
          <button
            type="button"
            onClick={() => { setIsSignUp(!isSignUp); setError(null) }}
            className="text-[#dbb56e] hover:text-[#f0d49b] font-medium"
          >
            {isSignUp ? 'Sign in' : 'Sign up'}
          </button>
        </p>

        <p className="text-center text-xs text-zinc-600">
          <Link href={STUDIO_URL} className="hover:text-zinc-400">Continue without an account →</Link>
        </p>
      </div>
    </div>
  )
}
