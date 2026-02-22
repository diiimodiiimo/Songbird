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
  const [mounted, setMounted] = useState(false)

  // Prevent hydration mismatch by only rendering after mount
  useEffect(() => {
    setMounted(true)
  }, [])

  useEffect(() => {
    if (isLoaded && user && mounted) {
      fetchNotifications()
      // Poll for new notifications every 30 seconds
      const interval = setInterval(fetchNotifications, 30000)
      return () => clearInterval(interval)
    }
  }, [isLoaded, user, mounted])

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

  const handleFriendRequest = async (notificationId: string, requestId: string, action: 'accept' | 'decline') => {
    setLoading(true)
    try {
      const res = await fetch(`/api/friends/requests/${requestId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action }),
      })

      if (res.ok) {
        // Remove the notification
        dismissNotification(notificationId)
      } else {
        const data = await res.json()
        console.error('Failed to process friend request:', data.error)
      }
    } catch (error) {
      console.error('Error processing friend request:', error)
    } finally {
      setLoading(false)
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
        const viber = entry.vibeUser
        const viberName = viber?.name || viber?.username || viber?.email || 'Someone'
        return `${viberName} vibed to "${entry.songTitle}"`
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

  const formatDate = (dateString: string): string => {
    if (!mounted) return '' // Return empty during SSR to prevent hydration mismatch
    const date = new Date(dateString)
    const now = new Date()
    const diffMs = now.getTime() - date.getTime()
    const diffMins = Math.floor(diffMs / 60000)
    const diffHours = Math.floor(diffMs / 3600000)
    const diffDays = Math.floor(diffMs / 86400000)

    if (diffMins < 1) return 'Just now'
    if (diffMins < 60) return `${diffMins}m ago`
    if (diffHours < 24) return `${diffHours}h ago`
    if (diffDays < 7) return `${diffDays}d ago`
    return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
  }

  const handleBellClick = () => {
    const wasOpen = isOpen
    setIsOpen(!isOpen)
    if (!wasOpen && unreadCount > 0) {
      const unreadIds = notifications.filter((n) => !n.read).map((n) => n.id)
      markAsRead(unreadIds)
    }
  }

  return (
    <div className="relative">
      <button
        onClick={handleBellClick}
        className="relative p-2 sm:px-3 sm:py-2 bg-surface border border-text/20 rounded-lg hover:bg-surface/80 transition-colors"
      >
        <span className="text-sm sm:text-base">🔔</span>
        {mounted && unreadCount > 0 && (
          <span className="absolute -top-1 -right-1 bg-pink-500 text-white text-[10px] sm:text-xs rounded-full w-4 h-4 sm:w-5 sm:h-5 flex items-center justify-center font-medium">
            {unreadCount > 9 ? '9+' : unreadCount}
          </span>
        )}
      </button>

      {isOpen && (
        <>
          <div
            className="fixed inset-0 z-10 bg-black/40 sm:bg-black/20"
            onClick={() => setIsOpen(false)}
          />
          {/* Mobile: full-width bottom sheet. Desktop: absolute dropdown */}
          <div className="fixed inset-x-0 bottom-0 sm:absolute sm:inset-auto sm:right-0 sm:top-full sm:mt-2 w-full sm:w-80 bg-surface border-t sm:border border-text/20 sm:rounded-xl shadow-xl z-20 max-h-[70vh] sm:max-h-96 overflow-hidden rounded-t-2xl sm:rounded-t-xl">
            {/* Mobile drag handle */}
            <div className="flex justify-center pt-2 pb-1 sm:hidden">
              <div className="w-10 h-1 bg-text/20 rounded-full" />
            </div>
            <div className="p-3 sm:p-3 border-b border-text/10 flex justify-between items-center bg-bg/50">
              <h3 className="font-semibold text-base sm:text-base">Notifications</h3>
              <div className="flex items-center gap-3">
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
                    className="text-sm text-accent hover:text-accent/80 transition-colors"
                    disabled={loading}
                  >
                    Clear all
                  </button>
                )}
                <button
                  onClick={() => setIsOpen(false)}
                  className="sm:hidden text-text/50 hover:text-text/80 text-lg p-1"
                >
                  ✕
                </button>
              </div>
            </div>
            <div className="divide-y divide-text/5 overflow-y-auto max-h-[55vh] sm:max-h-80">
              {notifications.length === 0 ? (
                <div className="p-6 text-center">
                  <div className="flex justify-center mb-3">
                    <ThemeBird size={48} state="sleepy" />
                  </div>
                  <p className="text-text/50 text-xs sm:text-sm">No notifications yet</p>
                  <p className="text-text/30 text-xs mt-1">All quiet in the nest</p>
                </div>
              ) : (
                notifications.map((notification) => {
                  // Determine if notification is clickable and should navigate
                  const isClickable = ['vibe', 'comment', 'mention'].includes(notification.type)
                  
                  const handleNotificationClick = () => {
                    if (!isClickable) return
                    
                    // Mark as read
                    if (!notification.read) {
                      markAsRead([notification.id])
                    }
                    
                    // Navigate to feed tab to see interactions on their posts
                    setIsOpen(false)
                    window.dispatchEvent(new Event('navigateToFeed'))
                  }
                  
                  return (
                    <div
                      key={notification.id}
                      onClick={isClickable && notification.type !== 'friend_request' ? handleNotificationClick : undefined}
                      className={`w-full text-left p-3 hover:bg-accent/5 transition-colors ${
                        !notification.read ? 'bg-accent/10' : ''
                      } ${isClickable && notification.type !== 'friend_request' ? 'cursor-pointer active:bg-accent/15' : ''}`}
                    >
                      <div className="flex items-start gap-3">
                        <span className="text-base flex-shrink-0 mt-0.5">
                          {getNotificationIcon(notification.type)}
                        </span>
                        <div className="flex-1 min-w-0">
                          <div className="text-sm leading-snug line-clamp-2">
                            {getNotificationText(notification)}
                          </div>
                          <div className="text-xs text-text/40 mt-1">
                            {formatDate(notification.createdAt)}
                          </div>
                          {isClickable && notification.type !== 'friend_request' && (
                            <div className="text-xs text-accent/70 mt-1">
                              Tap to view in feed →
                            </div>
                          )}
                          
                          {/* Friend request action buttons */}
                          {notification.type === 'friend_request' && notification.relatedId && (
                            <div className="flex gap-2 mt-2">
                              <button
                                onClick={(e) => {
                                  e.stopPropagation()
                                  handleFriendRequest(notification.id, notification.relatedId!, 'accept')
                                }}
                                disabled={loading}
                                className="px-3 py-1 bg-accent text-bg text-xs font-medium rounded-lg hover:bg-accent/90 transition-colors disabled:opacity-50"
                              >
                                Accept
                              </button>
                              <button
                                onClick={(e) => {
                                  e.stopPropagation()
                                  handleFriendRequest(notification.id, notification.relatedId!, 'decline')
                                }}
                                disabled={loading}
                                className="px-3 py-1 bg-surface border border-text/20 text-text/70 text-xs font-medium rounded-lg hover:bg-surface/80 transition-colors disabled:opacity-50"
                              >
                                Decline
                              </button>
                            </div>
                          )}
                        </div>
                        <button 
                          onClick={(e) => {
                            e.stopPropagation()
                            dismissNotification(notification.id)
                          }}
                          className="text-text/30 text-xs flex-shrink-0 hover:text-text/60 p-1"
                        >
                          ×
                        </button>
                      </div>
                    </div>
                  )
                })
              )}
            </div>
          </div>
        </>
      )}
    </div>
  )
}
