import { useState, useEffect } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, Animated, Image } from 'react-native';
import { colors, fontSize, spacing, borderRadius, defaultBirdImage } from '../../lib/theme';
import { api } from '../../lib/api';
import { useAuthToken } from '../../lib/auth';
import ProgressDots from './ProgressDots';

interface CompletionScreenProps {
  onComplete: () => void;
  isTutorialMode?: boolean;
}

export default function CompletionScreen({ onComplete, isTutorialMode = false }: CompletionScreenProps) {
  const { getToken } = useAuthToken();
  const [showConfetti, setShowConfetti] = useState(false);
  const [completing, setCompleting] = useState(false);
  const scaleAnim = useState(new Animated.Value(1))[0];

  useEffect(() => {
    // Trigger celebration animation after a brief delay
    const timer = setTimeout(() => {
      setShowConfetti(true);
      // Scale up the bird
      Animated.timing(scaleAnim, {
        toValue: 1.1,
        duration: 500,
        useNativeDriver: true,
      }).start();
    }, 300);
    return () => clearTimeout(timer);
  }, []);

  const handleStart = async () => {
    setCompleting(true);

    try {
      const token = await getToken();

      // Only mark onboarding as complete if not in tutorial mode
      if (!isTutorialMode && token) {
        await api.completeOnboarding(token);
      }

      // Track analytics
      if (token) {
        api
          .trackEvent(token, isTutorialMode ? 'tutorial_completed' : 'onboarding_completed')
          .catch(() => {});
      }

      onComplete();
    } catch (err) {
      console.error('Error completing onboarding:', err);
      onComplete();
    }
  };

  return (
    <View style={styles.container}>
      {/* Confetti/celebration elements */}
      {showConfetti && (
        <View style={styles.confettiContainer}>
          {[...Array(12)].map((_, i) => (
            <Text
              key={i}
              style={[
                styles.musicNote,
                {
                  left: `${10 + i * 7}%` as any,
                },
              ]}
            >
              {i % 2 === 0 ? '♪' : '♫'}
            </Text>
          ))}
        </View>
      )}

      <View style={styles.content}>
        {/* Celebrating bird */}
        <Animated.View style={[styles.birdContainer, { transform: [{ scale: scaleAnim }] }]}>
          <Image source={defaultBirdImage} style={styles.birdImage} resizeMode="contain" />
        </Animated.View>

        {/* Headline */}
        <Text style={styles.title}>
          {isTutorialMode ? "That's SongBird!" : "You're all set!"}
        </Text>
        <Text style={styles.subtitle}>
          {isTutorialMode ? 'Thanks for watching the tour.' : 'Your flock awaits.'}
        </Text>

        {/* Subtle reminder */}
        <View style={styles.reminderCard}>
          <Text style={styles.reminderText}>
            {isTutorialMode ? (
              'Now get back to logging your songs!'
            ) : (
              <>
                Remember: one song, every day.{'\n'}
                <Text style={styles.accentText}>That's all it takes to build something beautiful.</Text>
              </>
            )}
          </Text>
        </View>
      </View>

      {/* Start button */}
      <View style={styles.buttonContainer}>
        <TouchableOpacity
          style={[styles.startButton, completing && styles.disabledButton]}
          onPress={handleStart}
          disabled={completing}
          activeOpacity={0.8}
        >
          <Text style={styles.startButtonText}>
            {completing ? 'Loading...' : isTutorialMode ? 'Back to SongBird' : 'Start logging'}
          </Text>
        </TouchableOpacity>
      </View>

      {/* Progress dots */}
      <ProgressDots totalSteps={6} currentStep={5} />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.bg,
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.xxl,
    overflow: 'hidden',
  },
  confettiContainer: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    pointerEvents: 'none',
  },
  musicNote: {
    position: 'absolute',
    bottom: -20,
    color: colors.accent,
    fontSize: 20,
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
    marginBottom: spacing.xl,
  },
  birdImage: {
    width: 160,
    height: 160,
  },
  title: {
    fontSize: fontSize.display,
    fontWeight: 'bold',
    color: colors.text,
    marginBottom: spacing.sm,
    textAlign: 'center',
  },
  subtitle: {
    fontSize: fontSize.lg,
    color: colors.textMuted,
    marginBottom: spacing.lg,
    textAlign: 'center',
  },
  reminderCard: {
    backgroundColor: colors.surface + '80',
    borderRadius: borderRadius.xl,
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.md,
  },
  reminderText: {
    fontSize: fontSize.sm,
    color: colors.textMuted,
    textAlign: 'center',
  },
  accentText: {
    color: colors.accent,
  },
  buttonContainer: {
    width: '100%',
    maxWidth: 400,
    alignSelf: 'center',
    paddingBottom: spacing.sm,
  },
  startButton: {
    width: '100%',
    paddingVertical: spacing.md,
    paddingHorizontal: spacing.xl,
    backgroundColor: colors.accent,
    borderRadius: borderRadius.xl,
  },
  disabledButton: {
    opacity: 0.7,
  },
  startButtonText: {
    color: colors.bg,
    fontSize: fontSize.lg,
    fontWeight: '600',
    textAlign: 'center',
  },
});
