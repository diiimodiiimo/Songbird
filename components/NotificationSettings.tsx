'use client'

import { useState, useEffect } from 'react'
import { useUser } from '@clerk/nextjs'

interface NotificationPreferences {
  notificationsEnabled: boolean
  pushNotificationsEnabled: boolean
  reminderTime: number
  reminderEnabled: boolean
  notifyOnVibe: boolean
  notifyOnComment: boolean
  notifyOnMention: boolean
  notifyOnFriendRequest: boolean
  notifyOnFriendAccepted: boolean
  notifyOnThisDay: boolean
}

export default function NotificationSettings() {
  const { user } = useUser()
  const [preferences, setPreferences] = useState<NotificationPreferences | null>(null)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)

  useEffect(() => {
    if (user) {
      fetchPreferences()
    }
  }, [user])

  const fetchPreferences = async () => {
    try {
      const res = await fetch('/api/notifications/preferences')
      if (res.ok) {
        const data = await res.json()
        setPreferences(data.preferences)
      }
    } catch (error) {
      console.error('Error fetching preferences:', error)
    } finally {
      setLoading(false)
    }
  }

  const updatePreference = async (key: keyof NotificationPreferences, value: boolean | number) => {
    if (!preferences) return

    const newPreferences = { ...preferences, [key]: value }
    setPreferences(newPreferences)
    setSaving(true)

    try {
      const res = await fetch('/api/notifications/preferences', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ [key]: value }),
      })

      if (!res.ok) {
        // Revert on error
        setPreferences(preferences)
        console.error('Failed to update preference')
      }
    } catch (error) {
      // Revert on error
      setPreferences(preferences)
      console.error('Error updating preference:', error)
    } finally {
      setSaving(false)
    }
  }

  if (loading) {
    return (
      <div className="space-y-4">
        <div className="h-4 bg-surface rounded animate-pulse" />
        <div className="h-4 bg-surface rounded animate-pulse" />
      </div>
    )
  }

  if (!preferences) {
    return <div className="text-text/60">Failed to load notification preferences</div>
  }

  return (
    <div className="space-y-6">
      <div>
        <h3 className="text-lg font-semibold mb-2">Notification Settings</h3>
        <p className="text-sm text-text/60 mb-4">
          Control how and when you receive notifications
        </p>
      </div>

      {/* Master Toggle */}
      <div className="bg-surface rounded-lg p-4 border border-text/10">
        <div className="flex items-center justify-between mb-1">
          <label className="font-medium text-text">Enable All Notifications</label>
          <button
            onClick={() => updatePreference('notificationsEnabled', !preferences.notificationsEnabled)}
            className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
              preferences.notificationsEnabled ? 'bg-accent' : 'bg-text/20'
            }`}
          >
            <span
              className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                preferences.notificationsEnabled ? 'translate-x-6' : 'translate-x-1'
              }`}
            />
          </button>
        </div>
        <p className="text-xs text-text/50 mt-1">
          Master switch for all notification types
        </p>
      </div>

      {/* Push Notifications */}
      <div className="bg-surface rounded-lg p-4 border border-text/10">
        <div className="flex items-center justify-between mb-1">
          <label className="font-medium text-text">Push Notifications</label>
          <button
            onClick={() => updatePreference('pushNotificationsEnabled', !preferences.pushNotificationsEnabled)}
            disabled={!preferences.notificationsEnabled}
            className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
              preferences.pushNotificationsEnabled && preferences.notificationsEnabled
                ? 'bg-accent'
                : 'bg-text/20'
            } disabled:opacity-50`}
          >
            <span
              className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                preferences.pushNotificationsEnabled && preferences.notificationsEnabled
                  ? 'translate-x-6'
                  : 'translate-x-1'
              }`}
            />
          </button>
        </div>
        <p className="text-xs text-text/50 mt-1">
          Receive notifications even when the app is closed
        </p>
      </div>

      {/* Daily Reminder */}
      <div className="bg-surface rounded-lg p-4 border border-text/10">
        <div className="flex items-center justify-between mb-3">
          <div>
            <label className="font-medium text-text">Daily Reminder</label>
            <p className="text-xs text-text/50 mt-1">
              Get reminded to log your Song of the Day
            </p>
          </div>
          <button
            onClick={() => updatePreference('reminderEnabled', !preferences.reminderEnabled)}
            disabled={!preferences.notificationsEnabled}
            className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
              preferences.reminderEnabled && preferences.notificationsEnabled
                ? 'bg-accent'
                : 'bg-text/20'
            } disabled:opacity-50`}
          >
            <span
              className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                preferences.reminderEnabled && preferences.notificationsEnabled
                  ? 'translate-x-6'
                  : 'translate-x-1'
              }`}
            />
          </button>
        </div>

        {preferences.reminderEnabled && preferences.notificationsEnabled && (
          <div className="mt-3">
            <label className="block text-sm text-text/70 mb-2">Reminder Time</label>
            <select
              value={preferences.reminderTime}
              onChange={(e) => updatePreference('reminderTime', parseInt(e.target.value))}
              className="w-full px-3 py-2 bg-bg border border-text/20 rounded-lg text-text"
            >
              {Array.from({ length: 24 }, (_, i) => (
                <option key={i} value={i}>
                  {i === 0 ? '12:00 AM' : i < 12 ? `${i}:00 AM` : i === 12 ? '12:00 PM' : `${i - 12}:00 PM`}
                </option>
              ))}
            </select>
            <p className="text-xs text-text/50 mt-1">
              You'll receive reminders at {preferences.reminderTime === 0 ? '12:00 AM' : preferences.reminderTime < 12 ? `${preferences.reminderTime}:00 AM` : preferences.reminderTime === 12 ? '12:00 PM' : `${preferences.reminderTime - 12}:00 PM`} if you haven't logged today
            </p>
          </div>
        )}
      </div>

      {/* Individual Notification Types */}
      <div className="space-y-3">
        <h4 className="font-medium text-text/80 text-sm">Notification Types</h4>
        
        {[
          { key: 'notifyOnVibe' as const, label: 'Vibes', desc: 'When someone vibes your entry' },
          { key: 'notifyOnComment' as const, label: 'Comments', desc: 'When someone comments on your entry' },
          { key: 'notifyOnMention' as const, label: 'Mentions', desc: 'When you\'re mentioned in an entry' },
          { key: 'notifyOnFriendRequest' as const, label: 'Friend Requests', desc: 'When you receive a friend request' },
          { key: 'notifyOnFriendAccepted' as const, label: 'Friend Accepted', desc: 'When someone accepts your friend request' },
          { key: 'notifyOnThisDay' as const, label: 'On This Day', desc: 'Reminders about past entries' },
        ].map(({ key, label, desc }) => (
          <div
            key={key}
            className="flex items-center justify-between p-3 bg-surface/50 rounded-lg border border-text/5"
          >
            <div className="flex-1">
              <div className="font-medium text-sm text-text">{label}</div>
              <div className="text-xs text-text/50 mt-0.5">{desc}</div>
            </div>
            <button
              onClick={() => updatePreference(key, !preferences[key])}
              disabled={!preferences.notificationsEnabled}
              className={`relative inline-flex h-5 w-9 items-center rounded-full transition-colors ml-4 ${
                preferences[key] && preferences.notificationsEnabled
                  ? 'bg-accent'
                  : 'bg-text/20'
              } disabled:opacity-50`}
            >
              <span
                className={`inline-block h-3 w-3 transform rounded-full bg-white transition-transform ${
                  preferences[key] && preferences.notificationsEnabled
                    ? 'translate-x-5'
                    : 'translate-x-0.5'
                }`}
              />
            </button>
          </div>
        ))}
      </div>

      {saving && (
        <div className="text-xs text-text/50 text-center">Saving...</div>
      )}
    </div>
  )
}




