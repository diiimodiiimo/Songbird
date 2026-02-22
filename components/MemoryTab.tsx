'use client'

import { useState, useEffect } from 'react'
import { useUser } from '@clerk/nextjs'
import { useRouter } from 'next/navigation'
import Image from 'next/image'
import Link from 'next/link'
import ThemeBird from './ThemeBird'
import SpotifyAttribution from './SpotifyAttribution'
import SongbirdFlight from './SongbirdFlight'
import AnalyticsTab from './AnalyticsTab'
import { getLocalDateString } from '@/lib/date-utils'

interface Entry {
  id: string
  date: string
  songTitle: string
  artist: string
  albumArt: string | null
  notesPreview?: string
  notes?: string
  people?: Array<{ id: string; name: string }>
  // Additional metadata for AI insights
  durationMs?: number | null
  explicit?: boolean
  popularity?: number | null
  releaseDate?: string | null
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

export default function MemoryTab() {
  const { user, isLoaded } = useUser()
  const router = useRouter()
  const [selectedDate, setSelectedDate] = useState(getLocalDateString())
  const [onThisDayEntries, setOnThisDayEntries] = useState<Entry[]>([])
  const [recentEntries, setRecentEntries] = useState<Entry[]>([])
  const [recentReflectionEntries, setRecentReflectionEntries] = useState<Entry[]>([])
  const [loadingOnThisDay, setLoadingOnThisDay] = useState(false)
  const [loadingRecent, setLoadingRecent] = useState(false)
  const [loadingRecentReflections, setLoadingRecentReflections] = useState(false)
  const [showNotes, setShowNotes] = useState(true)
  const [aiInsight, setAiInsight] = useState<string | null>(null)
  const [loadingInsight, setLoadingInsight] = useState(false)
  const [journeyNarrative, setJourneyNarrative] = useState<string | null>(null)
  const [loadingJourneyNarrative, setLoadingJourneyNarrative] = useState(false)
  const [milestoneData, setMilestoneData] = useState<MilestoneData | null>(null)
  const [loadingMilestones, setLoadingMilestones] = useState(false)
  const [flightInsight, setFlightInsight] = useState<string | null>(null)
  const [loadingFlightInsight, setLoadingFlightInsight] = useState(false)
  const [recentDaysOpen, setRecentDaysOpen] = useState(false)
  const [statsOpen, setStatsOpen] = useState(false)

  // Fetch On This Day entries
  useEffect(() => {
    if (isLoaded && user) {
      fetchOnThisDay()
    }
  }, [selectedDate, isLoaded, user])

  // Fetch recent entries (last 14) and total count
  useEffect(() => {
    if (isLoaded && user) {
      fetchRecentEntries()
      fetchRecentReflections()
      fetchMilestones()
    }
  }, [isLoaded, user])

  // Fetch journey narrative when entries change
  useEffect(() => {
    if (isLoaded && user && recentEntries.length > 0 && milestoneData) {
      fetchJourneyNarrative()
    }
  }, [recentEntries.length, milestoneData?.stats.entryCount, isLoaded, user])

  const fetchOnThisDay = async () => {
    if (!user || !isLoaded) return
    
    setLoadingOnThisDay(true)
    try {
      const res = await fetch(`/api/on-this-day?date=${selectedDate}`)
      const data = await res.json()
      if (res.ok) {
        setOnThisDayEntries(data.entries || [])
        // Fetch AI insight if we have entries
        if (data.entries && data.entries.length > 0) {
          fetchAiInsight(data.entries)
        } else {
          setAiInsight(null)
        }
      }
    } catch (error) {
      console.error('Error fetching on-this-day entries:', error)
    } finally {
      setLoadingOnThisDay(false)
    }
  }

  const fetchAiInsight = async (entries: Entry[]) => {
    setLoadingInsight(true)
    try {
      // Extract all data dimensions for richer AI insights
      const artists = entries.map(e => e.artist)
      const songs = entries.map(e => e.songTitle)
      const popularity = entries.map(e => e.popularity).filter((p): p is number => p !== null && p !== undefined)
      const duration = entries.map(e => e.durationMs).filter((d): d is number => d !== null && d !== undefined)
      const explicit = entries.map(e => e.explicit || false)
      const releaseDate = entries.map(e => e.releaseDate).filter((r): r is string => r !== null && r !== undefined)
      const notes = entries.map(e => e.notes).filter((n): n is string => n !== null && n !== undefined)
      const people = entries.flatMap(e => e.people?.map(p => p.name) || [])
      const years = entries.map(e => parseInt(e.date.split('-')[0]))
      
      const res = await fetch('/api/ai-insight', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          artists, 
          songs, 
          date: selectedDate,
          // Extended data for richer insights
          popularity,
          duration,
          explicit,
          releaseDate,
          notes,
          people,
          years,
        }),
      })
      const data = await res.json()
      if (res.ok && data.insight) {
        setAiInsight(data.insight)
      }
    } catch (error) {
      console.error('Error fetching AI insight:', error)
    } finally {
      setLoadingInsight(false)
    }
  }

  const fetchRecentEntries = async () => {
    if (!user || !isLoaded) return
    
    setLoadingRecent(true)
    try {
      const res = await fetch('/api/entries?page=1&pageSize=14')
      const data = await res.json()
      if (res.ok) {
        setRecentEntries(data.entries || [])
      }
    } catch (error) {
      console.error('Error fetching recent entries:', error)
    } finally {
      setLoadingRecent(false)
    }
  }

  const fetchRecentReflections = async () => {
    if (!user || !isLoaded) return
    
    setLoadingRecentReflections(true)
    try {
      // Fetch last 14 days of entries with full details
      const res = await fetch('/api/entries?page=1&pageSize=14')
      const data = await res.json()
      if (res.ok && data.entries) {
        const now = new Date()
        const sevenDaysAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000)
        const recent = data.entries.filter((entry: Entry) => {
          const entryDate = new Date(entry.date)
          return entryDate >= sevenDaysAgo
        })
        
        if (recent.length >= 2) {
          setRecentReflectionEntries(recent)
          fetchFlightInsight(recent)
        } else {
          setRecentReflectionEntries([])
          setFlightInsight(null)
        }
      }
    } catch (error) {
      console.error('Error fetching recent reflections:', error)
    } finally {
      setLoadingRecentReflections(false)
    }
  }

  const fetchFlightInsight = async (entries: Entry[]) => {
    if (entries.length < 2) return

    setLoadingFlightInsight(true)
    try {
      const artists = entries.map(e => e.artist)
      const songs = entries.map(e => e.songTitle)
      const notes = entries.map(e => e.notes).filter((n): n is string => n !== null && n !== undefined)
      const people = entries.flatMap(e => e.people?.map(p => p.name) || [])

      const res = await fetch('/api/ai-insight', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          artists,
          songs,
          date: new Date().toISOString().split('T')[0],
          context: 'recent',
          notes: notes.length > 0 ? notes : undefined,
          people: people.length > 0 ? people : undefined,
        }),
      })
      const data = await res.json()
      if (res.ok && data.insight) {
        setFlightInsight(data.insight)
      }
    } catch (error) {
      console.error('Error fetching flight insight:', error)
    } finally {
      setLoadingFlightInsight(false)
    }
  }

  const fetchJourneyNarrative = async () => {
    if (!user || !isLoaded || recentEntries.length === 0 || !milestoneData) return
    
    setLoadingJourneyNarrative(true)
    try {
      const entryCount = milestoneData.stats.entryCount
      // For journey narrative, we can use a subset of entries or all entries
      const entriesToUse = recentEntries.slice(0, Math.min(5, recentEntries.length))
      
      const artists = entriesToUse.map(e => e.artist)
      const songs = entriesToUse.map(e => e.songTitle)
      const popularity = entriesToUse.map(e => e.popularity).filter((p): p is number => p !== null && p !== undefined)
      const duration = entriesToUse.map(e => e.durationMs).filter((d): d is number => d !== null && d !== undefined)
      const explicit = entriesToUse.map(e => e.explicit || false)
      const releaseDate = entriesToUse.map(e => e.releaseDate).filter((r): r is string => r !== null && r !== undefined)
      const notes = entriesToUse.map(e => e.notes).filter((n): n is string => n !== null && n !== undefined)
      const people = entriesToUse.flatMap(e => e.people?.map(p => p.name) || [])
      const years = entriesToUse.map(e => parseInt(e.date.split('-')[0]))
      
      const res = await fetch('/api/ai-insight', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          artists, 
          songs, 
          date: new Date().toISOString().split('T')[0],
          context: 'journey',
          entryCount,
          popularity,
          duration,
          explicit,
          releaseDate,
          notes,
          people,
          years,
        }),
      })
      const data = await res.json()
      if (res.ok && data.insight) {
        setJourneyNarrative(data.insight)
      }
    } catch (error) {
      console.error('Error fetching journey narrative:', error)
    } finally {
      setLoadingJourneyNarrative(false)
    }
  }

  const fetchMilestones = async () => {
    if (!user || !isLoaded) return
    
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

  // Extract month/day for date picker (MM-DD format)
  const getMonthDay = (dateStr: string) => {
    return dateStr.substring(5) // MM-DD
  }

  return (
    <div className="max-w-5xl mx-auto px-3 sm:px-4 py-4 sm:py-8">
      {/* On This Day Section - FIRST */}
      <div className="mb-12">
        <h2 className="text-2xl sm:text-3xl font-bold mb-6">On This Day</h2>
        
        {/* Date Picker */}
        <div className="bg-surface rounded-xl p-6 mb-6">
          <label className="block text-text/70 mb-3 text-center">
            What happened on this day?
          </label>
          <div className="flex items-center justify-center gap-3">
            <input
              type="date"
              value={selectedDate}
              onChange={(e) => setSelectedDate(e.target.value)}
              className="bg-bg rounded-lg px-4 py-3 text-text border border-transparent focus:border-accent outline-none transition-colors"
            />
          </div>
          
          {/* Notes Toggle */}
          <div className="flex items-center justify-center gap-2 mt-4">
            <label className="text-sm text-text/70 cursor-pointer flex items-center gap-2">
              <input
                type="checkbox"
                checked={showNotes}
                onChange={(e) => setShowNotes(e.target.checked)}
                className="w-4 h-4 rounded border-surface bg-bg text-accent focus:ring-accent focus:ring-2"
              />
              Show notes
            </label>
          </div>
        </div>

        {/* AI Insight */}
        {onThisDayEntries.length > 0 && (
          <div className="bg-surface/50 rounded-xl p-4 mb-6 border border-accent/20">
            {loadingInsight ? (
              <div className="text-text/60 text-sm">Analyzing your music...</div>
            ) : aiInsight ? (
              <div className="text-text/90 text-sm italic">"{aiInsight}"</div>
            ) : null}
          </div>
        )}

        {loadingOnThisDay ? (
          <div className="text-center py-12">
            <div className="flex justify-center mb-4">
              <ThemeBird size={64} state="curious" className="animate-pulse" />
            </div>
            <p className="text-text/60">Searching your memories...</p>
          </div>
        ) : onThisDayEntries.length > 0 ? (
          <div className="space-y-4">
            {onThisDayEntries.map((entry) => (
              <div key={entry.id} className="bg-surface rounded-xl p-6 hover:bg-surface/80 transition-colors">
                <div className="flex gap-4">
                  {entry.albumArt && (
                    <div className="flex-shrink-0 self-stretch flex items-center">
                      <div className="relative group">
                        <div className="absolute -inset-1 bg-gradient-to-br from-accent via-pink-500 to-purple-500 rounded-xl opacity-75 blur-sm group-hover:opacity-100 transition-opacity"></div>
                        <Image
                          src={entry.albumArt}
                          alt={entry.songTitle}
                          width={120}
                          height={120}
                          className="relative rounded-lg h-full w-auto border-2 border-white/10"
                          style={{ objectFit: 'contain' }}
                        />
                      </div>
                    </div>
                  )}
                  <div className="flex-1 min-w-0">
                    <div className="text-sm text-accent mb-2 font-semibold">
                      {entry.date.split('-')[0]} {/* Year */}
                    </div>
                    <h3 className="font-title text-2xl mb-1">
                      {entry.songTitle}
                    </h3>
                    <div className="text-text/70 mb-3">
                      {entry.artist}
                    </div>
                    <div className="mb-3">
                      <SpotifyAttribution variant="minimal" />
                    </div>
                    {showNotes && (entry.notesPreview || entry.notes) && (
                      <p className="text-text/80 mb-3 text-sm">
                        {entry.notesPreview || entry.notes}
                      </p>
                    )}
                    
                    {/* People in Your Day */}
                    {entry.people && entry.people.length > 0 && (
                      <div className="flex flex-wrap gap-2 mt-3">
                        {entry.people.map((person) => (
                          <span
                            key={person.id}
                            className="px-3 py-1.5 bg-accent/10 border border-accent/30 rounded-full text-sm text-text font-medium"
                          >
                            {person.name}
                          </span>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="text-center py-12">
            <div className="flex justify-center mb-4">
              <ThemeBird size={72} state="curious" />
            </div>
            {recentEntries.length === 0 ? (
              <>
                <p className="text-text/60 mb-2 text-lg">
                  Welcome to your musical journal
                </p>
                <p className="text-text/70 mb-4 max-w-md mx-auto">
                  Every song you log becomes a memory. Start your journey by logging your first song—each entry tells a story about who you were and what mattered in that moment.
                </p>
                {milestoneData?.nextMilestone?.progress && (
                  <div className="mt-6 bg-surface rounded-lg p-4 max-w-sm mx-auto">
                    <p className="text-text/80 text-sm mb-2">{milestoneData.nextMilestone.progress.message}</p>
                    <div className="w-full bg-bg rounded-full h-2">
                      <div 
                        className="bg-accent h-2 rounded-full transition-all"
                        style={{ width: `${Math.min(100, (milestoneData.nextMilestone.progress.current / milestoneData.nextMilestone.progress.target) * 100)}%` }}
                      />
                    </div>
                  </div>
                )}
              </>
            ) : (
              <>
                <p className="text-text/60 mb-2">
                  No memories from this day yet.
                </p>
                <p className="text-text/40 text-sm">
                  Keep logging songs to build your musical timeline!
                </p>
                {milestoneData?.nextMilestone?.progress && (
                  <div className="mt-6 bg-surface rounded-lg p-4 max-w-sm mx-auto">
                    <p className="text-text/80 text-sm mb-2">{milestoneData.nextMilestone.progress.message}</p>
                    <div className="w-full bg-bg rounded-full h-2">
                      <div 
                        className="bg-accent h-2 rounded-full transition-all"
                        style={{ width: `${Math.min(100, (milestoneData.nextMilestone.progress.current / milestoneData.nextMilestone.progress.target) * 100)}%` }}
                      />
                    </div>
                  </div>
                )}
              </>
            )}
          </div>
        )}
      </div>

      {/* Recent Flight Section - SECOND */}
      {recentReflectionEntries.length >= 2 && (
        <div className="mb-12">
          <h2 className="text-2xl sm:text-3xl font-bold mb-6">Your Recent Flight</h2>
          <SongbirdFlight
            entries={recentReflectionEntries}
            insight={flightInsight}
            loadingInsight={loadingFlightInsight}
          />
        </div>
      )}

      {/* Recent Days Section - THIRD (collapsible) */}
      <div className="border-t border-surface/50 pt-6">
        <button
          onClick={() => setRecentDaysOpen(!recentDaysOpen)}
          className="w-full flex items-center justify-between py-2 group"
        >
          <h2 className="text-xl sm:text-2xl font-bold group-hover:text-accent transition-colors">Recent Days</h2>
          <div className="flex items-center gap-3">
            <Link
              href="/archive"
              onClick={(e) => e.stopPropagation()}
              className="text-accent hover:text-accent/80 text-sm font-medium transition-colors"
            >
              Full Archive →
            </Link>
            <svg
              width="20"
              height="20"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
              className={`text-text/40 transition-transform duration-300 ${recentDaysOpen ? 'rotate-180' : ''}`}
            >
              <polyline points="6 9 12 15 18 9" />
            </svg>
          </div>
        </button>

        <div
          className={`overflow-hidden transition-all duration-300 ease-in-out ${
            recentDaysOpen ? 'max-h-[2000px] opacity-100 mt-4' : 'max-h-0 opacity-0'
          }`}
        >
          {loadingRecent ? (
            <div className="text-center py-8">
              <div className="flex justify-center mb-3">
                <ThemeBird size={48} state="bounce" className="animate-bounce" />
              </div>
              <p className="text-text/60">Loading recent entries...</p>
            </div>
          ) : recentEntries.length > 0 ? (
            <div className="space-y-3">
              {recentEntries.map((entry) => (
                <div key={entry.id} className="bg-surface rounded-lg p-4 hover:bg-surface/80 transition-colors">
                  <div className="flex gap-3">
                    {entry.albumArt && (
                      <div className="flex-shrink-0 self-stretch flex items-center">
                        <div className="relative group">
                          <div className="absolute -inset-0.5 bg-gradient-to-br from-accent via-pink-500 to-purple-500 rounded-lg opacity-50 blur-[2px] group-hover:opacity-80 transition-opacity"></div>
                          <Image
                            src={entry.albumArt}
                            alt={entry.songTitle}
                            width={60}
                            height={60}
                            className="relative rounded-lg h-full w-auto border border-white/10"
                            style={{ objectFit: 'contain' }}
                          />
                        </div>
                      </div>
                    )}
                    <div className="flex-1 min-w-0">
                      <div className="text-xs text-text/60 mb-1">
                        {(() => {
                          const [year, month, day] = entry.date.split('-')
                          const date = new Date(parseInt(year), parseInt(month) - 1, parseInt(day))
                          return date.toLocaleDateString('en-US', { 
                            month: 'short', 
                            day: 'numeric', 
                            year: 'numeric' 
                          })
                        })()}
                      </div>
                      <h4 className="font-semibold text-lg mb-1 truncate">
                        {entry.songTitle}
                      </h4>
                      <div className="text-text/70 text-sm truncate">
                        {entry.artist}
                      </div>
                      {showNotes && (entry.notesPreview || entry.notes) && (
                        <p className="text-text/80 text-xs mt-2 line-clamp-2">
                          {entry.notesPreview || entry.notes}
                        </p>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-8">
              <div className="flex justify-center mb-3">
                <ThemeBird size={56} />
              </div>
              <p className="text-text/60">No recent entries yet.</p>
              <p className="text-text/40 text-sm mt-1">Start logging songs to see them here!</p>
            </div>
          )}
        </div>
      </div>
      {/* Your Stats Section */}
      <div className="border-t border-surface/50 pt-6 mt-6">
        <button
          onClick={() => setStatsOpen(!statsOpen)}
          className="w-full flex items-center justify-between py-2 group"
        >
          <h2 className="text-xl sm:text-2xl font-bold group-hover:text-accent transition-colors">Your Stats</h2>
          <svg
            width="20"
            height="20"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
            className={`text-text/40 transition-transform duration-300 ${statsOpen ? 'rotate-180' : ''}`}
          >
            <polyline points="6 9 12 15 18 9" />
          </svg>
        </button>

        <div
          className={`overflow-hidden transition-all duration-300 ease-in-out ${
            statsOpen ? 'max-h-[5000px] opacity-100 mt-4' : 'max-h-0 opacity-0'
          }`}
        >
          {(milestoneData?.stats.entryCount ?? 0) >= 30 ? (
            <AnalyticsTab />
          ) : (
            <div className="text-center py-12 bg-surface rounded-xl">
              <div className="flex justify-center mb-4">
                <ThemeBird size={72} state="curious" />
              </div>
              <h3 className="text-lg font-semibold text-text mb-2">Unlock Your Stats</h3>
              <p className="text-text/60 mb-4 max-w-sm mx-auto">
                Log 30 songs to unlock your personal analytics — top artists, top songs, and more.
              </p>
              <div className="max-w-xs mx-auto">
                <div className="flex justify-between text-sm text-text/60 mb-1">
                  <span>{milestoneData?.stats.entryCount ?? 0} / 30 songs logged</span>
                  <span>{Math.round(((milestoneData?.stats.entryCount ?? 0) / 30) * 100)}%</span>
                </div>
                <div className="w-full bg-bg rounded-full h-3">
                  <div 
                    className="bg-accent h-3 rounded-full transition-all"
                    style={{ width: `${Math.min(100, ((milestoneData?.stats.entryCount ?? 0) / 30) * 100)}%` }}
                  />
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

