'use client'

import { useState } from 'react'
import { ClerkProvider } from '@clerk/nextjs'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { ThemeProvider } from '@/lib/theme'
import PushNotifications from '@/components/PushNotifications'
import CapacitorInit from '@/components/CapacitorInit'

export function Providers({ children }: { children: React.ReactNode }) {
  const publishableKey = process.env.NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY

  const [queryClient] = useState(
    () =>
      new QueryClient({
        defaultOptions: {
          queries: {
            staleTime: 60 * 1000,
            retry: 1,
            refetchOnWindowFocus: false,
          },
        },
      })
  )

  if (!publishableKey) {
    console.error('Clerk publishable key is not configured')
    return <div className="min-h-screen flex items-center justify-center">Error: Clerk not configured</div>
  }

  return (
    <ClerkProvider
      publishableKey={publishableKey}
      signInUrl="/home"
      signUpUrl="/home"
      afterSignInUrl="/"
      afterSignUpUrl="/"
    >
      <QueryClientProvider client={queryClient}>
        <ThemeProvider>
          {children}
          <PushNotifications />
          <CapacitorInit />
        </ThemeProvider>
      </QueryClientProvider>
    </ClerkProvider>
  )
}
