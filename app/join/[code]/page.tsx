'use client'

import { useEffect, useState } from 'react'
import { useUser, SignInButton, SignUpButton } from '@clerk/nextjs'
import { useRouter, useParams } from 'next/navigation'
import ThemeBird from '@/components/ThemeBird'

export default function JoinPage() {
  const { isSignedIn, isLoaded } = useUser()
  const router = useRouter()
  const params = useParams()
  const code = params.code as string

  const [inviteData, setInviteData] = useState<{
    valid: boolean
    senderName?: string
    senderUsername?: string
  } | null>(null)
  const [loading, setLoading] = useState(true)
  const [processing, setProcessing] = useState(false)
  const [error, setError] = useState<string | null>(null)

  // Validate invite code
  useEffect(() => {
    validateInvite()
  }, [code])

  // If signed in, process the invite
  useEffect(() => {
    if (isLoaded && isSignedIn && inviteData?.valid) {
      processInvite()
    }
  }, [isLoaded, isSignedIn, inviteData])

  const validateInvite = async () => {
    try {
      const res = await fetch(`/api/invites/validate?code=${code}`)
      const data = await res.json()
      
      if (res.ok && data.valid) {
        setInviteData(data)
      } else {
        setInviteData({ valid: false })
      }
    } catch (err) {
      console.error('Error validating invite:', err)
      setInviteData({ valid: false })
    } finally {
      setLoading(false)
    }
  }

  const processInvite = async () => {
    if (processing) return
    setProcessing(true)

    try {
      const res = await fetch('/api/invites/accept', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ code }),
      })

      if (res.ok) {
        // Redirect to onboarding or dashboard
        router.push('/welcome')
      } else {
        const data = await res.json()
        setError(data.error || 'Failed to process invite')
      }
    } catch (err) {
      setError('Something went wrong')
    } finally {
      setProcessing(false)
    }
  }

  // Loading state
  if (loading || !isLoaded) {
    return (
      <div className="min-h-screen bg-bg flex items-center justify-center">
        <div className="text-center">
          <div className="w-12 h-12 border-4 border-accent/30 border-t-accent rounded-full animate-spin mx-auto mb-4" />
          <p className="text-text/60">Loading...</p>
        </div>
      </div>
    )
  }

  // Invalid invite
  if (!inviteData?.valid) {
    return (
      <div className="min-h-screen bg-bg flex flex-col items-center justify-center px-6">
        <div className="mb-6">
          <ThemeBird size={100} state="curious" />
        </div>
        <h1 className="text-2xl font-bold text-text mb-2">Invite not found</h1>
        <p className="text-text/60 text-center mb-6">
          This invite link may have expired or doesn't exist.
        </p>
        <button
          onClick={() => router.push('/home')}
          className="px-6 py-3 bg-accent text-bg font-semibold rounded-xl hover:bg-accent/90 transition-colors"
        >
          Go to SongBird
        </button>
      </div>
    )
  }

  // Processing (signed in)
  if (processing) {
    return (
      <div className="min-h-screen bg-bg flex items-center justify-center">
        <div className="text-center">
          <div className="mb-6">
            <ThemeBird size={80} state="bounce" />
          </div>
          <p className="text-text/60">Setting up your connection...</p>
        </div>
      </div>
    )
  }

  // Error state
  if (error) {
    return (
      <div className="min-h-screen bg-bg flex flex-col items-center justify-center px-6">
        <div className="mb-6">
          <ThemeBird size={100} state="curious" />
        </div>
        <h1 className="text-2xl font-bold text-text mb-2">Oops!</h1>
        <p className="text-text/60 text-center mb-6">{error}</p>
        <button
          onClick={() => router.push('/home')}
          className="px-6 py-3 bg-accent text-bg font-semibold rounded-xl hover:bg-accent/90 transition-colors"
        >
          Continue to SongBird
        </button>
      </div>
    )
  }

  // Not signed in — show sign up/in options
  return (
    <div className="min-h-screen bg-bg flex flex-col items-center justify-center px-6">
      <div className="max-w-md w-full text-center">
        {/* Bird */}
        <div className="mb-6">
          <ThemeBird size={120} state="sing" />
        </div>

        {/* Headline */}
        <h1 className="text-3xl font-bold text-text mb-2 font-title">
          You've been invited!
        </h1>
        
        {inviteData.senderName && (
          <p className="text-text/70 mb-8">
            {inviteData.senderName} wants to share their music journey with you on SongBird.
          </p>
        )}

        {/* Value prop */}
        <div className="bg-surface rounded-xl p-5 mb-8 text-left">
          <p className="text-text/80 text-sm mb-4">
            SongBird helps you remember your life through music.
          </p>
          <ul className="space-y-2 text-sm text-text/60">
            <li className="flex items-center gap-2">
              <span className="text-accent">♪</span>
              Log one song each day that defines your day
            </li>
            <li className="flex items-center gap-2">
              <span className="text-accent">♪</span>
              Build a musical autobiography over time
            </li>
            <li className="flex items-center gap-2">
              <span className="text-accent">♪</span>
              Share moments with close friends
            </li>
          </ul>
        </div>

        {/* Auth buttons */}
        <div className="space-y-3">
          <SignUpButton mode="modal" forceRedirectUrl={`/join/${code}`}>
            <button className="w-full py-4 px-8 bg-accent text-bg font-semibold rounded-xl text-lg hover:bg-accent/90 transition-all">
              Join SongBird
            </button>
          </SignUpButton>
          
          <SignInButton mode="modal" fallbackRedirectUrl={`/join/${code}`}>
            <button className="w-full py-3 text-text/60 hover:text-text/80 transition-colors">
              Already have an account? Sign in
            </button>
          </SignInButton>
        </div>
      </div>
    </div>
  )
}

