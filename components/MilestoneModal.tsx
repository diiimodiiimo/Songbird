'use client'

import { useState, useEffect } from 'react'
import ThemeBird from '@/components/ThemeBird'

interface MilestoneModalProps {
  milestone: {
    type: string
    headline: string
    body: string
    icon: string
    reward?: {
      icon: string
      text: string
    }
  }
  onClose: () => void
  onShare?: () => void
}

export default function MilestoneModal({ milestone, onClose, onShare }: MilestoneModalProps) {
  const [showConfetti, setShowConfetti] = useState(true)

  useEffect(() => {
    // Auto-dismiss confetti after 3 seconds
    const timer = setTimeout(() => {
      setShowConfetti(false)
    }, 3000)
    return () => clearTimeout(timer)
  }, [])

  return (
    <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50 p-4">
      <div className="bg-surface rounded-2xl p-8 max-w-md w-full border-2 border-accent/40 relative overflow-hidden">
        {/* Confetti animation */}
        {showConfetti && (
          <div className="absolute inset-0 pointer-events-none">
            {Array.from({ length: 15 }).map((_, i) => (
              <div
                key={i}
                className="absolute text-2xl animate-bounce"
                style={{
                  left: `${Math.random() * 100}%`,
                  top: `${Math.random() * 100}%`,
                  animationDelay: `${Math.random() * 2}s`,
                  animationDuration: `${2 + Math.random() * 2}s`,
                }}
              >
                {['🎉', '🎊', '✨', '🌟', '🎵', '🔥'][Math.floor(Math.random() * 6)]}
              </div>
            ))}
          </div>
        )}

        <div className="relative z-10">
          {/* Milestone Icon */}
          <div className="text-6xl mb-4 text-center animate-bounce" style={{ animationDuration: '1s' }}>
            {milestone.icon}
          </div>

          {/* Headline */}
          <h2 className="text-3xl font-bold text-text mb-3 text-center font-title">
            {milestone.headline}
          </h2>

          {/* Body */}
          <p className="text-lg text-text/70 mb-6 text-center leading-relaxed">
            {milestone.body}
          </p>

          {/* Reward Card */}
          {milestone.reward && (
            <div className="bg-accent/10 border border-accent/30 rounded-xl p-4 mb-6">
              <div className="flex items-center gap-3">
                <span className="text-3xl">{milestone.reward.icon}</span>
                <div>
                  <div className="font-semibold text-text">Reward Unlocked!</div>
                  <div className="text-sm text-text/70">{milestone.reward.text}</div>
                </div>
              </div>
            </div>
          )}

          {/* Action Buttons */}
          <div className="space-y-3">
            {onShare && (
              <button
                onClick={onShare}
                className="w-full py-3 px-6 bg-accent/20 border border-accent/40 text-accent font-semibold rounded-xl hover:bg-accent/30 transition-all"
              >
                Share Achievement
              </button>
            )}
            <button
              onClick={onClose}
              className="w-full py-3 px-6 bg-accent text-bg font-semibold rounded-xl hover:bg-accent/90 transition-all"
            >
              Continue
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}



