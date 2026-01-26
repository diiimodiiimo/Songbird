// Home page - Sign in/Sign up (matches web app/home/page.tsx)
import { View, Text, TouchableOpacity, StyleSheet, Image } from 'react-native';
import { useRouter } from 'expo-router';
import { useAuth, useUser } from '../lib/auth';
import { useSignIn, useSignUp } from '@clerk/clerk-expo';
import * as WebBrowser from 'expo-web-browser';
import { useWarmUpBrowser } from '../lib/useWarmUpBrowser';
import { colors, fontSize, spacing, borderRadius } from '../lib/theme';

// Warm up browser for OAuth
WebBrowser.maybeCompleteAuthSession();

export default function HomePage() {
  useWarmUpBrowser();
  const { isLoaded, isSignedIn, signOut } = useAuth();
  const { user } = useUser();
  const router = useRouter();
  const { signIn, setActive: setSignInActive } = useSignIn();
  const { signUp, setActive: setSignUpActive } = useSignUp();

  const handleSignIn = async () => {
    if (!signIn) return;

    try {
      // For now, use OAuth with Google
      // This mirrors Clerk's modal behavior on web
      const redirectUrl = 'songbird://oauth-callback';

      await signIn.create({
        strategy: 'oauth_google',
        redirectUrl,
      });

      const { externalVerificationRedirectURL } = signIn.firstFactorVerification;

      if (externalVerificationRedirectURL) {
        const result = await WebBrowser.openAuthSessionAsync(
          externalVerificationRedirectURL.toString(),
          redirectUrl
        );

        if (result.type === 'success') {
          // Complete the sign in
          if (signIn.status === 'complete') {
            await setSignInActive({ session: signIn.createdSessionId });
            router.replace('/');
          }
        }
      }
    } catch (err) {
      console.error('Sign in error:', err);
    }
  };

  const handleSignUp = async () => {
    if (!signUp) return;

    try {
      const redirectUrl = 'songbird://oauth-callback';

      await signUp.create({
        strategy: 'oauth_google',
        redirectUrl,
      });

      const { externalVerificationRedirectURL } = signUp.verifications.externalAccount;

      if (externalVerificationRedirectURL) {
        const result = await WebBrowser.openAuthSessionAsync(
          externalVerificationRedirectURL.toString(),
          redirectUrl
        );

        if (result.type === 'success') {
          if (signUp.status === 'complete') {
            await setSignUpActive({ session: signUp.createdSessionId });
            router.replace('/welcome');
          }
        }
      }
    } catch (err) {
      console.error('Sign up error:', err);
    }
  };

  const handleSignOut = async () => {
    await signOut();
    // Stay on home page after sign out
  };

  const handleGoToDashboard = () => {
    router.replace('/(tabs)');
  };

  if (!isLoaded) {
    return (
      <View style={styles.container}>
        <Text style={styles.loadingText}>Loading...</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <View style={styles.content}>
        {/* Logo */}
        <View style={styles.logoContainer}>
          {/* TODO: Add actual bird logo image */}
          <View style={styles.logoPlaceholder}>
            <Text style={styles.logoEmoji}>🐦</Text>
          </View>
        </View>

        {/* App Name */}
        <Text style={styles.title}>SongBird</Text>
        <Text style={styles.subtitle}>Your personal music journal</Text>

        {/* Auth Buttons */}
        {isSignedIn ? (
          <View style={styles.buttonContainer}>
            <Text style={styles.signedInText}>
              You are currently signed in. Sign out to use a different account.
            </Text>
            <TouchableOpacity style={styles.signOutButton} onPress={handleSignOut}>
              <Text style={styles.signOutButtonText}>Sign Out</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.dashboardButton} onPress={handleGoToDashboard}>
              <Text style={styles.dashboardButtonText}>Go to Dashboard</Text>
            </TouchableOpacity>
          </View>
        ) : (
          <View style={styles.buttonContainer}>
            <TouchableOpacity style={styles.signInButton} onPress={handleSignIn}>
              <Text style={styles.signInButtonText}>Sign In</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.signUpButton} onPress={handleSignUp}>
              <Text style={styles.signUpButtonText}>Create Account</Text>
            </TouchableOpacity>
          </View>
        )}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.bg,
    justifyContent: 'center',
    alignItems: 'center',
    padding: spacing.lg,
  },
  content: {
    width: '100%',
    maxWidth: 400,
    alignItems: 'center',
  },
  logoContainer: {
    marginBottom: spacing.lg,
  },
  logoPlaceholder: {
    width: 200,
    height: 200,
    justifyContent: 'center',
    alignItems: 'center',
  },
  logoEmoji: {
    fontSize: 120,
  },
  title: {
    fontSize: fontSize.display,
    fontWeight: 'bold',
    color: colors.text,
    marginBottom: spacing.sm,
  },
  subtitle: {
    fontSize: fontSize.xl,
    color: colors.textMuted,
    marginBottom: spacing.xxl,
  },
  loadingText: {
    color: colors.text,
    fontSize: fontSize.md,
  },
  buttonContainer: {
    width: '100%',
    gap: spacing.md,
  },
  signedInText: {
    color: colors.textMuted,
    fontSize: fontSize.md,
    textAlign: 'center',
    marginBottom: spacing.md,
  },
  signInButton: {
    backgroundColor: colors.accent,
    paddingVertical: spacing.md,
    paddingHorizontal: spacing.xl,
    borderRadius: borderRadius.lg,
    width: '100%',
  },
  signInButtonText: {
    color: colors.bg,
    fontSize: fontSize.lg,
    fontWeight: '600',
    textAlign: 'center',
  },
  signUpButton: {
    backgroundColor: colors.surface,
    paddingVertical: spacing.md,
    paddingHorizontal: spacing.xl,
    borderRadius: borderRadius.lg,
    borderWidth: 2,
    borderColor: colors.accent,
    width: '100%',
  },
  signUpButtonText: {
    color: colors.accent,
    fontSize: fontSize.lg,
    fontWeight: '600',
    textAlign: 'center',
  },
  signOutButton: {
    backgroundColor: colors.error,
    paddingVertical: spacing.md,
    paddingHorizontal: spacing.xl,
    borderRadius: borderRadius.lg,
    width: '100%',
  },
  signOutButtonText: {
    color: colors.text,
    fontSize: fontSize.lg,
    fontWeight: '600',
    textAlign: 'center',
  },
  dashboardButton: {
    backgroundColor: colors.surface,
    paddingVertical: spacing.md,
    paddingHorizontal: spacing.xl,
    borderRadius: borderRadius.lg,
    borderWidth: 2,
    borderColor: colors.accent,
    width: '100%',
  },
  dashboardButtonText: {
    color: colors.accent,
    fontSize: fontSize.lg,
    fontWeight: '600',
    textAlign: 'center',
  },
});
