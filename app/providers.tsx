'use client'

import { ClerkProvider } from '@clerk/nextjs'
import { ThemeProvider } from '@/lib/theme'
import PushNotifications from '@/components/PushNotifications'

export function Providers({ children }: { children: React.ReactNode }) {
  // Get publishable key from environment variable
  // Fallback to the key from next.config.js if env var isn't set
  const publishableKey = 
    process.env.NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY || 
    'pk_test_Y2hhcm1pbmcta2l3aS0zOS5jbGVyay5hY2NvdW50cy5kZXYk'
  
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
      <ThemeProvider>
        {children}
        <PushNotifications />
      </ThemeProvider>
    </ClerkProvider>
  )
}
