import { View, StyleSheet } from 'react-native';
import { colors, spacing } from '../../lib/theme';

interface ProgressDotsProps {
  totalSteps: number;
  currentStep: number;
}

export default function ProgressDots({ totalSteps, currentStep }: ProgressDotsProps) {
  return (
    <View style={styles.container}>
      {Array.from({ length: totalSteps }, (_, i) => (
        <View
          key={i}
          style={[
            styles.dot,
            i === currentStep && styles.activeDot,
            i < currentStep && styles.completedDot,
          ]}
        />
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    gap: spacing.sm,
    paddingBottom: spacing.xl,
  },
  dot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: colors.textMuted + '33', // 20% opacity
  },
  activeDot: {
    width: 12,
    height: 12,
    borderRadius: 6,
    backgroundColor: colors.accent,
  },
  completedDot: {
    backgroundColor: colors.accent + '99', // 60% opacity
  },
});
