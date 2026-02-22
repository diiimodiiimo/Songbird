'use client'

import { useState, useEffect } from 'react'
import ThemeBird from './ThemeBird'

const SEEN_FEATURES_KEY = 'songbird_seen_features'

function getSeenFeatures(): Set<string> {
  if (typeof window === 'undefined') return new Set()
  try {
    const stored = localStorage.getItem(SEEN_FEATURES_KEY)
    return stored ? new Set(JSON.parse(stored)) : new Set()
  } catch {
    return new Set()
  }
}

function markFeatureSeen(featureId: string) {
  if (typeof window === 'undefined') return
  const seen = getSeenFeatures()
  seen.add(featureId)
  localStorage.setItem(SEEN_FEATURES_KEY, JSON.stringify(Array.from(seen)))
}

export function hasSeenFeature(featureId: string): boolean {
  return getSeenFeatures().has(featureId)
}

interface FeatureSpotlightProps {
  featureId: string
  title: string
  description: string
  icon?: string
  tips?: string[]
  onDismiss?: () => void
}

export default function FeatureSpotlight({
  featureId,
  title,
  description,
  icon,
  tips,
  onDismiss,
}: FeatureSpotlightProps) {
  const [visible, setVisible] = useState(false)

  useEffect(() => {
    if (!hasSeenFeature(featureId)) {
      setVisible(true)
      markFeatureSeen(featureId)
    }
  }, [featureId])

  const handleDismiss = () => {
    setVisible(false)
    onDismiss?.()
  }

  if (!visible) return null

  return (
    <div className="bg-gradient-to-br from-accent/15 to-primary/10 border border-accent/30 rounded-xl p-4 sm:p-5 mb-6 animate-fade-in">
      <div className="flex items-start gap-3">
        <div className="flex-shrink-0 text-2xl">{icon || '💡'}</div>
        <div className="flex-1 min-w-0">
          <h3 className="font-semibold text-text text-sm sm:text-base mb-1">{title}</h3>
          <p className="text-text/70 text-sm leading-relaxed">{description}</p>
          {tips && tips.length > 0 && (
            <ul className="mt-2 space-y-1">
              {tips.map((tip, i) => (
                <li key={i} className="text-text/60 text-xs flex items-start gap-2">
                  <span className="text-accent mt-0.5">•</span>
                  <span>{tip}</span>
                </li>
              ))}
            </ul>
          )}
        </div>
        <button
          onClick={handleDismiss}
          className="flex-shrink-0 text-text/40 hover:text-text/70 transition-colors p-1"
          aria-label="Dismiss"
        >
          <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
            <path d="M4 4l8 8M12 4l-8 8" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
          </svg>
        </button>
      </div>
    </div>
  )
}
