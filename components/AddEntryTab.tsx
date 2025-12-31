'use client'

import { useState, useEffect } from 'react'
import { useSession } from 'next-auth/react'
import { useRouter } from 'next/navigation'
import Image from 'next/image'

interface Track {
  id: string
  name: string
  artist: string
  album: string
  albumArt: string
  durationMs: number
  explicit: boolean
  popularity: number
  releaseDate?: string
  uri: string
}

export default function AddEntryTab() {
  const { data: session } = useSession()
  const router = useRouter()
  const [showForm, setShowForm] = useState(false)
  const [showWrappedBanner, setShowWrappedBanner] = useState(true)
  const [date, setDate] = useState(new Date().toISOString().split('T')[0])
  const [query, setQuery] = useState('')
  const [tracks, setTracks] = useState<Track[]>([])
  const [selectedTrack, setSelectedTrack] = useState<Track | null>(null)
  const [notes, setNotes] = useState('')
  const [mentionedUsers, setMentionedUsers] = useState<Array<{ id: string; name: string; email: string }>>([])
  const [peopleNames, setPeopleNames] = useState<string[]>([])
  const [peopleInput, setPeopleInput] = useState<string>('')
  const [friends, setFriends] = useState<Array<{ id: string; name: string; email: string }>>([])
  const [loading, setLoading] = useState(false)
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null)
  const [existingEntry, setExistingEntry] = useState<{ id: string; songTitle: string; artist: string; notes?: string } | null>(null)
  const [checkingEntry, setCheckingEntry] = useState(false)
  const [showFlyingAnimation, setShowFlyingAnimation] = useState(false)
  const [onThisDayEntries, setOnThisDayEntries] = useState<Array<{ id: string; date: string; songTitle: string; artist: string; albumArt: string | null }>>([])

  // Check if it's today's date
  const isToday = date === new Date().toISOString().split('T')[0]
  const today = new Date()
  const dayName = today.toLocaleDateString('en-US', { weekday: 'long' })

  // Define functions before useEffect hooks
  const fetchFriends = async () => {
    if (!session) return

    try {
      const res = await fetch('/api/friends/list')
      const data = await res.json()
      if (res.ok) {
        setFriends(data.friends)
      }
    } catch (error) {
      console.error('Error fetching friends:', error)
    }
  }

  const checkExistingEntry = async () => {
    if (!session) return

    setCheckingEntry(true)
    try {
      const res = await fetch(`/api/entries?date=${date}`)
      const data = await res.json()
      if (res.ok && data.entries && data.entries.length > 0) {
        const entry = data.entries[0]
        setExistingEntry({
          id: entry.id,
          songTitle: entry.songTitle,
          artist: entry.artist,
          notes: entry.notes || '',
        })
        // Load existing notes, mentions, and people
        setNotes(entry.notes || '')
        if (entry.mentions && entry.mentions.length > 0) {
          setMentionedUsers(entry.mentions.map((mention: any) => mention.user))
        } else {
          setMentionedUsers([])
        }
        if (entry.people && entry.people.length > 0) {
          setPeopleNames(entry.people.map((person: any) => person.name))
        } else {
          setPeopleNames([])
        }
        setPeopleInput('')
      } else {
        setExistingEntry(null)
        // Only clear if user hasn't typed anything yet
        if (!selectedTrack) {
          setNotes('')
          setMentionedUsers([])
          setPeopleNames([])
          setPeopleInput('')
        }
      }
    } catch (error) {
      console.error('Error checking existing entry:', error)
    } finally {
      setCheckingEntry(false)
    }
  }

  // Fetch friends list for mentions
  useEffect(() => {
    fetchFriends()
  }, [session])

  // Check for existing entry when date changes
  useEffect(() => {
    checkExistingEntry()
  }, [date, session])

  // Fetch On This Day entries for teaser
  useEffect(() => {
    if (isToday && !showForm && !existingEntry && session) {
      const todayStr = new Date().toISOString().split('T')[0]
      fetch(`/api/on-this-day?date=${todayStr}`)
        .then(res => res.json())
        .then(data => {
          if (data.entries && data.entries.length > 0) {
            setOnThisDayEntries(data.entries.slice(0, 2)) // Max 2 entries
          }
        })
        .catch(err => console.error('Error fetching on-this-day:', err))
    } else {
      setOnThisDayEntries([])
    }
  }, [isToday, showForm, existingEntry, session])
  
  // If today and no form shown and no existing entry, show the songbird landing page
  if (isToday && !showForm && !existingEntry) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh]">
        {/* Date header */}
        <div className="text-center mb-12">
          <h2 className="text-4xl font-bold text-text mb-2">
            {dayName}, {today.toLocaleDateString('en-US', { month: 'long', day: 'numeric' })}
          </h2>
          <p className="text-text/60 text-lg">How will we remember today?</p>
        </div>

        {/* Songbird icon - clickable */}
        {showFlyingAnimation ? (
          <div className="mb-8 flex justify-center">
            <video 
              src="/movingbirdbrowon.mp4" 
              autoPlay
              loop={false}
              muted
              className="w-36 h-36 object-contain"
              onEnded={() => {
                setShowForm(true)
                setShowFlyingAnimation(false)
              }}
            />
          </div>
        ) : (
          <button
            onClick={(e) => {
              e.preventDefault()
              e.stopPropagation()
              setShowFlyingAnimation(true)
              // Show video for 2 seconds, then show form
              setTimeout(() => {
                setShowForm(true)
                setShowFlyingAnimation(false)
              }, 2000)
            }}
            className="group relative mb-8 transition-all hover:scale-110 active:scale-95 cursor-pointer focus:outline-none focus:ring-2 focus:ring-accent/50 rounded-full"
            aria-label="Add today's song"
            type="button"
          >
            <div className="animate-bounce transition-all group-hover:drop-shadow-[0_0_20px_rgba(255,255,255,0.5)]" style={{ animationDuration: '2s' }}>
              <Image 
                src="/SongBirdlogo.png" 
                alt="SongBird" 
                width={144} 
                height={144} 
                className="object-contain"
                priority
              />
            </div>
            <div className="absolute -bottom-2 left-1/2 transform -translate-x-1/2 opacity-0 group-hover:opacity-100 transition-opacity">
              <div className="bg-accent text-bg text-sm px-4 py-2 rounded-lg whitespace-nowrap shadow-lg">
                Add Entry
              </div>
            </div>
          </button>
        )}

        {/* Subtitle */}
        <div className="text-center">
          <p className="text-text/60 text-base">No song yet</p>
          <p className="text-text/40 text-sm">What song will hold today together?</p>
        </div>

        {/* Wrapped Banner - moved here */}
        {showWrappedBanner && (
          <div className="mt-8 bg-gradient-to-r from-primary/20 to-accent/20 border border-primary/30 rounded-xl p-4 flex items-center justify-between gap-4">
            <div className="flex items-center gap-3 flex-1 min-w-0">
              <span className="text-3xl flex-shrink-0">🎁</span>
              <div className="min-w-0">
                <p className="font-semibold text-white">Your Wrapped is Here!</p>
                <p className="text-sm text-text/70">See your year in music</p>
              </div>
            </div>
            <button
              onClick={() => {
                setShowWrappedBanner(false)
                // Navigate to wrapped by setting activeTab in Dashboard
                // We'll use a custom event that Dashboard can listen to
                window.dispatchEvent(new CustomEvent('navigateToWrapped'))
              }}
              className="bg-primary hover:bg-primary/90 text-white px-3 py-1.5 rounded-lg text-xs font-medium transition-colors flex-shrink-0 whitespace-nowrap"
            >
              View →
            </button>
          </div>
        )}

        {/* On This Day Teaser - subtle, below main content */}
        {onThisDayEntries.length > 0 && (
          <div className="mt-8 pt-8 border-t border-surface/30">
            <div className="flex items-center justify-between mb-3">
              <h3 className="text-sm font-medium text-text/70">On this day…</h3>
              <button
                onClick={() => {
                  // Navigate to Memory tab with today's date
                  window.dispatchEvent(new CustomEvent('navigateToMemory', { detail: { date: new Date().toISOString().split('T')[0] } }))
                }}
                className="text-xs text-accent hover:text-accent/80 transition-colors"
              >
                See all →
              </button>
            </div>
            <div className="space-y-2">
              {onThisDayEntries.map((entry) => (
                <div key={entry.id} className="flex items-center gap-3 bg-surface/50 rounded-lg p-2">
                  {entry.albumArt && (
                    <Image
                      src={entry.albumArt}
                      alt={entry.songTitle}
                      width={40}
                      height={40}
                      className="rounded flex-shrink-0"
                      style={{ aspectRatio: '1/1', objectFit: 'cover' }}
                    />
                  )}
                  <div className="flex-1 min-w-0">
                    <div className="text-xs text-text/60">{entry.date.split('-')[0]}</div>
                    <div className="text-sm font-medium truncate">{entry.songTitle}</div>
                    <div className="text-xs text-text/70 truncate">{entry.artist}</div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    )
  }

  const handleWrappedClick = () => {
    // Navigate to insights tab - would need to be passed as prop from Dashboard
    // For now, just hide the banner
    setShowWrappedBanner(false)
  }

  const searchSongs = async () => {
    if (!query.trim()) return

    setLoading(true)
    try {
      const res = await fetch(`/api/songs/search?q=${encodeURIComponent(query)}`)
      const data = await res.json()
      if (res.ok) {
        setTracks(data.tracks)
      } else {
        setMessage({ type: 'error', text: data.error || 'Failed to search songs' })
      }
    } catch (error) {
      setMessage({ type: 'error', text: 'Failed to search songs' })
    } finally {
      setLoading(false)
    }
  }

  const addPerson = (name: string) => {
    const trimmedName = name.trim()
    if (trimmedName && !peopleNames.includes(trimmedName)) {
      setPeopleNames([...peopleNames, trimmedName])
      setPeopleInput('')
    }
  }

  const removePerson = (name: string) => {
    setPeopleNames(peopleNames.filter((n) => n !== name))
  }

  const handlePeopleInputKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter' || e.key === ',') {
      e.preventDefault()
      if (peopleInput.trim()) {
        addPerson(peopleInput)
      }
    } else if (e.key === 'Backspace' && peopleInput === '' && peopleNames.length > 0) {
      // Remove last person if backspace on empty input
      removePerson(peopleNames[peopleNames.length - 1])
    }
  }

  const addMentionedUser = (user: { id: string; name: string; email: string }) => {
    if (!mentionedUsers.find((u) => u.id === user.id)) {
      setMentionedUsers([...mentionedUsers, user])
    }
  }

  const removeMentionedUser = (userId: string) => {
    setMentionedUsers(mentionedUsers.filter((u) => u.id !== userId))
  }

  const updateMentions = async (entryId: string) => {
    try {
      // Get current mentions from the entry
      const entryRes = await fetch(`/api/entries?date=${date}`)
      const entryData = await entryRes.json()
      
      if (!entryRes.ok || !entryData.entries || entryData.entries.length === 0) {
        return
      }

      const entry = entryData.entries[0]
      const currentMentionIds = entry.mentions
        ? entry.mentions.map((m: any) => m.user.id)
        : []
      const newMentionIds = mentionedUsers.map((u) => u.id)

      // Remove mentions that are no longer in the list
      for (const currentMentionId of currentMentionIds) {
        if (!newMentionIds.includes(currentMentionId)) {
          await fetch(`/api/mentions?entryId=${entryId}&userId=${currentMentionId}`, {
            method: 'DELETE',
          })
        }
      }

      // Add new mentions
      for (const mentionedUser of mentionedUsers) {
        if (!currentMentionIds.includes(mentionedUser.id)) {
          await fetch('/api/mentions', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              entryId,
              userId: mentionedUser.id,
            }),
          })
        }
      }
    } catch (error) {
      console.error('Error updating mentions:', error)
    }
  }

  const saveEntry = async () => {
    if (!selectedTrack) {
      setMessage({ type: 'error', text: 'Please select a song' })
      return
    }

    setLoading(true)
    try {
      // If entry exists, update it; otherwise create new
      if (existingEntry) {
        const res = await fetch(`/api/entries/${existingEntry.id}`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            songTitle: selectedTrack.name,
            artist: selectedTrack.artist,
            albumTitle: selectedTrack.album,
            albumArt: selectedTrack.albumArt,
            durationMs: selectedTrack.durationMs,
            explicit: selectedTrack.explicit,
            popularity: selectedTrack.popularity,
            releaseDate: selectedTrack.releaseDate,
            trackId: selectedTrack.id,
            uri: selectedTrack.uri,
            notes, // Preserve notes
            peopleNames: peopleNames.filter((name) => name.trim().length > 0),
          }),
        })

        const data = await res.json()
        if (res.ok) {
          // Update mentions after entry is saved
          await updateMentions(existingEntry.id)
          setMessage({ type: 'success', text: `🎵 Updated to ${selectedTrack.name} by ${selectedTrack.artist}! Notes preserved.` })
          setSelectedTrack(null)
          setQuery('')
          setTracks([])
          // Don't clear notes - they're preserved
          await checkExistingEntry() // Refresh existing entry data
        } else {
          setMessage({ type: 'error', text: data.error || 'Failed to update entry' })
        }
      } else {
        const res = await fetch('/api/entries', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            date,
            songTitle: selectedTrack.name,
            artist: selectedTrack.artist,
            albumTitle: selectedTrack.album,
            albumArt: selectedTrack.albumArt,
            durationMs: selectedTrack.durationMs,
            explicit: selectedTrack.explicit,
            popularity: selectedTrack.popularity,
            releaseDate: selectedTrack.releaseDate,
            trackId: selectedTrack.id,
            uri: selectedTrack.uri,
            notes,
            peopleNames: peopleNames.filter((name) => name.trim().length > 0),
          }),
        })

        const data = await res.json()
        if (res.ok) {
          // Add mentions after entry is created
          if (data.entry && mentionedUsers.length > 0) {
            await updateMentions(data.entry.id)
          }
          setMessage({ type: 'success', text: `🎵 ${selectedTrack.name} by ${selectedTrack.artist} added successfully!` })
          setSelectedTrack(null)
          setQuery('')
          setTracks([])
          setNotes('')
          setMentionedUsers([])
          setPeopleNames([])
          setPeopleInput('')
          await checkExistingEntry() // Refresh to show it now exists
        } else {
          setMessage({ type: 'error', text: data.error || 'Failed to save entry' })
        }
      }
    } catch (error) {
      setMessage({ type: 'error', text: 'Failed to save entry' })
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="space-y-6">
      <div>
        <h3 className="text-xl font-semibold mb-4">➕ Add a New Song of the Day</h3>
        
        <div className="mb-4">
          <label className="block mb-2">Select a Date (You can pick any date)</label>
          <input
            type="date"
            value={date}
            onChange={(e) => setDate(e.target.value)}
            onClick={(e) => e.currentTarget.showPicker?.()}
            className="w-full px-4 py-2 bg-card border border-primary rounded text-primary cursor-pointer"
            title="Click to change the date"
          />
          <p className="text-sm text-primary/60 mt-1">
            Currently selected: {new Date(date + 'T12:00:00').toLocaleDateString('en-US', { 
              year: 'numeric', 
              month: 'long', 
              day: 'numeric' 
            })}
          </p>
          
          {checkingEntry ? (
            <p className="text-sm text-primary/60 mt-1">Checking for existing entry...</p>
          ) : existingEntry ? (
            <div className="mt-2 p-3 bg-green-900/30 border border-green-500/50 rounded">
              <p className="text-green-300 font-semibold">
                ✅ Entry exists for this date: <strong>{existingEntry.songTitle}</strong> by <strong>{existingEntry.artist}</strong>
              </p>
              <p className="text-sm text-green-300/80 mt-1">
                You can change the song below - your notes will be preserved!
              </p>
            </div>
          ) : (
            <div className="mt-2 p-3 bg-warn-bg/30 border border-red-500/50 rounded">
              <p className="text-red-300 font-semibold">
                🔴 No entry exists for this date. Add a song below.
              </p>
            </div>
          )}
        </div>

        <div className="mb-4">
          <label className="block mb-2">Search for a Song on Spotify</label>
          <div className="flex gap-2">
            <input
              type="text"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              onKeyPress={(e) => e.key === 'Enter' && searchSongs()}
              placeholder="Enter song name..."
              className="flex-1 px-4 py-2 bg-card border border-primary rounded text-primary"
            />
            <button
              onClick={searchSongs}
              disabled={loading}
              className="px-6 py-2 bg-card border border-primary rounded hover:bg-primary/10 transition-colors"
            >
              Search
            </button>
          </div>
        </div>

        {tracks.length > 0 && (
          <div className="mb-4">
            <label className="block mb-2">Select a Song</label>
            <div className="space-y-2">
              {tracks.map((track) => (
                <div
                  key={track.id}
                  onClick={() => setSelectedTrack(track)}
                  className={`p-3 border rounded cursor-pointer transition-colors ${
                    selectedTrack?.id === track.id
                      ? 'border-primary bg-primary/10'
                      : 'border-primary/30 hover:border-primary/60'
                  }`}
                >
                  <div className="flex items-center gap-3">
                    {track.albumArt && (
                      <Image
                        src={track.albumArt}
                        alt={track.album}
                        width={60}
                        height={60}
                        className="rounded"
                      />
                    )}
                    <div>
                      <div className="font-semibold">{track.name}</div>
                      <div className="text-sm text-primary/80">{track.artist}</div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {selectedTrack && (
          <div className="mb-4 p-4 bg-card border border-primary rounded">
            <div className="flex gap-4 mb-4">
              {selectedTrack.albumArt && (
                <Image
                  src={selectedTrack.albumArt}
                  alt={selectedTrack.album}
                  width={200}
                  height={200}
                  className="rounded"
                />
              )}
              <div>
                <h4 className="text-xl font-bold">{selectedTrack.name}</h4>
                <p className="text-primary/80">{selectedTrack.artist}</p>
                <p className="text-sm text-primary/60">{selectedTrack.album}</p>
              </div>
            </div>

            <div className="mb-4">
              <label className="block mb-2">
                People in Your Day <span className="text-sm text-primary/60">(Private)</span>
              </label>
              <div className="flex flex-wrap gap-2 p-2 bg-bg border border-primary rounded min-h-[2.5rem] items-center">
                {peopleNames.map((name, index) => (
                  <span
                    key={index}
                    className="px-3 py-1 bg-blue-600/30 border border-blue-500/50 rounded-full text-sm flex items-center gap-2"
                  >
                    {name}
                    <button
                      onClick={() => removePerson(name)}
                      className="hover:text-red-400 text-lg leading-none"
                      type="button"
                    >
                      ×
                    </button>
                  </span>
                ))}
                <input
                  type="text"
                  value={peopleInput}
                  onChange={(e) => setPeopleInput(e.target.value)}
                  onKeyDown={handlePeopleInputKeyDown}
                  placeholder={peopleNames.length === 0 ? "Type a name and press Enter..." : ""}
                  className="flex-1 min-w-[120px] bg-transparent border-none outline-none text-primary placeholder:text-primary/40"
                />
              </div>
              <p className="text-xs text-primary/60 mt-1">
                Type a name and press Enter. We'll automatically link them if they have an account.
              </p>
            </div>

            <div className="mb-4">
              <label className="block mb-2">
                Mention Friends <span className="text-sm text-primary/60">(They'll be notified)</span>
              </label>
              {friends.length === 0 ? (
                <div className="text-sm text-primary/60 p-2 bg-bg rounded border border-primary/30">
                  No friends yet. Add friends in the Friends tab to mention them!
                </div>
              ) : (
                <>
                  <div className="border border-primary rounded bg-card max-h-40 overflow-y-auto">
                    {friends.map((friend) => (
                      <div
                        key={friend.id}
                        onClick={() => {
                          if (mentionedUsers.find((u) => u.id === friend.id)) {
                            removeMentionedUser(friend.id)
                          } else {
                            addMentionedUser(friend)
                          }
                        }}
                        className={`p-2 hover:bg-primary/10 cursor-pointer flex items-center justify-between ${
                          mentionedUsers.find((u) => u.id === friend.id)
                            ? 'bg-primary/20'
                            : ''
                        }`}
                      >
                        <span>{friend.name || friend.email}</span>
                        {mentionedUsers.find((u) => u.id === friend.id) && (
                          <span className="text-green-400">✓</span>
                        )}
                      </div>
                    ))}
                  </div>
                  {mentionedUsers.length > 0 && (
                    <div className="flex flex-wrap gap-2 mt-2">
                      {mentionedUsers.map((user) => (
                        <span
                          key={user.id}
                          className="px-3 py-1 bg-green-600/30 border border-green-500/50 rounded-full text-sm flex items-center gap-2"
                        >
                          @{user.name || user.email.split('@')[0]}
                          <button
                            onClick={() => removeMentionedUser(user.id)}
                            className="hover:text-red-400"
                          >
                            ×
                          </button>
                        </span>
                      ))}
                    </div>
                  )}
                </>
              )}
            </div>

            <div className="mb-4">
              <label className="block mb-2">Enter Notes for the Day</label>
              <textarea
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                placeholder="What made this song special today?"
                rows={4}
                className="w-full px-4 py-2 bg-card border border-primary rounded text-primary"
              />
            </div>

            <button
              onClick={saveEntry}
              disabled={loading}
              className="px-6 py-2 bg-primary text-bg font-semibold rounded hover:bg-primary/80 transition-colors"
            >
              {loading ? 'Saving...' : 'Save Entry'}
            </button>
          </div>
        )}

        {message && (
          <div
            className={`p-4 rounded ${
              message.type === 'success'
                ? 'bg-green-900/30 text-green-300'
                : 'bg-warn-bg text-warn-text'
            }`}
          >
            {message.text}
          </div>
        )}
      </div>

    </div>
  )
}


