'use client'

import { useState, useEffect, useCallback, useRef } from 'react'
import { useUser } from '@clerk/nextjs'
import { getLocalDateString } from '@/lib/date-utils'
import Image from 'next/image'
import Link from 'next/link'
import ThemeBird from './ThemeBird'
import InviteFriendsCTA from './InviteFriendsCTA'
import SpotifyAttribution from './SpotifyAttribution'
import SongShareCard from './SongShareCard'
import { trackTabView } from '@/lib/analytics-client'

interface Comment {
  id: string
  content: string
  createdAt: string
  user: {
    id: string
    username: string | null
    name: string | null
    email: string
    image: string | null
  }
}

interface FeedEntry {
  id: string
  date: string
  songTitle: string
  artist: string
  albumTitle: string
  albumArt: string
  trackId: string
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
  vibeCount: number
  hasVibed: boolean
  commentCount: number
  isOwnEntry?: boolean
}

// Heart icon for vibe button
const HeartIcon = ({ filled }: { filled: boolean }) => (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    viewBox="0 0 24 24"
    fill={filled ? 'currentColor' : 'none'}
    stroke="currentColor"
    strokeWidth={2}
    className="w-5 h-5"
  >
    <path
      strokeLinecap="round"
      strokeLinejoin="round"
      d="M21 8.25c0-2.485-2.099-4.5-4.688-4.5-1.935 0-3.597 1.126-4.312 2.733-.715-1.607-2.377-2.733-4.313-2.733C5.1 3.75 3 5.765 3 8.25c0 7.22 9 12 9 12s9-4.78 9-12z"
    />
  </svg>
)

// Spotify icon
const SpotifyIcon = () => (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    viewBox="0 0 24 24"
    fill="currentColor"
    className="w-5 h-5"
  >
    <path d="M12 0C5.4 0 0 5.4 0 12s5.4 12 12 12 12-5.4 12-12S18.66 0 12 0zm5.521 17.34c-.24.359-.66.48-1.021.24-2.82-1.74-6.36-2.101-10.561-1.141-.418.122-.779-.179-.899-.539-.12-.421.18-.78.54-.9 4.56-1.021 8.52-.6 11.64 1.32.42.18.479.659.301 1.02zm1.44-3.3c-.301.42-.841.6-1.262.3-3.239-1.98-8.159-2.58-11.939-1.38-.479.12-1.02-.12-1.14-.6-.12-.48.12-1.021.6-1.141C9.6 9.9 15 10.561 18.72 12.84c.361.181.54.78.241 1.2zm.12-3.36C15.24 8.4 8.82 8.16 5.16 9.301c-.6.179-1.2-.181-1.38-.721-.18-.601.18-1.2.72-1.381 4.26-1.26 11.28-1.02 15.721 1.621.539.3.719 1.02.419 1.56-.299.421-1.02.599-1.559.3z"/>
  </svg>
)

// Apple Music icon
const AppleMusicIcon = () => (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    viewBox="0 0 24 24"
    fill="currentColor"
    className="w-5 h-5"
  >
    <path d="M23.994 6.124a9.23 9.23 0 00-.24-2.19c-.317-1.31-1.062-2.31-2.18-3.043a5.022 5.022 0 00-1.877-.726 10.496 10.496 0 00-1.564-.15c-.04-.003-.083-.01-.124-.013H5.986c-.152.01-.303.017-.455.026-.747.043-1.49.123-2.193.4-1.336.53-2.3 1.452-2.865 2.78-.192.448-.292.925-.363 1.408-.056.392-.088.785-.1 1.18 0 .032-.007.062-.01.093v12.223c.01.14.017.283.027.424.05.815.154 1.624.497 2.373.65 1.42 1.738 2.353 3.234 2.801.42.127.856.187 1.293.228.555.053 1.11.06 1.667.06h11.03a12.5 12.5 0 001.57-.1c.822-.106 1.596-.35 2.295-.81a5.046 5.046 0 001.88-2.207c.186-.42.293-.87.37-1.324.113-.675.138-1.358.137-2.04-.002-3.8 0-7.595-.003-11.393zm-6.423 3.99v5.712c0 .417-.058.827-.244 1.206-.29.59-.76.962-1.388 1.14-.35.1-.706.157-1.07.173-.95.042-1.8-.335-2.22-1.18-.26-.52-.246-1.075-.046-1.606.303-.804.93-1.26 1.705-1.504.352-.11.71-.184 1.066-.273.305-.076.61-.152.91-.24.18-.055.296-.178.334-.37a.96.96 0 00.014-.18V8.374c0-.266-.07-.35-.334-.296l-5.353 1.208c-.022.005-.044.013-.066.017-.26.06-.37.18-.385.447-.002.04-.002.078-.002.118v7.606c0 .38-.044.755-.197 1.107-.26.6-.722 1-1.345 1.2-.345.11-.7.176-1.064.2-.96.065-1.84-.283-2.28-1.16-.26-.515-.258-1.067-.06-1.6.295-.793.908-1.253 1.678-1.503.37-.12.744-.193 1.12-.29.272-.07.54-.148.804-.234.2-.066.32-.2.357-.41a.95.95 0 00.012-.16V7.39c0-.158.028-.31.1-.453.123-.24.32-.37.567-.42.1-.02.196-.04.295-.057L17 5.274c.086-.016.172-.04.26-.045.206-.01.345.12.373.327.01.065.013.13.013.196v4.362h-.075z"/>
  </svg>
)

// Comment icon
const CommentIcon = () => (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth={2}
    className="w-5 h-5"
  >
    <path
      strokeLinecap="round"
      strokeLinejoin="round"
      d="M8.625 12a.375.375 0 11-.75 0 .375.375 0 01.75 0zm0 0H8.25m4.125 0a.375.375 0 11-.75 0 .375.375 0 01.75 0zm0 0H12m4.125 0a.375.375 0 11-.75 0 .375.375 0 01.75 0zm0 0h-.375M21 12c0 4.556-4.03 8.25-9 8.25a9.764 9.764 0 01-2.555-.337A5.972 5.972 0 015.41 20.97a5.969 5.969 0 01-.474-.065 4.48 4.48 0 00.978-2.025c.09-.457-.133-.901-.467-1.226C3.93 16.178 3 14.189 3 12c0-4.556 4.03-8.25 9-8.25s9 3.694 9 8.25z"
    />
  </svg>
)

export default function FeedTab() {
  const { isLoaded, isSignedIn } = useUser()
  const [entries, setEntries] = useState<FeedEntry[]>([])
  const [loading, setLoading] = useState(false)
  const [loadingMore, setLoadingMore] = useState(false)
  const [hasMore, setHasMore] = useState(true)
  const [cursor, setCursor] = useState<string | null>(null)
  const [expandedComments, setExpandedComments] = useState<Set<string>>(new Set())
  const [comments, setComments] = useState<Record<string, Comment[]>>({})
  const [newComment, setNewComment] = useState<Record<string, string>>({})
  const [submittingComment, setSubmittingComment] = useState<string | null>(null)
  const [vibing, setVibing] = useState<string | null>(null)
  const [loadMoreRef, setLoadMoreRef] = useState<HTMLDivElement | null>(null)
  const fetchFeedRef = useRef<((initialLoad: boolean) => Promise<void>) | null>(null)
  const initialLoadDoneRef = useRef(false)
  const [hasLoggedToday, setHasLoggedToday] = useState(false)
  const [friendsWhoLoggedToday, setFriendsWhoLoggedToday] = useState(0)
  const [unreadFeedItems, setUnreadFeedItems] = useState(0)
  const [seenEntryIds, setSeenEntryIds] = useState<Set<string>>(new Set())
  const [sharingEntry, setSharingEntry] = useState<FeedEntry | null>(null)

  const fetchFeed = useCallback(async (initialLoad: boolean = false) => {
    if (!isLoaded || !isSignedIn) {
      setLoading(false)
      setLoadingMore(false)
      return
    }

    // Prevent duplicate calls
    if (initialLoad && loading) return
    if (!initialLoad && (loadingMore || !cursor)) return

    if (initialLoad) {
      setLoading(true)
      setEntries([])
      setCursor(null)
      setHasMore(true)
    } else {
      setLoadingMore(true)
    }

    try {
      // Build query params - NO date filtering, just pagination
      const params = new URLSearchParams()
      if (!initialLoad && cursor) {
        params.append('cursor', cursor)
      }
      params.append('limit', '20')

      const res = await fetch(`/api/feed?${params.toString()}`)
      
      if (!res.ok) {
        if (res.status === 401) {
          console.error('Unauthorized - please sign in')
          window.location.href = '/home'
          return
        }
        const errorData = await res.json().catch(() => ({}))
        console.error('Error fetching feed:', res.status, errorData)
        throw new Error(`Failed to fetch feed: ${res.status}`)
      }

      const data = await res.json()
      const newEntries = data.entries || []
      
      if (initialLoad) {
        // Deduplicate by entry ID
        const uniqueEntries: FeedEntry[] = Array.from(
          new Map(newEntries.map((e: FeedEntry) => [e.id, e])).values()
        ) as FeedEntry[]
        setEntries(uniqueEntries)
        // Mark entries as seen when loaded
        const entryIds = new Set(uniqueEntries.map((e: FeedEntry) => e.id))
        setSeenEntryIds(entryIds)
      } else {
        // Deduplicate when appending - filter out entries we already have
        setEntries(prev => {
          const existingIds = new Set(prev.map(e => e.id))
          const uniqueNewEntries = newEntries.filter((e: FeedEntry) => !existingIds.has(e.id))
          return [...prev, ...uniqueNewEntries]
        })
      }
      setHasMore(data.hasMore === true)
      setCursor(data.cursor || null)

      // Check if user has logged today and count friends who logged
      const today = getLocalDateString()
      const userHasLogged = (data.entries || []).some((e: FeedEntry) => 
        e.isOwnEntry && e.date.startsWith(today)
      )
      setHasLoggedToday(userHasLogged)

      // Count friends who logged today
      const friendsLogged = (data.entries || []).filter((e: FeedEntry) => 
        !e.isOwnEntry && e.date.startsWith(today)
      ).length
      setFriendsWhoLoggedToday(friendsLogged)
    } catch (error) {
      console.error('Error fetching feed:', error)
      // On error, at least clear loading state
      if (initialLoad) {
        setEntries([])
      }
    } finally {
      setLoading(false)
      setLoadingMore(false)
    }
  }, [isLoaded, isSignedIn, cursor, loading, loadingMore])

  // Store fetchFeed in ref so we can use it without causing re-renders
  useEffect(() => {
    fetchFeedRef.current = fetchFeed
  }, [fetchFeed])

  // Initial load - only run once when auth is ready
  useEffect(() => {
    if (isLoaded && isSignedIn && !initialLoadDoneRef.current && fetchFeedRef.current) {
      initialLoadDoneRef.current = true
      fetchFeedRef.current(true).catch(console.error)
      trackTabView('feed')
    }
  }, [isLoaded, isSignedIn])

  // Set up intersection observer for infinite scroll
  useEffect(() => {
    if (!loadMoreRef || !hasMore || loadingMore || !cursor) return

    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0].isIntersecting && hasMore && !loadingMore && cursor && fetchFeedRef.current) {
          fetchFeedRef.current(false)
        }
      },
      { threshold: 0.1 }
    )

    observer.observe(loadMoreRef)
    return () => observer.disconnect()
  }, [loadMoreRef, hasMore, loadingMore, cursor])

  // Calculate unread items
  useEffect(() => {
    const unread = entries.filter(e => !seenEntryIds.has(e.id) && !e.isOwnEntry).length
    setUnreadFeedItems(unread)
  }, [entries, seenEntryIds])

  // Mark entry as seen when scrolled into view
  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach(entry => {
          if (entry.isIntersecting) {
            const entryId = entry.target.getAttribute('data-entry-id')
            if (entryId) {
              setSeenEntryIds(prev => new Set([...Array.from(prev), entryId]))
            }
          }
        })
      },
      { threshold: 0.5 }
    )

    entries.forEach(entry => {
      const element = document.querySelector(`[data-entry-id="${entry.id}"]`)
      if (element) observer.observe(element)
    })

    return () => observer.disconnect()
  }, [entries])

  const handleVibe = async (entryId: string) => {
    if (vibing) return
    setVibing(entryId)

    try {
      const res = await fetch('/api/vibes', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ entryId })
      })
      
      if (res.ok) {
        const data = await res.json()
        // Update the entry's vibe status
        setEntries(prev => prev.map(entry => {
          if (entry.id === entryId) {
            return {
              ...entry,
              hasVibed: data.vibed,
              vibeCount: data.vibed ? entry.vibeCount + 1 : entry.vibeCount - 1
            }
          }
          return entry
        }))
      }
    } catch (error) {
      console.error('Error toggling vibe:', error)
    } finally {
      setVibing(null)
    }
  }

  const toggleComments = async (entryId: string) => {
    const newExpanded = new Set(expandedComments)
    if (newExpanded.has(entryId)) {
      newExpanded.delete(entryId)
    } else {
      newExpanded.add(entryId)
      // Fetch comments if we don't have them
      if (!comments[entryId]) {
        try {
          const res = await fetch(`/api/comments?entryId=${entryId}`)
          if (res.ok) {
            const data = await res.json()
            setComments(prev => ({ ...prev, [entryId]: data.comments }))
          }
        } catch (error) {
          console.error('Error fetching comments:', error)
        }
      }
    }
    setExpandedComments(newExpanded)
  }

  const handleSubmitComment = async (entryId: string) => {
    const content = newComment[entryId]?.trim()
    if (!content || submittingComment) return

    setSubmittingComment(entryId)
    try {
      const res = await fetch('/api/comments', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ entryId, content })
      })

      if (res.ok) {
        const data = await res.json()
        // Add the new comment to the list
        setComments(prev => ({
          ...prev,
          [entryId]: [...(prev[entryId] || []), data.comment]
        }))
        // Update comment count
        setEntries(prev => prev.map(entry => {
          if (entry.id === entryId) {
            return { ...entry, commentCount: entry.commentCount + 1 }
          }
          return entry
        }))
        // Clear input
        setNewComment(prev => ({ ...prev, [entryId]: '' }))
      }
    } catch (error) {
      console.error('Error submitting comment:', error)
    } finally {
      setSubmittingComment(null)
    }
  }

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center py-16 px-3">
        <div className="mb-4">
          <ThemeBird size={72} state="bounce" className="animate-bounce" />
        </div>
        <p className="text-text/60">Gathering the flock...</p>
      </div>
    )
  }

  if (entries.length === 0) {
    return (
      <div className="max-w-md mx-auto">
        <InviteFriendsCTA
          heading="Your feed is empty"
          subtext="Log your first song to see it here, and invite friends to share the journey!"
          showBird
        />
        <div className="text-center pb-8">
          <p className="text-text/40 text-sm mb-2">or</p>
          <Link 
            href="#" 
            onClick={() => window.dispatchEvent(new Event('navigateToFriends'))}
            className="px-4 py-2 bg-surface text-text/70 rounded-lg text-sm font-medium hover:bg-surface/80 transition-colors inline-block"
          >
            Find friends by username
          </Link>
        </div>
      </div>
    )
  }

  return (
    <div className="max-w-3xl mx-auto px-3 sm:px-4 py-4 sm:py-6 space-y-4 sm:space-y-6">
      <h3 className="text-lg sm:text-xl font-semibold mb-3 sm:mb-4">Your Feed</h3>

      {/* Urgency banner - Log prompt if user hasn't logged today */}
      {!hasLoggedToday && friendsWhoLoggedToday > 0 && (
        <div className="bg-accent/20 border border-accent/40 rounded-xl p-4 mb-4 flex items-center justify-between gap-4">
          <div className="flex items-center gap-3 flex-1">
            <ThemeBird size={32} state="curious" />
            <div className="flex-1">
              <p className="text-sm font-medium text-text">
                {friendsWhoLoggedToday} {friendsWhoLoggedToday === 1 ? 'friend' : 'friends'} posted today. Log your song to join!
              </p>
            </div>
          </div>
          <button
            onClick={() => {
              window.dispatchEvent(new CustomEvent('navigateToAddEntry'))
            }}
            className="px-4 py-2 bg-accent text-bg font-semibold rounded-lg hover:bg-accent/90 transition-all text-sm whitespace-nowrap"
          >
            Log Song
          </button>
        </div>
      )}

      {/* Unread indicator */}
      {unreadFeedItems > 0 && (
        <div className="bg-surface/80 border border-accent/30 rounded-lg p-3 mb-4 flex items-center justify-between">
          <p className="text-sm text-text/70">
            {unreadFeedItems} new {unreadFeedItems === 1 ? 'post' : 'posts'}
          </p>
          <button
            onClick={() => {
              window.scrollTo({ top: 0, behavior: 'smooth' })
            }}
            className="text-sm text-accent hover:text-accent/80 transition-colors font-medium"
          >
            Jump to top
          </button>
        </div>
      )}

      <div className="space-y-3 sm:space-y-4">
        {entries.map((entry) => (
          <div
            key={entry.id}
            data-entry-id={entry.id}
            className={`bg-surface rounded-xl overflow-hidden border-2 transition-all ${
              entry.isOwnEntry 
                ? 'border-accent/40 ring-1 ring-accent/20' 
                : !seenEntryIds.has(entry.id)
                ? 'border-accent/30 ring-1 ring-accent/10'
                : 'border-transparent hover:border-accent/30'
            }`}
          >
            {/* User Header - with "You" indicator for own entries */}
            <Link
              href={`/user/${encodeURIComponent(entry.user.username || entry.user.email || entry.user.id)}`}
              className={`block border-b p-3 sm:p-4 transition-colors cursor-pointer ${
                entry.isOwnEntry 
                  ? 'bg-accent/20 border-accent/30 hover:bg-accent/25' 
                  : 'bg-accent/10 border-accent/20 hover:bg-accent/15'
              }`}
            >
              <div className="flex items-center gap-3">
                {entry.user.image ? (
                  <Image
                    src={entry.user.image}
                    alt={entry.user.username || entry.user.name || entry.user.email}
                    width={40}
                    height={40}
                    className={`rounded-full border-2 ${entry.isOwnEntry ? 'border-accent' : 'border-accent'}`}
                    style={{ aspectRatio: '1/1', objectFit: 'cover', objectPosition: 'center' }}
                  />
                ) : (
                  <div className="w-10 h-10 rounded-full bg-accent/30 border-2 border-accent flex items-center justify-center text-base font-bold text-accent">
                    {(entry.user.username || entry.user.name || entry.user.email).charAt(0).toUpperCase()}
                  </div>
                )}
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <span className="font-bold text-accent text-sm sm:text-base truncate">
                      {entry.isOwnEntry ? 'You' : (entry.user.username || entry.user.name || entry.user.email.split('@')[0])}
                    </span>
                    {entry.isOwnEntry && (
                      <span className="text-xs bg-accent/30 text-accent px-2 py-0.5 rounded-full">
                        Your post
                      </span>
                    )}
                    {!seenEntryIds.has(entry.id) && !entry.isOwnEntry && (
                      <span className="w-2 h-2 bg-accent rounded-full animate-pulse" />
                    )}
                  </div>
                  <div className="text-xs sm:text-sm text-text/70">
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
            <div className="p-3 sm:p-4">
              <div className="flex gap-3 sm:gap-4">
                {entry.albumArt && (
                  <div className="flex-shrink-0 relative group">
                    <div className="absolute -inset-1 bg-gradient-to-br from-accent via-pink-500 to-purple-500 rounded-xl opacity-60 blur-sm group-hover:opacity-100 transition-opacity"></div>
                    <Image
                      src={entry.albumArt}
                      alt={entry.songTitle}
                      width={80}
                      height={80}
                      className="relative rounded-lg sm:w-[100px] sm:h-[100px] border-2 border-white/10"
                      style={{ aspectRatio: '1/1', objectFit: 'cover', objectPosition: 'center' }}
                    />
                  </div>
                )}
                <div className="flex-1 min-w-0">
                  <div className="font-bold text-base sm:text-lg mb-1 truncate">{entry.songTitle}</div>
                  <div className="text-text/70 text-sm sm:text-base mb-2 truncate">by {entry.artist}</div>
                  <SpotifyAttribution variant="minimal" className="mt-1" />
                </div>
              </div>

              {/* Action Buttons */}
              <div className="flex items-center gap-4 mt-4 pt-3 border-t border-surface">
                {/* Vibe Button */}
                <button
                  onClick={() => handleVibe(entry.id)}
                  disabled={vibing === entry.id}
                  className={`flex items-center gap-2 px-3 py-2 rounded-lg transition-all ${
                    entry.hasVibed
                      ? 'bg-pink-500/20 text-pink-400'
                      : 'bg-surface hover:bg-pink-500/10 text-text/70 hover:text-pink-400'
                  } ${vibing === entry.id ? 'opacity-50' : ''}`}
                >
                  <HeartIcon filled={entry.hasVibed} />
                  <span className="text-sm font-medium">
                    {entry.vibeCount > 0 ? entry.vibeCount : ''} Vibe{entry.vibeCount !== 1 ? 's' : ''}
                  </span>
                </button>

                {/* Comment Button */}
                <button
                  onClick={() => toggleComments(entry.id)}
                  className={`flex items-center gap-2 px-3 py-2 rounded-lg transition-all ${
                    expandedComments.has(entry.id)
                      ? 'bg-accent/20 text-accent'
                      : 'bg-surface hover:bg-accent/10 text-text/70 hover:text-accent'
                  }`}
                >
                  <CommentIcon />
                  <span className="text-sm font-medium">
                    {entry.commentCount > 0 ? entry.commentCount : ''} Comment{entry.commentCount !== 1 ? 's' : ''}
                  </span>
                </button>

                {/* Listen & Share Buttons */}
                <div className="flex items-center gap-2 ml-auto">
                  {/* Share (own entries only) */}
                  {entry.isOwnEntry && (
                    <button
                      onClick={() => setSharingEntry(entry)}
                      className="flex items-center gap-1.5 px-2.5 py-2 rounded-lg bg-accent/20 text-accent hover:bg-accent/30 transition-all"
                      title="Share song card"
                    >
                      <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} className="w-4 h-4">
                        <path strokeLinecap="round" strokeLinejoin="round" d="M7.217 10.907a2.25 2.25 0 1 0 0 2.186m0-2.186c.18.324.283.696.283 1.093s-.103.77-.283 1.093m0-2.186 9.566-5.314m-9.566 7.5 9.566 5.314m0 0a2.25 2.25 0 1 0 3.935-2.186 2.25 2.25 0 0 0-3.935 2.186Zm0-12.814a2.25 2.25 0 1 0 3.933-2.185 2.25 2.25 0 0 0-3.933 2.185Z" />
                      </svg>
                      <span className="text-sm font-medium hidden sm:inline">Share</span>
                    </button>
                  )}
                  {/* Spotify */}
                  <a
                    href={`https://open.spotify.com/track/${entry.trackId}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center gap-1.5 px-2.5 py-2 rounded-lg bg-[#1DB954]/20 text-[#1DB954] hover:bg-[#1DB954]/30 transition-all"
                    title="Listen on Spotify"
                  >
                    <SpotifyIcon />
                    <span className="text-sm font-medium hidden sm:inline">Spotify</span>
                  </a>
                  {/* Apple Music */}
                  <a
                    href={`https://music.apple.com/us/search?term=${encodeURIComponent(`${entry.songTitle} ${entry.artist}`)}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center gap-1.5 px-2.5 py-2 rounded-lg bg-[#FC3C44]/20 text-[#FC3C44] hover:bg-[#FC3C44]/30 transition-all"
                    title="Listen on Apple Music"
                  >
                    <AppleMusicIcon />
                    <span className="text-sm font-medium hidden sm:inline">Apple</span>
                  </a>
                </div>
              </div>

              {/* Comments Section */}
              {expandedComments.has(entry.id) && (
                <div className="mt-4 pt-3 border-t border-surface/50">
                  {/* Comment Input */}
                  <div className="flex gap-2 mb-3">
                    <input
                      type="text"
                      value={newComment[entry.id] || ''}
                      onChange={(e) => setNewComment(prev => ({ ...prev, [entry.id]: e.target.value }))}
                      placeholder="Add a comment..."
                      className="flex-1 bg-bg border border-surface rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-accent"
                      onKeyDown={(e) => {
                        if (e.key === 'Enter') {
                          handleSubmitComment(entry.id)
                        }
                      }}
                    />
                    <button
                      onClick={() => handleSubmitComment(entry.id)}
                      disabled={!newComment[entry.id]?.trim() || submittingComment === entry.id}
                      className="px-4 py-2 bg-accent text-bg rounded-lg text-sm font-medium hover:bg-accent/90 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                    >
                      {submittingComment === entry.id ? '...' : 'Post'}
                    </button>
                  </div>

                  {/* Comments List */}
                  <div className="space-y-3 max-h-60 overflow-y-auto">
                    {(comments[entry.id] || []).length === 0 ? (
                      <p className="text-text/50 text-sm text-center py-2">No comments yet. Be the first!</p>
                    ) : (
                      (comments[entry.id] || []).map((comment) => (
                        <div key={comment.id} className="flex gap-2">
                          {comment.user.image ? (
                            <Image
                              src={comment.user.image}
                              alt={comment.user.username || comment.user.name || ''}
                              width={28}
                              height={28}
                              className="rounded-full flex-shrink-0"
                              style={{ aspectRatio: '1/1', objectFit: 'cover' }}
                            />
                          ) : (
                            <div className="w-7 h-7 rounded-full bg-accent/30 flex items-center justify-center text-xs font-bold text-accent flex-shrink-0">
                              {(comment.user.username || comment.user.name || comment.user.email).charAt(0).toUpperCase()}
                            </div>
                          )}
                          <div className="flex-1 min-w-0">
                            <div className="flex items-baseline gap-2">
                              <span className="font-medium text-sm text-accent">
                                {comment.user.username || comment.user.name || comment.user.email.split('@')[0]}
                              </span>
                              <span className="text-xs text-text/40">
                                {new Date(comment.createdAt).toLocaleDateString()}
                              </span>
                            </div>
                            <p className="text-sm text-text/80 break-words">{comment.content}</p>
                          </div>
                        </div>
                      ))
                    )}
                  </div>
                </div>
              )}

              {entry.mentions.length > 0 && (
                <div className="mt-3 pt-3 border-t border-surface">
                  <div className="flex items-center gap-2 mb-2">
                    <span className="text-base">📣</span>
                    <span className="text-sm text-text/60">
                      {entry.isOwnEntry ? 'You mentioned' : `${entry.user.username || entry.user.name || entry.user.email.split('@')[0]} mentioned`}
                    </span>
                  </div>
                  <div className="flex flex-wrap gap-2">
                    {entry.mentions.map((mention) => (
                      <Link
                        key={mention.id}
                        href={`/user/${encodeURIComponent(mention.user.username || mention.user.email || mention.user.id)}`}
                        className="inline-flex items-center gap-1.5 px-2.5 py-1 bg-accent/15 hover:bg-accent/25 rounded-full transition-colors"
                      >
                        {mention.user.image ? (
                          <Image
                            src={mention.user.image}
                            alt={mention.user.username || mention.user.name || ''}
                            width={18}
                            height={18}
                            className="rounded-full"
                            style={{ aspectRatio: '1/1', objectFit: 'cover' }}
                          />
                        ) : (
                          <div className="w-[18px] h-[18px] rounded-full bg-accent/30 flex items-center justify-center text-[10px] font-bold text-accent">
                            {(mention.user.username || mention.user.name || mention.user.email).charAt(0).toUpperCase()}
                          </div>
                        )}
                        <span className="text-accent text-sm font-medium">
                          @{mention.user.username || mention.user.name || mention.user.email.split('@')[0]}
                        </span>
                      </Link>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>
        ))}
      </div>

      {/* Infinite scroll trigger */}
      {hasMore && (
        <div ref={setLoadMoreRef} className="py-8 flex justify-center">
          {loadingMore ? (
            <div className="flex flex-col items-center gap-2">
              <ThemeBird size={48} state="bounce" className="animate-bounce" />
              <p className="text-text/60 text-sm">Loading more...</p>
            </div>
          ) : (
            <div className="h-4" /> // Spacer for intersection observer
          )}
        </div>
      )}

      {!hasMore && entries.length > 0 && (
        <div className="py-8 text-center">
          <p className="text-text/40 text-sm">You've reached the end of your feed</p>
        </div>
      )}

      {/* Song Share Card Modal */}
      {sharingEntry && (
        <SongShareCard
          songTitle={sharingEntry.songTitle}
          artist={sharingEntry.artist}
          albumArt={sharingEntry.albumArt}
          albumTitle={sharingEntry.albumTitle}
          date={sharingEntry.date}
          username={sharingEntry.user.username || sharingEntry.user.name || sharingEntry.user.email.split('@')[0]}
          onClose={() => setSharingEntry(null)}
        />
      )}
    </div>
  )
}
