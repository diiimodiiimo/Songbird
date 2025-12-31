'use client'

import { useState, useEffect } from 'react'
import Image from 'next/image'

interface LeaderboardData {
  topArtists: Array<{ artist: string; count: number }>
  topSongs: Array<{ songTitle: string; artist: string; albumArt: string | null; count: number }>
  stats: {
    totalUsers: number
    totalEntries: number
    timeFilter: string
  }
}

interface ArtistImageCache {
  [key: string]: string | null
}

export default function LeaderboardTab() {
  const [data, setData] = useState<LeaderboardData | null>(null)
  const [loading, setLoading] = useState(true)
  const [timeFilter, setTimeFilter] = useState<'all' | 'year' | 'month' | 'week'>('all')
  const [viewType, setViewType] = useState<'artists' | 'songs'>('artists')
  const [artistImages, setArtistImages] = useState<ArtistImageCache>({})

  useEffect(() => {
    const fetchData = async () => {
      setLoading(true)
      try {
        const response = await fetch(`/api/leaderboard?time=${timeFilter}`)
        if (response.ok) {
          const result = await response.json()
          setData(result)
        }
      } catch (error) {
        console.error('Error fetching leaderboard:', error)
      } finally {
        setLoading(false)
      }
    }

    fetchData()
  }, [timeFilter])

  useEffect(() => {
    // Fetch artist images for top artists
    if (data?.topArtists) {
      data.topArtists.slice(0, 3).forEach((item) => {
        if (!artistImages[item.artist]) {
          fetchArtistImage(item.artist)
        }
      })
    }
  }, [data])

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

  if (loading) {
    return (
      <div className="h-full flex items-center justify-center">
        <div className="text-text/60">Loading global leaderboard...</div>
      </div>
    )
  }

  if (!data) {
    return (
      <div className="h-full flex items-center justify-center">
        <div className="text-text/60">Failed to load leaderboard</div>
      </div>
    )
  }

  return (
    <div className="h-full overflow-y-auto">
      <div className="max-w-4xl mx-auto px-3 sm:px-4 py-4 sm:py-8 space-y-4 sm:space-y-6">
        {/* Header */}
        <div className="text-center">
          <h2 className="text-2xl sm:text-3xl md:text-4xl font-title mb-2">🏆 Global Leaderboard</h2>
          <p className="text-sm sm:text-base text-text/60 mb-4 sm:mb-6">
            Most loved artists and songs across all SongBird users
          </p>
          
          {/* Stats */}
          <div className="flex justify-center gap-4 sm:gap-8 mb-6">
            <div className="text-center">
              <div className="text-xl sm:text-2xl font-bold text-accent">{data.stats.totalUsers.toLocaleString()}</div>
              <div className="text-xs sm:text-sm text-text/60">Users</div>
            </div>
            <div className="text-center">
              <div className="text-xl sm:text-2xl font-bold text-accent">{data.stats.totalEntries.toLocaleString()}</div>
              <div className="text-xs sm:text-sm text-text/60">Total Entries</div>
            </div>
          </div>
        </div>

        {/* Time Filter */}
        <div className="flex justify-center">
          <div className="inline-flex bg-surface rounded-lg p-1 gap-1">
            {(['all', 'year', 'month', 'week'] as const).map((filter) => (
              <button
                key={filter}
                onClick={() => setTimeFilter(filter)}
                className={`px-3 sm:px-4 py-1.5 sm:py-2 rounded-md text-xs sm:text-sm font-medium transition-colors whitespace-nowrap ${
                  timeFilter === filter
                    ? 'bg-accent text-bg'
                    : 'text-text/60 hover:text-text'
                }`}
              >
                {filter === 'all' ? 'All Time' : filter === 'year' ? 'This Year' : filter === 'month' ? 'This Month' : 'This Week'}
              </button>
            ))}
          </div>
        </div>

        {/* View Type Toggle */}
        <div className="flex justify-center">
          <div className="inline-flex bg-surface rounded-lg p-1 gap-1">
            <button
              onClick={() => setViewType('artists')}
              className={`px-4 sm:px-6 py-2 rounded-md text-sm sm:text-base font-medium transition-colors ${
                viewType === 'artists'
                  ? 'bg-accent text-bg'
                  : 'text-text/60 hover:text-text'
              }`}
            >
              🎤 Artists
            </button>
            <button
              onClick={() => setViewType('songs')}
              className={`px-4 sm:px-6 py-2 rounded-md text-sm sm:text-base font-medium transition-colors ${
                viewType === 'songs'
                  ? 'bg-accent text-bg'
                  : 'text-text/60 hover:text-text'
              }`}
            >
              🎵 Songs
            </button>
          </div>
        </div>

        {/* Leaderboard Content */}
        {viewType === 'artists' ? (
          <div className="space-y-2">
            {/* Top 3 Podium - Matching AnalyticsTab style */}
            {data.topArtists.length >= 3 && (
              <div className="mb-8">
                <div className="flex items-end justify-center gap-2 sm:gap-4 mb-6">
                  {/* 2nd Place - Left */}
                  {data.topArtists[1] && (
                    <div className="flex flex-col items-center flex-1 max-w-[180px]">
                      <div className="mb-3">
                        <div className="text-4xl sm:text-5xl">🥈</div>
                      </div>
                      {artistImages[data.topArtists[1].artist] ? (
                        <Image
                          src={artistImages[data.topArtists[1].artist]!}
                          alt={data.topArtists[1].artist}
                          width={80}
                          height={80}
                          className="rounded-full mb-3 shadow-lg border-4 border-white"
                          style={{ aspectRatio: '1/1', objectFit: 'cover', objectPosition: 'center' }}
                        />
                      ) : (
                        <div className="w-20 h-20 bg-gradient-to-br from-purple-400 to-purple-600 rounded-full flex items-center justify-center text-3xl mb-3 border-4 border-white shadow-lg">
                          🎤
                        </div>
                      )}
                      <div className="text-center px-2">
                        <div className="font-bold text-sm sm:text-base mb-1 line-clamp-2">{data.topArtists[1].artist}</div>
                        <div className="text-xs text-text/60">{data.topArtists[1].count} days</div>
                      </div>
                    </div>
                  )}

                  {/* 1st Place - Center */}
                  {data.topArtists[0] && (
                    <div className="flex flex-col items-center flex-1 max-w-[220px] -mt-8">
                      <div className="mb-3">
                        <div className="text-5xl sm:text-6xl">🥇</div>
                      </div>
                      {artistImages[data.topArtists[0].artist] ? (
                        <Image
                          src={artistImages[data.topArtists[0].artist]!}
                          alt={data.topArtists[0].artist}
                          width={100}
                          height={100}
                          className="rounded-full mb-3 shadow-xl border-4 border-white"
                          style={{ aspectRatio: '1/1', objectFit: 'cover', objectPosition: 'center' }}
                        />
                      ) : (
                        <div className="w-[100px] h-[100px] bg-gradient-to-br from-yellow-400 to-yellow-600 rounded-full flex items-center justify-center text-4xl mb-3 border-4 border-white shadow-xl">
                          🎤
                        </div>
                      )}
                      <div className="text-center px-2">
                        <div className="font-bold text-base sm:text-lg mb-1 line-clamp-2">{data.topArtists[0].artist}</div>
                        <div className="text-sm text-text/60">{data.topArtists[0].count} days</div>
                      </div>
                    </div>
                  )}

                  {/* 3rd Place - Right */}
                  {data.topArtists[2] && (
                    <div className="flex flex-col items-center flex-1 max-w-[180px]">
                      <div className="mb-3">
                        <div className="text-4xl sm:text-5xl">🥉</div>
                      </div>
                      {artistImages[data.topArtists[2].artist] ? (
                        <Image
                          src={artistImages[data.topArtists[2].artist]!}
                          alt={data.topArtists[2].artist}
                          width={80}
                          height={80}
                          className="rounded-full mb-3 shadow-lg border-4 border-white"
                          style={{ aspectRatio: '1/1', objectFit: 'cover', objectPosition: 'center' }}
                        />
                      ) : (
                        <div className="w-20 h-20 bg-gradient-to-br from-orange-400 to-orange-600 rounded-full flex items-center justify-center text-3xl mb-3 border-4 border-white shadow-lg">
                          🎤
                        </div>
                      )}
                      <div className="text-center px-2">
                        <div className="font-bold text-sm sm:text-base mb-1 line-clamp-2">{data.topArtists[2].artist}</div>
                        <div className="text-xs text-text/60">{data.topArtists[2].count} days</div>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* Remaining artists (4-50) - Matching AnalyticsTab style */}
            {data.topArtists.length > 3 && (
              <div className="space-y-2">
                {data.topArtists.slice(3, 9).map((item, index) => (
                  <div
                    key={item.artist}
                    className="bg-surface rounded-lg p-3 flex items-center gap-3 hover:bg-surface/80 transition-colors"
                  >
                    <div className="text-xl font-bold text-text/40 w-8">#{index + 4}</div>
                    {artistImages[item.artist] ? (
                      <Image
                        src={artistImages[item.artist]!}
                        alt={item.artist}
                        width={44}
                        height={44}
                        className="rounded-full"
                        style={{ aspectRatio: '1/1', objectFit: 'cover', objectPosition: 'center' }}
                      />
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
        ) : (
          <div className="space-y-2">
            {/* Top 3 Songs Podium - Matching AnalyticsTab style */}
            {data.topSongs.length >= 3 && (
              <div className="mb-8">
                <div className="flex items-end justify-center gap-2 sm:gap-4 mb-6">
                  {/* 2nd Place - Left */}
                  {data.topSongs[1] && (
                    <div className="flex flex-col items-center flex-1 max-w-[180px]">
                      <div className="mb-3">
                        <div className="text-4xl sm:text-5xl">🥈</div>
                      </div>
                      {data.topSongs[1].albumArt ? (
                        <Image
                          src={data.topSongs[1].albumArt}
                          alt={data.topSongs[1].songTitle}
                          width={80}
                          height={80}
                          className="rounded-lg mb-3 shadow-lg border-4 border-white"
                          style={{ aspectRatio: '1/1', objectFit: 'cover', objectPosition: 'center' }}
                        />
                      ) : (
                        <div className="w-20 h-20 bg-gradient-to-br from-purple-400 to-purple-600 rounded-lg flex items-center justify-center text-3xl mb-3 border-4 border-white shadow-lg">
                          🎵
                        </div>
                      )}
                      <div className="text-center px-2">
                        <div className="font-bold text-sm sm:text-base mb-1 line-clamp-2">{data.topSongs[1].songTitle}</div>
                        <div className="text-xs text-text/60 mb-1 line-clamp-1">{data.topSongs[1].artist}</div>
                        <div className="text-xs text-text/60">{data.topSongs[1].count} days</div>
                      </div>
                    </div>
                  )}

                  {/* 1st Place - Center */}
                  {data.topSongs[0] && (
                    <div className="flex flex-col items-center flex-1 max-w-[220px] -mt-8">
                      <div className="mb-3">
                        <div className="text-5xl sm:text-6xl">🥇</div>
                      </div>
                      {data.topSongs[0].albumArt ? (
                        <Image
                          src={data.topSongs[0].albumArt}
                          alt={data.topSongs[0].songTitle}
                          width={100}
                          height={100}
                          className="rounded-lg mb-3 shadow-xl border-4 border-white"
                          style={{ aspectRatio: '1/1', objectFit: 'cover', objectPosition: 'center' }}
                        />
                      ) : (
                        <div className="w-[100px] h-[100px] bg-gradient-to-br from-yellow-400 to-yellow-600 rounded-lg flex items-center justify-center text-4xl mb-3 border-4 border-white shadow-xl">
                          🎵
                        </div>
                      )}
                      <div className="text-center px-2">
                        <div className="font-bold text-base sm:text-lg mb-1 line-clamp-2">{data.topSongs[0].songTitle}</div>
                        <div className="text-sm text-text/60 mb-1 line-clamp-1">{data.topSongs[0].artist}</div>
                        <div className="text-sm text-text/60">{data.topSongs[0].count} days</div>
                      </div>
                    </div>
                  )}

                  {/* 3rd Place - Right */}
                  {data.topSongs[2] && (
                    <div className="flex flex-col items-center flex-1 max-w-[180px]">
                      <div className="mb-3">
                        <div className="text-4xl sm:text-5xl">🥉</div>
                      </div>
                      {data.topSongs[2].albumArt ? (
                        <Image
                          src={data.topSongs[2].albumArt}
                          alt={data.topSongs[2].songTitle}
                          width={80}
                          height={80}
                          className="rounded-lg mb-3 shadow-lg border-4 border-white"
                          style={{ aspectRatio: '1/1', objectFit: 'cover', objectPosition: 'center' }}
                        />
                      ) : (
                        <div className="w-20 h-20 bg-gradient-to-br from-orange-400 to-orange-600 rounded-lg flex items-center justify-center text-3xl mb-3 border-4 border-white shadow-lg">
                          🎵
                        </div>
                      )}
                      <div className="text-center px-2">
                        <div className="font-bold text-sm sm:text-base mb-1 line-clamp-2">{data.topSongs[2].songTitle}</div>
                        <div className="text-xs text-text/60 mb-1 line-clamp-1">{data.topSongs[2].artist}</div>
                        <div className="text-xs text-text/60">{data.topSongs[2].count} days</div>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* Remaining songs (4-50) - Matching AnalyticsTab style */}
            {data.topSongs.length > 3 && (
              <div className="space-y-2">
                {data.topSongs.slice(3, 9).map((song, index) => (
                  <div
                    key={`${song.songTitle}-${song.artist}`}
                    className="bg-surface rounded-lg p-3 flex items-center gap-3 hover:bg-surface/80 transition-colors"
                  >
                    <div className="text-xl font-bold text-text/40 w-8">#{index + 4}</div>
                    {song.albumArt ? (
                      <Image
                        src={song.albumArt}
                        alt={song.songTitle}
                        width={44}
                        height={44}
                        className="rounded"
                        style={{ aspectRatio: '1/1', objectFit: 'cover', objectPosition: 'center' }}
                      />
                    ) : (
                      <div className="w-11 h-11 bg-accent/20 rounded flex items-center justify-center">
                        <span className="text-xl">🎵</span>
                      </div>
                    )}
                    <div className="flex-1 min-w-0">
                      <div className="font-semibold text-sm truncate">{song.songTitle}</div>
                      <div className="text-xs text-text/60 truncate">{song.artist}</div>
                      <div className="text-xs text-text/60">{song.count} days</div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  )
}
