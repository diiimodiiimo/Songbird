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
    window.addEventListener('navigateToWrapped', handleNavigateToWrapped)
    window.addEventListener('navigateToMemory', handleNavigateToMemory)
    return () => {
      window.removeEventListener('navigateToWrapped', handleNavigateToWrapped)
      window.removeEventListener('navigateToMemory', handleNavigateToMemory)
    }
  }, [])

  // Main tabs - 5 for mobile bottom nav
  const mainTabs = [
    { id: 'today', label: 'Today', emoji: '🐦', icon: '/SongBirdlogo.png' },
    { id: 'feed', label: 'Feed', emoji: '🎵' },
    { id: 'history', label: 'Memory', emoji: '📖' },
    { id: 'insights', label: 'Insights', emoji: '📊' },
    { id: 'profile', label: 'Profile', emoji: '👤' },
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
          {mainTabs.map((tab) => (
            <button
              key={tab.id}
              onClick={() => {
                setActiveTab(tab.id)
                if (tab.id === 'insights') setInsightsSubTab('analytics')
              }}
              className={`flex flex-col items-center justify-center gap-0.5 py-1.5 px-2 rounded-lg transition-all ${
                activeTab === tab.id
                  ? 'text-primary'
                  : 'text-text-muted'
              }`}
            >
              {tab.id === 'today' && tab.icon ? (
                <Image 
                  src={tab.icon} 
                  alt={tab.label} 
                  width={activeTab === tab.id ? 32 : 24} 
                  height={activeTab === tab.id ? 32 : 24}
                  className="object-contain"
                />
              ) : (
                <span className={`${activeTab === tab.id ? 'text-2xl' : 'text-xl'}`}>{tab.emoji}</span>
              )}
              <span className="text-[10px] font-medium">{tab.label}</span>
            </button>
          ))}
        </div>
      </div>
    </div>
  )
}


