'use client'

import { useState, useEffect } from 'react'
import { useUser } from '@clerk/nextjs'
import Image from 'next/image'
import Link from 'next/link'
import { getSpotifyTrackUrl, getSpotifyArtistUrl } from '@/lib/spotify'

interface FeedEntry {
  id: string
  date: string
  songTitle: string
  artist: string
  albumTitle: string
  albumArt: string
  user: {
    id: string
    email: string
    name: string | null
    username: string | null
    image: string | null
  }
  mentions: Array<{
    id: string
    user: {
      id: string
      email: string
      name: string | null
      username: string | null
      image: string | null
    }
  }>
  createdAt: string
}

export default function FeedTab() {
  const { isLoaded, isSignedIn } = useUser()
  const [entries, setEntries] = useState<FeedEntry[]>([])
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    fetchFeed()
  }, [isLoaded, isSignedIn])

  const fetchFeed = async () => {
    if (!isLoaded || !isSignedIn) {
      setLoading(false)
      return
    }

    setLoading(true)
    try {
      const res = await fetch('/api/feed')
      const data = await res.json()
      if (res.ok) {
        setEntries(data.entries)
      } else if (res.status === 401) {
        console.error('Unauthorized - please sign in')
        window.location.href = '/home'
      }
    } catch (error) {
      console.error('Error fetching feed:', error)
    } finally {
      setLoading(false)
    }
  }

  if (loading) {
    return <div className="text-center py-8 px-3">Loading feed...</div>
  }

  if (entries.length === 0) {
    return (
      <div className="text-center py-8 px-3 text-primary/60">
        <p className="text-base sm:text-lg mb-2">No posts yet</p>
        <p className="text-xs sm:text-sm">
          Add friends to see their songs of the day in your feed!
        </p>
      </div>
    )
  }

  return (
    <div className="max-w-2xl mx-auto px-3 sm:px-4 py-4 sm:py-6">
      <div className="flex items-center gap-3 mb-6">
        <div className="w-10 h-10 rounded-full bg-gradient-to-br from-accent to-accent/60 flex items-center justify-center">
          <span className="text-xl">🎵</span>
        </div>
        <h3 className="text-xl sm:text-2xl font-bold">Friends Feed</h3>
      </div>

      <div className="space-y-5">
        {entries.map((entry, index) => (
          <div
            key={entry.id}
            className="group relative"
            style={{ animationDelay: `${index * 50}ms` }}
          >
            {/* Connection line between posts */}
            {index < entries.length - 1 && (
              <div className="absolute left-6 top-16 bottom-0 w-0.5 bg-gradient-to-b from-accent/30 to-transparent -mb-5 z-0" />
            )}
            
            <div className="relative bg-surface/80 backdrop-blur-sm rounded-2xl overflow-hidden border border-text/10 hover:border-accent/40 transition-all duration-300 hover:shadow-lg hover:shadow-accent/5">
              {/* Header with profile */}
              <div className="p-4 pb-0">
                <Link
                  href={`/user/${entry.user.username || entry.user.email}`}
                  className="flex items-center gap-3 group/profile"
                >
                  <div className="relative">
                    {entry.user.image ? (
                      <Image
                        src={entry.user.image}
                        alt={entry.user.username || entry.user.name || entry.user.email}
                        width={44}
                        height={44}
                        className="rounded-full border-2 border-accent/50 group-hover/profile:border-accent transition-colors"
                        style={{ aspectRatio: '1/1', objectFit: 'cover', objectPosition: 'center' }}
                      />
                    ) : (
                      <div className="w-11 h-11 rounded-full bg-gradient-to-br from-accent/40 to-accent/20 border-2 border-accent/50 flex items-center justify-center text-lg font-bold text-accent group-hover/profile:border-accent transition-colors">
                        {(entry.user.username || entry.user.name || entry.user.email).charAt(0).toUpperCase()}
                      </div>
                    )}
                    {/* Online indicator dot */}
                    <div className="absolute -bottom-0.5 -right-0.5 w-3.5 h-3.5 bg-green-500 rounded-full border-2 border-surface" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="font-semibold text-text group-hover/profile:text-accent transition-colors truncate">
                      {entry.user.username || entry.user.name || entry.user.email.split('@')[0]}
                    </div>
                    <div className="text-xs text-text/50">
                      {(() => {
                        const dateStr = typeof entry.date === 'string' ? entry.date : (entry.date as any) instanceof Date ? (entry.date as Date).toISOString() : String(entry.date)
                        const [year, month, day] = dateStr.split('T')[0].split('-')
                        const date = new Date(parseInt(year), parseInt(month) - 1, parseInt(day))
                        const now = new Date()
                        const diffDays = Math.floor((now.getTime() - date.getTime()) / (1000 * 60 * 60 * 24))
                        
                        if (diffDays === 0) return "Today's vibe"
                        if (diffDays === 1) return "Yesterday"
                        if (diffDays < 7) return `${diffDays} days ago`
                        return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
                      })()}
                    </div>
                  </div>
                </Link>
              </div>
              
              {/* Song Card */}
              <div className="p-4">
                <Link
                  href={`https://open.spotify.com/search/${encodeURIComponent(`${entry.songTitle} ${entry.artist}`)}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex gap-4 p-3 rounded-xl bg-bg/50 hover:bg-bg transition-colors group/song"
                >
                  {entry.albumArt ? (
                    <div className="relative flex-shrink-0">
                      <Image
                        src={entry.albumArt}
                        alt={entry.songTitle}
                        width={80}
                        height={80}
                        className="rounded-lg shadow-md group-hover/song:shadow-lg group-hover/song:scale-105 transition-all duration-300"
                        style={{ aspectRatio: '1/1', objectFit: 'cover', objectPosition: 'center' }}
                      />
                      {/* Play button overlay */}
                      <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover/song:opacity-100 transition-opacity">
                        <div className="w-10 h-10 rounded-full bg-accent flex items-center justify-center shadow-lg">
                          <svg className="w-5 h-5 text-bg ml-0.5" fill="currentColor" viewBox="0 0 24 24">
                            <path d="M8 5v14l11-7z" />
                          </svg>
                        </div>
                      </div>
                    </div>
                  ) : (
                    <div className="w-20 h-20 rounded-lg bg-accent/20 flex items-center justify-center flex-shrink-0">
                      <span className="text-2xl">🎵</span>
                    </div>
                  )}
                  <div className="flex-1 min-w-0 flex flex-col justify-center">
                    <div className="font-bold text-text truncate group-hover/song:text-accent transition-colors">
                      {entry.songTitle}
                    </div>
                    <div className="text-sm text-text/60 truncate">{entry.artist}</div>
                    <div className="mt-2 flex items-center gap-2">
                      <span className="text-xs px-2 py-0.5 rounded-full bg-green-500/20 text-green-400 font-medium">
                        Spotify
                      </span>
                    </div>
                  </div>
                </Link>
              </div>

              {/* Mentions */}
              {entry.mentions.length > 0 && (
                <div className="px-4 pb-4 pt-0">
                  <div className="flex items-center gap-2 text-sm">
                    <span className="text-text/40">with</span>
                    <div className="flex flex-wrap gap-1.5">
                      {entry.mentions.map((mention) => (
                        <Link
                          key={mention.id}
                          href={`/user/${mention.user.username || mention.user.email}`}
                          className="px-2 py-0.5 rounded-full bg-accent/10 text-accent text-xs font-medium hover:bg-accent/20 transition-colors"
                        >
                          @{mention.user.username || mention.user.name || mention.user.email.split('@')[0]}
                        </Link>
                      ))}
                    </div>
                  </div>
                </div>
              )}

              {/* Action buttons */}
              <div className="px-4 pb-4 flex items-center gap-3">
                <button className="flex items-center gap-1.5 text-text/50 hover:text-red-400 transition-colors text-sm">
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
                  </svg>
                  <span>Vibe</span>
                </button>
                <Link
                  href={`https://open.spotify.com/search/${encodeURIComponent(`${entry.songTitle} ${entry.artist}`)}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center gap-1.5 text-text/50 hover:text-green-400 transition-colors text-sm"
                >
                  <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
                    <path d="M12 0C5.4 0 0 5.4 0 12s5.4 12 12 12 12-5.4 12-12S18.66 0 12 0zm5.521 17.34c-.24.359-.66.48-1.021.24-2.82-1.74-6.36-2.101-10.561-1.141-.418.122-.779-.179-.899-.539-.12-.421.18-.78.54-.9 4.56-1.021 8.52-.6 11.64 1.32.42.18.479.659.301 1.02zm1.44-3.3c-.301.42-.841.6-1.262.3-3.239-1.98-8.159-2.58-11.939-1.38-.479.12-1.02-.12-1.14-.6-.12-.48.12-1.021.6-1.141C9.6 9.9 15 10.561 18.72 12.84c.361.181.54.78.241 1.2zm.12-3.36C15.24 8.4 8.82 8.16 5.16 9.301c-.6.179-1.2-.181-1.38-.721-.18-.601.18-1.2.72-1.381 4.26-1.26 11.28-1.02 15.721 1.621.539.3.719 1.02.419 1.56-.299.421-1.02.599-1.559.3z"/>
                  </svg>
                  <span>Listen</span>
                </Link>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}

