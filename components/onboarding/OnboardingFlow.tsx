'use client'

import { useState, useEffect } from 'react'
import { useUser } from '@clerk/nextjs'
import { useRouter, useSearchParams } from 'next/navigation'
import WelcomeScreen from './WelcomeScreen'
import DemographicsScreen from './AgeGateScreen'
import ValueProp1Screen from './ValueProp1Screen'
import ValueProp2Screen from './ValueProp2Screen'
import SocialPreviewScreen from './SocialPreviewScreen'
import SpotifyDataPrimerScreen from './SpotifyDataPrimerScreen'
import UsernameScreen from './UsernameScreen'
import FirstEntryScreen from './FirstEntryScreen'
import FirstEntryCelebrationScreen from './FirstEntryCelebrationScreen'
import MemoriesScreen from './MemoriesScreen'
import SocialScreen from './SocialScreen'
import NotificationSetupScreen from './NotificationSetupScreen'
import AttributionScreen from './AttributionScreen'
import PremiumScreen from './PremiumScreen'
import CompletionScreen from './CompletionScreen'

type OnboardingStep = 'welcome' | 'demographics' | 'value-prop-1' | 'value-prop-2' | 'social-preview' | 'username' | 'spotify-primer' | 'notifications' | 'first-entry' | 'first-entry-celebration' | 'memories' | 'social' | 'attribution' | 'premium' | 'completion'

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
  const [firstEntryData, setFirstEntryData] = useState<any>(null)
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

      // In tutorial mode, always start at memories screen
      // (skip compliance screens, username and first-entry since they already have those)
      if (isTutorialMode) {
        setCurrentStep('memories')
      } else if (userHasUsername && userHasEntries) {
        // If username already set and has entries, skip onboarding
        // (This shouldn't happen in normal flow, but handle it)
        router.push('/')
        return
      } else if (userHasUsername) {
        // If username already set but no entries, start at first-entry step
        // (skip compliance screens since they've already completed onboarding)
        setCurrentStep('first-entry')
      }
      // Otherwise start at welcome (new user flow)

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

  // Get previous step for back navigation
  const getPreviousStep = (current: OnboardingStep): OnboardingStep | null => {
    if (!isTutorialMode) {
      // Normal flow navigation
      const stepOrder: OnboardingStep[] = ['welcome', 'demographics', 'value-prop-1', 'value-prop-2', 'social-preview', 'username', 'spotify-primer', 'notifications', 'first-entry', 'first-entry-celebration', 'memories', 'social', 'attribution', 'premium', 'completion']
      const currentIndex = stepOrder.indexOf(current)
      return currentIndex > 0 ? stepOrder[currentIndex - 1] : null
    } else {
      // Tutorial mode - skip username-related steps
      const tutorialStepOrder: OnboardingStep[] = ['memories', 'social', 'attribution', 'premium', 'completion']
      const currentIndex = tutorialStepOrder.indexOf(current)
      if (currentIndex > 0) {
        return tutorialStepOrder[currentIndex - 1]
      }
      // If at first step, go back to dashboard
      return null
    }
  }

  const handleBack = () => {
    const previousStep = getPreviousStep(currentStep)
    if (previousStep) {
      setCurrentStep(previousStep)
    } else {
      // Go back to dashboard
      router.push('/')
    }
  }

  // Handle step transitions
  const handleWelcomeContinue = () => {
    if (isTutorialMode) {
      // Skip to memories in tutorial mode
      setCurrentStep('memories')
    } else {
      setCurrentStep('demographics')
    }
  }

  const handleDemographicsContinue = () => {
    if (isTutorialMode) {
      setCurrentStep('memories')
    } else {
      setCurrentStep('value-prop-1')
    }
  }

  const handleValueProp1Continue = () => {
    if (isTutorialMode) {
      setCurrentStep('memories')
    } else {
      setCurrentStep('value-prop-2')
    }
  }

  const handleValueProp2Continue = () => {
    if (isTutorialMode) {
      setCurrentStep('memories')
    } else {
      setCurrentStep('social-preview')
    }
  }

  const handleSocialPreviewContinue = () => {
    if (isTutorialMode) {
      setCurrentStep('memories')
    } else {
      setCurrentStep('username')
    }
  }

  const handleSocialPreviewSkip = () => {
    if (isTutorialMode) {
      setCurrentStep('memories')
    } else {
      setCurrentStep('username')
    }
  }

  const handleUsernameContinue = (username: string, selectedBird?: string) => {
    setProfile(prev => prev ? { ...prev, username } : { username })
    
    // Track analytics
    fetch('/api/analytics/event', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ event: 'onboarding_username_set' }),
    }).catch(() => {})

    if (isTutorialMode) {
      setCurrentStep('memories')
    } else {
      setCurrentStep('spotify-primer')
    }
  }

  const handleSpotifyPrimerContinue = () => {
    if (isTutorialMode) {
      setCurrentStep('memories')
    } else {
      setCurrentStep('notifications')
    }
  }

  const handleNotificationsContinue = () => {
    setCurrentStep('first-entry')
  }

  const handleNotificationsSkip = () => {
    setCurrentStep('first-entry')
  }

  const handleFirstEntryContinue = (entryData?: any) => {
    setHasFirstEntry(true)
    setFirstEntryData(entryData)
    setCurrentStep('first-entry-celebration')
  }

  const handleFirstEntrySkip = () => {
    setCurrentStep('social')
  }

  const handleMemoriesContinue = () => {
    setCurrentStep('social')
  }

  const handleFirstEntryCelebrationContinue = () => {
    if (isTutorialMode) {
      setCurrentStep('memories')
    } else {
      setCurrentStep('social')
    }
  }

  const handleFirstEntryCelebrationViewEntry = () => {
    // Navigate to dashboard to view entry
    router.push('/')
  }

  const handleSocialContinue = () => {
    setCurrentStep('attribution')
  }

  const handleSocialSkip = () => {
    setCurrentStep('attribution')
  }

  const handleAttributionContinue = () => {
    setCurrentStep('premium')
  }

  const handleAttributionSkip = () => {
    setCurrentStep('premium')
  }

  const handlePremiumContinue = () => {
    setCurrentStep('completion')
  }

  const handlePremiumSkip = () => {
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

  // Back button component for tutorial mode
  const BackButton = () => {
    if (!isTutorialMode) return null
    
    return (
      <button
        onClick={handleBack}
        className="fixed top-4 left-4 z-50 flex items-center gap-2 px-4 py-2 bg-surface border border-text/20 text-text/70 rounded-lg text-sm hover:bg-surface/80 transition-colors"
      >
        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
        </svg>
        Back
      </button>
    )
  }

  // Render current step
  return (
    <>
      <BackButton />
      {(() => {
        switch (currentStep) {
          case 'welcome':
            return <WelcomeScreen onContinue={handleWelcomeContinue} />

          case 'demographics':
            if (isTutorialMode) {
              return <MemoriesScreen onContinue={handleMemoriesContinue} hasFirstEntry={hasFirstEntry} />
            }
            return <DemographicsScreen onContinue={handleDemographicsContinue} />

          case 'value-prop-1':
            if (isTutorialMode) {
              return <MemoriesScreen onContinue={handleMemoriesContinue} hasFirstEntry={hasFirstEntry} />
            }
            return <ValueProp1Screen onContinue={handleValueProp1Continue} />

          case 'value-prop-2':
            if (isTutorialMode) {
              return <MemoriesScreen onContinue={handleMemoriesContinue} hasFirstEntry={hasFirstEntry} />
            }
            return <ValueProp2Screen onContinue={handleValueProp2Continue} />

          case 'social-preview':
            if (isTutorialMode) {
              return <MemoriesScreen onContinue={handleMemoriesContinue} hasFirstEntry={hasFirstEntry} />
            }
            return (
              <SocialPreviewScreen
                onContinue={handleSocialPreviewContinue}
                onSkip={handleSocialPreviewSkip}
              />
            )

          case 'username':
            if (isTutorialMode) {
              return <MemoriesScreen onContinue={handleMemoriesContinue} hasFirstEntry={hasFirstEntry} />
            }
            return (
              <UsernameScreen
                onContinue={handleUsernameContinue}
                existingUsername={profile?.username}
              />
            )

          case 'spotify-primer':
            if (isTutorialMode) {
              return <MemoriesScreen onContinue={handleMemoriesContinue} hasFirstEntry={hasFirstEntry} />
            }
            return <SpotifyDataPrimerScreen onContinue={handleSpotifyPrimerContinue} />

          case 'notifications':
            if (isTutorialMode) {
              return <MemoriesScreen onContinue={handleMemoriesContinue} hasFirstEntry={hasFirstEntry} />
            }
            return (
              <NotificationSetupScreen
                onContinue={handleNotificationsContinue}
                onSkip={handleNotificationsSkip}
              />
            )

          case 'first-entry':
            if (isTutorialMode) {
              return <MemoriesScreen onContinue={handleMemoriesContinue} hasFirstEntry={hasFirstEntry} />
            }
            return (
              <FirstEntryScreen
                onContinue={handleFirstEntryContinue}
                onSkip={handleFirstEntrySkip}
              />
            )

          case 'first-entry-celebration':
            if (isTutorialMode) {
              return <MemoriesScreen onContinue={handleMemoriesContinue} hasFirstEntry={hasFirstEntry} />
            }
            return (
              <FirstEntryCelebrationScreen
                onContinue={handleFirstEntryCelebrationContinue}
                onViewEntry={handleFirstEntryCelebrationViewEntry}
                entry={firstEntryData}
              />
            )

          case 'memories':
            return <MemoriesScreen onContinue={handleMemoriesContinue} hasFirstEntry={hasFirstEntry} />

          case 'social':
            return (
              <SocialScreen
                onContinue={handleSocialContinue}
                onSkip={handleSocialSkip}
                inviteCode={profile?.inviteCode}
              />
            )

          case 'attribution':
            return (
              <AttributionScreen
                onContinue={handleAttributionContinue}
                onSkip={handleAttributionSkip}
              />
            )

          case 'premium':
            return (
              <PremiumScreen
                onContinue={handlePremiumContinue}
                onSkip={handlePremiumSkip}
              />
            )

          case 'completion':
            return <CompletionScreen onComplete={handleComplete} isTutorialMode={isTutorialMode} />

          default:
            return <WelcomeScreen onContinue={handleWelcomeContinue} />
        }
      })()}
    </>
  )
}

