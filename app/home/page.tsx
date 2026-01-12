'use client'

import { useUser, SignOutButton, useClerk } from '@clerk/nextjs'
import { useRouter } from 'next/navigation'
import { useEffect } from 'react'
import Image from 'next/image'

export default function HomePage() {
  const { isSignedIn, isLoaded } = useUser()
  const { openSignIn, openSignUp } = useClerk()
  const router = useRouter()

  // Auto-redirect authenticated users to dashboard
  useEffect(() => {
    if (isLoaded && isSignedIn) {
      router.push('/')
    }
  }, [isLoaded, isSignedIn, router])

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
        {/* Logo */}
        <div className="flex justify-center mb-8">
          <Image
            src="/SongBirdlogo.png"
            alt="SongBird"
            width={200}
            height={200}
            className="object-contain animate-pulse"
            priority
          />
        </div>

        {/* App Name */}
        <h1 className="text-5xl sm:text-6xl font-bold text-text mb-4">
          SongBird
        </h1>
        <p className="text-xl text-text/70 mb-12">
          Your personal music journal
        </p>

        {/* Show different content based on auth state */}
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
            <button
              onClick={() => openSignIn({ redirectUrl: '/' })}
              className="w-full px-8 py-4 bg-surface border-2 border-accent text-accent font-semibold rounded-lg hover:bg-surface/80 transition-colors text-center text-lg"
            >
              Sign In
            </button>
            <button
              onClick={() => openSignUp({ redirectUrl: '/welcome' })}
              className="w-full px-8 py-4 bg-surface border-2 border-accent text-accent font-semibold rounded-lg hover:bg-surface/80 transition-colors text-center text-lg"
            >
              Create Account
            </button>
          </div>
        )}
      </div>
    </div>
  )
}



