# /mobile-app

Help with the SongBird mobile app - Expo/React Native implementation.

## Overview

SongBird has a native mobile app built with:
- **Expo** (managed workflow)
- **React Native**
- **Expo Router** (file-based routing)
- **Clerk** (authentication)

## Project Structure

```
mobile/
├── app/
│   ├── _layout.tsx          # Root layout (Clerk provider)
│   ├── (tabs)/
│   │   ├── _layout.tsx      # Tab navigator
│   │   ├── index.tsx        # Today tab
│   │   ├── feed.tsx         # Feed tab
│   │   ├── memories.tsx     # Memories tab
│   │   ├── analytics.tsx    # Insights tab
│   │   └── profile.tsx      # Profile tab
│   └── auth/
│       ├── _layout.tsx      # Auth layout
│       ├── sign-in.tsx      # Sign in screen
│       └── sign-up.tsx      # Sign up screen
├── lib/
│   ├── api.ts               # API client
│   └── clerk.tsx            # Clerk configuration
├── app.config.ts            # Expo config
├── app.json                 # App metadata
├── eas.json                 # EAS Build config
└── package.json
```

## Getting Started

```bash
cd mobile
npm install
npx expo start
```

See `mobile/GETTING_STARTED.md` for full setup instructions.

## API Client Pattern

```typescript
// mobile/lib/api.ts
const API_URL = process.env.EXPO_PUBLIC_API_URL || 'https://your-app.vercel.app'

export async function fetchWithAuth(endpoint: string, options: RequestInit = {}) {
  const token = await getToken() // From Clerk
  
  return fetch(`${API_URL}${endpoint}`, {
    ...options,
    headers: {
      ...options.headers,
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json',
    },
  })
}
```

## Clerk Authentication

```tsx
// mobile/lib/clerk.tsx
import { ClerkProvider } from '@clerk/clerk-expo'
import * as SecureStore from 'expo-secure-store'

const tokenCache = {
  async getToken(key: string) {
    return SecureStore.getItemAsync(key)
  },
  async saveToken(key: string, value: string) {
    return SecureStore.setItemAsync(key, value)
  },
}

export function AuthProvider({ children }) {
  return (
    <ClerkProvider 
      publishableKey={CLERK_PUBLISHABLE_KEY}
      tokenCache={tokenCache}
    >
      {children}
    </ClerkProvider>
  )
}
```

## Navigation Pattern

```tsx
// Using Expo Router
import { Tabs } from 'expo-router'

export default function TabLayout() {
  return (
    <Tabs>
      <Tabs.Screen name="index" options={{ title: 'Today' }} />
      <Tabs.Screen name="feed" options={{ title: 'Feed' }} />
      <Tabs.Screen name="memories" options={{ title: 'Memories' }} />
      <Tabs.Screen name="analytics" options={{ title: 'Insights' }} />
      <Tabs.Screen name="profile" options={{ title: 'Profile' }} />
    </Tabs>
  )
}
```

## Key Differences from Web

| Feature | Web (Next.js) | Mobile (Expo) |
|---------|---------------|---------------|
| Routing | App Router | Expo Router |
| Auth | `@clerk/nextjs` | `@clerk/clerk-expo` |
| Storage | localStorage | SecureStore |
| Styling | Tailwind CSS | StyleSheet/NativeWind |
| Images | `next/image` | `<Image>` from RN |

## Environment Variables

```
# Mobile uses EXPO_PUBLIC_ prefix
EXPO_PUBLIC_API_URL=https://your-app.vercel.app
EXPO_PUBLIC_CLERK_PUBLISHABLE_KEY=pk_test_xxx
```

## Building for App Store

```bash
# Install EAS CLI
npm install -g eas-cli

# Login to Expo
eas login

# Build for iOS
eas build --platform ios

# Build for Android
eas build --platform android

# Submit to stores
eas submit --platform ios
eas submit --platform android
```

## Common Issues

### "API calls failing"
- Check `EXPO_PUBLIC_API_URL` is set
- Verify CORS headers on API routes
- Check auth token is being sent

### "Clerk not working"
- Verify publishable key is correct
- Check SecureStore is working
- Ensure Expo development client is set up

### "Build failing"
- Check `eas.json` configuration
- Verify all native dependencies
- Run `expo doctor` for diagnostics

## Testing

```bash
# Run on iOS simulator
npx expo run:ios

# Run on Android emulator
npx expo run:android

# Run with Expo Go (limited)
npx expo start
```


