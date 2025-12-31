'use client'

import { useState, useEffect } from 'react'
import { useSession } from 'next-auth/react'
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
  const { data: session } = useSession()
  const [entries, setEntries] = useState<FeedEntry[]>([])
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    fetchFeed()
  }, [session])

  const fetchFeed = async () => {
    if (!session) {
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
        window.location.href = '/auth/signin'
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
    <div className="max-w-3xl mx-auto px-3 sm:px-4 py-4 sm:py-6 space-y-4 sm:space-y-6">
      <h3 className="text-lg sm:text-xl font-semibold mb-3 sm:mb-4">Friends Feed</h3>

      <div className="space-y-3 sm:space-y-4">
        {entries.map((entry) => (
          <div
            key={entry.id}
            className="bg-surface rounded-xl overflow-hidden border-2 border-transparent hover:border-accent/30 transition-all"
          >
            {/* Friend Header - Prominent */}
            <Link
              href={`/user/${entry.user.username || entry.user.email}`}
              className="bg-accent/10 border-b border-accent/20 p-4 hover:bg-accent/15 transition-colors cursor-pointer"
            >
              <div className="flex items-center gap-3">
                {entry.user.image ? (
                  <Image
                    src={entry.user.image}
                    alt={entry.user.username || entry.user.name || entry.user.email}
                    width={48}
                    height={48}
                    className="rounded-full border-2 border-accent"
                    style={{ aspectRatio: '1/1', objectFit: 'cover', objectPosition: 'center' }}
                  />
                ) : (
                  <div className="w-12 h-12 rounded-full bg-accent/30 border-2 border-accent flex items-center justify-center text-lg font-bold text-accent">
                    {(entry.user.username || entry.user.name || entry.user.email).charAt(0).toUpperCase()}
                  </div>
                )}
                <div className="flex-1">
                  <div className="font-bold text-accent text-base">
                    {entry.user.username || entry.user.name || entry.user.email.split('@')[0]}
                  </div>
                  <div className="text-sm text-text/70">
                    {(() => {
                      const dateStr = typeof entry.date === 'string' ? entry.date : (entry.date as any) instanceof Date ? (entry.date as Date).toISOString() : String(entry.date)
                      const [year, month, day] = dateStr.split('T')[0].split('-')
                      const date = new Date(parseInt(year), parseInt(month) - 1, parseInt(day))
                      return date.toLocaleDateString('en-US', {
                        month: 'short',
                        day: 'numeric',
                        year: 'numeric',
                      })
                    })()}
                  </div>
                </div>
              </div>
            </Link>
            
            {/* Song Content */}
            <div className="p-4">
              <div className="flex gap-4">
                {entry.albumArt && (
                  <Link
                    href={`https://open.spotify.com/search/${encodeURIComponent(`${entry.songTitle} ${entry.artist}`)}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex-shrink-0 cursor-pointer hover:opacity-80 transition-opacity"
                  >
                    <Image
                      src={entry.albumArt}
                      alt={entry.songTitle}
                      width={100}
                      height={100}
                      className="rounded-lg"
                      style={{ aspectRatio: '1/1', objectFit: 'cover', objectPosition: 'center' }}
                    />
                  </Link>
                )}
                <div className="flex-1 min-w-0">
                  <div className="font-bold text-lg mb-1">{entry.songTitle}</div>
                  <div className="text-text/70 mb-2">by {entry.artist}</div>
                </div>
              </div>

              {entry.mentions.length > 0 && (
                <div className="mt-3 pt-3 border-t border-surface">
                  <div className="text-sm text-text/60 mb-2">Mentioned:</div>
                  <div className="flex flex-wrap gap-2">
                    {entry.mentions.map((mention) => (
                      <span key={mention.id} className="text-accent">
                        @{mention.user.username || mention.user.name || mention.user.email.split('@')[0]}
                      </span>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}

