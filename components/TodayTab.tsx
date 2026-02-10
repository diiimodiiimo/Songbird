'use client'

import { useState, useEffect } from 'react'
import Image from 'next/image'
import Link from 'next/link'
import ThemeBird from './ThemeBird'
import SpotifyAttribution from './SpotifyAttribution'
import { getLocalDateString } from '@/lib/date-utils'

interface TodayEntry {
  id: string
  songTitle: string
  artist: string
  albumArt: string | null
  notes?: string
  people?: Array<{ id: string; name: string }>
  date: string
}

interface Friend {
  id: string
  name: string
  image: string | null
}

interface Milestone {
  type: string
  message: string
  achieved: boolean
  achievedDate?: string
  progress?: {
    current: number
    target: number
    message: string
  }
}

interface MilestoneData {
  milestones: Milestone[]
  nextMilestone: Milestone | null
  stats: {
    entryCount: number
    daysSinceFirst: number
  }
}

export default function TodayTab({ onNavigateToAddEntry }: { onNavigateToAddEntry?: () => void }) {
  const [entry, setEntry] = useState<TodayEntry | null>(null)
  const [friendsToday, setFriendsToday] = useState<Friend[]>([])
  const [loading, setLoading] = useState(true)
  const [milestoneData, setMilestoneData] = useState<MilestoneData | null>(null)
  const [loadingMilestones, setLoadingMilestones] = useState(false)

  useEffect(() => {
    fetchTodayData()
    fetchMilestones()
  }, [])

  const fetchMilestones = async () => {
    setLoadingMilestones(true)
    try {
      const res = await fetch(`/api/milestones?today=${getLocalDateString()}`)
      const data = await res.json()
      if (res.ok) {
        setMilestoneData(data)
      }
    } catch (error) {
      console.error('Error fetching milestones:', error)
    } finally {
      setLoadingMilestones(false)
    }
  }

  const fetchTodayData = async () => {
    try {
      const today = getLocalDateString()
      
      // Fetch today's entry
      const entryRes = await fetch(`/api/entries?date=${today}`)
      const entryData = await entryRes.json()
      
      if (entryData.entry) {
        setEntry(entryData.entry)
      }

      // TODO: Fetch friends who logged today (API doesn't exist yet)
      // const friendsRes = await fetch(`/api/friends/today?date=${today}`)
      // const friendsData = await friendsRes.json()
      // setFriendsToday(friendsData.friends || [])
      
    } catch (error) {
      console.error('Error fetching today data:', error)
    } finally {
      setLoading(false)
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="text-text/60">Loading today...</div>
      </div>
    )
  }

  const today = new Date()
  const dateString = today.toLocaleDateString('en-US', { 
    weekday: 'long', 
    month: 'long', 
    day: 'numeric' 
  })

  return (
    <div className="max-w-2xl mx-auto px-3 sm:px-4 py-4 sm:py-8">
      {/* Milestone Celebration Banner */}
      {milestoneData && milestoneData.milestones.length > 0 && (
        <div className="mb-6">
          {milestoneData.milestones.slice(-1).map((milestone) => (
            <div key={milestone.type} className="bg-gradient-to-r from-accent/20 to-purple-500/20 rounded-xl p-4 border border-accent/30">
              <div className="flex items-center gap-3">
                <div className="text-2xl">🎉</div>
                <div className="flex-1">
                  <p className="text-text font-medium">{milestone.message}</p>
                  {milestone.achievedDate && (
                    <p className="text-text/60 text-sm mt-1">
                      Achieved {new Date(milestone.achievedDate).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
                    </p>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Next Milestone Preview */}
      {milestoneData && milestoneData.nextMilestone && !milestoneData.nextMilestone.achieved && (
        <div className="mb-6 bg-surface rounded-xl p-4 border border-accent/10">
          <div className="flex items-center justify-between">
            <div className="flex-1">
              <p className="text-text/70 text-sm mb-1">Next milestone</p>
              <p className="text-text font-medium">{milestoneData.nextMilestone.message}</p>
              {milestoneData.nextMilestone.progress && (
                <div className="mt-2">
                  <div className="flex items-center justify-between text-xs text-text/60 mb-1">
                    <span>{milestoneData.nextMilestone.progress.message}</span>
                    <span>{milestoneData.nextMilestone.progress.current} / {milestoneData.nextMilestone.progress.target}</span>
                  </div>
                  <div className="w-full bg-bg rounded-full h-2">
                    <div 
                      className="bg-accent h-2 rounded-full transition-all"
                      style={{ width: `${Math.min(100, (milestoneData.nextMilestone.progress.current / milestoneData.nextMilestone.progress.target) * 100)}%` }}
                    />
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Hero header */}
      <header className="mb-6 sm:mb-12 text-center">
        <h1 
          className="text-2xl sm:text-4xl md:text-5xl mb-2 sm:mb-3"
          style={{ fontFamily: 'var(--font-title)' }}
        >
          {dateString}
        </h1>
        <p className="text-text/60 text-base sm:text-lg">
          How will we remember today?
        </p>
      </header>

      {/* Main content */}
      {entry ? (
        <div className="space-y-4 sm:space-y-8">
          {/* Primary card - the song */}
          <article className="bg-surface rounded-2xl p-4 sm:p-8 shadow-lg">
            {/* Album art - biggest element with gradient border */}
            <div className="relative mb-4 sm:mb-6 mx-auto max-w-md group">
              <div className="absolute -inset-2 bg-gradient-to-br from-accent via-pink-500 to-purple-500 rounded-2xl opacity-75 blur-md group-hover:opacity-100 transition-opacity"></div>
              <Image
                src={entry.albumArt || '/placeholder-album.png'}
                alt={`${entry.songTitle} album art`}
                width={400}
                height={400}
                className="relative rounded-xl w-full h-auto shadow-xl border-2 border-white/20"
                style={{ aspectRatio: '1/1', objectFit: 'cover', objectPosition: 'center' }}
                priority
              />
            </div>

            {/* Song info */}
            <div className="text-center">
              <h2 
                className="text-3xl md:text-4xl mb-2"
                style={{ fontFamily: 'var(--font-title)' }}
              >
                {entry.songTitle}
              </h2>
              <p className="text-text/70 text-xl mb-4">
                {entry.artist}
              </p>

              {/* Spotify Attribution */}
              <div className="flex justify-center mt-2 mb-4">
                <SpotifyAttribution variant="minimal" />
              </div>

              {/* Friend avatars if applicable */}
              {friendsToday.length > 0 && (
                <div className="flex items-center justify-center gap-2 mt-4">
                  <div className="flex -space-x-2">
                    {friendsToday.slice(0, 3).map((friend) => (
                      <div 
                        key={friend.id}
                        className="w-8 h-8 rounded-full bg-surface border-2 border-bg overflow-hidden"
                      >
                        {friend.image && (
                          <Image
                            src={friend.image}
                            alt={friend.name}
                            width={32}
                            height={32}
                            className="w-full h-full object-cover"
                          />
                        )}
                      </div>
                    ))}
                  </div>
                  <span className="text-sm text-text/60">
                    {friendsToday.length === 1 
                      ? '1 friend also logged today' 
                      : `${friendsToday.length} friends also logged today`
                    }
                  </span>
                </div>
              )}
            </div>
          </article>

          {/* Journal moment */}
          {entry.notes && (
            <div className="bg-surface/50 rounded-xl p-6">
              <p className="text-text/80 leading-relaxed line-clamp-4">
                {entry.notes}
              </p>
              <Link 
                href="#"
                className="text-accent hover:underline text-sm mt-3 inline-block"
                onClick={(e) => {
                  e.preventDefault()
                  onNavigateToAddEntry?.()
                }}
              >
                Edit today
              </Link>
            </div>
          )}

          {/* Soft navigation hints */}
          <div className="flex gap-4 justify-center text-sm">
            <button 
              className="text-text/60 hover:text-accent transition-colors"
              onClick={() => {
                // TODO: Navigate to History tab
              }}
            >
              See past days →
            </button>
            {friendsToday.length > 0 && (
              <button 
                className="text-text/60 hover:text-accent transition-colors"
                onClick={() => {
                  // TODO: Navigate to Friends tab
                }}
              >
                See friends today →
              </button>
            )}
          </div>
        </div>
      ) : (
        // Empty state - no entry yet
        <div className="text-center py-8 sm:py-16 px-4">
          <div className="bg-surface rounded-2xl p-6 sm:p-12 max-w-md mx-auto">
            <button
              onClick={() => onNavigateToAddEntry?.()}
              className="mb-4 sm:mb-6 hover:scale-110 transition-transform cursor-pointer bg-transparent border-none"
              aria-label="Add today's song"
            >
              <ThemeBird size={96} interactive showTooltip />
            </button>
            <h2 
              className="text-xl sm:text-2xl mb-3 sm:mb-4"
              style={{ fontFamily: 'var(--font-title)' }}
            >
              No song yet
            </h2>
            <p className="text-text/60 mb-4 sm:mb-6 text-sm sm:text-base">
              What song will hold today together?
            </p>
            <button 
              className="bg-accent text-bg px-6 py-2.5 sm:px-8 sm:py-3 rounded-full font-medium hover:bg-accent/90 transition-colors text-sm sm:text-base"
              onClick={() => onNavigateToAddEntry?.()}
            >
              Add today's song
            </button>
          </div>
        </div>
      )}
    </div>
  )
}
