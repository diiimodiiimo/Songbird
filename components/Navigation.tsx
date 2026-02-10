'use client'

import { useState, useEffect } from 'react'
import { useUser, SignOutButton } from '@clerk/nextjs'
import Link from 'next/link'
import Notifications from './Notifications'
import { ThemeBirdLogo } from './ThemeBird'

export default function Navigation() {
  const { user, isLoaded } = useUser()
  const [mounted, setMounted] = useState(false)

  // Prevent hydration mismatch by only rendering after mount
  useEffect(() => {
    setMounted(true)
  }, [])

  return (
    <nav className="bg-card border-b border-white/10 px-4 py-3">
      <div className="container mx-auto flex justify-between items-center">
        <Link href="/" className="flex items-center">
          <ThemeBirdLogo size={32} textSize="lg" interactive showTooltip />
        </Link>
        <div className="flex items-center gap-4">
          {mounted && isLoaded && user && (
            <>
              <Notifications />
              <span className="text-text-muted text-sm">{user.firstName || user.emailAddresses[0]?.emailAddress}</span>
              <SignOutButton redirectUrl="/home">
                <button
                  className="px-4 py-2 bg-white/5 border border-white/20 rounded-lg hover:bg-white/10 transition-colors text-white text-sm"
                >
                  Sign Out
                </button>
              </SignOutButton>
            </>
          )}
        </div>
      </div>
    </nav>
  )
}


