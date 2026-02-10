'use client'

import { useState } from 'react'
import WelcomeScreen from '@/components/onboarding/WelcomeScreen'
import DemographicsScreen from '@/components/onboarding/AgeGateScreen'
import TermsAcceptanceScreen from '@/components/onboarding/TermsAcceptanceScreen'
import SpotifyDataPrimerScreen from '@/components/onboarding/SpotifyDataPrimerScreen'
import UsernameScreen from '@/components/onboarding/UsernameScreen'
import FirstEntryScreen from '@/components/onboarding/FirstEntryScreen'
import MemoriesScreen from '@/components/onboarding/MemoriesScreen'
import SocialScreen from '@/components/onboarding/SocialScreen'
import NotificationSetupScreen from '@/components/onboarding/NotificationSetupScreen'
import AttributionScreen from '@/components/onboarding/AttributionScreen'
import PremiumScreen from '@/components/onboarding/PremiumScreen'
import CompletionScreen from '@/components/onboarding/CompletionScreen'

type OnboardingStep = 'welcome' | 'demographics' | 'terms' | 'spotify-primer' | 'username' | 'first-entry' | 'memories' | 'social' | 'notifications' | 'attribution' | 'premium' | 'completion'

export default function TestOnboardingPage() {
  const [currentStep, setCurrentStep] = useState<OnboardingStep>('welcome')
  const [username, setUsername] = useState('')
  const [hasFirstEntry, setHasFirstEntry] = useState(false)

  // Navigation handlers
  const handleWelcomeContinue = () => setCurrentStep('demographics')
  const handleDemographicsContinue = () => setCurrentStep('terms')
  const handleTermsContinue = () => setCurrentStep('spotify-primer')
  const handleSpotifyPrimerContinue = () => setCurrentStep('username')
  const handleUsernameContinue = (newUsername: string) => {
    setUsername(newUsername)
    setCurrentStep('first-entry')
  }
  const handleFirstEntryContinue = () => {
    setHasFirstEntry(true)
    setCurrentStep('memories')
  }
  const handleFirstEntrySkip = () => setCurrentStep('memories')
  const handleMemoriesContinue = () => setCurrentStep('social')
  const handleSocialContinue = () => setCurrentStep('notifications')
  const handleNotificationsContinue = () => setCurrentStep('attribution')
  const handleNotificationsSkip = () => setCurrentStep('attribution')
  const handleAttributionContinue = () => setCurrentStep('premium')
  const handleAttributionSkip = () => setCurrentStep('premium')
  const handlePremiumContinue = () => setCurrentStep('completion')
  const handlePremiumSkip = () => setCurrentStep('completion')
  const handleComplete = () => {
    // Just reset to welcome for testing
    setCurrentStep('welcome')
    setUsername('')
    setHasFirstEntry(false)
  }

  // Step navigation buttons (for easy testing)
  const steps: OnboardingStep[] = ['welcome', 'demographics', 'terms', 'spotify-primer', 'username', 'first-entry', 'memories', 'social', 'notifications', 'attribution', 'premium', 'completion']
  const stepNames: Record<OnboardingStep, string> = {
    'welcome': 'Welcome',
    'demographics': 'Demographics',
    'terms': 'Terms',
    'spotify-primer': 'Spotify Primer',
    'username': 'Username',
    'first-entry': 'First Entry',
    'memories': 'Memories',
    'social': 'Social',
    'notifications': 'Notifications',
    'attribution': 'Attribution',
    'premium': 'Premium',
    'completion': 'Completion'
  }

  return (
    <div className="relative">
      {/* Step selector - compact dropdown */}
      <div className="fixed top-2 right-2 z-50">
        <select
          value={currentStep}
          onChange={(e) => setCurrentStep(e.target.value as OnboardingStep)}
          className="px-3 py-1.5 text-xs bg-surface border border-text/20 rounded-lg text-text focus:outline-none focus:border-accent transition-colors"
        >
          {steps.map((step) => (
            <option key={step} value={step}>
              {stepNames[step]}
            </option>
          ))}
        </select>
      </div>

      {/* Onboarding content */}
      <div>
        {currentStep === 'welcome' && (
          <WelcomeScreen onContinue={handleWelcomeContinue} />
        )}

        {currentStep === 'demographics' && (
          <DemographicsScreen onContinue={handleDemographicsContinue} />
        )}

        {currentStep === 'terms' && (
          <TermsAcceptanceScreen onContinue={handleTermsContinue} />
        )}

        {currentStep === 'spotify-primer' && (
          <SpotifyDataPrimerScreen onContinue={handleSpotifyPrimerContinue} />
        )}

        {currentStep === 'username' && (
          <UsernameScreen
            onContinue={handleUsernameContinue}
            existingUsername={username}
          />
        )}

        {currentStep === 'first-entry' && (
          <FirstEntryScreen
            onContinue={handleFirstEntryContinue}
            onSkip={handleFirstEntrySkip}
          />
        )}

        {currentStep === 'memories' && (
          <MemoriesScreen
            onContinue={handleMemoriesContinue}
            hasFirstEntry={hasFirstEntry}
          />
        )}

        {currentStep === 'social' && (
          <SocialScreen
            onContinue={handleSocialContinue}
            inviteCode="TEST123"
          />
        )}

        {currentStep === 'notifications' && (
          <NotificationSetupScreen
            onContinue={handleNotificationsContinue}
            onSkip={handleNotificationsSkip}
          />
        )}

        {currentStep === 'attribution' && (
          <AttributionScreen
            onContinue={handleAttributionContinue}
            onSkip={handleAttributionSkip}
          />
        )}

        {currentStep === 'premium' && (
          <PremiumScreen
            onContinue={handlePremiumContinue}
            onSkip={handlePremiumSkip}
          />
        )}

        {currentStep === 'completion' && (
          <CompletionScreen
            onComplete={handleComplete}
            isTutorialMode={false}
            testMode={true}
          />
        )}
      </div>
    </div>
  )
}

