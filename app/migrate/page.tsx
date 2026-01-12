'use client'

import { useUser } from '@clerk/nextjs'
import { useState } from 'react'
import { useRouter } from 'next/navigation'

export default function MigratePage() {
  const { user, isLoaded } = useUser()
  const [loading, setLoading] = useState(false)
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null)
  const router = useRouter()

  const handleMigrate = async () => {
    if (!user) return

    setLoading(true)
    setMessage(null)

    try {
      const res = await fetch('/api/migrate-user', {
        method: 'POST',
      })

      const data = await res.json()

      if (res.ok) {
        setMessage({
          type: 'success',
          text: `Successfully linked your account! Found ${data.user.entriesCount} entries. Redirecting to dashboard...`,
        })
        setTimeout(() => {
          router.push('/')
        }, 2000)
      } else {
        setMessage({
          type: 'error',
          text: data.message || data.error || 'Migration failed',
        })
      }
    } catch (error: any) {
      setMessage({
        type: 'error',
        text: error.message || 'Failed to migrate user',
      })
    } finally {
      setLoading(false)
    }
  }

  if (!isLoaded) {
    return (
      <div className="min-h-screen bg-bg flex items-center justify-center">
        <div className="text-text">Loading...</div>
      </div>
    )
  }

  if (!user) {
    return (
      <div className="min-h-screen bg-bg flex items-center justify-center px-4">
        <div className="text-center max-w-md">
          <h1 className="text-2xl font-bold text-text mb-4">Please Sign In</h1>
          <p className="text-text/70 mb-6">
            You need to be signed in to migrate your account.
          </p>
          <button
            onClick={() => router.push('/home')}
            className="px-6 py-3 bg-accent text-bg font-semibold rounded-lg hover:bg-accent/90 transition-colors"
          >
            Go to Sign In
          </button>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-bg flex items-center justify-center px-4">
      <div className="max-w-md w-full space-y-6">
        <div className="text-center">
          <h1 className="text-3xl font-bold text-text mb-2">Migrate Your Account</h1>
          <p className="text-text/70">
            Link your Clerk account ({user.emailAddresses[0]?.emailAddress}) to your existing database user.
          </p>
        </div>

        {message && (
          <div
            className={`p-4 rounded-lg ${
              message.type === 'success'
                ? 'bg-green-500/20 text-green-400 border border-green-500/50'
                : 'bg-red-500/20 text-red-400 border border-red-500/50'
            }`}
          >
            {message.text}
          </div>
        )}

        <button
          onClick={handleMigrate}
          disabled={loading}
          className="w-full px-6 py-4 bg-accent text-bg font-semibold rounded-lg hover:bg-accent/90 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {loading ? 'Migrating...' : 'Link My Account'}
        </button>

        <button
          onClick={() => router.push('/')}
          className="w-full px-6 py-4 bg-surface border-2 border-accent text-accent font-semibold rounded-lg hover:bg-surface/80 transition-colors"
        >
          Go to Dashboard
        </button>
      </div>
    </div>
  )
}

