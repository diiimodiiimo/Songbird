'use client'

import { useState, useEffect } from 'react'
import { useUser } from '@clerk/nextjs'
import { useRouter } from 'next/navigation'
import Image from 'next/image'
import Link from 'next/link'

interface Entry {
  id: string
  date: string
  songTitle: string
  artist: string
  albumArt: string | null
  notesPreview?: string
  notes?: string
  people?: Array<{ id: string; name: string }>
}

export default function MemoryTab() {
  const { user, isLoaded } = useUser()
  const router = useRouter()
  const [selectedDate, setSelectedDate] = useState(new Date().toISOString().split('T')[0])
  const [onThisDayEntries, setOnThisDayEntries] = useState<Entry[]>([])
  const [recentEntries, setRecentEntries] = useState<Entry[]>([])
  const [loadingOnThisDay, setLoadingOnThisDay] = useState(false)
  const [loadingRecent, setLoadingRecent] = useState(false)
  const [showNotes, setShowNotes] = useState(true)
  const [aiInsight, setAiInsight] = useState<string | null>(null)
  const [loadingInsight, setLoadingInsight] = useState(false)

  // Fetch On This Day entries
  useEffect(() => {
    if (isLoaded && user) {
      fetchOnThisDay()
    }
  }, [selectedDate, isLoaded, user])

  // Fetch recent entries (last 14)
  useEffect(() => {
    if (isLoaded && user) {
      fetchRecentEntries()
    }
  }, [isLoaded, user])

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
      const artists = entries.map(e => e.artist)
      const songs = entries.map(e => e.songTitle)
      const res = await fetch('/api/ai-insight', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ artists, songs, date: selectedDate }),
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

  // Extract month/day for date picker (MM-DD format)
  const getMonthDay = (dateStr: string) => {
    return dateStr.substring(5) // MM-DD
  }

  return (
    <div className="max-w-5xl mx-auto px-3 sm:px-4 py-4 sm:py-8">
      {/* On This Day Section - PRIMARY */}
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
          <div className="text-center py-12 text-text/60">Loading memories...</div>
        ) : onThisDayEntries.length > 0 ? (
          <div className="space-y-4">
            {onThisDayEntries.map((entry) => (
              <div key={entry.id} className="bg-surface rounded-xl p-6 hover:bg-surface/80 transition-colors">
                <div className="flex gap-4">
                  {entry.albumArt && (
                    <Image
                      src={entry.albumArt}
                      alt={entry.songTitle}
                      width={120}
                      height={120}
                      className="rounded-lg flex-shrink-0"
                      style={{ aspectRatio: '1/1', objectFit: 'cover', objectPosition: 'center' }}
                    />
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
            <div className="text-5xl mb-4">📅</div>
            <p className="text-text/60">
              No memories from this day yet.
            </p>
          </div>
        )}
      </div>

      {/* Recent Days Section - SECONDARY */}
      <div className="border-t border-surface/50 pt-8">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-xl sm:text-2xl font-bold">Recent Days</h2>
          <Link
            href="/archive"
            className="text-accent hover:text-accent/80 text-sm font-medium transition-colors"
          >
            Open Full Archive →
          </Link>
        </div>

        {loadingRecent ? (
          <div className="text-center py-8 text-text/60">Loading recent entries...</div>
        ) : recentEntries.length > 0 ? (
          <div className="space-y-3">
            {recentEntries.map((entry) => (
              <div key={entry.id} className="bg-surface rounded-lg p-4 hover:bg-surface/80 transition-colors">
                <div className="flex gap-3">
                  {entry.albumArt && (
                    <Image
                      src={entry.albumArt}
                      alt={entry.songTitle}
                      width={60}
                      height={60}
                      className="rounded-lg flex-shrink-0"
                      style={{ aspectRatio: '1/1', objectFit: 'cover', objectPosition: 'center' }}
                    />
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
          <div className="text-center py-8 text-text/60">
            No recent entries yet.
          </div>
        )}
      </div>
    </div>
  )
}

