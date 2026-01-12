'use client'

import { useState, useEffect } from 'react'
import { useUser } from '@clerk/nextjs'
import Image from 'next/image'

interface Entry {
  id: string
  date: string
  songTitle: string
  artist: string
  albumArt: string | null
  notes?: string
  notesPreview?: string | null
  people?: Array<{ name: string }>
}

export default function HistoryTab({ onNavigateToAddEntry, onBack }: { onNavigateToAddEntry?: () => void; onBack?: () => void }) {
  const { user, isLoaded } = useUser()
  const [view, setView] = useState<'timeline' | 'on-this-day'>('on-this-day')
  const [editingEntry, setEditingEntry] = useState<Entry | null>(null)
  const [refreshKey, setRefreshKey] = useState(0)

  const handleSavePeople = async (entryId: string, people: string[]) => {
    try {
      const res = await fetch(`/api/entries/${entryId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ peopleNames: people }),
      })
      if (!res.ok) throw new Error('Failed to update people')
      // Close modal and trigger refetch
      setEditingEntry(null)
      setRefreshKey(prev => prev + 1)
    } catch (error) {
      console.error('Error saving people:', error)
      throw error
    }
  }
  
  return (
    <div className="max-w-5xl mx-auto px-3 sm:px-4 py-4 sm:py-8">
      {/* Sub-tabs */}
      <div className="flex gap-2 mb-4 sm:mb-8 w-full sm:w-fit mx-auto overflow-x-auto scrollbar-hide">
        <button
          onClick={() => setView('on-this-day')}
          className={`
            px-4 sm:px-6 py-2 rounded-lg font-medium transition-all bg-transparent whitespace-nowrap text-sm sm:text-base flex-shrink-0
            ${view === 'on-this-day' 
              ? 'text-text border-2 border-text/80' 
              : 'text-text/60 hover:text-text border-2 border-text/20'
            }
          `}
        >
          On This Day
        </button>
        <button
          onClick={() => setView('timeline')}
          className={`
            px-4 sm:px-6 py-2 rounded-lg font-medium transition-all bg-transparent whitespace-nowrap text-sm sm:text-base flex-shrink-0
            ${view === 'timeline' 
              ? 'text-text border-2 border-text/80' 
              : 'text-text/60 hover:text-text border-2 border-text/20'
            }
          `}
        >
          Timeline
        </button>
      </div>

      {view === 'on-this-day' ? (
        <OnThisDayView key={`otd-${refreshKey}`} onEditPeople={setEditingEntry} refreshKey={refreshKey} />
      ) : (
        <TimelineView key={`timeline-${refreshKey}`} onEditPeople={setEditingEntry} refreshKey={refreshKey} />
      )}

      {/* Edit People Modal */}
      {editingEntry && (
        <EditPeopleModal
          isOpen={!!editingEntry}
          onClose={() => setEditingEntry(null)}
          entry={editingEntry}
          onSave={handleSavePeople}
        />
      )}
    </div>
  )
}

// Edit People Modal Component
interface EditPeopleModalProps {
  isOpen: boolean
  onClose: () => void
  entry: Entry
  onSave: (entryId: string, people: string[]) => Promise<void>
}

function EditPeopleModal({ isOpen, onClose, entry, onSave }: EditPeopleModalProps) {
  const [peopleInput, setPeopleInput] = useState('')
  const [peopleList, setPeopleList] = useState<string[]>(
    entry.people?.map(p => p.name) || []
  )
  const [saving, setSaving] = useState(false)

  if (!isOpen) return null

  const handleAddPerson = () => {
    const trimmed = peopleInput.trim()
    if (trimmed && !peopleList.includes(trimmed)) {
      setPeopleList([...peopleList, trimmed])
      setPeopleInput('')
    }
  }

  const handleRemovePerson = (name: string) => {
    setPeopleList(peopleList.filter(p => p !== name))
  }

  const handleSave = async () => {
    setSaving(true)
    try {
      await onSave(entry.id, peopleList)
      onClose()
    } catch (error) {
      console.error('Error saving people:', error)
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50 p-4" onClick={onClose}>
      <div className="bg-surface rounded-xl max-w-md w-full p-4 sm:p-6 space-y-4" onClick={(e) => e.stopPropagation()}>
        <div className="flex items-center justify-between">
          <h3 className="text-lg sm:text-xl font-semibold">Edit People in Your Day</h3>
          <button onClick={onClose} className="text-text/60 hover:text-text text-2xl">×</button>
        </div>

        <div className="space-y-2">
          <p className="text-sm text-text/60">Song: {entry.songTitle}</p>
          <p className="text-sm text-text/60">Date: {entry.date.split('T')[0]}</p>
        </div>

        {/* Add Person Input */}
        <div className="flex gap-2">
          <input
            type="text"
            value={peopleInput}
            onChange={(e) => setPeopleInput(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter') {
                e.preventDefault()
                handleAddPerson()
              }
            }}
            placeholder="Add person's name..."
            className="flex-1 px-3 py-2 text-sm sm:text-base bg-bg border border-surface rounded-lg text-text placeholder:text-text/40 focus:border-accent outline-none transition-colors"
          />
          <button
            onClick={handleAddPerson}
            className="px-3 sm:px-4 py-2 bg-accent text-bg rounded-lg hover:bg-accent/90 transition-colors font-medium text-sm sm:text-base whitespace-nowrap"
          >
            Add
          </button>
        </div>

        {/* People List */}
        {peopleList.length > 0 ? (
          <div className="flex flex-wrap gap-2">
            {peopleList.map((person) => (
              <div
                key={person}
                className="px-3 py-1.5 bg-accent/10 border border-accent/30 rounded-full text-accent text-sm flex items-center gap-2"
              >
                {person}
                <button
                  onClick={() => handleRemovePerson(person)}
                  className="hover:text-accent/70 font-bold"
                >
                  ×
                </button>
              </div>
            ))}
          </div>
        ) : (
          <p className="text-sm text-text/60 text-center py-4">No people added yet</p>
        )}

        {/* Action Buttons */}
        <div className="flex gap-3 pt-4">
          <button
            onClick={onClose}
            className="flex-1 px-4 py-3 text-sm sm:text-base bg-bg border-2 border-surface rounded-lg text-text hover:bg-surface transition-colors font-medium"
          >
            Cancel
          </button>
          <button
            onClick={handleSave}
            disabled={saving}
            className="flex-1 px-4 py-3 text-sm sm:text-base bg-accent text-bg border-2 border-accent rounded-lg hover:bg-accent/90 transition-colors font-bold disabled:opacity-50 shadow-lg"
          >
            {saving ? 'Saving...' : 'Save'}
          </button>
        </div>
      </div>
    </div>
  )
}

function TimelineView({ onEditPeople, refreshKey }: { onEditPeople: (entry: Entry) => void; refreshKey?: number }) {
  const { isLoaded, isSignedIn } = useUser()
  const [keyword, setKeyword] = useState('')
  const [entries, setEntries] = useState<Entry[]>([])
  const [filteredEntries, setFilteredEntries] = useState<Entry[]>([])
  const [loading, setLoading] = useState(false)
  const [page, setPage] = useState(1)
  const [hasMore, setHasMore] = useState(true)
  const pageSize = 500 // Increased for faster loading

  // Reset when refreshKey changes
  useEffect(() => {
    setEntries([])
    setPage(1)
    setHasMore(true)
    fetchEntries(1, true)
  }, [refreshKey])

  useEffect(() => {
    if (keyword.trim()) {
      const keywordLower = keyword.toLowerCase()
      const filtered = entries.filter(
        (entry) =>
          entry.songTitle.toLowerCase().includes(keywordLower) ||
          entry.artist.toLowerCase().includes(keywordLower) ||
          (entry.notes && entry.notes.toLowerCase().includes(keywordLower))
      )
      setFilteredEntries(filtered)
    } else {
      setFilteredEntries(entries)
    }
  }, [keyword, entries])

  const fetchEntries = async (pageNum: number, reset: boolean = false) => {
    if (!isLoaded || !isSignedIn || (!hasMore && !reset)) return
    
    setLoading(true)
    try {
      const res = await fetch(`/api/entries?page=${pageNum}&pageSize=${pageSize}`)
      const data = await res.json()
      if (res.ok) {
        const sorted = data.entries.sort(
          (a: Entry, b: Entry) => b.date.localeCompare(a.date)
        )
        if (reset) {
          setEntries(sorted)
          setFilteredEntries(sorted)
        } else {
          setEntries((prev) => [...prev, ...sorted])
          setFilteredEntries((prev) => [...prev, ...sorted])
        }
        setHasMore(data.hasMore)
      }
    } catch (error) {
      console.error('Error fetching entries:', error)
    } finally {
      setLoading(false)
    }
  }

  const loadMore = () => {
    if (!loading && hasMore) {
      const nextPage = page + 1
      setPage(nextPage)
      fetchEntries(nextPage, false)
    }
  }

  return (
    <div className="space-y-6">
      {/* Search bar */}
      <div className="bg-surface rounded-xl p-4">
        <input
          type="text"
          value={keyword}
          onChange={(e) => setKeyword(e.target.value)}
          placeholder="Search by song, artist, or note..."
          className="w-full bg-bg rounded-lg px-4 py-3 text-text placeholder:text-text/40 border border-transparent focus:border-accent outline-none transition-colors"
        />
        {keyword && (
          <div className="mt-2 text-sm text-text/60">
            {filteredEntries.length} result(s) found
          </div>
        )}
      </div>

      {loading ? (
        <div className="text-center py-12 text-text/60">Loading timeline...</div>
      ) : (
        <div className="space-y-4">
          {filteredEntries.map((entry) => (
            <div key={entry.id} className="bg-surface rounded-xl p-6 hover:bg-surface/80 transition-colors">
              <div className="flex gap-4">
                {entry.albumArt && (
                  <Image
                    src={entry.albumArt}
                    alt={entry.songTitle}
                    width={80}
                    height={80}
                    className="rounded-lg flex-shrink-0"
                    style={{ aspectRatio: '1/1', objectFit: 'cover', objectPosition: 'center' }}
                  />
                )}
                <div className="flex-1 min-w-0">
                  <div className="flex justify-between items-start mb-1">
                    <div className="text-sm text-text/60">
                      {(() => {
                        const [year, month, day] = entry.date.split('T')[0].split('-')
                        const date = new Date(parseInt(year), parseInt(month) - 1, parseInt(day))
                        return date.toLocaleDateString('en-US', { 
                          month: 'long', 
                          day: 'numeric', 
                          year: 'numeric' 
                        })
                      })()}
                    </div>
                    <button
                      onClick={() => {
                        // TODO: Navigate to edit entry
                        window.location.href = `/?edit=${entry.date}`
                      }}
                      className="text-accent hover:text-accent/80 text-sm font-medium"
                    >
                      Edit
                    </button>
                  </div>
                  <h3 className="font-title text-xl mb-1">
                    {entry.songTitle}
                  </h3>
                  <div className="text-text/70 mb-2">
                    {entry.artist}
                  </div>
                  {entry.notes && (
                    <p className="text-text/80 text-sm line-clamp-2 mb-2">
                      {entry.notes}
                    </p>
                  )}
                  {/* People in Your Day */}
                  <div className="flex items-center gap-2 mt-2">
                    {entry.people && entry.people.length > 0 && (
                      <div className="flex flex-wrap gap-1 flex-1">
                        {entry.people.map((person, idx) => (
                          <span key={idx} className="px-2 py-1 bg-accent/10 border border-accent/30 rounded-full text-xs text-accent">
                            {person.name}
                          </span>
                        ))}
                      </div>
                    )}
                    <button
                      onClick={() => onEditPeople(entry)}
                      className="px-2 py-1 text-xs bg-surface hover:bg-accent/10 border border-accent/30 rounded text-accent transition-colors whitespace-nowrap"
                    >
                      {entry.people && entry.people.length > 0 ? 'Edit' : 'Add People'}
                    </button>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Load More Button */}
      {hasMore && (
        <div className="flex justify-center pt-6">
          <button
            onClick={loadMore}
            disabled={loading}
            className="px-6 py-3 bg-accent text-bg rounded-lg hover:bg-accent/90 transition-colors font-medium disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {loading ? 'Loading...' : 'Load More'}
          </button>
        </div>
      )}
    </div>
  )
}

function OnThisDayView({ onEditPeople, refreshKey }: { onEditPeople: (entry: Entry) => void; refreshKey?: number }) {
  const { isLoaded, isSignedIn } = useUser()
  const [selectedDate, setSelectedDate] = useState(new Date().toISOString().split('T')[0])
  const [entries, setEntries] = useState<Entry[]>([])
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    fetchHistory()
  }, [selectedDate, refreshKey])

  const fetchHistory = async () => {
    if (!isLoaded || !isSignedIn) return
    
    setLoading(true)
    try {
      // Use dedicated on-this-day endpoint to fetch all entries for this day across all years
      const res = await fetch(`/api/on-this-day?date=${selectedDate}`)
      const data = await res.json()
      if (res.ok) {
        setEntries((data.entries || []).sort((a: Entry, b: Entry) => b.date.localeCompare(a.date)))
      }
    } catch (error) {
      console.error('Error fetching history:', error)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="space-y-6">
      {/* Date picker */}
      <div className="bg-surface rounded-xl p-6 text-center">
        <label className="block text-text/70 mb-3">
          What happened on this day?
        </label>
        <input
          type="date"
          value={selectedDate}
          onChange={(e) => setSelectedDate(e.target.value)}
          className="bg-bg rounded-lg px-4 py-3 text-text border border-transparent focus:border-accent outline-none transition-colors"
        />
      </div>

      {loading ? (
        <div className="text-center py-12 text-text/60">Loading memories...</div>
      ) : entries.length > 0 ? (
        <div className="space-y-4">
          {entries.map((entry) => (
            <div key={entry.id} className="bg-surface rounded-xl p-6">
              <div className="flex gap-4">
                {entry.albumArt && (
                  <Image
                    src={entry.albumArt}
                    alt={entry.songTitle}
                    width={120}
                    height={120}
                    className="rounded-lg flex-shrink-0"
                    style={{ aspectRatio: '1/1', objectFit: 'cover', objectPosition: 'center' }}
                  />
                )}
                <div className="flex-1">
                  <div className="text-sm text-accent mb-2">
                    {entry.date.split('T')[0].split('-')[0]}
                  </div>
                  <h3 className="font-title text-2xl mb-1">
                    {entry.songTitle}
                  </h3>
                  <div className="text-text/70 mb-3">
                    {entry.artist}
                  </div>
                  {(entry.notes || entry.notesPreview) && (
                    <p className="text-text/80 mb-3">
                      {entry.notes || entry.notesPreview}
                    </p>
                  )}
                  
                  {/* People in Your Day */}
                  <div className="flex items-center gap-2">
                    {entry.people && entry.people.length > 0 && (
                      <div className="flex flex-wrap gap-1 flex-1">
                        {entry.people.map((person, idx) => (
                          <span key={idx} className="px-2 py-1 bg-accent/10 border border-accent/30 rounded-full text-xs text-accent">
                            {person.name}
                          </span>
                        ))}
                      </div>
                    )}
                    <button
                      onClick={() => onEditPeople(entry)}
                      className="px-2 py-1 text-xs bg-surface hover:bg-accent/10 border border-accent/30 rounded text-accent transition-colors whitespace-nowrap"
                    >
                      {entry.people && entry.people.length > 0 ? 'Edit' : 'Add People'}
                    </button>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="text-center py-12">
          <div className="text-5xl mb-4">📅</div>
          <p className="text-text/60">
            No memories from this day yet.
          </p>
        </div>
      )}
    </div>
  )
}


