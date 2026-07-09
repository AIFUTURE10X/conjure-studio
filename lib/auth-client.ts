"use client"

import { createAuthClient } from 'better-auth/react'

/**
 * Better Auth browser client. Base URL defaults to the current origin, which
 * matches the /api/auth/[...all] handler on every environment.
 */
export const authClient = createAuthClient()

export const { useSession, signIn, signUp, signOut } = authClient
