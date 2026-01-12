'use client'

import { useState, useEffect } from 'react'
import Image from 'next/image'
import AddEntryTab from './AddEntryTab'
import AnalyticsTab from './AnalyticsTab'
import MemoryTab from './MemoryTab'
import FeedTab from './FeedTab'
import ProfileTab from './ProfileTab'
import WrappedTab from './WrappedTab'
import LeaderboardTab from './LeaderboardTab'
import Navigation from './Navigation'

// Custom SongBird-style icon components (temporary SVG placeholders)
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

const InsightsIcon = ({ active }: { active: boolean }) => (
  <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
    <path d="M3 3v18h18" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
    <path d="M7 16l4-4 4 4 6-6" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" fill={active ? "currentColor" : "none"} />
  </svg>
)

const ProfileIcon = ({ active }: { active: boolean }) => (
  <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
    <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
    <circle cx="12" cy="7" r="4" stroke="currentColor" strokeWidth="2" fill={active ? "currentColor" : "none"} />
  </svg>
)

export default function Dashboard() {
  const [activeTab, setActiveTab] = useState('today')
  const [insightsSubTab, setInsightsSubTab] = useState<'analytics' | 'wrapped' | 'leaderboard'>('analytics')

  useEffect(() => {
    const handleNavigateToWrapped = () => {
      setActiveTab('insights')
      setInsightsSubTab('wrapped')
    }
    const handleNavigateToMemory = (e: any) => {
      setActiveTab('history')
      // Could pass date if needed
    }
    const handleNavigateToFriends = () => {
      setActiveTab('feed')
    }
    window.addEventListener('navigateToWrapped', handleNavigateToWrapped)
    window.addEventListener('navigateToMemory', handleNavigateToMemory)
    window.addEventListener('navigateToFriends', handleNavigateToFriends)
    return () => {
      window.removeEventListener('navigateToWrapped', handleNavigateToWrapped)
      window.removeEventListener('navigateToMemory', handleNavigateToMemory)
      window.removeEventListener('navigateToFriends', handleNavigateToFriends)
    }
  }, [])

  // Main tabs - LOCKED ORDER: Today | Memory | Feed | Insights | Profile
  const mainTabs = [
    { id: 'today', label: 'Today', icon: TodayIcon },
    { id: 'history', label: 'Memory', icon: MemoryIcon },
    { id: 'feed', label: 'Feed', icon: FeedIcon },
    { id: 'insights', label: 'Insights', icon: InsightsIcon },
    { id: 'profile', label: 'Profile', icon: ProfileIcon },
  ]

  // All tabs for desktop sidebar
  const allTabs = [
    { id: 'today', label: 'Today', emoji: '🐦', icon: '/SongBirdlogo.png' },
    { id: 'history', label: 'Memory', emoji: '📖' },
    { id: 'feed', label: 'Feed', emoji: '🎵' },
    { id: 'insights', label: 'Insights', emoji: '📊' },
    { id: 'wrapped', label: 'Wrapped', emoji: '🎁' },
    { id: 'leaderboard', label: 'Leaderboard', emoji: '🏆' },
    { id: 'profile', label: 'Profile', emoji: '👤' },
  ]

  const getActiveComponent = () => {
    if (activeTab === 'insights') {
      if (insightsSubTab === 'wrapped') return <WrappedTab />
      if (insightsSubTab === 'leaderboard') return <LeaderboardTab />
      return <AnalyticsTab />
    }
    switch (activeTab) {
      case 'today': return <AddEntryTab />
      case 'history': return <MemoryTab />
      case 'feed': return <FeedTab />
      case 'profile': return <ProfileTab />
      case 'wrapped': return <WrappedTab />
      case 'leaderboard': return <LeaderboardTab />
      default: return <AddEntryTab />
    }
  }

  return (
    <div className="min-h-screen bg-bg text-white">
      <Navigation />
      
      {/* Main Content */}
      <div className="container mx-auto px-4 py-4 pb-24">
          {/* Insights Sub-Navigation - shown when on insights tab */}
          {activeTab === 'insights' && (
            <div className="mb-6 flex gap-2 justify-center">
              <button
                onClick={() => setInsightsSubTab('analytics')}
                className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${
                  insightsSubTab === 'analytics'
                    ? 'bg-primary text-white'
                    : 'bg-card text-text-muted hover:text-white'
                }`}
              >
                📊 Analytics
              </button>
              <button
                onClick={() => setInsightsSubTab('wrapped')}
                className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${
                  insightsSubTab === 'wrapped'
                    ? 'bg-primary text-white'
                    : 'bg-card text-text-muted hover:text-white'
                }`}
              >
                🎁 Wrapped
              </button>
              <button
                onClick={() => setInsightsSubTab('leaderboard')}
                className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${
                  insightsSubTab === 'leaderboard'
                    ? 'bg-primary text-white'
                    : 'bg-card text-text-muted hover:text-white'
                }`}
              >
                🏆 Leaderboard
              </button>
            </div>
          )}
          
          {getActiveComponent()}
        </div>

      {/* Bottom Navigation - visible on all screen sizes */}
      <div className="fixed bottom-0 left-0 right-0 bg-card/95 backdrop-blur-sm border-t border-white/10 z-50">
        <div className="flex justify-around items-center px-2 py-2">
          {mainTabs.map((tab) => {
            const IconComponent = tab.icon
            const isActive = activeTab === tab.id
            return (
              <button
                key={tab.id}
                onClick={() => {
                  setActiveTab(tab.id)
                  if (tab.id === 'insights') setInsightsSubTab('analytics')
                }}
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


