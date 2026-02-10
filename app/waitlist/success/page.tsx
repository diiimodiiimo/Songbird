'use client'

import { Suspense, useEffect } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import ThemeBird from '@/components/ThemeBird'

function WaitlistSuccessContent() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const sessionId = searchParams.get('session_id')

  useEffect(() => {
    // Verify session was successful (optional - could call API to verify)
    // For now, just show success message
  }, [sessionId])

  return (
    <div className="min-h-screen bg-bg flex flex-col items-center justify-center px-6 py-12">
      <div className="max-w-md w-full text-center space-y-6">
        <ThemeBird size={120} state="bounce" />
        <h1 className="text-4xl font-bold text-text">Spot Reserved! 🎉</h1>
        <div className="bg-accent/10 border-2 border-accent/40 rounded-xl p-6 space-y-4">
          <p className="text-text font-medium">
            You've successfully reserved your Founding Flock spot!
          </p>
          <p className="text-text/70 text-sm">
            We'll email you when SongBird launches. Everyone gets access together, and you'll have premium features from day one.
          </p>
        </div>
        <div className="pt-4">
          <button
            onClick={() => router.push('/waitlist')}
            className="px-6 py-2 bg-surface border border-accent/40 text-accent rounded-lg hover:bg-surface/80 transition-colors"
          >
            Back to Waitlist
          </button>
        </div>
      </div>
    </div>
  )
}

export default function WaitlistSuccessPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen bg-bg flex items-center justify-center">
          <div className="w-12 h-12 border-4 border-accent/30 border-t-accent rounded-full animate-spin mx-auto" />
        </div>
      }
    >
      <WaitlistSuccessContent />
    </Suspense>
  )
}
