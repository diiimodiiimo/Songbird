import { View, Text, TouchableOpacity, StyleSheet, Animated, Image } from 'react-native';
import { useEffect, useRef } from 'react';
import { colors, fontSize, spacing, borderRadius, defaultBirdImage } from '../../lib/theme';

interface WelcomeScreenProps {
  onContinue: () => void;
}

export default function WelcomeScreen({ onContinue }: WelcomeScreenProps) {
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
        <Animated.View style={[styles.birdContainer, { transform: [{ scale: pulseAnim }] }]}>
          <Image source={defaultBirdImage} style={styles.birdImage} resizeMode="contain" />
        </Animated.View>

        <Text style={styles.title}>Welcome to SongBird</Text>
        <Text style={styles.tagline}>Giving music a new meaning</Text>
        <Text style={styles.subtext}>A music journaling app for the moments that matter</Text>
      </View>

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
  birdImage: {
    width: 200,
    height: 200,
  },
  title: {
    fontSize: fontSize.display,
    fontWeight: 'bold',
    color: colors.text,
    marginBottom: spacing.sm,
    textAlign: 'center',
    fontFamily: 'serif',
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
    backgroundColor: colors.primary,
    borderRadius: borderRadius.xl,
  },
  continueButtonText: {
    color: colors.text,
    fontSize: fontSize.lg,
    fontWeight: '600',
    textAlign: 'center',
  },
});
