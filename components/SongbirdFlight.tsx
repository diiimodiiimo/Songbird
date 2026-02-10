'use client'

import { useState, useEffect, useCallback, useRef } from 'react'
import Image from 'next/image'
import ThemeBird from './ThemeBird'
import type { BirdState } from './ThemeBird'

interface FlightEntry {
  id: string
  date: string
  songTitle: string
  artist: string
  albumArt: string | null
  notesPreview?: string
  notes?: string
  people?: Array<{ id: string; name: string }>
}

interface SongbirdFlightProps {
  entries: FlightEntry[]
}

export default function SongbirdFlight({ entries }: SongbirdFlightProps) {
  const [activeIndex, setActiveIndex] = useState(0)
  const [isTransitioning, setIsTransitioning] = useState(false)
  const [isPaused, setIsPaused] = useState(false)
  const [birdState, setBirdState] = useState<BirdState>('float')
  const [slideDirection, setSlideDirection] = useState<'left' | 'right'>('left')
  const touchStartX = useRef<number | null>(null)
  const containerRef = useRef<HTMLDivElement>(null)

  // Auto-advance every 5 seconds
  useEffect(() => {
    if (isPaused || entries.length <= 1) return

    const timer = setInterval(() => {
      advance('forward')
    }, 5000)

    return () => clearInterval(timer)
  }, [activeIndex, isPaused, entries.length])

  const advance = useCallback((direction: 'forward' | 'backward') => {
    if (isTransitioning) return

    setSlideDirection(direction === 'forward' ? 'left' : 'right')
    setBirdState('fly')
    setIsTransitioning(true)

    setTimeout(() => {
      if (direction === 'forward') {
        setActiveIndex((prev) => (prev + 1) % entries.length)
      } else {
        setActiveIndex((prev) => (prev - 1 + entries.length) % entries.length)
      }
    }, 250)

    setTimeout(() => {
      setIsTransitioning(false)
      setBirdState('sing')
      // Return to float after landing
      setTimeout(() => setBirdState('float'), 1200)
    }, 500)
  }, [entries.length, isTransitioning])

  const goToIndex = useCallback((index: number) => {
    if (isTransitioning || index === activeIndex) return

    setSlideDirection(index > activeIndex ? 'left' : 'right')
    setBirdState('fly')
    setIsTransitioning(true)

    setTimeout(() => {
      setActiveIndex(index)
    }, 250)

    setTimeout(() => {
      setIsTransitioning(false)
      setBirdState('sing')
      setTimeout(() => setBirdState('float'), 1200)
    }, 500)
  }, [activeIndex, isTransitioning])

  // Touch/swipe support
  const handleTouchStart = (e: React.TouchEvent) => {
    touchStartX.current = e.touches[0].clientX
  }

  const handleTouchEnd = (e: React.TouchEvent) => {
    if (touchStartX.current === null) return
    const diff = touchStartX.current - e.changedTouches[0].clientX
    if (Math.abs(diff) > 50) {
      if (diff > 0) advance('forward')
      else advance('backward')
    }
    touchStartX.current = null
  }

  const entry = entries[activeIndex]
  if (!entry || entries.length === 0) return null

  const formatRelativeDate = (dateStr: string) => {
    const [year, month, day] = dateStr.split('-')
    const entryDate = new Date(parseInt(year), parseInt(month) - 1, parseInt(day))
    const now = new Date()
    now.setHours(0, 0, 0, 0)
    entryDate.setHours(0, 0, 0, 0)
    const diffDays = Math.round((now.getTime() - entryDate.getTime()) / (1000 * 60 * 60 * 24))

    if (diffDays === 0) return 'Today'
    if (diffDays === 1) return 'Yesterday'
    return `${diffDays} days ago`
  }

  const formatDate = (dateStr: string) => {
    const [year, month, day] = dateStr.split('-')
    const date = new Date(parseInt(year), parseInt(month) - 1, parseInt(day))
    return date.toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' })
  }

  // Collect all unique people across all entries for the "who's been in your days" summary
  const allPeople = Array.from(
    new Map(
      entries.flatMap(e => e.people || []).map(p => [p.id, p])
    ).values()
  )

  return (
    <div
      ref={containerRef}
      className="relative"
      onMouseEnter={() => setIsPaused(true)}
      onMouseLeave={() => setIsPaused(false)}
      onTouchStart={handleTouchStart}
      onTouchEnd={handleTouchEnd}
    >
      {/* Bird + Flight Path Header */}
      <div className="flex items-center justify-between mb-5">
        <div className="flex items-center gap-3">
          <div className="relative">
            <ThemeBird
              size={32}
              state={birdState}
              showParticles={birdState === 'sing'}
            />
          </div>
          <div>
            <div className="text-xs text-accent/80 font-semibold uppercase tracking-wider">
              {formatRelativeDate(entry.date)}
            </div>
            <div className="text-sm text-text/50">
              {formatDate(entry.date)}
            </div>
          </div>
        </div>

        {/* Navigation arrows */}
        <div className="flex items-center gap-2">
          <button
            onClick={() => advance('backward')}
            disabled={isTransitioning}
            className="w-8 h-8 rounded-full bg-surface/80 hover:bg-surface flex items-center justify-center text-text/60 hover:text-text transition-colors disabled:opacity-30"
            aria-label="Previous song"
          >
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
              <polyline points="15 18 9 12 15 6" />
            </svg>
          </button>
          <span className="text-xs text-text/40 tabular-nums min-w-[3ch] text-center">
            {activeIndex + 1}/{entries.length}
          </span>
          <button
            onClick={() => advance('forward')}
            disabled={isTransitioning}
            className="w-8 h-8 rounded-full bg-surface/80 hover:bg-surface flex items-center justify-center text-text/60 hover:text-text transition-colors disabled:opacity-30"
            aria-label="Next song"
          >
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
              <polyline points="9 18 15 12 9 6" />
            </svg>
          </button>
        </div>
      </div>

      {/* Main Card - Animated */}
      <div className="relative overflow-hidden rounded-2xl bg-surface">
        <div
          className={`
            transition-all duration-300 ease-in-out
            ${isTransitioning
              ? slideDirection === 'left'
                ? 'opacity-0 -translate-x-4 scale-[0.97]'
                : 'opacity-0 translate-x-4 scale-[0.97]'
              : 'opacity-100 translate-x-0 scale-100'
            }
          `}
        >
          {/* Album art hero + info overlay */}
          <div className="relative">
            {entry.albumArt && (
              <div className="relative">
                {/* Blurred background */}
                <div className="absolute inset-0 overflow-hidden rounded-t-2xl">
                  <Image
                    src={entry.albumArt}
                    alt=""
                    fill
                    className="object-cover blur-2xl opacity-30 scale-110"
                  />
                  <div className="absolute inset-0 bg-gradient-to-b from-surface/40 via-surface/60 to-surface" />
                </div>

                {/* Content */}
                <div className="relative flex gap-4 p-5 pb-4">
                  {/* Album Art */}
                  <div className="flex-shrink-0">
                    <div className="relative group">
                      <div className="absolute -inset-1 bg-gradient-to-br from-accent/50 via-primary/30 to-accent/50 rounded-xl opacity-75 blur-sm group-hover:opacity-100 transition-opacity" />
                      <Image
                        src={entry.albumArt}
                        alt={entry.songTitle}
                        width={110}
                        height={110}
                        className="relative rounded-lg border border-white/10 shadow-lg"
                        style={{ objectFit: 'cover' }}
                      />
                    </div>
                  </div>

                  {/* Song Info */}
                  <div className="flex-1 min-w-0 flex flex-col justify-center">
                    <h4 className="font-title text-xl sm:text-2xl font-semibold mb-1 truncate text-text">
                      {entry.songTitle}
                    </h4>
                    <div className="text-text/70 text-sm sm:text-base mb-1">
                      {entry.artist}
                    </div>
                  </div>
                </div>
              </div>
            )}

            {!entry.albumArt && (
              <div className="p-5 pb-4">
                <h4 className="font-title text-xl sm:text-2xl font-semibold mb-1 truncate text-text">
                  {entry.songTitle}
                </h4>
                <div className="text-text/70 text-sm sm:text-base">
                  {entry.artist}
                </div>
              </div>
            )}
          </div>

          {/* People + Notes section */}
          <div className="px-5 pb-5">
            {/* People in your day - prominent */}
            {entry.people && entry.people.length > 0 && (
              <div className="mb-3">
                <div className="text-xs text-text/40 uppercase tracking-wider mb-2 flex items-center gap-1.5">
                  <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-accent/60">
                    <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" />
                    <circle cx="9" cy="7" r="4" />
                    <path d="M23 21v-2a4 4 0 0 0-3-3.87" />
                    <path d="M16 3.13a4 4 0 0 1 0 7.75" />
                  </svg>
                  Who was there
                </div>
                <div className="flex flex-wrap gap-2">
                  {entry.people.map((person) => (
                    <span
                      key={person.id}
                      className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-accent/10 border border-accent/25 rounded-full text-sm font-medium text-text"
                    >
                      <span className="w-5 h-5 rounded-full bg-accent/20 flex items-center justify-center text-xs text-accent font-bold">
                        {person.name.charAt(0).toUpperCase()}
                      </span>
                      {person.name}
                    </span>
                  ))}
                </div>
              </div>
            )}

            {/* Note preview */}
            {(entry.notesPreview || entry.notes) && (
              <p className="text-text/50 text-sm italic line-clamp-2 border-l-2 border-accent/20 pl-3">
                {entry.notesPreview || entry.notes}
              </p>
            )}

            {/* Empty state for no people and no notes */}
            {(!entry.people || entry.people.length === 0) && !entry.notesPreview && !entry.notes && (
              <div className="text-text/30 text-sm italic">
                A song, a moment in time.
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Flight Path Progress - album art thumbnails as stops */}
      <div className="mt-4 flex items-center justify-center">
        <div className="flex items-center gap-1.5">
          {entries.map((e, i) => (
            <button
              key={e.id}
              onClick={() => goToIndex(i)}
              className={`
                relative transition-all duration-300 rounded-full overflow-hidden
                ${i === activeIndex
                  ? 'w-8 h-8 ring-2 ring-accent ring-offset-1 ring-offset-bg scale-110'
                  : 'w-5 h-5 opacity-50 hover:opacity-80 hover:scale-105'
                }
              `}
              aria-label={`Go to ${e.songTitle}`}
            >
              {e.albumArt ? (
                <Image
                  src={e.albumArt}
                  alt={e.songTitle}
                  fill
                  className="object-cover"
                  sizes="32px"
                />
              ) : (
                <div className={`w-full h-full ${i === activeIndex ? 'bg-accent' : 'bg-text/20'}`} />
              )}
            </button>
          ))}
        </div>
      </div>

      {/* People summary across all recent days */}
      {allPeople.length > 0 && (
        <div className="mt-5 bg-surface/40 rounded-xl p-4 border border-accent/10">
          <div className="text-xs text-text/40 uppercase tracking-wider mb-2.5 text-center">
            Your week with
          </div>
          <div className="flex flex-wrap gap-2 justify-center">
            {allPeople.map((person) => {
              // Count how many entries this person appears in
              const count = entries.filter(e =>
                e.people?.some(p => p.id === person.id)
              ).length
              return (
                <span
                  key={person.id}
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-accent/8 rounded-full text-sm text-text/70"
                >
                  <span className="w-5 h-5 rounded-full bg-accent/15 flex items-center justify-center text-xs text-accent font-semibold">
                    {person.name.charAt(0).toUpperCase()}
                  </span>
                  {person.name}
                  {count > 1 && (
                    <span className="text-xs text-accent/60 ml-0.5">×{count}</span>
                  )}
                </span>
              )
            })}
          </div>
        </div>
      )}

      {/* Pause indicator */}
      {isPaused && entries.length > 1 && (
        <div className="absolute top-3 right-3 text-text/20 text-xs flex items-center gap-1">
          <svg width="10" height="10" viewBox="0 0 24 24" fill="currentColor">
            <rect x="6" y="4" width="4" height="16" rx="1" />
            <rect x="14" y="4" width="4" height="16" rx="1" />
          </svg>
        </div>
      )}
    </div>
  )
}

