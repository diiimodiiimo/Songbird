'use client'

import { useState, useEffect } from 'react'
import { useUser } from '@clerk/nextjs'
import Image from 'next/image'
import ThemeBird from './ThemeBird'
import SpotifyAttribution from './SpotifyAttribution'
import { UpgradePrompt } from './UpgradePrompt'

interface WrappedData {
  year: number
  totalEntries: number
  longestStreak: number
  topArtists: Array<{ artist: string; count: number }>
  topArtistsBySeason: Record<string, Array<{ artist: string; count: number }>>
  topSongs: Array<{ songTitle: string; artist: string; count: number; albumArt: string | null }>
  returningArtists: Array<{ artist: string; monthCount: number; totalCount: number }>
  topPeople: Array<{ name: string; count: number }>
  mostMentionedPerson: { name: string; count: number } | null
  seasonalData?: Record<'winter' | 'spring' | 'summer' | 'fall', { artists: string[]; songs: Array<{ songTitle: string; artist: string }> }>
  keywordAnalysis?: {
    topArtistsWithKeywords: Array<{ artist: string; keywords: Array<{ word: string; count: number }> }>
    topPeopleWithKeywords: Array<{ person: string; keywords: Array<{ word: string; count: number }> }>
  }
  noteSongMatching?: {
    totalMatches: number
    positiveRate: number
    negativeRate: number
    neutralRate: number
    totalPositive: number
    totalNegative: number
    totalNeutral: number
    mostPositiveSong: { songTitle: string; artist: string; noteSentiment: string; notePositiveWords: string[] } | null
    mostNegativeSong: { songTitle: string; artist: string; noteSentiment: string; noteNegativeWords: string[] } | null
    happiestSongs: Array<{ songTitle: string; artist: string; positiveScore: number; netScore: number; albumArt: string | null }>
    saddestSongs: Array<{ songTitle: string; artist: string; negativeScore: number; netScore: number; albumArt: string | null }>
    // Lyrics vs Notes comparison
    totalWithLyrics: number
    totalAligned: number
    totalDiverged: number
    alignmentRate: number
    mostAlignedSong: { songTitle: string; artist: string; noteSentiment: string; lyricsSentiment: string; notes: string; albumArt: string } | null
    mostDivergedSong: { songTitle: string; artist: string; noteSentiment: string; lyricsSentiment: string; notes: string; albumArt: string } | null
  }
  peopleSentimentAnalysis?: Array<{
    name: string
    totalEntries: number
    positiveEntries: number
    negativeEntries: number
    neutralEntries: number
    topPositiveWords: string[]
    topNegativeWords: string[]
  }>
}

export default function WrappedTab() {
  const { user, isLoaded } = useUser()
  const [currentYear, setCurrentYear] = useState(new Date().getFullYear())
  const [wrappedData, setWrappedData] = useState<WrappedData | null>(null)
  const [loading, setLoading] = useState(false)
  const [currentCard, setCurrentCard] = useState(0)
  const [slideDirection, setSlideDirection] = useState<'left' | 'right' | 'none'>('none')
  const [touchStart, setTouchStart] = useState<number | null>(null)
  const [touchEnd, setTouchEnd] = useState<number | null>(null)
  const [artistImages, setArtistImages] = useState<Record<string, string | null>>({})
  const [seasonalTimelineIndex, setSeasonalTimelineIndex] = useState(0)
  const [upgradeRequired, setUpgradeRequired] = useState(false)
  const [interactiveGame, setInteractiveGame] = useState<{
    type: 'streak' | null
    question: string
    options: Array<{ label: string; value: number }>
    correct: number
    selected: number | null
    revealed: boolean
  }>({
    type: null,
    question: '',
    options: [],
    correct: 0,
    selected: null,
    revealed: false,
  })

  useEffect(() => {
    if (isLoaded && user) {
      fetchWrappedData()
    }
  }, [currentYear, isLoaded, user])

  useEffect(() => {
    // Fetch artist images for top artists
    if (wrappedData?.topArtists) {
      wrappedData.topArtists.forEach((item) => {
        if (!artistImages[item.artist]) {
          fetchArtistImage(item.artist)
        }
      })
    }
  }, [wrappedData])

  const fetchWrappedData = async () => {
    if (!user || !isLoaded) return

    setLoading(true)
    try {
      const res = await fetch(`/api/wrapped?year=${currentYear}`)
      const data = await res.json()
      if (res.ok) {
        setWrappedData(data)
        setUpgradeRequired(false)
        setCurrentCard(0)
        setSeasonalTimelineIndex(0)
        setInteractiveGame({ type: null, question: '', options: [], correct: 0, selected: null, revealed: false })
      } else if (res.status === 403 && data.upgradeRequired) {
        setUpgradeRequired(true)
        setWrappedData(null)
      } else if (res.status === 404) {
        setUpgradeRequired(false)
        setWrappedData(null)
        // If availableYears is provided, suggest switching to a year with data
        if (data.availableYears && data.availableYears.length > 0) {
          console.log('Available years with entries:', data.availableYears)
        }
      }
    } catch (error) {
      console.error('Error fetching wrapped data:', error)
    } finally {
      setLoading(false)
    }
  }

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

  // Swipe handlers for mobile
  const minSwipeDistance = 50

  const onTouchStart = (e: React.TouchEvent) => {
    setTouchEnd(null)
    setTouchStart(e.targetTouches[0].clientX)
  }

  const onTouchMove = (e: React.TouchEvent) => {
    setTouchEnd(e.targetTouches[0].clientX)
  }

  const onTouchEnd = () => {
    if (!touchStart || !touchEnd) return
    const distance = touchStart - touchEnd
    const isLeftSwipe = distance > minSwipeDistance
    const isRightSwipe = distance < -minSwipeDistance

    if (isLeftSwipe && currentCard < getTotalCards() - 1) {
      nextCard()
    }
    if (isRightSwipe && currentCard > 0) {
      prevCard()
    }
  }

  // Build list of available card types in order
  const getAvailableCards = (): string[] => {
    if (!wrappedData) return []
    const cards: string[] = ['opening']
    cards.push('totalEntries')
    
    // Interactive game
    if (wrappedData.longestStreak > 0) cards.push('interactiveStreak')
    
    if (wrappedData.topArtists.length > 0) cards.push('topArtists')
    if (wrappedData.topSongs.length > 0) cards.push('topSongs')
    
    // Seasonal timeline (animated progression)
    if (wrappedData.seasonalData && Object.keys(wrappedData.seasonalData).length > 0) {
      cards.push('seasonalTimeline')
    }
    
    if (wrappedData.returningArtists.length > 0) cards.push('returningArtists')
    
    // Note-song sentiment matching cards (replacing keyword analysis)
    if (wrappedData.noteSongMatching && wrappedData.noteSongMatching.totalMatches > 0) {
      cards.push('sentimentBreakdown') // Detailed breakdown card
      if (wrappedData.noteSongMatching.totalWithLyrics > 0) {
        cards.push('lyricsVsNotes') // Lyrics sentiment comparison
      }
      if (wrappedData.noteSongMatching.happiestSongs.length > 0) {
        cards.push('happiestSongs') // Top 10 happiest songs
      }
      if (wrappedData.noteSongMatching.saddestSongs.length > 0) {
        cards.push('saddestSongs') // Top 10 saddest songs
      }
      cards.push('noteSongMatching') // Examples of emotional moments
    }
    
    // Enhanced people sentiment analysis
    if (wrappedData.peopleSentimentAnalysis && wrappedData.peopleSentimentAnalysis.length > 0) {
      cards.push('peopleSentiment')
    }
    
    if (wrappedData.mostMentionedPerson) cards.push('mostMentionedPerson')
    cards.push('closing')
    return cards
  }

  const getTotalCards = () => {
    return getAvailableCards().length
  }

  const nextCard = () => {
    if (currentCard < getTotalCards() - 1) {
      setSlideDirection('left')
      setTimeout(() => {
        setCurrentCard(currentCard + 1)
        setSlideDirection('none')
        const availableCards = getAvailableCards()
        const nextCardType = availableCards[currentCard + 1]
        if (nextCardType?.startsWith('interactive')) {
          setupInteractiveGame(nextCardType)
        } else if (nextCardType === 'seasonalTimeline') {
          setSeasonalTimelineIndex(0)
        } else {
          setInteractiveGame({ type: null, question: '', options: [], correct: 0, selected: null, revealed: false })
        }
      }, 150)
    }
  }

  const prevCard = () => {
    if (currentCard > 0) {
      setSlideDirection('right')
      setTimeout(() => {
        setCurrentCard(currentCard - 1)
        setSlideDirection('none')
        setInteractiveGame({ type: null, question: '', options: [], correct: 0, selected: null, revealed: false })
        setSeasonalTimelineIndex(0)
      }, 150)
    }
  }

  const setupInteractiveGame = (cardType: string) => {
    if (!wrappedData) return

    if (cardType === 'interactiveStreak' && wrappedData.longestStreak > 0) {
      const correct = wrappedData.longestStreak
      const options = [
        { label: `${correct} days`, value: correct },
        { label: `${Math.max(1, correct - 3)} days`, value: Math.max(1, correct - 3) },
        { label: `${correct + 5} days`, value: correct + 5 },
        { label: `${correct + 10} days`, value: correct + 10 },
      ].sort(() => Math.random() - 0.5)
      
      setInteractiveGame({
        type: 'streak',
        question: 'What was your longest streak?',
        options,
        correct,
        selected: null,
        revealed: false,
      })
    }
  }

  const handleInteractiveGuess = (value: number) => {
    if (interactiveGame.revealed) return
    setInteractiveGame({ ...interactiveGame, selected: value })
    setTimeout(() => {
      setInteractiveGame({ ...interactiveGame, selected: value, revealed: true })
    }, 500)
  }

  // Seasonal timeline progression
  useEffect(() => {
    if (currentCard >= 0) {
      const availableCards = getAvailableCards()
      const cardType = availableCards[currentCard]
      if (cardType === 'seasonalTimeline' && wrappedData?.seasonalData) {
        const seasons: Array<'winter' | 'spring' | 'summer' | 'fall'> = ['winter', 'spring', 'summer', 'fall']
        if (seasonalTimelineIndex < seasons.length) {
          const timer = setTimeout(() => {
            if (seasonalTimelineIndex < seasons.length - 1) {
              setSeasonalTimelineIndex(seasonalTimelineIndex + 1)
            }
          }, 5000) // 5 seconds per season (slower)
          return () => clearTimeout(timer)
        }
      }
    }
  }, [seasonalTimelineIndex, currentCard, wrappedData])

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-center">
          <div className="mb-4 animate-bounce flex justify-center">
            <ThemeBird size={64} state="bounce" />
          </div>
          <div className="text-primary/60">Loading your SongBird Wrapped...</div>
        </div>
      </div>
    )
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-center">
          <div className="mb-4 flex justify-center animate-pulse">
            <ThemeBird size={64} />
          </div>
          <div className="text-primary/60 mb-4">Loading your wrapped...</div>
          <div className="text-sm text-primary/40 mb-4">
            Gathering your music memories from {currentYear}
          </div>
        </div>
      </div>
    )
  }

  if (!wrappedData) {
    if (upgradeRequired) {
      return (
        <div className="max-w-2xl mx-auto px-3 sm:px-4 py-4 sm:py-8">
          {/* Blurred Wrapped preview */}
          <div className="relative mb-8 rounded-2xl overflow-hidden">
            <div className="blur-sm pointer-events-none select-none">
              <div className="bg-gradient-to-br from-accent/30 to-primary/30 rounded-2xl p-8 text-center">
                <h2 className="text-3xl font-bold text-text mb-2">SongBird Wrapped {currentYear}</h2>
                <p className="text-text/60 mb-6">Your year in music</p>
                <div className="grid grid-cols-2 gap-4 mb-6">
                  <div className="bg-surface/50 rounded-xl p-4">
                    <div className="text-3xl font-bold text-accent">247</div>
                    <div className="text-xs text-text/60">Songs Logged</div>
                  </div>
                  <div className="bg-surface/50 rounded-xl p-4">
                    <div className="text-3xl font-bold text-accent">42</div>
                    <div className="text-xs text-text/60">Day Streak</div>
                  </div>
                </div>
                <div className="space-y-2">
                  <div className="flex items-center gap-3 bg-surface/30 rounded-lg p-3">
                    <span className="text-lg">🥇</span>
                    <div className="text-left">
                      <div className="font-semibold text-sm">Top Artist</div>
                      <div className="text-xs text-text/60">Your most-logged artist</div>
                    </div>
                  </div>
                  <div className="flex items-center gap-3 bg-surface/30 rounded-lg p-3">
                    <span className="text-lg">🎵</span>
                    <div className="text-left">
                      <div className="font-semibold text-sm">Top Song</div>
                      <div className="text-xs text-text/60">The song that defined your year</div>
                    </div>
                  </div>
                  <div className="flex items-center gap-3 bg-surface/30 rounded-lg p-3">
                    <span className="text-lg">🌊</span>
                    <div className="text-left">
                      <div className="font-semibold text-sm">Seasonal Journey</div>
                      <div className="text-xs text-text/60">How your taste evolved through the seasons</div>
                    </div>
                  </div>
                  <div className="flex items-center gap-3 bg-surface/30 rounded-lg p-3">
                    <span className="text-lg">💭</span>
                    <div className="text-left">
                      <div className="font-semibold text-sm">Sentiment Analysis</div>
                      <div className="text-xs text-text/60">The emotional tone of your notes</div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
            <div className="absolute inset-0 flex items-center justify-center">
              <div className="bg-bg/90 backdrop-blur-sm rounded-xl p-6 text-center max-w-sm mx-4 border border-accent/30">
                <div className="text-3xl mb-3">🎁</div>
                <h3 className="text-xl font-bold text-text mb-2">Your Wrapped Awaits</h3>
                <p className="text-text/60 text-sm mb-4">
                  See your top artists, seasonal trends, sentiment analysis, and more — all based on the songs you chose each day.
                </p>
              </div>
            </div>
          </div>

          <UpgradePrompt
            title="Unlock Wrapped"
            message="Upgrade to premium to see your personalized year-end music summary with interactive cards, sentiment analysis, and shareable stats."
          />
        </div>
      )
    }
    
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-center">
          <div className="mb-4 flex justify-center">
            <ThemeBird size={64} />
          </div>
          <div className="text-primary/60 mb-4">No entries found for {currentYear}</div>
          <div className="text-sm text-primary/40 mb-4">
            Try selecting a different year from the dropdown above
          </div>
          <select
            value={currentYear}
            onChange={(e) => setCurrentYear(parseInt(e.target.value))}
            className="px-4 py-2 bg-card border border-primary rounded text-primary"
          >
            {Array.from({ length: 10 }, (_, i) => new Date().getFullYear() - i).map((year) => (
              <option key={year} value={year}>
                {year}
              </option>
            ))}
          </select>
        </div>
      </div>
    )
  }

  const renderCard = () => {
    if (!wrappedData) return null
    const availableCards = getAvailableCards()
    const cardType = availableCards[currentCard] || 'opening'
    
    const slideClass = slideDirection === 'left' ? 'animate-slide-out-left' : 
                      slideDirection === 'right' ? 'animate-slide-out-right' : 
                      currentCard > 0 ? 'animate-slide-in' : ''
    
    switch (cardType) {
      case 'opening':
        return (
          <div className={`text-center ${slideClass}`}>
            <div className="mb-6 animate-bounce flex justify-center">
              <ThemeBird size={96} state="bounce" />
            </div>
            <h2 className="text-4xl font-bold mb-4">SongBird Wrapped</h2>
            <h3 className="text-2xl text-primary/80 mb-8">{wrappedData.year}</h3>
            <div className="text-lg text-primary/60">
              Your year in music, wrapped
            </div>
          </div>
        )

      case 'totalEntries':
        return (
          <div className={`text-center ${slideClass}`}>
            <div className="text-5xl mb-6 animate-pulse">📝</div>
            <h2 className="text-3xl font-bold mb-4">Total Entries</h2>
            <div className="text-6xl font-bold mb-4 text-primary animate-count-up">
              {wrappedData.totalEntries}
            </div>
            <div className="text-lg text-primary/60">
              songs captured this year
            </div>
          </div>
        )

      case 'longestStreak':
        return (
          <div className={`text-center ${slideClass}`}>
            <div className="text-5xl mb-6 animate-pulse">🔥</div>
            <h2 className="text-3xl font-bold mb-4">Longest Streak</h2>
            <div className="text-6xl font-bold mb-4 text-primary animate-count-up">
              {wrappedData.longestStreak}
            </div>
            <div className="text-lg text-primary/60">
              consecutive days
            </div>
          </div>
        )

      case 'interactiveStreak':
        return (
          <div className={`text-center ${slideClass}`}>
            <div className="text-5xl mb-6">🎯</div>
            <h2 className="text-3xl font-bold mb-6">{interactiveGame.question}</h2>
            {!interactiveGame.revealed ? (
              <>
                <div className="space-y-3">
                  {interactiveGame.options.map((option, idx) => (
                    <button
                      key={idx}
                      onClick={() => handleInteractiveGuess(option.value)}
                      className={`w-full px-6 py-4 bg-card/50 border-2 border-primary/30 rounded-lg text-lg font-semibold transition-all hover:border-primary hover:bg-card ${
                        interactiveGame.selected === option.value ? 'ring-2 ring-primary' : ''
                      }`}
                    >
                      {option.label}
                    </button>
                  ))}
                </div>
              </>
            ) : (
              <>
                <div className={`text-2xl font-bold mb-2 ${interactiveGame.selected === interactiveGame.correct ? 'text-green-400' : 'text-red-400'}`}>
                  {interactiveGame.selected === interactiveGame.correct ? '🎉 Correct!' : '❌ Not quite'}
                </div>
                <div className="text-xl font-semibold mb-2">
                  {interactiveGame.correct} days
                </div>
              </>
            )}
          </div>
        )

      case 'topArtists':
        return (
          <div className={`text-center ${slideClass}`}>
            <div className="text-5xl mb-6">🎤</div>
            <h2 className="text-3xl font-bold mb-6">Top Artists</h2>
            <div className="space-y-4">
              {wrappedData.topArtists.map((item, index) => (
                <div key={item.artist} className="flex items-center gap-4 bg-card/50 rounded p-3 animate-fade-in" style={{ animationDelay: `${index * 100}ms` }}>
                  {artistImages[item.artist] && (
                    <Image
                      src={artistImages[item.artist]!}
                      alt={item.artist}
                      width={50}
                      height={50}
                      className="rounded-full"
                    />
                  )}
                  <div className="flex items-center gap-3 flex-grow">
                    <span className="text-2xl">
                      {index === 0 ? '🥇' : index === 1 ? '🥈' : index === 2 ? '🥉' : `${index + 1}.`}
                    </span>
                    <span className="text-lg font-semibold">{item.artist}</span>
                  </div>
                  <span className="text-primary/80">{item.count}</span>
                </div>
              ))}
            </div>
          </div>
        )

      case 'topSongs':
        return (
          <div className={`text-center ${slideClass}`}>
            <div className="text-5xl mb-6">🎵</div>
            <h2 className="text-3xl font-bold mb-6">Top Songs</h2>
            <div className="space-y-4">
              {wrappedData.topSongs.map((item, index) => (
                <div key={`${item.songTitle}-${item.artist}`} className="bg-card/50 rounded p-3 text-left animate-fade-in" style={{ animationDelay: `${index * 100}ms` }}>
                  <div className="flex items-center gap-3 mb-2">
                    {item.albumArt && (
                      <Image
                        src={item.albumArt}
                        alt={item.songTitle}
                        width={60}
                        height={60}
                        className="rounded"
                      />
                    )}
                    <div className="flex-grow">
                      <div className="flex items-center gap-3 mb-1">
                        <span className="text-xl">
                          {index === 0 ? '🥇' : index === 1 ? '🥈' : index === 2 ? '🥉' : `${index + 1}.`}
                        </span>
                        <span className="font-semibold">{item.songTitle}</span>
                      </div>
                      <div className="text-sm text-primary/80 italic ml-8">by {item.artist}</div>
                      <div className="ml-8 mt-1">
                        <SpotifyAttribution variant="minimal" />
                      </div>
                      <div className="text-sm text-primary/60 ml-8">{item.count} time{item.count !== 1 ? 's' : ''}</div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )

      case 'seasonalTimeline':
        if (!wrappedData.seasonalData) return null
        const seasons: Array<'winter' | 'spring' | 'summer' | 'fall'> = ['winter', 'spring', 'summer', 'fall']
        const currentSeason = seasons[seasonalTimelineIndex]
        const seasonData = wrappedData.seasonalData[currentSeason]
        const seasonNames = {
          winter: 'Winter (Jan-Mar)',
          spring: 'Spring (Apr-Jun)',
          summer: 'Summer (Jul-Sep)',
          fall: 'Fall (Oct-Dec)',
        }
        const seasonEmojis = {
          winter: '❄️',
          spring: '🌸',
          summer: '☀️',
          fall: '🍂',
        }
        const seasonBgColors = {
          winter: 'from-blue-900/20 to-cyan-800/20',
          spring: 'from-green-800/20 to-pink-700/20',
          summer: 'from-yellow-700/20 to-orange-600/20',
          fall: 'from-orange-800/20 to-red-700/20',
        }
        
        return (
          <div className={`relative overflow-hidden min-h-[500px] ${slideClass}`}>
            {/* Sky background with gradient */}
            <div className={`absolute inset-0 bg-gradient-to-b ${seasonBgColors[currentSeason]} transition-all duration-1000`}>
              {/* Clouds */}
              <div className="absolute top-10 left-10 text-4xl opacity-40 animate-float">☁️</div>
              <div className="absolute top-20 right-20 text-5xl opacity-30 animate-float" style={{ animationDelay: '1s' }}>☁️</div>
              <div className="absolute top-40 left-1/3 text-3xl opacity-50 animate-float" style={{ animationDelay: '2s' }}>☁️</div>
            </div>

            {/* Flying bird */}
            <div className="absolute top-12 left-1/2 -translate-x-1/2 animate-fly z-20">
              <ThemeBird size={96} state="fly" />
            </div>

            {/* Season content */}
            <div className="relative z-10 pt-32 px-6 text-center">
              <div className="text-5xl mb-4 animate-bounce">{seasonEmojis[currentSeason]}</div>
              <h2 className="text-3xl font-bold mb-2 text-text">{seasonNames[currentSeason]}</h2>
              <div className="text-lg text-text/70 mb-6">Flying through your year...</div>

              {/* Top artists for season */}
              <div className="bg-surface/90 backdrop-blur-sm rounded-xl p-6 max-w-md mx-auto mb-4 shadow-xl border border-accent/20">
                <div className="text-sm font-medium text-accent mb-3">Top Artists</div>
                <div className="space-y-2">
                  {wrappedData.topArtistsBySeason[currentSeason]?.slice(0, 3).map((artist, idx) => (
                    <div key={artist.artist} className="flex items-center justify-between bg-bg/50 rounded-lg p-2 animate-fade-in" style={{ animationDelay: `${idx * 150}ms` }}>
                      <span className="font-semibold text-text">{artist.artist}</span>
                      <span className="text-sm text-accent font-medium">{artist.count}×</span>
                    </div>
                  ))}
                </div>
              </div>

              {/* Top songs for season */}
              {seasonData.songs.length > 0 && (
                <div className="bg-surface/90 backdrop-blur-sm rounded-xl p-6 max-w-md mx-auto shadow-xl border border-accent/20">
                  <div className="text-sm font-medium text-accent mb-3">Top Songs</div>
                  <div className="space-y-2">
                    {seasonData.songs.slice(0, 3).map((song, idx) => (
                      <div key={`${song.songTitle}-${song.artist}`} className="bg-bg/50 rounded-lg p-2 text-left animate-fade-in" style={{ animationDelay: `${(3 + idx) * 150}ms` }}>
                        <div className="font-semibold text-text text-sm">{song.songTitle}</div>
                        <div className="text-xs text-text/60 italic">{song.artist}</div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {seasonalTimelineIndex < seasons.length - 1 && (
                <div className="mt-6 text-sm text-text/50 italic animate-pulse">
                  Flying to the next season...
                </div>
              )}
            </div>
          </div>
        )

      case 'returningArtists':
        return (
          <div className={`text-center ${slideClass}`}>
            <div className="text-5xl mb-6">🔄</div>
            <h2 className="text-3xl font-bold mb-6">Returning Artists</h2>
            <div className="text-lg text-primary/60 mb-4">
              Artists that appeared across multiple months
            </div>
            <div className="space-y-4">
              {wrappedData.returningArtists.map((item, index) => (
                <div key={item.artist} className="bg-card/50 rounded p-3 animate-fade-in" style={{ animationDelay: `${index * 100}ms` }}>
                  <div className="flex items-center justify-between mb-1">
                    <span className="font-semibold">{item.artist}</span>
                    <span className="text-primary/80">{item.monthCount} months</span>
                  </div>
                  <div className="text-sm text-primary/60">{item.totalCount} total entries</div>
                </div>
              ))}
            </div>
          </div>
        )

      case 'mostMentionedPerson':
        if (!wrappedData.mostMentionedPerson) return null
        return (
          <div className={`text-center ${slideClass}`}>
            <div className="text-5xl mb-6">👥</div>
            <h2 className="text-3xl font-bold mb-4">People in Your Day</h2>
            <div className="text-2xl font-semibold mb-2">
              {wrappedData.mostMentionedPerson.name}
            </div>
            <div className="text-xl text-primary mb-6">
              appeared {wrappedData.mostMentionedPerson.count} time{wrappedData.mostMentionedPerson.count !== 1 ? 's' : ''}
            </div>
            {wrappedData.topPeople.length > 1 && (
              <div className="mt-6 space-y-2">
                <div className="text-sm text-primary/60 mb-2">Others:</div>
                {wrappedData.topPeople.slice(1, 4).map((person) => (
                  <div key={person.name} className="text-primary/80">
                    {person.name} ({person.count})
                  </div>
                ))}
              </div>
            )}
          </div>
        )

      case 'keywordArtists':
        if (!wrappedData.keywordAnalysis?.topArtistsWithKeywords || wrappedData.keywordAnalysis.topArtistsWithKeywords.length === 0) return null
        return (
          <div className={`text-center ${slideClass}`}>
            <div className="text-5xl mb-6">💬</div>
            <h2 className="text-3xl font-bold mb-6">Words with Artists</h2>
            <div className="text-lg text-primary/60 mb-4">
              Common words that appeared in your notes when listening to these artists
            </div>
            <div className="space-y-4">
              {wrappedData.keywordAnalysis.topArtistsWithKeywords.map((item, index) => (
                <div key={item.artist} className="bg-card/50 rounded p-4 animate-fade-in" style={{ animationDelay: `${index * 100}ms` }}>
                  <div className="font-semibold text-lg mb-3">{item.artist}</div>
                  <div className="flex flex-wrap gap-2 justify-center">
                    {item.keywords.map((kw, idx) => (
                      <span key={idx} className="px-3 py-1 bg-primary/20 rounded-full text-sm">
                        {kw.word} ({kw.count})
                      </span>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )

      case 'keywordPeople':
        if (!wrappedData.keywordAnalysis?.topPeopleWithKeywords || wrappedData.keywordAnalysis.topPeopleWithKeywords.length === 0) return null
        return (
          <div className={`text-center ${slideClass}`}>
            <div className="text-5xl mb-6">💬</div>
            <h2 className="text-3xl font-bold mb-6">Words with People</h2>
            <div className="text-lg text-primary/60 mb-4">
              Common words that appeared in your notes when these people were in your day
            </div>
            <div className="space-y-4">
              {wrappedData.keywordAnalysis.topPeopleWithKeywords.map((item, index) => (
                <div key={item.person} className="bg-card/50 rounded p-4 animate-fade-in" style={{ animationDelay: `${index * 100}ms` }}>
                  <div className="font-semibold text-lg mb-3">{item.person}</div>
                  <div className="flex flex-wrap gap-2 justify-center">
                    {item.keywords.map((kw, idx) => (
                      <span key={idx} className="px-3 py-1 bg-primary/20 rounded-full text-sm">
                        {kw.word} ({kw.count})
                      </span>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )

      case 'sentimentBreakdown':
        if (!wrappedData.noteSongMatching || wrappedData.noteSongMatching.totalMatches === 0) return null
        return (
          <div className={`text-center ${slideClass}`}>
            <div className="text-5xl mb-6">�</div>
            <h2 className="text-3xl font-bold mb-4">Sentiment Analysis</h2>
            <div className="text-lg text-primary/60 mb-6">
              The emotional tone of your notes throughout the year
            </div>
            <div className="space-y-4 text-left">
              <div className="bg-card/50 rounded-lg p-4">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-lg font-semibold">Total Analyzed</span>
                  <span className="text-2xl font-bold text-primary">{wrappedData.noteSongMatching.totalMatches}</span>
                </div>
                <div className="text-sm text-primary/60">Entries with notes</div>
              </div>
              
              <div className="bg-green-500/20 border border-green-500/40 rounded-lg p-4">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-lg font-semibold flex items-center gap-2">
                    <span>😊</span>
                    <span>Positive</span>
                  </span>
                  <span className="text-2xl font-bold text-green-400">{wrappedData.noteSongMatching.positiveRate}%</span>
                </div>
                <div className="text-sm text-primary/80">
                  {wrappedData.noteSongMatching.totalPositive} entries with positive vibes
                </div>
              </div>
              
              <div className="bg-orange-500/20 border border-orange-500/40 rounded-lg p-4">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-lg font-semibold flex items-center gap-2">
                    <span>😔</span>
                    <span>Negative</span>
                  </span>
                  <span className="text-2xl font-bold text-orange-400">{wrappedData.noteSongMatching.negativeRate}%</span>
                </div>
                <div className="text-sm text-primary/80">
                  {wrappedData.noteSongMatching.totalNegative} entries with tough moments
                </div>
              </div>

              <div className="bg-blue-500/20 border border-blue-500/40 rounded-lg p-4">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-lg font-semibold flex items-center gap-2">
                    <span>😐</span>
                    <span>Neutral</span>
                  </span>
                  <span className="text-2xl font-bold text-blue-400">{wrappedData.noteSongMatching.neutralRate}%</span>
                </div>
                <div className="text-sm text-primary/80">
                  {wrappedData.noteSongMatching.totalNeutral} entries with balanced feelings
                </div>
              </div>

              <div className="text-xs text-center text-primary/50 mt-4 pt-4 border-t border-primary/20">
                Based on sentiment words found in your notes
              </div>
            </div>
          </div>
        )

      case 'noteSongMatching':
        if (!wrappedData.noteSongMatching || wrappedData.noteSongMatching.totalMatches === 0) return null
        return (
          <div className={`text-center ${slideClass}`}>
            <div className="text-5xl mb-6">🎵💭</div>
            <h2 className="text-3xl font-bold mb-4">Your Emotional Soundtrack</h2>
            <div className="text-lg text-primary/60 mb-6">
              Songs that captured your moods
            </div>
            {wrappedData.noteSongMatching.mostPositiveSong && (
              <div className="mt-6 pt-6 border-t border-primary/20">
                <div className="text-sm text-primary/60 mb-2">Most Positive Moment 😊</div>
                <div className="font-semibold">{wrappedData.noteSongMatching.mostPositiveSong.songTitle}</div>
                <div className="text-sm text-primary/80 italic">by {wrappedData.noteSongMatching.mostPositiveSong.artist}</div>
              </div>
            )}
            {wrappedData.noteSongMatching.mostNegativeSong && (
              <div className="mt-4">
                <div className="text-sm text-primary/60 mb-2">Toughest Moment 😔</div>
                <div className="font-semibold">{wrappedData.noteSongMatching.mostNegativeSong.songTitle}</div>
                <div className="text-sm text-primary/80 italic">by {wrappedData.noteSongMatching.mostNegativeSong.artist}</div>
              </div>
            )}
          </div>
        )

      case 'happiestSongs':
        if (!wrappedData.noteSongMatching || wrappedData.noteSongMatching.happiestSongs.length === 0) return null
        return (
          <div className={`text-center ${slideClass}`}>
            <div className="text-5xl mb-6">😊✨</div>
            <h2 className="text-3xl font-bold mb-4">Your Happiest Songs</h2>
            <div className="text-lg text-primary/60 mb-6">
              These songs were with you during your best moments
            </div>
            <div className="space-y-3 max-h-[400px] overflow-y-auto">
              {wrappedData.noteSongMatching.happiestSongs.map((song, index) => (
                <div key={`${song.songTitle}-${song.artist}`} className="bg-gradient-to-r from-green-500/10 to-yellow-500/10 border border-green-500/30 rounded-lg p-3 text-left animate-fade-in" style={{ animationDelay: `${index * 50}ms` }}>
                  <div className="flex items-center gap-3">
                    {song.albumArt && (
                      <Image
                        src={song.albumArt}
                        alt={song.songTitle}
                        width={50}
                        height={50}
                        className="rounded"
                      />
                    )}
                    <div className="flex-grow">
                      <div className="flex items-center gap-2 mb-1">
                        <span className="text-lg font-bold text-green-400">{index + 1}.</span>
                        <span className="font-semibold">{song.songTitle}</span>
                      </div>
                      <div className="text-sm text-primary/80 italic">by {song.artist}</div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )

      case 'lyricsVsNotes':
        if (!wrappedData.noteSongMatching || wrappedData.noteSongMatching.totalWithLyrics === 0) return null
        return (
          <div className={`text-center ${slideClass}`}>
            <div className="text-5xl mb-6">🎵📝</div>
            <h2 className="text-3xl font-bold mb-4">Lyrics vs Your Vibes</h2>
            <div className="text-lg text-primary/60 mb-6">
              Did your song choices match how you were feeling?
            </div>
            
            <div className="bg-card/50 rounded-xl p-6 mb-6">
              <div className="text-4xl font-bold text-primary mb-2">
                {Math.round(wrappedData.noteSongMatching.alignmentRate)}%
              </div>
              <div className="text-sm text-primary/80">
                of the time your mood matched the song's emotional vibe
              </div>
            </div>

            {wrappedData.noteSongMatching.mostAlignedSong && (
              <div className="bg-gradient-to-r from-green-500/20 to-emerald-500/20 border border-green-500/40 rounded-lg p-4 mb-4 text-left">
                <div className="text-sm text-green-400 font-semibold mb-2">✨ Perfect Match</div>
                <div className="flex items-center gap-3">
                  {wrappedData.noteSongMatching.mostAlignedSong.albumArt && (
                    <Image
                      src={wrappedData.noteSongMatching.mostAlignedSong.albumArt}
                      alt={wrappedData.noteSongMatching.mostAlignedSong.songTitle}
                      width={60}
                      height={60}
                      className="rounded"
                    />
                  )}
                  <div className="flex-grow">
                    <div className="font-semibold">{wrappedData.noteSongMatching.mostAlignedSong.songTitle}</div>
                    <div className="text-sm text-primary/80 italic">by {wrappedData.noteSongMatching.mostAlignedSong.artist}</div>
                    <div className="text-xs text-primary/60 mt-1 line-clamp-2">
                      "{wrappedData.noteSongMatching.mostAlignedSong.notes}"
                    </div>
                  </div>
                </div>
                <div className="text-xs text-green-400/80 mt-2">
                  Your notes: {wrappedData.noteSongMatching.mostAlignedSong.noteSentiment} • Lyrics: {wrappedData.noteSongMatching.mostAlignedSong.lyricsSentiment}
                </div>
              </div>
            )}

            {wrappedData.noteSongMatching.mostDivergedSong && (
              <div className="bg-gradient-to-r from-purple-500/20 to-pink-500/20 border border-purple-500/40 rounded-lg p-4 text-left">
                <div className="text-sm text-purple-400 font-semibold mb-2">🎭 Contrast</div>
                <div className="flex items-center gap-3">
                  {wrappedData.noteSongMatching.mostDivergedSong.albumArt && (
                    <Image
                      src={wrappedData.noteSongMatching.mostDivergedSong.albumArt}
                      alt={wrappedData.noteSongMatching.mostDivergedSong.songTitle}
                      width={60}
                      height={60}
                      className="rounded"
                    />
                  )}
                  <div className="flex-grow">
                    <div className="font-semibold">{wrappedData.noteSongMatching.mostDivergedSong.songTitle}</div>
                    <div className="text-sm text-primary/80 italic">by {wrappedData.noteSongMatching.mostDivergedSong.artist}</div>
                    <div className="mt-1">
                      <SpotifyAttribution variant="minimal" />
                    </div>
                    <div className="text-xs text-primary/60 mt-1 line-clamp-2">
                      "{wrappedData.noteSongMatching.mostDivergedSong.notes}"
                    </div>
                  </div>
                </div>
                <div className="text-xs text-purple-400/80 mt-2">
                  Your notes: {wrappedData.noteSongMatching.mostDivergedSong.noteSentiment} • Lyrics: {wrappedData.noteSongMatching.mostDivergedSong.lyricsSentiment}
                </div>
              </div>
            )}

            <div className="text-xs text-primary/50 mt-6 italic">
              Analyzed {wrappedData.noteSongMatching.totalWithLyrics} songs with lyrics data
            </div>
          </div>
        )

      case 'saddestSongs':
        if (!wrappedData.noteSongMatching || wrappedData.noteSongMatching.saddestSongs.length === 0) return null
        return (
          <div className={`text-center ${slideClass}`}>
            <div className="text-5xl mb-6">😔💙</div>
            <h2 className="text-3xl font-bold mb-4">Songs in Tough Times</h2>
            <div className="text-lg text-primary/60 mb-6">
              Not all days are good, and these songs were there for you
            </div>
            <div className="space-y-3 max-h-[400px] overflow-y-auto">
              {wrappedData.noteSongMatching.saddestSongs.map((song, index) => (
                <div key={`${song.songTitle}-${song.artist}`} className="bg-gradient-to-r from-blue-500/10 to-purple-500/10 border border-blue-500/30 rounded-lg p-3 text-left animate-fade-in" style={{ animationDelay: `${index * 50}ms` }}>
                  <div className="flex items-center gap-3">
                    {song.albumArt && (
                      <Image
                        src={song.albumArt}
                        alt={song.songTitle}
                        width={50}
                        height={50}
                        className="rounded"
                      />
                    )}
                    <div className="flex-grow">
                      <div className="flex items-center gap-2 mb-1">
                        <span className="text-lg font-bold text-blue-400">{index + 1}.</span>
                        <span className="font-semibold">{song.songTitle}</span>
                      </div>
                      <div className="text-sm text-primary/80 italic">by {song.artist}</div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
            <div className="text-sm text-primary/50 mt-4 italic">
              You made it through 💪
            </div>
          </div>
        )

      case 'peopleSentiment':
        if (!wrappedData.peopleSentimentAnalysis || wrappedData.peopleSentimentAnalysis.length === 0) return null
        return (
          <div className={`text-center ${slideClass}`}>
            <div className="text-5xl mb-6">👥💭</div>
            <h2 className="text-3xl font-bold mb-4">People & Emotions</h2>
            <div className="text-lg text-primary/60 mb-6">
              How you felt when these people were in your day
            </div>
            <div className="space-y-4">
              {wrappedData.peopleSentimentAnalysis.map((person, index) => {
                const positivePercent = Math.round((person.positiveEntries / person.totalEntries) * 100)
                const negativePercent = Math.round((person.negativeEntries / person.totalEntries) * 100)
                const neutralPercent = 100 - positivePercent - negativePercent
                
                return (
                  <div key={person.name} className="bg-card/50 rounded-lg p-4 text-left animate-fade-in" style={{ animationDelay: `${index * 100}ms` }}>
                    <div className="font-semibold text-lg mb-3">{person.name}</div>
                    <div className="text-sm text-primary/80 mb-2">{person.totalEntries} entries together</div>
                    
                    {/* Sentiment breakdown bar */}
                    <div className="flex h-3 rounded-full overflow-hidden mb-3">
                      {positivePercent > 0 && (
                        <div 
                          className="bg-green-500" 
                          style={{ width: `${positivePercent}%` }}
                          title={`${positivePercent}% positive`}
                        />
                      )}
                      {neutralPercent > 0 && (
                        <div 
                          className="bg-blue-500" 
                          style={{ width: `${neutralPercent}%` }}
                          title={`${neutralPercent}% neutral`}
                        />
                      )}
                      {negativePercent > 0 && (
                        <div 
                          className="bg-orange-500" 
                          style={{ width: `${negativePercent}%` }}
                          title={`${negativePercent}% negative`}
                        />
                      )}
                    </div>
                    
                    <div className="flex justify-between text-xs text-primary/60">
                      <span>😊 {positivePercent}%</span>
                      <span>😐 {neutralPercent}%</span>
                      <span>😔 {negativePercent}%</span>
                    </div>
                  </div>
                )
              })}
            </div>
          </div>
        )

      case 'closing':
        return (
          <div className={`text-center ${slideClass}`}>
            <div className="mb-6 animate-bounce flex justify-center">
              <ThemeBird size={96} state="happy" />
            </div>
            <h2 className="text-3xl font-bold mb-4">That's a wrap!</h2>
            <div className="text-lg text-primary/60 mb-6">
              Thanks for making {wrappedData.year} musical
            </div>
            <div className="text-sm text-primary/40">
              SongBird Wrapped
            </div>
          </div>
        )

      default:
        return null
    }
  }

  return (
    <div className="space-y-4 sm:space-y-6 px-3 sm:px-0">
      <div className="flex items-center justify-between mb-2 sm:mb-4">
        <h3 className="text-lg sm:text-xl font-semibold">SongBird Wrapped</h3>
        <select
          value={currentYear}
          onChange={(e) => setCurrentYear(parseInt(e.target.value))}
          className="px-4 py-2 bg-card border border-primary rounded text-primary text-sm"
        >
          {Array.from({ length: 5 }, (_, i) => new Date().getFullYear() - i).map((year) => (
            <option key={year} value={year}>
              {year}
            </option>
          ))}
        </select>
      </div>

      {/* Mobile swipeable card with animations */}
      <div
        className="relative bg-gradient-to-br from-yellow-400/30 via-orange-300/25 to-red-400/20 border-2 border-yellow-400/40 rounded-2xl p-8 min-h-[500px] flex items-center justify-center overflow-hidden"
        onTouchStart={onTouchStart}
        onTouchMove={onTouchMove}
        onTouchEnd={onTouchEnd}
      >
        {/* SongBird themed background elements */}
        <div className="absolute inset-0 overflow-hidden pointer-events-none">
          <div className="absolute top-10 left-10 opacity-20 animate-bounce" style={{ animationDuration: '3s' }}>
            <ThemeBird size={48} />
          </div>
          <div className="absolute top-20 right-16 opacity-15 animate-bounce" style={{ animationDuration: '4s', animationDelay: '1s' }}>
            <ThemeBird size={36} />
          </div>
          <div className="absolute bottom-16 left-20 opacity-20 animate-bounce" style={{ animationDuration: '3.5s', animationDelay: '0.5s' }}>
            <ThemeBird size={36} />
          </div>
          
          <div className="absolute top-4 left-4 text-2xl opacity-30 animate-pulse" style={{ animationDuration: '2s' }}>♪</div>
          <div className="absolute top-8 right-8 text-xl opacity-20 animate-pulse" style={{ animationDuration: '2.5s', animationDelay: '0.5s' }}>♫</div>
          <div className="absolute bottom-6 left-8 text-xl opacity-25 animate-pulse" style={{ animationDuration: '2.2s', animationDelay: '1s' }}>♪</div>
          <div className="absolute bottom-4 right-4 text-2xl opacity-30 animate-pulse" style={{ animationDuration: '2.3s', animationDelay: '0.3s' }}>♫</div>
        </div>

        {/* Card content with slide animation */}
        <div className="w-full max-w-md relative z-10">
          {renderCard()}
        </div>
      </div>

      {/* Navigation */}
      <div className="flex items-center justify-between">
        <button
          onClick={prevCard}
          disabled={currentCard === 0}
          className="px-4 py-2 bg-card border border-primary rounded disabled:opacity-50 disabled:cursor-not-allowed hover:bg-primary/10 transition-colors"
        >
          ← Previous
        </button>
        <div className="text-sm text-primary/60">
          {currentCard + 1} / {getTotalCards()}
        </div>
        <button
          onClick={nextCard}
          disabled={currentCard === getTotalCards() - 1}
          className="px-4 py-2 bg-card border border-primary rounded disabled:opacity-50 disabled:cursor-not-allowed hover:bg-primary/10 transition-colors"
        >
          Next →
        </button>
      </div>

      {/* Card indicators */}
      <div className="flex justify-center gap-2">
        {Array.from({ length: getTotalCards() }).map((_, index) => (
          <button
            key={index}
            onClick={() => {
              if (index > currentCard) {
                setSlideDirection('left')
              } else if (index < currentCard) {
                setSlideDirection('right')
              }
              setTimeout(() => {
                setCurrentCard(index)
                setSlideDirection('none')
                const availableCards = getAvailableCards()
                const cardType = availableCards[index]
                if (cardType?.startsWith('interactive')) {
                  setupInteractiveGame(cardType)
                } else if (cardType === 'seasonalTimeline') {
                  setSeasonalTimelineIndex(0)
                } else {
                  setInteractiveGame({ type: null, question: '', options: [], correct: 0, selected: null, revealed: false })
                }
              }, 150)
            }}
            className={`w-2 h-2 rounded-full transition-all ${
              index === currentCard ? 'bg-primary w-6' : 'bg-primary/30'
            }`}
            aria-label={`Go to card ${index + 1}`}
          />
        ))}
      </div>
    </div>
  )
}
