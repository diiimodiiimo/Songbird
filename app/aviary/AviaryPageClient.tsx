'use client'

import { useState, useEffect } from 'react'
import { Aviary } from '@/components/aviary/Aviary'
import type { AviaryData } from '@/types/aviary'

export function AviaryPageClient() {
  const [aviaryData, setAviaryData] = useState<AviaryData | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    fetchAviaryData()
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

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] gap-4">
        <div className="w-16 h-16 relative">
          <div className="absolute inset-0 rounded-full border-4 border-primary/20" />
          <div className="absolute inset-0 rounded-full border-4 border-primary border-t-transparent animate-spin" />
        </div>
        <p className="text-text-muted animate-pulse">Gathering the flock...</p>
      </div>
    )
  }

  if (error) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] gap-4 text-center px-4">
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
    )
  }

  if (!aviaryData) {
    return null
  }

  return <Aviary data={aviaryData} />
}







