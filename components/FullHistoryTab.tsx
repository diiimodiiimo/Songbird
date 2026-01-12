'use client'

import { useState, useEffect } from 'react'
import { useUser } from '@clerk/nextjs'
import { format } from 'date-fns'

interface Entry {
  id: string
  date: string
  songTitle: string
  artist: string
  notes?: string
}

export default function FullHistoryTab() {
  const { isLoaded, isSignedIn } = useUser()
  const [keyword, setKeyword] = useState('')
  const [entries, setEntries] = useState<Entry[]>([])
  const [filteredEntries, setFilteredEntries] = useState<Entry[]>([])
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    fetchEntries()
  }, [isLoaded, isSignedIn])

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

  const fetchEntries = async () => {
    if (!isLoaded || !isSignedIn) {
      setLoading(false)
      return
    }
    
    setLoading(true)
    try {
      // Fetch ALL entries with excludeImages for performance, all=true for no pagination limit
      const res = await fetch('/api/entries?all=true&excludeImages=true&pageSize=10000')
      const data = await res.json()
      if (res.ok) {
        // Sort by date string directly (YYYY-MM-DD format sorts correctly)
        const sorted = data.entries.sort(
          (a: Entry, b: Entry) => b.date.localeCompare(a.date)
        )
        setEntries(sorted)
        setFilteredEntries(sorted)
        console.log('[FullHistoryTab] Loaded', sorted.length, 'entries')
      } else if (res.status === 401) {
        console.error('Unauthorized - please sign in')
        window.location.href = '/auth/signin'
      }
    } catch (error) {
      console.error('Error fetching entries:', error)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="space-y-6">
      <h3 className="text-xl font-semibold mb-4">Full Daily History</h3>

      <div className="mb-4">
        <label className="block mb-2">
          🔍 Search by keyword (song, artist, or note):
        </label>
        <input
          type="text"
          value={keyword}
          onChange={(e) => setKeyword(e.target.value)}
          placeholder="Enter keyword..."
          className="w-full px-4 py-2 bg-card border border-primary rounded text-primary"
        />
        {keyword && (
          <div className="mt-2 text-sm text-primary/80">
            🔎 {filteredEntries.length} result(s) found for '{keyword}'
          </div>
        )}
      </div>

      {loading ? (
        <div className="text-center py-8">Loading history...</div>
      ) : (
        <div className="bg-card border border-primary rounded overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-primary/20">
                  <th className="text-left py-3 px-4">Date</th>
                  <th className="text-left py-3 px-4">Song Title</th>
                  <th className="text-left py-3 px-4">Artist</th>
                  <th className="text-left py-3 px-4">Notes</th>
                </tr>
              </thead>
              <tbody>
                {filteredEntries.map((entry) => (
                  <tr
                    key={entry.id}
                    className="border-b border-primary/10 hover:bg-primary/5"
                  >
                    <td className="py-3 px-4">
                      {entry.date}
                    </td>
                    <td className="py-3 px-4 font-semibold">{entry.songTitle}</td>
                    <td className="py-3 px-4">{entry.artist}</td>
                    <td className="py-3 px-4 text-primary/80">{entry.notes || '-'}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  )
}


