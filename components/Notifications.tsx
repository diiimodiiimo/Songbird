'use client'

import { useState, useEffect } from 'react'
import { useUser } from '@clerk/nextjs'
import ThemeBird from './ThemeBird'

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

  const dismissNotification = async (notificationId: string) => {
    // Remove from local state immediately for instant feedback
    setNotifications(prev => prev.filter(n => n.id !== notificationId))
    setUnreadCount(prev => {
      const notification = notifications.find(n => n.id === notificationId)
      return notification && !notification.read ? prev - 1 : prev
    })
    
    // Mark as read on server
    try {
      await fetch('/api/notifications', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ notificationIds: [notificationId] }),
      })
    } catch (error) {
      console.error('Error dismissing notification:', error)
    }
  }

  const getNotificationText = (notification: Notification): string => {
    if (notification.type === 'mention') {
      const entry = notification.relatedData
      if (entry) {
        return `${entry.user?.name || entry.user?.email || 'Someone'} mentioned you in "${entry.songTitle}"`
      }
      return 'Someone mentioned you in a song'
    } else if (notification.type === 'friend_request_accepted') {
      const request = notification.relatedData
      if (request) {
        const friend = request.receiver?.id === user?.id ? request.sender : request.receiver
        return `${friend?.name || friend?.email || 'Someone'} accepted your friend request`
      }
      return 'Friend request accepted'
    } else if (notification.type === 'vibe') {
      const entry = notification.relatedData
      if (entry) {
        return `Someone vibed to "${entry.songTitle}"`
      }
      return 'Someone vibed to your song!'
    } else if (notification.type === 'comment') {
      const comment = notification.relatedData
      if (comment) {
        return `${comment.user?.name || comment.user?.email || 'Someone'} commented on your song`
      }
      return 'New comment on your song'
    } else if (notification.type === 'friend_request') {
      const request = notification.relatedData
      if (request) {
        return `${request.sender?.name || request.sender?.email || 'Someone'} sent you a friend request`
      }
      return 'New friend request'
    }
    return 'New notification'
  }

  const getNotificationIcon = (type: string): string => {
    switch (type) {
      case 'vibe': return '💗'
      case 'comment': return '💬'
      case 'mention': return '📣'
      case 'friend_request': return '👋'
      case 'friend_request_accepted': return '🤝'
      default: return '🔔'
    }
  }

  return (
    <div className="relative">
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="relative p-2 sm:px-3 sm:py-2 bg-surface border border-text/20 rounded-lg hover:bg-surface/80 transition-colors"
      >
        <span className="text-sm sm:text-base">🔔</span>
        {unreadCount > 0 && (
          <span className="absolute -top-1 -right-1 bg-pink-500 text-white text-[10px] sm:text-xs rounded-full w-4 h-4 sm:w-5 sm:h-5 flex items-center justify-center font-medium">
            {unreadCount > 9 ? '9+' : unreadCount}
          </span>
        )}
      </button>

      {isOpen && (
        <>
          <div
            className="fixed inset-0 z-10 bg-black/20"
            onClick={() => setIsOpen(false)}
          />
          <div className="absolute right-0 mt-2 w-72 sm:w-80 bg-surface border border-text/20 rounded-xl shadow-xl z-20 max-h-80 sm:max-h-96 overflow-hidden">
            <div className="p-2 sm:p-3 border-b border-text/10 flex justify-between items-center bg-bg/50">
              <h3 className="font-semibold text-sm sm:text-base">Notifications</h3>
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
                  className="text-xs sm:text-sm text-accent hover:text-accent/80 transition-colors"
                  disabled={loading}
                >
                  Clear all
                </button>
              )}
            </div>
            <div className="divide-y divide-text/5 overflow-y-auto max-h-64 sm:max-h-80">
              {notifications.length === 0 ? (
                <div className="p-6 text-center">
                  <div className="flex justify-center mb-3">
                    <ThemeBird size={48} state="sleepy" />
                  </div>
                  <p className="text-text/50 text-xs sm:text-sm">No notifications yet</p>
                  <p className="text-text/30 text-xs mt-1">All quiet in the nest</p>
                </div>
              ) : (
                notifications.map((notification) => (
                  <button
                    key={notification.id}
                    onClick={() => dismissNotification(notification.id)}
                    className={`w-full text-left p-2 sm:p-3 hover:bg-accent/5 transition-colors flex items-start gap-2 ${
                      !notification.read ? 'bg-accent/10' : ''
                    }`}
                  >
                    <span className="text-sm sm:text-base flex-shrink-0 mt-0.5">
                      {getNotificationIcon(notification.type)}
                    </span>
                    <div className="flex-1 min-w-0">
                      <div className="text-xs sm:text-sm leading-snug line-clamp-2">
                        {getNotificationText(notification)}
                      </div>
                      <div className="text-[10px] sm:text-xs text-text/40 mt-0.5">
                        {new Date(notification.createdAt).toLocaleDateString()}
                      </div>
                    </div>
                    <span className="text-text/30 text-xs flex-shrink-0">×</span>
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
