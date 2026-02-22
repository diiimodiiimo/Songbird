import { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
  Image,
} from 'react-native';
import { colors, fontSize, spacing, borderRadius, defaultBirdImage } from '../../lib/theme';
import { api } from '../../lib/api';
import { useAuthToken } from '../../lib/auth';
import ProgressDots from './ProgressDots';

interface UsernameScreenProps {
  onContinue: (username: string) => void;
  existingUsername?: string;
}

export default function UsernameScreen({ onContinue, existingUsername }: UsernameScreenProps) {
  const { getToken } = useAuthToken();
  const [username, setUsername] = useState(existingUsername || '');
  const [error, setError] = useState<string | null>(null);
  const [checking, setChecking] = useState(false);
  const [isAvailable, setIsAvailable] = useState<boolean | null>(null);
  const [saving, setSaving] = useState(false);

  // Debounced availability check
  const checkAvailability = useCallback(async (value: string) => {
    if (value.length < 3) {
      setIsAvailable(null);
      return;
    }

    setChecking(true);
    try {
      const data = await api.checkUsername(value);
      setIsAvailable(data.available);
      if (!data.available) {
        setError('Already taken');
      } else {
        setError(null);
      }
    } catch (err) {
      console.error('Error checking username:', err);
    } finally {
      setChecking(false);
    }
  }, []);

  useEffect(() => {
    const timer = setTimeout(() => {
      if (username.length >= 3) {
        checkAvailability(username);
      }
    }, 300);

    return () => clearTimeout(timer);
  }, [username, checkAvailability]);

  const validateUsername = (value: string): string | null => {
    if (value.length < 3) return 'Too short (min 3 characters)';
    if (value.length > 20) return 'Too long (max 20 characters)';
    if (!/^[a-zA-Z0-9_]+$/.test(value)) return 'Only letters, numbers, and underscores';
    return null;
  };

  const handleChange = (value: string) => {
    const cleanValue = value.toLowerCase().replace(/[^a-z0-9_]/g, '');
    setUsername(cleanValue);

    const validationError = validateUsername(cleanValue);
    if (validationError && cleanValue.length > 0) {
      setError(validationError);
      setIsAvailable(null);
    } else {
      setError(null);
    }
  };

  const handleSubmit = async () => {
    const validationError = validateUsername(username);
    if (validationError) {
      setError(validationError);
      return;
    }

    if (!isAvailable) {
      setError('Username not available');
      return;
    }

    setSaving(true);
    try {
      const token = await getToken();
      if (!token) throw new Error('Not authenticated');

      await api.updateProfile(token, { username });
      onContinue(username);
    } catch (err: any) {
      setError(err.message || 'Failed to save username');
    } finally {
      setSaving(false);
    }
  };

  const isValid = username.length >= 3 && username.length <= 20 && isAvailable && !error;

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
    >
      <View style={styles.content}>
        {/* Bird */}
        <View style={styles.birdContainer}>
          <Image source={defaultBirdImage} style={styles.birdImage} resizeMode="contain" />
        </View>

        {/* Headline */}
        <Text style={styles.title}>What should we call you?</Text>
        <Text style={styles.subtitle}>Pick a username for your profile</Text>

        {/* Username input */}
        <View style={styles.inputContainer}>
          <View
            style={[
              styles.inputWrapper,
              error
                ? styles.inputError
                : isAvailable
                ? styles.inputSuccess
                : null,
            ]}
          >
            <Text style={styles.atSymbol}>@</Text>
            <TextInput
              style={styles.input}
              value={username}
              onChangeText={handleChange}
              placeholder="yourname"
              placeholderTextColor={colors.textMuted + '4D'}
              autoCapitalize="none"
              autoCorrect={false}
              autoFocus
            />
            {/* Status indicator */}
            <View style={styles.statusIndicator}>
              {checking && <ActivityIndicator size="small" color={colors.accent} />}
              {!checking && isAvailable && !error && (
                <Text style={styles.checkmark}>✓</Text>
              )}
              {!checking && error && (
                <Text style={styles.errorMark}>✕</Text>
              )}
            </View>
          </View>

          {/* Error/status message */}
          <View style={styles.messageContainer}>
            {error && <Text style={styles.errorText}>{error}</Text>}
            {!error && isAvailable && username.length >= 3 && (
              <Text style={styles.successText}>Username available!</Text>
            )}
          </View>
        </View>
      </View>

      {/* Continue button */}
      <View style={styles.buttonContainer}>
        <TouchableOpacity
          style={[styles.continueButton, (!isValid || saving) && styles.disabledButton]}
          onPress={handleSubmit}
          disabled={!isValid || saving}
          activeOpacity={0.8}
        >
          <Text
            style={[styles.continueButtonText, (!isValid || saving) && styles.disabledButtonText]}
          >
            {saving ? 'Saving...' : 'Continue'}
          </Text>
        </TouchableOpacity>
      </View>

      {/* Progress dots */}
      <ProgressDots totalSteps={6} currentStep={1} />
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.bg,
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.xxl,
  },
  content: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    maxWidth: 400,
    alignSelf: 'center',
    width: '100%',
  },
  birdContainer: {
    marginBottom: spacing.lg,
  },
  birdImage: {
    width: 100,
    height: 100,
  },
  title: {
    fontSize: fontSize.xxxl,
    fontWeight: 'bold',
    color: colors.text,
    marginBottom: spacing.xs,
    textAlign: 'center',
  },
  subtitle: {
    fontSize: fontSize.md,
    color: colors.textMuted,
    marginBottom: spacing.xl,
    textAlign: 'center',
  },
  inputContainer: {
    width: '100%',
    marginBottom: spacing.lg,
  },
  inputWrapper: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.surface,
    borderWidth: 2,
    borderColor: colors.border,
    borderRadius: borderRadius.xl,
    paddingHorizontal: spacing.md,
  },
  inputError: {
    borderColor: '#ef4444' + '80',
  },
  inputSuccess: {
    borderColor: '#22c55e' + '80',
  },
  atSymbol: {
    color: colors.textMuted,
    fontSize: fontSize.lg,
    marginRight: spacing.xs,
  },
  input: {
    flex: 1,
    color: colors.text,
    fontSize: fontSize.lg,
    paddingVertical: spacing.md,
  },
  statusIndicator: {
    width: 24,
    justifyContent: 'center',
    alignItems: 'center',
  },
  checkmark: {
    color: '#22c55e',
    fontSize: fontSize.lg,
    fontWeight: 'bold',
  },
  errorMark: {
    color: '#ef4444',
    fontSize: fontSize.lg,
    fontWeight: 'bold',
  },
  messageContainer: {
    height: 24,
    marginTop: spacing.xs,
  },
  errorText: {
    color: '#f87171',
    fontSize: fontSize.sm,
  },
  successText: {
    color: '#4ade80',
    fontSize: fontSize.sm,
  },
  buttonContainer: {
    width: '100%',
    maxWidth: 400,
    alignSelf: 'center',
    paddingBottom: spacing.sm,
  },
  continueButton: {
    width: '100%',
    paddingVertical: spacing.md,
    paddingHorizontal: spacing.xl,
    backgroundColor: colors.accent,
    borderRadius: borderRadius.xl,
  },
  disabledButton: {
    backgroundColor: colors.surface,
  },
  continueButtonText: {
    color: colors.bg,
    fontSize: fontSize.lg,
    fontWeight: '600',
    textAlign: 'center',
  },
  disabledButtonText: {
    color: colors.textMuted,
  },
});
