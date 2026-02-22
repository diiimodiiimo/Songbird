import { useState, useCallback } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, Image, ActivityIndicator } from 'react-native';
import { useRouter } from 'expo-router';
import { useAuth, useUser } from '../lib/auth';
import { useOAuth } from '@clerk/clerk-expo';
import * as WebBrowser from 'expo-web-browser';
import * as Linking from 'expo-linking';
import { colors, fontSize, spacing, borderRadius, defaultBirdImage } from '../lib/theme';

WebBrowser.maybeCompleteAuthSession();

export default function HomePage() {
  const { isLoaded, isSignedIn, signOut } = useAuth();
  const { user } = useUser();
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const { startOAuthFlow: startGoogleOAuth } = useOAuth({ strategy: 'oauth_google' });
  const { startOAuthFlow: startAppleOAuth } = useOAuth({ strategy: 'oauth_apple' });

  const handleOAuth = useCallback(async (provider: 'google' | 'apple') => {
    setLoading(true);
    setError(null);
    try {
      const startFlow = provider === 'google' ? startGoogleOAuth : startAppleOAuth;

      const { createdSessionId, setActive } = await startFlow({
        redirectUrl: Linking.createURL('/', { scheme: 'songbird' }),
      });

      if (createdSessionId && setActive) {
        await setActive({ session: createdSessionId });
        router.replace('/');
      }
    } catch (err: any) {
      console.error(`${provider} OAuth error:`, err);
      if (err?.errors?.[0]?.message) {
        setError(err.errors[0].message);
      } else {
        setError('Sign in failed. Please try again.');
      }
    } finally {
      setLoading(false);
    }
  }, [startGoogleOAuth, startAppleOAuth, router]);

  const handleSignOut = async () => {
    await signOut();
  };

  const handleGoToDashboard = () => {
    router.replace('/(tabs)');
  };

  if (!isLoaded) {
    return (
      <View style={styles.container}>
        <ActivityIndicator size="large" color={colors.accent} />
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <View style={styles.content}>
        {/* Real bird logo */}
        <Image
          source={defaultBirdImage}
          style={styles.logo}
          resizeMode="contain"
        />

        {/* App Name */}
        <Text style={styles.title}>SongBird</Text>
        <Text style={styles.subtitle}>Your personal music journal</Text>

        {/* Error message */}
        {error && (
          <View style={styles.errorContainer}>
            <Text style={styles.errorText}>{error}</Text>
          </View>
        )}

        {isSignedIn ? (
          <View style={styles.buttonContainer}>
            <Text style={styles.signedInText}>
              Welcome back, {user?.firstName || 'friend'}!
            </Text>
            <TouchableOpacity style={styles.primaryButton} onPress={handleGoToDashboard}>
              <Text style={styles.primaryButtonText}>Go to Dashboard</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.outlineButton} onPress={handleSignOut}>
              <Text style={styles.outlineButtonText}>Sign Out</Text>
            </TouchableOpacity>
          </View>
        ) : (
          <View style={styles.buttonContainer}>
            {/* Google Sign In */}
            <TouchableOpacity
              style={[styles.primaryButton, loading && styles.disabledButton]}
              onPress={() => handleOAuth('google')}
              disabled={loading}
            >
              {loading ? (
                <ActivityIndicator size="small" color={colors.bg} />
              ) : (
                <Text style={styles.primaryButtonText}>Continue with Google</Text>
              )}
            </TouchableOpacity>

            {/* Apple Sign In */}
            <TouchableOpacity
              style={[styles.outlineButton, loading && styles.disabledButton]}
              onPress={() => handleOAuth('apple')}
              disabled={loading}
            >
              <Text style={styles.outlineButtonText}>Continue with Apple</Text>
            </TouchableOpacity>

            <Text style={styles.termsText}>
              By continuing, you agree to our Terms of Service and Privacy Policy
            </Text>
          </View>
        )}
      </View>

      {/* Spotify attribution */}
      <View style={styles.footer}>
        <Text style={styles.footerText}>Powered by Spotify</Text>
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
  logo: {
    width: 200,
    height: 200,
    marginBottom: spacing.lg,
  },
  title: {
    fontSize: fontSize.display,
    fontWeight: 'bold',
    color: colors.text,
    marginBottom: spacing.xs,
    fontFamily: 'serif',
  },
  subtitle: {
    fontSize: fontSize.xl,
    color: colors.textMuted,
    marginBottom: spacing.xxl,
  },
  errorContainer: {
    backgroundColor: colors.error + '1A',
    borderWidth: 1,
    borderColor: colors.error + '4D',
    borderRadius: borderRadius.lg,
    padding: spacing.md,
    marginBottom: spacing.lg,
    width: '100%',
  },
  errorText: {
    color: colors.error,
    fontSize: fontSize.sm,
    textAlign: 'center',
  },
  signedInText: {
    color: colors.text,
    fontSize: fontSize.lg,
    textAlign: 'center',
    marginBottom: spacing.lg,
  },
  buttonContainer: {
    width: '100%',
    gap: spacing.md,
  },
  primaryButton: {
    backgroundColor: colors.primary,
    paddingVertical: spacing.md,
    paddingHorizontal: spacing.xl,
    borderRadius: borderRadius.lg,
    width: '100%',
    alignItems: 'center',
  },
  primaryButtonText: {
    color: colors.text,
    fontSize: fontSize.lg,
    fontWeight: '600',
    textAlign: 'center',
  },
  outlineButton: {
    backgroundColor: colors.surface,
    paddingVertical: spacing.md,
    paddingHorizontal: spacing.xl,
    borderRadius: borderRadius.lg,
    borderWidth: 2,
    borderColor: colors.primary,
    width: '100%',
    alignItems: 'center',
  },
  outlineButtonText: {
    color: colors.accent,
    fontSize: fontSize.lg,
    fontWeight: '600',
    textAlign: 'center',
  },
  disabledButton: {
    opacity: 0.6,
  },
  termsText: {
    fontSize: fontSize.xs,
    color: colors.textMuted,
    textAlign: 'center',
    marginTop: spacing.sm,
    lineHeight: 18,
  },
  footer: {
    position: 'absolute',
    bottom: spacing.xxl,
  },
  footerText: {
    fontSize: fontSize.xs,
    color: colors.textMuted,
  },
});
