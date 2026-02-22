'use client'

import { useState, useEffect } from 'react'
import { useUser } from '@clerk/nextjs'
import { useRouter } from 'next/navigation'
import Image from 'next/image'
import ThemeBird from '@/components/ThemeBird'

interface BlockedUser {
  id: string
  username: string | null
  name: string | null
  image: string | null
  blockedAt: string
}

export default function BlockedUsersPage() {
  const { user, isLoaded } = useUser()
  const router = useRouter()
  const [blockedUsers, setBlockedUsers] = useState<BlockedUser[]>([])
  const [loading, setLoading] = useState(true)
  const [unblocking, setUnblocking] = useState<string | null>(null)

  useEffect(() => {
    if (isLoaded && user) {
      fetchBlockedUsers()
    }
  }, [isLoaded, user])

  const fetchBlockedUsers = async () => {
    try {
      const res = await fetch('/api/users/block')
      if (res.ok) {
        const data = await res.json()
        setBlockedUsers(data.blockedUsers || [])
      }
    } catch (error) {
      console.error('Error fetching blocked users:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleUnblock = async (username: string) => {
    if (unblocking) return

    setUnblocking(username)

    try {
      const res = await fetch(`/api/users/block?username=${username}`, {
        method: 'DELETE',
      })

      if (res.ok) {
        setBlockedUsers(prev => prev.filter(u => u.username !== username))
      }
    } catch (error) {
      console.error('Error unblocking user:', error)
    } finally {
      setUnblocking(null)
    }
  }

  if (!isLoaded) {
    return (
      <div className="min-h-screen bg-bg flex items-center justify-center">
        <div className="text-center">
          <div className="w-12 h-12 border-4 border-accent/30 border-t-accent rounded-full animate-spin mx-auto mb-4" />
          <p className="text-text/60">Loading...</p>
        </div>
      </div>
    )
  }

  if (!user) {
    router.push('/home')
    return null
  }

  return (
    <div className="min-h-screen bg-bg py-8 px-4">
      <div className="max-w-2xl mx-auto">
        {/* Header */}
        <div className="flex items-center gap-4 mb-6">
          <button
            onClick={() => router.back()}
            className="p-2 text-text/60 hover:text-text transition-colors"
          >
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
            </svg>
          </button>
          <h1 className="text-2xl font-bold text-text">Blocked Users</h1>
        </div>

        {/* Content */}
        {loading ? (
          <div className="text-center py-12">
            <div className="w-12 h-12 border-4 border-accent/30 border-t-accent rounded-full animate-spin mx-auto mb-4" />
            <p className="text-text/60">Loading...</p>
          </div>
        ) : blockedUsers.length === 0 ? (
          <div className="text-center py-12">
            <div className="mb-4">
              <ThemeBird size={80} state="curious" />
            </div>
            <h2 className="text-xl font-semibold text-text mb-2">No blocked users</h2>
            <p className="text-text/60">Users you block won't be able to see your content or interact with you.</p>
          </div>
        ) : (
          <div className="space-y-3">
            {blockedUsers.map((blockedUser) => (
              <div
                key={blockedUser.id}
                className="bg-surface rounded-lg p-4 flex items-center justify-between border border-text/10"
              >
                <div className="flex items-center gap-3">
                  {blockedUser.image ? (
                    <Image
                      src={blockedUser.image}
                      alt={blockedUser.username || 'User'}
                      width={48}
                      height={48}
                      className="rounded-full object-cover"
                    />
                  ) : (
                    <div className="w-12 h-12 rounded-full bg-accent/20 flex items-center justify-center text-accent font-bold">
                      {(blockedUser.username || blockedUser.name || '?')[0].toUpperCase()}
                    </div>
                  )}
                  <div>
                    <div className="font-semibold text-text">
                      {blockedUser.name || blockedUser.username || 'Unknown User'}
                    </div>
                    {blockedUser.username && (
                      <div className="text-sm text-text/60">@{blockedUser.username}</div>
                    )}
                    <div className="text-xs text-text/40">
                      Blocked {new Date(blockedUser.blockedAt).toLocaleDateString()}
                    </div>
                  </div>
                </div>
                <button
                  onClick={() => blockedUser.username && handleUnblock(blockedUser.username)}
                  disabled={unblocking === blockedUser.username}
                  className="px-4 py-2 bg-surface border border-text/20 text-text rounded-lg hover:bg-bg transition-colors disabled:opacity-50 text-sm"
                >
                  {unblocking === blockedUser.username ? 'Unblocking...' : 'Unblock'}
                </button>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}



