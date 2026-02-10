'use client'

import { useState } from 'react'
import ThemeBird from '@/components/ThemeBird'
import ProgressDots from './ProgressDots'

interface NotificationSetupScreenProps {
  onContinue: () => void
  onSkip: () => void
}

export default function NotificationSetupScreen({ onContinue, onSkip }: NotificationSetupScreenProps) {
  const [enabled, setEnabled] = useState(false)
  const [saving, setSaving] = useState(false)

  const handleEnable = async () => {
    setSaving(true)
    try {
      // Request notification permission
      if ('Notification' in window && Notification.permission === 'default') {
        await Notification.requestPermission()
      }

      // Track analytics
      fetch('/api/analytics/event', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ event: 'onboarding_notifications_enabled' }),
      }).catch(() => {})

      setEnabled(true)
      setTimeout(() => {
        onContinue()
      }, 1000)
    } catch (error) {
      console.error('Error enabling notifications:', error)
    } finally {
      setSaving(false)
    }
  }

  const handleSkip = () => {
    // Track analytics
    fetch('/api/analytics/event', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ event: 'onboarding_notifications_skipped' }),
    }).catch(() => {})
    onSkip()
  }

  return (
    <div className="flex flex-col min-h-screen px-6 py-12">
      <div className="flex-1 flex flex-col items-center justify-center max-w-md mx-auto w-full">
        {/* Bird */}
        <div className="mb-6">
          <ThemeBird size={80} state="sing" />
        </div>

        {/* Headline */}
        <h1 className="text-3xl sm:text-4xl font-bold text-text mb-3 text-center font-title">
          Never miss a day
        </h1>
        
        <p className="text-text/60 mb-8 text-center">
          Get gentle reminders to log your song each day and keep your streak alive.
        </p>

        {/* Benefits */}
        <div className="w-full bg-surface/50 rounded-xl p-5 mb-6">
          <div className="space-y-3 text-sm text-text/70">
            <div className="flex items-start gap-3">
              <div className="w-6 h-6 rounded bg-accent/20 flex items-center justify-center flex-shrink-0 mt-0.5">
                <svg className="w-4 h-4 text-accent" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
              <div>
                <div className="font-semibold text-text">Daily Reminders</div>
                <div className="text-xs text-text/50">We'll remind you at your preferred time</div>
              </div>
            </div>
            <div className="flex items-start gap-3">
              <div className="w-6 h-6 rounded bg-accent/20 flex items-center justify-center flex-shrink-0 mt-0.5">
                <svg className="w-4 h-4 text-accent" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                </svg>
              </div>
              <div>
                <div className="font-semibold text-text">Streak Protection</div>
                <div className="text-xs text-text/50">Get warnings before your streak breaks</div>
              </div>
            </div>
            <div className="flex items-start gap-3">
              <div className="w-6 h-6 rounded bg-accent/20 flex items-center justify-center flex-shrink-0 mt-0.5">
                <svg className="w-4 h-4 text-accent" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
                </svg>
              </div>
              <div>
                <div className="font-semibold text-text">Friend Activity</div>
                <div className="text-xs text-text/50">Know when friends post or comment</div>
              </div>
            </div>
          </div>
        </div>

        {enabled ? (
          <div className="w-full text-center py-4">
            <div className="text-green-400 font-semibold mb-2">✓ Notifications enabled!</div>
            <p className="text-text/60 text-sm">You can adjust these anytime in settings.</p>
          </div>
        ) : (
          <div className="w-full space-y-3">
            <button
              onClick={handleEnable}
              disabled={saving}
              className="w-full py-4 px-6 bg-accent text-bg font-semibold rounded-xl hover:bg-accent/90 transition-all disabled:opacity-50"
            >
              {saving ? 'Enabling...' : 'Enable Notifications'}
            </button>
            <button
              onClick={handleSkip}
              className="w-full py-2 text-text/50 hover:text-text/70 transition-colors text-sm"
            >
              Skip for now
            </button>
          </div>
        )}
      </div>

      {/* Progress dots */}
      <ProgressDots totalSteps={12} currentStep={9} className="pb-8" />
    </div>
  )
}

