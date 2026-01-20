'use client'

import { useState } from 'react'
import { trackInviteLinkGenerated, trackInviteLinkShared, trackInviteLinkCopied } from '@/lib/analytics-client'
import ThemeBird from './ThemeBird'

interface InviteFriendsCTAProps {
  variant?: 'full' | 'compact' | 'inline'
  heading?: string
  subtext?: string
  showBird?: boolean
  className?: string
}

export default function InviteFriendsCTA({
  variant = 'full',
  heading = 'Your flock is quiet',
  subtext = 'Invite friends to see their songs and share your music journey together.',
  showBird = true,
  className = '',
}: InviteFriendsCTAProps) {
  const [copied, setCopied] = useState(false)
  const [loading, setLoading] = useState(false)

  const handleInvite = async () => {
    if (loading) return
    setLoading(true)

    try {
      // Generate invite code
      const res = await fetch('/api/invites', { method: 'POST' })
      if (!res.ok) throw new Error('Failed to generate invite')
      
      const data = await res.json()
      const url = `${window.location.origin}/join/${data.code}`
      
      trackInviteLinkGenerated()

      // Try native share first
      if (navigator.share) {
        try {
          await navigator.share({
            title: 'Join me on SongBird',
            text: 'I\'m logging my daily songs on SongBird. Join me and let\'s share our music!',
            url,
          })
          trackInviteLinkShared()
          return
        } catch (err) {
          // User cancelled or share failed, fall back to copy
        }
      }

      // Fall back to copy
      await navigator.clipboard.writeText(url)
      setCopied(true)
      trackInviteLinkCopied()
      setTimeout(() => setCopied(false), 3000)
    } catch (error) {
      console.error('Error generating invite:', error)
    } finally {
      setLoading(false)
    }
  }

  // Inline variant - just a button
  if (variant === 'inline') {
    return (
      <button
        onClick={handleInvite}
        disabled={loading}
        className={`inline-flex items-center gap-2 px-4 py-2 bg-green-600/20 border border-green-500/30 rounded-lg text-green-400 font-medium hover:bg-green-600/30 transition-colors disabled:opacity-50 ${className}`}
      >
        {loading ? (
          <span className="w-4 h-4 border-2 border-green-400/30 border-t-green-400 rounded-full animate-spin" />
        ) : copied ? (
          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
          </svg>
        ) : (
          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8.684 13.342C8.886 12.938 9 12.482 9 12c0-.482-.114-.938-.316-1.342m0 2.684a3 3 0 110-2.684m0 2.684l6.632 3.316m-6.632-6l6.632-3.316m0 0a3 3 0 105.367-2.684 3 3 0 00-5.367 2.684zm0 9.316a3 3 0 105.368 2.684 3 3 0 00-5.368-2.684z" />
          </svg>
        )}
        {copied ? 'Link copied!' : 'Invite Friends'}
      </button>
    )
  }

  // Compact variant - smaller card
  if (variant === 'compact') {
    return (
      <div className={`bg-surface/50 rounded-xl p-4 ${className}`}>
        <div className="flex items-center gap-4">
          {showBird && (
            <div className="flex-shrink-0">
              <ThemeBird size={48} state="curious" />
            </div>
          )}
          <div className="flex-1 min-w-0">
            <p className="text-text/80 text-sm font-medium">{heading}</p>
            <p className="text-text/50 text-xs mt-0.5 truncate">{subtext}</p>
          </div>
          <button
            onClick={handleInvite}
            disabled={loading}
            className="flex-shrink-0 px-3 py-2 bg-accent text-bg text-sm font-semibold rounded-lg hover:bg-accent/90 transition-all disabled:opacity-50"
          >
            {loading ? '...' : copied ? '✓' : 'Invite'}
          </button>
        </div>
      </div>
    )
  }

  // Full variant - centered with bird
  return (
    <div className={`flex flex-col items-center justify-center py-12 px-4 text-center ${className}`}>
      {showBird && (
        <div className="mb-6">
          <ThemeBird size={80} state="curious" />
        </div>
      )}
      
      <h3 className="text-xl font-bold text-text mb-2">{heading}</h3>
      <p className="text-text/60 text-sm max-w-xs mb-6">{subtext}</p>

      <button
        onClick={handleInvite}
        disabled={loading}
        className="px-6 py-3 bg-accent text-bg font-semibold rounded-xl hover:bg-accent/90 transition-all hover:scale-105 active:scale-95 disabled:opacity-50 flex items-center gap-2"
      >
        {loading ? (
          <>
            <span className="w-4 h-4 border-2 border-bg/30 border-t-bg rounded-full animate-spin" />
            Generating link...
          </>
        ) : copied ? (
          <>
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
            </svg>
            Invite link copied!
          </>
        ) : (
          <>
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8.684 13.342C8.886 12.938 9 12.482 9 12c0-.482-.114-.938-.316-1.342m0 2.684a3 3 0 110-2.684m0 2.684l6.632 3.316m-6.632-6l6.632-3.316m0 0a3 3 0 105.367-2.684 3 3 0 00-5.367 2.684zm0 9.316a3 3 0 105.368 2.684 3 3 0 00-5.368-2.684z" />
            </svg>
            Invite Friends
          </>
        )}
      </button>

      <p className="text-text/40 text-xs mt-4">
        Friends will receive a friend request when they join
      </p>
    </div>
  )
}

