'use client'

import { useState, useEffect } from 'react'
import Image from 'next/image'
import { themes, type ThemeId } from '@/lib/theme'
import type { BirdUnlockStatus } from '@/lib/birds'

interface BirdsData {
  birds: BirdUnlockStatus[]
  summary: {
    unlockedCount: number
    totalCount: number
    percentage: number
  }
  nextUnlock: BirdUnlockStatus | null
  newUnlocks: string[]
}

interface YourBirdsProps {
  onSelectBird?: (birdId: ThemeId) => void
  compact?: boolean
}

export default function YourBirds({ onSelectBird, compact = false }: YourBirdsProps) {
  const [data, setData] = useState<BirdsData | null>(null)
  const [loading, setLoading] = useState(true)
  const [showNewUnlock, setShowNewUnlock] = useState<string | null>(null)

  useEffect(() => {
    fetchBirds()
  }, [])

  const fetchBirds = async () => {
    setLoading(true)
    try {
      const res = await fetch('/api/birds')
      if (res.ok) {
        const birdsData = await res.json()
        setData(birdsData)
        
        // Show celebration for new unlocks
        if (birdsData.newUnlocks?.length > 0) {
          setShowNewUnlock(birdsData.newUnlocks[0])
          setTimeout(() => setShowNewUnlock(null), 5000)
        }
      }
    } catch (error) {
      console.error('Failed to fetch birds:', error)
    } finally {
      setLoading(false)
    }
  }

  const getBirdImage = (birdId: ThemeId): string => {
    const theme = themes.find(t => t.id === birdId)
    return theme?.birdLogo || '/SongBirdlogo.png'
  }

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center py-8">
        <div className="w-10 h-10 border-4 border-accent/30 border-t-accent rounded-full animate-spin" />
        <p className="text-text/60 mt-3 text-sm">Loading your flock...</p>
      </div>
    )
  }

  if (!data) {
    return (
      <div className="text-center py-8 text-text/60">
        Failed to load birds
      </div>
    )
  }

  // New unlock celebration modal
  if (showNewUnlock) {
    const bird = data.birds.find(b => b.birdId === showNewUnlock)
    if (bird) {
      return (
        <div className="fixed inset-0 bg-black/80 flex items-center justify-center z-50 p-4">
          <div className="bg-surface rounded-2xl p-8 max-w-sm w-full text-center animate-bounce-once">
            <div className="text-4xl mb-4">🎉</div>
            <h2 className="text-2xl font-bold text-accent mb-2">New Bird Unlocked!</h2>
            <div className="relative w-32 h-32 mx-auto my-6">
              <Image
                src={getBirdImage(bird.birdId)}
                alt={bird.name}
                fill
                className="object-contain drop-shadow-lg"
              />
            </div>
            <h3 className="text-xl font-bold text-text mb-2">{bird.name}</h3>
            <p className="text-text/60 text-sm mb-6">
              You can now use this bird as your theme!
            </p>
            <button
              onClick={() => setShowNewUnlock(null)}
              className="px-6 py-3 bg-accent text-bg font-semibold rounded-xl hover:bg-accent/90 transition-all"
            >
              Awesome!
            </button>
          </div>
        </div>
      )
    }
  }

  // Compact view for settings
  if (compact) {
    return (
      <div className="space-y-4">
        {/* Summary */}
        <div className="flex items-center justify-between text-sm">
          <span className="text-text/70">Birds Unlocked</span>
          <span className="text-accent font-semibold">
            {data.summary.unlockedCount}/{data.summary.totalCount}
          </span>
        </div>

        {/* Bird Grid */}
        <div className="grid grid-cols-5 gap-2">
          {data.birds.map((bird) => (
            <button
              key={bird.birdId}
              onClick={() => bird.isUnlocked && onSelectBird?.(bird.birdId)}
              disabled={!bird.isUnlocked}
              className={`relative aspect-square rounded-lg p-2 transition-all ${
                bird.isUnlocked
                  ? 'bg-accent/10 hover:bg-accent/20 hover:scale-105 cursor-pointer'
                  : 'bg-surface/50 opacity-50 cursor-not-allowed'
              }`}
              title={bird.isUnlocked ? bird.name : `${bird.name} - ${bird.progress?.label || 'Locked'}`}
            >
              <Image
                src={getBirdImage(bird.birdId)}
                alt={bird.name}
                fill
                className={`object-contain p-1 ${!bird.isUnlocked ? 'grayscale' : ''}`}
              />
              {!bird.isUnlocked && (
                <div className="absolute inset-0 flex items-center justify-center">
                  <span className="text-lg">🔒</span>
                </div>
              )}
            </button>
          ))}
        </div>

        {/* Next unlock progress */}
        {data.nextUnlock && (
          <div className="bg-bg rounded-lg p-3">
            <div className="flex items-center gap-3">
              <div className="relative w-10 h-10 grayscale opacity-60">
                <Image
                  src={getBirdImage(data.nextUnlock.birdId)}
                  alt={data.nextUnlock.name}
                  fill
                  className="object-contain"
                />
              </div>
              <div className="flex-1">
                <div className="text-sm font-medium text-text/80">
                  Next: {data.nextUnlock.name}
                </div>
                <div className="text-xs text-text/50">
                  {data.nextUnlock.progress?.label}
                </div>
              </div>
              <div className="text-sm font-semibold text-accent">
                {Math.round(data.nextUnlock.progress?.percentage || 0)}%
              </div>
            </div>
            <div className="mt-2 h-1.5 bg-surface rounded-full overflow-hidden">
              <div
                className="h-full bg-accent rounded-full transition-all duration-500"
                style={{ width: `${data.nextUnlock.progress?.percentage || 0}%` }}
              />
            </div>
          </div>
        )}
      </div>
    )
  }

  // Full view
  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="text-center">
        <h2 className="text-2xl font-bold text-text mb-2">Your Flock</h2>
        <p className="text-text/60">
          {data.summary.unlockedCount} of {data.summary.totalCount} birds unlocked
        </p>
        <div className="mt-3 h-2 bg-surface rounded-full overflow-hidden max-w-xs mx-auto">
          <div
            className="h-full bg-gradient-to-r from-accent to-pink-500 rounded-full transition-all duration-500"
            style={{ width: `${data.summary.percentage}%` }}
          />
        </div>
      </div>

      {/* Bird Grid */}
      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-4">
        {data.birds.map((bird) => (
          <div
            key={bird.birdId}
            className={`relative bg-surface rounded-xl p-4 transition-all ${
              bird.isUnlocked
                ? 'hover:scale-105 cursor-pointer border-2 border-transparent hover:border-accent/50'
                : 'opacity-70'
            }`}
            onClick={() => bird.isUnlocked && onSelectBird?.(bird.birdId)}
          >
            {/* Bird Image */}
            <div className="relative w-full aspect-square mb-3">
              <Image
                src={getBirdImage(bird.birdId)}
                alt={bird.name}
                fill
                className={`object-contain ${!bird.isUnlocked ? 'grayscale' : ''}`}
              />
              {!bird.isUnlocked && (
                <div className="absolute inset-0 flex items-center justify-center bg-black/30 rounded-lg">
                  <span className="text-2xl">🔒</span>
                </div>
              )}
              {bird.unlockMethod === 'premium' && (
                <div className="absolute top-0 right-0 bg-gradient-to-r from-yellow-500 to-amber-500 text-xs font-bold px-1.5 py-0.5 rounded-bl-lg rounded-tr-lg text-black">
                  ✨
                </div>
              )}
            </div>

            {/* Bird Name */}
            <h3 className="font-semibold text-sm text-center text-text truncate">
              {bird.shortName}
            </h3>

            {/* Unlock Status or Progress */}
            {bird.isUnlocked ? (
              <div className="text-xs text-center text-accent mt-1">
                {bird.unlockMethod === 'premium' && '✨ Premium'}
                {bird.unlockMethod === 'milestone' && '🏆 Earned'}
                {bird.unlockMethod === 'default' && '🐣 Starter'}
                {bird.unlockMethod === 'purchased' && '💎 Purchased'}
              </div>
            ) : (
              <div className="mt-2">
                {bird.progress && (
                  <>
                    <div className="h-1 bg-bg rounded-full overflow-hidden">
                      <div
                        className="h-full bg-accent/50 rounded-full transition-all"
                        style={{ width: `${bird.progress.percentage}%` }}
                      />
                    </div>
                    <div className="text-xs text-center text-text/50 mt-1">
                      {bird.progress.label}
                    </div>
                  </>
                )}
                {bird.canPurchase && bird.purchasePrice && (
                  <button className="mt-2 w-full text-xs bg-accent/20 text-accent py-1 rounded-lg hover:bg-accent/30 transition-colors">
                    Unlock ${(bird.purchasePrice / 100).toFixed(2)}
                  </button>
                )}
              </div>
            )}
          </div>
        ))}
      </div>

      {/* Tips */}
      <div className="bg-surface/50 rounded-xl p-4 text-center">
        <p className="text-sm text-text/60">
          💡 <span className="text-text/80">Keep logging songs</span> to unlock more birds!
          Streaks and entry milestones unlock new themes.
        </p>
      </div>
    </div>
  )
}



