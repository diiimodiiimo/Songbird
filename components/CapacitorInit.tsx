'use client'

import { useEffect } from 'react'
import { useUser } from '@clerk/nextjs'
import { Capacitor } from '@capacitor/core'
import { App as CapApp } from '@capacitor/app'
import { StatusBar, Style } from '@capacitor/status-bar'
import { initNativePushNotifications } from '@/lib/push-native'

export default function CapacitorInit() {
  const { user, isLoaded } = useUser()

  useEffect(() => {
    if (!Capacitor.isNativePlatform()) return

    const setupStatusBar = async () => {
      try {
        await StatusBar.setStyle({ style: Style.Dark })
        await StatusBar.setBackgroundColor({ color: '#1A1A1A' })
      } catch {
        // StatusBar not available
      }
    }

    setupStatusBar()

    const handleDeepLinks = async () => {
      await CapApp.addListener('appUrlOpen', (event) => {
        const url = new URL(event.url)
        const pathname = url.pathname

        if (pathname.startsWith('/join/')) {
          window.location.href = pathname
        } else if (pathname.startsWith('/user/')) {
          window.location.href = pathname
        }
      })
    }

    handleDeepLinks()

    return () => {
      CapApp.removeAllListeners()
    }
  }, [])

  useEffect(() => {
    if (!Capacitor.isNativePlatform()) return
    if (!isLoaded || !user) return

    initNativePushNotifications(user.id)
  }, [isLoaded, user])

  return null
}
