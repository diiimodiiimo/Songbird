'use client'

import { useState } from 'react'
import Link from 'next/link'
import ThemeBird from '@/components/ThemeBird'

interface FAQItem {
  question: string
  answer: string
  category: string
}

const faqs: FAQItem[] = [
  {
    category: 'Getting Started',
    question: 'What is SongBird?',
    answer: 'SongBird is a music journaling app. You log one song each day that represents your day — the song stuck in your head, the one you played on repeat, or the one that defined a moment. Over time, you build a musical autobiography of your life.',
  },
  {
    category: 'Getting Started',
    question: 'Do I need a Spotify account?',
    answer: 'No! SongBird uses Spotify\'s public music database to search for songs, but you don\'t need a Spotify account. We never access your personal Spotify data, playlists, or listening history.',
  },
  {
    category: 'Getting Started',
    question: 'Can I log songs from past days?',
    answer: 'Yes, you can pick any date when logging a song. Use the date picker in the entry form to log songs for past dates. However, only same-day entries count toward your streak.',
  },
  {
    category: 'Streaks',
    question: 'How do streaks work?',
    answer: 'Your streak counts consecutive days you\'ve logged a song. Log a song today, then again tomorrow, and your streak grows. If you miss a day (no entry logged by midnight in your timezone), your streak resets to zero. Only entries logged on the same day count — backdating an entry won\'t save your streak.',
  },
  {
    category: 'Streaks',
    question: 'What do I unlock with streaks?',
    answer: 'Streaks unlock milestone achievements and new bird themes. Hit 7 days to earn your first milestone, then 14, 30, 50, 100, and 365 days for increasingly rare birds. Check your Profile → Your Flock to see which birds you\'ve unlocked and what\'s next.',
  },
  {
    category: 'Streaks',
    question: 'When does my streak reset?',
    answer: 'Your streak resets at midnight in your local timezone. If you see a warning that your streak is about to end, log a song before midnight to keep it alive. The countdown timer on the Today tab shows how many hours remain.',
  },
  {
    category: 'Birds & Themes',
    question: 'What are birds?',
    answer: 'Birds are visual themes that change the look and feel of your SongBird experience. Each bird species has its own color palette. You start with the American Robin and Northern Cardinal, and unlock more through streaks, milestones, and premium membership.',
  },
  {
    category: 'Birds & Themes',
    question: 'How do I unlock new birds?',
    answer: 'There are three ways: (1) Streak milestones — keep logging consistently to earn birds at 7, 14, 30, 50, 100, and 365 day streaks. (2) Entry milestones — reach total entry counts like 50, 100, 500 entries. (3) Premium — Founding Flock members get all bird themes unlocked instantly.',
  },
  {
    category: 'Social Features',
    question: 'What\'s the difference between "People in Your Day" and "Mention Friends"?',
    answer: '"People in Your Day" is a private tag — record who you were with, even people not on SongBird. Only you can see these. "Mention Friends" is social — the friend gets a notification and can see they were mentioned in your entry. Use People for your personal memory, Mentions when you want friends to know.',
  },
  {
    category: 'Social Features',
    question: 'What is the Aviary?',
    answer: 'The Aviary is where you see your friends\' birds and their latest songs. Think of it like a visual overview of your flock — each friend appears as their chosen bird, and you can tap to see what they logged today. Unread songs show a notification dot.',
  },
  {
    category: 'Social Features',
    question: 'Can I keep my journal private?',
    answer: 'Absolutely. SongBird is private by default. Only friends you\'ve accepted can see your entries in the Feed. You can use SongBird entirely as a personal journal — social features are optional.',
  },
  {
    category: 'Social Features',
    question: 'What are vibes?',
    answer: 'Vibes are like "likes" in SongBird. When you see a friend\'s song in the Feed that resonates with you, tap the heart icon to vibe it. The friend gets a notification. Your vibed songs are saved in your Profile.',
  },
  {
    category: 'Features',
    question: 'What is "On This Day"?',
    answer: 'On This Day shows what songs you logged on this date in previous years. It\'s like a musical time capsule — you\'ll see patterns in your taste evolve over time. The more you log, the more powerful this feature becomes.',
  },
  {
    category: 'Features',
    question: 'What are AI Insights?',
    answer: 'AI Insights analyze your music logging patterns and surface interesting observations — like noticing you listen to more upbeat music in summer, or that a certain artist always appears when you\'re with specific people. They appear in the Insights tab after you have 10+ entries.',
  },
  {
    category: 'Features',
    question: 'What is Wrapped?',
    answer: 'SongBird Wrapped is your year-end music summary, similar to Spotify Wrapped but based on the songs you consciously chose each day. It includes top artists, seasonal trends, sentiment analysis of your notes, and more. Available to premium members.',
  },
  {
    category: 'Features',
    question: 'What are B-sides?',
    answer: 'B-sides let you log additional songs beyond your main Song of the Day. Sometimes one song isn\'t enough — maybe two songs defined your day. B-sides are a premium feature that lets you capture the full soundtrack of your day.',
  },
  {
    category: 'Features',
    question: 'What is the mood picker for?',
    answer: 'The mood picker lets you tag how your day felt with an emoji (😊 😌 😢 🔥 😴 🎉). Over time, this data powers insights about the emotional patterns in your music — like which artists you turn to when you\'re feeling a certain way.',
  },
  {
    category: 'Features',
    question: 'What is the Global Song of the Day?',
    answer: 'The Global Song of the Day is the most-logged song across all SongBird users yesterday. When multiple users log the same song, it rises on the global chart. Check the Leaderboard tab to see it — and whether your song made the cut.',
  },
  {
    category: 'Premium',
    question: 'What is the Founding Flock?',
    answer: 'The Founding Flock is a limited lifetime membership for early SongBird users. For a one-time payment of $39.99, you get all premium features forever — no subscription needed. Only 500 spots are available, and the price increases to $29.99/year after they\'re filled.',
  },
  {
    category: 'Premium',
    question: 'What do premium members get?',
    answer: 'Premium includes: all bird themes unlocked, unlimited friends, full analytics & insights, SongBird Wrapped, B-sides (extra daily songs), data export, and all future premium features. Free users get 30 entries per month and basic features.',
  },
  {
    category: 'Account',
    question: 'Can I change my username?',
    answer: 'Currently, usernames are set during onboarding and can\'t be changed from the app. If you need to change yours, reach out to support.',
  },
  {
    category: 'Account',
    question: 'Can I export my data?',
    answer: 'Data export is available for premium members. We\'re working on making this available in a future update.',
  },
]

const categories = Array.from(new Set(faqs.map(f => f.category)))

export default function HelpPage() {
  const [expandedIndex, setExpandedIndex] = useState<number | null>(null)
  const [activeCategory, setActiveCategory] = useState<string>('all')
  const [search, setSearch] = useState('')

  const filtered = faqs.filter(faq => {
    const matchesCategory = activeCategory === 'all' || faq.category === activeCategory
    const matchesSearch = !search.trim() || 
      faq.question.toLowerCase().includes(search.toLowerCase()) ||
      faq.answer.toLowerCase().includes(search.toLowerCase())
    return matchesCategory && matchesSearch
  })

  return (
    <div className="min-h-screen bg-bg text-text">
      <div className="max-w-2xl mx-auto px-4 py-8 pb-24">
        {/* Header */}
        <div className="flex items-center gap-4 mb-8">
          <Link
            href="/"
            className="flex items-center gap-2 text-text/60 hover:text-text transition-colors text-sm"
          >
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
            </svg>
            Back
          </Link>
        </div>

        <div className="text-center mb-8">
          <div className="mb-4">
            <ThemeBird size={64} state="curious" />
          </div>
          <h1 className="text-3xl font-bold text-text mb-2">Help & FAQ</h1>
          <p className="text-text/60">Everything you need to know about SongBird</p>
        </div>

        {/* Search */}
        <div className="relative mb-6">
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search for answers..."
            className="w-full px-4 py-3 pl-10 bg-surface border border-text/20 rounded-xl text-text placeholder:text-text/40 focus:outline-none focus:ring-2 focus:ring-accent/50"
          />
          <svg className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-text/40" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
          </svg>
        </div>

        {/* Category filters */}
        <div className="flex gap-2 overflow-x-auto pb-2 mb-6 scrollbar-hide">
          <button
            onClick={() => setActiveCategory('all')}
            className={`flex-shrink-0 px-3 py-1.5 rounded-lg text-sm font-medium transition-all ${
              activeCategory === 'all' ? 'bg-accent text-bg' : 'bg-surface text-text/60 hover:text-text'
            }`}
          >
            All
          </button>
          {categories.map(cat => (
            <button
              key={cat}
              onClick={() => setActiveCategory(cat)}
              className={`flex-shrink-0 px-3 py-1.5 rounded-lg text-sm font-medium transition-all ${
                activeCategory === cat ? 'bg-accent text-bg' : 'bg-surface text-text/60 hover:text-text'
              }`}
            >
              {cat}
            </button>
          ))}
        </div>

        {/* FAQ Accordion */}
        <div className="space-y-2">
          {filtered.map((faq, index) => {
            const globalIndex = faqs.indexOf(faq)
            const isExpanded = expandedIndex === globalIndex
            return (
              <div key={globalIndex} className="bg-surface rounded-xl overflow-hidden border border-text/10">
                <button
                  onClick={() => setExpandedIndex(isExpanded ? null : globalIndex)}
                  className="w-full px-4 py-3.5 flex items-center justify-between text-left hover:bg-surface/80 transition-colors"
                >
                  <span className="font-medium text-text text-sm pr-4">{faq.question}</span>
                  <svg
                    className={`w-5 h-5 text-text/40 flex-shrink-0 transition-transform ${isExpanded ? 'rotate-180' : ''}`}
                    fill="none" viewBox="0 0 24 24" stroke="currentColor"
                  >
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                  </svg>
                </button>
                {isExpanded && (
                  <div className="px-4 pb-4">
                    <div className="border-t border-text/10 pt-3">
                      <p className="text-text/70 text-sm leading-relaxed">{faq.answer}</p>
                    </div>
                  </div>
                )}
              </div>
            )
          })}

          {filtered.length === 0 && (
            <div className="text-center py-12">
              <div className="text-2xl mb-2">🔍</div>
              <p className="text-text/50">No results found for "{search}"</p>
              <button
                onClick={() => { setSearch(''); setActiveCategory('all') }}
                className="mt-3 text-sm text-accent hover:text-accent/80 transition-colors"
              >
                Clear filters
              </button>
            </div>
          )}
        </div>

        {/* Contact section */}
        <div className="mt-12 text-center bg-surface rounded-xl p-6 border border-text/10">
          <h3 className="font-semibold text-text mb-2">Still have questions?</h3>
          <p className="text-text/60 text-sm mb-4">
            Can't find what you're looking for? Reach out and we'll help.
          </p>
          <a
            href="mailto:support@songbird.app"
            className="inline-flex items-center gap-2 px-4 py-2 bg-accent text-bg font-semibold rounded-xl text-sm hover:bg-accent/90 transition-all"
          >
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
            </svg>
            Contact Support
          </a>
        </div>
      </div>
    </div>
  )
}
