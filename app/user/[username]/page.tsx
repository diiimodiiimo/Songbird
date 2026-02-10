'use client'

import { useParams, useRouter } from 'next/navigation'
import { useState, useEffect } from 'react'
import { useUser } from '@clerk/nextjs'
import Image from 'next/image'
import Link from 'next/link'
import ThemeBird, { ThemeBirdLogo } from '@/components/ThemeBird'
import ReportModal from '@/components/ReportModal'

// Force dynamic rendering for this page
export const dynamic = 'force-dynamic'

interface PublicProfile {
  username: string
  name: string
  email: string
  image: string | null
  bio: string | null
  favoriteArtists: string[]
  favoriteSongs: Array<{ songTitle: string; artist: string }>
  stats: {
    totalEntries: number
    friendsCount: number
  }
}

interface FriendshipStatus {
  isOwnProfile: boolean
  isFriend: boolean
  hasPendingRequest: boolean
  requestDirection: 'sent' | 'received' | null
  requestId?: string
}

export default function UserProfilePage() {
  const params = useParams()
  const router = useRouter()
  const { user: currentUser, isLoaded } = useUser()
  const username = params.username as string
  const [profile, setProfile] = useState<PublicProfile | null>(null)
  const [friendshipStatus, setFriendshipStatus] = useState<FriendshipStatus | null>(null)
  const [loading, setLoading] = useState(true)
  const [sendingRequest, setSendingRequest] = useState(false)
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null)
  const [isBlocked, setIsBlocked] = useState(false)
  const [showReportModal, setShowReportModal] = useState(false)
  const [blocking, setBlocking] = useState(false)

  useEffect(() => {
    fetchPublicProfile()
    if (isLoaded && currentUser) {
      fetchFriendshipStatus()
    }
  }, [username, isLoaded, currentUser])

  const fetchPublicProfile = async () => {
    try {
      const res = await fetch(`/api/users/${username}`)
      if (res.ok) {
        const data = await res.json()
        setProfile(data)
      }
    } catch (error) {
      console.error('Error fetching profile:', error)
    } finally {
      setLoading(false)
    }
  }

  const fetchFriendshipStatus = async () => {
    try {
      const res = await fetch(`/api/users/${username}/friendship`)
      if (res.ok) {
        const data = await res.json()
        setFriendshipStatus(data)
      }
    } catch (error) {
      console.error('Error fetching friendship status:', error)
    }
  }

  const sendFriendRequest = async () => {
    if (!profile) return

    setSendingRequest(true)
    setMessage(null)

    try {
      const res = await fetch('/api/friends/requests', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ receiverUsername: profile.username }),
      })

      const data = await res.json()
      if (res.ok) {
        setMessage({ type: 'success', text: `Friend request sent to @${profile.username}!` })
        fetchFriendshipStatus()
      } else {
        setMessage({ type: 'error', text: data.error || 'Failed to send friend request' })
      }
    } catch (error) {
      setMessage({ type: 'error', text: 'Failed to send friend request' })
    } finally {
      setSendingRequest(false)
    }
  }

  const handleBlock = async () => {
    if (!profile || blocking) return

    setBlocking(true)
    setMessage(null)

    try {
      const res = await fetch('/api/users/block', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ blockedUsername: profile.username }),
      })

      const data = await res.json()
      if (res.ok) {
        setIsBlocked(true)
        setMessage({ type: 'success', text: `@${profile.username} has been blocked` })
        fetchFriendshipStatus() // Refresh to update friend status
      } else {
        setMessage({ type: 'error', text: data.error || 'Failed to block user' })
      }
    } catch (error) {
      setMessage({ type: 'error', text: 'Failed to block user' })
    } finally {
      setBlocking(false)
    }
  }

  const handleUnblock = async () => {
    if (!profile || blocking) return

    setBlocking(true)
    setMessage(null)

    try {
      const res = await fetch(`/api/users/block?username=${profile.username}`, {
        method: 'DELETE',
      })

      if (res.ok) {
        setIsBlocked(false)
        setMessage({ type: 'success', text: `@${profile.username} has been unblocked` })
      } else {
        const data = await res.json()
        setMessage({ type: 'error', text: data.error || 'Failed to unblock user' })
      }
    } catch (error) {
      setMessage({ type: 'error', text: 'Failed to unblock user' })
    } finally {
      setBlocking(false)
    }
  }

  const handleReport = async (reason: string, description?: string) => {
    if (!profile) return

    try {
      const res = await fetch('/api/reports', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          reportedUsername: profile.username,
          type: 'user',
          reason,
          description,
        }),
      })

      if (!res.ok) {
        const data = await res.json()
        throw new Error(data.error || 'Failed to submit report')
      }
    } catch (error) {
      console.error('Error reporting user:', error)
      throw error
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-bg text-text flex items-center justify-center">
        <div>Loading profile...</div>
      </div>
    )
  }

  if (!profile) {
    return (
      <div className="min-h-screen bg-bg text-text flex items-center justify-center">
        <div className="text-center">
          <div className="mx-auto mb-4 flex justify-center">
            <ThemeBird size={64} />
          </div>
          <div className="text-xl mb-2">User not found</div>
          <Link href="/" className="text-accent hover:underline">
            Go back home
          </Link>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-bg text-text">
      {/* Header */}
      <nav className="bg-card border-b border-primary/20 px-3 py-3 sm:px-4 sm:py-4">
        <div className="container mx-auto flex justify-between items-center">
          <div className="flex items-center gap-3">
            <button
              onClick={() => router.back()}
              className="p-2 rounded-lg bg-surface text-text hover:bg-surface/80 transition-colors"
              aria-label="Go back"
            >
              <svg
                xmlns="http://www.w3.org/2000/svg"
                width="20"
                height="20"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                <path d="m12 19-7-7 7-7" />
                <path d="M19 12H5" />
              </svg>
            </button>
            <Link href="/" className="flex items-center">
              <ThemeBirdLogo size={24} textSize="md" />
            </Link>
          </div>
        </div>
      </nav>

      {/* Profile Content */}
      <div className="max-w-2xl mx-auto px-3 sm:px-4 py-6 sm:py-12">
        {/* Profile Header - Instagram Style */}
        <div className="bg-surface rounded-xl p-6 sm:p-8 mb-6">
          <div className="flex flex-col items-center gap-4 mb-6">
            {/* Profile Picture */}
            {profile.image ? (
              <Image
                src={profile.image}
                alt={profile.username}
                width={120}
                height={120}
                className="rounded-full border-4 border-accent"
                style={{ aspectRatio: '1/1', objectFit: 'cover', objectPosition: 'center' }}
              />
            ) : (
              <div className="w-32 h-32 rounded-full bg-accent/20 border-4 border-accent flex items-center justify-center text-5xl font-bold text-accent">
                {profile.username.charAt(0).toUpperCase()}
              </div>
            )}

            {/* Username and Name */}
            <div className="text-center">
              <h1 className="text-2xl font-bold mb-1">{profile.name || profile.username}</h1>
              <p className="text-text/60">@{profile.username}</p>
            </div>
          </div>

          {/* Stats Row */}
          <div className="flex justify-center gap-8 mb-6 pb-6 border-b border-bg">
            <div className="text-center">
              <div className="text-2xl font-bold">{profile.stats.totalEntries}</div>
              <div className="text-sm text-text/60">Songs</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold">{profile.stats.friendsCount}</div>
              <div className="text-sm text-text/60">Friends</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold">{profile.favoriteArtists.length}</div>
              <div className="text-sm text-text/60">Fav Artists</div>
            </div>
          </div>

          {/* Bio */}
          {profile.bio && (
            <div className="mb-6">
              <p className="text-text/90">{profile.bio}</p>
            </div>
          )}

          {/* Favorite Artists */}
          {profile.favoriteArtists.length > 0 && (
            <div className="mb-6">
              <h3 className="text-sm font-semibold text-text/80 mb-3">Favorite Artists</h3>
              <div className="flex flex-wrap gap-2">
                {profile.favoriteArtists.map((artist) => (
                  <span
                    key={artist}
                    className="px-3 py-1.5 bg-accent/20 text-accent rounded-full text-sm"
                  >
                    {artist}
                  </span>
                ))}
              </div>
            </div>
          )}

          {/* Favorite Songs */}
          {profile.favoriteSongs.length > 0 && (
            <div>
              <h3 className="text-sm font-semibold text-text/80 mb-3">Favorite Songs</h3>
              <div className="space-y-2">
                {profile.favoriteSongs.map((song) => (
                  <div
                    key={`${song.songTitle}-${song.artist}`}
                    className="bg-bg rounded-lg p-3"
                  >
                    <div className="font-semibold text-sm">{song.songTitle}</div>
                    <div className="text-xs text-text/60">{song.artist}</div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Friend Action Button */}
        {message && (
          <div
            className={`mb-4 p-3 rounded-lg text-sm ${
              message.type === 'success'
                ? 'bg-green-900/30 text-green-300 border border-green-500/50'
                : 'bg-red-900/30 text-red-300 border border-red-500/50'
            }`}
          >
            {message.text}
          </div>
        )}

        {friendshipStatus && !friendshipStatus.isOwnProfile && (
          <div className="space-y-3">
            {friendshipStatus.isFriend ? (
              <div className="w-full px-6 py-3 bg-accent/20 border border-accent/30 text-accent font-medium rounded-lg text-center">
                ✓ Friends
              </div>
            ) : friendshipStatus.hasPendingRequest && friendshipStatus.requestDirection === 'sent' ? (
              <div className="w-full px-6 py-3 bg-surface border border-text/20 text-text/60 font-medium rounded-lg text-center">
                Friend Request Sent
              </div>
            ) : friendshipStatus.hasPendingRequest && friendshipStatus.requestDirection === 'received' ? (
              <div className="space-y-2">
                <p className="text-sm text-text/70 text-center">You have a pending friend request from this user</p>
                <Link
                  href="/"
                  className="block w-full px-6 py-3 bg-accent text-bg font-medium rounded-lg hover:bg-accent/90 transition-colors text-center"
                >
                  View Requests
                </Link>
              </div>
            ) : (
              <button
                onClick={sendFriendRequest}
                disabled={sendingRequest}
                className="w-full px-6 py-3 bg-accent text-bg font-medium rounded-lg hover:bg-accent/90 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {sendingRequest ? 'Sending...' : 'Add Friend'}
              </button>
            )}

            {/* Block/Report Actions */}
            <div className="flex gap-2 pt-2 border-t border-text/10">
              {isBlocked ? (
                <button
                  onClick={handleUnblock}
                  disabled={blocking}
                  className="flex-1 px-4 py-2 bg-surface border border-text/20 text-text rounded-lg hover:bg-surface/80 transition-colors disabled:opacity-50 text-sm"
                >
                  {blocking ? 'Unblocking...' : 'Unblock User'}
                </button>
              ) : (
                <button
                  onClick={handleBlock}
                  disabled={blocking}
                  className="flex-1 px-4 py-2 bg-surface border border-text/20 text-text rounded-lg hover:bg-surface/80 transition-colors disabled:opacity-50 text-sm"
                >
                  {blocking ? 'Blocking...' : 'Block User'}
                </button>
              )}
              <button
                onClick={() => setShowReportModal(true)}
                className="flex-1 px-4 py-2 bg-red-900/20 border border-red-500/30 text-red-400 rounded-lg hover:bg-red-900/30 transition-colors text-sm"
              >
                Report
              </button>
            </div>
          </div>
        )}

        <ReportModal
          isOpen={showReportModal}
          onClose={() => setShowReportModal(false)}
          type="user"
          reportedUsername={profile?.username}
          onReport={handleReport}
        />
      </div>
    </div>
  )
}
