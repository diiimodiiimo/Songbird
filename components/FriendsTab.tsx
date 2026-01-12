'use client'

import { useState, useEffect } from 'react'
import { useUser } from '@clerk/nextjs'
import Link from 'next/link'

interface FriendRequest {
  id: string
  status: string
  sender: {
    id: string
    email: string
    name: string | null
    image: string | null
  }
  receiver: {
    id: string
    email: string
    name: string | null
    image: string | null
  }
  createdAt: string
}

interface Friend {
  id: string
  email: string
  name: string | null
  image: string | null
}

export default function FriendsTab() {
  const { user, isLoaded } = useUser()
  const [friendUsername, setFriendUsername] = useState('')
  const [pendingRequests, setPendingRequests] = useState<FriendRequest[]>([])
  const [friends, setFriends] = useState<Friend[]>([])
  const [loading, setLoading] = useState(false)
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null)

  useEffect(() => {
    if (isLoaded && user) {
      fetchFriends()
      fetchFriendRequests()
    }
  }, [isLoaded, user])

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
    (r) => r.receiver.id === user?.id
  )
  const sentRequests = pendingRequests.filter(
    (r) => r.sender.id === user?.id
  )

  return (
    <div className="space-y-6">
      <h3 className="text-xl font-semibold mb-4">Friends</h3>

      {message && (
        <div
          className={`p-3 rounded ${
            message.type === 'success'
              ? 'bg-green-800 text-white'
              : 'bg-red-800 text-white'
          }`}
        >
          {message.text}
        </div>
      )}

      {/* Send Friend Request */}
      <div className="bg-card border border-primary rounded p-4">
        <h4 className="text-lg font-semibold mb-3">Add Friend</h4>
        <p className="text-sm text-primary/60 mb-3">
          Search by username, email, or name to send a friend request
        </p>
        <div className="flex flex-col sm:flex-row gap-2">
          <input
            type="text"
            placeholder="Username, email, or name"
            value={friendUsername}
            onChange={(e) => setFriendUsername(e.target.value)}
            className="flex-grow px-4 py-2 bg-bg border border-primary rounded text-primary placeholder:text-primary/40"
            onKeyPress={(e) => e.key === 'Enter' && !loading && sendFriendRequest()}
          />
          <button
            onClick={sendFriendRequest}
            disabled={loading || !friendUsername.trim()}
            className="bg-primary text-bg px-6 py-2 rounded font-semibold disabled:opacity-50 disabled:cursor-not-allowed hover:bg-primary/90 transition-colors whitespace-nowrap"
          >
            {loading ? 'Sending...' : 'Add Friend'}
          </button>
        </div>
      </div>

      {/* Received Friend Requests */}
      {receivedRequests.length > 0 && (
        <div className="bg-card border border-primary rounded p-4">
          <h4 className="text-lg font-semibold mb-3">Friend Requests</h4>
          <div className="space-y-2">
            {receivedRequests.map((request) => (
              <div
                key={request.id}
                className="flex items-center justify-between p-3 bg-bg rounded"
              >
                <div>
                  <div className="font-semibold">
                    {request.sender.name || request.sender.email}
                  </div>
                  <div className="text-sm text-primary/60">{request.sender.email}</div>
                </div>
                <div className="flex space-x-2">
                  <button
                    onClick={() => handleFriendRequest(request.id, 'accept')}
                    disabled={loading}
                    className="bg-green-600 text-white px-3 py-1 rounded text-sm disabled:opacity-50"
                  >
                    Accept
                  </button>
                  <button
                    onClick={() => handleFriendRequest(request.id, 'decline')}
                    disabled={loading}
                    className="bg-red-600 text-white px-3 py-1 rounded text-sm disabled:opacity-50"
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
        <div className="bg-card border border-primary rounded p-4">
          <h4 className="text-lg font-semibold mb-3">Pending Requests</h4>
          <div className="space-y-2">
            {sentRequests.map((request) => (
              <div
                key={request.id}
                className="flex items-center justify-between p-3 bg-bg rounded"
              >
                <div>
                  <div className="font-semibold">
                    {request.receiver.name || request.receiver.email}
                  </div>
                  <div className="text-sm text-primary/60">{request.receiver.email}</div>
                </div>
                <div className="text-sm text-primary/60">Pending...</div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Friends List */}
      <div className="bg-card border border-primary rounded p-4">
        <h4 className="text-lg font-semibold mb-3">
          Your Friends ({friends.length})
        </h4>
        {friends.length === 0 ? (
          <div className="text-primary/60 py-4 text-center">
            No friends yet. Send a friend request to get started!
          </div>
        ) : (
          <div className="space-y-2">
            {friends.map((friend) => (
              <Link
                key={friend.id}
                href={`/user/${(friend as any).username || friend.email}`}
                className="flex items-center justify-between p-3 bg-bg rounded hover:bg-primary/10 transition-colors cursor-pointer"
              >
                <div>
                  <div className="font-semibold">{friend.name || friend.email}</div>
                  <div className="text-sm text-primary/60">{friend.email}</div>
                </div>
                <div className="text-sm text-green-500">✓ Friends</div>
              </Link>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}

