'use client'

import { useState, useEffect } from 'react'
import { useUser } from '@clerk/nextjs'
import { useRouter } from 'next/navigation'
import Image from 'next/image'
import ThemeBird from './ThemeBird'
import SpotifyAttribution from './SpotifyAttribution'
import MilestoneModal from './MilestoneModal'
import { UpgradePrompt } from './UpgradePrompt'
import InfoTooltip from './InfoTooltip'
import { getLocalDateString, isToday as isTodayLocal, parseLocalDate, getLocalStartOfDay } from '@/lib/date-utils'

interface Track {
  id: string
  name: string
  artist: string
  album: string
  albumArt: string
  durationMs: number
  explicit: boolean
  popularity: number
  releaseDate?: string
  uri: string
}

export default function AddEntryTab() {
  const { user, isLoaded, isSignedIn } = useUser()
  const router = useRouter()
  const [showForm, setShowForm] = useState(false)
  const [showWrappedBanner, setShowWrappedBanner] = useState(true)
  const [date, setDate] = useState(getLocalDateString())
  const [query, setQuery] = useState('')
  const [tracks, setTracks] = useState<Track[]>([])
  const [selectedTrack, setSelectedTrack] = useState<Track | null>(null)
  const [notes, setNotes] = useState('')
  const [mentionedUsers, setMentionedUsers] = useState<Array<{ id: string; name: string; email: string }>>([])
  const [peopleNames, setPeopleNames] = useState<string[]>([])
  const [peopleInput, setPeopleInput] = useState<string>('')
  const [friends, setFriends] = useState<Array<{ id: string; name: string; email: string }>>([])
  const [friendSearch, setFriendSearch] = useState('')
  const [peopleSearch, setPeopleSearch] = useState('')
  const [showPeopleFriendPicker, setShowPeopleFriendPicker] = useState(false)
  const [loading, setLoading] = useState(false)
  const [message, setMessage] = useState<{ 
    type: 'success' | 'error'; 
    text: string;
    upgradeRequired?: boolean;
    currentCount?: number;
    limit?: number;
  } | null>(null)
  const [existingEntry, setExistingEntry] = useState<{ id: string; songTitle: string; artist: string; notes?: string } | null>(null)
  const [checkingEntry, setCheckingEntry] = useState(true) // Start true for initial load
  const [showFlyingAnimation, setShowFlyingAnimation] = useState(false)
  const [animateSwipeIn, setAnimateSwipeIn] = useState(false)
  const [onThisDayEntries, setOnThisDayEntries] = useState<Array<{ id: string; date: string; songTitle: string; artist: string; albumArt: string | null }>>([])
  const [currentStreak, setCurrentStreak] = useState(0)
  const [loadingStreak, setLoadingStreak] = useState(true) // Start true for initial load
  const [selectedMood, setSelectedMood] = useState<string | null>(null)
  const [showMoodPicker, setShowMoodPicker] = useState(false)
  const [apiError, setApiError] = useState<string | null>(null)
  const [initialLoadComplete, setInitialLoadComplete] = useState(false)
  const [newMilestone, setNewMilestone] = useState<{ type: string; message: string; icon?: string; headline?: string; body?: string; reward?: { icon: string; text: string } | null } | null>(null)
  const [showMilestoneModal, setShowMilestoneModal] = useState(false)
  const [showDelighter, setShowDelighter] = useState<{ type: string; message: string; icon: string } | null>(null)
  const [previousStreak, setPreviousStreak] = useState(0)
  const [friendsWhoLoggedToday, setFriendsWhoLoggedToday] = useState<Array<{ id: string; name: string; username?: string; image?: string }>>([])
  const [hoursUntilMidnight, setHoursUntilMidnight] = useState(24)

  // Check if it's today's date
  const isToday = isTodayLocal(date)
  const today = new Date()
  const dayName = today.toLocaleDateString('en-US', { weekday: 'long' })

  // Fetch friends who logged today
  const fetchFriendsWhoLoggedToday = async () => {
    try {
      const res = await fetch(`/api/friends/today?date=${getLocalDateString()}`)
      const data = await res.json()
      if (res.ok) {
        setFriendsWhoLoggedToday(data.friends || [])
      }
    } catch (error) {
      console.error('Error fetching friends who logged today:', error)
    }
  }

  // Calculate hours until midnight
  useEffect(() => {
    if (isToday && !existingEntry && currentStreak > 0) {
      const updateHours = () => {
        const now = new Date()
        const midnight = new Date(now.getFullYear(), now.getMonth(), now.getDate() + 1, 0, 0, 0, 0)
        const hours = (midnight.getTime() - now.getTime()) / (1000 * 60 * 60)
        setHoursUntilMidnight(Math.max(0, Math.floor(hours)))
      }
      updateHours()
      const interval = setInterval(updateHours, 60000) // Update every minute
      return () => clearInterval(interval)
    }
  }, [isToday, existingEntry, currentStreak])

  // OPTIMIZED: Fetch all today data in a single API call
  // This replaces 4-5 separate calls (friends, entry, on-this-day, streak)
  const fetchTodayData = async () => {
    if (!isLoaded || !isSignedIn) return

    setCheckingEntry(true)
    setLoadingStreak(true)
    setApiError(null)

    try {
      console.log('[AddEntryTab] Fetching today data for date:', date)
      const res = await fetch(`/api/today-data?date=${date}&today=${getLocalDateString()}`)
      const data = await res.json()

      if (!res.ok) {
        console.error('[AddEntryTab] API error:', data)
        setApiError(data.message || data.error || `Error ${res.status}`)
        return
      }

      console.log('[AddEntryTab] Got data:', { streak: data.currentStreak, entries: data.onThisDayEntries?.length })

      // Set streak
      if (data.currentStreak !== undefined) {
        setPreviousStreak(currentStreak)
        setCurrentStreak(data.currentStreak)
      }

      // Set friends who logged today
      if (data.friends) {
        setFriends(data.friends)
      }

      // Fetch friends who logged today
      if (isToday) {
        fetchFriendsWhoLoggedToday()
      }

      // Set On This Day entries
      if (data.onThisDayEntries && data.onThisDayEntries.length > 0) {
        setOnThisDayEntries(data.onThisDayEntries)
      } else {
        setOnThisDayEntries([])
      }

      // Set existing entry
      if (data.existingEntry) {
        setExistingEntry({
          id: data.existingEntry.id,
          songTitle: data.existingEntry.songTitle,
          artist: data.existingEntry.artist,
          notes: data.existingEntry.notes || '',
        })
        setNotes(data.existingEntry.notes || '')
        if (data.existingEntry.mentions && data.existingEntry.mentions.length > 0) {
          setMentionedUsers(data.existingEntry.mentions)
        } else {
          setMentionedUsers([])
        }
        if (data.existingEntry.people && data.existingEntry.people.length > 0) {
          setPeopleNames(data.existingEntry.people.map((person: any) => person.name))
        } else {
          setPeopleNames([])
        }
        setPeopleInput('')
      } else {
        setExistingEntry(null)
        if (!selectedTrack) {
          setNotes('')
          setMentionedUsers([])
          setPeopleNames([])
          setPeopleInput('')
        }
      }
    } catch (error: any) {
      console.error('[AddEntryTab] Fetch error:', error)
      setApiError(error?.message || 'Failed to connect to server')
    } finally {
      setCheckingEntry(false)
      setLoadingStreak(false)
      setInitialLoadComplete(true)
    }
  }

  // OPTIMIZED: Single useEffect to fetch all data
  useEffect(() => {
    fetchTodayData()
  }, [date, isLoaded, isSignedIn])
  
  // Show loading state while Clerk or initial data is loading
  if (!isLoaded || (isSignedIn && !initialLoadComplete)) {
    return (
      <div className="max-w-2xl mx-auto px-3 sm:px-4 py-4 sm:py-8">
        <div className="flex flex-col items-center justify-center min-h-[400px] gap-4">
          <div className="animate-pulse opacity-50">
            <ThemeBird size={100} />
          </div>
          <p className="text-text/60 text-sm">Loading your music...</p>
        </div>
      </div>
    )
  }

  // Show error state if API failed
  if (apiError) {
    return (
      <div className="max-w-2xl mx-auto px-3 sm:px-4 py-4 sm:py-8">
        <div className="flex flex-col items-center justify-center min-h-[400px] gap-4">
          <div className="text-4xl">😵</div>
          <h2 className="text-xl font-semibold text-text">Something went wrong</h2>
          <p className="text-text/60 text-sm text-center max-w-md">{apiError}</p>
          <button
            onClick={() => {
              setApiError(null)
              fetchTodayData()
            }}
            className="px-4 py-2 bg-primary text-bg font-medium rounded-lg hover:bg-primary/90 transition-colors"
          >
            Try Again
          </button>
        </div>
      </div>
    )
  }

  // If today and no form shown, show the songbird landing page (whether or not they have an entry)
  if (isToday && !showForm) {
    const fullDateString = today.toLocaleDateString('en-US', {
      weekday: 'long',
      month: 'long',
      day: 'numeric',
      year: 'numeric'
    })

    return (
      <div className="max-w-2xl mx-auto px-3 sm:px-4 py-4 sm:py-8">
        {/* STREAK BANNER - Always visible at top */}
        {loadingStreak ? (
          <div className="mb-6 bg-surface/50 rounded-xl p-4 text-center">
            <div className="text-text/60 text-sm">Loading streak...</div>
          </div>
        ) : currentStreak > 0 ? (
          <div className={`mb-6 rounded-xl p-4 border ${
            !existingEntry && hoursUntilMidnight < 3 && currentStreak > 0
              ? 'bg-red-900/20 border-red-500/40'
              : 'bg-gradient-to-r from-accent/20 to-accent/10 border-accent/30'
          }`}>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <span className="text-2xl">🔥</span>
                <div>
                  <div className="font-bold text-accent text-lg flex items-center gap-1.5">
                    {currentStreak} day streak
                    <InfoTooltip title="How Streaks Work" iconSize={14}>
                      <p>Your streak counts consecutive days with a logged song.</p>
                      <p><strong>Keep it alive:</strong> Log at least one song each day before midnight in your timezone.</p>
                      <p><strong>What counts:</strong> Only same-day entries count. Backdating an entry to yesterday won't save a broken streak.</p>
                      <p><strong>Rewards:</strong> Streaks unlock bird themes at 7, 14, 30, 50, 100, and 365 days. Check Profile → Your Flock to see progress.</p>
                    </InfoTooltip>
                  </div>
                  {existingEntry ? (
                    <div className="text-sm text-text/70">✓ Logged today</div>
                  ) : !existingEntry && hoursUntilMidnight < 3 && currentStreak > 0 ? (
                    <div className="text-sm text-red-400 font-medium">
                      ⚠️ Your {currentStreak}-day streak ends in {hoursUntilMidnight} {hoursUntilMidnight === 1 ? 'hour' : 'hours'}!
                    </div>
                  ) : (
                    <div className="text-sm text-accent/80">Log today to keep your streak!</div>
                  )}
                </div>
              </div>
            </div>
          </div>
        ) : null}

        {/* Top Row: Full date with year */}
        <div className="mb-6">
          <h1 className="text-2xl sm:text-3xl font-bold text-text">
            {fullDateString}
          </h1>
        </div>

        {/* Prompt */}
        <p className="text-text/70 text-base sm:text-lg mb-8 text-center">
          {existingEntry ? "Today's song" : "How will we remember today?"}
        </p>

        {/* Social urgency indicator */}
        {!existingEntry && friendsWhoLoggedToday.length > 0 && (
          <div className="mb-6 bg-surface/50 rounded-xl p-4 border border-accent/20">
            <div className="flex items-center gap-3">
              <div className="flex -space-x-2">
                {friendsWhoLoggedToday.slice(0, 3).map((friend) => (
                  <div
                    key={friend.id}
                    className="w-8 h-8 rounded-full bg-accent/30 border-2 border-bg overflow-hidden"
                  >
                    {friend.image ? (
                      <Image
                        src={friend.image}
                        alt={friend.name}
                        width={32}
                        height={32}
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center text-xs font-bold text-accent">
                        {friend.name.charAt(0).toUpperCase()}
                      </div>
                    )}
                  </div>
                ))}
              </div>
              <div className="flex-1 text-sm text-text/70">
                {friendsWhoLoggedToday[0].username || friendsWhoLoggedToday[0].name}{friendsWhoLoggedToday.length > 1 && <> and {friendsWhoLoggedToday.length - 1} {friendsWhoLoggedToday.length === 2 ? 'other' : 'others'}</>} posted today
              </div>
            </div>
          </div>
        )}

        {/* SongBird CTA - Always show, either to add or to edit */}
        <div className={`flex flex-col items-center mb-8 ${showFlyingAnimation ? 'pointer-events-none' : ''}`}>
          <div className="relative">
            {/* Music note trails - appear when flying */}
            {showFlyingAnimation && (
              <>
                <span 
                  className="absolute top-1/2 left-1/2 text-2xl text-primary animate-note-trail"
                  style={{ animationDelay: '0.05s' }}
                >
                  ♪
                </span>
                <span 
                  className="absolute top-1/3 left-1/3 text-xl text-accent animate-note-trail"
                  style={{ animationDelay: '0.15s' }}
                >
                  ♫
                </span>
                <span 
                  className="absolute top-2/3 left-2/3 text-lg text-primary animate-note-trail"
                  style={{ animationDelay: '0.25s' }}
                >
                  ♪
                </span>
              </>
            )}
            
            <button
              onClick={(e) => {
                e.preventDefault()
                e.stopPropagation()
                setShowFlyingAnimation(true)
                // Bird flies off (0.5s) then form swipes in (0.4s)
                setTimeout(() => {
                  setAnimateSwipeIn(true)
                  setShowForm(true)
                  setShowFlyingAnimation(false)
                  // Reset swipe animation flag after it plays
                  setTimeout(() => setAnimateSwipeIn(false), 500)
                }, 600)
              }}
              className={`group relative transition-all cursor-pointer focus:outline-none focus:ring-2 focus:ring-accent/50 rounded-full
                ${showFlyingAnimation ? 'animate-bird-flyoff' : 'hover:scale-105 active:scale-95'}
              `}
              aria-label={existingEntry ? "Edit today's song" : "Add today's song"}
              type="button"
              disabled={showFlyingAnimation}
            >
              {/* Subtle idle animation - pulse/glow */}
              <div 
                className={`transition-all ${showFlyingAnimation ? '' : 'animate-pulse group-hover:drop-shadow-[0_0_20px_rgba(255,255,255,0.5)] group-hover:animate-none'}`} 
                style={{ animationDuration: '3s' }}
              >
                <ThemeBird size={144} state={showFlyingAnimation ? 'fly' : existingEntry ? 'proud' : 'bounce'} showParticles={false} />
              </div>
            </button>
          </div>
          
          {/* Show entry info below bird if exists, otherwise show tap hint */}
          {existingEntry ? (
            <div className="mt-4 text-center">
              <h3 className="text-xl font-bold text-text">{existingEntry.songTitle}</h3>
              <p className="text-text/70">{existingEntry.artist}</p>
              {existingEntry.notes && (
                <p className="text-text/50 text-sm mt-2 max-w-md line-clamp-2">{existingEntry.notes}</p>
              )}
              <p className="mt-3 text-text/40 text-xs">Tap the bird to edit</p>
            </div>
          ) : (
            <p 
              className={`mt-3 text-text/50 text-sm transition-opacity duration-200 ${showFlyingAnimation ? 'opacity-0' : 'animate-pulse'}`} 
              style={{ animationDuration: '2s' }}
            >
              Tap the songbird to log your song
            </p>
          )}
        </div>

        {/* Wrapped Banner - Secondary, below bird */}
        {showWrappedBanner && (
          <div className="mt-8 bg-gradient-to-r from-primary/20 to-accent/20 border border-primary/30 rounded-xl p-4 flex items-center justify-between gap-4">
            <div className="flex items-center gap-3 flex-1 min-w-0">
              <span className="text-3xl flex-shrink-0">🎁</span>
              <div className="min-w-0">
                <p className="font-semibold text-white">Your Wrapped is Here!</p>
                <p className="text-sm text-text/70">See your year in music</p>
              </div>
            </div>
            <button
              onClick={() => {
                setShowWrappedBanner(false)
                window.dispatchEvent(new CustomEvent('navigateToWrapped'))
              }}
              className="bg-primary hover:bg-primary/90 text-white px-3 py-1.5 rounded-lg text-xs font-medium transition-colors flex-shrink-0 whitespace-nowrap"
            >
              View →
            </button>
          </div>
        )}
      </div>
    )
  }

  const handleWrappedClick = () => {
    // Navigate to insights tab - would need to be passed as prop from Dashboard
    // For now, just hide the banner
    setShowWrappedBanner(false)
  }

  const searchSongs = async () => {
    if (!query.trim()) return

    setLoading(true)
    try {
      const res = await fetch(`/api/songs/search?q=${encodeURIComponent(query)}`)
      const data = await res.json()
      if (res.ok) {
        setTracks(data.tracks)
      } else {
        setMessage({ type: 'error', text: data.error || 'Failed to search songs' })
      }
    } catch (error) {
      setMessage({ type: 'error', text: 'Failed to search songs' })
    } finally {
      setLoading(false)
    }
  }

  const addPerson = (name: string) => {
    const trimmedName = name.trim()
    if (trimmedName && !peopleNames.includes(trimmedName)) {
      setPeopleNames([...peopleNames, trimmedName])
      setPeopleInput('')
    }
  }

  const removePerson = (name: string) => {
    setPeopleNames(peopleNames.filter((n) => n !== name))
  }

  const handlePeopleInputKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter' || e.key === ',') {
      e.preventDefault()
      if (peopleInput.trim()) {
        addPerson(peopleInput)
      }
    } else if (e.key === 'Backspace' && peopleInput === '' && peopleNames.length > 0) {
      // Remove last person if backspace on empty input
      removePerson(peopleNames[peopleNames.length - 1])
    }
  }

  const addMentionedUser = (user: { id: string; name: string; email: string }) => {
    if (!mentionedUsers.find((u) => u.id === user.id)) {
      setMentionedUsers([...mentionedUsers, user])
    }
  }

  const removeMentionedUser = (userId: string) => {
    setMentionedUsers(mentionedUsers.filter((u) => u.id !== userId))
  }

  const updateMentions = async (entryId: string) => {
    try {
      // Get current mentions from the entry
      const entryRes = await fetch(`/api/entries?date=${date}`)
      const entryData = await entryRes.json()
      
      if (!entryRes.ok || !entryData.entries || entryData.entries.length === 0) {
        return
      }

      const entry = entryData.entries[0]
      const currentMentionIds = entry.mentions
        ? entry.mentions.map((m: any) => m.user.id)
        : []
      const newMentionIds = mentionedUsers.map((u) => u.id)

      // Remove mentions that are no longer in the list
      for (const currentMentionId of currentMentionIds) {
        if (!newMentionIds.includes(currentMentionId)) {
          await fetch(`/api/mentions?entryId=${entryId}&userId=${currentMentionId}`, {
            method: 'DELETE',
          })
        }
      }

      // Add new mentions
      for (const mentionedUser of mentionedUsers) {
        if (!currentMentionIds.includes(mentionedUser.id)) {
          await fetch('/api/mentions', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              entryId,
              userId: mentionedUser.id,
            }),
          })
        }
      }
    } catch (error) {
      console.error('Error updating mentions:', error)
    }
  }

  const saveEntry = async () => {
    if (!selectedTrack) {
      setMessage({ type: 'error', text: 'Please select a song' })
      return
    }

    setLoading(true)
    try {
      // If entry exists, update it; otherwise create new
      if (existingEntry) {
        const res = await fetch(`/api/entries/${existingEntry.id}`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            songTitle: selectedTrack.name,
            artist: selectedTrack.artist,
            albumTitle: selectedTrack.album,
            albumArt: selectedTrack.albumArt,
            durationMs: selectedTrack.durationMs,
            explicit: selectedTrack.explicit,
            popularity: selectedTrack.popularity,
            releaseDate: selectedTrack.releaseDate,
            trackId: selectedTrack.id,
            uri: selectedTrack.uri,
            notes: notes || undefined,
            mood: selectedMood || undefined,
            peopleNames: peopleNames.filter((name) => name.trim().length > 0),
          }),
        })

        const data = await res.json()
        if (res.ok) {
          // Update mentions after entry is saved
          await updateMentions(existingEntry.id)
          setMessage({ type: 'success', text: `🎵 Updated to ${selectedTrack.name} by ${selectedTrack.artist}! Notes preserved.` })
          setSelectedTrack(null)
          setQuery('')
          setTracks([])
          // Don't clear notes - they're preserved
          await fetchTodayData() // Refresh existing entry data
        } else {
          setMessage({ type: 'error', text: data.error || 'Failed to update entry' })
        }
      } else {
        const res = await fetch('/api/entries', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            date,
            songTitle: selectedTrack.name,
            artist: selectedTrack.artist,
            albumTitle: selectedTrack.album,
            albumArt: selectedTrack.albumArt,
            durationMs: selectedTrack.durationMs,
            explicit: selectedTrack.explicit,
            popularity: selectedTrack.popularity,
            releaseDate: selectedTrack.releaseDate,
            trackId: selectedTrack.id,
            uri: selectedTrack.uri,
            notes,
            mood: selectedMood,
            peopleNames: peopleNames.filter((name) => name.trim().length > 0),
          }),
        })

        const data = await res.json()
        if (res.ok) {
          // Add mentions after entry is created
          if (data.entry && mentionedUsers.length > 0) {
            await updateMentions(data.entry.id)
          }
          
          // Check for new milestones
          const milestoneRes = await fetch(`/api/milestones?today=${getLocalDateString()}`)
          const milestoneData = await milestoneRes.json()
          if (milestoneRes.ok && milestoneData.milestones && milestoneData.milestones.length > 0) {
            // Check if there's a newly achieved milestone (most recent one)
            const latestMilestone = milestoneData.milestones[milestoneData.milestones.length - 1]
            if (latestMilestone.achievedDate) {
              const achievedDate = parseLocalDate(latestMilestone.achievedDate)
              const today = getLocalStartOfDay()
              // If milestone was achieved today, show celebration
              if (achievedDate.getTime() === today.getTime()) {
                setNewMilestone(latestMilestone)
                setShowMilestoneModal(true)
              }
            }
          }

          // Variable rewards (30% chance)
          if (Math.random() < 0.3) {
            const delighterTypes = [
              { type: 'early_bird', message: 'Early bird! You logged earlier than usual today', icon: '🌅' },
              { type: 'diverse_week', message: 'This is your most diverse week—5 different genres!', icon: '🎨' },
              { type: 'first_time_artist', message: `First time logging ${selectedTrack.artist}! New territory.`, icon: '✨' },
              { type: 'throwback', message: `A throwback! You haven't logged ${selectedTrack.artist} in a while`, icon: '⏪' },
            ]
            const randomDelighter = delighterTypes[Math.floor(Math.random() * delighterTypes.length)]
            setTimeout(() => {
              setShowDelighter(randomDelighter)
              setTimeout(() => setShowDelighter(null), 4000)
            }, 2000)
          }
          
          setMessage({ type: 'success', text: `🎵 ${selectedTrack.name} by ${selectedTrack.artist} added successfully!` })
          setSelectedTrack(null)
          setQuery('')
          setTracks([])
          setNotes('')
          setMentionedUsers([])
          setPeopleNames([])
          setPeopleInput('')
          setSelectedMood(null)
          setShowMoodPicker(false)
          await fetchTodayData() // Refresh to show it now exists
        } else if (res.status === 403 && data.upgradeRequired) {
          // Paywall hit - show upgrade message
          setMessage({ 
            type: 'error', 
            text: data.message || 'Entry limit reached. Upgrade to premium for unlimited entries.',
            upgradeRequired: true,
            currentCount: data.currentCount,
            limit: data.limit,
          })
        } else {
          setMessage({ type: 'error', text: data.error || 'Failed to create entry' })
        }
      }
    } catch (error) {
      setMessage({ type: 'error', text: 'Failed to save entry' })
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className={`space-y-6 ${animateSwipeIn ? 'animate-swipe-in' : ''}`}>
      {/* Milestone Celebration Modal */}
      {showMilestoneModal && newMilestone && (
        <MilestoneModal
          milestone={{
            type: newMilestone.type,
            headline: newMilestone.headline || newMilestone.message,
            body: newMilestone.body || newMilestone.message,
            icon: newMilestone.icon || '🎉',
            reward: newMilestone.reward || undefined,
          }}
          onClose={() => {
            setShowMilestoneModal(false)
            setNewMilestone(null)
          }}
          onShare={() => {
            // Share achievement
            if (navigator.share) {
              navigator.share({
                title: newMilestone.headline || newMilestone.message,
                text: newMilestone.body || newMilestone.message,
              })
            }
          }}
        />
      )}

      {/* Variable Reward Delighter */}
      {showDelighter && (
        <div className="fixed bottom-24 left-1/2 -translate-x-1/2 z-40 animate-slide-up">
          <div className="bg-accent/90 text-bg rounded-xl p-4 shadow-lg border-2 border-accent">
            <div className="flex items-center gap-3">
              <span className="text-2xl">{showDelighter.icon}</span>
              <p className="font-medium">{showDelighter.message}</p>
            </div>
          </div>
        </div>
      )}
      
      <div>
        <h3 className="text-xl font-semibold mb-4">➕ Add a New Song of the Day</h3>
        
        <div className="mb-4">
          <label className="block mb-2">Select a Date (You can pick any date)</label>
          <input
            type="date"
            value={date}
            onChange={(e) => setDate(e.target.value)}
            onClick={(e) => e.currentTarget.showPicker?.()}
            className="w-full px-4 py-2 bg-card border border-primary rounded text-primary cursor-pointer"
            title="Click to change the date"
          />
          <p className="text-sm text-primary/60 mt-1">
            Currently selected: {new Date(date + 'T12:00:00').toLocaleDateString('en-US', { 
              year: 'numeric', 
              month: 'long', 
              day: 'numeric' 
            })}
          </p>
          
          {checkingEntry ? (
            <p className="text-sm text-primary/60 mt-1">Checking for existing entry...</p>
          ) : existingEntry ? (
            <div className="mt-2 p-3 bg-green-900/30 border border-green-500/50 rounded">
              <p className="text-green-300 font-semibold">
                ✅ Entry exists for this date: <strong>{existingEntry.songTitle}</strong> by <strong>{existingEntry.artist}</strong>
              </p>
              <p className="text-sm text-green-300/80 mt-1">
                You can change the song below - your notes will be preserved!
              </p>
            </div>
          ) : (
            <div className="mt-2 p-3 bg-warn-bg/30 border border-red-500/50 rounded">
              <p className="text-red-300 font-semibold">
                🔴 No entry exists for this date. Add a song below.
              </p>
            </div>
          )}
        </div>

        <div className="mb-4">
          <label className="block mb-2">Search for a Song on Spotify</label>
          <div className="flex gap-2">
            <input
              type="text"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              onKeyPress={(e) => e.key === 'Enter' && searchSongs()}
              placeholder="Enter song name..."
              className="flex-1 px-4 py-2 bg-card border border-primary rounded text-primary"
            />
            <button
              onClick={searchSongs}
              disabled={loading}
              className="px-6 py-2 bg-card border border-primary rounded hover:bg-primary/10 transition-colors"
            >
              Search
            </button>
          </div>
        </div>

        {tracks.length > 0 && (
          <div className="mb-4">
            <label className="block mb-2">Select a Song</label>
            <div className="space-y-2">
              {tracks.map((track) => (
                <div
                  key={track.id}
                  onClick={() => setSelectedTrack(track)}
                  className={`p-3 border rounded cursor-pointer transition-colors ${
                    selectedTrack?.id === track.id
                      ? 'border-primary bg-primary/10'
                      : 'border-primary/30 hover:border-primary/60'
                  }`}
                >
                  <div className="flex items-center gap-3">
                    {track.albumArt && (
                      <Image
                        src={track.albumArt}
                        alt={track.album}
                        width={60}
                        height={60}
                        className="rounded"
                      />
                    )}
                    <div>
                      <div className="font-semibold">{track.name}</div>
                      <div className="text-sm text-primary/80">{track.artist}</div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {selectedTrack && (
          <div className="mb-4 p-4 bg-card border border-primary rounded">
            <div className="flex gap-4 mb-4">
              {selectedTrack.albumArt && (
                <Image
                  src={selectedTrack.albumArt}
                  alt={selectedTrack.album}
                  width={200}
                  height={200}
                  className="rounded"
                />
              )}
              <div>
                <h4 className="text-xl font-bold">{selectedTrack.name}</h4>
                <p className="text-primary/80">{selectedTrack.artist}</p>
                <p className="text-sm text-primary/60">{selectedTrack.album}</p>
                <div className="mt-2">
                  <SpotifyAttribution variant="minimal" />
                </div>
              </div>
            </div>

            <div className="mb-4">
              <label className="block mb-2 flex items-center gap-1.5">
                People in Your Day <span className="text-sm text-primary/60">(Private)</span>
                <InfoTooltip title="People in Your Day" iconSize={14}>
                  <p>A private record of who you were with today. Only you can see these tags.</p>
                  <p>You can tag anyone — friends on SongBird or people who aren't on the app. Great for remembering "I was at dinner with Sarah" or "road trip with Mom."</p>
                  <p className="text-xs italic">Different from Mentions below, which notify your friends.</p>
                </InfoTooltip>
              </label>
              
              {/* Tagged people display */}
              {peopleNames.length > 0 && (
                <div className="flex flex-wrap gap-2 mb-2">
                  {peopleNames.map((name, index) => {
                    // Check if this person is a friend
                    const isFriend = friends.some(f => f.name === name || f.email.split('@')[0] === name)
                    return (
                      <span
                        key={index}
                        className={`px-3 py-1 rounded-full text-sm flex items-center gap-2 ${
                          isFriend 
                            ? 'bg-accent/30 border border-accent/50' 
                            : 'bg-blue-600/30 border border-blue-500/50'
                        }`}
                      >
                        {isFriend && <span className="text-xs">👤</span>}
                        {name}
                        <button
                          onClick={() => removePerson(name)}
                          className="hover:text-red-400 text-lg leading-none"
                          type="button"
                        >
                          ×
                        </button>
                      </span>
                    )
                  })}
                </div>
              )}

              {/* Input area with friend picker toggle */}
              <div className="relative">
                <div className="flex gap-2">
                  <div className="flex-1 relative">
                    <input
                      type="text"
                      value={peopleInput}
                      onChange={(e) => {
                        setPeopleInput(e.target.value)
                        setPeopleSearch(e.target.value)
                        setShowPeopleFriendPicker(e.target.value.length > 0)
                      }}
                      onKeyDown={handlePeopleInputKeyDown}
                      onFocus={() => setShowPeopleFriendPicker(true)}
                      placeholder="Type a name or search friends..."
                      className="w-full px-3 py-2 bg-bg border border-primary rounded text-primary placeholder:text-primary/40"
                    />
                    
                    {/* Friend suggestions dropdown */}
                    {showPeopleFriendPicker && friends.length > 0 && (
                      <div className="absolute z-20 top-full left-0 right-0 mt-1 bg-card border border-primary rounded-lg shadow-lg max-h-48 overflow-y-auto">
                        {/* Show matching friends */}
                        {friends
                          .filter(f => {
                            const searchLower = peopleSearch.toLowerCase()
                            const name = f.name?.toLowerCase() || ''
                            const email = f.email.toLowerCase()
                            return (name.includes(searchLower) || email.includes(searchLower)) &&
                              !peopleNames.includes(f.name || f.email.split('@')[0])
                          })
                          .slice(0, 5)
                          .map((friend) => (
                            <button
                              key={friend.id}
                              type="button"
                              onClick={() => {
                                addPerson(friend.name || friend.email.split('@')[0])
                                setPeopleInput('')
                                setPeopleSearch('')
                                setShowPeopleFriendPicker(false)
                              }}
                              className="w-full px-3 py-2 text-left hover:bg-primary/10 flex items-center gap-2 transition-colors"
                            >
                              <span className="w-6 h-6 rounded-full bg-accent/20 flex items-center justify-center text-xs text-accent">
                                {(friend.name || friend.email)[0].toUpperCase()}
                              </span>
                              <span className="flex-1 truncate">{friend.name || friend.email}</span>
                              <span className="text-xs text-primary/50">Friend</span>
                            </button>
                          ))}
                        
                        {/* Option to add as custom name */}
                        {peopleSearch.trim() && !friends.some(f => 
                          (f.name?.toLowerCase() === peopleSearch.toLowerCase()) || 
                          (f.email.split('@')[0].toLowerCase() === peopleSearch.toLowerCase())
                        ) && (
                          <button
                            type="button"
                            onClick={() => {
                              addPerson(peopleSearch.trim())
                              setPeopleInput('')
                              setPeopleSearch('')
                              setShowPeopleFriendPicker(false)
                            }}
                            className="w-full px-3 py-2 text-left hover:bg-primary/10 flex items-center gap-2 border-t border-primary/20 transition-colors"
                          >
                            <span className="w-6 h-6 rounded-full bg-blue-600/20 flex items-center justify-center text-xs">
                              +
                            </span>
                            <span className="flex-1">Add "{peopleSearch.trim()}"</span>
                            <span className="text-xs text-primary/50">Custom</span>
                          </button>
                        )}

                        {/* No results message */}
                        {peopleSearch.trim() && 
                          friends.filter(f => {
                            const searchLower = peopleSearch.toLowerCase()
                            const name = f.name?.toLowerCase() || ''
                            const email = f.email.toLowerCase()
                            return name.includes(searchLower) || email.includes(searchLower)
                          }).length === 0 && (
                          <div className="px-3 py-2 text-sm text-primary/50">
                            No friends match. Press Enter to add "{peopleSearch.trim()}"
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                </div>
                
                {/* Click outside to close */}
                {showPeopleFriendPicker && (
                  <div 
                    className="fixed inset-0 z-10" 
                    onClick={() => setShowPeopleFriendPicker(false)}
                  />
                )}
              </div>
              
              <p className="text-xs text-primary/60 mt-1">
                Search for friends to tag, or type any name and press Enter.
              </p>
            </div>

            <div className="mb-4">
              <label className="block mb-2 flex items-center gap-1.5">
                Mention Friends <span className="text-sm text-primary/60">(They'll be notified)</span>
                <InfoTooltip title="Mention Friends" iconSize={14}>
                  <p>Mentions are social — the friend gets a notification and can see they were included in your entry.</p>
                  <p>Use this when you want a friend to know you thought of them, or to share a moment together.</p>
                  <p className="text-xs italic">Only SongBird friends can be mentioned. Use "People in Your Day" above for private tags.</p>
                </InfoTooltip>
              </label>
              
              {/* Selected mentions display */}
              {mentionedUsers.length > 0 && (
                <div className="flex flex-wrap gap-2 mb-2">
                  {mentionedUsers.map((user) => (
                    <span
                      key={user.id}
                      className="px-3 py-1 bg-green-600/30 border border-green-500/50 rounded-full text-sm flex items-center gap-2"
                    >
                      @{user.name || user.email.split('@')[0]}
                      <button
                        onClick={() => removeMentionedUser(user.id)}
                        className="hover:text-red-400"
                        type="button"
                      >
                        ×
                      </button>
                    </span>
                  ))}
                </div>
              )}
              
              {friends.length === 0 ? (
                <div className="text-sm text-primary/60 p-2 bg-bg rounded border border-primary/30">
                  No friends yet. Add friends in the Friends tab to mention them!
                </div>
              ) : (
                <div className="relative">
                  <input
                    type="text"
                    value={friendSearch}
                    onChange={(e) => setFriendSearch(e.target.value)}
                    placeholder="Search friends to mention..."
                    className="w-full px-3 py-2 bg-bg border border-primary rounded text-primary placeholder:text-primary/40"
                  />
                  
                  {/* Friend search results dropdown */}
                  {friendSearch.trim() && (
                    <div className="absolute z-20 top-full left-0 right-0 mt-1 bg-card border border-primary rounded-lg shadow-lg max-h-48 overflow-y-auto">
                      {friends
                        .filter(f => {
                          const searchLower = friendSearch.toLowerCase()
                          const name = f.name?.toLowerCase() || ''
                          const email = f.email.toLowerCase()
                          return (name.includes(searchLower) || email.includes(searchLower)) &&
                            !mentionedUsers.find(u => u.id === f.id)
                        })
                        .slice(0, 8)
                        .map((friend) => (
                          <button
                            key={friend.id}
                            type="button"
                            onClick={() => {
                              addMentionedUser(friend)
                              setFriendSearch('')
                            }}
                            className="w-full px-3 py-2 text-left hover:bg-primary/10 flex items-center gap-2 transition-colors"
                          >
                            <span className="w-6 h-6 rounded-full bg-green-600/20 flex items-center justify-center text-xs text-green-400">
                              {(friend.name || friend.email)[0].toUpperCase()}
                            </span>
                            <span className="flex-1 truncate">{friend.name || friend.email}</span>
                          </button>
                        ))}
                      
                      {friends.filter(f => {
                        const searchLower = friendSearch.toLowerCase()
                        const name = f.name?.toLowerCase() || ''
                        const email = f.email.toLowerCase()
                        return (name.includes(searchLower) || email.includes(searchLower)) &&
                          !mentionedUsers.find(u => u.id === f.id)
                      }).length === 0 && (
                        <div className="px-3 py-2 text-sm text-primary/50">
                          No friends found matching "{friendSearch}"
                        </div>
                      )}
                    </div>
                  )}
                </div>
              )}
              
              <p className="text-xs text-primary/60 mt-1">
                Type to search your friends. They'll get a notification when you save.
              </p>
            </div>

            <div className="mb-4">
              <label className="block mb-2">Enter Notes for the Day</label>
              <textarea
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                placeholder="What made this song special today?"
                rows={4}
                className="w-full px-4 py-2 bg-card border border-primary rounded text-primary"
              />
            </div>

            {/* Mood Picker - Optional, after notes, before save */}
            <div className="mb-4">
              <label className="block mb-2 text-text/80 flex items-center gap-1.5">
                How did today feel? <span className="text-sm text-text/60 font-normal">(Optional)</span>
                <InfoTooltip title="Why Track Mood?" iconSize={14}>
                  <p>Mood tags help SongBird find patterns between your emotions and music over time.</p>
                  <p>For example, you might discover you listen to more upbeat music on good days, or that certain artists appear when you're feeling reflective.</p>
                  <p>These patterns show up in your Insights and Wrapped summary.</p>
                </InfoTooltip>
              </label>
              {!showMoodPicker ? (
                <button
                  onClick={() => setShowMoodPicker(true)}
                  className="w-full px-4 py-2 bg-surface border border-text/20 rounded-lg text-text/60 hover:bg-surface/80 transition-colors text-left"
                >
                  {selectedMood ? (
                    <span className="flex items-center gap-2">
                      <span className="text-2xl">{selectedMood}</span>
                      <span className="text-text/40 text-sm">Tap to change</span>
                    </span>
                  ) : (
                    'Add mood'
                  )}
                </button>
              ) : (
                <div className="space-y-3">
                  <div className="grid grid-cols-4 gap-2">
                    {['😊', '😌', '😢', '🔥', '😴', '🎉', '❤️', '😤'].map((mood) => (
                      <button
                        key={mood}
                        onClick={() => {
                          setSelectedMood(mood)
                          setShowMoodPicker(false)
                        }}
                        className={`p-3 rounded-lg text-2xl border-2 transition-all hover:scale-110 ${
                          selectedMood === mood
                            ? 'border-accent bg-accent/10'
                            : 'border-text/20 bg-surface hover:border-text/40'
                        }`}
                      >
                        {mood}
                      </button>
                    ))}
                  </div>
                  <div className="flex items-center gap-2">
                    <input
                      type="text"
                      placeholder="Or type any emoji..."
                      className="flex-1 px-3 py-2 bg-surface border border-text/20 rounded-lg text-2xl text-center focus:border-accent focus:outline-none"
                      maxLength={4}
                      value=""
                      onChange={(e) => {
                        const val = e.target.value.trim()
                        if (val) {
                          const picked = Array.from(val)[0]
                          if (picked && picked.charCodeAt(0) > 127) {
                            setSelectedMood(picked)
                            setShowMoodPicker(false)
                          }
                        }
                      }}
                    />
                  </div>
                  <div className="flex items-center justify-between">
                    <button
                      onClick={() => {
                        setShowMoodPicker(false)
                        setSelectedMood(null)
                      }}
                      className="text-sm text-text/60 hover:text-text transition-colors"
                    >
                      Skip
                    </button>
                    {selectedMood && (
                      <button
                        onClick={() => setShowMoodPicker(false)}
                        className="text-sm text-accent hover:text-accent/80 transition-colors font-medium"
                      >
                        Keep {selectedMood}
                      </button>
                    )}
                  </div>
                </div>
              )}
              {selectedMood && !showMoodPicker && (
                <div className="mt-2 flex items-center gap-2">
                  <span className="text-2xl">{selectedMood}</span>
                  <button
                    onClick={() => {
                      setSelectedMood(null)
                      setShowMoodPicker(true)
                    }}
                    className="text-xs text-text/60 hover:text-text transition-colors"
                  >
                    Change
                  </button>
                </div>
              )}
            </div>

            <button
              onClick={saveEntry}
              disabled={loading}
              className="px-6 py-2 bg-primary text-bg font-semibold rounded hover:bg-primary/80 transition-colors"
            >
              {loading ? 'Saving...' : 'Save Entry'}
            </button>
          </div>
        )}

        {message && (
          <div className="space-y-3">
            {message.upgradeRequired ? (
              <UpgradePrompt
                title="Entry Limit Reached"
                message={message.text}
                feature="entries"
                currentCount={message.currentCount}
                limit={message.limit}
                compact={true}
              />
            ) : (
              <div
                className={`p-4 rounded-xl flex items-center gap-3 ${
                  message.type === 'success'
                    ? 'bg-green-900/30 text-green-300 border border-green-500/30'
                    : 'bg-warn-bg text-warn-text border border-red-500/30'
                }`}
              >
                {message.type === 'success' ? (
                  <div className="flex-shrink-0">
                    <ThemeBird size={40} state="sing" />
                  </div>
                ) : (
                  <div className="flex-shrink-0">
                    <ThemeBird size={40} state="curious" />
                  </div>
                )}
                <div className="flex-1">
                  <div className="font-medium">{message.text}</div>
                  {message.type === 'success' && (
                    <div className="text-xs text-green-400/70 mt-1">♪ ♫ ♪</div>
                  )}
                </div>
              </div>
            )}
          </div>
        )}
      </div>

    </div>
  )
}


