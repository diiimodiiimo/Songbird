'use client'

import { useState, useEffect } from 'react'
import { useUser } from '@clerk/nextjs'
import { useRouter, useSearchParams } from 'next/navigation'
import WelcomeScreen from './WelcomeScreen'
import UsernameScreen from './UsernameScreen'
import FirstEntryScreen from './FirstEntryScreen'
import MemoriesScreen from './MemoriesScreen'
import SocialScreen from './SocialScreen'
import CompletionScreen from './CompletionScreen'

type OnboardingStep = 'welcome' | 'username' | 'first-entry' | 'memories' | 'social' | 'completion'

interface UserProfile {
  username?: string
  inviteCode?: string
  onboardingCompletedAt?: string
}

export default function OnboardingFlow() {
  const { user, isLoaded, isSignedIn } = useUser()
  const router = useRouter()
  const searchParams = useSearchParams()
  const isTutorialMode = searchParams.get('tutorial') === 'true'
  const [currentStep, setCurrentStep] = useState<OnboardingStep>('welcome')
  const [profile, setProfile] = useState<UserProfile | null>(null)
  const [hasFirstEntry, setHasFirstEntry] = useState(false)
  const [loading, setLoading] = useState(true)

  // Check user state on mount
  useEffect(() => {
    if (isLoaded) {
      if (!isSignedIn) {
        router.push('/home')
        return
      }
      checkUserState()
    }
  }, [isLoaded, isSignedIn, router])

  const checkUserState = async () => {
    try {
      // Fetch profile
      const profileRes = await fetch('/api/profile')
      let userHasUsername = false
      
      if (profileRes.ok) {
        const data = await profileRes.json()
        setProfile(data.user)

        // In tutorial mode, don't redirect - let them view the tutorial
        if (!isTutorialMode) {
          // If onboarding already completed, redirect to dashboard
          if (data.user?.onboardingCompletedAt) {
            router.push('/')
            return
          }
        }

        userHasUsername = !!data.user?.username
      }

      // Check if user has any entries
      let userHasEntries = false
      const entriesRes = await fetch('/api/entries?page=1&pageSize=1')
      if (entriesRes.ok) {
        const data = await entriesRes.json()
        userHasEntries = data.entries?.length > 0
        setHasFirstEntry(userHasEntries)
      }

      // If existing user with username AND entries, auto-complete onboarding
      // (Skip this in tutorial mode)
      if (!isTutorialMode && userHasUsername && userHasEntries) {
        try {
          await fetch('/api/onboarding/complete', { method: 'POST' })
          router.push('/')
          return
        } catch (err) {
          console.error('Error auto-completing onboarding:', err)
          router.push('/')
          return
        }
      }

      // In tutorial mode with existing username, skip to memories screen
      // (skip username and first-entry since they already have those)
      if (isTutorialMode && userHasUsername && userHasEntries) {
        setCurrentStep('memories')
      } else if (userHasUsername) {
        // If username already set but no entries, start at first-entry step
        setCurrentStep('first-entry')
      }

      // Track analytics
      fetch('/api/analytics/event', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          event: isTutorialMode ? 'tutorial_started' : 'onboarding_started' 
        }),
      }).catch(() => {})

    } catch (err) {
      console.error('Error checking user state:', err)
    } finally {
      setLoading(false)
    }
  }

  // Handle step transitions
  const handleWelcomeContinue = () => {
    setCurrentStep('username')
  }

  const handleUsernameContinue = (username: string) => {
    setProfile(prev => prev ? { ...prev, username } : { username })
    
    // Track analytics
    fetch('/api/analytics/event', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ event: 'onboarding_username_set' }),
    }).catch(() => {})

    setCurrentStep('first-entry')
  }

  const handleFirstEntryContinue = () => {
    setHasFirstEntry(true)
    setCurrentStep('memories')
  }

  const handleFirstEntrySkip = () => {
    setCurrentStep('memories')
  }

  const handleMemoriesContinue = () => {
    setCurrentStep('social')
  }

  const handleSocialContinue = () => {
    setCurrentStep('completion')
  }

  const handleComplete = () => {
    // CompletionScreen handles the API call and redirect
  }

  // Loading state
  if (loading || !isLoaded) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-bg">
        <div className="text-center">
          <div className="w-12 h-12 border-4 border-accent/30 border-t-accent rounded-full animate-spin mx-auto mb-4" />
          <p className="text-text/60">Loading...</p>
        </div>
      </div>
    )
  }

  // Render current step
  switch (currentStep) {
    case 'welcome':
      return <WelcomeScreen onContinue={handleWelcomeContinue} />

    case 'username':
      return (
        <UsernameScreen
          onContinue={handleUsernameContinue}
          existingUsername={profile?.username}
        />
      )

    case 'first-entry':
      return (
        <FirstEntryScreen
          onContinue={handleFirstEntryContinue}
          onSkip={handleFirstEntrySkip}
        />
      )

    case 'memories':
      return (
        <MemoriesScreen
          onContinue={handleMemoriesContinue}
          hasFirstEntry={hasFirstEntry}
        />
      )

    case 'social':
      return (
        <SocialScreen
          onContinue={handleSocialContinue}
          inviteCode={profile?.inviteCode}
        />
      )

    case 'completion':
      return <CompletionScreen onComplete={handleComplete} isTutorialMode={isTutorialMode} />

    default:
      return <WelcomeScreen onContinue={handleWelcomeContinue} />
  }
}

