'use client'

import { signOut, useSession } from 'next-auth/react'
import Link from 'next/link'
import Image from 'next/image'
import Notifications from './Notifications'

export default function Navigation() {
  const { data: session } = useSession()

  return (
    <nav className="bg-card border-b border-white/10 px-4 py-3">
      <div className="container mx-auto flex justify-between items-center">
        <Link href="/" className="text-xl font-bold text-white flex items-center gap-2">
          <Image src="/SongBirdlogo.png" alt="SongBird" width={32} height={32} className="object-contain" />
          SongBird
        </Link>
        <div className="flex items-center gap-4">
          {session?.user && (
            <>
              <Notifications />
              <span className="text-text-muted text-sm">{session.user.name || session.user.email}</span>
              <button
                onClick={() => signOut()}
                className="px-4 py-2 bg-white/5 border border-white/20 rounded-lg hover:bg-white/10 transition-colors text-white text-sm"
              >
                Sign Out
              </button>
            </>
          )}
        </div>
      </div>
    </nav>
  )
}


