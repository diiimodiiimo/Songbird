'use client'

import { useState, useEffect } from 'react'

const WHATS_NEW_SEEN_KEY = 'songbird_whats_new_version'

interface ChangelogEntry {
  version: string
  date: string
  title: string
  changes: Array<{
    type: 'new' | 'improved' | 'fixed'
    text: string
  }>
}

const changelog: ChangelogEntry[] = [
  {
    version: '1.4.0',
    date: 'Feb 2026',
    title: 'Discoverability & Help',
    changes: [
      { type: 'new', text: 'In-app Help & FAQ page with common questions' },
      { type: 'new', text: 'Feature spotlights when visiting new sections' },
      { type: 'new', text: 'Streak explainer — understand how streaks work' },
      { type: 'new', text: 'What\'s New changelog (you\'re reading it!)' },
      { type: 'improved', text: 'Better explanations for People vs Mentions tagging' },
      { type: 'improved', text: 'Bird progression system now clearly explains unlock requirements' },
      { type: 'improved', text: 'Onboarding progress indicators are now consistent' },
    ],
  },
  {
    version: '1.3.0',
    date: 'Jan 2026',
    title: 'Aviary & Social',
    changes: [
      { type: 'new', text: 'The Aviary — see your friends\' birds and latest songs' },
      { type: 'new', text: 'Suggested users based on mutual friends' },
      { type: 'new', text: 'Global Song of the Day on the Leaderboard' },
      { type: 'improved', text: 'Feed now shows unread indicators for new posts' },
    ],
  },
  {
    version: '1.2.0',
    date: 'Dec 2025',
    title: 'Insights & Wrapped',
    changes: [
      { type: 'new', text: 'SongBird Wrapped — your year in music' },
      { type: 'new', text: 'AI-powered insights in Analytics' },
      { type: 'new', text: 'Mood picker for daily entries' },
      { type: 'improved', text: 'Analytics now shows artist images' },
    ],
  },
]

const CURRENT_VERSION = changelog[0].version

const typeLabels = {
  new: { label: 'New', color: 'bg-green-500/20 text-green-400' },
  improved: { label: 'Improved', color: 'bg-blue-500/20 text-blue-400' },
  fixed: { label: 'Fixed', color: 'bg-amber-500/20 text-amber-400' },
}

export default function WhatsNew() {
  const [open, setOpen] = useState(false)
  const [hasUnseen, setHasUnseen] = useState(false)

  useEffect(() => {
    if (typeof window === 'undefined') return
    const lastSeen = localStorage.getItem(WHATS_NEW_SEEN_KEY)
    if (lastSeen !== CURRENT_VERSION) {
      setHasUnseen(true)
    }
  }, [])

  const handleOpen = () => {
    setOpen(true)
    setHasUnseen(false)
    if (typeof window !== 'undefined') {
      localStorage.setItem(WHATS_NEW_SEEN_KEY, CURRENT_VERSION)
    }
  }

  return (
    <>
      <button
        onClick={handleOpen}
        className="relative flex items-center gap-2 px-3 py-2 bg-surface border border-text/20 rounded-lg text-sm text-text/70 hover:text-text hover:border-text/30 transition-colors"
      >
        <span>🆕</span>
        <span>What's New</span>
        {hasUnseen && (
          <span className="absolute -top-1 -right-1 w-2.5 h-2.5 bg-accent rounded-full animate-pulse" />
        )}
      </button>

      {open && (
        <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50 p-4">
          <div className="bg-surface rounded-2xl max-w-lg w-full max-h-[80vh] overflow-y-auto">
            <div className="sticky top-0 bg-surface border-b border-text/10 px-6 py-4 flex items-center justify-between rounded-t-2xl">
              <h2 className="text-xl font-bold text-text">What's New</h2>
              <button
                onClick={() => setOpen(false)}
                className="text-text/50 hover:text-text transition-colors p-1"
              >
                <svg width="20" height="20" viewBox="0 0 20 20" fill="none">
                  <path d="M5 5l10 10M15 5l-10 10" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
                </svg>
              </button>
            </div>

            <div className="px-6 py-4 space-y-8">
              {changelog.map((entry) => (
                <div key={entry.version}>
                  <div className="flex items-center gap-3 mb-3">
                    <span className="text-xs font-mono bg-accent/20 text-accent px-2 py-0.5 rounded">
                      v{entry.version}
                    </span>
                    <span className="text-xs text-text/50">{entry.date}</span>
                  </div>
                  <h3 className="font-semibold text-text mb-3">{entry.title}</h3>
                  <ul className="space-y-2">
                    {entry.changes.map((change, i) => (
                      <li key={i} className="flex items-start gap-2 text-sm">
                        <span className={`flex-shrink-0 text-xs font-medium px-1.5 py-0.5 rounded ${typeLabels[change.type].color}`}>
                          {typeLabels[change.type].label}
                        </span>
                        <span className="text-text/70">{change.text}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              ))}
            </div>

            <div className="px-6 py-4 border-t border-text/10">
              <button
                onClick={() => setOpen(false)}
                className="w-full py-3 bg-accent text-bg font-semibold rounded-xl hover:bg-accent/90 transition-all"
              >
                Got it!
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  )
}
