'use client'

import { useState, useEffect, useCallback } from 'react'
import { useUser } from '@clerk/nextjs'
import { useRouter } from 'next/navigation'
import Image from 'next/image'
import dynamic from 'next/dynamic'
import Navigation from './Navigation'
import { stopActivePreview } from './PreviewButton'

const TabLoading = () => (
  <div className="flex justify-center py-16">
    <div className="animate-pulse text-text-muted">Loading...</div>
  </div>
)

// Each tab loads as its own chunk, so first paint only ships the active tab
const AddEntryTab = dynamic(() => import('./AddEntryTab'), { loading: TabLoading })
const MemoryTab = dynamic(() => import('./MemoryTab'), { loading: TabLoading })
const FeedTab = dynamic(() => import('./FeedTab'), { loading: TabLoading })
const AviaryTab = dynamic(() => import('./AviaryTab'), { loading: TabLoading })
const ProfileTab = dynamic(() => import('./ProfileTab'), { loading: TabLoading })

// Custom SongBird-style icon components
const TodayIcon = ({ active }: { active: boolean }) => (
  <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
    <path d="M12 2L2 7L12 12L22 7L12 2Z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" fill={active ? "currentColor" : "none"} />
    <path d="M2 17L12 22L22 17" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" fill={active ? "currentColor" : "none"} />
    <path d="M2 12L12 17L22 12" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" fill={active ? "currentColor" : "none"} />
  </svg>
)

const MemoryIcon = ({ active }: { active: boolean }) => (
  <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
    <path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
    <path d="M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" fill={active ? "currentColor" : "none"} />
  </svg>
)

const FeedIcon = ({ active }: { active: boolean }) => (
  <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
    <circle cx="12" cy="12" r="3" stroke="currentColor" strokeWidth="2" fill={active ? "currentColor" : "none"} />
    <path d="M12 1v6M12 17v6M23 12h-6M7 12H1" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
  </svg>
)

const ProfileIcon = ({ active }: { active: boolean }) => (
  <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
    <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
    <circle cx="12" cy="7" r="4" stroke="currentColor" strokeWidth="2" fill={active ? "currentColor" : "none"} />
  </svg>
)

const AviaryIcon = ({ active }: { active: boolean }) => (
  <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
    <ellipse cx="12" cy="13" rx="6" ry="5" stroke="currentColor" strokeWidth="2" fill={active ? "currentColor" : "none"} />
    <circle cx="16" cy="9" r="3" stroke="currentColor" strokeWidth="2" fill={active ? "currentColor" : "none"} />
    <path d="M19 9L21 8.5L19 8" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
    <path d="M6 13L3 11M6 14L3 15" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
  </svg>
)

export default function Dashboard() {
  const { user, isLoaded } = useUser()
  const router = useRouter()
  const [activeTab, setActiveTab] = useState('today')
  // Tabs stay mounted after first visit so switching back is instant (no refetch)
  const [visitedTabs, setVisitedTabs] = useState<string[]>(['today'])

  const navigateToTab = useCallback((tabId: string) => {
    stopActivePreview() // leaving a tab shouldn't leave a song playing
    setActiveTab(tabId)
    setVisitedTabs((prev) => (prev.includes(tabId) ? prev : [...prev, tabId]))
  }, [])

  useEffect(() => {
    const handleNavigateToWrapped = () => {
      // Wrapped now lives in Memory tab
      navigateToTab('history')
    }
    const handleNavigateToMemory = () => {
      navigateToTab('history')
    }
    const handleNavigateToFriends = () => {
      navigateToTab('feed')
    }
    const handleNavigateToFeed = () => {
      navigateToTab('feed')
    }
    const handleNavigateToInsights = () => {
      // Insights now lives in Memory tab (Your Stats section)
      navigateToTab('history')
    }
    const handleNavigateToLeaderboard = () => {
      // Leaderboard now lives in Aviary -> Community sub-tab
      navigateToTab('aviary')
      window.dispatchEvent(new Event('navigateToAviaryCommunity'))
    }
    window.addEventListener('navigateToWrapped', handleNavigateToWrapped)
    window.addEventListener('navigateToMemory', handleNavigateToMemory)
    window.addEventListener('navigateToFriends', handleNavigateToFriends)
    window.addEventListener('navigateToFeed', handleNavigateToFeed)
    window.addEventListener('navigateToInsights', handleNavigateToInsights)
    window.addEventListener('navigateToLeaderboard', handleNavigateToLeaderboard)
    return () => {
      window.removeEventListener('navigateToWrapped', handleNavigateToWrapped)
      window.removeEventListener('navigateToMemory', handleNavigateToMemory)
      window.removeEventListener('navigateToFriends', handleNavigateToFriends)
      window.removeEventListener('navigateToFeed', handleNavigateToFeed)
      window.removeEventListener('navigateToInsights', handleNavigateToInsights)
      window.removeEventListener('navigateToLeaderboard', handleNavigateToLeaderboard)
    }
  }, [user, navigateToTab])

  // Main tabs - 5 tabs: Today | Memory | Feed | Aviary | Profile
  const mainTabs = [
    { id: 'today', label: 'Today', icon: TodayIcon },
    { id: 'history', label: 'Memory', icon: MemoryIcon },
    { id: 'feed', label: 'Feed', icon: FeedIcon },
    { id: 'aviary', label: 'Aviary', icon: AviaryIcon },
    { id: 'profile', label: 'Profile', icon: ProfileIcon },
  ]

  const renderTab = (tabId: string) => {
    switch (tabId) {
      case 'today': return <AddEntryTab />
      case 'history': return <MemoryTab />
      case 'feed': return <FeedTab />
      case 'aviary': return <AviaryTab />
      case 'profile': return <ProfileTab />
      default: return <AddEntryTab />
    }
  }

  return (
    <div className="min-h-screen bg-bg text-white">
      <Navigation />
      
      {/* Main Content — visited tabs stay mounted, inactive ones are hidden */}
      <div className="container mx-auto px-4 py-4 pb-24">
        {visitedTabs.map((tabId) => (
          <div key={tabId} hidden={activeTab !== tabId}>
            {renderTab(tabId)}
          </div>
        ))}
      </div>

      {/* Bottom Navigation */}
      <div className="fixed bottom-0 left-0 right-0 bg-card/95 backdrop-blur-sm border-t border-white/10 z-50 safe-area-bottom">
        <div className="flex justify-around items-center px-2 py-2">
          {mainTabs.map((tab) => {
            const IconComponent = tab.icon
            const isActive = activeTab === tab.id
            return (
              <button
                key={tab.id}
                onClick={() => navigateToTab(tab.id)}
                className={`flex flex-col items-center justify-center gap-0.5 py-1.5 px-2 rounded-lg transition-all ${
                  isActive
                    ? 'text-accent'
                    : 'text-text-muted'
                }`}
              >
                <div className={`transition-transform ${isActive ? 'scale-110' : 'scale-100'}`}>
                  <IconComponent active={isActive} />
                </div>
                <span className={`text-[10px] font-medium ${isActive ? 'font-semibold' : ''}`}>{tab.label}</span>
              </button>
            )
          })}
        </div>
      </div>
    </div>
  )
}
