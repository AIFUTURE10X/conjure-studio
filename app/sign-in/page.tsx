import { isGoogleAuthConfigured } from '@/lib/auth'
import { SignInForm } from './SignInForm'

export const metadata = { title: 'Sign in — v0 Prompts Genie' }

export default function SignInPage() {
  return <SignInForm googleEnabled={isGoogleAuthConfigured} />
}
