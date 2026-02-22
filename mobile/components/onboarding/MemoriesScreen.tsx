import { View, Text, TouchableOpacity, StyleSheet, Image } from 'react-native';
import { colors, fontSize, spacing, borderRadius, defaultBirdImage } from '../../lib/theme';
import ProgressDots from './ProgressDots';

interface MemoriesScreenProps {
  onContinue: () => void;
  hasFirstEntry: boolean;
}

// Sample/mock data for the preview
const mockMemories = [
  { year: '2023', song: 'Anti-Hero', artist: 'Taylor Swift' },
  { year: '2022', song: 'As It Was', artist: 'Harry Styles' },
  { year: '2021', song: 'drivers license', artist: 'Olivia Rodrigo' },
];

export default function MemoriesScreen({ onContinue, hasFirstEntry }: MemoriesScreenProps) {
  const today = new Date();
  const formattedDate = today.toLocaleDateString('en-US', { month: 'long', day: 'numeric' });

  return (
    <View style={styles.container}>
      <View style={styles.content}>
        {/* Headline */}
        <Text style={styles.title}>Over time, you'll build a musical autobiography</Text>
        <Text style={styles.subtitle}>
          Imagine seeing what song defined this day last year, or three years ago.
        </Text>

        {/* Mock On This Day preview */}
        <View style={styles.previewCard}>
          <View style={styles.previewHeader}>
            <Text style={styles.previewTitle}>On This Day</Text>
            <Text style={styles.previewDate}>{formattedDate}</Text>
          </View>

          <View style={styles.memoriesList}>
            {mockMemories.map((memory, i) => (
              <View key={i} style={styles.memoryItem}>
                <View style={styles.memoryIcon}>
                  <Text style={styles.memoryIconText}>🎵</Text>
                </View>
                <View style={styles.memoryInfo}>
                  <Text style={styles.memoryYear}>{memory.year}</Text>
                  <Text style={styles.memorySong}>{memory.song}</Text>
                  <Text style={styles.memoryArtist}>{memory.artist}</Text>
                </View>
              </View>
            ))}
          </View>

          {/* Preview label */}
          <View style={styles.previewLabel}>
            <Text style={styles.previewLabelText}>
              Preview — your memories will appear here
            </Text>
          </View>
        </View>

        {/* Bird looking at memories */}
        <View style={styles.birdContainer}>
          <Image source={defaultBirdImage} style={styles.birdImage} resizeMode="contain" />
        </View>

        {/* Personalized message */}
        <Text style={styles.message}>
          {hasFirstEntry
            ? "Your first memory is already saved. Keep going and you'll have a year of moments to look back on."
            : 'Log your first song and start building your musical timeline.'}
        </Text>
      </View>

      {/* Continue button */}
      <View style={styles.buttonContainer}>
        <TouchableOpacity style={styles.continueButton} onPress={onContinue} activeOpacity={0.8}>
          <Text style={styles.continueButtonText}>Continue</Text>
        </TouchableOpacity>
      </View>

      {/* Progress dots */}
      <ProgressDots totalSteps={6} currentStep={3} />
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
  title: {
    fontSize: fontSize.xxxl,
    fontWeight: 'bold',
    color: colors.text,
    marginBottom: spacing.sm,
    textAlign: 'center',
  },
  subtitle: {
    fontSize: fontSize.md,
    color: colors.textMuted,
    marginBottom: spacing.xl,
    textAlign: 'center',
  },
  previewCard: {
    width: '100%',
    backgroundColor: colors.surface,
    borderRadius: borderRadius.xl,
    padding: spacing.lg,
    marginBottom: spacing.lg,
  },
  previewHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: spacing.md,
  },
  previewTitle: {
    fontSize: fontSize.lg,
    fontWeight: '600',
    color: colors.text,
  },
  previewDate: {
    fontSize: fontSize.sm,
    color: colors.accent,
  },
  memoriesList: {
    gap: spacing.sm,
  },
  memoryItem: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.bg + '80',
    borderRadius: borderRadius.xl,
    padding: spacing.sm,
    gap: spacing.sm,
    opacity: 0.6,
  },
  memoryIcon: {
    width: 48,
    height: 48,
    backgroundColor: colors.accent + '33',
    borderRadius: borderRadius.lg,
    justifyContent: 'center',
    alignItems: 'center',
  },
  memoryIconText: {
    fontSize: 18,
  },
  memoryInfo: {
    flex: 1,
  },
  memoryYear: {
    fontSize: fontSize.xs,
    color: colors.accent,
    marginBottom: 2,
  },
  memorySong: {
    fontSize: fontSize.sm,
    fontWeight: '500',
    color: colors.text,
  },
  memoryArtist: {
    fontSize: fontSize.xs,
    color: colors.textMuted,
  },
  previewLabel: {
    marginTop: spacing.md,
    alignItems: 'center',
  },
  previewLabelText: {
    backgroundColor: colors.accent + '1A',
    color: colors.accent,
    fontSize: fontSize.xs,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.xs,
    borderRadius: borderRadius.full,
    overflow: 'hidden',
  },
  birdContainer: {
    marginBottom: spacing.sm,
  },
  birdImage: {
    width: 80,
    height: 80,
  },
  message: {
    fontSize: fontSize.sm,
    color: colors.textMuted,
    textAlign: 'center',
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
  continueButtonText: {
    color: colors.bg,
    fontSize: fontSize.lg,
    fontWeight: '600',
    textAlign: 'center',
  },
});
