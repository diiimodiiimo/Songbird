'use client'

import { ClerkProvider } from '@clerk/nextjs'
import { ThemeProvider } from '@/lib/theme'
import PushNotifications from '@/components/PushNotifications'

export function Providers({ children }: { children: React.ReactNode }) {
  return (
    <ClerkProvider
      publishableKey="pk_test_Y2hhcm1pbmcta2l3aS0zOS5jbGVyay5hY2NvdW50cy5kZXYk"
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
