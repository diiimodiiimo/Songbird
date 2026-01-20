'use client'

import Link from 'next/link'
import InviteFriendsCTA from '@/components/InviteFriendsCTA'

export function EmptyAviary() {
  return (
    <div className="text-center py-8 px-6">
      <div className="text-5xl mb-4">🪺</div>
      <h2 className="text-xl font-bold text-text mb-2">Your aviary is quiet</h2>
      <p className="text-text-muted mb-6 max-w-xs mx-auto text-sm">
        Invite friends to see their birds and discover what songs they&apos;re vibing to.
      </p>
      
      {/* Invite CTA - Primary action */}
      <InviteFriendsCTA 
        variant="inline"
        className="mb-4"
      />
      
      {/* Secondary action */}
      <div className="mt-4">
        <p className="text-text/40 text-xs mb-2">or</p>
        <Link 
          href="/?tab=feed" 
          className="inline-block px-4 py-2 bg-surface text-text/70 rounded-lg text-sm font-medium no-underline hover:bg-surface/80 transition-all"
          onClick={() => {
            window.dispatchEvent(new CustomEvent('navigateToFriends'))
          }}
        >
          Find friends by username
        </Link>
      </div>
    </div>
  )
}

