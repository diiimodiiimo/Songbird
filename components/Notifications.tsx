'use client'

import { useState, useEffect } from 'react'
import { useUser } from '@clerk/nextjs'

interface Notification {
  id: string
  type: string
  relatedId: string | null
  read: boolean
  createdAt: string
  relatedData: any
}

export default function Notifications() {
  const { user, isLoaded } = useUser()
  const [notifications, setNotifications] = useState<Notification[]>([])
  const [unreadCount, setUnreadCount] = useState(0)
  const [isOpen, setIsOpen] = useState(false)
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    if (isLoaded && user) {
      fetchNotifications()
      // Poll for new notifications every 30 seconds
      const interval = setInterval(fetchNotifications, 30000)
      return () => clearInterval(interval)
    }
  }, [isLoaded, user])

  const fetchNotifications = async () => {
    if (!user) return

    try {
      const res = await fetch('/api/notifications?unreadOnly=false')
      const data = await res.json()
      if (res.ok) {
        setNotifications(data.notifications)
        setUnreadCount(data.notifications.filter((n: Notification) => !n.read).length)
      }
    } catch (error) {
      console.error('Error fetching notifications:', error)
    }
  }

  const markAsRead = async (notificationIds: string[]) => {
    setLoading(true)
    try {
      const res = await fetch('/api/notifications', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ notificationIds }),
      })

      if (res.ok) {
        fetchNotifications()
      }
    } catch (error) {
      console.error('Error marking notifications as read:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleNotificationClick = (notification: Notification) => {
    if (!notification.read) {
      markAsRead([notification.id])
    }
    setIsOpen(false)
  }

  const getNotificationText = (notification: Notification): string => {
    if (notification.type === 'mention') {
      const entry = notification.relatedData
      if (entry) {
        return `${entry.user.name || entry.user.email} mentioned you in "${entry.songTitle}"`
      }
      return 'Someone mentioned you in a song'
    } else if (notification.type === 'friend_request') {
      const request = notification.relatedData
      if (request?.sender) {
        return `${request.sender.name || request.sender.email} sent you a friend request`
      }
      return 'You have a new friend request!'
    } else if (notification.type === 'friend_request_accepted') {
      const request = notification.relatedData
      if (request) {
        const friend = request.receiver.id === user?.id ? request.sender : request.receiver
        return `${friend.name || friend.email} accepted your friend request`
      }
      return 'Friend request accepted'
    }
    return 'New notification'
  }

  const getNotificationIcon = (type: string): string => {
    if (type === 'mention') return '💬'
    if (type === 'friend_request') return '👋'
    if (type === 'friend_request_accepted') return '🎉'
    return '🔔'
  }

  return (
    <div className="relative">
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="relative px-3 py-2 bg-card border border-primary rounded hover:bg-primary/10 transition-colors"
      >
        🔔
        {unreadCount > 0 && (
          <span className="absolute -top-1 -right-1 bg-red-500 text-white text-xs rounded-full w-5 h-5 flex items-center justify-center">
            {unreadCount > 9 ? '9+' : unreadCount}
          </span>
        )}
      </button>

      {isOpen && (
        <>
          <div
            className="fixed inset-0 z-10"
            onClick={() => setIsOpen(false)}
          />
          <div className="absolute right-0 mt-2 w-80 bg-card border border-primary rounded shadow-lg z-20 max-h-96 overflow-y-auto">
            <div className="p-3 border-b border-primary/20 flex justify-between items-center">
              <h3 className="font-semibold">Notifications</h3>
              {unreadCount > 0 && (
                <button
                  onClick={() => {
                    const unreadIds = notifications
                      .filter((n) => !n.read)
                      .map((n) => n.id)
                    if (unreadIds.length > 0) {
                      markAsRead(unreadIds)
                    }
                  }}
                  className="text-sm text-primary/60 hover:text-primary"
                  disabled={loading}
                >
                  Mark all read
                </button>
              )}
            </div>
            <div className="divide-y divide-primary/10">
              {notifications.length === 0 ? (
                <div className="p-4 text-center text-primary/60 text-sm">
                  No notifications
                </div>
              ) : (
                notifications.map((notification) => (
                  <button
                    key={notification.id}
                    onClick={() => {
                      handleNotificationClick(notification)
                      // Navigate to appropriate page based on notification type
                      if (notification.type === 'friend_request') {
                        window.dispatchEvent(new CustomEvent('navigateToFriends'))
                      }
                    }}
                    className={`w-full text-left p-3 hover:bg-primary/5 transition-colors ${
                      !notification.read ? 'bg-accent/20 border-l-2 border-accent' : ''
                    }`}
                  >
                    <div className="flex items-start gap-2">
                      <span className="text-lg">{getNotificationIcon(notification.type)}</span>
                      <div className="flex-1">
                        <div className="text-sm">{getNotificationText(notification)}</div>
                        <div className="text-xs text-text/50 mt-1">
                          {new Date(notification.createdAt).toLocaleDateString()}
                        </div>
                      </div>
                      {!notification.read && (
                        <span className="w-2 h-2 rounded-full bg-accent flex-shrink-0 mt-1.5" />
                      )}
                    </div>
                  </button>
                ))
              )}
            </div>
          </div>
        </>
      )}
    </div>
  )
}





