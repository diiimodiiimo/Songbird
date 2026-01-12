'use client'

import { useParams, useRouter } from 'next/navigation'
import { useState, useEffect } from 'react'
import { useUser } from '@clerk/nextjs'
import Image from 'next/image'
import Link from 'next/link'

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
      // Use username if available, otherwise fall back to email
      const identifier = profile.username || profile.email
      const res = await fetch('/api/friends/requests', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ receiverUsername: identifier }),
      })

      const data = await res.json()
      if (res.ok) {
        setMessage({ type: 'success', text: `Friend request sent to ${profile.name || profile.username}!` })
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
          <Image src="/SongBirdlogo.png" alt="SongBird" width={64} height={64} className="object-contain mx-auto mb-4" />
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
            <Link href="/" className="text-lg sm:text-xl font-bold text-primary flex items-center gap-2">
              <Image src="/SongBirdlogo.png" alt="SongBird" width={24} height={24} className="object-contain" />
              SongBird
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

          {/* Friend Action Button - Inside Card */}
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

          {/* Show Add Friend section */}
          <div className="mb-6">
            {!currentUser ? (
              // Not logged in - show sign in prompt
              <Link
                href="/home"
                className="w-full px-6 py-3 bg-accent text-bg font-semibold rounded-lg hover:bg-accent/90 transition-colors flex items-center justify-center gap-2"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M18 9v3m0 0v3m0-3h3m-3 0h-3m-2-5a4 4 0 11-8 0 4 4 0 018 0zM3 20a6 6 0 0112 0v1H3v-1z" />
                </svg>
                Sign in to Add Friend
              </Link>
            ) : friendshipStatus?.isOwnProfile ? (
              // This is the user's own profile - show edit button
              <Link
                href="/profile/edit"
                className="w-full px-6 py-3 bg-surface border border-text/20 text-text font-medium rounded-lg hover:bg-surface/80 transition-colors flex items-center justify-center gap-2"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                </svg>
                Edit Profile
              </Link>
            ) : friendshipStatus?.isFriend ? (
              // Already friends
              <div className="w-full px-6 py-3 bg-accent/20 border border-accent/30 text-accent font-medium rounded-lg text-center flex items-center justify-center gap-2">
                <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-2 15l-5-5 1.41-1.41L10 14.17l7.59-7.59L19 8l-9 9z"/>
                </svg>
                Friends
              </div>
            ) : friendshipStatus?.hasPendingRequest && friendshipStatus.requestDirection === 'sent' ? (
              // Request already sent
              <div className="w-full px-6 py-3 bg-surface border border-text/20 text-text/60 font-medium rounded-lg text-center">
                ⏳ Friend Request Sent
              </div>
            ) : friendshipStatus?.hasPendingRequest && friendshipStatus.requestDirection === 'received' ? (
              // They sent us a request
              <div className="space-y-2">
                <p className="text-sm text-text/70 text-center">This user wants to be your friend!</p>
                <Link
                  href="/"
                  className="block w-full px-6 py-3 bg-accent text-bg font-medium rounded-lg hover:bg-accent/90 transition-colors text-center"
                >
                  View & Accept Request
                </Link>
              </div>
            ) : !friendshipStatus ? (
              // Still loading friendship status
              <div className="w-full px-6 py-3 bg-surface/50 border border-text/10 text-text/40 font-medium rounded-lg text-center animate-pulse">
                Loading...
              </div>
            ) : (
              // Can add friend
              <button
                onClick={sendFriendRequest}
                disabled={sendingRequest}
                className="w-full px-6 py-3 bg-accent text-bg font-semibold rounded-lg hover:bg-accent/90 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
              >
                {sendingRequest ? (
                  <>
                    <svg className="animate-spin h-5 w-5" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"/>
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"/>
                    </svg>
                    Sending...
                  </>
                ) : (
                  <>
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M18 9v3m0 0v3m0-3h3m-3 0h-3m-2-5a4 4 0 11-8 0 4 4 0 018 0zM3 20a6 6 0 0112 0v1H3v-1z" />
                    </svg>
                    Add Friend
                  </>
                )}
              </button>
            )}
          </div>

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
      </div>
    </div>
  )
}
