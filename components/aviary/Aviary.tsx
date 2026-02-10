'use client'

import { useState, useMemo, useEffect } from 'react'
import { AviaryBird } from './AviaryBird'
import { SongPreviewModal } from './SongPreviewModal'
import { ContactsDiscovery } from './ContactsDiscovery'

interface AviaryProps {
  data: AviaryData
}

const VIEWED_ENTRIES_KEY = 'aviary_viewed_entries'

export function Aviary({ data }: AviaryProps) {
  const [selectedBird, setSelectedBird] = useState<AviaryBirdType | null>(null)
  const [searchQuery, setSearchQuery] = useState('')
  const [viewedEntryIds, setViewedEntryIds] = useState<Set<string>>(new Set())

  const { currentUser, friends } = data

  // Load viewed entries from localStorage on mount
  useEffect(() => {
    if (typeof window !== 'undefined') {
      const stored = localStorage.getItem(VIEWED_ENTRIES_KEY)
      if (stored) {
        try {
          const parsed = JSON.parse(stored) as string[]
          setViewedEntryIds(new Set(parsed))
        } catch (e) {
          console.error('Error loading viewed entries:', e)
        }
      }
    }
  }, [])

  // Mark an entry as viewed
  const markAsViewed = (entryId: string) => {
    if (typeof window !== 'undefined') {
      const newViewed = new Set(viewedEntryIds)
      newViewed.add(entryId)
      setViewedEntryIds(newViewed)
      localStorage.setItem(VIEWED_ENTRIES_KEY, JSON.stringify(Array.from(newViewed)))
    }
  }

  const handleBirdTap = (bird: AviaryBirdType) => {
    setSelectedBird(bird)
    // Mark the song as viewed when user taps on it
    if (bird.latestSong) {
      markAsViewed(bird.latestSong.id)
    }
  }

  const handleCloseModal = () => {
    // Mark song as viewed when modal closes
    if (selectedBird?.latestSong) {
      markAsViewed(selectedBird.latestSong.id)
    }
    setSelectedBird(null)
  }

  const handlePlayOnSpotify = (spotifyTrackId: string) => {
    // Open Spotify track - tries app first, falls back to web
    window.open(`https://open.spotify.com/track/${spotifyTrackId}`, '_blank')
  }

  // Group friends into unread and read/others
  const { unreadFriends, otherFriends } = useMemo(() => {
    const unread: AviaryBirdType[] = []
    const others: AviaryBirdType[] = []

    let filtered = friends
    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase().trim()
      filtered = friends.filter(friend => 
        friend.user.username.toLowerCase().includes(query) ||
        friend.user.name?.toLowerCase().includes(query)
      )
    }

    filtered.forEach(friend => {
      // Friend has unread song if they have a latest song that hasn't been viewed
      const hasUnreadSong = friend.latestSong && !viewedEntryIds.has(friend.latestSong.id)
      
      if (hasUnreadSong) {
        unread.push(friend)
      } else {
        others.push(friend)
      }
    })

    // Sort unread by most recent activity
    unread.sort((a, b) => {
      if (a.lastActivityDate && b.lastActivityDate) {
        return new Date(b.lastActivityDate).getTime() - new Date(a.lastActivityDate).getTime()
      }
      if (a.lastActivityDate) return -1
      if (b.lastActivityDate) return 1
      return 0
    })

    // Sort others by activity tier and recency
    others.sort((a, b) => {
      const tierPriority: Record<string, number> = {
        today: 0,
        thisWeek: 1,
        thisMonth: 2,
        inactive: 3,
      }
      const tierDiff = tierPriority[a.activityTier] - tierPriority[b.activityTier]
      if (tierDiff !== 0) return tierDiff
      
      if (a.lastActivityDate && b.lastActivityDate) {
        return new Date(b.lastActivityDate).getTime() - new Date(a.lastActivityDate).getTime()
      }
      if (a.lastActivityDate) return -1
      if (b.lastActivityDate) return 1
      return 0
    })

    return { unreadFriends: unread, otherFriends: others }
  }, [friends, searchQuery, viewedEntryIds])

  return (
    <div className="flex flex-col min-h-[calc(100vh-180px)]">
      {/* Header */}
      <header className="text-center mb-6 px-4">
        <h1 className="text-2xl sm:text-3xl font-bold text-text mb-2">The Aviary</h1>
        <p className="text-text-muted text-sm sm:text-base">See what your flock is listening to</p>
      </header>

      {/* Search/Filter Bar */}
      {friends.length > 0 && (
        <div className="px-4 mb-6">
          <div className="relative max-w-md mx-auto">
            <input
              type="text"
              placeholder="Search friends..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full px-4 py-2 pl-10 bg-surface border border-text/20 rounded-lg text-text placeholder:text-text/40 focus:outline-none focus:ring-2 focus:ring-primary/50"
            />
            <svg
              className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-text/40"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
            </svg>
            {searchQuery && (
              <button
                onClick={() => setSearchQuery('')}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-text/40 hover:text-text transition-colors"
                aria-label="Clear search"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            )}
          </div>
        </div>
      )}

      {/* Row-based layout */}
      <div className="flex-1 space-y-6 px-4 pb-6">
        {/* Unread Songs Row */}
        {unreadFriends.length > 0 && (
          <div>
            <div className="flex items-center gap-2 mb-3">
              <h2 className="text-lg font-semibold text-text">New Songs</h2>
              <span className="px-2 py-0.5 bg-primary/20 text-primary text-xs font-medium rounded-full">
                {unreadFriends.length}
              </span>
            </div>
            <div className="flex gap-4 overflow-x-auto pb-2 scrollbar-hide">
              {unreadFriends.map((friend) => (
                <div key={friend.user.id} className="flex-shrink-0">
                  <AviaryBird
                    bird={friend}
                    size="medium"
                    onTap={() => handleBirdTap(friend)}
                  />
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Other Friends Row */}
        {otherFriends.length > 0 && (
          <div>
            <div className="flex items-center gap-2 mb-3">
              <h2 className="text-lg font-semibold text-text-muted">Your Flock</h2>
              <span className="text-text-muted text-sm">
                {otherFriends.length} {otherFriends.length === 1 ? 'friend' : 'friends'}
              </span>
            </div>
            <div className="flex gap-4 overflow-x-auto pb-2 scrollbar-hide">
              {otherFriends.map((friend) => (
                <div key={friend.user.id} className="flex-shrink-0">
                  <AviaryBird
                    bird={friend}
                    size="medium"
                    onTap={() => handleBirdTap(friend)}
                  />
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Empty states */}
        {unreadFriends.length === 0 && otherFriends.length === 0 && friends.length > 0 && (
          <div className="text-center py-12">
            <p className="text-text-muted">No friends match your search</p>
          </div>
        )}

        {friends.length === 0 && (
          <EmptyAviary />
        )}

        {/* Contacts Discovery Section */}
        <ContactsDiscovery />
      </div>

      {/* Friend count */}
      {friends.length > 0 && (
        <div className="text-center py-4">
          <span className="text-text-muted text-sm">
            {searchQuery 
              ? `${unreadFriends.length + otherFriends.length} of ${friends.length} friends`
              : `${friends.length} friend${friends.length !== 1 ? 's' : ''} in your flock`
            }
          </span>
        </div>
      )}

      {/* Song preview modal */}
      {selectedBird && (
        <SongPreviewModal
          bird={selectedBird}
          onClose={handleCloseModal}
          onPlayOnSpotify={handlePlayOnSpotify}
        />
      )}
    </div>
  )
}






