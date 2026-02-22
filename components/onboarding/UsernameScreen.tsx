'use client'

import { useState, useEffect, useCallback } from 'react'
import { useUser } from '@clerk/nextjs'
import Image from 'next/image'
import ThemeBird from '@/components/ThemeBird'
import ProgressDots from './ProgressDots'
import { useTheme } from '@/lib/theme'
import { themes, type ThemeId } from '@/lib/theme'

interface UsernameScreenProps {
  onContinue: (username: string, selectedBird?: ThemeId) => void
  existingUsername?: string
}

const starterBirds: ThemeId[] = ['american-robin', 'northern-cardinal']

export default function UsernameScreen({ onContinue, existingUsername }: UsernameScreenProps) {
  const { user: clerkUser } = useUser()
  const { setTheme } = useTheme()

  const clerkUsername = clerkUser?.username || ''
  const initialUsername = existingUsername || clerkUsername

  const [username, setUsername] = useState(initialUsername)
  const [prefilledFromClerk, setPrefilledFromClerk] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [checking, setChecking] = useState(false)
  const [isAvailable, setIsAvailable] = useState<boolean | null>(null)
  const [saving, setSaving] = useState(false)
  const [selectedBird, setSelectedBird] = useState<ThemeId>('american-robin')
  const [showAllBirds, setShowAllBirds] = useState(false)
  const [birdStatuses, setBirdStatuses] = useState<any[]>([])

  // Pre-fill from Clerk if available
  useEffect(() => {
    if (clerkUsername && !existingUsername && !username) {
      const cleaned = clerkUsername.toLowerCase().replace(/[^a-z0-9_]/g, '')
      if (cleaned.length >= 3) {
        setUsername(cleaned)
        setPrefilledFromClerk(true)
      }
    }
  }, [clerkUsername, existingUsername])

  useEffect(() => {
    async function fetchBirdStatuses() {
      try {
        const res = await fetch('/api/birds/status')
        if (res.ok) {
          const data = await res.json()
          setBirdStatuses(data.birds || [])
        }
      } catch (err) {
        console.error('Error fetching bird statuses:', err)
      }
    }
    fetchBirdStatuses()
  }, [])

  const getBirdUnlockInfo = (birdId: ThemeId) => {
    const status = birdStatuses.find(s => s.birdId === birdId)
    if (!status) return null
    if (status.isUnlocked) return 'Unlocked'
    if (status.progress) return status.progress.label
    if (status.unlockCondition) return status.unlockCondition
    return 'Locked'
  }

  const isBirdUnlocked = (birdId: ThemeId): boolean => {
    const status = birdStatuses.find(s => s.birdId === birdId)
    return status?.isUnlocked ?? (birdId === 'american-robin' || birdId === 'northern-cardinal')
  }

  // Get all non-starter birds
  const otherBirds = themes.filter(t => !starterBirds.includes(t.id))

  // Debounced availability check
  const checkAvailability = useCallback(async (value: string) => {
    if (value.length < 3) {
      setIsAvailable(null)
      return
    }

    setChecking(true)
    try {
      const res = await fetch(`/api/username/check?username=${encodeURIComponent(value)}`)
      const data = await res.json()
      
      if (res.ok) {
        setIsAvailable(data.available || data.isCurrentUser)
        if (!data.available && !data.isCurrentUser) {
          setError('Already taken')
        } else {
          setError(null)
        }
      }
    } catch (err) {
      console.error('Error checking username:', err)
    } finally {
      setChecking(false)
    }
  }, [])

  useEffect(() => {
    const timer = setTimeout(() => {
      if (username.length >= 3) {
        checkAvailability(username)
      }
    }, 300)

    return () => clearTimeout(timer)
  }, [username, checkAvailability])

  const validateUsername = (value: string): string | null => {
    if (value.length < 3) return 'Too short (min 3 characters)'
    if (value.length > 20) return 'Too long (max 20 characters)'
    if (!/^[a-zA-Z0-9_]+$/.test(value)) return 'Only letters, numbers, and underscores'
    return null
  }

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value.toLowerCase().replace(/[^a-z0-9_]/g, '')
    setUsername(value)
    
    const validationError = validateUsername(value)
    if (validationError && value.length > 0) {
      setError(validationError)
      setIsAvailable(null)
    } else {
      setError(null)
    }
  }

  const handleBirdSelect = (birdId: ThemeId) => {
    setSelectedBird(birdId)
    setTheme(birdId)
  }

  const handleSubmit = async () => {
    const validationError = validateUsername(username)
    if (validationError) {
      setError(validationError)
      return
    }

    if (!isAvailable) {
      setError('Username not available')
      return
    }

    setSaving(true)
    try {
      const res = await fetch('/api/profile', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username, theme: selectedBird }),
      })

      if (res.ok) {
        fetch('/api/analytics/event', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ event: 'onboarding_username_set' }),
        }).catch(() => {})
        onContinue(username, selectedBird)
      } else {
        const data = await res.json()
        setError(data.error || data.message || 'Failed to save username')
      }
    } catch (err) {
      setError('Something went wrong')
    } finally {
      setSaving(false)
    }
  }

  const isValid = username.length >= 3 && username.length <= 20 && isAvailable && !error

  return (
    <div className="flex flex-col min-h-screen px-6 py-12">
      <div className="flex-1 flex flex-col items-center justify-center max-w-md mx-auto w-full">
        {/* Bird */}
        <div className="mb-6">
          <ThemeBird size={80} state="curious" />
        </div>

        {/* Headline */}
        <h1 className="text-3xl sm:text-4xl font-bold text-text mb-2 text-center font-title">
          {prefilledFromClerk ? 'Confirm Your Username' : 'Choose Your Username'}
        </h1>
        {prefilledFromClerk && (
          <p className="text-text/60 text-sm mb-2 text-center">
            We grabbed this from your account. Change it if you'd like.
          </p>
        )}

        {/* Username input */}
        <div className="w-full mb-6">
          <div className="relative">
            <span className="absolute left-4 top-1/2 -translate-y-1/2 text-text/40">@</span>
            <input
              type="text"
              value={username}
              onChange={handleChange}
              placeholder="yourname"
              autoFocus
              autoCapitalize="off"
              autoCorrect="off"
              className={`w-full pl-10 pr-12 py-4 bg-surface border-2 rounded-xl text-lg text-text placeholder:text-text/30 focus:outline-none transition-colors ${
                error
                  ? 'border-red-500/50 focus:border-red-500'
                  : isAvailable
                  ? 'border-green-500/50 focus:border-green-500'
                  : 'border-text/10 focus:border-accent'
              }`}
            />
            {/* Status indicator */}
            <div className="absolute right-4 top-1/2 -translate-y-1/2">
              {checking && (
                <div className="w-5 h-5 border-2 border-accent/30 border-t-accent rounded-full animate-spin" />
              )}
              {!checking && isAvailable && !error && (
                <svg className="w-5 h-5 text-green-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
              )}
              {!checking && error && (
                <svg className="w-5 h-5 text-red-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              )}
            </div>
          </div>
          
          {/* Error/status message */}
          <div className="h-6 mt-2">
            {error && (
              <p className="text-red-400 text-sm">{error}</p>
            )}
            {!error && isAvailable && username.length >= 3 && (
              <p className="text-green-400 text-sm">Username available!</p>
            )}
          </div>
        </div>

        {/* Bird Selection */}
        <div className="w-full mb-6">
          <label className="block text-text/70 text-sm mb-3">Select your bird</label>
          <div className="grid grid-cols-2 gap-3">
            {starterBirds.map((birdId) => {
              const theme = themes.find(t => t.id === birdId)!
              return (
                <button
                  key={birdId}
                  onClick={() => handleBirdSelect(birdId)}
                  className={`p-4 rounded-xl border-2 transition-all ${
                    selectedBird === birdId
                      ? 'border-accent bg-accent/10'
                      : 'border-text/10 bg-surface hover:border-text/20'
                  }`}
                >
                  <div className="flex flex-col items-center gap-2">
                    <Image
                      src={theme.birdLogo}
                      alt={theme.name}
                      width={60}
                      height={60}
                      className="object-contain"
                    />
                    <div className="text-sm font-medium text-text">{theme.shortName}</div>
                  </div>
                </button>
              )
            })}
          </div>
          <div className="text-xs text-text/50 mt-3 text-center space-y-1">
            <p>Your bird changes the app's theme and colors.</p>
            <p>You can change this anytime in settings.</p>
          </div>

          {/* Show all birds button */}
          <button
            onClick={() => setShowAllBirds(!showAllBirds)}
            className="w-full mt-4 py-2 text-sm text-text/60 hover:text-text/80 transition-colors flex items-center justify-center gap-2"
          >
            {showAllBirds ? 'Hide' : 'Show'} all birds
            <svg 
              className={`w-4 h-4 transition-transform ${showAllBirds ? 'rotate-180' : ''}`} 
              fill="none" 
              viewBox="0 0 24 24" 
              stroke="currentColor"
            >
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
            </svg>
          </button>

          {/* All birds preview */}
          {showAllBirds && (
            <div className="mt-4 space-y-2 max-h-64 overflow-y-auto">
              <p className="text-xs text-text/60 mb-2">Other birds you can unlock:</p>
              {otherBirds.map((theme) => {
                const unlockInfo = getBirdUnlockInfo(theme.id)
                const unlocked = isBirdUnlocked(theme.id)
                return (
                  <div
                    key={theme.id}
                    className={`flex items-center gap-3 p-2 rounded-lg ${
                      unlocked ? 'bg-accent/10' : 'bg-surface/50 opacity-60'
                    }`}
                  >
                    <div className={`w-10 h-10 relative flex-shrink-0 ${unlocked ? '' : 'grayscale opacity-50'}`}>
                      <Image
                        src={theme.birdLogo}
                        alt={theme.name}
                        width={40}
                        height={40}
                        className="object-contain"
                      />
                      {!unlocked && (
                        <div className="absolute inset-0 flex items-center justify-center">
                          <svg className="w-4 h-4 text-text/40" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                          </svg>
                        </div>
                      )}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="text-sm font-medium text-text">{theme.shortName}</div>
                      <div className="text-xs text-text/60 truncate">
                        {unlocked ? 'Unlocked' : unlockInfo || 'Locked'}
                      </div>
                    </div>
                  </div>
                )
              })}
            </div>
          )}
        </div>
      </div>

      {/* Continue button */}
      <div className="w-full max-w-md mx-auto pb-4">
        <button
          onClick={handleSubmit}
          disabled={!isValid || saving}
          className={`w-full py-4 px-8 font-semibold rounded-xl text-lg transition-all ${
            isValid && !saving
              ? 'bg-accent text-bg hover:bg-accent/90 hover:scale-[1.02] active:scale-[0.98]'
              : 'bg-surface text-text/30 cursor-not-allowed'
          }`}
        >
          {saving ? 'Saving...' : 'Continue'}
        </button>
      </div>

      {/* Progress dots */}
      <ProgressDots totalSteps={13} currentStep={4} className="pb-8" />
    </div>
  )
}
