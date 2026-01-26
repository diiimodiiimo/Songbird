import { View, Text, TouchableOpacity, StyleSheet, Animated } from 'react-native';
import { useEffect, useRef } from 'react';
import { colors, fontSize, spacing, borderRadius } from '../../lib/theme';

interface WelcomeScreenProps {
  onContinue: () => void;
}

export default function WelcomeScreen({ onContinue }: WelcomeScreenProps) {
  // Pulse animation for bird
  const pulseAnim = useRef(new Animated.Value(1)).current;

  useEffect(() => {
    const animation = Animated.loop(
      Animated.sequence([
        Animated.timing(pulseAnim, {
          toValue: 1.05,
          duration: 1500,
          useNativeDriver: true,
        }),
        Animated.timing(pulseAnim, {
          toValue: 1,
          duration: 1500,
          useNativeDriver: true,
        }),
      ])
    );
    animation.start();
    return () => animation.stop();
  }, []);

  return (
    <View style={styles.container}>
      <View style={styles.content}>
        {/* Bird with gentle idle animation */}
        <Animated.View style={[styles.birdContainer, { transform: [{ scale: pulseAnim }] }]}>
          <Text style={styles.birdEmoji}>🐦</Text>
        </Animated.View>

        {/* Headline */}
        <Text style={styles.title}>Welcome to SongBird</Text>

        {/* Tagline */}
        <Text style={styles.tagline}>Giving music a new meaning</Text>

        {/* Subtext */}
        <Text style={styles.subtext}>A music journaling app for the moments that matter</Text>
      </View>

      {/* Continue button */}
      <View style={styles.buttonContainer}>
        <TouchableOpacity style={styles.continueButton} onPress={onContinue} activeOpacity={0.8}>
          <Text style={styles.continueButtonText}>Continue</Text>
        </TouchableOpacity>
      </View>
    </View>
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
    marginBottom: spacing.xl,
  },
  birdEmoji: {
    fontSize: 120,
  },
  title: {
    fontSize: fontSize.display,
    fontWeight: 'bold',
    color: colors.text,
    marginBottom: spacing.sm,
    textAlign: 'center',
  },
  tagline: {
    fontSize: fontSize.xl,
    color: colors.accent,
    fontWeight: '500',
    marginBottom: spacing.xs,
    textAlign: 'center',
  },
  subtext: {
    fontSize: fontSize.lg,
    color: colors.textMuted,
    marginBottom: spacing.xxl,
    textAlign: 'center',
  },
  buttonContainer: {
    width: '100%',
    maxWidth: 350,
    alignSelf: 'center',
    paddingBottom: spacing.lg,
  },
  continueButton: {
    width: '100%',
    paddingVertical: spacing.md,
    paddingHorizontal: spacing.xl,
    backgroundColor: colors.accent,
    borderRadius: borderRadius.xl,
  },
  continueButtonText: {
    color: colors.bg,
    fontSize: fontSize.lg,
    fontWeight: '600',
    textAlign: 'center',
  },
});
