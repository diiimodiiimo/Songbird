// Clerk authentication configuration for Expo
import * as SecureStore from 'expo-secure-store';
import { ClerkProvider as BaseClerkProvider, useAuth as useClerkAuth, useUser } from '@clerk/clerk-expo';
import Constants from 'expo-constants';
import React from 'react';

const CLERK_PUBLISHABLE_KEY = Constants.expoConfig?.extra?.clerkPublishableKey || '';

// Token cache for Clerk using SecureStore
const tokenCache = {
  async getToken(key: string): Promise<string | null> {
    try {
      return await SecureStore.getItemAsync(key);
    } catch (err) {
      console.error('Error getting token from SecureStore:', err);
      return null;
    }
  },
  async saveToken(key: string, value: string): Promise<void> {
    try {
      await SecureStore.setItemAsync(key, value);
    } catch (err) {
      console.error('Error saving token to SecureStore:', err);
    }
  },
  async clearToken(key: string): Promise<void> {
    try {
      await SecureStore.deleteItemAsync(key);
    } catch (err) {
      console.error('Error clearing token from SecureStore:', err);
    }
  },
};

interface ClerkProviderProps {
  children: React.ReactNode;
}

export function ClerkProvider({ children }: ClerkProviderProps) {
  if (!CLERK_PUBLISHABLE_KEY) {
    console.error('Missing Clerk publishable key');
    return <>{children}</>;
  }

  return (
    <BaseClerkProvider
      publishableKey={CLERK_PUBLISHABLE_KEY}
      tokenCache={tokenCache}
    >
      {children}
    </BaseClerkProvider>
  );
}

// Create a wrapper hook for useAuth that includes signOut
export function useAuth() {
  const auth = useClerkAuth();
  return {
    ...auth,
    signOut: auth.signOut,
  };
}

// Re-export useUser
export { useUser };

// Helper hook to get auth token for API calls
export function useAuthToken() {
  const { getToken } = useClerkAuth();

  const fetchToken = async (): Promise<string | null> => {
    try {
      const token = await getToken();
      return token;
    } catch (err) {
      console.error('Error getting auth token:', err);
      return null;
    }
  };

  return { getToken: fetchToken };
}
