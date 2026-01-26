// Join page for invite codes (matches web app/join/[code]/page.tsx)
import { useState, useEffect } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ActivityIndicator } from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { colors, fontSize, spacing, borderRadius } from '../../lib/theme';
import { api } from '../../lib/api';
import { useAuth, useAuthToken } from '../../lib/auth';

export default function JoinPage() {
  const { code } = useLocalSearchParams<{ code: string }>();
  const router = useRouter();
  const { isLoaded, isSignedIn } = useAuth();
  const { getToken } = useAuthToken();

  const [validating, setValidating] = useState(true);
  const [isValid, setIsValid] = useState(false);
  const [inviteInfo, setInviteInfo] = useState<any>(null);
  const [accepting, setAccepting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    validateInvite();
  }, [code]);

  const validateInvite = async () => {
    if (!code) {
      setError('Invalid invite code');
      setValidating(false);
      return;
    }

    try {
      const data = await api.validateInvite(code);
      setIsValid(data.valid);
      setInviteInfo(data.invite);
    } catch (err) {
      setError('Could not validate invite');
    } finally {
      setValidating(false);
    }
  };

  const handleAccept = async () => {
    if (!isSignedIn) {
      // Store code and redirect to sign up
      router.push('/home');
      return;
    }

    setAccepting(true);
    try {
      const token = await getToken();
      if (!token) throw new Error('Not authenticated');

      await api.acceptInvite(token, code || '');
      router.replace('/(tabs)');
    } catch (err: any) {
      setError(err.message || 'Failed to accept invite');
    } finally {
      setAccepting(false);
    }
  };

  if (validating) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.content}>
          <ActivityIndicator size="large" color={colors.accent} />
          <Text style={styles.loadingText}>Validating invite...</Text>
        </View>
      </SafeAreaView>
    );
  }

  if (!isValid || error) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.content}>
          <Text style={styles.errorEmoji}>😕</Text>
          <Text style={styles.errorTitle}>Invalid Invite</Text>
          <Text style={styles.errorText}>
            {error || 'This invite code is not valid or has expired.'}
          </Text>
          <TouchableOpacity
            style={styles.button}
            onPress={() => router.replace('/home')}
          >
            <Text style={styles.buttonText}>Go to Home</Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.content}>
        <Text style={styles.birdEmoji}>🐦</Text>
        <Text style={styles.title}>You're Invited!</Text>
        <Text style={styles.subtitle}>
          {inviteInfo?.inviterName
            ? `${inviteInfo.inviterName} invited you to join SongBird`
            : 'Join SongBird - Your personal music journal'}
        </Text>

        {isSignedIn ? (
          <TouchableOpacity
            style={[styles.button, accepting && styles.disabledButton]}
            onPress={handleAccept}
            disabled={accepting}
          >
            <Text style={styles.buttonText}>
              {accepting ? 'Joining...' : 'Accept Invite'}
            </Text>
          </TouchableOpacity>
        ) : (
          <>
            <TouchableOpacity
              style={styles.button}
              onPress={() => router.push('/home')}
            >
              <Text style={styles.buttonText}>Sign Up to Join</Text>
            </TouchableOpacity>
            <Text style={styles.hintText}>
              Already have an account? Sign in to accept this invite.
            </Text>
          </>
        )}
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.bg,
  },
  content: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: spacing.xl,
  },
  loadingText: {
    color: colors.textMuted,
    fontSize: fontSize.md,
    marginTop: spacing.md,
  },
  birdEmoji: {
    fontSize: 100,
    marginBottom: spacing.lg,
  },
  title: {
    fontSize: fontSize.xxxl,
    fontWeight: 'bold',
    color: colors.text,
    marginBottom: spacing.sm,
  },
  subtitle: {
    fontSize: fontSize.md,
    color: colors.textMuted,
    textAlign: 'center',
    marginBottom: spacing.xxl,
  },
  button: {
    backgroundColor: colors.accent,
    paddingVertical: spacing.md,
    paddingHorizontal: spacing.xxl,
    borderRadius: borderRadius.xl,
    marginBottom: spacing.md,
  },
  disabledButton: {
    opacity: 0.7,
  },
  buttonText: {
    color: colors.bg,
    fontSize: fontSize.lg,
    fontWeight: '600',
  },
  hintText: {
    fontSize: fontSize.sm,
    color: colors.textMuted,
    textAlign: 'center',
  },
  errorEmoji: {
    fontSize: 60,
    marginBottom: spacing.lg,
  },
  errorTitle: {
    fontSize: fontSize.xxl,
    fontWeight: 'bold',
    color: colors.text,
    marginBottom: spacing.sm,
  },
  errorText: {
    fontSize: fontSize.md,
    color: colors.textMuted,
    textAlign: 'center',
    marginBottom: spacing.xxl,
  },
});
