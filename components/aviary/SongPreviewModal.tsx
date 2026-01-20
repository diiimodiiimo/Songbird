'use client'

import { useState, useEffect } from 'react'
import Image from 'next/image'
import { getThemeById, getBirdLogo } from '@/lib/theme'
import type { AviaryBird as AviaryBirdType, SongAssociation } from '@/types/aviary'

interface SongPreviewModalProps {
  bird: AviaryBirdType
  onClose: () => void
  onPlayOnSpotify: (trackId: string) => void
}

type TabType = 'latest' | 'associated'

export function SongPreviewModal({ bird, onClose, onPlayOnSpotify }: SongPreviewModalProps) {
  const { user, latestSong, isCurrentUser } = bird
  const theme = getThemeById(user.theme)
  const [activeTab, setActiveTab] = useState<TabType>('latest')
  const [associations, setAssociations] = useState<SongAssociation[]>([])
  const [loadingAssociations, setLoadingAssociations] = useState(false)

  // Fetch song associations for this friend
  useEffect(() => {
    if (!isCurrentUser && activeTab === 'associated') {
      fetchAssociations()
    }
  }, [activeTab, isCurrentUser, user.id])

  const fetchAssociations = async () => {
    setLoadingAssociations(true)
    try {
      const res = await fetch(`/api/song-associations?friendId=${user.id}`)
      const data = await res.json()
      if (res.ok) {
        setAssociations(data.associations || [])
      }
    } catch (error) {
      console.error('Error fetching associations:', error)
    } finally {
      setLoadingAssociations(false)
    }
  }

  return (
    <div 
      className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4 animate-fade-in"
      onClick={onClose}
    >
      <div 
        className="bg-surface border border-white/10 rounded-2xl max-w-sm w-full overflow-hidden shadow-2xl max-h-[85vh] flex flex-col"
        onClick={(e) => e.stopPropagation()}
        role="dialog"
        aria-labelledby="song-modal-title"
      >
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-white/10 flex-shrink-0">
          <div className="flex items-center gap-3">
            <Image
              src={getBirdLogo(user.theme)}
              alt={`${theme.shortName} bird`}
              width={32}
              height={32}
              className="object-contain"
            />
            <span id="song-modal-title" className="text-text font-semibold text-sm">
              {isCurrentUser ? 'You' : user.username}
            </span>
          </div>
          <button 
            className="text-text-muted hover:text-text text-2xl leading-none transition-colors w-8 h-8 flex items-center justify-center rounded-full hover:bg-white/10" 
            onClick={onClose}
            aria-label="Close"
          >
            ×
          </button>
        </div>

        {/* Tabs - only show for friends, not current user */}
        {!isCurrentUser && (
          <div className="flex border-b border-white/10 flex-shrink-0">
            <button
              className={`flex-1 py-3 px-4 text-sm font-medium transition-colors ${
                activeTab === 'latest'
                  ? 'text-primary border-b-2 border-primary'
                  : 'text-text-muted hover:text-text'
              }`}
              onClick={() => setActiveTab('latest')}
            >
              Latest Song
            </button>
            <button
              className={`flex-1 py-3 px-4 text-sm font-medium transition-colors ${
                activeTab === 'associated'
                  ? 'text-primary border-b-2 border-primary'
                  : 'text-text-muted hover:text-text'
              }`}
              onClick={() => setActiveTab('associated')}
            >
              Songs About Them
            </button>
          </div>
        )}

        {/* Content */}
        <div className="p-6 text-center overflow-y-auto flex-1">
          {activeTab === 'latest' ? (
            <LatestSongTab 
              latestSong={latestSong} 
              user={user}
              isCurrentUser={isCurrentUser}
              onPlayOnSpotify={onPlayOnSpotify}
            />
          ) : (
            <AssociatedSongsTab
              associations={associations}
              loading={loadingAssociations}
              friendId={user.id}
              friendName={user.username}
              onPlayOnSpotify={onPlayOnSpotify}
              onAssociationAdded={fetchAssociations}
            />
          )}
        </div>
      </div>
    </div>
  )
}

// Latest Song Tab Component
function LatestSongTab({ 
  latestSong, 
  user, 
  isCurrentUser,
  onPlayOnSpotify 
}: { 
  latestSong: AviaryBirdType['latestSong']
  user: AviaryBirdType['user']
  isCurrentUser: boolean
  onPlayOnSpotify: (trackId: string) => void
}) {
  if (!latestSong) {
    return (
      <div className="py-8">
        <div className="text-4xl mb-4">🎵</div>
        <p className="text-text-muted">
          {isCurrentUser 
            ? "You haven't logged a song yet today." 
            : `${user.username} hasn't logged a song yet.`}
        </p>
        {isCurrentUser && (
          <a 
            href="/" 
            className="inline-block mt-4 px-5 py-2.5 bg-primary text-bg rounded-lg font-semibold no-underline hover:bg-primary/90 transition-colors"
          >
            Log your Song of the Day
          </a>
        )}
      </div>
    )
  }

  return (
    <>
      {/* Album art */}
      <div className="mb-4 relative inline-block">
        <Image
          src={latestSong.albumArtUrl}
          alt={`${latestSong.trackName} album artwork`}
          width={180}
          height={180}
          className="rounded-xl shadow-lg"
        />
      </div>

      {/* Song info */}
      <div className="mb-4">
        <h2 className="text-lg font-bold text-text truncate">
          {latestSong.trackName}
        </h2>
        <p className="text-text-muted text-sm truncate">
          {latestSong.artistName}
        </p>
      </div>

      {/* Mentioned people */}
      {latestSong.taggedPeople && latestSong.taggedPeople.length > 0 && (
        <div className="mb-5 text-sm">
          <span className="text-text-muted">Mentioned: </span>
          <span className="text-primary">
            {latestSong.taggedPeople.map(p => p.name).join(', ')}
          </span>
        </div>
      )}

      {/* Spotify button */}
      <button
        className="inline-flex items-center gap-2 bg-[#1DB954] hover:bg-[#1ed760] text-white border-none rounded-full px-6 py-3 font-semibold cursor-pointer transition-all hover:scale-105 active:scale-95"
        onClick={() => onPlayOnSpotify(latestSong.spotifyTrackId)}
      >
        <SpotifyIcon />
        Listen on Spotify
      </button>
    </>
  )
}

// Associated Songs Tab Component
function AssociatedSongsTab({
  associations,
  loading,
  friendId,
  friendName,
  onPlayOnSpotify,
  onAssociationAdded,
}: {
  associations: SongAssociation[]
  loading: boolean
  friendId: string
  friendName: string
  onPlayOnSpotify: (trackId: string) => void
  onAssociationAdded: () => void
}) {
  const [showAddForm, setShowAddForm] = useState(false)

  if (loading) {
    return (
      <div className="py-8">
        <div className="animate-pulse text-text-muted">Loading songs...</div>
      </div>
    )
  }

  return (
    <div className="space-y-4">
      {/* Add song button */}
      {!showAddForm && (
        <button
          onClick={() => setShowAddForm(true)}
          className="w-full py-3 px-4 border-2 border-dashed border-white/20 rounded-xl text-text-muted hover:border-primary hover:text-primary transition-colors"
        >
          + Add a song that reminds you of {friendName}
        </button>
      )}

      {/* Add song form */}
      {showAddForm && (
        <AddSongForm 
          friendId={friendId}
          friendName={friendName}
          onCancel={() => setShowAddForm(false)}
          onSuccess={() => {
            setShowAddForm(false)
            onAssociationAdded()
          }}
        />
      )}

      {/* List of associated songs */}
      {associations.length === 0 && !showAddForm ? (
        <div className="py-6 text-text-muted text-sm">
          No songs associated with {friendName} yet.
        </div>
      ) : (
        <div className="space-y-3 max-h-[300px] overflow-y-auto">
          {associations.map((assoc) => (
            <div 
              key={assoc.id}
              className="flex items-center gap-3 p-3 bg-card rounded-xl text-left"
            >
              {assoc.albumArt && (
                <Image
                  src={assoc.albumArt}
                  alt=""
                  width={48}
                  height={48}
                  className="rounded-lg flex-shrink-0"
                />
              )}
              <div className="flex-1 min-w-0">
                <p className="text-text font-medium text-sm truncate">
                  {assoc.songTitle}
                </p>
                <p className="text-text-muted text-xs truncate">
                  {assoc.artist}
                </p>
                {assoc.note && (
                  <p className="text-text-muted text-xs italic mt-1 truncate">
                    "{assoc.note}"
                  </p>
                )}
              </div>
              {assoc.trackId && (
                <button
                  onClick={() => onPlayOnSpotify(assoc.trackId!)}
                  className="flex-shrink-0 w-8 h-8 rounded-full bg-[#1DB954] flex items-center justify-center hover:scale-110 transition-transform"
                  aria-label="Play on Spotify"
                >
                  <PlayIcon />
                </button>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  )
}

// Spotify track result type
interface SpotifyTrack {
  id: string
  name: string
  artist: string
  album: string
  albumArt: string
  uri: string
}

// Add Song Form Component with Spotify Search
function AddSongForm({
  friendId,
  friendName,
  onCancel,
  onSuccess,
}: {
  friendId: string
  friendName: string
  onCancel: () => void
  onSuccess: () => void
}) {
  const [searchQuery, setSearchQuery] = useState('')
  const [searchResults, setSearchResults] = useState<SpotifyTrack[]>([])
  const [searching, setSearching] = useState(false)
  const [selectedTrack, setSelectedTrack] = useState<SpotifyTrack | null>(null)
  const [note, setNote] = useState('')
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)

  // Debounced search
  useEffect(() => {
    if (!searchQuery.trim()) {
      setSearchResults([])
      return
    }

    const timer = setTimeout(() => {
      searchSpotify(searchQuery)
    }, 300)

    return () => clearTimeout(timer)
  }, [searchQuery])

  const searchSpotify = async (query: string) => {
    setSearching(true)
    try {
      const res = await fetch(`/api/songs/search?q=${encodeURIComponent(query)}`)
      const data = await res.json()
      if (res.ok) {
        setSearchResults(data.tracks || [])
      }
    } catch (err) {
      console.error('Search error:', err)
    } finally {
      setSearching(false)
    }
  }

  const handleSelectTrack = (track: SpotifyTrack) => {
    setSelectedTrack(track)
    setSearchQuery('')
    setSearchResults([])
  }

  const handleSave = async () => {
    if (!selectedTrack) {
      setError('Please select a song')
      return
    }

    setSaving(true)
    setError(null)

    try {
      const res = await fetch('/api/song-associations', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          friendId,
          songTitle: selectedTrack.name,
          artist: selectedTrack.artist,
          albumTitle: selectedTrack.album,
          albumArt: selectedTrack.albumArt,
          trackId: selectedTrack.id,
          note: note.trim() || null,
        }),
      })

      const data = await res.json()
      if (res.ok) {
        onSuccess()
      } else {
        setError(data.error || 'Failed to save')
      }
    } catch (err) {
      setError('Failed to save song')
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="bg-card rounded-xl p-4 text-left space-y-3">
      {/* Selected track display */}
      {selectedTrack ? (
        <div className="flex items-center gap-3 p-3 bg-bg rounded-lg">
          <Image
            src={selectedTrack.albumArt}
            alt=""
            width={48}
            height={48}
            className="rounded-lg flex-shrink-0"
          />
          <div className="flex-1 min-w-0">
            <p className="text-text font-medium text-sm truncate">{selectedTrack.name}</p>
            <p className="text-text-muted text-xs truncate">{selectedTrack.artist}</p>
          </div>
          <button
            type="button"
            onClick={() => setSelectedTrack(null)}
            className="text-text-muted hover:text-text text-lg"
          >
            ×
          </button>
        </div>
      ) : (
        <>
          {/* Search input */}
          <div>
            <label className="block text-text-muted text-xs mb-1">Search for a song</label>
            <div className="relative">
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search Spotify..."
                className="w-full px-3 py-2 bg-bg border border-white/10 rounded-lg text-text text-sm placeholder:text-text-muted/50 focus:border-primary focus:outline-none"
              />
              {searching && (
                <div className="absolute right-3 top-1/2 -translate-y-1/2">
                  <div className="w-4 h-4 border-2 border-primary border-t-transparent rounded-full animate-spin" />
                </div>
              )}
            </div>
          </div>

          {/* Search results */}
          {searchResults.length > 0 && (
            <div className="max-h-[200px] overflow-y-auto space-y-2">
              {searchResults.map((track) => (
                <button
                  key={track.id}
                  type="button"
                  onClick={() => handleSelectTrack(track)}
                  className="w-full flex items-center gap-3 p-2 bg-bg hover:bg-white/5 rounded-lg transition-colors text-left"
                >
                  <Image
                    src={track.albumArt}
                    alt=""
                    width={40}
                    height={40}
                    className="rounded flex-shrink-0"
                  />
                  <div className="flex-1 min-w-0">
                    <p className="text-text text-sm truncate">{track.name}</p>
                    <p className="text-text-muted text-xs truncate">{track.artist}</p>
                  </div>
                </button>
              ))}
            </div>
          )}
        </>
      )}

      {/* Note field - only show when track selected */}
      {selectedTrack && (
        <div>
          <label className="block text-text-muted text-xs mb-1">Why this song? (optional)</label>
          <input
            type="text"
            value={note}
            onChange={(e) => setNote(e.target.value)}
            placeholder="e.g., We listened to this on our road trip"
            className="w-full px-3 py-2 bg-bg border border-white/10 rounded-lg text-text text-sm placeholder:text-text-muted/50 focus:border-primary focus:outline-none"
          />
        </div>
      )}

      {error && (
        <p className="text-red-400 text-xs">{error}</p>
      )}

      <div className="flex gap-2 pt-2">
        <button
          type="button"
          onClick={onCancel}
          className="flex-1 py-2 px-4 bg-white/5 text-text-muted rounded-lg text-sm hover:bg-white/10 transition-colors"
        >
          Cancel
        </button>
        <button
          type="button"
          onClick={handleSave}
          disabled={saving || !selectedTrack}
          className="flex-1 py-2 px-4 bg-primary text-bg rounded-lg text-sm font-semibold hover:bg-primary/90 transition-colors disabled:opacity-50"
        >
          {saving ? 'Saving...' : 'Save'}
        </button>
      </div>
    </div>
  )
}

function SpotifyIcon() {
  return (
    <svg viewBox="0 0 24 24" width="20" height="20" fill="currentColor">
      <path d="M12 0C5.4 0 0 5.4 0 12s5.4 12 12 12 12-5.4 12-12S18.66 0 12 0zm5.521 17.34c-.24.359-.66.48-1.021.24-2.82-1.74-6.36-2.101-10.561-1.141-.418.122-.779-.179-.899-.539-.12-.421.18-.78.54-.9 4.56-1.021 8.52-.6 11.64 1.32.42.18.479.659.301 1.02zm1.44-3.3c-.301.42-.841.6-1.262.3-3.239-1.98-8.159-2.58-11.939-1.38-.479.12-1.02-.12-1.14-.6-.12-.48.12-1.021.6-1.141C9.6 9.9 15 10.561 18.72 12.84c.361.181.54.78.241 1.2zm.12-3.36C15.24 8.4 8.82 8.16 5.16 9.301c-.6.179-1.2-.181-1.38-.721-.18-.601.18-1.2.72-1.381 4.26-1.26 11.28-1.02 15.721 1.621.539.3.719 1.02.419 1.56-.299.421-1.02.599-1.559.3z"/>
    </svg>
  )
}

function PlayIcon() {
  return (
    <svg viewBox="0 0 24 24" width="14" height="14" fill="white">
      <path d="M8 5v14l11-7z"/>
    </svg>
  )
}
