// Root index - redirects based on auth state (matches web app/page.tsx)
import { useEffect, useState } from 'react';
import { View, Text, ActivityIndicator } from 'react-native';
import { useRouter } from 'expo-router';
import { useAuth, useUser, useAuthToken } from '../lib/auth';
import { api } from '../lib/api';
import { colors } from '../lib/theme';

export default function Index() {
  const { isLoaded, isSignedIn } = useAuth();
  const { user } = useUser();
  const { getToken } = useAuthToken();
  const router = useRouter();
  const [checking, setChecking] = useState(true);

  useEffect(() => {
    const checkUserState = async () => {
      if (!isLoaded) return;

      // Not signed in - go to home (sign in/sign up page)
      if (!isSignedIn) {
        router.replace('/home');
        return;
      }

      // Signed in - check onboarding status
      try {
        const token = await getToken();
        if (!token) {
          router.replace('/home');
          return;
        }

        const { user: profile } = await api.getProfile(token);

        // If user hasn't completed onboarding AND doesn't have a username, redirect to welcome
        if (profile && profile.onboardingCompletedAt === null && !profile.username) {
          router.replace('/welcome');
          return;
        }

        // User is authenticated and onboarded - go to dashboard
        router.replace('/(tabs)');
      } catch (error) {
        console.log('[index] Onboarding check error:', error);
        // On error, try to go to dashboard anyway
        router.replace('/(tabs)');
      }
    };

    checkUserState();
  }, [isLoaded, isSignedIn]);

  return (
    <View style={{ flex: 1, backgroundColor: colors.bg, justifyContent: 'center', alignItems: 'center' }}>
      <ActivityIndicator size="large" color={colors.accent} />
      <Text style={{ color: colors.textMuted, marginTop: 16 }}>Loading...</Text>
    </View>
  );
}
