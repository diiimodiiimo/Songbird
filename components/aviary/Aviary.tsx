'use client'

import { useState, useMemo } from 'react'
import { AviaryBird } from './AviaryBird'
import { SongPreviewModal } from './SongPreviewModal'
import { EmptyAviary } from './EmptyAviary'
import type { AviaryBird as AviaryBirdType, AviaryData } from '@/types/aviary'

interface AviaryProps {
  data: AviaryData
}

export function Aviary({ data }: AviaryProps) {
  const [selectedBird, setSelectedBird] = useState<AviaryBirdType | null>(null)
  const { currentUser, friends } = data

  const handleBirdTap = (bird: AviaryBirdType) => {
    setSelectedBird(bird)
  }

  const handleCloseModal = () => {
    setSelectedBird(null)
  }

  const handlePlayOnSpotify = (spotifyTrackId: string) => {
    // Open Spotify track - tries app first, falls back to web
    window.open(`https://open.spotify.com/track/${spotifyTrackId}`, '_blank')
  }

  // Calculate positions for friend birds - memoized for stable random jitter
  const friendPositions = useMemo(() => {
    return friends.map((_, index) => calculatePosition(index, friends.length))
  }, [friends.length])

  return (
    <div className="flex flex-col min-h-[calc(100vh-180px)]">
      {/* Header */}
      <header className="text-center mb-8 px-4">
        <h1 className="text-2xl sm:text-3xl font-bold text-text mb-2">The Aviary</h1>
        <p className="text-text-muted text-sm sm:text-base">See what your flock is listening to</p>
      </header>

      {/* Birds container */}
      <div className="relative flex-1 flex items-center justify-center min-h-[400px] sm:min-h-[500px]">
        {/* Decorative background elements */}
        <div className="absolute inset-0 overflow-hidden pointer-events-none">
          <div className="absolute top-1/4 left-1/4 w-32 h-32 bg-primary/5 rounded-full blur-3xl" />
          <div className="absolute bottom-1/3 right-1/4 w-40 h-40 bg-accent/5 rounded-full blur-3xl" />
        </div>

        {/* Current user - center */}
        <div className="relative z-10">
          <AviaryBird
            bird={currentUser}
            size="large"
            onTap={() => handleBirdTap(currentUser)}
          />
        </div>

        {/* Friends - arranged around */}
        {friends.length > 0 ? (
          <div className="absolute inset-0 pointer-events-none">
            {friends.map((friend, index) => (
              <div key={friend.user.id} className="pointer-events-auto">
                <AviaryBird
                  bird={friend}
                  size="small"
                  position={friendPositions[index]}
                  onTap={() => handleBirdTap(friend)}
                />
              </div>
            ))}
          </div>
        ) : (
          <div className="absolute inset-x-0 bottom-0 sm:relative sm:mt-8">
            <EmptyAviary />
          </div>
        )}
      </div>

      {/* Friend count indicator */}
      {friends.length > 0 && (
        <div className="text-center py-4">
          <span className="text-text-muted text-sm">
            {friends.length} friend{friends.length !== 1 ? 's' : ''} in your flock
          </span>
        </div>
      )}

      {/* Song preview modal */}
      {selectedBird && (
        <SongPreviewModal
          bird={selectedBird}
          onClose={handleCloseModal}
          onPlayOnSpotify={handlePlayOnSpotify}
        />
      )}
    </div>
  )
}

/**
 * Calculate position for friend birds in a circle around center
 * Returns x, y offset percentages from center
 */
function calculatePosition(index: number, total: number): { x: number; y: number } {
  // Arrange in a circle, starting from top
  const angle = (index / total) * 2 * Math.PI - Math.PI / 2
  
  // Adjust radius based on number of friends
  const baseRadius = total <= 4 ? 30 : total <= 8 ? 35 : 38
  
  // Add slight randomness so it feels organic (seeded by index for stability)
  const pseudoRandom = (seed: number) => {
    const x = Math.sin(seed * 9999) * 10000
    return x - Math.floor(x)
  }
  
  const jitterX = (pseudoRandom(index * 7) - 0.5) * 8
  const jitterY = (pseudoRandom(index * 13) - 0.5) * 8
  
  return {
    x: Math.cos(angle) * baseRadius + jitterX,
    y: Math.sin(angle) * baseRadius + jitterY,
  }
}



