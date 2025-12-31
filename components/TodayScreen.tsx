'use client'

import { useState, useEffect } from 'react'
import Image from 'next/image'
import Link from 'next/link'

interface TodayEntry {
  id: string
  songTitle: string
  artist: string
  albumArt: string
  people?: Array<{ id: string; name: string }>
}

export default function TodayScreen() {
  const [entry, setEntry] = useState<TodayEntry | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetchTodayEntry()
  }, [])

  const fetchTodayEntry = async () => {
    try {
      const today = new Date().toISOString().split('T')[0]
      const res = await fetch(`/api/entries?date=${today}`)
      const data = await res.json()
      
      if (data.entry) {
        setEntry(data.entry)
      }
    } catch (error) {
      console.error('Error fetching today entry:', error)
    } finally {
      setLoading(false)
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-muted">Loading...</div>
      </div>
    )
  }

  return (
    <div className="min-h-screen flex flex-col">
      {/* Main content area */}
      <main className="flex-1 flex items-center justify-center px-4 pb-24">
        {entry ? (
          <TodayCard entry={entry} />
        ) : (
          <EmptyState />
        )}
      </main>

      {/* Bottom navigation */}
      <BottomNav />
    </div>
  )
}

function TodayCard({ entry }: { entry: TodayEntry }) {
  return (
    <article 
      className="surface w-full max-w-sm"
      style={{
        padding: 'var(--pad-lg)',
        // Intentional offset - anti-symmetry
        marginTop: '-3rem',
        marginLeft: '8px',
      }}
    >
      {/* Album art - visual anchor */}
      <div 
        className="relative mb-6"
        style={{
          // Slight offset from card edge
          marginLeft: '-12px',
        }}
      >
        <Image
          src={entry.albumArt || '/placeholder-album.png'}
          alt={`${entry.songTitle} album art`}
          width={280}
          height={280}
          className="rounded-lg shadow-soft"
          style={{
            borderRadius: 'var(--radius-lg)',
          }}
        />
      </div>

      {/* Song title - serif, left-aligned, oversized */}
      <h1 
        className="mb-2"
        style={{
          fontFamily: 'var(--font-title)',
          fontSize: '1.75rem',
          lineHeight: '1.2',
        }}
      >
        {entry.songTitle}
      </h1>

      {/* Artist - muted, offset */}
      <p 
        className="muted"
        style={{
          fontSize: '0.9375rem',
          marginLeft: '6px', // subtle horizontal offset
        }}
      >
        {entry.artist}
      </p>

      {/* Friend mentions - soft, optional */}
      {entry.people && entry.people.length > 0 && (
        <div 
          className="mt-6 flex flex-wrap gap-2"
          style={{
            paddingTop: 'var(--pad-sm)',
          }}
        >
          {entry.people.map((person) => (
            <span
              key={person.id}
              className="muted"
              style={{
                fontSize: '0.8125rem',
                padding: '4px 10px',
                backgroundColor: 'rgba(244, 241, 234, 0.05)',
                borderRadius: 'var(--radius-sm)',
              }}
            >
              {person.name}
            </span>
          ))}
        </div>
      )}
    </article>
  )
}

function EmptyState() {
  return (
    <div 
      className="text-center"
      style={{
        // Slightly above center
        marginTop: '-5rem',
      }}
    >
      <Link href="/add">
        <button
          className="surface"
          style={{
            padding: `${'var(--pad-md)'} ${' var(--pad-lg)'}`,
            fontSize: '1rem',
            color: 'var(--text)',
            transition: 'all 0.2s ease',
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.backgroundColor = 'var(--accent)'
            e.currentTarget.style.color = 'var(--bg)'
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.backgroundColor = 'var(--surface)'
            e.currentTarget.style.color = 'var(--text)'
          }}
        >
          Add today's song
        </button>
      </Link>
    </div>
  )
}

function BottomNav() {
  const navItems: Array<{ label: string; href: string; icon: string; iconImage?: string }> = [
    { label: 'Today', href: '/', icon: '🐦', iconImage: '/SongBirdlogo.png' },
    { label: 'History', href: '/history', icon: '📖' },
    { label: 'Friends', href: '/friends', icon: '👥' },
    { label: 'Profile', href: '/profile', icon: '✨' },
  ]

  return (
    <nav
      className="fixed bottom-0 left-0 right-0 surface"
      style={{
        padding: 'var(--pad-sm)',
        paddingBottom: `calc(var(--pad-sm) + env(safe-area-inset-bottom))`,
        borderTopLeftRadius: 'var(--radius-lg)',
        borderTopRightRadius: 'var(--radius-lg)',
        boxShadow: '0 -2px 12px rgba(0, 0, 0, 0.15)',
      }}
    >
      <ul 
        className="flex justify-around items-center"
        style={{
          listStyle: 'none',
          margin: 0,
          padding: 0,
        }}
      >
        {navItems.map((item) => (
          <li key={item.label}>
            <Link href={item.href}>
              <button
                className="flex flex-col items-center gap-1"
                style={{
                  padding: 'var(--pad-sm)',
                  color: 'var(--muted)',
                  fontSize: '0.75rem',
                  minWidth: '60px',
                }}
              >
                {item.iconImage ? (
                  <Image src={item.iconImage} alt={item.label} width={24} height={24} className="object-contain" />
                ) : (
                  <span style={{ fontSize: '1.25rem' }}>{item.icon}</span>
                )}
                <span>{item.label}</span>
              </button>
            </Link>
          </li>
        ))}
      </ul>
    </nav>
  )
}
