'use client'

import { useState, useEffect } from 'react'
import { useUser } from '@clerk/nextjs'
import Link from 'next/link'
import Image from 'next/image'

interface FriendRequest {
  id: string
  status: string
  senderId: string
  receiverId: string
  sender: {
    id: string
    email: string
    name: string | null
    username: string | null
    image: string | null
  }
  receiver: {
    id: string
    email: string
    name: string | null
    username: string | null
    image: string | null
  }
  createdAt: string
}

interface Friend {
  id: string
  email: string
  name: string | null
  username: string | null
  image: string | null
}

export default function FriendsTab() {
  const { user, isLoaded } = useUser()
  const [friendUsername, setFriendUsername] = useState('')
  const [pendingRequests, setPendingRequests] = useState<FriendRequest[]>([])
  const [friends, setFriends] = useState<Friend[]>([])
  const [loading, setLoading] = useState(false)
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null)
  const [currentDbUserId, setCurrentDbUserId] = useState<string | null>(null)

  useEffect(() => {
    if (isLoaded && user) {
      fetchProfile()
      fetchFriends()
      fetchFriendRequests()
    }
  }, [isLoaded, user])

  const fetchProfile = async () => {
    try {
      const res = await fetch('/api/profile')
      if (res.ok) {
        const data = await res.json()
        setCurrentDbUserId(data.user?.id || null)
      }
    } catch (error) {
      console.error('Error fetching profile:', error)
    }
  }

  const fetchFriends = async () => {
    if (!user || !isLoaded) return

    try {
      const res = await fetch('/api/friends/list')
      const data = await res.json()
      if (res.ok) {
        setFriends(data.friends)
      }
    } catch (error) {
      console.error('Error fetching friends:', error)
    }
  }

  const fetchFriendRequests = async () => {
    if (!user || !isLoaded) return

    try {
      const res = await fetch('/api/friends/requests?type=all')
      const data = await res.json()
      if (res.ok) {
        setPendingRequests(data.requests.filter((r: FriendRequest) => r.status === 'pending'))
      }
    } catch (error) {
      console.error('Error fetching friend requests:', error)
    }
  }

  const sendFriendRequest = async () => {
    if (!user || !isLoaded || !friendUsername.trim()) {
      setMessage({ type: 'error', text: 'Please enter a username, email, or name' })
      return
    }

    setLoading(true)
    setMessage(null)

    try {
      const res = await fetch('/api/friends/requests', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ receiverUsername: friendUsername.trim().replace('@', '') }),
      })

      const data = await res.json()
      if (res.ok) {
        setMessage({ type: 'success', text: `Friend request sent!` })
        setFriendUsername('')
        fetchFriendRequests()
      } else {
        // Show helpful hint if available
        const hint = data.hint ? ` ${data.hint}` : ''
        setMessage({ type: 'error', text: (data.error || 'Failed to send friend request') + hint })
      }
    } catch (error) {
      setMessage({ type: 'error', text: 'Failed to send friend request' })
    } finally {
      setLoading(false)
    }
  }

  const handleFriendRequest = async (requestId: string, action: 'accept' | 'decline') => {
    setLoading(true)
    try {
      const res = await fetch(`/api/friends/requests/${requestId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action }),
      })

      if (res.ok) {
        if (action === 'accept') {
          setMessage({ type: 'success', text: 'Friend request accepted!' })
        }
        fetchFriends()
        fetchFriendRequests()
      } else {
        const data = await res.json()
        setMessage({ type: 'error', text: data.error || 'Failed to update friend request' })
      }
    } catch (error) {
      setMessage({ type: 'error', text: 'Failed to update friend request' })
    } finally {
      setLoading(false)
    }
  }

  const receivedRequests = pendingRequests.filter(
    (r) => r.receiverId === currentDbUserId
  )
  const sentRequests = pendingRequests.filter(
    (r) => r.senderId === currentDbUserId
  )

  return (
    <div className="max-w-2xl mx-auto space-y-6 px-3 py-4">
      <div className="flex items-center gap-3 mb-6">
        <div className="w-10 h-10 rounded-full bg-gradient-to-br from-accent to-accent/60 flex items-center justify-center">
          <span className="text-xl">👥</span>
        </div>
        <h3 className="text-xl sm:text-2xl font-bold">Friends</h3>
      </div>

      {message && (
        <div
          className={`p-4 rounded-xl text-sm ${
            message.type === 'success'
              ? 'bg-green-500/20 text-green-300 border border-green-500/30'
              : 'bg-red-500/20 text-red-300 border border-red-500/30'
          }`}
        >
          {message.text}
        </div>
      )}

      {/* Send Friend Request */}
      <div className="bg-surface rounded-xl p-5 border border-text/10">
        <h4 className="text-lg font-semibold mb-2">Add Friend</h4>
        <p className="text-sm text-text/60 mb-4">
          Search by username, email, or name
        </p>
        <div className="flex flex-col sm:flex-row gap-3">
          <input
            type="text"
            placeholder="Username, email, or name"
            value={friendUsername}
            onChange={(e) => setFriendUsername(e.target.value)}
            className="flex-grow px-4 py-3 bg-bg border border-text/20 rounded-xl text-text placeholder:text-text/40 focus:border-accent focus:outline-none transition-colors"
            onKeyPress={(e) => e.key === 'Enter' && !loading && sendFriendRequest()}
          />
          <button
            onClick={sendFriendRequest}
            disabled={loading || !friendUsername.trim()}
            className="bg-accent text-bg px-6 py-3 rounded-xl font-semibold disabled:opacity-50 disabled:cursor-not-allowed hover:bg-accent/90 transition-colors whitespace-nowrap flex items-center justify-center gap-2"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M18 9v3m0 0v3m0-3h3m-3 0h-3m-2-5a4 4 0 11-8 0 4 4 0 018 0zM3 20a6 6 0 0112 0v1H3v-1z" />
            </svg>
            {loading ? 'Sending...' : 'Add'}
          </button>
        </div>
      </div>

      {/* Received Friend Requests */}
      {receivedRequests.length > 0 && (
        <div className="bg-surface rounded-xl p-5 border border-accent/30">
          <h4 className="text-lg font-semibold mb-4 flex items-center gap-2">
            <span className="w-6 h-6 rounded-full bg-accent/20 flex items-center justify-center text-xs text-accent">
              {receivedRequests.length}
            </span>
            Friend Requests
          </h4>
          <div className="space-y-3">
            {receivedRequests.map((request) => (
              <div
                key={request.id}
                className="flex items-center justify-between p-4 bg-bg rounded-xl"
              >
                <div className="flex items-center gap-3">
                  {request.sender?.image ? (
                    <Image
                      src={request.sender.image}
                      alt={request.sender.name || 'User'}
                      width={44}
                      height={44}
                      className="rounded-full"
                    />
                  ) : (
                    <div className="w-11 h-11 rounded-full bg-accent/20 flex items-center justify-center text-accent font-bold">
                      {(request.sender?.name || request.sender?.email || '?').charAt(0).toUpperCase()}
                    </div>
                  )}
                  <div>
                    <div className="font-semibold">
                      {request.sender?.name || request.sender?.email?.split('@')[0]}
                    </div>
                    <div className="text-sm text-text/50">
                      @{request.sender?.username || request.sender?.email?.split('@')[0]}
                    </div>
                  </div>
                </div>
                <div className="flex gap-2">
                  <button
                    onClick={() => handleFriendRequest(request.id, 'accept')}
                    disabled={loading}
                    className="bg-green-500 hover:bg-green-600 text-white px-4 py-2 rounded-lg text-sm font-medium disabled:opacity-50 transition-colors"
                  >
                    Accept
                  </button>
                  <button
                    onClick={() => handleFriendRequest(request.id, 'decline')}
                    disabled={loading}
                    className="bg-red-500/20 hover:bg-red-500/30 text-red-400 px-4 py-2 rounded-lg text-sm font-medium disabled:opacity-50 transition-colors"
                  >
                    Decline
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Sent Friend Requests */}
      {sentRequests.length > 0 && (
        <div className="bg-surface rounded-xl p-5 border border-text/10">
          <h4 className="text-lg font-semibold mb-4 text-text/70">Pending Requests</h4>
          <div className="space-y-3">
            {sentRequests.map((request) => (
              <div
                key={request.id}
                className="flex items-center justify-between p-4 bg-bg rounded-xl"
              >
                <div className="flex items-center gap-3">
                  {request.receiver?.image ? (
                    <Image
                      src={request.receiver.image}
                      alt={request.receiver.name || 'User'}
                      width={44}
                      height={44}
                      className="rounded-full"
                    />
                  ) : (
                    <div className="w-11 h-11 rounded-full bg-text/10 flex items-center justify-center text-text/60 font-bold">
                      {(request.receiver?.name || request.receiver?.email || '?').charAt(0).toUpperCase()}
                    </div>
                  )}
                  <div>
                    <div className="font-semibold">
                      {request.receiver?.name || request.receiver?.email?.split('@')[0]}
                    </div>
                    <div className="text-sm text-text/50">
                      @{request.receiver?.username || request.receiver?.email?.split('@')[0]}
                    </div>
                  </div>
                </div>
                <div className="text-sm text-yellow-500 flex items-center gap-1">
                  <svg className="w-4 h-4 animate-pulse" fill="currentColor" viewBox="0 0 24 24">
                    <circle cx="12" cy="12" r="10"/>
                  </svg>
                  Pending
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Friends List */}
      <div className="bg-surface rounded-xl p-5 border border-text/10">
        <h4 className="text-lg font-semibold mb-4">
          Your Friends ({friends.length})
        </h4>
        {friends.length === 0 ? (
          <div className="text-text/50 py-8 text-center">
            <div className="text-4xl mb-3">👋</div>
            <p>No friends yet</p>
            <p className="text-sm mt-1">Send a friend request to get started!</p>
          </div>
        ) : (
          <div className="space-y-3">
            {friends.map((friend) => (
              <Link
                key={friend.id}
                href={`/user/${friend.username || friend.email}`}
                className="flex items-center justify-between p-4 bg-bg rounded-xl hover:bg-accent/10 transition-colors"
              >
                <div className="flex items-center gap-3">
                  {friend.image ? (
                    <Image
                      src={friend.image}
                      alt={friend.name || 'Friend'}
                      width={44}
                      height={44}
                      className="rounded-full"
                    />
                  ) : (
                    <div className="w-11 h-11 rounded-full bg-accent/20 flex items-center justify-center text-accent font-bold">
                      {(friend.name || friend.email).charAt(0).toUpperCase()}
                    </div>
                  )}
                  <div>
                    <div className="font-semibold">{friend.name || friend.email?.split('@')[0]}</div>
                    <div className="text-sm text-text/50">@{friend.username || friend.email?.split('@')[0]}</div>
                  </div>
                </div>
                <div className="text-sm text-green-400 flex items-center gap-1">
                  <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24">
                    <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-2 15l-5-5 1.41-1.41L10 14.17l7.59-7.59L19 8l-9 9z"/>
                  </svg>
                  Friends
                </div>
              </Link>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}

