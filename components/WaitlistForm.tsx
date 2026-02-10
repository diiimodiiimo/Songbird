'use client'

import { useState } from 'react'

interface WaitlistFormProps {
  onSuccess?: (referralCode: string) => void
  source?: string
  referralCode?: string
  compact?: boolean
}

export default function WaitlistForm({
  onSuccess,
  source,
  referralCode,
  compact = false,
}: WaitlistFormProps) {
  const [email, setEmail] = useState('')
  const [name, setName] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState(false)
  const [finalReferralCode, setFinalReferralCode] = useState<string | null>(null)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError(null)
    setLoading(true)

    try {
      const res = await fetch('/api/waitlist/join', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email,
          name: name || undefined,
          source: source || 'direct',
          referralCode: referralCode || undefined,
        }),
      })

      const data = await res.json()

      if (!res.ok) {
        throw new Error(data.error || 'Failed to join waitlist')
      }

      setSuccess(true)
      setFinalReferralCode(data.referralCode)
      if (onSuccess) {
        onSuccess(data.referralCode)
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Something went wrong')
    } finally {
      setLoading(false)
    }
  }

  if (success) {
    return (
      <div className={`bg-green-900/20 border border-green-500/30 rounded-lg p-4 ${compact ? 'text-sm' : ''}`}>
        <p className="text-green-400 font-semibold">✓ You're on the waitlist!</p>
        {finalReferralCode && !compact && (
          <p className="text-text/70 text-sm mt-1">Referral code: {finalReferralCode}</p>
        )}
      </div>
    )
  }

  return (
    <form onSubmit={handleSubmit} className={`space-y-3 ${compact ? 'text-sm' : ''}`}>
      <div>
        <input
          type="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          required
          className="w-full px-4 py-2 bg-bg border border-accent/30 rounded-lg text-text focus:outline-none focus:ring-2 focus:ring-accent"
          placeholder="your@email.com"
        />
      </div>
      {!compact && (
        <div>
          <input
            type="text"
            value={name}
            onChange={(e) => setName(e.target.value)}
            className="w-full px-4 py-2 bg-bg border border-accent/30 rounded-lg text-text focus:outline-none focus:ring-2 focus:ring-accent"
            placeholder="Your name (optional)"
          />
        </div>
      )}
      {error && (
        <div className="bg-red-900/20 border border-red-500/30 rounded-lg p-2 text-red-400 text-sm">
          {error}
        </div>
      )}
      <button
        type="submit"
        disabled={loading}
        className="w-full py-2 px-4 bg-accent text-bg font-semibold rounded-lg hover:bg-accent/90 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
      >
        {loading ? 'Joining...' : 'Join Waitlist'}
      </button>
    </form>
  )
}

