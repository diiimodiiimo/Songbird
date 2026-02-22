'use client'

import { ClerkProvider } from '@clerk/nextjs'
import { ThemeProvider } from '@/lib/theme'

export default function WelcomeLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <div className="min-h-screen bg-bg text-text">
      {/* No navigation - clean onboarding experience */}
      {children}
    </div>
  )
}







