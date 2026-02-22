// Welcome/Onboarding Flow (matches web OnboardingFlow.tsx)
// Full onboarding flow: welcome → demographics → value-prop-1 → value-prop-2 → social-preview → username → spotify-primer → notifications → first-entry → first-entry-celebration → memories → social → attribution → premium → completion
import { useState, useEffect } from 'react';
import { View, Text, ActivityIndicator, StyleSheet, TouchableOpacity } from 'react-native';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { useAuth, useUser, useAuthToken } from '../../lib/auth';
import { api } from '../../lib/api';
import { colors, spacing, fontSize } from '../../lib/theme';
import { Ionicons } from '@expo/vector-icons';

// Import all onboarding screens
import WelcomeScreen from '../../components/onboarding/WelcomeScreen';
import AgeGateScreen from '../../components/onboarding/AgeGateScreen';
import TermsScreen from '../../components/onboarding/TermsScreen';
import ValuePropScreen from '../../components/onboarding/ValuePropScreen';
import ValueProp2Screen from '../../components/onboarding/ValueProp2Screen';
import SocialPreviewScreen from '../../components/onboarding/SocialPreviewScreen';
import UsernameScreen from '../../components/onboarding/UsernameScreen';
import SpotifyPrimerScreen from '../../components/onboarding/SpotifyPrimerScreen';
import NotificationSetupScreen from '../../components/onboarding/NotificationSetupScreen';
import FirstEntryScreen from '../../components/onboarding/FirstEntryScreen';
import FirstEntryCelebrationScreen from '../../components/onboarding/FirstEntryCelebrationScreen';
import MemoriesScreen from '../../components/onboarding/MemoriesScreen';
import SocialScreen from '../../components/onboarding/SocialScreen';
import AttributionScreen from '../../components/onboarding/AttributionScreen';
import PremiumScreen from '../../components/onboarding/PremiumScreen';
import CompletionScreen from '../../components/onboarding/CompletionScreen';

type OnboardingStep =
  | 'welcome'
  | 'demographics'
  | 'terms'
  | 'value-prop-1'
  | 'value-prop-2'
  | 'social-preview'
  | 'username'
  | 'spotify-primer'
  | 'notifications'
  | 'first-entry'
  | 'first-entry-celebration'
  | 'memories'
  | 'social'
  | 'attribution'
  | 'premium'
  | 'completion';

const TOTAL_STEPS = 15;

// Step order for normal flow
const STEP_ORDER: OnboardingStep[] = [
  'welcome',
  'demographics',
  'terms',
  'value-prop-1',
  'value-prop-2',
  'social-preview',
  'username',
  'spotify-primer',
  'notifications',
  'first-entry',
  'first-entry-celebration',
  'memories',
  'social',
  'attribution',
  'premium',
  'completion',
];

// Tutorial mode step order (skip compliance & setup screens)
const TUTORIAL_STEP_ORDER: OnboardingStep[] = [
  'memories',
  'social',
  'attribution',
  'premium',
  'completion',
];

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
  const [firstEntryData, setFirstEntryData] = useState<any>(null);
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

        if (!isTutorialMode) {
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

      // If existing user with username AND entries, auto-complete
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

      // Tutorial mode
      if (isTutorialMode) {
        setCurrentStep('memories');
      } else if (userHasUsername && userHasEntries) {
        router.replace('/(tabs)');
        return;
      } else if (userHasUsername) {
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

  // Get current step index
  const getStepIndex = (step: OnboardingStep): number => {
    const order = isTutorialMode ? TUTORIAL_STEP_ORDER : STEP_ORDER;
    return order.indexOf(step);
  };

  // Back navigation
  const handleBack = () => {
    const order = isTutorialMode ? TUTORIAL_STEP_ORDER : STEP_ORDER;
    const currentIndex = order.indexOf(currentStep);
    if (currentIndex > 0) {
      setCurrentStep(order[currentIndex - 1]);
    } else {
      router.replace('/(tabs)');
    }
  };

  // --- Step Transitions ---
  const handleWelcomeContinue = () => {
    setCurrentStep(isTutorialMode ? 'memories' : 'demographics');
  };

  const handleDemographicsContinue = () => {
    setCurrentStep(isTutorialMode ? 'memories' : 'terms');
  };

  const handleTermsContinue = () => {
    setCurrentStep(isTutorialMode ? 'memories' : 'value-prop-1');
  };

  const handleValueProp1Continue = () => {
    setCurrentStep(isTutorialMode ? 'memories' : 'value-prop-2');
  };

  const handleValueProp2Continue = () => {
    setCurrentStep(isTutorialMode ? 'memories' : 'social-preview');
  };

  const handleSocialPreviewContinue = () => {
    setCurrentStep(isTutorialMode ? 'memories' : 'username');
  };

  const handleUsernameContinue = async (username: string) => {
    setProfile((prev) => (prev ? { ...prev, username } : { username }));
    const token = await getToken();
    if (token) {
      api.trackEvent(token, 'onboarding_username_set').catch(() => {});
    }
    setCurrentStep(isTutorialMode ? 'memories' : 'spotify-primer');
  };

  const handleSpotifyPrimerContinue = () => {
    setCurrentStep(isTutorialMode ? 'memories' : 'notifications');
  };

  const handleNotificationsContinue = () => {
    setCurrentStep('first-entry');
  };

  const handleFirstEntryContinue = (entryData?: any) => {
    setHasFirstEntry(true);
    setFirstEntryData(entryData);
    setCurrentStep('first-entry-celebration');
  };

  const handleFirstEntrySkip = () => {
    setCurrentStep('social');
  };

  const handleFirstEntryCelebrationContinue = () => {
    setCurrentStep(isTutorialMode ? 'memories' : 'social');
  };

  const handleFirstEntryCelebrationViewEntry = () => {
    router.replace('/(tabs)');
  };

  const handleMemoriesContinue = () => {
    setCurrentStep('social');
  };

  const handleSocialContinue = () => {
    setCurrentStep('attribution');
  };

  const handleAttributionContinue = () => {
    setCurrentStep('premium');
  };

  const handlePremiumContinue = () => {
    setCurrentStep('completion');
  };

  const handleComplete = async () => {
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

  // Back button for tutorial mode
  const BackButton = () => {
    if (!isTutorialMode) return null;
    return (
      <TouchableOpacity style={styles.backBtn} onPress={handleBack}>
        <Ionicons name="chevron-back" size={20} color={colors.textMuted} />
        <Text style={styles.backBtnText}>Back</Text>
      </TouchableOpacity>
    );
  };

  // Render current step
  const stepIndex = getStepIndex(currentStep);

  const renderStep = () => {
    // If tutorial mode, redirect non-tutorial steps to memories
    if (isTutorialMode && !TUTORIAL_STEP_ORDER.includes(currentStep)) {
      return <MemoriesScreen onContinue={handleMemoriesContinue} hasFirstEntry={hasFirstEntry} />;
    }

    switch (currentStep) {
      case 'welcome':
        return <WelcomeScreen onContinue={handleWelcomeContinue} />;

      case 'demographics':
        return (
          <AgeGateScreen
            onContinue={handleDemographicsContinue}
            totalSteps={TOTAL_STEPS}
            currentStep={stepIndex}
          />
        );

      case 'terms':
        return (
          <TermsScreen
            onContinue={handleTermsContinue}
            totalSteps={TOTAL_STEPS}
            currentStep={stepIndex}
          />
        );

      case 'value-prop-1':
        return (
          <ValuePropScreen
            onContinue={handleValueProp1Continue}
            totalSteps={TOTAL_STEPS}
            currentStep={stepIndex}
          />
        );

      case 'value-prop-2':
        return (
          <ValueProp2Screen
            onContinue={handleValueProp2Continue}
            totalSteps={TOTAL_STEPS}
            currentStep={stepIndex}
          />
        );

      case 'social-preview':
        return (
          <SocialPreviewScreen
            onContinue={handleSocialPreviewContinue}
            onSkip={handleSocialPreviewContinue}
            totalSteps={TOTAL_STEPS}
            currentStep={stepIndex}
          />
        );

      case 'username':
        return (
          <UsernameScreen
            onContinue={handleUsernameContinue}
            existingUsername={profile?.username}
          />
        );

      case 'spotify-primer':
        return (
          <SpotifyPrimerScreen
            onContinue={handleSpotifyPrimerContinue}
            totalSteps={TOTAL_STEPS}
            currentStep={stepIndex}
          />
        );

      case 'notifications':
        return (
          <NotificationSetupScreen
            onContinue={handleNotificationsContinue}
            totalSteps={TOTAL_STEPS}
            currentStep={stepIndex}
          />
        );

      case 'first-entry':
        return (
          <FirstEntryScreen
            onContinue={handleFirstEntryContinue}
            onSkip={handleFirstEntrySkip}
          />
        );

      case 'first-entry-celebration':
        return (
          <FirstEntryCelebrationScreen
            onContinue={handleFirstEntryCelebrationContinue}
            onViewEntry={handleFirstEntryCelebrationViewEntry}
            entry={firstEntryData}
          />
        );

      case 'memories':
        return <MemoriesScreen onContinue={handleMemoriesContinue} hasFirstEntry={hasFirstEntry} />;

      case 'social':
        return (
          <SocialScreen
            onContinue={handleSocialContinue}
            inviteCode={profile?.inviteCode}
          />
        );

      case 'attribution':
        return (
          <AttributionScreen
            onContinue={handleAttributionContinue}
            totalSteps={TOTAL_STEPS}
            currentStep={stepIndex}
          />
        );

      case 'premium':
        return (
          <PremiumScreen
            onContinue={handlePremiumContinue}
            totalSteps={TOTAL_STEPS}
            currentStep={stepIndex}
          />
        );

      case 'completion':
        return <CompletionScreen onComplete={handleComplete} isTutorialMode={isTutorialMode} />;

      default:
        return <WelcomeScreen onContinue={handleWelcomeContinue} />;
    }
  };

  return (
    <View style={styles.root}>
      <BackButton />
      {renderStep()}
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: colors.bg },
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
  backBtn: {
    position: 'absolute',
    top: 50,
    left: 16,
    zIndex: 50,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.surface,
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 8,
    gap: 4,
  },
  backBtnText: {
    color: colors.textMuted,
    fontSize: fontSize.sm,
  },
});
