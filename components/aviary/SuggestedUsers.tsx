'use client'

import { useState, useEffect } from 'react'
import Image from 'next/image'
import Link from 'next/link'

interface SuggestedUser {
  id: string
  username: string
  name: string | null
  image: string | null
  mutualFriends: number
}

export function SuggestedUsers() {
  const [users, setUsers] = useState<SuggestedUser[]>([])
  const [loading, setLoading] = useState(true)
  const [sendingRequests, setSendingRequests] = useState<Set<string>>(new Set())
  const [sentRequests, setSentRequests] = useState<Set<string>>(new Set())

  useEffect(() => {
    fetchSuggestedUsers()
  }, [])

  const fetchSuggestedUsers = async () => {
    try {
      const res = await fetch('/api/users/suggested?limit=20')
      const data = await res.json()
      if (res.ok) {
        setUsers(data.users)
      }
    } catch (error) {
      console.error('Error fetching suggested users:', error)
    } finally {
      setLoading(false)
    }
  }

  const sendFriendRequest = async (username: string, userId: string) => {
    setSendingRequests(prev => new Set(prev).add(userId))
    try {
      const res = await fetch('/api/friends/requests', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ receiverUsername: username }),
      })

      if (res.ok) {
        setSentRequests(prev => new Set(prev).add(userId))
      } else {
        const data = await res.json()
        console.error('Failed to send friend request:', data.error)
      }
    } catch (err) {
      console.error('Error sending friend request:', err)
    } finally {
      setSendingRequests(prev => {
        const next = new Set(prev)
        next.delete(userId)
        return next
      })
    }
  }

  if (loading || users.length === 0) return null

  return (
    <div>
      <div className="flex items-center gap-2 mb-3">
        <h2 className="text-lg font-semibold text-text-muted">Users on SongBird</h2>
        <span className="text-text-muted text-sm">
          {users.length}
        </span>
      </div>
      <div className="flex gap-4 overflow-x-auto pb-2 scrollbar-hide">
        {users.map((user) => (
          <div key={user.id} className="flex-shrink-0 flex flex-col items-center gap-1.5 w-[90px]">
            <Link
              href={`/user/${encodeURIComponent(user.username)}`}
              className="flex flex-col items-center gap-1.5 hover:opacity-80 transition-opacity"
            >
              <div className="relative w-16 h-16 flex items-center justify-center">
                {user.image ? (
                  <Image
                    src={user.image}
                    alt={user.username}
                    width={64}
                    height={64}
                    className="w-16 h-16 rounded-full object-cover border-2 border-surface"
                  />
                ) : (
                  <div className="w-16 h-16 rounded-full bg-primary/20 flex items-center justify-center border-2 border-surface">
                    <span className="text-xl font-semibold text-primary">
                      {(user.name?.[0] || user.username?.[0] || '?').toUpperCase()}
                    </span>
                  </div>
                )}
              </div>
              <p className="text-xs font-medium text-text truncate max-w-[80px] text-center">
                {user.username}
              </p>
            </Link>
            {user.mutualFriends > 0 && (
              <p className="text-[10px] text-text-muted leading-tight text-center">
                {user.mutualFriends} mutual
              </p>
            )}
            {sentRequests.has(user.id) ? (
              <p className="text-[10px] text-text-muted mt-0.5">Request sent</p>
            ) : (
              <button
                onClick={() => sendFriendRequest(user.username, user.id)}
                disabled={sendingRequests.has(user.id)}
                className="mt-0.5 px-3 py-1 bg-primary text-bg text-xs font-medium rounded-lg hover:bg-primary/90 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {sendingRequests.has(user.id) ? '...' : 'Add'}
              </button>
            )}
          </div>
        ))}
      </div>
    </div>
  )
}


