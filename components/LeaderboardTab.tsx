'use client'

import { useState, useEffect } from 'react'
import Image from 'next/image'
import ThemeBird from './ThemeBird'
import FeatureSpotlight from './FeatureSpotlight'

interface LeaderboardData {
  topArtists: Array<{ artist: string; count: number }>
  topSongs: Array<{ songTitle: string; artist: string; albumArt: string | null; count: number }>
  stats: {
    totalUsers: number
    totalEntries: number
    timeFilter: string
  }
}

interface GlobalSOTD {
  songTitle: string
  artist: string
  albumTitle: string
  albumArt: string | null
  trackId: string
  count: number
  date: string
  firstLoggedBy: {
    username: string | null
    name: string | null
  } | null
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
  const [globalSOTD, setGlobalSOTD] = useState<GlobalSOTD | null>(null)
  const [loadingSOTD, setLoadingSOTD] = useState(true)
  const [activeTab, setActiveTab] = useState<'today' | 'leaderboard'>('today')

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

  // Fetch Global Song of the Day
  useEffect(() => {
    const fetchGlobalSOTD = async () => {
      setLoadingSOTD(true)
      try {
        const response = await fetch('/api/global-sotd')
        if (response.ok) {
          const result = await response.json()
          setGlobalSOTD(result.globalSOTD)
        }
      } catch (error) {
        console.error('Error fetching global SOTD:', error)
      } finally {
        setLoadingSOTD(false)
      }
    }

    fetchGlobalSOTD()
  }, [])

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
      <div className="h-full flex flex-col items-center justify-center py-16">
        <div className="mb-4">
          <ThemeBird size={72} state="proud" className="animate-bounce" />
        </div>
        <p className="text-text/60">Tallying the charts...</p>
        <p className="text-text/40 text-sm mt-1">🏆</p>
      </div>
    )
  }

  if (!data) {
    return (
      <div className="h-full flex flex-col items-center justify-center py-16">
        <div className="mb-4">
          <ThemeBird size={72} state="curious" />
        </div>
        <p className="text-text/60">Failed to load leaderboard</p>
        <button 
          onClick={() => window.location.reload()}
          className="mt-4 px-4 py-2 bg-accent/20 text-accent rounded-lg text-sm font-medium hover:bg-accent/30 transition-colors"
        >
          Try Again
        </button>
      </div>
    )
  }

  // Format date nicely
  const formatDate = (dateStr: string) => {
    const date = new Date(dateStr + 'T12:00:00')
    return date.toLocaleDateString('en-US', { weekday: 'long', month: 'short', day: 'numeric' })
  }

  return (
    <div className="h-full overflow-y-auto">
      {/* First-visit explainer */}
      <div className="px-4 pt-3">
        <FeatureSpotlight
          featureId="leaderboard-intro"
          title="Global Charts"
          description="See the most-logged songs and artists across all SongBird users. The Global Song of the Day is the song most people logged yesterday."
          icon="🏆"
          tips={[
            'When there\'s a tie, the song logged first wins',
            'Use time filters to see trends across different periods',
            'Toggle between artists and songs with the view switcher',
          ]}
        />
      </div>

      {/* Tab Switcher */}
      <div className="sticky top-0 bg-bg z-10 px-4 py-3 border-b border-surface">
        <div className="flex gap-2">
          <button
            onClick={() => setActiveTab('today')}
            className={`flex-1 py-2 px-4 rounded-lg font-medium text-sm transition-colors ${
              activeTab === 'today'
                ? 'bg-accent text-bg'
                : 'bg-surface text-text/70 hover:text-text'
            }`}
          >
            🌍 Today
          </button>
          <button
            onClick={() => setActiveTab('leaderboard')}
            className={`flex-1 py-2 px-4 rounded-lg font-medium text-sm transition-colors ${
              activeTab === 'leaderboard'
                ? 'bg-accent text-bg'
                : 'bg-surface text-text/70 hover:text-text'
            }`}
          >
            🏆 Leaderboard
          </button>
        </div>
      </div>

      {/* Today Tab - Global Song of the Day */}
      {activeTab === 'today' && (
        <div className="p-4">
          <div className="text-center mb-6">
            <h2 className="text-2xl font-bold text-text mb-1">Global Song of the Day</h2>
            <p className="text-text/60 text-sm">The most logged song across all SongBird users</p>
          </div>

          {loadingSOTD ? (
            <div className="flex flex-col items-center justify-center py-12">
              <ThemeBird size={72} state="curious" className="animate-pulse" />
              <p className="text-text/60 mt-4">Finding yesterday's top song...</p>
            </div>
          ) : globalSOTD ? (
            <div className="bg-surface rounded-2xl p-6 mb-6">
              <div className="text-center mb-4">
                <div className="inline-block px-3 py-1 bg-accent/20 text-accent rounded-full text-xs font-medium mb-3">
                  {formatDate(globalSOTD.date)}
                </div>
              </div>

              {/* Album Art - Large */}
              <div className="flex justify-center mb-6">
                {globalSOTD.albumArt ? (
                  <div className="relative">
                    <Image
                      src={globalSOTD.albumArt}
                      alt={globalSOTD.albumTitle}
                      width={200}
                      height={200}
                      className="rounded-xl shadow-2xl"
                    />
                    <div className="absolute -top-3 -right-3 w-12 h-12 bg-accent rounded-full flex items-center justify-center text-2xl shadow-lg">
                      👑
                    </div>
                  </div>
                ) : (
                  <div className="w-48 h-48 bg-bg rounded-xl flex items-center justify-center">
                    <span className="text-6xl">🎵</span>
                  </div>
                )}
              </div>

              {/* Song Info */}
              <div className="text-center mb-4">
                <h3 className="text-2xl font-bold text-text mb-1">{globalSOTD.songTitle}</h3>
                <p className="text-text/70 text-lg">{globalSOTD.artist}</p>
              </div>

              {/* Stats */}
              <div className="flex justify-center gap-6 text-center">
                <div>
                  <div className="text-2xl font-bold text-accent">{globalSOTD.count}</div>
                  <div className="text-xs text-text/50">
                    {globalSOTD.count === 1 ? 'person logged' : 'people logged'}
                  </div>
                </div>
              </div>

              {/* First logged by */}
              {globalSOTD.firstLoggedBy && (
                <div className="mt-4 pt-4 border-t border-text/10 text-center">
                  <p className="text-xs text-text/50">
                    First logged by{' '}
                    <span className="text-accent font-medium">
                      @{globalSOTD.firstLoggedBy.username || globalSOTD.firstLoggedBy.name || 'anonymous'}
                    </span>
                  </p>
                </div>
              )}

              {/* Spotify Link */}
              {globalSOTD.trackId && (
                <div className="mt-4 text-center">
                  <a
                    href={`https://open.spotify.com/track/${globalSOTD.trackId}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-2 px-4 py-2 bg-[#1DB954]/20 text-[#1DB954] rounded-lg text-sm font-medium hover:bg-[#1DB954]/30 transition-colors"
                  >
                    <svg className="w-4 h-4" viewBox="0 0 24 24" fill="currentColor">
                      <path d="M12 0C5.4 0 0 5.4 0 12s5.4 12 12 12 12-5.4 12-12S18.66 0 12 0zm5.521 17.34c-.24.359-.66.48-1.021.24-2.82-1.74-6.36-2.101-10.561-1.141-.418.122-.779-.179-.899-.539-.12-.421.18-.78.54-.9 4.56-1.021 8.52-.6 11.64 1.32.42.18.479.659.301 1.02zm1.44-3.3c-.301.42-.841.6-1.262.3-3.239-1.98-8.159-2.58-11.939-1.38-.479.12-1.02-.12-1.14-.6-.12-.48.12-1.021.6-1.141C9.6 9.9 15 10.561 18.72 12.84c.361.181.54.78.241 1.2zm.12-3.36C15.24 8.4 8.82 8.16 5.16 9.301c-.6.179-1.2-.181-1.38-.721-.18-.601.18-1.2.72-1.381 4.26-1.26 11.28-1.02 15.721 1.621.539.3.719 1.02.419 1.56-.299.421-1.02.599-1.559.3z"/>
                    </svg>
                    Listen on Spotify
                  </a>
                </div>
              )}
            </div>
          ) : (
            <div className="bg-surface rounded-2xl p-8 text-center">
              <ThemeBird size={80} state="curious" />
              <h3 className="text-lg font-semibold text-text mt-4 mb-2">No Global SOTD Yet</h3>
              <p className="text-text/60 text-sm">
                Check back tomorrow! We need entries from yesterday to find the top song.
              </p>
            </div>
          )}

          {/* Info Card */}
          <div className="bg-surface/50 rounded-xl p-4 text-center">
            <p className="text-text/50 text-xs">
              🌍 The Global Song of the Day is the song that was logged by the most SongBird users yesterday.
              When there's a tie, the song that was logged first wins!
            </p>
          </div>
        </div>
      )}

      {/* Leaderboard Tab */}
      {activeTab === 'leaderboard' && (
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
      )}
    </div>
  )
}
