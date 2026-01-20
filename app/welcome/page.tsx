'use client'

import { Suspense } from 'react'
import OnboardingFlow from '@/components/onboarding/OnboardingFlow'

// Force dynamic rendering for this page (uses useSearchParams)
export const dynamic = 'force-dynamic'

function LoadingScreen() {
  return (
    <div className="flex items-center justify-center min-h-screen bg-bg">
      <div className="text-center">
        <div className="w-12 h-12 border-4 border-accent/30 border-t-accent rounded-full animate-spin mx-auto mb-4" />
        <p className="text-text/60">Loading...</p>
      </div>
    </div>
  )
}

export default function WelcomePage() {
  return (
    <Suspense fallback={<LoadingScreen />}>
      <OnboardingFlow />
    </Suspense>
  )
}
