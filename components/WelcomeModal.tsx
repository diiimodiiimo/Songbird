'use client'

import { useState } from 'react'
import Image from 'next/image'
import { useRouter } from 'next/navigation'

interface WelcomeModalProps {
  isOpen: boolean
  onClose: () => void
  suggestedUsername?: string
}

export default function WelcomeModal({ isOpen, onClose, suggestedUsername }: WelcomeModalProps) {
  const router = useRouter()
  const [username, setUsername] = useState(suggestedUsername || '')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [step, setStep] = useState<'welcome' | 'username'>('welcome')

  if (!isOpen) return null

  const handleSetUsername = async () => {
    if (!username.trim()) {
      setError('Please enter a username')
      return
    }

    if (username.length < 3) {
      setError('Username must be at least 3 characters')
      return
    }

    if (!/^[a-zA-Z0-9_]+$/.test(username)) {
      setError('Username can only contain letters, numbers, and underscores')
      return
    }

    setLoading(true)
    setError(null)

    try {
      const res = await fetch('/api/profile', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username: username.toLowerCase() }),
      })

      const data = await res.json()

      if (!res.ok) {
        setError(data.error || 'Failed to set username')
        return
      }

      // Success! Close modal
      onClose()
    } catch (err) {
      setError('Something went wrong. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  const handleSkip = () => {
    onClose()
  }

  return (
    <div className="fixed inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <div className="bg-surface rounded-2xl max-w-md w-full overflow-hidden shadow-2xl">
        {step === 'welcome' ? (
          // Welcome Step
          <div className="p-8 text-center">
            {/* Animated Bird Logo */}
            <div className="mb-6 flex justify-center">
              <div className="animate-bounce" style={{ animationDuration: '2s' }}>
                <Image
                  src="/SongBirdlogo.png"
                  alt="SongBird"
                  width={120}
                  height={120}
                  className="object-contain drop-shadow-lg"
                  priority
                />
              </div>
            </div>

            <h1 className="text-3xl font-bold text-text mb-3">
              Welcome to SongBird! 🎵
            </h1>
            
            <p className="text-text/70 mb-6 leading-relaxed">
              Track your daily soundtrack and create a musical memory of your life. 
              One song per day, every day.
            </p>

            <div className="space-y-3 text-left bg-bg/50 rounded-xl p-4 mb-6">
              <div className="flex items-center gap-3">
                <span className="text-2xl">📝</span>
                <span className="text-text/80">Log your song of the day</span>
              </div>
              <div className="flex items-center gap-3">
                <span className="text-2xl">📅</span>
                <span className="text-text/80">Discover "On This Day" memories</span>
              </div>
              <div className="flex items-center gap-3">
                <span className="text-2xl">👥</span>
                <span className="text-text/80">Share with friends</span>
              </div>
              <div className="flex items-center gap-3">
                <span className="text-2xl">📊</span>
                <span className="text-text/80">See your music insights</span>
              </div>
            </div>

            <button
              onClick={() => setStep('username')}
              className="w-full py-3 px-6 bg-accent text-bg font-semibold rounded-xl hover:bg-accent/90 transition-colors"
            >
              Get Started →
            </button>
          </div>
        ) : (
          // Username Step
          <div className="p-8">
            <div className="text-center mb-6">
              <h2 className="text-2xl font-bold text-text mb-2">
                Choose Your Username
              </h2>
              <p className="text-text/60 text-sm">
                This is how friends will find you
              </p>
            </div>

            <div className="space-y-4">
              <div>
                <label className="block text-sm text-text/70 mb-2">Username</label>
                <div className="relative">
                  <span className="absolute left-4 top-1/2 -translate-y-1/2 text-text/40">@</span>
                  <input
                    type="text"
                    value={username}
                    onChange={(e) => {
                      setUsername(e.target.value.replace(/[^a-zA-Z0-9_]/g, ''))
                      setError(null)
                    }}
                    placeholder="yourname"
                    className="w-full pl-8 pr-4 py-3 bg-bg border border-text/20 rounded-xl text-text placeholder:text-text/40 focus:border-accent focus:outline-none transition-colors"
                    maxLength={30}
                    autoFocus
                  />
                </div>
                {error && (
                  <p className="text-red-400 text-sm mt-2">{error}</p>
                )}
                <p className="text-text/50 text-xs mt-2">
                  3-30 characters. Letters, numbers, and underscores only.
                </p>
              </div>

              <button
                onClick={handleSetUsername}
                disabled={loading || !username.trim()}
                className="w-full py-3 px-6 bg-accent text-bg font-semibold rounded-xl hover:bg-accent/90 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {loading ? 'Setting up...' : 'Continue'}
              </button>

              <button
                onClick={handleSkip}
                className="w-full py-2 text-text/60 hover:text-text text-sm transition-colors"
              >
                Skip for now
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}

