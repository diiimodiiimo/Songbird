// Welcome/Onboarding Flow (matches web app/welcome/page.tsx)
// This is the main onboarding flow container
import { useState, useEffect } from 'react';
import { View, Text, ActivityIndicator, StyleSheet } from 'react-native';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { useAuth, useUser, useAuthToken } from '../../lib/auth';
import { api } from '../../lib/api';
import { colors, spacing } from '../../lib/theme';

// Import onboarding screens
import WelcomeScreen from '../../components/onboarding/WelcomeScreen';
import UsernameScreen from '../../components/onboarding/UsernameScreen';
import FirstEntryScreen from '../../components/onboarding/FirstEntryScreen';
import MemoriesScreen from '../../components/onboarding/MemoriesScreen';
import SocialScreen from '../../components/onboarding/SocialScreen';
import CompletionScreen from '../../components/onboarding/CompletionScreen';

type OnboardingStep = 'welcome' | 'username' | 'first-entry' | 'memories' | 'social' | 'completion';

interface UserProfile {
  username?: string;
  inviteCode?: string;
  onboardingCompletedAt?: string;
}

export default function WelcomeIndex() {
  const { isLoaded, isSignedIn } = useAuth();
  const { user } = useUser();
  const { getToken } = useAuthToken();
  const router = useRouter();
  const params = useLocalSearchParams();
  const isTutorialMode = params.tutorial === 'true';

  const [currentStep, setCurrentStep] = useState<OnboardingStep>('welcome');
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [hasFirstEntry, setHasFirstEntry] = useState(false);
  const [loading, setLoading] = useState(true);

  // Check user state on mount
  useEffect(() => {
    if (isLoaded) {
      if (!isSignedIn) {
        router.replace('/home');
        return;
      }
      checkUserState();
    }
  }, [isLoaded, isSignedIn]);

  const checkUserState = async () => {
    try {
      const token = await getToken();
      if (!token) {
        router.replace('/home');
        return;
      }

      // Fetch profile
      const { user: profileData } = await api.getProfile(token);
      let userHasUsername = false;

      if (profileData) {
        setProfile(profileData);

        // In tutorial mode, don't redirect - let them view the tutorial
        if (!isTutorialMode) {
          // If onboarding already completed, redirect to dashboard
          if (profileData.onboardingCompletedAt) {
            router.replace('/(tabs)');
            return;
          }
        }

        userHasUsername = !!profileData.username;
      }

      // Check if user has any entries
      let userHasEntries = false;
      try {
        const { entries } = await api.getEntries(token, 1, 1);
        userHasEntries = entries?.length > 0;
        setHasFirstEntry(userHasEntries);
      } catch (err) {
        console.log('Error checking entries:', err);
      }

      // If existing user with username AND entries, auto-complete onboarding
      // (Skip this in tutorial mode)
      if (!isTutorialMode && userHasUsername && userHasEntries) {
        try {
          await api.completeOnboarding(token);
          router.replace('/(tabs)');
          return;
        } catch (err) {
          console.error('Error auto-completing onboarding:', err);
          router.replace('/(tabs)');
          return;
        }
      }

      // In tutorial mode with existing username, skip to memories screen
      if (isTutorialMode && userHasUsername && userHasEntries) {
        setCurrentStep('memories');
      } else if (userHasUsername) {
        // If username already set but no entries, start at first-entry step
        setCurrentStep('first-entry');
      }

      // Track analytics
      api.trackEvent(token, isTutorialMode ? 'tutorial_started' : 'onboarding_started').catch(() => {});
    } catch (err) {
      console.error('Error checking user state:', err);
    } finally {
      setLoading(false);
    }
  };

  // Handle step transitions
  const handleWelcomeContinue = () => {
    setCurrentStep('username');
  };

  const handleUsernameContinue = async (username: string) => {
    setProfile((prev) => (prev ? { ...prev, username } : { username }));

    const token = await getToken();
    if (token) {
      api.trackEvent(token, 'onboarding_username_set').catch(() => {});
    }

    setCurrentStep('first-entry');
  };

  const handleFirstEntryContinue = () => {
    setHasFirstEntry(true);
    setCurrentStep('memories');
  };

  const handleFirstEntrySkip = () => {
    setCurrentStep('memories');
  };

  const handleMemoriesContinue = () => {
    setCurrentStep('social');
  };

  const handleSocialContinue = () => {
    setCurrentStep('completion');
  };

  const handleComplete = async () => {
    // CompletionScreen handles the API call
    router.replace('/(tabs)');
  };

  // Loading state
  if (loading || !isLoaded) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color={colors.accent} />
        <Text style={styles.loadingText}>Loading...</Text>
      </View>
    );
  }

  // Render current step
  switch (currentStep) {
    case 'welcome':
      return <WelcomeScreen onContinue={handleWelcomeContinue} />;

    case 'username':
      return <UsernameScreen onContinue={handleUsernameContinue} existingUsername={profile?.username} />;

    case 'first-entry':
      return <FirstEntryScreen onContinue={handleFirstEntryContinue} onSkip={handleFirstEntrySkip} />;

    case 'memories':
      return <MemoriesScreen onContinue={handleMemoriesContinue} hasFirstEntry={hasFirstEntry} />;

    case 'social':
      return <SocialScreen onContinue={handleSocialContinue} inviteCode={profile?.inviteCode} />;

    case 'completion':
      return <CompletionScreen onComplete={handleComplete} isTutorialMode={isTutorialMode} />;

    default:
      return <WelcomeScreen onContinue={handleWelcomeContinue} />;
  }
}

const styles = StyleSheet.create({
  loadingContainer: {
    flex: 1,
    backgroundColor: colors.bg,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    color: colors.textMuted,
    marginTop: spacing.md,
  },
});
