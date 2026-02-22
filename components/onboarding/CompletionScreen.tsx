'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import ThemeBird from '@/components/ThemeBird'
import ProgressDots from './ProgressDots'

interface CompletionScreenProps {
  onComplete: () => void
  isTutorialMode?: boolean
  testMode?: boolean // If true, use onComplete callback instead of redirecting
}

export default function CompletionScreen({ onComplete, isTutorialMode = false, testMode = false }: CompletionScreenProps) {
  const router = useRouter()
  const [showConfetti, setShowConfetti] = useState(false)
  const [completing, setCompleting] = useState(false)

  useEffect(() => {
    // Trigger celebration animation after a brief delay
    const timer = setTimeout(() => {
      setShowConfetti(true)
    }, 300)
    return () => clearTimeout(timer)
  }, [])

  const handleStart = async () => {
    setCompleting(true)
    
    // In test mode, just call onComplete callback
    if (testMode) {
      setTimeout(() => {
        onComplete()
        setCompleting(false)
      }, 500)
      return
    }
    
    try {
      // Only mark onboarding as complete if not in tutorial mode
      if (!isTutorialMode) {
        await fetch('/api/onboarding/complete', {
          method: 'POST',
        })
      }

      // Track analytics
      fetch('/api/analytics/event', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          event: isTutorialMode ? 'tutorial_completed' : 'onboarding_completed' 
        }),
      }).catch(() => {})

      // Redirect to dashboard
      router.push('/')
    } catch (err) {
      console.error('Error completing onboarding:', err)
      // Redirect anyway
      router.push('/')
    }
  }

  return (
    <div className="flex flex-col min-h-screen px-6 py-12 relative overflow-hidden">
      {/* Confetti/celebration elements */}
      {showConfetti && (
        <div className="absolute inset-0 pointer-events-none">
          {/* Music notes floating up */}
          {[...Array(12)].map((_, i) => (
            <span
              key={i}
              className="absolute text-accent animate-float-up"
              style={{
                left: `${10 + (i * 7)}%`,
                bottom: '-20px',
                fontSize: `${16 + Math.random() * 12}px`,
                animationDelay: `${i * 0.15}s`,
                animationDuration: `${2 + Math.random()}s`,
              }}
            >
              {i % 2 === 0 ? '♪' : '♫'}
            </span>
          ))}
        </div>
      )}

      <div className="flex-1 flex flex-col items-center justify-center max-w-md mx-auto w-full relative z-10">
        {/* Celebrating bird */}
        <div className={`mb-8 transition-transform duration-500 ${showConfetti ? 'scale-110' : 'scale-100'}`}>
          <ThemeBird size={140} state="sing" />
        </div>

        {/* Headline */}
        <h1 className="text-4xl sm:text-5xl font-bold text-text mb-4 text-center font-title">
          {isTutorialMode ? 'That\'s SongBird!' : 'You\'re all set!'}
        </h1>
        
        <p className="text-lg text-text/70 mb-6 text-center">
          {isTutorialMode ? 'Thanks for watching the tour.' : 'Your flock awaits.'}
        </p>

        {/* Subtle reminder */}
        <div className="bg-surface/50 rounded-xl px-5 py-4 text-center">
          <p className="text-text/60 text-sm">
            {isTutorialMode ? (
              <>Now get back to logging your songs!</>
            ) : (
              <>
                Remember: one song, every day.
                <br />
                <span className="text-accent">That's all it takes to build something beautiful.</span>
              </>
            )}
          </p>
        </div>
      </div>

      {/* Start button */}
      <div className="w-full max-w-md mx-auto pb-4">
        <button
          onClick={handleStart}
          disabled={completing}
          className="w-full py-4 px-8 bg-accent text-bg font-semibold rounded-xl text-lg hover:bg-accent/90 transition-all hover:scale-[1.02] active:scale-[0.98] disabled:opacity-70"
        >
          {completing ? 'Loading...' : (isTutorialMode ? 'Back to SongBird' : 'Start logging')}
        </button>
      </div>

      {/* Progress dots */}
      <ProgressDots totalSteps={13} currentStep={12} className="pb-8" />

      {/* Float up animation style */}
      <style jsx>{`
        @keyframes float-up {
          0% {
            transform: translateY(0) rotate(0deg);
            opacity: 0;
          }
          10% {
            opacity: 1;
          }
          90% {
            opacity: 1;
          }
          100% {
            transform: translateY(-100vh) rotate(360deg);
            opacity: 0;
          }
        }
        .animate-float-up {
          animation: float-up 3s ease-out forwards;
        }
      `}</style>
    </div>
  )
}

