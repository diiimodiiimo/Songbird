'use client'

import { useState, useEffect } from 'react'
import { useSession } from 'next-auth/react'
import Link from 'next/link'

interface Entry {
  id: string
  date: string
  songTitle: string
  artist: string
  albumArt: string | null
  notes?: string
}

interface MonthGroup {
  month: string // "December 2025"
  year: number
  monthNum: number
  entries: Entry[]
}

export default function ArchivePage() {
  const { data: session } = useSession()
  const [entries, setEntries] = useState<Entry[]>([])
  const [monthGroups, setMonthGroups] = useState<MonthGroup[]>([])
  const [expandedMonths, setExpandedMonths] = useState<Set<string>>(new Set())
  const [loading, setLoading] = useState(false)
  const [keyword, setKeyword] = useState('')
  const [loadingProgress, setLoadingProgress] = useState('')

  useEffect(() => {
    if (session) {
      fetchAllEntries()
    }
  }, [session])

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
    if (!session) return
    
    setLoading(true)
    setLoadingProgress('Loading your complete archive...')
    const allEntries: Entry[] = []
    let page = 1
    let hasMore = true
    
    try {
      while (hasMore) {
        setLoadingProgress(`Loading page ${page}...`)
        const res = await fetch(`/api/entries?page=${page}&pageSize=500&excludeImages=true`)
        const data = await res.json()
        
        if (res.ok && data.entries) {
          allEntries.push(...data.entries)
          hasMore = data.hasMore
          page++
          
          // Small delay to prevent overwhelming the server
          if (hasMore) {
            await new Promise(resolve => setTimeout(resolve, 100))
          }
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
                      <Link
                        key={entry.id}
                        href={`/?edit=${entry.date}`}
                        className="block bg-bg rounded-lg p-4 hover:bg-accent/5 transition-colors"
                      >
                        <div className="flex gap-3">
                          {/* No album art for archive - faster loading */}
                          <div className="flex-1 min-w-0">
                            <div className="text-xs text-text/60 mb-1">
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
                            <h4 className="font-semibold text-lg mb-1 truncate">
                              {entry.songTitle}
                            </h4>
                            <div className="text-text/70 text-sm mb-2 truncate">
                              {entry.artist}
                            </div>
                            {entry.notes && (
                              <p className="text-text/80 text-sm line-clamp-2">
                                {entry.notes.length > 160 ? entry.notes.substring(0, 160) + '...' : entry.notes}
                              </p>
                            )}
                          </div>
                        </div>
                      </Link>
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
    </div>
  )
}

