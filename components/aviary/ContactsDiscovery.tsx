'use client'

import { useState, useEffect } from 'react'
import Image from 'next/image'
import { getThemeById, getBirdLogo } from '@/lib/theme'

// Check if we're in a mobile environment (Expo)
const isExpo = typeof window !== 'undefined' && (
  (window as any).expo || 
  (typeof navigator !== 'undefined' && (navigator as any).product === 'ReactNative')
)

interface ContactUser {
  id: string
  email: string
  name: string | null
  username: string
  image?: string
  theme: string
  isFriend: boolean
  hasPendingRequest: boolean
  requestDirection: 'sent' | 'received' | null
}

interface ContactsDiscoveryProps {
  onFriendRequestSent?: () => void
}

export function ContactsDiscovery({ onFriendRequestSent }: ContactsDiscoveryProps) {
  const [contacts, setContacts] = useState<ContactUser[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [sendingRequests, setSendingRequests] = useState<Set<string>>(new Set())
  const [phoneInput, setPhoneInput] = useState('')
  const [showPhoneInput, setShowPhoneInput] = useState(false)

  // Try to get contacts from native device contacts
  const handleImportContacts = async () => {
    try {
      setLoading(true)
      setError(null)

      let phoneNumbers: string[] = []

      // Check if we're in Expo/React Native environment
      if (isExpo || (typeof navigator !== 'undefined' && (navigator as any).product === 'ReactNative')) {
        // Use Expo Contacts API (native mobile)
        try {
          // Dynamic import for Expo Contacts (only loads in mobile)
          const expoContacts = await import('expo-contacts')
          const { requestPermissionsAsync, getContactsAsync, Fields } = expoContacts
          
          // Request permission
          const { status } = await requestPermissionsAsync()
          if (status !== 'granted') {
            setError('Contact access denied. Please enter phone numbers manually.')
            setShowPhoneInput(true)
            setLoading(false)
            return
          }

          // Get contacts with phone numbers
          const { data: contacts } = await getContactsAsync({
            fields: [Fields.PhoneNumbers],
          })

          // Extract phone numbers from contacts
          phoneNumbers = contacts
            .filter(c => c.phoneNumbers && c.phoneNumbers.length > 0)
            .flatMap(c => c.phoneNumbers!.map(p => p.number || p.digits || ''))
            .filter(Boolean)

          if (phoneNumbers.length === 0) {
            setError('No phone numbers found in contacts')
            setLoading(false)
            return
          }

          await findContactsByPhone(phoneNumbers)
        } catch (expoError: any) {
          console.error('Expo Contacts error:', expoError)
          // If expo-contacts isn't available (web environment), fallback
          if (expoError.code === 'MODULE_NOT_FOUND' || expoError.message?.includes('expo-contacts')) {
            // We're in web environment - try web Contacts API or show manual input
            if ('contacts' in navigator && 'ContactsManager' in window) {
              try {
                const contactsManager = (navigator as any).contacts
                const contacts = await contactsManager.select(['tel'], { multiple: true })
                phoneNumbers = contacts
                  .flatMap((c: any) => c.tel || [])
                  .map((p: any) => p.value || p)
                  .filter(Boolean)
                
                if (phoneNumbers.length > 0) {
                  await findContactsByPhone(phoneNumbers)
                } else {
                  setError('No phone numbers found. Please enter manually.')
                  setShowPhoneInput(true)
                }
              } catch (webError) {
                setError('Contact access not available. Please enter phone numbers manually.')
                setShowPhoneInput(true)
              }
            } else {
              setError('Contact access not available. Please enter phone numbers manually.')
              setShowPhoneInput(true)
            }
          } else {
            // Other error - show manual input
            setError('Failed to access contacts. Please enter phone numbers manually.')
            setShowPhoneInput(true)
          }
          setLoading(false)
        }
      } else if ('contacts' in navigator && 'ContactsManager' in window) {
        // Web Contacts API fallback
        try {
          const contactsManager = (navigator as any).contacts
          const contacts = await contactsManager.select(['tel'], { multiple: true })
          phoneNumbers = contacts
            .flatMap((c: any) => c.tel || [])
            .map((p: any) => p.value || p)
            .filter(Boolean)
          
          if (phoneNumbers.length > 0) {
            await findContactsByPhone(phoneNumbers)
          } else {
            setError('No phone numbers found. Please enter manually.')
            setShowPhoneInput(true)
          }
        } catch (webError) {
          setError('Contact access not available. Please enter phone numbers manually.')
          setShowPhoneInput(true)
        }
      } else {
        // No contacts API available - show manual input
        setShowPhoneInput(true)
        setError('Contact access not available. Please enter phone numbers manually.')
      }
    } catch (err: any) {
      console.error('Error importing contacts:', err)
      if (err.name === 'NotAllowedError' || err.name === 'AbortError') {
        setError('Contact access denied. Please enter phone numbers manually.')
        setShowPhoneInput(true)
      } else {
        setError('Failed to import contacts. Try entering phone numbers manually.')
        setShowPhoneInput(true)
      }
    } finally {
      setLoading(false)
    }
  }

  const handleManualPhoneSubmit = async () => {
    if (!phoneInput.trim()) return

    const phoneNumbers = phoneInput
      .split(/[,\n]/)
      .map(p => p.trim())
      .filter(Boolean)

    if (phoneNumbers.length === 0) {
      setError('Please enter valid phone numbers')
      return
    }

    setLoading(true)
    setError(null)
    await findContactsByPhone(phoneNumbers)
    setPhoneInput('')
    setShowPhoneInput(false)
    setLoading(false)
  }

  const findContactsByPhone = async (phoneNumbers: string[]) => {
    try {
      const res = await fetch('/api/contacts/find', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ phoneNumbers }),
      })

      const data = await res.json()
      if (res.ok) {
        // Filter out users who are already friends
        const nonFriends = data.users.filter((u: ContactUser) => !u.isFriend)
        setContacts(nonFriends)
        if (nonFriends.length === 0) {
          setError('No contacts found on SongBird')
        }
      } else {
        setError(data.error || 'Failed to find contacts')
      }
    } catch (err) {
      console.error('Error finding contacts:', err)
      setError('Failed to find contacts')
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
        // Update contact status
        setContacts(prev => prev.map(c => 
          c.id === userId 
            ? { ...c, hasPendingRequest: true, requestDirection: 'sent' }
            : c
        ))
        onFriendRequestSent?.()
      } else {
        const data = await res.json()
        setError(data.error || 'Failed to send friend request')
      }
    } catch (err) {
      console.error('Error sending friend request:', err)
      setError('Failed to send friend request')
    } finally {
      setSendingRequests(prev => {
        const next = new Set(prev)
        next.delete(userId)
        return next
      })
    }
  }

  if (contacts.length === 0 && !showPhoneInput && !loading) {
    return (
      <div className="bg-surface/50 border border-text/10 rounded-lg p-4">
        <div className="flex items-center justify-between mb-2">
          <h3 className="text-sm font-semibold text-text-muted">People You May Know</h3>
          <button
            onClick={handleImportContacts}
            className="text-xs text-primary hover:text-primary/80 font-medium"
          >
            Find Contacts
          </button>
        </div>
        <p className="text-xs text-text-muted">
          Discover friends from your contacts who are on SongBird
        </p>
      </div>
    )
  }

  return (
    <div className="bg-surface/50 border border-text/10 rounded-lg p-4">
      <div className="flex items-center justify-between mb-3">
        <h3 className="text-sm font-semibold text-text">People You May Know</h3>
        {contacts.length > 0 && (
          <button
            onClick={() => {
              setContacts([])
              setShowPhoneInput(false)
              setError(null)
            }}
            className="text-xs text-text-muted hover:text-text"
          >
            Clear
          </button>
        )}
      </div>

      {showPhoneInput && (
        <div className="mb-4 space-y-2">
          <textarea
            placeholder="Enter phone numbers separated by commas (e.g., +1234567890, 234-567-8901)..."
            value={phoneInput}
            onChange={(e) => setPhoneInput(e.target.value)}
            className="w-full px-3 py-2 bg-bg border border-text/20 rounded-lg text-text text-sm placeholder:text-text/40 focus:outline-none focus:ring-2 focus:ring-primary/50"
            rows={3}
          />
          <div className="flex gap-2">
            <button
              onClick={handleManualPhoneSubmit}
              disabled={loading || !phoneInput.trim()}
              className="px-4 py-1.5 bg-primary text-bg text-sm font-medium rounded-lg hover:bg-primary/90 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading ? 'Finding...' : 'Find Contacts'}
            </button>
            <button
              onClick={() => {
                setShowPhoneInput(false)
                setPhoneInput('')
              }}
              className="px-4 py-1.5 bg-surface border border-text/20 text-text text-sm font-medium rounded-lg hover:bg-surface/80 transition-colors"
            >
              Cancel
            </button>
          </div>
        </div>
      )}

      {error && (
        <div className="mb-3 p-2 bg-red-500/20 border border-red-500/30 rounded text-xs text-red-400">
          {error}
        </div>
      )}

      {loading && contacts.length === 0 && (
        <div className="text-center py-4">
          <div className="inline-block w-6 h-6 border-2 border-primary border-t-transparent rounded-full animate-spin" />
          <p className="text-xs text-text-muted mt-2">Finding contacts...</p>
        </div>
      )}

      {contacts.length > 0 && (
        <div className="flex gap-3 overflow-x-auto pb-2 scrollbar-hide">
          {contacts.map((contact) => {
            const theme = getThemeById(contact.theme as any)
            return (
              <div key={contact.id} className="flex-shrink-0 flex flex-col items-center gap-2">
                <div className="relative w-16 h-16 flex items-center justify-center">
                  {contact.image ? (
                    <Image
                      src={contact.image}
                      alt={contact.username}
                      width={64}
                      height={64}
                      className="w-16 h-16 rounded-full object-cover border-2 border-surface"
                    />
                  ) : (
                    <Image
                      src={getBirdLogo(contact.theme as any)}
                      alt={`${theme.shortName} bird`}
                      width={64}
                      height={64}
                      className="w-16 h-16 object-contain"
                    />
                  )}
                </div>
                <div className="text-center">
                  <p className="text-xs font-medium text-text truncate max-w-[80px]">
                    {contact.username}
                  </p>
                  {contact.hasPendingRequest ? (
                    <p className="text-xs text-text-muted mt-0.5">
                      {contact.requestDirection === 'sent' ? 'Request sent' : 'Request received'}
                    </p>
                  ) : (
                    <button
                      onClick={() => sendFriendRequest(contact.username, contact.id)}
                      disabled={sendingRequests.has(contact.id)}
                      className="mt-1 px-3 py-1 bg-primary text-bg text-xs font-medium rounded-lg hover:bg-primary/90 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      {sendingRequests.has(contact.id) ? 'Sending...' : 'Add Friend'}
                    </button>
                  )}
                </div>
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}

