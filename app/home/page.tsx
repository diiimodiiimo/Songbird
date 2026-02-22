'use client'

import { Suspense, useEffect } from 'react'
import { useUser, SignOutButton } from '@clerk/nextjs'
import { useRouter, useSearchParams } from 'next/navigation'
import Image from 'next/image'
import { SignInButton, SignUpButton } from '@clerk/nextjs'
import { useTheme } from '@/lib/theme'

function HomeContent() {
  const { isSignedIn, isLoaded } = useUser()
  const router = useRouter()
  const searchParams = useSearchParams()
  const { currentTheme } = useTheme()

  const inviteCode = searchParams.get('invite') || ''

  useEffect(() => {
    if (isLoaded && !isSignedIn) {
      const checkUrl = inviteCode
        ? `/api/waitlist/check?code=${encodeURIComponent(inviteCode)}`
        : '/api/waitlist/check'

      fetch(checkUrl)
        .then(res => res.json())
        .then(data => {
          if (data.reason === 'waitlist_required' && !data.bypassWaitlist) {
            router.push('/waitlist')
          }
        })
        .catch(() => {})
    }
  }, [isLoaded, isSignedIn, router, inviteCode])

  if (!isLoaded) {
    return (
      <div className="min-h-screen bg-bg flex items-center justify-center">
        <div className="text-text">Loading...</div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-bg flex flex-col items-center justify-center px-4">
      <div className="text-center space-y-8 max-w-md">
        <div className="flex justify-center mb-8">
          <Image
            src={currentTheme.birdLogo}
            alt={`${currentTheme.name} - SongBird`}
            width={200}
            height={200}
            className="object-contain animate-pulse"
            priority
          />
        </div>

        <h1 className="text-5xl sm:text-6xl font-bold text-text mb-4">
          SongBird
        </h1>
        <p className="text-xl text-text/70 mb-12">
          Your personal music journal
        </p>

        {isSignedIn ? (
          <div className="space-y-4">
            <p className="text-text/60 mb-4">
              You are currently signed in. Sign out to use a different account.
            </p>
            <SignOutButton redirectUrl="/home">
              <button className="w-full px-8 py-4 bg-red-600 text-white font-semibold rounded-lg hover:bg-red-700 transition-colors text-center text-lg">
                Sign Out
              </button>
            </SignOutButton>
            <button
              onClick={() => router.push('/')}
              className="w-full px-8 py-4 bg-surface border-2 border-accent text-accent font-semibold rounded-lg hover:bg-surface/80 transition-colors text-center text-lg"
            >
              Go to Dashboard
            </button>
          </div>
        ) : (
          <div className="space-y-4 w-full">
            <SignInButton mode="modal" fallbackRedirectUrl="/">
              <button className="w-full px-8 py-4 bg-accent text-bg font-semibold rounded-lg hover:bg-accent/90 transition-colors text-center text-lg">
                Sign In
              </button>
            </SignInButton>
            <SignUpButton mode="modal" forceRedirectUrl="/welcome">
              <button className="w-full px-8 py-4 bg-surface border-2 border-accent text-accent font-semibold rounded-lg hover:bg-surface/80 transition-colors text-center text-lg">
                Create Account
              </button>
            </SignUpButton>
          </div>
        )}
      </div>
    </div>
  )
}

export default function HomePage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen bg-bg flex items-center justify-center">
          <div className="text-text">Loading...</div>
        </div>
      }
    >
      <HomeContent />
    </Suspense>
  )
}
