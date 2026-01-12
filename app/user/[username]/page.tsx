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
  const [showFriendsModal, setShowFriendsModal] = useState(false)
  const [friends, setFriends] = useState<Array<{ id: string; username: string | null; name: string | null; image: string | null }>>([])
  const [loadingFriends, setLoadingFriends] = useState(false)

  useEffect(() => {
    fetchPublicProfile()
    if (isLoaded && currentUser) {
      fetchFriendshipStatus()
    }
  }, [username, isLoaded, currentUser])

  useEffect(() => {
    if (showFriendsModal && profile) {
      fetchFriends()
    }
  }, [showFriendsModal, profile])

  const fetchFriends = async () => {
    if (!profile) return
    setLoadingFriends(true)
    try {
      const res = await fetch(`/api/users/${username}/friends`)
      if (res.ok) {
        const data = await res.json()
        setFriends(data.friends || [])
      }
    } catch (error) {
      console.error('Error fetching friends:', error)
    } finally {
      setLoadingFriends(false)
    }
  }

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
              <div className="text-sm text-text/60">Entries</div>
            </div>
            <button 
              onClick={() => setShowFriendsModal(true)}
              className="text-center hover:bg-accent/10 px-4 py-2 -my-2 rounded-lg transition-colors"
            >
              <div className="text-2xl font-bold">{profile.stats.friendsCount}</div>
              <div className="text-sm text-text/60">Friends</div>
            </button>
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

          {/* ADD FRIEND BUTTON - ALWAYS VISIBLE */}
          <div className="mb-6 mt-6">
            {!currentUser ? (
              // Not logged in - show sign in prompt
              <Link
                href="/home"
                className="block w-full px-6 py-4 bg-blue-500 text-white font-bold rounded-xl hover:bg-blue-600 transition-colors text-center text-lg shadow-lg"
              >
                👤 Sign in to Add Friend
              </Link>
            ) : friendshipStatus?.isOwnProfile ? (
              // This is the user's own profile - show edit button
              <Link
                href="/profile/edit"
                className="block w-full px-6 py-4 bg-gray-600 text-white font-bold rounded-xl hover:bg-gray-700 transition-colors text-center text-lg"
              >
                ✏️ Edit Your Profile
              </Link>
            ) : friendshipStatus?.isFriend ? (
              // Already friends
              <div className="w-full px-6 py-4 bg-green-500 text-white font-bold rounded-xl text-center text-lg">
                ✅ Already Friends!
              </div>
            ) : friendshipStatus?.hasPendingRequest && friendshipStatus.requestDirection === 'sent' ? (
              // Request already sent
              <div className="w-full px-6 py-4 bg-yellow-500 text-black font-bold rounded-xl text-center text-lg">
                ⏳ Friend Request Sent
              </div>
            ) : friendshipStatus?.hasPendingRequest && friendshipStatus.requestDirection === 'received' ? (
              // They sent us a request
              <Link
                href="/"
                className="block w-full px-6 py-4 bg-purple-500 text-white font-bold rounded-xl hover:bg-purple-600 transition-colors text-center text-lg shadow-lg"
              >
                🎉 Accept Their Friend Request!
              </Link>
            ) : (
              // Can add friend OR still loading - show the button anyway!
              <button
                onClick={sendFriendRequest}
                disabled={sendingRequest}
                className="w-full px-6 py-4 bg-blue-500 text-white font-bold rounded-xl hover:bg-blue-600 transition-colors disabled:bg-blue-300 disabled:cursor-wait text-center text-lg shadow-lg flex items-center justify-center gap-3"
              >
                {sendingRequest ? (
                  <>
                    <svg className="animate-spin h-6 w-6" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"/>
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"/>
                    </svg>
                    Sending Request...
                  </>
                ) : (
                  <>
                    <span className="text-2xl">➕</span>
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

      {/* Friends Modal */}
      {showFriendsModal && (
        <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50 p-4">
          <div className="bg-surface rounded-xl w-full max-w-md max-h-[80vh] overflow-hidden">
            <div className="flex items-center justify-between p-4 border-b border-bg">
              <h3 className="text-lg font-bold">{profile.name || profile.username}'s Friends</h3>
              <button
                onClick={() => setShowFriendsModal(false)}
                className="p-2 hover:bg-bg rounded-lg transition-colors"
              >
                ✕
              </button>
            </div>
            <div className="overflow-y-auto max-h-96 p-4">
              {loadingFriends ? (
                <div className="text-center py-8 text-text/60">Loading friends...</div>
              ) : friends.length === 0 ? (
                <div className="text-center py-8 text-text/60">No friends yet</div>
              ) : (
                <div className="space-y-3">
                  {friends.map((friend) => (
                    <Link
                      key={friend.id}
                      href={`/user/${friend.username || friend.id}`}
                      onClick={() => setShowFriendsModal(false)}
                      className="flex items-center gap-3 p-3 bg-bg rounded-lg hover:bg-accent/10 transition-colors"
                    >
                      {friend.image ? (
                        <Image
                          src={friend.image}
                          alt={friend.name || 'User'}
                          width={40}
                          height={40}
                          className="rounded-full"
                        />
                      ) : (
                        <div className="w-10 h-10 rounded-full bg-accent/20 flex items-center justify-center text-accent font-bold">
                          {(friend.name || friend.username || '?').charAt(0).toUpperCase()}
                        </div>
                      )}
                      <div>
                        <div className="font-semibold">{friend.name || friend.username}</div>
                        {friend.username && (
                          <div className="text-sm text-text/60">@{friend.username}</div>
                        )}
                      </div>
                    </Link>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
