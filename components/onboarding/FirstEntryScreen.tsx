'use client'

import { useState, useEffect } from 'react'
import Image from 'next/image'
import ThemeBird from '@/components/ThemeBird'
import SpotifyAttribution from '@/components/SpotifyAttribution'
import ProgressDots from './ProgressDots'

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

interface FirstEntryScreenProps {
  onContinue: (entryData?: any) => void
  onSkip: () => void
}

export default function FirstEntryScreen({ onContinue, onSkip }: FirstEntryScreenProps) {
  const [showForm, setShowForm] = useState(false)
  const [showFlyingAnimation, setShowFlyingAnimation] = useState(false)
  const [date, setDate] = useState(new Date().toISOString().split('T')[0])
  const [query, setQuery] = useState('')
  const [tracks, setTracks] = useState<Track[]>([])
  const [selectedTrack, setSelectedTrack] = useState<Track | null>(null)
  const [notes, setNotes] = useState('')
  const [loading, setLoading] = useState(false)
  const [saving, setSaving] = useState(false)
  const [saved, setSaved] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const handleBirdClick = () => {
    // Prevent double-clicks
    if (showFlyingAnimation || showForm) return
    
    setShowFlyingAnimation(true)
    setTimeout(() => {
      setShowForm(true)
      setShowFlyingAnimation(false)
    }, 600)
  }

  const searchSongs = async () => {
    if (!query.trim()) return

    setLoading(true)
    setError(null)
    try {
      const res = await fetch(`/api/songs/search?q=${encodeURIComponent(query)}`)
      const data = await res.json()
      if (res.ok) {
        setTracks(data.tracks)
      } else {
        setError('Failed to search songs')
      }
    } catch (err) {
      setError('Failed to search songs')
    } finally {
      setLoading(false)
    }
  }

  const saveEntry = async () => {
    if (!selectedTrack) return

    setSaving(true)
    setError(null)
    try {
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
        }),
      })

      if (res.ok) {
        setSaved(true)
        const entryData = {
          songTitle: selectedTrack.name,
          artist: selectedTrack.artist,
          albumArt: selectedTrack.albumArt,
          date,
          notes: notes || undefined,
        }
        // Track analytics
        fetch('/api/analytics/event', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ event: 'onboarding_first_entry_created' }),
        }).catch(() => {})
        
        // Wait a moment to show success, then continue with entry data
        setTimeout(() => {
          onContinue(entryData)
        }, 1500)
      } else {
        const data = await res.json()
        setError(data.error || 'Failed to save entry')
      }
    } catch (err) {
      setError('Something went wrong')
    } finally {
      setSaving(false)
    }
  }

  const handleSkip = () => {
    // Track analytics
    fetch('/api/analytics/event', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ event: 'onboarding_first_entry_skipped' }),
    }).catch(() => {})
    onSkip()
  }

  // Success state
  if (saved) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen px-6 py-12">
        <div className="mb-6">
          <ThemeBird size={120} state="sing" />
        </div>
        <h2 className="text-2xl font-bold text-text mb-2 text-center">Got it!</h2>
        <p className="text-text/70 text-center">Your first memory is saved ♪</p>
      </div>
    )
  }

  // Landing state (before form)
  if (!showForm) {
    return (
      <div className="flex flex-col min-h-screen px-6 py-12">
        <div className="flex-1 flex flex-col items-center justify-center max-w-md mx-auto w-full">
          {/* Headline */}
          <h1 className="text-3xl sm:text-4xl font-bold text-text mb-3 text-center font-title">
            Let's log your first song
          </h1>
          
          <p className="text-text/60 mb-4 text-center max-w-md mx-auto">
            The song of the day can be anything: maybe it came on in the gym, maybe you were blasting it in the car with a friend, maybe it was stuck in your head all day.
          </p>
          
          <p className="text-text/70 mb-10 text-center max-w-md mx-auto font-medium">
            Whatever will help you remember the day.
          </p>

          {/* Tappable bird */}
          <div className={`relative ${showFlyingAnimation ? 'pointer-events-none' : ''}`}>
            {/* Music note trails when flying */}
            {showFlyingAnimation && (
              <>
                <span className="absolute top-1/2 left-1/2 text-2xl text-accent animate-note-trail" style={{ animationDelay: '0.05s' }}>♪</span>
                <span className="absolute top-1/3 left-1/3 text-xl text-accent/70 animate-note-trail" style={{ animationDelay: '0.15s' }}>♫</span>
                <span className="absolute top-2/3 left-2/3 text-lg text-accent animate-note-trail" style={{ animationDelay: '0.25s' }}>♪</span>
              </>
            )}
            
            <button
              onClick={handleBirdClick}
              disabled={showFlyingAnimation}
              className={`group relative transition-all focus:outline-none focus:ring-2 focus:ring-accent/50 rounded-full ${
                showFlyingAnimation ? 'animate-bird-flyoff' : 'hover:scale-105 active:scale-95'
              }`}
            >
              <div className={`transition-all ${showFlyingAnimation ? '' : 'animate-pulse group-hover:animate-none group-hover:drop-shadow-[0_0_20px_rgba(255,255,255,0.3)]'}`} style={{ animationDuration: '3s' }}>
                <ThemeBird size={140} state={showFlyingAnimation ? 'fly' : 'bounce'} />
              </div>
            </button>
          </div>

          <p className="mt-4 text-text/40 text-sm animate-pulse" style={{ animationDuration: '2s' }}>
            Tap the bird to get started
          </p>
        </div>

        {/* Skip option */}
        <div className="w-full max-w-md mx-auto pb-4">
          <button
            onClick={handleSkip}
            className="w-full py-3 text-text/50 hover:text-text/70 transition-colors text-sm"
          >
            I'll do this later
          </button>
        </div>

        {/* Progress dots */}
        <ProgressDots totalSteps={12} currentStep={5} className="pb-8" />
      </div>
    )
  }

  // Form state
  return (
    <div className="flex flex-col min-h-screen px-6 py-8">
      <div className="flex-1 max-w-lg mx-auto w-full overflow-y-auto">
        {/* Date picker */}
        <div className="mb-6">
          <label className="block text-text/70 text-sm mb-2">Date</label>
          <input
            type="date"
            value={date}
            onChange={(e) => setDate(e.target.value)}
            className="w-full px-4 py-3 bg-surface border border-text/10 rounded-xl text-text focus:outline-none focus:border-accent transition-colors"
          />
        </div>

        {/* Search */}
        <div className="mb-6">
          <label className="block text-text/70 text-sm mb-2">Search for a song</label>
          <div className="flex gap-2">
            <input
              type="text"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              onKeyPress={(e) => e.key === 'Enter' && searchSongs()}
              placeholder="Song or artist name..."
              autoFocus
              className="flex-1 px-4 py-3 bg-surface border border-text/10 rounded-xl text-text placeholder:text-text/30 focus:outline-none focus:border-accent transition-colors"
            />
            <button
              onClick={searchSongs}
              disabled={loading || !query.trim()}
              className="px-6 py-3 bg-accent text-bg font-medium rounded-xl hover:bg-accent/90 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading ? '...' : 'Search'}
            </button>
          </div>
        </div>

        {/* Search results */}
        {tracks.length > 0 && !selectedTrack && (
          <div className="mb-6 space-y-2 max-h-60 overflow-y-auto">
            {tracks.slice(0, 5).map((track) => (
              <button
                key={track.id}
                onClick={() => setSelectedTrack(track)}
                className="w-full flex items-center gap-3 p-3 bg-surface rounded-xl hover:bg-surface/80 transition-colors text-left"
              >
                {track.albumArt && (
                  <Image
                    src={track.albumArt}
                    alt={track.album}
                    width={48}
                    height={48}
                    className="rounded-lg"
                  />
                )}
                <div className="flex-1 min-w-0">
                  <div className="font-medium text-text truncate">{track.name}</div>
                  <div className="text-sm text-text/60 truncate">{track.artist}</div>
                </div>
              </button>
            ))}
          </div>
        )}

        {/* Selected track */}
        {selectedTrack && (
          <div className="mb-6">
            <div className="flex items-start gap-4 p-4 bg-surface rounded-xl border border-accent/30">
              {selectedTrack.albumArt && (
                <Image
                  src={selectedTrack.albumArt}
                  alt={selectedTrack.album}
                  width={80}
                  height={80}
                  className="rounded-lg"
                />
              )}
              <div className="flex-1 min-w-0">
                <div className="font-bold text-lg text-text">{selectedTrack.name}</div>
                <div className="text-text/70">{selectedTrack.artist}</div>
                <div className="mt-1">
                  <SpotifyAttribution variant="minimal" />
                </div>
                <button
                  onClick={() => setSelectedTrack(null)}
                  className="mt-2 text-sm text-accent hover:text-accent/80 transition-colors"
                >
                  Change song
                </button>
              </div>
            </div>

            {/* Notes */}
            <div className="mt-4">
              <label className="block text-text/70 text-sm mb-2">
                Notes <span className="text-text/40">(optional)</span>
              </label>
              <textarea
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                placeholder="What made this song special today?"
                rows={3}
                className="w-full px-4 py-3 bg-surface border border-text/10 rounded-xl text-text placeholder:text-text/30 focus:outline-none focus:border-accent transition-colors resize-none"
              />
            </div>

            <p className="mt-3 text-text/40 text-xs">
              Not sure yet? You can always edit or change songs later from your timeline.
            </p>
          </div>
        )}

        {/* Error */}
        {error && (
          <div className="mb-4 p-3 bg-red-500/10 border border-red-500/30 rounded-xl text-red-400 text-sm">
            {error}
          </div>
        )}
      </div>

      {/* Bottom actions */}
      <div className="w-full max-w-lg mx-auto pt-4 pb-4">
        <button
          onClick={saveEntry}
          disabled={!selectedTrack || saving}
          className={`w-full py-4 px-8 font-semibold rounded-xl text-lg transition-all ${
            selectedTrack && !saving
              ? 'bg-accent text-bg hover:bg-accent/90 hover:scale-[1.02] active:scale-[0.98]'
              : 'bg-surface text-text/30 cursor-not-allowed'
          }`}
        >
          {saving ? 'Saving...' : 'Save Entry'}
        </button>
        
        <button
          onClick={handleSkip}
          className="w-full mt-3 py-3 text-text/50 hover:text-text/70 transition-colors text-sm"
        >
          I'll do this later
        </button>
      </div>

      {/* Progress dots */}
      <ProgressDots totalSteps={12} currentStep={5} className="pb-6" />
    </div>
  )
}

