'use client'

import { useState, useEffect } from 'react'
import { useUser } from '@clerk/nextjs'
import Link from 'next/link'

interface Entry {
  id: string
  date: string
  songTitle: string
  artist: string
  albumArt: string | null
  notes?: string
  people?: Array<{ id: string; name: string }>
}

interface MonthGroup {
  month: string // "December 2025"
  year: number
  monthNum: number
  entries: Entry[]
}

export default function ArchivePage() {
  const { isSignedIn, isLoaded } = useUser()
  const [entries, setEntries] = useState<Entry[]>([])
  const [monthGroups, setMonthGroups] = useState<MonthGroup[]>([])
  const [expandedMonths, setExpandedMonths] = useState<Set<string>>(new Set())
  const [loading, setLoading] = useState(false)
  const [keyword, setKeyword] = useState('')
  const [loadingProgress, setLoadingProgress] = useState('')
  const [editingEntry, setEditingEntry] = useState<Entry | null>(null)

  useEffect(() => {
    if (isLoaded && isSignedIn) {
      fetchAllEntries()
    }
  }, [isLoaded, isSignedIn])

  useEffect(() => {
    groupEntriesByMonth()
  }, [entries])

  // Expand most recent month by default
  useEffect(() => {
    if (monthGroups.length > 0 && expandedMonths.size === 0) {
      const mostRecent = monthGroups[0]
      setExpandedMonths(new Set([mostRecent.month]))
    }
  }, [monthGroups])

  const fetchAllEntries = async () => {
    if (!isSignedIn) return
    
    setLoading(true)
    setLoadingProgress('Loading your complete archive...')
    const allEntries: Entry[] = []
    let page = 1
    let hasMore = true
    
    try {
      while (hasMore) {
        setLoadingProgress(`Loading page ${page}...`)
        const res = await fetch(`/api/entries?page=${page}&pageSize=1000&excludeImages=true`)
        const data = await res.json()
        
        if (res.ok && data.entries) {
          allEntries.push(...data.entries)
          hasMore = data.hasMore
          page++
        } else {
          hasMore = false
        }
      }
      
      setEntries(allEntries)
      setLoadingProgress('')
    } catch (error) {
      console.error('Error fetching entries:', error)
      setLoadingProgress('Error loading archive')
    } finally {
      setLoading(false)
    }
  }

  const groupEntriesByMonth = () => {
    const groups: { [key: string]: Entry[] } = {}
    
    entries.forEach((entry) => {
      const date = new Date(entry.date)
      const monthKey = date.toLocaleDateString('en-US', { month: 'long', year: 'numeric' })
      
      if (!groups[monthKey]) {
        groups[monthKey] = []
      }
      groups[monthKey].push(entry)
    })

    const monthGroupsArray: MonthGroup[] = Object.keys(groups)
      .map((month) => {
        const date = new Date(groups[month][0].date)
        return {
          month,
          year: date.getFullYear(),
          monthNum: date.getMonth(),
          entries: groups[month].sort((a, b) => b.date.localeCompare(a.date)),
        }
      })
      .sort((a, b) => {
        if (a.year !== b.year) return b.year - a.year
        return b.monthNum - a.monthNum
      })

    setMonthGroups(monthGroupsArray)
  }

  const toggleMonth = (month: string) => {
    const newExpanded = new Set(expandedMonths)
    if (newExpanded.has(month)) {
      newExpanded.delete(month)
    } else {
      newExpanded.add(month)
    }
    setExpandedMonths(newExpanded)
  }

  const handleSavePeople = async (entryId: string, people: string[]) => {
    try {
      const res = await fetch(`/api/entries/${entryId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ peopleNames: people }),
      })
      if (!res.ok) throw new Error('Failed to update people')
      
      // Update the entry in state
      setEntries(prevEntries => prevEntries.map(entry => {
        if (entry.id === entryId) {
          return {
            ...entry,
            people: people.map(name => ({ id: '', name }))
          }
        }
        return entry
      }))
      
      setEditingEntry(null)
    } catch (error) {
      console.error('Error saving people:', error)
      throw error
    }
  }


  const filteredMonthGroups = keyword.trim()
    ? monthGroups.map((group) => ({
        ...group,
        entries: group.entries.filter(
          (entry) =>
            entry.songTitle.toLowerCase().includes(keyword.toLowerCase()) ||
            entry.artist.toLowerCase().includes(keyword.toLowerCase()) ||
            (entry.notes && entry.notes.toLowerCase().includes(keyword.toLowerCase()))
        ),
      })).filter((group) => group.entries.length > 0)
    : monthGroups

  return (
    <div className="min-h-screen bg-bg text-white">
      <div className="max-w-5xl mx-auto px-3 sm:px-4 py-4 sm:py-8">
        {/* Header */}
        <div className="mb-8">
          <Link href="/" className="text-accent hover:text-accent/80 text-sm mb-4 inline-block">
            ← Back to Memory
          </Link>
          <h1 className="text-3xl sm:text-4xl font-bold mb-4">Archive</h1>
          <p className="text-text/60">Your complete song history</p>
        </div>

        {/* Search */}
        <div className="bg-surface rounded-xl p-4 mb-6">
          <input
            type="text"
            value={keyword}
            onChange={(e) => setKeyword(e.target.value)}
            placeholder="Search by song, artist, or note..."
            className="w-full bg-bg rounded-lg px-4 py-3 text-text placeholder:text-text/40 border border-transparent focus:border-accent outline-none transition-colors"
          />
        </div>

        {/* Loading Screen */}
        {loading && entries.length === 0 ? (
          <div className="text-center py-12">
            <div className="text-text/60 mb-4">{loadingProgress || 'Loading archive...'}</div>
            <div className="w-full max-w-md mx-auto bg-surface rounded-full h-2 overflow-hidden">
              <div className="bg-accent h-full animate-pulse" style={{ width: '60%' }}></div>
            </div>
          </div>
        ) : filteredMonthGroups.length > 0 ? (
          <div className="space-y-4">
            {filteredMonthGroups.map((group) => (
              <div key={group.month} className="bg-surface rounded-xl overflow-hidden">
                {/* Month Header */}
                <button
                  onClick={() => toggleMonth(group.month)}
                  className="w-full px-6 py-4 flex items-center justify-between hover:bg-surface/80 transition-colors"
                >
                  <h2 className="text-xl font-semibold">{group.month}</h2>
                  <span className="text-text/60">
                    {expandedMonths.has(group.month) ? '−' : '+'} ({group.entries.length})
                  </span>
                </button>

                {/* Month Entries */}
                {expandedMonths.has(group.month) && (
                  <div className="px-6 pb-4 space-y-3">
                    {group.entries.map((entry) => (
                      <div
                        key={entry.id}
                        className="bg-bg rounded-lg p-4 hover:bg-accent/5 transition-colors"
                      >
                        <div className="flex gap-3">
                          {/* No album art for archive - faster loading */}
                          <div className="flex-1 min-w-0">
                            <div className="flex items-start justify-between mb-1">
                              <div className="text-xs text-text/60">
                                {(() => {
                                  const [year, month, day] = entry.date.split('-')
                                  const date = new Date(parseInt(year), parseInt(month) - 1, parseInt(day))
                                  return date.toLocaleDateString('en-US', { 
                                    month: 'short', 
                                    day: 'numeric', 
                                    year: 'numeric' 
                                  })
                                })()}
                              </div>
                              <Link
                                href={`/?edit=${entry.date}`}
                                className="text-xs text-accent hover:text-accent/80 transition-colors"
                              >
                                Edit Entry
                              </Link>
                            </div>
                            <h4 className="font-semibold text-lg mb-1 truncate">
                              {entry.songTitle}
                            </h4>
                            <div className="text-text/70 text-sm mb-2 truncate">
                              {entry.artist}
                            </div>
                            {entry.notes && (
                              <p className="text-text/80 text-sm line-clamp-2 mb-2">
                                {entry.notes.length > 160 ? entry.notes.substring(0, 160) + '...' : entry.notes}
                              </p>
                            )}
                            {/* People in Your Day */}
                            <div className="flex items-center gap-2 mt-2">
                              {entry.people && entry.people.length > 0 && (
                                <div className="flex flex-wrap gap-1 flex-1">
                                  {entry.people.map((person) => (
                                    <span
                                      key={person.id || person.name}
                                      className="px-2 py-1 bg-accent/10 border border-accent/30 rounded-full text-xs text-accent"
                                    >
                                      {person.name}
                                    </span>
                                  ))}
                                </div>
                              )}
                              <button
                                onClick={(e) => {
                                  e.stopPropagation()
                                  setEditingEntry(entry)
                                }}
                                className="px-2 py-1 text-xs bg-surface hover:bg-accent/10 border border-accent/30 rounded text-accent transition-colors whitespace-nowrap"
                              >
                                {entry.people && entry.people.length > 0 ? 'Edit People' : 'Add People'}
                              </button>
                            </div>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            ))}
          </div>
        ) : (
          <div className="text-center py-12 text-text/60">
            {keyword ? 'No results found' : 'No entries yet'}
          </div>
        )}

      </div>

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

