'use client'

import { useState, useEffect } from 'react'
import { useUser } from '@clerk/nextjs'
import Image from 'next/image'
import Link from 'next/link'
import ThemeBird from './ThemeBird'
import InviteFriendsCTA from './InviteFriendsCTA'
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
  const [expandedComments, setExpandedComments] = useState<Set<string>>(new Set())
  const [comments, setComments] = useState<Record<string, Comment[]>>({})
  const [newComment, setNewComment] = useState<Record<string, string>>({})
  const [submittingComment, setSubmittingComment] = useState<string | null>(null)
  const [vibing, setVibing] = useState<string | null>(null)

  useEffect(() => {
    fetchFeed()
    trackTabView('feed')
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
          heading="Your flock is quiet"
          subtext="Invite friends to see their songs of the day in your feed!"
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
              className="block bg-accent/10 border-b border-accent/20 p-3 sm:p-4 hover:bg-accent/15 transition-colors cursor-pointer"
            >
              <div className="flex items-center gap-3">
                {entry.user.image ? (
                  <Image
                    src={entry.user.image}
                    alt={entry.user.username || entry.user.name || entry.user.email}
                    width={40}
                    height={40}
                    className="rounded-full border-2 border-accent"
                    style={{ aspectRatio: '1/1', objectFit: 'cover', objectPosition: 'center' }}
                  />
                ) : (
                  <div className="w-10 h-10 rounded-full bg-accent/30 border-2 border-accent flex items-center justify-center text-base font-bold text-accent">
                    {(entry.user.username || entry.user.name || entry.user.email).charAt(0).toUpperCase()}
                  </div>
                )}
                <div className="flex-1 min-w-0">
                  <div className="font-bold text-accent text-sm sm:text-base truncate">
                    {entry.user.username || entry.user.name || entry.user.email.split('@')[0]}
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

                {/* Listen on Spotify Button */}
                <a
                  href={`https://open.spotify.com/track/${entry.trackId}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center gap-2 px-3 py-2 rounded-lg bg-[#1DB954]/20 text-[#1DB954] hover:bg-[#1DB954]/30 transition-all ml-auto"
                >
                  <SpotifyIcon />
                  <span className="text-sm font-medium hidden sm:inline">Listen</span>
                </a>
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
                  <div className="text-sm text-text/60 mb-2">Mentioned:</div>
                  <div className="flex flex-wrap gap-2">
                    {entry.mentions.map((mention) => (
                      <span key={mention.id} className="text-accent text-sm">
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
