'use client'

import { useState, useEffect } from 'react'
import { useUser } from '@clerk/nextjs'
import { useRouter } from 'next/navigation'
import Image from 'next/image'
import Link from 'next/link'

interface Friend {
  id: string
  email: string
  name: string | null
  username: string | null
  image: string | null
  bio?: string
}

export default function ProfileTab({ onNavigateToAddEntry, onBack }: { onNavigateToAddEntry?: () => void; onBack?: () => void }) {
  const { user, isLoaded } = useUser()
  const router = useRouter()
  const [username, setUsername] = useState('')
  const [profileImage, setProfileImage] = useState('')
  const [bio, setBio] = useState('')
  const [selectedArtists, setSelectedArtists] = useState<string[]>([])
  const [selectedSongs, setSelectedSongs] = useState<Array<{ songTitle: string; artist: string }>>([])
  const [showAccountSection, setShowAccountSection] = useState(false)
  const [showFriendsSection, setShowFriendsSection] = useState(false)
  const [friends, setFriends] = useState<Friend[]>([])
  const [selectedFriend, setSelectedFriend] = useState<Friend | null>(null)
  const [loading, setLoading] = useState(false)
  const [loadingProfile, setLoadingProfile] = useState(true)
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null)
  const [entryCount, setEntryCount] = useState(0)
  const [showSettings, setShowSettings] = useState(false)
  const [theatricsEnabled, setTheatricsEnabled] = useState(() => {
    // Load from localStorage
    if (typeof window !== 'undefined') {
      return localStorage.getItem('theatricsEnabled') === 'true'
    }
    return false
  })

  useEffect(() => {
    // Save to localStorage whenever it changes
    if (typeof window !== 'undefined') {
      localStorage.setItem('theatricsEnabled', String(theatricsEnabled))
    }
  }, [theatricsEnabled])

  useEffect(() => {
    if (isLoaded && user) {
      fetchProfile()
      fetchFriends()
      fetchEntryCount()
    }
  }, [isLoaded, user])

  const fetchEntryCount = async () => {
    if (!user || !isLoaded) return
    try {
      // Fetch entries with excludeImages to get count efficiently
      // We'll count by fetching pages until hasMore is false
      let count = 0
      let page = 1
      let hasMore = true
      
      while (hasMore && page <= 10) { // Limit to 10 pages (10,000 entries max)
        const res = await fetch(`/api/entries?page=${page}&pageSize=1000&excludeImages=true`)
        const data = await res.json()
        if (res.ok && data.entries) {
          count += data.entries.length
          hasMore = data.hasMore || false
          page++
        } else {
          break
        }
      }
      setEntryCount(count)
    } catch (error) {
      console.error('Failed to fetch entry count:', error)
    }
  }

  // Refresh profile when component becomes visible (e.g., returning from edit page)
  useEffect(() => {
    if (isLoaded && user && typeof window !== 'undefined') {
      const handleFocus = () => {
        fetchProfile()
      }
      window.addEventListener('focus', handleFocus)
      return () => window.removeEventListener('focus', handleFocus)
    }
  }, [isLoaded, user])

  const fetchProfile = async () => {
    if (!user || !isLoaded) return
    setLoadingProfile(true)
    try {
      const res = await fetch('/api/profile')
      if (res.ok) {
        const data = await res.json()
        const user = data.user
        setUsername(user.username || user.name || '')
        setProfileImage(user.image || '')
        setBio(user.bio || '')
        setSelectedArtists(user.favoriteArtists || [])
        setSelectedSongs(user.favoriteSongs || [])
      }
    } catch (error) {
      console.error('Failed to fetch profile:', error)
    } finally {
      setLoadingProfile(false)
    }
  }

  const fetchFriends = async () => {
    try {
      const res = await fetch('/api/friends/list')
      if (res.ok) {
        const data = await res.json()
        setFriends(data.friends || [])
      }
    } catch (error) {
      console.error('Failed to fetch friends:', error)
    }
  }


  return (
    <div className="max-w-2xl mx-auto px-3 sm:px-4 py-4 sm:py-8 space-y-4 sm:space-y-6">
      {message && (
        <div
          className={`p-3 sm:p-4 rounded-lg text-sm sm:text-base ${
            message.type === 'success'
              ? 'bg-accent/20 text-accent border border-accent/30'
              : 'bg-red-900/20 text-red-400 border border-red-900/30'
          }`}
        >
          {message.text}
        </div>
      )}

      {loadingProfile ? (
        <div className="text-center py-16 text-text/60">Loading profile...</div>
      ) : (
        <>
          <div className="flex justify-end">
            <Link
              href="/profile/edit"
              className="p-2 bg-surface text-text border border-text/20 rounded-lg hover:bg-surface/80 transition-colors"
              aria-label="Edit Profile"
            >
              <svg 
                xmlns="http://www.w3.org/2000/svg" 
                width="24" 
                height="24" 
                viewBox="0 0 24 24" 
                fill="none" 
                stroke="currentColor" 
                strokeWidth="2" 
                strokeLinecap="round" 
                strokeLinejoin="round"
                className="text-text"
              >
                <path d="M12 20h9"></path>
                <path d="M16.5 3.5a2.121 2.121 0 0 1 3 3L7 19l-4 1 1-4L16.5 3.5z"></path>
              </svg>
            </Link>
          </div>

          {/* Profile View */}
          <section className="bg-surface rounded-xl p-8 space-y-6">
            {/* Avatar */}
            <div className="flex flex-col items-center gap-4">
              {profileImage ? (
                <Image
                  src={profileImage}
                  alt="Profile"
                  width={120}
                  height={120}
                  className="rounded-full border-4 border-accent"
                  style={{ aspectRatio: '1/1', objectFit: 'cover', objectPosition: 'center' }}
                />
              ) : (
                <div className="w-32 h-32 rounded-full bg-accent/20 border-4 border-accent flex items-center justify-center text-5xl font-bold text-accent">
                  {username.charAt(0).toUpperCase() || user?.emailAddresses[0]?.emailAddress?.charAt(0).toUpperCase() || '?'}
                </div>
              )}
            </div>

            {/* Username */}
            <div className="text-center">
              <h2 className="text-2xl font-bold mb-1">{username || 'Anonymous'}</h2>
              <p className="text-text/60">@{username || user?.emailAddresses[0]?.emailAddress?.split('@')[0] || 'user'}</p>
            </div>

            {/* Bio */}
            {bio && (
              <div className="bg-bg rounded-lg p-4 text-center">
                <p className="text-text/90">{bio}</p>
              </div>
            )}

            {/* Stats Row - entries, friends */}
            <div className="flex justify-center gap-8 py-4 border-y border-surface">
              <div className="text-center">
                <div className="text-2xl font-bold text-accent">{entryCount}</div>
                <div className="text-sm text-text/60">Entries</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-accent">{friends.length}</div>
                <div className="text-sm text-text/60">Friends</div>
              </div>
            </div>

            {/* Buttons: View Friends, Add Friend */}
            <div className="flex gap-3 justify-center">
              <button
                onClick={() => setShowFriendsSection(!showFriendsSection)}
                className="px-4 py-2 bg-accent/10 border border-accent/30 rounded-lg text-accent font-medium hover:bg-accent/20 transition-colors"
              >
                View Friends
              </button>
              <button
                onClick={() => {
                  // Navigate to Friends tab or show add friend modal
                  window.dispatchEvent(new CustomEvent('navigateToFriends'))
                }}
                className="px-4 py-2 bg-surface border border-text/20 rounded-lg text-text font-medium hover:bg-surface/80 transition-colors"
              >
                Add Friend
              </button>
            </div>

            {/* Favorite Artists - tag-style */}
            {selectedArtists.length > 0 && (
              <div>
                <h3 className="text-lg font-semibold mb-3 text-text/80">Favorite Artists</h3>
                <div className="flex flex-wrap gap-2">
                  {selectedArtists.map((artist) => (
                    <span key={artist} className="px-4 py-2 bg-accent/10 border border-accent/30 rounded-full text-accent font-medium">
                      {artist}
                    </span>
                  ))}
                </div>
              </div>
            )}

            {/* Favorite Songs - small cards */}
            {selectedSongs.length > 0 && (
              <div>
                <h3 className="text-lg font-semibold mb-3 text-text/80">Favorite Songs</h3>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                  {selectedSongs.map((song) => (
                    <div key={`${song.songTitle}-${song.artist}`} className="bg-bg rounded-lg p-3 border border-accent/20">
                      <div className="font-semibold text-sm">{song.songTitle}</div>
                      <div className="text-xs text-text/60">{song.artist}</div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Friends List (shown when stat clicked) */}
            {showFriendsSection && friends.length > 0 && (
              <div>
                <h3 className="text-lg font-semibold mb-3 text-text/80">Friends</h3>
                <div className="max-h-96 overflow-y-auto space-y-2 pr-2">
                  {friends.map((friend) => (
                    <Link
                      key={friend.id}
                      href={`/user/${friend.username || friend.email}`}
                      className="bg-bg rounded-lg p-3 flex items-center gap-3 hover:bg-accent/5 border border-transparent hover:border-accent/30 transition-all group"
                    >
                      {friend.image ? (
                        <Image
                          src={friend.image}
                          alt={friend.name || 'Friend'}
                          width={48}
                          height={48}
                          className="rounded-full object-cover flex-shrink-0"
                        />
                      ) : (
                        <div className="w-12 h-12 rounded-full bg-accent/20 flex items-center justify-center text-accent font-bold text-lg flex-shrink-0">
                          {(friend.name || friend.email)[0].toUpperCase()}
                        </div>
                      )}
                      <div className="flex-1 min-w-0">
                        <div className="font-semibold truncate group-hover:text-accent transition-colors text-sm">
                          {friend.name || 'Friend'}
                        </div>
                        {friend.username && (
                          <div className="text-xs text-text/60 truncate">
                            @{friend.username}
                          </div>
                        )}
                      </div>
                      <div className="text-accent opacity-0 group-hover:opacity-100 transition-opacity">
                        →
                      </div>
                    </Link>
                  ))}
                </div>
              </div>
            )}
          </section>
        </>
      )}

      {/* Edit Profile Button */}
      <div className="flex justify-center">
        <Link
          href="/profile/edit"
          className="px-6 py-3 bg-accent text-bg font-semibold rounded-lg hover:bg-accent/90 transition-colors"
        >
          Edit Profile
        </Link>
      </div>

      {/* Settings Section */}
      <section className="bg-surface rounded-xl overflow-hidden">
        <button
          onClick={() => setShowSettings(!showSettings)}
          className="w-full px-6 py-4 flex items-center justify-between hover:bg-surface/80 transition-colors"
        >
          <h2 className="text-xl font-bold">Settings</h2>
          <span className="text-2xl">{showSettings ? '−' : '+'}</span>
        </button>
        
        {showSettings && (
          <div className="px-6 pb-6 space-y-4">
            {/* Email (Read-only) */}
            <div>
              <label className="block mb-2 text-sm font-medium text-text/80">Email</label>
              <input
                type="email"
                value={user?.emailAddresses[0]?.emailAddress || ''}
                disabled
                className="w-full px-4 py-3 bg-bg/50 border border-surface/50 rounded-lg text-text/60 cursor-not-allowed"
              />
              <p className="text-xs text-text/60 mt-1">Email cannot be changed</p>
            </div>

            {/* Sign Out */}
            <button
              onClick={() => window.location.href = '/home'}
              className="w-full px-6 py-3 bg-red-900/20 text-red-400 border border-red-900/30 font-medium rounded-lg hover:bg-red-900/30 transition-colors"
            >
              Sign Out
            </button>
          </div>
        )}
      </section>
    </div>
  )
}
