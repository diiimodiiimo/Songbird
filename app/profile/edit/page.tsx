'use client'

import { useState, useEffect, useRef } from 'react'
import { useUser } from '@clerk/nextjs'
import { useRouter } from 'next/navigation'
import Image from 'next/image'
import Link from 'next/link'
import { ThemeBirdLogo } from '@/components/ThemeBird'

interface SuggestedArtist {
  name: string
  count: number
}

interface SuggestedSong {
  title: string
  artist: string
  count: number
}

export default function EditProfilePage() {
  const { isSignedIn, isLoaded, user } = useUser()
  const router = useRouter()
  const fileInputRef = useRef<HTMLInputElement>(null)
  
  const [username, setUsername] = useState('')
  const [bio, setBio] = useState('')
  const [selectedArtists, setSelectedArtists] = useState<string[]>([])
  const [selectedSongs, setSelectedSongs] = useState<Array<{ songTitle: string; artist: string }>>([])
  const [profileImage, setProfileImage] = useState<string>('')
  const [suggestedArtists, setSuggestedArtists] = useState<SuggestedArtist[]>([])
  const [suggestedSongs, setSuggestedSongs] = useState<SuggestedSong[]>([])
  const [loading, setLoading] = useState(false)
  const [loadingSuggestions, setLoadingSuggestions] = useState(true)
  const [loadingProfile, setLoadingProfile] = useState(true)
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null)
  const [isSetup, setIsSetup] = useState(false)

  useEffect(() => {
    if (isLoaded && isSignedIn) {
      // Check if this is a setup flow (username not set)
      const urlParams = new URLSearchParams(window.location.search)
      setIsSetup(urlParams.get('setup') === 'true')
      fetchProfile()
      fetchSuggestions()
    }
  }, [isLoaded, isSignedIn])

  const fetchProfile = async () => {
    if (!isSignedIn) return
    setLoadingProfile(true)
    try {
      const res = await fetch('/api/profile')
      if (res.ok) {
        const data = await res.json()
        const user = data.user
        setUsername(user.username || user.name || '')
        setBio(user.bio || '')
        setProfileImage(user.image || '')
        setSelectedArtists(user.favoriteArtists || [])
        setSelectedSongs(user.favoriteSongs || [])
      }
    } catch (error) {
      console.error('Failed to fetch profile:', error)
    } finally {
      setLoadingProfile(false)
    }
  }

  const fetchSuggestions = async () => {
    setLoadingSuggestions(true)
    try {
      const res = await fetch('/api/analytics')
      if (res.ok) {
        const data = await res.json()
        // Map API response to expected format
        setSuggestedArtists(
          (data.topArtists || []).slice(0, 20).map((item: { artist: string; count: number }) => ({
            name: item.artist,
            count: item.count,
          }))
        )
        setSuggestedSongs(
          (data.topSongs || []).slice(0, 20).map((item: { songTitle: string; artist: string; count: number }) => ({
            title: item.songTitle,
            artist: item.artist,
            count: item.count,
          }))
        )
      }
    } catch (error) {
      console.error('Failed to fetch suggestions:', error)
    } finally {
      setLoadingSuggestions(false)
    }
  }

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    // Validate file type
    if (!file.type.startsWith('image/')) {
      setMessage({ type: 'error', text: 'Please select an image file (JPG or PNG)' })
      return
    }

    // Validate file size (max 5MB)
    if (file.size > 5 * 1024 * 1024) {
      setMessage({ type: 'error', text: 'Image size must be less than 5MB' })
      return
    }

    // Convert to base64 for preview and storage
    const reader = new FileReader()
    reader.onloadend = () => {
      const base64String = reader.result as string
      setProfileImage(base64String)
    }
    reader.onerror = () => {
      setMessage({ type: 'error', text: 'Failed to read image file' })
    }
    reader.readAsDataURL(file)
  }

  const toggleArtist = (artistName: string) => {
    setSelectedArtists(prev => 
      prev.includes(artistName) 
        ? prev.filter(a => a !== artistName)
        : [...prev, artistName].slice(0, 3) // Max 3 artists
    )
  }

  const toggleSong = (song: SuggestedSong) => {
    const songId = `${song.title}-${song.artist}`
    setSelectedSongs(prev => {
      const exists = prev.some(s => `${s.songTitle}-${s.artist}` === songId)
      if (exists) {
        return prev.filter(s => `${s.songTitle}-${s.artist}` !== songId)
      } else {
        return [...prev, { songTitle: song.title, artist: song.artist }].slice(0, 3) // Max 3 songs
      }
    })
  }

  const handleSave = async () => {
    if (!isSignedIn) return

    // Validate username if this is setup
    if (isSetup && !username.trim()) {
      setMessage({ type: 'error', text: 'Username is required to get started!' })
      return
    }

    setLoading(true)
    setMessage(null)

    try {
      const res = await fetch('/api/profile', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          username: username.trim() || null,
          image: profileImage || null,
          bio: bio.trim() || null,
          favoriteArtists: selectedArtists,
          favoriteSongs: selectedSongs,
        }),
      })

      const data = await res.json()
      if (res.ok) {
        setMessage({ 
          type: 'success', 
          text: isSetup 
            ? 'Profile set up successfully! Welcome to SongBird! 🎵'
            : 'Profile updated successfully! Your profile is now active.'
        })
        // Refresh profile data to show updated info
        await fetchProfile()
        // Navigate back to profile after a short delay
        setTimeout(() => {
          router.push('/')
        }, 1500)
      } else {
        setMessage({ type: 'error', text: data.error || 'Failed to update profile' })
      }
    } catch (error) {
      setMessage({ type: 'error', text: 'Failed to update profile' })
    } finally {
      setLoading(false)
    }
  }

  if (loadingProfile) {
    return (
      <div className="min-h-screen bg-bg text-text flex items-center justify-center">
        <div>Loading profile...</div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-bg text-text">
      {/* Header */}
      <nav className="bg-card border-b border-primary/20 px-3 py-3 sm:px-4 sm:py-4">
        <div className="container mx-auto flex justify-between items-center">
          <Link href="/" className="flex items-center">
            <ThemeBirdLogo size={24} textSize="md" />
          </Link>
          <Link
            href="/"
            className="px-4 py-2 bg-surface text-text border border-text/20 rounded-lg hover:bg-surface/80 transition-colors text-sm"
          >
            Cancel
          </Link>
        </div>
      </nav>

      {/* Content */}
      <div className="max-w-2xl mx-auto px-3 sm:px-4 py-4 sm:py-8 space-y-4 sm:space-y-6">
        <div>
          <h2 className="text-2xl font-bold">{isSetup ? 'Set Up Your Profile' : 'Edit Profile'}</h2>
          {isSetup && (
            <p className="text-text/70 text-sm mt-2">
              Choose a username to get started. This will be your unique identifier in SongBird.
            </p>
          )}
        </div>

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

        {/* Profile Section */}
        <section className="bg-surface rounded-xl p-6 space-y-6">
          {/* Profile Picture - Mobile Friendly */}
          <div className="flex flex-col items-center gap-4">
            <button
              onClick={() => fileInputRef.current?.click()}
              className="relative group cursor-pointer"
            >
              {profileImage ? (
                <Image
                  src={profileImage}
                  alt="Profile"
                  width={120}
                  height={120}
                  className="rounded-full border-4 border-accent w-28 h-28 sm:w-32 sm:h-32"
                  style={{ aspectRatio: '1/1', objectFit: 'cover', objectPosition: 'center' }}
                />
              ) : (
                <div className="w-28 h-28 sm:w-32 sm:h-32 rounded-full bg-accent/20 border-4 border-accent flex items-center justify-center text-4xl sm:text-5xl font-bold text-accent">
                  {username.charAt(0).toUpperCase() || user?.emailAddresses[0]?.emailAddress?.charAt(0).toUpperCase() || '?'}
                </div>
              )}
              {/* Overlay on hover/tap */}
              <div className="absolute inset-0 bg-black/50 rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 group-active:opacity-100 transition-opacity">
                <span className="text-white text-sm font-medium">
                  {profileImage ? 'Change' : 'Upload'}
                </span>
              </div>
            </button>
            <input
              ref={fileInputRef}
              type="file"
              accept="image/jpeg,image/png,image/jpg"
              onChange={handleImageUpload}
              className="hidden"
            />
            <p className="text-xs text-text/60 text-center">
              Tap photo to {profileImage ? 'change' : 'upload'} • JPG or PNG, max 5MB
            </p>
          </div>

          {/* Username */}
          <div>
            <label className="block mb-2 text-sm font-medium text-text/80">
              Username {isSetup && <span className="text-red-400">*</span>}
            </label>
            <input
              type="text"
              value={username}
              onChange={(e) => setUsername(e.target.value.replace(/[^a-zA-Z0-9_]/g, ''))}
              placeholder="Your username (letters, numbers, and underscores only)"
              className="w-full px-4 py-3 bg-bg border border-surface rounded-lg text-text placeholder:text-text/40 focus:border-accent outline-none transition-colors"
              required={isSetup}
            />
            <p className="text-xs text-text/60 mt-1">
              {isSetup 
                ? 'This username will be used to identify you in the app. Choose wisely!'
                : 'This is how others will see you in the app'
              }
            </p>
          </div>

          {/* Bio */}
          <div>
            <label className="block mb-2 text-sm font-medium text-text/80">Bio</label>
            <textarea
              value={bio}
              onChange={(e) => {
                if (e.target.value.length <= 160) {
                  setBio(e.target.value)
                }
              }}
              placeholder="Tell us a little about yourself..."
              rows={3}
              className="w-full px-4 py-3 bg-bg border border-surface rounded-lg text-text placeholder:text-text/40 focus:border-accent outline-none transition-colors resize-none"
            />
            <p className="text-xs text-text/60 mt-1">
              {bio.length}/160 characters
            </p>
          </div>

          {/* Favorite Artists */}
          <div>
            <label className="block mb-2 text-sm font-medium text-text/80">
              Favorite Artists <span className="text-text/40">(Select up to 3)</span>
            </label>
            {loadingSuggestions ? (
              <div className="text-center py-4 text-text/60">Loading suggestions from your data...</div>
            ) : suggestedArtists.length > 0 ? (
              <>
                <p className="text-xs text-text/60 mb-3">
                  Suggested based on your listening history
                </p>
                <div className="flex flex-wrap gap-2">
                  {suggestedArtists.map((artist) => (
                    <button
                      key={artist.name}
                      onClick={() => toggleArtist(artist.name)}
                      disabled={selectedArtists.length >= 3 && !selectedArtists.includes(artist.name)}
                      className={`
                        px-4 py-2 rounded-full text-sm font-medium transition-all
                        ${selectedArtists.includes(artist.name)
                          ? 'bg-accent text-bg border-2 border-accent'
                          : 'bg-surface text-text border-2 border-surface hover:border-accent/50'
                        }
                        ${selectedArtists.length >= 3 && !selectedArtists.includes(artist.name) ? 'opacity-40 cursor-not-allowed' : ''}
                      `}
                    >
                      {artist.name}
                      <span className="ml-2 text-xs opacity-70">×{artist.count}</span>
                    </button>
                  ))}
                </div>
                {selectedArtists.length > 0 && (
                  <div className="mt-3">
                    <p className="text-xs text-text/60 mb-2">Selected Artists:</p>
                    <div className="flex flex-wrap gap-2">
                      {selectedArtists.map((artist) => (
                        <span
                          key={artist}
                          className="px-3 py-1 bg-accent/20 text-accent rounded-full text-sm flex items-center gap-2"
                        >
                          {artist}
                          <button
                            onClick={() => toggleArtist(artist)}
                            className="hover:text-red-400 text-lg leading-none"
                          >
                            ×
                          </button>
                        </span>
                      ))}
                    </div>
                  </div>
                )}
              </>
            ) : (
              <p className="text-sm text-text/60 bg-surface rounded-lg p-4">
                Start logging songs to see personalized suggestions here
              </p>
            )}
          </div>

          {/* Favorite Songs */}
          <div>
            <label className="block mb-2 text-sm font-medium text-text/80">
              Favorite Songs <span className="text-text/40">(Select up to 3)</span>
            </label>
            {loadingSuggestions ? (
              <div className="text-center py-4 text-text/60">Loading suggestions from your data...</div>
            ) : suggestedSongs.length > 0 ? (
              <>
                <p className="text-xs text-text/60 mb-3">
                  Suggested based on your listening history
                </p>
                <div className="space-y-2">
                  {suggestedSongs.map((song) => {
                    const songId = `${song.title}-${song.artist}`
                    const isSelected = selectedSongs.some(s => `${s.songTitle}-${s.artist}` === songId)
                    return (
                      <button
                        key={songId}
                        onClick={() => toggleSong(song)}
                        disabled={selectedSongs.length >= 3 && !isSelected}
                        className={`
                          w-full px-4 py-3 rounded-lg text-left transition-all flex items-center justify-between
                          ${isSelected
                            ? 'bg-accent text-bg border-2 border-accent'
                            : 'bg-surface text-text border-2 border-surface hover:border-accent/50'
                          }
                          ${selectedSongs.length >= 3 && !isSelected ? 'opacity-40 cursor-not-allowed' : ''}
                        `}
                      >
                        <div>
                          <div className="font-semibold">{song.title}</div>
                          <div className="text-sm opacity-70">{song.artist}</div>
                        </div>
                        <span className="text-sm opacity-70">×{song.count}</span>
                      </button>
                    )
                  })}
                </div>
                {selectedSongs.length > 0 && (
                  <div className="mt-3 space-y-2">
                    {selectedSongs.map((song) => (
                      <div
                        key={`${song.songTitle}-${song.artist}`}
                        className="bg-bg rounded-lg p-3 border border-accent/20 flex items-center justify-between"
                      >
                        <div>
                          <div className="font-semibold text-sm">{song.songTitle}</div>
                          <div className="text-xs text-text/60">{song.artist}</div>
                        </div>
                        <button
                          onClick={() => toggleSong({ title: song.songTitle, artist: song.artist, count: 0 })}
                          className="hover:text-red-400 text-lg leading-none"
                        >
                          ×
                        </button>
                      </div>
                    ))}
                  </div>
                )}
              </>
            ) : (
              <p className="text-sm text-text/60 bg-surface rounded-lg p-4">
                Start logging songs to see personalized suggestions here
              </p>
            )}
          </div>

          {/* Save Button - Inside Section */}
          <div className="pt-6 border-t border-surface/50">
            <button
              onClick={handleSave}
              disabled={loading}
              className="w-full px-6 py-4 bg-amber-200 text-bg font-semibold text-lg rounded-lg hover:bg-amber-300 transition-colors disabled:opacity-50 shadow-lg"
            >
              {loading ? 'Saving...' : 'Save Profile'}
            </button>
          </div>
        </section>
      </div>
    </div>
  )
}

