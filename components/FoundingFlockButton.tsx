'use client'

import { useState } from 'react'

interface FoundingFlockButtonProps {
  className?: string
}

export default function FoundingFlockButton({ className = '' }: FoundingFlockButtonProps) {
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const handleClick = async () => {
    setLoading(true)
    setError(null)

    try {
      const response = await fetch('/api/checkout/founding-flock', {
        method: 'POST',
      })

      const data = await response.json()

      if (!response.ok) {
        setError(data.error || 'Something went wrong')
        return
      }

      // Redirect to Stripe Checkout
      if (data.url) {
        window.location.href = data.url
      }
    } catch (err) {
      console.error('Checkout error:', err)
      setError('Failed to start checkout. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="flex flex-col items-center gap-2">
      <button
        onClick={handleClick}
        disabled={loading}
        className={`
          relative px-8 py-4 rounded-xl font-bold text-lg
          bg-gradient-to-r from-accent to-accent-soft
          text-bg hover:opacity-90
          disabled:opacity-50 disabled:cursor-not-allowed
          transition-all duration-200
          shadow-lg hover:shadow-xl
          ${loading ? 'animate-pulse' : ''}
          ${className}
        `}
      >
        {loading ? (
          <span className="flex items-center gap-2">
            <svg
              className="animate-spin h-5 w-5"
              xmlns="http://www.w3.org/2000/svg"
              fill="none"
              viewBox="0 0 24 24"
            >
              <circle
                className="opacity-25"
                cx="12"
                cy="12"
                r="10"
                stroke="currentColor"
                strokeWidth="4"
              />
              <path
                className="opacity-75"
                fill="currentColor"
                d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
              />
            </svg>
            Processing...
          </span>
        ) : (
          <>
            <span className="mr-2">🐦</span>
            Claim My Spot — $29.99
          </>
        )}
      </button>

      {error && (
        <p className="text-red-400 text-sm text-center max-w-xs">{error}</p>
      )}
    </div>
  )
}

