'use client'

import { useState, useEffect } from 'react'
import { useUser } from '@clerk/nextjs'
import { useRouter } from 'next/navigation'
import Image from 'next/image'
import Link from 'next/link'
import ThemeSelector from './ThemeSelector'
import ThemeBird, { ThemeBirdDisplay } from './ThemeBird'
import YourBirds from './YourBirds'
import InviteFriendsCTA from './InviteFriendsCTA'
import NotificationSettings from './NotificationSettings'
import { trackTabView, trackProfileViewed } from '@/lib/analytics-client'
import { useTheme, themes, type ThemeId } from '@/lib/theme'

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
  const [showAddFriendModal, setShowAddFriendModal] = useState(false)
  const [friendUsernameInput, setFriendUsernameInput] = useState('')
  const [theatricsEnabled, setTheatricsEnabled] = useState(() => {
    // Load from localStorage
    if (typeof window !== 'undefined') {
      return localStorage.getItem('theatricsEnabled') === 'true'
    }
    return false
  })
  const [showVibesSection, setShowVibesSection] = useState(false)
  const [vibedSongs, setVibedSongs] = useState<Array<{
    id: string
    entry: {
      id: string
      songTitle: string
      artist: string
      albumTitle: string
      albumArt: string
      date: string
      trackId: string
      user: {
        id: string
        username: string | null
        name: string | null
        email: string
        image: string | null
      }
    }
  }>>([])
  const [loadingVibes, setLoadingVibes] = useState(false)
  const [showBirdsSection, setShowBirdsSection] = useState(false)
  const [unlockedBirds, setUnlockedBirds] = useState<Array<{ birdId: string; isUnlocked: boolean }>>([])
  const [showDeleteAccountModal, setShowDeleteAccountModal] = useState(false)
  const [deleteConfirmText, setDeleteConfirmText] = useState('')
  const [deletingAccount, setDeletingAccount] = useState(false)
  const [showNotificationSettings, setShowNotificationSettings] = useState(false)
  const { setTheme } = useTheme()

  useEffect(() => {
    // Save to localStorage whenever it changes
    if (typeof window !== 'undefined') {
      localStorage.setItem('theatricsEnabled', String(theatricsEnabled))
    }
  }, [theatricsEnabled])

  useEffect(() => {
    if (isLoaded && user) {
      // Set initial values from Clerk immediately
      const clerkUsername = user.username || 
        (user.firstName ? `${user.firstName} ${user.lastName || ''}`.trim() : '') ||
        user.emailAddresses[0]?.emailAddress?.split('@')[0] || 
        ''
      const clerkImage = user.imageUrl || ''
      
      setUsername(clerkUsername)
      setProfileImage(clerkImage)
      
      // Then fetch from database (which will sync and update if needed)
      fetchProfile()
      fetchFriends()
      fetchEntryCount()
      fetchVibedSongs()
      fetchBirdStatuses()
      trackTabView('profile')
      trackProfileViewed(true)
    }
  }, [isLoaded, user])

  const fetchBirdStatuses = async () => {
    try {
      const res = await fetch('/api/birds/status')
      const data = await res.json()
      if (res.ok) {
        console.log('[ProfileTab] Bird statuses fetched:', {
          total: data.totalCount,
          unlocked: data.unlockedCount,
          birds: data.birds?.length,
        })
        setUnlockedBirds(data.birds || [])
      } else {
        console.error('[ProfileTab] Failed to fetch bird statuses:', {
          status: res.status,
          error: data.error,
          message: data.message,
        })
      }
    } catch (error) {
      console.error('[ProfileTab] Error fetching bird statuses:', error)
    }
  }

  const handleSelectBird = async (birdId: ThemeId) => {
    await setTheme(birdId)
  }

  const fetchVibedSongs = async () => {
    if (!user || !isLoaded) return
    setLoadingVibes(true)
    try {
      const res = await fetch('/api/vibes')
      if (res.ok) {
        const data = await res.json()
        setVibedSongs(data.vibes || [])
      }
    } catch (error) {
      console.error('Failed to fetch vibed songs:', error)
    } finally {
      setLoadingVibes(false)
    }
  }

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

  useEffect(() => {
    if (isLoaded && user) {
      // Set initial values from Clerk immediately for instant display
      const clerkUsername = user.username || 
        (user.firstName ? `${user.firstName} ${user.lastName || ''}`.trim() : '') ||
        user.emailAddresses[0]?.emailAddress?.split('@')[0] || 
        ''
      const clerkImage = user.imageUrl || ''
      
      setUsername(clerkUsername)
      setProfileImage(clerkImage)
      
      // Then fetch from database (which will sync and update if needed)
      fetchProfile()
      fetchFriends()
      fetchEntryCount()
      fetchVibedSongs()
      fetchBirdStatuses()
      trackTabView('profile')
      trackProfileViewed(true)
    }
  }, [isLoaded, user])

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
      const data = await res.json().catch(() => ({ error: 'Failed to parse response' }))
      
      if (res.ok) {
        const dbUser = data.user
        
        console.log('[ProfileTab] Fetched user data:', {
          username: dbUser.username,
          image: dbUser.image,
          hasImage: !!dbUser.image,
          imageLength: dbUser.image?.length,
        })
        
        // Database is source of truth - use it first, only fallback to Clerk if database is empty
        setUsername(
          dbUser.username || 
          dbUser.name || 
          user.username || 
          (user.firstName ? `${user.firstName} ${user.lastName || ''}`.trim() : '') ||
          user.emailAddresses[0]?.emailAddress?.split('@')[0] || 
          ''
        )
        const imageToUse = dbUser.image || user.imageUrl || ''
        console.log('[ProfileTab] Setting profile image:', {
          dbImage: dbUser.image,
          clerkImage: user.imageUrl,
          finalImage: imageToUse,
        })
        setProfileImage(imageToUse)
        setBio(dbUser.bio || '')
        setSelectedArtists(dbUser.favoriteArtists || [])
        setSelectedSongs(dbUser.favoriteSongs || [])
        setMessage(null) // Clear any previous errors
      } else {
        // API returned an error
        const errorMessage = data.error || data.message || `HTTP ${res.status}: ${res.statusText}`
        console.error('[ProfileTab] Failed to fetch profile:', {
          status: res.status,
          statusText: res.statusText,
          error: data.error,
          message: data.message,
          fullResponse: data,
        })
        setMessage({ 
          type: 'error', 
          text: `Failed to load profile: ${errorMessage}. Please check your Supabase configuration.` 
        })
        // If API fails, use Clerk data as fallback
        setUsername(
          user.username || 
          (user.firstName ? `${user.firstName} ${user.lastName || ''}`.trim() : '') ||
          user.emailAddresses[0]?.emailAddress?.split('@')[0] || 
          ''
        )
        setProfileImage(user.imageUrl || '')
      }
    } catch (error: any) {
      console.error('Failed to fetch profile:', error)
      const errorMessage = error?.message || 'Unknown error occurred'
      setMessage({ 
        type: 'error', 
        text: `Failed to connect to database: ${errorMessage}. Please check your Supabase environment variables (NEXT_PUBLIC_SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY).` 
      })
      // Fallback to Clerk data on error
      setUsername(
        user.username || 
        (user.firstName ? `${user.firstName} ${user.lastName || ''}`.trim() : '') ||
        user.emailAddresses[0]?.emailAddress?.split('@')[0] || 
        ''
      )
      setProfileImage(user.imageUrl || '')
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
        <div className="flex flex-col items-center justify-center py-16">
          <div className="mb-4">
            <ThemeBird size={72} state="curious" className="animate-pulse" />
          </div>
          <p className="text-text/60">Getting ready...</p>
        </div>
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
          <section className="bg-surface rounded-xl p-8 space-y-6 relative overflow-hidden">
            {/* Background: Unlocked birds (subtle) */}
            {unlockedBirds.filter(b => b.isUnlocked).length > 1 && (
              <div className="absolute inset-0 pointer-events-none overflow-hidden opacity-10">
                <div className="flex flex-wrap justify-center items-center gap-4 p-4">
                  {unlockedBirds
                    .filter(b => b.isUnlocked)
                    .map((bird, index) => {
                      const theme = themes.find(t => t.id === bird.birdId)
                      if (!theme) return null
                      return (
                        <div 
                          key={bird.birdId}
                          className="w-16 h-16 flex-shrink-0"
                          style={{
                            transform: `rotate(${(index % 2 === 0 ? 1 : -1) * (5 + index * 2)}deg)`,
                          }}
                        >
                          <Image
                            src={theme.birdLogo}
                            alt={theme.name}
                            width={64}
                            height={64}
                            className="object-contain"
                          />
                        </div>
                      )
                    })}
                </div>
              </div>
            )}
            
            {/* Avatar */}
            <div className="flex flex-col items-center gap-4 relative z-10">
              {profileImage ? (
                <div className="relative w-32 h-32">
                  <Image
                    src={profileImage}
                    alt="Profile"
                    fill
                    className="rounded-full border-4 border-accent object-cover"
                    unoptimized
                    onError={(e) => {
                      console.error('[ProfileTab] Image load error:', profileImage, e)
                      setProfileImage('')
                    }}
                    onLoad={() => {
                      console.log('[ProfileTab] Image loaded successfully:', profileImage)
                    }}
                  />
                </div>
              ) : (
                <div className="w-32 h-32 rounded-full bg-accent/20 border-4 border-accent flex items-center justify-center text-5xl font-bold text-accent">
                  {username.charAt(0).toUpperCase() || user?.emailAddresses[0]?.emailAddress?.charAt(0).toUpperCase() || '?'}
                </div>
              )}
            </div>

            {/* Your Songbird */}
            <div className="flex justify-center -mt-2 mb-2">
              <ThemeBirdDisplay size={80} showName interactive />
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

            {/* Stats Row - entries, friends, vibes */}
            <div className="flex justify-center gap-6 sm:gap-8 py-4 border-y border-surface">
              <div className="text-center">
                <div className="text-xl sm:text-2xl font-bold text-accent">{entryCount}</div>
                <div className="text-xs sm:text-sm text-text/60">Entries</div>
              </div>
              <button
                onClick={() => {
                  // Dispatch event to navigate to feed tab
                  if (typeof window !== 'undefined') {
                    window.dispatchEvent(new CustomEvent('navigateToFriends'))
                  }
                }}
                className="text-center hover:opacity-80 transition-opacity cursor-pointer"
              >
                <div className="text-xl sm:text-2xl font-bold text-accent">{friends.length}</div>
                <div className="text-xs sm:text-sm text-text/60">Friends</div>
              </button>
              <button 
                onClick={() => setShowVibesSection(!showVibesSection)}
                className="text-center hover:opacity-80 transition-opacity"
              >
                <div className="text-xl sm:text-2xl font-bold text-pink-400">{vibedSongs.length}</div>
                <div className="text-xs sm:text-sm text-text/60">Vibes</div>
              </button>
            </div>

            {/* Vibed Songs Section */}
            {showVibesSection && (
              <div className="bg-bg rounded-lg p-4">
                <h3 className="text-lg font-semibold mb-3 text-pink-400 flex items-center gap-2">
                  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="w-5 h-5">
                    <path d="M21 8.25c0-2.485-2.099-4.5-4.688-4.5-1.935 0-3.597 1.126-4.312 2.733-.715-1.607-2.377-2.733-4.313-2.733C5.1 3.75 3 5.765 3 8.25c0 7.22 9 12 9 12s9-4.78 9-12z"/>
                  </svg>
                  Songs You Vibed
                </h3>
                {loadingVibes ? (
                  <p className="text-text/60 text-sm text-center py-4">Loading...</p>
                ) : vibedSongs.length === 0 ? (
                  <p className="text-text/60 text-sm text-center py-4">
                    No vibed songs yet. Visit the Feed to vibe to your friends' songs!
                  </p>
                ) : (
                  <div className="space-y-2 max-h-80 overflow-y-auto">
                    {vibedSongs.map((vibe) => (
                      <a
                        key={vibe.id}
                        href={`https://open.spotify.com/track/${vibe.entry.trackId}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="flex items-center gap-3 p-2 rounded-lg hover:bg-surface/50 transition-colors group"
                      >
                        {vibe.entry.albumArt && (
                          <Image
                            src={vibe.entry.albumArt}
                            alt={vibe.entry.songTitle}
                            width={48}
                            height={48}
                            className="rounded"
                            style={{ aspectRatio: '1/1', objectFit: 'cover' }}
                          />
                        )}
                        <div className="flex-1 min-w-0">
                          <div className="font-medium text-sm truncate group-hover:text-accent transition-colors">
                            {vibe.entry.songTitle}
                          </div>
                          <div className="text-xs text-text/60 truncate">
                            {vibe.entry.artist} • shared by {vibe.entry.user.username || vibe.entry.user.name || vibe.entry.user.email.split('@')[0]}
                          </div>
                        </div>
                        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="w-5 h-5 text-[#1DB954] opacity-0 group-hover:opacity-100 transition-opacity">
                          <path d="M12 0C5.4 0 0 5.4 0 12s5.4 12 12 12 12-5.4 12-12S18.66 0 12 0zm5.521 17.34c-.24.359-.66.48-1.021.24-2.82-1.74-6.36-2.101-10.561-1.141-.418.122-.779-.179-.899-.539-.12-.421.18-.78.54-.9 4.56-1.021 8.52-.6 11.64 1.32.42.18.479.659.301 1.02zm1.44-3.3c-.301.42-.841.6-1.262.3-3.239-1.98-8.159-2.58-11.939-1.38-.479.12-1.02-.12-1.14-.6-.12-.48.12-1.021.6-1.141C9.6 9.9 15 10.561 18.72 12.84c.361.181.54.78.241 1.2zm.12-3.36C15.24 8.4 8.82 8.16 5.16 9.301c-.6.179-1.2-.181-1.38-.721-.18-.601.18-1.2.72-1.381 4.26-1.26 11.28-1.02 15.721 1.621.539.3.719 1.02.419 1.56-.299.421-1.02.599-1.559.3z"/>
                        </svg>
                      </a>
                    ))}
                  </div>
                )}
              </div>
            )}

            {/* Buttons: View Friends, Add Friend, Invite */}
            <div className="flex flex-wrap gap-3 justify-center">
              <button
                onClick={() => setShowFriendsSection(!showFriendsSection)}
                className="px-4 py-2 bg-accent/10 border border-accent/30 rounded-lg text-accent font-medium hover:bg-accent/20 transition-colors"
              >
                View Friends
              </button>
              <button
                onClick={() => setShowAddFriendModal(true)}
                className="px-4 py-2 bg-surface border border-text/20 rounded-lg text-text font-medium hover:bg-surface/80 transition-colors"
              >
                Add Friend
              </button>
              <button
                onClick={async () => {
                  try {
                    // Get or create invite code
                    const res = await fetch('/api/invites')
                    if (res.ok) {
                      const data = await res.json()
                      const url = data.inviteUrl || `${window.location.origin}/join/${data.personalCode}`
                      
                      if (navigator.share) {
                        await navigator.share({
                          title: 'Join me on SongBird',
                          text: 'I\'m logging my daily songs on SongBird. Join me!',
                          url,
                        })
                      } else {
                        await navigator.clipboard.writeText(url)
                        setMessage({ type: 'success', text: 'Invite link copied!' })
                        setTimeout(() => setMessage(null), 3000)
                      }
                    }
                  } catch (err) {
                    console.error('Error sharing invite:', err)
                  }
                }}
                className="px-4 py-2 bg-green-600/20 border border-green-500/30 rounded-lg text-green-400 font-medium hover:bg-green-600/30 transition-colors flex items-center gap-2"
              >
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8.684 13.342C8.886 12.938 9 12.482 9 12c0-.482-.114-.938-.316-1.342m0 2.684a3 3 0 110-2.684m0 2.684l6.632 3.316m-6.632-6l6.632-3.316m0 0a3 3 0 105.367-2.684 3 3 0 00-5.367 2.684zm0 9.316a3 3 0 105.368 2.684 3 3 0 00-5.368-2.684z" />
                </svg>
                Invite Friends
              </button>
            </div>

            {/* Add Friend Modal */}
            {showAddFriendModal && (
              <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
                <div className="bg-surface rounded-xl p-6 max-w-md w-full">
                  <h3 className="text-xl font-bold mb-4">Add Friend</h3>
                  <p className="text-text/70 text-sm mb-4">
                    Enter a username to view their profile
                  </p>
                  <div className="flex gap-2 mb-4">
                    <input
                      type="text"
                      placeholder="Enter username (e.g., username)"
                      value={friendUsernameInput}
                      onChange={(e) => setFriendUsernameInput(e.target.value.replace('@', ''))}
                      onKeyPress={(e) => {
                        if (e.key === 'Enter' && friendUsernameInput.trim()) {
                          window.location.href = `/user/${friendUsernameInput.trim()}`
                        }
                      }}
                      className="flex-1 px-4 py-2 bg-bg border border-text/20 rounded-lg text-text placeholder:text-text/40"
                      autoFocus
                    />
                  </div>
                  <div className="flex gap-2">
                    <button
                      onClick={() => {
                        if (friendUsernameInput.trim()) {
                          window.location.href = `/user/${friendUsernameInput.trim()}`
                        }
                      }}
                      disabled={!friendUsernameInput.trim()}
                      className="flex-1 px-4 py-2 bg-accent text-bg font-medium rounded-lg hover:bg-accent/90 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      View Profile
                    </button>
                    <button
                      onClick={() => {
                        setShowAddFriendModal(false)
                        setFriendUsernameInput('')
                      }}
                      className="px-4 py-2 bg-surface border border-text/20 rounded-lg text-text font-medium hover:bg-surface/80 transition-colors"
                    >
                      Cancel
                    </button>
                  </div>
                </div>
              </div>
            )}

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

            {/* Friends List (shown when View Friends clicked) */}
            {showFriendsSection && (
              <div>
                <h3 className="text-lg font-semibold mb-3 text-text/80">Friends</h3>
                {friends.length === 0 ? (
                  <div className="text-center py-8 text-text/60">
                    <p>No friends yet.</p>
                    <p className="text-sm mt-2">Use "Add Friend" to find and connect with others!</p>
                  </div>
                ) : (
                  <div className="max-h-96 overflow-y-auto space-y-2 pr-2">
                    {friends.map((friend) => (
                      <Link
                        key={friend.id}
                        href={`/user/${encodeURIComponent(friend.username || friend.email || friend.id)}`}
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
                )}
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
          <div className="px-6 pb-6 space-y-6">
            {/* Your Birds Section */}
            <div>
              <button
                onClick={() => setShowBirdsSection(!showBirdsSection)}
                className="w-full flex items-center justify-between mb-3"
              >
                <label className="text-sm font-medium text-text/80">
                  <span className="flex items-center gap-2 cursor-pointer">
                    <span className="text-lg">🐦</span>
                    Your Flock
                  </span>
                </label>
                <span className="text-text/50">{showBirdsSection ? '−' : '+'}</span>
              </button>
              
              {showBirdsSection ? (
                <YourBirds onSelectBird={handleSelectBird} compact />
              ) : (
                <p className="text-xs text-text/60">Unlock birds through streaks and milestones. Tap to expand.</p>
              )}
            </div>

            {/* Divider */}
            <div className="border-t border-surface/50" />

            {/* Theme Selector */}
            <div>
              <label className="block mb-3 text-sm font-medium text-text/80">
                <span className="flex items-center gap-2">
                  <svg xmlns="http://www.w3.org/2000/svg" className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <circle cx="12" cy="12" r="5"/>
                    <path d="M12 1v2M12 21v2M4.22 4.22l1.42 1.42M18.36 18.36l1.42 1.42M1 12h2M21 12h2M4.22 19.78l1.42-1.42M18.36 5.64l1.42-1.42"/>
                  </svg>
                  Theme
                </span>
              </label>
              <ThemeSelector compact />
              <p className="text-xs text-text/60 mt-2">Choose a songbird theme to personalize your experience</p>
            </div>

            {/* Divider */}
            <div className="border-t border-surface/50" />

            {/* Notification Settings */}
            <div>
              <button
                onClick={() => setShowNotificationSettings(!showNotificationSettings)}
                className="w-full flex items-center justify-between mb-3"
              >
                <label className="text-sm font-medium text-text/80">
                  <span className="flex items-center gap-2 cursor-pointer">
                    <span className="text-lg">🔔</span>
                    Notification Settings
                  </span>
                </label>
                <span className="text-text/50">{showNotificationSettings ? '−' : '+'}</span>
              </button>
              {showNotificationSettings && (
                <div className="mb-4">
                  <NotificationSettings />
                </div>
              )}
            </div>

            {/* Divider */}
            <div className="border-t border-surface/50" />

            {/* Blocked Users */}
            <div>
              <Link
                href="/settings/blocked"
                className="w-full flex items-center justify-between mb-3 text-text/80 hover:text-text transition-colors"
              >
                <label className="text-sm font-medium">
                  <span className="flex items-center gap-2 cursor-pointer">
                    <span className="text-lg">🚫</span>
                    Blocked Users
                  </span>
                </label>
                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                </svg>
              </Link>
            </div>

            {/* Divider */}
            <div className="border-t border-surface/50" />
            
            {/* Account Information */}
            <div>
              <h3 className="text-lg font-semibold mb-3 text-text/80">Account Information</h3>
              
              <div className="space-y-4">
                <div>
                  <label className="block mb-2 text-sm font-medium text-text/80">Username</label>
                  <input
                    type="text"
                    value={username || 'Not set'}
                    disabled
                    className="w-full px-4 py-3 bg-bg/50 border border-surface/50 rounded-lg text-text/60 cursor-not-allowed"
                  />
                  <p className="text-xs text-text/60 mt-1">
                    {username ? 'Edit your username in Edit Profile' : 'Set your username in Edit Profile'}
                  </p>
                </div>
                
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
              </div>
            </div>

            {/* Tutorial / How it Works */}
            <div>
              <label className="block mb-2 text-sm font-medium text-text/80">
                <span className="flex items-center gap-2">
                  <span className="text-lg">📖</span>
                  Tutorial
                </span>
              </label>
              <button
                onClick={() => window.location.href = '/welcome?tutorial=true'}
                className="w-full px-4 py-3 bg-accent/10 border border-accent/30 text-accent font-medium rounded-lg hover:bg-accent/20 transition-colors"
              >
                View How SongBird Works
              </button>
              <p className="text-xs text-text/60 mt-1">Watch the intro again without changing your profile</p>
            </div>

            {/* Divider */}
            <div className="border-t border-surface/50" />

            {/* Legal Links */}
            <div className="space-y-2">
              <Link
                href="/privacy"
                className="w-full flex items-center justify-between py-2 text-text/60 hover:text-text/80 transition-colors text-sm"
              >
                <span className="flex items-center gap-2">
                  <span className="text-base">🔒</span>
                  Privacy Policy
                </span>
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                </svg>
              </Link>
              <Link
                href="/terms"
                className="w-full flex items-center justify-between py-2 text-text/60 hover:text-text/80 transition-colors text-sm"
              >
                <span className="flex items-center gap-2">
                  <span className="text-base">📄</span>
                  Terms of Service
                </span>
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                </svg>
              </Link>
            </div>

            {/* Divider */}
            <div className="border-t border-surface/50" />

            {/* Sign Out */}
            <button
              onClick={() => window.location.href = '/home'}
              className="w-full px-6 py-3 bg-red-900/20 text-red-400 border border-red-900/30 font-medium rounded-lg hover:bg-red-900/30 transition-colors"
            >
              Sign Out
            </button>

            {/* Delete Account */}
            <button
              onClick={() => setShowDeleteAccountModal(true)}
              className="w-full px-6 py-3 bg-red-950/30 text-red-500 border border-red-900/40 font-medium rounded-lg hover:bg-red-950/40 transition-colors mt-3"
            >
              Delete Account
            </button>
          </div>
        )}
      </section>

      {/* Delete Account Modal */}
      {showDeleteAccountModal && (
        <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50 p-4">
          <div className="bg-surface rounded-xl p-6 max-w-md w-full border border-red-900/30">
            <h3 className="text-2xl font-bold mb-2 text-red-400">Delete Account</h3>
            <p className="text-text/80 mb-4">
              This action cannot be undone. This will permanently delete your account and all associated data including:
            </p>
            <ul className="list-disc list-inside text-text/70 text-sm mb-6 ml-2 space-y-1">
              <li>All your song entries</li>
              <li>Your notes and memories</li>
              <li>Your friends and connections</li>
              <li>Your profile information</li>
              <li>All other data associated with your account</li>
            </ul>
            <p className="text-text/80 mb-4 font-semibold">
              To confirm, please type <span className="text-red-400 font-mono">DELETE</span> in the box below:
            </p>
            <input
              type="text"
              value={deleteConfirmText}
              onChange={(e) => setDeleteConfirmText(e.target.value)}
              placeholder="Type DELETE to confirm"
              className="w-full px-4 py-3 bg-bg border border-red-900/40 rounded-lg text-text placeholder:text-text/40 mb-4 focus:outline-none focus:ring-2 focus:ring-red-500"
              autoFocus
            />
            <div className="flex gap-3">
              <button
                onClick={async () => {
                  if (deleteConfirmText !== 'DELETE') {
                    setMessage({ type: 'error', text: 'Please type DELETE to confirm' })
                    return
                  }

                  setDeletingAccount(true)
                  try {
                    const res = await fetch('/api/user/delete', {
                      method: 'POST',
                      headers: { 'Content-Type': 'application/json' },
                      body: JSON.stringify({ confirmText: deleteConfirmText }),
                    })

                    const data = await res.json()

                    if (res.ok) {
                      // Account deleted successfully, redirect to home
                      window.location.href = '/home'
                    } else {
                      setMessage({ type: 'error', text: data.error || 'Failed to delete account' })
                      setDeletingAccount(false)
                    }
                  } catch (error) {
                    console.error('Error deleting account:', error)
                    setMessage({ type: 'error', text: 'An error occurred while deleting your account' })
                    setDeletingAccount(false)
                  }
                }}
                disabled={deleteConfirmText !== 'DELETE' || deletingAccount}
                className="flex-1 px-6 py-3 bg-red-600 text-white font-semibold rounded-lg hover:bg-red-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {deletingAccount ? 'Deleting...' : 'Permanently Delete Account'}
              </button>
              <button
                onClick={() => {
                  setShowDeleteAccountModal(false)
                  setDeleteConfirmText('')
                }}
                disabled={deletingAccount}
                className="px-6 py-3 bg-surface border border-text/20 rounded-lg text-text font-medium hover:bg-surface/80 transition-colors disabled:opacity-50"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
