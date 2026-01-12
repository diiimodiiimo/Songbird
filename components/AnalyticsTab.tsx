'use client'

import { useState, useEffect } from 'react'
import { useUser } from '@clerk/nextjs'
import Image from 'next/image'
import Link from 'next/link'
import { getSpotifyArtistUrl } from '@/lib/spotify'

interface AnalyticsData {
  topArtists: Array<{ artist: string; count: number }>
  topSongs: Array<{ songTitle: string; artist: string; count: number; albumArt?: string | null }>
  topPeople?: Array<{ name: string; count: number }>
}

interface ArtistImageCache {
  [key: string]: string | null
}

export default function AnalyticsTab({ onNavigateToAddEntry, onBack }: { onNavigateToAddEntry?: () => void; onBack?: () => void }) {
  const { user, isLoaded } = useUser()
  const [filterOption, setFilterOption] = useState('Last 4 Weeks')
  const [analytics, setAnalytics] = useState<AnalyticsData | null>(null)
  const [loading, setLoading] = useState(false)
  const [artistImages, setArtistImages] = useState<ArtistImageCache>({})
  const [artistSearchQuery, setArtistSearchQuery] = useState('')
  const [artistSearchResults, setArtistSearchResults] = useState<Array<{ songTitle: string; dates: string[]; count: number }>>([])
  const [artistSearchLoading, setArtistSearchLoading] = useState(false)

  useEffect(() => {
    if (isLoaded && user) {
      fetchAnalytics()
    }
  }, [filterOption, isLoaded, user])

  useEffect(() => {
    // Fetch artist images for top artists
    if (analytics?.topArtists) {
      analytics.topArtists.forEach((item) => {
        if (!artistImages[item.artist]) {
          fetchArtistImage(item.artist)
        }
      })
    }
  }, [analytics])

  const fetchArtistImage = async (artistName: string) => {
    try {
      const res = await fetch(`/api/artists/search?name=${encodeURIComponent(artistName)}`)
      const data = await res.json()
      if (res.ok && data.image) {
        setArtistImages((prev) => ({ ...prev, [artistName]: data.image }))
      }
    } catch (error) {
      console.error('Error fetching artist image:', error)
    }
  }

  const searchArtist = async () => {
    if (!artistSearchQuery.trim() || !analytics) {
      setArtistSearchResults([])
      return
    }

    setArtistSearchLoading(true)
    try {
      // Get all entries for the current filter
      const now = new Date()
      let startDate: Date
      let endDate = now

      switch (filterOption) {
        case 'Last 4 Weeks':
          startDate = new Date(now.getTime() - 4 * 7 * 24 * 60 * 60 * 1000)
          break
        case 'Last 6 Months':
          startDate = new Date(now.getFullYear(), now.getMonth() - 6, 1)
          break
        case 'Calendar Year':
          startDate = new Date(now.getFullYear(), 0, 1)
          break
        default:
          startDate = new Date(0)
      }

      const res = await fetch(
        `/api/entries?startDate=${startDate.toISOString()}&endDate=${endDate.toISOString()}`
      )
      const data = await res.json()
      
      if (res.ok) {
        const queryLower = artistSearchQuery.toLowerCase()
        const matches = data.entries.filter((entry: any) =>
          entry.artist.toLowerCase().includes(queryLower)
        )

        if (matches.length === 0) {
          setArtistSearchResults([])
        } else {
          // Group by song title
          const songGroups: Record<string, { dates: string[]; count: number }> = {}
          matches.forEach((entry: any) => {
            const dateStr = new Date(entry.date).toISOString().split('T')[0]
            if (!songGroups[entry.songTitle]) {
              songGroups[entry.songTitle] = { dates: [], count: 0 }
            }
            songGroups[entry.songTitle].dates.push(dateStr)
            songGroups[entry.songTitle].count++
          })

          const results = Object.entries(songGroups).map(([songTitle, data]) => ({
            songTitle,
            dates: data.dates.sort(),
            count: data.count,
          }))

          setArtistSearchResults(results)
        }
      }
    } catch (error) {
      console.error('Error searching artist:', error)
    } finally {
      setArtistSearchLoading(false)
    }
  }

  const fetchAnalytics = async () => {
    if (!user || !isLoaded) {
      setLoading(false)
      return
    }
    
    setLoading(true)
    try {
      const now = new Date()
      let startDate: Date
      let endDate = now

      switch (filterOption) {
        case 'Last 4 Weeks':
          startDate = new Date(now.getTime() - 4 * 7 * 24 * 60 * 60 * 1000)
          break
        case 'Last 6 Months':
          startDate = new Date(now.getFullYear(), now.getMonth() - 6, 1)
          break
        case 'Calendar Year':
          startDate = new Date(now.getFullYear(), 0, 1)
          break
        default:
          startDate = new Date(0)
      }

      const res = await fetch(
        `/api/analytics?startDate=${startDate.toISOString()}&endDate=${endDate.toISOString()}`
      )
      const data = await res.json()
      if (res.ok) {
        setAnalytics(data)
      } else if (res.status === 401) {
        console.error('Unauthorized - please sign in')
        window.location.href = '/auth/signin'
      }
    } catch (error) {
      console.error('Error fetching analytics:', error)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="max-w-6xl mx-auto px-3 sm:px-4 py-4 sm:py-8">
      <div className="mb-6 sm:mb-8 text-center">
        <h2 className="text-2xl sm:text-3xl font-title mb-2">Insights</h2>
        <p className="text-text/60 text-sm sm:text-base">Patterns in your music memory</p>
      </div>

      {/* Filter */}
      <div className="flex justify-center mb-6 sm:mb-8">
        <div className="bg-surface rounded-full p-1 inline-flex gap-1 overflow-x-auto scrollbar-hide max-w-full">
          {['Last 4 Weeks', 'Last 6 Months', 'Calendar Year', 'All Time'].map((option) => (
            <button
              key={option}
              onClick={() => setFilterOption(option)}
              className={`
                px-3 sm:px-5 py-1.5 sm:py-2 rounded-lg font-medium transition-all text-xs sm:text-sm border-2 whitespace-nowrap flex-shrink-0
                ${filterOption === option 
                  ? 'bg-transparent text-text border-text shadow-lg' 
                  : 'text-text/60 border-transparent hover:text-text hover:border-text/20'
                }
              `}
            >
              {option}
            </button>
          ))}
        </div>
      </div>

      {loading ? (
        <div className="text-center py-16 text-text/60">Gathering insights...</div>
      ) : analytics ? (
        <div className="space-y-12">
          {/* Artist Search - Clean Search UI - MOVED TO TOP */}
          <section>
            <h3 className="text-xl font-semibold mb-4 flex items-center gap-2">
              <span>🔍</span>
              Search by Artist
            </h3>
            <p className="text-text/60 text-sm mb-4">Find all the days a specific artist soundtracked your life</p>
            <div className="bg-surface rounded-xl p-6">
              <div className="flex gap-3 mb-6">
                <input
                  type="text"
                  value={artistSearchQuery}
                  onChange={(e) => setArtistSearchQuery(e.target.value)}
                  onKeyPress={(e) => e.key === 'Enter' && searchArtist()}
                  placeholder="Enter artist name..."
                  className="flex-1 bg-bg rounded-lg px-4 py-3 text-text placeholder:text-text/40 border border-transparent focus:border-accent outline-none transition-colors"
                />
                <button
                  onClick={searchArtist}
                  disabled={artistSearchLoading}
                  className="bg-accent text-bg px-6 py-3 rounded-lg font-medium disabled:opacity-50 hover:bg-accent/90 transition-colors"
                >
                  {artistSearchLoading ? 'Searching...' : 'Search'}
                </button>
              </div>

              {artistSearchResults.length > 0 && (
                <div>
                  <div className="bg-accent/10 border border-accent/30 rounded-lg p-4 mb-6">
                    <div className="text-lg font-semibold">
                      <span className="text-accent">{artistSearchQuery}</span> appeared{' '}
                      <span className="text-accent">
                        {artistSearchResults.reduce((sum, r) => sum + r.count, 0)} times
                      </span>{' '}
                      as Song of the Day
                    </div>
                  </div>

                  <div className="space-y-3">
                    {artistSearchResults.map((result) => (
                      <div
                        key={result.songTitle}
                        className="bg-bg rounded-lg p-4 border border-surface"
                      >
                        <div className="flex justify-between items-start mb-2">
                          <div className="font-semibold">{result.songTitle}</div>
                          <span className="bg-accent/20 text-accent px-3 py-1 rounded-full text-sm font-medium">
                            {result.count}×
                          </span>
                        </div>
                        <div className="text-sm text-text/60">
                          {result.dates.map((date) => (
                            <span key={date} className="mr-2">
                              {new Date(date).toLocaleDateString('en-US', { 
                                month: 'short', 
                                day: 'numeric',
                                year: 'numeric'
                              })}
                            </span>
                          ))}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {artistSearchLoading && (
                <div className="text-center py-8 text-text/60">
                  <div className="text-4xl mb-3 animate-pulse">🔍</div>
                  Searching for songs...
                </div>
              )}
              {artistSearchQuery && artistSearchResults.length === 0 && !artistSearchLoading && (
                <div className="text-center py-8 text-text/60">
                  <div className="text-4xl mb-3">🔍</div>
                  No songs found for that artist
                </div>
              )}
            </div>
          </section>

          {/* Top Artists - Tree/Podium Visualization */}
          <section>
            <h3 className="text-xl font-semibold mb-6 flex items-center gap-2">
              <span>🎤</span>
              Top Artists
            </h3>
            
            {/* Podium Style Layout - Mobile Optimized */}
            <div className="mb-8">
              <div className="flex items-end justify-center gap-2 sm:gap-4 mb-6">
                {/* 2nd Place - Left */}
                {analytics.topArtists[1] && (
                  <div className="flex flex-col items-center flex-1 max-w-[180px]">
                    <div className="mb-3">
                      <div className="text-4xl sm:text-5xl">🥈</div>
                    </div>
                    {artistImages[analytics.topArtists[1].artist] ? (
                      <Link
                        href={getSpotifyArtistUrl(analytics.topArtists[1].artist)}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="cursor-pointer hover:opacity-80 transition-opacity"
                      >
                        <Image
                          src={artistImages[analytics.topArtists[1].artist]!}
                          alt={analytics.topArtists[1].artist}
                          width={80}
                          height={80}
                          className="rounded-full mb-3 shadow-lg border-4 border-white"
                          style={{ aspectRatio: '1/1', objectFit: 'cover', objectPosition: 'center' }}
                        />
                      </Link>
                    ) : (
                      <div className="w-20 h-20 bg-gradient-to-br from-purple-400 to-purple-600 rounded-full flex items-center justify-center text-3xl mb-3 border-4 border-white shadow-lg">
                        🎤
                      </div>
                    )}
                    <div className="text-center px-2">
                      <div className="font-bold text-sm sm:text-base mb-1 line-clamp-2">{analytics.topArtists[1].artist}</div>
                      <div className="text-xs text-text/60">{analytics.topArtists[1].count} days</div>
                    </div>
                  </div>
                )}

                {/* 1st Place - Center */}
                {analytics.topArtists[0] && (
                  <div className="flex flex-col items-center flex-1 max-w-[220px] -mt-8">
                    <div className="mb-3">
                      <div className="text-5xl sm:text-6xl">🥇</div>
                    </div>
                    {artistImages[analytics.topArtists[0].artist] ? (
                      <Link
                        href={getSpotifyArtistUrl(analytics.topArtists[0].artist)}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="cursor-pointer hover:opacity-80 transition-opacity"
                      >
                        <Image
                          src={artistImages[analytics.topArtists[0].artist]!}
                          alt={analytics.topArtists[0].artist}
                          width={100}
                          height={100}
                          className="rounded-full mb-3 shadow-xl border-4 border-white"
                          style={{ aspectRatio: '1/1', objectFit: 'cover', objectPosition: 'center' }}
                        />
                      </Link>
                    ) : (
                      <div className="w-[100px] h-[100px] bg-gradient-to-br from-yellow-400 to-yellow-600 rounded-full flex items-center justify-center text-4xl mb-3 border-4 border-white shadow-xl">
                        🎤
                      </div>
                    )}
                    <div className="text-center px-2">
                      <div className="font-bold text-base sm:text-lg mb-1 line-clamp-2">{analytics.topArtists[0].artist}</div>
                      <div className="text-sm text-text/60">{analytics.topArtists[0].count} days</div>
                    </div>
                  </div>
                )}

                {/* 3rd Place - Right */}
                {analytics.topArtists[2] && (
                  <div className="flex flex-col items-center flex-1 max-w-[180px]">
                    <div className="mb-3">
                      <div className="text-4xl sm:text-5xl">🥉</div>
                    </div>
                    {artistImages[analytics.topArtists[2].artist] ? (
                      <Link
                        href={getSpotifyArtistUrl(analytics.topArtists[2].artist)}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="cursor-pointer hover:opacity-80 transition-opacity"
                      >
                        <Image
                          src={artistImages[analytics.topArtists[2].artist]!}
                          alt={analytics.topArtists[2].artist}
                          width={80}
                          height={80}
                          className="rounded-full mb-3 shadow-lg border-4 border-white"
                          style={{ aspectRatio: '1/1', objectFit: 'cover', objectPosition: 'center' }}
                        />
                      </Link>
                    ) : (
                      <div className="w-20 h-20 bg-gradient-to-br from-orange-400 to-orange-600 rounded-full flex items-center justify-center text-3xl mb-3 border-4 border-white shadow-lg">
                        🎤
                      </div>
                    )}
                    <div className="text-center px-2">
                      <div className="font-bold text-sm sm:text-base mb-1 line-clamp-2">{analytics.topArtists[2].artist}</div>
                      <div className="text-xs text-text/60">{analytics.topArtists[2].count} days</div>
                    </div>
                  </div>
                )}
              </div>

              {/* Remaining artists as list */}
              {analytics.topArtists.length > 3 && (
                <div className="space-y-2">
                  {analytics.topArtists.slice(3, 9).map((item, index) => (
                    <div
                      key={item.artist}
                      className="bg-surface rounded-lg p-3 flex items-center gap-3 hover:bg-surface/80 transition-colors"
                    >
                      <div className="text-xl font-bold text-text/40 w-8">#{index + 4}</div>
                      {artistImages[item.artist] ? (
                        <Link
                          href={getSpotifyArtistUrl(item.artist)}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="cursor-pointer hover:opacity-80 transition-opacity"
                        >
                          <Image
                            src={artistImages[item.artist]!}
                            alt={item.artist}
                            width={44}
                            height={44}
                            className="rounded-full"
                            style={{ aspectRatio: '1/1', objectFit: 'cover', objectPosition: 'center' }}
                          />
                        </Link>
                      ) : (
                        <div className="w-11 h-11 bg-accent/20 rounded-full flex items-center justify-center">
                          <span className="text-xl">🎤</span>
                        </div>
                      )}
                      <div className="flex-1 min-w-0">
                        <div className="font-semibold text-sm truncate">{item.artist}</div>
                        <div className="text-xs text-text/60">{item.count} days</div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {analytics.topArtists.length > 9 && (
              <button
                className="w-full py-3 text-center text-accent hover:bg-surface/50 rounded-lg transition-colors"
                onClick={() => {
                  alert('View all artists feature coming soon!')
                }}
              >
                View all {analytics.topArtists.length} artists →
              </button>
            )}
          </section>

          {/* Songs Podium - Olympic style like Top Artists */}
          <section>
            <h3 className="text-xl sm:text-2xl font-semibold mb-4 sm:mb-6 flex items-center gap-2">
              <span>🎵</span>
              Top Songs
            </h3>
            
            {analytics.topSongs.length >= 3 ? (
              <>
                {/* Podium for top 3 songs - Same Style as Artists */}
                <div className="flex items-end justify-center gap-2 sm:gap-4 mb-6">
                  {/* 2nd Place - Left */}
                  {analytics.topSongs[1] && (
                    <div className="flex flex-col items-center flex-1 max-w-[180px]">
                      <div className="mb-3">
                        <div className="text-4xl sm:text-5xl">🥈</div>
                      </div>
                      {analytics.topSongs[1].albumArt ? (
                        <Link
                          href={`https://open.spotify.com/search/${encodeURIComponent(`${analytics.topSongs[1].songTitle} ${analytics.topSongs[1].artist}`)}`}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="cursor-pointer hover:opacity-80 transition-opacity"
                        >
                          <img
                            src={analytics.topSongs[1].albumArt}
                            alt={analytics.topSongs[1].songTitle}
                            className="w-20 h-20 rounded-lg mb-3 object-cover shadow-lg border-4 border-white"
                          />
                        </Link>
                      ) : (
                        <div className="w-20 h-20 rounded-lg bg-gradient-to-br from-purple-400 to-purple-600 flex items-center justify-center text-3xl mb-3 border-4 border-white shadow-lg">
                          🎵
                        </div>
                      )}
                      <div className="text-center px-2">
                        <div className="font-bold text-sm sm:text-base mb-0.5 line-clamp-2">{analytics.topSongs[1].songTitle}</div>
                        <div className="text-xs text-text/60 mb-1 line-clamp-1">{analytics.topSongs[1].artist}</div>
                        <div className="text-xs text-text/50">{analytics.topSongs[1].count} days</div>
                      </div>
                    </div>
                  )}

                  {/* 1st Place - Center */}
                  {analytics.topSongs[0] && (
                    <div className="flex flex-col items-center flex-1 max-w-[220px] -mt-8">
                      <div className="mb-3">
                        <div className="text-5xl sm:text-6xl">🥇</div>
                      </div>
                      {analytics.topSongs[0].albumArt ? (
                        <Link
                          href={`https://open.spotify.com/search/${encodeURIComponent(`${analytics.topSongs[0].songTitle} ${analytics.topSongs[0].artist}`)}`}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="cursor-pointer hover:opacity-80 transition-opacity"
                        >
                          <img
                            src={analytics.topSongs[0].albumArt}
                            alt={analytics.topSongs[0].songTitle}
                            className="w-[100px] h-[100px] rounded-lg mb-3 object-cover shadow-xl border-4 border-white"
                          />
                        </Link>
                      ) : (
                        <div className="w-[100px] h-[100px] rounded-lg bg-gradient-to-br from-yellow-400 to-yellow-600 flex items-center justify-center text-4xl mb-3 border-4 border-white shadow-xl">
                          🎵
                        </div>
                      )}
                      <div className="text-center px-2">
                        <div className="font-bold text-base sm:text-lg mb-0.5 line-clamp-2">{analytics.topSongs[0].songTitle}</div>
                        <div className="text-xs sm:text-sm text-text/60 mb-1 line-clamp-1">{analytics.topSongs[0].artist}</div>
                        <div className="text-sm text-text/50">{analytics.topSongs[0].count} days</div>
                      </div>
                    </div>
                  )}

                  {/* 3rd Place - Right */}
                  {analytics.topSongs[2] && (
                    <div className="flex flex-col items-center flex-1 max-w-[180px]">
                      <div className="mb-3">
                        <div className="text-4xl sm:text-5xl">🥉</div>
                      </div>
                      {analytics.topSongs[2].albumArt ? (
                        <Link
                          href={`https://open.spotify.com/search/${encodeURIComponent(`${analytics.topSongs[2].songTitle} ${analytics.topSongs[2].artist}`)}`}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="cursor-pointer hover:opacity-80 transition-opacity"
                        >
                          <img
                            src={analytics.topSongs[2].albumArt}
                            alt={analytics.topSongs[2].songTitle}
                            className="w-20 h-20 rounded-lg mb-3 object-cover shadow-lg border-4 border-white"
                          />
                        </Link>
                      ) : (
                        <div className="w-20 h-20 rounded-lg bg-gradient-to-br from-orange-400 to-orange-600 flex items-center justify-center text-3xl mb-3 border-4 border-white shadow-lg">
                          🎵
                        </div>
                      )}
                      <div className="text-center px-2">
                        <div className="font-bold text-sm sm:text-base mb-0.5 line-clamp-2">{analytics.topSongs[2].songTitle}</div>
                        <div className="text-xs text-text/60 mb-1 line-clamp-1">{analytics.topSongs[2].artist}</div>
                        <div className="text-xs text-text/50">{analytics.topSongs[2].count} days</div>
                      </div>
                    </div>
                  )}
                </div>

                {/* Remaining songs (4-9) - List format like artists */}
                {analytics.topSongs.length > 3 && (
                  <div className="space-y-2 mb-4">
                    {analytics.topSongs.slice(3, 9).map((song, index) => (
                      <div
                        key={`${song.songTitle}-${song.artist}`}
                        className="bg-surface rounded-lg p-3 flex items-center gap-3 hover:bg-surface/80 transition-colors"
                      >
                        {/* Rank */}
                        <div className="text-xl font-bold text-text/40 w-8">#{index + 4}</div>

                        {/* Album Art */}
                        {song.albumArt ? (
                          <Link
                            href={`https://open.spotify.com/search/${encodeURIComponent(`${song.songTitle} ${song.artist}`)}`}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="cursor-pointer hover:opacity-80 transition-opacity flex-shrink-0"
                          >
                            <img
                              src={song.albumArt}
                              alt={song.songTitle}
                              className="w-11 h-11 rounded object-cover"
                            />
                          </Link>
                        ) : (
                          <div className="w-11 h-11 rounded bg-accent/20 flex items-center justify-center text-xl flex-shrink-0">
                            🎵
                          </div>
                        )}

                        {/* Song Info */}
                        <div className="flex-1 min-w-0">
                          <div className="font-semibold text-sm truncate">{song.songTitle}</div>
                          <div className="text-xs text-text/60 truncate">{song.artist}</div>
                        </div>

                        {/* Count */}
                        <div className="text-xs text-text/50">{song.count} days</div>
                      </div>
                    ))}
                  </div>
                )}

                {/* View all button if more than 9 */}
                {analytics.topSongs.length > 9 && (
                  <button className="w-full py-3 text-center text-accent hover:bg-surface/50 rounded-lg transition-colors">
                    View all {analytics.topSongs.length} songs →
                  </button>
                )}
              </>
            ) : (
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 sm:gap-4">
                {analytics.topSongs.map((song, index) => (
                  <div
                    key={`${song.songTitle}-${song.artist}`}
                    className="bg-surface rounded-xl p-4 flex flex-col items-center text-center hover:bg-surface/80 transition-colors"
                  >
                    {song.albumArt ? (
                      <Link
                        href={`https://open.spotify.com/search/${encodeURIComponent(`${song.songTitle} ${song.artist}`)}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="cursor-pointer hover:opacity-80 transition-opacity"
                      >
                        <img
                          src={song.albumArt}
                          alt={song.songTitle}
                          className="w-20 h-20 sm:w-24 sm:h-24 rounded-lg object-cover mb-3"
                        />
                      </Link>
                    ) : (
                      <div className="w-20 h-20 sm:w-24 sm:h-24 rounded-lg bg-accent/20 flex items-center justify-center text-3xl sm:text-4xl mb-3">
                        🎵
                      </div>
                    )}
                    <div className="font-semibold text-sm mb-1 line-clamp-2">{song.songTitle}</div>
                    <div className="text-xs text-text/60 mb-2 line-clamp-1">{song.artist}</div>
                    <div className="bg-accent/20 text-accent px-3 py-1 rounded-full text-xs font-medium">
                      {song.count} {song.count === 1 ? 'day' : 'days'}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </section>

          {/* People - Avatar Cards */}
          {analytics.topPeople && analytics.topPeople.length > 0 && (
            <section>
              <h3 className="text-xl font-semibold mb-6 flex items-center gap-2">
                <span>👥</span>
                People in Your Days
              </h3>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                {analytics.topPeople.slice(0, 8).map((person, index) => (
                  <div
                    key={person.name}
                    className="bg-surface rounded-xl p-6 text-center hover:bg-surface/80 transition-colors"
                  >
                    {/* Avatar */}
                    <div className="w-16 h-16 rounded-full bg-accent/20 flex items-center justify-center text-accent font-bold text-2xl mx-auto mb-3">
                      {person.name[0].toUpperCase()}
                    </div>

                    {/* Name */}
                    <div className="font-semibold mb-2 truncate">
                      {person.name}
                    </div>

                    {/* Count */}
                    <div className="text-sm text-text/60">
                      {person.count} {person.count === 1 ? 'day' : 'days'}
                    </div>
                  </div>
                ))}
              </div>
            </section>
          )}
        </div>
      ) : (
        <div className="text-center py-16">
          <div className="text-6xl mb-4">📊</div>
          <p className="text-text/60">No data available yet</p>
        </div>
      )}
    </div>
  )
}


