'use client'

import { useParams, useRouter } from 'next/navigation'
import { useState, useEffect } from 'react'
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

export default function UserProfilePage() {
  const params = useParams()
  const router = useRouter()
  const username = params.username as string
  const [profile, setProfile] = useState<PublicProfile | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetchPublicProfile()
  }, [username])

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

        {/* Add Friend Button */}
        <button
          onClick={() => {
            // TODO: Implement friend request
            alert('Friend request feature coming soon!')
          }}
          className="w-full px-6 py-3 bg-accent text-bg font-medium rounded-lg hover:bg-accent/90 transition-colors"
        >
          Add Friend
        </button>
      </div>
    </div>
  )
}
