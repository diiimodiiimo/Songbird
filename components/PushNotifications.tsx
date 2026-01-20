'use client'

import { useState, useEffect } from 'react'
import { useUser } from '@clerk/nextjs'

interface BeforeInstallPromptEvent extends Event {
  prompt: () => Promise<void>
  userChoice: Promise<{ outcome: 'accepted' | 'dismissed' }>
}

// Helper function to convert ArrayBuffer to base64
function arrayBufferToBase64(buffer: ArrayBuffer): string {
  const bytes = new Uint8Array(buffer)
  let binary = ''
  for (let i = 0; i < bytes.byteLength; i++) {
    binary += String.fromCharCode(bytes[i])
  }
  return btoa(binary)
}

export default function PushNotifications() {
  const { user, isLoaded } = useUser()
  const [permission, setPermission] = useState<NotificationPermission>('default')
  const [isSubscribed, setIsSubscribed] = useState(false)
  const [isInstallable, setIsInstallable] = useState(false)
  const [isStandalone, setIsStandalone] = useState(false)
  const [deferredPrompt, setDeferredPrompt] = useState<BeforeInstallPromptEvent | null>(null)
  const [showBanner, setShowBanner] = useState(false)
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    // Check if running in standalone mode (installed PWA)
    const checkStandalone = () => {
      const isStandaloneMode = 
        window.matchMedia('(display-mode: standalone)').matches ||
        (window.navigator as any).standalone === true ||
        document.referrer.includes('android-app://');
      setIsStandalone(isStandaloneMode)
    }
    checkStandalone()

    // Check notification permission
    if ('Notification' in window) {
      setPermission(Notification.permission)
    }

    // Listen for PWA install prompt
    const handleBeforeInstallPrompt = (e: Event) => {
      e.preventDefault()
      setDeferredPrompt(e as BeforeInstallPromptEvent)
      setIsInstallable(true)
    }

    window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt)

    // Check if already subscribed
    checkSubscription()

    // Determine if we should show the banner
    const dismissed = localStorage.getItem('pushBannerDismissed')
    const dismissedAt = dismissed ? parseInt(dismissed, 10) : 0
    const daysSinceDismissed = (Date.now() - dismissedAt) / (1000 * 60 * 60 * 24)
    
    // Show banner if not dismissed in last 7 days and notifications aren't set up
    if (daysSinceDismissed > 7 && Notification.permission !== 'granted') {
      setShowBanner(true)
    }

    return () => {
      window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt)
    }
  }, [])

  const checkSubscription = async () => {
    if (!('serviceWorker' in navigator) || !('PushManager' in window)) {
      return
    }

    try {
      const registration = await navigator.serviceWorker.ready
      const subscription = await registration.pushManager.getSubscription()
      setIsSubscribed(!!subscription)
    } catch (error) {
      console.error('Error checking subscription:', error)
    }
  }

  const registerServiceWorker = async () => {
    if (!('serviceWorker' in navigator)) {
      console.warn('Service workers not supported')
      return null
    }

    try {
      const registration = await navigator.serviceWorker.register('/sw.js', {
        scope: '/'
      })
      console.log('Service Worker registered:', registration.scope)
      return registration
    } catch (error) {
      console.error('Service Worker registration failed:', error)
      return null
    }
  }

  const subscribeToNotifications = async () => {
    if (!isLoaded || !user) return

    setLoading(true)
    try {
      // First, request notification permission
      const permission = await Notification.requestPermission()
      setPermission(permission)

      if (permission !== 'granted') {
        console.log('Notification permission denied')
        setLoading(false)
        return
      }

      // Register service worker
      const registration = await registerServiceWorker()
      if (!registration) {
        setLoading(false)
        return
      }

      // Wait for service worker to be ready
      await navigator.serviceWorker.ready

      // Get the VAPID public key from environment
      const vapidPublicKey = process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY

      if (!vapidPublicKey) {
        console.warn('VAPID public key not configured')
        setLoading(false)
        return
      }

      // Convert VAPID key to Uint8Array
      const urlBase64ToUint8Array = (base64String: string) => {
        const padding = '='.repeat((4 - base64String.length % 4) % 4)
        const base64 = (base64String + padding)
          .replace(/-/g, '+')
          .replace(/_/g, '/')
        const rawData = window.atob(base64)
        const outputArray = new Uint8Array(rawData.length)
        for (let i = 0; i < rawData.length; ++i) {
          outputArray[i] = rawData.charCodeAt(i)
        }
        return outputArray
      }

      // Subscribe to push notifications
      const subscription = await registration.pushManager.subscribe({
        userVisibleOnly: true,
        applicationServerKey: urlBase64ToUint8Array(vapidPublicKey)
      })

      // Send subscription to server
      const response = await fetch('/api/push/subscribe', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          subscription: {
            endpoint: subscription.endpoint,
            keys: {
              p256dh: arrayBufferToBase64(subscription.getKey('p256dh')!),
              auth: arrayBufferToBase64(subscription.getKey('auth')!)
            }
          }
        })
      })

      if (response.ok) {
        setIsSubscribed(true)
        setShowBanner(false)
        console.log('Push subscription saved successfully')
      }
    } catch (error) {
      console.error('Error subscribing to notifications:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleInstallClick = async () => {
    if (!deferredPrompt) return

    setLoading(true)
    try {
      await deferredPrompt.prompt()
      const { outcome } = await deferredPrompt.userChoice
      
      if (outcome === 'accepted') {
        setIsInstallable(false)
        setDeferredPrompt(null)
        // After install, wait a bit and then prompt for notifications
        setTimeout(() => {
          subscribeToNotifications()
        }, 2000)
      }
    } catch (error) {
      console.error('Error showing install prompt:', error)
    } finally {
      setLoading(false)
    }
  }

  const dismissBanner = () => {
    localStorage.setItem('pushBannerDismissed', Date.now().toString())
    setShowBanner(false)
  }

  // Don't show anything if not loaded or no user
  if (!isLoaded || !user) return null

  // Don't show if already subscribed
  if (isSubscribed && permission === 'granted') return null

  // Don't show banner if dismissed
  if (!showBanner) return null

  // Check if browser supports notifications
  if (!('Notification' in window) || !('serviceWorker' in navigator)) {
    return null
  }

  // iOS Safari specific message
  const isIOS = /iPad|iPhone|iPod/.test(navigator.userAgent) && !(window as any).MSStream
  const isSafari = /^((?!chrome|android).)*safari/i.test(navigator.userAgent)

  return (
    <div className="fixed bottom-0 left-0 right-0 z-50 p-3 sm:p-4 bg-gradient-to-r from-accent/90 to-pink-600/90 backdrop-blur-sm border-t border-white/20 safe-area-bottom">
      <div className="max-w-lg mx-auto flex items-center gap-3">
        <div className="text-2xl sm:text-3xl flex-shrink-0">🐦</div>
        <div className="flex-1 min-w-0">
          {isIOS && isSafari && !isStandalone ? (
            <>
              <p className="text-white font-semibold text-sm sm:text-base">Add SongBird to Home Screen</p>
              <p className="text-white/80 text-xs sm:text-sm">
                Tap <span className="inline-block">
                  <svg className="w-4 h-4 inline" fill="currentColor" viewBox="0 0 24 24">
                    <path d="M12 2l3 3h-2v8h-2V5H9l3-3zm-7 9v10h14V11h-3v2h1v6H7v-6h1v-2H5z"/>
                  </svg>
                </span> then "Add to Home Screen" for notifications
              </p>
            </>
          ) : isInstallable ? (
            <>
              <p className="text-white font-semibold text-sm sm:text-base">Install SongBird</p>
              <p className="text-white/80 text-xs sm:text-sm">Add to home screen for the best experience & notifications</p>
            </>
          ) : (
            <>
              <p className="text-white font-semibold text-sm sm:text-base">Enable Notifications</p>
              <p className="text-white/80 text-xs sm:text-sm">Get notified when friends interact with your songs</p>
            </>
          )}
        </div>
        <div className="flex gap-2 flex-shrink-0">
          {isInstallable && !(isIOS && isSafari) ? (
            <button
              onClick={handleInstallClick}
              disabled={loading}
              className="px-3 py-1.5 sm:px-4 sm:py-2 bg-white text-accent font-semibold rounded-lg text-xs sm:text-sm hover:bg-white/90 transition-colors disabled:opacity-50"
            >
              {loading ? '...' : 'Install'}
            </button>
          ) : !isIOS || isStandalone ? (
            <button
              onClick={subscribeToNotifications}
              disabled={loading}
              className="px-3 py-1.5 sm:px-4 sm:py-2 bg-white text-accent font-semibold rounded-lg text-xs sm:text-sm hover:bg-white/90 transition-colors disabled:opacity-50"
            >
              {loading ? '...' : 'Enable'}
            </button>
          ) : null}
          <button
            onClick={dismissBanner}
            className="p-1.5 sm:p-2 text-white/60 hover:text-white transition-colors"
            aria-label="Dismiss"
          >
            <svg className="w-4 h-4 sm:w-5 sm:h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>
      </div>
    </div>
  )
}

