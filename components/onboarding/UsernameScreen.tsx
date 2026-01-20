'use client'

import { useState, useEffect, useCallback } from 'react'
import ThemeBird from '@/components/ThemeBird'
import ProgressDots from './ProgressDots'

interface UsernameScreenProps {
  onContinue: (username: string) => void
  existingUsername?: string
}

export default function UsernameScreen({ onContinue, existingUsername }: UsernameScreenProps) {
  const [username, setUsername] = useState(existingUsername || '')
  const [error, setError] = useState<string | null>(null)
  const [checking, setChecking] = useState(false)
  const [isAvailable, setIsAvailable] = useState<boolean | null>(null)
  const [saving, setSaving] = useState(false)

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
        body: JSON.stringify({ username }),
      })

      if (res.ok) {
        onContinue(username)
      } else {
        const data = await res.json()
        setError(data.error || 'Failed to save username')
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
          What should we call you?
        </h1>
        
        <p className="text-text/60 mb-8 text-center">
          Pick a username for your profile
        </p>

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
      <ProgressDots totalSteps={6} currentStep={1} className="pb-8" />
    </div>
  )
}

