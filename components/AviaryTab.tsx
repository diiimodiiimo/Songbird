'use client'

import { useState, useEffect } from 'react'
import { Aviary } from '@/components/aviary/Aviary'
import LeaderboardTab from './LeaderboardTab'
import type { AviaryData } from '@/types/aviary'
import { trackAviaryViewed } from '@/lib/analytics-client'

export default function AviaryTab() {
  const [aviaryData, setAviaryData] = useState<AviaryData | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [subTab, setSubTab] = useState<'flock' | 'community'>('flock')

  useEffect(() => {
    fetchAviaryData()
    trackAviaryViewed()
  }, [])

  // Allow external navigation to community sub-tab
  useEffect(() => {
    const handleNavigateToCommunity = () => setSubTab('community')
    window.addEventListener('navigateToAviaryCommunity', handleNavigateToCommunity)
    return () => window.removeEventListener('navigateToAviaryCommunity', handleNavigateToCommunity)
  }, [])

  const fetchAviaryData = async () => {
    setLoading(true)
    setError(null)
    
    try {
      const res = await fetch('/api/aviary')
      const data = await res.json()
      
      if (!res.ok) {
        throw new Error(data.error || 'Failed to fetch aviary data')
      }
      
      setAviaryData(data)
    } catch (err: any) {
      console.error('Error fetching aviary data:', err)
      setError(err.message || 'Something went wrong')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div>
      {/* Header */}
      <header className="text-center mb-2 px-4 pt-2">
        <h1 className="text-2xl sm:text-3xl font-bold text-text mb-1">The Aviary</h1>
        <p className="text-text-muted text-sm sm:text-base">
          {subTab === 'flock' 
            ? 'See what your flock is listening to'
            : 'What the whole community is vibing to'
          }
        </p>
      </header>

      {/* Sub-tab toggle */}
      <div className="flex justify-center px-4 mb-6">
        <div className="inline-flex bg-surface rounded-lg p-1 gap-1">
          <button
            onClick={() => setSubTab('flock')}
            className={`px-5 py-2 rounded-md text-sm font-medium transition-colors ${
              subTab === 'flock'
                ? 'bg-primary text-white'
                : 'text-text-muted hover:text-text'
            }`}
          >
            🪺 Flock
          </button>
          <button
            onClick={() => setSubTab('community')}
            className={`px-5 py-2 rounded-md text-sm font-medium transition-colors ${
              subTab === 'community'
                ? 'bg-primary text-white'
                : 'text-text-muted hover:text-text'
            }`}
          >
            🌍 Community
          </button>
        </div>
      </div>

      {/* Flock sub-tab */}
      {subTab === 'flock' && (
        <>
          {loading ? (
            <div className="flex flex-col items-center justify-center min-h-[50vh] gap-4">
              <div className="w-16 h-16 relative">
                <div className="absolute inset-0 rounded-full border-4 border-primary/20" />
                <div className="absolute inset-0 rounded-full border-4 border-primary border-t-transparent animate-spin" />
              </div>
              <p className="text-text-muted animate-pulse">Gathering the flock...</p>
            </div>
          ) : error ? (
            <div className="flex flex-col items-center justify-center min-h-[50vh] gap-4 text-center px-4">
              <div className="text-5xl">🐦‍⬛</div>
              <h2 className="text-xl font-bold text-text">Oops! Something went wrong</h2>
              <p className="text-text-muted max-w-sm">{error}</p>
              <button
                onClick={fetchAviaryData}
                className="mt-4 px-6 py-3 bg-primary text-bg rounded-xl font-semibold hover:bg-primary/90 transition-all hover:scale-105 active:scale-95"
              >
                Try Again
              </button>
            </div>
          ) : aviaryData ? (
            <Aviary data={aviaryData} showHeader={false} />
          ) : null}
        </>
      )}

      {/* Community sub-tab */}
      {subTab === 'community' && (
        <LeaderboardTab />
      )}
    </div>
  )
}
